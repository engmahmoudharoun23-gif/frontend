import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def search_db():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    colls = await db.list_collection_names()
    for c in colls:
        docs = await db[c].find().to_list(1000)
        for d in docs:
            s = str(d)
            if "بيت الخبر" in s:
                print(f"Found in {c}: {d.get('username') or d.get('name') or d.get('id')}")
    client.close()

if __name__ == "__main__":
    asyncio.run(search_db())
