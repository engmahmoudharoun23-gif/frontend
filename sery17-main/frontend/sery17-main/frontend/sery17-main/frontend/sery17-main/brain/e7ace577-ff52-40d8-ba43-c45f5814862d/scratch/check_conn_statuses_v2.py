from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import sys
import codecs

if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

async def check_conn_statuses():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Water Connection Statuses ---")
    ws = await db.water_connections.distinct("request_status")
    for s in ws:
        print(f"Status: '{s}'")
    
    print("\n--- Sewage Connection Statuses ---")
    ss = await db.sewage_connections.distinct("request_status")
    for s in ss:
        print(f"Status: '{s}'")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn_statuses())
