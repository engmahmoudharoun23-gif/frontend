import asyncio
import os
import sys
sys.path.append(r"d:\sery17-main\sery17-main\backend")

from motor.motor_asyncio import AsyncIOMotorClient
# We need to import ReportResponse from server.py, but it's easier to just copy the model here to test
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class ReportResponse(BaseModel):
    id: str
    report_number: str
    report_date: Optional[datetime] = None
    license_number: str
    report_type: str
    status: str
    governorate: str
    project: str
    depth_meters: float
    diameter_mm: float
    contractor: str
    latitude: Optional[str]
    longitude: Optional[str]
    asphalt_license_issued: bool
    wfm_closed: bool = False
    notes: Optional[str] = None
    consultant_note: Optional[str] = None
    consultant_note_reply: Optional[str] = None
    consultant_note_replied_by: Optional[str] = None
    consultant_note_processed: bool = False
    images: List[str] = []
    created_by: str
    created_by_name: Optional[str] = None
    created_at: datetime
    start_date: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    is_deleted: bool = False
    deleted_at: Optional[datetime] = None
    deleted_by: Optional[str] = None
    deleted_by_name: Optional[str] = None
    review_status: str = "بانتظار المراجعة"
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None

async def main():
    MONGO_URL = "mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['wfm_reports']
    
    # Find the most recently created report
    reports = await db.reports.find().sort("created_at", -1).limit(1).to_list(None)
    
    for doc in reports:
        print("Testing doc validation...")
        try:
            r = ReportResponse(**doc)
            print("Validation SUCCESS!")
        except Exception as e:
            print(f"Validation FAILED: {e}")

asyncio.run(main())
