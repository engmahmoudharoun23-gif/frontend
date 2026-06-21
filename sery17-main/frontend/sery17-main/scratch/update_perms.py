import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    db = AsyncIOMotorClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0').wfm_reports
    
    users = await db.users.find({'role': {'$ne': 'admin'}}).to_list(100)
    
    updates_made = 0
    for u in users:
        print(f"User: {u.get('username')}")
        pp = u.get('project_permissions', {})
        needs_update = False
        
        for proj, perms in pp.items():
            has_safety = 'safety_reports' in perms
            has_violations = 'violations' in perms
            has_work_permits = 'work_permits' in perms
            
            if has_safety and not has_violations:
                perms.append('violations')
                needs_update = True
            
            if has_safety and not has_work_permits:
                perms.extend(['work_permits', 'work_permits_edit', 'work_permits_delete'])
                needs_update = True
                
        if needs_update:
            await db.users.update_one({'_id': u['_id']}, {'$set': {'project_permissions': pp}})
            print(f"  -> Updated permissions for user {u.get('username')}")
            updates_made += 1
            
    print(f"Total users updated: {updates_made}")

if __name__ == '__main__':
    asyncio.run(main())
