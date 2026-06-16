from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def list_collections():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    collections = await db.list_collection_names()
    print(f"Collections in wfm_reports: {collections}")
    
    for coll in collections:
        count = await db[coll].count_documents({})
        print(f"Collection: {coll} | Count: {count}")

    client.close()

if __name__ == "__main__":
    asyncio.run(list_collections())
