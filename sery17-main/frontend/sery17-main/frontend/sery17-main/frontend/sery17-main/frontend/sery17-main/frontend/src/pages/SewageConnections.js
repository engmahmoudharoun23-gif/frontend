import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import { Search, Eye, Edit2, Trash2, Plus, RefreshCw, MapPin, ImageIcon, X, FileText, FileSpreadsheet, Filter, List, ChevronDown, Check, Download, CheckSquare, Square, User, Upload, Camera, UserCheck, Hash, Calendar, Activity, Compass, Waves, Layout as LayoutIcon, ArrowRight } from 'lucide-react';
import { resolveImageUrl, isVideo } from '../utils/imageUrl';
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
  'إجمالي توصيلات الصرف': 'Total Sewage Connections',
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
  
  // Sewage fields
  'تفاصيل توصيلة الصرف الصحي': 'Sewage Connection Details',
  'نوع التوصيلة': 'Connection Type',
  'قطر خط التوصيلة': 'Connection Diameter',
  'عمق غرفة التفتيش': 'Inspection Chamber Depth',
  'عرض الشارع': 'Street Width',
  'تاريخ معاينة المقاول': 'Contractor Inspection Date',
  'تاريخ بدء الحفر': 'Excavation Start Date',
  'تاريخ صب الخرسانة': 'Concrete Pour Date',
  'تاريخ إعادة السفلتة': 'Asphalt Restoration Date',
  'تاريخ تسليم الاستشاري': 'Consultant Handover Date',
  'رقم رخصة الحفر': 'Excavation License Number',
  'مقاول مختار': 'Selected Contractor',
  'مختار)': 'Selected)',
  'تم (': 'Done ('
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

