import os
import re

filepath = 'd:/sery17-main/sery17-main/frontend/src/components/Layout.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add userMenuOpen
if 'const [userMenuOpen, setUserMenuOpen]' not in content:
    content = content.replace(
        "const [reportNotificationsOpen, setReportNotificationsOpen] = useState(false);",
        "const [reportNotificationsOpen, setReportNotificationsOpen] = useState(false);\n  const [userMenuOpen, setUserMenuOpen] = useState(false);"
    )

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done adding state.")
