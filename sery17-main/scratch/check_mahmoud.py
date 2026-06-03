import asyncio
from pymongo import MongoClient

def check_mahmoud():
    client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client['wfm_reports']
    
    users = db.users.find({"$or": [{"username": {"$regex": "هارون"}}, {"full_name": {"$regex": "هارون"}}]})
    for user in users:
        print(f"Name: {user.get('full_name')} | Username: {user.get('username')} | Role: {user.get('role')} | Level2 (can_create): {user.get('can_create_subusers')}")

if __name__ == "__main__":
    check_mahmoud()
