import os

file_path = r'd:\sery17-main\sery17-main\backend\server.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# WATER CONNECTIONS: Replace add_signatures function
# ============================================================
old_water_sig = """    def add_signatures(elements, current_user):
        usable_width = landscape(A4)[0] - 40
        elements.append(Spacer(1, 15*mm))
        
        # تحضير الاسم مع اللقب إن وجد
        user_title = current_user.title or ""
        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()
        sig_data = [
            [reshape_arabic(consultant_name), reshape_arabic(partner_name)],
            [reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],
            [reshape_arabic("التوقيع: ........................................"), reshape_arabic("التوقيع: ........................................")]
        ]
        sig_table = Table(sig_data, colWidths=[usable_width*0.35, usable_width*0.15, usable_width*0.15, usable_width*0.35])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Arabic'),
            ('FONTSIZE', (0, 0), (0, 0), 12),
            ('FONTSIZE', (3, 0), (3, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (3, 0), (3, 0), colors.HexColor('#1F4E79')),
            
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(sig_table)

    # 2. بناء المحتوى
    from collections import OrderedDict
    grouped_conns = OrderedDict()
    for c in data.connections:
        p = c.get('project', 'بدون مشروع')
        if p not in grouped_conns: grouped_conns[p] = []
        grouped_conns[p].append(c)

    col_widths = [80, 70, 50, 120, 95, 80, 140, 70, 70, 25]"""

new_water_sig = """    def add_signatures(elements, current_user):
        usable_width = landscape(A4)[0] - 40
        elements.append(Spacer(1, 20*mm))
        
        # تحضير الاسم مع اللقب إن وجد
        user_title = current_user.title or ""
        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()
        
        # جدول التوقيع (عمودان: بيت الخبرة يسار، شركة المياه يمين)
        sig_data = [
            [reshape_arabic(consultant_name), reshape_arabic(partner_name)],
            [reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],
            [reshape_arabic("التوقيع: ........................................"), reshape_arabic("التوقيع: ........................................")]
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
        elements.append(sig_table)

    # 2. بناء المحتوى
    from collections import OrderedDict
    grouped_conns = OrderedDict()
    for c in data.connections:
        p = c.get('project', 'بدون مشروع')
        if p not in grouped_conns: grouped_conns[p] = []
        grouped_conns[p].append(c)

    col_widths = [80, 70, 50, 120, 95, 80, 140, 70, 70, 25]"""

if old_water_sig in content:
    content = content.replace(old_water_sig, new_water_sig)
    print("✓ Water connections signature updated")
else:
    print("✗ Water connections signature NOT found - check exact whitespace")

# ============================================================
# SEWAGE CONNECTIONS: Replace add_signatures function
# ============================================================
old_sewage_sig = """    def add_signatures(elements, current_user):
        usable_width = landscape(A4)[0] - 40
        elements.append(Spacer(1, 15*mm))
        
        # تحضير الاسم مع اللقب إن وجد
        user_title = current_user.title or ""
        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()
        sig_data = [
            [reshape_arabic(consultant_name), reshape_arabic(partner_name)],
            [reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],
            [reshape_arabic("التوقيع: ........................................"), reshape_arabic("التوقيع: ........................................")]
        ]
        sig_table = Table(sig_data, colWidths=[usable_width*0.35, usable_width*0.15, usable_width*0.15, usable_width*0.35])
        sig_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Arabic'),
            ('FONTSIZE', (0, 0), (0, 0), 12),
            ('FONTSIZE', (3, 0), (3, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1F4E79')),
            ('TEXTCOLOR', (3, 0), (3, 0), colors.HexColor('#1F4E79')),
            
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        elements.append(sig_table)

    # 2. بناء المحتوى
    from collections import OrderedDict
    grouped_conns = OrderedDict()
    for c in data.connections:
        p = c.get('project', 'بدون مشروع')
        if p not in grouped_conns: grouped_conns[p] = []
        grouped_conns[p].append(c)

    col_widths = [80, 70, 60, 110, 95, 80, 130, 70, 70, 25]"""

new_sewage_sig = """    def add_signatures(elements, current_user):
        usable_width = landscape(A4)[0] - 40
        elements.append(Spacer(1, 20*mm))
        
        # تحضير الاسم مع اللقب إن وجد
        user_title = current_user.title or ""
        user_display_name = f"{user_title} {current_user.full_name or current_user.username}".strip()
        
        # جدول التوقيع (عمودان: بيت الخبرة يسار، شركة المياه يمين)
        sig_data = [
            [reshape_arabic(consultant_name), reshape_arabic(partner_name)],
            [reshape_arabic(f"الاسم: {user_display_name}"), reshape_arabic("الاسم: ........................................")],
            [reshape_arabic("التوقيع: ........................................"), reshape_arabic("التوقيع: ........................................")]
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
        elements.append(sig_table)

    # 2. بناء المحتوى
    from collections import OrderedDict
    grouped_conns = OrderedDict()
    for c in data.connections:
        p = c.get('project', 'بدون مشروع')
        if p not in grouped_conns: grouped_conns[p] = []
        grouped_conns[p].append(c)

    col_widths = [80, 70, 60, 110, 95, 80, 130, 70, 70, 25]"""

if old_sewage_sig in content:
    content = content.replace(old_sewage_sig, new_sewage_sig)
    print("✓ Sewage connections signature updated")
else:
    print("✗ Sewage connections signature NOT found - check exact whitespace")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done.")
