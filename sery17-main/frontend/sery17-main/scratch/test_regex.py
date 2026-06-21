import json
import re
from pymongo import MongoClient
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
from server import get_flexible_project_query

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]

proj_name = "مشروع المحافظات الغربية - القطاع الأوسط"
query = get_flexible_project_query(proj_name)

res = {
    "regex": query,
    "count": db.reports.count_documents({"project": query}),
    "exact_count": db.reports.count_documents({"project": proj_name})
}
with open("test_regex.json", "w", encoding="utf-8") as f:
    json.dump(res, f, ensure_ascii=False, indent=2)
