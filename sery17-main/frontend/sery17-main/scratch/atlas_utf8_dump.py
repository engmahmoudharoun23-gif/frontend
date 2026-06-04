import pymongo
import sys

ATLAS = 'mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0'
client = pymongo.MongoClient(ATLAS, serverSelectionTimeoutMS=8000)
db = client['wfm_reports']

# Write to file with UTF-8
with open('scratch/atlas_projects_utf8.txt', 'w', encoding='utf-8') as f:
    projects = list(db['projects'].find({}, {'_id': 0}))
    f.write('=== Projects ===\n')
    for p in projects:
        f.write(f"  name={p.get('name','')} | desc={p.get('description','')}\n")
    
    f.write('\n=== project_cards (unique projects) ===\n')
    pcs = db['project_cards'].distinct('project')
    for pc in pcs:
        f.write(f"  {pc}\n")
    
    f.write('\n=== reports (unique projects) ===\n')
    rp = db['reports'].distinct('project')
    for r in rp:
        f.write(f"  {r}\n")
    
    f.write('\n=== project_governorates (unique projects) ===\n')
    pg = db['project_governorates'].distinct('project')
    for p2 in pg:
        f.write(f"  {p2}\n")

print('Done - check scratch/atlas_projects_utf8.txt')
client.close()
