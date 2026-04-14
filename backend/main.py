from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import os

app = FastAPI(title="Help Center API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGODB_DB", "help_center")

client = MongoClient(MONGODB_URI)
collection = client[DB_NAME]["tickets"]


IssueType = Literal[
    "Login issues",
    "Withdrawal problems",
    "Account locked",
    "Verification delays",
    "Unauthorized transactions",
    "Other",
]


class TicketCreate(BaseModel):
    account_name: str = Field(min_length=1, max_length=120)
    issue_type: IssueType
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "help-center-api"}


@app.post("/tickets")
def create_ticket(ticket: TicketCreate) -> dict:
    payload = ticket.model_dump()
    payload["created_at"] = datetime.utcnow().isoformat()
    payload["status"] = "queued"

    try:
        result = collection.insert_one(payload)
    except PyMongoError as exc:
        raise HTTPException(status_code=500, detail="Failed to store ticket") from exc

    return {
        "ticket_id": str(result.inserted_id),
        "message": "Connecting to live agent...",
    }
