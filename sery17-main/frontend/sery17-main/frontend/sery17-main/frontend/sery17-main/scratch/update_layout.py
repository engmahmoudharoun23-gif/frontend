import os
import re

filepath = 'd:/sery17-main/sery17-main/frontend/src/components/Layout.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Profile Picture and Username and Logout block with the new layout
old_block = r"""              {/\* Profile Picture \*/}
              \{user\.profile_picture \? \(
                <img 
                  src=\{user\.profile_picture\} 
                  alt="Profile" 
                  className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-white shadow-lg cursor-pointer hover:border-yellow-300 transition-all"
                  title=\{translateBrandingText\(user\.full_name, isRtl\) \|\| user\.username\}
                />
              \) : \(
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold border-2 border-white shadow-lg">
                  \{translateBrandingText\(user\.full_name, isRtl\)\?\.charAt\(0\) \|\| user\.username\?\.charAt\(0\) \|\| '👤'\}
                </div>
              \)\}
              
              {/\* User Name - Hidden on small screens \*/}
              <span className="hidden md:flex text-white font-medium items-center gap-2 text-sm lg:text-base">
                \{user\.title && \(
                  <span className="text-lg lg:text-2xl" title=\{translateBrandingText\(user\.title, isRtl\)\}>
                    \{user\.title\.includes\('مهندس'\) \|\| user\.title\.includes\('المهندس'\) \? '👨‍💼' : 
                     user\.title\.includes\('دكتور'\) \|\| user\.title\.includes\('الدكتور'\) \? '👨‍⚕️' :
                     user\.title\.includes\('أستاذ'\) \|\| user\.title\.includes\('الأستاذ'\) \? '👨‍🏫' :
                     user\.title\.includes\('مدير'\) \|\| user\.title\.includes\('المدير'\) \? '👔' :
                     '👤'\}
                  </span>
                \)\}
                <span>\{translateBrandingText\(user\.full_name, isRtl\)\}</span>
              </span>
              
              {/\* Admin Badge \*/}
              \{user\.role === 'admin' && \(
                <span className="hidden sm:inline-block bg-purple-100 text-purple-800 text-\[10px\] sm:text-xs font-semibold px-1\.5 sm:px-2\.5 py-0\.5 rounded">
                  \{t\('header\.admin'\)\}
                </span>
              \)\}
              
              

              
              {/\* Logout Button - Premium Styling \*/}
              <button
                onClick=\{onLogout\}
                className="group flex items-center gap-1\.5 sm:gap-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-3 py-1\.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 border border-red-400/30"
              >
                <svg className="w-3\.5 h-3\.5 sm:w-4 sm:h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth=\{2\.5\} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">\{t\('common\.logout'\)\}</span>
                <span className="sm:hidden">\{t\('common\.logout'\)\}</span>
              </button>
            </div>"""

new_block = """              {/* Desktop Profile Section */}
              <div className="hidden sm:flex items-center gap-2 lg:gap-4">
                {user.profile_picture ? (
                  <img 
                    src={user.profile_picture} 
                    alt="Profile" 
                    className="w-10 h-10 lg:w-14 lg:h-14 rounded-full object-cover border-2 border-white shadow-sm cursor-pointer hover:border-yellow-300 transition-all"
                    title={translateBrandingText(user.full_name, isRtl) || user.username}
                  />
                ) : (
                  <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold border-2 border-white shadow-sm cursor-pointer">
                    {translateBrandingText(user.full_name, isRtl)?.charAt(0) || user.username?.charAt(0) || '👤'}
                  </div>
                )}
                
                <span className="text-white font-medium flex items-center gap-2 text-sm lg:text-base">
                  {user.title && (
                    <span className="text-lg lg:text-2xl" title={translateBrandingText(user.title, isRtl)}>
                      {user.title.includes('مهندس') || user.title.includes('المهندس') ? '👨‍💼' : 
                       user.title.includes('دكتور') || user.title.includes('الدكتور') ? '👨‍⚕️' :
                       user.title.includes('أستاذ') || user.title.includes('الأستاذ') ? '👨‍🏫' :
                       user.title.includes('مدير') || user.title.includes('المدير') ? '👔' :
                       '👤'}
                    </span>
                  )}
                  <span>{translateBrandingText(user.full_name, isRtl)}</span>
                </span>
                
                {user.role === 'admin' && (
                  <span className="bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 rounded">
                    {t('header.admin')}
                  </span>
                )}
                
                <button
                  onClick={onLogout}
                  className="group flex items-center gap-1.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white px-3 py-1.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 border border-red-400/30 ml-2"
                >
                  <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{t('common.logout')}</span>
                </button>
              </div>

              {/* Mobile Profile Dropdown */}
              <div className="sm:hidden relative flex items-center h-full">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center outline-none focus:outline-none"
                >
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold border-2 border-white shadow-md">
                      {translateBrandingText(user.full_name, isRtl)?.charAt(0) || user.username?.charAt(0) || '👤'}
                    </div>
                  )}
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)}></div>
                    <div className="absolute top-12 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden" style={{ [isRtl ? 'left' : 'right']: 0 }}>
                      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
                        {user.profile_picture ? (
                          <img 
                            src={user.profile_picture} 
                            alt="Profile" 
                            className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold border border-blue-200">
                            {translateBrandingText(user.full_name, isRtl)?.charAt(0) || user.username?.charAt(0) || '👤'}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-gray-800 text-sm truncate">{translateBrandingText(user.full_name, isRtl)}</span>
                          <span className="text-xs text-gray-500 truncate">{user.role === 'admin' ? t('header.admin') : translateBrandingText(user.title, isRtl) || 'مستخدم'}</span>
                        </div>
                      </div>
                      <div className="px-2 py-2">
                        <button
                          onClick={() => {
                              setUserMenuOpen(false);
                              onLogout();
                          }}
                          className="w-full group flex justify-center items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-transparent hover:border-red-200"
                        >
                          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>{t('common.logout')}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>"""

content = re.sub(old_block, new_block, content, count=1)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing layout block.")
