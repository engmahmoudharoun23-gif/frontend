with open('backend/server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# القديم: [بيت الخبرة يسار، شركة المياه يمين]
old_sig = '''        sig_data = [
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
        ]))'''

# الجديد: [شركة المياه يسار، بيت الخبرة يمين + اسم المستخدم]
new_sig = '''        sig_data = [
            [reshape_arabic(partner_name), reshape_arabic(consultant_name)],
            [reshape_arabic("\u0627\u0644\u0627\u0633\u0645: ........................................"), reshape_arabic(f"\u0627\u0644\u0627\u0633\u0645: {user_display_name}")],
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
            ('TEXTCOLOR', (1, 1), (1, 1), colors.HexColor('#2C3E50')),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#1F4E79')),
        ]))'''

count = content.count(old_sig)
print(f"Found {count} occurrences")

content = content.replace(old_sig, new_sig)

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
