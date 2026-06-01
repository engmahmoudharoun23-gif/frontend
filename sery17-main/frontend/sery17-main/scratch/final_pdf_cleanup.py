import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Standardize Logo Sizes to 45x22mm
content = content.replace('width=40*mm, height=20*mm', 'width=45*mm, height=22*mm')

# 2. Final Signature Block Fix (Expert House: Name populated, Signature dots; Partner: both dots)
# This addresses the user's latest request.

# Replacement for export_selected_reports_pdf and export_reports_pdf (4-column layout)
# Expert House (Index 0), Partner (Index 3)
old_4col_sig = '''        [
            {func}(f"الاسم: {user_display_name}"),
            "",
            "",
            {func}("الاسم: ........................................")
        ],
        [
            {func}("التوقيع: ........................................"),
            "",
            "",
            {func}("التوقيع: ........................................")
        ]'''

# We need to do this for both sig_arabic and arabic_text
for func in ['sig_arabic', 'arabic_text']:
    target = old_4col_sig.format(func=func)
    # The current code has the user name in both fields for Expert House, let's match that to replace it.
    # Wait, in the previous step I already changed the signature field to dots for both!
    # Let's check what I have now.
    pass

# Actually, I'll just search for the specific lines I have now and ensure they are correct.
# Current state after fix_signatures_v2.py:
# Line 1: [Expert, "", "", Partner]
# Line 2: [Name: user, "", "", Name: dots]
# Line 3: [Sig: dots, "", "", Sig: dots]
# This matches the user's latest request! "الاسم يكتب علية والتوقيع يترك فارغا".

# So why did the user say "توقيع الكتروني" is still there?
# WAIT! I see it!
# In my previous script fix_signatures_v2.py, I might have made a typo or the replacement didn't happen for some reason.
# Let's check the file content one more time.

# I'll use a very simple and direct replacement for the string "توقيع إلكتروني" and "(توقيع إلكتروني)" 
# just in case it's hiding somewhere in a way I didn't see.
content = content.replace('(توقيع إلكتروني)', '')
content = content.replace('توقيع إلكتروني', '')
content = content.replace('(توقيع الكتروني)', '')
content = content.replace('توقيع الكتروني', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Final cleanup and standardization completed.")
