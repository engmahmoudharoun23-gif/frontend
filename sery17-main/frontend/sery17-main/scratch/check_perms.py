import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def main():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['wfm_reports']
    users = await db.users.find({'role': {'$ne': 'admin'}, 'can_create_subusers': True}).to_list(10)
    for u in users:
        print(f"User: {u['username']}")
        print(f"  project_perms: {u.get('project_permissions', {})}")
    client.close()

if __name__ == '__main__':
    asyncio.run(main())
