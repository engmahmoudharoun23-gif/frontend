import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateBrandingText } from '../utils/brandingTranslation';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { MoreVertical, Eye, Edit, CheckCircle, XCircle, Trash2, RotateCcw, Clock, FileCheck, ShieldCheck } from "lucide-react";
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Invoices({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const platformName = localStorage.getItem('platformName') || 'بيت الخبرة';
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [invoiceNumberFilter, setInvoiceNumberFilter] = useState('');
  
  // Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);

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
  
  const [formData, setFormData] = useState({
    invoice_number: '',
    amount: '',
    description: '',
    images: [],
    project: '',
    governorate: '',
    invoice_date: new Date().toISOString().split('T')[0]
  });
  
  // حالة عرض الصورة المكبرة
  const [fullViewImage, setFullViewImage] = useState(null);

  const isAdmin = user.role === 'admin';
  // مدير حقيقي = مستوى 2 لديه فعلاً موظفين تحت إدارته
  const isManager = user.has_sub_users === true && user.role !== 'admin';
  const isEmployee = !user.can_create_subusers;
  const canAddInvoice = true;

  const [availableProjects, setAvailableProjects] = useState([]);

  // جلب المشاريع من قاعدة البيانات
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects`);
        const defaultOrder = [
          'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
          'مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط',
          'مشروع إصلاح أعمال المحافظات الجنوبية - القطاع الأوسط'
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
      } catch (error) {
        setAvailableProjects(user.projects || []);
      }
    };
    fetchProjects();
  }, [isAdmin, user.projects]);

  useEffect(() => {
    // لا نفرض اختيار مشروع - "جميع المشاريع" متاح للجميع
  }, [availableProjects]);

  // دالة جلب الفواتير
  const fetchInvoices = async () => {
    try {
      // setLoading(true);
      const params = new URLSearchParams();
      if (projectFilter) params.append('project', projectFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (invoiceNumberFilter) params.append('invoice_number', invoiceNumberFilter);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await axios.get(`${API}/invoices?${params}`);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setInvoices(data);
        setFilteredInvoices(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setInvoices(data.invoices || []);
        setFilteredInvoices(data.invoices || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('فشل في تحميل الفواتير');
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
  };

  // إعادة جلب البيانات عند تغيير المشروع أو الفلاتر أو الترقيم
  useEffect(() => {
    fetchInvoices();
  }, [projectFilter, statusFilter, dateFilter, currentPage, itemsPerPage]);

  // إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    setStatusFilter('all');
    setDateFilter('');
    setInvoiceNumberFilter('');
    if (!isAdmin && availableProjects.length > 0) {
      setProjectFilter(availableProjects[0]);
    } else {
      setProjectFilter('');
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
    toast.info('⏳ جاري ضغط الصور...', { autoClose: 1500 });
    for (const file of files) {
      try {
        const compressed = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
        };
        reader.readAsDataURL(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, images: [...prev.images, reader.result] }));
        };
        reader.readAsDataURL(file);
      }
    }
    toast.success(`✅ تم ضغط ${files.length > 1 ? files.length + ' صور' : 'الصورة'} تلقائياً إلى 100KB`, { autoClose: 2500 });
  };

  const removeImage = (index) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
    setFormData({
      invoice_number: '',
      amount: '',
      description: '',
      images: [],
      project: availableProjects[0] || '',
      governorate: '',
      invoice_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // حفظ البيانات فوراً ورفع الصور في الخلفية
    const dataToSend = { ...formData, amount: parseFloat(formData.amount) };
    const pendingImages = formData.images;
    
    try {
      // إرسال البيانات بدون الصور للحفظ السريع
      const response = await axios.post(`${API}/invoices`, { ...dataToSend, images: [] });
      const savedId = response.data.id;
      toast.success('✅ تم رفع الفاتورة بنجاح');
      
      setShowAddModal(false);
      resetForm();
      fetchInvoices();
      
      // رفع الصور في الخلفية إذا وجدت
      if (pendingImages.length > 0) {
        toast.info(`جاري رفع ${pendingImages.length} صورة في الخلفية...`, { autoClose: 2000 });
        
        (async () => {
          try {
            await axios.put(`${API}/invoices/${savedId}`, { ...dataToSend, images: pendingImages });
            toast.success(`✅ تم رفع الصور بنجاح`, { autoClose: 2000 });
            fetchInvoices();
          } catch (err) {
            toast.error('فشل في رفع بعض الصور');
          }
        })();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    
    // حفظ البيانات فوراً ورفع الصور في الخلفية
    const dataToSend = { ...formData, amount: parseFloat(formData.amount) };
    const existingImages = selectedInvoice.images || [];
    const allImages = formData.images;
    const newImages = allImages.filter(img => !existingImages.includes(img));
    
    try {
      // إرسال البيانات مع الصور الموجودة فقط
      await axios.put(`${API}/invoices/${selectedInvoice.id}`, { ...dataToSend, images: existingImages });
      toast.success('✅ تم تعديل الفاتورة بنجاح');
      
      setShowEditModal(false);
      fetchInvoices();
      
      // رفع الصور الجديدة في الخلفية إذا وجدت
      if (newImages.length > 0) {
        toast.info(`جاري رفع ${newImages.length} صورة جديدة...`, { autoClose: 2000 });
        
        (async () => {
          try {
            await axios.put(`${API}/invoices/${selectedInvoice.id}`, { ...dataToSend, images: allImages });
            toast.success(`✅ تم رفع الصور بنجاح`, { autoClose: 2000 });
            fetchInvoices();
          } catch (err) {
            toast.error('فشل في رفع بعض الصور');
          }
        })();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const openEditModal = (invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      amount: invoice.amount.toString(),
      description: invoice.description,
      images: invoice.images || (invoice.image ? [invoice.image] : []),
      project: invoice.project,
      governorate: invoice.governorate || '',
      invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0]
    });
    setShowEditModal(true);
  };

  // صلاحيات الاعتماد النهائي المفوضة من بيت الخبرة (عبر review_invoices_3)
  const hasFinalReviewDelegation = (invoice) => {
    if (isAdmin) return true;
    const perms = user.permissions || [];
    const pp = user.project_permissions || {};
    const projectPerms = (invoice?.project && pp[invoice.project]) || [];
    return perms.includes('review_invoices_3') ||
           perms.includes('view_all_invoices') ||
           projectPerms.includes('review_invoices_3') ||
           projectPerms.includes('view_all_invoices');
  };

  const canApproveInvoice = (invoice) => {
    // الأدمن (بيت الخبرة) يمكنه اعتماد أي فاتورة من أي حالة
    if (isAdmin) {
      return invoice.status === 'pending' || invoice.status === 'approved_by_manager' || invoice.status === 'rejected';
    }
    
    // المفوض بالاعتماد النهائي (نيابة عن بيت الخبرة)
    if (invoice.status === 'approved_by_manager' && hasFinalReviewDelegation(invoice)) {
      // فصل المهام: من اعتمد أولياً لا يعتمد نهائياً نفس الفاتورة
      if (invoice.reviewed_by_manager === user.id) return false;
      return true;
    }
    
    // مدير المشروع (المستوى 2):
    // - يراجع فواتير موظفيه قيد الانتظار
    // - أو يعتمد فاتورته الخاصة (اعتماد ذاتي) لإرسالها للاعتماد النهائي
    if (invoice.status === 'pending' && isManager) {
      return true; // التحقق الدقيق يتم في الـ Backend
    }
    
    return false;
  };

  const canDeleteInvoice = (invoice) => {
    // الأدمن، أو صاحب الفاتورة (إذا كانت معلقة)، أو مدير المشروع (لفواتير موظفيه المعلقة)
    const isUploader = invoice.uploaded_by === user.id;
    const isManager = user.level === 2 || user.has_sub_users || user.can_create_subusers;
    return isAdmin || (isUploader && invoice.status === 'pending') || (isManager && invoice.status === 'pending');
  };

  // دالة للتحقق من إمكانية إلغاء الفاتورة (الرجوع عن الاعتماد أو الرفض)
  const canCancelInvoice = (invoice) => {
    // فقط الأدمن (بيت الخبرة) يمكنه إلغاء اعتماد الفواتير
    if (isAdmin && (invoice.status === 'approved_by_manager' || invoice.status === 'approved_final')) {
      return true;
    }
    return false;
  };

  const canRejectInvoice = (invoice) => {
    // فقط الأدمن (بيت الخبرة) يمكنه رفض الفواتير
    if (isAdmin) {
      return invoice.status === 'pending' || invoice.status === 'approved_by_manager';
    }
    return false;
  };

  const handleApprove = async (invoiceId) => {
    try {
      await axios.put(`${API}/invoices/${invoiceId}/approve`);
      toast.success('تم اعتماد الفاتورة');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleReject = async (invoiceId) => {
    if (!window.confirm('⚠️ هل أنت متأكد من إلغاء اعتماد هذه الفاتورة؟\nستبقى الفاتورة موجودة ويمكن إعادة اعتمادها.')) {
      return;
    }
    const notes = prompt('سبب الإلغاء (مطلوب):');
    if (!notes) {
      toast.error('يجب كتابة سبب الإلغاء');
      return;
    }
    try {
      await axios.put(`${API}/invoices/${invoiceId}/reject?notes=${encodeURIComponent(notes)}`);
      toast.success('تم إلغاء اعتماد الفاتورة');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleCancel = async (invoiceId) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الفاتورة وإعادتها لحالة قيد المراجعة؟')) return;
    const notes = prompt('سبب الإلغاء (اختياري):');
    try {
      await axios.put(`${API}/invoices/${invoiceId}/cancel?notes=${encodeURIComponent(notes || '')}`);
      toast.success('تم إلغاء الفاتورة وإعادتها لحالة قيد المراجعة');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('⚠️ هل أنت متأكد من حذف هذه الفاتورة نهائياً؟\n\n⛔ تحذير: لا يمكن التراجع عن هذا الإجراء!')) return;
    try {
      await axios.delete(`${API}/invoices/${invoiceId}`);
      toast.success('تم حذف الفاتورة');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleDownload = (invoice, imageUrl) => {
    const url = imageUrl || (invoice.images && invoice.images[0]) || invoice.image;
    if (!url) { toast.error('لا توجد صورة'); return; }
    const link = document.createElement('a');
    link.href = url;
    link.download = `فاتورة_${invoice.invoice_number}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status, invoice) => {
    const badges = {
      pending: { 
        text: isRtl ? 'قيد المراجعة' : 'Under Review', 
        color: 'bg-blue-600 text-white shadow-sm border-b-2 border-blue-800', 
        icon: <Clock className="w-3.5 h-3.5" />
      },
      approved_by_manager: { 
        text: isRtl ? 'معتمدة أولياً' : 'Initially Approved', 
        color: 'bg-blue-600 text-white border-b-2 border-blue-800', 
        icon: <FileCheck className="w-3.5 h-3.5" />
      },
      approved_final: { 
        text: isRtl ? 'معتمدة نهائياً' : 'Finally Approved', 
        color: 'bg-indigo-600 text-white border-b-2 border-indigo-800', 
        icon: <ShieldCheck className="w-4 h-4" />
      },
      approved_by_admin: { 
        text: isRtl ? 'معتمدة نهائياً' : 'Finally Approved', 
        color: 'bg-indigo-600 text-white border-b-2 border-indigo-800', 
        icon: <ShieldCheck className="w-4 h-4" />
      },
      cancelled: { 
        text: isRtl ? 'تم إلغاء الاعتماد' : 'Approval Cancelled', 
        color: 'bg-blue-600 text-white border-b-2 border-blue-800 text-base py-2', 
        icon: <RotateCcw className="w-4 h-4" />
      },
      rejected: { 
        text: isRtl ? `ملغية من ${platformName}` : `Cancelled by ${platformName}`, 
        color: 'bg-blue-600 text-white border-b-2 border-blue-800 text-base py-2', 
        icon: <XCircle className="w-4 h-4" />
      }
    };
    const badge = badges[status] || { text: status, color: 'bg-blue-600 text-white text-sm', icon: null };
    
    return (
      <div className="space-y-1">
        <span className={`inline-flex items-center gap-2 px-4 rounded-lg font-black shadow-md ${badge.color}`}>
          {badge.icon}
          {badge.text}
          {status === 'pending' && <span className="flex h-2 w-2 relative ml-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span></span>}
        </span>
        {/* عرض اسم من اعتمد أولياً */}
        {status === 'approved_by_manager' && invoice?.reviewed_by_manager_name && (
          <div className="text-blue-600 text-xs bg-blue-50 p-1 rounded border border-blue-200">
            <span className="font-bold">{isRtl ? 'المدير:' : 'Manager:'}</span> {invoice.reviewed_by_manager_name}
          </div>
        )}
        {/* عرض اسم من اعتمد نهائياً */}
        {(status === 'approved_final' || status === 'approved_by_admin') && invoice?.final_approved_by_name && (
          <div className="text-green-600 text-xs bg-green-50 p-1 rounded border border-green-200">
            {invoice.final_approved_on_behalf ? (
              <>
                <span className="font-bold">{isRtl ? `نيابة عن ${platformName}:` : `On behalf of ${translateBrandingText(platformName, false)}:`}</span> {translateBrandingText(invoice.final_approved_by_name, isRtl)}
              </>
            ) : (
              <>
                <span className="font-bold">{translateBrandingText(platformName, isRtl)}:</span> {translateBrandingText(invoice.final_approved_by_name, isRtl)}
              </>
            )}
          </div>
        )}
        {/* عرض سبب الإلغاء */}
        {status === 'rejected' && (
          <div className="text-red-600 text-xs bg-red-50 p-1 rounded border border-red-200 space-y-1">
            {invoice?.rejected_by_name && (
              <div><span className="font-bold">{isRtl ? 'ملغية من:' : 'Cancelled By:'}</span> {invoice.rejected_by_name}</div>
            )}
            {invoice?.rejection_notes && (
              <div><span className="font-bold">{isRtl ? 'السبب:' : 'Reason:'}</span> {invoice.rejection_notes}</div>
            )}
          </div>
        )}
        {status === 'cancelled' && invoice?.cancellation_notes && (
          <div className="text-orange-600 text-xs bg-orange-50 p-1 rounded border border-orange-200">
            <span className="font-bold">{isRtl ? 'سبب الإلغاء:' : 'Cancellation Reason:'}</span> {invoice.cancellation_notes}
          </div>
        )}
      </div>
    );
  };

  const canEditInvoice = (invoice) => {
    return (invoice.uploaded_by === user.id || isAdmin) && invoice.status === 'pending';
  };

  // تنسيق التاريخ بالإنجليزية
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = MONTHS_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // تجميع حسب الشهر
  const groupedInvoices = filteredInvoices.reduce((groups, invoice) => {
    const date = new Date(invoice.invoice_date || invoice.created_at);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(invoice);
    return groups;
  }, {});

  const sortedMonths = Object.keys(groupedInvoices).sort((a, b) => b.localeCompare(a));

  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-');
    return `${MONTHS_NAMES[parseInt(month) - 1]} ${year}`;
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span className="bg-blue-50 p-2 rounded-xl text-blue-600">📄</span>
                {isRtl ? 'فواتير العهدة' : 'Invoices & Custody'}
              </h1>
              <p className="text-gray-500 text-sm font-medium mr-10">
                {isAdmin && (isRtl ? 'إدارة واعتماد الفواتير المرفوعة من المشاريع' : 'Manage and approve invoices uploaded from projects')}
                {isManager && (isRtl ? 'متابعة فواتيرك وفواتير فريق العمل' : 'Follow up on your invoices and your team\'s invoices')}
                {isEmployee && (isRtl ? 'استعراض وإدارة فواتيرك الشخصية' : 'Browse and manage your personal invoices')}
              </p>
            </div>
            
            {canAddInvoice && (
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isRtl ? 'إضافة فاتورة جديدة' : 'Add New Invoice'}
              </button>
            )}
          </div>
          
          {/* Enhanced Filters */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-1 lg:col-span-2">
                <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'المشروع' : 'Project'}</label>
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="">{isRtl ? 'جميع المشاريع' : 'All Projects'}</option>
                  {availableProjects.map(p => (
                    <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'التاريخ' : 'Date'}</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'رقم الفاتورة' : 'Invoice Number'}</label>
                <input
                  type="text"
                  placeholder={isRtl ? 'بحث...' : 'Search...'}
                  value={invoiceNumberFilter}
                  onChange={(e) => setInvoiceNumberFilter(e.target.value)}
                  className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'الحالة' : 'Status'}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="all">{isRtl ? 'الكل' : 'All'}</option>
                  <option value="pending">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                  <option value="approved_by_manager">{isRtl ? 'معتمدة (أولي)' : 'Approved (Initial)'}</option>
                  <option value="approved_final">{isRtl ? 'معتمدة (نهائي)' : 'Approved (Final)'}</option>
                  <option value="cancelled">{isRtl ? 'ملغاة' : 'Cancelled'}</option>
                  <option value="rejected">{isRtl ? 'مرفوضة' : 'Rejected'}</option>
                </select>
              </div>
              
              <div className="flex items-end gap-2 lg:col-span-1">
                <button
                  onClick={fetchInvoices}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-sm font-bold shadow-sm transition-all"
                >
                  {isRtl ? 'بحث' : 'Search'}
                </button>
                <button
                  onClick={handleResetFilters}
                  className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-all shadow-sm"
                  title={isRtl ? 'إعادة تعيين' : 'Reset'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center"><div className="animate-spin h-8 w-8 mx-auto border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">{isRtl ? 'لا توجد فواتير' : 'No invoices found'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map(monthYear => (
              <div key={monthYear} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex justify-between items-center">
                  <span className="text-white font-bold">📅 {getMonthName(monthYear)}</span>
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {groupedInvoices[monthYear].length} {isRtl ? 'فاتورة' : 'invoices'}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'رقم الفاتورة' : 'Invoice Number'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'المشروع' : 'Project'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'التاريخ' : 'Date'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'المبلغ' : 'Amount'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'الوصف' : 'Description'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'المرفوعة من' : 'Uploaded By'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'المراجعة والاعتماد' : 'Review & Approval'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'الحالة' : 'Status'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'الإجراءات' : 'Actions'}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {groupedInvoices[monthYear].map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-sm">
                              #{invoice.invoice_number}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm text-xs">
                              {invoice.project ? translateBrandingText(invoice.project, isRtl) : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm text-xs">
                              {formatDate(invoice.invoice_date || invoice.created_at)}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm font-bold text-green-600">{invoice.amount?.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 max-w-[120px] truncate">{invoice.description}</td>
                          <td className="px-3 py-2 text-sm text-gray-600">{invoice.uploaded_by_name ? translateBrandingText(invoice.uploaded_by_name, isRtl) : "-"}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col gap-2">
                              {invoice.reviewed_by_manager_name && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">
                                  <span className="text-base">📋</span>
                                  <span>{isRtl ? 'مراجعة أولية: ' : 'Initial Review: '}{translateBrandingText(invoice.reviewed_by_manager_name, isRtl)}</span>
                                </div>
                              )}
                              {invoice.final_approved_by_name && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm">
                                  <span className="text-base">✅</span>
                                  <span>{isRtl ? 'مراجعة نهائية: ' : 'Final Review: '}{translateBrandingText(invoice.final_approved_by_name, isRtl)}</span>
                                </div>
                              )}
                              {invoice.rejected_by_name && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-bold shadow-sm">
                                  <span className="text-base">❌</span>
                                  <span>{isRtl ? 'رفض: ' : 'Rejected by: '}{invoice.rejected_by_name}</span>
                                </div>
                              )}
                              {!invoice.reviewed_by_manager_name && !invoice.final_approved_by_name && !invoice.rejected_by_name && (
                                <span className="text-gray-400 font-bold mr-4">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">{getStatusBadge(invoice.status, invoice)}</td>
                          <td className="px-3 py-2 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                  <MoreVertical className="w-5 h-5 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl border border-gray-100 rounded-xl p-1">
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedInvoice(invoice); setShowViewModal(true); }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 text-gray-500" /> {isRtl ? 'عرض التفاصيل' : 'View Details'}
                                </DropdownMenuItem>
                                
                                {canEditInvoice(invoice) && (
                                  <DropdownMenuItem 
                                    onClick={() => openEditModal(invoice)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 text-gray-500" /> {isRtl ? 'تعديل البيانات' : 'Edit Data'}
                                  </DropdownMenuItem>
                                )}
                                
                                {canApproveInvoice(invoice) && (
                                  <>
                                    <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                    <DropdownMenuItem 
                                      onClick={() => handleApprove(invoice.id)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      {(() => {
                                        const isFinalApproval =
                                          (isAdmin && (invoice.status === 'approved_by_manager' || invoice.status === 'rejected')) ||
                                          (!isAdmin && invoice.status === 'approved_by_manager' && hasFinalReviewDelegation(invoice));
                                        return isFinalApproval ? (isRtl ? 'اعتماد نهائي' : 'Final Approval') : (isRtl ? 'اعتماد أولى' : 'Initial Approval');
                                      })()}
                                    </DropdownMenuItem>
                                    
                                    <DropdownMenuItem 
                                      onClick={() => handleReject(invoice.id)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                                    >
                                      <XCircle className="w-4 h-4 text-orange-600" /> {isRtl ? 'رفض الفاتورة' : 'Reject Invoice'}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {canCancelInvoice(invoice) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCancel(invoice.id)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  >
                                    <RotateCcw className="w-4 h-4 text-gray-500" /> {isRtl ? 'إلغاء الاعتماد' : 'Cancel Approval'}
                                  </DropdownMenuItem>
                                )}
                                
                                {canDeleteInvoice(invoice) && (
                                  <>
                                    <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(invoice.id)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" /> {isRtl ? 'حذف الفاتورة' : 'Delete Invoice'}
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
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalCount}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleLimitChange}
                  itemLabel={isRtl ? "فاتورة" : "Invoice"}
                />
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">📄 {isRtl ? 'رفع فاتورة جديدة' : 'Upload New Invoice'}</h2>
                <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'رقم الفاتورة *' : 'Invoice Number *'}</label>
                    <input type="text" required value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'تاريخ الفاتورة *' : 'Invoice Date *'}</label>
                    <input type="date" required value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المبلغ بالريال *' : 'Amount in SAR *'}</label>
                  <input type="number" required step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الوصف *' : 'Description *'}</label>
                  <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المشروع *' : 'Project *'}</label>
                  <select required value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm min-h-[40px]">
                    <option value="">{isRtl ? 'اختر المشروع' : 'Select Project'}</option>
                    {availableProjects.map(p => (<option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'صورة الفاتورة' : 'Invoice Image'}</label>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt="" className="w-16 h-16 object-cover rounded border" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">{isRtl ? 'إرسال' : 'Submit'}</button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">✏️ تعديل الفاتورة</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">رقم الفاتورة *</label>
                    <input type="text" required value={formData.invoice_number} onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">تاريخ الفاتورة *</label>
                    <input type="date" required value={formData.invoice_date} onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">المبلغ (ريال) *</label>
                  <input type="number" required step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">الوصف *</label>
                  <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">صور الفاتورة</label>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="w-full border rounded-lg px-3 py-2 text-sm" />
                  {formData.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt="" className="w-16 h-16 object-cover rounded border" />
                          <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-medium">حفظ</button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm">إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-lg font-bold">📄 تفاصيل الفاتورة</h2>
                <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">رقم الفاتورة</p><p className="font-bold">{selectedInvoice.invoice_number}</p></div>
                  <div><p className="text-sm text-gray-500">المبلغ</p><p className="font-bold text-green-600">{selectedInvoice.amount?.toLocaleString()} ر.س</p></div>
                  <div><p className="text-sm text-gray-500">التاريخ</p><p>{formatDate(selectedInvoice.invoice_date || selectedInvoice.created_at)}</p></div>
                  <div><p className="text-sm text-gray-500">الحالة</p>{getStatusBadge(selectedInvoice.status, selectedInvoice)}</div>
                  <div><p className="text-sm text-gray-500">{isRtl ? 'المرفوعة من' : 'Uploaded By'}</p><p>{selectedInvoice.uploaded_by_name ? translateBrandingText(selectedInvoice.uploaded_by_name, isRtl) : "-"}</p></div>
                </div>
                
                {/* سلسلة المراجعة والاعتماد */}
                {(selectedInvoice.reviewed_by_manager_name || selectedInvoice.reviewed_by_admin_name || selectedInvoice.rejected_by_name) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-bold text-gray-700 mb-3">📋 سلسلة المراجعة والاعتماد:</p>
                    <div className="space-y-2">
                      {selectedInvoice.reviewed_by_manager_name && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                          <span className="text-blue-700 font-medium">{isRtl ? 'مراجعة أولى:' : 'Initial Review:'}</span>
                          <span>{translateBrandingText(selectedInvoice.reviewed_by_manager_name, isRtl)}</span>
                        </div>
                      )}
                      {selectedInvoice.reviewed_by_admin_name && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          <span className="text-green-700 font-medium">{isRtl ? 'اعتماد نهائي:' : 'Final Approval:'}</span>
                          <span>{translateBrandingText(selectedInvoice.reviewed_by_admin_name, isRtl)}</span>
                        </div>
                      )}
                      {selectedInvoice.rejected_by_name && (
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                          <span className="text-red-700 font-medium">تم الرفض بواسطة:</span>
                          <span>{selectedInvoice.rejected_by_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div><p className="text-sm text-gray-500">المشروع</p><p>{selectedInvoice.project ? translateBrandingText(selectedInvoice.project, isRtl) : '-'}</p></div>
                <div><p className="text-sm text-gray-500">الوصف</p><p className="bg-gray-50 p-3 rounded">{selectedInvoice.description}</p></div>
                {(selectedInvoice.images?.length > 0 || selectedInvoice.image) && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">صور الفاتورة</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2">
                      {(selectedInvoice.images || [selectedInvoice.image]).filter(Boolean).map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt="" className="w-full h-32 object-cover rounded border" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                            <button 
                              onClick={() => setFullViewImage(img)} 
                              className="p-2 bg-white rounded-full hover:bg-gray-100 mx-1"
                              title="عرض الصورة"
                            >
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button 
                              onClick={() => handleDownload(selectedInvoice, img)} 
                              className="p-2 bg-white rounded-full hover:bg-gray-100 mx-1"
                              title="تحميل"
                            >
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <img src={fullViewImage} alt="صورة مكبرة" className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <a href={fullViewImage} download="فاتورة.jpg" onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  تحميل
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Invoices;
