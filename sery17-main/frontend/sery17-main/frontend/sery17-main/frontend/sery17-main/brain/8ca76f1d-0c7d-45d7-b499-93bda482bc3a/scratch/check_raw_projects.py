import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check_raw_projects():
    mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    db_name = os.environ.get("DB_NAME", "wfm_reports")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    projects = await db.projects.find({}, {"_id": 0, "name": 1}).to_list(100)
    print("Project names in projects collection:")
    for p in projects:
        name = p.get("name", "")
        print(f"Name: {name} | Hex: {name.encode('utf-8').hex()}")
    
    reports_projects = await db.reports.distinct("project")
    print("\nProject names in reports collection:")
    for rp in reports_projects:
        if rp:
            print(f"Name: {rp} | Hex: {rp.encode('utf-8').hex()}")

    water_projects = await db.water_connections.distinct("project")
    print("\nProject names in water_connections collection:")
    for wp in water_projects:
        if wp:
            print(f"Name: {wp} | Hex: {wp.encode('utf-8').hex()}")

    sewage_projects = await db.sewage_connections.distinct("project")
    print("\nProject names in sewage_connections collection:")
    for sp in sewage_projects:
        if sp:
            print(f"Name: {sp} | Hex: {sp.encode('utf-8').hex()}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_projects())
