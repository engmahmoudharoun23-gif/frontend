with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The new signature block (water starts line 10360, sewage starts line 10692)
new_block_lines = [
    '    def add_signatures(elements, current_user):\n',
    '        usable_width = landscape(A4)[0] - 40\n',
    '        elements.append(Spacer(1, 20*mm))\n',
    '        \n',
    '        user_title = current_user.title or ""\n',
    '        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()\n',
    '        \n',
    '        sig_data = [\n',
    '            [reshape_arabic(partner_name), reshape_arabic(consultant_name)],\n',
    '            [reshape_arabic(user_display_name), reshape_arabic(user_display_name)],\n',
    '            [reshape_arabic(".................................................."), reshape_arabic("..................................................")],\n',
    '            [reshape_arabic("\u0627\u0644\u062a\u0648\u0642\u064a\u0639"), reshape_arabic("\u0627\u0644\u062a\u0648\u0642\u064a\u0639")]\n',
    '        ]\n',
    '        sig_table = Table(sig_data, colWidths=[usable_width * 0.5, usable_width * 0.5])\n',
    '        sig_table.setStyle(TableStyle([\n',
    "            ('ALIGN', (0, 0), (0, -1), 'LEFT'),\n",
    "            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),\n",
    "            ('FONTNAME', (0, 0), (-1, -1), 'Arabic'),\n",
    "            ('FONTSIZE', (0, 0), (-1, 0), 13),\n",
    "            ('FONTSIZE', (0, 1), (-1, 1), 12),\n",
    "            ('FONTSIZE', (0, 2), (-1, 2), 10),\n",
    "            ('FONTSIZE', (0, 3), (-1, 3), 10),\n",
    "            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1F4E79')),\n",
    "            ('TEXTCOLOR', (1, 0), (1, 0), colors.HexColor('#1F4E79')),\n",
    "            ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#2C3E50')),\n",
    "            ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor('#888888')),\n",
    "            ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor('#555555')),\n",
    "            ('TOPPADDING', (0, 0), (-1, -1), 6),\n",
    "            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),\n",
    "            ('LINEABOVE', (0, 0), (-1, 0), 1.5, colors.HexColor('#1F4E79')),\n",
    '        ]))\n',
    '        elements.append(sig_table)\n',
]

def replace_function_block(lines, start_line_1indexed, end_line_1indexed, new_lines):
    return lines[:start_line_1indexed - 1] + new_lines + lines[end_line_1indexed:]

# Water: lines 10360-10391 (inclusive)
lines = replace_function_block(lines, 10360, 10391, new_block_lines)

# After replacing water block (~33 lines replaced by ~33 lines), sewage offset may shift
# Recount: original had 32 lines (10360-10391), new has 33 lines → sewage shifts by +1
# Original sewage was at 10692, now at 10693
lines = replace_function_block(lines, 10693, 10725, new_block_lines)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Done - both blocks replaced")
