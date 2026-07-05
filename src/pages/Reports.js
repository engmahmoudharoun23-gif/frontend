import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { PROJECT_GOVERNORATES as BASE_PROJECT_GOVERNORATES } from '../utils/projectGovernoratesMap';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { resolveImageUrl, isVideo } from '../utils/imageUrl';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useBranding } from '../hooks/useBranding';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// دالة لتحويل التاريخ إلى اسم اليوم بالعربي
const getDayName = (dateString) => {
  const date = new Date(dateString);
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[date.getDay()];
};

const BRANDING_TRANSLATIONS_EN = {
  // General & Company
  'بيت الخبرة': 'Expert House',
  'شركة بيت الخبرة للإستشارات الهندسية': 'Expert House Engineering Consultancy Company',
  'المهندس أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'مدير عام المشاريع': 'General Projects Manager',
  'الأستاذ أحمد حافظ': 'Mr. Ahmed Hafez',
  'منسق المشاريع': 'Projects Coordinator',
  'مكتب بيت الخبرة للاستشارات الهندسية': 'Expert House Engineering Consultancy Office',
  'مكتب بيت الخبرة للإستشارات الهندسية': 'Expert House Engineering Consultancy Office',
  'شركة المياة الوطنية': 'National Water Company',
  'شركة المياه الوطنية': 'National Water Company',
  'نظام إدارة البلاغات والمشاريع - WFM': 'Project and Reports Management System - WFM',
  'نظام إدارة البلاغات المستلمة من WFM': 'Reports Management System Received from WFM',
  'الكل': 'All',
  'جميع المحافظات': 'All Governorates',
  'كل المحافظات': 'All Governorates',
  'جميع محافظات المشروع': 'All Project Governorates',
  'جميع المحافظات المسموح بها': 'All Allowed Governorates',
  'غير محدد': 'Not Specified',
  'غير معروف': 'Unknown',

  // Projects
  'مشروع التشوة البصري': 'Visual Distortion Project',
  'مشروع التشوه البصري': 'Visual Distortion Project',
  'التشوه البصري': 'Visual Distortion',
  'التشوة البصري': 'Visual Distortion',
  'مشروع كشف التسربات وإصلاحها': 'Leak Detection and Repair Project',
  'مشروع كشف التسربات واصلاحها': 'Leak Detection and Repair Project',
  'كشف التسربات وإصلاحها': 'Leak Detection & Repair',
  'مشروع المحافظات الغربية - القطاع الأوسط': 'Western Governorates - Central Sector Project',
  'مشروع المحافظات الغربية -القطاع الأوسط': 'Western Governorates - Central Sector Project',
  'مشروع ايصال مكة': 'Makkah Connection Project',
  'مشروع ايصال الرياض': 'Riyadh Connection Project',
  'ايصال مكة': 'Makkah Connection',
  'ايصال الرياض': 'Riyadh Connection',
  'ايصال': 'Connection',

  // Governorates
  'الدوادمي': 'Dawadmi',
  'شقراء': 'Shaqra',
  'المزاحمية': 'Al-Muzahmiyah',
  'ضرماء': 'Dharma',
  'مرات': 'Marat',
  'ساجر': 'Sajir',
  'القصب': 'Al-Qasab',
  'عفيف': 'Afif',
  'القويعية': 'Al-Quway\'iyah',
  'مكة': 'Makkah',
  'الطائف': 'Taif',
  'الرياض': 'Riyadh',

  // Contractors
  'حسين': 'Hussein',
  'شركة الموسي': 'Al-Mousa Company',
  'جيزة العربية': 'Giza Arabia',
  'الاداء المتوازن': 'Balanced Performance',

  // Users & Supervisors
  'م/ مدحت حسين': 'Eng. Medhat Hussein',
  'م/عبدالمنعم': 'Eng. Abdel Moneim',
  'ابراهيم حسين طائفي': 'Ibrahim Taifi',
  'سعد الدين': 'Saad El-Din',
  'م / محمود محمد هارون': 'Eng. Mahmoud Mohamed Haroun',
  'أ / محمد شوقي': 'Mr. Mohamed Shawky',
  'م/ عبدالحفيظ': 'Eng. Abdel Hafiz',
  ' م / ميهران': 'Eng. Mehran',
  ' م/ أمين مختار': 'Eng. Amin Mokhtar',
  'م/ أمين مختار': 'Eng. Amin Mokhtar',
  'م / ميهران': 'Eng. Mehran',
  'مراقب': 'Supervisor',
  'مراقب الاستشاري': 'Consultant Supervisor',
  'مراقب البلدية': 'Municipality Supervisor',
  'جديد': 'New'
};

const normalizeArabic = (text) => {
  if (!text) return "";
  return text.toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
};

