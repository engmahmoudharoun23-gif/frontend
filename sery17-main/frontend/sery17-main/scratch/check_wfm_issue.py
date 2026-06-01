import asyncio
import motor.motor_asyncio

client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
db = client['sery17']

async def check():
    # Check users with visual distortion project
    users = await db.users.find({}, {'_id':0, 'username':1, 'role':1, 'can_create_subusers':1, 'projects':1, 'governorates':1}).to_list(100)
    print("=== Users with التشوه البصري project ===")
    for u in users:
        projs = u.get('projects', [])
        if any('تشوه' in p for p in projs):
            print('User:', u)
    
    print("\n=== Sample reports from visual distortion project ===")
    reports = await db.reports.find(
        {'project': {'$regex': 'تشوه', '$options': 'i'}, 'is_deleted': {'$ne': True}},
        {'_id':0, 'id':1, 'status':1, 'wfm_closed':1, 'project':1}
    ).limit(3).to_list(3)
    for r in reports:
        print('Report:', r)
    
    print("\n=== All projects ===")
    projects = await db.projects.find({}, {'_id':0, 'name':1}).to_list(100)
    for p in projects:
        print('Project:', p)

asyncio.run(check())
