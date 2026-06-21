
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

async def check_user():
    load_dotenv('backend/.env')
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    user = await db.users.find_one({"username": {"$regex": "Abdelmonem", "$options": "i"}})
    
    if user:
        print(f"User Found: {user['username']}")
        print(f"Full Doc: {repr(user)}")
        
        # Check subordinates
        subs = await db.users.find({"created_by": user['id']}).to_list(None)
        sub_ids = [s['id'] for s in subs] + [user['id']]
        print(f"Sub IDs: {sub_ids}")
        
        # Check all water connections
        all_water = await db.water_connections.find({"is_deleted": {"$ne": True}}).to_list(None)
        print(f"Total active water connections in DB: {len(all_water)}")
        for c in all_water:
            print(f"  Water Conn: ID={c.get('id')} | CreatedBy={c.get('created_by')} | Project={repr(c.get('project'))} | Area={repr(c.get('area'))} | Gov={repr(c.get('governorate'))}")

        # Check all sewage connections
        all_sewage = await db.sewage_connections.find({"is_deleted": {"$ne": True}}).to_list(None)
        print(f"Total active sewage connections in DB: {len(all_sewage)}")
        for c in all_sewage:
            print(f"  Sewage Conn: ID={c.get('id')} | CreatedBy={c.get('created_by')} | Project={repr(c.get('project'))} | Area={repr(c.get('area'))} | Gov={repr(c.get('governorate'))}")

    else:
        print("User not found")
    
    client.close()

asyncio.run(check_user())
