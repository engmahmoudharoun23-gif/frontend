import json
from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]
projects = db.reports.distinct("project")
with open("projects.json", "w", encoding="utf-8") as f:
    json.dump(projects, f, ensure_ascii=False)
