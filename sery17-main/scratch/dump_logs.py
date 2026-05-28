import pymongo

client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['wfm_db']
logs = list(db['activity_logs'].find().sort('_id', -1).limit(20))
for log in logs:
    print(f"Action: {log.get('action')}, Details: {log.get('details')}")
