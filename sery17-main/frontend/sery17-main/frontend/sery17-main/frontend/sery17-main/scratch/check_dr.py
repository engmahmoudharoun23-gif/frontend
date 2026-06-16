import asyncio
from pymongo import MongoClient

def check_user():
    client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client['wfm_reports']
    
    # Find Dr. Abdel-Aty
    user = db.users.find_one({"$or": [{"username": {"$regex": "عاطي"}}, {"full_name": {"$regex": "عاطي"}}]})
    if not user:
        print("User not found.")
        return
        
    print(f"Name: {user.get('full_name')}")
    print(f"Username: {user.get('username')}")
    print(f"Role: {user.get('role')}")
    print(f"Projects: {user.get('projects')}")
    print(f"Governorates: {user.get('governorates')}")
    print(f"Permissions: {user.get('permissions')}")
    print(f"Can create subusers: {user.get('can_create_subusers')}")

if __name__ == "__main__":
    check_user()
