from pymongo import MongoClient
import json

client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
db = client.wfm_reports

# Revert the project name
db.projects.update_one(
    {"name": "مشروع المحافظات الغربية"},
    {"$set": {"name": "مشروع إصلاح شبكات  المياة والصرف ( المقاول الموسي )"}}
)

print("Project reverted successfully")
