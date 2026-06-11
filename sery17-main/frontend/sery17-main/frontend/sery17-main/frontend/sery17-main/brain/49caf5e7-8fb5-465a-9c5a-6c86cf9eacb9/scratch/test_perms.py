
import sys
import os

# إضافة مسار المشروع للمسار البرمجي
sys.path.append(os.getcwd())

from backend.server import PROJECT_SCOPED_PERMISSIONS, ALL_PERMISSIONS, user_has_any_project_permission

def test_permissions():
    print("--- Testing Settings Permission ---")
    
    # 1. Check if 'settings' is in ALL_PERMISSIONS
    settings_in_all = any(p['key'] == 'settings' for p in ALL_PERMISSIONS)
    print(f"1. 'settings' in ALL_PERMISSIONS: {settings_in_all}")
    
    # 2. Check if 'settings' is in PROJECT_SCOPED_PERMISSIONS
    settings_in_scoped = 'settings' in PROJECT_SCOPED_PERMISSIONS
    print(f"2. 'settings' in PROJECT_SCOPED_PERMISSIONS: {settings_in_scoped}")
    
    # 3. Simulate a user with project-scoped settings permission
    mock_user = {
        "role": "user",
        "permissions": [],
        "project_permissions": {
            "test_project": ["settings", "reports_view"]
        }
    }
    
    has_perm = user_has_any_project_permission(mock_user, "settings")
    print(f"3. user_has_any_project_permission(mock_user, 'settings'): {has_perm}")
    
    # 4. Simulate a user with global settings permission
    mock_user_global = {
        "role": "user",
        "permissions": ["settings"],
        "project_permissions": {}
    }
    has_perm_global = user_has_any_project_permission(mock_user_global, "settings")
    print(f"4. user_has_any_project_permission(mock_user_global, 'settings'): {has_perm_global}")

    if settings_in_all and settings_in_scoped and has_perm and has_perm_global:
        print("\nSUCCESS: Permissions logic is correctly configured in the backend.")
    else:
        print("\nFAILURE: One or more permission checks failed.")

if __name__ == "__main__":
    test_permissions()
