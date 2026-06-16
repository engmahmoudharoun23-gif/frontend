from pymongo import MongoClient

client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
db = client.wfm_reports

# The user wants to restore "مشروع المحافظات الغربية"
new_name = "مشروع المحافظات الغربية"

# Update projects
db.projects.update_one(
    {"name": "مشروع إصلاح شبكات  المياة والصرف ( المقاول الموسي )"},
    {"$set": {"name": new_name}}
)

# Also there might be a project called "مشروع المحافظات الغربية" already? Let's check.
# If so, we just update the reports.
# Update reports
result = db.reports.update_many(
    {"project": "مشروع إصلاح شبكات  المياة والصرف ( المقاول الموسي )"},
    {"$set": {"project": new_name}}
)

# Let's also check if any users have the old name in their projects list
users_updated = db.users.update_many(
    {"projects": "مشروع إصلاح شبكات  المياة والصرف ( المقاول الموسي )"},
    {"$set": {"projects.$": new_name}}
)

print(f"Reports updated: {result.modified_count}")
print(f"Users updated: {users_updated.modified_count}")
