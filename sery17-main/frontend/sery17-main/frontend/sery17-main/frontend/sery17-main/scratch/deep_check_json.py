
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import json

async def deep_check():
    load_dotenv('backend/.env')
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    user = await db.users.find_one({"username": {"$regex": "Abdelmonem", "$options": "i"}})
    
    results = {}
    if user:
        results['user'] = {
            'username': user['username'],
            'full_name': user['full_name'],
            'projects': user.get('projects'),
            'governorates': user.get('governorates'),
            'id': user['id']
        }
        
        subs = await db.users.find({"created_by": user['id']}).to_list(None)
        sub_ids = [s['id'] for s in subs] + [user['id']]
        results['sub_ids'] = sub_ids
        
        water = await db.water_connections.find({"is_deleted": {"$ne": True}}).to_list(None)
        results['water_connections'] = []
        for c in water:
            results['water_connections'].append({
                'id': c.get('id'),
                'created_by': c.get('created_by'),
                'project': c.get('project'),
                'area': c.get('area'),
                'governorate': c.get('governorate')
            })
            
        sewage = await db.sewage_connections.find({"is_deleted": {"$ne": True}}).to_list(None)
        results['sewage_connections'] = []
        for c in sewage:
            results['sewage_connections'].append({
                'id': c.get('id'),
                'created_by': c.get('created_by'),
                'project': c.get('project'),
                'area': c.get('area'),
                'governorate': c.get('governorate')
            })
            
    with open('scratch/deep_check_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    client.close()

asyncio.run(deep_check())
