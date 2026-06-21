from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def check_eisal_details():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    project = "ايصال"
    names = [project, f"مشروع {project}"]
    
    print(f"--- Water Connections for {names} ---")
    async for c in db.water_connections.find({"project": {"$in": names}}):
        print(f"ID: {c.get('id')} | Project: {c.get('project')} | Request: {c.get('request_number')}")
        
    print(f"\n--- Sewage Connections for {names} ---")
    async for c in db.sewage_connections.find({"project": {"$in": names}}):
        print(f"ID: {c.get('id')} | Project: {c.get('project')} | Request: {c.get('request_number')}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_eisal_details())
