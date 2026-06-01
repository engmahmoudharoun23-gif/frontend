import os

file_path = r"d:\sery17-main\sery17-main\backend\server.py"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_author = 'arabic_text("إعداد م/ محمود - مدير النظام وتحليل البيانات")'
new_author = 'arabic_text("إعداد م/ محمود - مدير النظام وتحليل البيانات")' # already updated above but let's be sure

# The user wants it in the signature table.
# Let's find the signature tables and insert the row.

# Case 1: arabic_text
sig_table_pattern = """        sig_data = [
            [
                arabic_text("شركة المياه الوطنية"),
                "",
                "",
                arabic_text("مكتب بيت الخبرة للاستشارات الهندسية")
            ],"""

sig_table_replacement = """        sig_data = [
            [
                "",
                "",
                "",
                arabic_text("إعداد م/ محمود - مدير النظام وتحليل البيانات")
            ],
            [
                arabic_text("شركة المياه الوطنية"),
                "",
                "",
                arabic_text("مكتب بيت الخبرة للاستشارات الهندسية")
            ],"""

content = content.replace(sig_table_pattern, sig_table_replacement)

# Case 2: sig_arabic
sig_table_pattern2 = """        sig_data = [
            [
                sig_arabic("شركة المياه الوطنية"),
                "",
                "",
                sig_arabic("مكتب بيت الخبرة للاستشارات الهندسية")
            ],"""

sig_table_replacement2 = """        sig_data = [
            [
                "",
                "",
                "",
                sig_arabic("إعداد م/ محمود - مدير النظام وتحليل البيانات")
            ],
            [
                sig_arabic("شركة المياه الوطنية"),
                "",
                "",
                sig_arabic("مكتب بيت الخبرة للاستشارات الهندسية")
            ],"""

content = content.replace(sig_table_pattern2, sig_table_replacement2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated signature tables.")
