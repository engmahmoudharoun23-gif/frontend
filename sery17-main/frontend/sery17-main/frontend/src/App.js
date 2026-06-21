import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { hasAnyProjectPermission, hasPermission } from './utils/permissions';
import axios from 'axios';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Dashboard from './pages/NewDashboard';
import Reports from './pages/Reports';
import ReportForm from './pages/ReportForm';
import Trash from './pages/Trash';
import ConsultantNotes from './pages/ConsultantNotes';
import Users from './pages/Users';
import Settings from './pages/Settings';
import TeamManagement from './pages/TeamManagement';
import SupportMessages from './pages/SupportMessages';
import Contractors from './pages/Contractors';
import ProjectSettings from './pages/ProjectSettings';
import Extracts from './pages/Extracts';
import ExtractForm from './pages/ExtractForm';
import Invoices from './pages/Invoices';
import EmployeeRequests from './pages/EmployeeRequests';
import DeletedItems from './pages/DeletedItems';
import HRManagement from './pages/HRManagement';
import Cars from './pages/Cars';
import FleetMaintenance from './pages/FleetMaintenance';
import WaterConnections from './pages/WaterConnections';
import SewageConnections from './pages/SewageConnections';
import ConnectionsHub from './pages/ConnectionsHub';
import SafetyReports from './pages/SafetyReports';
import WorkPermits from './pages/WorkPermits';
import QualityReports from './pages/QualityReports';
import BusinessReports from './pages/BusinessReports';
import Archive from './pages/Archive';
import Chat from './pages/Chat';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// الثيمات المتاحة
const themeColors = {
  blue: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', bgLight: '#eff6ff', bgDark: '#1e3a5f', text: '#1e40af', hover: '#1d4ed8' },
  green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', bgLight: '#ecfdf5', bgDark: '#064e3b', text: '#065f46', hover: '#047857' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', bgLight: '#f5f3ff', bgDark: '#4c1d95', text: '#5b21b6', hover: '#6d28d9' },
  rose: { primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', bgLight: '#fff1f2', bgDark: '#881337', text: '#be123c', hover: '#be123c' },
  teal: { primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', bgLight: '#f0fdfa', bgDark: '#134e4a', text: '#115e59', hover: '#0f766e' },
  amber: { primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', bgLight: '#fffbeb', bgDark: '#78350f', text: '#92400e', hover: '#b45309' },
  slate: { primary: '#334155', secondary: '#475569', accent: '#94a3b8', bgLight: '#f8fafc', bgDark: '#0f172a', text: '#1e293b', hover: '#1e293b' },
};

import SessionTimeoutModal from './components/SessionTimeoutModal';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [platformTheme, setPlatformTheme] = useState('blue');
  const [darkMode, setDarkMode] = useState(false);

  // جلب إعدادات الثيم
  const [platformThemeLoaded, setPlatformThemeLoaded] = useState(false);
  
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axios.get(`${API}/settings/platform?t=${new Date().getTime()}`);
        const theme = response.data.theme || 'blue';
        const localDark = localStorage.getItem('darkMode');
        const dark = localDark !== null ? (localDark === 'true') : (response.data.dark_mode || false);
        setPlatformTheme(theme);
        setDarkMode(dark);
        // تم الإزالة من هنا لكي لا يتضارب مع الثيم الشخصي، سيتم التطبيق في useEffect أدناه
      } catch (error) {
        console.error('Failed to fetch theme:', error);
        const localDark = localStorage.getItem('darkMode');
        const dark = localDark === 'true';
        setPlatformTheme('blue');
        setDarkMode(dark);
      }
      setPlatformThemeLoaded(true);
    };
    fetchTheme();
  }, []);
  
  // تطبيق الثيم
  const applyTheme = (theme, isDark) => {
    const colors = themeColors[theme] || themeColors.blue;
    const root = document.documentElement;
    
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-hover', colors.hover || colors.secondary);
    root.style.setProperty('--color-bg-light', isDark ? colors.bgDark : colors.bgLight);
    root.style.setProperty('--color-text-blue-600', isDark ? '#ffffff' : colors.text);
    
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // تطبيق الثيم (الشخصي له الأولوية إذا وجد، وإلا ثيم المنصة)
  useEffect(() => {
    if (platformThemeLoaded) {
      const activeTheme = (user && user.personal_theme) ? user.personal_theme : platformTheme;
      const localDark = localStorage.getItem('darkMode');
      const activeDark = localDark !== null ? (localDark === 'true') : darkMode;
      applyTheme(activeTheme, activeDark);
    }
  }, [platformThemeLoaded, user, platformTheme, darkMode]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore
      }
      setLoading(false); // لا تنتظر الرد لفتح التطبيق بسرعة
      fetchUserSilent(); // تحديث صامت
    } else if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserSilent = async () => {
    try {
      const response = await axios.get(`${API}/auth/me?t=${new Date().getTime()}`);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      // الصمت في الخلفية
      if (error.response?.status === 401) {
        handleLogout();
      }
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me?t=${new Date().getTime()}`);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('original_token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
      </div>
    );
  }

  // التحقق من صلاحية لوحة التحكم
  const hasDashboardPermission = user && (
    user.role === 'admin' || 
    (user.permissions && user.permissions.includes('dashboard')) ||
    // التحقق من صلاحية dashboard في أي مشروع (per-project)
    Object.values(user.project_permissions || {}).some(perms => (perms || []).includes('dashboard'))
  );
  
  // تحديد الصفحة الافتراضية بناءً على الصلاحيات
  const getDefaultPage = () => {
    if (hasDashboardPermission) return <Dashboard user={user} onLogout={handleLogout} />;
    
    // التوجيه لأول صفحة متاحة حسب ترتيب القائمة الجانبية
    if (hasPermission(user, 'reports_view') || hasPermission(user, 'reports_add') || hasPermission(user, 'reports_review')) {
      return <Navigate to="/reports" />;
    }
    if (hasPermission(user, 'water_connections') || hasPermission(user, 'sewage_connections')) {
      return <Navigate to="/connections-hub" />;
    }
    if (hasPermission(user, 'contractors')) {
      return <Navigate to="/contractors" />;
    }
    if (hasPermission(user, 'safety_reports')) {
      return <Navigate to="/safety-reports" />;
    }
    if (hasPermission(user, 'quality_reports')) {
      return <Navigate to="/quality-reports" />;
    }
    if (hasPermission(user, 'business_reports') || hasPermission(user, 'business_reports_review')) {
      return <Navigate to="/business-reports" />;
    }
    if (hasPermission(user, 'extracts')) {
      return <Navigate to="/extracts" />;
    }
    if (hasPermission(user, 'invoices') || hasPermission(user, 'view_all_invoices') || hasPermission(user, 'review_invoices') || hasPermission(user, 'review_invoices_3')) {
      return <Navigate to="/invoices" />;
    }
    if (hasPermission(user, 'employee_requests') || hasPermission(user, 'view_all_employee_requests') || hasPermission(user, 'review_employee_requests')) {
      return <Navigate to="/employee-requests" />;
    }
    if (hasPermission(user, 'hr_management')) {
      return <Navigate to="/hr-management" />;
    }
    if (hasPermission(user, 'support_messages')) {
      return <Navigate to="/support-messages" />;
    }
    if (user.role === 'admin' || hasPermission(user, 'users_manage')) {
      return <Navigate to="/users" />;
    }
    if (user.role === 'admin' || hasPermission(user, 'team')) {
      return <Navigate to="/team" />;
    }
    if (hasPermission(user, 'cars') || hasPermission(user, 'cars_manage')) {
      return <Navigate to="/cars" />;
    }
    if (hasPermission(user, 'fleet_maintenance')) {
      return <Navigate to="/fleet-maintenance" />;
    }
    if (hasPermission(user, 'settings')) {
      return <Navigate to="/settings" />;
    }
    if (hasPermission(user, 'trash')) {
      return <Navigate to="/trash" />;
    }
    
    // صفحة افتراضية كحل أخير
    return <Reports user={user} onLogout={handleLogout} />;
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/"
          element={user ? getDefaultPage() : <Navigate to="/login" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/reports"
          element={user ? <Reports user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/reports/new"
          element={user && (
            user.role === 'admin' || 
            user.permissions?.includes('reports_add') ||
            // صلاحية reports_add ممنوحة في أي مشروع (per-project)
            Object.values(user.project_permissions || {}).some(perms => (perms || []).includes('reports_add'))
          ) ? <ReportForm user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/reports" : "/login"} />}
        />
        <Route
          path="/reports/edit/:id"
          element={user ? <ReportForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/trash"
          element={user ? <DeletedItems user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/users"
          element={user ? <Users user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={user ? <Settings user={user} onLogout={handleLogout} onLogin={handleLogin} /> : <Navigate to="/login" />}
        />
        <Route
          path="/team"
          element={user ? <TeamManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/cars"
          element={user ? <Cars user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/fleet-maintenance"
          element={user ? <FleetMaintenance user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/connections-hub"
          element={user ? <ConnectionsHub user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/connections-hub/:projectId"
          element={user ? <ConnectionsHub user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/water-connections"
          element={user ? <WaterConnections user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/sewage-connections"
          element={user ? <SewageConnections user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/support-messages"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'support_messages')) ? <SupportMessages user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />
        <Route
          path="/deleted-items"
          element={user ? <DeletedItems user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/contractors"
          element={user ? <Contractors user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/project-settings"
          element={user ? <ProjectSettings user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/extracts"
          element={user ? <Extracts user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/extracts/new"
          element={user ? <ExtractForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/extracts/edit/:id"
          element={user ? <ExtractForm user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/invoices"
          element={user ? <Invoices user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/employee-requests"
          element={user ? <EmployeeRequests user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/hr-management"
          element={user ? <HRManagement user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/safety-reports"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'safety_reports')) ? <SafetyReports user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />
        <Route
          path="/work-permits"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'work_permits')) ? <WorkPermits user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />
        <Route
          path="/quality-reports"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'quality_reports')) ? <QualityReports user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />
        <Route
          path="/business-reports"
          element={user && (user.role === 'admin' || hasAnyProjectPermission(user, 'business_reports') || hasAnyProjectPermission(user, 'business_reports_review')) ? <BusinessReports user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />
        <Route
          path="/archive"
          element={user && user.role === 'admin' ? <Archive user={user} onLogout={handleLogout} /> : <Navigate to={user ? "/" : "/login"} />}
        />
        {/* تم تعطيل نظام الدردشة */}
                <Route
          path="/chat"
          element={user ? <Chat user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
        <Route
          path="/consultant-notes"
          element={user ? <ConsultantNotes user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />
      </Routes>
      <SessionTimeoutModal 
        token={token} 
        onLogout={handleLogout} 
        onExtend={handleLogin}
      />
      <ToastContainer
        position="top-center"
        autoClose={2500}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ width: 'auto' }}
      />
    </BrowserRouter>
  );
}

export default App;
