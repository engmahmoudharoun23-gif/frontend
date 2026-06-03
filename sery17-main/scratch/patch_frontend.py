import sys

# Patch App.js
app_path = "frontend/src/App.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

if "import Chat from './pages/Chat';" not in app_content:
    app_content = app_content.replace("import EmployeeRequests from './pages/EmployeeRequests';", "import EmployeeRequests from './pages/EmployeeRequests';\nimport Chat from './pages/Chat';")
    
if "path=\"/chat\"" not in app_content:
    chat_route = "        <Route path=\"/chat\" element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to=\"/login\" />} />"
    app_content = app_content.replace("<Route path=\"/hr\"", f"{chat_route}\n        <Route path=\"/hr\"")
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(app_content)
    print("App.js patched successfully")

# Patch Layout.js
layout_path = "frontend/src/components/Layout.js"
with open(layout_path, "r", encoding="utf-8") as f:
    layout_content = f.read()

if "/chat" not in layout_content:
    chat_link = """
      <Link to="/chat" className={`group relative overflow-hidden transition-all duration-300 w-full mb-3 rounded-2xl flex items-center justify-between shadow-sm p-4 text-sm font-bold ${
        isActive('/chat')
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
          : 'bg-white/50 text-slate-700 hover:bg-white hover:text-indigo-600 hover:shadow border border-white'
      }`}>
        <div className="flex items-center gap-3 relative z-10">
          <div className={`p-2 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
            isActive('/chat') ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'
          }`}>
            <span className="text-xl">💬</span>
          </div>
          <span>دردشة الفريق</span>
        </div>
      </Link>
"""
    # Insert after Dashboard
    layout_content = layout_content.replace('<Link to="/dashboard"', f'{chat_link}\n      <Link to="/dashboard"')
    with open(layout_path, "w", encoding="utf-8") as f:
        f.write(layout_content)
    print("Layout.js patched successfully")
