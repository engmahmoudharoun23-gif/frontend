from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/')
db = client['wfm_reports']

print(f"Users: {db['users'].count_documents({})}")
print(f"Team Members: {db['team_members'].count_documents({})}")
