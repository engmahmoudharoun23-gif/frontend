import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_raw_bytes():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    print("--- Collection: users ---")
    async for user in db.users.find():
        print(f"Username: {user.get('username')}")
        for key in ['full_name', 'title']:
            val = user.get(key)
            if val:
                print(f"  {key}: {repr(val)} | Bytes: {val.encode('utf-8', errors='replace').hex()}")
                
    print("\n--- Collection: project_cards ---")
    async for card in db.project_cards.find():
        print(f"Project: {repr(card.get('project'))} | Bytes: {card.get('project').encode('utf-8', errors='replace').hex() if card.get('project') else 'None'}")

    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_bytes())
