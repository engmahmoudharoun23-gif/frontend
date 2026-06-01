import motor.motor_asyncio
import asyncio

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    with open("d:/sery17-main/sery17-main/scratch/connections_details_unicode.txt", "w", encoding="utf-8") as out:
        out.write("--- WATER CONNECTIONS DETAIL ---\n")
        async for doc in db.water_connections.find():
            out.write(f"ID: {doc.get('id')}, Project: {repr(doc.get('project'))} ({doc.get('project')}), Gov: {repr(doc.get('governorate'))} ({doc.get('governorate')}), CreatedBy: {doc.get('created_by')}, CreatedByName: {doc.get('created_by_name')}\n")
            
        out.write("\n--- SEWAGE CONNECTIONS DETAIL ---\n")
        async for doc in db.sewage_connections.find():
            out.write(f"ID: {doc.get('id')}, Project: {repr(doc.get('project'))} ({doc.get('project')}), Gov: {repr(doc.get('governorate'))} ({doc.get('governorate')}), CreatedBy: {doc.get('created_by')}, CreatedByName: {doc.get('created_by_name')}\n")

if __name__ == "__main__":
    asyncio.run(main())
