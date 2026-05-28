import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Simplify get_full_project_name to be 100% dynamic
# Function 1
old_logic1 = """    def get_full_project_name(project):
        if not project:
            return ""
        # إذا كان الاسم طويلاً بالفعل، نرجعه كما هو
        if len(project) > 30:
            return project
        # وإلا نستخدم المسميات التفصيلية للمناطق
        if 'الغربية' in project:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الغربية"
        elif 'الشمالية' in project:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الشمالية"
        elif 'الجنوبية' in project:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الجنوبية"
        return project"""

new_logic1 = """    def get_full_project_name(project):
        return project if project else """ + '""'

content = content.replace(old_logic1, new_logic1)

# Function 2
old_logic2 = """    def get_full_project_name(proj):
        if not proj:
            return ""
        # إذا كان الاسم طويلاً بالفعل، نرجعه كما هو
        if len(proj) > 30:
            return proj
        # وإلا نستخدم المسميات التفصيلية للمناطق
        if 'الغربية' in proj:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الغربية"
        elif 'الشمالية' in proj:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الشمالية"
        elif 'الجنوبية' in proj:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الجنوبية"
        return proj"""

new_logic2 = """    def get_full_project_name(proj):
        return proj if proj else """ + '""'

content = content.replace(old_logic2, new_logic2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Simplified project name logic to be fully dynamic.")
