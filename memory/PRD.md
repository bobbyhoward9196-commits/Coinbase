# Global Tech Solutions — PRD

## Problem Statement
Build a full-stack professional website for Global Tech Solutions, an independent technical support company.
Pages: Home, About, Services, Pricing, Book, Support/FAQs, Contact, Privacy, Terms, Login, Register.
Dashboards: Customer, Technician, Admin — with role-based auth, invoices, appointments, tickets, messaging.
Real customer: Sanford Burstein (since Nov 2017) with full 7-year service/payment history.

## Architecture
- **Backend:** FastAPI + Motor (MongoDB) + JWT (custom) + bcrypt; single `server.py`.
- **Frontend:** React 19 + CRA + Tailwind + shadcn/ui + Recharts.
- **Design:** Modern SaaS; Plus Jakarta Sans (headings) + Manrope (body); blue (#0B3B82) / white / dark gray.
- **Auth:** Role-based JWT, three roles (customer, technician, admin).

## Personas
- Customers: Book, view invoices/history/tickets, chat with assigned technician, manage devices, request premium software.
- Technicians: View schedule, update appointment status, upload report, chat with customers, review software requests.
- Admin: Analytics, customers/techs CRUD, invoices, payments, tickets, plans, bookings, contact, software-request approval.

## Implemented (Feb 2026)

### Iteration 1 — Core
- All 11 public pages built and styled
- Auth system (register, login with role tabs, JWT, protected routes)
- Customer dashboard (Overview, Appointments, Invoices, History, Tickets, Messages, Profile)
- Technician portal (Overview, Customers, Schedule, Tickets, Messages)
- Admin console (Analytics, Customers, Technicians, Appointments, Invoices, Payments, Tickets, Plans, Bookings, Contact)
- Real Sanford Burstein profile with 7 invoices ($9,588.24) + 6 service history entries + 1 upcoming VIP appointment + 1 open ticket
- Seeded: 4 technicians, 4 plans, 10 services, 5 reviews, 3 additional customers
- Independence disclaimer in footer, privacy, terms
- Invoice download (plain-text)
- ✅ Backend test: 37/37 passed

### Iteration 2 — Software Catalog, Devices, Logo Polish
- **Replaced logo** with uploaded Global Tech Solutions branding (globe + blue/gray wordmark)
- **Hid Emergent badge** (CSS rule in index.html targeting known selectors)
- **Removed demo credentials panel** from Login page
- **Site title** → "Global Tech Solutions — Reliable Technical Support"
- **Software Catalog (39 items in 10 categories):**
  - AI Assistants: ChatGPT Plus, ChatGPT Team/Pro, Claude Pro, Gemini Advanced, Copilot Pro, Perplexity Pro
  - AI Creative: Midjourney, Runway Gen-4, ElevenLabs
  - AI Developer: GitHub Copilot Pro, Cursor Pro
  - AI Productivity: Notion AI, Grammarly Premium
  - Accounting: QuickBooks Online Plus, QuickBooks Self-Employed, TurboTax Premier, TurboTax Business, FreshBooks
  - Productivity: Microsoft 365, Google Workspace, Adobe CC, Canva Pro, Zoom Pro, Slack Pro, Dropbox
  - CRM & Sales: HubSpot, Salesforce Starter
  - Website Development: Tier 1 custom build, Tier 2 CMS build, WordPress hosting, Shopify Basic, Figma
  - Security: 1Password, NordVPN, Bitdefender, Malwarebytes, SonicWall Capture Client
  - Backup & Storage: Backblaze, iDrive
- **Customer `/dashboard/software`:** browse catalog, filter by category, search, click Request → advisor reviews
- **Customer `/dashboard/devices`:** full CRUD for PC/device info (name, type, OS, mfr, model, serial, CPU, RAM, storage, notes)
- **Admin `/admin/software-requests`:** review/approve/deny with advisor notes, assign advisors
- Seeded Sanford with 2 devices (Dell OptiPlex, Lenovo ThinkPad) + 1 approved QuickBooks request
- ✅ Backend test: 29/29 passed

### Iteration 4 — Diagnostic & Remediation Reports (Apr 2026)
- New `diagnostic_reports` MongoDB collection storing report metadata + relative file path
- Real 4-page branded PDF generated via reportlab (`/app/backend/diagnostic_report.py`)
  - Page 1: Cover + executive summary table (severity HIGH, status REMEDIATED)
  - Page 2: Findings inventory table (SSN/email/banking exposure) + threat-flow diagram
  - Page 3: 8-action remediation table (server destroyed, FBI/FTC/SSA notified, bureaus frozen, EDR redeployed, Microsoft node, dark-web monitoring rebaselined)
  - Page 4: Microsoft secure-node architecture diagram + plain-English explanation + sign-off block
- Backend endpoints: `GET /api/diagnostic-reports` (list), `GET /api/diagnostic-reports/{id}/download` (auth-gated PDF stream, regenerates on disk-miss)
- PDF auto-seeded for Sanford on backend startup (idempotent)
- Frontend:
  - New sidebar entry "Diagnostic Reports" (FileWarning icon)
  - New page `/dashboard/reports` with severity/status badges + branded download card
  - Top-of-overview alert callout with "View report" CTA whenever any report exists
- ✅ Customer overview & reports page rendered cleanly via screenshot test

## Backlog / Not yet
- P1: File upload for technician reports (object storage)
- P1: Stripe payment processing (currently UI-only)
- P1: Verify custom Resend sender domain so OTPs deliver to real customer inboxes
- P2: Password reset flow (also via Resend)
- P2: Technician profile photo upload
- P2: PDF invoice generation (currently TXT)
- P2: Admin/tech create devices on customer behalf
- P2: Partial PATCH for devices (currently requires full payload)
- P2: Email notifications on booking/invoice/software-approval (reuse Resend integration)

## Next Tasks
- Whatever the user chooses next — optional: Stripe payments / object-storage / Resend domain verification.
