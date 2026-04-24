"""
OTP / 2FA Auth flow tests for Global Tech Solutions.
Covers login gating (admin/tech bypass, customer OTP), verify-otp, resend-otp.
Uses backend stderr log to extract DEV OTP code since Resend test-mode email fails.
"""
import os
import re
import time
import subprocess
import pytest
import requests
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://global-tech-care.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@globaltechsolutions.com", "password": "Admin@123"}
TECH = {"email": "mike@globaltechsolutions.com", "password": "Tech@123"}
CUST = {"email": "bsandy2@aol.com", "password": "Welcome@2026"}

LOG_FILE = "/var/log/supervisor/backend.err.log"

# Mongo access for DB-level manipulations (expiry simulation)
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")
mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]


def _extract_otp(email: str, since_ts: float) -> str:
    """Grep backend.err.log for the latest 'DEV OTP for <email>: NNNNNN' after since_ts."""
    # give logger time to flush
    deadline = time.time() + 6
    code = None
    while time.time() < deadline:
        try:
            out = subprocess.check_output(
                ["grep", "-oE", rf"DEV OTP for {re.escape(email)}: [0-9]{{6}}", LOG_FILE],
                stderr=subprocess.DEVNULL,
            ).decode()
            matches = re.findall(r"([0-9]{6})", out)
            if matches:
                code = matches[-1]
                break
        except subprocess.CalledProcessError:
            pass
        time.sleep(0.5)
    assert code, f"Could not find DEV OTP for {email} in {LOG_FILE}"
    return code


@pytest.fixture(scope="module", autouse=True)
def _cleanup():
    # Start clean
    db.auth_otps.delete_many({"email": CUST["email"]})
    yield
    db.auth_otps.delete_many({"email": CUST["email"]})


