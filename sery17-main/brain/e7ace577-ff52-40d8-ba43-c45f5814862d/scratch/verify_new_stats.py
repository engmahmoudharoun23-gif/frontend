import requests
import json

def test_stats(project_name):
    url = f"http://localhost:8001/api/reports/stats?project={project_name}"
    # We need a token if it's protected, but let's try if it works or if I need to mock auth
    # Actually, the server has get_current_user. 
    # I'll use a direct DB query instead to simulate what the API does.
    pass

from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def verify_stats():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    projects = ["ايصال", "ايصال الرياض"]
    
    for project in projects:
        print(f"\n--- Stats for Project: {project} ---")
        
        # This simulates the new logic in server.py
        conn_filter = {"project": {"$in": [project, f"مشروع {project}"]}}
        
        water_total = await db.water_connections.count_documents(conn_filter)
        sewage_total = await db.sewage_connections.count_documents(conn_filter)
        
        reports_total = await db.reports.count_documents({"project": project, "is_deleted": False})
        
        print(f"Reports (Active): {reports_total}")
        print(f"Water Connections: {water_total}")
        print(f"Sewage Connections: {sewage_total}")
        print(f"Grand Total: {reports_total + water_total + sewage_total}")

    client.close()

if __name__ == "__main__":
    asyncio.run(verify_stats())
