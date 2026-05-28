import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_statuses_hex():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    statuses = await db.water_connections.distinct("request_status")
    for s in statuses:
        if s:
            hex_str = " ".join([f"{ord(c):04x}" for c in s])
            print(f"Status: '{s}' (Hex: {hex_str})")
        else:
            print("Status: None")
            
    client.close()

if __name__ == "__main__":
    asyncio.run(check_statuses_hex())
