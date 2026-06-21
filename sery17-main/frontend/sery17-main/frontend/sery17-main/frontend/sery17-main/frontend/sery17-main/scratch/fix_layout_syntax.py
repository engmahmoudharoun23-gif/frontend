with open('frontend/src/components/Layout.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Mobile fix
# Line 1311 (0-indexed 1310): ) -> )}
lines[1310] = '              )}\n'
# Line 1319 (0-indexed 1318): }} -> )}\n
lines[1318] = '              )}\n'

# Desktop fix
# Line 1577 (0-indexed 1576): ) -> )}
lines[1576] = '            )}\n'
# Line 1591 (0-indexed 1590): }} -> )}\n
lines[1590] = '            )}\n'

with open('frontend/src/components/Layout.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Layout.js syntax errors fixed successfully!")
