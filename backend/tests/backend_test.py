"""
Global Tech Solutions - Comprehensive Backend API Tests
Tests: auth, plans/services/reviews/faqs, Sanford data, bookings, tickets,
messages, analytics, admin CRUD, role guards, and _id exclusion.
"""
import os
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Use public URL
BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://global-tech-care.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@globaltechsolutions.com", "password": "Admin@123"}
TECH_RAVI = {"email": "ravi@globaltechsolutions.com", "password": "Tech@123"}
CUST_SANDY = {"email": "bsandy2@aol.com", "password": "Welcome@2026"}
CUST_LINDA = {"email": "linda.m@example.com", "password": "Customer@123"}


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(s, creds, role=None):
    payload = dict(creds)
    if role:
        payload["role"] = role
    r = s.post(f"{API}/auth/login", json=payload, timeout=20)
    assert r.status_code == 200, f"login failed for {creds['email']}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="session")
def admin_token(session):
    return _login(session, ADMIN)["token"]


@pytest.fixture(scope="session")
def tech_token(session):
    return _login(session, TECH_RAVI)["token"]


@pytest.fixture(scope="session")
def tech_user(session):
    return _login(session, TECH_RAVI)["user"]


@pytest.fixture(scope="session")
def sandy_login(session):
    return _login(session, CUST_SANDY)


@pytest.fixture(scope="session")
def sandy_token(sandy_login):
    return sandy_login["token"]


@pytest.fixture(scope="session")
def sandy_user(sandy_login):
    return sandy_login["user"]


def auth_h(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


def assert_no_mongo_id(obj):
    if isinstance(obj, dict):
        assert "_id" not in obj, f"_id leaked: keys={list(obj.keys())}"
        for v in obj.values():
            assert_no_mongo_id(v)
    elif isinstance(obj, list):
        for v in obj:
            assert_no_mongo_id(v)


# ---------- Public catalog ----------
class TestPublicCatalog:
    def test_services_10(self, session):
        r = session.get(f"{API}/services")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 10, f"expected 10 services got {len(data)}"
        assert_no_mongo_id(data)
        assert all("slug" in s and "title" in s for s in data)

    def test_plans_4(self, session):
        r = session.get(f"{API}/plans")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 4
        names = sorted([p["name"] for p in data])
        assert names == ["Basic", "Business", "Lifetime VIP", "Pro"]
        assert_no_mongo_id(data)

    def test_reviews_5(self, session):
        r = session.get(f"{API}/reviews")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 5
        assert_no_mongo_id(data)

    def test_faqs(self, session):
        r = session.get(f"{API}/faqs")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 5
        assert all("q" in f and "a" in f for f in data)


# ---------- Auth ----------
class TestAuth:
    def test_admin_login(self, session):
        d = _login(session, ADMIN)
        assert d["user"]["role"] == "admin"
        assert "_id" not in d["user"]

    def test_tech_login(self, session):
        d = _login(session, TECH_RAVI)
        assert d["user"]["role"] == "technician"

    def test_sandy_login(self, session):
        d = _login(session, CUST_SANDY)
        assert d["user"]["role"] == "customer"
        assert d["user"]["email"] == "bsandy2@aol.com"
        assert d["user"]["active_plan"] == "Lifetime VIP Plan"
        assert d["user"].get("assigned_technician_id")

    def test_login_with_matching_role(self, session):
        d = _login(session, ADMIN, role="admin")
        assert d["user"]["role"] == "admin"

    def test_login_with_mismatched_role_403(self, session):
        r = session.post(f"{API}/auth/login", json={**ADMIN, "role": "customer"})
        assert r.status_code == 403

    def test_login_wrong_password_401(self, session):
        r = session.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "wrong"})
        assert r.status_code == 401

    def test_auth_me(self, session, sandy_token):
        r = session.get(f"{API}/auth/me", headers=auth_h(sandy_token))
        assert r.status_code == 200
        assert r.json()["email"] == "bsandy2@aol.com"
        assert_no_mongo_id(r.json())


