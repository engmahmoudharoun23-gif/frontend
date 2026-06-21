import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useBranding } from '../hooks/useBranding';
import { Shield, Lock, User, MessageSquare, Ticket, Eye, EyeOff, Building2, ArrowRight, Globe } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const themeColors = {
  blue: { primary: '#005baa', secondary: '#00a3e0', accent: '#82d8ff', hover: '#004a8f', light: '#e6f4ff', text: '#003366' },
  green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', hover: '#047857', light: '#ecfdf5', text: '#065f46' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', hover: '#6d28d9', light: '#f5f3ff', text: '#5b21b6' },
  rose: { primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', hover: '#be123c', light: '#fff1f2', text: '#be123c' },
  teal: { primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', hover: '#0f766e', light: '#f0fdfa', text: '#115e59' },
  amber: { primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', hover: '#b45309', light: '#fffbeb', text: '#92400e' },
  slate: { primary: '#334155', secondary: '#475569', accent: '#94a3b8', hover: '#1e293b', light: '#f8fafc', text: '#1e293b' },
};

function Login({ onLogin }) {
  const { t, i18n } = useTranslation();
  const { branding } = useBranding();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportForm, setSupportForm] = useState({ name: '', email: '', message: '' });
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  
  const [platformName, setPlatformName] = useState(() => localStorage.getItem('platformName') || '');
  const [platformTheme, setPlatformTheme] = useState(() => localStorage.getItem('platformTheme') || 'blue');

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'ar';
    const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  useEffect(() => {
    const currentLang = i18n.language || 'ar';
    document.documentElement.dir = currentLang.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const getThemeColor = (colorType) => {
    const colors = themeColors[platformTheme] || themeColors.blue;
    return colors[colorType] || colors.primary;
  };

  useEffect(() => {
    const fetchPlatformSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/platform`);
        const newName = response.data.platform_name || '';
        const theme = response.data.theme || 'blue';
        setPlatformName(newName);
        setPlatformTheme(theme);
        if (newName) {
          localStorage.setItem('platformName', newName);
        } else {
          localStorage.removeItem('platformName');
        }
        localStorage.setItem('platformTheme', theme);
      } catch (error) {
        console.error('Failed to fetch platform settings:', error);
      }
    };
    fetchPlatformSettings();
  }, []);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showTicketStatus, setShowTicketStatus] = useState(false);
  const [ticketEmail, setTicketEmail] = useState('');
  const [userTickets, setUserTickets] = useState([]);
  const [ticketLoading, setTicketLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, {
        username: formData.username,
        password: formData.password
      });
      onLogin(response.data.access_token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const translateResetError = (errMsg) => {
    if (!errMsg) return t('common.error');
    switch (errMsg) {
      case 'اسم المستخدم غير موجود':
        return t('login.usernameNotFound') || errMsg;
      case 'لم يتم طلب استعادة كلمة المرور لهذا المستخدم':
        return t('login.noRequestForUser') || errMsg;
      case 'انتهت صلاحية كود التحقق':
        return t('login.codeExpired') || errMsg;
      case 'كود التحقق غير صحيح':
        return t('login.invalidCode') || errMsg;
      default:
        return errMsg;
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotUsername) { setForgotError(t('common.required')); return; }
    setForgotLoading(true);
    setForgotError('');
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { username: forgotUsername });
      const successMsg = response.data.message === 'تم إرسال طلب استعادة كلمة المرور، يرجى التواصل مع الدعم الفني'
        ? t('login.forgotSuccess')
        : response.data.message;
      setForgotSuccess(successMsg);
      setForgotStep(2);
    } catch (err) {
      setForgotError(translateResetError(err.response?.data?.detail));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotCode || !forgotNewPassword) { setForgotError(t('common.required')); return; }
    setForgotLoading(true);
    setForgotError('');
    try {
      await axios.post(`${API}/auth/reset-password`, {
        username: forgotUsername,
        code: forgotCode,
        new_password: forgotNewPassword
      });
      setForgotSuccess(t('settings.passwordChanged'));
      setForgotStep(3);
      setTimeout(() => {
        setShowForgotPassword(false);
        setForgotStep(1);
        setForgotUsername('');
        setForgotCode('');
        setForgotNewPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setForgotError(translateResetError(err.response?.data?.detail));
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSupportSubmit = async (e) => {
    e.preventDefault();
    setSupportLoading(true);
    try {
      await axios.post(`${API}/support/messages`, supportForm);
      setSupportSuccess(true);
      setTimeout(() => {
        setShowSupportModal(false);
        setSupportSuccess(false);
        setSupportForm({ name: '', email: '', message: '' });
      }, 2000);
    } catch (err) {
      alert(t('common.error'));
    } finally {
      setSupportLoading(false);
    }
  };

  const checkUserTickets = async () => {
    if (!ticketEmail) return;
    setTicketLoading(true);
    try {
      const response = await axios.get(`${API}/support/ticket-status?email=${encodeURIComponent(ticketEmail)}`);
      setUserTickets(response.data.tickets || []);
      if (response.data.tickets?.length > 0) setShowTicketStatus(true);
    } catch (err) {
      console.error('Error checking tickets');
    } finally {
      setTicketLoading(false);
    }
  };

  const WatermarkBackground = () => (
    <>
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 bg-mesh"></div>
      {/* Engineering Vivid Background Layer */}
      <div className="absolute inset-0 z-0 opacity-75 pointer-events-none overflow-hidden">
        <img 
          src="/engineering-bg-vivid.png" 
          alt="Engineering Background" 
          className="w-full h-full object-cover object-[95%_center] transform scale-110 brightness-125 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-slate-800/20 to-slate-800/70"></div>
      </div>
    </>
  );

  const isRtl = i18n.language === 'ar';

  const getBrandingCompanyName = () => {
    if (!isRtl && (!branding.company_name || branding.company_name.includes('بيت الخبرة'))) {
      return 'Expert House Engineering Consultancy';
    }
    return (!branding.company_name || branding.company_name.includes('بيت الخبرة')) ? (isRtl ? 'مكتب بيت الخبرة للإستشارت الهندسية' : 'Expert House Engineering Consultancy') : branding.company_name;
  };

  const getBrandingPartnerName = () => {
    const rawName = branding.partner_company_name || 'شركة المياه الوطنية';
    if (!isRtl && (rawName.replace('المياة', 'المياه') === 'شركة المياه الوطنية' || !branding.partner_company_name)) {
      return 'National Water Company';
    }
    return rawName.replace('المياة', 'المياه');
  };

  const getBrandingCopyright = () => {
    if (!isRtl && (branding.copyright_text === 'جميع الحقوق محفوظة' || !branding.copyright_text)) {
      return 'All Rights Reserved';
    }
    return branding.copyright_text || t('footer.defaultCopyright');
  };

  const getBrandingFooterDescription = () => {
    const defaultAr = "نظام إدارة البلاغات المستلمة من WFM لربط المكاتب الاستشارية مع شركة المياه الوطنية.";
    if (!isRtl && (branding.login_footer_description === defaultAr || !branding.login_footer_description)) {
      return "WFM Incoming Reports Management System to connect consultancy offices with the National Water Company.";
    }
    return branding.login_footer_description || t('footer.defaultDescription');
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 relative overflow-hidden font-sans bg-slate-800" dir={isRtl ? 'rtl' : 'ltr'}>
      <style>{`
        .bg-mesh {
          background-color: #1e293b;
          background-image: 
          radial-gradient(at 0% 0%, ${getThemeColor('secondary')}44 0, transparent 50%), 
          radial-gradient(at 50% 0%, ${getThemeColor('primary')}33 0, transparent 50%), 
          radial-gradient(at 100% 0%, ${getThemeColor('secondary')}44 0, transparent 50%);
        }
        .glass-card {
          background: linear-gradient(135deg, ${getThemeColor('primary')}ee, ${getThemeColor('hover')}f9);
          backdrop-filter: blur(24px);
          border: 2px solid ${getThemeColor('primary')}66;
          box-shadow: 0 0 40px ${getThemeColor('primary')}33, 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .login-input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.3s ease;
        }
        .login-input:focus {
          background: rgba(255, 255, 255, 0.08);
          border-color: ${getThemeColor('primary')};
          box-shadow: 0 0 15px ${getThemeColor('primary')}33;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>

      {/* Premium Language Selector (Top End) */}
      <div className={`absolute top-8 sm:top-8 ${isRtl ? 'left-6 sm:left-8' : 'right-2 sm:right-8'} z-50`}>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-sm transition-all border border-white/10 backdrop-blur-md shadow-lg active:scale-95"
          title={isRtl ? 'Switch to English' : 'التبديل إلى العربية'}
        >
          <Globe className="w-4 h-4 text-white/80" />
          <span>{isRtl ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <WatermarkBackground />
      
      <div className="flex-1 flex items-center justify-center py-6 md:py-12 z-10 w-full transform -translate-y-6 md:-translate-y-12">
        <div className="max-w-5xl w-full flex flex-col md:flex-row glass-card rounded-[2.5rem] overflow-hidden">
        
        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white/5">
          <div className="max-w-md w-full mx-auto space-y-10">
            
            <div className="space-y-4 text-start">
              {/* شعار رؤية 2030 - فوق كلمة معلومات */}
              <div
                className="hidden md:flex flex-col items-start"
                style={{
                  gap: '2px', marginBottom: '10px', opacity: 0.95,
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)'
                }}
                title={isRtl ? "رؤية المملكة العربية السعودية 2030" : "Saudi Vision 2030"}
              >
                {/* رؤية VISION */}
                <div style={{
                  color: 'white', fontSize: '15px', fontWeight: '800',
                  letterSpacing: '2px', fontFamily: "'Segoe UI', Arial, sans-serif",
                  whiteSpace: 'nowrap'
                }}>
                  رؤية VISION
                </div>

                {/* 30 [زخرفة] 2 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', lineHeight: 1 }}>
                  <span style={{
                    color: 'white', fontSize: '32px', fontWeight: '900',
                    fontFamily: "'Arial Black', 'Arial', sans-serif", lineHeight: 1
                  }}>30</span>

                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"
                    style={{ width: '34px', height: '34px', flexShrink: 0 }}>
                    <rect x="1"  y="1"  width="7" height="7" fill="#48cae4" rx="1.2"/>
                    <rect x="10" y="1"  width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="19" y="1"  width="7" height="7" fill="#52b788" rx="1.2"/>
                    <rect x="28" y="1"  width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="37" y="1"  width="7" height="7" fill="#48cae4" rx="1.2"/>
                    <rect x="1"  y="10" width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="10" y="10" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="19" y="10" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="28" y="10" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="37" y="10" width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="1"  y="19" width="7" height="7" fill="#52b788" rx="1.2"/>
                    <rect x="10" y="19" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="28" y="19" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="37" y="19" width="7" height="7" fill="#52b788" rx="1.2"/>
                    <rect x="1"  y="28" width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="10" y="28" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="19" y="28" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="28" y="28" width="7" height="7" fill="#f4c542" rx="1.2"/>
                    <rect x="37" y="28" width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="1"  y="37" width="7" height="7" fill="#48cae4" rx="1.2"/>
                    <rect x="10" y="37" width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="19" y="37" width="7" height="7" fill="#52b788" rx="1.2"/>
                    <rect x="28" y="37" width="7" height="7" fill="#0096c7" rx="1.2"/>
                    <rect x="37" y="37" width="7" height="7" fill="#48cae4" rx="1.2"/>
                    {/* النخلة */}
                    <rect x="21.5" y="20" width="2.5" height="11" fill="white" rx="0.8"/>
                    <line x1="22.5" y1="21" x2="15"   y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="22.5" y1="21" x2="18"   y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="22.5" y1="21" x2="22.5" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="22.5" y1="21" x2="27"   y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    <line x1="22.5" y1="21" x2="30"   y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    <path d="M15,33 Q22.5,31 30,33 L30,34.5 Q22.5,32.5 15,34.5 Z" fill="white"/>
                    <path d="M29,32.5 L33,34.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>

                  <span style={{
                    color: 'white', fontSize: '32px', fontWeight: '900',
                    fontFamily: "'Arial Black', 'Arial', sans-serif", lineHeight: 1
                  }}>2</span>
                </div>

                {/* المملكة العربية السعودية */}
                <div style={{
                  color: 'white', fontSize: '9px', fontWeight: '700',
                  letterSpacing: '0.5px', fontFamily: "'Segoe UI', Arial, sans-serif",
                  whiteSpace: 'nowrap'
                }}>
                  المملكة العربية السعودية
                </div>
                <div style={{
                  color: 'rgba(255,255,255,0.8)', fontSize: '5.5px', fontWeight: '500',
                  letterSpacing: '1.5px', fontFamily: "Arial, sans-serif", whiteSpace: 'nowrap'
                }}>
                  KINGDOM OF SAUDI ARABIA
                </div>
              </div>

              <div
                className="hidden md:inline-flex items-center gap-4 px-6 py-3 rounded-full text-white text-base font-black border mb-6 shadow-2xl backdrop-blur-md"
                style={{ 
                  backgroundColor: `${getThemeColor('primary')}33`,
                  borderColor: `${getThemeColor('primary')}66`,
                  boxShadow: `0 15px 30px ${getThemeColor('primary')}33`
                }}
              >
                <Shield className="w-6 h-6" style={{ color: getThemeColor('accent') }} />
                <span className="drop-shadow-lg tracking-wide">{t('common.info')}</span>
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                {t('login.title') === 'دخول' ? (isRtl ? 'تسجيل الدخول' : 'Login') : t('login.title')}
              </h1>
              <p className="text-white/70 font-bold text-lg drop-shadow-md">
                {(!platformName || platformName.includes('بيت الخبرة')) ? (isRtl ? 'مكتب بيت الخبرة للإستشارت الهندسية' : 'Expert House Engineering Consultancy') : platformName}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-rose-500/10 border-r-4 border-rose-500 text-rose-200 p-5 rounded-2xl text-sm font-bold animate-in slide-in-from-top duration-300">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-white/80 uppercase tracking-widest px-1 block text-start drop-shadow-sm">
                    {t('login.username')}
                  </label>
                  <div className="relative">
                    <User className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 w-6 h-6 text-white/30`} />
                    <input
                      type="text"
                      required
                      className={`w-full login-input rounded-2xl py-4 ${isRtl ? 'pr-14 pl-4' : 'pl-14 pr-4'} font-bold focus:outline-none text-start text-lg`}
                      placeholder={t('login.username')}
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-sm font-black text-white/80 uppercase tracking-widest drop-shadow-sm">
                      {t('login.password')}
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-base font-black text-white/60 hover:text-white transition-colors drop-shadow-sm"
                    >
                      {t('login.forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className={`absolute ${isRtl ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 w-6 h-6 text-white/30`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className={`w-full login-input rounded-2xl py-4 ${isRtl ? 'pr-14 pl-14' : 'pl-14 pr-14'} font-bold focus:outline-none text-start text-lg`}
                      placeholder={t('login.password')}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute ${isRtl ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors`}
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl text-white font-black text-xl transition-all shadow-2xl hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                style={{ background: `linear-gradient(135deg, ${getThemeColor('primary')}, ${getThemeColor('hover')})` }}
              >
                {t('login.loginButton') || 'تسجيل الدخول'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            {/* Mobile Logos */}
            <div className="flex md:hidden flex-col items-center justify-center gap-6 pt-10 border-t border-white/10 w-full mt-4">
              <div className="flex items-start justify-center gap-3 w-full">
                
                {/* Expert House (Right in RTL) */}
                <div className="flex flex-col items-center justify-start flex-1">
                  <div className="w-20 h-20 bg-white/5 p-2 rounded-2xl border border-white/10 mb-3 shadow-md flex items-center justify-center">
                    <img src={branding.company_logo_url || "/bayt-alkhibra-logo.png"} alt="Expert House" className="w-[80%] h-[80%] object-contain drop-shadow-md" />
                  </div>
                  <span className="text-xs font-black text-white text-center leading-tight drop-shadow-md">
                    {getBrandingCompanyName()}
                  </span>
                </div>

                {/* Separator / Success Partner */}
                <div className="flex flex-col items-center justify-center px-1 mt-2">
                  <div className="h-6 w-[2px] bg-gradient-to-b from-transparent to-white/40 mb-2"></div>
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest text-center whitespace-nowrap shadow-sm">
                    {isRtl ? 'شريك النجاح' : 'Partner'}
                  </span>
                  <div className="h-6 w-[2px] bg-gradient-to-t from-transparent to-white/40 mt-2"></div>
                </div>

                {/* Partner / NWC (Left in RTL) */}
                <div className="flex flex-col items-center justify-start flex-1">
                  <div className="w-20 h-20 bg-white/5 p-2 rounded-2xl border border-white/10 mb-3 shadow-md flex items-center justify-center">
                    <img src={branding.partner_logo_url || "/nwc-logo.png"} alt="NWC" className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <span className="text-xs font-black text-white text-center leading-tight drop-shadow-md">
                    {getBrandingPartnerName()}
                  </span>
                </div>

              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-6 pt-6 mt-6 border-t border-white/10 w-full text-center">
              <button 
                onClick={() => setShowAboutModal(true)} 
                className="text-[9px] sm:text-base font-black text-white/80 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all hover:scale-105 drop-shadow-sm"
              >
                <Building2 className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" style={{ color: getThemeColor('accent') }} />
                <span>{isRtl ? 'نبذة عنا' : 'About Us'}</span>
              </button>
              
              <button 
                onClick={() => setShowSupportModal(true)} 
                className="text-[9px] sm:text-base font-black text-white/80 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all hover:scale-105 drop-shadow-sm"
              >
                <MessageSquare className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" style={{ color: getThemeColor('accent') }} />
                <span>{isRtl ? 'الدعم الفني' : 'Support'}</span>
              </button>

              <button 
                onClick={() => setShowTicketStatus(true)} 
                className="text-[9px] sm:text-base font-black text-white/80 hover:text-white flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all hover:scale-105 drop-shadow-sm"
              >
                <Ticket className="w-4 h-4 sm:w-6 sm:h-6 shrink-0" style={{ color: getThemeColor('accent') }} />
                <span>{isRtl ? 'تتبع التذاكر' : 'Track Tickets'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Left Side: Branding & Handshake (يسار) */}
        <div 
          className="hidden md:flex w-full md:w-1/2 p-12 text-white flex-col items-center justify-center text-center gap-10 border-t md:border-t-0 md:border-r border-white/10"
          style={{ background: `linear-gradient(225deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)` }}
        >
          {/* Handshake Icon */}
          <div className="p-8 rounded-full bg-white/5 border border-white/10 shadow-inner relative group cursor-default">
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" style={{ backgroundColor: getThemeColor('primary') + '33' }}></div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-white relative z-10" viewBox="0 0 640 512" fill="currentColor">
              <path d="M323.4 85.2l-96.8 78.4c-16.1 13-19.2 36.4-7 53.1c12.9 17.8 38 21.3 55.3 7.8l99.3-77.2c7-5.4 17-4.2 22.5 2.8s4.2 17-2.8 22.5l-20.9 16.2L550.2 352H592c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48H516h-4-.7l-3.9-2.5L434.8 79c-15.3-9.8-33.2-15-51.4-15c-21.8 0-43 7.5-60 21.2zm22.8 124.4l-51.7 40.2C263 274.4 217.3 268 193.7 235.6c-22.2-30.5-16.6-73.1 12.7-96.8l83.2-67.3c-11.6-4.9-24.1-7.4-36.8-7.4C234 64 215.7 69.6 200 80l-72 48H48c-26.5 0-48 21.5-48 48V304c0 26.5 21.5 48 48 48H156.2l91.4 83.4c19.6 17.9 49.9 16.5 67.8-3.1c5.5-6.1 9.2-13.2 11.1-20.6l17 15.6c19.5 17.9 49.9 16.6 67.8-2.9c4.5-4.9 7.8-10.6 9.9-16.5c19.4 13 45.8 10.3 62.1-7.5c17.9-19.5 16.6-49.9-2.9-67.8l-134.2-123z"/>
            </svg>
          </div>

          <div className="space-y-8 w-full max-w-sm">
            {/* Expert House Logo Section */}
            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 transition-all hover:bg-white/10 hover:translate-y-[-5px] w-full">
              <img src={branding.company_logo_url || "/bayt-alkhibra-logo.png"} alt="Expert House" className="h-16 w-auto mx-auto mb-5 object-contain" />
              <h3 className="text-xl font-black text-center w-full">{getBrandingCompanyName()}</h3>
              <div className="h-[1px] w-12 bg-primary mx-auto my-4" style={{ backgroundColor: getThemeColor('primary') }}></div>
              <p className="text-base text-white/80 font-black text-center w-full tracking-wider">
                {(!branding.project_manager_name || branding.project_manager_name.includes('أحمد عبيدات')) ? (isRtl ? 'المهندس / أحمد عبيدات - مدير عام المشاريع' : 'Eng. Ahmed Obeidat - Projects General Manager') : `${branding.project_manager_name} - ${branding.project_manager_title || (isRtl ? 'مدير عام المشاريع' : 'Projects General Manager')}`}
              </p>
            </div>

            <div className="flex items-center gap-8 py-6">
              <div className="h-[3px] flex-1 bg-gradient-to-l from-transparent via-white/20 to-white/30 rounded-full"></div>
              <span className="text-xl font-black text-white/50 uppercase tracking-[0.4em] whitespace-nowrap shadow-sm">
                {isRtl ? 'شريك النجاح' : 'Success Partner'}
              </span>
              <div className="h-[3px] flex-1 bg-gradient-to-r from-transparent via-white/20 to-white/30 rounded-full"></div>
            </div>

            {/* NWC Logo Section */}
            <div className="bg-white/5 rounded-[2rem] p-8 border border-white/10 transition-all hover:bg-white/10 hover:translate-y-[-5px] w-full">
              <img src={branding.partner_logo_url || "/nwc-logo.png"} alt="NWC" className="h-16 w-auto mx-auto mb-5 object-contain" />
              <h3 className="text-xl font-black text-center w-full leading-relaxed">
                {getBrandingPartnerName()}
              </h3>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* Corporate Footer (بيانات المهندس محمود والحقوق) */}
      <div className="w-full z-10 px-6 pb-8 md:pb-16 mb-4 md:mb-10 pt-3 transform md:-translate-y-16 mt-6 md:mt-0">
        <div 
          className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 backdrop-blur-2xl py-6 px-10 rounded-[3rem] border-2 shadow-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${getThemeColor('primary')}ee, ${getThemeColor('hover')}f9)`,
            borderColor: `${getThemeColor('primary')}66`,
            boxShadow: `0 0 40px ${getThemeColor('primary')}33, 0 25px 50px -12px rgba(0, 0, 0, 0.7)`
          }}
        >
          
          <div className="flex items-center gap-7 text-start">
            <div className="w-18 h-18 rounded-[1.5rem] bg-white/10 flex items-center justify-center border border-white/10 shadow-xl backdrop-blur-sm">
              <User className="w-9 h-9" style={{ color: getThemeColor('accent') }} />
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] font-black uppercase tracking-[0.35em] text-white/50">
                {t('footer.developedBy')}
              </p>
              <h5 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-lg">
                {t('footer.developerName')}
              </h5>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span className="text-sm font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/20">
                  {t('footer.developerTitle')}
                </span>
                <span className="text-[11px] font-semibold text-white/40 whitespace-nowrap">
                  {t('footer.developerSubtitle')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="h-20 w-[1px] bg-white/10 hidden md:block"></div>
          
          <div className="text-center md:text-end space-y-3">
            <div className="flex items-center gap-5 justify-center md:justify-end">
               <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white whitespace-nowrap">© {branding.footer_year || "2026"}</span>
               <div className="h-6 w-[1px] bg-white/20"></div>
               <span className="text-xs sm:text-sm md:text-base font-black text-white/70 whitespace-nowrap">
                 {getBrandingCopyright()}
               </span>
            </div>
            <p className="text-xs sm:text-base font-bold text-white/30 tracking-wide max-w-lg md:text-end leading-relaxed">
              {getBrandingFooterDescription()}
            </p>
          </div>
        </div>
      </div>

      {/* Modals with Reused Professional Logic */}
      {showAboutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"></div>
          <WatermarkBackground />
          <div 
            className="rounded-[3rem] shadow-2xl max-w-2xl w-full p-12 relative z-10 border-2 border-white/10 text-start"
            style={{ background: `linear-gradient(135deg, ${getThemeColor('primary')}f5, ${getThemeColor('hover')}f9)` }}
          >
            <button onClick={() => setShowAboutModal(false)} className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full">✕</button>
            <div className="text-center mb-10">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h2 className="text-3xl font-black text-white">{(!platformName || platformName.includes('بيت الخبرة')) ? (isRtl ? 'مكتب بيت الخبرة للإستشارت الهندسية' : 'Expert House Engineering Consultancy') : platformName}</h2>
              <div className="w-20 h-1.5 mx-auto bg-white/20 rounded-full mt-4"></div>
            </div>
            <div className="space-y-6 text-white font-bold leading-relaxed">
              <p className="bg-white/5 p-8 rounded-[2rem] border-r-8 border-white/20">
                {isRtl ? 
                  `${(!platformName || platformName.includes('بيت الخبرة')) ? 'مكتب بيت الخبرة للإستشارت الهندسية' : platformName} رائدة في تقديم الحلول الهندسية والتقنية، تسعى لتقديم حلول مبتكرة تخدم البنية التحتية للمملكة، بالتعاون الوثيق مع الشركاء لتحقيق رؤية المملكة 2030.` : 
                  `${(!platformName || platformName.includes('بيت الخبرة')) ? 'Expert House Engineering Consultancy' : platformName} is a leader in engineering and technical solutions, striving to deliver innovative solutions serving the Kingdom's infrastructure, in close cooperation with partners to achieve Saudi Vision 2030.`
                }
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="font-black text-white/40 text-xs mb-1 uppercase tracking-widest">{t('settings.projectManager')}</h4>
                  <p className="text-lg text-white">{(!branding.project_manager_name || branding.project_manager_name.includes('أحمد عبيدات')) ? (isRtl ? "المهندس / أحمد عبيدات" : "Eng. Ahmed Obeidat") : branding.project_manager_name}</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="font-black text-white/40 text-xs mb-1 uppercase tracking-widest">{t('settings.projectCoordinator')}</h4>
                  <p className="text-lg text-white">{(!branding.project_coordinator_name || branding.project_coordinator_name.includes('أحمد حافظ')) ? (isRtl ? "الأستاذ أحمد حافظ" : "Mr. Ahmed Hafez") : branding.project_coordinator_name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 text-start animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"></div>
          <WatermarkBackground />
          <div 
            className="rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative z-10 border-2"
            style={{ 
              background: `linear-gradient(135deg, ${getThemeColor('primary')}f5, ${getThemeColor('hover')}f9)`,
              borderColor: `${getThemeColor('primary')}66`
            }}
          >
            <button onClick={() => setShowSupportModal(false)} className="absolute top-8 left-8 text-white/40 hover:text-white">✕</button>
            <div className="text-center mb-8">
              <MessageSquare className="w-14 h-14 mx-auto mb-4 text-white/20" />
              <h3 className="text-2xl font-black text-white">{t('supportMessages.title')}</h3>
            </div>
            {supportSuccess ? (
              <div className="text-center py-10">
                <div 
                  className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto text-5xl mb-6 animate-bounce"
                  style={{ color: getThemeColor('accent') }}
                >✓</div>
                <p className="font-black text-white text-2xl">{t('common.success')}</p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-4">
                <input type="text" placeholder={t('common.name') || (isRtl ? 'الاسم' : 'Name')} required className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none text-white text-start" value={supportForm.name} onChange={(e) => setSupportForm({...supportForm, name: e.target.value})} />
                <input type="email" placeholder={t('common.email') || (isRtl ? 'البريد الإلكتروني' : 'Email')} required className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none text-white text-start" value={supportForm.email} onChange={(e) => setSupportForm({...supportForm, email: e.target.value})} />
                <textarea placeholder={t('chat.typeMessage') || (isRtl ? 'اكتب رسالتك هنا...' : 'Type your message here...')} rows="3" required className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none text-white text-start resize-none" value={supportForm.message} onChange={(e) => setSupportForm({...supportForm, message: e.target.value})} />
                <button 
                  type="submit" 
                  disabled={supportLoading} 
                  className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl shadow-xl transition-all border border-white/20"
                >
                  {supportLoading ? (isRtl ? 'جارِ الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الرسالة' : 'Send Message')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 text-start animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"></div>
          <WatermarkBackground />
          <div 
            className="rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative z-10 border-2 border-white/10"
            style={{ background: `linear-gradient(135deg, ${getThemeColor('primary')}f5, ${getThemeColor('hover')}f9)` }}
          >
            <button onClick={() => setShowForgotPassword(false)} className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors">✕</button>
            <div className="text-center mb-10">
              <Lock className="w-14 h-14 mx-auto mb-4 text-white/20" />
              <h3 className="text-2xl font-black text-white">{t('login.forgotPassword')}</h3>
            </div>

            {forgotStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-white/50 uppercase tracking-widest px-1 block">{t('login.username')}</label>
                  <input 
                    type="text" 
                    value={forgotUsername} 
                    onChange={(e) => setForgotUsername(e.target.value)} 
                    placeholder={t('login.enterUsername')} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:border-white/30 text-white text-start font-bold" 
                  />
                </div>
                <button 
                  onClick={handleForgotPassword} 
                  disabled={forgotLoading} 
                  className="w-full py-5 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 bg-white/10 border border-white/20 hover:bg-white/20"
                >
                  {forgotLoading ? t('login.sending') : t('login.sendResetRequest')}
                </button>
              </div>
            )}

            {forgotStep === 2 && (
              <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-2xl text-white/70 text-sm font-bold leading-relaxed border-r-4 border-amber-400 backdrop-blur-sm mb-6">
                  {t('login.supportNotice')}
                </div>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    value={forgotCode} 
                    onChange={(e) => setForgotCode(e.target.value)} 
                    placeholder={t('common.enterValue')} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none text-center text-3xl font-black tracking-widest text-white" 
                    maxLength={6} 
                  />
                  <input 
                    type="password" 
                    value={forgotNewPassword} 
                    onChange={(e) => setForgotNewPassword(e.target.value)} 
                    placeholder={t('login.newPassword')} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none text-white text-start font-bold" 
                  />
                </div>
                <button 
                  onClick={handleResetPassword} 
                  disabled={forgotLoading} 
                  className="w-full py-5 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 bg-emerald-500 hover:bg-emerald-600"
                >
                  {t('login.changePassword')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showTicketStatus && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 text-start animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"></div>
          <WatermarkBackground />
          <div 
            className="rounded-[3rem] shadow-2xl max-w-md w-full p-12 relative z-10 border-2 border-white/10"
            style={{ background: `linear-gradient(135deg, ${getThemeColor('primary')}f5, ${getThemeColor('hover')}f9)` }}
          >
            <button onClick={() => { setShowTicketStatus(false); setUserTickets([]); }} className="absolute top-8 left-8 text-white/40 hover:text-white">✕</button>
            <h3 className="text-2xl font-black text-white mb-8 text-center">{isRtl ? '🔔 تتبع التذاكر' : '🔔 Track Tickets'}</h3>
            {userTickets.length === 0 ? (
              <div className="space-y-6">
                <input type="email" value={ticketEmail} onChange={(e) => setTicketEmail(e.target.value)} placeholder={t('common.email')} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none text-white text-start" />
                <button onClick={checkUserTickets} disabled={ticketLoading || !ticketEmail} className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl shadow-xl transition-all border border-white/20">{t('common.search')}</button>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                {userTickets.map((t, i) => (
                  <div key={i} className="p-6 rounded-2xl border border-white/10 bg-white/5 transition-all hover:bg-white/10">
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black mb-2 ${t.status === 'تم الحل' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>{t.status}</span>
                    <p className="text-base font-bold text-white">{t.message}</p>
                    <p className="text-xs text-white/30 mt-3">{new Date(t.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
