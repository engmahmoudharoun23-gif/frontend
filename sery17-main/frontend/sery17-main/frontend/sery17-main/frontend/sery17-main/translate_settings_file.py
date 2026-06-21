import re

with open('frontend/src/pages/Settings.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Let's perform replacements

replacements = [
    # Alerts and confirms
    ("toast.error('فشل في جلب سجل النشاطات');", "toast.error(t('settings.errors.fetchLogs'));"),
    ("if (!window.confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من جميع الأجهزة الأخرى؟ سيتم إنهاء جميع الجلسات باستثناء هذه الجلسة.')) {", "if (!window.confirm(t('settings.confirms.logoutOthers'))) {"),
    ("toast.success('تم تسجيل الخروج من الاجهزة الاخري بنجاح');", "toast.success(t('settings.success.logoutOthers'));"),
    ("toast.error(error.response?.data?.detail || 'فشل تنفيذ العملية');", "toast.error(error.response?.data?.detail || t('settings.errors.generic'));"),
    ("toast.error('كلمة المرور الجديدة غير متطابقة');", "toast.error(t('settings.errors.passwordMismatch'));"),
    ("toast.success('تم تغيير كلمه المرور بنجاح');", "toast.success(t('settings.success.passwordChanged'));"),
    ("toast.success('تم حفظ التغيرات');", "toast.success(t('settings.success.changesSaved'));"),
    ("toast.error(error.response?.data?.detail || 'فشل في تحديث الملف الشخصي');", "toast.error(error.response?.data?.detail || t('settings.errors.profileUpdate'));"),
    ("toast.error('فشل في رفع الصورة');", "toast.error(t('settings.errors.imageUpload'));"),
    ("toast.success('تم حفظ الإعدادات بنجاح');", "toast.success(t('settings.success.settingsSaved'));"),
    ("toast.error('فشل في حفظ الإعدادات');", "toast.error(t('settings.errors.settingsSave'));"),
    ("toast.success('تم رفع الصورة بنجاح');", "toast.success(t('settings.success.imageUpload'));"),
    ("toast.success('تم تغير اللون بنجاح');", "toast.success(t('settings.success.colorChanged'));"),
    ("toast.error('فشل تغيير المظهر');", "toast.error(t('settings.errors.themeChange'));"),
    ("toast.success('تم تغيير الوضع وتعميمه على المنصة');", "toast.success(t('settings.success.darkModeGlobal'));"),
    ("toast.success('تم تغيير الوضع الداكن لجهازك');", "toast.success(t('settings.success.darkModeLocal'));"),
    ("toast.success('تم تغيير الوضع الداكن لحسابك');", "toast.success(t('settings.success.darkModeAccount'));"),
    ("toast.success('تم حفظ إعدادات المنصة بنجاح');", "toast.success(t('settings.success.platformSettingsSaved'));"),
    ("toast.error('فشل في تحديث اسم المنصة');", "toast.error(t('settings.errors.platformNameUpdate'));"),
    ("toast.success('تم تغير لون المنصة بنجاح');", "toast.success(t('settings.success.platformThemeSaved'));"),
    ("toast.error('فشل في تغيير ثيم المنصة');", "toast.error(t('settings.errors.platformThemeUpdate'));"),
    ("toast.success('تم رفع صورة العضوية الجديدة');", "toast.success(t('settings.success.membershipImageUploaded'));"),
    ("toast.success('تم تحديث التواريخ');", "toast.success(t('settings.success.datesUpdated'));"),
    ("if (window.confirm('هل أنت متأكد من حذف صورة العضوية؟')) {", "if (window.confirm(t('settings.confirms.deleteMembership'))) {"),
    ("toast.success('تم حذف الصورة');", "toast.success(t('settings.success.imageDeleted'));"),
    ("toast.success('تم رفع الشهادة الجديدة');", "toast.success(t('settings.success.certUploaded'));"),
    ("toast.success('تم تحديث البيانات');", "toast.success(t('settings.success.dataUpdated'));"),
    ("if (window.confirm('هل أنت متأكد من حذف هذه الشهادة؟')) {", "if (window.confirm(t('settings.confirms.deleteCert'))) {"),

    # Themes and navItems definitions
    (
        "{ id: 'blue', name: 'أزرق عصري', primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', bgLight: '#eff6ff' }",
        "{ id: 'blue', name: t('settings.themes.blue'), primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', bgLight: '#eff6ff' }"
    ),
    (
        "{ id: 'green', name: 'أخضر ملكي', primary: '#059669', secondary: '#10b981', accent: '#34d399', bgLight: '#ecfdf5' }",
        "{ id: 'green', name: t('settings.themes.green'), primary: '#059669', secondary: '#10b981', accent: '#34d399', bgLight: '#ecfdf5' }"
    ),
    (
        "{ id: 'purple', name: 'بنفسجي فاخر', primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', bgLight: '#f5f3ff' }",
        "{ id: 'purple', name: t('settings.themes.purple'), primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', bgLight: '#f5f3ff' }"
    ),
    (
        "{ id: 'rose', name: 'وردي أنيق', primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', bgLight: '#fff1f2' }",
        "{ id: 'rose', name: t('settings.themes.rose'), primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', bgLight: '#fff1f2' }"
    ),
    (
        "{ id: 'teal', name: 'تركوازي هادئ', primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', bgLight: '#f0fdfa' }",
        "{ id: 'teal', name: t('settings.themes.teal'), primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', bgLight: '#f0fdfa' }"
    ),
    (
        "{ id: 'amber', name: 'ذهبي كلاسيكي', primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', bgLight: '#fffbeb' }",
        "{ id: 'amber', name: t('settings.themes.amber'), primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', bgLight: '#fffbeb' }"
    ),
    (
        "{ id: 'slate', name: 'فحمي احترافي', primary: '#334155', secondary: '#475569', accent: '#94a3b8', bgLight: '#f8fafc' }",
        "{ id: 'slate', name: t('settings.themes.slate'), primary: '#334155', secondary: '#475569', accent: '#94a3b8', bgLight: '#f8fafc' }"
    ),
    (
        "{ id: 'profile', label: 'الملف الشخصي', icon: User, color: 'text-primary', bg: 'bg-bg-light' }",
        "{ id: 'profile', label: t('settings.profile'), icon: User, color: 'text-primary', bg: 'bg-bg-light' }"
    ),
    (
        "{ id: 'visuals', label: 'المظهر والألوان', icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50' }",
        "{ id: 'visuals', label: t('settings.visuals'), icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50' }"
    ),
    (
        "{ id: 'security', label: 'الأمان والخصوصية', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' }",
        "{ id: 'security', label: t('settings.security'), icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' }"
    ),
    (
        "{ id: 'branding', label: 'هوية المنصة', icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' }",
        "{ id: 'branding', label: t('settings.branding'), icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' }"
    ),
    (
        "{ id: 'platform', label: 'إعدادات النظام', icon: Settings2, color: 'text-slate-600', bg: 'bg-slate-50' }",
        "{ id: 'platform', label: t('settings.platform'), icon: Settings2, color: 'text-slate-600', bg: 'bg-slate-50' }"
    ),
    (
        "{ id: 'professional', label: 'الملف المهني', icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' }",
        "{ id: 'professional', label: t('settings.professional'), icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' }"
    ),
    (
        "{ id: 'about', label: 'حول النظام', icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' }",
        "{ id: 'about', label: t('settings.about'), icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' }"
    ),

    # Layout details & direction & alignment
    (
        '<div className="max-w-[1400px] mx-auto p-4 lg:p-8" dir="rtl">',
        '<div className="max-w-[1400px] mx-auto p-4 lg:p-8" dir={i18n.language === \'ar\' ? \'rtl\' : \'ltr\'}>'
    ),
    (
        '<p className="text-slate-500 font-medium mr-16">إدارة ملفك الشخصي</p>',
        '<p className="text-slate-500 font-medium rtl:mr-16 ltr:ml-16">{t(\'settings.header.subtitle\')}</p>'
    ),
    (
        '<div className="text-left">',
        '<div className="rtl:text-left ltr:text-right">'
    ),
    (
        '<p className="text-xs font-black text-slate-400 uppercase tracking-widest text-right">المستخدم الحالي</p>',
        '<p className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:text-right ltr:text-left">{t(\'settings.header.currentUser\')}</p>'
    ),
    (
        '<h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">',
        '<h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">\n              <span className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100">\n                <Settings2 className="w-8 h-8 text-primary" />\n              </span>\n              {t(\'settings.header.title\')}'
    ),

    # Remove the hardcoded span in Settings2 header since we replaced the whole header text/icon structure
    (
        'إإعدادات الحساب والنظام',
        'تعديل إعدادات الحساب والنظام' # safety replacement (this shouldn\'t occur since we matched h1 completely)
    ),

    # Panel: Profile JSX
    (
        '<p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">دور المستخدم</p>',
        '<p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t(\'settings.profileTab.userRole\')}</p>'
    ),
    (
        "{isAdmin ? 'مدير النظام (Admin)' : 'مستخدم (Staff)'}",
        "{isAdmin ? t('settings.profileTab.roles.admin') : t('settings.profileTab.roles.staff')}"
    ),
    (
        '<label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">الاسم الكامل</label>',
        '<label className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2">{t(\'settings.profileTab.fullName\')}</label>'
    ),
    (
        '<label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">اسم المستخدم</label>',
        '<label className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2">{t(\'settings.profileTab.username\')}</label>'
    ),
    (
        'تغيير كلمة المرور',
        '{t(\'settings.profileTab.changePassword\')}'
    ),
    (
        'placeholder="كلمة المرور الحالية"',
        'placeholder={t(\'settings.profileTab.placeholders.currentPassword\')}'
    ),
    (
        'placeholder="كلمة المرور الجديدة"',
        'placeholder={t(\'settings.profileTab.placeholders.newPassword\')}'
    ),
    (
        'placeholder="تأكيد كلمة المرور"',
        'placeholder={t(\'settings.profileTab.placeholders.confirmPassword\')}'
    ),
    (
        "{loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}",
        "{loading ? t('settings.profileTab.saving') : t('settings.profileTab.saveChanges')}"
    ),

    # Panel: Visuals JSX
    (
        'الثيم الشخصي للمنصة',
        '{t(\'settings.visualsTab.title\')}'
    ),
    (
        '<p className="text-slate-500 font-medium mb-8">اختر نظام الألوان الذي تفضل العمل به. هذا الاختيار يخص حسابك فقط.</p>',
        '<p className="text-slate-500 font-medium mb-8">{t(\'settings.visualsTab.desc\')}</p>'
    ),
    (
        '<p className="text-xs font-black text-slate-700">الافتراضي (النظام)</p>',
        '<p className="text-xs font-black text-slate-700">{t(\'settings.visualsTab.default\')}</p>'
    ),

    # Panel: Branding JSX
    (
        '<h3 className="text-lg font-black text-amber-900 mb-1">إدارة هوية المنصة</h3>',
        '<h3 className="text-lg font-black text-amber-900 mb-1">{t(\'settings.brandingTab.title\')}</h3>'
    ),
    (
        '<p className="text-amber-800/70 text-sm font-medium">تعديل الشعارات، أسماء المسؤولين، والنصوص التعريفية التي تظهر لجميع المستخدمين وفي صفحة الدخول.</p>',
        '<p className="text-amber-800/70 text-sm font-medium">{t(\'settings.brandingTab.desc\')}</p>'
    ),
    (
        'الشعارات الرسمية',
        '{t(\'settings.brandingTab.logosTitle\')}'
    ),
    (
        '<p className="font-bold text-slate-800 text-sm">شعار الشركة الرئيسي</p>',
        '<p className="font-bold text-slate-800 text-sm">{t(\'settings.brandingTab.mainLogo\')}</p>'
    ),
    (
        '<p className="text-xs text-slate-400">يفضل خلفية شفافة PNG</p>',
        '<p className="text-xs text-slate-400">{t(\'settings.brandingTab.pngHint\')}</p>'
    ),
    (
        '<p className="font-bold text-slate-800 text-sm">شعار الشركة الشريكة</p>',
        '<p className="font-bold text-slate-800 text-sm">{t(\'settings.brandingTab.partnerLogo\')}</p>'
    ),
    (
        '<p className="text-xs text-slate-400">يظهر بجانب الشعار الرئيسي</p>',
        '<p className="text-xs text-slate-400">{t(\'settings.brandingTab.partnerLogoHint\')}</p>'
    ),
    (
        'إدارة الأسماء والمسميات',
        '{t(\'settings.brandingTab.namesTitle\')}'
    ),
    (
        'placeholder="مدير المشروع"',
        'placeholder={t(\'settings.brandingTab.placeholders.projectManager\')}'
    ),
    (
        'placeholder="المسمى الوظيفي"',
        'placeholder={t(\'settings.brandingTab.placeholders.title\')}'
    ),
    (
        'placeholder="منسق المشروع"',
        'placeholder={t(\'settings.brandingTab.placeholders.projectCoordinator\')}'
    ),
    (
        'جميع الحقوق محفوظة (Footer Settings)',
        '{t(\'settings.brandingTab.footerSettings\')}'
    ),
    (
        '<label className="text-sm font-black text-slate-700 block">السنة (التي تظهر بجانب ©)</label>',
        '<label className="text-sm font-black text-slate-700 block">{t(\'settings.brandingTab.yearLabel\')}</label>'
    ),
    (
        '<label className="text-sm font-black text-slate-700 block">نص الحقوق (جميع الحقوق محفوظة)</label>',
        '<label className="text-sm font-black text-slate-700 block">{t(\'settings.brandingTab.copyrightLabel\')}</label>'
    ),
    (
        'placeholder="2026"',
        'placeholder={t(\'settings.brandingTab.placeholders.year\')}'
    ),
    (
        'placeholder="جميع الحقوق محفوظة"',
        'placeholder={t(\'settings.brandingTab.placeholders.copyright\')}'
    ),
    (
        '<label className="text-sm font-black text-slate-700 block">وصف صفحة الدخول (Login Footer)</label>',
        '<label className="text-sm font-black text-slate-700 block">{t(\'settings.brandingTab.loginFooterLabel\')}</label>'
    ),
    (
        '<label className="text-sm font-black text-slate-700 block">الوصف أسفل صفحات النظام (Internal Footer)</label>',
        '<label className="text-sm font-black text-slate-700 block">{t(\'settings.brandingTab.internalFooterLabel\')}</label>'
    ),
    (
        '<label className="text-sm font-black text-slate-700 block">عنوان لوحة التحكم (Dashboard Title)</label>',
        '<label className="text-sm font-black text-slate-700 block">{t(\'settings.brandingTab.dashboardTitleLabel\')}</label>'
    ),
    (
        '<span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold uppercase tracking-wider">تخصيص العناوين والنصوص الإضافية</span>',
        '<span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold uppercase tracking-wider">{t(\'settings.brandingTab.customizeText\')}</span>'
    ),
    (
        'الإعلان العام (شريط المناسبات العاجلة)',
        '{t(\'settings.brandingTab.announcementTitle\')}'
    ),
    (
        '<label className="text-sm font-black text-slate-700 block">نص الإعلان (يظهر باللون الأحمر أعلى جميع صفحات المنصة)</label>',
        '<label className="text-sm font-black text-slate-700 block">{t(\'settings.brandingTab.announcementLabel\')}</label>'
    ),
    (
        'placeholder="مثال: كل عام وأنتم بخير بمناسبة عيد الفطر المبارك..."',
        'placeholder={t(\'settings.brandingTab.placeholders.announcement\')}'
    ),
    (
        '<span className="text-sm font-bold text-slate-700">تفعيل الإعلان (إظهار الشريط للجميع)</span>',
        '<span className="text-sm font-bold text-slate-700">{t(\'settings.brandingTab.enableAnnouncement\')}</span>'
    ),
    (
        "{savingBranding ? 'جاري حفظ الهوية...' : 'حفظ إعدادات الهوية'}",
        "{savingBranding ? t('settings.brandingTab.saving') : t('settings.brandingTab.saveBranding')}"
    ),

    # Panel: Platform Settings JSX
    (
        'إعدادات النظام العامة',
        '{t(\'settings.platformTab.title\')}'
    ),
    (
        '<label className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">اسم المنصة (يظهر في المتصفح والعناوين)</label>',
        '<label className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2">{t(\'settings.platformTab.nameLabel\')}</label>'
    ),
    (
        'حفظ',
        '{t(\'settings.platformTab.saveBtn\')}'
    ),
    (
        'ثيم المنصة الافتراضي (لجميع المستخدمين)',
        '{t(\'settings.platformTab.themeTitle\')}'
    ),
    (
        '<p className="text-slate-500 font-medium">هذا الاختيار سيطبق على جميع المستخدمين الذين لم يختاروا ثيماً شخصياً.</p>',
        '<p className="text-slate-500 font-medium">{t(\'settings.platformTab.themeDesc\')}</p>'
    ),

    # Panel: Professional Profile JSX
    (
        'م/ محمود محمد هارون',
        '{i18n.language === \'en\' ? \'Eng. Mahmoud Mohamed Haroun\' : \'م/ محمود محمد هارون\'}'
    ),
    (
        'مهندس نظم معلومات معتمد',
        '{t(\'settings.professionalTab.certifiedEng\')}'
    ),
    (
        'عضو الهيئة السعودية للمهندسين - رقم (534779). متخصص في تحليل البيانات وتصميم الأنظمة المتكاملة للمشاريع.',
        '{t(\'settings.professionalTab.engBio\')}'
    ),
    (
        'بطاقة العضوية الهندسية',
        '{t(\'settings.professionalTab.membershipCard\')}'
    ),
    (
        'لا توجد صورة عضوية',
        '{t(\'settings.professionalTab.noMembershipImage\')}'
    ),
    (
        'الشهادات الاحترافية',
        '{t(\'settings.professionalTab.professionalCerts\')}'
    ),
    (
        'لا توجد شهادات مرفوعة',
        '{t(\'settings.professionalTab.noCerts\')}'
    ),

    # Panel: Security JSX
    (
        'الأمان وحماية البيانات',
        '{t(\'settings.securityTab.title\')}'
    ),
    (
        '<p className="text-slate-500 font-medium">نحن نأخذ خصوصيتك على محمل الجد. جميع البيانات مشفرة ومحمية بأعلى المعايير.</p>',
        '<p className="text-slate-500 font-medium">{t(\'settings.securityTab.desc\')}</p>'
    ),
    (
        '<p className="font-bold text-slate-800 text-sm">تسجيل الدخول الثنائي</p>',
        '<p className="font-bold text-slate-800 text-sm">{t(\'settings.securityTab.twoFactor\')}</p>'
    ),
    (
        '<p className="text-xs text-slate-400 font-medium">إضافة طبقة حماية إضافية لحسابك عبر الهاتف.</p>',
        '<p className="text-xs text-slate-400 font-medium">{t(\'settings.securityTab.twoFactorDesc\')}</p>'
    ),
    (
        '<span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-500">قريباً</span>',
        '<span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-500">{t(\'settings.securityTab.soon\')}</span>'
    ),
    (
        '<p className="font-bold text-slate-800 text-sm">سجل النشاطات</p>',
        '<p className="font-bold text-slate-800 text-sm">{t(\'settings.securityTab.activityLog\')}</p>'
      ),
    (
        '<p className="text-xs text-slate-400 font-medium">متابعة جميع عمليات الدخول والتعديلات على حسابك.</p>',
        '<p className="text-xs text-slate-400 font-medium">{t(\'settings.securityTab.activityLogDesc\')}</p>'
    ),
    (
        "{fetchingLogs ? 'جاري التحميل...' : 'عرض السجل'}",
        "{fetchingLogs ? t('settings.securityTab.loading') : t('settings.securityTab.viewLog')}"
    ),
    (
        '<span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">متاح</span>',
        '<span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">{t(\'settings.securityTab.available\')}</span>'
    ),
    (
        '<p className="font-bold text-slate-800 text-sm">تشفير المستندات</p>',
        '<p className="font-bold text-slate-800 text-sm">{t(\'settings.securityTab.encryption\')}</p>'
    ),
    (
        '<p className="text-xs text-slate-400 font-medium">جميع المرفقات والصور يتم تشفيرها تلقائياً.</p>',
        '<p className="text-xs text-slate-400 font-medium">{t(\'settings.securityTab.encryptionDesc\')}</p>'
    ),
    (
        '<span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">مفعّل</span>',
        '<span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">{t(\'settings.securityTab.enabled\')}</span>'
    ),
    (
        '<p className="font-bold text-red-700 text-sm">تسجيل الخروج من جميع الأجهزة</p>',
        '<p className="font-bold text-red-700 text-sm">{t(\'settings.securityTab.logoutOthersTitle\')}</p>'
    ),
    (
        '<p className="text-xs text-red-600/70 font-medium">سيتم إنهاء جميع الجلسات النشطة باستثناء هذه الجلسة.</p>',
        '<p className="text-xs text-red-600/70 font-medium">{t(\'settings.securityTab.logoutOthersDesc\')}</p>'
    ),
    (
        "{loading ? 'جاري التنفيذ...' : 'تنفيذ'}",
        "{loading ? t('settings.securityTab.executing') : t('settings.securityTab.execute')}"
    ),

    # Panel: About JSX
    (
        '<h3 className="text-3xl font-black text-slate-900 tracking-tight">نظام إدارة المشاريع</h3>',
        '<h3 className="text-3xl font-black text-slate-900 tracking-tight">{t(\'settings.aboutTab.title\')}</h3>'
    ),
    (
        '<p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">\n                    تم تطوير هذا النظام خصيصاً لخدمة مشاريع الاستشارات الهندسية، بهدف إتمام العمليات الميدانية وضمان دقة البيانات والتقارير.\n                  </p>',
        '<p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">\n                    {t(\'settings.aboutTab.desc\')}\n                  </p>'
    ),
    (
        '<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المطور التقني</p>',
        '<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(\'settings.aboutTab.developer\')}</p>'
    ),
    (
        '<p className="text-sm font-black">م/ محمود هارون</p>',
        '<p className="text-sm font-black">{t(\'settings.aboutTab.developerName\')}</p>'
    ),
    (
        '<p className="text-[10px] text-slate-400 font-medium">مهندس نظم معلومات وتحليل البيانات</p>',
        '<p className="text-[10px] text-slate-400 font-medium">{t(\'settings.aboutTab.developerTitle\')}</p>'
    ),

    # Modals JSX
    (
        'سجل النشاطات الأخير',
        '{t(\'settings.modals.logsTitle\')}'
    ),
    (
        '<p className="text-slate-400 font-bold">لا توجد نشاطات مسجلة حالياً</p>',
        '<p className="text-slate-400 font-bold">{t(\'settings.modals.noLogs\')}</p>'
    ),
    (
        '<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">يتم حفظ آخر 20 عملية فقط لضمان سرعة النظام</p>',
        '<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t(\'settings.modals.logsNote\')}</p>'
    ),
    (
        '<h3 className="text-2xl font-black text-slate-900 mb-6">تم تغيير كلمة المرور بنجاح</h3>',
        '<h3 className="text-2xl font-black text-slate-900 mb-6">{t(\'settings.modals.passwordSuccess\')}</h3>'
    )
]

for old, new in replacements:
    code = code.replace(old, new)

# Also let's translate the cert details dynamically inside the render loop!
# Lines:
# {certificates.map(cert => (
#   <div key={cert.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors cursor-pointer group">
#     <h5 className="font-black text-slate-800 text-xs mb-1 group-hover:text-indigo-700 transition-colors">{cert.title}</h5>
#     <p className="text-[10px] text-slate-400 font-bold mb-2">{cert.issuer} • {cert.duration}</p>
# Let's replace:
# {cert.title} with {i18n.language === 'en' ? cert.titleEn : cert.title}
# {cert.duration} with {i18n.language === 'en' ? '70 Hours' : cert.duration}

code = code.replace(
    'className="font-black text-slate-800 text-xs mb-1 group-hover:text-indigo-700 transition-colors">{cert.title}</h5>',
    'className="font-black text-slate-800 text-xs mb-1 group-hover:text-indigo-700 transition-colors">{i18n.language === \'en\' ? cert.titleEn : cert.title}</h5>'
)

code = code.replace(
    'className="text-[10px] text-slate-400 font-bold mb-2">{cert.issuer} • {cert.duration}</p>',
    'className="text-[10px] text-slate-400 font-bold mb-2">{cert.issuer} • {i18n.language === \'en\' ? \'70 Hours\' : cert.duration}</p>'
)

# And fix text-right or mr/ml in styling for LTR/RTL:
code = code.replace(
    'className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2"',
    'className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2"'
)
code = code.replace(
    'className="text-slate-500 font-medium mr-16"',
    'className="text-slate-500 font-medium rtl:mr-16 ltr:ml-16"'
)
code = code.replace(
    'className="text-center md:text-right space-y-4"',
    'className="text-center md:rtl:text-right md:ltr:text-left space-y-4"'
)
code = code.replace(
    'className="text-right"',
    'className="rtl:text-right ltr:text-left"'
)

with open('frontend/src/pages/Settings.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Settings.js translated successfully!")