# ---------- Sanford Data ----------
class TestSandyData:
    def test_invoices_7_and_total(self, session, sandy_token):
        r = session.get(f"{API}/invoices", headers=auth_h(sandy_token))
        assert r.status_code == 200
        invs = r.json()
        assert len(invs) == 7, f"expected 7 invoices, got {len(invs)}"
        total = round(sum(i["amount"] for i in invs), 2)
        assert total == 9588.24, f"expected $9588.24, got ${total}"
        assert all(i["status"] == "paid" for i in invs)
        assert_no_mongo_id(invs)

    def test_service_history_6(self, session, sandy_token):
        r = session.get(f"{API}/service-history", headers=auth_h(sandy_token))
        assert r.status_code == 200
        hist = r.json()
        assert len(hist) == 6, f"expected 6 service history, got {len(hist)}"
        assert_no_mongo_id(hist)

    def test_upcoming_appointment(self, session, sandy_token):
        r = session.get(f"{API}/appointments", headers=auth_h(sandy_token))
        assert r.status_code == 200
        appts = r.json()
        assert len(appts) >= 1
        assert any(a["status"] == "scheduled" for a in appts)
        assert_no_mongo_id(appts)

    def test_own_profile_with_technician(self, session, sandy_token, sandy_user):
        r = session.get(f"{API}/customers/{sandy_user['id']}", headers=auth_h(sandy_token))
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "bsandy2@aol.com"
        assert "technician" in data and data["technician"] is not None
        assert "Ravi" in data["technician"]["name"]
        assert_no_mongo_id(data)

    def test_dashboard_stats_customer(self, session, sandy_token):
        r = session.get(f"{API}/dashboard/stats", headers=auth_h(sandy_token))
        assert r.status_code == 200
        d = r.json()
        assert d["invoices"] == 7
        assert d["total_spent"] == 9588.24


# ---------- Public Forms ----------
class TestPublicForms:
    def test_contact_submission(self, session):
        r = session.post(f"{API}/contact", json={
            "name": "TEST User", "email": "test_contact@example.com",
            "subject": "TEST Subject", "message": "TEST message body"
        })
        assert r.status_code == 200
        assert r.json().get("ok") is True and "id" in r.json()

    def test_public_booking(self, session):
        r = session.post(f"{API}/bookings", json={
            "service_type": "Remote Support", "description": "TEST public booking",
            "contact_name": "TEST", "contact_email": "test_pb@example.com",
        })
        assert r.status_code == 200
        b = r.json()
        assert b["status"] == "pending"
        assert b["customer_id"] is None
        assert_no_mongo_id(b)

    def test_authed_booking_creates_appt(self, session, sandy_token, sandy_user):
        r = session.post(f"{API}/bookings/me", headers=auth_h(sandy_token), json={
            "service_type": "Remote Support", "description": "TEST auth booking",
            "preferred_date": "2026-02-01", "preferred_time": "10:00"
        })
        assert r.status_code == 200
        b = r.json()
        assert b["customer_id"] == sandy_user["id"]
        # Confirm appointment created
        r2 = session.get(f"{API}/appointments", headers=auth_h(sandy_token))
        appts = r2.json()
        assert any(a.get("description") == "TEST auth booking" for a in appts)


# ---------- Tickets & Messages ----------
class TestTicketsMessages:
    def test_ticket_create_and_tech_update(self, session, sandy_token, tech_token):
        r = session.post(f"{API}/tickets", headers=auth_h(sandy_token), json={
            "subject": "TEST ticket", "description": "TEST body", "priority": "low"
        })
        assert r.status_code == 200
        t = r.json()
        assert t["status"] == "open"
        tid = t["id"]
        # Tech updates
        r2 = session.patch(f"{API}/tickets/{tid}", headers=auth_h(tech_token),
                           json={"status": "in_progress"})
        assert r2.status_code == 200
        assert r2.json()["status"] == "in_progress"

    def test_message_customer_to_tech(self, session, sandy_token, tech_token, sandy_user, tech_user):
        r = session.post(f"{API}/messages", headers=auth_h(sandy_token), json={
            "recipient_id": tech_user["id"], "content": "TEST hello from sandy"
        })
        assert r.status_code == 200
        # Tech should see it
        r2 = session.get(f"{API}/messages", headers=auth_h(tech_token),
                         params={"with_user": sandy_user["id"]})
        assert r2.status_code == 200
        msgs = r2.json()
        assert any(m["content"] == "TEST hello from sandy" for m in msgs)
        assert_no_mongo_id(msgs)


