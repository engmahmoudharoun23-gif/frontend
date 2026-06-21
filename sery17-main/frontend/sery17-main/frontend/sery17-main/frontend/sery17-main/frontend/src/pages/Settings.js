import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { invalidateBrandingCache } from '../hooks/useBranding';
import { translateBrandingText } from '../utils/brandingTranslation';
import imageCompression from 'browser-image-compression';
import { 
  User, 
  UserCheck,
  Shield, 
  Palette, 
  Award, 
  Settings2, 
  Image as ImageIcon, 
  Monitor, 
  CheckCircle, 
  Lock, 
  Mail, 
  Briefcase, 
  Building2, 
  Type, 
  FileText, 
  Camera,
  Upload,
  Trash2,
  Moon,
  Sun,
  ChevronLeft,
  Info,
  ExternalLink,
  Code2,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  Calendar,
  LogIn,
  Layout as LayoutIcon,
  Bell,
  AlertCircle,
  Edit2
} from 'lucide-react';

const defaultOccasions = [
  { id: 'eid_adha', name_ar: 'كــل عــام وأنتــم بخيــر\nبمناسبة عيـد\nالأضحـى المبـارك', name_en: 'Happy Eid Al-Adha\nEvery Year\n& You Are Fine' },
  { id: 'eid_fitr', name_ar: 'كــل عــام وأنتــم بخيــر\nبمناسبة عيـد\nالفطـر المبـارك', name_en: 'Happy Eid Al-Fitr\nEvery Year\n& You Are Fine' },
  { id: 'ramadan', name_ar: 'كــل عــام وأنتــم بخيــر\nبمناسبة شهـر\nرمضـان الكريـم', name_en: 'Ramadan Kareem\nEvery Year\n& You Are Fine' },
  { id: 'national_day', name_ar: 'اليـوم الوطنـي\nدام عـزك\nيـا وطـن', name_en: 'Saudi\nNational Day' },
  { id: 'foundation_day', name_ar: 'يـوم التأسيس\nيـوم\nبدينـا', name_en: 'Saudi\nFoundation Day' }
];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Settings({ user, onLogout, onLogin }) {
  const { t, i18n } = useTranslation();
  const isAdmin = user?.role === 'admin';
  const isRtl = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Profile Form State
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Branding State
  const [branding, setBranding] = useState({
    company_name: '',
    company_description: '',
    project_manager_name: '',
    project_manager_title: '',
    project_coordinator_name: '',
    project_coordinator_title: '',
    consultant_name: '',
    partner_company_name: '',
    company_logo_url: '',
    partner_logo_url: '',
    login_description: '',
    login_pm_description: '',
    login_pc_description: '',
    login_team_description: '',
    copyright_text: '',
    dashboard_title: '',
    footer_year: '',
    login_footer_description: '',
    internal_footer_description: '',
    occasion_watermark: 'none',
    occasions_list: defaultOccasions
  });
  const [editingOccasionId, setEditingOccasionId] = useState(null);
  const [savingBranding, setSavingBranding] = useState(false);

  // Platform State
  const [platformName, setPlatformName] = useState('');
  const [platformTheme, setPlatformTheme] = useState('blue');
  const [darkMode, setDarkMode] = useState(false);
  const [personalTheme, setPersonalTheme] = useState(user?.personal_theme || null);

  // Membership & Certificates
  const [membershipData, setMembershipData] = useState({
    validDateGregorian: '2026-07-23',
    validDateHijri: '1448-02-09',
    imageUrl: 'https://customer-assets.emergentagent.com/job_login-repair-84/artifacts/k0fgyf5g_%D8%A7%D9%84%D8%B9%D8%B6%D9%88%D9%8A%D8%A9%20%D8%A7%D9%84%D9%87%D9%86%D8%AF%D8%B3%D9%8A%D8%A9.jpg'
  });
  const [certificates, setCertificates] = useState([
    {
      id: 1,
      title: 'دبلومة تحليل البيانات والتصور البصري',
      titleEn: 'Diploma in Data Analytics and Visualization',
      skills: 'Excel - Power BI - Tableau - Python - SQL',
      duration: '70 ساعة',
      dateFrom: '30-4-2025',
      dateTo: '30-7-2025',
      issuer: 'Dr. Enaam Moustafa',
      certificateNo: '1001030',
      isMain: true
    }
  ]);
  const [certImageUrl, setCertImageUrl] = useState("https://customer-assets.emergentagent.com/job_login-repair-84/artifacts/pxdvqahe_%D9%85.%D9%85%D8%AD%D9%85%D9%88%D8%AF%20%D9%87%D8%A7%D8%B1%D9%88%D9%86%20%D8%B4%D9%87%D8%A7%D8%AF%D8%A9%20%D8%AA%D8%AD%D9%84%D9%8A%D9%84%20%D8%A7%D9%84%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA.png");
  
  const [activityLogs, setActivityLogs] = useState([]);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [fetchingLogs, setFetchingLogs] = useState(false);

  const fetchActivityLogs = async () => {
    setFetchingLogs(true);
    try {
      const response = await axios.get(`${API}/auth/activity-logs`);
      setActivityLogs(response.data);
      setShowLogsModal(true);
    } catch (error) {
      toast.error(t('settings.errors.fetchLogs'));
    } finally {
      setFetchingLogs(false);
    }
  };

  const themes = [
    { id: 'blue', name: t('settings.themes.blue'), primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', bgLight: '#eff6ff' },
    { id: 'green', name: t('settings.themes.green'), primary: '#059669', secondary: '#10b981', accent: '#34d399', bgLight: '#ecfdf5' },
    { id: 'purple', name: t('settings.themes.purple'), primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', bgLight: '#f5f3ff' },
    { id: 'rose', name: t('settings.themes.rose'), primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', bgLight: '#fff1f2' },
    { id: 'teal', name: t('settings.themes.teal'), primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', bgLight: '#f0fdfa' },
    { id: 'amber', name: t('settings.themes.amber'), primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', bgLight: '#fffbeb' },
    { id: 'slate', name: t('settings.themes.slate'), primary: '#334155', secondary: '#475569', accent: '#94a3b8', bgLight: '#f8fafc' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/platform`);
        const data = response.data;
        setPlatformName(data.platform_name || (i18n.language === 'en' ? 'Expert House' : 'بيت الخبرة'));
        setPlatformTheme(data.theme || 'blue');
        const localDark = localStorage.getItem('darkMode');
        const dark = localDark !== null ? (localDark === 'true') : (data.dark_mode || false);
        setDarkMode(dark);
        setBranding({
          company_name: data.company_name || '',
          company_description: data.company_description || '',
          project_manager_name: data.project_manager_name || '',
          project_manager_title: data.project_manager_title || '',
          project_coordinator_name: data.project_coordinator_name || '',
          project_coordinator_title: data.project_coordinator_title || '',
          consultant_name: data.consultant_name || '',
          partner_company_name: data.partner_company_name || '',
          company_logo_url: data.company_logo_url || '',
          partner_logo_url: data.partner_logo_url || '',
          login_description: data.login_description || '',
          login_pm_description: data.login_pm_description || '',
          login_pc_description: data.login_pc_description || '',
          login_team_description: data.login_team_description || '',
          copyright_text: data.copyright_text || (i18n.language === 'en' ? 'All rights reserved' : 'جميع الحقوق محفوظة'),
          dashboard_title: data.dashboard_title || (i18n.language === 'en' ? 'WFM Ticket & Project Management System' : 'نظام إدارة البلاغات والمشاريع - WFM'),
          footer_year: data.footer_year || '2026',
          login_footer_description: data.login_footer_description || (i18n.language === 'en' ? 'WFM Ticket Management System connecting consulting offices with the National Water Company.' : 'نظام إدارة البلاغات المستلمة من WFM لربط المكاتب الاستشارية مع شركة المياه الوطنية.'),
          internal_footer_description: data.internal_footer_description || (i18n.language === 'en' ? 'WFM Ticket Management System' : 'نظام إدارة البلاغات المستلمة من WFM'),
          global_announcement: data.global_announcement || '',
          flash_announcement: data.flash_announcement ?? true,
          vision_logo_url: data.vision_logo_url || '',
          occasion_watermark: data.occasion_watermark || 'none',
          occasions_list: data.occasions_list?.length > 0 ? data.occasions_list : defaultOccasions
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoutOthers = async () => {
    if (!window.confirm(t('settings.confirms.logoutOthers'))) {
      return;
    }

    // setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/logout-others`);
      if (onLogin && response.data.access_token) {
        onLogin(response.data.access_token, user);
        toast.success(t('settings.success.logoutOthers'));
      }
    } catch (error) {
      console.error('Failed to logout others:', error);
      toast.error(error.response?.data?.detail || t('settings.errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (formData.new_password && formData.new_password !== formData.confirm_password) {
      toast.error(t('settings.errors.passwordMismatch'));
      return;
    }
    // setLoading(true);
    try {
      const updateData = {};
      if (formData.full_name !== user.full_name) updateData.full_name = formData.full_name;
      if (formData.current_password && formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }
      await axios.put(`${API}/auth/update-profile`, updateData);
      if (updateData.new_password) {
        toast.success(t('settings.success.passwordChanged'));
      } else {
        toast.success(t('settings.success.changesSaved'));
      }
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('settings.errors.profileUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPicture(true);
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressed = await imageCompression(file, options).catch(() => file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await axios.post(`${API}/auth/upload-profile-picture`, { picture: reader.result });
          toast.success(t('settings.success.changesSaved'));
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          toast.error(t('settings.errors.imageUpload'));
        }
      };
      reader.readAsDataURL(compressed);
    } catch (err) {
      setUploadingPicture(false);
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      await axios.put(`${API}/settings/branding`, branding);
      invalidateBrandingCache();
      toast.success(t('settings.success.settingsSaved'));
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(t('settings.errors.settingsSave'));
    } finally {
      setSavingBranding(false);
    }
  };

  const handleUploadImage = async (file, field) => {
    if (!file) return;
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressed = await imageCompression(file, options).catch(() => file);
      const formData = new FormData();
      formData.append('file', compressed);
      const response = await axios.post(`${API}/storage/upload`, formData);
      const storagePath = response.data.storage_path;
      // إذا كان المسار رابطاً كاملاً (Cloudinary)، نستخدمه مباشرة، وإلا نضيف البريفكس
      const url = storagePath.startsWith('http') ? storagePath : `${API}/storage/files/${storagePath}`;
      setBranding(prev => ({ ...prev, [field]: url }));
      toast.success(t('settings.success.imageUpload'));
    } catch (error) {
      toast.error(t('settings.errors.imageUpload'));
    }
  };

  const handleSavePersonalTheme = async (themeId) => {
    try {
      await axios.put(`${API}/settings/personal-theme`, { personal_theme: themeId === 'default' ? null : themeId });
      setPersonalTheme(themeId === 'default' ? null : themeId);
      toast.success(t('settings.success.colorChanged'));
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      toast.error(t('settings.errors.themeChange'));
    }
  };

  const toggleDarkMode = async () => {
    const newDarkMode = !darkMode;
    localStorage.setItem('darkMode', newDarkMode.toString());
    setDarkMode(newDarkMode);
    
    if (isAdmin) {
      try {
        await axios.put(`${API}/settings/theme`, { theme: platformTheme, dark_mode: newDarkMode });
        toast.success(t('settings.success.darkModeGlobal'));
      } catch (err) {
        console.error('Failed to save global dark mode:', err);
        toast.success(t('settings.success.darkModeLocal'));
      }
    } else {
      toast.success(t('settings.success.darkModeAccount'));
    }
    setTimeout(() => window.location.reload(), 600);
  };

  const handleSavePlatformSettings = async () => {
    // setLoading(true);
    try {
      await axios.put(`${API}/settings/platform?platform_name=${encodeURIComponent(platformName)}`);
      toast.success(t('settings.success.platformSettingsSaved'));
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(t('settings.errors.platformNameUpdate'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGlobalTheme = async (themeId) => {
    try {
      await axios.put(`${API}/settings/theme`, { theme: themeId, dark_mode: darkMode });
      setPlatformTheme(themeId);
      toast.success(t('settings.success.platformThemeSaved'));
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error(t('settings.errors.platformThemeUpdate'));
    }
  };

  const navItems = [
    { id: 'profile', label: t('settings.profile'), icon: User, color: 'text-blue-600', bg: 'bg-bg-light' },
    { id: 'visuals', label: t('settings.visuals'), icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'security', label: t('settings.security'), icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ...(isAdmin ? [
      { id: 'branding', label: t('settings.branding'), icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
      { id: 'platform', label: t('settings.platform'), icon: Settings2, color: 'text-slate-600', bg: 'bg-slate-50' }
    ] : []),
    { id: 'professional', label: t('settings.professional'), icon: Award, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'about', label: t('settings.about'), icon: Info, color: 'text-gray-600', bg: 'bg-gray-50' },
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-[1400px] mx-auto p-4 lg:p-8" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        
        {/* Modern Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2 flex items-center gap-3">
              <span className="p-3 bg-white rounded-2xl shadow-xl border border-slate-100">
                <Settings2 className="w-8 h-8 text-blue-600" />
              </span>
              {t('settings.header.title')}
            </h1>
            <p className="text-slate-500 font-medium rtl:mr-16 ltr:ml-16">{t('settings.header.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-sm">
            <button 
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl transition-all duration-300 ${darkMode ? 'bg-slate-800 text-yellow-400 shadow-lg' : 'bg-white text-slate-400 hover:text-blue-600 shadow-sm'}`}
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>
            <div className="w-[1px] h-8 bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-3 px-3">
              <div className="rtl:text-left ltr:text-right">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:text-right ltr:text-left">{t('settings.header.currentUser')}</p>
                <p className="text-sm font-bold text-slate-700">{user?.username}</p>
              </div>
              {user?.profile_picture ? (
                <img src={user.profile_picture} className="w-10 h-10 rounded-full border-2 border-white shadow-md object-cover" alt="p" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {user?.username?.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <div className="lg:col-span-3 space-y-2 sticky top-24">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-500 group ${
                  activeTab === item.id 
                    ? `${item.bg} ${item.color} shadow-lg border border-primary/10 scale-[1.02]` 
                    : 'bg-white/40 hover:bg-white text-slate-500 border border-transparent hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`p-2 rounded-xl transition-colors duration-500 ${activeTab === item.id ? 'bg-white' : 'bg-slate-50 group-hover:bg-white'}`}>
                    <item.icon className="w-5 h-5" />
                  </span>
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
                {activeTab === item.id && <div className={`w-1.5 h-6 rounded-full bg-current`} />}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] border border-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden min-h-[600px] transition-all duration-700">
            
            {/* Panel: Profile */}
            {activeTab === 'profile' && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700">
                <div className="flex flex-col md:flex-row gap-12">
                  {/* Photo Section */}
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-blue-600/20 rounded-full blur-2xl group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative w-48 h-48 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl">
                        {user?.profile_picture ? (
                          <img src={user.profile_picture} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-6xl font-black" style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-hover))' }}>
                            {user?.full_name?.charAt(0)}
                          </div>
                        )}
                        {uploadingPicture && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <label className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-xl border border-slate-100 cursor-pointer hover:scale-110 active:scale-95 transition-all text-blue-600 group">
                        <Camera className="w-6 h-6" />
                        <input type="file" className="hidden" accept="image/*" onChange={handleProfilePictureUpload} />
                      </label>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('settings.profileTab.userRole')}</p>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isAdmin ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isAdmin ? t('settings.profileTab.roles.admin') : t('settings.profileTab.roles.staff')}
                      </span>
                    </div>
                  </div>

                  {/* Form Section */}
                  <div className="flex-1 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2">{t('settings.profileTab.fullName')}</label>
                        <div className="relative">
                          <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <input 
                            type="text" 
                            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white transition-all font-bold text-slate-700 outline-none"
                            value={isRtl ? formData.full_name : translateBrandingText(formData.full_name, isRtl)}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2">{t('settings.profileTab.username')}</label>
                        <div className="relative">
                          <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                          <input 
                            disabled 
                            type="text" 
                            className="w-full pr-12 pl-4 py-4 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 cursor-not-allowed outline-none"
                            value={user?.username}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-600" />
                        {t('settings.profileTab.changePassword')}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                          <input 
                            type={showCurrentPassword ? "text" : "password"} 
                            placeholder={t('settings.profileTab.placeholders.currentPassword')} 
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none pl-12"
                            value={formData.current_password}
                            onChange={(e) => setFormData({...formData, current_password: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showNewPassword ? "text" : "password"} 
                            placeholder={t('settings.profileTab.placeholders.newPassword')} 
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none pl-12"
                            value={formData.new_password}
                            onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                        <div className="relative">
                          <input 
                            type={showConfirmPassword ? "text" : "password"} 
                            placeholder={t('settings.profileTab.placeholders.confirmPassword')} 
                            className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 outline-none pl-12"
                            value={formData.confirm_password}
                            onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {loading ? t('settings.profileTab.saving') : t('settings.profileTab.saveChanges')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel: Visuals */}
            {activeTab === 'visuals' && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700 space-y-12">
                <section>
                  <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <Palette className="w-6 h-6 text-purple-600" />
                    {t('settings.visualsTab.title')}
                  </h3>
                  <p className="text-slate-500 font-medium mb-8">{t('settings.visualsTab.desc')}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                    <button
                      onClick={() => handleSavePersonalTheme('default')}
                      className={`p-4 rounded-3xl border-2 transition-all group ${!personalTheme ? 'border-purple-600 bg-purple-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                    >
                      <div className="w-full aspect-square rounded-2xl bg-slate-100 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                        <Monitor className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-xs font-black text-slate-700">{t('settings.visualsTab.default')}</p>
                    </button>
                    
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSavePersonalTheme(t.id)}
                        className={`p-4 rounded-3xl border-2 transition-all group ${personalTheme === t.id ? 'border-purple-600 bg-purple-50 shadow-lg' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                      >
                        <div className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center mb-4 group-hover:scale-105 transition-transform overflow-hidden relative" style={{ backgroundColor: t.bgLight }}>
                          <div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primary }}></div>
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: t.primary }}></div>
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: t.secondary }}></div>
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: t.accent }}></div>
                          </div>
                        </div>
                        <p className="text-xs font-black text-slate-700">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Panel: Branding (Admin) */}
            {activeTab === 'branding' && isAdmin && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700 space-y-12">
                <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100 flex items-start gap-5">
                  <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-900 mb-1">{t('settings.brandingTab.title')}</h3>
                    <p className="text-amber-800/70 text-sm font-medium">{t('settings.brandingTab.desc')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Logos */}
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-4">
                      <ImageIcon className="w-4 h-4 text-amber-600" />
                      {t('settings.brandingTab.logosTitle')}
                    </h4>
                    
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                          <img src={branding.company_logo_url} className="max-w-full max-h-full object-contain" alt="Logo" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{t('settings.brandingTab.mainLogo')}</p>
                          <p className="text-xs text-slate-400">{t('settings.brandingTab.pngHint')}</p>
                        </div>
                      </div>
                      <label className="p-3 bg-white hover:bg-amber-600 hover:text-white text-amber-600 rounded-xl shadow-sm border border-amber-100 cursor-pointer transition-all active:scale-95">
                        <Upload className="w-5 h-5" />
                        <input type="file" className="hidden" onChange={(e) => handleUploadImage(e.target.files[0], 'company_logo_url')} />
                      </label>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center overflow-hidden p-2">
                          <img src={branding.partner_logo_url} className="max-w-full max-h-full object-contain" alt="Partner" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{t('settings.brandingTab.partnerLogo')}</p>
                          <p className="text-xs text-slate-400">{t('settings.brandingTab.partnerLogoHint')}</p>
                        </div>
                      </div>
                      <label className="p-3 bg-white hover:bg-amber-600 hover:text-white text-amber-600 rounded-xl shadow-sm border border-amber-100 cursor-pointer transition-all active:scale-95">
                        <Upload className="w-5 h-5" />
                        <input type="file" className="hidden" onChange={(e) => handleUploadImage(e.target.files[0], 'partner_logo_url')} />
                      </label>
                    </div>


                  </div>

                  {/* Key People */}
                  <div className="space-y-6">
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 mb-4">
                      <UserCheck className="w-4 h-4 text-amber-600" />
                      {t('settings.brandingTab.namesTitle')}
                    </h4>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" placeholder={t('settings.brandingTab.placeholders.projectManager')} 
                          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                          value={isRtl ? branding.project_manager_name : translateBrandingText(branding.project_manager_name, isRtl)} onChange={e => setBranding({...branding, project_manager_name: e.target.value})}
                        />
                        <input 
                          type="text" placeholder={t('settings.brandingTab.placeholders.title')} 
                          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                          value={isRtl ? branding.project_manager_title : translateBrandingText(branding.project_manager_title, isRtl)} onChange={e => setBranding({...branding, project_manager_title: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" placeholder={t('settings.brandingTab.placeholders.projectCoordinator')} 
                          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                          value={isRtl ? branding.project_coordinator_name : translateBrandingText(branding.project_coordinator_name, isRtl)} onChange={e => setBranding({...branding, project_coordinator_name: e.target.value})}
                        />
                        <input 
                          type="text" placeholder={t('settings.brandingTab.placeholders.title')} 
                          className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                          value={isRtl ? branding.project_coordinator_title : translateBrandingText(branding.project_coordinator_title, isRtl)} onChange={e => setBranding({...branding, project_coordinator_title: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-xl">
                        <ImageIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      {t('settings.brandingTab.occasionWatermarkTitle')}
                    </h4>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm border-r-4 border-r-emerald-500">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-50 rounded-2xl">
                        <Palette className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.occasionWatermarkLabel')}</label>
                        <div className="space-y-4 w-full">
                          {branding.occasions_list?.map((occ) => (
                            <div key={occ.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3">
                              <div className="flex items-start justify-between">
                                <label className="flex items-start gap-3 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name="occasion_radio"
                                    checked={branding.occasion_watermark === occ.id}
                                    onChange={() => setBranding({...branding, occasion_watermark: occ.id})}
                                    className="mt-1 w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <div>
                                    <span className="font-bold text-slate-700 text-sm whitespace-pre-wrap">{isRtl ? occ.name_ar : occ.name_en}</span>
                                  </div>
                                </label>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setEditingOccasionId(editingOccasionId === occ.id ? null : occ.id)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-xl transition-all" title="تعديل">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setBranding({...branding, occasions_list: branding.occasions_list.filter(o => o.id !== occ.id)})} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all" title="حذف">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              
                              {editingOccasionId === occ.id && (
                                <div className="pt-3 mt-3 border-t border-slate-200 grid gap-3">
                                  <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">النص بالعربية</label>
                                    <textarea 
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold resize-none h-20"
                                      value={occ.name_ar}
                                      onChange={(e) => {
                                        const newList = branding.occasions_list.map(o => o.id === occ.id ? {...o, name_ar: e.target.value} : o);
                                        setBranding({...branding, occasions_list: newList});
                                      }}
                                      dir="rtl"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-slate-500 mb-1 block">النص بالإنجليزية</label>
                                    <textarea 
                                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold resize-none h-20"
                                      value={occ.name_en}
                                      onChange={(e) => {
                                        const newList = branding.occasions_list.map(o => o.id === occ.id ? {...o, name_en: e.target.value} : o);
                                        setBranding({...branding, occasions_list: newList});
                                      }}
                                      dir="ltr"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="radio" 
                                name="occasion_radio"
                                checked={branding.occasion_watermark === 'none'}
                                onChange={() => setBranding({...branding, occasion_watermark: 'none'})}
                                className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="font-bold text-slate-700 text-sm">{t('settings.brandingTab.watermarks.none')}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-slate-100 space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-xl">
                        <ShieldCheck className="w-6 h-6 text-blue-600" />
                      </div>
                      {t('settings.brandingTab.footerSettings')}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border-r-4 border-r-amber-500">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-50 rounded-2xl">
                          <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.yearLabel')}</label>
                            <input 
                              type="text"
                              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-amber-50 focus:bg-white transition-all font-black text-lg text-amber-700 outline-none"
                              value={isRtl ? branding.footer_year : translateBrandingText(branding.footer_year, isRtl)}
                              onChange={(e) => setBranding({...branding, footer_year: e.target.value})}
                              placeholder={t('settings.brandingTab.placeholders.year')}
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.copyrightLabel')}</label>
                            <input 
                              type="text"
                              className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-amber-50 focus:bg-white transition-all font-bold text-base text-slate-700 outline-none"
                              value={isRtl ? branding.copyright_text : translateBrandingText(branding.copyright_text, isRtl)}
                              onChange={(e) => setBranding({...branding, copyright_text: e.target.value})}
                              placeholder={t('settings.brandingTab.placeholders.copyright')}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* وصف صفحة الدخول */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border-r-4 border-r-blue-500">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-blue-50 rounded-2xl">
                            <LogIn className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 space-y-3">
                            <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.loginFooterLabel')}</label>
                            <textarea 
                              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold h-28 focus:bg-white focus:ring-4 focus:ring-blue-50 outline-none transition-all resize-none text-slate-600 leading-relaxed"
                              value={isRtl ? branding.login_footer_description : translateBrandingText(branding.login_footer_description, isRtl)}
                              onChange={(e) => setBranding({...branding, login_footer_description: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* الوصف الداخلي */}
                      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border-r-4 border-r-purple-500">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-purple-50 rounded-2xl">
                            <LayoutIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.internalFooterLabel')}</label>
                                <input 
                                  type="text"
                                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-purple-50 focus:bg-white transition-all font-bold text-sm text-slate-600 outline-none"
                                  value={isRtl ? branding.internal_footer_description : translateBrandingText(branding.internal_footer_description, isRtl)}
                                  onChange={(e) => setBranding({...branding, internal_footer_description: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.dashboardTitleLabel')}</label>
                                <input 
                                  type="text"
                                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-purple-50 focus:bg-white transition-all font-bold text-sm text-slate-600 outline-none"
                                  value={isRtl ? branding.dashboard_title : translateBrandingText(branding.dashboard_title, isRtl)}
                                  onChange={(e) => setBranding({...branding, dashboard_title: e.target.value})}
                                />
                            </div>
                            <div className="pt-2">
                               <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded-lg font-bold uppercase tracking-wider">{t('settings.brandingTab.customizeText')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-10 border-t border-slate-100 space-y-8">
                    <div className="flex items-center justify-between">
                      <h4 className="font-black text-slate-800 text-lg flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-xl">
                          <Bell className="w-6 h-6 text-red-600" />
                        </div>
                        {t('settings.brandingTab.announcementTitle')}
                      </h4>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all border-r-4 border-r-red-500">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-50 rounded-2xl">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="space-y-2">
                              <label className="text-sm font-black text-slate-700 block">{t('settings.brandingTab.announcementLabel')}</label>
                              <input 
                                type="text"
                                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-red-50 focus:bg-white transition-all font-bold text-sm text-slate-600 outline-none"
                                value={isRtl ? branding.global_announcement : translateBrandingText(branding.global_announcement, isRtl)}
                                onChange={(e) => setBranding({...branding, global_announcement: e.target.value})}
                                placeholder={t('settings.brandingTab.placeholders.announcement')}
                              />
                          </div>
                          
                          <div className="flex flex-col gap-3 pt-2">
                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={branding.show_announcement}
                                  onChange={(e) => setBranding({...branding, show_announcement: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                              </label>
                              <span className="text-sm font-bold text-slate-700">{t('settings.brandingTab.enableAnnouncement')}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={branding.flash_announcement ?? true}
                                  onChange={(e) => setBranding({...branding, flash_announcement: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-100 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                              </label>
                              <span className="text-sm font-bold text-slate-700">{i18n.language === 'en' ? 'Enable Flashing Color' : 'تفعيل وميض الألوان لشريط الإعلانات'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="px-10 py-5 bg-amber-600 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-amber-100 hover:bg-amber-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {savingBranding ? t('settings.brandingTab.saving') : t('settings.brandingTab.saveBranding')}
                </button>
              </div>
            )}

            {/* Panel: Platform Settings (Admin) */}
            {activeTab === 'platform' && isAdmin && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700 space-y-12">
                <section className="space-y-6">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Monitor className="w-6 h-6 text-slate-600" />
                    {t('settings.platformTab.title')}
                  </h3>
                  
                  <div className="max-w-md space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest rtl:mr-2 ltr:ml-2">{t('settings.platformTab.nameLabel')}</label>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-slate-100 focus:bg-white transition-all font-bold text-slate-700 outline-none"
                        value={platformName}
                        onChange={(e) => setPlatformName(e.target.value)}
                      />
                      <button 
                        onClick={handleSavePlatformSettings}
                        className="px-6 bg-slate-800 text-white rounded-2xl font-black text-xs hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-200"
                      >
                        {t('settings.platformTab.saveBtn')}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="space-y-6 pt-10 border-t border-slate-100">
                  <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <Palette className="w-6 h-6 text-slate-600" />
                    {t('settings.platformTab.themeTitle')}
                  </h3>
                  <p className="text-slate-500 font-medium">{t('settings.platformTab.themeDesc')}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-4 gap-4">
                    {themes.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleSaveGlobalTheme(t.id)}
                        className={`p-4 rounded-3xl border-2 transition-all group ${platformTheme === t.id ? 'border-slate-800 bg-slate-50 shadow-lg' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
                      >
                        <div className="w-full aspect-square rounded-2xl flex flex-col items-center justify-center mb-4 group-hover:scale-105 transition-transform overflow-hidden relative" style={{ backgroundColor: t.bgLight }}>
                          <div className="absolute inset-0 opacity-10" style={{ backgroundColor: t.primary }}></div>
                          <div className="flex gap-1">
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: t.primary }}></div>
                            <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: t.secondary }}></div>
                          </div>
                        </div>
                        <p className="text-xs font-black text-slate-700">{t.name}</p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Panel: Professional Profile */}
            {activeTab === 'professional' && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700 space-y-12">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
                  
                  <div className="relative flex flex-col md:flex-row items-center gap-10">
                    <div className="p-4 bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-inner">
                      <div className="w-40 h-40 bg-white rounded-3xl flex items-center justify-center p-3">
                        <Award className="w-24 h-24 text-blue-600" />
                      </div>
                    </div>
                    <div className="text-center md:rtl:text-right md:ltr:text-left space-y-4">
                      <div>
                        <h3 className="text-3xl font-black mb-2 tracking-tight">{i18n.language === 'en' ? 'Eng. Mahmoud Mohamed Haroun' : 'م/ محمود محمد هارون'}</h3>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full border border-white/20 text-xs font-bold">
                          <CheckCircle className="w-4 h-4" />
                          {t('settings.professionalTab.certifiedEng')}
                        </div>
                      </div>
                      <p className="text-blue-100/80 font-medium max-w-xl leading-relaxed">
                        {t('settings.professionalTab.engBio')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Membership Card */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-800 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Briefcase className="w-4 h-4" /></span>
                        {t('settings.professionalTab.membershipCard')}
                      </h4>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <label className="p-2 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setMembershipData(prev => ({ ...prev, imageUrl: reader.result }));
                                reader.readAsDataURL(file);
                                toast.success(t('settings.success.membershipImageUploaded'));
                              }
                            }} />
                          </label>
                          <button 
                            onClick={() => {
                              const newGreg = prompt(t('settings.prompts.enterGreg'), membershipData.validDateGregorian);
                              const newHijri = prompt(t('settings.prompts.enterHijri'), membershipData.validDateHijri);
                              if (newGreg && newHijri) {
                                setMembershipData(prev => ({ ...prev, validDateGregorian: newGreg, validDateHijri: newHijri }));
                                toast.success(t('settings.success.datesUpdated'));
                              }
                            }}
                            className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-all"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(t('settings.confirms.deleteMembership'))) {
                                setMembershipData(prev => ({ ...prev, imageUrl: '' }));
                                toast.success(t('settings.success.imageDeleted'));
                              }
                            }}
                            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="aspect-[1.6/1] rounded-3xl bg-slate-50 border-4 border-white shadow-inner overflow-hidden relative group">
                      {membershipData.imageUrl ? (
                        <img src={membershipData.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Membership" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">{t('settings.professionalTab.noMembershipImage')}</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-slate-900/40 backdrop-blur-md text-white flex justify-between text-[10px] font-black">
                        <span>SCE MEMBER ID: 534779</span>
                        <span>VALID: {membershipData.validDateGregorian} / {membershipData.validDateHijri}</span>
                      </div>
                    </div>
                  </div>

                  {/* Major Certs */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/50 p-8 space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-800 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><FileText className="w-4 h-4" /></span>
                        {t('settings.professionalTab.professionalCerts')}
                      </h4>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <label className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer transition-all">
                            <Upload className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setCertImageUrl(reader.result);
                                reader.readAsDataURL(file);
                                toast.success(t('settings.success.certUploaded'));
                              }
                            }} />
                          </label>
                          <button 
                            onClick={() => {
                              const newTitle = prompt(t('settings.prompts.editCertTitle'), i18n.language === 'en' ? 'Diploma in Data Analytics and Visualization' : 'دبلومة تحليل البيانات والتصور البصري');
                              if (newTitle) toast.success(t('settings.success.dataUpdated'));
                            }}
                            className="p-2 bg-slate-50 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-all"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (window.confirm(t('settings.confirms.deleteCert'))) {
                                setCertImageUrl('');
                                toast.success(t('settings.success.certDeleted'));
                              }
                            }}
                            className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {/* Power BI Certificate Image */}
                      {certImageUrl ? (
                        <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                          <img 
                            src={certImageUrl} 
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-500" 
                            alt="Power BI Certificate" 
                          />
                        </div>
                      ) : (
                        <div className="rounded-2xl h-40 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 font-bold">{t('settings.professionalTab.noCerts')}</div>
                      )}

                      {certificates.map(cert => (
                        <div key={cert.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-colors cursor-pointer group">
                          <h5 className="font-black text-slate-800 text-xs mb-1 group-hover:text-indigo-700 transition-colors">{i18n.language === 'en' ? cert.titleEn : cert.title}</h5>
                          <p className="text-[10px] text-slate-400 font-bold mb-2">{cert.issuer} • {i18n.language === 'en' ? '70 Hours' : cert.duration}</p>
                          <div className="flex gap-1 flex-wrap">
                            {cert.skills.split(' - ').map(s => (
                              <span key={s} className="px-2 py-0.5 bg-white rounded-md text-[9px] font-bold text-slate-500 border border-slate-100">{s}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Panel: Security */}
            {activeTab === 'security' && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700 space-y-12">
                <div className="max-w-xl mx-auto space-y-10">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-50">
                      <Shield className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">{t('settings.securityTab.title')}</h3>
                    <p className="text-slate-500 font-medium">{t('settings.securityTab.desc')}</p>
                  </div>

                  <div className="space-y-4">
                    {/* Two-Factor */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">{t('settings.securityTab.twoFactor')}</p>
                        <p className="text-xs text-slate-400 font-medium">{t('settings.securityTab.twoFactorDesc')}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-500">{t('settings.securityTab.soon')}</span>
                    </div>

                    {/* Activity Log */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">{t('settings.securityTab.activityLog')}</p>
                        <p className="text-xs text-slate-400 font-medium">{t('settings.securityTab.activityLogDesc')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={fetchActivityLogs}
                          disabled={fetchingLogs}
                          className="px-4 py-2 bg-white text-blue-600 rounded-xl text-[10px] font-black border border-blue-50 shadow-sm hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                        >
                          {fetchingLogs ? t('settings.securityTab.loading') : t('settings.securityTab.viewLog')}
                        </button>
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">{t('settings.securityTab.available')}</span>
                      </div>
                    </div>

                    {/* Encryption */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">{t('settings.securityTab.encryption')}</p>
                        <p className="text-xs text-slate-400 font-medium">{t('settings.securityTab.encryptionDesc')}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700">{t('settings.securityTab.enabled')}</span>
                    </div>
                  </div>

                  <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-700 text-sm">{t('settings.securityTab.logoutOthersTitle')}</p>
                      <p className="text-xs text-red-600/70 font-medium">{t('settings.securityTab.logoutOthersDesc')}</p>
                    </div>
                    <button 
                      onClick={handleLogoutOthers}
                      disabled={loading}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? t('settings.securityTab.executing') : t('settings.securityTab.execute')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Panel: About */}
            {activeTab === 'about' && (
              <div className="p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-700 flex flex-col items-center justify-center min-h-[500px] space-y-10 text-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-600/20 rounded-[2.5rem] blur-3xl scale-125 group-hover:scale-150 transition-transform duration-1000"></div>
                  <div className="relative w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-6 border border-slate-50">
                    <Code2 className="w-full h-full text-blue-600" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">{t('settings.aboutTab.title')}</h3>
                  <p className="text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">
                    {t('settings.aboutTab.desc')}
                  </p>
                  <div className="flex items-center justify-center gap-4 pt-4">
                    <span className="px-5 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200">Version 1.2.0</span>
                    <span className="px-5 py-2 bg-blue-100 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest border border-blue-200">Production Ready</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                  {[
                    { label: 'Frontend', val: 'React 18' },
                    { label: 'Backend', val: 'FastAPI' },
                    { label: 'Database', val: 'MongoDB' },
                    { label: 'Cloud', val: 'AWS / S3' }
                  ].map(tech => (
                    <div key={tech.label} className="p-4 bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{tech.label}</p>
                      <p className="text-sm font-bold text-slate-800">{tech.val}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-10 space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.aboutTab.developer')}</p>
                  <div className="flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-[2rem] shadow-2xl shadow-slate-200">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">MH</div>
                    <div className="rtl:text-right ltr:text-left">
                      <p className="text-sm font-black">{t('settings.aboutTab.developerName')}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{t('settings.aboutTab.developerTitle')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Activity Logs Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setShowLogsModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                {t('settings.modals.logsTitle')}
              </h3>
              <button onClick={() => setShowLogsModal(false)} className="p-2 hover:bg-white rounded-xl text-slate-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
              {activityLogs.length > 0 ? activityLogs.map((log, idx) => {
                let actionStr = log.action;
                let detailsStr = log.details;
                
                if (i18n.language === 'en') {
                   if (actionStr === "تحديث إعدادات المظهر") actionStr = "Appearance Settings Updated";
                   else if (actionStr === "مراجعة إعدادات الحساب والأمان") actionStr = "Account & Security Review";
                   else if (actionStr === "استعراض لوحة التحكم الرئيسية") actionStr = "Dashboard Viewed";
                   else if (actionStr === "تسجيل الدخول للنظام") actionStr = "System Login";
                   
                   if (detailsStr === "تم تغيير الوضع الشخصي للمنصة بنجاح وتخصيص تفضيلات العرض.") detailsStr = "Personal platform mode successfully changed and display preferences customized.";
                   else if (detailsStr === "تم الدخول لصفحة الإعدادات وتأمين الجلسة الحالية بنجاح.") detailsStr = "Settings page accessed and current session successfully secured.";
                   else if (detailsStr === "تمت مراجعة مؤشرات الأداء ومتابعة إحصائيات المشاريع الفعّالة.") detailsStr = "Performance indicators reviewed and active project statistics tracked.";
                   else if (detailsStr.includes("تم تسجيل الدخول بنجاح إلى المنصة للمستخدم")) detailsStr = `Successful platform login for user ${log.username} from a Windows device.`;
                }

                return (
                <div key={log._id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-4 hover:bg-white hover:border-blue-100 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2">
                      <p className="font-black text-slate-800 text-sm">{actionStr}</p>
                      <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-100/50">
                        <p className="text-sm font-black text-blue-700 tracking-tight">
                          {new Date(log.timestamp).toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric' })}
                          {" • "}
                          {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">{detailsStr}</p>
                  </div>
                </div>
                );
              }) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-bold">{t('settings.modals.noLogs')}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('settings.modals.logsNote')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal - Premium Design */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500"></div>
          <div className="relative bg-white rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full text-center scale-100 opacity-100 transition-all duration-500">
            <div className="mb-6 relative">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-6">{t('settings.modals.passwordSuccess')}</h3>
            
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Settings;
