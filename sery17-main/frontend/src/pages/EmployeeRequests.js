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
import { MoreVertical, Eye, Edit, CheckCircle, XCircle, Trash2, RotateCcw, Clock, FileCheck, ShieldCheck, Download } from "lucide-react";
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const REQUEST_TYPES = {
  custody: 'إقرار استلام عهدة',
  vacation: 'طلب إجازة',
  clearance: 'نموذج إخلاء طرف',
  family_visit: 'نموذج إقرار زيارة عائلة',
  delegation: 'نموذج الانتداب',
  employee_request: 'نموذج طلب موظف',
  guarantee: 'نموذج كفالة غرامية سلفة',
  work_start: 'نموذج مباشرة عمل',
  advance_request: 'طلب سلفة (مالي)'
};

const getRequestTypeName = (type, isRtl) => {
  const englishNames = {
    custody: 'Custody Receipt Acknowledgement',
    vacation: 'Vacation Request',
    clearance: 'Clearance Form',
    family_visit: 'Family Visit Acknowledgement',
    delegation: 'Delegation Form',
    employee_request: 'Employee Request Form',
    guarantee: 'Advance Financial Guarantee',
    work_start: 'Work Commencement Form',
    advance_request: 'Advance Request (Financial)'
  };
  return isRtl ? (REQUEST_TYPES[type] || type) : (englishNames[type] || type);
};

