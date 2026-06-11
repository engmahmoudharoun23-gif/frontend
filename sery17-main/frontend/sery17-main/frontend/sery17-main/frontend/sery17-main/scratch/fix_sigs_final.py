with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_sig = '''    def add_signatures(elements, current_user):
        usable_width = landscape(A4)[0] - 40
        elements.append(Spacer(1, 20*mm))
        
        user_title = current_user.title or ""
        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()
        
        sig_data = [
            [reshape_arabic(consultant_name), reshape_arabic(partner_name)],
            [reshape_arabic(f"\u0627\u0644\u0627\u0633\u0645: {user_display_name}"), reshape_arabic("\u0627\u0644\u0627\u0633\u0645: ........................................")],
            [reshape_arabic("\u0627\u0644\u062a\u0648\u0642\u064a\u0639: ........................................"), reshape_arabic("\u0627\u0644\u062a\u0648\u0642\u064a\u0639: ........................................")]
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

lines = content.split('\n')

def replace_block(lines, start_line, end_line, new_content):
    new_lines = new_content.split('\n')
    return lines[:start_line-1] + new_lines + lines[end_line:]

# Water: lines 10360-10385
lines = replace_block(lines, 10360, 10385, new_sig)

# Sewage was at 10688-10713, same block size so same offset
lines = replace_block(lines, 10688, 10713, new_sig)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))

print('Done - signatures replaced')
