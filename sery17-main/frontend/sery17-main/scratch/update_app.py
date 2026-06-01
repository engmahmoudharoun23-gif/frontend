with open('frontend/src/App.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import statement
import_target = "import QualityReports from './pages/QualityReports';"
import_replacement = "import QualityReports from './pages/QualityReports';\nimport BusinessReports from './pages/BusinessReports';"

if import_target not in content:
    raise Exception("Could not find QualityReports import in App.js")
content = content.replace(import_target, import_replacement)

# 2. Add Route
route_target = """        <Route
          path="/quality-reports"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'quality_reports')) ? <QualityReports user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />"""

route_replacement = route_target + """
        <Route
          path="/business-reports"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'business_reports')) ? <BusinessReports user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />"""

if route_target not in content:
    # try with slightly different formatting
    print("Warning: exact quality-reports Route block not found, trying with simple replace")
    if '/quality-reports' not in content:
        raise Exception("Could not find /quality-reports in App.js")
    # let's locate it manually
    pos = content.find('path="/quality-reports"')
    end_route = content.find('/>', pos)
    insert_pos = end_route + 2
    addition = """
        <Route
          path="/business-reports"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'business_reports')) ? <BusinessReports user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />"""
    content = content[:insert_pos] + addition + content[insert_pos:]
else:
    content = content.replace(route_target, route_replacement)

with open('frontend/src/App.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.js updated successfully!")