const dynamicTranslationsCache = (() => {
  try {
    const saved = localStorage.getItem('wfm_dynamic_branding_cache');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
})();

const saveDynamicCache = () => {
  try {
    localStorage.setItem('wfm_dynamic_branding_cache', JSON.stringify(dynamicTranslationsCache));
  } catch (e) {
    console.error(e);
  }
};

const localWordsMap = {
  'مهندس': 'Eng.',
  'المهندس': 'Eng.',
  'المهندسة': 'Eng.',
  'استشاري': 'Consultant',
  'الاستشاري': 'Consultant',
  'مدير': 'Manager',
  'عام': 'General',
  'المشاريع': 'Projects',
  'مشروع': 'Project',
  'منسق': 'Coordinator',
  'نظام': 'System',
  'إدارة': 'Management',
  'البلاغات': 'Reports',
  'بيت': 'House',
  'الخبرة': 'Expert',
  'شركة': 'Company',
  'المياه': 'Water',
  'المياة': 'Water',
  'الوطنية': 'National',
  'للإستشارات': 'Consultancy',
  'للاستشارات': 'Consultancy',
  'الهندسية': 'Engineering',
  'أحمد': 'Ahmed',
  'احمد': 'Ahmed',
  'حافظ': 'Hafez',
  'عبيدات': 'Obeidat',
  'محمود': 'Mahmoud',
  'على': 'Ali',
  'علي': 'Ali',
  'محمد': 'Mohamed',
  'خالد': 'Khaled',
  'عبد': 'Abdel',
  'الرحمن': 'Rahman',
  'الله': 'Allah',
  'حسن': 'Hassan',
  'حسين': 'Hussein',
  'مكتب': 'Office',
  'شريك': 'Success',
  'النجاح': 'Partner',
  'مراقب': 'Supervisor',
  'التشوه': 'Visual Distortion',
  'التشوة': 'Visual Distortion',
  'البصري': '',
  'شقراء': 'Shaqra',
  'مرات': 'Marat',
  'ساجر': 'Sajir',
  'الدوادمي': 'Dawadmi',
  'عفيف': 'Afif',
  'القويعية': 'Quway\'iyah',
  'القصب': 'Al-Qasab',
  'المزاحمية': 'Muzahmiyah',
  'ضرماء': 'Dharma',
  'مكة': 'Makkah',
  'الطائف': 'Taif'
};

const translateLocalSmart = (text) => {
  if (!text) return "";
  let cleaned = text.toString().replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  let words = cleaned.split(' ');
  let translatedWords = words.map(word => {
    const normalized = word.replace(/[أإآ]/g, 'ا').replace(/ة$/g, 'ه').replace(/ى$/g, 'ي');
    if (localWordsMap[word]) return localWordsMap[word];
    if (localWordsMap[normalized]) return localWordsMap[normalized];
    return word;
  });
  return translatedWords.join(' ');
};

const pendingTranslations = new Set();

const triggerAsyncTranslation = (text) => {
  if (!text || pendingTranslations.has(text) || dynamicTranslationsCache[text]) return;
  pendingTranslations.add(text);
  
  fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`)
    .then(res => res.json())
    .then(data => {
      let trans = data?.responseData?.translatedText || data?.matches?.[0]?.translation;
      if (trans && trans !== text) {
        trans = trans.replace(/\bEngineer\b/gi, 'Eng.').replace(/\bOffice\b/gi, 'Office');
        dynamicTranslationsCache[text] = trans;
        saveDynamicCache();
        const event = new CustomEvent('wfm_translation_updated', { detail: { text, trans } });
        window.dispatchEvent(event);
      }
    })
    .catch(err => {
      console.warn('Dynamic translation failed:', text, err);
    })
    .finally(() => {
      pendingTranslations.delete(text);
    });
};

const translateBrandingText = (text, isRtl) => {
  if (isRtl || !text) return text;
  const trimmed = text.toString().trim();
  
  // 1. Try direct exact match
  if (BRANDING_TRANSLATIONS_EN[trimmed]) return BRANDING_TRANSLATIONS_EN[trimmed];
  
  // 2. Try match using normalized keys
  const normInput = normalizeArabic(trimmed);
  const matchedKey = Object.keys(BRANDING_TRANSLATIONS_EN).find(key => {
    return normalizeArabic(key) === normInput;
  });
  if (matchedKey) return BRANDING_TRANSLATIONS_EN[matchedKey];
  
  // 3. Check dynamic translations cache
  if (dynamicTranslationsCache[trimmed]) return dynamicTranslationsCache[trimmed];
  if (dynamicTranslationsCache[normInput]) return dynamicTranslationsCache[normInput];
  
  // 4. Fallback to smart local rules
  const localSmart = translateLocalSmart(trimmed);
  
  // 5. Trigger asynchronous fetch to MyMemory API to update cache in background
  triggerAsyncTranslation(trimmed);
  
  return localSmart || trimmed;
};

function Reports({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();

  
  // دالة التحقق من الصلاحية (تدعم الصلاحيات لكل مشروع)
  const hasPermission = (permKey) => {
    if (user.role === 'admin') return true;
    // صلاحيات مرتبطة بالمشروع: نستخدم per-project إذا كان المشروع محدداً
    const PROJECT_SCOPED = ['reports_view','reports_add','reports_edit','reports_delete','reports_review','reports_import','reports_notifications','consultant_notes','owner_notes'];
    if (PROJECT_SCOPED.includes(permKey) && currentProject) {
      const pp = user.project_permissions || {};
      const projSpecific = pp[currentProject] || [];
      if (projSpecific.length > 0) {
        return projSpecific.includes(permKey);
      }
    }
    // فحص الصلاحيات العامة
    if ((user.permissions || []).includes(permKey)) return true;
    // fallback: إذا كانت صلاحية مرتبطة بمشروع والمستخدم يملكها لأي مشروع → نعتبره مخوّلاً (الزر يظهر)
    if (PROJECT_SCOPED.includes(permKey)) {
      const pp = user.project_permissions || {};
      return Object.values(pp).some(perms => (perms || []).includes(permKey));
    }
    return false;
  };

  const hasReportPermission = (report, permKey) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    if (report && report.project) {
      const pp = user.project_permissions || {};
      const projSpecific = pp[report.project] || [];
      if (projSpecific.length > 0) {
        return projSpecific.includes(permKey);
      }
    }
    return (user.permissions || []).includes(permKey);
  };
  const getInitialReports = () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const project = searchParams.get('project') || '';
      if (project) {
        const cached = localStorage.getItem(`reports_cache_${project}`);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  };

  const [reports, setReports] = useState(getInitialReports);
  const [loading, setLoading] = useState(false);
  const [PROJECT_GOVERNORATES, setProjectGovernorates] = useState(BASE_PROJECT_GOVERNORATES);
  
  // URL Params & Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const currentProject = searchParams.get('project') || '';
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [reportsPerPage, setReportsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);
  const [totalReports, setTotalReports] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [urlFiltersApplied, setUrlFiltersApplied] = useState(false);
  const [filters, setFilters] = useState({ 
    search: searchParams.get('search') || '', 
    license_number: '', 
    project: searchParams.get('project') || '', 
    governorate: searchParams.get('governorate') || '', 
    contractor: '',
    report_type: '', 
    status: '',
    license_status: searchParams.get('license_status') || '',  // فلتر جديد للرخص
    my_reports: false,   // فلتر بلاغاتي
    created_by: '',       // فلتر حسب المستخدم
    date: '',            // تاريخ الاستلام
    start_date: '',      // تاريخ المباشرة
    exact: searchParams.get('exact') === 'true' // فلتر للبحث الدقيق
  });
  const [myReportsCount, setMyReportsCount] = useState(0);  // عدد بلاغاتي
  const [level3Users, setLevel3Users] = useState([]);  // قائمة مستخدمي المستوى 3
  const [contractors, setContractors] = useState([]);
  const [loadingImages, setLoadingImages] = useState({});  // تتبع الصور قيد التحميل
  const [reportImages, setReportImages] = useState({});     // تخزين الصور المحملة
  const [selectedReports, setSelectedReports] = useState([]);  // البلاغات المحددة للتصدير
  const [isAllSelected, setIsAllSelected] = useState(false);   // علامة لتحديد جميع البلاغات
  const [showNotesModal, setShowNotesModal] = useState(false);  // عرض modal الملاحظات
  const [currentNotes, setCurrentNotes] = useState('');
  const [showConsultantNoteModal, setShowConsultantNoteModal] = useState(false);
  const [currentConsultantNote, setCurrentConsultantNote] = useState('');
  const [consultantReplyText, setConsultantReplyText] = useState('');
  const [showConsultantReplyBox, setShowConsultantReplyBox] = useState(false);
  const [selectedConsultantReportId, setSelectedConsultantReportId] = useState(null);
  const [editingBubbleIndex, setEditingBubbleIndex] = useState(null);
  const [editingBubbleText, setEditingBubbleText] = useState('');
  const [activeBubbleDropdown, setActiveBubbleDropdown] = useState(null);
  const [isSavingConsultantNote, setIsSavingConsultantNote] = useState(false);

  // Owner Notes State
  const [showOwnerNoteModal, setShowOwnerNoteModal] = useState(false);
  const [currentOwnerNote, setCurrentOwnerNote] = useState('');
  const [selectedOwnerReportId, setSelectedOwnerReportId] = useState(null);
  const [isSavingOwnerNote, setIsSavingOwnerNote] = useState(false);

         // الملاحظة الحالية
  const [availableProjects, setAvailableProjects] = useState([]); // المشاريع من قاعدة البيانات
  const [reportTypes, setReportTypes] = useState([]); // أنواع البلاغات الديناميكية
  const [dynamicStatuses, setDynamicStatuses] = useState([]); // حالات البلاغات الديناميكية
  const [exportDynamicStatuses, setExportDynamicStatuses] = useState([]); // حالات التصدير الديناميكية
  const [isNewReportsFilter, setIsNewReportsFilter] = useState(false); // فلتر البلاغات الجديدة
  const [activeDropdown, setActiveDropdown] = useState(null); // التحكم في الدروب بوكس للإجراءات
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, right: 0 }); // موقع القائمة المنسدلة الثابت
  
  const isAdmin = user.role === 'admin';
  
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleTranslationUpdated = () => {
      forceUpdate(prev => prev + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdated);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdated);
  }, []);
  
  // جلب حالات البلاغ الديناميكية للمشروع (الفلاتر الرئيسية)
  useEffect(() => {
    const fetchDynamicStatuses = async () => {
      const projectToFetch = filters.project || currentProject || (user.role !== 'admin' ? (user.projects?.[0] || '') : '');
      if (!projectToFetch) {
        setDynamicStatuses([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/report-statuses?project=${encodeURIComponent(projectToFetch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDynamicStatuses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch dynamic statuses:', error);
        setDynamicStatuses([]);
      }
    };
    fetchDynamicStatuses();
  }, [filters.project, currentProject]);
  
  // إغلاق القائمة المنسدلة عند الضغط خارجها أو التمرير
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    const handleScroll = (e) => {
      if (!activeDropdown) return;
      
      // If e.target is an Element, we can check if the scroll was inside the dropdown
      if (e.target && typeof e.target.closest === 'function') {
        if (!e.target.closest('.dropdown-container')) {
          setActiveDropdown(null);
        }
      } else {
        // If scrolling the document or window itself, just close it
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeDropdown]);
  
  // تم نقل حالة الترقيم للأعلى
  
  // قراءة المشروع وحالة المراجعة والمحافظة من URL عند التحميل أو تغيير URL
  // تطبيق الفلاتر من URL (للإشعارات)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectFromUrl = searchParams.get('project');
    const reviewStatusFromUrl = searchParams.get('review_status');
    const licenseStatusFromUrl = searchParams.get('license_status');
    const governorateFromUrl = searchParams.get('governorate');
    const filterNew = searchParams.get('filter');
    const searchQuery = searchParams.get('search');
    
    // إذا كان الفلتر للبلاغات الجديدة
    if (filterNew === 'new') {
      setIsNewReportsFilter(true);
      setFilters(prev => ({ ...prev, search: '', license_number: '' }));
      setUrlFiltersApplied(true);
      return;
    } else {
      setIsNewReportsFilter(false);
    }
    
    // إذا كان هناك بحث من URL (من الإشعارات)
    if (searchQuery) {
      const isExactSearch = searchParams.get('exact') === 'true';
      const pageFromUrl = parseInt(searchParams.get('page')) || 1;
      setFilters(prev => ({ ...prev, search: searchQuery, exact: isExactSearch }));
      setCurrentPage(pageFromUrl);
      setUrlFiltersApplied(true);
      
      // تنفيذ البحث مباشرة
      const fetchWithSearch = async () => {
        try {
          setLoading(true);
          const params = new URLSearchParams();
          params.append('search', searchQuery.trim());
          params.append('page', pageFromUrl);
          params.append('limit', reportsPerPage);
          if (isExactSearch) {
            params.append('exact', 'true');
          }
          
          const proj = projectFromUrl || filters.project || currentProject;
          if (proj) params.append('project', proj);
          
          const gov = governorateFromUrl || filters.governorate;
          if (gov) params.append('governorate', gov);
          
          const lic = licenseStatusFromUrl || filters.license_status;
          if (lic) params.append('license_status', lic);
          
          const response = await axios.get(`${API}/reports?${params}`);
          const fetchedReports = response.data.reports || [];
          setReports(fetchedReports);
          setTotalReports(response.data.total_count || 0);
          setTotalPages(response.data.total_pages || 0);
          if (searchParams.get('scroll') === 'true') {
            setTimeout(() => {
            const tableSection = document.getElementById('reports-table-section');
            if (tableSection) {
              const y = tableSection.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 300);
          }
        } catch (error) {
          console.error('Failed to fetch reports with search:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchWithSearch();
      return;
    }
    
    // إذا كان هناك فلاتر من URL (إضافة projectFromUrl للشرط)
    if (reviewStatusFromUrl || licenseStatusFromUrl || governorateFromUrl || projectFromUrl) {
      let newLicenseStatus = '';
      
      // أولاً: تحقق من license_status مباشرة
      if (licenseStatusFromUrl) {
        newLicenseStatus = licenseStatusFromUrl;
      }
      // ثانياً: تحقق من review_status (للتوافق القديم)
      else if (reviewStatusFromUrl) {
        const decodedStatus = decodeURIComponent(reviewStatusFromUrl);
        if (decodedStatus.includes('بانتظار') || decodedStatus.includes('المراجعة')) {
          newLicenseStatus = 'review_pending';
        }
      }
      
      const isReset = searchParams.get('reset') === 'true';
      const projectChanged = (projectFromUrl && projectFromUrl !== filters.project) || isReset;

      // تحديث الفلاتر وعلامة التطبيق
      const newFilters = projectChanged ? {
        search: '', 
        license_number: '', 
        project: projectFromUrl || filters.project, 
        governorate: governorateFromUrl || '', 
        contractor: '',
        report_type: '', 
        status: '',
        license_status: newLicenseStatus || '',
        my_reports: false,
        created_by: searchParams.get('created_by') || '',
        exact: false,
        date_from: searchParams.get('date_from') || '',
        date_to: searchParams.get('date_to') || '',
        start_date_from: searchParams.get('start_date_from') || '',
        start_date_to: searchParams.get('start_date_to') || ''
      } : {
        ...filters,
        search: searchQuery || '',
        license_number: searchParams.get('license_number') || '',
        governorate: governorateFromUrl || filters.governorate,
        license_status: newLicenseStatus || filters.license_status,
        project: projectFromUrl || filters.project,
        created_by: searchParams.get('created_by') || filters.created_by,
        date_from: searchParams.get('date_from') || filters.date_from,
        date_to: searchParams.get('date_to') || filters.date_to,
        start_date_from: searchParams.get('start_date_from') || filters.start_date_from,
        start_date_to: searchParams.get('start_date_to') || filters.start_date_to
      };
      
      setFilters(newFilters);
      
      setExportFilters(prev => projectChanged ? {
        project: projectFromUrl || filters.project,
        governorate: governorateFromUrl || '',
        contractor: '',
        report_type: '',
        status: '',
        license_status: newLicenseStatus || '',
        date_from: searchParams.get('date_from') || '',
        date_to: searchParams.get('date_to') || '',
        start_date_from: searchParams.get('start_date_from') || '',
        start_date_to: searchParams.get('start_date_to') || '',
        created_by: ''
      } : { 
        ...prev, 
        project: projectFromUrl || prev.project, 
        governorate: governorateFromUrl || prev.governorate,
        license_status: newLicenseStatus || prev.license_status,
        date_from: searchParams.get('date_from') || prev.date_from,
        date_to: searchParams.get('date_to') || prev.date_to,
        start_date_from: searchParams.get('start_date_from') || prev.start_date_from,
        start_date_to: searchParams.get('start_date_to') || prev.start_date_to
      });
      
      if (projectChanged) {
        if (projectFromUrl) {
          try {
            const cached = localStorage.getItem(`reports_cache_${projectFromUrl}`);
            if (cached) {
              setReports(JSON.parse(cached));
              setLoading(false);
            } else {
              setLoading(true);
            }
          } catch (e) {}
        }
        setExportCount(null);
      }
      
      const pageFromUrl = parseInt(searchParams.get('page')) || 1;
      setCurrentPage(pageFromUrl);
      setUrlFiltersApplied(true);
      
      // جلب البلاغات مباشرة بالفلاتر الجديدة
      const fetchWithUrlFilters = async () => {
        try {
          const params = new URLSearchParams();
          Object.entries(newFilters).forEach(([key, value]) => { if (value) params.append(key, value); });
          params.append('page', pageFromUrl);
          params.append('limit', reportsPerPage);
          
          const response = await axios.get(`${API}/reports?${params}`);
          const fetchedReports = response.data.reports || [];
          setReports(fetchedReports);
          
          if (pageFromUrl === 1 && projectFromUrl) {
            try {
              localStorage.setItem(`reports_cache_${projectFromUrl}`, JSON.stringify(fetchedReports));
            } catch (e) {}
          }
          
          setTotalReports(response.data.total_count || 0);
          setTotalPages(response.data.total_pages || 0);
          if (searchParams.get('scroll') === 'true') {
            setTimeout(() => {
            const tableSection = document.getElementById('reports-table-section');
            if (tableSection) {
              const y = tableSection.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 300);
          }
        } catch (error) {
          console.error('Failed to fetch reports with URL filters:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchWithUrlFilters();
    } else {
      setUrlFiltersApplied(true);
    }
  }, [location.search]);
  
  // جلب المحافظات من الـ API
  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const response = await axios.get(`${API}/project-governorates`);
        setProjectGovernorates(response.data);
      } catch (error) {
        console.error('Failed to fetch governorates:', error);
      }
    };
    fetchGovernorates();
  }, []);
  
  // جلب المشاريع من قاعدة البيانات
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects`);
        const defaultOrder = [
          'ايصال',
          'ايصال الرياض',
          'مشروع كشف التسربات وإصلاحها',
          'مشروع المحافظات الغربية -القطاع الأوسط'
        ];
        let projects = response.data.map(p => p.name);
        if (!isAdmin && user.projects?.length > 0) {
          /* removed redundant filter */
        }
        projects.sort((a, b) => {
          const iA = defaultOrder.indexOf(a), iB = defaultOrder.indexOf(b);
          if (iA !== -1 && iB !== -1) return iA - iB;
          if (iA !== -1) return -1;
          if (iB !== -1) return 1;
          return a.localeCompare(b, 'ar');
        });
        setAvailableProjects(projects);
        
        // جلب أنواع البلاغات لجميع المشاريع
        fetchReportTypes(projects);
      } catch (error) {
        setAvailableProjects(user.projects || []);
      }
    };
    fetchProjects();
  }, [isAdmin, user.projects]);

  // جلب أنواع البلاغات من جميع المشاريع
  const fetchReportTypes = async (projects) => {
    try {
      const token = localStorage.getItem('token');
      const allTypes = new Set();
      
      for (const project of projects) {
        const res = await axios.get(`${API}/report-types?project=${encodeURIComponent(project)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        res.data.forEach(t => allTypes.add(t.name));
      }
      
      setReportTypes([...allTypes]);
    } catch (error) {
      setReportTypes(['ترابي', 'بلاط', 'أسفلت']);
    }
  };
  
  // حساب المحافظات المتاحة حسب صلاحيات المستخدم
  const getAvailableGovernorates = () => {
    // المستوى الثالث (لديه محافظات محددة) - يرى محافظاته فقط
    if (user.governorates && user.governorates.length > 0) {
      if (filters.project && PROJECT_GOVERNORATES[filters.project]) {
        const projectGovs = PROJECT_GOVERNORATES[filters.project];
        return user.governorates.filter(gov => projectGovs.includes(gov));
      }
      return user.governorates;
    }
    
    // المستوى الثاني أو Admin (ليس لديه محافظات محددة)
    // إذا كان هناك مشروع محدد في الفلتر
    if (filters.project && PROJECT_GOVERNORATES[filters.project]) {
      return PROJECT_GOVERNORATES[filters.project];
    }
    
    // إذا كان المستخدم له مشاريع محددة - جمع محافظات مشاريعه
    if (user.projects && user.projects.length > 0) {
      const govs = [];
      user.projects.forEach(project => {
        if (PROJECT_GOVERNORATES[project]) {
          govs.push(...PROJECT_GOVERNORATES[project]);
        }
      });
      return [...new Set(govs)]; // إزالة التكرار
    }
    
    // افتراضياً (Admin بدون مشاريع) - {t('reports.allGovernorates')}
    return [...new Set(Object.values(PROJECT_GOVERNORATES).flat())];
  };

  // حساب المحافظات المتاحة لقسم التصدير بناءً على المشروع المحدد
  const getExportGovernorates = () => {
    // المستوى الثالث (لديه محافظات محددة) - يرى محافظاته فقط
    if (user.governorates && user.governorates.length > 0) {
      // إذا تم اختيار مشروع، فلتر المحافظات حسب المشروع
      if (exportFilters.project && PROJECT_GOVERNORATES[exportFilters.project]) {
        const projectGovs = PROJECT_GOVERNORATES[exportFilters.project];
        return user.governorates.filter(gov => projectGovs.includes(gov));
      }
      return user.governorates;
    }
    
    // إذا تم اختيار مشروع محدد في فلاتر التصدير
    if (exportFilters.project && PROJECT_GOVERNORATES[exportFilters.project]) {
      return PROJECT_GOVERNORATES[exportFilters.project];
    }
    
    // إذا كان المستخدم له مشاريع محددة - جمع محافظات مشاريعه
    if (user.projects && user.projects.length > 0) {
      const govs = [];
      user.projects.forEach(project => {
        if (PROJECT_GOVERNORATES[project]) {
          govs.push(...PROJECT_GOVERNORATES[project]);
        }
      });
      return [...new Set(govs)]; // إزالة التكرار
    }
    
    // افتراضياً (Admin بدون مشاريع) - جميع المحافظات
    return [...new Set(Object.values(PROJECT_GOVERNORATES).flat())];
  };
  // حقول التصدير منفصلة
  const [exportFilters, setExportFilters] = useState({
    project: searchParams.get('project') || '',  // إضافة فلتر المشروع
    governorate: searchParams.get('governorate') || '',
    contractor: '',
    report_type: '',
    status: '',
    license_status: '',
    date_from: '',
    date_to: '',
    start_date_from: '',
    start_date_to: '',
    created_by: searchParams.get('created_by') || ''  // فلتر المستخدم
  });
  const [exportCount, setExportCount] = useState(null);

  // جلب حالات البلاغ الديناميكية للمشروع (فلاتر التصدير)
  useEffect(() => {
    const fetchExportDynamicStatuses = async () => {
      const projectToFetch = exportFilters.project || (user.role !== 'admin' ? (user.projects?.[0] || '') : '');
      if (!projectToFetch) {
        setExportDynamicStatuses([]);
        return;
      }
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/report-statuses?project=${encodeURIComponent(projectToFetch)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExportDynamicStatuses(response.data || []);
      } catch (error) {
        console.error('Failed to fetch export dynamic statuses:', error);
        setExportDynamicStatuses([]);
      }
    };
    fetchExportDynamicStatuses();
  }, [exportFilters.project]);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedReportForMedia, setSelectedReportForMedia] = useState(null);
  const [selectedForDownload, setSelectedForDownload] = useState([]);
  const [fullscreenImage, setFullscreenImage] = useState(null); // الصورة المكبرة
  const [last24HoursCounts, setLast24HoursCounts] = useState({});

  useEffect(() => {
    if (!urlFiltersApplied) return;
    fetchReports();
    // fetchLast24HoursCounts(); // تم تعطيله لتحسين الأداء
    fetchContractors();
  }, [currentPage, reportsPerPage, filters.project, filters.license_status, filters.governorate, isNewReportsFilter, urlFiltersApplied]);
  
  // جلب قائمة المستخدمين والعدد مرة واحدة عند التحميل
  useEffect(() => {
    const fetchLevel3Users = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        const activeProject = exportFilters.project || filters.project;
        const activeGovernorate = exportFilters.governorate || filters.governorate;
        
        if (activeProject) params.append('project', activeProject);
        if (activeGovernorate) params.append('governorate', activeGovernorate);
        
        const response = await axios.get(`${API}/users/level3?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const users = response.data.users || [];
        setLevel3Users(users);
      } catch (error) {
        console.error('Error fetching level3 users:', error);
      }
    };
    fetchLevel3Users();
    
    const fetchMyReportsCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/reports/my-count`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMyReportsCount(response.data.count || 0);
      } catch (error) {
        console.error('Error fetching my reports count:', error);
      }
    };
    
    fetchLevel3Users();
    fetchMyReportsCount();
  }, [exportFilters.project, exportFilters.governorate, filters.project, filters.governorate]);
  
  const fetchContractors = async () => {
    try {
      const token = localStorage.getItem('token');
      let url;
      
      // إذا تم اختيار مشروع في الفلتر، عرض مقاوليه فقط (للجميع بما فيهم الأدمن)
      if (filters.project) {
        url = `${API}/contractors?project=${encodeURIComponent(filters.project)}`;
      } else if (user.role === 'admin') {
        // الأدمن يرى جميع المقاولين فقط إذا لم يتم اختيار مشروع
        url = `${API}/contractors?all_contractors=true`;
      } else {
        // للمستخدمين العاديين، استخدام أول مشروع لديهم كافتراضي
        url = `${API}/contractors?project=${encodeURIComponent(user.projects?.[0] || '')}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContractors(response.data);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  };

  const fetchLast24HoursCounts = async () => {
    // تم تعطيل هذا الطلب لتحسين الأداء
    // try {
    //   const response = await axios.get(`${API}/reports/last-24-hours`);
    //   setLast24HoursCounts(response.data);
    // } catch (error) {
    //   console.error('Error fetching 24 hours counts:', error);
    // }
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit);
    if (!newParams.has('project') && currentProject) {
      newParams.set('project', currentProject);
    }
    newParams.set('page', 1);
    newParams.set('scroll', 'true');
    setSearchParams(newParams);
    setReportsPerPage(newLimit);
    setCurrentPage(1);
  };

  


  const handleSaveOwnerNote = async () => {
    if (!currentOwnerNote.trim()) return;
    setIsSavingOwnerNote(true);
    try {
      const token = localStorage.getItem('token');
      const r = reports.find(rep => rep.id === selectedOwnerReportId);
      if (!r) return;
      const userName = user?.full_name || user?.username || '';
      const prefix = `ملاحظه عن بلاغ رقم ${r.report_number || ''} من المالك ${userName}:\n`;
      const finalNote = r.notes ? `${r.notes}\n\n${prefix}${currentOwnerNote}` : `${prefix}${currentOwnerNote}`;
      
      const response = await axios.put(`${API}/reports/${selectedOwnerReportId}/report-note`, 
        { notes: finalNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setReports(reports.map(rep => 
          rep.id === selectedOwnerReportId ? { ...rep, notes: finalNote } : rep
        ));
        toast.success(t('ownerNoteModal.saveSuccess', { defaultValue: 'تم إضافة ملاحظة المالك بنجاح' }));
        setShowOwnerNoteModal(false);
        setCurrentOwnerNote('');
      }
    } catch (error) {
      console.error('Error saving owner note:', error);
      toast.error(t('ownerNoteModal.saveError', { defaultValue: 'حدث خطأ أثناء حفظ ملاحظة المالك' }));
    } finally {
      setIsSavingOwnerNote(false);
    }
  };

  const handleSaveConsultantNote = async () => {
    if (!selectedConsultantReportId) return;
    setIsSavingConsultantNote(true);
    
    let finalNote = currentConsultantNote;
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/reports/${selectedConsultantReportId}/consultant_note`, {
        consultant_note: finalNote
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let finalReplyStr = reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_reply || '';
      let finalRepliedBy = reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_replied_by || '';
      
      if (showConsultantReplyBox && consultantReplyText.trim()) {
        const authorName = user?.full_name || user?.username || t('consultantNoteModal.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
        const newBubble = `---رد: ---\n${consultantReplyText}`;
        finalReplyStr = finalReplyStr ? `${finalReplyStr}\n\n${newBubble}` : newBubble;
        finalRepliedBy = authorName;
        
        const replyResponse = await axios.put(`${API}/reports/${selectedConsultantReportId}/consultant_note_reply`, { reply: finalReplyStr }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (replyResponse.data.success) {
          finalReplyStr = replyResponse.data.reply;
          finalRepliedBy = replyResponse.data.replied_by;
        }
      }
      
      setReports(reports.map(r => {
        if (r.id === selectedConsultantReportId) {
          const updatedReport = { ...r, consultant_note: finalNote };
          if (showConsultantReplyBox && consultantReplyText.trim()) {
            updatedReport.consultant_note_reply = finalReplyStr;
            updatedReport.consultant_note_replied_by = finalRepliedBy;
          }
          if (r.consultant_note !== finalNote || (showConsultantReplyBox && consultantReplyText.trim())) {
            updatedReport.consultant_note_processed = false;
          }
          return updatedReport;
        }
        return r;
      }));
      
      toast.success(t('consultantNoteModal.saveSuccess', { defaultValue: 'تم الحفظ بنجاح' }));
      setShowConsultantNoteModal(false);
    } catch (error) {
      console.error('Error saving consultant note:', error);
      toast.error(t('consultantNoteModal.saveError', { defaultValue: 'حدث خطأ' }));
    } finally {
      setIsSavingConsultantNote(false);
    }
  };

  const handlePermanentDeleteNote = async () => {
    if (!selectedConsultantReportId) return;
    if (!window.confirm(t('consultantNoteModal.confirmDeleteNote', { defaultValue: 'هل أنت متأكد من الحذف النهائي للملاحظة والردود؟' }))) return;
    
    setIsSavingConsultantNote(true);
    try {
      await axios.delete(`${API}/reports/${selectedConsultantReportId}/consultant_note`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setReports(reports.map(r => {
        if (r.id === selectedConsultantReportId) {
          return {
            ...r,
            consultant_note: '',
            consultant_note_by: '',
            consultant_note_reply: '',
            consultant_note_replied_by: '',
            consultant_note_processed: false
          };
        }
        return r;
      }));
      
      setCurrentConsultantNote('');
      toast.success(t('consultantNoteModal.deleteNoteSuccess', { defaultValue: 'تم الحذف النهائي بنجاح' }));
      setShowConsultantNoteModal(false);
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(t('consultantNoteModal.deleteNoteError', { defaultValue: 'حدث خطأ أثناء الحذف' }));
    } finally {
      setIsSavingConsultantNote(false);
    }
  };

  const handleToggleProcess = async () => {
    if (!selectedConsultantReportId) return;
    try {
      const response = await axios.put(`${API}/reports/${selectedConsultantReportId}/consultant_note_processed`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === selectedConsultantReportId ? { ...r, consultant_note_processed: response.data.consultant_note_processed } : r
        ));
        toast.success(response.data.consultant_note_processed 
          ? t('consultantNotesPage.processSuccess', { defaultValue: 'تمت المعالجة بنجاح' }) 
          : t('consultantNotesPage.processCanceled', { defaultValue: 'تم إلغاء المعالجة' }));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(t('consultantNotesPage.processError', { defaultValue: 'حدث خطأ أثناء تغيير الحالة' }));
    }
  };

  const updateConsultantReplyString = async (newReplyStr) => {
    setIsSavingConsultantNote(true);
    try {
      const response = await axios.put(`${API}/reports/${selectedConsultantReportId}/consultant_note_reply`, { reply: newReplyStr }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === selectedConsultantReportId 
            ? { ...r, consultant_note_reply: response.data.reply, consultant_note_replied_by: response.data.replied_by, consultant_note_processed: false } 
            : r
        ));
        toast.success(t('consultantNoteModal.replySuccess', { defaultValue: 'تم التحديث بنجاح' }));
        setEditingBubbleIndex(null);
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error(t('consultantNoteModal.replyError', { defaultValue: 'حدث خطأ أثناء التحديث' }));
    } finally {
      setIsSavingConsultantNote(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!selectedConsultantReportId) return;
    if (!window.confirm('هل أنت متأكد من حذف رد المستوى الثالث؟')) return;
    try {
      const response = await axios.put(`${API}/reports/${selectedConsultantReportId}/consultant_note_reply`, { reply: '' }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === selectedConsultantReportId 
            ? { ...r, consultant_note_reply: '', consultant_note_replied_by: '', consultant_note_processed: false } 
            : r
        ));
        toast.success('تم حذف الرد بنجاح');
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error('حدث خطأ أثناء حذف الرد');
    }
  };

const fetchReports = async () => {
    setLoading(true);
    
    // إعادة تعيين التحديد عند جلب بلاغات جديدة
    setSelectedReports([]);
    setIsAllSelected(false);
    
    try {
      const params = new URLSearchParams();
      
      const isSearchActive = filters.search && filters.search.trim() !== '';
      
      if (isSearchActive) {
          // محرك البحث العملاق: نتجاهل الفلاتر المقيدة (مثل الحالة، قيد المراجعة، البلاغات الجديدة) 
          // لكي نبحث في كامل المشروع عن البلاغ المطلوب
          params.append('search', filters.search.trim());
          if (filters.project) params.append('project', filters.project);
          if (filters.governorate) params.append('governorate', filters.governorate);
          if (filters.exact) params.append('exact', 'true');
          // لا نضيف أي فلاتر أخرى تعيق البحث
      } else if (isNewReportsFilter) {
          params.append('unseen_only', 'true');
          if (filters.project) params.append('project', filters.project);
      } else {
          Object.entries(filters).forEach(([key, value]) => { 
            if (value) {
              if (key === 'date' || key === 'start_date') {
                // Deprecated
              } else {
                params.append(key, typeof value === 'string' ? value.trim() : value);
              }
            } 
          });
      }
      
      // إضافة معاملات الترقيم
      params.append('page', currentPage);
      params.append('limit', reportsPerPage);
      
      const response = await axios.get(`${API}/reports?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const fetchedReports = response.data.reports || [];
      
      // خوارزمية فرز ذكية لصفحة "قيد المراجعة" 
      // تضع البلاغات المكتملة "تم الاصلاح" في صدارة القائمة دائماً لتسهيل مراجعتها
      const isPendingReviewView = isNewReportsFilter || searchParams.get('review_status') === 'review_pending' || searchParams.get('review_status') === 'قيد المراجعة' || filters.review_status === 'review_pending' || searchParams.get('license_status') === 'review_pending' || filters.license_status === 'review_pending';
      if (isPendingReviewView) {
        // Vercel trigger rebuild - Sort by Fixed status
        fetchedReports.sort((a, b) => {
          const checkFixed = (s) => typeof s === 'string' && (s.trim() === 'تم الإصلاح' || s.trim() === 'تم الاصلاح');
          const aIsFixed = checkFixed(a.status);
          const bIsFixed = checkFixed(b.status);
          
          if (aIsFixed && !bIsFixed) return -1;
          if (!aIsFixed && bIsFixed) return 1;
          return 0; // الحفاظ على الترتيب الأصلي لباقي الحالات
        });
      }

      // تحديث البيانات من الاستجابة
      setReports(fetchedReports);
      
      if (currentPage === 1 && filters.project) {
        try {
          localStorage.setItem(`reports_cache_${filters.project}`, JSON.stringify(fetchedReports));
        } catch (e) {}
      }
      
      setTotalReports(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 0);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // تمرير الشاشة بمرونة إلى بداية جدول البلاغات
  const scrollToTable = () => {
    setTimeout(() => {
      const tableSection = document.getElementById('reports-table-section');
      if (tableSection) {
        // نمرر بحيث يكون الجدول في أعلى الشاشة (مع ترك مساحة بسيطة للهيدر)
        const y = tableSection.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSearch = () => {
    const newParams = new URLSearchParams(searchParams);
    const isSearchActive = filters.search && filters.search.trim() !== '';
    let updatedFilters = { ...filters };

    if (isSearchActive) {
      // محرك البحث العملاق: تفريغ الفلاتر المقيدة للبحث في المشروع بالكامل
      updatedFilters.status = '';
      updatedFilters.review_status = '';
      updatedFilters.license_status = '';
      updatedFilters.report_type = '';
      updatedFilters.contractor = '';
      updatedFilters.my_reports = false;
      updatedFilters.created_by = '';
      setIsNewReportsFilter(false);
      newParams.delete('filter');
    }

    setFilters(updatedFilters);

    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, typeof value === 'string' ? value.trim() : value);
      } else {
        newParams.delete(key);
      }
    });

    if (!newParams.has('project') && currentProject) {
      newParams.set('project', currentProject);
    }
    newParams.set('page', 1);
    newParams.set('scroll', 'true');
    setSearchParams(newParams);
    setCurrentPage(1);
  };

  const handleResetFilters = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const defaultProj = searchParams.get('project') || '';
    const defaultGov = searchParams.get('governorate') || '';
    
    const defaultFilters = { 
      search: '', license_number: '', project: defaultProj, governorate: defaultGov, 
      contractor: '', report_type: '', status: '', license_status: '', date: '', start_date: '', created_by: '', my_reports: false
    };
    
    setFilters(defaultFilters);
    
    setExportFilters({ 
      project: defaultProj, governorate: defaultGov, 
      contractor: '', report_type: '', status: '', license_status: '', date_from: '', date_to: '', start_date_from: '', start_date_to: '', created_by: '' 
    });
    
    setExportCount(null);
    setCurrentPage(1);
    
    setLoading(true);
    const params = new URLSearchParams();
    if (defaultProj) params.append('project', defaultProj);
    if (defaultGov) params.append('governorate', defaultGov);
    if (!params.has('project') && currentProject) {
      params.append('project', currentProject);
    }
    params.append('page', 1);
    params.append('limit', reportsPerPage);
    
    axios.get(`${API}/reports?${params}`)
      .then(response => {
        const fetchedReports = response.data.reports || [];
        setReports(fetchedReports);
        
        if (defaultProj) {
          try {
            localStorage.setItem(`reports_cache_${defaultProj}`, JSON.stringify(fetchedReports));
          } catch (e) {}
        }
        
        setTotalReports(response.data.total_count || 0);
        setTotalPages(response.data.total_pages || 0);
        setLoading(false);
      })
      .catch(error => {
        console.error('Reset error:', error);
        setLoading(false);
      });
  };

  // دالة موحدة للبحث التلقائي عند تغيير أي فلتر من قسم الفلاتر (المشروع، المحافظة، التاريخ...)
  const handleExportFilterChange = (field, value) => {
    // 1. تحديث فلاتر التصدير
    const newExportFilters = {...exportFilters, [field]: value};
    // إذا تغير المشروع نقوم بتفريغ المحافظة والتواريخ
    if (field === 'project') {
      newExportFilters.governorate = '';
      newExportFilters.date_from = '';
      newExportFilters.date_to = '';
      newExportFilters.start_date_from = '';
      newExportFilters.start_date_to = '';
    }
    
    setExportFilters(newExportFilters);
    
    // 2. تحديث الفلاتر الرئيسية بنفس القيم
    const newFilters = {...filters, ...newExportFilters};
    setFilters(newFilters);
    
    // 3. إعادة تعيين عدد التصدير
    setExportCount(null);
    
    // 4. تحديث الصفحة دون تعديل الـ URL لتجنب التداخل مع useEffect
    setCurrentPage(1);
    
    // 5. جلب البيانات فوراً ليكون البحث "أوتوماتيكياً"
    setLoading(true);
    const params = new URLSearchParams();

    // استخدام newExportFilters مباشرة (تحتوي date_from, date_to, start_date_from, start_date_to)
    const projectToUse = newExportFilters.project || filters.project || currentProject;
    if (projectToUse) params.append('project', projectToUse);
    if (newExportFilters.governorate) params.append('governorate', newExportFilters.governorate);
    if (newExportFilters.contractor) params.append('contractor', newExportFilters.contractor);
    if (newExportFilters.report_type) params.append('report_type', newExportFilters.report_type);
    if (newExportFilters.status) params.append('status', newExportFilters.status);
    if (newExportFilters.license_status) params.append('license_status', newExportFilters.license_status);
    if (newExportFilters.date_from) params.append('date_from', newExportFilters.date_from);
    if (newExportFilters.date_to) params.append('date_to', newExportFilters.date_to);
    if (newExportFilters.start_date_from) params.append('start_date_from', newExportFilters.start_date_from);
    if (newExportFilters.start_date_to) params.append('start_date_to', newExportFilters.start_date_to);
    if (newExportFilters.created_by) params.append('created_by', newExportFilters.created_by);
    if (newFilters.search) params.append('search', newFilters.search.trim());

    params.append('page', 1);
    params.append('limit', reportsPerPage);
    
    axios.get(`${API}/reports?${params}`)
      .then(response => {
        const fetchedReports = response.data.reports || [];
        setReports(fetchedReports);
        
        if (newExportFilters.project) {
          try {
            localStorage.setItem(`reports_cache_${newExportFilters.project}`, JSON.stringify(fetchedReports));
          } catch (e) {}
        }
        
        setTotalReports(response.data.total_count || 0);
        setTotalPages(response.data.total_pages || 0);
        setExportCount(response.data.total_count || 0);
        setLoading(false);
      })
      .catch(error => {
        console.error('Search error:', error);
        setLoading(false);
      });
  };

  const quickSearchTimeoutRef = React.useRef(null);

  // دالة للبحث الفوري عند الكتابة
  const handleQuickSearch = (field, value) => {
    let newFilters = {...filters, [field]: value};
    
    // محرك البحث العملاق: تفريغ الفلاتر المقيدة إذا كان البحث نصياً
    const isSearchActive = field === 'search' && value && value.trim() !== '';
    if (isSearchActive) {
      newFilters.status = '';
      newFilters.review_status = '';
      newFilters.license_status = '';
      newFilters.report_type = '';
      newFilters.contractor = '';
      newFilters.my_reports = false;
      newFilters.created_by = '';
      setIsNewReportsFilter(false);
    }

    setFilters(newFilters);
    setCurrentPage(1);
    
    const newUrlParams = new URLSearchParams(searchParams);
    if (isSearchActive) {
      newUrlParams.delete('filter');
    }
    
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && typeof val === 'string' && val.trim()) {
        newUrlParams.set(key, val); // DO NOT TRIM HERE! preserves space while typing
      } else {
        newUrlParams.delete(key);
      }
    });

    if (!newUrlParams.has('project') && currentProject) {
      newUrlParams.set('project', currentProject);
    }
    newUrlParams.set('page', 1);
    setSearchParams(newUrlParams, { replace: true });

    if (quickSearchTimeoutRef.current) clearTimeout(quickSearchTimeoutRef.current);
    
    quickSearchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      
      if (isSearchActive) {
        params.append('search', value.trim());
        if (newFilters.project) params.append('project', newFilters.project);
        if (newFilters.governorate) params.append('governorate', newFilters.governorate);
        if (newFilters.exact) params.append('exact', 'true');
      } else {
        Object.entries(newFilters).forEach(([key, val]) => { 
          if (val && typeof val === 'string' && val.trim()) {
            if (key === 'date') {
              params.append('date_from', val);
              params.append('date_to', val);
            } else if (key === 'start_date') {
              params.append('start_date_from', val);
              params.append('start_date_to', val);
            } else {
              params.append(key, typeof val === 'string' ? val.trim() : val);
            }
          }
        });
        if (!params.has('project') && currentProject) {
          params.append('project', currentProject);
        }
      }
      
      params.append('page', 1);
      params.append('limit', reportsPerPage);
      
      axios.get(`${API}/reports?${params}`)
        .then(response => {
          const fetchedReports = response.data.reports || [];
          setReports(fetchedReports);
          
          if (newFilters.project) {
            try {
              localStorage.setItem(`reports_cache_${newFilters.project}`, JSON.stringify(fetchedReports));
            } catch (e) {}
          }
          
          setTotalReports(response.data.total_count || 0);
          setTotalPages(response.data.total_pages || 0);
        })
        .catch(error => console.error('Search error:', error));
    }, 600); // 600ms debounce
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('reports.confirmDelete'))) return;
    try {
      await axios.delete(`${API}/reports/${id}`);
      toast.success(t('reports.deleteSuccess'));
      fetchReports();
    } catch (error) {
      console.error('Failed to delete report:', error);
      toast.error(t('common.error'));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      toast.warning(t('reports.selectFirst'));
      return;
    }
    
    if (!window.confirm(t('reports.bulkDeleteConfirm', { count: selectedReports.length }))) return;
    
    try {
      await axios.post(`${API}/reports/bulk-delete`, { ids: selectedReports });
      toast.success(t('reports.reportsDeleted', { count: selectedReports.length }));
      setSelectedReports([]);
      fetchReports();
    } catch (error) {
      console.error('Failed to delete reports:', error);
      toast.error(t('common.error'));
    }
  };

  const toggleSelectReport = (id) => {
    setSelectedReports(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  // تحديد جميع البلاغات في الصفحة الحالية
  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map(r => r.id));
    }
  };

  // تحديد جميع البلاغات - طريقة مبسطة وسريعة
  const selectAllReports = async () => {
    if (!window.confirm(t('reports.confirmSelectAll', { count: totalReports, defaultValue: `هل تريد تحديد جميع البلاغات (${totalReports} بلاغ)؟` }))) {
      return;
    }

    // نستخدم علامة بسيطة بدلاً من جلب جميع IDs
    // هذا أسرع بكثير وأكثر موثوقية
    setIsAllSelected(true);
    setSelectedReports(reports.map(r => r.id)); // نحدد فقط البلاغات المعروضة للعرض
    toast.success(t('reports.selectAllSuccess', { count: totalReports, defaultValue: `✅ تم تحديد جميع البلاغات (${totalReports} بلاغ)!\n\nعند التصدير، سيتم تصدير جميع البلاغات حسب الفلاتر الحالية.` }), {
      autoClose: 2500
    });
  };

  const handleFilterChange = (field, value) => {
    const newFilters = {...filters, [field]: value};
    if (field === 'project') {
      newFilters.governorate = '';
      newFilters.date_from = '';
      newFilters.date_to = '';
      newFilters.start_date_from = '';
      newFilters.start_date_to = '';
    }

    if (field === 'date_from') {
      newFilters.date_to = value;
    }
    if (field === 'start_date_from') {
      newFilters.start_date_to = value;
    }
    
    setFilters(newFilters);
    
    // Also update export filters so they stay in sync
    const newExportFilters = {...exportFilters, ...newFilters};
    setExportFilters(newExportFilters);
    
    // تحديث الرابط مباشرة بكل الفلاتر الجديدة حتى يلتقطها useEffect بشكل صحيح
    const newParams = new URLSearchParams(searchParams);
    
    // وضع الفلاتر في الرابط
    Object.keys(newFilters).forEach(key => {
      // نتجاهل الحقول التي لا نريد إرسالها للرابط إذا لزم الأمر
      if (newFilters[key] !== '' && newFilters[key] !== null && newFilters[key] !== undefined) {
        newParams.set(key, newFilters[key]);
      } else {
        newParams.delete(key);
      }
    });
    
    newParams.set('page', 1);
    setSearchParams(newParams);
    setCurrentPage(1);
  };
  
  // تحديد/إلغاء تحديد بلاغ
  const toggleReportSelection = (reportId) => {
    if (selectedReports.includes(reportId)) {
      setSelectedReports(selectedReports.filter(id => id !== reportId));
    } else {
      setSelectedReports([...selectedReports, reportId]);
    }
  };
  
  // تبديل حالة المراجعة
  const handleReviewToggle = async (reportId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log('User attempting review:', user?.username);
      console.log('Current user object:', user);
      
      const response = await axios.put(
        `${API}/reports/${reportId}/review`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setReports(reports.map(report => 
        report.id === reportId 
          ? { 
              ...report, 
              review_status: response.data.review_status,
              reviewed_by_name: response.data.reviewed_by_name,
              wfm_closed: response.data.wfm_closed,
              wfm_closed_by: response.data.wfm_closed_by
            }
          : report
      ));
      
      if (response.data.review_status === 'تمت المراجعة') {
        toast.success(i18n.language === 'ar' ? 'تم مراجعة البلاغ بنجاح' : 'Report reviewed successfully');
      } else {
        toast.success(i18n.language === 'ar' ? 'تم اعادة فتح حالة المراجعة' : 'Review status reopened');
      }
    } catch (error) {
      console.error('Failed to update review status:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error(t('common.error'));
      }
    }
  };
  
  // تبديل حالة إغلاق WFM (مدير المشروع)
  const handleToggleWFMClosed = async (reportId, currentStatus) => {
    console.log(`🚀 Attempting to toggle WFM for report: ${reportId}`);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API}/wfm/toggle/${reportId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log('✅ Server Response:', response.data);
      
      if (response.status === 200) {
        if (response.data.wfm_closed) {
          const report = reports.find(r => r.id === reportId);
          const ln = report?.license_number ? report.license_number.toString().trim() : '';
          const hasArabic = /[\u0600-\u06FF]/.test(ln);
          const isEmptyOrDash = !ln || ln === '-' || ln === '0' || ln.toLowerCase() === 'none' || ln.toLowerCase() === 'null' || ln.toLowerCase() === 'nan';
          const isNoLicense = isEmptyOrDash || hasArabic || (!/[0-9]/.test(ln) && ln.length < 5);

          if (isNoLicense) {
            toast.success(i18n.language === 'ar' ? 'تمت المعالجة بواسطة الاستشاري' : 'Processed by Consultant');
          } else {
            toast.success(i18n.language === 'ar' ? 'تم اغلاق الرخصة علي منصة البنية التحتية' : 'License closed on Infrastructure Platform');
          }
        } else {
          toast.success(i18n.language === 'ar' ? 'تم فتح معالجة الرخصة' : 'License processing opened');
        }
        
        // تحديث الحالة في الـ state محلياً فوراً لتجنب التأخير
        setReports(prevReports => prevReports.map(report => 
          report.id === reportId 
            ? { ...report, wfm_closed: response.data.wfm_closed }
            : report
        ));

        // إعادة جلب البيانات لضمان المزامنة التامة مع قاعدة البيانات
        fetchReports();
      } else {
        throw new Error('Server returned non-200 status');
      }
    } catch (error) {
      console.error('❌ Toggle WFM Error:', error);
      const errorMsg = error.response?.data?.detail || 'حدث خطأ في الاتصال بالسيرفر';
      toast.error(errorMsg);
      // محاولة التحديث حتى في حالة الخطأ لضمان استقرار الواجهة
      fetchReports();
    }
  };
  
  // دالة للتحقق من البلاغ الجديد (لم تتم مراجعته بعد)
  const isNewReport = (reviewStatus) => {
    return reviewStatus === 'بانتظار المراجعة' || reviewStatus === 'قيد المراجعة' || !reviewStatus;
  };
  
  // البحث السريع عن البلاغات حسب جميع الفلاتر
  const handleSearchExportCount = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // إضافة جميع فلاتر التصدير
      const projectToUse = exportFilters.project || filters.project;
      if (projectToUse) params.append('project', projectToUse);
      if (exportFilters.governorate) params.append('governorate', exportFilters.governorate);
      if (exportFilters.contractor) params.append('contractor', exportFilters.contractor);
      if (exportFilters.report_type) params.append('report_type', exportFilters.report_type);
      if (exportFilters.license_status) params.append('license_status', exportFilters.license_status);
      if (exportFilters.date_from) params.append('date_from', exportFilters.date_from);
      if (exportFilters.date_to) params.append('date_to', exportFilters.date_to);
      if (exportFilters.start_date_from) params.append('start_date_from', exportFilters.start_date_from);
      if (exportFilters.start_date_to) params.append('start_date_to', exportFilters.start_date_to);
      if (exportFilters.created_by) params.append('created_by', exportFilters.created_by);
        params.append('lang', i18n.language || 'ar');
      
      // إضافة معاملات الترقيم
      if (!params.has('project') && currentProject) {
      params.append('project', currentProject);
    }
    params.append('page', 1);
      params.append('limit', reportsPerPage);
      
      const response = await axios.get(`${API}/reports?${params}`);
      
      // تحديث عدد البلاغات
      setExportCount(response.data.total_count || 0);
      
      // عرض البلاغات في الجدول فوراً
      setReports(response.data.reports || []);
      setTotalReports(response.data.total_count || 0);
      setTotalPages(response.data.total_pages || 0);
      setCurrentPage(1);
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to get export count:', error);
      toast.error(t('common.error'));
      setLoading(false);
    }
  };

  const getFileHandleSafely = async (filename) => {
    if ('showSaveFilePicker' in window) {
      try {
        let types = [];
        if (filename.endsWith('.pdf')) {
          types = [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }];
        } else if (filename.endsWith('.xlsx')) {
          types = [{ description: 'Excel Spreadsheet', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }];
        } else if (filename.endsWith('.jpg')) {
          types = [{ description: 'JPEG Image', accept: { 'image/jpeg': ['.jpg', '.jpeg'] } }];
        } else if (filename.endsWith('.png')) {
          types = [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }];
        }
        const handle = await window.showSaveFilePicker({ 
          suggestedName: filename,
          types: types.length > 0 ? types : undefined
        });
        return handle;
      } catch (err) {
        if (err.name === 'AbortError') return 'abort'; // user cancelled
        console.error('SaveFilePicker error:', err);
        return null;
      }
    }
    return null;
  };

  const saveToHandleOrFallback = async (blobData, filename, fileHandle) => {
    if (fileHandle && fileHandle !== 'abort') {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(blobData);
        await writable.close();
        return true;
      } catch (err) {
        console.error('Error writing to file handle:', err);
      }
    }
    // Fallback
    const url = window.URL.createObjectURL(new Blob([blobData]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 100);
    return true;
  };

  const handleExport = async (format) => {
    try {
      if (exportCount === 0 && selectedReports.length === 0) {
        toast.warning(t('reports.pleaseSelectReportsToExport', {defaultValue: 'يرجى تحديد العدد او البلاغ للتصدير'}));
        return;
      }

      const filename = `reports_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      const fileHandle = await getFileHandleSafely(filename);
      if (fileHandle === 'abort') return;

      toast.info(format === 'pdf' ? 'جاري تحضير ملف الـ PDF... الرجاء الانتظار' : 'جاري تحضير ملف الإكسيل... الرجاء الانتظار', { autoClose: 3500 });
      
      const params = new URLSearchParams();
      
      const projectToUse = exportFilters.project || filters.project;
      if (projectToUse) params.append('project', projectToUse);
      
      const govToUse = exportFilters.governorate || filters.governorate;
      if (govToUse) params.append('governorate', govToUse);
      
      const contractorToUse = exportFilters.contractor || filters.contractor;
      if (contractorToUse) params.append('contractor', contractorToUse);
      
      const typeToUse = exportFilters.report_type || filters.report_type;
      if (typeToUse) params.append('report_type', typeToUse);
      
      const licenseStatusToUse = exportFilters.license_status || filters.license_status;
      if (licenseStatusToUse) params.append('license_status', licenseStatusToUse);
      
      const dateFromToUse = exportFilters.date_from || filters.date_from || filters.date;
      if (dateFromToUse) params.append('date_from', dateFromToUse);
      
      const dateToToUse = exportFilters.date_to || filters.date_to || filters.date;
      if (dateToToUse) params.append('date_to', dateToToUse);
      
      const startDateFromToUse = exportFilters.start_date_from || filters.start_date_from || filters.start_date;
      if (startDateFromToUse) params.append('start_date_from', startDateFromToUse);
      
      const startDateToToUse = exportFilters.start_date_to || filters.start_date_to || filters.start_date;
      if (startDateToToUse) params.append('start_date_to', startDateToToUse);
      
      const createdByToUse = exportFilters.created_by || filters.created_by;
      if (createdByToUse) params.append('created_by', createdByToUse);
      
      params.append('lang', i18n.language || 'ar');
      
      const response = await axios.get(`${API}/reports/export/${format}?${params}`, { 
        responseType: 'blob',
        timeout: 120000
      });
      
      await saveToHandleOrFallback(response.data, filename, fileHandle);
      toast.success(t('reports.exportSuccess', {defaultValue: 'تم تصدير الملف بنجاح'}));

    } catch (error) {
      console.error('Failed to export:', error);
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error(t('reports.exportTimeout', {defaultValue: 'انتهت مهلة التصدير - حاول تضييق نطاق التاريخ'}));
      } else {
        toast.error(t('reports.exportError', {defaultValue: 'حدث خطأ في التصدير - حاول مرة أخرى'}));
      }
    }
  };
  
  // تصدير البلاغات المحددة - منطق مبسط وموثوق
  const handleExportSelected = async (format) => {
    if (selectedReports.length === 0) {
      toast.warning(t('reports.selectFirst'));
      return;
    }
    
    const exportCount = isAllSelected ? totalReports : selectedReports.length;
    if (!window.confirm(t('reports.confirmExport', { count: exportCount, defaultValue: `هل تريد تصدير ${exportCount} بلاغ؟` }))) {
      return;
    }
    
    let filename = '';
    if (isAllSelected) filename = `all_reports_${totalReports}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    else if (selectedReports.length > 50) filename = `reports_${selectedReports.length}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    else filename = `selected_reports_${selectedReports.length}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    const fileHandle = await getFileHandleSafely(filename);
    if (fileHandle === 'abort') return;
    
    setLoading(true);
    toast.info(format === 'pdf' ? 'جاري تحضير ملف الـ PDF... الرجاء الانتظار' : 'جاري تحضير ملف الإكسيل... الرجاء الانتظار', { autoClose: 3500 });
    try {
      if (isAllSelected || selectedReports.length > 50) {
        console.log('🚀 Exporting using filters...');
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => { 
          if (value) params.append(key, value); 
        });
        
        const response = await axios.get(
          `${API}/reports/export/${format}?${params}`, 
          { responseType: 'blob', timeout: 300000 }
        );
        
        await saveToHandleOrFallback(response.data, filename, fileHandle);
        toast.success(t('reports.exportSuccess', {defaultValue: 'تم تصدير الملف بنجاح'}));
        setSelectedReports([]);
        setIsAllSelected(false);
      } 
      else {
        console.log('📦 Exporting small selection using IDs...');
        const payload = { 
          report_ids: selectedReports,
          lang: i18n.language || 'ar'
        };
        if (filters.project) payload.project = filters.project;
        
        const response = await axios.post(
          `${API}/reports/export-selected/${format}`,
          payload,
          { responseType: 'blob', timeout: 120000 }
        );
        
        await saveToHandleOrFallback(response.data, filename, fileHandle);
        toast.success(t('reports.exportSuccess', {defaultValue: 'تم تصدير الملف بنجاح'}));
        setSelectedReports([]);
      }
    } catch (error) {
      console.error('❌ Export failed:', error);
      const errorMsg = error.response?.data?.detail || error.message || t('common.error', {defaultValue: 'حدث خطأ'});
      toast.error(`${t('reports.exportError', {defaultValue: 'حدث خطأ في التصدير'})}: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };


  // جلب الصور لبلاغ معين
  const fetchReportImages = async (report) => {
    const reportId = report.id;
    setLoadingImages(prev => ({ ...prev, [reportId]: true }));
    
    try {
      const response = await axios.get(`${API}/reports/${reportId}/images`);
      const images = response.data.images || [];
      
      // حفظ الصور في state
      setReportImages(prev => ({ ...prev, [reportId]: images }));
      
      // عرض الصور في Modal
      if (images.length > 0) {
        setSelectedImages(images);
        setSelectedReportForMedia(report);
        setSelectedForDownload([]);
        setShowImagesModal(true);
      } else {
        toast.info(t('reports.noImages'));
      }
    } catch (error) {
      console.error('Failed to fetch images:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingImages(prev => ({ ...prev, [reportId]: false }));
    }
  };

  const viewImages = (images, report) => {
    setSelectedImages(images);
    setSelectedReportForMedia(report);
    setSelectedForDownload([]);
    setShowImagesModal(true);
  };

  const handleDownloadImagesAsPdf = async () => {
    if (!selectedReportForMedia || selectedImages.length === 0) return;
    
    const filename = `Report_${selectedReportForMedia.report_number || selectedReportForMedia.id}_Media.pdf`;
    const fileHandle = await getFileHandleSafely(filename);
    if (fileHandle === 'abort') return;

    toast.info(t('reports.pdf.preparing', {defaultValue: 'جاري تجهيز ملف الـ PDF... الرجاء الانتظار'}));
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const headerDiv = document.createElement('div');
      headerDiv.style.width = '800px';
      headerDiv.style.padding = '30px';
      headerDiv.style.backgroundColor = '#ffffff';
      headerDiv.style.direction = 'rtl';
      headerDiv.style.fontFamily = 'Arial, sans-serif';
      headerDiv.style.color = '#000';
      headerDiv.style.position = 'fixed';
      headerDiv.style.top = '-9999px';
      
      const notSpecified = t('common.notSpecified', {defaultValue: 'غير محدد'});
      
      const getBase64Image = async (url) => {
        try {
          const res = await fetch(url);
          const blob = await res.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          return url;
        }
      };

      const partnerLogoUrl = (branding.partner_logo_url || '').startsWith('http') 
        ? branding.partner_logo_url 
        : window.location.origin + (branding.partner_logo_url || '/nwc-logo.png');
      const companyLogoUrl = (branding.company_logo_url || '').startsWith('http') 
        ? branding.company_logo_url 
        : window.location.origin + (branding.company_logo_url || '/bayt-alkhibra-logo.png');
        
      const [partnerLogoB64, companyLogoB64] = await Promise.all([
        getBase64Image(partnerLogoUrl),
        getBase64Image(companyLogoUrl)
      ]);

      let locLat = selectedReportForMedia.latitude || notSpecified;
      let locLng = selectedReportForMedia.longitude || notSpecified;
      
      // Fallback to location string if latitude/longitude are not explicitly provided
      if ((locLat === notSpecified || locLng === notSpecified) && selectedReportForMedia.location) {
        const match = selectedReportForMedia.location.match(/-?\d{1,3}\.\d{4,}/g);
        if (match && match.length >= 2) {
          locLat = match[0];
          locLng = match[1];
        } else {
          locLat = selectedReportForMedia.location.substring(0, 40);
        }
      }

      headerDiv.innerHTML = `
        <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; font-family: Cairo, 'Tajawal', sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px;">
            <div style="width: 150px; text-align: ${isRtl ? 'right' : 'left'};">
              <img src="${partnerLogoB64}" alt="NWC Logo" style="max-width: 100%; max-height: 90px; object-fit: contain;" />
            </div>
            <div style="text-align: center; flex: 1; padding: 0 20px;">
              <h2 style="color: #1e3a8a; margin: 0; font-size: 28px;">${t('reports.pdf.mediaReportDetails', {defaultValue: 'تفاصيل بلاغ الوسائط'})}</h2>
              <h3 style="color: #3b82f6; margin: 10px 0 0 0; font-size: 20px;">${translateBrandingText(selectedReportForMedia.project || '', isRtl)} - ${translateBrandingText(selectedReportForMedia.governorate || '', isRtl)}</h3>
            </div>
            <div style="width: 150px; text-align: ${isRtl ? 'left' : 'right'};">
              <img src="${companyLogoB64}" alt="Company Logo" style="max-width: 100%; max-height: 90px; object-fit: contain;" />
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; margin-top: 20px; font-size: 16px; text-align: center;">
            <tbody>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; width: 25%; text-align: center;">${t('reports.reportNumber', {defaultValue: 'رقم البلاغ'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; width: 25%; text-align: center;">${selectedReportForMedia.report_number || selectedReportForMedia.id || notSpecified}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; width: 25%; text-align: center;">${t('reports.licenseNumber', {defaultValue: 'رقم الرخصة'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; width: 25%; text-align: center;">${selectedReportForMedia.license_number || t('reports.noLicense', {defaultValue: 'بدون رخصة'})}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.receiveDate', {defaultValue: 'تاريخ الاستلام'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${selectedReportForMedia.received_date || selectedReportForMedia.created_at ? new Date(selectedReportForMedia.received_date || selectedReportForMedia.created_at).toLocaleDateString('en-GB') : notSpecified}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.startDate', {defaultValue: 'تاريخ المباشرة'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${selectedReportForMedia.start_date ? new Date(selectedReportForMedia.start_date).toLocaleDateString('en-GB') : notSpecified}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.createdBy', {defaultValue: 'اسم المراقب'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${translateBrandingText(selectedReportForMedia.created_by_name || 'غير معروف', isRtl)}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.pdf.systemEngineerLabel', {defaultValue: 'مهندس النظام وتحليل البيانات'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${t('reports.pdf.systemEngineerName', {defaultValue: 'م/ محمود محمد هارون'})}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reportForm.diameter', {defaultValue: 'القطر'})} (${t('reportForm.mm', {defaultValue: 'بالمليمتر'})})</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${selectedReportForMedia.diameter_mm || selectedReportForMedia.diameter || notSpecified}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reportForm.depth', {defaultValue: 'العمق'})} (${t('reportForm.cm', {defaultValue: 'بالسنتيمتر'})})</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${selectedReportForMedia.depth_meters || selectedReportForMedia.depth || notSpecified}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reportForm.latitude', {defaultValue: 'خط العرض'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; direction: ltr; text-align: center;">${locLat}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reportForm.longitude', {defaultValue: 'خط الطول'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; direction: ltr; text-align: center;">${locLng}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.closeDate', {defaultValue: 'تاريخ الإغلاق'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${selectedReportForMedia.closed_at ? new Date(selectedReportForMedia.closed_at).toLocaleDateString('en-GB') : (selectedReportForMedia.wfm_closed_at ? new Date(selectedReportForMedia.wfm_closed_at).toLocaleDateString('en-GB') : t('reports.notClosed', {defaultValue: 'غير مغلق'}))}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.reportType', {defaultValue: 'نوع البلاغ'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${t('reportTypes.' + (selectedReportForMedia.report_type || 'Unknown'), {defaultValue: translateBrandingText(selectedReportForMedia.report_type || notSpecified, isRtl)})}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: bold; text-align: center;">${t('reports.status', {defaultValue: 'حالة الإصلاح'})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center;">${t('statusMap.' + (selectedReportForMedia.status || 'Unknown'), {defaultValue: translateBrandingText(selectedReportForMedia.status || notSpecified, isRtl)})}</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; background: #f9fafb; border-bottom: none; border-right: none;" colspan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      document.body.appendChild(headerDiv);
      
      const canvas = await html2canvas(headerDiv, { scale: 2, useCORS: true });
      const headerImg = canvas.toDataURL('image/jpeg', 1.0);
      document.body.removeChild(headerDiv);
      
      const headerHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(headerImg, 'JPEG', 0, 0, pageWidth, headerHeight);
      
      let currentY = headerHeight + 10;
      
      for (let i = 0; i < selectedImages.length; i++) {
        const imageData = selectedImages[i];
        if (isVideo(imageData)) continue;
        
        try {
          const url = resolveImageUrl(imageData);
          const response = await fetch(url);
          const blob = await response.blob();
          const objUrl = window.URL.createObjectURL(blob);
          
          const img = new Image();
          await new Promise((resolve) => {
             img.onload = resolve;
             img.onerror = resolve;
             img.src = objUrl;
          });
          
          if (img.width && img.height) {
             const imgRatio = img.height / img.width;
             let imgWidth = pageWidth - 20;
             let imgHeight = imgWidth * imgRatio;
             
             if (imgHeight > pageHeight - 20) {
                imgHeight = pageHeight - 20;
                imgWidth = imgHeight / imgRatio;
             }
             
             if (currentY + imgHeight > pageHeight) {
                pdf.addPage();
                currentY = 10;
             }
             
             const xPos = (pageWidth - imgWidth) / 2;
             pdf.addImage(img, 'JPEG', xPos, currentY, imgWidth, imgHeight);
             currentY += imgHeight + 10;
          }
        } catch(e) {
           console.error('Error loading image for PDF', e);
        }
      }
      
      // إضافة تذييل باسم المراجع في جميع صفحات الـ PDF
      const footerDiv = document.createElement('div');
      footerDiv.style.width = '800px';
      footerDiv.style.position = 'fixed';
      footerDiv.style.top = '-9999px';
      footerDiv.innerHTML = `
        <div style="direction: ${isRtl ? 'rtl' : 'ltr'}; font-family: Arial, Cairo, 'Tajawal', sans-serif; text-align: center; padding: 20px; background: #f8fafc; border-top: 3px solid #e2e8f0; letter-spacing: 0px !important;">
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #1e3a8a;">${t('reports.pdf.systemEngineerLabel', {defaultValue: 'مهندس النظام وتحليل البيانات'})}-${t('reports.pdf.systemEngineerName', {defaultValue: 'م/محمود محمد هارون'})}</p>
        </div>
      `;
      document.body.appendChild(footerDiv);
      const footerCanvas = await html2canvas(footerDiv, { scale: 2 });
      const footerImg = footerCanvas.toDataURL('image/jpeg', 1.0);
      document.body.removeChild(footerDiv);
      const footerHeightRender = (footerCanvas.height * pageWidth) / footerCanvas.width;
      
      const totalPages = pdf.internal.getNumberOfPages();
      for (let j = 1; j <= totalPages; j++) {
        pdf.setPage(j);
        pdf.addImage(footerImg, 'JPEG', 0, pageHeight - footerHeightRender - 5, pageWidth, footerHeightRender);
      }
      
      const pdfBlob = pdf.output('blob');
      await saveToHandleOrFallback(pdfBlob, filename, fileHandle);
      toast.success(t('reports.pdf.exportSuccess', {defaultValue: 'تم التصدير إلى PDF بنجاح'}));
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('reports.pdf.exportError', {defaultValue: 'حدث خطأ أثناء إنشاء الـ PDF'}));
    }
  };

  const downloadImage = async (imageData, index) => {
    try {
      const extension = isVideo(imageData) ? 'webm' : 'jpg';
      const filename = `media_${index + 1}.${extension}`;
      const fileHandle = await getFileHandleSafely(filename);
      if (fileHandle === 'abort') return;

      const url = resolveImageUrl(imageData);
      const response = await fetch(url);
      const blob = await response.blob();
      
      await saveToHandleOrFallback(blob, filename, fileHandle);
    } catch (error) {
      console.error('Error downloading media:', error);
      toast.error(`❌ فشل تحميل الملف ${index + 1}`);
    }
  };

  // دالة للتبديل بين جميع البلاغات وبلاغاتي
  const toggleMyReports = () => {
    const newMyReports = !filters.my_reports;
    setFilters({...filters, my_reports: newMyReports});
    setCurrentPage(1);
  };

  return (
    <Layout user={user} onLogout={onLogout} fullWidth={true}>
      <div className="space-y-6 pt-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-gray-900">
              {isNewReportsFilter ? (
                <span className="flex items-center gap-2">
                  <span className="text-red-500">🔔</span>
                  {t('reports.newUnread')}
                </span>
              ) : currentProject ? (
                <span className="flex items-center gap-2">
                  <span className="text-blue-600">📁</span>
                  {translateBrandingText(currentProject, isRtl)}
                </span>
              ) : t('reports.title', {defaultValue: 'البلاغات'})}
            </h2>
            <span className={`text-sm ${isNewReportsFilter ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
              ({totalReports} {t('reports.report')})
            </span>
            
            {/* تم إخفاء زر عرض جميع البلاغات بناءً على طلب المستخدم */}
            
            {/* تم حذف زر بلاغاتي بناءً على طلب المستخدم */}

          </div>
          <div className="flex flex-wrap gap-2">
            {!isNewReportsFilter && hasPermission('reports_add') && (
              <Link 
                to={`/reports/new${filters.project ? `?project=${encodeURIComponent(filters.project)}` : ''}`} 
                state={{ from: location.pathname + location.search }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
              >
                + {t('reports.addNew')}
              </Link>
            )}
          </div>
        </div>
        
        {!isNewReportsFilter && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            <svg className="inline-block w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {t('reports.searchFilter')}
          </h3>
          
          {/* للمستخدمين: بحث مبسط مع الفلاتر */}
          {user.role !== 'admin' && user.projects && user.projects.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input 
                  type="text" 
                  placeholder={`🔍 ${t('common.search')}`} 
                  value={filters.search} 
                  onChange={(e) => {
                  const val = e.target.value.replace(/\s+/g, '');
                  handleQuickSearch('search', val);
                  if (val === '') {
                    const newParams = new URLSearchParams(searchParams);
                    if (newParams.has('search')) {
                      newParams.delete('search');
                      newParams.set('page', 1);
                      setSearchParams(newParams);
                    }
                  }
                }}
                  onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium" 
                  autoComplete="off"
                  spellCheck="false"
                />
                {/* إضافة فلتر المشروع للمستخدمين (لتجنب اختلاط المشاريع) */}
                <select 
                  value={filters.project} 
                  onChange={(e) => handleFilterChange('project', e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                  disabled={!!currentProject}
                >
                  {!currentProject && user.projects.length > 1 && <option value="">{t('reports.allProjects')}</option>}
                  {user.projects
                    .filter(project => !currentProject || project === currentProject)
                    .map(project => (
                      <option key={project} value={project}>
                        {translateBrandingText(project, isRtl)}
                      </option>
                    ))
                  }
                </select>
              </div>
              
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.governorate')}</label>
                  <select 
                    value={filters.governorate} 
                    onChange={(e) => setFilters({...filters, governorate: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('reports.allGovernorates')}</option>
                    {getAvailableGovernorates().map(gov => (
                      <option key={gov} value={gov}>
                        {translateBrandingText(gov, isRtl)}
                        {last24HoursCounts[gov] > 0 && ` (🔴 ${last24HoursCounts[gov]})`}
                      </option>
                    ))}
                  </select>
                  {/* عرض عداد 24 ساعة للمحافظة المختارة */}
                  {filters.governorate && last24HoursCounts[filters.governorate] > 0 && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs text-red-700 font-bold flex items-center gap-1">
                        🔴 {last24HoursCounts[filters.governorate]} {t('reports.newReportsLast24h', {defaultValue: 'بلاغ جديد خلال 24 ساعة'})}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.contractor')}</label>
                  <select 
                    value={filters.contractor} 
                    onChange={(e) => setFilters({...filters, contractor: e.target.value})} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{t('reports.allContractors')}</option>
                    {contractors.map(contractor => (
                      <option key={contractor.id} value={contractor.name}>
                        {translateBrandingText(contractor.name, isRtl)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.reportType')}</label>
                  <select value={filters.report_type} onChange={(e) => setFilters({...filters, report_type: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">{t('reports.allTypes')}</option>
                    {reportTypes.map(type => (
                      <option key={type} value={type}>{t(`statusMap.${type}`, type)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('reports.statusLicense')}</label>
                  <select 
                    value={filters.license_status} 
                    onChange={(e) => handleFilterChange('license_status', e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="">🔍 {t('reports.allStatuses')}</option>
                    <optgroup label={t('reports.byStatus')}>
                      {/* الحالات الديناميكية من الإعدادات */}
                      {dynamicStatuses.map(s => (
                        <option key={s.id} value={`custom_${s.name}`}>⚙️ {t(`statusMap.${s.name}`, s.name)}</option>
                      ))}
                      
                      {/* الحالات الافتراضية */}
                      {filters.project?.includes('كشف التسربات') ? (
                        <>
                          <option value="status_fixed_leak">✅ {t('statusMap.تم الاصلاح - تسريب')}</option>
                          <option value="status_no_leak">❌ {t('statusMap.لا يوجد تسريب')}</option>
                        </>
                      ) : (
                        <>
                          <option value="status_fixed">✅ {t('statusMap.تم الإصلاح')}</option>
                          <option value="status_asphalt">🛣️ {t('statusMap.تم الإصلاح - ومتبقي الأسفلت')}</option>
                        </>
                      )}
                    </optgroup>
                    <optgroup label={t('reports.byLicense')}>
                      <option value="license_issued">📋 {t('statusMap.تم إصدار رخص')}</option>
                      <option value="license_not_issued">❌ {t('statusMap.لم يتم إصدار رخصة')}</option>
                    </optgroup>
                    <optgroup label={t('reports.byProcessing')}>
                      <option value="status_in_progress">🔄 {t('statusMap.قيد المعالجة')}</option>
                      <option value="status_wfm_closed">🔒 {t('statusMap.مغلقة بواسطة الاستشاري')}</option>
                    </optgroup>
                  </select>
                </div>
              </div>
              

              {/* أزرار البحث وإعادة التعيين */}
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={handleSearch}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {t('common.search')}
                </button>
                
                <button 
                  onClick={handleResetFilters}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('common.reset')}
                </button>
              </div>
            
            </>
          ) : (
            /* للمسؤول: بحث كامل كما كان */
            <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <input 
                type="text" 
                placeholder={`🔍 ${t('common.search')}`} 
                value={filters.search} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\s+/g, '');
                  handleQuickSearch('search', val);
                  if (val === '') {
                    const newParams = new URLSearchParams(searchParams);
                    if (newParams.has('search')) {
                      newParams.delete('search');
                      newParams.set('page', 1);
                      setSearchParams(newParams);
                    }
                  }
                }}
                onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
                className="px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium" 
              />
              
              <select 
                value={filters.project} 
                onChange={(e) => setFilters({...filters, project: e.target.value, governorate: ''})} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
              >
                {!currentProject && <option value="">{t('reports.allProjects')}</option>}
                {availableProjects
                  .filter(project => !currentProject || project === currentProject)
                  .map(project => (
                    <option key={project} value={project}>
                      {translateBrandingText(project, isRtl)}
                    </option>
                  ))
                }
              </select>
              
              <select 
                value={filters.governorate} 
                onChange={(e) => setFilters({...filters, governorate: e.target.value})} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!filters.project}
              >
                <option value="">{t('reports.allGovernorates')}</option>
                {filters.project && PROJECT_GOVERNORATES[filters.project]?.map(gov => (
                  <option key={gov} value={gov}>{translateBrandingText(gov, isRtl)}</option>
              ))}
            </select>
              
              {/* الفلاتر الإضافية للمسؤول */}
              <select 
                value={filters.contractor} 
                onChange={(e) => setFilters({...filters, contractor: e.target.value})} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('reports.allContractors')}</option>
                {contractors.map(contractor => (
                  <option key={contractor.id} value={contractor.name}>
                    {translateBrandingText(contractor.name, isRtl)}
                  </option>
                ))}
              </select>
              
              <select value={filters.report_type} onChange={(e) => setFilters({...filters, report_type: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">{t('reports.allTypes')}</option>
                {reportTypes.map(type => (
                  <option key={type} value={type}>{t(`statusMap.${type}`, type)}</option>
                ))}
              </select>
              
              <select 
                value={filters.license_status} 
                onChange={(e) => handleFilterChange('license_status', e.target.value)} 
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="">🔍 {filters.project?.includes('كشف التسربات') ? t('reports.allStatuses') : t('reports.allStatuses')}</option>
                <optgroup label={filters.project?.includes('كشف التسربات') ? t('reports.byLeakStatus', {defaultValue: "حسب حالة التسرب"}) : t('reports.byStatus', {defaultValue: "حسب الحالة"})}>
                  {/* الحالات الديناميكية من الإعدادات */}
                  {dynamicStatuses.map(s => (
                    <option key={s.id} value={`custom_${s.name}`}>⚙️ {t(`statusMap.${s.name}`, s.name)}</option>
                  ))}
                  
                  {/* الحالات الافتراضية */}
                  {dynamicStatuses.length === 0 && (
                    filters.project?.includes('كشف التسربات') ? (
                      <>
                        <option value="status_fixed_leak">✅ {t('statusMap.تم الاصلاح - تسريب')}</option>
                        <option value="status_no_leak">❌ {t('statusMap.لا يوجد تسريب')}</option>
                      </>
                    ) : (
                      <>
                        <option value="status_fixed">✅ {t('statusMap.تم الإصلاح')}</option>
                        <option value="status_asphalt">🛣️ {t('statusMap.تم الإصلاح - ومتبقي الأسفلت')}</option>
                      </>
                    )
                  )}
                </optgroup>
                <optgroup label={t('reports.byReview', {defaultValue: "حسب المراجعة"})}>
                  <option value="review_pending">⏳ {t('statusMap.قيد المراجعة')}</option>
                </optgroup>
                <optgroup label={t('reports.byLicense', {defaultValue: "حسب الرخصة"})}>
                  <option value="license_issued">📋 {t('statusMap.تم إصدار رخص')}</option>
                  <option value="license_not_issued">❌ {t('statusMap.لم يتم إصدار رخصة')}</option>
                </optgroup>
                <optgroup label={t('reports.byProcessing', {defaultValue: "حسب حالة المعالجة"})}>
                  <option value="status_in_progress">🔄 {t('statusMap.قيد المعالجة')}</option>
                  <option value="status_wfm_closed">🔒 {t('statusMap.مغلقة بواسطة الاستشاري')}</option>
                </optgroup>
              </select>
              
              {/* فلتر المستخدم في البحث الرئيسي - يظهر لمن لديه الصلاحيات */}
              {level3Users && level3Users.length > 0 && 
               (user?.role === 'admin' || user?.can_create_subusers || 
                (user?.permissions || []).includes('view_all_invoices') ||
                (user?.permissions || []).includes('reports_review') ||
                (user?.permissions || []).includes('view_governorate_data') ||
                Object.values(user?.project_permissions || {}).some(perms => (perms || []).includes('reports_review') || (perms || []).includes('view_governorate_data'))
               ) && (
                <select 
                  value={filters.created_by || ''} 
                  onChange={(e) => setFilters({...filters, created_by: e.target.value})}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {((user?.permissions || []).includes('view_governorate_data') || Object.values(user?.project_permissions || {}).some(perms => (perms || []).includes('view_governorate_data'))) 
                      ? (isRtl ? '👤 المهندسين والمراقبين' : '👤 Engineers and Observers')
                      : `👤 ${t('reports.createdBy', {defaultValue: 'المستخدم'})}`}
                  </option>
                  {level3Users.map(u => (
                    <option key={u.id} value={u.id}>
                      {translateBrandingText(u.full_name, isRtl)}
                    </option>
                  ))}
                </select>
              )}
            </div>
            

            {/* أزرار البحث وإعادة التعيين */}
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('common.search')}
              </button>
              
              <button 
                onClick={handleResetFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('common.reset')}
              </button>
            </div>
            </>
          )}
          
          <div className="hidden grid-cols-1 md:grid-cols-3 gap-4">
            <select value={filters.governorate} onChange={(e) => setFilters({...filters, governorate: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t('reports.allGovernorates')}</option>
              {Object.values(PROJECT_GOVERNORATES).flat().filter((v, i, a) => a.indexOf(v) === i).sort().map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
            
            <select value={filters.report_type} onChange={(e) => setFilters({...filters, report_type: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t('reports.allTypes')}</option>
              {reportTypes.map(type => (
                <option key={type} value={type}>{t(`statusMap.${type}`, type)}</option>
              ))}
            </select>
            
            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">{t('reports.allStatuses')}</option>
              <option value="تم الإصلاح">{t('statusMap.تم الإصلاح')}</option>
              <option value="تم الإصلاح-ومتبقي الأسفلت">{t('statusMap.تم الإصلاح-ومتبقي الأسفلت')}</option>
            </select>
            
            <select 
              value={filters.license_status} 
              onChange={(e) => handleFilterChange('license_status', e.target.value)} 
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="">🔍 {filters.project?.includes('كشف التسربات') ? 'جميع الحالات' : t('reports.allStatuses')}</option>
              <optgroup label={filters.project?.includes('كشف التسربات') ? "حسب حالة التسرب" : "حسب الحالة"}>
                {/* الحالات الديناميكية من الإعدادات */}
                {dynamicStatuses.map(s => (
                  <option key={s.id} value={`custom_${s.name}`}>⚙️ {t(`statusMap.${s.name}`, s.name)}</option>
                ))}
                
                {/* الحالات الافتراضية (تظهر فقط إذا لم تكن هناك حالات مخصصة) */}
                {dynamicStatuses.length === 0 && (
                  filters.project?.includes('كشف التسربات') ? (
                    <>
                      <option value="status_fixed_leak">✅ {t('statusMap.تم الاصلاح - تسريب')}</option>
                      <option value="status_no_leak">❌ {t('statusMap.لا يوجد تسريب')}</option>
                    </>
                  ) : (
                    <>
                      <option value="status_fixed">✅ {t('statusMap.تم الإصلاح')}</option>
                      <option value="status_asphalt">🛣️ {t('statusMap.تم الإصلاح - ومتبقي الأسفلت')}</option>
                    </>
                  )
                )}
              </optgroup>
              <optgroup label={t('reports.byReview', {defaultValue: 'حسب المراجعة'})}>
                <option value="review_pending">⏳ {t('statusMap.بإنتظار المراجعة')}</option>
              </optgroup>
              <optgroup label={t('reports.byLicense', {defaultValue: 'حسب الرخصة'})}>
                <option value="license_issued">📋 {t('statusMap.تم إصدار رخص')}</option>
                <option value="license_not_issued">❌ {t('statusMap.لم يتم إصدار رخصة')}</option>
              </optgroup>
              <optgroup label={t('reports.byProcessing', {defaultValue: 'حسب حالة المعالجة'})}>
                <option value="status_in_progress">🔄 {t('statusMap.قيد المعالجة')}</option>
                <option value="status_wfm_closed">🔒 {t('statusMap.مغلقة بواسطة الاستشاري')}</option>
              </optgroup>
            </select>
          </div>
          
          {/* قسم التصدير مع فلاتر المحافظة والتاريخ */}
          <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 p-5 rounded-lg border-2 border-gray-300 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('reports.exportTitle', {defaultValue: 'تصدير التقارير (Excel / PDF)'})}
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-3 w-full">
              {/* اختيار المشروع */}
              {(user?.role === 'admin' || (user?.projects && user.projects.length > 1)) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">📁 {t('reports.project', {defaultValue: 'المشروع'})}:</label>
                  <select 
                    value={exportFilters.project} 
                    onChange={(e) => handleExportFilterChange('project', e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[250px] lg:min-w-[350px]"
                  >
                    {!currentProject && <option value="">{t('reports.allProjects', {defaultValue: 'جميع المشاريع'})}</option>}
                    {availableProjects
                      .filter(project => !currentProject || project === currentProject)
                      .map((project) => (
                        <option key={project} value={project}>
                          {translateBrandingText(project, isRtl)}
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}
              
              {/* اختيار المحافظة حسب الصلاحيات */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">🏛️ {t('reports.governorate', {defaultValue: 'المحافظة'})}:</label>
                <select 
                  value={exportFilters.governorate} 
                  onChange={(e) => handleExportFilterChange('governorate', e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[150px]"
                >
                  <option value="">
                    {exportFilters.project 
                        ? t('reports.allProjectGovernorates', {defaultValue: 'جميع محافظات المشروع'}) 
                        : (user?.governorates && user.governorates.length > 0 
                            ? t('reports.allAllowedGovernorates', {defaultValue: 'جميع المحافظات المسموح بها'}) 
                            : t('reports.allGovernorates', {defaultValue: 'جميع المحافظات'}))}
                  </option>
                  {/* استخدام getExportGovernorates() للحصول على المحافظات المناسبة حسب المشروع المختار */}
                  {getExportGovernorates().map((gov) => (
                    <option key={gov} value={gov}>{translateBrandingText(gov, isRtl)}</option>
                  ))}
                </select>
              </div>
              
              {/* المقاول */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">👷 {t('reports.contractor', {defaultValue: 'المقاول'})}:</label>
                <select 
                  value={exportFilters.contractor || ''} 
                  onChange={(e) => handleExportFilterChange('contractor', e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[150px]"
                >
                  <option value="">{t('reports.allContractors', {defaultValue: 'جميع المقاولين'})}</option>
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.name}>
                      {translateBrandingText(contractor.name, isRtl)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* نوع البلاغ */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">📋 {t('reports.reportType', {defaultValue: 'نوع البلاغ'})}:</label>
                <select 
                  value={exportFilters.report_type || ''} 
                  onChange={(e) => handleExportFilterChange('report_type', e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[120px]"
                >
                  <option value="">{t('reports.allTypes', {defaultValue: 'جميع الأنواع'})}</option>
                  {reportTypes.map(type => (
                    <option key={type} value={type}>
                      {t(`statusMap.${type}`, type)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* الحالة / الرخصة */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">✅ {t('reports.status', {defaultValue: 'الحالة'})}:</label>
                 <select 
                  value={exportFilters.license_status || ''} 
                  onChange={(e) => handleExportFilterChange('license_status', e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[150px] font-medium"
                >
                  <option value="">🔍 {t('reports.allStatuses', {defaultValue: 'جميع الحالات'})}</option>
                  <optgroup label={t('reports.byStatus', {defaultValue: 'حسب الحالة'})}>
                    {/* الحالات الديناميكية من الإعدادات */}
                    {exportDynamicStatuses.map(s => (
                      <option key={s.id} value={`custom_${s.name}`}>⚙️ {t(`statusMap.${s.name}`, s.name)}</option>
                    ))}
                    
                    {/* الحالات الافتراضية */}
                    {exportDynamicStatuses.length === 0 && (
                      exportFilters.project?.includes('كشف التسربات') ? (
                        <>
                          <option value="status_fixed_leak">✅ {t('statusMap.تم الاصلاح - تسريب', {defaultValue: 'تم الاصلاح - تسريب'})}</option>
                          <option value="status_no_leak">❌ {t('statusMap.لا يوجد تسريب', {defaultValue: 'لا يوجد تسريب'})}</option>
                        </>
                      ) : (
                        <>
                          <option value="status_fixed">✅ {t('statusMap.تم الإصلاح', {defaultValue: 'تم الإصلاح'})}</option>
                          <option value="status_asphalt">🛣️ {t('statusMap.تم الإصلاح - ومتبقي الأسفلت', {defaultValue: 'تم الإصلاح - ومتبقي الأسفلت'})}</option>
                        </>
                      )
                    )}
                  </optgroup>
                  <optgroup label={t('reports.byReview', {defaultValue: 'حسب المراجعة'})}>
                    <option value="review_pending">⏳ {t('statusMap.قيد المراجعة', {defaultValue: 'قيد المراجعة'})}</option>
                  </optgroup>
                  <optgroup label={t('reports.byLicense', {defaultValue: 'حسب الرخصة'})}>
                    <option value="license_issued">📋 {t('statusMap.تم إصدار رخص', {defaultValue: 'تم إصدار رخص'})}</option>
                    <option value="license_not_issued">❌ {t('statusMap.لم يتم إصدار رخصة', {defaultValue: 'لم يتم إصدار رخصة'})}</option>
                  </optgroup>
                  <optgroup label={t('reports.byProcessing', {defaultValue: 'حسب حالة المعالجة'})}>
                    <option value="status_in_progress">🔄 {t('statusMap.قيد المعالجة', {defaultValue: 'قيد المعالجة'})}</option>
                    <option value="status_wfm_closed">🔒 {t('statusMap.مغلقة بواسطة الاستشاري', {defaultValue: 'مغلقة بواسطة الاستشاري'})}</option>
                  </optgroup>
                </select>
              </div>

              {/* فلتر المستخدم - ديناميكي حسب المشروع والمحافظة، يظهر لمن لديه صلاحية إدارة أو مراجعة أو استثنائية */}
              {level3Users && level3Users.length > 0 && 
               (user?.role === 'admin' || user?.can_create_subusers || 
                (user?.permissions || []).includes('view_all_invoices') ||
                (user?.permissions || []).includes('reports_review') ||
                (user?.permissions || []).includes('view_governorate_data') ||
                Object.values(user?.project_permissions || {}).some(perms => (perms || []).includes('reports_review') || (perms || []).includes('view_governorate_data'))
               ) && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    👤 {((user?.permissions || []).includes('view_governorate_data') || Object.values(user?.project_permissions || {}).some(perms => (perms || []).includes('view_governorate_data'))) ? (isRtl ? 'مراقبين الاستشاري' : 'Consultant Observers') : t('reports.createdBy', {defaultValue: 'المستخدم'})}:
                  </label>
                  <select 
                    value={exportFilters.created_by || ''} 
                    onChange={(e) => handleExportFilterChange('created_by', e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:min-w-[130px]"
                  >
                    <option value="">
                      {((user?.permissions || []).includes('view_governorate_data') || Object.values(user?.project_permissions || {}).some(perms => (perms || []).includes('view_governorate_data'))) 
                        ? (isRtl ? 'المهندسين والمراقبين' : 'Engineers and Observers')
                        : t('reports.allUsers', {defaultValue: 'جميع المستخدمين'})}
                    </option>
                    {level3Users.map(u => (
                      <option key={u.id} value={u.id}>
                        {translateBrandingText(u.full_name, isRtl)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* الصف الثاني: التواريخ وأزرار الإجراءات */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:flex-wrap gap-3 w-full mt-4">
              
              {/* حقول التاريخ - مجمعة ومنسقة بجوار بعضها */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-gray-200 bg-white p-2 sm:p-3 rounded-lg shadow-sm w-full sm:w-auto flex-wrap">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <label className="text-sm font-bold text-gray-700 whitespace-nowrap">📥 {t('reports.receiptDateFrom', {defaultValue: 'الاستلام من'})}</label>
                  <input 
                    type="date" 
                    value={exportFilters.date_from} 
                    onChange={(e) => handleExportFilterChange('date_from', e.target.value)}
                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-800"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <label className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('reports.dateTo', {defaultValue: 'الاستلام الى'})}</label>
                  <input 
                    type="date" 
                    value={exportFilters.date_to} 
                    onChange={(e) => handleExportFilterChange('date_to', e.target.value)}
                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-800"
                  />
                </div>
                
                <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                <div className="sm:hidden w-full h-px bg-gray-200 my-1"></div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <label className="text-sm font-bold text-gray-700 whitespace-nowrap">🚀 {t('reports.startDateFrom', {defaultValue: 'مباشره من'})}</label>
                  <input 
                    type="date" 
                    value={exportFilters.start_date_from} 
                    onChange={(e) => handleExportFilterChange('start_date_from', e.target.value)}
                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium text-gray-800"
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 w-full sm:w-auto">
                  <label className="text-sm font-bold text-gray-700 whitespace-nowrap">{t('reports.startDateTo', {defaultValue: 'مباشره الى'})}</label>
                  <input 
                    type="date" 
                    value={exportFilters.start_date_to} 
                    onChange={(e) => handleExportFilterChange('start_date_to', e.target.value)}
                    className="w-full sm:w-auto px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium text-gray-800"
                  />
                </div>
              </div>
              
              {/* زر البحث */}
              <button 
                onClick={handleSearchExportCount}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <svg className="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {t('common.search')}
              </button>
              
              {/* زر إعادة تعيين */}
              <button 
                onClick={handleResetFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
              >
                <svg className="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('common.reset')}
              </button>
              
              {/* عرض عدد البلاغات */}
              {exportCount !== null && (
                <div className="bg-white px-4 py-2 rounded-lg border-2 border-blue-500 text-sm font-bold text-blue-700 flex items-center">
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('reports.totalReports')}: {exportCount}
                </div>
              )}
              
              {/* أزرار التصدير والحذف - ذكية: تعمل على المحدد إن وُجد، أو على نتائج الفلتر */}
              <button 
                onClick={() => selectedReports.length > 0 ? handleExportSelected('excel') : handleExport('excel')} 
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                disabled={exportCount === 0 && selectedReports.length === 0}
                data-testid="export-excel-btn"
                title={selectedReports.length > 0 ? t('reports.exportSelectedCount', { count: selectedReports.length, defaultValue: `تصدير ${selectedReports.length} بلاغ محدد` }) : t('reports.exportMatching', {defaultValue: 'تصدير جميع البلاغات المطابقة'})}
              >
                <svg className="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {selectedReports.length > 0 ? t('reports.exportExcelWithCount', { count: selectedReports.length, defaultValue: `تصدير Excel (${selectedReports.length})` }) : t('reports.exportExcel')}
              </button>
              <button 
                onClick={() => selectedReports.length > 0 ? handleExportSelected('pdf') : handleExport('pdf')} 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                disabled={exportCount === 0 && selectedReports.length === 0}
                data-testid="export-pdf-btn"
                title={selectedReports.length > 0 ? t('reports.exportSelectedCount', { count: selectedReports.length, defaultValue: `تصدير ${selectedReports.length} بلاغ محدد` }) : t('reports.exportMatching', {defaultValue: 'تصدير جميع البلاغات المطابقة'})}
              >
                <svg className="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {selectedReports.length > 0 ? t('reports.exportPdfWithCount', { count: selectedReports.length, defaultValue: `تصدير PDF (${selectedReports.length})` }) : t('reports.exportPdf')}
              </button>
              {selectedReports.length > 0 && (hasPermission('reports_delete') || user?.role === 'admin') && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                  data-testid="bulk-delete-btn"
                  title={t('reports.deleteSelectedCount', { count: selectedReports.length, defaultValue: `حذف ${selectedReports.length} بلاغ محدد` })}
                >
                  <svg className="inline-block w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('reports.deleteSelectedWithCount', { count: selectedReports.length, defaultValue: `حذف المحدد (${selectedReports.length})` })}
                </button>
              )}
            </div>
          </div>
          
          {/* شريط الإشعار فقط عند وجود تحديد */}
          {selectedReports.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200" data-testid="selection-info-bar">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-sm">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-bold text-blue-900">{t('reports.selectedCount', {count: selectedReports.length})}</span>
                  <span className="text-blue-700">— {t('reports.exportSelectedNote', {defaultValue: 'أزرار التصدير أعلاه ستعمل على المحدد فقط'})}</span>
                </div>
                <button
                  onClick={() => setSelectedReports([])}
                  className="text-xs text-blue-700 hover:text-blue-900 underline"
                  data-testid="clear-selection-btn"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
        )}
        
        {totalReports > 0 && (
          <div className="mt-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100">
            {/* اختيار عدد البلاغات في الصفحة */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">{t('reports.reportsPerPage', {defaultValue: 'عدد البلاغات في الصفحة'})}:</label>
              <select
                value={reportsPerPage}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            {/* معلومات الصفحة */}
            <div className="text-sm font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 shadow-sm">
              <span className="text-blue-600">{t('reports.page', {defaultValue: 'صفحة'})}</span> {currentPage} <span className="text-blue-600">{t('reports.of', {defaultValue: 'من'})}</span> {totalPages} 
              <span className="mx-2 text-blue-300">|</span> 
              <span className="text-blue-600">{t('reports.showing', {defaultValue: 'عرض'})}</span> {reports.length} <span className="text-blue-600">{t('reports.reportsOfTotal', {defaultValue: 'بلاغات من إجمالي'})}</span> {totalReports}
            </div>
            
            {/* أزرار التنقل */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {t('common.first', {defaultValue: 'الأولى'})}
              </button>
              
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {t('common.prev')}
              </button>
              
              <div className="flex gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {t('common.next')}
              </button>
              
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {t('common.last')}
              </button>
            </div>
          </div>
        )}
        
      {/* Table Section - Completely Free Layout */}
      <div id="reports-table-section" className="w-full overflow-x-auto">
        <table className="min-w-[1200px] w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-8 py-3 text-center bg-gray-100 border-b border-gray-200">
                <input 
                  type="checkbox" 
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-blue-600 rounded"
                  title="تحديد البلاغات في الصفحة الحالية"
                />
              </th>
                <th className="w-24 px-1 py-4 text-center text-[12px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">🏛️ {t('reports.tableHeaders.governorate')}</th>
                <th className="px-2 py-4 text-center text-[15px] font-black text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">📄 {t('reports.tableHeaders.reportNumber')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">📥 {t('reports.tableHeaders.receiveDate')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">🚀 {t('reports.startDate')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">🎫 {t('reports.tableHeaders.licenseNumber')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">📋 {t('reports.licenseStatus')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">👷 {t('reports.tableHeaders.contractor')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">🔒 {t('reports.tableHeaders.closedDate')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">📊 {t('reports.tableHeaders.status')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">💡 {t('reports.tableHeaders.reportType')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">👤 {t('reports.tableHeaders.createdBy')}</th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">
                  <div className="flex flex-col items-center gap-0.5">
                    <span>⚖️ {t('reports.review')}</span>
                    <span className="text-[9px] font-semibold text-blue-600 normal-case leading-tight">{isRtl ? 'بواسطة مهندس النظام وتحليل البيانات' : 'By System & Data Analysis Engineer'}</span>
                  </div>
                </th>
                <th className="px-2 py-4 text-center text-[14px] font-extrabold text-blue-900 uppercase bg-gray-100 border-b border-r border-gray-200">⚙️</th>
                </tr>
              </thead>
              <tbody className={`bg-white divide-y divide-gray-200 transition-opacity duration-200 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                {reports.length === 0 && loading ? (
                  <tr><td colSpan="14" className="px-6 py-4 text-center text-gray-500"><div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading Data...' : 'جاري تحميل البيانات...'}</span></div></td></tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan="14" className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="text-lg font-semibold text-gray-600">
                          {filters.project ? (
                            <>
                              <p className="text-xl">📭 {t('reports.noReportsProject')}</p>
                              <p className="text-sm text-gray-500 mt-2">{t('reports.project')}: {translateBrandingText(filters.project, isRtl)}</p>
                            </>
                          ) : (
                            <p>{t('reports.noReports')}</p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  reports.map((report, index) => {
                    const isNew = isNewReport(report.review_status);
                    const isLastRows = reports.length > 2 && index >= reports.length - 2;
                    const dropdownPositionClass = isLastRows ? 'bottom-full mb-2 slide-in-from-bottom-2' : 'mt-2 slide-in-from-top-2';
                    const dropdownOriginClass = isRtl 
                      ? (isLastRows ? 'origin-bottom-left left-0' : 'origin-top-left left-0')
                      : (isLastRows ? 'origin-bottom-right right-0' : 'origin-top-right right-0');
                    return (
                  <tr key={report.id} className={`${selectedReports.includes(report.id) ? 'bg-blue-50' : ''} ${isNew ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                    <td className="w-8 py-3 whitespace-nowrap text-center bg-gray-50/50">
                      <input 
                        type="checkbox" 
                        checked={selectedReports.includes(report.id)}
                        onChange={() => toggleSelectReport(report.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-all cursor-pointer"
                      />
                    </td>
                    <td className="w-24 px-1 py-4 whitespace-nowrap border-r border-gray-100 bg-blue-50/30">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`truncate text-[15px] font-black transition-all ${
                            (report.governorate === 'المزاحمية' || report.governorate === 'ضرماء') 
                              ? 'text-blue-600 drop-shadow-sm scale-110' 
                              : 'text-blue-900/60 font-bold'
                          }`}>
                            {translateBrandingText(report.governorate, isRtl)}
                          </span>
                          {isNew && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white animate-pulse">
                              {t('reports.statuses.new', {defaultValue: 'جديد'})}
                            </span>
                          )}
                        </div>
                      </td>
                    <td className="px-2 py-4 whitespace-nowrap text-[17px] text-blue-900 font-black border-r border-gray-100 text-center bg-gray-50/30">
                      {report.report_number ? (report.report_number.startsWith('CCB-') ? report.report_number : (report.report_number.startsWith('CCP-') ? report.report_number.replace('CCP-', 'CCB-') : `CCB-${report.report_number}`)) : '-'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-[15px] border-r border-gray-100 text-center">
                      <div className="flex flex-col items-center justify-center leading-tight">
                        <span className="text-blue-800 font-black">
                          {new Date(report.created_at).toLocaleDateString('en-GB')}
                        </span>
                        <span className="text-[12px] text-blue-600 font-extrabold mt-0.5">
                          {new Date(report.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-[15px] border-r border-gray-100 text-center">
                      {report.start_date ? (
                        <div className="flex flex-col items-center justify-center leading-tight">
                          <span className="text-amber-700 font-black">
                            {new Date(report.start_date).toLocaleDateString('en-GB')}
                          </span>
                          <span className="text-[12px] text-amber-600 font-extrabold mt-0.5">
                            {new Date(report.start_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">{t('reports.notStarted', {defaultValue: 'لم يبدأ'})}</span>
                      )}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-[15px] text-gray-900 font-extrabold border-r border-gray-100 text-center">
                      {report.license_number ? t(`statusMap.${report.license_number}`, {defaultValue: report.license_number}) : '-'}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center border-r border-gray-100">
                      {(() => {
                        const ln = report.license_number ? report.license_number.toString().trim() : '';
                        
                        // تحقق ديناميكي: هل الرخصة غير صالحة؟ (تحتوي على أحرف عربية، فارغة، أو مجرد شرطة/أصفار)
                        const hasArabic = /[\u0600-\u06FF]/.test(ln);
                        const isEmptyOrDash = !ln || ln === '-' || ln === '0' || ln.toLowerCase() === 'none' || ln.toLowerCase() === 'null' || ln.toLowerCase() === 'nan';
                        const isNoLicense = isEmptyOrDash || hasArabic || (!/[0-9]/.test(ln) && ln.length < 5);
                        
                        // تحديد النص والألوان بناءً على حالة الرخصة وحالة الإغلاق
                        let statusText = '';
                        let colorClass = '';
                        
                        if (isNoLicense) {
                          statusText = report.wfm_closed 
                            ? t('statusMap.رخصة غير صادرة', {defaultValue: 'رخصة غير صادرة'}) 
                            : t('statusMap.قيد المعالجة', {defaultValue: 'قيد المعالجة'});
                            
                          colorClass = report.wfm_closed
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-slate-800 text-white border-slate-900';
                        } else {
                          statusText = report.wfm_closed 
                            ? t('statusMap.مغلقة بواسطة الاستشاري', {defaultValue: 'مغلقة بواسطة الاستشاري'}) 
                            : t('statusMap.قيد المعالجة', {defaultValue: 'قيد المعالجة'});
                            
                          colorClass = report.wfm_closed
                            ? 'bg-green-700 text-white border-green-800'
                            : 'bg-slate-800 text-white border-slate-900';
                        }

                        const canToggle = user?.role === 'admin' || hasReportPermission(report, 'consultant_close');

                        return (
                          <div 
                            className={`flex flex-col items-center gap-0.5 ${canToggle ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                            onClick={(e) => {
                              if (canToggle) {
                                e.stopPropagation();
                                handleToggleWFMClosed(report.id, report.wfm_closed);
                              }
                            }}
                            title={canToggle ? t('statusMap.اضغط لتغيير الحالة', {defaultValue: 'اضغط لتغيير الحالة'}) : ''}
                          >
                            <span className={`px-2 py-0.5 text-[14px] font-black rounded-full border shadow-sm ${colorClass}`}>
                              {statusText}
                            </span>
                            {report.wfm_closed && (
                              <span className="text-[11px] font-black text-green-700 opacity-80 mt-0.5 block text-center" title={translateBrandingText('م/ مدحت حسين محمد', isRtl)}>
                                {translateBrandingText('م/ مدحت حسين محمد', isRtl)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap border-r border-gray-100">
                      <div className="flex flex-col">
                        <span className="font-black text-blue-900 text-[15px] leading-tight">{report.contractor ? translateBrandingText(report.contractor, isRtl) : t('statusMap.غير محدد')}</span>
                        <span className="text-[11px] text-gray-600 font-extrabold flex items-center gap-1">
                          📁 {translateBrandingText(report.project, isRtl)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center border-r border-gray-100">
                      {report.closed_at ? (
                        <div className="flex flex-col items-center justify-center leading-tight">
                          <span className="text-green-700 font-black text-[14px]">
                            {new Date(report.closed_at).toLocaleDateString('en-GB')}
                          </span>
                          <span className="text-[12px] text-green-600 font-extrabold mt-0.5">
                            {new Date(report.closed_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[14px]">-</span>
                      )}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center border-r border-gray-100">
                      {(() => {
                        const s = report.status || '';
                        let colorClass = 'bg-gray-100 text-gray-800 border-gray-200';
                        if (s.includes('تم الإصلاح') && !s.includes('متبقي')) colorClass = 'bg-green-100 text-green-700 border-green-200';
                        else if (s.includes('متبقي الأسفلت') || s.includes('متبقي')) colorClass = 'bg-red-100 text-red-700 border-red-200';
                        else if (s.includes('تحت التنفيذ') || s.includes('قيد المعالجة') || s.includes('جاري العمل')) colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
                        else if (s.includes('معلق') || s.includes('متوقف')) colorClass = 'bg-red-100 text-red-700 border-red-200';
                        
                        return (
                          <span className={`px-3 py-1.5 text-[13px] font-black rounded-full border ${colorClass}`}>
                            {t(`statusMap.${s}`, s)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-[14px] text-gray-900 font-black border-r border-gray-100 text-center">{t(`statusMap.${report.report_type}`, report.report_type)}</td>
                    <td className="px-2 py-4 whitespace-nowrap text-[14px] border-r border-gray-100 text-center">
                      <span className="font-black text-gray-800">{translateBrandingText(report.created_by_name, isRtl) || t('statusMap.غير معروف')}</span>
                    </td>
                    <td className="px-2 py-4 whitespace-nowrap text-center border-r border-gray-100">
                      <button
                        onClick={() => handleReviewToggle(report.id, report.review_status)}
                        className={`px-3 py-1 rounded-xl text-[13px] font-black cursor-pointer transition-all border flex flex-col items-center justify-center mx-auto min-w-[110px] ${
                          report.review_status === 'تمت المراجعة'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-800 text-white border-slate-900 shadow-sm'
                        }`}
                      >
                        <span>{report.review_status === 'تمت المراجعة' ? t('statusMap.تمت المراجعة') : t('statusMap.قيد المراجعة')}</span>
                        {report.reviewed_by_name && (
                          <span className="text-[11px] opacity-80 mt-0.5 block text-center" title={translateBrandingText(report.reviewed_by_name, isRtl)}>
                            {translateBrandingText(report.reviewed_by_name, isRtl)}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-4 whitespace-nowrap text-center relative overflow-visible">
                      <div className="inline-block text-right overflow-visible dropdown-container">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeDropdown === report.id) {
                              setActiveDropdown(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              let leftPos = isRtl ? rect.left : rect.right - 224;
                              leftPos = Math.max(10, Math.min(leftPos, window.innerWidth - 234));
                              setDropdownPos({
                                top: rect.bottom + 5,
                                left: leftPos
                              });
                              setActiveDropdown(report.id);
                            }
                          }}
                          className="relative p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors focus:outline-none"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                          {report.notes && report.notes.trim() !== '' && (
                            <span className="absolute -top-1 -right-1 text-orange-500 animate-bounce" title="يوجد ملاحظات">
                              <svg className="w-4 h-4 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                              </svg>
                            </span>
                          )}
                        </button>

                          {activeDropdown === report.id && (
                            <div 
                              className={`fixed w-56 rounded-xl shadow-2xl bg-white border border-gray-200 z-[9999] divide-y divide-gray-100 overflow-hidden animate-in fade-in duration-200`}
                              style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}
                            >
                              <div className="py-1">
                                <button 
                                  onClick={() => {
                                    if (reportImages[report.id]) {
                                      viewImages(reportImages[report.id], report);
                                    } else {
                                      fetchReportImages(report);
                                    }
                                    setActiveDropdown(null);
                                  }} 
                                  className={`group flex items-center px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                >
                                  <svg className={`h-5 w-5 text-emerald-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  {t('reports.actions.viewImages')} {reportImages[report.id] && `(${reportImages[report.id].length})`}
                                </button>
                                
                                <button 
                                  onClick={() => {
                                    setCurrentNotes(report.notes || 'لا توجد ملاحظات');
                                    setShowNotesModal(true);
                                    setActiveDropdown(null);
                                  }} 
                                  className={`group flex items-center px-4 py-3 text-sm text-purple-700 hover:bg-purple-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                >
                                  <svg className={`h-5 w-5 text-purple-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                  </svg>
                                  {t('reports.actions.viewNotes')}
                                </button>
                                
                                {/* خيار ملاحظات المالك */}
                                {hasReportPermission(report, 'owner_notes') && (
                                  <button 
                                    onClick={() => {
                                      setSelectedOwnerReportId(report.id);
                                      setCurrentOwnerNote('');
                                      setShowOwnerNoteModal(true);
                                      setActiveDropdown(null);
                                    }} 
                                    className={`group flex items-center px-4 py-3 text-sm text-amber-700 hover:bg-amber-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                  >
                                    <svg className={`h-5 w-5 text-amber-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('ownerNoteModal.titleBtn', { defaultValue: 'ملاحظة المالك على البلاغ' })}
                                  </button>
                                )}
                                
                                {/* خيار ملاحظات الاستشاري */}
                                {hasReportPermission(report, 'consultant_notes') && 
                                  (user?.role === 'admin' || (user?.can_create_subusers && user?.has_sub_users)) && (
                                  <button 
                                    onClick={() => {
                                      setSelectedConsultantReportId(report.id);
                                      setCurrentConsultantNote(report.consultant_note || '');
                                      setConsultantReplyText('');
                                      setShowConsultantReplyBox(!report.consultant_note_processed);
                                      setShowConsultantNoteModal(true);
                                      setActiveDropdown(null);
                                    }} 
                                    className={`group flex items-center px-4 py-3 text-sm text-teal-700 hover:bg-teal-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                  >
                                    <svg className={`h-5 w-5 text-teal-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('consultantNoteModal.title', { defaultValue: 'ملاحظات الاستشاري' })}
                                  </button>
                                )}
                              </div>

                              <div className="py-1">
                                {hasPermission('reports_edit') && (
                                  <button 
                                    onClick={() => {
                                      navigate(`/reports/edit/${report.id}`, { 
                                        state: { 
                                          from: location.pathname + location.search,
                                          project: report.project || '',
                                          governorate: report.governorate || ''
                                        } 
                                      });
                                      setActiveDropdown(null);
                                    }} 
                                    className={`group flex items-center px-4 py-3 text-sm text-blue-700 hover:bg-blue-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                  >
                                    <svg className={`h-5 w-5 text-blue-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('reports.actions.edit')}
                                  </button>
                                )}
                              </div>
                              <div className="py-1">
                                {hasPermission('reports_delete') && (
                                  <button 
                                    onClick={() => {
                                      handleDelete(report.id);
                                      setActiveDropdown(null);
                                    }} 
                                    className={`group flex items-center px-4 py-3 text-sm text-red-700 hover:bg-red-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                  >
                                    <svg className={`h-5 w-5 text-red-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {t('reports.actions.delete')}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* شريط الصفحات في الأسفل أيضاً */}
          {totalReports > 0 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-gray-50/50 rounded-xl border border-gray-100">
              {/* اختيار عدد البلاغات في الصفحة */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">{t('reports.reportsPerPage', {defaultValue: 'عدد البلاغات في الصفحة'})}:</label>
                <select
                  value={reportsPerPage}
                  onChange={(e) => handleLimitChange(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              {/* معلومات الصفحة */}
              <div className="text-sm font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 shadow-sm">
                <span className="text-blue-600">{t('reports.page', {defaultValue: 'صفحة'})}</span> {currentPage} <span className="text-blue-600">{t('reports.of', {defaultValue: 'من'})}</span> {totalPages} 
                <span className="mx-2 text-blue-300">|</span> 
                <span className="text-blue-600">{t('reports.showing', {defaultValue: 'عرض'})}</span> {reports.length} <span className="text-blue-600">{t('reports.reportsOfTotal', {defaultValue: 'بلاغات من إجمالي'})}</span> {totalReports}
              </div>
              
              {/* أزرار التنقل */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t('common.first', {defaultValue: 'الأولى'})}
                </button>
                
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t('common.prev', {defaultValue: 'السابق'})}
                </button>
                
                <div className="flex gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t('common.next', {defaultValue: 'التالي'})}
                </button>
                
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {t('common.last', {defaultValue: 'الأخيرة'})}
                </button>
              </div>
            </div>
          )}
        </div>

      
      {/* نافذة عرض الصور - تصميم محسّن */}
      {showImagesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowImagesModal(false)}>
          <div className="bg-blue-50 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{t('reports.imagesModal.mediaTitle', {defaultValue: 'الوسائط (صور وفيديو)'})}</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{selectedImages.length}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleDownloadImagesAsPdf}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">{t('reports.imagesModal.downloadPdf', {defaultValue: 'تحميل الصور PDF'})}</span>
                </button>
                {selectedForDownload.length > 0 && (
                  <button 
                    onClick={async () => {
                      const filesToDownload = selectedImages.filter((_, idx) => selectedForDownload.includes(idx));
                      toast.info(`📥 ${t('reports.imagesModal.downloading', {defaultValue: 'جاري تحميل'})} ${filesToDownload.length} ${t('reports.imagesModal.files', {defaultValue: 'ملف...'})}`);
                      if ('showDirectoryPicker' in window) {
                        try {
                          const rootDirHandle = await window.showDirectoryPicker({ id: 'reports_media', mode: 'readwrite', startIn: 'downloads' });
                          const rn = selectedReportForMedia?.report_number ? String(selectedReportForMedia.report_number).trim() : '';
                          const ln = selectedReportForMedia?.license_number ? String(selectedReportForMedia.license_number).trim() : '';
                          const isValidLicense = ln && ln !== '-' && ln !== '0' && ln.toLowerCase() !== 'none' && ln.toLowerCase() !== 'null' && ln.toLowerCase() !== 'nan';
                          const isAutoGenerated = rn.startsWith('CCB-R-') || rn.startsWith('SYS') || rn === '';
                          const rawFolderName = (!isAutoGenerated && rn) ? rn : (isValidLicense ? ln : rn) || selectedReportForMedia?.id || 'Report';
                          const targetFolderName = String(rawFolderName).replace(/[<>:"/\\|?*]/g, '-');
                          
                          let dirHandle = null;
                          
                          if (rootDirHandle.name.includes(targetFolderName)) {
                            // User selected the exact report folder directly
                            dirHandle = rootDirHandle;
                          } else {
                            // User selected a parent folder, search inside it for a matching subfolder
                            for await (const entry of rootDirHandle.values()) {
                              if (entry.kind === 'directory' && entry.name.includes(targetFolderName)) {
                                dirHandle = await rootDirHandle.getDirectoryHandle(entry.name);
                                break;
                              }
                            }
                          }
                          
                          if (!dirHandle) {
                            // Not found, create it
                            dirHandle = await rootDirHandle.getDirectoryHandle(targetFolderName, { create: true });
                          }
                          
                          let maxIndex = 0;
                          for await (const entry of dirHandle.values()) {
                            if (entry.kind === 'file') {
                              const match = entry.name.match(/media(?:_selected)?(?:_\d+)?_(\d+)/) || entry.name.match(/media_(\d+)/);
                              if (match) {
                                maxIndex = Math.max(maxIndex, parseInt(match[1]));
                              }
                            }
                          }

                          for (let i = 0; i < filesToDownload.length; i++) {
                            const imgData = filesToDownload[i];
                            const url = resolveImageUrl(imgData);
                            const response = await fetch(url);
                            const blob = await response.blob();
                            const extension = isVideo(imgData) ? 'webm' : 'jpg';
                            const name = `media_${maxIndex + i + 1}.${extension}`;
                            const fileHandle = await dirHandle.getFileHandle(name, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(blob);
                            await writable.close();
                          }
                          toast.success(`✅ ${t('reports.imagesModal.downloadSuccess', {defaultValue: 'تم تحميل'})} ${filesToDownload.length} ${t('reports.imagesModal.filesSuccessfully', {defaultValue: 'ملف بنجاح في مجلد'})} ${dirHandle.name}`);
                          setSelectedForDownload([]); // Clear selection after download
                          return;
                        } catch (e) {
                          if (e.name === 'AbortError') return;
                          toast.error(t('common.error', {defaultValue: 'حدث خطأ أثناء حفظ الملفات'}) + (e.message ? `: ${e.message}` : ''));
                          return; // منع النزول للطريقة البديلة إذا حدث خطأ هنا
                        }
                      }
                      for (let i = 0; i < filesToDownload.length; i++) {
                        await downloadImage(filesToDownload[i], i);
                        await new Promise(resolve => setTimeout(resolve, 300));
                      }
                      toast.success(`✅ ${t('reports.imagesModal.downloadSuccess', {defaultValue: 'تم تحميل'})} ${filesToDownload.length} ${isRtl ? 'ملف محدد بنجاح' : 'selected files successfully'}`);
                      setSelectedForDownload([]);
                    }}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm transition-colors"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="hidden sm:inline">{isRtl ? 'تحميل المحدد' : 'Download Selected'} ({selectedForDownload.length})</span>
                  </button>
                )}
                <button 
                  onClick={async () => {
                    toast.info(`📥 ${t('reports.imagesModal.downloading', {defaultValue: 'جارِ تحميل'})} ${selectedImages.length} ${t('reports.imagesModal.files', {defaultValue: 'ملف...'})}`);
                    if ('showDirectoryPicker' in window) {
                      try {
                        // Ask user to pick the root directory
                        const rootDirHandle = await window.showDirectoryPicker({ id: 'reports_media', mode: 'readwrite', startIn: 'downloads' });
                        const rn = selectedReportForMedia?.report_number ? String(selectedReportForMedia.report_number).trim() : '';
                        const ln = selectedReportForMedia?.license_number ? String(selectedReportForMedia.license_number).trim() : '';
                        const isValidLicense = ln && ln !== '-' && ln !== '0' && ln.toLowerCase() !== 'none' && ln.toLowerCase() !== 'null' && ln.toLowerCase() !== 'nan';
                        const isAutoGenerated = rn.startsWith('CCB-R-') || rn.startsWith('SYS') || rn === '';
                        const rawFolderName = (!isAutoGenerated && rn) ? rn : (isValidLicense ? ln : rn) || selectedReportForMedia?.id || 'Report';
                        const targetFolderName = String(rawFolderName).replace(/[<>:"/\\|?*]/g, '-');
                        
                        let dirHandle = null;
                        
                        if (rootDirHandle.name.includes(targetFolderName)) {
                          // User selected the exact report folder directly
                          dirHandle = rootDirHandle;
                        } else {
                          // User selected a parent folder, search inside it for a matching subfolder
                          for await (const entry of rootDirHandle.values()) {
                            if (entry.kind === 'directory' && entry.name.includes(targetFolderName)) {
                              dirHandle = await rootDirHandle.getDirectoryHandle(entry.name);
                              break;
                            }
                          }
                        }
                        
                        if (!dirHandle) {
                          // Not found, create it
                          dirHandle = await rootDirHandle.getDirectoryHandle(targetFolderName, { create: true });
                        }
                        
                        let maxIndex = 0;
                        let existingFilesCount = 0;
                        for await (const entry of dirHandle.values()) {
                          if (entry.kind === 'file') {
                            const match = entry.name.match(/media(?:_selected)?(?:_\d+)?_(\d+)/) || entry.name.match(/media_(\d+)/);
                            if (match) {
                              maxIndex = Math.max(maxIndex, parseInt(match[1]));
                              existingFilesCount++;
                            }
                          }
                        }

                        let downloadedCount = 0;
                        // نتجاهل الصور التي تم تحميلها سابقاً بناءً على عدد الملفات الموجودة
                        const startIndex = existingFilesCount; // استخدام عدد الملفات كبداية (أو maxIndex)

                        for (let i = startIndex; i < selectedImages.length; i++) {
                          const imgData = selectedImages[i];
                          const url = resolveImageUrl(imgData);
                          const response = await fetch(url);
                          const blob = await response.blob();
                          const extension = isVideo(imgData) ? 'webm' : 'jpg';
                          const name = `media_${i + 1}.${extension}`;
                          const fileHandle = await dirHandle.getFileHandle(name, { create: true });
                          const writable = await fileHandle.createWritable();
                          await writable.write(blob);
                          await writable.close();
                          downloadedCount++;
                        }
                        
                        if (downloadedCount === 0) {
                          toast.info(`📁 جميع الملفات (${selectedImages.length}) موجودة مسبقاً في المجلد ${dirHandle.name}`);
                        } else {
                          toast.success(`✅ تم تحديث المجلد: تحميل ${downloadedCount} ملف جديد بنجاح في ${dirHandle.name}`);
                        }
                        return;
                      } catch (e) {
                        if (e.name === 'AbortError') return;
                        toast.error(`حدث خطأ أثناء حفظ الملفات: ${e.message || ''}`);
                        return; // منع النزول للطريقة البديلة إذا حدث خطأ هنا
                      }
                    }
                    // Fallback for browsers that don't support showDirectoryPicker (like Safari/Firefox)
                    for (let i = 0; i < selectedImages.length; i++) {
                      await downloadImage(selectedImages[i], i);
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    toast.success(`✅ ${t('reports.imagesModal.downloadSuccess', {defaultValue: 'تم تحميل'})} ${selectedImages.length} ${t('reports.imagesModal.filesSuccessfully', {defaultValue: 'ملف بنجاح'})}`);
                  }}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">{t('reports.imagesModal.downloadAll', {defaultValue: 'تحميل الكل'})}</span>
                </button>
                <button onClick={() => setShowImagesModal(false)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-70px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {selectedImages.map((img, index) => (
                  <div key={index} className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow relative border-2 ${selectedForDownload.includes(index) ? 'border-yellow-400 shadow-yellow-200' : 'border-transparent'}`}>
                    {/* Checkbox للتحديد */}
                    <div className="absolute top-2 left-2 z-10">
                      <label className="flex items-center cursor-pointer bg-white/80 p-1 rounded-lg backdrop-blur-sm shadow-sm hover:bg-white transition-colors" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 text-yellow-500 rounded border-gray-300 focus:ring-yellow-500 cursor-pointer"
                          checked={selectedForDownload.includes(index)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedForDownload(prev => [...prev, index]);
                            } else {
                              setSelectedForDownload(prev => prev.filter(i => i !== index));
                            }
                          }}
                        />
                      </label>
                    </div>
                    {/* الصورة مع أيقونة العين */}
                    <div 
                      className="relative aspect-square cursor-pointer group" 
                      onClick={() => setFullscreenImage(img)}
                    >
                      {isVideo(img) ? (
                        <video src={resolveImageUrl(img)} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={resolveImageUrl(img)} alt={`${t('reports.imagesModal.image', {defaultValue: 'صورة'})} ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      )}
                      {isVideo(img) && (
                        <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        </div>
                      )}
                      {/* أيقونة العين للتكبير */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* معلومات الصورة */}
                    <div className="p-2 sm:p-3 bg-blue-100/50 flex items-center justify-between">
                      <p className="text-xs sm:text-sm font-semibold text-blue-800">{t('reports.imagesModal.attachment', {defaultValue: 'مرفق'})} {index + 1}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadImage(img, index); }}
                        className="p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title={t('reports.imagesModal.downloadImage', {defaultValue: 'تحميل الصورة'})}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الصورة المكبرة (Fullscreen) */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4"
          onClick={() => setFullscreenImage(null)}
        >
          {(() => {
            const currentIndex = selectedImages.findIndex(img => img === fullscreenImage);
            const hasNext = currentIndex !== -1 && currentIndex < selectedImages.length - 1;
            const hasPrev = currentIndex > 0;

            const handleNext = (e) => {
              e.stopPropagation();
              if (hasNext) setFullscreenImage(selectedImages[currentIndex + 1]);
            };

            const handlePrev = (e) => {
              e.stopPropagation();
              if (hasPrev) setFullscreenImage(selectedImages[currentIndex - 1]);
            };

            return (
              <>
                {/* زر السابق (يمين في العربية، يسار في الإنجليزية) */}
                {hasPrev && (
                  <button 
                    onClick={handlePrev}
                    className={`absolute ${isRtl ? 'right-4 sm:right-8' : 'left-4 sm:left-8'} top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-black/60 hover:bg-blue-600 rounded-full transition-all transform hover:scale-110 z-[70] text-white backdrop-blur-md border-2 border-white/30 shadow-2xl`}
                    title={t('reports.imagesModal.prev', {defaultValue: 'السابق'})}
                  >
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isRtl ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                    </svg>
                  </button>
                )}
                
                {/* زر التالي (يسار في العربية، يمين في الإنجليزية) */}
                {hasNext && (
                  <button 
                    onClick={handleNext}
                    className={`absolute ${isRtl ? 'left-4 sm:left-8' : 'right-4 sm:right-8'} top-1/2 -translate-y-1/2 p-3 sm:p-4 bg-black/60 hover:bg-blue-600 rounded-full transition-all transform hover:scale-110 z-[70] text-white backdrop-blur-md border-2 border-white/30 shadow-2xl`}
                    title={t('reports.imagesModal.next', {defaultValue: 'التالي'})}
                  >
                    <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={isRtl ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                    </svg>
                  </button>
                )}

                <div className="relative z-[60] w-full h-full flex items-center justify-center pointer-events-none px-16">
                  {isVideo(fullscreenImage) ? (
                    <video 
                      src={resolveImageUrl(fullscreenImage)} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto"
                      controls
                      autoPlay
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <img 
                      src={resolveImageUrl(fullscreenImage)} 
                      alt={t('reports.imagesModal.enlargedImage', {defaultValue: 'صورة مكبرة'})} 
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl pointer-events-auto select-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </>
            );
          })()}
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            onClick={(e) => { 
              e.stopPropagation(); 
              downloadImage(fullscreenImage, 0); 
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {t('reports.imagesModal.download', {defaultValue: 'تحميل'})}
          </button>
        </div>
      )}

      
      {/* Modal ملاحظات الاستشاري */}
      {showConsultantNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowConsultantNoteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-teal-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('consultantNoteModal.title', { defaultValue: 'ملاحظات الاستشاري' })}
                {(() => {
                  const r = reports.find(r => r.id === selectedConsultantReportId);
                  if (!r || !r.consultant_note || !r.consultant_note.trim()) return null;
                  return (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleProcess();
                      }}
                      title="تغيير حالة الملاحظة"
                      className={`text-xs px-3 py-1.5 rounded-full mr-2 flex items-center gap-1.5 font-bold transition-colors border hover:shadow-sm cursor-pointer ${
                        r.consultant_note_processed 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {r.consultant_note_processed ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      {r.consultant_note_processed 
                        ? t('consultantNoteModal.processed', { defaultValue: 'تمت المعالجة' }) 
                        : t('consultantNoteModal.underProcessing', { defaultValue: 'قيد المعالجة' })}
                    </button>
                  );
                })()}
              </h3>
              <button
                onClick={() => setShowConsultantNoteModal(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('consultantNoteModal.writeNoteLabel', { defaultValue: 'اكتب الملاحظة هنا:' })}</label>
              <textarea
                value={currentConsultantNote}
                onChange={(e) => setCurrentConsultantNote(e.target.value)}
                placeholder={t('consultantNoteModal.writeNotePlaceholder', { defaultValue: 'اكتب ملاحظات الاستشاري...' })}
                className={`w-full h-40 p-4 border border-gray-300 rounded-xl resize-none transition-all ${reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_processed ? 'bg-gray-50 text-gray-600 focus:ring-0 cursor-not-allowed' : 'focus:ring-2 focus:ring-teal-500 focus:border-teal-500'}`}
                dir="auto"
                disabled={reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_processed || !hasReportPermission({ project: reports.find(r => r.id === selectedConsultantReportId)?.project }, 'consultant_notes')}
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">{t('consultantNoteModal.helpText', { defaultValue: 'يمكنك تعديل أو حذف الملاحظة عن طريق مسح النص وحفظه.' })}</p>
            </div>
            
            {reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_reply && (
              <div className="mb-5 flex flex-col gap-4">
                <div className="text-sm font-bold text-gray-700 border-b pb-1">{t('consultantNoteModal.previousReplies', { defaultValue: 'الردود السابقة:' })}</div>
                {(() => {
                  const r = reports.find(rep => rep.id === selectedConsultantReportId);
                  const replyText = r.consultant_note_reply;
                  
                  if (!replyText.includes('---رد:') && !replyText.includes('--- إضافة جديدة ---')) {
                    return (
                      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 mt-3 shadow-sm">
                        <div className="font-bold mb-2 opacity-90 text-[12px]">
                          {t('consultantNoteModal.replyPrefix', { defaultValue: 'رد:' })} {(() => {
                            const name = r.consultant_note_replied_by;
                            if (!name) return t('consultantNoteModal.level3', { defaultValue: 'المستوى الثالث' });
                            const lowerName = name.toLowerCase();
                            if (lowerName.includes('shazly') || lowerName.includes('شاذلي')) {
                              return t('consultantNoteModal.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                            }
                            if (lowerName.includes('motlaq') || lowerName.includes('مطلق')) {
                              return t('consultantNoteModal.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                            }
                            if (lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('استشاري')) {
                              return t('consultantNoteModal.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                            }
                            return translateBrandingText(name, isRtl);
                          })()}
                        </div>
                        <div className="whitespace-pre-wrap break-words leading-relaxed">
                          {translateBrandingText(replyText, isRtl)}
                        </div>
                      </div>
                    );
                  }
                  // Convert legacy delimiters to the new format sequentially
                  let currentText = replyText;
                  if (currentText.includes('--- إضافة جديدة ---')) {
                    const legacyParts = currentText.split(/---\s*إضافة جديدة\s*---/);
                    const lastIndex = legacyParts.length - 1;
                    currentText = legacyParts.map((part, index) => {
                      if (index === 0) return part;
                      const author = index === lastIndex ? (r.consultant_note_replied_by || t('consultantNoteModal.level3', { defaultValue: 'المستوى الثالث' })) : t('consultantNoteModal.motlaqAlGhamdi', { defaultValue: 'مطلق الغامدي' });
                      return `---رد: ${author}---${part}`;
                    }).join('');
                  }
                  
                  const parts = currentText.split(/---رد:\s*(.*?)---/);
                  const bubbles = [];
                  
                  if (parts[0].trim()) {
                    const firstAuthor = parts.length > 1 && replyText.includes('--- إضافة جديدة ---') 
                      ? t('consultantNoteModal.motlaqAlGhamdi', { defaultValue: 'مطلق الغامدي' }) 
                      : (r.consultant_note_replied_by || t('consultantNoteModal.level3', { defaultValue: 'المستوى الثالث' }));
                    bubbles.push({ name: firstAuthor, text: parts[0].trim() });
                  }
                  
                  for (let i = 1; i < parts.length; i += 2) {
                    if (parts[i] && parts[i+1] && parts[i+1].trim()) {
                      bubbles.push({ name: parts[i].trim(), text: parts[i+1].trim() });
                    }
                  }
                  
                  return bubbles.map((b, i) => {
                    let bubbleName = b.name;
                    const lowerName = bubbleName.toLowerCase();
                    const isShazly = lowerName.includes('shazly') || lowerName.includes('شاذلي');
                    const isMotlaq = lowerName.includes('motlaq') || lowerName.includes('مطلق');
                    const isConsultant = lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('الاستشاري');
                    
                    if (isShazly) {
                      bubbleName = t('consultantNoteModal.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                    } else if (isMotlaq) {
                      bubbleName = t('consultantNoteModal.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                    } else if (isConsultant) {
                      bubbleName = t('consultantNoteModal.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                    } else {
                      bubbleName = translateBrandingText(bubbleName, isRtl);
                    }
                    
                    let bgClass = 'bg-indigo-50 border-indigo-200 text-indigo-900';
                    let badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
                    let prefixText = t('consultantNoteModal.employeeReply', { defaultValue: 'رد الموظف:' });
                    
                    if (isMotlaq) {
                      bgClass = 'bg-purple-50 border-purple-200 text-purple-900';
                      badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                    } else if (isConsultant || isShazly) {
                      bgClass = 'bg-yellow-50 border-yellow-200 text-yellow-900';
                      badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                      prefixText = t('consultantNoteModal.consultantFollowUp', { defaultValue: 'تعقيب الاستشاري:' });
                    }
                    
                    return (
                      <div key={i} className={`rounded-xl border p-4 text-sm mt-3 shadow-sm ${bgClass}`}>
                        <div className="font-bold mb-2 opacity-90 text-[12px] flex justify-between items-center">
                          <span>{prefixText} {bubbleName}</span>
                          {(!r.consultant_note_processed && (user?.full_name === b.name || user?.username === b.name || (b.name === 'المستوى الثالث' && !user?.full_name && !user?.username) || (b.name && user?.username?.toLowerCase().includes('medhat') && b.name.toLowerCase().includes('medhat')))) && (
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingBubbleIndex(i); setEditingBubbleText(b.text); }} className="text-blue-600 hover:text-blue-800 transition-colors bg-white px-2 py-0.5 rounded shadow-sm border border-blue-200">{t("common.edit", { defaultValue: "تعديل" })}</button>
                              <button onClick={() => {
                                if(!window.confirm(t("consultantNotesPage.confirmDeleteReply", { defaultValue: "هل أنت متأكد من حذف ردك؟" }))) return;
                                const newBubbles = bubbles.filter((_, idx) => idx !== i);
                                const newStr = newBubbles.map(bub => `---رد: ${bub.name}---\n${bub.text}`).join('\n\n');
                                updateConsultantReplyString(newStr);
                              }} className="text-red-600 hover:text-red-800 transition-colors bg-white px-2 py-0.5 rounded shadow-sm border border-red-200">{t("common.delete", { defaultValue: "حذف" })}</button>
                            </div>
                          )}
                        </div>
                        {editingBubbleIndex === i ? (
                          <div className="mt-2">
                            <textarea className="w-full p-2 border rounded-md" value={editingBubbleText} onChange={e => setEditingBubbleText(e.target.value)}></textarea>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => {
                                const newBubbles = [...bubbles];
                                newBubbles[i].text = editingBubbleText;
                                const newStr = newBubbles.map(bub => `---رد: ${bub.name}---\n${bub.text}`).join('\n\n');
                                updateConsultantReplyString(newStr);
                              }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 shadow-sm border border-blue-600">{t("common.saveEdit", { defaultValue: "حفظ التعديل" })}</button>
                              <button onClick={() => setEditingBubbleIndex(null)} className="bg-white text-gray-700 px-3 py-1 rounded text-xs font-bold hover:bg-gray-50 shadow-sm border border-gray-300">{t("common.cancel", { defaultValue: "إلغاء" })}</button>
                            </div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {translateBrandingText(b.text, isRtl)}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            
            {reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_processed ? (
              <div className="mb-5 p-5 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold text-gray-500 flex flex-col items-center justify-center gap-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {t('consultantNotesPage.conversationClosed', { defaultValue: 'المحادثة مغلقة' })}
              </div>
            ) : showConsultantReplyBox && (
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('consultantNoteModal.additionalReplyLabel', { defaultValue: 'تعقيب الاستشاري (إضافي):' })}</label>
                <textarea
                  value={consultantReplyText}
                  onChange={(e) => setConsultantReplyText(e.target.value)}
                  placeholder={t('consultantNoteModal.writeReplyPlaceholder', { defaultValue: 'اكتب ردك أو تعقيبك هنا...' })}
                  className="w-full h-32 p-4 border border-teal-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all bg-teal-50"
                  dir="auto"
                ></textarea>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConsultantNoteModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition-colors"
              >
                {t('consultantNoteModal.cancel', { defaultValue: 'إلغاء' })}
              </button>
              {!reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_processed && (
                <>
                  {reports.find(r => r.id === selectedConsultantReportId)?.consultant_note && !showConsultantReplyBox && (
                    <button
                      onClick={() => setShowConsultantReplyBox(true)}
                      className="px-5 py-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      {t('consultantNoteModal.replyButton', { defaultValue: 'رد' })}
                    </button>
                  )}
                  {reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_reply && (
                    <button
                      onClick={handleDeleteReply}
                      className="px-5 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('consultantNoteModal.deleteReply', { defaultValue: 'حذف الرد' })}
                    </button>
                  )}
              {reports.find(r => r.id === selectedConsultantReportId)?.consultant_note && 
               hasReportPermission(reports.find(r => r.id === selectedConsultantReportId), 'consultant_notes') && 
               (reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_by === user?.username || reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_by === user?.full_name || (!reports.find(r => r.id === selectedConsultantReportId)?.consultant_note_by && (user?.username?.toLowerCase().includes('medhat') || user?.full_name?.includes('مدحت')))) && (
                <button
                  onClick={handlePermanentDeleteNote}
                  disabled={isSavingConsultantNote}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {t('consultantNoteModal.permanentDelete', { defaultValue: 'حذف نهائي' })}
                </button>
              )}
              <button
                onClick={handleSaveConsultantNote}
                disabled={isSavingConsultantNote}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingConsultantNote ? t('consultantNoteModal.saving', { defaultValue: 'جاري الحفظ...' }) : t('consultantNoteModal.saveAndSend', { defaultValue: 'حفظ وإرسال' })}
              </button>
              </>)}
            </div>
          </div>
        </div>
      )}

{/* Modal الملاحظات */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowNotesModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">📝 {t('reports.notesModal.title', {defaultValue: 'الملاحظات'})}</h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {currentNotes || t('reports.notesModal.empty', {defaultValue: 'لا توجد ملاحظات'})}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowNotesModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t('common.close', {defaultValue: 'إغلاق'})}
              </button>
            </div>
          </div>
        </div>
      )}


      {showOwnerNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowOwnerNoteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('ownerNoteModal.title', { defaultValue: 'إضافة ملاحظة المالك' })}
              </h3>
              <button
                onClick={() => setShowOwnerNoteModal(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('ownerNoteModal.writeNoteLabel', { defaultValue: 'اكتب الملاحظة (سيتم إضافتها لملاحظات البلاغ):' })}</label>
              <textarea
                value={currentOwnerNote}
                onChange={(e) => setCurrentOwnerNote(e.target.value)}
                placeholder={t('ownerNoteModal.writeNotePlaceholder', { defaultValue: 'اكتب ملاحظة على البلاغ...' })}
                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all"
                dir="auto"
              ></textarea>
            </div>
            
            <div className={`flex justify-end gap-3 pt-3 border-t mt-5`}>
              <button
                onClick={() => setShowOwnerNoteModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
              >
                {t('common.cancel', { defaultValue: 'إلغاء' })}
              </button>
              <button
                onClick={handleSaveOwnerNote}
                disabled={isSavingOwnerNote || !currentOwnerNote.trim()}
                className="px-5 py-2.5 text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {isSavingOwnerNote ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('ownerNoteModal.sending', { defaultValue: 'جاري الإرسال...' })}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('ownerNoteModal.sendBtn', { defaultValue: 'إرسال الملاحظة' })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
}

export default Reports;


