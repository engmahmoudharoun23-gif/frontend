import pymongo, json

ATLAS = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = pymongo.MongoClient(ATLAS, serverSelectionTimeoutMS=8000)
db = client['wfm_reports']

projects = list(db['projects'].find({}, {'_id': 0}))
print('=== Projects in Atlas ===')
for p in projects:
    name = p.get('name', '')
    desc = p.get('description', '')
    print(f'  name={repr(name)} | desc={repr(desc)}')

print()
cards = list(db['project_cards'].find({}, {'_id': 0, 'project': 1, 'label': 1}).limit(10))
print('=== project_cards sample ===')
for c in cards:
    print(f'  project={repr(c.get("project"))} label={repr(c.get("label","")[:30])}')

client.close()
