import pymongo, json

ATLAS = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = pymongo.MongoClient(ATLAS, serverSelectionTimeoutMS=8000)
db = client['wfm_reports']

projects = list(db['projects'].find({}, {'_id': 0}))
print('=== Projects in Atlas ===')
for p in projects:
    print(' -', json.dumps(p, ensure_ascii=False))

print()
print('=== project_governorates ===')
pg = list(db['project_governorates'].find({}, {'_id': 0, 'project': 1, 'governorate': 1}).limit(20))
for row in pg:
    print(' -', json.dumps(row, ensure_ascii=False))

print()
print('=== project_cards sample ===')
cards = list(db['project_cards'].find({}, {'_id': 0, 'project': 1, 'label': 1}).limit(10))
for c in cards:
    print(' -', json.dumps(c, ensure_ascii=False))

client.close()
