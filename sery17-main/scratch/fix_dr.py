import asyncio
from pymongo import MongoClient

def fix_user():
    client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client['wfm_reports']
    
    # Find Dr. Abdel-Aty
    user = db.users.find_one({"$or": [{"username": {"$regex": "عاطي"}}, {"full_name": {"$regex": "عاطي"}}]})
    if not user:
        print("User not found.")
        return
        
    db.users.update_one(
        {"id": user["id"]},
        {"$set": {
            "can_create_subusers": True, # Make him Level 2
            "permissions": ["reports_view", "reports_add", "reports_edit"] # Grant basic permissions
        }}
    )
    print("Successfully updated Dr. Abdel-Aty to Level 2 and granted permissions.")

if __name__ == "__main__":
    fix_user()
