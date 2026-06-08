with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The correct 3-row signature block
new_block = [
    '    def add_signatures(elements, current_user):\n',
    '        usable_width = landscape(A4)[0] - 40\n',
    '        elements.append(Spacer(1, 20*mm))\n',
    '        user_title = current_user.title or ""\n',
    '        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()\n',
    '        # يسار: شركة المياه (نقاط) | يمين: بيت الخبرة (اسم المستخدم)\n',
    '        sig_data = [\n',
    '            [reshape_arabic(partner_name), reshape_arabic(consultant_name)],\n',
    '            [reshape_arabic("\u0627\u0644\u0627\u0633\u0645: ........................................"), reshape_arabic(f"\u0627\u0644\u0627\u0633\u0645: {user_display_name}")],\n',
    '            [reshape_arabic("\u0627\u0644\u062a\u0648\u0642\u064a\u0639: ........................................"), reshape_arabic("\u0627\u0644\u062a\u0648\u0642\u064a\u0639: ........................................")]\n',
    '        ]\n',
    '        sig_table = Table(sig_data, colWidths=[usable_width * 0.5, usable_width * 0.5])\n',
    '        sig_table.setStyle(TableStyle([\n',
    "            ('ALIGN', (0, 0), (0, -1), 'LEFT'),\n",
    "            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),\n",
    "            ('FONTNAME', (0, 0), (-1, -1), 'Arabic'),\n",
    "            ('FONTSIZE', (0, 0), (-1, 0), 13),\n",
    "            ('FONTSIZE', (0, 1), (-1, -1), 11),\n",
    "            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1F4E79')),\n",
    "            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#1F4E79')),\n",
    "            ('TEXTCOLOR', (1, 1), (1, 1), colors.HexColor('#2C3E50')),\n",
    "            ('TOPPADDING', (0, 0), (-1, -1), 8),\n",
    "            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),\n",
    "            ('LINEABOVE', (0, 0), (-1, 0), 1.5, colors.HexColor('#1F4E79')),\n",
    '        ]))\n',
    '        elements.append(sig_table)\n',
]

# Find the two add_signatures blocks and replace lines 10360..+N and 10692..+N
def find_block_end(lines, start_0idx):
    """Find the end line of add_signatures block (line after elements.append(sig_table))"""
    i = start_0idx + 1
    while i < len(lines):
        if lines[i].strip() == 'elements.append(sig_table)' or lines[i].strip() == 'elements.append(sig_table)\n':
            return i + 1  # exclusive end
        i += 1
    return start_0idx + 30  # fallback

# Find both function starts
starts = []
for i, line in enumerate(lines):
    if '    def add_signatures(elements, current_user):' in line:
        starts.append(i)

print(f"Found blocks at lines: {[s+1 for s in starts]}")

if len(starts) >= 2:
    # Replace second block first (sewage) to not affect first block's line numbers
    end2 = find_block_end(lines, starts[1])
    lines = lines[:starts[1]] + new_block + lines[end2:]
    
    # Recalculate first block end (line numbers haven't changed before starts[0])
    end1 = find_block_end(lines, starts[0])
    lines = lines[:starts[0]] + new_block + lines[end1:]
elif len(starts) == 1:
    end1 = find_block_end(lines, starts[0])
    lines = lines[:starts[0]] + new_block + lines[end1:]

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done")
