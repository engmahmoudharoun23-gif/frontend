import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { PROJECT_GOVERNORATES as BASE_PROJECT_GOVERNORATES } from '../utils/projectGovernoratesMap';
import imageCompression from 'browser-image-compression';
import { resolveImageUrl, isVideo } from '../utils/imageUrl';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    .replace(/ى/g, "yi");
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

function ReportForm({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleTranslationUpdated = () => {
      forceUpdate(prev => prev + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdated);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdated);
  }, []);
  const [errorMessage, setErrorMessage] = useState('');
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [PROJECT_GOVERNORATES, setProjectGovernorates] = useState(BASE_PROJECT_GOVERNORATES);
  // تحديد المشروع الافتراضي: أولاً من URL ثم من مشاريع المستخدم
  const getDefaultProject = () => {
    // أولاً: من URL query params (مثلاً ?project=X)
    const projectFromUrl = searchParams.get('project');
    if (projectFromUrl && (user.role === 'admin' || user.projects?.includes(projectFromUrl))) {
      return projectFromUrl;
    }
    // ثانياً: من أول مشروع في قائمة المستخدم
    if (user.projects && user.projects.length > 0) {
      return user.projects[0];
    }
    // للـ Admin بدون مشاريع محددة، استخدم المشروع الغربي كافتراضي
    return 'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط';
  };

  const [formData, setFormData] = useState({
    report_number: '', license_number: '', report_type: '',
    status: 'تم الإصلاح', governorate: '', project: getDefaultProject(), 
    depth_meters: '', diameter_mm: '', contractor: '', 
    latitude: '', longitude: '', asphalt_license_issued: false,
    notes: '',
    created_at: '', closed_at: '', start_date: ''
  });
  const [autoReportNumber, setAutoReportNumber] = useState(false);
  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [compressingImages, setCompressingImages] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [compressingVideo, setCompressingVideo] = useState(false);
  const [videoCompressionProgress, setVideoCompressionProgress] = useState(0);
  const [showContractorModal, setShowContractorModal] = useState(false);
  const [newContractorName, setNewContractorName] = useState('');
  const [addingContractor, setAddingContractor] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  
  // أنواع البلاغ
  const [reportTypes, setReportTypes] = useState([]);
  const [importLoading, setImportLoading] = useState(false); // حالة استيراد Excel
  
  // دالة التحقق من الصلاحية (تدعم الصلاحيات لكل مشروع)
  const hasPermission = (permKey) => {
    if (user.role === 'admin') return true;
    const PROJECT_SCOPED = ['reports_view','reports_add','reports_edit','reports_delete','reports_review','reports_import','reports_notifications','consultant_notes'];
    const currentProject = formData.project;
    if (PROJECT_SCOPED.includes(permKey) && currentProject) {
      const pp = user.project_permissions || {};
      const projSpecific = pp[currentProject] || [];
      if (projSpecific.length > 0) {
        return projSpecific.includes(permKey);
      }
    }
    return (user.permissions || []).includes(permKey);
  };
  
  // دالة استيراد البلاغات من Excel
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('يجب رفع ملف Excel (.xlsx أو .xls)');
      event.target.value = '';
      return;
    }
    
    // التأكد من اختيار المشروع
    if (!formData.project) {
      toast.error(t('reportForm.selectProjectFirst'));
      event.target.value = '';
      return;
    }
    
    // تأكيد للمستخدم بالمشروع الذي سيتم الاستيراد إليه
    const confirmImport = window.confirm(
      t('reportForm.confirmImportProject', { project: formData.project })
    );
    
    if (!confirmImport) {
      event.target.value = '';
      return;
    }
    
    setImportLoading(true);
    const formDataExcel = new FormData();
    formDataExcel.append('file', file);
    
    // إضافة المشروع والمحافظة المختارة حالياً
    if (formData.project) {
      formDataExcel.append('selected_project', formData.project);
      console.log('📌 إرسال المشروع المختار:', formData.project);
    }
    if (formData.governorate) {
      formDataExcel.append('selected_governorate', formData.governorate);
      console.log('📌 إرسال المحافظة المختارة:', formData.governorate);
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/reports/import-excel`, formDataExcel, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });
      
      const { imported, skipped, message, columns_found, errors } = response.data;
      
      if (imported > 0) {
        toast.success(`✅ ${message}`, { duration: 5000 });
        // الانتقال لصفحة البلاغات لعرض البلاغات المستوردة
        setTimeout(() => navigate('/reports'), 1500);
      } else if (skipped > 0) {
        toast.info(`⚠️ ${message}`, { duration: 5000 });
      } else {
        // لم يتم استيراد أي بلاغ - عرض الأعمدة الموجودة
        const colsMsg = columns_found ? `${t('reportForm.columnsFound')}${columns_found.join(', ')}` : '';
        const errMsg = errors?.length > 0 ? `${t('reportForm.errors')}${errors.join(', ')}` : '';
        toast.error(`❌ ${t('reportForm.noReportsImported')}${colsMsg}${errMsg}${t('reportForm.checkReportNumberColumn')}`, { duration: 10000 });
      }
      
    } catch (error) {
      console.error('Import error:', error);
      const errorMsg = error.response?.data?.detail || t('reportForm.importError');
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };
  
  // حالات البلاغ
  const [reportStatuses, setReportStatuses] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [addingStatus, setAddingStatus] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [selectedStatusProject, setSelectedStatusProject] = useState('');
  
  // جلب المشاريع
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } });
        let list = res.data.map(p => p.name);
        if (user.role !== 'admin' && user.projects?.length > 0) {
          /* removed redundant filter */
        }
        setAllProjects(list);
        if (list.length > 0) setSelectedStatusProject(list[0]);
      } catch (e) {
        console.error('Failed to fetch projects:', e);
      }
    };
    fetchAllProjects();
  }, []);
  
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
  
  // المحافظات المتاحة حسب صلاحيات المستخدم
  const availableGovernorates = user.governorates && user.governorates.length > 0 
    ? user.governorates // المحافظات المحددة للمستخدم
    : Object.values(PROJECT_GOVERNORATES).flat(); // إذا لم يكن له محافظات محددة (admin أو جميع المحافظات)، يرى كل المحافظات
  
  // دالة جلب المقاولين
  const fetchContractors = async (project) => {
    try {
      const token = localStorage.getItem('token');
      let url;
      
      // إذا تم تحديد مشروع، فلترة المقاولين حسب المشروع (للجميع بما فيهم الأدمن)
      if (project) {
        url = `${API}/contractors?project=${encodeURIComponent(project)}`;
      } else if (user.role === 'admin') {
        // الأدمن يرى الجميع فقط إذا لم يتم اختيار مشروع
        url = `${API}/contractors?all_contractors=true`;
      } else {
        // للمستخدمين العاديين، استخدام أول مشروع لديهم كافتراضي إذا لم يتم تحديد مشروع
        const userProject = user.projects && user.projects.length > 0 ? user.projects[0] : '';
        url = `${API}/contractors?project=${encodeURIComponent(userProject)}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContractors(response.data);
      console.log(`📋 تم جلب ${response.data.length} مقاول`);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
      setContractors([]);
    }
  };

  // جلب المقاولين عند تحميل الصفحة
  useEffect(() => {
    fetchContractors(formData.project);
    fetchReportStatuses(formData.project);
    fetchReportTypes(formData.project);
  }, []);
  
  // جلب المقاولين وحالات البلاغ عند تغيير المشروع
  useEffect(() => {
    fetchContractors(formData.project);
    fetchReportStatuses(formData.project);
    fetchReportTypes(formData.project);
  }, [formData.project]);

  // جلب أنواع البلاغ
  const fetchReportTypes = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/report-types?project=${encodeURIComponent(project)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportTypes(response.data);
      // تعيين النوع الأول كافتراضي إذا لم يكن محدد
      if (!formData.report_type && response.data.length > 0) {
        setFormData(prev => ({...prev, report_type: response.data[0].name}));
      }
    } catch (error) {
      console.error('Failed to fetch report types:', error);
      setReportTypes([{ name: 'ترابي' }, { name: 'بلاط' }, { name: 'أسفلت' }]);
    }
  };

  // جلب حالات البلاغ
  const fetchReportStatuses = async (project) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/report-statuses?project=${encodeURIComponent(project)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReportStatuses(response.data);
    } catch (error) {
      console.error('Failed to fetch report statuses:', error);
      // استخدام الحالات الافتراضية
      setReportStatuses([
        { name: 'تم الإصلاح' },
        { name: 'جاري العمل' },
        { name: 'معلق' },
        { name: 'ملغي' }
      ]);
    }
  };

  // إضافة حالة بلاغ جديدة
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error(t('reportForm.enterStatusName'));
      return;
    }
    
    if (!selectedStatusProject) {
      toast.error(t('reportForm.selectProjectFirstSimple'));
      return;
    }
    
    setAddingStatus(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/report-statuses`, {
        name: newStatusName.trim(),
        project: selectedStatusProject
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(t('reportForm.addStatusSuccess'));
      setNewStatusName('');
      setShowStatusModal(false);
      fetchReportStatuses(formData.project);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('reportForm.unknownError'));
    } finally {
      setAddingStatus(false);
    }
  };
  
  const deleteExistingImage = async (index) => {
    if (!id) {
      // إذا كان إنشاء جديد، حذف من الـ state فقط
      setExistingImages(existingImages.filter((_, i) => i !== index));
      return;
    }
    
    if (window.confirm(t('reportForm.confirmDeleteImage'))) {
      try {
        await axios.delete(`${API}/reports/${id}/images/${index}`);
        setExistingImages(existingImages.filter((_, i) => i !== index));
      } catch (error) {
        console.error('Failed to delete image:', error);
        toast.error(t('reportForm.deleteImageError'));
      }
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchReport().finally(() => setLoading(false));
    }
  }, [id]);

  // الحصول على الموقع تلقائياً عند فتح صفحة إضافة بلاغ جديد
  useEffect(() => {
    // فقط للبلاغات الجديدة (ليس للتعديل)
    if (!id && navigator.geolocation) {
      console.log('🔄 محاولة الحصول على الموقع تلقائياً...');
      
      // استخدام إعدادات أقل صرامة لتحسين التوافق
      const options = {
        enableHighAccuracy: false, // استخدام دقة عادية بدلاً من عالية
        timeout: 15000, // وقت أطول
        maximumAge: 30000 // السماح بموقع محفوظ حديثاً
      };
      
      // محاولة الحصول على الموقع
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          
          console.log('✅ تم الحصول على الموقع:', lat, lon);
          
          setFormData(prev => {
            // تحديث فقط إذا كانت الحقول فارغة
            if (!prev.latitude && !prev.longitude) {
              // عرض رسالة نجاح
              setLocationSuccess(true);
              setTimeout(() => setLocationSuccess(false), 5000);
              
              return {
                ...prev,
                latitude: lat,
                longitude: lon
              };
            }
            return prev;
          });
        },
        (error) => {
          console.log('⚠️ لم يتم الحصول على الموقع:', error.code, error.message);
          // لا نعرض تنبيه - فقط نترك الحقول فارغة للإدخال اليدوي
          // المستخدم يمكنه الضغط على زر "الموقع الحالي" لاحقاً
        },
        options
      );
    }
  }, [id]);

  // إضافة مقاول جديد
  const handleAddContractor = async () => {
    if (!newContractorName.trim()) {
      toast.error(t('reportForm.enterContractorName'));
      return;
    }
    
    // تحديد المشروع للمقاول الجديد
    const contractorProject = user.role === 'admin' 
      ? formData.project 
      : (user.projects && user.projects.length > 0 ? user.projects[0] : formData.project);
    
    if (!contractorProject) {
      toast.error(t('reportForm.selectProjectFirstSimple'));
      return;
    }
    
    setAddingContractor(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/contractors`, {
        name: newContractorName.trim(),
        project: contractorProject
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(t('reportForm.addContractorSuccess'));
      setNewContractorName('');
      setShowContractorModal(false);
      
      // إعادة جلب المقاولين
      fetchContractors(formData.project);
    } catch (error) {
      console.error('Error adding contractor:', error);
      toast.error(error.response?.data?.detail || t('reportForm.addContractorError'));
    } finally {
      setAddingContractor(false);
    }
  };

  const fetchReport = async () => {
    try {
      // ⚡ جلب البيانات الأساسية فقط (بدون الصور)
      const response = await axios.get(`${API}/reports/${id}?exclude_images=true`);
      const report = response.data;
      setFormData({
        report_number: report.report_number,
        license_number: report.license_number,
        report_type: report.report_type,
        status: report.status,
        governorate: report.governorate,
        project: report.project || '',
        depth_meters: report.depth_meters,
        diameter_mm: report.diameter_mm,
        contractor: report.contractor,
        latitude: report.latitude || '',
        longitude: report.longitude || '',
        asphalt_license_issued: report.asphalt_license_issued || false,
        notes: report.notes || '',
        created_at: report.created_at ? report.created_at.split('T')[0] : '',
        closed_at: report.closed_at ? report.closed_at.split('T')[0] : '',
        start_date: report.start_date ? report.start_date.split('T')[0] : ''
      });
      
      // ⚡ جلب الصور في الخلفية بشكل منفصل
      fetchReportImages();
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error('حدث خطأ في تحميل البلاغ');
    }
  };

  // ⚡ جلب الصور بشكل منفصل في الخلفية
  const fetchReportImages = async () => {
    try {
      const response = await axios.get(`${API}/reports/${id}/images`);
      setExistingImages(response.data.images || []);
    } catch (error) {
      console.error('Failed to fetch images:', error);
      // لا نعرض خطأ للمستخدم، فقط نترك الصور فارغة
      setExistingImages([]);
    }
  };

  // دالة للحصول على اسم الحي من الإحداثيات
  const getNeighborhoodFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ar`,
        {
          headers: {
            'User-Agent': 'WFM-App'
          }
        }
      );
      const data = await response.json();
      
      // محاولة الحصول على اسم الحي من البيانات المرجعة
      const neighborhood = data.address?.suburb || 
                          data.address?.neighbourhood || 
                          data.address?.quarter || 
                          data.address?.district || 
                          data.address?.city_district || 
                          'غير محدد';
      
      return neighborhood;
    } catch (error) {
      console.error('خطأ في تحديد الحي:', error);
      return 'غير محدد';
    }
  };

  // دالة لإضافة watermark على الصورة
  const addWatermarkToImage = async (file, watermarkText) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          canvas.width = img.width;
          canvas.height = img.height;
          
          // رسم الصورة
          ctx.drawImage(img, 0, 0);
          
          // إضافة شعار بيت الخبرة كعلامة مائية في الزاوية العليا اليمنى
          const logo = new Image();
          logo.crossOrigin = 'anonymous';
          logo.src = '/bayt-alkhibra-logo.png';
          logo.onload = () => {
            // حجم الشعار (نسبة من عرض الصورة)
            const logoWidth = img.width * 0.25; // 25% من عرض الصورة
            const logoHeight = (logo.height / logo.width) * logoWidth;
            
            // موقع الشعار في الزاوية العليا اليمنى مع شفافية
            ctx.globalAlpha = 0.4; // شفافية 40% لجعله مائي
            ctx.drawImage(logo, img.width - logoWidth - 20, 20, logoWidth, logoHeight);
            ctx.globalAlpha = 1.0; // إعادة الشفافية للنص
            
            // إعداد النص باللون الأزرق
            const fontSize = Math.max(img.width / 30, 20);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = 'rgba(0, 100, 255, 0.9)'; // لون أزرق
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // حدود بيضاء للوضوح
            ctx.lineWidth = 3;
            
            // تقسيم النص إلى أسطر
            const lines = watermarkText.split('\n');
            const lineHeight = fontSize + 10;
            const startY = img.height - (lines.length * lineHeight) - 20;
            
            // رسم النص
            lines.forEach((line, index) => {
              const y = startY + (index * lineHeight);
              ctx.strokeText(line, 20, y);
              ctx.fillText(line, 20, y);
            });
            
            canvas.toBlob((blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.9);
          };
          
          logo.onerror = () => {
            // في حالة فشل تحميل الشعار، نكمل بدون الشعار
            const fontSize = Math.max(img.width / 30, 20);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = 'rgba(0, 100, 255, 0.9)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            
            const lines = watermarkText.split('\n');
            const lineHeight = fontSize + 10;
            const startY = img.height - (lines.length * lineHeight) - 20;
            
            lines.forEach((line, index) => {
              const y = startY + (index * lineHeight);
              ctx.strokeText(line, 20, y);
              ctx.fillText(line, 20, y);
            });
            
            canvas.toBlob((blob) => {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.9);
          };
        };
      };
      reader.onerror = reject;
    });
  };

  // دالة التقاط صورة من الكاميرا
  const captureFromCamera = async () => {
    try {
      // طلب الإذن للوصول للكاميرا
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // استخدام الكاميرا الخلفية
      });
      
      // إنشاء عنصر فيديو
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // إنشاء modal للكاميرا
      const modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
      
      video.style.cssText = 'max-width:90%;max-height:70vh;border-radius:8px;';
      
      const captureBtn = document.createElement('button');
      captureBtn.textContent = '📸 التقاط صورة';
      captureBtn.style.cssText = 'margin-top:20px;padding:15px 30px;font-size:18px;background:#3b82f6;color:white;border:none;border-radius:8px;cursor:pointer;';
      
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '✖ إغلاق';
      closeBtn.style.cssText = 'margin-top:10px;padding:15px 30px;font-size:18px;background:#ef4444;color:white;border:none;border-radius:8px;cursor:pointer;';
      
      modal.appendChild(video);
      modal.appendChild(captureBtn);
      modal.appendChild(closeBtn);
      document.body.appendChild(modal);
      
      // عند الضغط على زر الالتقاط
      captureBtn.onclick = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
          
          // الحصول على اسم الحي من الإحداثيات
          let neighborhoodName = 'غير محدد';
          if (formData.latitude && formData.longitude) {
            neighborhoodName = await getNeighborhoodFromCoordinates(formData.latitude, formData.longitude);
          }
          
          // إضافة watermark مع اسم الحي واسم المستخدم
          const watermarkText = `رقم البلاغ: ${formData.report_number || 'جديد'}\nالمحافظة: ${formData.governorate || '-'}\nالحي: ${neighborhoodName}\nالإحداثيات: ${formData.latitude || '-'}, ${formData.longitude || '-'}\nالمستخدم: ${user?.username || '-'}\n${new Date().toLocaleString('ar-EG')}`;
          
          const watermarkedImage = await addWatermarkToImage(file, watermarkText);
          
          // إضافة الصورة للقائمة
          setImages(prev => [...prev, watermarkedImage]);
          
          // إيقاف الكاميرا وإغلاق Modal
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
          
          toast.success('✅ تم التقاط الصورة وإضافة المعلومات عليها!');
        }, 'image/jpeg', 0.9);
      };
      
      // عند الضغط على زر الإغلاق
      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(modal);
      };
      
    } catch (error) {
      console.error('خطأ في الوصول للكاميرا:', error);
      toast.error('❌ لم نتمكن من الوصول للكاميرا. يرجى التأكد من السماح بالوصول للكاميرا في إعدادات المتصفح.');
    }
  };

  // دالة ضغط الصور تلقائياً إلى 100KB كحد أقصى بجودة عالية
  const compressImage = async (imageFile) => {
    try {
      const maxSizeKB = 100;
      const maxWidthOrHeight = 1920;
      
      const imageBitmap = await createImageBitmap(imageFile);
      let { width, height } = imageBitmap;
      if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
        if (width > height) {
          height = (height / width) * maxWidthOrHeight;
          width = maxWidthOrHeight;
        } else {
          width = (width / height) * maxWidthOrHeight;
          height = maxWidthOrHeight;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imageBitmap, 0, 0, width, height);
      
      // ضغط تدريجي: 85% -> 25%
      const targetBytes = maxSizeKB * 1024;
      let blob = null;
      for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45, 0.35, 0.25]) {
        blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        if (blob && blob.size <= targetBytes) break;
      }
      
      // إذا ما زال أكبر: تقليل الأبعاد
      if (blob && blob.size > targetBytes) {
        for (const scale of [0.75, 0.6, 0.5, 0.4]) {
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.floor(width * scale);
          smallCanvas.height = Math.floor(height * scale);
          const smallCtx = smallCanvas.getContext('2d');
          smallCtx.drawImage(imageBitmap, 0, 0, smallCanvas.width, smallCanvas.height);
          blob = await new Promise(resolve => smallCanvas.toBlob(resolve, 'image/jpeg', 0.55));
          if (blob && blob.size <= targetBytes) break;
        }
      }
      
      return new File([blob], imageFile.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      
    } catch (error) {
      console.error('خطأ في ضغط الصورة:', error);
      try {
        const options = {
          maxSizeMB: 0.1, // 100KB
          maxWidthOrHeight: 1920,
          useWebWorker: false,
          fileType: 'image/jpeg'
        };
        return await imageCompression(imageFile, options);
      } catch {
        return imageFile;
      }
    }
  };

  // دالة ضغط الفيديو تلقائياً إلى 300KB كحد أقصى
  const compressVideo = (videoFile) => {
    return new Promise((resolve, reject) => {
      setCompressingVideo(true);
      setVideoCompressionProgress(10);
      
      const video = document.createElement('video');
      video.src = URL.createObjectURL(videoFile);
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      video.onloadedmetadata = () => {
        setVideoCompressionProgress(30);
        const canvas = document.createElement('canvas');
        // تصغير الأبعاد لتقليل الحجم
        const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d');
        
        video.play().catch(e => {
          setCompressingVideo(false);
          reject(e);
        });
        
        // التقاط الفيديو من الكانفاس بـ 24 إطار في الثانية
        const stream = canvas.captureStream(24);
        
        const duration = video.duration || 15;
        // حساب البت ريت المستهدف للوصول لـ 300 كيلوبايت (300 * 1024 * 8)
        const targetBitrate = Math.floor((300 * 1024 * 8) / duration);
        
        const options = { 
          mimeType: 'video/webm; codecs=vp8',
          videoBitsPerSecond: Math.min(targetBitrate, 400000) 
        };
        
        let recorder;
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          try {
             recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          } catch (e2) {
             recorder = new MediaRecorder(stream);
          }
        }
        
        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = () => {
          setVideoCompressionProgress(100);
          const compressedBlob = new Blob(chunks, { type: recorder.mimeType });
          const compressedFile = new File([compressedBlob], videoFile.name.replace(/\.[^.]+$/, '.webm'), {
            type: recorder.mimeType,
            lastModified: Date.now()
          });
          URL.revokeObjectURL(video.src);
          setCompressingVideo(false);
          resolve(compressedFile);
        };
        
        recorder.start();
        setVideoCompressionProgress(50);
        
        const drawFrame = () => {
          if (video.paused || video.ended) {
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const progress = 50 + Math.floor((video.currentTime / duration) * 45);
          setVideoCompressionProgress(progress);
          requestAnimationFrame(drawFrame);
        };
        
        drawFrame();
      };
      
      video.onerror = () => {
        setCompressingVideo(false);
        reject(new Error("فشل في تحميل الفيديو للضغط"));
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const form = new FormData();
      
      // إضافة البيانات الأساسية فقط (بدون الصور)
      form.append('report_number', autoReportNumber && !id ? 'AUTO' : formData.report_number);
      form.append('license_number', formData.license_number);
      form.append('report_type', formData.report_type);
      form.append('status', formData.status);
      form.append('governorate', formData.governorate);
      form.append('project', formData.project);
      form.append('depth_meters', formData.depth_meters);
      form.append('diameter_mm', formData.diameter_mm);
      form.append('contractor', formData.contractor);
      form.append('latitude', formData.latitude || '');
      form.append('longitude', formData.longitude || '');
      form.append('asphalt_license_issued', formData.asphalt_license_issued.toString());
      form.append('notes', formData.notes || '');
      
      if (formData.created_at) {
        form.append('created_at', formData.created_at + 'T12:00:00');
      } else if (!id) {
        form.append('created_at', new Date().toISOString());
      }
      
      // تاريخ مباشرة البلاغ
      if (formData.start_date) {
        form.append('start_date', formData.start_date + 'T12:00:00');
      }
      
      if (id) {
        if (formData.closed_at) {
          form.append('closed_at', formData.closed_at + 'T12:00:00');
          form.append('remove_closed_at', 'false');
        } else {
          form.append('remove_closed_at', 'true');
        }
      } else if (formData.closed_at) {
        form.append('closed_at', formData.closed_at + 'T12:00:00');
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      };

      let reportId = id;
      
      if (id) {
        // تحديث البلاغ (بدون الصور أولاً)
        await axios.put(`${API}/reports/${id}`, form, config);
        toast.success('✅ تم تحديث البلاغ بنجاح!');
      } else {
        // إضافة بلاغ جديد
        const response = await axios.post(`${API}/reports`, form, config);
        reportId = response.data?.id || response.data?._id;
        toast.success('✅ تم إضافة البلاغ بنجاح!');
        const reviewerName = response.data?.reviewer_name || 'المسؤول المختص';
        toast.info(`📋 يتم مراجعة البلاغ من قبل الفريق الفني المختص والمفوض بالمراجعة م/ ${reviewerName}`);
      }

      // ⚡ رفع الصور في الخلفية
      if (images.length > 0 && reportId) {
        setUploadingImages(true);
        toast.info(`📤 جاري رفع ${images.length} صورة في الخلفية...`, { autoClose: 2000 });
        
        // رفع الصور بشكل غير متزامن
        uploadImagesInBackground(reportId, images);
      }

      // العودة للصفحة السابقة للحفاظ على فلاتر المشروع والصفحة الحالية
      if (location.state && location.state.from) {
        navigate(location.state.from);
      } else if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else if (formData.project) {
        navigate(`/reports?project=${encodeURIComponent(formData.project)}`);
      } else {
        navigate('/reports');
      }
      
    } catch (error) {
      console.error('Failed to save report:', error);
      
      let errorMsg = error.response?.data?.detail || error.message || t('reportForm.unknownError', 'حدث خطأ غير معروف');
      if (typeof errorMsg === 'object') {
        errorMsg = Array.isArray(errorMsg) 
          ? errorMsg.map(e => e.msg || e.message || JSON.stringify(e)).join(', ')
          : JSON.stringify(errorMsg);
      }
      
      let finalMsg = String(errorMsg);
      if (finalMsg.includes('موجود مسبقا') || finalMsg.includes('already exist') || finalMsg.includes('موجود مسبقاً')) {
        finalMsg = t('reportForm.duplicateNumber', 'هذا الرقم موجود مسبقاً');
      }
      
      setErrorMessage(finalMsg);
      toast.error(`❌ ${t('reportForm.saveFailed', 'فشل في حفظ البلاغ!')} ${finalMsg}`, { autoClose: 5000 });
    } finally {
      setLoading(false);
    }
  };

  // ⚡ رفع الصور في الخلفية
  const uploadImagesInBackground = async (reportId, imagesToUpload) => {
    try {
      const totalImages = imagesToUpload.length;
      let uploadedCount = 0;

      for (const image of imagesToUpload) {
        try {
          const imageForm = new FormData();
          imageForm.append('image', image);
          
          await axios.post(`${API}/reports/${reportId}/images`, imageForm, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
          });
          
          uploadedCount++;
          setImageUploadProgress(Math.round((uploadedCount / totalImages) * 100));
        } catch (imgError) {
          console.error('Failed to upload image:', imgError);
        }
      }

      if (uploadedCount === totalImages) {
        toast.success(`✅ تم رفع جميع الصور (${totalImages})`, { autoClose: 3000 });
      } else if (uploadedCount > 0) {
        toast.warning(`⚠️ تم رفع ${uploadedCount} من ${totalImages} صورة`, { autoClose: 5000 });
      } else {
        toast.error('❌ فشل في رفع الصور', { autoClose: 5000 });
      }
    } catch (error) {
      console.error('Background upload error:', error);
      toast.error('❌ خطأ في رفع الصور', { autoClose: 5000 });
    } finally {
      setUploadingImages(false);
      setImageUploadProgress(0);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          {/* العنوان مع زر استيراد Excel */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900">{id ? t('reportForm.editReport') : t('reportForm.addReport')}</h2>
            {/* زر استيراد من Excel - يظهر فقط في صفحة الإضافة وللمستخدمين المصرح لهم */}
            {!id && hasPermission('reports_import') && (
              <label className={`${importLoading ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'} text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-2 text-sm`}>
                {importLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {t('reportForm.importing')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {t('reportForm.importExcel')}
                  </>
                )}
                <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" disabled={importLoading} />
              </label>
            )}
          </div>
          
          {/* Loading Skeleton للتعديل */}
          {id && loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="h-24 bg-gray-200 rounded"></div>
              <div className="text-center text-gray-500">{t('reportForm.loading')}</div>
            </div>
          )}
          
          {/* عرض رسالة الخطأ */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-red-400 text-xl">❌</span>
                </div>
                <div className="mr-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {t('reportForm.errorTitle')}
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {errorMessage}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* رسالة توضيحية للموقع - فقط للبلاغات الجديدة */}
          {!id && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📍</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">
                    {t('reportForm.locationTipTitle')}
                  </h3>
                  <p className="text-xs text-blue-700">
                    {t('reportForm.locationTipContent')}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* إخفاء الفورم أثناء التحميل */}
          {!(id && loading) && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">{t('reports.reportNumber')} *</label>
                  {!id && (
                    <button
                      type="button"
                      onClick={() => setAutoReportNumber(!autoReportNumber)}
                      className={`text-[10px] px-2 py-1 rounded-full font-bold transition-all flex items-center gap-1 ${
                        autoReportNumber 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {autoReportNumber ? (
                        <>{t('reportForm.autoNumber')}</>
                      ) : (
                        <>{t('reportForm.manualNumber')}</>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                  {(!autoReportNumber || id) && (
                    <span className="bg-gray-100 text-gray-700 font-bold px-3 py-2 flex items-center border-l border-gray-300 select-none">
                      CCB-
                    </span>
                  )}
                  <input 
                    type="text" 
                    required={!autoReportNumber} 
                    value={
                      autoReportNumber && !id 
                      ? t('reportForm.generatedAutomatically') 
                      : (formData.report_number ? (formData.report_number.startsWith('CCB-') ? formData.report_number.slice(4) : (formData.report_number.startsWith('CCP-') ? formData.report_number.slice(4) : formData.report_number)) : '')
                    } 
                    onChange={(e) => {
                      const typedVal = e.target.value;
                      setFormData({...formData, report_number: typedVal ? `CCB-${typedVal}` : ''});
                    }} 
                    disabled={autoReportNumber && !id}
                    placeholder=""
                    className={`w-full px-4 py-2 border-0 focus:outline-none focus:ring-0 ${
                      autoReportNumber && !id
                      ? 'bg-blue-50 text-blue-700 font-medium italic' 
                      : ''
                    }`} 
                  />
                </div>
                {!id && autoReportNumber && (
                  <p className="text-[10px] text-blue-600 mt-1 mr-1">{t('reportForm.autoNumberTip')}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.receiveDate')} *</label>
                <input type="date" required value={formData.created_at} onChange={(e) => setFormData({...formData, created_at: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.startDate')}</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.licenseNumber')} *</label>
                <input type="text" required value={formData.license_number} onChange={(e) => setFormData({...formData, license_number: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.reportType')} *</label>
                <select required value={formData.report_type} onChange={(e) => setFormData({...formData, report_type: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t('reportForm.selectType')}</option>
                  {reportTypes.map(rt => (
                    <option key={rt.id || rt.name} value={rt.name}>{t(`statusMap.${rt.name}`, rt.name)}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="block text-sm font-medium text-gray-700">{t('reports.status')} *</label>
                  {(user.role === 'admin' || user.can_create_subusers) && (
                    <button
                      type="button"
                      onClick={() => setShowStatusModal(true)}
                      style={{
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ {t('reportForm.addStatus')}
                    </button>
                  )}
                </div>
                <select required value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">{t('reportForm.selectStatus')}</option>
                  {reportStatuses.length > 0 ? (
                    reportStatuses.map(status => (
                      <option key={status.id || status.name} value={status.name}>{t(`statusMap.${status.name}`, status.name)}</option>
                    ))
                  ) : (
                    <>
                      <option value="تم الإصلاح">{t('statusMap.تم الإصلاح', {defaultValue: 'تم الإصلاح'})}</option>
                      <option value="تم الإصلاح-ومتبقي الأسفلت">{t('statusMap.تم الإصلاح - ومتبقي الأسفلت', {defaultValue: 'تم الإصلاح - ومتبقي الأسفلت'})}</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* المشروع مخفي ويتم عرضه تحت المحافظة */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.governorate')} *</label>
                <select 
                  required 
                  value={formData.governorate} 
                  onChange={(e) => setFormData({...formData, governorate: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('reportForm.selectGovernorate')}</option>
                  {(formData.project && PROJECT_GOVERNORATES[formData.project] 
                    ? PROJECT_GOVERNORATES[formData.project].filter(gov => {
                        if (!user.governorates || user.governorates.length === 0) return true;
                        if (user.governorates.some(g => ['الكل', 'جميع المحافظات', 'كل المحافظات'].includes(g))) return true;
                        return user.governorates.includes(gov);
                      })
                    : availableGovernorates
                  ).map(gov => (
                    <option key={gov} value={gov}>{translateBrandingText(gov, isRtl)}</option>
                  ))}
                </select>
                
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-500">{t('reportForm.currentProject')}</p>
                  <p className="text-sm font-bold text-blue-700">
                    {translateBrandingText(formData.project, isRtl) || ''}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reportForm.depth')}</label>
                <input type="number" step="0.01" required value={formData.depth_meters} onChange={(e) => setFormData({...formData, depth_meters: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reportForm.diameter')}</label>
                <input type="number" step="0.01" required value={formData.diameter_mm} onChange={(e) => setFormData({...formData, diameter_mm: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="block text-sm font-medium text-gray-700">{t('reports.contractor')} *</label>
                  {/* زر إضافة مقاول - للـ Admin والمستوى 2 فقط */}
                  {(user.role === 'admin' || user.can_create_subusers) && (
                    <button
                      type="button"
                      onClick={() => setShowContractorModal(true)}
                      style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      ➕ {t('reportForm.addContractor')}
                    </button>
                  )}
                </div>
                <select 
                  required 
                  value={formData.contractor} 
                  onChange={(e) => setFormData({...formData, contractor: e.target.value})} 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t('reportForm.selectContractor')}</option>
                  {/* إظهار المقاول الحالي حتى لو لم يكن في القائمة لضمان عدم ضياع البيانات */}
                  {formData.contractor && !contractors.some(c => c.name === formData.contractor) && (
                    <option value={formData.contractor}>{translateBrandingText(formData.contractor, isRtl)} ({t('reportForm.contractorCurrent')})</option>
                  )}
                  {contractors.map(contractor => (
                    <option key={contractor.id} value={contractor.name}>
                      {user.role === 'admin' 
                        ? `${translateBrandingText(contractor.name, isRtl)} (${translateBrandingText(contractor.project, isRtl)})`
                        : translateBrandingText(contractor.name, isRtl)}
                    </option>
                  ))}
                </select>
                {contractors.length === 0 && (user.role === 'admin' || user.can_create_subusers) && (
                  <p className="text-xs text-orange-600 mt-1">
                    {t('reportForm.noContractors')}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reports.closeDate')}</label>
                <input type="date" value={formData.closed_at} onChange={(e) => setFormData({...formData, closed_at: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-500 mt-1">{t('reportForm.closeDateTip')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reportForm.latitude')} (Latitude)</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="24.7136" 
                    value={formData.latitude} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // السماح بالأرقام والنقطة والإشارة السالبة فقط
                      if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                        setFormData({...formData, latitude: value});
                      }
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.geolocation) {
                        const button = document.activeElement;
                        button.disabled = true;
                        button.innerHTML = '⏳ ' + t('reportForm.gettingLocation');
                        
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const lat = position.coords.latitude.toFixed(6);
                            const lon = position.coords.longitude.toFixed(6);
                            setFormData({
                              ...formData,
                              latitude: lat,
                              longitude: lon
                            });
                            button.disabled = false;
                            button.innerHTML = '📍 ' + t('reportForm.getLocation');
                            
                            // عرض رسالة نجاح
                            setLocationSuccess(true);
                            setTimeout(() => setLocationSuccess(false), 4000);
                          },
                          (error) => {
                            button.disabled = false;
                            button.innerHTML = '📍 ' + t('reportForm.getLocation');
                            
                            let errorMsg = '';
                            let instructions = '';
                            
                            if (error.code === 1) {
                              errorMsg = t('reportForm.locationErrorBlocked');
                              instructions = t('reportForm.locationErrorBlockedInstructions');
                            } else if (error.code === 2) {
                              errorMsg = t('reportForm.locationErrorUnavailable');
                              instructions = t('reportForm.locationErrorUnavailableInstructions');
                            } else if (error.code === 3) {
                              errorMsg = t('reportForm.locationErrorTimeout');
                              instructions = t('reportForm.locationErrorTimeoutInstructions');
                            }
                            
                            toast.error(errorMsg + instructions);
                          },
                          {
                            enableHighAccuracy: false,
                            timeout: 15000,
                            maximumAge: 30000
                          }
                        );
                      } else {
                        toast.warning(t('reportForm.locationBrowserNotSupported'));
                      }
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                    title={t('reportForm.getLocation')}
                  >
                    📍 {t('reportForm.getLocation')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('reportForm.locationTip')}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('reportForm.longitude')} (Longitude)</label>
                <input 
                  type="text" 
                  placeholder="46.6753" 
                  value={formData.longitude} 
                  onChange={(e) => {
                    const value = e.target.value;
                    // السماح بالأرقام والنقطة والإشارة السالبة فقط
                    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
                      setFormData({...formData, longitude: value});
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <p className="text-xs text-gray-500 mt-1">{t('reportForm.locationTipLng')}</p>
              </div>
              
              {/* رسالة نجاح الموقع */}
              {locationSuccess && (
                <div className="md:col-span-2 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 animate-pulse">
                  <span className="text-green-500 text-xl">✅</span>
                  <span className="text-green-700 text-sm font-medium">
                    {t('reportForm.locationSuccess')}
                  </span>
                </div>
              )}
              
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.asphalt_license_issued} 
                    onChange={(e) => setFormData({...formData, asphalt_license_issued: e.target.checked})} 
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{t('reportForm.asphaltLicenseIssued')}</span>
                </label>
              </div>
              
              {/* Notes / Remarks field */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('common.notes')} ({t('common.optional')})
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="4"
                  placeholder={t('reportForm.notesPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">{t('reportForm.notesTip')}</p>
              </div>
              
              {/* Existing Images */}
              {id && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('reportForm.currentImages')} {existingImages.length > 0 && `(${existingImages.length})`}
                  </label>
                  {existingImages.length === 0 ? (
                    <div className="text-gray-400 text-sm py-4 text-center border border-dashed border-gray-300 rounded-lg">
                      {t('reportForm.loadingImages')}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {existingImages.map((img, index) => (
                        <div key={index} className="relative group overflow-hidden rounded-lg">
                          {isVideo(img) ? (
                            <video 
                              src={resolveImageUrl(img)} 
                              className="w-full h-32 object-cover bg-gray-100"
                              muted playsInline preload="metadata"
                            />
                          ) : (
                            <img 
                              src={resolveImageUrl(img)} 
                              alt={`${t('common.image', {defaultValue: 'صورة'})} ${index + 1}`} 
                              className="w-full h-32 object-cover bg-gray-100"
                              loading="lazy"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.classList.add('bg-gray-200');
                                e.target.parentElement.innerHTML += '<div class="absolute inset-0 flex items-center justify-center text-gray-400">❌ Error</div>';
                              }}
                            />
                          )}
                          {isVideo(img) && (
                            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white z-10">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                            <button
                              type="button"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = resolveImageUrl(img);
                                const extension = isVideo(img) ? 'webm' : 'jpg';
                                link.download = `media_${index + 1}.${extension}`;
                                link.click();
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
                              title={t('common.download')}
                            >
                              ⬇️
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteExistingImage(index)}
                              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded"
                              title={t('common.delete')}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {id ? t('reportForm.addNewImages') : t('reportForm.uploadNotice')} (PDF, JPG, PNG)
                </label>
                <input 
                  type="file" 
                  multiple 
                  accept=".pdf,.jpg,.jpeg,.png" 
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    // ⚡ ضغط الصور فوراً عند التحديد!
                    setCompressingImages(true);
                    setCompressionProgress(0);
                    
                    const compressedFiles = [];
                    for (let i = 0; i < files.length; i++) {
                      const file = files[i];
                      
                      // تحديث التقدم
                      setCompressionProgress(Math.round(((i + 1) / files.length) * 100));
                      
                      // ضغط الصورة
                      const compressed = await compressImage(file);
                      compressedFiles.push(compressed);
                    }
                    
                    setImages(compressedFiles);
                    setCompressingImages(false);
                    toast.success(t('reportForm.compressImagesSuccess', {count: files.length}));
                  }} 
                  disabled={compressingImages}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                />
                
                {/* مؤشر ضغط الصور */}
                {compressingImages && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">⚡ {t('reportForm.compressingImages')}</span>
                      <span className="text-sm font-bold text-blue-700">{compressionProgress}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${compressionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* مؤشر ضغط الفيديو */}
                {compressingVideo && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-red-700">🎥 {t('reportForm.compressingVideo')}</span>
                      <span className="text-sm font-bold text-red-700">{videoCompressionProgress}%</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2.5">
                      <div 
                        className="bg-red-600 h-2.5 rounded-full transition-all duration-300" 
                        style={{ width: `${videoCompressionProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {/* أزرار الكاميرا والفيديو تحت حقل رفع الصور */}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md"
                    title={t('reportForm.capturePhoto')}
                  >
                    <span className="text-2xl">📸</span>
                    <span className="hidden sm:inline">{t('reportForm.capturePhoto')}</span>
                  </button>
                  
                  <label className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer" title={t('reportForm.uploadVideo')}>
                    <span className="text-2xl">🎥</span>
                    <span className="hidden sm:inline">{t('reportForm.uploadVideo')}</span>
                    <input 
                      type="file" 
                      accept="video/*" 
                      className="hidden" 
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        try {
                          const compressedVideo = await compressVideo(file);
                          setImages(prev => [...prev, compressedVideo]);
                          toast.success(t('reportForm.videoCompressSuccess'));
                        } catch (err) {
                          toast.error(t('reportForm.videoCompressError'));
                          console.error(err);
                        }
                        e.target.value = '';
                      }} 
                    />
                  </label>
                </div>
                
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 font-medium">{t('reportForm.compressNoticeTitle')}</p>
                  <p className="text-xs text-blue-600 mt-1">{t('reportForm.compressNoticeContent')}</p>
                  <p className="text-xs text-blue-600 mt-1">{t('reportForm.compressNoticeCamera')}</p>
                  <p className="text-xs text-green-700 mt-1 font-medium">{t('reportForm.compressNoticeDetails')}</p>
                </div>
                {images.length > 0 && (
                  <p className="text-xs text-green-600 mt-2 font-medium">{t('reportForm.selectedImagesCount', {count: images.length})}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-4">
              <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50">
                {loading ? (id ? t('reportForm.updating') : t('reportForm.saving')) : id ? t('reportForm.updateBtn') : t('reportForm.saveBtn')}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (location.state && location.state.from) {
                    navigate(location.state.from);
                  } else {
                    navigate(-1);
                  }
                }} 
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
          )}
        </div>
      </div>
      
      {/* Modal إضافة مقاول */}
      {showContractorModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>➕ {t('reportForm.addContractorModalTitle')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                {t('reportForm.contractorNameLabel')}
              </label>
              <input
                type="text"
                value={newContractorName}
                onChange={(e) => setNewContractorName(e.target.value)}
                placeholder={t('reportForm.contractorNamePlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                {t('reportForm.projectLabel')}
              </label>
              <select
                value={selectedStatusProject}
                onChange={(e) => setSelectedStatusProject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {allProjects.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowContractorModal(false);
                  setNewContractorName('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddContractor}
                disabled={addingContractor}
                style={{
                  padding: '10px 20px',
                  backgroundColor: addingContractor ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: addingContractor ? 'not-allowed' : 'pointer'
                }}
              >
                {addingContractor ? t('common.adding') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal إضافة حالة بلاغ */}
      {showStatusModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>➕ {t('reportForm.addStatusModalTitle')}</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                {t('reportForm.statusNameLabel')}
              </label>
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder={t('reportForm.statusNamePlaceholder')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#374151' }}>
                {t('reportForm.projectLabel')}
              </label>
              <select
                value={selectedStatusProject}
                onChange={(e) => setSelectedStatusProject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: 'white'
                }}
              >
                {allProjects.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowStatusModal(false);
                  setNewStatusName('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleAddStatus}
                disabled={addingStatus}
                style={{
                  padding: '10px 20px',
                  backgroundColor: addingStatus ? '#9ca3af' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: addingStatus ? 'not-allowed' : 'pointer'
                }}
              >
                {addingStatus ? t('common.adding') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default ReportForm;