# ---------- Admin ----------
class TestAdmin:
    def test_analytics_overview(self, session, admin_token):
        r = session.get(f"{API}/analytics/overview", headers=auth_h(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["customers", "technicians", "invoices", "revenue",
                  "open_tickets", "upcoming_appointments", "bookings", "revenue_by_month"]:
            assert k in d
        assert d["technicians"] >= 4
        assert d["customers"] >= 4
        assert d["revenue"] >= 9588.24

    def test_admin_list_customers(self, session, admin_token):
        r = session.get(f"{API}/customers", headers=auth_h(admin_token))
        assert r.status_code == 200
        cs = r.json()
        assert any(c["email"] == "bsandy2@aol.com" for c in cs)
        assert_no_mongo_id(cs)

    def test_admin_list_technicians(self, session, admin_token):
        r = session.get(f"{API}/technicians", headers=auth_h(admin_token))
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_admin_list_bookings(self, session, admin_token):
        r = session.get(f"{API}/bookings", headers=auth_h(admin_token))
        assert r.status_code == 200

    def test_admin_list_contact(self, session, admin_token):
        r = session.get(f"{API}/contact", headers=auth_h(admin_token))
        assert r.status_code == 200

    def test_admin_create_invoice(self, session, admin_token, sandy_user):
        r = session.post(f"{API}/invoices", headers=auth_h(admin_token), json={
            "customer_id": sandy_user["id"],
            "amount": 10.50,
            "description": "TEST admin invoice",
            "status": "pending",
        })
        assert r.status_code == 200
        inv = r.json()
        assert inv["amount"] == 10.50
        assert inv["invoice_number"].startswith("GTS-")
        # GET to verify persistence
        r2 = session.get(f"{API}/invoices/{inv['id']}", headers=auth_h(admin_token))
        assert r2.status_code == 200
        assert r2.json()["description"] == "TEST admin invoice"

    def test_admin_create_plan(self, session, admin_token):
        r = session.post(f"{API}/plans", headers=auth_h(admin_token), json={
            "name": "TEST Plan", "price": 1.0, "duration": "per month",
            "features": ["f1"], "description": "TEST", "popular": False
        })
        assert r.status_code == 200
        # cleanup
        pid = r.json()["id"]
        session.delete(f"{API}/plans/{pid}", headers=auth_h(admin_token))

    def test_admin_assign_technician(self, session, admin_token, tech_user):
        # find linda
        r = session.get(f"{API}/customers", headers=auth_h(admin_token))
        linda = next(c for c in r.json() if c["email"] == "linda.m@example.com")
        original_tech = linda.get("assigned_technician_id")
        r2 = session.post(f"{API}/technicians/assign", headers=auth_h(admin_token), json={
            "customer_id": linda["id"], "technician_id": tech_user["id"]
        })
        assert r2.status_code == 200
        # verify
        r3 = session.get(f"{API}/customers/{linda['id']}", headers=auth_h(admin_token))
        assert r3.json()["assigned_technician_id"] == tech_user["id"]
        # restore
        if original_tech:
            session.post(f"{API}/technicians/assign", headers=auth_h(admin_token), json={
                "customer_id": linda["id"], "technician_id": original_tech
            })


# ---------- Technician appointment -> service history ----------
class TestTechnicianFlow:
    def test_complete_appointment_creates_service_history(self, session, tech_token, tech_user, admin_token):
        # find appt assigned to tech (sandy upcoming)
        r = session.get(f"{API}/appointments", headers=auth_h(tech_token))
        assert r.status_code == 200
        appts = r.json()
        pick = next((a for a in appts if a["status"] == "scheduled"), None)
        if not pick:
            pytest.skip("No scheduled appointment for technician")
        before = session.get(f"{API}/service-history", headers=auth_h(tech_token)).json()
        r2 = session.patch(f"{API}/appointments/{pick['id']}", headers=auth_h(tech_token), json={
            "status": "completed", "notes": "TEST done", "report": "TEST report"
        })
        assert r2.status_code == 200
        assert r2.json()["status"] == "completed"
        after = session.get(f"{API}/service-history", headers=auth_h(tech_token)).json()
        assert len(after) == len(before) + 1


# ---------- Role Guards ----------
class TestRoleGuards:
    def test_customer_cannot_list_customers(self, session, sandy_token):
        r = session.get(f"{API}/customers", headers=auth_h(sandy_token))
        assert r.status_code == 403

    def test_tech_cannot_list_customers(self, session, tech_token):
        r = session.get(f"{API}/customers", headers=auth_h(tech_token))
        assert r.status_code == 403

    def test_customer_cannot_view_other_customer(self, session, sandy_token, admin_token):
        # get linda id via admin
        r = session.get(f"{API}/customers", headers=auth_h(admin_token))
        linda = next(c for c in r.json() if c["email"] == "linda.m@example.com")
        r2 = session.get(f"{API}/customers/{linda['id']}", headers=auth_h(sandy_token))
        assert r2.status_code == 403

    def test_customer_cannot_create_plan(self, session, sandy_token):
        r = session.post(f"{API}/plans", headers=auth_h(sandy_token), json={
            "name": "X", "price": 1, "duration": "m", "features": []
        })
        assert r.status_code == 403

    def test_customer_cannot_access_analytics(self, session, sandy_token):
        r = session.get(f"{API}/analytics/overview", headers=auth_h(sandy_token))
        assert r.status_code == 403

    def test_unauthenticated_blocked(self, session):
        r = session.get(f"{API}/invoices")
        assert r.status_code == 401

    def test_customer_invoice_scoped(self, session, sandy_token):
        # linda cant be seen by sandy through /invoices listing (only her own)
        r = session.get(f"{API}/invoices", headers=auth_h(sandy_token))
        assert r.status_code == 200
        for i in r.json():
            assert i["customer_id"] == _cached_sandy_id_cache["id"]


_cached_sandy_id_cache = {}


@pytest.fixture(scope="session", autouse=True)
def _cache_sandy(sandy_user):
    _cached_sandy_id_cache["id"] = sandy_user["id"]
    yield