const MONTHS_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function EmployeeRequests({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const platformName = localStorage.getItem('platformName') || 'بيت الخبرة';
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [lockType, setLockType] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState(''); // فلتر المشاريع
  
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
    request_type: '',
    reason: '',
    images: [],
    project: '',
    notes: '',
    amount: '',
    monthly_deduction: ''
  });
  
  // حالة عرض الصورة المكبرة
  const [fullViewImage, setFullViewImage] = useState(null);

  const isAdmin = user.role === 'admin';
  const isManager = user.has_sub_users === true && user.role !== 'admin';
  
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
    fetchTemplates();
    fetchRequests();
  }, []);

  // تطبيق الفلاتر على البيانات المحلية
  const applyFilters = () => {
    let result = [...requests];
    
    // فلترة حسب النوع
    if (typeFilter) {
      result = result.filter(req => req.request_type === typeFilter);
    }
    
    // فلترة حسب الحالة
    if (statusFilter !== 'all') {
      result = result.filter(req => req.status === statusFilter);
    }
    
    // فلترة حسب التاريخ
    if (dateFilter) {
      result = result.filter(req => {
        const reqDate = req.created_at ? req.created_at.split('T')[0] : '';
        return reqDate === dateFilter;
      });
    }
    
    // فلترة حسب المشروع
    if (projectFilter) {
      result = result.filter(req => req.project === projectFilter);
    }
    
    setFilteredRequests(result);
  };

  // بحث وعرض
  const handleApplyFilters = () => {
    applyFilters();
  };

  // إعادة تعيين الفلاتر
  const handleResetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('');
    setDateFilter('');
    setProjectFilter('');
    setFilteredRequests(requests);
  };

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API}/request-templates`);
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      // setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter) params.append('request_type', typeFilter);
      if (dateFilter) params.append('date', dateFilter);
      params.append('page', currentPage);
      params.append('limit', itemsPerPage);
      
      const response = await axios.get(`${API}/employee-requests?${params}`);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setRequests(data);
        setFilteredRequests(data);
        setTotalCount(data.length);
        setTotalPages(1);
      } else {
        setRequests(data.requests || []);
        setFilteredRequests(data.requests || []);
        setTotalCount(data.total_count || 0);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      toast.error('فشل في تحميل الطلبات');
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

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter, dateFilter, currentPage, itemsPerPage]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
    toast.info('⏳ جاري ضغط الصور...', { autoClose: 1500 });
    for (const file of files) {
      try {
        const compressed = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, reader.result]
          }));
        };
        reader.readAsDataURL(compressed);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, reader.result]
          }));
        };
        reader.readAsDataURL(file);
      }
    }
    toast.success(`✅ تم ضغط ${files.length > 1 ? files.length + ' صور' : 'الصورة'} تلقائياً إلى 100KB`, { autoClose: 2500 });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setLockType(false);
    setFormData({
      request_type: '',
      reason: '',
      images: [],
      project: availableProjects[0] || '',
      notes: '',
      amount: '',
      monthly_deduction: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // حفظ البيانات فوراً ورفع الصور في الخلفية
    const dataToSend = { ...formData };
    const pendingImages = formData.images;

    // معالجة الحقول الرقمية لتجنب أخطاء التحقق من النوع في الخلفية
    if (dataToSend.amount === "" || dataToSend.amount === null || dataToSend.amount === undefined) {
      dataToSend.amount = null;
    } else {
      dataToSend.amount = parseFloat(dataToSend.amount);
    }

    if (dataToSend.monthly_deduction === "" || dataToSend.monthly_deduction === null || dataToSend.monthly_deduction === undefined) {
      dataToSend.monthly_deduction = null;
    } else {
      dataToSend.monthly_deduction = parseFloat(dataToSend.monthly_deduction);
    }
    
    try {
      // إرسال البيانات بدون الصور للحفظ السريع
      const response = await axios.post(`${API}/employee-requests`, { ...dataToSend, images: [] });
      const savedId = response.data.id;
      toast.success('✅ تم رفع الطلب بنجاح');
      
      setShowAddModal(false);
      resetForm();
      fetchRequests();
      
      // رفع الصور في الخلفية إذا وجدت
      if (pendingImages.length > 0) {
        toast.info(`جاري رفع ${pendingImages.length} صورة في الخلفية...`, { autoClose: 2000 });
        
        (async () => {
          try {
            await axios.put(`${API}/employee-requests/${savedId}`, { images: pendingImages });
            toast.success(`✅ تم رفع الصور بنجاح`, { autoClose: 2000 });
            fetchRequests();
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
    const existingImages = selectedRequest.images || [];
    const allImages = formData.images;
    const newImages = allImages.filter(img => !existingImages.includes(img));

    // معالجة الحقول الرقمية لتجنب أخطاء التحقق من النوع في الخلفية
    let cleanedAmount = null;
    if (formData.amount !== "" && formData.amount !== null && formData.amount !== undefined) {
      cleanedAmount = parseFloat(formData.amount);
    }

    let cleanedMonthlyDeduction = null;
    if (formData.monthly_deduction !== "" && formData.monthly_deduction !== null && formData.monthly_deduction !== undefined) {
      cleanedMonthlyDeduction = parseFloat(formData.monthly_deduction);
    }
    
    try {
      // إرسال البيانات مع الصور الموجودة فقط ومعالجة الحقول الرقمية
      await axios.put(`${API}/employee-requests/${selectedRequest.id}`, {
        reason: formData.reason,
        images: existingImages,
        notes: formData.notes,
        amount: cleanedAmount,
        monthly_deduction: cleanedMonthlyDeduction
      });
      toast.success('✅ تم تعديل الطلب بنجاح');
      
      setShowEditModal(false);
      fetchRequests();
      
      // رفع الصور الجديدة في الخلفية إذا وجدت
      if (newImages.length > 0) {
        toast.info(`جاري رفع ${newImages.length} صورة جديدة...`, { autoClose: 2000 });
        
        (async () => {
          try {
            await axios.put(`${API}/employee-requests/${selectedRequest.id}`, { images: allImages });
            toast.success(`✅ تم رفع الصور بنجاح`, { autoClose: 2000 });
            fetchRequests();
          } catch (err) {
            toast.error('فشل في رفع بعض الصور');
          }
        })();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'حدث خطأ');
    }
  };

  const openEditModal = (request) => {
    setSelectedRequest(request);
    setFormData({
      request_type: request.request_type,
      reason: request.reason,
      images: request.images || [],
      project: request.project,
      notes: request.notes || '',
      amount: request.amount || '',
      monthly_deduction: request.monthly_deduction || ''
    });
    setShowEditModal(true);
  };

  const handleApprove = async (requestId) => {
    try {
      await axios.put(`${API}/employee-requests/${requestId}/approve`);
      toast.success(isRtl ? 'تم اعتماد الطلب' : 'Request approved successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const handleReject = async (requestId) => {
    if (!window.confirm(isRtl ? '⚠️ هل أنت متأكد من إلغاء اعتماد هذا الطلب؟\nسيبقى الطلب موجوداً ويمكن إعادة اعتماده.' : '⚠️ Are you sure you want to cancel approval for this request?\nThe request will remain and can be re-approved.')) {
      return;
    }
    const notes = prompt(isRtl ? 'سبب الإلغاء (مطلوب):' : 'Reason for cancellation (required):');
    if (!notes) {
      toast.error(isRtl ? 'يجب كتابة سبب الإلغاء' : 'Cancellation reason is required');
      return;
    }
    try {
      await axios.put(`${API}/employee-requests/${requestId}/reject?notes=${encodeURIComponent(notes)}`);
      toast.success(isRtl ? 'تم إلغاء اعتماد الطلب' : 'Request approval cancelled successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const handleCancel = async (requestId) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من إلغاء هذا الطلب وإعادته لحالة قيد المراجعة؟' : 'Are you sure you want to cancel this request and return it to under review?')) return;
    const notes = prompt(isRtl ? 'سبب الإلغاء (اختياري):' : 'Reason for cancellation (optional):');
    try {
      await axios.put(`${API}/employee-requests/${requestId}/cancel?notes=${encodeURIComponent(notes || '')}`);
      toast.success(isRtl ? 'تم إلغاء الطلب وإعادته لحالة قيد المراجعة' : 'Request cancelled and returned to under review');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const handleMarkReviewing = async (requestId) => {
    try {
      await axios.put(`${API}/employee-requests/${requestId}/reviewing`);
      toast.success(isRtl ? 'الطلب الآن قيد المراجعة' : 'Request is now under review');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const handlePrint = (request) => {
    const printWindow = window.open('', '_blank');
    const typeLabel = getRequestTypeName(request.request_type, isRtl);
    const platformName = localStorage.getItem('platformName') || 'بيت الخبرة';
    const managerName = request.reviewed_by_manager_name || 'المدير المباشر';
    const adminName = request.approved_by_name || platformName;
    const isAdvance = request.request_type === 'advance_request' || request.request_type === 'advance';

    const content = `
      <html dir="rtl">
        <head>
          <title>تفاصيل الطلب - ${request.id}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .info-item { border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .label { font-size: 12px; color: #6b7280; margin-bottom: 5px; font-weight: bold; }
            .value { font-size: 16px; font-weight: bold; }
            .full-width { grid-column: span 2; }
            .reason-box { background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; min-height: 100px; border-radius: 8px; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
            .signature-box { border-top: 2px solid #333; text-align: center; padding-top: 15px; font-weight: bold; }
            .signature-name { font-size: 14px; color: #666; margin-top: 5px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${platformName} - طلبات الموظفين</h1>
            <p>رقم الطلب: ${request.id}</p>
          </div>
          
          <div class="info-grid">
            <div class="info-item"><div class="label">نوع الطلب</div><div class="value">${typeLabel}</div></div>
            <div class="info-item"><div class="label">التاريخ</div><div class="value">${formatDate(request.created_at)}</div></div>
            <div class="info-item"><div class="label">صاحب الطلب</div><div class="value">${request.uploaded_by_name}</div></div>
            <div class="info-item"><div class="label">المشروع</div><div class="value">${translateBrandingText(request.project, isRtl)}</div></div>
            
            ${isAdvance ? `
              <div class="info-item"><div class="label">مبلغ السلفة</div><div class="value">${request.advance_amount || request.amount || 0} ر.س</div></div>
              <div class="info-item"><div class="label">الخصم الشهري</div><div class="value">${request.monthly_deduction || 0} ر.س</div></div>
            ` : ''}
            
            <div class="info-item full-width"><div class="label">السبب / الوصف</div><div class="value reason-box">${request.reason}</div></div>
            
            ${request.notes ? `<div class="info-item full-width"><div class="label">ملاحظات إضافية</div><div class="value">${request.notes}</div></div>` : ''}
          </div>

          <div class="info-grid">
            <div class="info-item"><div class="label">الحالة الحالية</div><div class="value">${getStatusBadge(request.status).props.children[0].props.children[1]}</div></div>
            <div class="info-item"><div class="label">المراجعة والاعتماد</div><div class="value">
              ${request.approved_by_name ? `اعتماد نهائي (${platformName}): ${request.approved_by_name}` : 
                request.reviewed_by_manager_name ? `مراجعة أولية (المدير): ${request.reviewed_by_manager_name}` : 
                'قيد المراجعة'
              }
            </div></div>
          </div>

          <div class="signatures">
            <div class="signature-box">
              توقيع صاحب الطلب
              <div class="signature-name">${request.uploaded_by_name}</div>
            </div>
            <div class="signature-box">
              توقيع ${request.reviewed_by_manager_name ? 'المدير المباشر' : platformName}
              <div class="signature-name">${request.reviewed_by_manager_name || adminName}</div>
            </div>
          </div>

          <div class="no-print" style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">طباعة المستند</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm(isRtl ? '⚠️ هل أنت متأكد من حذف هذا الطلب نهائياً؟\n\n⛔ تحذير: لا يمكن التراجع عن هذا الإجراء!' : '⚠️ Are you sure you want to delete this request permanently?\n\n⛔ Warning: This action cannot be undone!')) return;
    try {
      await axios.delete(`${API}/employee-requests/${requestId}`);
      toast.success(isRtl ? 'تم حذف الطلب' : 'Request deleted successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.detail || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    }
  };

  const hasEmployeeRequestFinalDelegation = (request) => {
    if (isAdmin) return true;
    const perms = user.permissions || [];
    const pp = user.project_permissions || {};
    const projectPerms = (request?.project && pp[request.project]) || [];
    return perms.includes('review_employee_requests') ||
           perms.includes('view_all_employee_requests') ||
           projectPerms.includes('review_employee_requests') ||
           projectPerms.includes('view_all_employee_requests');
  };

  const handleSignedUpload = async (requestId, file) => {
    toast.info('جاري الرفع...');
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressed = await imageCompression(file, options).catch(() => file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await axios.put(`${API}/employee-requests/${requestId}/upload-signed`, {
            signed_document: reader.result
          });
          toast.success('تم الإرسال بنجاح');
          fetchRequests();
        } catch (error) {
          console.error('Upload error:', error);
          toast.error(error.response?.data?.detail || 'فشل في رفع المستند');
        }
      };
      reader.onerror = () => {
        toast.error('خطأ في قراءة الملف');
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      toast.error('فشل في معالجة الملف');
    }
  };

  const canApproveRequest = (request) => {
    // الأدمن (بيت الخبرة) يعتمد من أي حالة
    if (isAdmin) {
      return request.status === 'pending' || request.status === 'approved_by_manager' || request.status === 'rejected' || request.status === 'reviewing';
    }
    
    // منع أي مستخدم من اعتماد طلبه الشخصي (إلا إذا كان أدمن)
    if (request.uploaded_by === user.id && !isAdmin) return false;

    // المفوض بالاعتماد النهائي (نيابة عن بيت الخبرة)
    if (request.status === 'approved_by_manager' && hasEmployeeRequestFinalDelegation(request)) {
      // فصل المهام: من اعتمد أولياً لا يعتمد نهائياً نفس الطلب
      if (request.reviewed_by_manager === user.id) return false;
      return true;
    }
    
    // مدير المشروع (المستوى 2) يراجع طلبات موظفيه
    if (isManager && request.status === 'pending') {
      // السلف تعتمد مباشرة من بيت الخبرة فقط
      if (request.request_type === 'advance_request' || request.request_type === 'advance') return false;
      return true;
    }
    
    return false;
  };

  const canCancelRequest = (request) => {
    // فقط الأدمن (بيت الخبرة) يمكنه إلغاء الاعتماد
    if (isAdmin && (request.status === 'approved_by_manager' || request.status === 'approved_by_admin')) {
      return true;
    }
    return false;
  };

  const canRejectRequest = (request) => {
    // فقط الأدمن (بيت الخبرة) يمكنه رفض الطلبات
    if (isAdmin) {
      return request.status === 'pending' || request.status === 'approved_by_manager' || request.status === 'reviewing';
    }
    return false;
  };

  const canEditRequest = (request) => {
    return (request.uploaded_by === user.id || isAdmin) && request.status === 'pending';
  };

  const canDeleteRequest = (request) => {
    // الأدمن، أو صاحب الطلب، أو مدير المشروع (لطلبات موظفيه المعلقة)
    const isUploader = request.uploaded_by === user.id;
    const isManager = user.level === 2 || user.has_sub_users || user.can_create_subusers;
    return isAdmin || (isUploader && request.status === 'pending') || (isManager && request.status === 'pending');
  };

  const getStatusBadge = (status, request) => {
    const badges = {
      pending: { 
        text: isRtl ? 'قيد المراجعة' : 'Under Review', 
        color: 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-sm border-b-2 border-slate-900', 
        icon: <Clock className="w-3.5 h-3.5" />
      },
      approved_by_manager: { 
        text: isRtl ? 'موافقة أولية' : 'Initial Approval', 
        color: 'bg-gradient-to-r from-blue-700 to-blue-800 text-white border-b-2 border-blue-950', 
        icon: <FileCheck className="w-3.5 h-3.5" />
      },
      approved_by_admin: { 
        text: isRtl ? 'تمت الموافقة' : 'Approved', 
        color: 'bg-gradient-to-r from-indigo-800 to-indigo-900 text-white border-b-2 border-indigo-950', 
        icon: <ShieldCheck className="w-4 h-4" />
      },
      cancelled: { 
        text: isRtl ? 'تم إلغاء الاعتماد' : 'Approval Cancelled', 
        color: 'bg-gradient-to-r from-slate-500 to-slate-600 text-white border-b-2 border-slate-800 text-base py-2', 
        icon: <RotateCcw className="w-4 h-4" />
      },
      rejected: { 
        text: isRtl ? 'تم الرفض' : 'Rejected', 
        color: 'bg-gradient-to-r from-rose-700 to-rose-800 text-white border-b-2 border-rose-950 shadow-sm', 
        icon: <XCircle className="w-4 h-4" />
      },
      reviewing: {
        text: isRtl ? 'جاري المراجعة' : 'Reviewing',
        color: 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-b-2 border-amber-900 shadow-sm',
        icon: <Clock className="w-3.5 h-3.5" />
      }
    };
    const badge = badges[status] || { text: status, color: 'bg-slate-600 text-white text-sm', icon: null };
    const platformName = localStorage.getItem('platformName') || 'بيت الخبرة';
    
    return (
      <div className="flex flex-col items-center gap-2">
        <span className={`inline-flex items-center justify-center gap-2 px-5 py-1.5 rounded-xl font-black shadow-lg transform hover:scale-105 transition-all whitespace-nowrap min-w-[130px] ${badge.color}`}>
          {badge.icon}
          {badge.text}
          {(status === 'pending' || status === 'reviewing') && (
            <span className="flex h-2 w-2 relative ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
          )}
        </span>

        <div className="w-full space-y-1 mt-1">
          {status === 'approved_by_manager' && request?.reviewed_by_manager_name && (
            <div className="text-blue-800 text-[10px] bg-blue-50/50 px-2 py-1 rounded-lg border border-blue-200 w-full text-center font-bold">
              <span className="text-blue-500">{isRtl ? 'مدير المشروع:' : 'Project Manager:'}</span> {request.reviewed_by_manager_name}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getApprovalProcedures = (request) => {
    const platformName = localStorage.getItem('platformName') || 'بيت الخبرة';
    
    if (!request?.signed_document) {
      return <span className="text-gray-300 font-bold text-xs">{isRtl ? 'بانتظار التوقيع' : 'Awaiting Signature'}</span>;
    }

    return (
      <div className="flex flex-col items-center gap-2 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 shadow-sm min-w-[150px]">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-[12px] font-black shadow-sm w-full justify-center">
          <FileCheck className="w-4 h-4" /> {isRtl ? 'تم توقيع الموظف' : 'Employee Signed'}
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
        </span>
        <button 
          onClick={() => setFullViewImage(request.signed_document)}
          className="flex items-center justify-center gap-2 w-full text-[12px] bg-white border-2 border-emerald-600 text-emerald-700 px-4 py-1.5 rounded-lg hover:bg-emerald-600 hover:text-white font-black transition-all shadow-sm"
        >
          <Eye className="w-4 h-4" /> {isRtl ? 'عرض التوقيع' : 'View Signature'}
        </button>
        {request.admin_verified_at && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-900 text-[11px] font-black border border-indigo-200 w-full justify-center">
            <ShieldCheck className="w-3 h-3" /> {isRtl ? `تم التأكيد من ${platformName}` : `Confirmed by ${platformName}`}
          </span>
        )}
      </div>
    );
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
  const groupedRequests = filteredRequests.reduce((groups, request) => {
    const date = new Date(request.created_at);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[monthYear]) groups[monthYear] = [];
    groups[monthYear].push(request);
    return groups;
  }, {});

  const sortedMonths = Object.keys(groupedRequests).sort((a, b) => b.localeCompare(a));

  const getMonthName = (monthYear) => {
    const [year, month] = monthYear.split('-');
    return `${MONTHS_NAMES[parseInt(month) - 1]} ${year}`;
  };

  const downloadTemplate = (template) => {
    window.open(`${API}/request-templates/${template.id}/download`, '_blank');
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-4">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span className="bg-blue-50 p-2 rounded-xl text-blue-600">📋</span>
                {isRtl ? 'طلبات الموظفين' : 'Employee Requests'}
              </h1>
              <p className="text-gray-500 text-sm font-medium mr-10">
                {isAdmin && (isRtl ? 'مراجعة واعتماد طلبات الموظفين المركزية' : 'Review and approve central employee requests')}
                {isManager && (isRtl ? 'إدارة طلبات الموظفين التابعين لمشاريعك' : 'Manage employee requests for your projects')}
                {!isAdmin && !isManager && (isRtl ? 'استعراض ومتابعة طلباتك الإدارية' : 'Browse and track your administrative requests')}
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTemplatesModal(true)}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {isRtl ? 'النماذج الرسمية' : 'Official Templates'}
              </button>
              <button
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {isRtl ? 'إضافة طلب جديد' : 'Add New Request'}
              </button>
              <button
                onClick={() => { 
                  resetForm(); 
                  setFormData(prev => ({...prev, request_type: 'advance_request'})); 
                  setLockType(true);
                  setShowAddModal(true); 
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <span className="text-lg">💰</span>
                {isRtl ? 'طلب سلفة' : 'Advance Request'}
              </button>
            </div>
          </div>
          
          {/* Enhanced Filters */}
          <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'نوع الطلب' : 'Request Type'}</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="">{isRtl ? 'جميع الأنواع' : 'All Types'}</option>
                  {Object.keys(REQUEST_TYPES).map((key) => (
                    <option key={key} value={key}>{getRequestTypeName(key, isRtl)}</option>
                  ))}
                </select>
              </div>
              
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
                <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'الحالة' : 'Status'}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="all">{isRtl ? 'الكل' : 'All'}</option>
                  <option value="pending">{isRtl ? 'قيد المراجعة' : 'Under Review'}</option>
                  <option value="approved_by_manager">{isRtl ? 'معتمد (أولي)' : 'Approved (Initial)'}</option>
                  <option value="approved_by_admin">{isRtl ? 'معتمد (نهائي)' : 'Approved (Final)'}</option>
                  <option value="cancelled">{isRtl ? 'ملغى' : 'Cancelled'}</option>
                  <option value="rejected">{isRtl ? 'مرفوض' : 'Rejected'}</option>
                </select>
              </div>
              
              <div className="flex items-end gap-2">
                <button
                  onClick={handleApplyFilters}
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
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">{isRtl ? 'لا توجد طلبات' : 'No requests found'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedMonths.map(monthYear => (
              <div key={monthYear} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex justify-between items-center">
                  <span className="text-white font-bold">📅 {getMonthName(monthYear)}</span>
                  <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm">
                    {groupedRequests[monthYear].length} {isRtl ? 'طلب' : 'requests'}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-white">
                      <tr>
                        <th className="px-4 py-4 text-right">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'نوع الطلب' : 'Request Type'}
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
                            {isRtl ? 'السبب' : 'Reason'}
                          </span>
                        </th>
                        <th className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-black text-xs border border-slate-200 shadow-sm">
                            {isRtl ? 'صاحب الطلب' : 'Requested By'}
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
                      {groupedRequests[monthYear].map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">
                            <div className="flex flex-col gap-1 items-start">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200 shadow-sm text-xs">
                                {getRequestTypeName(request.request_type, isRtl)}
                              </span>
                              {(request.request_type === 'advance_request' || request.request_type === 'advance') && (
                                <div className="flex flex-col gap-0.5 text-[11px] font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shadow-sm mt-1">
                                  <span>{isRtl ? '💰 المبلغ: ' : '💰 Amount: '}{request.advance_amount || request.amount || 0}{isRtl ? ' ر.س' : ' SAR'}</span>
                                  <span>{isRtl ? '📉 الخصم: ' : '📉 Deduction: '}{request.monthly_deduction || 0}{isRtl ? ' ر.س/شهر' : ' SAR/month'}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-sm text-xs">
                              {request.project ? translateBrandingText(request.project, isRtl) : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-sm text-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 shadow-sm text-xs">
                              {formatDate(request.created_at)}
                            </span>
                          </td>

                          <td className="px-3 py-2 text-sm text-gray-600 text-center max-w-[150px] truncate">
                            {translateBrandingText(request.reason, isRtl)}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 text-center font-bold">
                            {translateBrandingText(request.uploaded_by_name, isRtl)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex flex-col gap-2 items-center">
                              {request.reviewed_by_manager_name && !(request.request_type === 'advance_request' || request.request_type === 'advance') && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-sm">
                                  <span className="text-base">📋</span>
                                  <span>{isRtl ? 'موافقة أولية: ' : 'Initial Approval: '}{translateBrandingText(request.reviewed_by_manager_name, isRtl)}</span>
                                </div>
                              )}
                              {request.approved_by_name && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm">
                                  <span className="text-base">✅</span>
                                  <span>
                                    {request.request_type === 'advance_request' || request.request_type === 'advance' 
                                      ? (isRtl ? `موافقة ${translateBrandingText(platformName, isRtl)}: ${translateBrandingText(request.approved_by_name, isRtl)}` : `${translateBrandingText(platformName, false)} Approval: ${translateBrandingText(request.approved_by_name, isRtl)}`) 
                                      : (isRtl ? `موافقة نهائية: ${translateBrandingText(request.approved_by_name, isRtl)}` : `Final Approval: ${translateBrandingText(request.approved_by_name, isRtl)}`)
                                    }
                                  </span>
                                </div>
                              )}
                              {request.rejected_by_name && (
                                <div className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-bold shadow-sm">
                                  <span className="text-base">❌</span>
                                  <span>
                                    {request.request_type === 'advance_request' || request.request_type === 'advance' 
                                      ? (isRtl ? `رفض ${translateBrandingText(platformName, isRtl)}: ${translateBrandingText(request.rejected_by_name, isRtl)}` : `${translateBrandingText(platformName, false)} Rejection: ${translateBrandingText(request.rejected_by_name, isRtl)}`) 
                                      : (isRtl ? `رفض: ${translateBrandingText(request.rejected_by_name, isRtl)}` : `Rejected by: ${translateBrandingText(request.rejected_by_name, isRtl)}`)
                                    }
                                  </span>
                                </div>
                              )}
                              {((request.request_type === 'advance_request' || request.request_type === 'advance') 
                                ? !request.approved_by_name && !request.rejected_by_name 
                                : !request.reviewed_by_manager_name && !request.approved_by_name && !request.rejected_by_name
                              ) && (
                                <span className="text-gray-400 font-bold">-</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-center">{getStatusBadge(request.status, request)}</td>
                          <td className="px-3 py-2 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                  <MoreVertical className="w-5 h-5 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl border border-gray-100 rounded-xl p-1">
                                <DropdownMenuItem 
                                  onClick={() => handlePrint(request)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                >
                                  <Download className="w-4 h-4 text-blue-500" /> {isRtl ? 'تحميل صفحة الطلب' : 'Download Request Page'}
                                </DropdownMenuItem>

                                 {request.status === 'approved_by_admin' && (request.request_type === 'advance_request' || request.request_type === 'advance') && (
                                  <DropdownMenuItem 
                                    onClick={() => document.getElementById(`signed-upload-${request.id}`).click()}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50 rounded-lg cursor-pointer font-bold"
                                  >
                                    <FileCheck className="w-4 h-4 text-green-600" /> {isRtl ? 'رفع النسخة الموقعة' : 'Upload Signed Copy'}
                                  </DropdownMenuItem>
                                )}

                                {request.signed_document && (
                                  <DropdownMenuItem 
                                    onClick={() => setFullViewImage(request.signed_document)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-lg cursor-pointer font-bold"
                                  >
                                    <Eye className="w-4 h-4 text-blue-600" /> {isRtl ? 'الاطلاع على النسخة الموقعة' : 'View Signed Copy'}
                                  </DropdownMenuItem>
                                )}

                                {isAdmin && request.signed_document && !request.admin_verified_at && (
                                  <DropdownMenuItem 
                                    onClick={async () => {
                                      if (!window.confirm(isRtl ? 'هل أنت متأكد من تأكيد استلام المستند وإغلاق الطلب؟' : 'Are you sure you want to confirm receipt of the document and close the request?')) return;
                                      try {
                                        await axios.put(`${API}/employee-requests/${request.id}/verify`);
                                        toast.success(isRtl ? 'تم تأكيد الاستلام بنجاح' : 'Receipt confirmed successfully');
                                        fetchRequests();
                                      } catch (error) {
                                        toast.error(isRtl ? 'فشل في التأكيد' : 'Confirmation failed');
                                      }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer font-bold"
                                  >
                                    <CheckCircle className="w-4 h-4 text-indigo-600" /> {isRtl ? 'تأكيد الاستلام والإغلاق' : 'Confirm Receipt & Close'}
                                  </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem 
                                  onClick={() => { setSelectedRequest(request); setShowViewModal(true); }}
                                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                >
                                  <Eye className="w-4 h-4 text-gray-500" /> {isRtl ? 'عرض التفاصيل' : 'View Details'}
                                </DropdownMenuItem>
                                
                                {canEditRequest(request) && (
                                  <DropdownMenuItem 
                                    onClick={() => openEditModal(request)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 text-gray-500" /> {isRtl ? 'تعديل البيانات' : 'Edit Data'}
                                  </DropdownMenuItem>
                                )}
                                
                                {canApproveRequest(request) && (
                                  <>
                                    <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                      <DropdownMenuItem 
                                        onClick={() => handleApprove(request.id)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                                      >
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        {(() => {
                                          if (request.request_type === 'advance_request' || request.request_type === 'advance') {
                                            return isRtl ? 'تمت الموافقة' : 'Approved';
                                          }
                                          const isFinalApproval =
                                            (isAdmin && (request.status === 'approved_by_manager' || request.status === 'rejected')) ||
                                            (!isAdmin && request.status === 'approved_by_manager' && hasEmployeeRequestFinalDelegation(request));
                                          return isFinalApproval ? (isRtl ? 'اعتماد نهائي' : 'Final Approval') : (isRtl ? 'اعتماد أولي' : 'Initial Approval');
                                        })()}
                                      </DropdownMenuItem>

                                    {isAdmin && request.status === 'pending' && (
                                      <DropdownMenuItem 
                                        onClick={() => handleMarkReviewing(request.id)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50 rounded-lg cursor-pointer font-bold"
                                      >
                                        <Clock className="w-4 h-4" /> {isRtl ? 'جاري المراجعة' : 'Under Review'}
                                      </DropdownMenuItem>
                                    )}
                                    
                                    <DropdownMenuItem 
                                      onClick={() => handleReject(request.id)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50 rounded-lg cursor-pointer font-bold"
                                    >
                                      <XCircle className="w-4 h-4 text-rose-600" />
                                      {request.request_type === 'advance_request' || request.request_type === 'advance' ? (isRtl ? 'تم الرفض' : 'Rejected') : (isRtl ? 'رفض الطلب' : 'Reject Request')}
                                    </DropdownMenuItem>
                                  </>
                                )}
                                
                                {canCancelRequest(request) && !canRejectRequest(request) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCancel(request.id)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer"
                                  >
                                    <RotateCcw className="w-4 h-4 text-gray-500" /> {isRtl ? 'إلغاء الاعتماد' : 'Cancel Approval'}
                                  </DropdownMenuItem>
                                )}
                                
                                {canDeleteRequest(request) && (
                                  <>
                                    <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                    <DropdownMenuItem 
                                      onClick={() => handleDelete(request.id)}
                                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" /> {isRtl ? 'حذف الطلب' : 'Delete Request'}
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Input مخفي لرفع التوقيع - يوضع خارج القائمة لضمان عدم حذفه من الـ DOM عند إغلاق القائمة */}
                            <input 
                              id={`signed-upload-${request.id}`}
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleSignedUpload(request.id, e.target.files[0]);
                                  e.target.value = ''; // لإتاحة رفع نفس الملف مرة أخرى إذا لزم الأمر
                                }
                              }}
                            />
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
                  itemLabel={t('common.request')}
                />
              </div>
            ))}
          </div>
        )}

        {/* Templates Modal */}
        {showTemplatesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">📄 نماذج الطلبات</h2>
                <button onClick={() => setShowTemplatesModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <p className="text-gray-600 text-sm mb-4">قم بتحميل النموذج المناسب، واملأه، ثم ارفعه مع طلبك</p>
              
              {/* زر إضافة نموذج جديد - للأدمن فقط */}
              {isAdmin && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-700 text-sm font-medium mb-2">إضافة نموذج جديد</p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    try {
                      await axios.post(`${API}/request-templates`, formData);
                      toast.success('تم إضافة النموذج بنجاح');
                      fetchTemplates();
                      e.target.reset();
                    } catch (err) {
                      toast.error('حدث خطأ في إضافة النموذج');
                    }
                  }} className="flex flex-col gap-2">
                    <input type="text" name="name" placeholder="اسم النموذج" required className="border rounded px-3 py-2 text-sm" />
                    <input type="file" name="file" accept=".pdf,.doc,.docx" required className="border rounded px-3 py-2 text-sm" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">إضافة</button>
                  </form>
                </div>
              )}
              
              <div className="space-y-2">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <span className="text-sm font-medium">{template.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadTemplate(template)}
                        className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-xs font-medium"
                      >
                        تحميل
                      </button>
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            if (!window.confirm('هل أنت متأكد من حذف هذا النموذج؟')) return;
                            try {
                              await axios.delete(`${API}/request-templates/${template.id}`);
                              toast.success('تم حذف النموذج');
                              fetchTemplates();
                            } catch (err) {
                              toast.error(err.response?.data?.detail || 'حدث خطأ في حذف النموذج');
                            }
                          }}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-medium"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">📋 {lockType ? (isRtl ? 'طلب سلفة مالية جديدة' : 'New Financial Advance Request') : (isRtl ? 'رفع طلب جديد' : 'Upload New Request')}</h2>
                <button onClick={() => { setShowAddModal(false); setLockType(false); }} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'نوع الطلب *' : 'Request Type *'}</label>
                  <select 
                    required 
                    disabled={lockType}
                    value={formData.request_type} 
                    onChange={(e) => setFormData({ ...formData, request_type: e.target.value })} 
                    className={`w-full border rounded-lg px-3 py-2 text-sm ${lockType ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">{isRtl ? 'اختر نوع الطلب' : 'Select request type'}</option>
                    {Object.keys(REQUEST_TYPES).map((key) => (
                      <option key={key} value={key}>{getRequestTypeName(key, isRtl)}</option>
                    ))}
                  </select>
                  {lockType && <p className="text-[10px] text-amber-600 mt-1 font-bold"></p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المشروع *' : 'Project *'}</label>
                  <select required value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="">{isRtl ? 'اختر المشروع' : 'Select Project'}</option>
                    {availableProjects.map(p => (<option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'السبب / الوصف *' : 'Reason / Description *'}</label>
                  <textarea required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="3" />
                </div>
                {formData.request_type === 'advance_request' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <label className="block text-xs text-amber-700 font-bold mb-1">{isRtl ? 'مبلغ السلفة المطلوب *' : 'Requested Advance Amount *'}</label>
                      <input required type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={isRtl ? 'المبلغ ر.س' : 'Amount SAR'} />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-700 font-bold mb-1">{isRtl ? 'الخصم الشهري *' : 'Monthly Deduction *'}</label>
                      <input required type="number" value={formData.monthly_deduction} onChange={(e) => setFormData({ ...formData, monthly_deduction: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder={isRtl ? 'الخصم ر.س' : 'Deduction SAR'} />
                    </div>
                  </div>
                )}
                {formData.request_type !== 'advance_request' && (
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'ملاحظات إضافية' : 'Additional Notes'}</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المرفقات (صور النموذج)' : 'Attachments (Form Images)'}</label>
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
        {showEditModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">✏️ {isRtl ? 'تعديل الطلب' : 'Edit Request'}</h2>
                <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">نوع الطلب</label>
                  <input type="text" disabled value={getRequestTypeName(formData.request_type, isRtl)} className="w-full border rounded-lg px-3 py-2 text-sm bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">السبب / الوصف *</label>
                  <textarea required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="3" />
                </div>
                {formData.request_type === 'advance_request' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div>
                      <label className="block text-xs text-amber-700 font-bold mb-1">مبلغ السلفة المطلوب</label>
                      <input required type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-amber-700 font-bold mb-1">الخصم الشهري</label>
                      <input required type="number" value={formData.monthly_deduction} onChange={(e) => setFormData({ ...formData, monthly_deduction: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ملاحظات إضافية</label>
                  <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" rows="2" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">المرفقات</label>
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
                  <button type="submit" className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm font-medium">{isRtl ? 'حفظ' : 'Save'}</button>
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg text-sm">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                  <h2 className="text-lg font-bold">{isRtl ? '📋 تفاصيل الطلب' : '📋 Request Details'}</h2>
                  <button 
                    onClick={() => handlePrint(selectedRequest)}
                    className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors"
                  >
                    <Download className="w-3 h-3" /> {isRtl ? 'تحميل/طباعة' : 'Download/Print'}
                  </button>
                </div>
                <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><p className="text-sm text-gray-500">{isRtl ? 'نوع الطلب' : 'Request Type'}</p><p className="font-bold">{getRequestTypeName(selectedRequest.request_type, isRtl)}</p></div>
                  <div><p className="text-sm text-gray-500">{isRtl ? 'التاريخ' : 'Date'}</p><p>{formatDate(selectedRequest.created_at)}</p></div>
                  <div><p className="text-sm text-gray-500">{isRtl ? 'الحالة' : 'Status'}</p>{getStatusBadge(selectedRequest.status)}</div>
                  <div><p className="text-sm text-gray-500">{isRtl ? 'المرفوع من' : 'Uploaded By'}</p><p>{selectedRequest.uploaded_by_name}</p></div>
                </div>
                <div><p className="text-sm text-gray-500">{isRtl ? 'المشروع' : 'Project'}</p><p>{selectedRequest.project ? translateBrandingText(selectedRequest.project, isRtl) : '-'}</p></div>
                {selectedRequest.request_type === 'advance_request' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
                    <div>
                      <span className="text-[10px] text-amber-600 font-black uppercase">{isRtl ? 'مبلغ السلفة' : 'Advance Amount'}</span>
                      <p className="text-lg font-black text-amber-900">{selectedRequest.amount?.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-600 font-black uppercase">{isRtl ? 'الخصم الشهري' : 'Monthly Deduction'}</span>
                      <p className="text-lg font-black text-amber-900">{selectedRequest.monthly_deduction?.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</p>
                    </div>
                  </div>
                )}
                <div><p className="text-sm text-gray-500">{isRtl ? 'السبب / الوصف' : 'Reason / Description'}</p><p className="bg-gray-50 p-3 rounded whitespace-pre-wrap">{translateBrandingText(selectedRequest.reason, isRtl)}</p></div>
                {selectedRequest.notes && (
                  <div><p className="text-sm text-gray-500">{isRtl ? 'ملاحظات إضافية' : 'Additional Notes'}</p><p className="bg-gray-50 p-3 rounded">{selectedRequest.notes}</p></div>
                )}
                {selectedRequest.signed_document && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-sm text-green-800 font-bold mb-2 flex items-center gap-2">
                      <FileCheck className="w-4 h-4" /> {isRtl ? 'النسخة الموقعة والمرفوعة:' : 'Signed and Uploaded Version:'}
                    </p>
                    <div className="flex items-center gap-4">
                      <img 
                        src={selectedRequest.signed_document} 
                        alt="Signed Document" 
                        className="h-32 w-24 object-cover rounded border border-green-300 shadow-sm cursor-pointer hover:opacity-80"
                        onClick={() => setFullViewImage(selectedRequest.signed_document)}
                      />
                      <div>
                        <p className="text-xs text-green-600 mb-1">{isRtl ? `تم الرفع بتاريخ: ${formatDate(selectedRequest.signed_at)}` : `Uploaded on: ${formatDate(selectedRequest.signed_at)}`}</p>
                        <button 
                          onClick={() => setFullViewImage(selectedRequest.signed_document)}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          {isRtl ? 'عرض بالحجم الكامل' : 'View Full Size'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {selectedRequest.images?.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">{isRtl ? 'المرفقات' : 'Attachments'}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedRequest.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt="" className="w-full h-32 object-cover rounded border" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                            <button 
                              onClick={() => setFullViewImage(img)} 
                              className="p-2 bg-white rounded-full hover:bg-gray-100 mx-1"
                              title={isRtl ? 'عرض الصورة' : 'View Image'}
                            >
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
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
              <img src={fullViewImage} alt={isRtl ? 'صورة مكبرة' : 'Enlarged Image'} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <a href={fullViewImage} download="image.jpg" onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {isRtl ? 'تحميل' : 'Download'}
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default EmployeeRequests;
