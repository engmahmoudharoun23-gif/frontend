import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Swap partner and consultant names in sig_data lists
content = content.replace(
    '[reshape_arabic(partner_name), reshape_arabic(consultant_name)],',
    '[reshape_arabic(consultant_name), reshape_arabic(partner_name)],'
)

# Swap Name lines
# Note: Using a more robust replacement that doesn't depend on the exact number of dots if possible, 
# but I'll stick to what I saw in view_file.
old_name_line = '[reshape_arabic("الاسم: ........................................"), reshape_arabic(f"الاسم: {user_display_name}")],'
new_name_line = '[reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],'
content = content.replace(old_name_line, new_name_line)

# Swap Signature lines
old_sig_line = '[reshape_arabic("التوقيع: ........................................"), reshape_arabic(f"التوقيع: {user_display_name}")]'
new_sig_line = '[reshape_arabic(f"التوقيع: {user_display_name}"), reshape_arabic("التوقيع: ........................................")]'
content = content.replace(old_sig_line, new_sig_line)

# Update colWidths and alignments for water/sewage
content = content.replace(
    'sig_table = Table(sig_data, colWidths=[usable_width/2, usable_width/2])',
    'sig_table = Table(sig_data, colWidths=[usable_width*0.35, usable_width*0.15, usable_width*0.15, usable_width*0.35])'
)

# Update alignments (Expert House LEFT, NWC RIGHT)
# We need to be careful with the TableStyle part.
# The current code has:
# ('ALIGN', (0, 0), (0, -1), 'LEFT'),
# ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
# We want to keep (0,0) as LEFT but now it is Consultant.
# And change (1,0) to (3,0) as RIGHT and it is Partner.

content = content.replace(
    "('ALIGN', (1, 0), (1, -1), 'RIGHT'),",
    "('ALIGN', (3, 0), (3, -1), 'RIGHT'),"
)

# Fix FONTSIZE and TEXTCOLOR for the 4-column layout
content = content.replace(
    "('FONTSIZE', (0, 0), (1, 0), 12),",
    "('FONTSIZE', (0, 0), (0, 0), 12),\n            ('FONTSIZE', (3, 0), (3, 0), 12),"
)
content = content.replace(
    "('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#1F4E79')),",
    "('TEXTCOLOR', (3, 0), (3, 0), colors.HexColor('#1F4E79')),"
)
content = content.replace(
    "('TEXTCOLOR', (1, 2), (1, 2), colors.HexColor('#2E75B6')),",
    "" # Remove old Blue color for electronic signature
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement completed successfully.")
