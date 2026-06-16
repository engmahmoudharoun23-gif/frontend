import sys
import re

app_path = "frontend/src/App.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_content = f.read()

app_content = re.sub(r'//\s*import Chat from \'./pages/Chat\';.*', "import Chat from './pages/Chat';", app_content)

app_content = re.sub(r'\{\/\*\s*<Route\s*path="/chat".*?\/>\s*\*\/\s*\}', """        <Route
          path="/chat"
          element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />""", app_content, flags=re.DOTALL)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_content)
print("App.js uncommented successfully")
