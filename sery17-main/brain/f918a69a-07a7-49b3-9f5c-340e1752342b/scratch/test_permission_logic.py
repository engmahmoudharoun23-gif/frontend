
def get_permission(user_projects, project):
    has_permission = False
    for up in user_projects:
        up_keywords = [k for k in up.replace('-', ' ').split() if len(k) > 2 and k not in ['مشروع', 'أعمال', 'إصلاح']]
        proj_keywords = [k for k in project.replace('-', ' ').split() if len(k) > 2 and k not in ['مشروع', 'أعمال', 'إصلاح']]
        is_match = any(k in project for k in up_keywords) or any(k in up for k in proj_keywords)
        print(f"Checking '{up}' against '{project}': Keywords {up_keywords} vs {proj_keywords} -> Match: {is_match}")
        if is_match:
            has_permission = True
            break
    return has_permission

# User projects from DB
user_projects = ['المحافظات الغربية - القطاع الأوسط', 'كشف التسربات وإصلاحها']

print(f"Result for 'المحافظات الغربية': {get_permission(user_projects, 'المحافظات الغربية')}")
print(f"Result for 'كشف التسربات وإصلاحها': {get_permission(user_projects, 'كشف التسربات وإصلاحها')}")
print(f"Result for 'كشف التسربات': {get_permission(user_projects, 'كشف التسربات')}")
