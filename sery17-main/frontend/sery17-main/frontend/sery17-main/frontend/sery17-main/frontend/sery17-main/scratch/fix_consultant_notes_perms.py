import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    
    # Update all admins and level 2 users
    users = await db.users.find({
        '$or': [
            {'role': 'admin'},
            {'can_create_subusers': True}
        ]
    }).to_list(100)
    
    for u in users:
        update_data = {}
        
        # 1. Update global permissions
        perms = u.get('permissions', [])
        if 'consultant_notes' not in perms:
            perms.append('consultant_notes')
            update_data['permissions'] = perms
            
        # 2. Update project permissions
        project_perms = u.get('project_permissions', {})
        modified_pp = False
        for proj, pp_list in project_perms.items():
            if pp_list is None:
                pp_list = []
            if 'consultant_notes' not in pp_list:
                pp_list.append('consultant_notes')
                project_perms[proj] = pp_list
                modified_pp = True
                
        if modified_pp:
            update_data['project_permissions'] = project_perms
            
        if update_data:
            await db.users.update_one({'_id': u['_id']}, {'$set': update_data})
            print(f"Updated permissions for user: {u['username']}")
            
    print("Done")
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