// مكون اختيار الحالة
const StatusDropdown = ({ value, onChange, statuses, onAddStatus, onEditStatus, onDeleteStatus, isRtl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [editingStatus, setEditingStatus] = useState(null);
  const [editValue, setEditValue] = useState('');

  return (
    <div className="relative">
      <button type="button" onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm flex items-center justify-between bg-white hover:border-green-400" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{translateBrandingText(value, isRtl) || translateBrandingText('اختر الحالة', isRtl)}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {statuses.map((status) => (
            <div key={status} className="flex items-center justify-between px-3 py-2 hover:bg-green-50 group">
              {editingStatus === status ? (
                <div className="flex items-center gap-2 w-full">
                  <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm" autoFocus />
                  <button onClick={() => { if (editValue.trim()) { onEditStatus(status, editValue.trim()); } setEditingStatus(null); }} className="text-green-600">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingStatus(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <>
                  <button type="button" onClick={() => { onChange(status); setIsOpen(false); }} className="flex-1 text-start text-sm">{translateBrandingText(status, isRtl)}</button>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={() => { setEditingStatus(status); setEditValue(status); }} className="text-blue-500 p-1"><Edit2 className="w-3 h-3" /></button>
                    <button onClick={() => onDeleteStatus(status)} className="text-red-500 p-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
          <div className="border-t px-3 py-2">
            <div className="flex items-center gap-2">
              <input type="text" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                placeholder={translateBrandingText("إضافة حالة جديدة...", isRtl)} className="flex-1 px-2 py-1 border rounded text-sm"
                onKeyPress={(e) => { if (e.key === 'Enter' && newStatus.trim()) { onAddStatus(newStatus.trim()); setNewStatus(''); }}} />
              <button onClick={() => { if (newStatus.trim()) { onAddStatus(newStatus.trim()); setNewStatus(''); }}} className="text-green-600"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// مكون اختيار المقاولين المتعدد
const ContractorsCombobox = ({ selectedContractors, contractors, onChange, disabled, isRtl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredContractors = contractors.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const toggleContractor = (name) => onChange(selectedContractors.includes(name) ? selectedContractors.filter(c => c !== name) : [...selectedContractors, name]);

  return (
    <div className="relative">
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg text-sm flex items-center justify-between bg-white ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-green-400'}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <span className={selectedContractors.length > 0 ? 'text-gray-800' : 'text-gray-400'}>
          {selectedContractors.length > 0 ? `${selectedContractors.length} ${translateBrandingText('مقاول مختار', isRtl)}` : translateBrandingText('اختر المقاولين', isRtl)}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {selectedContractors.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          {selectedContractors.map(c => (
            <span key={c} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              {translateBrandingText(c, isRtl)}
              <button type="button" onClick={() => toggleContractor(c)}><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-hidden" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
          <div className="p-2 border-b">
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={translateBrandingText("بحث...", isRtl)} className="w-full px-2 py-1 border rounded text-sm" />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredContractors.map(c => (
              <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-green-50 cursor-pointer">
                <input type="checkbox" checked={selectedContractors.includes(c.name)} onChange={() => toggleContractor(c.name)} className="w-4 h-4 text-green-600 rounded" />
                <span className="text-sm">{translateBrandingText(c.name, isRtl)}</span>
              </label>
            ))}
          </div>
          <div className="p-2 border-t">
            <button type="button" onClick={() => setIsOpen(false)} className="w-full px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700">
              {translateBrandingText("تم (", isRtl)}{selectedContractors.length} {translateBrandingText("مختار)", isRtl)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

function SewageConnections({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    document.title = translateBrandingText("توصيلات الصرف الصحي - WFM", isRtl);
    const handleTranslationUpdated = () => {
      document.title = translateBrandingText("توصيلات الصرف الصحي - WFM", isRtl);
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
  
  // نظام تخزين الصور المؤقت (Cache)
  const [imagesCache, setImagesCache] = useState({});
  
  const [editingConnection, setEditingConnection] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [images, setImages] = useState([]);
  const [compressingVideo, setCompressingVideo] = useState(false);
  const [videoCompressionProgress, setVideoCompressionProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusList, setStatusList] = useState(['جديد', 'قيد التنفيذ', 'مكتمل', 'ملغي']);
  const [filterGovernorates, setFilterGovernorates] = useState([]);
  const [formGovernorates, setFormGovernorates] = useState([]);
  
  // Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);
  
  const urlProject = searchParams.get('project') || '';
  const [filters, setFilters] = useState({ project: urlProject, governorate: '', request_number: '', ccb_report_number: '', date_from: '', date_to: '', request_status: '' });
  
  const initialFormData = {
    project: '', governorate: '', contractors: [], request_number: '', account_number: '', restriction_number: '', ccb_report_number: '',
    customer_name: '', customer_number: '', area: '', work_order_date: '', diameter: '', meter_number: '',
    latitude: '', longitude: '', commissioning_date: '', permit: '', publication_date: '', issue_date: '',
    expected_execution_date: '', connection_type: '', ventilation_installation: false, inspection_room_installation: false,
    back_drop: false, actual_length: '', network_line_length: '', cesspool_breaking: false, connection_removal: false,
    execution_date: '', system_closing_date: '', request_status: 'جديد', cancellation_reason: '', notes: '', phone_number: ''
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
      
      const response = await axios.get(`${API}/sewage-connections?${params}`);
      const data = response.data;
      
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
    try { const response = await axios.get(`${API}/projects`); setProjects(response.data); } catch {}
  }, []);

  const fetchContractors = useCallback(async (projectName) => {
    try { const response = await axios.get(`${API}/contractors`, { params: { project: projectName } }); setContractors(response.data); } catch {}
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
        c.request_number?.toLowerCase().includes(query) || c.ccb_report_number?.toLowerCase().includes(query) ||
        c.customer_name?.toLowerCase().includes(query) || c.area?.toLowerCase().includes(query) ||
        (c.contractors || []).some(cont => cont.toLowerCase().includes(query))
      );
    }
    setFilteredConnections(result);
  }, [filters, connections, searchQuery]);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedIds(selectedIds.length === filteredConnections.length ? [] : filteredConnections.map(c => c.id));
  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const resetFilters = () => { setFilters({ project: '', governorate: '', request_number: '', ccb_report_number: '', date_from: '', date_to: '', request_status: '' }); setSearchQuery(''); setSelectedIds([]); };
  const handleInputChange = (e) => { const { name, value, type, checked } = e.target; setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value })); };
  const resetForm = () => { setFormData({ ...initialFormData, project: urlProject }); setEditingConnection(null); setImages([]); };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => { 
        setFormData(prev => ({ ...prev, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) })); 
        toast.success('تم تحديد الموقع'); 
      },
      (error) => {
        // لا نعرض رسالة خطأ محبطة
        if (error.code === error.PERMISSION_DENIED) {
          console.log('Location permission denied');
        }
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  };

  const compressImage = async (file) => {
    try { return await imageCompression(file, { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true }); } catch { return file; }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    toast.info('⏳ جاري ضغط الصور...', { autoClose: 1500 });
    for (const file of files) {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onload = () => setImages(prev => [...prev, reader.result]);
      reader.readAsDataURL(compressed);
    }
    toast.success(`✅ تم ضغط ${files.length > 1 ? files.length + ' صور' : 'الصورة'} تلقائياً إلى 100KB`, { autoClose: 2500 });
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
      { field: 'contractors', label: 'المقاولين', isArray: true },
      { field: 'customer_name', label: 'اسم العميل' },
      { field: 'area', label: 'المنطقة' },
      { field: 'request_number', label: 'رقم الطلب' },
      { field: 'request_status', label: 'الحالة' }
    ];
    
    const missingFields = requiredFields.filter(f => {
      if (f.isArray) return !formData[f.field] || formData[f.field].length === 0;
      return !formData[f.field]?.toString().trim();
    });
    
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
        const imgResponse = await axios.get(`${API}/sewage-connections/${editingConnection.id}/images`);
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
        await axios.put(`${API}/sewage-connections/${editingConnection.id}`, dataToSend);
        savedId = editingConnection.id;
        toast.success('✅ تم حفظ التوصيلة بنجاح');
      } else {
        const response = await axios.post(`${API}/sewage-connections`, dataToSend);
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
        const response = await axios.get(`${API}/sewage-connections/${conn.id}/images`);
        setEditingConnection(prev => ({ ...prev, images: response.data.images }));
      } catch (err) {
        console.log('Failed to load images');
      }
    }
  };
  
  const handleView = async (conn) => { 
    setSelectedConnection(conn); 
    setShowViewModal(true); 
    
    // جلب الصور عند فتح نافذة العرض إذا لم تكن موجودة
    if (!conn.images && conn.images_count > 0) {
      try {
        const response = await axios.get(`${API}/sewage-connections/${conn.id}/images`);
        setSelectedConnection(prev => ({ ...prev, images: response.data.images }));
      } catch (err) {
        console.log('Failed to load images');
      }
    }
  };
  
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
      const response = await axios.get(`${API}/sewage-connections/${conn.id}/images`);
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
    if (!window.confirm('هل أنت متأكد؟')) return;
    try { await axios.delete(`${API}/sewage-connections/${id}`); toast.success('تم الحذف'); setSelectedIds(prev => prev.filter(i => i !== id)); fetchConnections(); }
    catch { toast.error('فشل في الحذف'); }
  };

  const deleteImage = async (connId, imgIndex) => {
    try {
      // جلب الصور الحالية أولاً
      const response = await axios.get(`${API}/sewage-connections/${connId}/images`);
      const currentImages = response.data.images || [];
      const newImages = [...currentImages]; 
      newImages.splice(imgIndex, 1);
      await axios.put(`${API}/sewage-connections/${connId}`, { images: newImages });
      toast.success('تم حذف الصورة'); fetchConnections();
      if (selectedConnection?.id === connId) setSelectedConnection({ ...selectedConnection, images: newImages });
    } catch { toast.error('فشل'); }
  };

  const downloadImage = async (imageData, index) => {
    try {
      const url = resolveImageUrl(imageData);
      const response = await fetch(url);
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objUrl;
      const extension = isVideo(imageData) ? 'webm' : 'jpg';
      link.download = `media_توصيلة_${selectedConnection?.request_number || 'unknown'}_${index + 1}.${extension}`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(objUrl), 100);
      toast.success('تم تحميل الملف');
    } catch (error) {
      console.error('Error downloading media:', error);
      toast.error(`❌ فشل تحميل الملف ${index + 1}`);
    }
  };

  const downloadAllImages = () => {
    if (!selectedConnection?.images?.length) return;
    selectedConnection.images.forEach((img, idx) => setTimeout(() => downloadImage(img, idx), idx * 300));
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
      const response = await axios.post(`${API}/sewage-connections/import-excel`, formData, {
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

  const handleAddStatus = (s) => { if (!statusList.includes(s)) { setStatusList([...statusList, s]); toast.success('تمت إضافة الحالة'); }};
  const handleEditStatus = (old, newS) => { if (!statusList.includes(newS)) { setStatusList(statusList.map(s => s === old ? newS : s)); toast.success('تم تعديل الحالة'); }};
  const handleDeleteStatus = (s) => { if (window.confirm(`حذف "${s}"؟`)) { setStatusList(statusList.filter(st => st !== s)); toast.success('تم الحذف'); }};

  const getConnectionsToExport = () => selectedIds.length > 0 ? filteredConnections.filter(c => selectedIds.includes(c.id)) : filteredConnections;

  const exportToExcel = async () => {
    const data = getConnectionsToExport();
    if (data.length === 0) { toast.error('لا توجد بيانات'); return; }
    setExporting(true);
    try {
      const response = await axios.post(`${API}/sewage-connections/export/excel`, { connections: data, project_name: filters.project || 'جميع المشاريع' }, { responseType: 'blob' });
      const link = document.createElement('a'); link.href = window.URL.createObjectURL(new Blob([response.data]));
      link.setAttribute('download', `توصيلات_الصرف.xlsx`); document.body.appendChild(link); link.click(); link.remove();
      toast.success(`تم تصدير ${data.length} توصيلة`);
    } catch { toast.error('فشل'); } finally { setExporting(false); }
  };

  const exportToPDF = async () => {
    const data = getConnectionsToExport();
    if (data.length === 0) { toast.error('لا توجد بيانات'); return; }
    setExporting(true);
    try {
      const response = await axios.post(`${API}/sewage-connections/export/pdf`, { connections: data, project_name: filters.project || 'جميع المشاريع' }, { responseType: 'blob' });
      const link = document.createElement('a'); link.href = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      link.setAttribute('download', `توصيلات_الصرف.pdf`); document.body.appendChild(link); link.click(); link.remove();
      toast.success(`تم تصدير ${data.length} توصيلة`);
    } catch { toast.error('فشل'); } finally { setExporting(false); }
  };

  const statusColors = { 'جديد': 'bg-blue-100 text-blue-800', 'قيد التنفيذ': 'bg-yellow-100 text-yellow-800', 'مكتمل': 'bg-green-100 text-green-800', 'ملغي': 'bg-red-100 text-red-800' };

  const fields = [
    ['request_number', 'رقم الطلب'], ['account_number', 'رقم الحساب'], ['restriction_number', 'رقم الحصر'],
    ['ccb_report_number', 'رقم البلاغ CCP'], ['customer_name', 'اسم العميل'], ['customer_number', 'رقم العميل'],
    ['area', 'المنطقة'], ['diameter', 'القطر'], ['meter_number', 'رقم العداد'], ['permit', 'التصريح'],
    ['connection_type', 'نوع الربط'], ['actual_length', 'طول على الطبيعة'], ['network_line_length', 'طول خط الشبكة']
  ];

  const dateFields = [
    ['work_order_date', 'تاريخ أمر الشغل'], ['commissioning_date', 'تاريخ التعميد'], ['publication_date', 'تاريخ النشر'],
    ['issue_date', 'تاريخ الإصدار'], ['expected_execution_date', 'تاريخ التنفيذ المتوقع'],
    ['execution_date', 'تاريخ التنفيذ'], ['system_closing_date', 'تاريخ الإغلاق']
  ];

  // حذف "هجمة" من القائمة
  const checkboxFields = [
    ['ventilation_installation', 'تركيب فتح التهوية'], ['inspection_room_installation', 'تركيب غرفة تفتيش'],
    ['back_drop', 'Back Drop'], ['cesspool_breaking', 'تكسير بيارة'], ['connection_removal', 'إزالة توصيلة']
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto text-start" data-testid="sewage-connections-page" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        {/* Premium Header */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-white p-8 mb-8 flex flex-col lg:flex-row justify-between items-center gap-6 text-start">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-600/20 rounded-3xl blur-xl group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Waves className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="text-start">
              <div className="flex items-center gap-3 mb-1">
                <Link 
                  to={`/connections-hub?project=${encodeURIComponent(urlProject)}`}
                  className="p-2 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-emerald-100 transition-all hover:scale-110 active:scale-95"
                  title={translateBrandingText("العودة لمركز التوصيلات", isRtl)}
                >
                  <ArrowRight className="w-5 h-5" style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
                </Link>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {translateBrandingText("توصيلات الصرف الصحي", isRtl)}
                  <span className="bg-emerald-600 text-[10px] text-white px-2 py-0.5 rounded-md uppercase tracking-widest font-black">Sewage</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-1 rounded-xl border border-emerald-100/50">
                <span className="text-base">📁</span>
                <span className="text-sm">{translateBrandingText(urlProject, isRtl) || translateBrandingText('جميع المشاريع', isRtl)}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-3">
              <div className="text-start">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translateBrandingText("إجمالي توصيلات الصرف", isRtl)}</p>
                <p className="text-xl font-black text-slate-700 leading-none">{filteredConnections.length}</p>
              </div>
              <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>
              <div className="text-start">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{translateBrandingText("المحددة", isRtl)}</p>
                <p className="text-xl font-black text-emerald-600 leading-none">{selectedIds.length}</p>
              </div>
            </div>

            <button 
              onClick={() => { resetForm(); getCurrentLocation(); setShowModal(true); }}
              className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm hover:bg-emerald-700 hover:shadow-2xl hover:shadow-emerald-200 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>{translateBrandingText("إضافة توصيلة جديدة", isRtl)}</span>
            </button>
          </div>
        </div>

        {/* Search and Actions */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4 text-start">
          <div className="mb-4 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={translateBrandingText("بحث شامل...", isRtl)} className="w-full pr-10 pl-4 py-2.5 border rounded-lg text-sm" />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button onClick={() => setShowFilters(!showFilters)} className="flex flex-col items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
              <Filter className="w-5 h-5 text-gray-600" /><span className="text-xs text-gray-600">{translateBrandingText("بحث", isRtl)}</span>
            </button>
            <button onClick={fetchConnections} className="flex flex-col items-center gap-1 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg">
              <List className="w-5 h-5 text-green-600" /><span className="text-xs text-green-600">{translateBrandingText("عرض", isRtl)}</span>
            </button>
            <button onClick={exportToPDF} disabled={exporting} className="flex flex-col items-center gap-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
              <FileText className="w-5 h-5" /><span className="text-xs">PDF {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
            </button>
            <button onClick={exportToExcel} disabled={exporting} className="flex flex-col items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50">
              <FileSpreadsheet className="w-5 h-5" /><span className="text-xs">Excel {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
            </button>
            <button onClick={resetFilters} className="flex flex-col items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
              <RefreshCw className="w-5 h-5 text-gray-600" /><span className="text-xs text-gray-600">{translateBrandingText("تحديث", isRtl)}</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-4 border-t text-start">
              <select name="project" value={filters.project} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm min-w-[300px]">
                {!urlProject && <option value="">{translateBrandingText("جميع المشاريع", isRtl)}</option>}
                {projects
                  .filter(p => !urlProject || p.name === urlProject)
                  .map(p => <option key={p.id} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)
                }
              </select>
              <select name="governorate" value={filters.governorate} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">{translateBrandingText("جميع محافظات المشروع", isRtl)}</option>
                {filterGovernorates.map((g, idx) => {
                  const name = typeof g === 'string' ? g : (g.name || g);
                  return (
                    <option key={idx} value={name}>
                      {translateBrandingText(name, isRtl)}
                    </option>
                  );
                })}
              </select>
              <input type="text" name="request_number" value={filters.request_number} onChange={handleFilterChange} placeholder={translateBrandingText("رقم الطلب", isRtl)} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="text" name="ccb_report_number" value={filters.ccb_report_number} onChange={handleFilterChange} placeholder={translateBrandingText("رقم CCP", isRtl)} className="px-3 py-2 border rounded-lg text-sm" />
              <select name="request_status" value={filters.request_status} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm">
                <option value="">{translateBrandingText("جميع الحالات", isRtl)}</option>
                {statusList.map(s => <option key={s} value={s}>{translateBrandingText(s, isRtl)}</option>)}
              </select>
              <input type="date" name="date_from" value={filters.date_from} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm" />
              <input type="date" name="date_to" value={filters.date_to} onChange={handleFilterChange} className="px-3 py-2 border rounded-lg text-sm" />
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-10 bg-white rounded-xl shadow">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">{translateBrandingText("لا توجد توصيلات لتعرض حالياً", isRtl)}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gradient-to-l from-green-50 to-green-100 border-b border-green-200">
                  <tr>
                    <th className="px-3 py-4 text-center">
                      <button onClick={toggleSelectAll} className="p-1 hover:bg-green-200 rounded transition-colors">
                        {selectedIds.length === filteredConnections.length && filteredConnections.length > 0
                          ? <CheckSquare className="w-5 h-5 text-green-600" />
                          : <Square className="w-5 h-5 text-gray-400" />
                        }
                      </button>
                    </th>
                    {['#', 'رقم الطلب', 'رقم CCP', 'العميل', 'المحافظة', 'المقاولين', 'المنطقة / الحي', 'الحالة', 'مراقب الاستشاري', 'إجراءات'].map(h => (
                      <th key={h} className="px-4 py-4 text-center text-xs font-black text-green-900 uppercase tracking-wider">{translateBrandingText(h, isRtl)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredConnections.map((conn, idx) => (
                    <tr key={conn.id} className={`hover:bg-green-50/50 ${selectedIds.includes(conn.id) ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => toggleSelect(conn.id)} className="p-1 hover:bg-green-100 rounded">
                          {selectedIds.includes(conn.id) ? <CheckSquare className="w-5 h-5 text-green-600" /> : <Square className="w-5 h-5 text-gray-400" />}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-500 font-bold">{idx + 1}</td>
                      <td className="px-4 py-4 text-center font-black text-slate-800 whitespace-nowrap">{conn.request_number || '-'}</td>
                      <td className="px-4 py-4 text-center text-slate-600 font-medium">
                        {conn.ccb_report_number ? (conn.ccb_report_number.startsWith('CCP-') ? conn.ccb_report_number : (conn.ccb_report_number.startsWith('CCB-') ? conn.ccb_report_number.replace('CCB-', 'CCP-') : `CCP-${conn.ccb_report_number}`)) : '-'}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-slate-800">{conn.customer_name ? translateBrandingText(conn.customer_name, isRtl) : '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-black text-xs">
                          {translateBrandingText(conn.governorate, isRtl) || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-slate-600 text-xs">{(conn.contractors || []).map(c => translateBrandingText(c, isRtl)).join(', ') || '-'}</td>
                      <td className="px-4 py-4 text-center text-slate-600 text-xs">{translateBrandingText(conn.area, isRtl) || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${statusColors[conn.request_status] || 'bg-gray-100'}`}>
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
                          <button onClick={() => handleView(conn)} className="flex flex-col items-center gap-0.5 p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg" title={translateBrandingText("عرض", isRtl)}>
                            <Eye className="w-4 h-4" /><span className="text-[10px]">{translateBrandingText("عرض", isRtl)}</span>
                          </button>
                          <button onClick={() => handleViewImages(conn)} className="flex flex-col items-center gap-0.5 p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg" title={translateBrandingText("الوسائط", isRtl)}>
                            <ImageIcon className="w-4 h-4" /><span className="text-[10px]">{(conn.images || []).length > 0 ? `${translateBrandingText("الوسائط", isRtl)} (${conn.images.length})` : translateBrandingText("الوسائط", isRtl)}</span>
                          </button>
                          <button onClick={() => handleEdit(conn)} className="flex flex-col items-center gap-0.5 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title={translateBrandingText("تعديل", isRtl)}>
                            <Edit2 className="w-4 h-4" /><span className="text-[10px]">{translateBrandingText("تعديل", isRtl)}</span>
                          </button>
                          <button onClick={() => handleDelete(conn.id)} className="flex flex-col items-center gap-0.5 p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title={translateBrandingText("حذف", isRtl)}>
                            <Trash2 className="w-4 h-4" /><span className="text-[10px]">{translateBrandingText("حذف", isRtl)}</span>
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
              itemLabel={translateBrandingText("توصيلة", isRtl)}
            />
          </div>
        )}

        {/* View Modal - للقراءة فقط */}
        {showViewModal && selectedConnection && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 text-start" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="sticky top-0 bg-gradient-to-l from-emerald-600 to-emerald-700 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Eye className="w-5 h-5" />{translateBrandingText("تفاصيل التوصيلة", isRtl)}</h2>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6">
                {/* معلومات المُنشئ */}
                {selectedConnection.created_by_name && (
                  <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full"><User className="w-5 h-5 text-blue-600" /></div>
                    <div className="text-start">
                      <span className="text-blue-700 text-xs font-semibold block">{translateBrandingText("مراقب الاستشاري", isRtl)}</span>
                      <p className="text-blue-900 font-medium">{translateBrandingText(selectedConnection.created_by_name, isRtl)}</p>
                      {selectedConnection.created_at && (
                        <p className="text-blue-600 text-xs mt-0.5">
                          {new Date(selectedConnection.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-start">
                  {[
                    [translateBrandingText('المشروع', isRtl), selectedConnection.project], 
                    [translateBrandingText('المحافظة', isRtl), selectedConnection.governorate], 
                    [translateBrandingText('المقاولين', isRtl), (selectedConnection.contractors || []).join(', ')],
                    [translateBrandingText('رقم الطلب', isRtl), selectedConnection.request_number], 
                    [translateBrandingText('رقم CCP', isRtl), selectedConnection.ccb_report_number ? (selectedConnection.ccb_report_number.startsWith('CCP-') ? selectedConnection.ccb_report_number : (selectedConnection.ccb_report_number.startsWith('CCB-') ? selectedConnection.ccb_report_number.replace('CCB-', 'CCP-') : `CCP-${selectedConnection.ccb_report_number}`)) : '-'],
                    [translateBrandingText('اسم العميل', isRtl), selectedConnection.customer_name], 
                    [translateBrandingText('رقم العميل', isRtl), selectedConnection.customer_number],
                    [translateBrandingText('المنطقة', isRtl), selectedConnection.area], 
                    [translateBrandingText('القطر', isRtl), selectedConnection.diameter],
                    [translateBrandingText('نوع الربط', isRtl), selectedConnection.connection_type], 
                    [translateBrandingText('الحالة', isRtl), selectedConnection.request_status],
                    [translateBrandingText('تاريخ التنفيذ', isRtl), selectedConnection.execution_date], 
                    [translateBrandingText('خط العرض', isRtl), selectedConnection.latitude],
                    [translateBrandingText('خط الطول', isRtl), selectedConnection.longitude]
                  ].map(([label, value]) => (
                    <div key={label} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="text-gray-500 text-xs block mb-1">{translateBrandingText(label, isRtl)}</span>
                      <p className="font-semibold text-gray-800">{value ? translateBrandingText(value, isRtl) : '-'}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-green-50 rounded-lg text-start">
                  <h4 className="font-semibold text-gray-800 mb-3">{translateBrandingText("خيارات إضافية", isRtl)}</h4>
                  <div className="flex flex-wrap gap-2">
                    {checkboxFields.map(([name, label]) => (
                      <span key={name} className={`px-3 py-1 rounded-full text-xs font-medium ${selectedConnection[name] ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {selectedConnection[name] ? '✓' : '✗'} {translateBrandingText(label, isRtl)}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedConnection.notes && (
                  <div className="mt-4 bg-amber-50 p-4 rounded-lg text-start border border-amber-200">
                    <span className="text-amber-700 text-xs font-semibold block mb-1">{translateBrandingText("ملاحظات", isRtl)}</span>
                    <p className="text-gray-800">{selectedConnection.notes}</p>
                  </div>
                )}
                <button onClick={() => setShowViewModal(false)} className="mt-6 w-full py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">{translateBrandingText("إغلاق", isRtl)}</button>
              </div>
            </div>
          </div>
        )}

        {/* Images Modal - تصميم خفيف وسريع */}
        {showImagesModal && selectedConnection && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 text-start animate-fade-in" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            <div className="bg-green-50 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-l from-green-600 to-green-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
                <h2 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{translateBrandingText("وسائط التوصيلة", isRtl)} - </span>
                  <span>{selectedConnection.request_number || translateBrandingText('الوسائط', isRtl)}</span>
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
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
                    </div>
                    <p className="text-green-600 text-base sm:text-lg font-medium">{translateBrandingText("جاري تحميل الوسائط...", isRtl)}</p>
                  </div>
                ) : (selectedConnection.images || []).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-base sm:text-lg">{translateBrandingText("لا توجد وسائط", isRtl)}</p>
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
                        <div className="p-2 sm:p-3 bg-green-100/50 flex items-center justify-between">
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-green-800">{translateBrandingText("مرفق", isRtl)} {i + 1}</p>
                            <p className="text-[10px] sm:text-xs text-green-600">{selectedConnection.request_number}</p>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); downloadImage(img, i); }}
                            className="p-1.5 sm:p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                            title={translateBrandingText("تحميل المرفق", isRtl)}>
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
        )}

        {/* نافذة التعديل (Add/Edit Modal) - تصميم محسن - حجم الصفحة كاملة */}
        {showModal && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col text-start" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
            {/* Header */}
            <div className="sticky top-0 bg-white px-6 py-4 flex justify-between items-center border-b z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl">
                  {editingConnection ? <Edit2 className="w-5 h-5 text-green-600" /> : <Plus className="w-5 h-5 text-green-600" />}
                </div>
                <div className="text-start">
                  <h2 className="text-lg font-bold text-gray-800">
                    {editingConnection ? translateBrandingText('تعديل توصيلة صرف صحي', isRtl) : translateBrandingText('إضافة توصيلة صرف صحي جديدة', isRtl)}
                  </h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Sewage Connection Management</p>
                </div>
                {!editingConnection && (user?.role === 'admin' || hasProjectPermission(user, urlProject, 'sewage_connections_import')) && (
                  <label className={`flex items-center gap-2 px-3 py-1.5 ${importLoading ? 'bg-green-100' : 'bg-green-50 hover:bg-green-100'} text-green-700 rounded-lg transition-all text-xs font-bold cursor-pointer border border-green-200 ml-4`}>
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
                <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 flex items-center gap-2">
                    <span className="text-green-500">💡</span>
                    {translateBrandingText("قم بتعبئة البيانات المطلوبة. الحقول المعروضة تعتمد على صلاحيات المستخدم.", isRtl)}
                  </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                {/* القسم الأول: المعلومات الأساسية */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                    <span className="w-8 h-8 bg-green-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-green-200">
                      <LayoutIcon className="w-4 h-4" />
                    </span>
                    {translateBrandingText("المعلومات التنظيمية", isRtl)}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-500" />
                        {translateBrandingText("المحافظة", isRtl)} <span className="text-red-500">*</span>
                      </label>
                      <select name="governorate" value={formData.governorate} onChange={handleInputChange} required
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all outline-none">
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
                        <User className="w-3 h-3 text-green-500" />
                        {translateBrandingText("المقاولين", isRtl)} <span className="text-red-500">*</span>
                      </label>
                      <ContractorsCombobox selectedContractors={formData.contractors} contractors={contractors}
                        onChange={(s) => setFormData(prev => ({ ...prev, contractors: s }))} disabled={!formData.project} isRtl={isRtl} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-green-500" />
                        {translateBrandingText("حالة الطلب", isRtl)} <span className="text-red-500">*</span>
                      </label>
                      <StatusDropdown value={formData.request_status} onChange={(v) => setFormData(prev => ({ ...prev, request_status: v }))}
                        statuses={statusList} onAddStatus={handleAddStatus} onEditStatus={handleEditStatus} onDeleteStatus={handleDeleteStatus} isRtl={isRtl} />
                    </div>
                  </div>
                </div>

                {/* القسم الثاني: بيانات العميل */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-blue-200">
                      <UserCheck className="w-4 h-4" />
                    </span>
                    {translateBrandingText("بيانات المستفيد", isRtl)}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("اسم العميل", isRtl)} <span className="text-red-500">*</span></label>
                      <input type="text" name="customer_name" value={formData.customer_name} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("أدخل الاسم الرباعي", isRtl)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم العميل", isRtl)}</label>
                      <input type="text" name="customer_number" value={formData.customer_number || ''} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("رقم العميل", isRtl)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none font-mono" />
                    </div>
                    {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_phone')) && (
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم الجوال", isRtl)} <span className="text-red-500">*</span></label>
                        <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange}
                          autoComplete="off" placeholder="05xxxxxxxx"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("المنطقة / الحي", isRtl)} <span className="text-red-500">*</span></label>
                      <input type="text" name="area" value={formData.area} onChange={handleInputChange}
                        autoComplete="off" placeholder={translateBrandingText("المنطقة", isRtl)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                      <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Project:</span>
                        <span className="text-[10px] font-bold text-green-600">{translateBrandingText(formData.project, isRtl) || translateBrandingText('غير محدد', isRtl)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* القسم الثالث: أرقام مرجعية */}
                {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || 
                  hasProjectPermission(user, urlProject, 'connections_show_request_number') || 
                  hasProjectPermission(user, urlProject, 'connections_show_restriction_number') ||
                  hasProjectPermission(user, urlProject, 'connections_show_ccb_number')) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                      <span className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-purple-200">
                        <Hash className="w-4 h-4" />
                      </span>
                      {translateBrandingText("الأرقام المرجعية والتصاريح", isRtl)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
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
                            autoComplete="off" placeholder="S-000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-mono" />
                        </div>
                      )}
                      {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_ccb_number')) && (
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم بلاغ CCP", isRtl)}</label>
                          <input type="text" name="ccb_report_number" value={formData.ccb_report_number || ''} onChange={handleInputChange}
                            autoComplete="off" placeholder="CCP-000"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-mono" />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم التصريح", isRtl)}</label>
                        <input type="text" name="permit" value={formData.permit || ''} onChange={handleInputChange}
                          autoComplete="off" placeholder="P-000"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-mono" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("رقم الحساب", isRtl)}</label>
                        <input type="text" name="account_number" value={formData.account_number || ''} onChange={handleInputChange}
                          autoComplete="off" placeholder="000000"
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all outline-none font-mono" />
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

                {/* القسم الخامس: القياسات */}
                {(user?.role === 'admin' || hasProjectPermission(user, urlProject, 'connections_full_form') || hasProjectPermission(user, urlProject, 'connections_show_measurements')) && (
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow text-start">
                    <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-3 pb-3 border-b border-gray-50">
                      <span className="w-8 h-8 bg-cyan-600 text-white rounded-xl flex items-center justify-center text-xs shadow-lg shadow-cyan-200">
                        <Activity className="w-4 h-4" />
                      </span>
                      {translateBrandingText("القياسات الفنية", isRtl)}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("قطر الماسورة", isRtl)}</label>
                        <input type="text" name="diameter" value={formData.diameter || ''} onChange={handleInputChange}
                          autoComplete="off" placeholder={translateBrandingText("مم", isRtl)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("طول الماسورة", isRtl)}</label>
                        <input type="text" name="network_line_length" value={formData.network_line_length || ''} onChange={handleInputChange}
                          autoComplete="off" placeholder={translateBrandingText("متر", isRtl)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">{translateBrandingText("عمق المنهل", isRtl)}</label>
                        <input type="text" name="actual_length" value={formData.actual_length || ''} onChange={handleInputChange}
                          autoComplete="off" placeholder={translateBrandingText("متر", isRtl)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all outline-none font-mono" />
                      </div>
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

                {/* خيارات إضافية */}
                <div className="flex flex-wrap gap-4 py-3 border-t border-b bg-gray-50 rounded-lg px-4 text-start">
                  {checkboxFields.map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name={name} checked={formData[name]} onChange={handleInputChange} className="w-4 h-4 text-green-600 rounded" />
                      <span className="text-sm text-gray-700">{translateBrandingText(label, isRtl)}</span>
                    </label>
                  ))}
                </div>

                <div className="text-start">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{translateBrandingText("ملاحظات", isRtl)}</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={2} 
                    autoComplete="off" placeholder={translateBrandingText("أي ملاحظات إضافية...", isRtl)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500" />
                </div>

                {/* قسم الصور */}
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-start">
                  <label className="block text-sm font-bold text-green-800 mb-3 flex items-center gap-2">
                    📷 {translateBrandingText("الصور", isRtl)}
                  </label>
                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-100 transition-colors bg-white">
                        <Upload className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-700">{translateBrandingText("اختر صور", isRtl)}</span>
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-green-300 rounded-xl cursor-pointer hover:border-green-500 hover:bg-green-100 transition-colors bg-white">
                        <Camera className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-700">{translateBrandingText("الكاميرا", isRtl)}</span>
                        <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                      </label>
                      <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors bg-white" title={translateBrandingText("رفع فيديو (سيتم ضغطه إلى 300KB)", isRtl)}>
                        <span className="text-xl">🎥</span>
                        <span className="text-sm text-red-600 font-bold hidden sm:inline">{translateBrandingText("فيديو (300KB)", isRtl)}</span>
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
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-start">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-700">🎥 {translateBrandingText("جارِ ضغط الفيديو لـ 300KB...", isRtl)}</span>
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
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-start">
                    <p className="text-xs text-blue-800 font-medium">🔄 {translateBrandingText("الضغط التلقائي للصور", isRtl)}</p>
                    <p className="text-xs text-blue-600 mt-1">{translateBrandingText("سيتم ضغط الصور تلقائياً إلى حد أقصى 100 كيلوبايت بجودة عالية لتسريع التحميل والعرض", isRtl)}</p>
                  </div>
                  
                  {images.length > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg text-start">
                      <p className="text-xs text-gray-500 mb-2">{translateBrandingText("صور جديدة", isRtl)} ({images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {images.map((img, i) => (
                          <div key={i} className="relative group">
                            {isVideo(img) ? (
                              <video src={resolveImageUrl(img)} className="w-20 h-20 object-cover rounded-lg border-2 border-green-400 cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }} muted playsInline preload="metadata" />
                            ) : (
                              <img src={resolveImageUrl(img)} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-green-400 cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }} />
                            )}
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
                    <div className="mt-3 p-3 bg-white rounded-lg text-start">
                      <p className="text-xs text-gray-500 mb-2">{translateBrandingText("الصور الحالية", isRtl)} ({editingConnection.images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {editingConnection.images.map((img, i) => (
                          <div key={i} className="relative group">
                            {isVideo(img) ? (
                              <video src={resolveImageUrl(img)} className="w-20 h-20 object-cover rounded-lg border border-gray-300 cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }} muted playsInline preload="metadata" />
                            ) : (
                              <img src={resolveImageUrl(img)} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-300 cursor-pointer" onClick={() => { setSelectedImage(img); setShowImageModal(true); }} />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                              <button type="button" onClick={() => { setSelectedImage(img); setShowImageModal(true); }}
                                className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg">
                                <Eye className="w-4 h-4 text-white" />
                              </button>
                              <button type="button" onClick={() => downloadImage(img, i)}
                                className="p-1.5 bg-green-500/80 hover:bg-green-500 rounded-lg">
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
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-start">
                    <label className="block text-xs font-medium text-red-700 mb-1">{translateBrandingText("سبب الإلغاء", isRtl)}</label>
                    <input type="text" name="cancellation_reason" value={formData.cancellation_reason} onChange={handleInputChange}
                      autoComplete="off" placeholder={translateBrandingText("سبب الإلغاء", isRtl)}
                      className="w-full px-3 py-2.5 border border-red-300 rounded-lg text-sm" />
                  </div>
                )}

                {/* أزرار الحفظ */}
                <div className="flex gap-4 pt-6 border-t">
                  <button type="submit" 
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-2xl text-base font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100">
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

        {/* Full Image Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] text-start" style={{ direction: isRtl ? 'rtl' : 'ltr' }} onClick={() => setShowImageModal(false)}>
            {isVideo(selectedImage) ? (
              <video src={resolveImageUrl(selectedImage)} className="max-w-full max-h-full object-contain" controls autoPlay onClick={(e) => e.stopPropagation()} />
            ) : (
              <img src={resolveImageUrl(selectedImage)} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
            )}
            <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full animate-fade-in" onClick={() => setShowImageModal(false)}><X className="w-6 h-6 text-white" /></button>
            <button className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
              onClick={(e) => { e.stopPropagation(); downloadImage(selectedImage, 0); }}><Download className="w-5 h-5" />{translateBrandingText("تحميل", isRtl)}</button>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SewageConnections;
