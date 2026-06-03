from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["wfm_reports"]

# Find all distinct projects from reports
report_projects = db.reports.distinct("project")
print(f"Projects found in reports: {report_projects}")

# Find all distinct projects from water connections
water_projects = db.water_connections.distinct("project")
print(f"Projects found in water_connections: {water_projects}")

# Find all distinct projects from sewage connections
sewage_projects = db.sewage_connections.distinct("project")
print(f"Projects found in sewage_connections: {sewage_projects}")

all_projects = set()
for p in report_projects + water_projects + sewage_projects:
    if p and str(p).strip():
        all_projects.add(str(p).strip())

print(f"All unique projects: {all_projects}")

# Insert them into projects collection if they are missing
existing_projects = [p["name"] for p in db.projects.find()]
for proj in all_projects:
    if proj not in existing_projects:
        db.projects.insert_one({"name": proj})
        print(f"Inserted missing project into db.projects: {proj}")

# Fallback basic projects if completely empty
basic_projects = [
    "مشروع المحافظات الغربية -القطاع الأوسط",
    "مشروع المحافظات الشمالية -القطاع الأوسط",
    "مشروع المحافظات الجنوبية -القطاع الأوسط",
    "مشروع كشف التسربات وإصلاحها",
    "ايصال",
    "ايصال الرياض",
    "مشروع معالجة التشوه البصري"
]

for p in basic_projects:
    if p not in all_projects and p not in existing_projects:
        db.projects.insert_one({"name": p})
        print(f"Inserted basic project into db.projects: {p}")

print("Done sync projects")
