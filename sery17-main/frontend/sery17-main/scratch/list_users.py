from pymongo import MongoClient
import json

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]

users = list(db["users"].find({"role": {"$ne": "admin"}}, {"_id": 0, "hashed_password": 0, "permissions": 0}))
print(json.dumps(users, ensure_ascii=False, indent=2))