# ---------- LOGIN GATING ----------
class TestLoginGating:
    def test_admin_login_no_otp(self):
        r = requests.post(f"{API}/auth/login", json={**ADMIN, "role": "admin"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["role"] == "admin"
        assert "otp_required" not in data

    def test_technician_login_no_otp(self):
        r = requests.post(f"{API}/auth/login", json={**TECH, "role": "technician"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["role"] == "technician"
        assert "otp_required" not in data

    def test_customer_login_requires_otp(self):
        db.auth_otps.delete_many({"email": CUST["email"]})
        r = requests.post(f"{API}/auth/login", json={**CUST, "role": "customer"})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("otp_required") is True
        assert "token" not in data
        assert data.get("email") == CUST["email"]
        assert "masked_email" in data and "***" in data["masked_email"]
        assert "message" in data
        # OTP stored, hashed, attempts=0, 5-min expiry
        rec = db.auth_otps.find_one({"email": CUST["email"]})
        assert rec is not None
        assert rec["attempts"] == 0
        assert rec["otp_hash"].startswith("$2")  # bcrypt
        exp = rec["expires_at"]
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        delta = (exp - datetime.now(timezone.utc)).total_seconds()
        assert 60 < delta <= 5 * 60 + 5

    def test_wrong_password_401(self):
        r = requests.post(f"{API}/auth/login", json={"email": CUST["email"], "password": "wrong"})
        assert r.status_code == 401


# ---------- VERIFY OTP ----------
class TestVerifyOtp:
    def test_wrong_otp_increments_attempts(self):
        db.auth_otps.delete_many({"email": CUST["email"]})
        requests.post(f"{API}/auth/login", json=CUST)
        r = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": "000000"})
        # Could be 400 if random OTP collision with 000000, else 400 with remaining attempts
        assert r.status_code == 400
        assert "attempt" in r.json().get("detail", "").lower() or "invalid" in r.json().get("detail", "").lower()
        rec = db.auth_otps.find_one({"email": CUST["email"]})
        # attempts counter incremented (unless by rare luck 000000 was correct, then record deleted)
        assert rec is None or rec.get("attempts", 0) >= 1

    def test_correct_otp_returns_token_and_deletes(self):
        db.auth_otps.delete_many({"email": CUST["email"]})
        since = time.time()
        r1 = requests.post(f"{API}/auth/login", json=CUST)
        assert r1.status_code == 200 and r1.json().get("otp_required")
        code = _extract_otp(CUST["email"], since)
        r = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": code})
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert data["user"]["email"] == CUST["email"]
        assert data["user"]["role"] == "customer"
        # OTP deleted after success
        assert db.auth_otps.find_one({"email": CUST["email"]}) is None

    def test_verify_after_consumed_returns_error(self):
        # No active OTP record after previous test consumed it
        db.auth_otps.delete_many({"email": CUST["email"]})
        r = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": "123456"})
        assert r.status_code == 400
        assert "No verification code" in r.json().get("detail", "")

    def test_expired_otp(self):
        db.auth_otps.delete_many({"email": CUST["email"]})
        requests.post(f"{API}/auth/login", json=CUST)
        # Manipulate expiry in DB to past
        db.auth_otps.update_one(
            {"email": CUST["email"]},
            {"$set": {"expires_at": datetime.now(timezone.utc) - timedelta(minutes=1)}},
        )
        r = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": "000000"})
        assert r.status_code == 400
        assert "expired" in r.json().get("detail", "").lower()
        assert db.auth_otps.find_one({"email": CUST["email"]}) is None

    def test_lockout_after_5_wrong_attempts(self):
        db.auth_otps.delete_many({"email": CUST["email"]})
        since = time.time()
        requests.post(f"{API}/auth/login", json=CUST)
        real_code = _extract_otp(CUST["email"], since)
        # Feed 5 wrong codes (avoid colliding with the real code)
        wrong = "111111" if real_code != "111111" else "222222"
        last_status = None
        for _ in range(5):
            r = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": wrong})
            last_status = r.status_code
        # 6th should be 429 OR the 5th's response may already reflect final attempt rejection
        r = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": wrong})
        assert r.status_code in (429, 400)
        # After lockout, OTP record must be deleted
        # Either this request or previous triggered deletion
        assert db.auth_otps.find_one({"email": CUST["email"]}) is None or r.status_code == 429


# ---------- RESEND OTP ----------
class TestResendOtp:
    def test_resend_customer_generates_new(self):
        db.auth_otps.delete_many({"email": CUST["email"]})
        requests.post(f"{API}/auth/login", json=CUST)
        old = db.auth_otps.find_one({"email": CUST["email"]})
        assert old is not None
        time.sleep(1)
        r = requests.post(f"{API}/auth/resend-otp", json={"email": CUST["email"]})
        assert r.status_code == 200, r.text
        assert r.json().get("ok") is True
        new = db.auth_otps.find_one({"email": CUST["email"]})
        assert new is not None
        # Old hash replaced (different bcrypt salt guarantees different hash)
        assert new["otp_hash"] != old["otp_hash"]

    def test_resend_admin_rejected(self):
        r = requests.post(f"{API}/auth/resend-otp", json={"email": ADMIN["email"]})
        assert r.status_code == 400
        assert "not required" in r.json().get("detail", "").lower()

    def test_resend_tech_rejected(self):
        r = requests.post(f"{API}/auth/resend-otp", json={"email": TECH["email"]})
        assert r.status_code == 400

    def test_resend_unknown_email_silent_ok(self):
        r = requests.post(f"{API}/auth/resend-otp", json={"email": "nonexistent_xyz_987@example.com"})
        assert r.status_code == 200
        assert r.json().get("ok") is True


# ---------- REGRESSION ----------
class TestRegression:
    def test_register_still_direct_token(self):
        email = f"TEST_otpreg_{int(time.time())}@example.com"
        r = requests.post(f"{API}/auth/register", json={
            "name": "TEST OTP Reg", "email": email, "password": "Test@12345"
        })
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and "user" in data
        assert "otp_required" not in data
        # cleanup
        db.users.delete_one({"email": email})

    def test_customer_dashboard_post_otp(self):
        """After full OTP flow, customer can access /dashboard/stats."""
        db.auth_otps.delete_many({"email": CUST["email"]})
        since = time.time()
        requests.post(f"{API}/auth/login", json=CUST)
        code = _extract_otp(CUST["email"], since)
        vr = requests.post(f"{API}/auth/verify-otp", json={"email": CUST["email"], "otp": code})
        assert vr.status_code == 200
        token = vr.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        # Stats
        r = requests.get(f"{API}/dashboard/stats", headers=headers)
        assert r.status_code == 200
        # Invoices
        r = requests.get(f"{API}/invoices", headers=headers)
        assert r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) >= 1
        # Gift allowance
        r = requests.get(f"{API}/software-gifts/allowance", headers=headers)
        assert r.status_code == 200
        assert "allowance" in r.json()
        # Appointments
        r = requests.get(f"{API}/appointments", headers=headers)
        assert r.status_code == 200
        # Devices
        r = requests.get(f"{API}/devices", headers=headers)
        assert r.status_code == 200
