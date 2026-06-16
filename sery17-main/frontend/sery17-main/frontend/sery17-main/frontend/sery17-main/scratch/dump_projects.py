import json
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]
projects = list(db["projects"].find({}, {"_id": 0}))

with open("d:\\sery17-main\\sery17-main\\scratch\\projects_dump.json", "w", encoding="utf-8") as f:
    json.dump(projects, f, ensure_ascii=False, indent=2)
