
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
        print(f"User Found: {user['username']} ({user['full_name']})")
        print(f"Role: {user.get('role')}")
        print(f"Projects: {user.get('projects')}")
        print(f"Governorates: {user.get('governorates')}")
        print(f"Permissions: {user.get('permissions')}")
        
        # Check connections counts
        project_names = user.get('projects', [])
        for proj in project_names:
            water_count = await db.water_connections.count_documents({"project": proj, "is_deleted": {"$ne": True}})
            sewage_count = await db.sewage_connections.count_documents({"project": proj, "is_deleted": {"$ne": True}})
            print(f"Project: {proj}")
            print(f"  Water Count (Total): {water_count}")
            print(f"  Sewage Count (Total): {sewage_count}")
            
            # Check hierarchy filter
            # Level 2 usually sees their own and their subs
            # Let's see who are their subs
            subs = await db.users.find({"created_by": user['id']}).to_list(None)
            sub_ids = [s['id'] for s in subs] + [user['id']]
            
            water_hier_count = await db.water_connections.count_documents({"project": proj, "is_deleted": {"$ne": True}, "created_by": {"$in": sub_ids}})
            sewage_hier_count = await db.sewage_connections.count_documents({"project": proj, "is_deleted": {"$ne": True}, "created_by": {"$in": sub_ids}})
            print(f"  Water Count (Hierarchy): {water_hier_count}")
            print(f"  Sewage Count (Hierarchy): {sewage_hier_count}")
            
            # Print connection IDs for debugging
            water_conns = await db.water_connections.find({"project": proj, "is_deleted": {"$ne": True}}).to_list(None)
            print(f"  Water Conn IDs: {[c.get('id') or str(c['_id']) for c in water_conns]}")
            for c in water_conns:
                print(f"    - ID: {c.get('id')} | CreatedBy: {c.get('created_by')} | Area: {repr(c.get('area'))} | Gov: {repr(c.get('governorate'))}")

    else:
        print("User not found")
    
    client.close()

asyncio.run(check_user())
