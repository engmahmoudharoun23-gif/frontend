import sys
import os
import asyncio

# Add backend to path
sys.path.append(os.path.abspath("d:/sery17-main/sery17-main/backend"))

from server import get_governorates, User

class MockUser:
    def __init__(self, role, projects, governorates=None):
        self.role = role
        self.projects = projects
        self.governorates = governorates or []

async def test():
    print("Testing get_governorates with different inputs...")
    
    # 1. Admin user testing
    admin_user = MockUser(role="admin", projects=[])
    
    # Test with exact spelling: 'مشروع ايصال'
    res1 = await get_governorates(project="مشروع ايصال", current_user=admin_user)
    print("Result with 'مشروع ايصال' (Admin):", res1)
    
    # Test with hamza spelling: 'مشروع إيصال'
    res2 = await get_governorates(project="مشروع إيصال", current_user=admin_user)
    print("Result with 'مشروع إيصال' (Admin):", res2)
    
    # 2. Level 2 user testing (has project 'مشروع ايصال')
    level2_user = MockUser(role="user", projects=["مشروع ايصال"])
    res3 = await get_governorates(project="مشروع إيصال", current_user=level2_user)
    print("Result with 'مشروع إيصال' (Level 2 having 'مشروع ايصال'):", res3)
    
    # Test if user has projects listed as 'مشروع إيصال' (with hamza)
    level2_user_hamza = MockUser(role="user", projects=["مشروع إيصال"])
    res4 = await get_governorates(project="مشروع إيصال", current_user=level2_user_hamza)
    print("Result with 'مشروع إيصال' (Level 2 having 'مشروع إيصال'):", res4)

if __name__ == "__main__":
    asyncio.run(test())
