# Help Center (Coinbase User Support Platform)

A Coinbase-inspired support experience with:
- React frontend
- FastAPI backend
- MongoDB ticket persistence

## Structure

- `frontend/` React + Vite UI
- `backend/` FastAPI API

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Implemented Sections

1. Hero/Header with Help Center branding
2. Coinbase News section (placeholder list linked to Coinbase Blog)
3. Scam Protection education section
4. New Features section
5. Careers section with official link + sample listings
6. Structured Chat/Support Bot intake flow and live-agent handoff message
7. Footer disclaimer

## Disclaimer

We are not affiliated with Coinbase. We are an independent community helping Coinbase users.
