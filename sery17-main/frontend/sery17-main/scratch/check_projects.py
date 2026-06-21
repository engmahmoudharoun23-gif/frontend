from pymongo import MongoClient
import json

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]

print("Collections:", db.list_collection_names())
projects = list(db["projects"].find({}, {"_id": 0}))
print("Projects:", json.dumps(projects, ensure_ascii=False))

users = list(db["users"].find({"username": "admin"}, {"_id": 0}))
print("Admin User:", json.dumps(users, ensure_ascii=False))
