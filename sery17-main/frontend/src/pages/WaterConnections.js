import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import { Search, Eye, Edit2, Trash2, Plus, RefreshCw, MapPin, ImageIcon, X, FileText, FileSpreadsheet, Filter, List, ChevronDown, Check, Download, CheckSquare, Square, User, Upload, Camera, UserCheck, Hash, Calendar, Activity, Compass, Droplet, Layout as LayoutIcon, ArrowRight } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import { hasProjectPermission } from '../utils/permissions';
import { useTranslation } from 'react-i18next';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BRANDING_TRANSLATIONS_EN = {
  // Page elements
  'توصيلات المياه': 'Water Connections',
  'توصيلات الصرف الصحي': 'Sewage Connections',
  'إدارة ومتابعة طلبات توصيل شبكة المياه': 'Manage and track water network connection requests',
  'إدارة ومتابعة طلبات توصيل الصرف الصحي': 'Manage and track sewage connection requests',
  'إجمالي توصيلات المياه': 'Total Water Connections',
  'إجمالي توصيلات الصرف الصحي': 'Total Sewage Connections',
  'المحددة': 'Selected',
  'إضافة توصيلة جديدة': 'Add New Connection',
  'إضافة توصيلة مياه جديدة': 'Add New Water Connection',
  'تعديل توصيلة مياه': 'Edit Water Connection',
  'إضافة توصيلة صرف صحي جديدة': 'Add New Sewage Connection',
  'تعديل توصيلة صرف صحي': 'Edit Sewage Connection',
  'توصيلة': 'Connection',
  'المقاولين': 'Contractors',
  'المقاول': 'Contractor',
  'اختر الحالة': 'Choose Status',
  'اختر المقاولين': 'Choose Contractors',
  'اختر المقاول': 'Choose Contractor',
  'حالة الطلب': 'Request Status',
  'بحث شامل... (رقم الطلب، العميل، الجوال، المنطقة)': 'Search... (Request No, Customer, Mobile, Area)',
  'تصفية متقدمة': 'Advanced Filter',
  'تطبيق التصفية': 'Apply Filter',
  'إعادة تعيين': 'Reset',
  'تحديث التوصيلات': 'Refresh Connections',
  'العودة لمركز التوصيلات': 'Back to Connections Hub',
  'تفاصيل التوصيلة': 'Connection Details',
  'معاينة الصور': 'Preview Images',
  'تحميل الصورة': 'Download Image',
  'تحميل الكل': 'Download All',
  'حذف': 'Delete',
  'تعديل': 'Edit',
  'عرض': 'View',
  'الصور': 'Images',
  'لا توجد صور لهذه التوصيلة': 'No images for this connection',
  'حفظ': 'Save',
  'إلغاء': 'Cancel',
  'تحديد الكل': 'Select All',
  'حذف المحدد': 'Delete Selected',
  'تصدير المحدد': 'Export Selected',
  'إجراءات': 'Actions',
  'بحث': 'Search',
  'عرض': 'View',
  'لا توجد توصيلات': 'No connections found',
  '📁': '📁',
  'جميع المشاريع': 'All Projects',
  'مراقب الاستشاري': 'Consultant Supervisor',
  'مراقب البلدية': 'Municipality Supervisor',
  'المنطقة / الحي': 'Area / Neighborhood',
  'العميل': 'Customer',
  'رقم CCP': 'CCP Number',
  'رقم الطلب': 'Request Number',
  'رقم الحساب': 'Account Number',
  'رقم الحصر': 'Restriction Number',
  'رقم البلاغ CCP': 'CCP Report Number',
  'اسم العميل': 'Customer Name',
  'رقم الجوال': 'Phone Number',
  'المنطقة': 'Area',
  'القطر': 'Diameter',
  'طول التوصيلة': 'Connection Length',
  'رقم التصريح': 'Permit Number',
  'عدد الوصلات': 'Connections Count',
  'قطر خط الشبكة 63': 'Network Line Diameter 63',
  'طول خط الشبكة': 'Network Line Length',
  'قطر خط الشبكة 16': 'Network Line Diameter 16',
  'رقم العداد': 'Meter Number',
  'نوع العداد': 'Meter Type',
  'تاريخ أمر الشغل': 'Work Order Date',
  'تاريخ التعميد': 'Commissioning Date',
  'تاريخ النشر': 'Publication Date',
  'تاريخ الإصدار': 'Issue Date',
  'تاريخ التنفيذ المتوقع': 'Expected Execution Date',
  'تاريخ التنفيذ': 'Execution Date',
  'تاريخ الإغلاق': 'Closing Date',
  'ملاحظات': 'Notes',
  'الإحداثيات': 'Coordinates',
  'نوع التوصيل': 'Connection Type',
  'طول التوصيلة بدون إضافي': 'Connection Length Without Extra',
  'طول التوصيلة بدون رئيسي': 'Connection Length Without Main',
  'عداد إزالة وتركيب': 'Meter Removal & Installation',
  'تاريخ إغلاق النظام': 'System Closing Date',
  'تاريخ الإلغاء': 'Cancellation Date',
  'سبب الإلغاء': 'Cancellation Reason',
  'جديد': 'New',
  'قيد التنفيذ': 'In Progress',
  'مكتمل': 'Completed',
  'ملغي': 'Cancelled',
  'الكل': 'All',
  
  // Projects
  'مشروع ايصال مكة': 'Makkah Connection Project',
  'مشروع ايصال الرياض': 'Riyadh Connection Project',
  'ايصال مكة': 'Makkah Connection',
  'ايصال الرياض': 'Riyadh Connection',

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

  // Contractors & Users
  'شركة الموسي': 'Al-Mousa Company',
  'جيزة العربية': 'Giza Arabia',
  'الاداء المتوازن': 'Balanced Performance',
  'حسين': 'Hussein',
  'م/ مدحت حسين': 'Eng. Medhat Hussein',
  'م/عبدالمنعم': 'Eng. Abdel Moneim',
  'ابراهيم حسين طائفي': 'Ibrahim Taifi',
  'سعد الدين': 'Saad El-Din',
  
  // Additional Form & Modal elements
  'تعديل توصيلة مياه': 'Edit Water Connection',
  'إضافة توصيلة مياه جديدة': 'Add New Water Connection',
  'جاري الاستيراد...': 'Importing...',
  'استيراد Excel': 'Import Excel',
  'قم بتعبئة البيانات المطلوبة. الحقول المعروضة تعتمد على صلاحيات المستخدم.': 'Please fill in the required fields. Displayed fields depend on user permissions.',
  'المعلومات التنظيمية': 'Organizational Information',
  'المحافظة': 'Governorate',
  'اختر المحافظة': 'Select Governorate',
  'المقاول': 'Contractor',
  'اختر المقاول': 'Select Contractor',
  'حالة الطلب': 'Request Status',
  'بيانات المستفيد': 'Beneficiary Info',
  'اسم العميل': 'Customer Name',
  'أدخل الاسم الرباعي': 'Enter full name',
  'المنطقة / الحي': 'Area / Neighborhood',
  'الأرقام المرجعية والتصاريح': 'Reference Numbers & Permits',
  'تاريخ أمر الشغل': 'Work Order Date',
  'تاريخ النشر': 'Publication Date',
  'تاريخ التنفيذ المتوقع': 'Expected Execution Date',
  'تاريخ التنفيذ': 'Execution Date',
  'تاريخ الإغلاق': 'System Closing Date',
  'تاريخ التعميد': 'Commissioning Date',
  'التواريخ والمواعيد': 'Dates & Schedules',
  'القياسات الفنية والعداد': 'Technical Measurements & Meter',
  'قطر الماسورة': 'Pipe Diameter',
  'مم': 'mm',
  'طول الماسورة': 'Pipe Length',
  'متر': 'meter',
  'قراءة العداد': 'Meter Reading',
  'الموقع الجغرافي (GPS)': 'Geographical Location (GPS)',
  'تحديد الموقع الحالي': 'Locate Current Position',
  'اختر نوع التوصيلة': 'Select Connection Type',
  'توصيلة مفردة': 'Single Connection',
  'توصيله مفرده': 'Single Connection',
  'شجرية': 'Tree Connection',
  'شجريه': 'Tree Connection',
  'صندوق وعداد على توصيله مقاول آخر': 'Box & Meter on another contractor\'s connection',
  'صندوق وعداد على توصيله نفس المقاول': 'Box & Meter on the same contractor\'s connection',
  'إزالة عداد وتركيب عداد جديد': 'Meter Removal & New Installation',
  'اختر': 'Select',
  'نعم': 'Yes',
  'لا': 'No',
  'أي ملاحظات إضافية...': 'Any additional notes...',
  'اختر صور': 'Select Images',
  'الكاميرا': 'Camera',
  'فيديو': 'Video',
  'حفظ التعديلات النهائية': 'Save Final Changes',
  'إضافة التوصيلة للنظام': 'Add Connection to System',
  'إلغاء والعودة': 'Cancel & Go Back',
  'تحديث': 'Refresh',
  'جميع المحافظات': 'All Governorates',
  'جميع الحالات': 'All Statuses'
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

// مكون اختيار الحالة مع إمكانية الإضافة/التعديل/الحذف
const StatusDropdown = ({ value, onChange, statuses, onAddStatus, onEditStatus, onDeleteStatus, isRtl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [editingStatus, setEditingStatus] = useState(null);
  const [editValue, setEditValue] = useState('');

  const handleAddStatus = () => {
    if (newStatus.trim()) {
      onAddStatus(newStatus.trim());
      setNewStatus('');
    }
  };

  const handleEditStatus = (status) => {
    if (editValue.trim() && editValue !== status) {
      onEditStatus(status, editValue.trim());
    }
    setEditingStatus(null);
    setEditValue('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center justify-between bg-white hover:border-blue-400 focus:ring-2 focus:ring-blue-500"
        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{translateBrandingText(value, isRtl) || translateBrandingText('اختر الحالة', isRtl)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {statuses.map((status) => (
            <div key={status} className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 group">
              {editingStatus === status ? (
                <div className="flex items-center gap-2 w-full">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm" autoFocus />
                  <button onClick={() => handleEditStatus(status)} className="text-green-600 hover:text-green-800">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingStatus(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => { onChange(status); setIsOpen(false); }} className="flex-1 text-start text-sm">
                    {translateBrandingText(status, isRtl)}
                  </button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={() => { setEditingStatus(status); setEditValue(status); }} className="text-blue-500 hover:text-blue-700 p-1">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={() => onDeleteStatus(status)} className="text-red-500 hover:text-red-700 p-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="border-t px-3 py-2">
            <div className="flex items-center gap-2">
              <input type="text" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                placeholder={translateBrandingText("إضافة حالة جديدة...", isRtl)} className="flex-1 px-2 py-1 border rounded text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddStatus()} />
              <button onClick={handleAddStatus} className="text-green-600 hover:text-green-800 p-1">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function WaterConnections({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    document.title = translateBrandingText("توصيلات المياه - WFM", isRtl);
    const handleTranslationUpdated = () => {
      document.title = translateBrandingText("توصيلات المياه - WFM", isRtl);
      forceUpdate(prev => prev + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdated);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdated);
  }, [isRtl]);

  const [connections, setConnections] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [editingConnection, setEditingConnection] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [images, setImages] = useState([]);
  const [compressingVideo, setCompressingVideo] = useState(false);
  const [videoCompressionProgress, setVideoCompressionProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // نظام تخزين الصور المؤقت (Cache)
  const [imagesCache, setImagesCache] = useState({});
  
  // Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);
  
  // تحديد التوصيلات للتصدير
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [statusList, setStatusList] = useState(['جديد', 'قيد التنفيذ', 'مكتمل', 'ملغي']);
  const [filterGovernorates, setFilterGovernorates] = useState([]);
  const [formGovernorates, setFormGovernorates] = useState([]);
  const urlProject = searchParams.get('project') || '';
  
  const [filters, setFilters] = useState({
    project: urlProject, governorate: '', request_number: '', ccb_report_number: '',
    date_from: '', date_to: '', request_status: ''
  });
  
  const initialFormData = {
    project: '', governorate: '', contractor: '', account_number: '', request_number: '',
    restriction_number: '', ccb_report_number: '', customer_name: '', phone_number: '',
    area: '', work_order_date: '', diameter: '', connection_length: '', notes: '',
    latitude: '', longitude: '', commissioning_date: '', permit_number: '',
    publication_date: '', issue_date: '', expected_execution_date: '', connection_type: '',
    connections_count: '', connection_length_without_extra: '', connections_length_without_main: '',
    network_diameter_63: '', network_line_length: '', network_diameter_16: '',
    meter_number: '', meter_type: '', meter_removal_installation: '', execution_date: '',
    system_closing_date: '', request_status: 'جديد', cancellation_date: '', cancellation_reason: ''
  };
  
  const [formData, setFormData] = useState(initialFormData);

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit);
    newParams.set('page', 1);
    setSearchParams(newParams);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  const fetchConnections = useCallback(async () => {
    try {
      // setLoading(true);
      const params = new URLSearchParams();
      if (filters.project) params.append('project', filters.project);
      if (filters.governorate) params.append('governorate', filters.governorate);
      if (filters.request_status) params.append('status', filters.request_status);
      if (filters.request_number) params.append('request_number', filters.request_number);
      if (filters.ccb_report_number) params.append('ccb_report_number', filters.ccb_report_number);
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await axios.get(`${API}/water-connections?${params}`);
      const data = response.data;
      
      // Handle both old and new response format
      if (Array.isArray(data)) {
        setConnections(data);
        setFilteredConnections(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setConnections(data.connections || []);
        setFilteredConnections(data.connections || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      if (error.response?.status !== 403) toast.error('فشل في تحميل التوصيلات');
    } finally {
      setLoading(false);
      // التمرير للأعلى عند جلب نتائج جديدة
      const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    }
  }, [filters.project, filters.governorate, filters.request_status, filters.request_number, filters.ccb_report_number, filters.date_from, filters.date_to, currentPage, itemsPerPage]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  const fetchContractors = useCallback(async (projectName) => {
    try {
      const response = await axios.get(`${API}/contractors`, { params: { project: projectName } });
      setContractors(response.data);
    } catch (error) {
      console.error('Failed to fetch contractors:', error);
    }
  }, []);

  const fetchFilterGovernorates = useCallback(async (projectName) => {
    try {
      const response = await axios.get(`${API}/governorates${projectName ? `?project=${encodeURIComponent(projectName)}` : ''}`);
      setFilterGovernorates(response.data);
    } catch (error) {
      console.error('Error fetching filter governorates:', error);
    }
  }, []);

  const fetchFormGovernorates = useCallback(async (projectName) => {
    try {
      const response = await axios.get(`${API}/governorates${projectName ? `?project=${encodeURIComponent(projectName)}` : ''}`);
      setFormGovernorates(response.data);
    } catch (error) {
      console.error('Error fetching form governorates:', error);
    }
  }, []);

  // جلب المحافظات للفلتر بناءً على المشروع النشط في الفلتر
  useEffect(() => {
    fetchFilterGovernorates(filters.project);
  }, [fetchFilterGovernorates, filters.project]);

  // جلب المحافظات للفورم عند تغيير مشروع الفورم
  useEffect(() => {
    fetchFormGovernorates(formData.project);
  }, [fetchFormGovernorates, formData.project]);

  useEffect(() => { 
    fetchConnections(); 
    fetchProjects(); 
  }, [fetchConnections, fetchProjects]);
  useEffect(() => { if (formData.project) fetchContractors(formData.project); }, [formData.project]);

  useEffect(() => {
    let result = [...connections];
    // تم حذف الفلترة المحلية للمشروع لأن الـ Backend يقوم بالفلترة المرنة المطلوبة
    if (filters.request_number) result = result.filter(c => c.request_number?.toLowerCase().includes(filters.request_number.toLowerCase()));
    if (filters.governorate) result = result.filter(c => c.governorate === filters.governorate);
    if (filters.ccb_report_number) result = result.filter(c => c.ccb_report_number?.toLowerCase().includes(filters.ccb_report_number.toLowerCase()));
    if (filters.request_status) result = result.filter(c => c.request_status === filters.request_status);
    if (filters.date_from) result = result.filter(c => c.work_order_date >= filters.date_from);
    if (filters.date_to) result = result.filter(c => c.work_order_date <= filters.date_to);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.request_number?.toLowerCase().includes(query) ||
        c.ccb_report_number?.toLowerCase().includes(query) ||
        c.customer_name?.toLowerCase().includes(query) ||
        c.phone_number?.toLowerCase().includes(query) ||
        c.area?.toLowerCase().includes(query) ||
        c.contractor?.toLowerCase().includes(query)
      );
    }
    
    setFilteredConnections(result);
  }, [filters, connections, searchQuery]);

  // تحديد/إلغاء تحديد توصيلة
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // تحديد/إلغاء تحديد الكل
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredConnections.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredConnections.map(c => c.id));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ project: '', governorate: '', request_number: '', ccb_report_number: '', date_from: '', date_to: '', request_status: '' });
    setSearchQuery('');
    setSelectedIds([]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => { setFormData({ ...initialFormData, project: urlProject }); setEditingConnection(null); setImages([]); };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      // الموقع غير مدعوم - لا نعرض رسالة خطأ
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        toast.success('تم تحديد الموقع بنجاح');
      },
      (error) => {
        // لا نعرض رسالة خطأ محبطة - فقط في حالة رفض المستخدم بشكل صريح
        if (error.code === error.PERMISSION_DENIED) {
          // المستخدم رفض - لا نعرض شيء
          console.log('Location permission denied');
        }
        // في باقي الحالات (timeout, position unavailable) - لا نزعج المستخدم
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  };

  const compressImage = async (file) => {
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
    try { return await imageCompression(file, options); }
    catch { return file; }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const compressedImages = [];
    toast.info('⏳ جاري ضغط الصور...', { autoClose: 1500 });
    for (const file of files) {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onload = () => {
        compressedImages.push(reader.result);
        if (compressedImages.length === files.length) {
          setImages(prev => [...prev, ...compressedImages]);
          toast.success(`✅ تم ضغط ${files.length > 1 ? files.length + ' صور' : 'الصورة'} تلقائياً إلى 100KB`, { autoClose: 2500 });
        }
      };
      reader.readAsDataURL(compressed);
    }
  };

  // دالة ضغط الفيديو تلقائياً إلى 300KB كحد أقصى (تُرجع Base64)
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
        const scale = Math.min(1, 480 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d');
        
        video.play().catch(e => {
          setCompressingVideo(false);
          reject(e);
        });
        
        const stream = canvas.captureStream(24);
        const duration = video.duration || 15;
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
          const reader = new FileReader();
          reader.onload = () => {
            setCompressingVideo(false);
            resolve(reader.result);
          };
          reader.readAsDataURL(compressedBlob);
          URL.revokeObjectURL(video.src);
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
    
    // التحقق من جميع الحقول الإجبارية
    const requiredFields = [
      { field: 'project', label: 'المشروع' },
      { field: 'contractor', label: 'المقاول' },
      { field: 'customer_name', label: 'اسم العميل' },
      { field: 'phone_number', label: 'رقم الجوال' },
      { field: 'area', label: 'المنطقة' },
      { field: 'request_number', label: 'رقم الطلب' },
      { field: 'request_status', label: 'الحالة' }
    ];
    
    const missingFields = requiredFields.filter(f => !formData[f.field]?.trim());
    if (missingFields.length > 0) {
      toast.error(`الحقول التالية مطلوبة: ${missingFields.map(f => f.label).join('، ')}`);
      return;
    }

    // حفظ البيانات مع الصور
    const dataToSend = { ...formData };
    const pendingImages = [...images]; // صور جديدة مضافة
    
    // جلب الصور الموجودة من السيرفر إذا كنا في وضع التعديل
    let existingImages = [];
    if (editingConnection) {
      try {
        const imgResponse = await axios.get(`${API}/water-connections/${editingConnection.id}/images`);
        existingImages = imgResponse.data.images || [];
      } catch (err) {
        existingImages = editingConnection?.images || [];
      }
    }

    try {
      let savedId;
      
      // دمج الصور الموجودة مع الجديدة
      const allImages = [...existingImages, ...pendingImages];
      dataToSend.images = allImages;
      
      if (editingConnection) {
        await axios.put(`${API}/water-connections/${editingConnection.id}`, dataToSend);
        savedId = editingConnection.id;
        toast.success('✅ تم حفظ التوصيلة بنجاح');
      } else {
        const response = await axios.post(`${API}/water-connections`, dataToSend);
        savedId = response.data.id;
        toast.success('✅ تم إضافة التوصيلة بنجاح');
      }
      
      if (pendingImages.length > 0) {
        toast.info(`تم رفع ${pendingImages.length} صورة جديدة`, { autoClose: 2000 });
      }
      
      // تحديث الكاش للصور الجديدة
      if (allImages.length > 0) {
        setImagesCache(prev => ({ ...prev, [savedId]: allImages }));
      }
      
      setShowModal(false);
      resetForm();
      fetchConnections();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'فشل في حفظ التوصيلة');
    }
  };

  const handleEdit = async (conn) => {
    setEditingConnection({ ...conn, images: [] }); // نفتح النافذة مباشرة بدون الصور
    setFormData({ ...initialFormData, ...conn });
    setImages([]);
    setShowModal(true);
    
    // جلب الصور في الخلفية
    if (conn.images_count > 0) {
      try {
        const response = await axios.get(`${API}/water-connections/${conn.id}/images`);
        setEditingConnection(prev => ({ ...prev, images: response.data.images }));
      } catch (err) {
        console.log('Failed to load images');
      }
    }
  };

  // عرض التفاصيل فقط (للقراءة)
  const handleView = async (conn) => {
    setSelectedConnection(conn);
    setShowViewModal(true);
    
    // جلب الصور عند فتح نافذة العرض إذا لم تكن موجودة
    if (!conn.images && conn.images_count > 0) {
      try {
        const response = await axios.get(`${API}/water-connections/${conn.id}/images`);
        setSelectedConnection(prev => ({ ...prev, images: response.data.images }));
      } catch (err) {
        console.log('Failed to load images');
      }
    }
  };

  // عرض الصور فقط مع إمكانية التحميل - جلب الصور عند الطلب مع Cache
  const handleViewImages = async (conn) => {
    // التحقق من وجود الصور في الـ Cache
    if (imagesCache[conn.id]) {
      setSelectedConnection({ ...conn, images: imagesCache[conn.id], loadingImages: false });
      setShowImagesModal(true);
      return;
    }
    
    setSelectedConnection({ ...conn, images: [], loadingImages: true });
    setShowImagesModal(true);
    
    try {
      const response = await axios.get(`${API}/water-connections/${conn.id}/images`);
      const loadedImages = response.data.images || [];
      
      // حفظ الصور في الـ Cache
      setImagesCache(prev => ({ ...prev, [conn.id]: loadedImages }));
      setSelectedConnection(prev => ({ ...prev, images: loadedImages, loadingImages: false }));
    } catch (err) {
      toast.error('فشل في تحميل الصور');
      setSelectedConnection(prev => ({ ...prev, loadingImages: false }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه التوصيلة؟')) return;
    try {
      await axios.delete(`${API}/water-connections/${id}`);
      toast.success('تم حذف التوصيلة بنجاح');
      setSelectedIds(prev => prev.filter(i => i !== id));
      fetchConnections();
    } catch (error) {
      toast.error('فشل في حذف التوصيلة');
    }
  };

  const deleteImage = async (connId, imgIndex) => {
    try {
      // جلب الصور الحالية أولاً
      const response = await axios.get(`${API}/water-connections/${connId}/images`);
      const currentImages = response.data.images || [];
      const newImages = [...currentImages];
      newImages.splice(imgIndex, 1);
      await axios.put(`${API}/water-connections/${connId}`, { images: newImages });
      toast.success('تم حذف الصورة');
      fetchConnections();
      if (selectedConnection?.id === connId) {
        setSelectedConnection({ ...selectedConnection, images: newImages });
      }
    } catch (error) {
      toast.error('فشل في حذف الصورة');
    }
  };

  // تحميل صورة
  const downloadImage = (imageData, index) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `صورة_توصيلة_${selectedConnection?.request_number || 'unknown'}_${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('تم تحميل الصورة');
  };

  // تحميل جميع الصور
  const downloadAllImages = () => {
    if (!selectedConnection?.images?.length) return;
    selectedConnection.images.forEach((img, idx) => {
      setTimeout(() => downloadImage(img, idx), idx * 300);
    });
  };

  // استيراد من Excel
  const [importLoading, setImportLoading] = useState(false);
  
  const handleImportExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('يجب رفع ملف Excel (.xlsx أو .xls)');
      event.target.value = '';
      return;
    }
    
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/water-connections/import-excel`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000
      });
      
      const { imported, skipped, message } = response.data;
      
      if (imported > 0) {
        toast.success(`✅ ${message}`, { duration: 5000 });
        fetchConnections();
      } else if (skipped > 0) {
        toast.info(`⚠️ ${message}`, { duration: 5000 });
      } else {
        toast.error('❌ لم يتم استيراد أي توصيلة', { duration: 5000 });
      }
      
    } catch (error) {
      console.error('Import error:', error);
      const errorMsg = error.response?.data?.detail || 'حدث خطأ في استيراد الملف';
      toast.error(`❌ ${errorMsg}`);
    } finally {
      setImportLoading(false);
      event.target.value = '';
    }
  };

  const handleAddStatus = (newStatus) => {
    if (!statusList.includes(newStatus)) {
      setStatusList([...statusList, newStatus]);
      toast.success('تمت إضافة الحالة');
    }
  };

  const handleEditStatus = (oldStatus, newStatus) => {
    if (!statusList.includes(newStatus)) {
      setStatusList(statusList.map(s => s === oldStatus ? newStatus : s));
      toast.success('تم تعديل الحالة');
    }
  };

  const handleDeleteStatus = (status) => {
    if (window.confirm(`هل أنت متأكد من حذف الحالة "${status}"؟`)) {
      setStatusList(statusList.filter(s => s !== status));
      toast.success('تم حذف الحالة');
    }
  };

  // الحصول على التوصيلات للتصدير
  const getConnectionsToExport = () => {
    if (selectedIds.length > 0) {
      return filteredConnections.filter(c => selectedIds.includes(c.id));
    }
    return filteredConnections;
  };

  const exportToExcel = async () => {
    const connectionsToExport = getConnectionsToExport();
    if (connectionsToExport.length === 0) { toast.error('لا توجد بيانات للتصدير'); return; }
    setExporting(true);
    try {
      const projectName = filters.project || 'جميع المشاريع';
      const response = await axios.post(`${API}/water-connections/export/excel`, {
        connections: connectionsToExport, project_name: projectName
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `توصيلات_المياه_${projectName}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`تم تصدير ${connectionsToExport.length} توصيلة إلى Excel`);
    } catch (error) {
      toast.error('فشل في تصدير Excel');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    const connectionsToExport = getConnectionsToExport();
    if (connectionsToExport.length === 0) { toast.error('لا توجد بيانات للتصدير'); return; }
    setExporting(true);
    try {
      const projectName = filters.project || 'جميع المشاريع';
      const response = await axios.post(`${API}/water-connections/export/pdf`, {
        connections: connectionsToExport, project_name: projectName
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `توصيلات_المياه_${projectName}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`تم تصدير ${connectionsToExport.length} توصيلة إلى PDF`);
    } catch (error) {
      toast.error('فشل في تصدير PDF');
    } finally {
      setExporting(false);
    }
  };

  const statusColors = {
    'جديد': 'bg-blue-100 text-blue-800 border-blue-300',
    'قيد التنفيذ': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'مكتمل': 'bg-green-100 text-green-800 border-green-300',
    'ملغي': 'bg-red-100 text-red-800 border-red-300'
  };

  const fields = [
    ['account_number', 'رقم الحساب'], ['request_number', 'رقم الطلب'], ['restriction_number', 'رقم الحصر'],
    ['ccb_report_number', 'رقم البلاغ CCP'], ['customer_name', 'اسم العميل'], ['phone_number', 'رقم الجوال'],
    ['area', 'المنطقة'], ['diameter', 'القطر'], ['connection_length', 'طول التوصيلة'],
    ['permit_number', 'رقم التصريح'], ['connections_count', 'عدد الوصلات'],
    ['network_diameter_63', 'قطر خط الشبكة 63'], ['network_line_length', 'طول خط الشبكة'],
    ['network_diameter_16', 'قطر خط الشبكة 16'], ['meter_number', 'رقم العداد'], ['meter_type', 'نوع العداد']
  ];

  const dateFields = [
    ['work_order_date', 'تاريخ أمر الشغل'], ['commissioning_date', 'تاريخ التعميد'],
    ['publication_date', 'تاريخ النشر'], ['issue_date', 'تاريخ الإصدار'],
    ['expected_execution_date', 'تاريخ التنفيذ المتوقع'], ['execution_date', 'تاريخ التنفيذ'],
    ['system_closing_date', 'تاريخ الإغلاق']
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto" data-testid="water-connections-page">
        {/* Premium Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white p-8 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-600/20 rounded-3xl blur-xl group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Droplet className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-3 mb-1">
                <Link 
                  to={`/connections-hub?project=${encodeURIComponent(urlProject)}`}
                  className="p-2 bg-white hover:bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100 transition-all hover:scale-110 active:scale-95"
                  title={translateBrandingText("العودة لمركز التوصيلات", isRtl)}
                >
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {translateBrandingText("توصيلات المياه", isRtl)}
                  <span className="bg-blue-600 text-[10px] text-white px-2 py-0.5 rounded-md uppercase tracking-widest font-black">Water</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-blue-600 font-bold bg-blue-50 px-4 py-1 rounded-xl border border-blue-100/50">
                <span className="text-base">📁</span>
                <span className="text-sm">{translateBrandingText(urlProject, isRtl) || translateBrandingText('جميع المشاريع', isRtl)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translateBrandingText("إجمالي توصيلات المياه", isRtl)}</p>
                <p className="text-xl font-black text-slate-700 leading-none">{filteredConnections.length}</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{translateBrandingText("المحددة", isRtl)}</p>
                <p className="text-xl font-black text-blue-600 leading-none">{selectedIds.length}</p>
              </div>
            </div>

            <button 
              onClick={() => { resetForm(); getCurrentLocation(); setShowModal(true); }}
              className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-200 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>{translateBrandingText("إضافة توصيلة جديدة", isRtl)}</span>
            </button>
          </div>
        </div>

        {/* Search and Action Buttons */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={translateBrandingText("بحث شامل... (رقم الطلب، العميل، الجوال، المنطقة)", isRtl)}
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                data-testid="water-search-input" />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex flex-col items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-600">{translateBrandingText("بحث", isRtl)}</span>
            </button>
            <button onClick={fetchConnections}
              className="flex flex-col items-center gap-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <List className="w-5 h-5 text-blue-600" />
              <span className="text-xs text-blue-600">{translateBrandingText("عرض", isRtl)}</span>
            </button>
            <button onClick={exportToPDF} disabled={exporting}
              data-testid="export-pdf-btn"
              className="flex flex-col items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
              <FileText className="w-5 h-5" />
              <span className="text-xs">PDF {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
            </button>
            <button onClick={exportToExcel} disabled={exporting}
              data-testid="export-excel-btn"
              className="flex flex-col items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="text-xs">Excel {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
            </button>
            <button onClick={resetFilters}
              className="flex flex-col items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
              <RefreshCw className="w-5 h-5 text-gray-600" />
              <span className="text-xs text-gray-600">{translateBrandingText("تحديث", isRtl)}</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t">
              <select name="project" value={filters.project} onChange={handleFilterChange} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-w-[300px]">
                {!urlProject && <option value="">{translateBrandingText("جميع المشاريع", isRtl)}</option>}
                {projects
                  .filter(p => !urlProject || p.name === urlProject)
                  .map(p => <option key={p.id} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)
                }
              </select>
              <select name="governorate" value={filters.governorate} onChange={handleFilterChange} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">{translateBrandingText("جميع المحافظات", isRtl)}</option>
                {filterGovernorates.map((g, idx) => {
                  const name = typeof g === 'string' ? g : (g.name || g);
                  return (
                    <option key={idx} value={name}>
                      {translateBrandingText(name, isRtl)}
                    </option>
                  );
                })}
              </select>
              <input type="text" name="request_number" value={filters.request_number} onChange={handleFilterChange}
                placeholder={translateBrandingText("رقم الطلب", isRtl)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              <input type="text" name="ccb_report_number" value={filters.ccb_report_number} onChange={handleFilterChange}
                placeholder={translateBrandingText("رقم CCP", isRtl)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              <select name="request_status" value={filters.request_status} onChange={handleFilterChange} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                <option value="">{translateBrandingText("جميع الحالات", isRtl)}</option>
                {statusList.map(s => <option key={s} value={s}>{translateBrandingText(s, isRtl)}</option>)}
              </select>
              <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
              <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} 
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10 bg-white rounded-xl shadow">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
            <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">لا توجد توصيلات</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gradient-to-l from-blue-50 to-blue-100 border-b border-blue-200">
                  <tr>
                    <th className="px-3 py-4 text-center">
                      <button onClick={toggleSelectAll} className="p-1 hover:bg-blue-200 rounded transition-colors">
                        {selectedIds.length === filteredConnections.length && filteredConnections.length > 0
                          ? <CheckSquare className="w-5 h-5 text-blue-600" />
                          : <Square className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                    </th>
                    {['#', 'رقم الطلب', 'رقم CCP', 'العميل', 'المحافظة', 'المقاول', 'المنطقة / الحي', 'الحالة', 'مراقب الاستشاري', 'إجراءات'].map(h => (
                      <th key={h} className="px-4 py-4 text-center text-xs font-black text-blue-900 uppercase tracking-wider">{translateBrandingText(h, isRtl)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredConnections.map((conn, idx) => (
                    <tr key={conn.id} className={`hover:bg-blue-50/50 transition-colors ${selectedIds.includes(conn.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => toggleSelect(conn.id)} className="p-1 hover:bg-blue-100 rounded transition-colors">
                          {selectedIds.includes(conn.id)
                            ? <CheckSquare className="w-5 h-5 text-blue-600" />
                            : <Square className="w-5 h-5 text-gray-400" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-500 font-bold">{idx + 1}</td>
                      <td className="px-4 py-4 text-center font-black text-slate-800 whitespace-nowrap">{conn.request_number || '-'}</td>
                      <td className="px-4 py-4 text-center text-slate-600 font-medium">
                        {conn.ccb_report_number ? (conn.ccb_report_number.startsWith('CCP-') ? conn.ccb_report_number : (conn.ccb_report_number.startsWith('CCB-') ? conn.ccb_report_number.replace('CCB-', 'CCP-') : `CCP-${conn.ccb_report_number}`)) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-800">{conn.customer_name ? translateBrandingText(conn.customer_name, isRtl) : '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100 font-black text-xs">
                          {translateBrandingText(conn.governorate, isRtl) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600 text-xs">{translateBrandingText(conn.contractor, isRtl) || '-'}</td>
                      <td className="px-4 py-4 text-center text-slate-600 text-xs">{translateBrandingText(conn.area, isRtl) || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${statusColors[conn.request_status] || 'bg-gray-100 text-gray-600'}`}>
                          {translateBrandingText(conn.request_status, isRtl)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {conn.created_by_name ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-[11px] font-bold text-slate-700">{translateBrandingText(conn.created_by_name, isRtl)}</span>
                            {conn.created_at && <span className="text-[9px] text-slate-400">{new Date(conn.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>}
                          </div>
                        ) : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleView(conn)} 
                            data-testid={`view-btn-${conn.id}`}
                            className="flex flex-col items-center gap-0.5 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title={translateBrandingText("عرض التفاصيل", isRtl)}>
                            <Eye className="w-4 h-4" />
                            <span className="text-[10px]">{translateBrandingText("عرض", isRtl)}</span>
                          </button>
                          <button onClick={() => handleViewImages(conn)}
                            data-testid="view-images-btn"
                            className="flex flex-col items-center gap-0.5 p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title={translateBrandingText("عرض الصور", isRtl)}>
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-[10px]">{(conn.images || []).length > 0 ? `${translateBrandingText("الصور", isRtl)} (${conn.images.length})` : translateBrandingText("الصور", isRtl)}</span>
                          </button>
                          <button onClick={() => handleEdit(conn)} 
                            data-testid={`edit-btn-${conn.id}`}
                            className="flex flex-col items-center gap-0.5 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title={translateBrandingText("تعديل", isRtl)}>
                            <Edit2 className="w-4 h-4" />
                            <span className="text-[10px]">{translateBrandingText("تعديل", isRtl)}</span>
                          </button>
                          <button onClick={() => handleDelete(conn.id)} 
                            data-testid={`delete-btn-${conn.id}`}
                            className="flex flex-col items-center gap-0.5 p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title={translateBrandingText("حذف", isRtl)}>
                            <Trash2 className="w-4 h-4" />
                            <span className="text-[10px]">{translateBrandingText("حذف", isRtl)}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              itemLabel="توصيلة"
            />
          </div>
        )}

        {/* نافذة عرض التفاصيل (للقراءة فقط) */}
        {showViewModal && selectedConnection && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-l from-emerald-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  {translateBrandingText("تفاصيل التوصيلة", isRtl)}
                </h2>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-6">
                {/* معلومات المُنشئ */}
                {selectedConnection.created_by_name && (
                  <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-start">
                      <span className="text-blue-700 text-xs font-semibold block">{translateBrandingText("مراقب الاستشاري", isRtl)}</span>
                      <p className="text-blue-900 font-medium">{translateBrandingText(selectedConnection.created_by_name, isRtl)}</p>
                      {selectedConnection.created_at && (
                        <p className="text-blue-600 text-xs mt-0.5">
                          {new Date(selectedConnection.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { 
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-start">
                  {[
                    ['المشروع', selectedConnection.project],
                    ['المحافظة', selectedConnection.governorate],
                    ['المقاول', selectedConnection.contractor],
                    ['رقم الطلب', selectedConnection.request_number],
                    ['رقم CCP', selectedConnection.ccb_report_number],
                    ['رقم الحساب', selectedConnection.account_number],
                    ['رقم الحصر', selectedConnection.restriction_number],
                    ['اسم العميل', selectedConnection.customer_name],
                    ['رقم الجوال', selectedConnection.phone_number],
                    ['المنطقة', selectedConnection.area],
                    ['القطر', selectedConnection.diameter],
                    ['طول التوصيلة', selectedConnection.connection_length],
                    ['رقم التصريح', selectedConnection.permit_number],
                    ['عدد الوصلات', selectedConnection.connections_count],
                    ['رقم العداد', selectedConnection.meter_number],
                    ['نوع العداد', selectedConnection.meter_type],
                    ['الحالة', selectedConnection.request_status],
                    ['تاريخ أمر الشغل', selectedConnection.work_order_date],
                    ['تاريخ التنفيذ', selectedConnection.execution_date],
                    ['خط العرض', selectedConnection.latitude],
                    ['خط الطول', selectedConnection.longitude],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-gray-500 text-xs block mb-1">{translateBrandingText(label, isRtl)}</span>
                      <p className="font-semibold text-gray-800">{value ? translateBrandingText(value, isRtl) : '-'}</p>
                    </div>
                  ))}
                </div>

                {selectedConnection.notes && (
                  <div className="mt-4 bg-amber-50 p-4 rounded-lg border border-amber-200 text-start">
                    <span className="text-amber-700 text-xs font-semibold block mb-1">{translateBrandingText("ملاحظات", isRtl)}</span>
                    <p className="text-gray-800">{selectedConnection.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <button onClick={() => setShowViewModal(false)} 
                    className="flex-1 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                    {translateBrandingText("إغلاق", isRtl)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة عرض الصور - تصميم خفيف وسريع */}
        {showImagesModal && selectedConnection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-fade-in" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <div className="bg-purple-50 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-l from-purple-600 to-purple-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
                <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{translateBrandingText("معاينة الصور", isRtl)} - </span>
                  <span>{selectedConnection.request_number || translateBrandingText('الصور', isRtl)}</span>
                  {(selectedConnection.images || []).length > 0 && (
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {selectedConnection.images.length}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  {(selectedConnection.images || []).length > 0 && (
                    <button onClick={downloadAllImages} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm transition-colors">
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{translateBrandingText("تحميل الكل", isRtl)}</span>
                    </button>
                  )}
                  <button onClick={() => setShowImagesModal(false)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors">
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-70px)]">
                {selectedConnection.loadingImages ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-500" />
                    </div>
                    <p className="text-purple-600 text-base sm:text-lg font-medium">{translateBrandingText("جاري تحميل الصور...", isRtl)}</p>
                  </div>
                ) : (selectedConnection.images || []).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">{translateBrandingText("لا توجد صور لهذه التوصيلة", isRtl)}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                    {selectedConnection.images.map((img, i) => (
                      <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        {/* الصورة */}
                        <div className="relative aspect-square cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }}>
                          {isVideo(img) ? (
                            <video src={resolveImageUrl(img)} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                          ) : (
                            <img src={resolveImageUrl(img)} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                          )}
                          {isVideo(img) && (
                            <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1 text-white z-10">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                            </div>
                          )}
                          {/* أيقونة العين للعرض */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 z-20">
                            <Eye className="w-8 h-8 text-white drop-shadow-lg" />
                          </div>
                        </div>
                        {/* معلومات الصورة */}
                        <div className="p-2 sm:p-3 bg-purple-100/50 flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-purple-800">{translateBrandingText("الصور", isRtl)} {i + 1}</p>
                            <p className="text-[10px] sm:text-xs text-purple-600">{selectedConnection.request_number}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); downloadImage(img, i); }}
                            className="p-1.5 sm:p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            title={translateBrandingText("تحميل الصورة", isRtl)}>
                            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}        {/* نافذة التعديل (Add/Edit Modal) - تصميم محسن - حجم الصفحة كاملة */}
        {showModal && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center border-b z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl">
                  {editingConnection ? <Edit2 className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingConnection ? translateBrandingText('تعديل توصيلة مياه', isRtl) : translateBrandingText('إضافة توصيلة مياه جديدة', isRtl)}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Water Connection Management</p>
                </div>
                {!editingConnection && (user?.role === 'admin' || hasProjectPermission(user, urlProject, 'water_connections_import')) && (
                  <label className={`flex items-center gap-2 px-3 py-1.5 ${importLoading ? 'bg-blue-100' : 'bg-blue-50 hover:bg-blue-100'} text-blue-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-blue-200 ml-4`}>
                    {importLoading ? (
                      <><RefreshCw className="w-3 h-3 animate-spin" /> {translateBrandingText("جاري الاستيراد...", isRtl)}</>
                    ) : (
                      <><FileSpreadsheet className="w-3 h-3" /> {translateBrandingText("استيراد Excel", isRtl)}</>
                    )}
                    <input type="file" accept=".xlsx,.xls" onChange={handleImportExcel} className="hidden" disabled={importLoading} />
                  </label>
                )}
              </div>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-50/30">
              <div className="max-w-7xl mx-auto w-full p-6">
                {/* Hint Box */}
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-start">
                  <p className="text-sm text-blue-700 flex items-center gap-2">
                    <span className="text-blue-500">💡</span>
                    {translateBrandingText("قم بتعبئة البيانات المطلوبة. الحقول المعروضة تعتمد على صلاحيات المستخدم.", isRtl)}
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6 text-start">
                {/* القسم الأول: المعلومات الأساسية */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-blue-200">
                      <LayoutIcon className="w-4 h-4" />
                    </span>
                    {translateBrandingText("المعلومات التنظيمية", isRtl)}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        {translateBrandingText("المحافظة", isRtl)} <span className="text-red-500">*</span>
                      </label>
                      <select name="governorate" value={formData.governorate} onChange={handleInputChange} required 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all outline-none">
                        <option value="">{translateBrandingText("اختر المحافظة", isRtl)}</option>
                        {formGovernorates.map((gov, idx) => {
                          const name = typeof gov === 'string' ? gov : gov.name;
                          return (
                            <option key={idx} value={name}>
                              {translateBrandingText(name, isRtl)}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-500" />
                        {translateBrandingText("المقاول", isRtl)} <span className="text-red-500">*</span>
                      </label>
                      <select name="contractor" value={formData.contractor} onChange={handleInputChange} required 
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all outline-none" disabled={!formData.project}>
                        <option value="">{translateBrandingText("اختر المقاول", isRtl)}</option>
                        {contractors.map(c => <option key={c.id} value={c.name}>{translateBrandingText(c.name, isRtl)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-blue-500" />
                        {translateBrandingText("حالة الطلب", isRtl)} <span className="text-red-500">*</span>
                      </label>
                      <StatusDropdown
                        value={formData.request_status}
                        onChange={(val) => setFormData(prev => ({ ...prev, request_status: val }))}
                        statuses={statusList}
                        onAddStatus={handleAddStatus}
                        onEditStatus={handleEditStatus}
                        onDeleteStatus={handleDeleteStatus}
                        isRtl={isRtl}
                      />
                    </div>
                  </div>
                </div>

                {/* القسم الثاني: بيانات العميل */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                    <span className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-green-200">
                      <UserCheck className="w-4 h-4" />
                    </span>
                    {translateBrandingText("بيانات المستفيد", isRtl)}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-start">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("اسم العميل", isRtl)} <span className="text-red-500">*</span></label>
                      <input type="text" name="customer_name" value={formData.customer_name} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("أدخل الاسم الرباعي", isRtl)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم الحساب", isRtl)}</label>
                      <input type="text" name="account_number" value={formData.account_number || ''} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("رقم الحساب", isRtl)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none font-mono" />
                    </div>
                    {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_phone')) && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم الجوال", isRtl)} <span className="text-red-500">*</span></label>
                        <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange}
                          autoComplete="off" placeholder="05xxxxxxxx"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("المنطقة / الحي", isRtl)} <span className="text-red-500">*</span></label>
                      <input type="text" name="area" value={formData.area} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("المنطقة", isRtl)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none" />
                      <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Project:</span>
                        <span className="text-[10px] font-bold text-blue-600">{translateBrandingText(formData.project, isRtl) || translateBrandingText('غير مححدد', isRtl)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* القسم الثالث: أرقام مرجعية */}
                {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || 
                  hasProjectPermission(user, urlProject, 'connections_show_request_number') || 
                  hasProjectPermission(user, urlProject, 'connections_show_restriction_number') ||
                  hasProjectPermission(user, urlProject, 'connections_show_account_number') ||
                  hasProjectPermission(user, urlProject, 'connections_show_ccb_number')) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                      <span className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-purple-200">
                        <Hash className="w-4 h-4" />
                      </span>
                      {translateBrandingText("الأرقام المرجعية والتصاريح", isRtl)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_request_number')) && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم الطلب", isRtl)} <span className="text-red-500">*</span></label>
                          <input type="text" name="request_number" value={formData.request_number} onChange={handleInputChange}
                            autoComplete="off" placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-mono" />
                        </div>
                      )}
                      {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_restriction_number')) && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم الحصر", isRtl)}</label>
                          <input type="text" name="restriction_number" value={formData.restriction_number || ''} onChange={handleInputChange}
                            autoComplete="off" placeholder="H-000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" />
                        </div>
                      )}
                      {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_ccb_number')) && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم بلاغ CCP", isRtl)}</label>
                          <input type="text" name="ccb_report_number" value={formData.ccb_report_number || ''} onChange={handleInputChange}
                            autoComplete="off" placeholder="CCP-000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم التصريح", isRtl)}</label>
                        <input type="text" name="permit_number" value={formData.permit_number || ''} onChange={handleInputChange}
                          autoComplete="off" placeholder="P-000"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {/* القسم الرابع: التواريخ */}
                {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_dates')) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-orange-200">
                        <Calendar className="w-4 h-4" />
                      </span>
                      {translateBrandingText("التواريخ والمواعيد", isRtl)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {dateFields.map(([name, label]) => (
                        <div key={name}>
                          <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText(label, isRtl)}</label>
                          <input type="date" name={name} value={formData[name]} onChange={handleInputChange} 
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all outline-none" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* القسم الخامس: القياسات والعداد */}
                {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || 
                  hasProjectPermission(user, urlProject, 'connections_show_measurements') || hasProjectPermission(user, urlProject, 'connections_show_meter')) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                      <span className="w-8 h-8 bg-cyan-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-cyan-200">
                        <Activity className="w-4 h-4" />
                      </span>
                      {translateBrandingText("القياسات الفنية والعداد", isRtl)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_measurements')) && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("قطر الماسورة", isRtl)}</label>
                            <input type="text" name="diameter" value={formData.diameter || ''} onChange={handleInputChange}
                              autoComplete="off" placeholder={translateBrandingText("مم", isRtl)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("طول الماسورة", isRtl)}</label>
                            <input type="text" name="connection_length" value={formData.connection_length || ''} onChange={handleInputChange}
                              autoComplete="off" placeholder={translateBrandingText("متر", isRtl)}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none" />
                          </div>
                        </>
                      )}
                      {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_meter')) && (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم العداد", isRtl)}</label>
                            <input type="text" name="meter_number" value={formData.meter_number || ''} onChange={handleInputChange}
                              autoComplete="off" placeholder="SN-000"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-mono" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("قراءة العداد", isRtl)}</label>
                            <input type="text" name="meter_reading" value={formData.meter_reading || ''} onChange={handleInputChange}
                              autoComplete="off" placeholder="0.00"
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none" />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* القسم السادس: الموقع */}
                {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_location')) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                      <span className="w-8 h-8 bg-red-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-red-200">
                        <MapPin className="w-4 h-4" />
                      </span>
                      {translateBrandingText("الموقع الجغرافي (GPS)", isRtl)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 font-mono">Latitude</label>
                        <input type="text" name="latitude" value={formData.latitude} onChange={handleInputChange}
                          autoComplete="off" placeholder="0.000000"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2 font-mono">Longitude</label>
                        <input type="text" name="longitude" value={formData.longitude} onChange={handleInputChange}
                          autoComplete="off" placeholder="0.000000"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none font-mono" />
                      </div>
                      <div className="flex items-end">
                        <button type="button" onClick={getCurrentLocation} 
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-green-700 transition-all w-full justify-center shadow-lg shadow-green-100">
                          <Compass className="w-4 h-4" />
                          {translateBrandingText("تحديد الموقع الحالي", isRtl)}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* نوع التوصيله وإزالة عداد */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{translateBrandingText("نوع التوصيلة", isRtl)}</label>
                    <select name="connection_type" value={formData.connection_type || ''} onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                      <option value="">{translateBrandingText("اختر نوع التوصيلة", isRtl)}</option>
                      <option value="توصيله مفرده">{translateBrandingText("توصيلة مفردة", isRtl)}</option>
                      <option value="شجريه">{translateBrandingText("شجرية", isRtl)}</option>
                      <option value="صندوق وعداد على توصيله مقاول آخر">{translateBrandingText("صندوق وعداد على توصيله مقاول آخر", isRtl)}</option>
                      <option value="صندوق وعداد على توصيله نفس المقاول">{translateBrandingText("صندوق وعداد على توصيله نفس المقاول", isRtl)}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{translateBrandingText("إزالة عداد وتركيب عداد جديد", isRtl)}</label>
                    <select name="meter_removal_installation" value={formData.meter_removal_installation || ''} onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
                      <option value="">{translateBrandingText("اختر", isRtl)}</option>
                      <option value="نعم">{translateBrandingText("نعم", isRtl)}</option>
                      <option value="لا">{translateBrandingText("لا", isRtl)}</option>
                    </select>
                  </div>
                </div>

                <div className="text-start">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{translateBrandingText("ملاحظات", isRtl)}</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} 
                    autoComplete="off" placeholder={translateBrandingText("أي ملاحظات إضافية...", isRtl)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>

                {/* قسم الصور */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-start">
                  <label className="block text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    📷 {translateBrandingText("الصور", isRtl)}
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors bg-white">
                        <Upload className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-blue-700">{translateBrandingText("اختر صور", isRtl)}</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-100 transition-colors bg-white">
                        <Camera className="w-5 h-5 text-blue-500" />
                        <span className="text-sm text-blue-700">{translateBrandingText("الكاميرا", isRtl)}</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors bg-white" title="رفع فيديو (سيتم ضغطه إلى 300KB)">
                        <span className="text-xl">🎥</span>
                        <span className="text-sm text-red-600 font-bold hidden sm:inline">{translateBrandingText("فيديو", isRtl)} (300KB)</span>
                        <span className="text-sm text-red-600 font-bold sm:hidden">{translateBrandingText("فيديو", isRtl)}</span>
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
                              toast.success('✅ تم ضغط الفيديو وإضافته بنجاح!');
                            } catch (err) {
                              toast.error('❌ حدث خطأ أثناء ضغط الفيديو');
                            }
                            e.target.value = '';
                          }} 
                        />
                      </label>
                    </div>
                  </div>

                  {/* مؤشر ضغط الفيديو */}
                  {compressingVideo && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">🎥 جارِ ضغط الفيديو لـ 300KB...</span>
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

                  {/* رسالة الضغط التلقائي للصور */}
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 font-medium">🔄 {translateBrandingText("الضغط التلقائي للصور", isRtl)}</p>
                    <p className="text-xs text-blue-600 mt-1">{translateBrandingText("سيتم ضغط الصور تلقائياً إلى حد أقصى 100 كيلوبايت بجودة عالية لتسريع التحميل والعرض", isRtl)}</p>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">صور جديدة ({images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {images.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={resolveImageUrl(img)} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-green-400 cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }} />
                            <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-red-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {editingConnection && (editingConnection.images || []).length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg">
                      <p className="text-xs text-gray-500 mb-2">الصور الحالية ({editingConnection.images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {editingConnection.images.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={resolveImageUrl(img)} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-300 cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }} />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                              <button type="button" onClick={() => { setSelectedImage(img); setShowImageModal(true); }}
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg">
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                              <button type="button" onClick={() => downloadImage(img, i)}
                                className="p-1.5 bg-blue-500/80 hover:bg-blue-500 rounded-lg">
                                <Download className="w-4 h-4 text-white" />
                              </button>
                              <button type="button" onClick={() => deleteImage(editingConnection.id, i)}
                                className="p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg">
                                <Trash2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {formData.request_status === 'ملغي' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1">{translateBrandingText("تاريخ الإلغاء", isRtl)}</label>
                      <input type="date" name="cancellation_date" value={formData.cancellation_date} onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-red-700 mb-1">{translateBrandingText("سبب الإلغاء", isRtl)}</label>
                      <input type="text" name="cancellation_reason" value={formData.cancellation_reason} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("سبب الإلغاء", isRtl)}
                        className="w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm" />
                    </div>
                  </div>
                )}

                  {/* أزرار الحفظ */}
                  <div className="flex gap-4 pt-6 border-t">
                    <button type="submit" data-testid="save-water-connection-btn"
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-2xl text-base font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                      {editingConnection ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingConnection ? translateBrandingText('حفظ التعديلات النهائية', isRtl) : translateBrandingText('إضافة التوصيلة للنظام', isRtl)}
                    </button>
                    <button type="button" onClick={() => { setShowModal(false); resetForm(); }} 
                      className="px-10 py-4 bg-gray-100 text-gray-700 rounded-2xl text-base font-bold hover:bg-gray-200 transition-all">
                      {translateBrandingText("إلغاء والعودة", isRtl)}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Image Fullscreen Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]" onClick={() => setShowImageModal(false)}>
            <img src={resolveImageUrl(selectedImage)} alt="" className="max-w-full max-h-full object-contain" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors" onClick={() => setShowImageModal(false)}>
              <X className="w-6 h-6 text-white" />
            </button>
            <button className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
              onClick={(e) => { e.stopPropagation(); downloadImage(selectedImage, 0); }}>
              <Download className="w-5 h-5" />
              تحميل
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default WaterConnections;
