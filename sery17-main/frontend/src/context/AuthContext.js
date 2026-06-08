// Auth Context - Centralized authentication state management
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  const handleForceLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setShowSessionExpiredModal(false);
    window.location.href = '/login';
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);

    // Global Axios Interceptor for 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          const detail = error.response.data?.detail;
          if (detail === 'session_expired_logged_in_elsewhere') {
            setShowSessionExpiredModal(true);
          } else if (
            error.config && 
            !error.config.url?.includes('/auth/login') && 
            !error.config.url?.includes('/auth/extend')
          ) {
            // For general 401 unauthorized (not from login)
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            // We only redirect if the special modal isn't already going to show
            if (detail !== 'session_expired_logged_in_elsewhere') {
                window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Login function
  const login = useCallback(async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        username,
        password,
      });
      
      const { access_token, user: userData } = response.data;
      
      // Store in state
      setToken(access_token);
      setUser(userData);
      
      // Store in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { success: true, user: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'فشل تسجيل الدخول' 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  // Update user data
  const updateUser = useCallback((newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  }, []);

  // Check if user has permission
  const hasPermission = useCallback((permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  }, [user]);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    token,
    loading,
    isAdmin,
    login,
    logout,
    updateUser,
    hasPermission,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showSessionExpiredModal && (
        <div className="fixed inset-0 z-[99999] bg-black bg-opacity-70 flex items-center justify-center p-4 backdrop-blur-sm" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center border-t-8 border-red-600 transform transition-all scale-100 animate-fade-in-up">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <svg className="w-12 h-12 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">تنبيه أمني هام</h2>
            <p className="text-xl font-bold text-red-600 mb-8 leading-relaxed bg-red-50 p-4 rounded-xl border border-red-100">
              تم تسجيل الدخول إلى حسابك من جهاز آخر!
            </p>
            <button 
              onClick={handleForceLogout}
              className="w-full px-6 py-4 bg-red-600 text-white text-xl rounded-xl font-black hover:bg-red-700 transition-colors shadow-lg hover:shadow-red-500/50 transform hover:-translate-y-1"
            >
              أوكي (OK)
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
