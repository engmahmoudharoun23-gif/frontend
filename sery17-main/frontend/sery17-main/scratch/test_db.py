from pymongo import MongoClient

def test():
    client = MongoClient("mongodb+srv://omergehad345_db_user:Test123456789@cluster0.op68vs9.mongodb.net/?appName=Cluster0")
    db = client.wfm_reports
    
    user = db.users.find_one({"full_name": {"$regex": "مختار"}})
    if not user:
        print("User Mukhtar not found")
        return
        
    print(f"User: {user.get('full_name')} - Role: {user.get('role')} - can_create_subusers: {user.get('can_create_subusers')}")
    print(f"Permissions: {user.get('permissions')}")
    
    # Check if view_governorate_data is in permissions
    if "view_governorate_data" in user.get('permissions', []):
        print("YES! Mukhtar has view_governorate_data")
    else:
        print("NO! Mukhtar DOES NOT have view_governorate_data")

if __name__ == "__main__":
    test()
