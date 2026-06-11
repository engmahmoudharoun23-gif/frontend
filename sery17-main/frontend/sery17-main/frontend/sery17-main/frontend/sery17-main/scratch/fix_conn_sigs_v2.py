import os
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

file_path = r'd:\sery17-main\sery17-main\backend\server.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The new shared add_signatures block for both water and sewage (2-column, correct RTL)
new_sig_block = '''    def add_signatures(elements, current_user):
        usable_width = landscape(A4)[0] - 40
        elements.append(Spacer(1, 20*mm))
        
        user_title = current_user.title or ""
        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()
        
        sig_data = [
            [reshape_arabic(consultant_name), reshape_arabic(partner_name)],
            [reshape_arabic(f"\\u0627\\u0644\\u0627\\u0633\\u0645: {user_display_name}"), reshape_arabic("\\u0627\\u0644\\u0627\\u0633\\u0645: ........................................")],
            [reshape_arabic("\\u0627\\u0644\\u062a\\u0648\\u0642\\u064a\\u0639: ........................................"), reshape_arabic("\\u0627\\u0644\\u062a\\u0648\\u0642\\u064a\\u0639: ........................................")]
        ]
        sig_table = Table(sig_data, colWidths=[usable_width * 0.5, usable_width * 0.5])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Arabic'),
            ('FONTSIZE', (0, 0), (-1, 0), 13),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (0, 1), (0, 1), colors.HexColor('#2C3E50')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#1F4E79')),
        ]))
        elements.append(sig_table)'''

# --- WATER: identify and replace the add_signatures block ---
# Find the start of the function
water_func_marker = "    def add_signatures(elements, current_user):\r\n        usable_width = landscape(A4)[0] - 40\r\n        elements.append(Spacer(1, 15*mm))"
water_end_marker = "    # 2. \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u062d\u062a\u0648\u0649\r\n    from collections import OrderedDict\r\n    grouped_conns = OrderedDict()\r\n    for c in data.connections:\r\n        p = c.get('project', '\u0628\u062f\u0648\u0646 \u0645\u0634\u0631\u0648\u0639')\r\n        if p not in grouped_conns: grouped_conns[p] = []\r\n        grouped_conns[p].append(c)\r\n\r\n    col_widths = [80, 70, 50, 120, 95, 80, 140, 70, 70, 25]"

# Count occurrences to locate correct one
start_positions = []
pos = 0
while True:
    idx = content.find(water_func_marker, pos)
    if idx == -1:
        break
    start_positions.append(idx)
    pos = idx + 1

print(f"Found {len(start_positions)} add_signatures blocks")

# Replace first occurrence (water)
if start_positions:
    # Find end of first block
    first_start = start_positions[0]
    end_idx = content.find(water_end_marker, first_start)
    if end_idx != -1:
        old_block = content[first_start:end_idx]
        content = content[:first_start] + new_sig_block + "\r\n\r\n" + content[end_idx:]
        print("Water OK")
    else:
        print("Water end marker not found")

# Replace second occurrence (sewage) - need to find new position after replacement
sewage_end_marker = "    # 2. \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u062d\u062a\u0648\u0649\r\n    from collections import OrderedDict\r\n    grouped_conns = OrderedDict()\r\n    for c in data.connections:\r\n        p = c.get('project', '\u0628\u062f\u0648\u0646 \u0645\u0634\u0631\u0648\u0639')\r\n        if p not in grouped_conns: grouped_conns[p] = []\r\n        grouped_conns[p].append(c)\r\n\r\n    col_widths = [80, 70, 60, 110, 95, 80, 130, 70, 70, 25]"

sewage_start = content.find(water_func_marker)
if sewage_start != -1:
    end_idx = content.find(sewage_end_marker, sewage_start)
    if end_idx != -1:
        content = content[:sewage_start] + new_sig_block + "\r\n\r\n" + content[end_idx:]
        print("Sewage OK")
    else:
        print("Sewage end marker not found")
else:
    print("Sewage start marker not found")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("DONE")
