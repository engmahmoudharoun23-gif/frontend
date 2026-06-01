import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def main():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- QUALITY REPORTS ---")
    quality = await db.quality_reports.find().to_list(100)
    for q in quality:
        print(f"ID: {q.get('_id')}, Project: '{q.get('project')}', Gov: '{q.get('governorate')}', Date: '{q.get('date')}'")
        
    print("\n--- SAFETY REPORTS ---")
    safety = await db.safety_reports.find().to_list(100)
    for s in safety:
        print(f"ID: {s.get('_id')}, Project: '{s.get('project')}', Gov: '{s.get('governorate')}', Date: '{s.get('date')}'")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
