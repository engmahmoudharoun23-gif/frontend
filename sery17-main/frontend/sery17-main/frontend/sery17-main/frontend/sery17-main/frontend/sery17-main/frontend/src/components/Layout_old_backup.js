import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

function Layout({ children, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  
  // Check if mobile view
  const isMobileView = () => {
    return document.body.classList.contains('mobile-view');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logos */}
      <header className="bg-blue-600 shadow-md relative">
        {/* Watermark Logos */}
        <div className="absolute inset-0 flex justify-between items-center px-12 pointer-events-none">
          {/* Logo بيت الخبرة - Right Side */}
          <div className="transition-opacity duration-300 mr-16">
            <img 
              src="/bayt-alkhibra-logo.png" 
              alt="بيت الخبرة للإستشارات الهندسية" 
              className="h-20 w-auto object-contain"
            />
          </div>
          {/* Logo شركة المياة الوطنية - Left Side */}
          <div className="transition-opacity duration-300 ml-16">
            <img 
              src="/nwc-logo.png" 
              alt="شركة المياة الوطنية" 
              className="h-20 w-auto object-contain"
            />
          </div>
        </div>
        
        {/* Header Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center py-4 px-32">
            <div className="flex flex-col space-y-1">
              <h1 className="text-2xl font-bold text-white">نظام إدارة البلاغات المستلمة من WFM</h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm text-white/90">م/ أحمد عبيدات - مدير المشاريع</p>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-sm text-white/90">أ/ أحمد حافظ - منسق المشاريع</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse">
              {/* الصورة الشخصية */}
              {user.profile_picture ? (
                <img 
                  src={user.profile_picture} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold border-2 border-white shadow-lg">
                  {user.full_name?.charAt(0) || user.username?.charAt(0) || '👤'}
                </div>
              )}
              
              <span className="text-white font-medium flex items-center gap-2">
                {user.title && (
                  <span className="text-2xl" title={user.title}>
                    {user.title.includes('مهندس') || user.title.includes('المهندس') ? '👨‍💼' : 
                     user.title.includes('دكتور') || user.title.includes('الدكتور') ? '👨‍⚕️' :
                     user.title.includes('أستاذ') || user.title.includes('الأستاذ') ? '👨‍🏫' :
                     user.title.includes('مدير') || user.title.includes('المدير') ? '👔' :
                     '👤'}
                  </span>
                )}
                <span>{user.full_name}</span>
              </span>
              {user.role === 'admin' && (
                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                  مسؤول
                </span>
              )}
              {/* زر تبديل العرض */}
              <button
                onClick={() => {
                  const currentView = localStorage.getItem('deviceView') || 'desktop';
                  const newView = currentView === 'mobile' ? 'desktop' : 'mobile';
                  localStorage.setItem('deviceView', newView);
                  
                  // تطبيق العرض الجديد
                  let viewport = document.querySelector('meta[name="viewport"]');
                  if (!viewport) {
                    viewport = document.createElement('meta');
                    viewport.name = 'viewport';
                    document.head.appendChild(viewport);
                  }
                  
                  if (newView === 'mobile') {
                    viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                    document.body.classList.add('mobile-view');
                    document.body.classList.remove('desktop-view');
                  } else {
                    viewport.content = 'width=1200';
                    document.body.classList.add('desktop-view');
                    document.body.classList.remove('mobile-view');
                  }
                  
                  window.location.reload();
                }}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                title="تبديل العرض"
              >
                {(localStorage.getItem('deviceView') || 'desktop') === 'mobile' ? '🖥️' : '📱'}
              </button>
              
              <button
                onClick={onLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen">
          <nav className="p-4 space-y-2">
            <Link
              to="/"
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/') ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              لوحة التحكم
            </Link>
            
            {/* Projects Menu */}
            <div>
              <button
                onClick={() => setProjectsOpen(!projectsOpen)}
                className="w-full block px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 text-right"
              >
                <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                المشاريع
                <svg className={`inline-block w-4 h-4 mr-2 transition-transform ${projectsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {projectsOpen && (
                <div className="mr-4 mt-1 space-y-1">
                  {(user.projects.length === 0 || user.projects.includes('مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط')) && (
                    <>
                      <Link
                        to="/project/west"
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${location.pathname === '/project/west' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        📊 المحافظات الغربية
                      </Link>
                      <Link
                        to="/reports?project=مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط"
                        className={`block px-4 py-2 mr-4 rounded-lg text-xs transition-colors ${location.search.includes('القطاع الأوسط') && location.search.includes('الغربية') ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        📋 البلاغات
                      </Link>
                    </>
                  )}
                  {(user.projects.length === 0 || user.projects.includes('مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط')) && (
                    <>
                      <Link
                        to="/project/north"
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${location.pathname === '/project/north' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        📊 المحافظات الشمالية
                      </Link>
                      <Link
                        to="/reports?project=مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط"
                        className={`block px-4 py-2 mr-4 rounded-lg text-xs transition-colors ${location.search.includes('القطاع الأوسط') && location.search.includes('الشمالية') ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        📋 البلاغات
                      </Link>
                    </>
                  )}
                  {(user.projects.length === 0 || user.projects.includes('مشروع إصلاح أعمال المحافظات الجنوبية - القطاع الأوسط')) && (
                    <>
                      <Link
                        to="/project/south"
                        className={`block px-4 py-2 rounded-lg text-sm transition-colors ${location.pathname === '/project/south' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        📊 المحافظات الجنوبية
                      </Link>
                      <Link
                        to="/reports?project=مشروع إصلاح أعمال المحافظات الجنوبية - القطاع الأوسط"
                        className={`block px-4 py-2 mr-4 rounded-lg text-xs transition-colors ${location.search.includes('القطاع الأوسط') && location.search.includes('الجنوبية') ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-50'}`}
                      >
                        📋 البلاغات
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* تم حذف أيقونة البلاغات الرئيسية - البلاغات تحت كل مشروع فقط */}
            <Link
              to="/team"
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/team') ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              فريق العمل
            </Link>
            <Link
              to="/contractors"
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/contractors') ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              المقاولون
            </Link>
            <Link
              to="/users"
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/users') ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              إدارة المستخدمين
            </Link>
            <Link
              to="/settings"
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive('/settings') ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              الإعدادات
            </Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default Layout;
