import sys

filepath = 'd:/sery17-main/sery17-main/frontend/src/pages/ReportForm.js'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.read().splitlines()

# 1-indexed to 0-indexed
def get_block(start_line, end_line):
    return lines[start_line-1 : end_line]

gov_block = get_block(1404, 1443)
depth_block = get_block(1445, 1448)
diameter_block = get_block(1450, 1453)
contractor_block = get_block(1455, 1501)
close_date_block = get_block(1503, 1507)
latitude_block = get_block(1509, 1586)
longitude_block = get_block(1588, 1604)
loc_success_block = get_block(1606, 1614)

empty_div = ['              <div className="hidden md:block"></div>']

# New order
new_section = []
new_section.extend(gov_block)
new_section.append('')
new_section.extend(contractor_block)
new_section.append('')
new_section.extend(diameter_block)
new_section.append('')
new_section.extend(depth_block)
new_section.append('')
new_section.extend(latitude_block)
new_section.append('')
new_section.extend(longitude_block)
new_section.append('')
new_section.extend(loc_success_block)
new_section.append('')
new_section.extend(empty_div)
new_section.append('')
new_section.extend(close_date_block)

# Replace in original lines
new_lines = lines[:1403] + new_section + lines[1614:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines) + '\n')

print('Replacement successful.')
