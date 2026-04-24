from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict, HttpUrl
from typing import List, Optional, Literal
import uuid
import re
import socket
import ssl
from urllib.parse import urlparse
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'gts-super-secret-key-change-in-prod-2026')
JWT_ALGORITHM = 'HS256'
JWT_EXP_HOURS = 24 * 7

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

app = FastAPI(title="Global Tech Solutions API")
api = APIRouter(prefix="/api")

# ----------------------- Utilities -----------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()

def hash_password(p: str) -> str:
    return pwd_ctx.hash(p)

def verify_password(p: str, h: str) -> bool:
    try:
        return pwd_ctx.verify(p, h)
    except Exception:
        return False

def create_token(user_id: str, role: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles):
    async def checker(user=Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return checker

# ----------------------- Models -----------------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None

class LoginInput(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # customer / technician / admin (optional hint)

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str

class BookingInput(BaseModel):
    service_type: str
    device_type: Optional[str] = None
    description: str
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    urgency: Optional[str] = "normal"  # normal / urgent / emergency
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None

class TicketInput(BaseModel):
    subject: str
    description: str
    priority: Optional[str] = "medium"
    category: Optional[str] = "general"

class MessageInput(BaseModel):
    recipient_id: str
    content: str

class UpdateAppointmentInput(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None
    report: Optional[str] = None

class InvoiceInput(BaseModel):
    customer_id: str
    amount: float
    description: str
    items: Optional[List[dict]] = []
    due_date: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = "pending"

class AssignTechInput(BaseModel):
    customer_id: str
    technician_id: str

class PlanInput(BaseModel):
    name: str
    price: float
    duration: str
    features: List[str]
    description: Optional[str] = ""
    popular: Optional[bool] = False

class UpdateProfileInput(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    payment_method: Optional[str] = None

# ----------------------- AUTH -----------------------
@api.post("/auth/register")
async def register(body: RegisterInput):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "role": "customer",
        "phone": body.phone,
        "address": body.address,
        "created_at": now_iso(),
        "active_plan": None,
        "assigned_technician_id": None,
        "payment_method": None,
        "photo": None,
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["role"], user["email"])
    user.pop("password")
    user.pop("_id", None)
    return {"token": token, "user": user}

@api.post("/auth/login")
async def login(body: LoginInput):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if body.role and user["role"] != body.role:
        raise HTTPException(status_code=403, detail=f"This account is not a {body.role} account")
    token = create_token(user["id"], user["role"], user["email"])
    user.pop("password", None)
    user.pop("_id", None)
    return {"token": token, "user": user}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user

@api.patch("/auth/profile")
async def update_profile(body: UpdateProfileInput, user=Depends(get_current_user)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password": 0})
    return updated

# ----------------------- PLANS -----------------------
@api.get("/plans")
async def list_plans():
    plans = await db.plans.find({}, {"_id": 0}).to_list(100)
    return plans

@api.post("/plans")
async def create_plan(body: PlanInput, admin=Depends(require_role("admin"))):
    plan = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso()}
    await db.plans.insert_one(plan.copy())
    plan.pop("_id", None)
    return plan

@api.patch("/plans/{plan_id}")
async def update_plan(plan_id: str, body: PlanInput, admin=Depends(require_role("admin"))):
    await db.plans.update_one({"id": plan_id}, {"$set": body.model_dump()})
    return await db.plans.find_one({"id": plan_id}, {"_id": 0})

@api.delete("/plans/{plan_id}")
async def delete_plan(plan_id: str, admin=Depends(require_role("admin"))):
    await db.plans.delete_one({"id": plan_id})
    return {"ok": True}

# ----------------------- SERVICES (static catalog) -----------------------
@api.get("/services")
async def list_services():
    services = await db.services.find({}, {"_id": 0}).to_list(100)
    return services

# ----------------------- CONTACT / BOOKING (public) -----------------------
@api.post("/contact")
async def submit_contact(body: ContactForm):
    doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso(), "status": "new"}
    await db.contact_submissions.insert_one(doc.copy())
    doc.pop("_id", None)
    return {"ok": True, "id": doc["id"]}

@api.get("/contact", dependencies=[Depends(require_role("admin"))])
async def list_contact():
    return await db.contact_submissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@api.post("/bookings")
async def create_booking(body: BookingInput, user=Depends(get_current_user) if False else None):
    # Public booking (if user attaches token via /bookings/me it's handled separately)
    doc = {
        "id": str(uuid.uuid4()),
        **body.model_dump(),
        "created_at": now_iso(),
        "status": "pending",
        "customer_id": None,
        "technician_id": None,
    }
    await db.bookings.insert_one(doc.copy())
    doc.pop("_id", None)
    return doc

@api.post("/bookings/me")
async def create_booking_auth(body: BookingInput, user=Depends(get_current_user)):
    doc = {
        "id": str(uuid.uuid4()),
        **body.model_dump(),
        "created_at": now_iso(),
        "status": "pending",
        "customer_id": user["id"],
        "technician_id": user.get("assigned_technician_id"),
    }
    # Also create an appointment
    appt = {
        "id": str(uuid.uuid4()),
        "customer_id": user["id"],
        "technician_id": user.get("assigned_technician_id"),
        "service_type": body.service_type,
        "description": body.description,
        "scheduled_date": body.preferred_date or now_iso(),
        "scheduled_time": body.preferred_time or "10:00",
        "status": "scheduled",
        "notes": "",
        "urgency": body.urgency,
        "created_at": now_iso(),
    }
    await db.bookings.insert_one(doc.copy())
    await db.appointments.insert_one(appt.copy())
    doc.pop("_id", None)
    return doc

@api.get("/bookings", dependencies=[Depends(require_role("admin"))])
async def list_bookings():
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

# ----------------------- CUSTOMERS (admin) -----------------------
@api.get("/customers")
async def list_customers(admin=Depends(require_role("admin"))):
    customers = await db.users.find({"role": "customer"}, {"_id": 0, "password": 0}).to_list(500)
    # enrich
    for c in customers:
        inv_count = await db.invoices.count_documents({"customer_id": c["id"]})
        appt_count = await db.appointments.count_documents({"customer_id": c["id"]})
        c["invoice_count"] = inv_count
        c["appointment_count"] = appt_count
    return customers

@api.get("/customers/{cid}")
async def get_customer(cid: str, user=Depends(get_current_user)):
    if user["role"] == "customer" and user["id"] != cid:
        raise HTTPException(status_code=403, detail="Forbidden")
    customer = await db.users.find_one({"id": cid, "role": "customer"}, {"_id": 0, "password": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    # enrich with technician
    if customer.get("assigned_technician_id"):
        tech = await db.users.find_one({"id": customer["assigned_technician_id"]}, {"_id": 0, "password": 0})
        customer["technician"] = tech
    return customer

# ----------------------- TECHNICIANS -----------------------
@api.get("/technicians")
async def list_technicians(user=Depends(get_current_user)):
    techs = await db.users.find({"role": "technician"}, {"_id": 0, "password": 0}).to_list(200)
    return techs

@api.post("/technicians")
async def create_technician(body: RegisterInput, specialization: str = "General IT", admin=Depends(require_role("admin"))):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    tech = {
        "id": str(uuid.uuid4()),
        "name": body.name,
        "email": body.email.lower(),
        "password": hash_password(body.password),
        "role": "technician",
        "phone": body.phone,
        "specialization": specialization,
        "rating": 5.0,
        "photo": None,
        "created_at": now_iso(),
    }
    await db.users.insert_one(tech.copy())
    tech.pop("password", None)
    tech.pop("_id", None)
    return tech

@api.post("/technicians/assign")
async def assign_technician(body: AssignTechInput, admin=Depends(require_role("admin"))):
    await db.users.update_one({"id": body.customer_id, "role": "customer"}, {"$set": {"assigned_technician_id": body.technician_id}})
    return {"ok": True}

# ----------------------- APPOINTMENTS -----------------------
@api.get("/appointments")
async def list_appointments(user=Depends(get_current_user)):
    q = {}
    if user["role"] == "customer":
        q = {"customer_id": user["id"]}
    elif user["role"] == "technician":
        q = {"technician_id": user["id"]}
    appts = await db.appointments.find(q, {"_id": 0}).sort("scheduled_date", -1).to_list(500)
    # enrich
    for a in appts:
        if a.get("customer_id"):
            c = await db.users.find_one({"id": a["customer_id"]}, {"_id": 0, "name": 1, "email": 1, "phone": 1, "address": 1})
            a["customer"] = c
        if a.get("technician_id"):
            t = await db.users.find_one({"id": a["technician_id"]}, {"_id": 0, "name": 1, "specialization": 1, "phone": 1})
            a["technician"] = t
    return appts

@api.patch("/appointments/{aid}")
async def update_appointment(aid: str, body: UpdateAppointmentInput, user=Depends(get_current_user)):
    appt = await db.appointments.find_one({"id": aid}, {"_id": 0})
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] == "technician" and appt.get("technician_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if user["role"] == "customer":
        raise HTTPException(status_code=403, detail="Forbidden")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if updates:
        await db.appointments.update_one({"id": aid}, {"$set": updates})
        # if completed, add to service history
        if updates.get("status") == "completed":
            await db.service_history.insert_one({
                "id": str(uuid.uuid4()),
                "customer_id": appt["customer_id"],
                "technician_id": appt.get("technician_id"),
                "appointment_id": aid,
                "service_type": appt.get("service_type"),
                "description": appt.get("description"),
                "notes": updates.get("notes", appt.get("notes", "")),
                "report": updates.get("report"),
                "completed_at": now_iso(),
            })
    return await db.appointments.find_one({"id": aid}, {"_id": 0})

# ----------------------- INVOICES / PAYMENTS -----------------------
@api.get("/invoices")
async def list_invoices(user=Depends(get_current_user)):
    q = {} if user["role"] == "admin" else {"customer_id": user["id"]}
    invs = await db.invoices.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    if user["role"] == "admin":
        for i in invs:
            c = await db.users.find_one({"id": i.get("customer_id")}, {"_id": 0, "name": 1, "email": 1})
            i["customer"] = c
    return invs

@api.post("/invoices")
async def create_invoice(body: InvoiceInput, admin=Depends(require_role("admin"))):
    inv = {
        "id": str(uuid.uuid4()),
        "invoice_number": f"GTS-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}",
        **body.model_dump(),
        "created_at": now_iso(),
    }
    await db.invoices.insert_one(inv.copy())
    inv.pop("_id", None)
    return inv

@api.get("/invoices/{iid}")
async def get_invoice(iid: str, user=Depends(get_current_user)):
    inv = await db.invoices.find_one({"id": iid}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] == "customer" and inv.get("customer_id") != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    c = await db.users.find_one({"id": inv.get("customer_id")}, {"_id": 0, "password": 0})
    inv["customer"] = c
    return inv

@api.get("/payments")
async def list_payments(user=Depends(get_current_user)):
    q = {} if user["role"] == "admin" else {"customer_id": user["id"]}
    invs = await db.invoices.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # treat paid invoices as payments; plus payment log entries
    payments = [i for i in invs if i.get("status") == "paid"]
    if user["role"] == "admin":
        for p in payments:
            c = await db.users.find_one({"id": p.get("customer_id")}, {"_id": 0, "name": 1, "email": 1})
            p["customer"] = c
    return payments

# ----------------------- SERVICE HISTORY -----------------------
@api.get("/service-history")
async def service_history(user=Depends(get_current_user)):
    q = {} if user["role"] == "admin" else (
        {"customer_id": user["id"]} if user["role"] == "customer" else {"technician_id": user["id"]}
    )
    hist = await db.service_history.find(q, {"_id": 0}).sort("completed_at", -1).to_list(1000)
    for h in hist:
        if h.get("technician_id"):
            t = await db.users.find_one({"id": h["technician_id"]}, {"_id": 0, "name": 1})
            h["technician_name"] = t["name"] if t else None
        if user["role"] == "admin" and h.get("customer_id"):
            c = await db.users.find_one({"id": h["customer_id"]}, {"_id": 0, "name": 1})
            h["customer_name"] = c["name"] if c else None
    return hist

# ----------------------- TICKETS -----------------------
@api.get("/tickets")
async def list_tickets(user=Depends(get_current_user)):
    q = {}
    if user["role"] == "customer":
        q = {"customer_id": user["id"]}
    elif user["role"] == "technician":
        q = {"$or": [{"assigned_to": user["id"]}, {"customer_id": {"$in": await _customers_for_tech(user["id"])}}]}
    tickets = await db.tickets.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for t in tickets:
        if t.get("customer_id"):
            c = await db.users.find_one({"id": t["customer_id"]}, {"_id": 0, "name": 1, "email": 1})
            t["customer"] = c
    return tickets

async def _customers_for_tech(tid: str):
    rows = await db.users.find({"role": "customer", "assigned_technician_id": tid}, {"_id": 0, "id": 1}).to_list(500)
    return [r["id"] for r in rows]

@api.post("/tickets")
async def create_ticket(body: TicketInput, user=Depends(get_current_user)):
    t = {
        "id": str(uuid.uuid4()),
        "ticket_number": f"TKT-{str(uuid.uuid4())[:8].upper()}",
        "customer_id": user["id"] if user["role"] == "customer" else None,
        "assigned_to": user.get("assigned_technician_id") if user["role"] == "customer" else None,
        "status": "open",
        **body.model_dump(),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.tickets.insert_one(t.copy())
    t.pop("_id", None)
    return t

@api.patch("/tickets/{tid}")
async def update_ticket(tid: str, updates: dict, user=Depends(get_current_user)):
    allowed = {k: v for k, v in updates.items() if k in ["status", "assigned_to", "priority", "resolution"]}
    allowed["updated_at"] = now_iso()
    await db.tickets.update_one({"id": tid}, {"$set": allowed})
    return await db.tickets.find_one({"id": tid}, {"_id": 0})

# ----------------------- MESSAGES -----------------------
@api.get("/messages")
async def list_messages(with_user: Optional[str] = None, user=Depends(get_current_user)):
    q = {"$or": [{"sender_id": user["id"]}, {"recipient_id": user["id"]}]}
    if with_user:
        q = {"$or": [
            {"sender_id": user["id"], "recipient_id": with_user},
            {"sender_id": with_user, "recipient_id": user["id"]},
        ]}
    msgs = await db.messages.find(q, {"_id": 0}).sort("created_at", 1).to_list(1000)
    return msgs

@api.post("/messages")
async def send_message(body: MessageInput, user=Depends(get_current_user)):
    m = {
        "id": str(uuid.uuid4()),
        "sender_id": user["id"],
        "sender_name": user["name"],
        "sender_role": user["role"],
        "recipient_id": body.recipient_id,
        "content": body.content,
        "created_at": now_iso(),
        "read": False,
    }
    await db.messages.insert_one(m.copy())
    m.pop("_id", None)
    return m

@api.get("/conversations")
async def conversations(user=Depends(get_current_user)):
    # get distinct users messaged
    msgs = await db.messages.find({"$or": [{"sender_id": user["id"]}, {"recipient_id": user["id"]}]}, {"_id": 0}).to_list(2000)
    counterparts = {}
    for m in msgs:
        other = m["recipient_id"] if m["sender_id"] == user["id"] else m["sender_id"]
        counterparts[other] = m
    convs = []
    for uid, last in counterparts.items():
        u = await db.users.find_one({"id": uid}, {"_id": 0, "name": 1, "role": 1, "photo": 1})
        convs.append({"user": u, "user_id": uid, "last_message": last})
    return convs

# ----------------------- REVIEWS -----------------------
@api.get("/reviews")
async def list_reviews():
    return await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)

# ----------------------- ANALYTICS -----------------------
@api.get("/analytics/overview", dependencies=[Depends(require_role("admin"))])
async def analytics_overview():
    customers = await db.users.count_documents({"role": "customer"})
    techs = await db.users.count_documents({"role": "technician"})
    invoices = await db.invoices.count_documents({})
    paid_invoices = await db.invoices.find({"status": "paid"}, {"_id": 0, "amount": 1}).to_list(5000)
    revenue = sum(i.get("amount", 0) for i in paid_invoices)
    open_tickets = await db.tickets.count_documents({"status": {"$in": ["open", "in_progress"]}})
    upcoming = await db.appointments.count_documents({"status": "scheduled"})
    bookings = await db.bookings.count_documents({})

    # revenue by month (last 12)
    by_month = {}
    for inv in paid_invoices:
        # amount ok; we need date from invoice
        pass
    all_paid = await db.invoices.find({"status": "paid"}, {"_id": 0, "amount": 1, "created_at": 1}).to_list(5000)
    for inv in all_paid:
        created = inv.get("created_at", "")[:7]  # YYYY-MM
        by_month[created] = by_month.get(created, 0) + inv.get("amount", 0)
    rev_series = [{"month": k, "amount": v} for k, v in sorted(by_month.items())]

    return {
        "customers": customers,
        "technicians": techs,
        "invoices": invoices,
        "revenue": round(revenue, 2),
        "open_tickets": open_tickets,
        "upcoming_appointments": upcoming,
        "bookings": bookings,
        "revenue_by_month": rev_series,
    }

# ----------------------- DASHBOARD STATS (customer/tech) -----------------------
@api.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    if user["role"] == "customer":
        invs = await db.invoices.count_documents({"customer_id": user["id"]})
        paid = await db.invoices.find({"customer_id": user["id"], "status": "paid"}, {"_id": 0, "amount": 1}).to_list(500)
        spent = sum(i.get("amount", 0) for i in paid)
        appts = await db.appointments.count_documents({"customer_id": user["id"], "status": "scheduled"})
        tkts = await db.tickets.count_documents({"customer_id": user["id"], "status": {"$in": ["open", "in_progress"]}})
        return {"invoices": invs, "total_spent": round(spent, 2), "upcoming_appointments": appts, "open_tickets": tkts}
    if user["role"] == "technician":
        assigned = await db.users.count_documents({"assigned_technician_id": user["id"]})
        appts = await db.appointments.count_documents({"technician_id": user["id"], "status": "scheduled"})
        completed = await db.appointments.count_documents({"technician_id": user["id"], "status": "completed"})
        tkts = await db.tickets.count_documents({"assigned_to": user["id"], "status": {"$in": ["open", "in_progress"]}})
        return {"assigned_customers": assigned, "upcoming_appointments": appts, "completed_jobs": completed, "open_tickets": tkts}
    return {}

# ----------------------- FAQS (static) -----------------------
@api.get("/faqs")
async def list_faqs():
    return [
        {"q": "What services does Global Tech Solutions offer?", "a": "We provide computer repair, phone/tablet support, email setup and recovery, software installation, antivirus and malware removal, Wi-Fi network setup, data backup and recovery, remote support, on-site technician visits, and business IT support."},
        {"q": "How quickly can I get help?", "a": "For emergency issues, we provide same-day remote support 7 days a week. Standard bookings are usually scheduled within 24-48 hours."},
        {"q": "Do you offer remote support?", "a": "Yes, most software, email, security, and configuration issues can be resolved via secure remote support. Our technician will walk you through a one-time connection link."},
        {"q": "Are my devices and data safe?", "a": "Absolutely. All sessions are encrypted, technicians follow strict data-handling protocols, and we never store credentials. Sensitive files are handled under NDA for business clients."},
        {"q": "Do you support both Windows and Mac?", "a": "Yes, our technicians are certified to work on Windows PCs, Macs, iPhones, iPads, Android devices, Chromebooks, and most business network hardware."},
        {"q": "What are your support plans?", "a": "We offer Basic, Pro, Business, and Lifetime VIP plans. See our Pricing page for details or contact us for custom enterprise quotes."},
        {"q": "Is Global Tech Solutions affiliated with Microsoft, Apple, or other brands?", "a": "No. Global Tech Solutions is an independent technical support provider and is not affiliated, endorsed, or sponsored by Microsoft, Apple, Google, or any third-party brand unless explicitly stated as an authorized partner."},
        {"q": "How do payments and invoices work?", "a": "We issue itemized invoices for every service. Payment is accepted via check, ACH, or card. All invoices and receipts are available in your customer dashboard for download."},
        {"q": "Can I cancel or reschedule an appointment?", "a": "Yes, you can reschedule or cancel from your customer dashboard up to 4 hours before the appointment at no charge."},
        {"q": "Do you serve businesses?", "a": "Yes — we provide managed IT, cybersecurity, cloud infrastructure, and help-desk services for small to mid-sized businesses."},
    ]

# ----------------------- SOFTWARE CATALOG & REQUESTS -----------------------
class SoftwareRequestInput(BaseModel):
    software_id: str
    quantity: Optional[int] = 1
    reason: Optional[str] = ""

class SoftwareRequestUpdate(BaseModel):
    status: Optional[str] = None  # pending / under_review / approved / delivered / denied
    advisor_notes: Optional[str] = None
    assigned_advisor_id: Optional[str] = None

class DeviceInput(BaseModel):
    name: str
    type: str
    os: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    serial: Optional[str] = None
    processor: Optional[str] = None
    ram: Optional[str] = None
    storage: Optional[str] = None
    notes: Optional[str] = None

@api.get("/software-catalog")
async def list_software_catalog(category: Optional[str] = None):
    q = {"category": category} if category else {}
    items = await db.software_catalog.find(q, {"_id": 0}).sort("category", 1).to_list(500)
    return items

@api.get("/software-requests")
async def list_software_requests(user=Depends(get_current_user)):
    if user["role"] == "admin":
        q = {}
    elif user["role"] == "technician":
        customer_ids = await _customers_for_tech(user["id"])
        q = {"$or": [{"assigned_advisor_id": user["id"]}, {"customer_id": {"$in": customer_ids}}]}
    else:
        q = {"customer_id": user["id"]}
    rows = await db.software_requests.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows

@api.post("/software-requests")
async def create_software_request(body: SoftwareRequestInput, user=Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can request software")
    sw = await db.software_catalog.find_one({"id": body.software_id}, {"_id": 0})
    if not sw:
        raise HTTPException(status_code=404, detail="Software not found")
    req = {
        "id": str(uuid.uuid4()),
        "request_number": f"SR-{str(uuid.uuid4())[:8].upper()}",
        "customer_id": user["id"],
        "customer_name": user["name"],
        "customer_email": user["email"],
        "software_id": sw["id"],
        "software_name": sw["name"],
        "software_provider": sw.get("provider"),
        "software_category": sw.get("category"),
        "quantity": body.quantity or 1,
        "reason": body.reason or "",
        "status": "pending",
        "advisor_notes": "",
        "assigned_advisor_id": user.get("assigned_technician_id"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.software_requests.insert_one(req.copy())
    req.pop("_id", None)
    return req

@api.post("/software-gifts/claim")
async def claim_software_gift(body: SoftwareRequestInput, user=Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can claim gifts")
    sw = await db.software_catalog.find_one({"id": body.software_id}, {"_id": 0})
    if not sw:
        raise HTTPException(status_code=404, detail="Software not found")
    allowance = int(user.get("gift_allowance") or 0)
    used = await db.software_requests.count_documents({"customer_id": user["id"], "is_gift": True})
    if used >= allowance:
        raise HTTPException(status_code=400, detail=f"You have used all {allowance} loyalty gifts. Contact your advisor for an upgrade.")
    already = await db.software_requests.find_one({"customer_id": user["id"], "software_id": sw["id"], "is_gift": True})
    if already:
        raise HTTPException(status_code=400, detail="You have already claimed this item as a gift.")
    now = now_iso()
    gift = {
        "id": str(uuid.uuid4()),
        "request_number": f"GFT-{str(uuid.uuid4())[:8].upper()}",
        "customer_id": user["id"],
        "customer_name": user["name"],
        "customer_email": user["email"],
        "software_id": sw["id"],
        "software_name": sw["name"],
        "software_provider": sw.get("provider"),
        "software_category": sw.get("category"),
        "quantity": 1,
        "reason": body.reason or "",
        "status": "delivered",
        "is_gift": True,
        "gifted_by": "Global Tech Solutions",
        "gifted_at": now,
        "advisor_notes": "🎁 Claimed from your loyalty gift allowance. License key / invite will be emailed within 24 hours.",
        "assigned_advisor_id": user.get("assigned_technician_id"),
        "created_at": now, "updated_at": now,
    }
    await db.software_requests.insert_one(gift.copy())
    gift.pop("_id", None)
    return gift

@api.get("/software-gifts/allowance")
async def gift_allowance(user=Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Forbidden")
    allowance = int(user.get("gift_allowance") or 0)
    used = await db.software_requests.count_documents({"customer_id": user["id"], "is_gift": True})
    return {
        "allowance": allowance,
        "used": used,
        "remaining": max(0, allowance - used),
        "source": user.get("gift_allowance_source", ""),
    }

@api.patch("/software-requests/{rid}")
async def update_software_request(rid: str, body: SoftwareRequestUpdate, user=Depends(get_current_user)):
    if user["role"] == "customer":
        raise HTTPException(status_code=403, detail="Forbidden")
    existing = await db.software_requests.find_one({"id": rid}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Not found")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.software_requests.update_one({"id": rid}, {"$set": updates})
    return await db.software_requests.find_one({"id": rid}, {"_id": 0})

# ----------------------- PC / DEVICES -----------------------
@api.get("/devices")
async def list_devices(customer_id: Optional[str] = None, user=Depends(get_current_user)):
    if user["role"] == "customer":
        q = {"customer_id": user["id"]}
    elif user["role"] == "technician":
        allowed = await _customers_for_tech(user["id"])
        if customer_id and customer_id not in allowed:
            raise HTTPException(status_code=403, detail="Forbidden")
        q = {"customer_id": customer_id} if customer_id else {"customer_id": {"$in": allowed}}
    else:
        q = {"customer_id": customer_id} if customer_id else {}
    rows = await db.devices.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return rows

@api.post("/devices")
async def create_device(body: DeviceInput, user=Depends(get_current_user)):
    if user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can add devices")
    d = {"id": str(uuid.uuid4()), "customer_id": user["id"], **body.model_dump(),
         "created_at": now_iso(), "updated_at": now_iso()}
    await db.devices.insert_one(d.copy())
    d.pop("_id", None)
    return d

@api.patch("/devices/{did}")
async def update_device(did: str, body: DeviceInput, user=Depends(get_current_user)):
    d = await db.devices.find_one({"id": did}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] == "customer" and d["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = now_iso()
    await db.devices.update_one({"id": did}, {"$set": updates})
    return await db.devices.find_one({"id": did}, {"_id": 0})

@api.delete("/devices/{did}")
async def delete_device(did: str, user=Depends(get_current_user)):
    d = await db.devices.find_one({"id": did}, {"_id": 0})
    if not d:
        raise HTTPException(status_code=404, detail="Not found")
    if user["role"] == "customer" and d["customer_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    await db.devices.delete_one({"id": did})
    return {"ok": True}

# ----------------------- SECURITY SCAN (Pre-Flight URL check) -----------------------
# Known legitimate domains to check typosquatting against
_TARGET_DOMAINS = [
    # Banking
    "chase.com", "bankofamerica.com", "wellsfargo.com", "citi.com", "capitalone.com",
    "usbank.com", "americanexpress.com", "discover.com", "tdbank.com", "pnc.com",
    "barclays.com", "hsbc.com", "santander.com", "rbc.com", "bmo.com",
    # Payments
    "paypal.com", "venmo.com", "cashapp.com", "zelle.com", "stripe.com", "wise.com",
    # Crypto exchanges / wallets
    "coinbase.com", "binance.com", "kraken.com", "gemini.com", "crypto.com",
    "metamask.io", "ledger.com", "trezor.io", "blockchain.com", "exodus.com",
    "uniswap.org", "kucoin.com", "bitstamp.net", "bittrex.com",
    # Brokerages
    "fidelity.com", "schwab.com", "vanguard.com", "robinhood.com", "etrade.com",
    "tdameritrade.com", "merrilledge.com", "interactivebrokers.com",
    # Tax / accounting
    "turbotax.intuit.com", "hrblock.com", "quickbooks.intuit.com", "irs.gov",
]
_SUSPICIOUS_TLDS = {"tk", "ml", "ga", "cf", "gq", "top", "click", "zip", "mov", "xyz", "country"}
_URL_SHORTENERS = {"bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly", "is.gd", "buff.ly", "adf.ly", "shorte.st"}

def _levenshtein(a: str, b: str) -> int:
    if a == b:
        return 0
    if not a: return len(b)
    if not b: return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, cb in enumerate(b, 1):
            cur[j] = min(cur[j-1] + 1, prev[j] + 1, prev[j-1] + (ca != cb))
        prev = cur
    return prev[-1]

class ScanUrlInput(BaseModel):
    url: str

@api.post("/scan/url")
async def scan_url(body: ScanUrlInput):
    raw = body.url.strip()
    if not raw:
        raise HTTPException(status_code=400, detail="URL is required")
    if not raw.lower().startswith(("http://", "https://")):
        raw = "https://" + raw
    try:
        p = urlparse(raw)
        host = (p.hostname or "").lower()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not parse URL")

    checks = []  # list of {id, label, status, detail}
    def add(cid, label, status, detail):
        checks.append({"id": cid, "label": label, "status": status, "detail": detail})

    # 1) HTTPS check
    if p.scheme == "https":
        add("https", "HTTPS encryption", "pass", "Site uses HTTPS — traffic is encrypted.")
    else:
        add("https", "HTTPS encryption", "fail", "Site uses plain HTTP. NEVER enter financial credentials on HTTP pages.")

    # 2) Raw IP address
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host or ""):
        add("ip", "Domain vs IP", "fail", "URL uses a raw IP address instead of a domain — extremely suspicious.")
    else:
        add("ip", "Domain vs IP", "pass", "URL uses a proper domain name.")

    # 3) Punycode / IDN homograph
    if host and "xn--" in host:
        add("punycode", "Internationalized / punycode domain", "warn", "Domain uses punycode. Attackers hide lookalike Cyrillic/Greek characters this way. Verify manually.")
    else:
        add("punycode", "Internationalized / punycode domain", "pass", "No punycode detected.")

    # 4) @ in URL
    if "@" in raw.split("://", 1)[-1]:
        add("atsign", "@ symbol in URL", "fail", "URL contains '@' — classic phishing trick used to hide the real destination.")
    else:
        add("atsign", "@ symbol in URL", "pass", "No @ character in URL.")

    # 5) Number of subdomains / length
    parts = host.split(".") if host else []
    if len(parts) >= 5:
        add("subdomains", "Subdomain depth", "warn", f"{len(parts) - 2} subdomains nested — unusually deep. Double-check this is the real site.")
    else:
        add("subdomains", "Subdomain depth", "pass", "Normal domain structure.")

    # 6) Suspicious TLD
    tld = parts[-1] if parts else ""
    if tld in _SUSPICIOUS_TLDS:
        add("tld", "Top-level domain", "warn", f".{tld} is commonly abused for free, short-lived phishing domains.")
    else:
        add("tld", "Top-level domain", "pass", f".{tld} is a common, trusted TLD.")

    # 7) URL shortener
    base = ".".join(parts[-2:]) if len(parts) >= 2 else host
    if base in _URL_SHORTENERS:
        add("shortener", "URL shortener", "warn", "URL is a shortener — expand it before trusting. Hover before clicking.")
    else:
        add("shortener", "URL shortener", "pass", "Not a known URL shortener.")

    # 8) Length
    if len(raw) > 120:
        add("length", "URL length", "warn", f"URL is {len(raw)} chars long — suspicious. Phishing URLs often hide payloads in long query strings.")
    else:
        add("length", "URL length", "pass", "URL length is normal.")

    # 9) Typosquat check
    typo_hits = []
    if base:
        for target in _TARGET_DOMAINS:
            d = _levenshtein(base, target)
            if 0 < d <= 2:
                typo_hits.append((target, d))
    if typo_hits:
        best = sorted(typo_hits, key=lambda x: x[1])[0]
        add("typosquat", "Lookalike domain detection", "fail",
            f"Domain '{base}' is {best[1]} character(s) away from '{best[0]}' — this is a strong typosquatting signal. DO NOT enter credentials.")
    else:
        add("typosquat", "Lookalike domain detection", "pass", "No typosquatting against common banks / exchanges detected.")

    # 10) SSL cert verification (attempt connect)
    ssl_ok = None
    cert_days_left = None
    if p.scheme == "https" and host and not re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host):
        try:
            ctx = ssl.create_default_context()
            with socket.create_connection((host, p.port or 443), timeout=4) as sock:
                with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                    cert = ssock.getpeercert()
                    exp = datetime.strptime(cert["notAfter"], "%b %d %H:%M:%S %Y %Z").replace(tzinfo=timezone.utc)
                    cert_days_left = (exp - datetime.now(timezone.utc)).days
                    ssl_ok = True
        except Exception as e:
            ssl_ok = False
            add("ssl", "TLS certificate", "warn", f"Could not validate TLS certificate ({str(e)[:60]}). Might be a self-signed or expired cert.")
        if ssl_ok:
            if cert_days_left is not None and cert_days_left < 14:
                add("ssl", "TLS certificate", "warn", f"TLS cert expires in {cert_days_left} days — legitimate sites renew well in advance.")
            else:
                add("ssl", "TLS certificate", "pass", f"Valid TLS certificate ({cert_days_left} days remaining).")

    # Summary
    fails = sum(1 for c in checks if c["status"] == "fail")
    warns = sum(1 for c in checks if c["status"] == "warn")
    verdict = "safe"
    if fails >= 1:
        verdict = "danger"
    elif warns >= 2:
        verdict = "caution"
    elif warns == 1:
        verdict = "caution"

    return {
        "url": raw,
        "host": host,
        "checks": checks,
        "summary": {
            "pass": sum(1 for c in checks if c["status"] == "pass"),
            "warn": warns,
            "fail": fails,
        },
        "verdict": verdict,
        "scanned_at": now_iso(),
    }

@api.get("/scan/ip")
async def scan_ip(request: Request):
    # Return the caller's public IP (from X-Forwarded-For via ingress) for the UI
    xff = request.headers.get("x-forwarded-for", "")
    ip = xff.split(",")[0].strip() if xff else (request.client.host if request.client else "unknown")
    return {"ip": ip}

# ----------------------- STARTUP: SEED DATA -----------------------
async def seed_if_empty():
    existing_admin = await db.users.find_one({"role": "admin"})
    if existing_admin:
        logger.info("Database already seeded")
        return
    logger.info("Seeding initial data...")

    # ---- Admin ----
    admin = {
        "id": str(uuid.uuid4()),
        "name": "Admin",
        "email": "admin@globaltechsolutions.com",
        "password": hash_password("Admin@123"),
        "role": "admin",
        "phone": "+1-800-555-0100",
        "created_at": now_iso(),
    }
    await db.users.insert_one(admin.copy())

    # ---- Technicians (real names from history + extras) ----
    tech_defs = [
        {"name": "Mike Ungaro", "email": "mike@globaltechsolutions.com", "specialization": "Microsoft Ecosystem & Enterprise Support", "phone": "631-572-8941", "rating": 4.9, "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", "certification": "Microsoft Certified", "certification_number": "#493919583919", "level": "Level 2 Technician", "joined_year": 2014, "bio": "Mike is a Microsoft Certified, Level 2 Technician who has been with Global Tech Solutions since 2014. He specializes in Microsoft Windows, Microsoft 365, Exchange, and enterprise endpoint management."},
        {"name": "Ravi Ojha", "email": "ravi@globaltechsolutions.com", "specialization": "Network Security & Cybersecurity", "phone": "+1-800-555-0201", "rating": 4.9, "photo": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80", "certification": "CompTIA Security+ & Cisco CCNA", "certification_number": "#CS-2091745", "level": "Level 3 Technician", "joined_year": 2015, "bio": "Cybersecurity and network specialist — firewalls, VPNs, and crypto wallet protection."},
        {"name": "Sumit Kumar", "email": "sumit@globaltechsolutions.com", "specialization": "Endpoint Security & Firewalls", "phone": "+1-800-555-0202", "rating": 4.8, "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", "certification": "SonicWall SNSA & CompTIA Network+", "certification_number": "#SW-448120", "level": "Level 2 Technician", "joined_year": 2017, "bio": "SonicWall-certified specialist focused on firewalls, EDR, and endpoint hardening."},
        {"name": "Sonam Sharma", "email": "sonam@globaltechsolutions.com", "specialization": "Software & Email Support", "phone": "+1-800-555-0203", "rating": 4.9, "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80", "certification": "Microsoft 365 Certified: Modern Desktop Administrator", "certification_number": "#MS-7781302", "level": "Level 2 Technician", "joined_year": 2018, "bio": "Email recovery, Microsoft 365, and productivity software specialist."},
        {"name": "David Chen", "email": "david@globaltechsolutions.com", "specialization": "On-Site & Hardware Repair", "phone": "+1-800-555-0204", "rating": 4.7, "photo": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80", "certification": "CompTIA A+", "certification_number": "#CA-2214098", "level": "Level 1 Technician", "joined_year": 2021, "bio": "Hardware, repairs, and on-site dispatch across the tri-state area."},
    ]
    techs = []
    for t in tech_defs:
        doc = {
            "id": str(uuid.uuid4()),
            "name": t["name"],
            "email": t["email"],
            "password": hash_password("Tech@123"),
            "role": "technician",
            "phone": t["phone"],
            "specialization": t["specialization"],
            "rating": t["rating"],
            "photo": t["photo"],
            "certification": t["certification"],
            "certification_number": t["certification_number"],
            "level": t["level"],
            "joined_year": t["joined_year"],
            "bio": t["bio"],
            "created_at": now_iso(),
        }
        await db.users.insert_one(doc.copy())
        techs.append(doc)

    mike = next(t for t in techs if t["name"] == "Mike Ungaro")
    ravi = next(t for t in techs if t["name"] == "Ravi Ojha")
    sumit = next(t for t in techs if t["name"] == "Sumit Kumar")
    sonam = next(t for t in techs if t["name"] == "Sonam Sharma")

    # ---- Real Customer: Sanford Burstein ----
    sandy = {
        "id": str(uuid.uuid4()),
        "name": "Sanford Burstein",
        "email": "bsandy2@aol.com",
        "password": hash_password("Welcome@2026"),  # initial password – can be reset
        "role": "customer",
        "phone": "201-927-5444",
        "address": "36 Greenwood Ave, West Orange, NJ 07052",
        "previous_address": "520 Adams St, Hoboken, NJ 07030",
        "customer_since": "2017-11-02",
        "status": "Existing (VIP)",
        "active_plan": "Lifetime VIP Plan",
        "assigned_technician_id": mike["id"],
        "payment_method": "Check on file",
        "photo": None,
        "created_at": now_iso(),
        "notes": "Long-standing customer since Nov 2017. Upgraded to Lifetime VIP in Oct 2025.",
    }
    await db.users.insert_one(sandy.copy())

    # ---- Sanford's Real Service History & Invoices ----
    sandy_history = [
        {"date": "2017-11-02", "amount": 400.00, "method": "Check", "tech": None, "label": "Initial registration & Setup", "status": "new", "service_type": "Initial Registration", "address": "520 Adams St, Hoboken, NJ 07030"},
        {"date": "2018-06-27", "amount": 874.27, "method": "Check", "tech": ravi["id"], "label": "MS Service Renewal", "status": "existing", "service_type": "Microsoft Service Renewal", "address": "520 Adams St, Hoboken, NJ 07030"},
        {"date": "2019-02-18", "amount": 529.99, "method": "Check", "tech": ravi["id"], "label": "Service Renewal", "status": "existing", "service_type": "Support Renewal", "address": "520 Adams St, Hoboken, NJ 07030"},
        {"date": "2020-11-12", "amount": 349.99, "method": "Check", "tech": sumit["id"], "label": "2 Years IP Hider Security", "status": "existing", "service_type": "Security Software — 2 Year IP Hider", "address": "36 Greenwood Ave, West Orange, NJ 07052"},
        {"date": "2022-03-30", "amount": 607.99, "method": "Check", "tech": ravi["id"], "label": "5 Years Support + All Devices Covered", "status": "existing", "service_type": "5-Year Full Device Coverage", "address": "36 Greenwood Ave, West Orange, NJ 07052"},
        {"date": "2023-10-31", "amount": 426.00, "method": "Check", "tech": sumit["id"], "label": "3 Years SonicWall Security", "status": "existing", "service_type": "3-Year SonicWall Security Subscription", "address": "36 Greenwood Ave, West Orange, NJ 07052"},
        {"date": "2025-10-15", "amount": 6400.00, "method": "Check", "tech": ravi["id"], "label": "Lifetime VIP Plan: 10 Devices (Transferable) + Dedicated Technician + Crypto Protection + Crypto Expert Direct Access", "status": "existing", "service_type": "Lifetime VIP Plan", "address": "36 Greenwood Ave, West Orange, NJ 07052"},
    ]
    for idx, h in enumerate(sandy_history, 1):
        inv = {
            "id": str(uuid.uuid4()),
            "invoice_number": f"GTS-{h['date'][:7].replace('-', '')}-{idx:04d}",
            "customer_id": sandy["id"],
            "amount": h["amount"],
            "description": h["label"],
            "items": [{"name": h["service_type"], "qty": 1, "price": h["amount"]}],
            "status": "paid",
            "payment_method": h["method"],
            "due_date": h["date"],
            "paid_at": h["date"],
            "created_at": h["date"] + "T10:00:00+00:00",
            "service_address": h["address"],
        }
        await db.invoices.insert_one(inv.copy())
        if h["tech"]:
            await db.service_history.insert_one({
                "id": str(uuid.uuid4()),
                "customer_id": sandy["id"],
                "technician_id": h["tech"],
                "appointment_id": None,
                "service_type": h["service_type"],
                "description": h["label"],
                "notes": f"Completed by technician on {h['date']}.",
                "report": None,
                "completed_at": h["date"] + "T16:30:00+00:00",
            })

    # Upcoming appointment for Sanford (with Mike — his dedicated advisor)
    await db.appointments.insert_one({
        "id": str(uuid.uuid4()),
        "customer_id": sandy["id"],
        "technician_id": mike["id"],
        "service_type": "Quarterly VIP Health Check",
        "description": "Scheduled VIP quarterly review: firewall audit, device health sweep, crypto wallet security review.",
        "scheduled_date": (datetime.now(timezone.utc) + timedelta(days=14)).isoformat(),
        "scheduled_time": "11:00 AM",
        "status": "scheduled",
        "notes": "",
        "urgency": "normal",
        "created_at": now_iso(),
    })

    # Sample ticket
    await db.tickets.insert_one({
        "id": str(uuid.uuid4()),
        "ticket_number": f"TKT-{str(uuid.uuid4())[:8].upper()}",
        "customer_id": sandy["id"],
        "assigned_to": mike["id"],
        "status": "open",
        "subject": "Outlook intermittently asks for password",
        "description": "Outlook on my desktop keeps prompting for the AOL password every few hours. Happens on Wi-Fi only.",
        "priority": "medium",
        "category": "email",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    })

    # ---- A couple of sample customers so admin views are useful ----
    sample_customers = [
        {"name": "Linda Martinez", "email": "linda.m@example.com", "phone": "973-555-0192", "address": "14 Elm St, Newark, NJ", "tech": sonam["id"], "plan": "Pro Annual"},
        {"name": "Michael Thompson", "email": "mike.t@example.com", "phone": "212-555-0167", "address": "88 Broadway, New York, NY", "tech": sumit["id"], "plan": "Business"},
        {"name": "Aisha Patel", "email": "aisha.p@example.com", "phone": "908-555-0143", "address": "27 Oak Ln, Edison, NJ", "tech": sonam["id"], "plan": "Basic"},
    ]
    for sc in sample_customers:
        cid = str(uuid.uuid4())
        await db.users.insert_one({
            "id": cid,
            "name": sc["name"],
            "email": sc["email"],
            "password": hash_password("Customer@123"),
            "role": "customer",
            "phone": sc["phone"],
            "address": sc["address"],
            "active_plan": sc["plan"],
            "assigned_technician_id": sc["tech"],
            "payment_method": "Visa ending 4242",
            "photo": None,
            "created_at": now_iso(),
            "customer_since": "2023-04-15",
            "status": "Existing",
        })
        # one invoice
        await db.invoices.insert_one({
            "id": str(uuid.uuid4()),
            "invoice_number": f"GTS-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}",
            "customer_id": cid,
            "amount": 199.00,
            "description": f"{sc['plan']} subscription",
            "items": [{"name": sc["plan"], "qty": 1, "price": 199.00}],
            "status": "paid",
            "payment_method": "Credit Card",
            "due_date": now_iso()[:10],
            "paid_at": now_iso(),
            "created_at": now_iso(),
        })

    # ---- Plans ----
    plans = [
        {"id": str(uuid.uuid4()), "name": "Basic", "price": 49, "duration": "per month", "description": "Remote support essentials for individuals.", "popular": False,
         "features": ["Remote support (business hours)", "Virus & malware removal", "Email & software setup", "1 device covered", "Email support response in 24h"]},
        {"id": str(uuid.uuid4()), "name": "Pro", "price": 99, "duration": "per month", "description": "Priority support for power users and freelancers.", "popular": True,
         "features": ["Priority remote support (7 days)", "Up to 3 devices", "Antivirus + VPN included", "Data backup (50GB)", "1 on-site visit / year", "Chat with dedicated technician"]},
        {"id": str(uuid.uuid4()), "name": "Business", "price": 299, "duration": "per month", "description": "Managed IT for small and mid-sized businesses.", "popular": False,
         "features": ["Up to 15 endpoints", "Managed firewall & SonicWall", "24/7 emergency response", "Cloud backup (500GB)", "Quarterly on-site visits", "Dedicated account manager"]},
        {"id": str(uuid.uuid4()), "name": "Lifetime VIP", "price": 6400, "duration": "one-time", "description": "White-glove lifetime coverage — 10 devices transferable.", "popular": False,
         "features": ["10 devices (transferable)", "Dedicated technician", "🛡️ Crypto Protection & wallet audits", "👤 SEC-approved advisor direct access", "Unlimited remote & on-site", "Lifetime coverage, no renewals"]},
    ]
    for p in plans:
        await db.plans.insert_one(p.copy())

    # ---- Services catalog ----
    services = [
        {"id": str(uuid.uuid4()), "slug": "crypto-protection", "title": "Crypto Wallet Protection", "icon": "Bitcoin", "desc": "Hardware-wallet setup, seed-phrase vaulting, MFA, and isolated device hardening. Protects MetaMask, Ledger, Trezor, and exchange accounts.", "featured": True, "category": "Crypto"},
        {"id": str(uuid.uuid4()), "slug": "crypto-insurance", "title": "Crypto Insurance Coverage", "icon": "ShieldCheck", "desc": "Coverage against wallet compromise, phishing, and SIM-swap theft through our insurance partners. Up to $100,000 per incident for VIP members.", "featured": True, "category": "Crypto"},
        {"id": str(uuid.uuid4()), "slug": "crypto-expert", "title": "Crypto Expert Direct Access", "icon": "UserCheck", "desc": "Direct line to a certified crypto security expert for audits, wallet reviews, and recovery. Priority 24/7 response for VIP clients.", "featured": True, "category": "Crypto"},
        {"id": str(uuid.uuid4()), "slug": "crypto-recovery", "title": "Crypto Recovery & Forensics", "icon": "Search", "desc": "Assist with forensic tracing, exchange communication, and recovery process for stolen or mis-sent crypto (case-by-case).", "featured": True, "category": "Crypto"},
        {"id": str(uuid.uuid4()), "slug": "cybersecurity", "title": "Cyber Security", "icon": "ShieldCheck", "desc": "24/7 threat monitoring, managed endpoint protection, ransomware defense, dark-web breach alerts, and quarterly security audits.", "featured": True, "category": "Security"},
        {"id": str(uuid.uuid4()), "slug": "computer-repair", "title": "Computer Repair & Troubleshooting", "icon": "Laptop", "desc": "Desktop and laptop diagnostics, hardware repair, OS reinstall, performance tuning for Windows and Mac."},
        {"id": str(uuid.uuid4()), "slug": "phone-tablet", "title": "Phone & Tablet Support", "icon": "Smartphone", "desc": "iPhone, iPad, and Android setup, backup, data transfer, screen and battery recommendations."},
        {"id": str(uuid.uuid4()), "slug": "email-setup", "title": "Email Setup & Recovery", "icon": "Mail", "desc": "Gmail, Outlook, AOL, Yahoo, and business email setup, account recovery, migration, and sync."},
        {"id": str(uuid.uuid4()), "slug": "software-install", "title": "Software Installation", "icon": "Download", "desc": "Office, accounting, design, and business apps — correctly licensed and configured for your workflow."},
        {"id": str(uuid.uuid4()), "slug": "antivirus-malware", "title": "Antivirus & Malware Removal", "icon": "ShieldCheck", "desc": "Deep-scan malware removal, ransomware mitigation, and endpoint hardening with managed AV."},
        {"id": str(uuid.uuid4()), "slug": "wifi-network", "title": "Wi-Fi & Network Setup", "icon": "Wifi", "desc": "Home and office Wi-Fi, mesh networks, VLANs, VPNs, and SonicWall managed firewalls."},
        {"id": str(uuid.uuid4()), "slug": "backup-recovery", "title": "Data Backup & Recovery", "icon": "HardDrive", "desc": "Local and cloud backup strategy, disaster recovery planning, and file / drive recovery."},
        {"id": str(uuid.uuid4()), "slug": "remote-support", "title": "Remote Technical Support", "icon": "MonitorSmartphone", "desc": "Secure one-click remote sessions — most issues resolved in under an hour."},
        {"id": str(uuid.uuid4()), "slug": "on-site", "title": "On-Site Technician Visits", "icon": "MapPin", "desc": "Scheduled or same-day on-site technician dispatch across the tri-state area."},
        {"id": str(uuid.uuid4()), "slug": "business-it", "title": "Business IT Support", "icon": "Building2", "desc": "Managed IT, help desk, cybersecurity, cloud migration, and compliance for growing teams."},
    ]
    for s in services:
        await db.services.insert_one(s.copy())

    # ---- Reviews ----
    reviews = [
        {"id": str(uuid.uuid4()), "name": "Sanford B.", "location": "West Orange, NJ", "rating": 5, "text": "Been with Global Tech since 2017. Ravi and the team are responsive, honest, and take care of my devices and crypto security like it's their own. Worth every penny.", "service": "Lifetime VIP", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "name": "Linda M.", "location": "Newark, NJ", "rating": 5, "text": "Sonam fixed an email issue I'd been fighting for weeks in under 20 minutes. Fantastic service.", "service": "Email Recovery", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "name": "Michael T.", "location": "New York, NY", "rating": 5, "text": "Our small firm moved all IT to Global Tech. Firewall, backup, and help-desk — everything just works now.", "service": "Business IT", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "name": "Aisha P.", "location": "Edison, NJ", "rating": 5, "text": "Called on a Sunday after a ransomware scare. On a remote session in 15 minutes. Cleaned and hardened.", "service": "Malware Removal", "created_at": now_iso()},
        {"id": str(uuid.uuid4()), "name": "Robert H.", "location": "Hoboken, NJ", "rating": 4, "text": "Professional, clear pricing, no upsell. Exactly what I want from a tech company.", "service": "Computer Repair", "created_at": now_iso()},
    ]
    for r in reviews:
        await db.reviews.insert_one(r.copy())

    # ---- Software catalog (AI + Business + Dev + Security) ----
    software_catalog = [
        # ---- AI ----
        {"name": "ChatGPT Plus", "provider": "OpenAI", "category": "AI Assistants", "description": "Access to GPT-4o, advanced voice, image generation, file uploads.", "highlights": ["Priority access", "GPT-4o + o1", "Custom GPTs", "Advanced Data Analysis"], "price_note": "$20/mo · Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["productivity","research","writing"]},
        {"name": "ChatGPT Team / Pro", "provider": "OpenAI", "category": "AI Assistants", "description": "Higher limits, deep research, o1-pro reasoning, team workspace.", "highlights": ["o1-pro + Deep Research","Extended context","Team admin"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["enterprise","research"]},
        {"name": "Claude Pro", "provider": "Anthropic", "category": "AI Assistants", "description": "Claude Sonnet 4.5 & Opus access with Projects and larger context.", "highlights": ["200K context","Projects","Priority bandwidth"], "price_note": "$20/mo · Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["writing","coding","analysis"]},
        {"name": "Google Gemini Advanced", "provider": "Google", "category": "AI Assistants", "description": "Gemini 3 Pro with Google Workspace integration and 2TB Drive.", "highlights": ["Gemini 3 Pro","2TB storage","Workspace sidebar"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["gmail","docs","search"]},
        {"name": "Microsoft Copilot Pro", "provider": "Microsoft", "category": "AI Assistants", "description": "AI copilot across Word, Excel, Outlook, PowerPoint.", "highlights": ["Office integration","Designer access","Priority GPT-4"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["office","productivity"]},
        {"name": "Perplexity Pro", "provider": "Perplexity AI", "category": "AI Assistants", "description": "AI-powered research with real-time web sources and citations.", "highlights": ["Unlimited Pro searches","File uploads","Multiple models"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["research","web"]},
        {"name": "Midjourney Standard", "provider": "Midjourney", "category": "AI Creative", "description": "Premium AI image generation with fast hours and stealth mode.", "highlights": ["15h fast/mo","Stealth mode","Commercial use"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["design","image"]},
        {"name": "Runway Gen-4", "provider": "Runway", "category": "AI Creative", "description": "Text-to-video and video editing with Gen-4 AI models.", "highlights": ["Gen-4 video","Unlimited videos","4K upscale"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["video","marketing"]},
        {"name": "ElevenLabs Creator", "provider": "ElevenLabs", "category": "AI Creative", "description": "Premium AI voice cloning and text-to-speech.", "highlights": ["Instant voice cloning","100K characters/mo","Commercial license"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["voice","audio"]},
        {"name": "GitHub Copilot Pro", "provider": "GitHub", "category": "AI Developer", "description": "AI pair programmer in your IDE with multi-model support.", "highlights": ["Unlimited completions","GPT-4o + Claude + o1","Copilot Chat"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["coding","developer"]},
        {"name": "Cursor Pro", "provider": "Cursor", "category": "AI Developer", "description": "AI-first code editor with agent mode and codebase chat.", "highlights": ["500 fast requests","Agent mode","Custom models"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["coding","developer"]},
        {"name": "Notion AI", "provider": "Notion", "category": "AI Productivity", "description": "AI writing & summarizing inside Notion workspace.", "highlights": ["Q&A on your docs","Writer & translator","Unlimited"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["notes","writing"]},
        {"name": "Grammarly Premium", "provider": "Grammarly", "category": "AI Productivity", "description": "Advanced grammar, tone, and clarity suggestions with AI assist.", "highlights": ["Tone suggestions","Plagiarism check","Generative AI"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["writing"]},

        # ---- Accounting & Finance ----
        {"name": "QuickBooks Online Plus", "provider": "Intuit", "category": "Accounting", "description": "Full small-business accounting, invoicing, and bill tracking.", "highlights": ["5 users","Project profitability","Inventory tracking","Time tracking"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["accounting","invoicing"]},
        {"name": "QuickBooks Self-Employed", "provider": "Intuit", "category": "Accounting", "description": "Mileage, expenses, and Schedule C for freelancers.", "highlights": ["Mileage tracking","Quarterly estimates","TurboTax bundle"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["freelance","tax"]},
        {"name": "TurboTax Premier", "provider": "Intuit", "category": "Accounting", "description": "Personal tax filing with investment and rental income support.", "highlights": ["Investment income","Rental property","Live assist option"], "price_note": "Included in Pro/Business/VIP (seasonal)", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["tax","personal"]},
        {"name": "TurboTax Business", "provider": "Intuit", "category": "Accounting", "description": "Tax filing for S-Corp, C-Corp, partnerships, and LLCs.", "highlights": ["Business returns","K-1 forms","Asset depreciation"], "price_note": "Included in Business/VIP (seasonal)", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["tax","business"]},
        {"name": "FreshBooks Plus", "provider": "FreshBooks", "category": "Accounting", "description": "Cloud invoicing, time tracking, and expenses for service businesses.", "highlights": ["Unlimited invoices","50 clients","Automated recurring"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["invoicing"]},

        # ---- Productivity / Office ----
        {"name": "Microsoft 365 Business Standard", "provider": "Microsoft", "category": "Productivity", "description": "Word, Excel, Outlook, Teams, OneDrive 1TB, SharePoint.", "highlights": ["Full desktop Office","Teams","1TB OneDrive","Business email"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["office","email"]},
        {"name": "Google Workspace Business Standard", "provider": "Google", "category": "Productivity", "description": "Gmail, Docs, Drive, Meet with custom domain and 2TB storage.", "highlights": ["Custom domain email","2TB / user","Meet recording"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["email","docs"]},
        {"name": "Adobe Creative Cloud All Apps", "provider": "Adobe", "category": "Productivity", "description": "Photoshop, Illustrator, Premiere, InDesign, Lightroom, and more.", "highlights": ["20+ apps","Adobe Fonts","Adobe Firefly AI","100GB cloud"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["design","video"]},
        {"name": "Canva Pro", "provider": "Canva", "category": "Productivity", "description": "Pro templates, brand kits, background remover, Magic Studio AI.", "highlights": ["Magic Studio AI","Brand kit","Scheduler","100M+ assets"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["design","social"]},
        {"name": "Zoom Pro", "provider": "Zoom", "category": "Productivity", "description": "Unlimited meetings up to 30 hrs, cloud recording, AI Companion.", "highlights": ["30hr meetings","Cloud recording","AI summary"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["meetings","video"]},
        {"name": "Slack Pro", "provider": "Salesforce/Slack", "category": "Productivity", "description": "Unlimited message history, huddles, Slack AI.", "highlights": ["Full history","Huddles + screen share","Slack AI"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["collaboration","chat"]},
        {"name": "Dropbox Professional", "provider": "Dropbox", "category": "Productivity", "description": "3TB secure cloud storage with advanced sharing and Dash AI.", "highlights": ["3TB storage","Smart Sync","Dash AI search"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["storage","cloud"]},

        # ---- CRM / Sales ----
        {"name": "HubSpot Starter Suite", "provider": "HubSpot", "category": "CRM & Sales", "description": "CRM, marketing, sales, and service starter bundle.", "highlights": ["CRM for 3 seats","Email marketing","Live chat","Deals pipeline"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["crm","marketing"]},
        {"name": "Salesforce Starter", "provider": "Salesforce", "category": "CRM & Sales", "description": "Entry-level Salesforce CRM for small teams.", "highlights": ["Guided onboarding","Email integration","Reports"], "price_note": "Included in Business/VIP (custom)", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["crm","enterprise"]},

        # ---- Website Development ----
        {"name": "Website Development (Tier 1)", "provider": "Global Tech Solutions", "category": "Website Development", "description": "Custom 5-page business website built by our team with 1 year of hosting and revisions.", "highlights": ["5 pages","Mobile responsive","SEO basics","SSL + hosting (1 yr)","Up to 3 revisions"], "price_note": "Starter tier — ask your advisor", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["website","custom"]},
        {"name": "Website Development (Tier 2)", "provider": "Global Tech Solutions", "category": "Website Development", "description": "Mid-tier site with CMS, blog, contact flows, and advanced SEO.", "highlights": ["Up to 12 pages","CMS-driven","Blog + newsletter","Advanced SEO","E-commerce ready"], "price_note": "Quote on request", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["website","cms"]},
        {"name": "WordPress Business Hosting", "provider": "WordPress.com", "category": "Website Development", "description": "Premium managed WordPress hosting with plugins and themes.", "highlights": ["Plugins/themes","200GB","Custom CSS","Google Analytics"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["wordpress","hosting"]},
        {"name": "Shopify Basic", "provider": "Shopify", "category": "Website Development", "description": "Full online store with cart, checkout, and shipping.", "highlights": ["Online store","Unlimited products","Abandoned cart","24/7 support"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["ecommerce"]},
        {"name": "Figma Professional", "provider": "Figma", "category": "Website Development", "description": "Collaborative UI/UX design and prototyping tool.", "highlights": ["Unlimited files","Dev mode","FigJam","Shared libraries"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["design","ui-ux"]},

        # ---- Security & Privacy ----
        {"name": "1Password Business", "provider": "1Password", "category": "Security", "description": "Team password manager with SSO and vault sharing.", "highlights": ["Unlimited vaults","SSO","Travel mode","1GB docs"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["passwords","security"]},
        {"name": "NordVPN Plus", "provider": "Nord Security", "category": "Security", "description": "Premium VPN with threat protection and password manager.", "highlights": ["6 devices","Threat Protection","NordPass included"], "price_note": "Included in all plans", "included_in_plans": ["Basic","Pro","Business","Lifetime VIP"], "tags": ["vpn","privacy"]},
        {"name": "Bitdefender Total Security", "provider": "Bitdefender", "category": "Security", "description": "Multi-device antivirus, firewall, and VPN.", "highlights": ["5–10 devices","Anti-ransomware","Parental controls","VPN (200MB)"], "price_note": "Included in all plans", "included_in_plans": ["Basic","Pro","Business","Lifetime VIP"], "tags": ["antivirus"]},
        {"name": "Malwarebytes Premium", "provider": "Malwarebytes", "category": "Security", "description": "Advanced malware, ransomware, and exploit protection.", "highlights": ["Real-time shield","Anti-exploit","Browser Guard"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["antivirus","malware"]},
        {"name": "SonicWall Capture Client", "provider": "SonicWall", "category": "Security", "description": "Enterprise-grade endpoint protection managed by our team.", "highlights": ["Managed by advisor","Rollback","DNS filtering","Cloud console"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["enterprise","firewall"]},

        # ---- Backup & Storage ----
        {"name": "Backblaze Computer Backup", "provider": "Backblaze", "category": "Backup & Storage", "description": "Unlimited personal computer backup to the cloud.", "highlights": ["Unlimited data","Version history","Mobile access"], "price_note": "Included in Pro/Business/VIP", "included_in_plans": ["Pro","Business","Lifetime VIP"], "tags": ["backup"]},
        {"name": "iDrive Business", "provider": "iDrive", "category": "Backup & Storage", "description": "Team cloud backup with server and VM support.", "highlights": ["5 TB","Unlimited computers","Server + VM backup"], "price_note": "Included in Business/VIP", "included_in_plans": ["Business","Lifetime VIP"], "tags": ["backup","server"]},
    ]

    # ---- Software logo domains (used by frontend via clearbit) ----
    logo_domains = {
        "ChatGPT Plus": "openai.com",
        "ChatGPT Team / Pro": "openai.com",
        "Claude Pro": "anthropic.com",
        "Google Gemini Advanced": "gemini.google.com",
        "Microsoft Copilot Pro": "microsoft.com",
        "Perplexity Pro": "perplexity.ai",
        "Midjourney Standard": "midjourney.com",
        "Runway Gen-4": "runwayml.com",
        "ElevenLabs Creator": "elevenlabs.io",
        "GitHub Copilot Pro": "github.com",
        "Cursor Pro": "cursor.com",
        "Notion AI": "notion.so",
        "Grammarly Premium": "grammarly.com",
        "QuickBooks Online Plus": "quickbooks.intuit.com",
        "QuickBooks Self-Employed": "quickbooks.intuit.com",
        "TurboTax Premier": "turbotax.intuit.com",
        "TurboTax Business": "turbotax.intuit.com",
        "FreshBooks Plus": "freshbooks.com",
        "Microsoft 365 Business Standard": "microsoft.com",
        "Google Workspace Business Standard": "workspace.google.com",
        "Adobe Creative Cloud All Apps": "adobe.com",
        "Canva Pro": "canva.com",
        "Zoom Pro": "zoom.us",
        "Slack Pro": "slack.com",
        "Dropbox Professional": "dropbox.com",
        "HubSpot Starter Suite": "hubspot.com",
        "Salesforce Starter": "salesforce.com",
        "Website Development (Tier 1)": "globaltechsolutions.com",
        "Website Development (Tier 2)": "globaltechsolutions.com",
        "WordPress Business Hosting": "wordpress.com",
        "Shopify Basic": "shopify.com",
        "Figma Professional": "figma.com",
        "1Password Business": "1password.com",
        "NordVPN Plus": "nordvpn.com",
        "Bitdefender Total Security": "bitdefender.com",
        "Malwarebytes Premium": "malwarebytes.com",
        "SonicWall Capture Client": "sonicwall.com",
        "Backblaze Computer Backup": "backblaze.com",
        "iDrive Business": "idrive.com",
    }

    for idx, item in enumerate(software_catalog):
        item["id"] = str(uuid.uuid4())
        item["created_at"] = now_iso()
        item["logo_domain"] = logo_domains.get(item["name"], "globaltechsolutions.com")
        # simple icon hint for frontend
        cat_icons = {
            "AI Assistants": "Sparkles", "AI Creative": "Wand2", "AI Developer": "Code2",
            "AI Productivity": "Zap", "Accounting": "Receipt", "Productivity": "Briefcase",
            "CRM & Sales": "Users", "Website Development": "Globe", "Security": "ShieldCheck",
            "Backup & Storage": "HardDrive",
        }
        item["icon"] = cat_icons.get(item["category"], "Package")
        await db.software_catalog.insert_one(item.copy())

    # ---- Sanford sample devices (PC info) ----
    await db.devices.insert_one({
        "id": str(uuid.uuid4()),
        "customer_id": sandy["id"],
        "name": "Sandy's Main Desktop",
        "type": "Desktop PC",
        "os": "Windows 11 Pro",
        "manufacturer": "Dell",
        "model": "OptiPlex 7090",
        "serial": "DELL-7X8Z9A2",
        "processor": "Intel Core i7-11700",
        "ram": "32 GB DDR4",
        "storage": "1 TB NVMe SSD + 2 TB HDD",
        "notes": "Primary workstation — email, Outlook, QuickBooks. Protected by SonicWall Capture Client.",
        "created_at": now_iso(), "updated_at": now_iso(),
    })
    await db.devices.insert_one({
        "id": str(uuid.uuid4()),
        "customer_id": sandy["id"],
        "name": "Sandy's Laptop",
        "type": "Laptop",
        "os": "Windows 11 Home",
        "manufacturer": "Lenovo",
        "model": "ThinkPad T14s Gen 4",
        "serial": "LNV-PF4C21ZB",
        "processor": "Intel Core i7-1365U",
        "ram": "16 GB LPDDR5",
        "storage": "512 GB SSD",
        "notes": "Travel laptop — VPN + Bitdefender installed.",
        "created_at": now_iso(), "updated_at": now_iso(),
    })

    # ---- Sandy's Loyalty Gift Allowance (he chooses himself) ----
    # As a Lifetime VIP customer he's entitled to 10 premium software subscriptions
    # he can pick from the catalog whenever he wants.
    await db.users.update_one({"id": sandy["id"]}, {"$set": {"gift_allowance": 10, "gift_allowance_source": "Lifetime VIP loyalty benefit"}})

    logger.info("Seed complete.")

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def on_startup():
    await seed_if_empty()

@app.on_event("shutdown")
async def on_shutdown():
    client.close()
