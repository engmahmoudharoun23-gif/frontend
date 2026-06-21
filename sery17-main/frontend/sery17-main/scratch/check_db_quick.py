
from pymongo import MongoClient
import os

def check_db():
    try:
        client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        dbs = client.list_database_names()
        print(f"Databases: {dbs}")
        
        target_db = "wfm_reports"
        if target_db in dbs:
            db = client[target_db]
            collections = db.list_collection_names()
            print(f"Collections in {target_db}: {collections}")
            
            # Check user count
            user_count = db.users.count_documents({})
            print(f"User count: {user_count}")
            
            # Check report count
            report_count = db.reports.count_documents({})
            print(f"Report count: {report_count}")
        else:
            print(f"Database {target_db} not found!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
