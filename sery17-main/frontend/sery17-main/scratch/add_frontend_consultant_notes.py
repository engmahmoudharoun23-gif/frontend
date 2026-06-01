import os
import re

# 1. Update Layout.js
layout_path = 'frontend/src/components/Layout.js'
with open(layout_path, 'r', encoding='utf-8') as f:
    layout_content = f.read()

target = "{(hasPermission('trash') || user.role === 'admin') && ("

new_link = """              {hasPermission('consultant_notes') && (
                <Link
                  to="/consultant-notes"
                  onClick={() => setSidebarOpen(false)}
                  className={`sidebar-item ${isActive('/consultant-notes') ? 'sidebar-item-active' : 'text-gray-700'}`}
                >
                  <div className="sidebar-icon-box">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>
                  <span className="sidebar-text">{t('sidebar.consultantNotes') || 'ملاحظات الاستشاري'}</span>
                </Link>
              )}
"""

if "to=\"/consultant-notes\"" not in layout_content:
    layout_content = layout_content.replace(target, new_link + '\n              ' + target)
    with open(layout_path, 'w', encoding='utf-8') as f:
        f.write(layout_content)
    print("Layout.js updated.")

# 2. Update App.js
app_path = 'frontend/src/App.js'
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

import_statement = "import ConsultantNotes from './pages/ConsultantNotes';"
route_statement = '<Route path="/consultant-notes" element={<PrivateRoute><ConsultantNotes /></PrivateRoute>} />'

if "ConsultantNotes" not in app_content:
    # Add import
    app_content = app_content.replace("import Trash from './pages/Trash';", "import Trash from './pages/Trash';\n" + import_statement)
    
    # Add route
    route_target = '<Route path="/trash" element={<PrivateRoute><Trash /></PrivateRoute>} />'
    if route_target in app_content:
        app_content = app_content.replace(route_target, route_statement + '\n        ' + route_target)
    else:
        # Fallback if specific route formatting differs
        app_content = app_content.replace("</Routes>", "  " + route_statement + "\n      </Routes>")
        
    with open(app_path, 'w', encoding='utf-8') as f:
        f.write(app_content)
    print("App.js updated.")
