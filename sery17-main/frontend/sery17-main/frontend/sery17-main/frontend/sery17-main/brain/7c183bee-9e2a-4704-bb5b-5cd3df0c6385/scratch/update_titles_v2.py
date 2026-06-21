import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Mahmoud's Title in sig_data
# Current title in file is: إعداد م/ محمود - مدير النظام وتحليل البيانات
# New title: إعداد المهندس محمود هارون - مدير النظام وتحليل البيانات

old_title = "إعداد م/ محمود - مدير النظام وتحليل البيانات"
new_title = "إعداد المهندس محمود هارون - مدير النظام وتحليل البيانات"

content = content.replace(old_title, new_title)

# 2. Fix get_full_project_name to be more dynamic if possible or just use the passed name
# The user wants "actual project name". 
# I will change the logic to prefer the passed project name if it looks like a full name.

old_logic = """    def get_full_project_name(project):
        if not project:
            return ""
        if 'الغربية' in project:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الغربية"
        elif 'الشمالية' in project:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الشمالية"
        elif 'الجنوبية' in project:
            return "مشروع الاشراف على اعمال اصلاح وصيانة شبكات المياه والصرف الصحي بالمحافظات الجنوبية"
        return project"""

new_logic = """    def get_full_project_name(project):
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

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated titles and project name logic.")
