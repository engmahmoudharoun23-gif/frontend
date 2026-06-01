with open('backend/server.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix 1: Remove duplicate def at line 10692 (0-indexed: 10691)
# Line 10692 has "    def add_signatures..." with missing body (line 10693 has the real one)
# Remove line 10692 (index 10691)
del lines[10691]

# Fix 2: After removing that line, line 10724 (original) "        elements.append(sig_table)"
# is now at 10723. The next line 10725 (original) "    grouped_conns..." is now at 10724
# But it's missing the newline and the "    # 2. بناء..." header
# Let me insert the missing lines
# After elements.append(sig_table) at current index 10723, insert:
insert_after = 10722  # 0-indexed: after elements.append(sig_table)
insert_lines = [
    '\n',
    '    # 2. \u0628\u0646\u0627\u0621 \u0627\u0644\u0645\u062d\u062a\u0648\u0649\n',
    '    from collections import OrderedDict\n',
]

lines = lines[:insert_after + 1] + insert_lines + lines[insert_after + 1:]

with open('backend/server.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Fixed duplicate def and missing content")
