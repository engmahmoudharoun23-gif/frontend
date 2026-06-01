import os
import sys
from pymongo import MongoClient

# Add backend to path to import
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))
from server import get_flexible_project_query

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]

project_name = "مشروع المحافظات الغربية - القطاع الأوسط"
regex_query = get_flexible_project_query(project_name)

query = {
    "is_deleted": {"$ne": True},
    "project": regex_query
}

reports = list(db.reports.find(query))
print(f"Count from DB directly: {len(reports)}")
if len(reports) > 0:
    for i, r in enumerate(reports):
        print(f"Report {i+1} project: {r.get('project', 'NO PROJECT FIELD')}")
else:
    print("NO REPORTS FOUND FOR THIS REGEX!")
    print(regex_query)
