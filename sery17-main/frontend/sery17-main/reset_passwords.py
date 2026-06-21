#!/usr/bin/env python3
"""
سكربت لإعادة تعيين كلمات مرور جميع المستخدمين إلى 123456
"""
import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / 'backend' / '.env')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def reset_all_passwords():
    """إعادة تعيين كلمات المرور لجميع المستخدمين"""
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
    
    # كلمة المرور الجديدة الموحدة
    new_password = "123456"
    hashed_password = pwd_context.hash(new_password)
    
    print("🔄 جاري إعادة تعيين كلمات المرور...")
    
    # جلب جميع المستخدمين
    users = await db.users.find({}, {"_id": 0, "id": 1, "username": 1, "full_name": 1}).to_list(100)
    
    updated_count = 0
    for user in users:
        # تحديث كلمة المرور
        result = await db.users.update_one(
            {"id": user['id']},
            {"$set": {"hashed_password": hashed_password}}
        )
        
        if result.modified_count > 0:
            updated_count += 1
            print(f"✅ تم تحديث: {user['username']} ({user['full_name']})")
    
    print(f"\n✅ تم تحديث {updated_count} مستخدم بنجاح!")
    print(f"📌 كلمة المرور الجديدة لجميع المستخدمين: {new_password}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_all_passwords())
