import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { hasProjectPermission as hasProjectPermUtil, PROJECT_SCOPED_PERMISSIONS } from '../utils/permissions';
import { useBranding } from '../hooks/useBranding';
import { Globe, ShieldAlert, ClipboardCheck, FileBarChart2, Bell, UserCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// الثيمات المتاحة
const themeColors = {
  blue: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', hover: '#1d4ed8', light: '#dbeafe', text: '#1e40af' },
  green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', hover: '#047857', light: '#d1fae5', text: '#065f46' },
  gray: { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', hover: '#374151', light: '#e5e7eb', text: '#374151' },
  'gray-light': { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db', hover: '#4b5563', light: '#f3f4f6', text: '#4b5563' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', hover: '#6d28d9', light: '#ede9fe', text: '#5b21b6' },
  teal: { primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', hover: '#0f766e', light: '#ccfbf1', text: '#115e59' },
  amber: { primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', hover: '#b45309', light: '#fef3c7', text: '#92400e' },
  rose: { primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', hover: '#be123c', light: '#ffe4e6', text: '#be123c' },
  slate: { primary: '#334155', secondary: '#475569', accent: '#94a3b8', hover: '#1e293b', light: '#f8fafc', text: '#334155' },
};

import { translateBrandingText } from '../utils/brandingTranslation';
import OccasionWatermark from './OccasionWatermark';

function Layout({ children, user, onLogout, fullWidth = false }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { branding } = useBranding();
  const [, setTranslationTick] = useState(0);
  useEffect(() => {
    const handleTranslationUpdate = () => {
      setTranslationTick(tick => tick + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdate);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdate);
  }, []);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false); // مشروع إيصال
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false); // لإظهار dropdown الإشعارات
  const [governorateCounts, setGovernorateCounts] = useState([]); // البلاغات حسب المحافظة
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0); // فواتير العهدة المعلقة
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0); // طلبات الموظفين المعلقة
  const [signedRequestsCount, setSignedRequestsCount] = useState(0); // طلبات تم توقيعها وبانتظار التأكيد
  const [supportMessagesCount, setSupportMessagesCount] = useState(0); // رسائل الدعم الجديدة
  const [pendingExtractsCount, setPendingExtractsCount] = useState(0); // المستخلصات المعلقة
  const [allProjects, setAllProjects] = useState([]); // جميع المشاريع من قاعدة البيانات
  const [projectTypes, setProjectTypes] = useState({}); // نوع كل مشروع (connections أو reports)
  const [pendingSafetyCount, setPendingSafetyCount] = useState(0);
  const [pendingQualityCount, setPendingQualityCount] = useState(0);
  const [pendingBusinessCount, setPendingBusinessCount] = useState(0);
  const [pendingConsultantCount, setPendingConsultantCount] = useState(0);
  
  const previousSignedCount = useRef(0);
  const previousPendingReviewCount = useRef(0);
  
  // اسم المنصة - يُقرأ من localStorage أولاً لتجنب التأخير
  const [platformName, setPlatformName] = useState(() => {
    return localStorage.getItem('platformName') || 'بيت الخبرة';
  });
  
  // ثيم المنصة
  const [platformTheme, setPlatformTheme] = useState(() => {
    return localStorage.getItem('platformTheme') || 'blue';
  });
  
  // جلب ثيم المنصة
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axios.get(`${API}/settings/platform`);
        const theme = response.data.theme || 'blue';
        setPlatformTheme(theme);
        localStorage.setItem('platformTheme', theme);
      } catch (error) {
        console.error('Failed to fetch theme:', error);
      }
    };
    fetchTheme();
  }, []);
  
  // الحصول على ألوان الثيم الحالي
  const getThemeColor = (colorType) => {
    const colors = themeColors[platformTheme] || themeColors.blue;
    return colors[colorType] || colors.primary;
  };
  
  // نظام إشعارات البلاغات الجديدة
  const [reportNotificationsOpen, setReportNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationTab, setNotificationTab] = useState('unread'); // 'unread' أو 'read'
  const [unseenReports, setUnseenReports] = useState([]);
  const [unseenReportsByGov, setUnseenReportsByGov] = useState([]);
  const [unseenReportsCount, setUnseenReportsCount] = useState(0);
  const [seenReports, setSeenReports] = useState([]); // البلاغات المقروءة
  const [seenReportsCount, setSeenReportsCount] = useState(0);
  const [unseenWaterConnections, setUnseenWaterConnections] = useState([]);
  const [unseenSewageConnections, setUnseenSewageConnections] = useState([]);
  
  // نظام التنبيهات الصوتية
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true; // مفعل افتراضياً
  });
  const unseenIntervalRef = useRef(null);
  const previousAnnouncementRef = useRef(null);
  const [dynamicAnnouncement, setDynamicAnnouncement] = useState('');
  const [showDynamicAnnouncement, setShowDynamicAnnouncement] = useState(false);
  const [flashDynamicAnnouncement, setFlashDynamicAnnouncement] = useState(true);
  const previousUnseenCount = useRef(0);
  const previousInvoicesCount = useRef(0);
  const previousRequestsCount = useRef(0);
  const previousExtractsCount = useRef(0);
  const isFirstLoad = useRef(true);
  const reminderIntervalRef = useRef(null);
  
  // دالة تشغيل صوت التنبيه الأساسي - نغمة حادة وسريعة تشبه الواتساب
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const playTone = (freq, type, startTime, duration, vol) => {
        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        osc.type = type;
        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // استخدام الانزلاق السريع في التردد لإعطاء طابع (Pop / Click) المميز لتطبيقات المحادثة
        osc.frequency.setValueAtTime(freq, startTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.9, startTime + duration);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      const t = audioContext.currentTime;
      // نغمة سريعة وحادة تشبه إشعار رسالة الواتساب الجديدة (نغمتين سريعتين متتاليتين)
      playTone(900, 'triangle', t, 0.08, 0.8);
      playTone(1350, 'triangle', t + 0.08, 0.15, 0.8);
    } catch (e) {
      console.error('Could not play notification sound:', e);
    }
  }, []);

  // نغمة الآيفون العاجلة للمناسبات (عالية جداً)
  const playIphoneAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') audioContext.resume();
      const playTone = (freq, startTime, duration) => {
        const osc = audioContext.createOscillator();
        const osc2 = audioContext.createOscillator(); // مذبذب إضافي لزيادة قوة الصوت
        const gainNode = audioContext.createGain();
        
        osc.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        osc.type = 'square';   // موجة حادة وعالية جداً
        osc2.type = 'triangle';// موجة إضافية
        
        osc.frequency.setValueAtTime(freq, startTime);
        osc2.frequency.setValueAtTime(freq * 1.01, startTime); // تأثير صوتي مضاعف
        
        gainNode.gain.setValueAtTime(0, startTime);
        // زيادة كبيرة في مستوى الصوت
        gainNode.gain.linearRampToValueAtTime(1.5, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + duration);
        osc2.stop(startTime + duration);
      };
      
      const t = audioContext.currentTime;
      // نغمة تشبه Tri-tone الخاصة بالآيفون (أكثر حدة وارتفاعاً)
      playTone(1046.50, t, 0.4);       // C6
      playTone(880.00, t + 0.2, 0.4);  // A5
      playTone(1046.50, t + 0.4, 0.6); // C6
      playTone(1318.51, t + 0.6, 0.8); // E6 عالي كنهاية للتنبيه
    } catch (e) {
      console.log('Could not play iphone alert sound:', e);
    }
  }, []);
  
  // دالة تشغيل صوت تذكير (أقل حدة) للتمييز عن الإشعار الجديد
  const playReminderSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // صوت تذكير ناعم ومختلف تماماً عن نغمة الواتساب
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime); // تعديل الصوت ليكون أوضح بقليل
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      console.log('Could not play reminder sound:', e);
    }
  }, []);
  
  // دالة تبديل حالة الصوت
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('notificationSoundEnabled', JSON.stringify(newValue));
      // تشغيل صوت تجريبي عند التفعيل
      if (newValue) {
        playNotificationSound();
      }
      return newValue;
    });
  }, []);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const hasPermission = (permKey) => {
    if (!user) return false;
    // Admin لديه جميع الصلاحيات
    if (user.role === 'admin') return true;
    
    // الصلاحيات العامة
    if ((user.permissions || []).includes(permKey)) return true;
    
    // الصلاحيات المرتبطة بمشروع: إذا كانت ممنوحة لأي مشروع، يعتبر يملكها
    const pp = user.project_permissions || {};
    return Object.values(pp).some(perms => (perms || []).includes(permKey));
  };

  // دالة التحقق من صلاحية لمشروع محدد
  const hasProjectPermission = (project, permKey) => hasProjectPermUtil(user, project, permKey);
  
  const toggleLanguage = () => {
    const currentLang = i18n.language || 'ar';
    const newLang = currentLang.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };
  
  // تعيين اتجاه الصفحة عند التحميل
  useEffect(() => {
    const currentLang = i18n.language || 'ar';
    document.documentElement.dir = currentLang.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);

  const isActive = (path) => location.pathname === path;
  
  // جلب عدد البلاغات بانتظار المراجعة والتفاصيل حسب المحافظة
  useEffect(() => {
    const fetchPendingReview = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // جلب العدد الإجمالي
        const countResponse = await axios.get(`${API}/reports/pending-review-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const newPendingReviewCount = countResponse.data.count || 0;
        
        // تم إيقاف تشغيل النغمة لعدد بلاغات قيد المراجعة بناءً على طلب المستخدم
        if (!isFirstLoad.current && soundEnabled && newPendingReviewCount > previousPendingReviewCount.current) {
          console.log('🔔 بلاغ قيد المراجعة جديد! (بدون صوت)', previousPendingReviewCount.current, '->', newPendingReviewCount);
        }
        previousPendingReviewCount.current = newPendingReviewCount;
        setPendingReviewCount(newPendingReviewCount);
        
        // جلب التفاصيل حسب المحافظة
        const govResponse = await axios.get(`${API}/reports/pending-review-by-governorate`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGovernorateCounts(govResponse.data.data || []);
        
        // جلب عدد الفواتير والطلبات المعلقة
        const notifResponse = await axios.get(`${API}/notifications/pending-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const newInvoicesCount = notifResponse.data.pending_invoices || 0;
        const newRequestsCount = notifResponse.data.pending_requests || 0;
        const newExtractsCount = notifResponse.data.pending_extracts || 0;
        const newSignedCount = notifResponse.data.signed_requests || 0;
        
        // تشغيل صوت التنبيه للفواتير الجديدة
        if (!isFirstLoad.current && soundEnabled && newInvoicesCount > previousInvoicesCount.current) {
          // playNotificationSound();
          console.log('🔔 فاتورة جديدة! العدد السابق:', previousInvoicesCount.current, '-> الجديد:', newInvoicesCount);
        }
        
        // تشغيل صوت التنبيه للطلبات الجديدة
        if (!isFirstLoad.current && soundEnabled && newRequestsCount > previousRequestsCount.current) {
          // playNotificationSound();
          console.log('🔔 طلب موظف جديد! العدد السابق:', previousRequestsCount.current, '-> الجديد:', newRequestsCount);
        }

        // تشغيل صوت التنبيه للمستندات الموقعة الجديدة
        if (!isFirstLoad.current && soundEnabled && newSignedCount > previousSignedCount.current) {
          // playNotificationSound();
          console.log('🔔 توقيع جديد! العدد السابق:', previousSignedCount.current, '-> الجديد:', newSignedCount);
        }
        
        // تشغيل صوت التنبيه للمستخلصات الجديدة
        if (!isFirstLoad.current && soundEnabled && newExtractsCount > previousExtractsCount.current) {
          // playNotificationSound();
          console.log('🔔 مستخلص جديد! العدد السابق:', previousExtractsCount.current, '-> الجديد:', newExtractsCount);
        }
        
        // جلب البلاغات الجديدة (غير المرئية)
        const unseenResponse = await axios.get(`${API}/reports/notifications/unseen`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const newUnseenCount = unseenResponse.data.total || 0;
        
        // استخدام localStorage لمعرفة هل زاد العدد حتى لو تم الانتقال لصفحة أخرى (لأن Layout يعاد تحميله)
        const savedUnseenCount = parseInt(localStorage.getItem('wfm_last_unseen_count') || '0', 10);
        
        // تشغيل الأصوات
        if (soundEnabled) {
          if (newUnseenCount > savedUnseenCount) {
            // جرس حاد للبلاغات الجديدة (سواء عند التصفح أو الانتقال بين الصفحات)
            playNotificationSound(); 
            console.log('🔔 بلاغ جديد! العدد السابق:', savedUnseenCount, '-> الجديد:', newUnseenCount);
          } else if (isFirstLoad.current && newUnseenCount > 0) {
            // جرس تذكير (هادئ) عند دخول المستخدم للنظام ووجود إشعارات سابقة غير مقروءة
            playReminderSound();
            console.log('🔔 تذكير عند الدخول: لديك', newUnseenCount, 'إشعارات غير مقروءة');
          }
        }
        
        // تحديث القيمة في التخزين المحلي والذاكرة
        localStorage.setItem('wfm_last_unseen_count', newUnseenCount.toString());
        
        // تحديث القيم القديمة
        isFirstLoad.current = false;
        previousPendingReviewCount.current = newPendingReviewCount;
        previousInvoicesCount.current = newInvoicesCount;
        previousRequestsCount.current = newRequestsCount;
        previousExtractsCount.current = newExtractsCount;
        previousSignedCount.current = newSignedCount;
        previousUnseenCount.current = newUnseenCount;
        
        setPendingInvoicesCount(newInvoicesCount);
        setPendingRequestsCount(newRequestsCount);
        setPendingExtractsCount(newExtractsCount);
        setSignedRequestsCount(newSignedCount);
        setUnseenReportsCount(newUnseenCount);
        
        // جلب عدد رسائل الدعم الجديدة (لأي مستخدم لديه صلاحية support_messages - عامة أو لكل مشروع)
        const hasSupportPerm = user.role === 'admin' ||
          (user.permissions || []).includes('support_messages') ||
          Object.values(user.project_permissions || {}).some(perms => (perms || []).includes('support_messages'));
        if (hasSupportPerm) {
          try {
            const supportResponse = await axios.get(`${API}/support/messages/count`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            setSupportMessagesCount(supportResponse.data.count || 0);
          } catch (e) { /* silent */ }
        }
        
        // التحقق من الإعلان العام (شريط المناسبات العاجلة)
        try {
          const settingsRes = await axios.get(`${API}/settings/platform`);
          const { show_announcement, global_announcement, flash_announcement } = settingsRes.data;
          
          if (show_announcement && global_announcement) {
            // إذا تغير الإعلان عن السابق ولم تكن هذه أول مرة يحمل فيها النظام
            if (previousAnnouncementRef.current !== null && global_announcement !== previousAnnouncementRef.current) {
              if (soundEnabled) playIphoneAlertSound();
              Swal.fire({
                title: isRtl ? 'إعلان هام وعاجل!' : 'Urgent Announcement!',
                text: global_announcement,
                icon: 'warning',
                confirmButtonText: isRtl ? 'تم الاطلاع' : 'Understood',
                confirmButtonColor: '#e53935',
                backdrop: 'rgba(229, 57, 53, 0.4)',
                allowOutsideClick: false,
                allowEscapeKey: false
              });
            }
            setDynamicAnnouncement(global_announcement);
            setShowDynamicAnnouncement(true);
            setFlashDynamicAnnouncement(flash_announcement ?? true);
            previousAnnouncementRef.current = global_announcement;
          } else {
            setShowDynamicAnnouncement(false);
            setDynamicAnnouncement('');
            previousAnnouncementRef.current = '';
          }
        } catch (e) {
          // silent
        }
        
        setUnseenReportsCount(newUnseenCount);
        setUnseenReports(unseenResponse.data.reports || []);
        setUnseenReportsByGov(unseenResponse.data.by_governorate || []);
        setUnseenWaterConnections(unseenResponse.data.water_connections || []);
        setUnseenSewageConnections(unseenResponse.data.sewage_connections || []);
        
        // جلب البلاغات المقروءة (آخر 20 بلاغ)
        const seenResponse = await axios.get(`${API}/reports/notifications/seen`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSeenReports(seenResponse.data.reports || []);
        setSeenReportsCount(seenResponse.data.total || 0);
        
      } catch (error) {
        console.error('Error fetching pending review:', error);
      }

      // جلب عدد تقارير السلامة والجودة والأعمال قيد المراجعة
      try {
        const token = localStorage.getItem('token');
        const [safetyRes, qualityRes, businessRes, consultantRes] = await Promise.all([
          axios.get(`${API}/safety-reports`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/quality-reports`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/business-reports`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/reports/consultant-notes`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { reports: [] } }))
        ]);
        setPendingSafetyCount((safetyRes.data || []).filter(r => (r.status || 'قيد المراجعة') === 'قيد المراجعة').length);
        setPendingQualityCount((qualityRes.data || []).filter(r => (r.status || 'قيد المراجعة') === 'قيد المراجعة').length);
        setPendingBusinessCount((businessRes.data || []).filter(r => (r.status || 'قيد المراجعة') === 'قيد المراجعة').length);
        
        // جلب عدد ملاحظات الاستشاري قيد المعالجة
        if (consultantRes?.data?.reports) {
          setPendingConsultantCount(consultantRes.data.reports.filter(r => r.consultant_note_processed === false).length);
        }
      } catch (e) { /* silent */ }
    };
    
    // جلب البيانات عند التحميل
    fetchPendingReview();
    
    // تحديث العدد كل 15 ثانية لجعل النظام أسرع في الاستجابة
    const interval = setInterval(fetchPendingReview, 15000);
    
    return () => clearInterval(interval);
  }, [user, soundEnabled, playNotificationSound]);
  
  // نظام التذكير الدوري (كل 30 ثانية) للإشعارات غير المقروءة للفت الانتباه
  useEffect(() => {
    if (!soundEnabled) {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
        reminderIntervalRef.current = null;
      }
      return;
    }
    
    reminderIntervalRef.current = setInterval(() => {
      const hasUnread = unseenReportsCount > 0 || pendingInvoicesCount > 0 || pendingRequestsCount > 0 || pendingExtractsCount > 0;
      if (hasUnread && soundEnabled) {
        playReminderSound(); // تشغيل صوت التذكير (جرس مختلف)
        console.log('🔔 تذكير: لديك إشعارات غير مقروءة');
      }
    }, 30000); // كل 30 ثانية
    
    return () => {
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    };
  }, [soundEnabled, unseenReportsCount, pendingInvoicesCount, pendingRequestsCount, pendingExtractsCount, playNotificationSound]);
  
  // دالة تحديد البلاغ كمرئي (مقروء)
  const markReportAsSeen = async (reportId, report) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reports/${reportId}/mark-seen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // نقل البلاغ من غير مقروء إلى مقروء
      const movedReport = unseenReports.find(r => r.id === reportId) || report;
      setUnseenReports(prev => prev.filter(r => r.id !== reportId));
      setUnseenReportsCount(prev => Math.max(0, prev - 1));
      setUnseenReportsByGov(prev => 
        prev.map(g => ({
          ...g,
          count: g.reports.filter(r => r.id !== reportId).length,
          reports: g.reports.filter(r => r.id !== reportId)
        })).filter(g => g.count > 0)
      );
      // إضافة للمقروء
      if (movedReport) {
        setSeenReports(prev => [movedReport, ...prev].slice(0, 20));
        setSeenReportsCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error marking report as seen:', error);
    }
  };
  
  // دالة إرجاع البلاغ لغير مرئي (غير مقروء)
  const markReportAsUnseen = async (reportId, report) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reports/${reportId}/mark-unseen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // نقل البلاغ من مقروء إلى غير مقروء
      const movedReport = seenReports.find(r => r.id === reportId) || report;
      setSeenReports(prev => prev.filter(r => r.id !== reportId));
      setSeenReportsCount(prev => Math.max(0, prev - 1));
      // إضافة لغير المقروء
      if (movedReport) {
        setUnseenReports(prev => [movedReport, ...prev]);
        setUnseenReportsCount(prev => prev + 1);
        // تحديث التجميع حسب المحافظة
        const gov = movedReport.governorate || 'غير محدد';
        setUnseenReportsByGov(prev => {
          const existing = prev.find(g => g.governorate === gov);
          if (existing) {
            return prev.map(g => g.governorate === gov 
              ? { ...g, count: g.count + 1, reports: [movedReport, ...g.reports] }
              : g
            );
          } else {
            return [...prev, { governorate: gov, count: 1, reports: [movedReport] }];
          }
        });
      }
    } catch (error) {
      console.error('Error marking report as unseen:', error);
    }
  };
  
  // دالة تحديد جميع البلاغات كمرئية
  const markAllReportsAsSeen = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reports/mark-all-seen`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnseenReports([]);
      setUnseenReportsCount(0);
      setUnseenReportsByGov([]);
      setReportNotificationsOpen(false);
    } catch (error) {
      console.error('Error marking all reports as seen:', error);
    }
  };

  // حذف إشعار بلاغ واحد من المقروءة
  const deleteReportNotification = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/reports/notifications/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeenReports(prev => prev.filter(r => r.id !== reportId));
      setSeenReportsCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // حذف جميع الإشعارات المقروءة
  const clearAllReadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/reports/notifications/clear-all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSeenReports([]);
      setSeenReportsCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // جلب المشاريع من قاعدة البيانات
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const [projRes, connProjRes, typesRes] = await Promise.all([
          axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/connection-projects`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/projects/types`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const combinedProjects = [...(projRes.data || []), ...(connProjRes.data || [])];
        // إزالة التكرار بناءً على الاسم
        const uniqueProjects = [];
        const seenNames = new Set();
        combinedProjects.forEach(p => {
          if (!seenNames.has(p.name)) {
            uniqueProjects.push(p);
            seenNames.add(p.name);
          }
        });

        setAllProjects(uniqueProjects);
        
        // دمج أنواع المشاريع (مشاريع الإيصال نوعها دائمًا connections)
        const combinedTypes = { ...(typesRes.data || {}) };
        (connProjRes.data || []).forEach(p => {
          if (!combinedTypes[p.name]) {
            combinedTypes[p.name] = 'connections';
          }
        });
        setProjectTypes(combinedTypes);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
    
    // جلب اسم المنصة وتحديث localStorage
    const fetchPlatformSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/platform`);
        const newName = response.data.platform_name || 'بيت الخبرة';
        setPlatformName(newName);
        // تحديث localStorage للاستخدام في الصفحات الأخرى
        localStorage.setItem('platformName', newName);
      } catch (error) {
        console.error('Failed to fetch platform settings:', error);
      }
    };
    fetchPlatformSettings();
  }, []);

  // الحصول على المشاريع المتاحة للمستخدم مرتبة
  const getUserProjects = useCallback(() => {
    // ترتيب المشاريع الأساسية
    const defaultOrder = [
      'مشروع المحافظات الغربية -القطاع الأوسط',
      'مشروع المحافظات الشمالية -القطاع الأوسط',
      'مشروع المحافظات الجنوبية -القطاع الأوسط'
    ];
    
    let projects = allProjects;
    
    // المستخدم العادي يرى مشاريعه فقط
    if (user.role !== 'admin' && user.projects && user.projects.length > 0) {
      projects = allProjects.filter(p => {
        if (user.projects.includes(p.name)) return true;
        
        // المطابقة المرنة
        return user.projects.some(up => {
          if (['الكل', 'جميع المشاريع', 'كل المشاريع'].includes(up)) return true;
          
          const normalize = str => str.replace(/[-_/|()]/g, ' ').replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه').replace(/[يى]/g, 'ي');
          const upNorm = normalize(up);
          const pNorm = normalize(p.name);
          
          const ignoreWords = ['مشروع', 'إصلاح', 'أعمال', 'بناء', 'ال'];
          const upKeywords = upNorm.split(/\s+/).filter(k => k.length > 2 && !ignoreWords.includes(k));
          const pKeywords = pNorm.split(/\s+/).filter(k => k.length > 2 && !ignoreWords.includes(k));
          
          if (upKeywords.length === 0) return pNorm.includes(upNorm) || upNorm.includes(pNorm);
          
          // تحقق من وجود الكلمات الأساسية
          return upKeywords.every(uk => pKeywords.some(pk => pk.includes(uk) || uk.includes(pk)));
        });
      });
    }
    
    // ترتيب: المشاريع الأساسية أولاً بالترتيب، ثم المشاريع الأخرى
    return projects.sort((a, b) => {
      const indexA = defaultOrder.indexOf(a.name);
      const indexB = defaultOrder.indexOf(b.name);
      
      // كلاهما من المشاريع الأساسية
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      // a أساسي و b ليس
      if (indexA !== -1) return -1;
      // b أساسي و a ليس
      if (indexB !== -1) return 1;
      // كلاهما مشاريع مضافة - رتب أبجدياً
      return a.name.localeCompare(b.name, 'ar');
    });
  }, [allProjects, user]);

  const authorizedProjectsLinks = useMemo(() => {
    return getUserProjects().map((project) => {
      const hasReportsInProject = hasProjectPermission(project.name, 'reports_view') ||
                                   hasProjectPermission(project.name, 'reports_add') ||
                                   hasProjectPermission(project.name, 'reports_review');
      const hasConnInProject = hasProjectPermission(project.name, 'water_connections') ||
                                hasProjectPermission(project.name, 'sewage_connections');
      const hasUsersManage = hasProjectPermission(project.name, 'users_manage');
      const hasSettings = hasProjectPermission(project.name, 'settings') || hasProjectPermission(project.name, 'project_settings');
      
      if (user.role !== 'admin' && !hasReportsInProject && !hasConnInProject && !hasUsersManage && !hasSettings) {
        return null;
      }
      
      let linkTo;
      let mobileLinkTo;
      if (user.role === 'admin') {
        const isConn = projectTypes[project.name] === 'connections';
        linkTo = isConn ? `/connections-hub?project=${encodeURIComponent(project.name)}` : `/reports?project=${encodeURIComponent(project.name)}`;
        mobileLinkTo = isConn ? linkTo : `/reports?project=${encodeURIComponent(project.name)}&reset=true`;
      } else {
        if (hasReportsInProject) {
          linkTo = `/reports?project=${encodeURIComponent(project.name)}`;
          mobileLinkTo = `/reports?project=${encodeURIComponent(project.name)}&reset=true`;
        } else if (hasConnInProject) {
          linkTo = `/connections-hub?project=${encodeURIComponent(project.name)}`;
          mobileLinkTo = linkTo;
        } else if (hasUsersManage) {
          linkTo = `/users`;
          mobileLinkTo = linkTo;
        } else {
          const isConn = projectTypes[project.name] === 'connections';
          linkTo = isConn ? `/connections-hub?project=${encodeURIComponent(project.name)}` : `/reports?project=${encodeURIComponent(project.name)}`;
          mobileLinkTo = isConn ? linkTo : `/reports?project=${encodeURIComponent(project.name)}&reset=true`;
        }
      }
      return { project, linkTo, mobileLinkTo };
    }).filter(Boolean);
  }, [getUserProjects, user, projectTypes]);


  // التحقق من صلاحيات عرض المستخلصات
  // تظهر للجميع ما عدا المستوى الأخير (الذين لا يمكنهم إنشاء مستخدمين ولديهم محافظات محددة)
  const canViewExtracts = () => {
    // 1. Admin - دائماً يظهر
    if (user.role === 'admin') return true;
    
    // 2. أي مستخدم يمكنه إنشاء مستخدمين فرعيين - يظهر
    if (user.can_create_subusers === true) return true;
    
    // 3. المستوى الأخير فقط (لا يمكنه إنشاء مستخدمين ولديه محافظات محددة) - لا يظهر
    // الباقي يظهر
    if (user.can_create_subusers === false && user.governorates && user.governorates.length > 0) {
      return false;
    }
    
    // الجميع الآخرين يظهر لهم
    return true;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Fully Responsive with Dynamic Theme */}
      <header 
        className="shadow-lg"
        style={{ background: `linear-gradient(to left, var(--color-primary), var(--color-hover))` }}
      >
        <div className="mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center py-2 sm:py-3 lg:py-4">
            {/* Right Side: Mobile Menu + Company Logos */}
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-white p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              {/* Company Logos - Small on the right */}
              <div className="flex items-center gap-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/20">
                  <img src={branding.company_logo_url || "/bayt-alkhibra-logo.png"} alt={translateBrandingText(branding.company_name, isRtl) || "بيت الخبرة"} className="h-10 w-auto" />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1.5 border border-white/20">
                  <img src={branding.partner_logo_url || "/nwc-logo.png"} alt={translateBrandingText(branding.partner_company_name, isRtl) || "شركة المياة الوطنية"} className="h-10 w-auto" />
                </div>
                {/* شعار رؤية السعودية 2030 - HTML flexbox للتنسيق الصحيح */}
                <div
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '1px', opacity: 0.97,
                    textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                  }}
                  title={isRtl ? "رؤية المملكة العربية السعودية 2030" : "Saudi Vision 2030"}
                >
                  {/* السطر 1: رؤية VISION */}
                  <div style={{
                    color: 'white', fontSize: '15px', fontWeight: '800',
                    letterSpacing: '2px', fontFamily: "'Segoe UI', Arial, sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    رؤية VISION
                  </div>

                  {/* السطر 2: 2 [زخرفة] 30 - بجانب بعض مباشرةً */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', lineHeight: 1 }}>
                    {/* الرقم 30 - على اليسار */}
                    <span style={{
                      color: 'white', fontSize: '32px', fontWeight: '900',
                      fontFamily: "'Arial Black', 'Arial', sans-serif",
                      lineHeight: 1
                    }}>30</span>

                    {/* الزخرفة الملونة - SVG صغير منفصل */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"
                      style={{ width: '34px', height: '34px', flexShrink: 0 }}>
                      {/* صف 0 */}
                      <rect x="1"  y="1"  width="7" height="7" fill="#48cae4" rx="1.2"/>
                      <rect x="10" y="1"  width="7" height="7" fill="#0096c7" rx="1.2"/>
                      <rect x="19" y="1"  width="7" height="7" fill="#52b788" rx="1.2"/>
                      <rect x="28" y="1"  width="7" height="7" fill="#0096c7" rx="1.2"/>
                      <rect x="37" y="1"  width="7" height="7" fill="#48cae4" rx="1.2"/>
                      {/* صف 1 */}
                      <rect x="1"  y="10" width="7" height="7" fill="#0096c7" rx="1.2"/>
                      <rect x="10" y="10" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="19" y="10" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="28" y="10" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="37" y="10" width="7" height="7" fill="#0096c7" rx="1.2"/>
                      {/* صف 2 - مركز الزخرفة */}
                      <rect x="1"  y="19" width="7" height="7" fill="#52b788" rx="1.2"/>
                      <rect x="10" y="19" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      {/* مركز: النخلة */}
                      <rect x="28" y="19" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="37" y="19" width="7" height="7" fill="#52b788" rx="1.2"/>
                      {/* صف 3 */}
                      <rect x="1"  y="28" width="7" height="7" fill="#0096c7" rx="1.2"/>
                      <rect x="10" y="28" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="19" y="28" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="28" y="28" width="7" height="7" fill="#f4c542" rx="1.2"/>
                      <rect x="37" y="28" width="7" height="7" fill="#0096c7" rx="1.2"/>
                      {/* صف 4 */}
                      <rect x="1"  y="37" width="7" height="7" fill="#48cae4" rx="1.2"/>
                      <rect x="10" y="37" width="7" height="7" fill="#0096c7" rx="1.2"/>
                      <rect x="19" y="37" width="7" height="7" fill="#52b788" rx="1.2"/>
                      <rect x="28" y="37" width="7" height="7" fill="#0096c7" rx="1.2"/>
                      <rect x="37" y="37" width="7" height="7" fill="#48cae4" rx="1.2"/>
                      {/* النخلة السعودية في مركز الشبكة */}
                      <rect x="21.5" y="20" width="2.5" height="11" fill="white" rx="0.8"/>
                      <line x1="22.5" y1="21" x2="15" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="22.5" y1="21" x2="18" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="22.5" y1="21" x2="22.5" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="22.5" y1="21" x2="27" y2="13" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      <line x1="22.5" y1="21" x2="30" y2="15" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M15,33 Q22.5,31 30,33 L30,34.5 Q22.5,32.5 15,34.5 Z" fill="white"/>
                      <path d="M29,32.5 L33,34.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>

                    {/* الرقم 2 - على اليمين */}
                    <span style={{
                      color: 'white', fontSize: '32px', fontWeight: '900',
                      fontFamily: "'Arial Black', 'Arial', sans-serif",
                      lineHeight: 1
                    }}>2</span>
                  </div>

                  {/* السطر 3: المملكة العربية السعودية */}
                  <div style={{
                    color: 'white', fontSize: '9px', fontWeight: '700',
                    letterSpacing: '0.5px', fontFamily: "'Segoe UI', Arial, sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    المملكة العربية السعودية
                  </div>

                  {/* السطر 4: KINGDOM OF SAUDI ARABIA */}
                  <div style={{
                    color: 'rgba(255,255,255,0.85)', fontSize: '5.5px', fontWeight: '500',
                    letterSpacing: '1.5px', fontFamily: "Arial, sans-serif",
                    whiteSpace: 'nowrap'
                  }}>
                    KINGDOM OF SAUDI ARABIA
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Title with Handshake Icon */}
            <div className="flex-1 mx-2 sm:mx-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                {/* Handshake Icon */}
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 hidden sm:block">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-8 md:w-8 text-white drop-shadow-lg" viewBox="0 0 640 512" fill="currentColor">
                    <path d="M323.4 85.2l-96.8 78.4c-16.1 13-19.2 36.4-7 53.1c12.9 17.8 38 21.3 55.3 7.8l99.3-77.2c7-5.4 17-4.2 22.5 2.8s4.2 17-2.8 22.5l-20.9 16.2L550.2 352H592c26.5 0 48-21.5 48-48V176c0-26.5-21.5-48-48-48H516h-4-.7l-3.9-2.5L434.8 79c-15.3-9.8-33.2-15-51.4-15c-21.8 0-43 7.5-60 21.2zm22.8 124.4l-51.7 40.2C263 274.4 217.3 268 193.7 235.6c-22.2-30.5-16.6-73.1 12.7-96.8l83.2-67.3c-11.6-4.9-24.1-7.4-36.8-7.4C234 64 215.7 69.6 200 80l-72 48H48c-26.5 0-48 21.5-48 48V304c0 26.5 21.5 48 48 48H156.2l91.4 83.4c19.6 17.9 49.9 16.5 67.8-3.1c5.5-6.1 9.2-13.2 11.1-20.6l17 15.6c19.5 17.9 49.9 16.6 67.8-2.9c4.5-4.9 7.8-10.6 9.9-16.5c19.4 13 45.8 10.3 62.1-7.5c17.9-19.5 16.6-49.9-2.9-67.8l-134.2-123z"/>
                  </svg>
                </div>
                <h1 className="text-xs sm:text-sm md:text-lg lg:text-xl xl:text-2xl font-bold text-white leading-tight">
                  {translateBrandingText(platformName, isRtl)}
                </h1>
              </div>
              <div className="hidden sm:flex items-center justify-center gap-2 md:gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-[10px] md:text-xs text-white/90" data-testid="header-pm-label">
                    {translateBrandingText(branding.project_manager_title, isRtl) || t('header.projectManager')}/{translateBrandingText(branding.project_manager_name, isRtl) || ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <p className="text-[10px] md:text-xs text-white/90" data-testid="header-pc-label">
                    {translateBrandingText(branding.project_coordinator_name, isRtl) || ''} - {translateBrandingText(branding.project_coordinator_title, isRtl) || t('header.projectCoordinator')}
                  </p>
                </div>
              </div>
            </div>

            {/* User Info & Actions - Responsive */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* جرس التنبيهات للبلاغات بانتظار المراجعة - يظهر للمراجعين وللمنشئين */}
              {(hasPermission('reports_review') || hasPermission('reports_add') || hasPermission('reports_view')) && pendingReviewCount > 0 && (
                <div className="relative">
                  <button 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title={isRtl ? `${pendingReviewCount} بلاغات قيد المراجعة` : `${pendingReviewCount} Reports Pending Review`}
                  >
                    <svg 
                      className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-300 animate-pulse" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2C10.9 2 10 2.9 10 4V4.29C7.03 5.17 5 7.9 5 11V17L3 19V20H21V19L19 17V11C19 7.9 16.97 5.17 14 4.29V4C14 2.9 13.1 2 12 2ZM12 23C13.11 23 14 22.11 14 21H10C10 22.11 10.89 23 12 23Z"/>
                    </svg>
                    {/* Badge للعدد */}
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {pendingReviewCount > 9 ? '9+' : pendingReviewCount}
                    </span>
                  </button>
                  
                  {/* Dropdown للإشعارات */}
                  {notificationsOpen && (
                    <>
                      {/* Overlay لإغلاق الـ dropdown عند الضغط خارجه */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setNotificationsOpen(false)}
                      ></div>
                      
                      <div className="fixed sm:absolute left-1/2 sm:left-0 top-16 sm:top-auto -translate-x-1/2 sm:translate-x-0 sm:mt-2 w-[90vw] sm:w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                          <h3 className="text-white font-bold text-sm">
                            {isRtl ? 'بلاغات جديدة قيد المراجعة' : 'New Reports Pending Review'}
                          </h3>
                          <p className="text-blue-100 text-xs mt-1">
                            {isRtl ? `إجمالي: ${pendingReviewCount} بلاغ` : `Total: ${pendingReviewCount} reports`}
                          </p>
                        </div>
                        
                        <div className="max-h-[50vh] overflow-y-auto">
                          {governorateCounts.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                              {isRtl ? 'لا توجد بلاغات جديدة' : 'No new reports'}
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {Object.entries(
                                governorateCounts.reduce((acc, item) => {
                                  let proj = item.project || (isRtl ? 'بدون مشروع' : 'No Project');
                                  
                                  // معالجة آمنة لأسماء المشاريع دون تشويه الأسماء الحقيقية
                                  proj = proj.replace('مشروع إصلاح أعمال المحافظات الغربية', 'مشروع المحافظات الغربية')
                                             .replace('مشروع إصلاح أعمال المحافظات الجنوبية', 'مشروع المحافظات الجنوبية')
                                             .replace('مشروع إصلاح أعمال المحافظات الشمالية', 'مشروع المحافظات الشمالية')
                                             .replace(/الغربيه/g, 'الغربية')
                                             .replace(/الجنوبيه/g, 'الجنوبية')
                                             .replace(/الشماليه/g, 'الشمالية')
                                             .replace(/ -القطاع/g, ' - القطاع')
                                             .replace(/-القطاع/g, ' - القطاع')
                                             .replace(/\s+/g, ' ')
                                             .trim();
                                             
                                  if (!acc[proj]) acc[proj] = {};
                                  
                                  const govRaw = (item.governorate || '').trim();
                                  const createdByText = item.created_by_name ? ` - ${item.created_by_name}` : '';
                                  const govDisplay = govRaw + createdByText;
                                  
                                  const uniqueKey = govRaw + '_' + (item.created_by || '');
                                  if (!acc[proj][uniqueKey]) {
                                    acc[proj][uniqueKey] = { 
                                      governorate: govDisplay, 
                                      originalGov: govRaw,
                                      project: proj, 
                                      created_by: item.created_by,
                                      count: 0 
                                    };
                                  }
                                  
                                  acc[proj][uniqueKey].count += item.count;
                                  return acc;
                                }, {})
                              ).sort((a, b) => a[0].localeCompare(b[0], 'ar')).map(([projectName, govsMap], projectIndex) => {
                                const items = Object.values(govsMap).sort((a, b) => (a.governorate || '').localeCompare(b.governorate || '', 'ar'));
                                return (
                                <div key={projectIndex} className="bg-white">
                                  <div className="px-4 py-2 bg-slate-50 border-y border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                                    <span className="text-xs font-bold text-slate-700">
                                      {translateBrandingText(projectName, isRtl)}
                                    </span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      {items.reduce((sum, i) => sum + i.count, 0)}
                                    </span>
                                  </div>
                                  <div className="divide-y divide-gray-50">
                                    {items.map((item, idx) => (
                                      <Link
                                        key={idx}
                                        to={`/reports?license_status=review_pending&scroll=true&governorate=${encodeURIComponent(item.originalGov || item.governorate)}${item.project ? `&project=${encodeURIComponent(item.project)}` : ''}${item.created_by ? `&created_by=${encodeURIComponent(item.created_by)}` : ''}`}
                                        onClick={() => {
                                          setNotificationsOpen(false);
                                        }}
                                        className="block px-4 py-3 hover:bg-blue-50 transition-colors"
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            <div className="flex flex-col">
                                              <span className="text-sm font-medium text-gray-900">
                                                {translateBrandingText(item.governorate, isRtl)}
                                              </span>
                                            </div>
                                          </div>
                                          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                                            {item.count}
                                          </span>
                                        </div>
                                      </Link>
                                    ))}
                                  </div>
                                </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                          <Link
                            to="/reports?license_status=review_pending"
                            onClick={() => setNotificationsOpen(false)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center justify-center gap-1"
                          >
                            <span>{isRtl ? 'عرض جميع البلاغات' : 'View all reports'}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* 🔔 جرس الإشعارات الموحّد - يُضبط بصلاحية reports_notifications أو reports_review */}
              {(hasPermission('reports_notifications') || hasPermission('reports_review')) && (
              <div className="relative">
                <button
                  onClick={() => setReportNotificationsOpen(!reportNotificationsOpen)}
                  className="relative p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                  title={isRtl ? `البلاغات الجديدة ${soundEnabled ? '(الصوت مفعل)' : '(الصوت معطل)'}` : `New Reports ${soundEnabled ? '(Sound Enabled)' : '(Sound Disabled)'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unseenReportsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse">
                      {unseenReportsCount > 99 ? '99+' : unseenReportsCount}
                    </span>
                  )}
                  {/* مؤشار حالة الصوت */}
                  {!soundEnabled && (
                    <span className="absolute -bottom-0.5 -left-0.5 bg-red-500 rounded-full p-0.5" title={isRtl ? "الصوت معطل" : "Sound Disabled"}>
                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l1.34 1.34a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.33-1.71-.7zM16.5 12A4.5 4.5 0 0014 7.97v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
                      </svg>
                    </span>
                  )}
                </button>
                
                {/* Dropdown البلاغات - غير مقروء ومقروء */}
                {reportNotificationsOpen && (
                  <>
                    {/* Overlay لإغلاق عند الضغط خارج القائمة */}
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setReportNotificationsOpen(false)}
                    ></div>
                    
                    {/* القائمة المنسدلة - تظهر من الجرس */}
                    <div className="fixed sm:absolute left-1/2 sm:left-0 top-16 sm:top-auto -translate-x-1/2 sm:translate-x-0 sm:mt-2 w-[95vw] sm:w-[380px] md:w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden" style={{ maxHeight: 'calc(100vh - 80px)' }}>
                    {/* Header */}
                    <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold flex items-center gap-2">
                          <span>🔔</span>
                          <span>{isRtl ? 'إشعارات البلاغات والتوصيلات' : 'Reports & Connections Notifications'}</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          {/* زر تفعيل/تعطيل الصوت */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSound();
                            }}
                            className={`p-1.5 rounded-lg transition-all ${soundEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-red-500/50 hover:bg-red-500/70'}`}
                            title={soundEnabled ? (isRtl ? 'إيقاف صوت التنبيه' : 'Mute notification sound') : (isRtl ? 'تفعيل صوت التنبيه' : 'Unmute notification sound')}
                          >
                            {soundEnabled ? (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                              </svg>
                            )}
                          </button>
                          <button onClick={() => setReportNotificationsOpen(false)} className="text-white/80 hover:text-white text-xl p-1">✕</button>
                        </div>
                      </div>
                      
                      {/* التبويبات */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNotificationTab('unread')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            notificationTab === 'unread' 
                              ? 'bg-white text-blue-700' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {isRtl ? 'غير مقروء' : 'Unread'}
                          {unseenReportsCount > 0 && (
                            <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
                              notificationTab === 'unread' ? 'bg-red-500 text-white' : 'bg-white/30'
                            }`}>
                              {unseenReportsCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setNotificationTab('read')}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            notificationTab === 'read' 
                              ? 'bg-white text-blue-700' 
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          {isRtl ? 'مقروء' : 'Read'}
                          {seenReportsCount > 0 && (
                            <span className={`mr-2 px-2 py-0.5 rounded-full text-xs ${
                              notificationTab === 'read' ? 'bg-gray-500 text-white' : 'bg-white/30'
                            }`}>
                              {seenReportsCount > 20 ? '20+' : seenReportsCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* المحتوى */}
                    <div className="overflow-y-auto max-h-[45vh]">
                      {/* تبويب غير مقروء */}
                      {notificationTab === 'unread' && (
                        <>
                          {unseenReportsCount === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <div className="text-5xl mb-3">✅</div>
                              <p className="font-medium">{isRtl ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</p>
                              <p className="text-sm mt-1">{isRtl ? 'كل شيء محدّث' : 'Everything is up to date'}</p>
                            </div>
                          ) : (
                            <>
                              {unseenReportsByGov.map((govGroup, idx) => (
                                <div key={idx} className="border-b border-gray-100 last:border-0">
                                  <div className="bg-blue-50 px-4 py-2 font-semibold text-blue-800 flex justify-between items-center sticky top-0">
                                    <div className="flex flex-col">
                                      <span className="text-sm">🏛️ {translateBrandingText(govGroup.governorate, isRtl)}</span>
                                      <span className="text-[10px] text-blue-600/70 font-bold leading-none">
                                        {translateBrandingText(govGroup.project, isRtl)?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}
                                      </span>
                                    </div>
                                    <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                      {govGroup.count}
                                    </span>
                                  </div>
                                  {govGroup.reports.slice(0, 5).map((report, rIdx) => (
                                    <div
                                      key={rIdx}
                                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <div 
                                          className="flex-1 min-w-0"
                                          onClick={() => {
                                            markReportAsSeen(report.id, report);
                                            setReportNotificationsOpen(false);
                                            navigate(`/reports?search=${report.report_number}&exact=true&t=${Date.now()}`);
                                          }}
                                        >
                                          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>
                                            <span className="truncate">{isRtl ? 'بلاغ رقم:' : 'Report No:'} {report.report_number}</span>
                                          </p>
                                          <p className="text-xs text-gray-500 mt-1 truncate">
                                            {translateBrandingText(report.report_type, isRtl)} • {translateBrandingText(report.contractor, isRtl)}
                                          </p>
                                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                                            {translateBrandingText(report.project, isRtl)?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}
                                          </p>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            markReportAsSeen(report.id, report);
                                          }}
                                          className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 transition-all whitespace-nowrap flex-shrink-0"
                                          title={isRtl ? 'تحديد كمقروء' : 'Mark as read'}
                                        >
                                          ✓ {isRtl ? 'مقروء' : 'Read'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                  {govGroup.count > 5 && (
                                    <div className="px-4 py-2 text-center text-xs text-blue-600 bg-blue-50/50">
                                      +{govGroup.count - 5} {isRtl ? 'بلاغات أخرى' : 'other reports'}
                                    </div>
                                  )}
                                </div>
                              ))}
                              
                              {/* توصيلات المياه الجديدة */}
                              {unseenWaterConnections.length > 0 && (
                                <div className="border-b border-gray-100">
                                  <div className="bg-cyan-50 px-4 py-2 font-semibold text-cyan-800 flex justify-between items-center sticky top-0">
                                    <span>💧 {isRtl ? 'توصيلات مياه جديدة' : 'New Water Connections'}</span>
                                    <span className="bg-cyan-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                      {unseenWaterConnections.length}
                                    </span>
                                  </div>
                                  {unseenWaterConnections.slice(0, 10).map((c, cIdx) => (
                                    <div key={cIdx} className="px-4 py-3 hover:bg-cyan-50 border-b border-gray-50 last:border-0">
                                      <div className="flex justify-between items-start gap-2">
                                        <div
                                          className="flex-1 min-w-0 cursor-pointer"
                                          onClick={async () => {
                                            try {
                                              const token = localStorage.getItem('token');
                                              await axios.post(`${API}/water-connections/${c.id}/mark-seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                              setUnseenWaterConnections(prev => prev.filter(x => x.id !== c.id));
                                              setUnseenReportsCount(prev => Math.max(0, prev - 1));
                                            } catch(e){}
                                            setReportNotificationsOpen(false);
                                            navigate(`/water-connections`);
                                          }}
                                        >
                                          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse flex-shrink-0"></span>
                                            <span className="truncate">{isRtl ? 'توصيلة مياه جديدة رقم:' : 'New Water Conn No:'} {c.request_number || '—'}</span>
                                          </p>
                                          <p className="text-xs text-gray-700 mt-1 truncate font-semibold">
                                            🏛️ {isRtl ? 'المحافظة:' : 'Gov:'} {translateBrandingText(c.governorate || c.area, isRtl) || (isRtl ? 'غير محدد' : 'Unspecified')}
                                          </p>
                                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                                            📁 {isRtl ? 'المشروع:' : 'Project:'} {translateBrandingText(c.project, isRtl)?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}
                                          </p>
                                        </div>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const token = localStorage.getItem('token');
                                              await axios.post(`${API}/water-connections/${c.id}/mark-seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                              setUnseenWaterConnections(prev => prev.filter(x => x.id !== c.id));
                                              setUnseenReportsCount(prev => Math.max(0, prev - 1));
                                            } catch(err){}
                                          }}
                                          className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 whitespace-nowrap flex-shrink-0"
                                        >
                                          ✓ {isRtl ? 'مقروء' : 'Read'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* توصيلات الصرف الجديدة */}
                              {unseenSewageConnections.length > 0 && (
                                <div className="border-b border-gray-100">
                                  <div className="bg-amber-50 px-4 py-2 font-semibold text-amber-800 flex justify-between items-center sticky top-0">
                                    <span>🚰 {isRtl ? 'توصيلات صرف جديدة' : 'New Sewage Connections'}</span>
                                    <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                      {unseenSewageConnections.length}
                                    </span>
                                  </div>
                                  {unseenSewageConnections.slice(0, 10).map((c, cIdx) => (
                                    <div key={cIdx} className="px-4 py-3 hover:bg-amber-50 border-b border-gray-50 last:border-0">
                                      <div className="flex justify-between items-start gap-2">
                                        <div
                                          className="flex-1 min-w-0 cursor-pointer"
                                          onClick={async () => {
                                            try {
                                              const token = localStorage.getItem('token');
                                              await axios.post(`${API}/sewage-connections/${c.id}/mark-seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                              setUnseenSewageConnections(prev => prev.filter(x => x.id !== c.id));
                                              setUnseenReportsCount(prev => Math.max(0, prev - 1));
                                            } catch(e){}
                                            setReportNotificationsOpen(false);
                                            navigate(`/sewage-connections`);
                                          }}
                                        >
                                          <p className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0"></span>
                                            <span className="truncate">{isRtl ? 'توصيلة صرف جديدة رقم:' : 'New Sewage Conn No:'} {c.request_number || '—'}</span>
                                          </p>
                                          <p className="text-xs text-gray-700 mt-1 truncate font-semibold">
                                            🏛️ {isRtl ? 'المحافظة:' : 'Gov:'} {translateBrandingText(c.governorate || c.area, isRtl) || (isRtl ? 'غير محدد' : 'Unspecified')}
                                          </p>
                                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                                            📁 {isRtl ? 'المشروع:' : 'Project:'} {translateBrandingText(c.project, isRtl)?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}
                                          </p>
                                        </div>
                                        <button
                                          onClick={async (e) => {
                                            e.stopPropagation();
                                            try {
                                              const token = localStorage.getItem('token');
                                              await axios.post(`${API}/sewage-connections/${c.id}/mark-seen`, {}, { headers: { Authorization: `Bearer ${token}` } });
                                              setUnseenSewageConnections(prev => prev.filter(x => x.id !== c.id));
                                              setUnseenReportsCount(prev => Math.max(0, prev - 1));
                                            } catch(err){}
                                          }}
                                          className="text-green-600 hover:text-green-800 text-xs px-2 py-1 rounded bg-green-100 hover:bg-green-200 whitespace-nowrap flex-shrink-0"
                                        >
                                          ✓ {isRtl ? 'مقروء' : 'Read'}
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </>
                      )}
                      
                      {/* تبويب مقروء */}
                      {notificationTab === 'read' && (
                        <>
                          {seenReports.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                              <div className="text-5xl mb-3">📭</div>
                              <p className="font-medium">{isRtl ? 'لا توجد بلاغات مقروءة' : 'No read reports'}</p>
                            </div>
                          ) : (
                            <>
                              {seenReports.map((report, idx) => (
                                <div
                                  key={idx}
                                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div 
                                      className="flex-1 min-w-0"
                                      onClick={() => {
                                        setReportNotificationsOpen(false);
                                        navigate(`/reports?search=${report.report_number}&exact=true&t=${Date.now()}`);
                                      }}
                                    >
                                      <p className="font-medium text-gray-700 text-sm flex items-center gap-2">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></span>
                                        <span className="truncate">{isRtl ? 'بلاغ رقم:' : 'Report No:'} {report.report_number}</span>
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1 truncate">
                                        {translateBrandingText(report.report_type, isRtl)} • {translateBrandingText(report.contractor, isRtl)}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        {translateBrandingText(report.governorate, isRtl)}
                                      </p>
                                    </div>
                                    <div className="flex gap-1 flex-shrink-0">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          markReportAsUnseen(report.id, report);
                                        }}
                                        className="text-orange-600 hover:text-orange-800 text-xs px-2 py-1 rounded bg-orange-100 hover:bg-orange-200 transition-all whitespace-nowrap"
                                        title={isRtl ? 'إرجاع كغير مقروء' : 'Mark as unread'}
                                      >
                                        ↩ {isRtl ? 'غير مقروء' : 'Unread'}
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteReportNotification(report.id);
                                        }}
                                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded bg-red-100 hover:bg-red-200 transition-all whitespace-nowrap"
                                        title={t('common.delete')}
                                      >
                                        🗑️ {t('common.delete')}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Footer */}
                    <div className="sticky bottom-0 bg-gray-50 px-4 py-3 border-t">
                      {notificationTab === 'unread' && unseenReportsCount > 0 && (
                        <div className="flex gap-2">
                          <button
                            onClick={markAllReportsAsSeen}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                          >
                            ✓ {t('common.confirm')}
                          </button>
                          <button
                            onClick={() => {
                              setReportNotificationsOpen(false);
                              navigate('/reports?filter=new');
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                          >
                            {isRtl ? 'عرض الكل' : 'View All'} ({unseenReportsCount})
                          </button>
                        </div>
                      )}
                      {notificationTab === 'read' && seenReports.length > 0 && (
                        <button
                          onClick={clearAllReadNotifications}
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
                        >
                          🗑️ {isRtl ? 'حذف جميع الإشعارات المقروءة' : 'Delete all read notifications'}
                        </button>
                      )}
                    </div>
                  </div>
                  </>
                )}
              </div>
              )}
              
              {/* Profile Picture with Mobile Dropdown */}
              <div className="relative">
                <div 
                  className="cursor-pointer"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  {user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-white shadow-lg hover:border-yellow-300 transition-all"
                      title={translateBrandingText(user.full_name, isRtl) || user.username}
                    />
                  ) : (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-lg sm:text-xl md:text-2xl font-bold border-2 border-white shadow-lg">
                      {translateBrandingText(user.full_name, isRtl)?.charAt(0) || user.username?.charAt(0) || '👤'}
                    </div>
                  )}
                </div>

                {/* Mobile Dropdown for User Info */}
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 md:hidden" 
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className={`md:hidden absolute ${isRtl ? 'left-0' : 'right-0'} top-14 sm:top-16 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 p-3 border border-gray-100 flex flex-col`}>
                      <span className="font-bold text-gray-800 text-sm mb-1 break-words">
                        {translateBrandingText(user.full_name, isRtl)}
                      </span>
                      <span className="text-xs text-gray-500 mb-2">
                        {user.role === 'admin' ? t('header.admin') : translateBrandingText(user.title, isRtl) || user.username}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* User Name - Hidden on small screens */}
              <span className="hidden md:flex text-white font-medium items-center gap-2 text-sm lg:text-base">
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
              
              {/* Admin Badge */}
              {user.role === 'admin' && (
                <span className="hidden sm:inline-block bg-purple-100 text-purple-800 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2.5 py-0.5 rounded">
                  {t('header.admin')}
                </span>
              )}
              

              
              {/* Logout button was moved to the sidebar */}
            </div>
          </div>
        </div>
      </header>

      {/* Global Announcement Banner */}
      {(showDynamicAnnouncement ? showDynamicAnnouncement : branding.show_announcement) && (dynamicAnnouncement ? dynamicAnnouncement : branding.global_announcement) && (
        <div className={`w-full z-40 relative border-b-2 overflow-hidden ${branding.flash_announcement !== false ? 'border-[#b71c1c]' : 'border-red-700 bg-red-600'}`}
             style={branding.flash_announcement !== false ? { animation: 'flashWarning 1s infinite' } : {}}>
          <style>{`
            @keyframes flashWarning { 
              0%, 49% { background-color: #e53935; box-shadow: inset 0 0 15px rgba(0,0,0,0.15); } 
              50%, 100% { background-color: #7f0000; box-shadow: inset 0 0 25px rgba(0,0,0,0.4); } 
            }
            @keyframes marqueeScroll { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }
          `}</style>
          <div className="mx-auto py-3 sm:py-4 flex items-center overflow-hidden w-full relative h-12 sm:h-14">
            <p className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-widest whitespace-nowrap absolute drop-shadow-lg" 
               style={{ animation: 'marqueeScroll 20s linear infinite', left: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)' }}>
              ⚠️ {translateBrandingText(dynamicAnnouncement ? dynamicAnnouncement : branding.global_announcement, isRtl)} ⚠️
            </p>
          </div>
        </div>
      )}

      <div className="flex relative">
        {/* Mobile Sidebar */}
        <div className={`lg:hidden fixed inset-0 z-50 ${sidebarOpen ? 'block' : 'hidden'}`}>
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar Content */}
          <aside className="absolute top-0 right-0 w-72 h-full bg-white shadow-xl overflow-y-auto">
            <div 
              className="flex justify-between items-center p-4 border-b sticky top-0"
              style={{ backgroundColor: getThemeColor('primary') }}
            >
              <h2 className="text-lg font-bold text-white">{t('sidebar.dashboard')}</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-white p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-3 space-y-2 pb-20">
              {/* لوحة التحكم - تظهر فقط لمن لديه صلاحية */}
              {hasPermission('dashboard') && (
                <Link 
                  to="/" 
                  onClick={() => setSidebarOpen(false)} 
                  className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive('/') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                  {t('sidebar.dashboard')}
                </Link>
              )}
              
              {/* قائمة المشاريع - تظهر لمن لديه صلاحية عرض البلاغات أو التوصيلات */}
              {(hasPermission('reports_view') || hasPermission('reports_add') || hasPermission('water_connections') || hasPermission('sewage_connections')) && (
                <div>
                  <button
                    onClick={() => setProjectsOpen(!projectsOpen)}
                    className="w-full block px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 text-right text-sm"
                  >
                    <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    {t('sidebar.projects')}
                    <svg className={`inline-block w-3 h-3 mr-2 transition-transform ${projectsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {projectsOpen && (
                    <div className="mr-3 mt-1 space-y-1">
                      {authorizedProjectsLinks.map(({ project, mobileLinkTo, linkTo }) => {
                        const targetUrl = mobileLinkTo || linkTo || `/reports?project=${encodeURIComponent(project.name)}&reset=true`;
                        // إزالة &t= التي تسبب إعادة تحميل كاملة وذبذبة
                        const cleanUrl = targetUrl.replace(/[&?]t=\d+/g, '');
                        return (
                          <Link 
                            key={project.id || project.name} 
                            to={cleanUrl}
                            onClick={() => {
                              // في الموبايل نغلق السايدبار فقط وليس الدروبداون
                              setSidebarOpen(false);
                              // الدروبداون يبقى مفتوحاً لتسهيل التنقل بين المشاريع
                              // setProjectsOpen stays true
                            }} 
                            className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
                              location.search.includes(encodeURIComponent(project.name))
                                ? 'bg-bg-light text-primary font-bold' 
                                : 'text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            {translateBrandingText(project.name, isRtl)}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* ملاحظات الاستشاري */}
              {hasPermission('consultant_notes') && (
                <Link to="/consultant-notes" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/consultant-notes') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      {t('sidebar.consultantNotes', { defaultValue: 'ملاحظات الاستشاري' })}
                    </div>
                    {pendingConsultantCount > 0 && (
                      <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm min-w-[20px] text-center ml-2">
                        {pendingConsultantCount > 9 ? '9+' : pendingConsultantCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              
              {/* المقاولون */}
              {hasPermission('contractors') && (
                <Link to="/contractors" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/contractors') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {t('sidebar.contractors')}
                </Link>
              )}
              
              {/* تقارير السلامة */}
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
              )}

              {/* تقارير الجودة */}
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
              )}
              
              {/* تقارير الأعمال */}
              {(hasPermission('business_reports') || hasPermission('business_reports_review')) && (
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
              )}
              
              {/* المستخلصات */}
              {hasPermission('extracts') && canViewExtracts() && (
                <Link to="/extracts" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/extracts') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {t('sidebar.extracts')}
                    </div>
                    {/* إشعار المستخلصات الواردة - يظهر فقط للأدمن */}
                    {user.role === 'admin' && pendingExtractsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingExtractsCount > 9 ? '9+' : pendingExtractsCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              
              {/* الفواتير والعهدة */}
              {hasPermission('invoices') && (
                <Link to="/invoices" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/invoices') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>
                      {t('sidebar.invoices')}
                    </div>
                    {pendingInvoicesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingInvoicesCount > 9 ? '9+' : pendingInvoicesCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              
              {/* طلبات الموظفين */}
              {hasPermission('employee_requests') && (
                <Link to="/employee-requests" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/employee-requests') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {t('sidebar.employeeRequests')}
                  </div>
                  <div className="flex gap-1">
                    {pendingRequestsCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                      </span>
                    )}
                    {signedRequestsCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {signedRequestsCount > 9 ? '9+' : signedRequestsCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
              )}
              
              {/* شؤون الموظفين */}
              {(user?.role === 'admin' || hasPermission('hr_management')) && (
                <Link to="/hr-management" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/hr-management') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t('sidebar.hrManagement')}
                </Link>
              )}
              
              {/* فريق العمل - فوق إدارة المستخدمين */}
              {hasPermission('team') && (
                <Link to="/team" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/team') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {t('sidebar.team')}
                </Link>
              )}
              
              {/* سيارات الشركة */}
              {hasPermission('fleet_maintenance') && (
                <Link to="/fleet-maintenance" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive('/fleet-maintenance') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  {t('sidebar.fleet')}
                </Link>
              )}
              
              {/* إدارة المستخدمين */}
              {hasPermission('users_manage') && (
                <Link to="/users" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/users') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  {t('sidebar.users')}
                </Link>
              )}
              
              {/* رسائل الدعم - فوق الإعدادات */}
              {hasPermission('support_messages') && (
                <Link to="/support-messages" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/support-messages') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      {t('sidebar.supportMessages')}
                    </div>
                    {supportMessagesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {supportMessagesCount > 9 ? '9+' : supportMessagesCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              
              {/* الإعدادات */}
              {hasPermission('settings') && (
                <Link to="/settings" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/settings') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {t('sidebar.settings')}
                </Link>
              )}
              
              {/* سلة المحذوفات */}
              {hasPermission('trash') && (
                <Link to="/trash" onClick={() => setSidebarOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm ${isActive('/trash') ? 'active-nav-item' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  {t('sidebar.trash')}
                </Link>
              )}
              
              {/* زر تغيير اللغة */}
              <button
                onClick={toggleLanguage}
                className="w-full text-start px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
              >
                <Globe className="inline-block w-4 h-4 ml-2" />
                <span className="font-bold">{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
              </button>

              {/* زر تسجيل الخروج */}
              <button
                onClick={onLogout}
                className="w-full text-start px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center mt-2 border border-red-100"
              >
                <svg className="inline-block w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-bold">{t('common.logout')}</span>
              </button>
            </nav>
          </aside>
        </div>
        
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:w-64 xl:w-72 glass-sidebar min-h-screen">
          <nav className="p-3 sm:p-4 space-y-2">
            {/* لوحة التحكم - تظهر فقط لمن لديه صلاحية */}
            {hasPermission('dashboard') && (
              <Link
                to="/"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.dashboard')}</span>
              </Link>
            )}
            
            {/* Projects Menu - تظهر لمن لديه صلاحية عرض البلاغات أو التوصيلات */}
            {(hasPermission('reports_view') || hasPermission('reports_add') || hasPermission('water_connections') || hasPermission('sewage_connections')) && (
              <div>
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className="w-full sidebar-item text-gray-700 text-right"
                >
                  <div className="sidebar-icon-box">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <span className="sidebar-text flex-1">{t('sidebar.projects')}</span>
                  <svg className={`w-4 h-4 mr-2 transition-transform ${projectsOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {projectsOpen && (
                  <div className="mr-3 sm:mr-4 mt-1 space-y-1">
                      {authorizedProjectsLinks.map(({ project, linkTo }) => {
                      const cleanUrl = (linkTo || `/reports?project=${encodeURIComponent(project.name)}`).replace(/[&?]t=\d+/g, '');
                      return (
                        <Link key={project.id || project.name} to={cleanUrl}
                          onClick={() => {
                            // الدروبداون يظل مفتوحاً عند التنقل بين المشاريع (لا نغلقه)
                            setSidebarOpen(false);
                          }}
                          className={`block px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm transition-colors ${location.search.includes(encodeURIComponent(project.name)) ? 'bg-bg-light text-primary font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                          <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                          {translateBrandingText(project.name, isRtl)}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            
            {/* ملاحظات الاستشاري */}
            {hasPermission('consultant_notes') && (
              <Link
                to="/consultant-notes"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/consultant-notes') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <span className="sidebar-text">{t('sidebar.consultantNotes', { defaultValue: 'ملاحظات الاستشاري' })}</span>
                  </div>
                  {pendingConsultantCount > 0 && (
                    <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm min-w-[20px] text-center ml-2">
                      {pendingConsultantCount > 9 ? '9+' : pendingConsultantCount}
                    </span>
                  )}
                </div>
              </Link>
            )}
            
            {/* المقاولون */}
            {hasPermission('contractors') && (
              <Link
                to="/contractors"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/contractors') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.contractors')}</span>
              </Link>
            )}
            
            {/* تقارير السلامة */}
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
            )}

            {/* تقارير الجودة */}
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
            )}

            {/* تقارير الأعمال */}
            {(hasPermission('business_reports') || hasPermission('business_reports_review')) && (
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
            )}
            
            {/* المستخلصات */}
            {hasPermission('extracts') && canViewExtracts() && (
              <Link
                to="/extracts"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/extracts') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="sidebar-text">{t('sidebar.extracts')}</span>
                  </div>
                  {user.role === 'admin' && pendingExtractsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {pendingExtractsCount > 9 ? '9+' : pendingExtractsCount}
                    </span>
                  )}
                </div>
              </Link>
            )}
            
            {/* الفواتير والعهدة */}
            {hasPermission('invoices') && (
              <Link
                to="/invoices"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/invoices') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                      </svg>
                    </div>
                    <span className="sidebar-text">{t('sidebar.invoices')}</span>
                  </div>
                  {pendingInvoicesCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {pendingInvoicesCount > 9 ? '9+' : pendingInvoicesCount}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* طلبات الموظفين */}
            {hasPermission('employee_requests') && (
              <Link
                to="/employee-requests"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/employee-requests') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className="sidebar-icon-box">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <span className="sidebar-text">{t('sidebar.employeeRequests')}</span>
                    </div>
                    <div className="flex gap-1">
                      {pendingRequestsCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse" title="طلبات معلقة">
                          {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                        </span>
                      )}
                      {signedRequestsCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse border border-white shadow-sm" title="مستندات موقعة جديدة">
                          {signedRequestsCount > 9 ? '9+' : signedRequestsCount}
                        </span>
                      )}
                    </div>
                  </div>
              </Link>
            )}
            
            {/* شؤون الموظفين */}
            {(user?.role === 'admin' || hasPermission('hr_management')) && (
              <Link
                to="/hr-management"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/hr-management') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.hrManagement')}</span>
              </Link>
            )}
            
            {/* فريق العمل */}
            {hasPermission('team') && (
              <Link
                to="/team"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/team') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.team')}</span>
              </Link>
            )}
            
            {/* سيارات الشركة */}
            {hasPermission('fleet_maintenance') && (
              <Link
                to="/fleet-maintenance"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/fleet-maintenance') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.fleet')}</span>
              </Link>
            )}
            
            {/* إدارة المستخدمين */}
            {hasPermission('users_manage') && (
              <Link
                to="/users"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/users') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.users')}</span>
              </Link>
            )}
            
            {/* رسائل الدعم */}
            {hasPermission('support_messages') && (
              <Link
                to="/support-messages"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/support-messages') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div className="sidebar-icon-box">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="sidebar-text">{t('sidebar.supportMessages')}</span>
                  </div>
                  {supportMessagesCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                      {supportMessagesCount > 9 ? '9+' : supportMessagesCount}
                    </span>
                  )}
                </div>
              </Link>
            )}
            
            {/* الإعدادات */}
            {user && (
              <Link
                to="/settings"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/settings') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.settings')}</span>
              </Link>
            )}
            
            {/* سلة المحذوفات */}
            {hasPermission('trash') && (
              <Link
                to="/trash"
                onClick={() => setSidebarOpen(false)}
                className={`sidebar-item ${isActive('/trash') ? 'sidebar-item-active' : 'text-gray-700'}`}
              >
                <div className="sidebar-icon-box">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <span className="sidebar-text">{t('sidebar.trash')}</span>
              </Link>
            )}
            
            {/* زر تغيير اللغة */}
            <button
              onClick={toggleLanguage}
              className="w-full sidebar-item text-gray-700 hover:bg-gray-50 text-start"
            >
              <div className="sidebar-icon-box">
                <Globe className="w-5 h-5 text-gray-500" />
              </div>
              <span className="sidebar-text flex-1 font-bold">{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* زر تسجيل الخروج */}
            <button
              onClick={onLogout}
              className="w-full sidebar-item text-red-600 hover:bg-red-50 text-start mt-2 border border-red-100"
            >
              <div className="sidebar-icon-box bg-red-100 text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <span className="sidebar-text flex-1 font-bold">{t('common.logout')}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content - Responsive & Fluid */}
        <main className={`flex-1 ${fullWidth ? 'p-0' : 'p-3 sm:p-4 md:p-5 lg:p-6'} w-full min-h-[calc(100vh-200px)] relative overflow-hidden`}>
          
          {/* Occasion Watermark Background */}
          <OccasionWatermark type={branding.occasion_watermark} isRtl={isRtl} occasionsList={branding.occasions_list} />

          <div className="relative z-10 w-full h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Footer - يظهر في جميع الصفحات */}
      <footer 
        className="text-white py-4 sm:py-6 mt-8"
        style={{ background: `linear-gradient(to right, var(--color-primary), var(--color-hover))` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            {/* معلومات المطور */}
            <div className={`text-center ${i18n.language === 'ar' ? 'sm:text-right' : 'sm:text-left'}`}>
              <p className="text-xs sm:text-sm font-medium mb-1">
                {i18n.language === 'ar' ? 'تم إنشاء هذه المنصة بواسطة' : 'This platform was developed by'}
              </p>
              <p className="text-sm sm:text-base font-bold">
                {i18n.language === 'ar' ? 'م/ محمود محمد هارون' : 'Eng. Mahmoud Mohamed Haroun'}
              </p>
              <p className="text-xs sm:text-sm text-blue-200">
                {i18n.language === 'ar' ? 'مهندس نظم المعلومات' : 'Information Systems Engineer'}
              </p>
              <p className="text-xs text-blue-300">
                {i18n.language === 'ar' ? 'عضو بالهيئة الهندسية السعودية (534779)' : 'Member of the Saudi Council of Engineers (534779)'}
              </p>
            </div>

            {/* الشعار أو معلومات إضافية */}
            <div className={`text-center ${i18n.language === 'ar' ? 'sm:text-left' : 'sm:text-right'}`}>
              <p className="text-sm sm:text-base font-bold text-white mb-1">
                {i18n.language === 'ar' 
                  ? '© 2027 نظام إدارة البلاغات المستلمة من WFM' 
                  : '© 2027 WFM Incoming Reports Management System'}
              </p>
              <p className="text-sm font-black text-blue-200">
                {i18n.language === 'ar' 
                  ? 'جميع الحقوق محفوظة' 
                  : 'All Rights Reserved'}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
