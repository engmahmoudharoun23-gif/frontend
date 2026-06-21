import requests
import json

def test_api():
    try:
        # We need a token. Let's see if we can find one or just check the database raw.
        # Actually, let's just use the database verification script again but print the first report number.
        from motor.motor_asyncio import AsyncIOMotorClient
        import asyncio

        async def check_raw():
            client = AsyncIOMotorClient("mongodb://localhost:27017")
            db = client["wfm_reports"]
            report = await db.reports.find_one()
            print(f"First Report in DB: {json.dumps(report, default=str, indent=2)}")
            
            conn = await db.water_connections.find_one()
            print(f"First Water Connection in DB: {json.dumps(conn, default=str, indent=2)}")
            
            client.close()
            
        asyncio.run(check_raw())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
