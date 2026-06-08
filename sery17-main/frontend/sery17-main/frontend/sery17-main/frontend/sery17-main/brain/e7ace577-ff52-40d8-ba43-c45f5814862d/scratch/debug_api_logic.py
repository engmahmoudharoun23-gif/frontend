import requests
import json

def get_stats(project):
    # This won't work because of authentication.
    # I'll use a script that mocks the current_user in server.py logic.
    pass

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from datetime import datetime, timedelta

# Mocking the User object from server.py (approximately)
class MockUser:
    def __init__(self):
        self.role = 'admin'
        self.id = 'admin-id'
        self.projects = []
        self.governorates = []

async def debug_api_logic():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    current_user = MockUser()
    project = "ايصال"
    month = "2026-05"
    
    # Simulating get_reports_stats logic
    query_filter = {"project": project, "is_deleted": False}
    
    # For month filter
    year_val, month_val = map(int, month.split('-'))
    date_from_obj = datetime(year_val, month_val, 1)
    if month_val == 12:
        date_to_obj = datetime(year_val + 1, 1, 1)
    else:
        date_to_obj = datetime(year_val, month_val + 1, 1)
    
    start_str = date_from_obj.strftime("%Y-%m-%dT%H:%M:%S")
    end_str = date_to_obj.strftime("%Y-%m-%dT%H:%M:%S")
    
    query_filter["$or"] = [
        {"created_at": {"$gte": start_str, "$lt": end_str}},
        {"created_at": {"$gte": date_from_obj, "$lt": date_to_obj}},
        {"added_at": {"$gte": date_from_obj, "$lt": date_to_obj}}
    ]

    print(f"Query Filter for Reports: {query_filter}")
    reports_count = await db.reports.count_documents(query_filter)
    print(f"Reports Count: {reports_count}")

    # Connection filter
    conn_filter = {"project": {"$in": [project, f"مشروع {project}"]}}
    date_filter_conn = {
        "$or": [
            {"created_at": {"$gte": start_str, "$lt": end_str}},
            {"created_at": {"$gte": date_from_obj, "$lt": date_to_obj}}
        ]
    }
    conn_filter.update(date_filter_conn)
    print(f"Conn Filter: {conn_filter}")
    
    water_total = await db.water_connections.count_documents(conn_filter)
    sewage_total = await db.sewage_connections.count_documents(conn_filter)
    
    print(f"Water: {water_total}, Sewage: {sewage_total}")

    client.close()

if __name__ == "__main__":
    asyncio.run(debug_api_logic())
