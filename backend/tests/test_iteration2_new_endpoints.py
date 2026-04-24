"""
Iteration 2 — tests for NEW endpoints:
  - /api/software-catalog
  - /api/software-requests
  - /api/devices
Focus: edge cases, filters, enrichment, _id exclusion, 404, role guards.
"""
import os
import uuid
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")
load_dotenv(Path(__file__).parent.parent.parent / "frontend" / ".env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@globaltechsolutions.com", "password": "Admin@123"}
TECH_RAVI = {"email": "ravi@globaltechsolutions.com", "password": "Tech@123"}
TECH_SUMIT = {"email": "sumit@globaltechsolutions.com", "password": "Tech@123"}
CUST_SANDY = {"email": "bsandy2@aol.com", "password": "Welcome@2026"}
CUST_LINDA = {"email": "linda.m@example.com", "password": "Customer@123"}


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _login(s, creds):
    r = s.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, f"login failed {creds['email']}: {r.text}"
    return r.json()


def auth_h(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


def no_mongo_id(obj):
    if isinstance(obj, dict):
        assert "_id" not in obj, f"_id leaked: {list(obj.keys())}"
        for v in obj.values():
            no_mongo_id(v)
    elif isinstance(obj, list):
        for v in obj:
            no_mongo_id(v)


# ---------- fixtures ----------
@pytest.fixture(scope="session")
def admin_token(session):
    return _login(session, ADMIN)["token"]


@pytest.fixture(scope="session")
def ravi_login(session):
    return _login(session, TECH_RAVI)


@pytest.fixture(scope="session")
def ravi_token(ravi_login):
    return ravi_login["token"]


@pytest.fixture(scope="session")
def ravi_user(ravi_login):
    return ravi_login["user"]


@pytest.fixture(scope="session")
def sumit_login(session):
    return _login(session, TECH_SUMIT)


@pytest.fixture(scope="session")
def sumit_token(sumit_login):
    return sumit_login["token"]


@pytest.fixture(scope="session")
def sandy_login(session):
    return _login(session, CUST_SANDY)


@pytest.fixture(scope="session")
def sandy_token(sandy_login):
    return sandy_login["token"]


@pytest.fixture(scope="session")
def sandy_user(sandy_login):
    return sandy_login["user"]


@pytest.fixture(scope="session")
def linda_login(session):
    return _login(session, CUST_LINDA)


@pytest.fixture(scope="session")
def linda_token(linda_login):
    return linda_login["token"]


@pytest.fixture(scope="session")
def linda_user(linda_login):
    return linda_login["user"]


# =====================================================================
# SOFTWARE CATALOG (public)
# =====================================================================
class TestSoftwareCatalog:
    def test_catalog_returns_39_items(self, session):
        r = session.get(f"{API}/software-catalog")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) == 39, f"expected 39, got {len(items)}"
        no_mongo_id(items)
        # Each item must have id, name, category, provider
        for it in items:
            assert "id" in it and "name" in it and "category" in it

    def test_catalog_has_expected_categories(self, session):
        r = session.get(f"{API}/software-catalog")
        cats = {it["category"] for it in r.json()}
        # Expected (from problem statement)
        expected_sample = {"AI Assistants", "Accounting", "Productivity",
                           "Website Development", "Security"}
        crm_ok = any("CRM" in c for c in cats)
        backup_ok = any("Backup" in c for c in cats)
        missing = expected_sample - cats
        assert not missing, f"missing categories: {missing}; have {cats}"
        assert crm_ok, f"no CRM-like category in {cats}"
        assert backup_ok, f"no Backup-like category in {cats}"

    def test_catalog_filter_ai_assistants(self, session):
        r = session.get(f"{API}/software-catalog", params={"category": "AI Assistants"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(it["category"] == "AI Assistants" for it in data)
        names = [it["name"] for it in data]
        # Expect at least some AI brands
        assert any("ChatGPT" in n or "Claude" in n or "Gemini" in n or "Perplexity" in n for n in names)

    def test_catalog_filter_accounting(self, session):
        r = session.get(f"{API}/software-catalog", params={"category": "Accounting"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(it["category"] == "Accounting" for it in data)
        assert any("QuickBooks" in it["name"] or "TurboTax" in it["name"] for it in data)

    def test_catalog_filter_unknown_returns_empty(self, session):
        r = session.get(f"{API}/software-catalog", params={"category": "NoSuchCategory"})
        assert r.status_code == 200
        assert r.json() == []

    def test_catalog_public_no_auth_needed(self, session):
        # No auth header => should still work (public)
        r = session.get(f"{API}/software-catalog")
        assert r.status_code == 200


# =====================================================================
# SOFTWARE REQUESTS
# =====================================================================
class TestSoftwareRequests:
    def test_unauth_create_401(self, session):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.post(f"{API}/software-requests", json={"software_id": "abc"})
        assert r.status_code == 401

    def test_technician_create_403(self, session, ravi_token):
        # get a real software id first
        cat = session.get(f"{API}/software-catalog").json()
        sw_id = cat[0]["id"]
        r = session.post(f"{API}/software-requests",
                         headers=auth_h(ravi_token),
                         json={"software_id": sw_id})
        assert r.status_code == 403

    def test_admin_create_403(self, session, admin_token):
        cat = session.get(f"{API}/software-catalog").json()
        sw_id = cat[0]["id"]
        r = session.post(f"{API}/software-requests",
                         headers=auth_h(admin_token),
                         json={"software_id": sw_id})
        assert r.status_code == 403

    def test_customer_create_with_missing_software_404(self, session, sandy_token):
        r = session.post(f"{API}/software-requests",
                         headers=auth_h(sandy_token),
                         json={"software_id": "non-existent-id-xyz"})
        assert r.status_code == 404

    def test_customer_create_success_and_enrichment(self, session, sandy_token, sandy_user):
        cat = session.get(f"{API}/software-catalog").json()
        # pick a random non-approved one (ChatGPT Plus if available)
        pick = next((it for it in cat if "ChatGPT" in it["name"]), cat[0])
        r = session.post(f"{API}/software-requests",
                         headers=auth_h(sandy_token),
                         json={"software_id": pick["id"],
                               "quantity": 2,
                               "reason": "TEST iteration2 request"})
        assert r.status_code == 200
        req = r.json()
        no_mongo_id(req)
        assert req["status"] == "pending"
        assert req["customer_id"] == sandy_user["id"]
        assert req["customer_email"] == "bsandy2@aol.com"
        assert req["software_id"] == pick["id"]
        assert req["software_name"] == pick["name"]
        assert req["software_category"] == pick["category"]
        assert req["quantity"] == 2
        assert req["request_number"].startswith("SR-")
        # assigned advisor should be sandy's assigned technician
        assert req["assigned_advisor_id"] == sandy_user.get("assigned_technician_id")
        # Persistence check
        r2 = session.get(f"{API}/software-requests", headers=auth_h(sandy_token))
        assert any(x["id"] == req["id"] for x in r2.json())

    def test_customer_list_only_own(self, session, sandy_token, linda_token, sandy_user, linda_user):
        r = session.get(f"{API}/software-requests", headers=auth_h(sandy_token))
        assert r.status_code == 200
        rows = r.json()
        no_mongo_id(rows)
        assert all(x["customer_id"] == sandy_user["id"] for x in rows)

        r2 = session.get(f"{API}/software-requests", headers=auth_h(linda_token))
        assert r2.status_code == 200
        assert all(x["customer_id"] == linda_user["id"] for x in r2.json())

    def test_admin_sees_all_requests(self, session, admin_token, sandy_user):
        r = session.get(f"{API}/software-requests", headers=auth_h(admin_token))
        assert r.status_code == 200
        rows = r.json()
        no_mongo_id(rows)
        # Sandy should have at least 2 (seed QuickBooks + Claude approved) + any new from this test run
        sandy_rows = [x for x in rows if x["customer_id"] == sandy_user["id"]]
        assert len(sandy_rows) >= 2, f"expected >=2 for sandy, got {len(sandy_rows)}"
        names = [x["software_name"] for x in sandy_rows]
        # seed items mentioned in problem: QuickBooks Online Plus approved; Claude Pro approved
        assert any("QuickBooks" in n for n in names), f"expected QuickBooks in {names}"

    def test_technician_sees_assigned_customers_requests(self, session, ravi_token, ravi_user, sandy_user):
        r = session.get(f"{API}/software-requests", headers=auth_h(ravi_token))
        assert r.status_code == 200
        rows = r.json()
        # Sandy is assigned to Ravi -> ravi should see Sandy's requests
        assert any(x["customer_id"] == sandy_user["id"] for x in rows), \
            "Ravi should see Sandy's software requests"

    def test_customer_patch_forbidden(self, session, sandy_token, admin_token, sandy_user):
        # find or create a request for sandy
        rows = session.get(f"{API}/software-requests", headers=auth_h(sandy_token)).json()
        if not rows:
            cat = session.get(f"{API}/software-catalog").json()
            r = session.post(f"{API}/software-requests", headers=auth_h(sandy_token),
                             json={"software_id": cat[0]["id"]})
            rid = r.json()["id"]
        else:
            rid = rows[0]["id"]
        r = session.patch(f"{API}/software-requests/{rid}",
                          headers=auth_h(sandy_token),
                          json={"status": "approved"})
        assert r.status_code == 403

    def test_admin_patch_updates_status_and_notes(self, session, admin_token, sandy_token, ravi_user):
        # create a request as sandy
        cat = session.get(f"{API}/software-catalog").json()
        pick = cat[-1]  # last item
        create = session.post(f"{API}/software-requests",
                              headers=auth_h(sandy_token),
                              json={"software_id": pick["id"],
                                    "reason": "TEST admin-patch"})
        rid = create.json()["id"]
        # admin patches
        r = session.patch(f"{API}/software-requests/{rid}",
                          headers=auth_h(admin_token),
                          json={"status": "approved",
                                "advisor_notes": "TEST notes by admin",
                                "assigned_advisor_id": ravi_user["id"]})
        assert r.status_code == 200
        updated = r.json()
        no_mongo_id(updated)
        assert updated["status"] == "approved"
        assert updated["advisor_notes"] == "TEST notes by admin"
        assert updated["assigned_advisor_id"] == ravi_user["id"]
        # GET verification via admin list
        rows = session.get(f"{API}/software-requests", headers=auth_h(admin_token)).json()
        match = next(x for x in rows if x["id"] == rid)
        assert match["status"] == "approved"
        assert match["advisor_notes"] == "TEST notes by admin"

    def test_admin_patch_nonexistent_404(self, session, admin_token):
        r = session.patch(f"{API}/software-requests/{uuid.uuid4()}",
                          headers=auth_h(admin_token),
                          json={"status": "approved"})
        assert r.status_code == 404


# =====================================================================
# DEVICES
# =====================================================================
class TestDevices:
    def test_unauth_401(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        r = s.get(f"{API}/devices")
        assert r.status_code == 401

    def test_technician_create_403(self, session, ravi_token):
        r = session.post(f"{API}/devices", headers=auth_h(ravi_token),
                         json={"name": "TestBox", "type": "desktop"})
        assert r.status_code == 403

    def test_admin_create_403(self, session, admin_token):
        r = session.post(f"{API}/devices", headers=auth_h(admin_token),
                         json={"name": "TestBox", "type": "desktop"})
        assert r.status_code == 403

    def test_sandy_has_seeded_devices(self, session, sandy_token):
        r = session.get(f"{API}/devices", headers=auth_h(sandy_token))
        assert r.status_code == 200
        rows = r.json()
        no_mongo_id(rows)
        assert len(rows) >= 2, f"expected >=2 seeded devices, got {len(rows)}"
        names = [d["name"] for d in rows]
        models = [d.get("model") or "" for d in rows]
        manufacturers = [d.get("manufacturer") or "" for d in rows]
        # Sandy's seeded: Main Desktop (Dell OptiPlex 7090) & Laptop (Lenovo ThinkPad T14s)
        assert any("Main Desktop" in n for n in names), f"expected 'Main Desktop' in {names}"
        assert any("OptiPlex 7090" in m for m in models), f"expected OptiPlex 7090 in {models}"
        assert any("Dell" in m for m in manufacturers), f"expected Dell manufacturer in {manufacturers}"
        assert any("ThinkPad T14s" in m for m in models), f"expected ThinkPad T14s in {models}"

    def test_customer_create_device_and_persist(self, session, sandy_token, sandy_user):
        payload = {
            "name": "TEST iteration2 device",
            "type": "laptop",
            "os": "Windows 11",
            "manufacturer": "HP",
            "model": "EliteBook 840",
            "serial": "TEST-SN-123",
            "processor": "Intel i7",
            "ram": "16 GB",
            "storage": "512 GB SSD",
            "notes": "TEST note",
        }
        r = session.post(f"{API}/devices", headers=auth_h(sandy_token), json=payload)
        assert r.status_code == 200
        d = r.json()
        no_mongo_id(d)
        assert d["customer_id"] == sandy_user["id"]
        assert d["name"] == payload["name"]
        assert d["serial"] == "TEST-SN-123"
        did = d["id"]

        # GET verification
        rows = session.get(f"{API}/devices", headers=auth_h(sandy_token)).json()
        fetched = next((x for x in rows if x["id"] == did), None)
        assert fetched is not None
        assert fetched["model"] == "EliteBook 840"

        # PATCH update
        r2 = session.patch(f"{API}/devices/{did}", headers=auth_h(sandy_token),
                           json={"name": "TEST iteration2 updated",
                                 "type": "laptop",
                                 "ram": "32 GB"})
        assert r2.status_code == 200
        assert r2.json()["ram"] == "32 GB"
        assert r2.json()["name"] == "TEST iteration2 updated"

        # Persistence check
        rows2 = session.get(f"{API}/devices", headers=auth_h(sandy_token)).json()
        fetched2 = next(x for x in rows2 if x["id"] == did)
        assert fetched2["ram"] == "32 GB"

        # DELETE
        r3 = session.delete(f"{API}/devices/{did}", headers=auth_h(sandy_token))
        assert r3.status_code == 200
        assert r3.json().get("ok") is True

        # GET verify removal
        rows3 = session.get(f"{API}/devices", headers=auth_h(sandy_token)).json()
        assert not any(x["id"] == did for x in rows3)

    def test_customer_cannot_update_other_customers_device(self, session, sandy_token, linda_token):
        # Linda creates a device
        r = session.post(f"{API}/devices", headers=auth_h(linda_token),
                         json={"name": "TEST Linda laptop", "type": "laptop"})
        assert r.status_code == 200
        did = r.json()["id"]
        try:
            # Sandy tries to update Linda's device
            r2 = session.patch(f"{API}/devices/{did}", headers=auth_h(sandy_token),
                               json={"name": "hacked", "type": "laptop"})
            assert r2.status_code == 403
            # Sandy tries to delete Linda's device
            r3 = session.delete(f"{API}/devices/{did}", headers=auth_h(sandy_token))
            assert r3.status_code == 403
        finally:
            session.delete(f"{API}/devices/{did}", headers=auth_h(linda_token))

    def test_update_nonexistent_device_404(self, session, sandy_token):
        r = session.patch(f"{API}/devices/{uuid.uuid4()}", headers=auth_h(sandy_token),
                          json={"name": "x", "type": "desktop"})
        assert r.status_code == 404

    def test_delete_nonexistent_device_404(self, session, sandy_token):
        r = session.delete(f"{API}/devices/{uuid.uuid4()}", headers=auth_h(sandy_token))
        assert r.status_code == 404

    def test_customer_list_scoped(self, session, sandy_token, linda_token, sandy_user, linda_user):
        # Create a device for linda then verify sandy cannot see it
        r = session.post(f"{API}/devices", headers=auth_h(linda_token),
                         json={"name": "TEST linda scope", "type": "desktop"})
        linda_did = r.json()["id"]
        try:
            sandy_rows = session.get(f"{API}/devices", headers=auth_h(sandy_token)).json()
            assert all(d["customer_id"] == sandy_user["id"] for d in sandy_rows)
            assert not any(d["id"] == linda_did for d in sandy_rows)
        finally:
            session.delete(f"{API}/devices/{linda_did}", headers=auth_h(linda_token))

    def test_admin_list_all_and_filter_by_customer(self, session, admin_token, sandy_user, linda_user):
        r = session.get(f"{API}/devices", headers=auth_h(admin_token))
        assert r.status_code == 200
        all_rows = r.json()
        no_mongo_id(all_rows)
        # Filter by customer
        r2 = session.get(f"{API}/devices", headers=auth_h(admin_token),
                         params={"customer_id": sandy_user["id"]})
        assert r2.status_code == 200
        filtered = r2.json()
        assert all(d["customer_id"] == sandy_user["id"] for d in filtered)
        assert len(filtered) >= 2  # Sandy's seeded devices

    def test_technician_sees_assigned_customers_devices(self, session, ravi_token, sandy_user):
        r = session.get(f"{API}/devices", headers=auth_h(ravi_token))
        assert r.status_code == 200
        rows = r.json()
        # Ravi is assigned to Sandy
        assert any(d["customer_id"] == sandy_user["id"] for d in rows), \
            "Ravi should see Sandy's devices"

    def test_technician_filter_unassigned_customer_403(self, session, sumit_token, sandy_user, ravi_user):
        # Sumit is NOT sandy's tech (Ravi is). Filtering for sandy should 403.
        # First check: is sandy actually assigned to Ravi (sanity)
        assert sandy_user.get("assigned_technician_id") == ravi_user["id"]
        r = session.get(f"{API}/devices", headers=auth_h(sumit_token),
                        params={"customer_id": sandy_user["id"]})
        assert r.status_code == 403
