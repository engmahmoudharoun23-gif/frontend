from pymongo import MongoClient
import os
from dotenv import load_dotenv

def delete_waheed():
    load_dotenv("backend/.env")
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME")
    
    client = MongoClient(mongo_url)
    db = client[db_name]
    
    users = list(db.users.find({"$or": [{"username": {"$regex": "وحيد"}}, {"full_name": {"$regex": "وحيد"}}]}))
    if not users:
        print("لم يتم العثور على أي مستخدم باسم وحيد.")
        return
    
    for u in users:
        print(f"Deleting ID: {u.get('id')}, Username: {u.get('username')}, Full Name: {u.get('full_name')}")
        db.users.delete_one({"_id": u["_id"]})
    print("تم الحذف بنجاح.")

if __name__ == "__main__":
    delete_waheed()
