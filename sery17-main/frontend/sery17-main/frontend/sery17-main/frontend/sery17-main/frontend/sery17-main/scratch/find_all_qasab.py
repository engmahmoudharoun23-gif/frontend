import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    qasab = '\u0627\u0644\u0642\u0635\u0628'
    
    collections = await db.list_collection_names()
    for col_name in collections:
        docs = await db[col_name].find({}).to_list(None)
        for doc in docs:
            # simple string representation search
            if qasab in str(doc):
                print(f"Found in {col_name}, ID: {doc.get('id', doc.get('_id'))}")

asyncio.run(main())
