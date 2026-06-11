import sys
from pymongo import MongoClient
from datetime import datetime, timedelta, timezone

def delete_recent_imports():
    client = MongoClient('mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0')
    db = client['wfm_reports']

    # Delete reports added in the last 2 hours
    two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
    
    query = {
        "added_at": {"$gte": two_hours_ago}
    }
    
    count = db.reports.count_documents(query)
    print(f"Found {count} reports imported recently.")
    
    if count > 0:
        result = db.reports.delete_many(query)
        print(f"Successfully permanently deleted {result.deleted_count} reports.")
    else:
        print("No recent reports found to delete. Maybe they were already skipped or deleted.")

if __name__ == "__main__":
    delete_recent_imports()
