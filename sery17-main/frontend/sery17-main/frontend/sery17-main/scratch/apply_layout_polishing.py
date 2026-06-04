# -*- coding: utf-8 -*-
import os

filepath = 'frontend/src/components/Layout.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace mobile safety reports sidebar
old_mobile_safety = """              {/* تقارير السلامة */}
              {hasPermission('safety_reports') && (
                <Link to="/safety-reports" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/safety-reports') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative ml-2 inline-block">
                        <ShieldAlert className="w-4 h-4 text-orange-500" />
                        {pendingSafetyCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 animate-bounce shadow-sm">
                            <Bell className="w-2 h-2 text-white fill-white" />
                          </span>
                        )}
                      </div>
                      {i18n.language === 'ar' ? 'تقارير السلامة' : 'Safety Reports'}
                    </div>
                    {pendingSafetyCount > 0 && (
                      <span className="text-base animate-bounce" title="تقارير بانتظار المراجعة">🔔<span className="text-xs font-bold text-orange-600 mr-0.5">{pendingSafetyCount}</span></span>
                    )}
                  </div>
                </Link>
              )}"""

new_mobile_safety = """              {/* تقارير السلامة */}
              {hasPermission('safety_reports') && (
                <Link to="/safety-reports" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/safety-reports') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ShieldAlert className="w-4 h-4 text-orange-500 ml-2" />
                      {i18n.language === 'ar' ? 'تقارير السلامة' : 'Safety Reports'}
                    </div>
                    {pendingSafetyCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingSafetyCount > 9 ? '9+' : pendingSafetyCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}"""

# 2. Replace mobile quality reports sidebar
old_mobile_quality = """              {/* تقارير الجودة */}
              {hasPermission('quality_reports') && (
                <Link to="/quality-reports" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/quality-reports') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative ml-2 inline-block">
                        <ClipboardCheck className="w-4 h-4 text-teal-500" />
                        {pendingQualityCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 animate-bounce shadow-sm">
                            <Bell className="w-2 h-2 text-white fill-white" />
                          </span>
                        )}
                      </div>
                      {i18n.language === 'ar' ? 'تقارير الجودة' : 'Quality Reports'}
                    </div>
                    {pendingQualityCount > 0 && (
                      <span className="text-base animate-bounce" title="تقارير بانتظار المراجعة">🔔<span className="text-xs font-bold text-teal-600 mr-0.5">{pendingQualityCount}</span></span>
                    )}
                  </div>
                </Link>
              )}"""

new_mobile_quality = """              {/* تقارير الجودة */}
              {hasPermission('quality_reports') && (
                <Link to="/quality-reports" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/quality-reports') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ClipboardCheck className="w-4 h-4 text-teal-500 ml-2" />
                      {i18n.language === 'ar' ? 'تقارير الجودة' : 'Quality Reports'}
                    </div>
                    {pendingQualityCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingQualityCount > 9 ? '9+' : pendingQualityCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}"""

# 3. Replace mobile business reports sidebar
old_mobile_business = """              {/* تقارير الأعمال */}
              {hasPermission('business_reports') && (
                <Link to="/business-reports" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/business-reports') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="relative ml-2 inline-block">
                        <FileBarChart2 className="w-4 h-4 text-blue-500" />
                        {pendingBusinessCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 animate-bounce shadow-sm">
                            <Bell className="w-2 h-2 text-white fill-white" />
                          </span>
                        )}
                      </div>
                      {i18n.language === 'ar' ? 'تقارير الأعمال' : 'Business Reports'}
                    </div>
                    {pendingBusinessCount > 0 && (
                      <span className="text-base animate-bounce" title="تقارير بانتظار المراجعة">🔔<span className="text-xs font-bold text-blue-600 mr-0.5">{pendingBusinessCount}</span></span>
                    )}
                  </div>
                </Link>
              )}"""

new_mobile_business = """              {/* تقارير الأعمال */}
              {hasPermission('business_reports') && (
                <Link to="/business-reports" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/business-reports') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileBarChart2 className="w-4 h-4 text-blue-500 ml-2" />
                      {i18n.language === 'ar' ? 'تقارير الأعمال' : 'Business Reports'}
                    </div>
                    {pendingBusinessCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingBusinessCount > 9 ? '9+' : pendingBusinessCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}"""

# 4. Replace desktop safety reports sidebar
old_desktop_safety = """            {/* تقارير السلامة */}
            {hasPermission('safety_reports') && (
              <Link
                to="/safety-reports"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/safety-reports') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box relative">
                  <ShieldAlert className="w-5 h-5 text-orange-500" />
                  {pendingSafetyCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 animate-bounce shadow-md">
                      <Bell className="w-2.5 h-2.5 text-white fill-white" />
                    </span>
                  )}
                </div>
                <span className="sidebar-text">{i18n.language === 'ar' ? 'تقارير السلامة' : 'Safety Reports'}</span>
              </Link>
            )}"""

new_desktop_safety = """            {/* تقارير السلامة */}
            {hasPermission('safety_reports') && (
              <Link
                to="/safety-reports"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/safety-reports') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <ShieldAlert className="w-5 h-5 text-orange-500" />
                    </div>
                    <span className="sidebar-text">{i18n.language === 'ar' ? 'تقارير السلامة' : 'Safety Reports'}</span>
                  </div>
                  {pendingSafetyCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {pendingSafetyCount > 9 ? '9+' : pendingSafetyCount}
                    </span>
                  )}
                </div>
              </Link>
            )}"""

