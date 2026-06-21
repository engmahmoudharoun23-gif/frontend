import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update export_selected_reports_pdf (approx line 7050)
old_selected_sig = '''        [
            arabic_text(f"الاسم: {user_display_name}"),
            "",
            "",
            arabic_text("الاسم: ........................................")
        ],
        [
            arabic_text(f"التوقيع: {user_display_name}"),
            "",
            "",
            arabic_text("التوقيع: ........................................")
        ]'''

new_selected_sig = '''        [
            arabic_text(f"الاسم: {user_display_name}"),
            "",
            "",
            arabic_text("الاسم: ........................................")
        ],
        [
            arabic_text("التوقيع: ........................................"),
            "",
            "",
            arabic_text("التوقيع: ........................................")
        ]'''

content = content.replace(old_selected_sig, new_selected_sig)

# 2. Update export_reports_pdf (approx line 9040)
old_reports_sig = '''        [
            sig_arabic(f"الاسم: {user_display_name}"),
            "",
            "",
            sig_arabic("الاسم: ........................................")
        ],
        [
            sig_arabic(f"التوقيع: {user_display_name}"),
            "",
            "",
            sig_arabic("التوقيع: ........................................")
        ]'''

new_reports_sig = '''        [
            sig_arabic(f"الاسم: {user_display_name}"),
            "",
            "",
            sig_arabic("الاسم: ........................................")
        ],
        [
            sig_arabic("التوقيع: ........................................"),
            "",
            "",
            sig_arabic("التوقيع: ........................................")
        ]'''

content = content.replace(old_reports_sig, new_reports_sig)

# 3. Update add_signatures for water/sewage (approx line 10368 and 10696)
old_conn_sig = '''            [reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],
            [reshape_arabic(f"التوقيع: {user_display_name}"), reshape_arabic("التوقيع: ........................................")]'''

new_conn_sig = '''            [reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],
            [reshape_arabic("التوقيع: ........................................"), reshape_arabic("التوقيع: ........................................")]'''

content = content.replace(old_conn_sig, new_conn_sig)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement completed successfully.")
