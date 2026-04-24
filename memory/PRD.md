# Global Tech Solutions — PRD

## Problem Statement
Build a full-stack professional website for Global Tech Solutions, an independent technical support company.
Pages: Home, About, Services, Pricing, Book, Support/FAQs, Contact, Privacy, Terms, Login, Register.
Dashboards: Customer, Technician, Admin — with role-based auth, invoices, appointments, tickets, messaging.
Real customer: Sanford Burstein (since Nov 2017) with full 7-year service/payment history.

## Architecture
- **Backend:** FastAPI + Motor (MongoDB) + JWT (custom) + bcrypt; single `server.py`.
- **Frontend:** React 19 + Vite/CRA + Tailwind + shadcn/ui + Recharts.
- **Design:** Modern SaaS; Plus Jakarta Sans (headings) + Manrope (body); blue (#0B3B82) / white / dark gray.
- **Auth:** Role-based JWT, three roles (customer, technician, admin).

## Personas
- Customers: Book, view invoices/history/tickets, chat with assigned technician.
- Technicians: View schedule, update appointment status, upload report, chat with customers.
- Admin: Analytics, customers/techs CRUD, invoices, payments, tickets, plans, bookings, contact.

## Implemented (Feb 2026)
- All 11 public pages built and styled
- Auth system (register, login with role tabs, JWT, protected routes)
- Customer dashboard (7 sections: overview, appointments, invoices, history, tickets, messages, profile)
- Technician portal (5 sections: overview, customers, schedule, tickets, messages)
- Admin console (10 sections: analytics, customers, technicians, appointments, invoices, payments, tickets, plans, bookings, contact)
- Real Sanford Burstein profile with 7 invoices + 6 service history entries + 1 upcoming VIP appointment + 1 open ticket
- Seeded: 4 technicians, 4 plans, 10 services, 5 reviews, 3 additional customers
- Independence disclaimer in footer, privacy, terms
- Invoice download (plain-text)

## Backlog / Not yet
- P1: Email notifications (SendGrid/Resend) on booking/invoice
- P1: File upload for technician reports (object storage)
- P1: Stripe payment processing (currently UI-only, marked as such)
- P2: Password reset flow
- P2: Technician profile photo upload
- P2: PDF invoice generation
- P2: Customer-specific plan assignment from admin

## Next Tasks
- Optional: Stripe / email / real file uploads when keys available
