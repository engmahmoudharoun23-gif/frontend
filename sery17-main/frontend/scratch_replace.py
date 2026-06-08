import re
import os

path = r'd:\sery17-main\sery17-main\frontend\src\components\Layout.js'

with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace <Link to="X" onClick={() => setSidebarOpen(false)}
new_text = re.sub(
    r'<Link(\s*(?:key=\{[^}]+\})?\s*)to="([^"]+)"\s*onClick=\{\(\)\s*=>\s*setSidebarOpen\(false\)\}',
    r'<Link\1to="\2" onClick={(e) => handleLinkClick(e, "\2")}',
    text
)

# Also replace the multiline dashboard onClick logic to use handleLinkClick
dashboard_old = r'''onClick={(e) => {
                    if (location.pathname === '/' || location.pathname === '/dashboard') {
                      e.preventDefault();
                      window.location.reload();
                    } else {
                      setSidebarOpen(false);
                    }
                  }}'''
dashboard_new = r'''onClick={(e) => handleLinkClick(e, '/')}'''
new_text = new_text.replace(dashboard_old, dashboard_new)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_text)

print('Done replacing Link onClicks!')
