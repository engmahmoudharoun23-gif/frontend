import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { Eye, Edit2, Trash2, Download, X, ImageIcon, Plus, Check, Clock, XCircle, RefreshCw, Calendar, DollarSign, FileText, Save, ChevronDown, FileSpreadsheet, Inbox, Send, Undo2, List, MoreVertical } from 'lucide-react';
import { resolveImageUrl } from '../utils/imageUrl';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';
import { translateBrandingText } from '../utils/brandingTranslation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Extracts({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const getInitialExtracts = () => {
    try {
      const cached = localStorage.getItem('cache_Extracts.js_extracts');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  };
  const [extracts, setExtracts] = useState(getInitialExtracts);
  const [loading, setLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('incoming');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [fullViewImage, setFullViewImage] = useState(null); // الصورة المكبرة
  const [selectedExtract, setSelectedExtract] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [availableProjects, setAvailableProjects] = useState([]);
  const [workUnits, setWorkUnits] = useState([]);
  const [newWorkUnit, setNewWorkUnit] = useState('');
  const [showWorkUnitDropdown, setShowWorkUnitDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedExtracts, setSelectedExtracts] = useState([]);
  
  // فلاتر البحث للمسجلة (recorded)
  const [recordedSearchNumber, setRecordedSearchNumber] = useState('');
  const [recordedSearchDate, setRecordedSearchDate] = useState('');
  // فلاتر البحث للواردة (incoming)
  const [incomingSearchNumber, setIncomingSearchNumber] = useState('');
  const [incomingSearchDate, setIncomingSearchDate] = useState('');
  // فلاتر بحث مدير المشروع
  const [managerSearchNumber, setManagerSearchNumber] = useState('');
  const [managerSearchDate, setManagerSearchDate] = useState('');
  
  // Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);
  
  // Manager view state
  const [managerViewMode, setManagerViewMode] = useState('add'); // 'add' | 'list'
  const [managerExtracts, setManagerExtracts] = useState([]);
  const [managerLoading, setManagerLoading] = useState(false);
  const [managerCurrentPage, setManagerCurrentPage] = useState(parseInt(searchParams.get('mPage')) || 1);
  const [managerTotalPages, setManagerTotalPages] = useState(1);
  const [managerTotalCount, setManagerTotalCount] = useState(0);
  const [managerItemsPerPage, setManagerItemsPerPage] = useState(parseInt(searchParams.get('mLimit')) || 10);
  
  const isAdmin = user.role === 'admin';
  const currentYear = new Date().getFullYear();
  const MONTHS = isRtl 
    ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  // نموذج مدير المشروع (إضافة مستخلص بسيط)
  const [managerForm, setManagerForm] = useState({ project: '', extract_number: '', month: '', year: '', amount: '' });
  const [managerImages, setManagerImages] = useState([]);
  
  // نموذج بيت الخبرة (مستخلص مستلم كامل)
  const emptyForm = {
    extract_number: '', invoice_number: '', extract_date: '', work_unit: '', po_number: '',
    project: '', actual_value: '', advance_deduction: '', tax: '', penalties: '',
    total_collected: '', is_paid: false, collection_date: ''
  };
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);

  // حساب المعادلات تلقائياً
  const calculateFields = useCallback(() => {
    const actual = parseFloat(form.actual_value) || 0;
    const advance = parseFloat(form.advance_deduction) || 0;
    const penaltiesVal = parseFloat(form.penalties) || 0;
    
    const netAfterDeduction = actual - advance;
    const autoTax = netAfterDeduction * 0.15;
    const totalSubmitted = netAfterDeduction + autoTax - penaltiesVal;
    const totalCollected = totalSubmitted;
    const difference = advance + penaltiesVal;
    
    return { netAfterDeduction, autoTax, totalSubmitted, totalCollected, difference };
  }, [form.actual_value, form.advance_deduction, form.penalties]);

  const { netAfterDeduction, autoTax, totalSubmitted, totalCollected, difference } = calculateFields();

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      let projects = response.data.map(p => p.name);
      if (!isAdmin && user.projects?.length > 0) {
        /* removed redundant filter */
      }
      setAvailableProjects(projects);
      if (!isAdmin && projects.length > 0) {
        setManagerForm(prev => ({ ...prev, project: projects[0] }));
      }
    } catch {
      setAvailableProjects(user.projects || []);
    }
  }, [isAdmin, user.projects]);

  const fetchWorkUnits = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/work-units`);
      setWorkUnits(response.data || []);
    } catch (e) { /* تجاهل الخطأ */ }
  }, []);

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

  const handleManagerPageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mPage', newPage);
    setSearchParams(newParams);
    setManagerCurrentPage(newPage);
  };

  const handleManagerLimitChange = (newLimit) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('mLimit', newLimit);
    newParams.set('mPage', 1);
    setSearchParams(newParams);
    setManagerItemsPerPage(newLimit);
    setManagerCurrentPage(1);
  };

  // جلب مستخلصات الأدمن
  const fetchExtracts = useCallback(async () => {
    if (!isAdmin) return;
    // setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProject) params.append('project', selectedProject);
      // استخدام فلاتر البحث حسب التبويب النشط
      if (activeTab === 'incoming') {
        if (incomingSearchNumber) params.append('extract_number', incomingSearchNumber);
        if (incomingSearchDate) params.append('date', incomingSearchDate);
      } else {
        if (recordedSearchNumber) params.append('extract_number', recordedSearchNumber);
        if (recordedSearchDate) params.append('date', recordedSearchDate);
      }
      params.append('tab', activeTab); // incoming أو registered
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await axios.get(`${API}/extracts?${params}`);
      const data = response.data;
      
      // Handle both old and new response format
      if (Array.isArray(data)) {
        setExtracts(data);
      try { localStorage.setItem('cache_Extracts.js_extracts', JSON.stringify(data)); } catch(e) {}
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setExtracts(data.extracts || []);
      try { localStorage.setItem('cache_Extracts.js_extracts', JSON.stringify(data.extracts || [])); } catch(e) {}
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch {
      toast.error(t('extractsPage.loadFail'));
    } finally {
      setLoading(false);
    }
  }, [selectedProject, incomingSearchNumber, incomingSearchDate, recordedSearchNumber, recordedSearchDate, activeTab, isAdmin, currentPage, itemsPerPage, t]);

  // جلب مستخلصات المدير (مستخدم غير أدمن)
  const fetchManagerExtracts = useCallback(async () => {
    if (isAdmin) return;
    setManagerLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('my_extracts', 'true');
      if (managerSearchNumber) params.append('extract_number', managerSearchNumber);
      if (managerSearchDate) params.append('date', managerSearchDate);
      params.append('page', managerCurrentPage);
      params.append('limit', managerItemsPerPage);
      
      const response = await axios.get(`${API}/extracts?${params}`);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setManagerExtracts(data);
        setManagerTotalCount(data.length);
        setManagerTotalPages(1);
      } else {
        setManagerExtracts(data.extracts || []);
        setManagerTotalCount(data.total_count || 0);
        setManagerTotalPages(data.total_pages || 1);
      }
    } catch {
      toast.error(t('extractsPage.loadFail'));
    } finally {
      setManagerLoading(false);
    }
  }, [isAdmin, managerSearchNumber, managerSearchDate, managerCurrentPage, managerItemsPerPage, t]);

  useEffect(() => { fetchProjects(); fetchWorkUnits(); }, [fetchProjects, fetchWorkUnits]);
  
  // بحث تلقائي عند تغيير الفلاتر
  useEffect(() => { 
    const timer = setTimeout(() => {
      fetchExtracts(); 
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedProject, incomingSearchNumber, incomingSearchDate, recordedSearchNumber, recordedSearchDate, activeTab, fetchExtracts]);
  
  useEffect(() => { 
    if (!isAdmin && managerViewMode === 'list') {
      fetchManagerExtracts(); 
    }
  }, [isAdmin, managerViewMode, fetchManagerExtracts]);

  // فلترة المستخلصات
  const getFilteredExtracts = () => {
    let filtered = extracts;
    if (activeTab === 'incoming') {
      filtered = filtered.filter(e => !e.actual_value || e.actual_value === 0);
    } else {
      filtered = filtered.filter(e => e.actual_value && e.actual_value > 0);
    }
    return filtered;
  };

  const filteredExtracts = getFilteredExtracts();
  const incomingCount = extracts.filter(e => !e.actual_value || e.actual_value === 0).length;
  const recordedCount = extracts.filter(e => e.actual_value && e.actual_value > 0).length;

  // إضافة مستخلص من مدير المشروع
  const handleManagerSubmit = async (e) => {
    e.preventDefault();
    if (!managerForm.project || !managerForm.month || !managerForm.year) {
      toast.error(t('extractsPage.requiredFields'));
      return;
    }
    setSaving(true);
    
    // ضغط الصور وحفظها
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
    const compressedImages = [];
    for (const img of managerImages) {
      try { compressedImages.push(await imageCompression(img, options)); }
      catch { compressedImages.push(img); }
    }
    const pendingImages = compressedImages;
    
    try {
      const formData = new FormData();
      formData.append('project', managerForm.project);
      formData.append('extract_number', managerForm.extract_number);
      formData.append('month', managerForm.month);
      formData.append('year', managerForm.year);
      if (managerForm.amount) formData.append('amount', managerForm.amount);
      
      const response = await axios.post(`${API}/extracts`, formData);
      const savedId = response.data.id;
      toast.success(t('extractsPage.saveSuccess'));
      
      setManagerForm({ project: availableProjects[0] || '', extract_number: '', month: '', year: '', amount: '' });
      setManagerImages([]);
      fetchManagerExtracts();
      
      // رفع الصور في الخلفية إذا وجدت
      if (pendingImages.length > 0) {
        toast.info(isRtl ? `جاري رفع ${pendingImages.length} صورة في الخلفية...` : `Uploading ${pendingImages.length} images in background...`, { autoClose: 2000 });
        
        (async () => {
          try {
            const imgFormData = new FormData();
            imgFormData.append('project', managerForm.project);
            pendingImages.forEach(img => imgFormData.append('images', img));
            await axios.put(`${API}/extracts/${savedId}`, imgFormData);
            toast.success(isRtl ? `✅ تم رفع الصور بنجاح` : `✅ Images uploaded successfully`, { autoClose: 2000 });
            fetchManagerExtracts();
          } catch (err) {
            toast.error(isRtl ? 'فشل في رفع بعض الصور' : 'Failed to upload some images');
          }
        })();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('extractsPage.fail'));
    } finally {
      setSaving(false);
    }
  };

  // إضافة مستخلص مستلم من بيت الخبرة
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project || !form.actual_value) {
      toast.error(t('extractsPage.requiredFields'));
      return;
    }
    setSaving(true);
    
    // حفظ البيانات فوراً ورفع الصور في الخلفية
    const pendingImages = [...images];
    
    try {
      const formData = new FormData();
      formData.append('project', form.project);
      formData.append('extract_number', form.extract_number);
      formData.append('invoice_number', form.invoice_number);
      formData.append('extract_date', form.extract_date);
      formData.append('work_unit', form.work_unit);
      formData.append('po_number', form.po_number);
      formData.append('actual_value', form.actual_value);
      formData.append('advance_deduction', form.advance_deduction || 0);
      formData.append('tax', autoTax.toFixed(2));
      formData.append('penalties', form.penalties || 0);
      formData.append('total_collected', totalCollected.toFixed(2));
      formData.append('is_paid', form.is_paid);
      formData.append('collection_date', form.collection_date);
      
      let savedId;
      if (editMode && selectedExtract) {
        await axios.put(`${API}/extracts/${selectedExtract.id}`, formData);
        savedId = selectedExtract.id;
        toast.success(t('extractsPage.updateSuccess'));
      } else {
        const response = await axios.post(`${API}/extracts`, formData);
        savedId = response.data.id;
        toast.success(t('extractsPage.saveSuccess'));
      }
      
      setShowModal(false);
      setForm(emptyForm);
      setImages([]);
      setEditMode(false);
      fetchExtracts();
      
      // رفع الصور في الخلفية إذا وجدت
      if (pendingImages.length > 0) {
        toast.info(isRtl ? `جاري رفع ${pendingImages.length} صورة في الخلفية...` : `Uploading ${pendingImages.length} images in background...`, { autoClose: 2000 });
        
        (async () => {
          try {
            const imgFormData = new FormData();
            imgFormData.append('project', form.project);
            pendingImages.forEach(img => imgFormData.append('images', img));
            await axios.put(`${API}/extracts/${savedId}`, imgFormData);
            toast.success(isRtl ? `✅ تم رفع الصور بنجاح` : `✅ Images uploaded successfully`, { autoClose: 2000 });
            fetchExtracts();
          } catch (err) {
            toast.error(isRtl ? 'فشل في رفع بعض الصور' : 'Failed to upload some images');
          }
        })();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('extractsPage.fail'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('extractsPage.deleteConfirm'))) return;
    try {
      await axios.delete(`${API}/extracts/${id}`);
      toast.success(t('extractsPage.deleteSuccess'));
      if (isAdmin) {
        fetchExtracts();
      } else {
        fetchManagerExtracts();
      }
    } catch { toast.error(t('extractsPage.fail')); }
  };

  const handleApprove = async (id) => {
    try {
      const formData = new FormData();
      formData.append('status', 'approved');
      await axios.put(`${API}/extracts/${id}`, formData);
      toast.success(t('extractsPage.approveSuccess'));
      fetchExtracts();
    } catch { toast.error(t('extractsPage.fail')); }
  };

  const handleReject = async (id) => {
    try {
      const formData = new FormData();
      formData.append('status', 'rejected');
      await axios.put(`${API}/extracts/${id}`, formData);
      toast.success(t('extractsPage.rejectSuccess'));
      fetchExtracts();
    } catch { toast.error(t('extractsPage.fail')); }
  };

  const handleRevertApproval = async (id) => {
    try {
      const formData = new FormData();
      formData.append('status', 'pending');
      await axios.put(`${API}/extracts/${id}`, formData);
      toast.success(t('extractsPage.revertSuccess'));
      fetchExtracts();
    } catch { toast.error(t('extractsPage.fail')); }
  };

  const openEditModal = (extract) => {
    setSelectedExtract(extract);
    setForm({
      extract_number: extract.extract_number || '',
      invoice_number: extract.invoice_number || '',
      extract_date: extract.extract_date || '',
      work_unit: extract.work_unit || '',
      po_number: extract.po_number || '',
      project: extract.project || '',
      actual_value: extract.actual_value || '',
      advance_deduction: extract.advance_deduction || '',
      tax: extract.tax || '',
      penalties: extract.penalties || '',
      total_collected: extract.total_collected || '',
      is_paid: extract.is_paid || false,
      collection_date: extract.collection_date || ''
    });
    setImages([]);
    setEditMode(true);
    setShowModal(true);
  };

  const addWorkUnit = async () => {
    if (!newWorkUnit.trim()) return;
    try {
      const formData = new FormData();
      formData.append('name', newWorkUnit.trim());
      await axios.post(`${API}/work-units`, formData);
      toast.success(t('extractsPage.workUnitAddSuccess'));
      setNewWorkUnit('');
      fetchWorkUnits();
    } catch { toast.error(t('extractsPage.fail')); }
  };

  const deleteWorkUnit = async (id) => {
    try {
      await axios.delete(`${API}/work-units/${id}`);
      fetchWorkUnits();
    } catch (e) { /* تجاهل الخطأ */ }
  };

  const toggleSelectExtract = (id) => setSelectedExtracts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedExtracts(selectedExtracts.length === filteredExtracts.length ? [] : filteredExtracts.map(e => e.id));

  // تصدير Excel
  const exportToExcel = () => {
    const data = selectedExtracts.length > 0 ? filteredExtracts.filter(e => selectedExtracts.includes(e.id)) : filteredExtracts;
    if (data.length === 0) { toast.error(isRtl ? 'لا توجد بيانات' : 'No data available'); return; }
    
    const BOM = '\uFEFF';
    let csv = BOM + (isRtl 
      ? `تقرير المستخلصات\nتاريخ: ${new Date().toLocaleDateString('ar-SA')}\nالعدد: ${data.length}\n\n`
      : `Extracts Report\nDate: ${new Date().toLocaleDateString('en-US')}\nTotal: ${data.length}\n\n`
    );
    
    csv += isRtl
      ? 'م,رقم المستخلص,رقم الفاتورة,التاريخ,المشروع,القيمة الفعلية,خصم الدفعة,الصافي,الضريبة 15%,الغرامات,إجمالي المقدم,إجمالي المحصل,الفرق,تم الصرف,تاريخ التحصيل\n'
      : 'S.No,Extract Number,Invoice Number,Date,Project,Actual Value,Advance Deduction,Net Value,Tax 15%,Penalties,Total Submitted,Total Collected,Difference,Disbursed,Collection Date\n';
    
    let totals = { actual: 0, submitted: 0, collected: 0, diff: 0 };
    data.forEach((e, i) => {
      const actual = e.actual_value || 0;
      const submitted = e.total_submitted || 0;
      const collected = e.total_collected || 0;
      const diff = e.difference || 0;
      totals.actual += actual; totals.submitted += submitted; totals.collected += collected; totals.diff += diff;
      const paidStr = e.is_paid ? (isRtl ? 'نعم' : 'Yes') : (isRtl ? 'لا' : 'No');
      csv += `${i+1},"${e.extract_number||''}","${e.invoice_number||''}","${e.extract_date||''}","${e.project?.replace('مشروع إصلاح أعمال ','').replace(' - القطاع الأوسط','')||''}",${actual},${e.advance_deduction||0},${e.net_after_deduction||0},${e.tax||0},${e.penalties||0},${submitted},${collected},${diff},"${paidStr}","${e.collection_date||''}"\n`;
    });
    
    csv += isRtl
      ? `\n,"الإجمالي","","","",${totals.actual},"","","","",${totals.submitted},${totals.collected},${totals.diff},"",""\n`
      : `\n,"Total","","","",${totals.actual},"","","","",${totals.submitted},${totals.collected},${totals.diff},"",""\n`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = (isRtl ? 'مستخلصات_' : 'extracts_') + `${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success(t('extractsPage.excelExportSuccess'));
  };

  const getStatusBadge = (status) => {
    const s = { 
      pending: ['bg-yellow-100 text-yellow-800 border-yellow-300', isRtl ? 'قيد المراجعة' : 'Pending', <Clock className="w-3 h-3" />], 
      approved: ['bg-green-100 text-green-800 border-green-300', isRtl ? 'معتمد' : 'Approved', <Check className="w-3 h-3" />], 
      approved_paid: ['bg-emerald-100 text-emerald-800 border-emerald-300', isRtl ? 'معتمد وتم الصرف' : 'Approved & Paid', <Check className="w-3 h-3" />], 
      approved_unpaid: ['bg-blue-100 text-blue-800 border-blue-300', isRtl ? 'معتمد ولم يتم الصرف' : 'Approved & Unpaid', <Clock className="w-3 h-3" />], 
      rejected: ['bg-red-100 text-red-800 border-red-300', isRtl ? 'مرفوض' : 'Rejected', <XCircle className="w-3 h-3" />] 
    };
    const [className, label, icon] = s[status] || s.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${className}`}>
        {icon} {label}
      </span>
    );
  };

  const formatMoney = (v) => v ? `${parseFloat(v).toLocaleString('en-US')} ${isRtl ? 'ر.س' : 'SAR'}` : `0 ${isRtl ? 'ر.س' : 'SAR'}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '-';

  // === واجهة مدير المشروع (غير Admin) ===
  if (!isAdmin) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="max-w-4xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'} data-testid="extracts-page">
          {/* Header with tabs */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <div className={`bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex flex-col ${isRtl ? 'text-right' : 'text-left'}`}>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6" /> {t('extractsPage.title')}
              </h1>
              <p className="text-blue-100 text-sm">{t('extractsPage.manageExtracts')}</p>
            </div>
            
            {/* Tab buttons */}
            <div className="flex border-b">
              <button 
                onClick={() => setManagerViewMode('add')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  managerViewMode === 'add' 
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                data-testid="add-extract-tab"
              >
                <Plus className="w-4 h-4" /> {t('extractsPage.addExtract')}
              </button>
              <button 
                onClick={() => setManagerViewMode('list')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  managerViewMode === 'list' 
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                data-testid="list-extracts-tab"
              >
                <List className="w-4 h-4" /> {t('extractsPage.projectExtracts')}
                {managerTotalCount > 0 && (
                  <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full mx-1">{managerTotalCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Add Extract Form */}
          {managerViewMode === 'add' && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <form onSubmit={handleManagerSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('extractsPage.project')} *</label>
                  <select value={managerForm.project} onChange={(e) => setManagerForm({ ...managerForm, project: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg min-h-[42px] bg-white" required data-testid="project-select">
                      {availableProjects.map(p => <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('extractsPage.extractNumber')}</label>
                  <input type="text" value={managerForm.extract_number} onChange={(e) => setManagerForm({ ...managerForm, extract_number: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder={t('extractsPage.examplePlaceholder')} data-testid="extract-number-input" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('extractsPage.month')} *</label>
                    <select value={managerForm.month} onChange={(e) => setManagerForm({ ...managerForm, month: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white" required data-testid="month-select">
                      <option value="">{t('extractsPage.select')}</option>
                      {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('extractsPage.year')} *</label>
                    <select value={managerForm.year} onChange={(e) => setManagerForm({ ...managerForm, year: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white" required data-testid="year-select">
                      <option value="">{t('extractsPage.select')}</option>
                      {Array.from({ length: 31 }, (_, i) => 2020 + i).map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('extractsPage.amount')}</label>
                  <input type="number" step="0.01" value={managerForm.amount} onChange={(e) => setManagerForm({ ...managerForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="0.00" data-testid="amount-input" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('extractsPage.images')} *</label>
                  <input type="file" multiple accept="image/*" onChange={(e) => setManagerImages(prev => [...prev, ...Array.from(e.target.files)])}
                    className="w-full px-3 py-2 border rounded-lg bg-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" data-testid="images-input" />
                  {managerImages.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {managerImages.map((img, i) => (
                        <div key={i} className="relative">
                          <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                          <button type="button" onClick={() => setManagerImages(prev => prev.filter((_, idx) => idx !== i))} 
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button type="submit" disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  data-testid="submit-extract-btn">
                  {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? t('extractsPage.uploading') : t('extractsPage.uploadExtract')}
                </button>
              </form>
            </div>
          )}

          {/* Manager Extracts List */}
          {managerViewMode === 'list' && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* فلاتر البحث للمستوى 2 */}
              <div className="p-4 border-b bg-gray-50">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder={t('extractsPage.searchByNumber')} 
                    value={managerSearchNumber}
                    onChange={(e) => setManagerSearchNumber(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  <input 
                    type="date" 
                    value={managerSearchDate}
                    onChange={(e) => setManagerSearchDate(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  />
                  <button onClick={fetchManagerExtracts} className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
                    <RefreshCw className="w-4 h-4" /> {t('extractsPage.search')}
                  </button>
                </div>
              </div>
              
              {managerLoading ? (
                <div className="text-center py-10">
                  <div className="flex flex-col items-center"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div><span className="text-purple-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>
                  <p className="text-gray-500 mt-2">{t('extractsPage.loading')}</p>
                </div>
              ) : managerExtracts.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('extractsPage.noExtracts')}</p>
                  <button 
                    onClick={() => setManagerViewMode('add')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('extractsPage.addExtract')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-purple-50">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.extractNumber')}</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.project')}</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.monthYear')}</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.amount')}</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.status')}</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.uploadDate')}</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">{t('extractsPage.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {managerExtracts.map(e => (
                          <tr key={e.id} className="hover:bg-gray-50" data-testid={`extract-row-${e.id}`}>
                            <td className="px-4 py-3 font-medium text-center">{e.extract_number || '-'}</td>
                            <td className="px-3 py-3 font-medium whitespace-nowrap text-center">{e.project ? translateBrandingText(e.project, isRtl) : "-"}</td>
                            <td className="px-4 py-3 text-center">{e.month && e.year ? `${MONTHS[e.month - 1]} ${e.year}` : '-'}</td>
                            <td className="px-4 py-3 text-center">{e.amount ? formatMoney(e.amount) : '-'}</td>
                            <td className="px-4 py-3 text-center">{getStatusBadge(e.status)}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs text-center">{formatDate(e.created_at)}</td>
                            <td className="px-4 py-3 text-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <MoreVertical className="w-5 h-5 text-gray-500" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-white shadow-xl border border-gray-100 rounded-xl p-1 z-[100]">
                                  <DropdownMenuItem 
                                    onClick={() => { setSelectedExtract(e); setShowViewModal(true); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-cyan-600" />
                                    <span>{t('extractsPage.view')}</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => { setSelectedImages(e.images || []); setShowImagesModal(true); }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  >
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                    <span>{t('extractsPage.imagesBtn')}</span>
                                  </DropdownMenuItem>
                                  {e.status === 'pending' && (
                                    <>
                                      <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                      <DropdownMenuItem 
                                        onClick={() => handleDelete(e.id)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                        <span>{t('extractsPage.delete')}</span>
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  <Pagination
                    currentPage={managerCurrentPage}
                    totalPages={managerTotalPages}
                    totalItems={managerTotalCount}
                    itemsPerPage={managerItemsPerPage}
                    onPageChange={handleManagerPageChange}
                    onItemsPerPageChange={handleManagerLimitChange}
                    itemLabel={t('extractsPage.view')}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* View Modal */}
        {showViewModal && selectedExtract && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-bold text-white"><Eye className="w-5 h-5 inline ml-2" />{t('extractsPage.details')}</h3>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('extractsPage.project')}</p>
                    <p className="font-semibold">{selectedExtract.project ? translateBrandingText(selectedExtract.project, isRtl) : "-"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('extractsPage.extractNumber')}</p>
                    <p className="font-semibold">{selectedExtract.extract_number || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('extractsPage.monthYear')}</p>
                    <p className="font-semibold">{selectedExtract.month && selectedExtract.year ? `${MONTHS[selectedExtract.month - 1]} ${selectedExtract.year}` : '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('extractsPage.amount')}</p>
                    <p className="font-semibold">{selectedExtract.amount ? formatMoney(selectedExtract.amount) : '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500">{t('extractsPage.approvalStatus')}</p>
                    <div className="mt-1">{getStatusBadge(selectedExtract.status)}</div>
                    {selectedExtract.status === 'approved' && (
                      <p className="text-xs text-green-600 mt-1">{t('extractsPage.approvedExpert')}</p>
                    )}
                    {selectedExtract.status === 'rejected' && (
                      <p className="text-xs text-red-600 mt-1">{t('extractsPage.rejectedStatus')}</p>
                    )}
                    {selectedExtract.status === 'pending' && (
                      <p className="text-xs text-yellow-600 mt-1">{t('extractsPage.pendingReview')}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setShowViewModal(false)} className="w-full py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{t('extractsPage.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Images Modal */}
        {showImagesModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-bold text-white">{t('extractsPage.imagesTitle')} ({selectedImages.length})</h3>
                <button onClick={() => setShowImagesModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6">
                {selectedImages.length === 0 ? <p className="text-center text-gray-500 py-8">{t('extractsPage.noImages')}</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border-2 group">
                        <img src={resolveImageUrl(img)} alt="" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setFullViewImage(img)} className="p-3 bg-white/90 rounded-full hover:bg-white">
                            <Eye className="w-6 h-6 text-blue-600" />
                          </button>
                        </div>
                        <div className={`absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <span className="text-white text-sm">{t('extractsPage.imageCount', {index: i + 1})}</span>
                          <a href={img} download={`image_${i + 1}.jpg`} className="text-white hover:text-blue-300"><Download className="w-4 h-4" /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* نافذة عرض الصورة المكبرة */}
        {fullViewImage && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setFullViewImage(null)}>
            <div className="relative max-w-full max-h-full">
              <button onClick={() => setFullViewImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full z-10">
                <X className="w-6 h-6 text-white" />
              </button>
              <img src={resolveImageUrl(fullViewImage)} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <a href={fullViewImage} download="image.jpg" onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> {t('extractsPage.download')}
                </a>
              </div>
            </div>
          </div>
        )}
      </Layout>
    );
  }

  // === واجهة بيت الخبرة (Admin) ===
  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'} data-testid="extracts-page">
        {/* Header */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><FileText className="w-6 h-6 text-purple-600" /></div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{t('extractsPage.title')}</h1>
              <p className="text-sm text-gray-500">{activeTab === 'incoming' ? `${t('extractsPage.incoming')}: ${incomingCount}` : `${t('extractsPage.recorded')}: ${recordedCount}`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === 'recorded' && <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"><FileSpreadsheet className="w-4 h-4" /> {t('extractsPage.excelExport')}</button>}
            {activeTab === 'recorded' && <button onClick={() => { setForm(emptyForm); setEditMode(false); setShowModal(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors"><Plus className="w-4 h-4" /> {t('extractsPage.addReceivedExtract')}</button>}
          </div>
        </div>

        {/* التبويبات */}
        <div className="bg-white rounded-xl shadow-md mb-4 overflow-hidden">
          <div className="flex border-b">
            <button onClick={() => setActiveTab('incoming')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'incoming' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Inbox className="w-4 h-4" /> {t('extractsPage.incoming')} {incomingCount > 0 && <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mx-1">{incomingCount}</span>}
            </button>
            <button onClick={() => setActiveTab('recorded')} className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'recorded' ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Send className="w-4 h-4" /> {t('extractsPage.recorded')} {recordedCount > 0 && <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full mx-1">{recordedCount}</span>}
            </button>
          </div>
        </div>

        {/* الفلاتر - منفصلة لكل تبويب */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="px-3 py-2 border rounded-lg text-sm min-w-[300px] bg-white">
              <option value="">{t('extractsPage.allProjects')}</option>
              {availableProjects.map(p => <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>)}
            </select>
            {activeTab === 'incoming' ? (
              <>
                <input 
                  type="text" 
                  placeholder={t('extractsPage.searchByNumber')} 
                  value={incomingSearchNumber}
                  onChange={(e) => setIncomingSearchNumber(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <input 
                  type="date" 
                  value={incomingSearchDate}
                  onChange={(e) => setIncomingSearchDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </>
            ) : (
              <>
                <input 
                  type="text" 
                  placeholder={t('extractsPage.searchByNumber')} 
                  value={recordedSearchNumber}
                  onChange={(e) => setRecordedSearchNumber(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
                <input 
                  type="date" 
                  value={recordedSearchDate}
                  onChange={(e) => setRecordedSearchDate(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </>
            )}
            <button onClick={fetchExtracts} className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"><RefreshCw className="w-4 h-4" /> {t('extractsPage.search')}</button>
          </div>
        </div>

        {/* الجداول */}
        {extracts.length === 0 && loading ? (
          <div className="text-center py-10 bg-white rounded-xl shadow"><div className="flex flex-col items-center"><div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mb-4"></div><span className="text-purple-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div></div>
        ) : filteredExtracts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t('extractsPage.noExtracts')}</p>
          </div>
        ) : activeTab === 'incoming' ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.extractNumber')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.project')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.monthYear')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.uploadedBy')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.status')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExtracts.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 font-bold text-blue-700 whitespace-nowrap text-center">{e.extract_number || '-'}</td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap text-center">{e.project ? translateBrandingText(e.project, isRtl) : "-"}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">{e.month && e.year ? `${e.month}/${e.year}` : '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">{e.created_by_name ? translateBrandingText(e.created_by_name, isRtl) : '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">{getStatusBadge(e.status)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                              <MoreVertical className="w-5 h-5 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-white shadow-xl border border-gray-100 rounded-xl p-1 z-[100]">
                            <DropdownMenuItem 
                              onClick={() => { setSelectedExtract(e); setShowViewModal(true); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-cyan-600" />
                              <span>{t('extractsPage.view')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => { setSelectedImages(e.images || []); setShowImagesModal(true); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span>{t('extractsPage.imagesBtn')}</span>
                            </DropdownMenuItem>
                            {e.status === 'pending' && (
                              <>
                                <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                <DropdownMenuItem 
                                  onClick={() => handleApprove(e.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer font-medium"
                                >
                                  <Check className="w-4 h-4 text-emerald-600" />
                                  <span>{t('extractsPage.approve')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleReject(e.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-lg cursor-pointer font-medium"
                                >
                                  <XCircle className="w-4 h-4 text-orange-600" />
                                  <span>{t('extractsPage.reject')}</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            {e.status === 'approved' && (
                              <>
                                <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                <DropdownMenuItem 
                                  onClick={() => handleRevertApproval(e.id)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
                                >
                                  <Undo2 className="w-4 h-4 text-gray-600" />
                                  <span>{t('extractsPage.revert')}</span>
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator className="my-1 bg-gray-100" />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(e.id)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span>{t('extractsPage.delete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              itemLabel={t('extractsPage.view')}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-purple-50">
                  <tr>
                    <th className="px-2 py-3 whitespace-nowrap"><input type="checkbox" checked={selectedExtracts.length === filteredExtracts.length && filteredExtracts.length > 0} onChange={toggleSelectAll} className="w-4 h-4" /></th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.extractNumber')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.project')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.valueBeforeTax')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.totalSubmittedAfterTax')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.penalties')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.difference')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.paid')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('extractsPage.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExtracts.map(e => (
                    <tr key={e.id} className={`hover:bg-gray-50 ${selectedExtracts.includes(e.id) ? 'bg-purple-50' : ''}`}>
                      <td className="px-2 py-3 whitespace-nowrap text-center"><input type="checkbox" checked={selectedExtracts.includes(e.id)} onChange={() => toggleSelectExtract(e.id)} className="w-4 h-4" /></td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap text-center">{e.extract_number || '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">{e.project ? translateBrandingText(e.project, isRtl) : "-"}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">{formatMoney(e.actual_value)}</td>
                      <td className="px-3 py-3 text-blue-600 font-medium whitespace-nowrap text-center">{formatMoney(e.total_submitted)}</td>
                      <td className={`px-3 py-3 font-medium whitespace-nowrap text-center ${(e.penalties || 0) > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatMoney(e.penalties || 0)}</td>
                      <td className={`px-3 py-3 font-medium whitespace-nowrap text-center ${(e.difference || 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{formatMoney(e.difference || 0)}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">{e.is_paid ? <span className="text-emerald-600">✓ {t('extractsPage.yes')}</span> : <span className="text-gray-400">{t('extractsPage.no')}</span>}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                              <MoreVertical className="w-5 h-5 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-white shadow-xl border border-gray-100 rounded-xl p-1 z-[100]">
                            <DropdownMenuItem 
                              onClick={() => { setSelectedExtract(e); setShowViewModal(true); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-cyan-600" />
                              <span>{t('extractsPage.view')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => { setSelectedImages(e.images || []); setShowImagesModal(true); }}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <ImageIcon className="w-4 h-4 text-blue-600" />
                              <span>{t('extractsPage.imagesBtn')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => openEditModal(e)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 text-yellow-600" />
                              <span>{t('extractsPage.edit')}</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-gray-100" />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(e.id)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                              <span>{t('extractsPage.delete')}</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              itemLabel={t('extractsPage.view')}
            />
          </div>
        )}

        {/* نافذة إضافة مستخلص مستلم */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-bold text-white"><FileText className="w-5 h-5 inline ml-2" />{editMode ? t('extractsPage.editReceivedExtract') : t('extractsPage.addReceivedExtract')}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-medium mb-1">{t('extractsPage.extractNumber')}</label><input type="text" value={form.extract_number} onChange={(e) => setForm({ ...form, extract_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('extractsPage.invoiceNumber')}</label><input type="text" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" placeholder={t('extractsPage.invoicePlaceholder')} /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('extractsPage.date')}</label><input type="date" value={form.extract_date} onChange={(e) => setForm({ ...form, extract_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">{t('extractsPage.workUnit')}</label>
                    <button type="button" onClick={() => setShowWorkUnitDropdown(!showWorkUnitDropdown)} className={`w-full px-3 py-2 border rounded-lg flex justify-between items-center bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none ${isRtl ? 'text-right' : 'text-left'}`}>{form.work_unit ? translateBrandingText(form.work_unit, isRtl) : t('extractsPage.select')}<ChevronDown className="w-4 h-4" /></button>
                    {showWorkUnitDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        <div className="p-2 border-b flex gap-2">
                          <input type="text" value={newWorkUnit} onChange={(e) => setNewWorkUnit(e.target.value)} className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white" placeholder={t('extractsPage.workUnitNew')} />
                          <button type="button" onClick={addWorkUnit} className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        {workUnits.map(u => (
                          <div key={u.id} className="flex justify-between items-center px-3 py-2 hover:bg-gray-50">
                            <button type="button" onClick={() => { setForm({ ...form, work_unit: u.name }); setShowWorkUnitDropdown(false); }} className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>{translateBrandingText(u.name, isRtl)}</button>
                            <button type="button" onClick={() => deleteWorkUnit(u.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div><label className="block text-sm font-medium mb-1">{t('extractsPage.poNumber')}</label><input type="text" value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('extractsPage.project')} *</label>
                    <select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} className="w-full px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none" required>
                      <option value="">{t('extractsPage.select')}</option>
                        {availableProjects.map(p => <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>)}
                    </select>
                  </div>
                </div>

                {/* الحقول المالية */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className={`font-semibold text-blue-800 mb-3 flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}><DollarSign className="w-5 h-5" />{t('extractsPage.financialFields')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.extractValue')} *</label><input type="number" step="0.01" value={form.actual_value} onChange={(e) => setForm({ ...form, actual_value: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white font-semibold" required /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.advanceDeduction')}</label><input type="number" step="0.01" value={form.advance_deduction} onChange={(e) => setForm({ ...form, advance_deduction: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.net')}</label><input type="text" value={netAfterDeduction.toLocaleString('en-US')} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-blue-600 font-bold" /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.taxAuto')}</label><input type="text" value={autoTax.toLocaleString('en-US')} readOnly className="w-full px-3 py-2 border rounded-lg bg-green-100 text-green-700 font-bold" /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.penalties')}</label><input type="number" step="0.01" value={form.penalties} onChange={(e) => setForm({ ...form, penalties: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.totalSubmitted')}</label><input type="text" value={totalSubmitted.toLocaleString('en-US')} readOnly className="w-full px-3 py-2 border rounded-lg bg-blue-100 text-blue-700 font-extrabold" /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.totalCollectedAuto')}</label><input type="text" value={totalCollected.toLocaleString('en-US')} readOnly className="w-full px-3 py-2 border rounded-lg bg-emerald-100 text-emerald-700 font-extrabold" /></div>
                    <div><label className="block text-xs font-medium mb-1">{t('extractsPage.difference')}</label><input type="text" value={difference === 0 ? '0' : difference.toLocaleString('en-US')} readOnly className={`w-full px-3 py-2 border rounded-lg font-extrabold ${difference > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`} /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_paid} onChange={(e) => setForm({ ...form, is_paid: e.target.checked })} className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer" /><span>{t('extractsPage.paid')}</span></label>
                  <div><label className="block text-sm font-medium mb-1">{t('extractsPage.collectionDate')}</label><input type="date" value={form.collection_date} onChange={(e) => setForm({ ...form, collection_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white" /></div>
                </div>

                {/* حقل رفع الصور */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('extractsPage.images')}</label>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*" 
                    onChange={(e) => setImages(prev => [...prev, ...Array.from(e.target.files)])}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    data-testid="admin-extract-images-input"
                  />
                  {images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={URL.createObjectURL(img)} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200" />
                          <button 
                            type="button" 
                            onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} 
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`flex gap-3 pt-4 border-t ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">{saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saving ? t('extractsPage.uploading') : t('extractsPage.save')}</button>
                  <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">{t('extractsPage.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* نافذة العرض للـ Admin */}
        {showViewModal && selectedExtract && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-gradient-to-r from-cyan-600 to-cyan-700 px-6 py-4 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-bold text-white"><Eye className="w-5 h-5 inline ml-2" />{t('extractsPage.details')}</h3>
                <button onClick={() => setShowViewModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6 space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    [t('extractsPage.project'), selectedExtract.project], 
                    [t('extractsPage.extractNumber'), selectedExtract.extract_number], 
                    [t('extractsPage.status'), getStatusBadge(selectedExtract.status)]
                  ].map(([l, v], i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{l}</p><p className="font-semibold">{v || '-'}</p></div>
                  ))}
                </div>
                {selectedExtract.actual_value > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      [t('extractsPage.extractValue'), formatMoney(selectedExtract.actual_value)], 
                      [t('extractsPage.taxAuto').replace(' (تلقائي)', '').replace(' (Auto)', ''), formatMoney(selectedExtract.tax)], 
                      [t('extractsPage.totalSubmitted'), formatMoney(selectedExtract.total_submitted)], 
                      [t('extractsPage.penalties'), formatMoney(selectedExtract.penalties || 0)], 
                      [t('extractsPage.difference'), formatMoney(selectedExtract.difference || 0)]
                    ].map(([l, v], i) => (
                      <div key={i}><p className="text-xs text-gray-500">{l}</p><p className={`font-bold ${l === t('extractsPage.penalties') && parseFloat(v.replace(/[^\d.-]/g, '')) > 0 ? 'text-orange-600' : ''} ${l === t('extractsPage.difference') && parseFloat(v.replace(/[^\d.-]/g, '')) > 0 ? 'text-red-600' : ''}`}>{v}</p></div>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowViewModal(false)} className="w-full py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">{t('extractsPage.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* نافذة الصور للـ Admin */}
        {showImagesModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className={`sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-bold text-white">{t('extractsPage.imagesTitle')} ({selectedImages.length})</h3>
                <button onClick={() => setShowImagesModal(false)} className="p-2 hover:bg-white/20 rounded-full"><X className="w-5 h-5 text-white" /></button>
              </div>
              <div className="p-6">
                {selectedImages.length === 0 ? <p className="text-center text-gray-500 py-8">{t('extractsPage.noImages')}</p> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedImages.map((img, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border-2 group">
                        <img src={resolveImageUrl(img)} alt="" className="w-full h-48 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => setFullViewImage(img)} className="p-3 bg-white/90 rounded-full hover:bg-white animate-fade-in">
                            <Eye className="w-6 h-6 text-blue-600" />
                          </button>
                        </div>
                        <div className={`absolute bottom-0 left-0 right-0 bg-black/50 p-2 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <span className="text-white text-sm">{t('extractsPage.imageCount', {index: i + 1})}</span>
                          <a href={img} download={`image_${i + 1}.jpg`} className="text-white hover:text-blue-300"><Download className="w-4 h-4" /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* نافذة عرض الصورة المكبرة للـ Admin */}
        {fullViewImage && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setFullViewImage(null)}>
            <div className="relative max-w-full max-h-full">
              <button onClick={() => setFullViewImage(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full z-10">
                <X className="w-6 h-6 text-white" />
              </button>
              <img src={resolveImageUrl(fullViewImage)} alt="" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <a href={fullViewImage} download="image.jpg" onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                  <Download className="w-4 h-4" /> {t('extractsPage.download')}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Extracts;
