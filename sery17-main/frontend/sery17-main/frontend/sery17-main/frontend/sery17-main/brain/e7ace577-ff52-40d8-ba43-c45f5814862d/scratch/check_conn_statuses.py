from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def check_conn_statuses():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    print("--- Water Connection Statuses ---")
    ws = await db.water_connections.distinct("request_status")
    print(ws)
    
    print("\n--- Sewage Connection Statuses ---")
    ss = await db.sewage_connections.distinct("request_status")
    print(ss)

    client.close()

if __name__ == "__main__":
    asyncio.run(check_conn_statuses())
