import motor.motor_asyncio
import asyncio
from typing import List

async def get_all_subordinate_user_ids(db, user_id: str, include_self: bool = True) -> List[str]:
    user_ids = [user_id] if include_self else []
    direct_subordinates = await db.users.find(
        {"created_by": user_id},
        {"_id": 0, "id": 1}
    ).to_list(1000)

    for sub in direct_subordinates:
        sub_id = sub['id']
        if sub_id not in user_ids:
            user_ids.append(sub_id)
            nested_ids = await get_all_subordinate_user_ids(db, sub_id, include_self=False)
            for nested_id in nested_ids:
                if nested_id not in user_ids:
                    user_ids.append(nested_id)
    return user_ids

async def main():
    client = motor.motor_asyncio.AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["wfm_reports"]
    
    user_id = "e4e7fd3f-06e3-44e4-9f69-4725c73925ce"
    current_user = await db.users.find_one({"id": user_id})
    print(f"Current User: {current_user.get('full_name')} ({current_user.get('username')})")
    
    sub_ids = await get_all_subordinate_user_ids(db, user_id)
    print(f"Subordinate User IDs: {sub_ids}")
    
    all_identifiers = set(sub_ids)
    all_identifiers.add(current_user.get("username"))
    
    if sub_ids:
        sub_users_cursor = db.users.find({"id": {"$in": sub_ids}}, {"username": 1})
        async for u in sub_users_cursor:
            if u.get("username"):
                all_identifiers.add(u["username"])
                
    print(f"All Identifiers: {list(all_identifiers)}")
    
    # Test connection count matching this filter
    query = {"created_by": {"$in": list(all_identifiers)}}
    water_count = await db.water_connections.count_documents(query)
    sewage_count = await db.sewage_connections.count_documents(query)
    print(f"Matching Water Connections Count: {water_count}")
    print(f"Matching Sewage Connections Count: {sewage_count}")

if __name__ == "__main__":
    asyncio.run(main())