# 5. Replace desktop quality reports sidebar
old_desktop_quality = """            {/* تقارير الجودة */}
            {hasPermission('quality_reports') && (
              <Link
                to="/quality-reports"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/quality-reports') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box relative">
                  <ClipboardCheck className="w-5 h-5 text-teal-500" />
                  {pendingQualityCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 animate-bounce shadow-md">
                      <Bell className="w-2.5 h-2.5 text-white fill-white" />
                    </span>
                  )}
                </div>
                <span className="sidebar-text">{i18n.language === 'ar' ? 'تقارير الجودة' : 'Quality Reports'}</span>
              </Link>
            )}"""

new_desktop_quality = """            {/* تقارير الجودة */}
            {hasPermission('quality_reports') && (
              <Link
                to="/quality-reports"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/quality-reports') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <ClipboardCheck className="w-5 h-5 text-teal-500" />
                    </div>
                    <span className="sidebar-text">{i18n.language === 'ar' ? 'تقارير الجودة' : 'Quality Reports'}</span>
                  </div>
                  {pendingQualityCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {pendingQualityCount > 9 ? '9+' : pendingQualityCount}
                    </span>
                  )}
                </div>
              </Link>
            )}"""

# 6. Replace desktop business reports sidebar
old_desktop_business = """            {/* تقارير الأعمال */}
            {hasPermission('business_reports') && (
              <Link
                to="/business-reports"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/business-reports') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box relative">
                  <FileBarChart2 className="w-5 h-5 text-blue-500" />
                  {pendingBusinessCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 animate-bounce shadow-md">
                      <Bell className="w-2.5 h-2.5 text-white fill-white" />
                    </span>
                  )}
                </div>
                <span className="sidebar-text">{i18n.language === 'ar' ? 'تقارير الأعمال' : 'Business Reports'}</span>
              </Link>
            )}"""

new_desktop_business = """            {/* تقارير الأعمال */}
            {hasPermission('business_reports') && (
              <Link
                to="/business-reports"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/business-reports') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <FileBarChart2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="sidebar-text">{i18n.language === 'ar' ? 'تقارير الأعمال' : 'Business Reports'}</span>
                  </div>
                  {pendingBusinessCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {pendingBusinessCount > 9 ? '9+' : pendingBusinessCount}
                    </span>
                  )}
                </div>
              </Link>
            )}"""

# 7. Water and Sewage Connections Governorates and Projects in notifications
old_connections = """                                          <p className="text-xs text-gray-700 mt-1 truncate font-semibold">
                                            🏛️ {isRtl ? 'المحافظة:' : 'Gov:'} {c.governorate || c.area || (isRtl ? 'غير محدد' : 'Unspecified')}
                                          </p>
                                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                                            📁 {isRtl ? 'المشروع:' : 'Project:'} {c.project?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}
                                          </p>"""

new_connections = """                                          <p className="text-xs text-gray-700 mt-1 truncate font-semibold">
                                            🏛️ {isRtl ? 'المحافظة:' : 'Gov:'} {translateBrandingText(c.governorate || c.area, isRtl) || (isRtl ? 'غير محدد' : 'Unspecified')}
                                          </p>
                                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                                            📁 {isRtl ? 'المشروع:' : 'Project:'} {translateBrandingText(c.project, isRtl)?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}
                                          </p>"""

# 8. Seen reports governorate, type, and contractor in notifications
old_seen_reports = """                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        {report.report_type} • {report.contractor}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        {report.governorate}
                                      </p>"""

new_seen_reports = """                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        {translateBrandingText(report.report_type, isRtl)} • {translateBrandingText(report.contractor, isRtl)}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        {translateBrandingText(report.governorate, isRtl)}
                                      </p>"""


# Helper to replace if present
def rep(src, old, new, desc):
    if old in src:
        src = src.replace(old, new)
        print(f"✅ Replaced {desc}")
    else:
        # Try normalization of line endings in case of mismatch
        old_normalized = old.replace('\r\n', '\n')
        new_normalized = new.replace('\r\n', '\n')
        src_normalized = src.replace('\r\n', '\n')
        if old_normalized in src_normalized:
            src_normalized = src_normalized.replace(old_normalized, new_normalized)
            src = src_normalized
            print(f"✅ Replaced {desc} (normalized line endings)")
        else:
            print(f"❌ Failed to find: {desc}")
    return src

content = rep(content, old_mobile_safety, new_mobile_safety, "mobile safety sidebar")
content = rep(content, old_mobile_quality, new_mobile_quality, "mobile quality sidebar")
content = rep(content, old_mobile_business, new_mobile_business, "mobile business sidebar")
content = rep(content, old_desktop_safety, new_desktop_safety, "desktop safety sidebar")
content = rep(content, old_desktop_quality, new_desktop_quality, "desktop quality sidebar")
content = rep(content, old_desktop_business, new_desktop_business, "desktop business sidebar")
content = rep(content, old_connections, new_connections, "connections gov and project in notifications")
content = rep(content, old_seen_reports, new_seen_reports, "seen reports details in notifications")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Done Layout polishing!")
