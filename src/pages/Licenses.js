import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { hasPermission, hasProjectPermission } from '../utils/permissions';
import { translateBrandingText } from '../utils/brandingTranslation';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { 
  Award, FileText, Search, Plus, Calendar, Clock, AlertTriangle, 
  CheckCircle, RefreshCw, Trash2, Edit3, Eye, ShieldAlert, ChevronLeft, ChevronRight, X, XCircle, MoreVertical, FileSpreadsheet, UploadCloud, Send
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = `${BACKEND_URL}/api`;

const SAUDI_GOVERNORATES = [
  'الدوادمي', 'شقراء', 'المزاحمية', 'ضرماء', 'مرات', 'ساجر', 'القصب',
  'عفيف', 'القويعية', 'مكة', 'الطائف', 'الرياض', 'جدة', 'المجمعة',
  'الخرج', 'حائل', 'تبوك', 'عرعر', 'رفحاء', 'بريدة', 'عنيزة'
];

// Utility to compress an image file to ~100KB
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.8;
        const compress = (q) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'));
              return;
            }
            if (blob.size > 102400 && q > 0.1) {
              compress(q - 0.1);
            } else {
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(newFile);
            }
          }, 'image/jpeg', q);
        };
        compress(quality);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function Licenses({ user, onLogout }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(() => {
    const savedPage = localStorage.getItem('licenses_page');
    return savedPage ? parseInt(savedPage, 10) : 1;
  });
  const [limit, setLimit] = useState(20);

  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [exporting, setExporting] = useState(false);

  // --- NEW MATCHING STATES ---
  const [fileMatchLoading, setFileMatchLoading] = useState(false);
  const [bulkReturnLoading, setBulkReturnLoading] = useState(false);
  const [bulkInfraLoading, setBulkInfraLoading] = useState(false);


  useEffect(() => {
    localStorage.setItem('licenses_page', page);
  }, [page]);

  // Summary KPI state
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    extended: 0,
    closed: 0,
    expiring_soon: 0,
    expired: 0
  });

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedFilterProject, setSelectedFilterProject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // all, valid, expiring_soon, expired

  const [openActionLic, setOpenActionLic] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const closeMenu = () => setOpenActionLic(null);
    document.addEventListener('click', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      document.removeEventListener('click', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, []);

  // Config states for dropdowns
  const [projectsList, setProjectsList] = useState([]);
  const [projectGovernoratesMap, setProjectGovernoratesMap] = useState({});
  const [contractorsList, setContractorsList] = useState([]);

  // Fetch configurations
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [projRes, govRes, contRes] = await Promise.all([
          axios.get(`${API}/projects`, { headers }),
          axios.get(`${API}/project-governorates`, { headers }),
          axios.get(`${API}/contractors`, { headers })
        ]);
        if (projRes.data) setProjectsList(projRes.data);
        if (govRes.data) setProjectGovernoratesMap(govRes.data);
        if (contRes.data) setContractorsList(contRes.data);
      } catch (err) {
        console.error("Failed to load configs", err);
      }
    };
    if (user) fetchConfigs();
  }, [user]);

  const getAllowedGovernorates = (project) => {
    let govs = projectGovernoratesMap[project] || [];
    if (!user || user.role === 'admin') return govs;
    if (!user.governorates || user.governorates.length === 0) return govs;
    if (user.governorates.some(g => ['الكل', 'جميع المحافظات', 'كل المحافظات'].includes(g))) return govs;
    return govs.filter(gov => user.governorates.includes(gov));
  };

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null);

  const [selectedLicense, setSelectedLicense] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    project: '',
    governorate: '',
    contractor: '',
    license_number: '',
    consultant_office: 'مكتب بيت الخبرة للإستشارات الهندسية',
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'active',
    notes: ''
  });

  // Extension form state
  const [extendData, setExtendData] = useState({
    new_expiry_date: '',
    extension_date: new Date().toISOString().split('T')[0]
  });

  // Check permissions - Allow active logged in users to operate licenses
  const canAdd = false;
  const canEdit = user?.role === 'admin' || hasPermission(user, 'licenses_edit');
  const canExtend = false;
  const canDelete = user?.role === 'admin' || hasPermission(user, 'licenses_delete');
  const canReview = user?.role === 'admin' || hasPermission(user, 'licenses_review');
  const canMatchFile = user?.role === 'admin' || hasPermission(user, 'file_matching');
  const canProcessSend = user?.role === 'admin' || hasPermission(user, 'licenses_process_send');
  const canInfraClose = user?.role === 'admin' || hasPermission(user, 'licenses_infra_closure');

  // Fetch summary metrics
  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {
        search: search || undefined,
        governorate: selectedGov || undefined,
        project: selectedFilterProject || undefined
      };
      const res = await axios.get(`${API}/licenses/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (res.data) setSummary(res.data);
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    }
  }, [search, selectedGov, selectedFilterProject]);

  // Fetch licenses list
  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {
        page,
        limit,
        search: search || undefined,
        governorate: selectedGov || undefined,
        project: selectedFilterProject || undefined,
        status: selectedStatus || undefined,
        consultant_office: selectedOffice || undefined,
        quick_filter: quickFilter !== 'all' ? quickFilter : undefined
      };
      const res = await axios.get(`${API}/licenses`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      if (res.data) {
        setLicenses(res.data.licenses || []);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch licenses:', e);
      toast.error(isRtl ? 'حدث خطأ في تحميل الرخص' : 'Error loading licenses');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, selectedGov, selectedFilterProject, selectedStatus, selectedOffice, quickFilter, isRtl]);

  useEffect(() => {
    fetchSummary();
    fetchLicenses();
  }, [fetchSummary, fetchLicenses]);

  // Handle Add License Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.governorate?.trim()) {
      toast.warning(isRtl ? 'المحافظة مطلوبة' : 'Governorate is required');
      return;
    }
    if (!formData.contractor?.trim()) {
      toast.warning(isRtl ? 'اسم المقاول مطلوب' : 'Contractor is required');
      return;
    }
    if (!formData.consultant_office?.trim()) {
      toast.warning(isRtl ? 'اسم الاستشاري مطلوب' : 'Consultant office is required');
      return;
    }
    const licenseRegex = /^\d{1,7}$/;
    if (!formData.license_number?.trim() || !licenseRegex.test(formData.license_number.trim())) {
      toast.warning(isRtl ? 'رقم الرخصة يجب أن يكون أرقام فقط ولا يزيد عن 7 أرقام' : 'License number must be max 7 digits (numbers only)');
      return;
    }
    if (!formData.expiry_date) {
      toast.warning(isRtl ? 'تاريخ الانتهاء مطلوب' : 'Expiry date is required');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        governorate: formData.governorate.trim()
      };
      const res = await axios.post(`${API}/licenses`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success(isRtl ? 'تم إضافة الرخصة بنجاح' : 'License added successfully');
        setShowAddModal(false);
        setFormData({
          project: '',
          governorate: '',
          contractor: '',
          license_number: '',
          consultant_office: 'مكتب بيت الخبرة للإستشارات الهندسية',
          issue_date: new Date().toISOString().split('T')[0],
          expiry_date: '',
          status: 'active',
          notes: ''
        });
        fetchSummary();
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || (isRtl ? 'حدث خطأ أثناء إضافة الرخصة' : 'Failed to add license');
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit License Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    if (!formData.governorate?.trim()) {
      toast.warning(isRtl ? 'المحافظة مطلوبة' : 'Governorate is required');
      return;
    }
    if (!formData.contractor?.trim()) {
      toast.warning(isRtl ? 'اسم المقاول مطلوب' : 'Contractor is required');
      return;
    }
    if (!formData.consultant_office?.trim()) {
      toast.warning(isRtl ? 'اسم الاستشاري مطلوب' : 'Consultant office is required');
      return;
    }
    const licenseRegex = /^\d{1,7}$/;
    if (!formData.license_number?.trim() || !licenseRegex.test(formData.license_number.trim())) {
      toast.warning(isRtl ? 'رقم الرخصة يجب أن يكون أرقام فقط ولا يزيد عن 7 أرقام' : 'License number must be max 7 digits (numbers only)');
      return;
    }
    if (!formData.expiry_date) {
      toast.warning(isRtl ? 'تاريخ الانتهاء مطلوب' : 'Expiry date is required');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/licenses/${selectedLicense.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success(isRtl ? 'تم تحديث الرخصة بنجاح' : 'License updated successfully');
        setShowEditModal(false);
        fetchSummary();
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء تحديث الرخصة' : 'Failed to update license');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Extend License Submit
  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLicense || !extendData.new_expiry_date) {
      toast.warning(isRtl ? 'يرجى إدخال تاريخ الانتهاء الجديد' : 'New expiry date is required');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/licenses/${selectedLicense.id}/extend`, extendData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success(isRtl ? 'تم تمديد الرخصة بنجاح' : 'License extended successfully');
        setShowExtendModal(false);
        fetchSummary();
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ أثناء تمديد الرخصة' : 'Failed to extend license');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Cancel Extension
  const handleCancelExtend = async (license) => {
    const confirm = await Swal.fire({
      title: isRtl ? 'إلغاء التمديد' : 'Cancel Extension',
      text: isRtl
        ? `هل تريد إلغاء تمديد الرخصة رقم (${license.license_number})؟ سيتم استعادة تاريخ الانتهاء الأصلي.`
        : `Cancel extension for license (${license.license_number})? Original expiry will be restored.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isRtl ? 'نعم، إلغاء التمديد' : 'Yes, Cancel',
      cancelButtonText: isRtl ? 'تراجع' : 'Back'
    });
    if (!confirm.isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/licenses/${license.id}/cancel-extend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success(isRtl ? 'تم إلغاء التمديد واستعادة التاريخ الأصلي' : 'Extension cancelled');
        fetchSummary();
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || (isRtl ? 'حدث خطأ أثناء إلغاء التمديد' : 'Failed to cancel extension');
      toast.error(msg);
    }
  };

  // Handle Close License
  const handleCloseLicense = async (license) => {
    const { value: closeNote, isConfirmed } = await Swal.fire({
      title: isRtl ? 'إغلاق الرخصة' : 'Close License',
      html: isRtl
        ? `<p class="text-sm text-gray-600 mb-3">هل تريد إغلاق الرخصة رقم <strong>${license.license_number}</strong>؟<br/>سيتم الاحتفاظ بجميع السجلات (تمديدات، تواريخ، ملاحظات).</p>
           <input id="swal-close-note" class="swal2-input" placeholder="سبب الإغلاق (اختياري)">`
        : `<p class="text-sm text-gray-600 mb-3">Close license <strong>${license.license_number}</strong>?<br/>All records will be preserved.</p>
           <input id="swal-close-note" class="swal2-input" placeholder="Reason for closing (optional)">`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#374151',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isRtl ? 'إغلاق الرخصة' : 'Close License',
      cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
      preConfirm: () => {
        return document.getElementById('swal-close-note')?.value || '';
      }
    });
    if (!isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API}/licenses/${license.id}/close`, { close_note: closeNote || '' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.success) {
        toast.success(isRtl ? 'تم إغلاق الرخصة بنجاح مع حفظ سجل كامل' : 'License closed successfully');
        fetchSummary();
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || (isRtl ? 'حدث خطأ أثناء إغلاق الرخصة' : 'Failed to close license');
      toast.error(msg);
    }
  };

  // Handle Delete License
  const handleDelete = async (licenseId, licenseNumber) => {
    const confirm = await Swal.fire({
      title: isRtl ? 'حذف الرخصة' : 'Delete License',
      text: isRtl ? `هل أنت متأكد من حذف الرخصة رقم (${licenseNumber})؟` : `Are you sure you want to delete license (${licenseNumber})?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isRtl ? 'نعم، حذف' : 'Yes, Delete',
      cancelButtonText: isRtl ? 'إلغاء' : 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.delete(`${API}/licenses/${licenseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          toast.success(isRtl ? 'تم حذف الرخصة بنجاح' : 'License deleted');
          fetchSummary();
          fetchLicenses();
        }
      } catch (err) {
        console.error(err);
        toast.error(isRtl ? 'حدث خطأ أثناء حذف الرخصة' : 'Failed to delete license');
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = licenses.map(l => l.id);
      setSelectedIds(ids);
      setIsAllSelected(true);
    } else {
      setSelectedIds([]);
      setIsAllSelected(false);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => {
        const next = [...prev, id];
        if (next.length === licenses.length && licenses.length > 0) setIsAllSelected(true);
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = prev.filter(item => item !== id);
        setIsAllSelected(false);
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirm = await Swal.fire({
      title: isRtl ? 'حذف الرخص المحددة؟' : 'Delete Selected Licenses?',
      text: isRtl ? `هل أنت متأكد من حذف (${selectedIds.length}) رخصة؟` : `Are you sure you want to delete (${selectedIds.length}) licenses?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: isRtl ? 'نعم، احذف' : 'Yes, Delete',
      cancelButtonText: isRtl ? 'تراجع' : 'Cancel'
    });
    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API}/licenses/bulk-delete`, { ids: selectedIds }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          toast.success(isRtl ? `تم حذف ${res.data.deleted_count} رخصة بنجاح` : `Successfully deleted ${res.data.deleted_count} licenses`);
          setSelectedIds([]);
          setIsAllSelected(false);
          fetchSummary();
          fetchLicenses();
        }
      } catch (err) {
        console.error(err);
        toast.error(isRtl ? 'فشل في حذف الرخص' : 'Failed to delete licenses');
      }
    }
  };

    const exportToFormat = async (format) => {
    if (selectedIds.length === 0) {
      toast.warning(isRtl ? 'يرجى تحديد رخص للتصدير' : 'Please select licenses to export');
      return;
    }
    
    const exportCount = selectedIds.length;
    if (!window.confirm(isRtl ? `هل أنت متأكد من تصدير ${exportCount} رخصة؟` : `Are you sure you want to export ${exportCount} licenses?`)) {
      return;
    }

    setExporting(true);
    toast.info(format === 'pdf' ? (isRtl ? 'جاري تحضير ملف الـ PDF... الرجاء الانتظار' : 'Preparing PDF... please wait') : (isRtl ? 'جاري تحضير ملف الإكسيل... الرجاء الانتظار' : 'Preparing Excel... please wait'), { autoClose: 3500 });
    
    try {
      const filename = `selected_licenses_${exportCount}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      const response = await axios.post(`${API}/licenses/export-selected/${format}`, {
        license_ids: selectedIds
      }, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(isRtl ? 'تم التصدير بنجاح' : 'Export successful');
    } catch (e) {
      console.error(e);
      toast.error(isRtl ? 'حدث خطأ أثناء التصدير' : 'Error exporting');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = () => exportToFormat('excel');
  const exportToPDF = () => exportToFormat('pdf');

    const handleFileMatch = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileMatchLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

          const extractedNumbers = new Set();
          data.forEach(row => {
            if (!Array.isArray(row)) return;
            for (const cell of row) {
              if (cell === null || cell === undefined) continue;
              const val = String(cell).trim();
              if (/^\d{6,10}$/.test(val)) {
                extractedNumbers.add(val);
                break;
              }
            }
          });

          if (extractedNumbers.size === 0) {
            toast.warning(isRtl ? 'لم يتم العثور على أي أرقام رخص صالحة في الملف' : 'No valid license numbers found in file');
            return;
          }

          // Call backend to fetch all matching licenses regardless of pagination
          const res = await axios.post(`${API}/licenses/match`, {
            license_numbers: Array.from(extractedNumbers)
          }, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });

          const matchedLicenses = res.data.licenses || [];
          if (matchedLicenses.length > 0) {
            const matchedIds = matchedLicenses.map(l => l.id);
            setSelectedIds(matchedIds);
            
            // Bring them to the top of the UI
            setLicenses(prev => {
              const prevWithoutMatched = prev.filter(l => !matchedIds.includes(l.id));
              return [...matchedLicenses, ...prevWithoutMatched];
            });

            toast.success(isRtl ? `تم العثور على ومطابقة ${matchedLicenses.length} رخصة بنجاح` : `Matched ${matchedLicenses.length} licenses successfully`);
          } else {
            toast.warning(isRtl ? 'لم يتم العثور على أي رخص مطابقة في قاعدة البيانات' : 'No matching licenses found in the database');
          }
        } catch (innerErr) {
          console.error(innerErr);
          toast.error(isRtl ? 'حدث خطأ أثناء معالجة الملف' : 'Error processing file');
        } finally {
          setFileMatchLoading(false);
          e.target.value = null;
        }
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error(err);
      toast.error(isRtl ? 'حدث خطأ في قراءة الملف' : 'Error reading file');
      setFileMatchLoading(false);
      e.target.value = null;
    }
  };

  
  const handleBulkInfraClose = async () => {
    if (selectedIds.length === 0) return;
    
    const result = await Swal.fire({
      title: isRtl ? 'إغلاق جماعي' : 'Bulk Infra Close',
      text: isRtl 
        ? `هل أنت متأكد من إغلاق (${selectedIds.length}) رخصة على منصة البنية التحتية؟`
        : `Are you sure you want to close (${selectedIds.length}) licenses on the infrastructure platform?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#888',
      confirmButtonText: isRtl ? 'نعم، إغلاق' : 'Yes, Close',
      cancelButtonText: isRtl ? 'إلغاء' : 'Cancel'
    });

    if (result.isConfirmed) {
      setBulkInfraLoading(true);
      Swal.fire({
        title: isRtl ? 'جاري الإغلاق...' : 'Closing...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        const token = localStorage.getItem('token');
        await Promise.all(selectedIds.map(id => 
          axios.put(`${API}/licenses/${id}/infra-close`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ));

        await Swal.fire({
          icon: 'success',
          title: isRtl ? 'تم بنجاح' : 'Success',
          text: isRtl ? 'تم إغلاق الرخص المحددة على منصة البنية التحتية.' : 'Successfully closed selected licenses on infrastructure platform.',
          confirmButtonText: isRtl ? 'حسناً' : 'OK',
        });
        
        setSelectedIds([]);
        fetchLicenses();
        fetchSummary();
      } catch (err) {
        console.error(err);
        toast.error(isRtl ? 'حدث خطأ أثناء الإغلاق' : 'Error closing licenses');
      } finally {
        setBulkInfraLoading(false);
      }
    }
  };

  const handleBulkReturn = async (overrideIds = null) => {
    const targetIds = Array.isArray(overrideIds) ? overrideIds : selectedIds;
    if (targetIds.length === 0) return;
    
    // Choose status based on filter or default
    let defaultStatus = 'returned_infra';
    if (selectedStatus === 'returned_consultant' || selectedStatus === 'returned_infra') {
      defaultStatus = selectedStatus;
    }

    const htmlContent = `
      <div style="text-align: ${isRtl ? 'right' : 'left'}; margin-bottom: 1rem;" dir="${isRtl ? 'rtl' : 'ltr'}">
        <p style="margin-bottom: 1rem; color: #4B5563; font-size: 0.875rem; text-align: ${isRtl ? 'right' : 'left'};">
          ${isRtl ? `سيتم إرسال ${targetIds.length} رخصة كدفعة واحدة للمحافظات التابعة لها لتتم معالجتها.` : `Send ${targetIds.length} licenses as a batch for processing.`}
        </p>
        
        <label style="display: block; font-weight: bold; margin-bottom: 0.5rem; color: #374151; font-size: 0.875rem; text-align: ${isRtl ? 'right' : 'left'};">${isRtl ? 'نوع الإعادة (لجميع الرخص)' : 'Return Type (for all)'} <span style="color: #EF4444;">*</span></label>
        <select id="swal-return-status" class="swal2-input" style="width: 100%; max-width: 100%; margin: 0 0 1rem 0; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; font-size: 0.875rem;">
          <option value="returned_infra" ${defaultStatus === 'returned_infra' ? 'selected' : ''}>${isRtl ? 'إعادة من مركز البنية التحتية' : 'Return from Infra Center'}</option>
          <option value="returned_consultant" ${defaultStatus === 'returned_consultant' ? 'selected' : ''}>${isRtl ? 'إعادة من الاستشاري' : 'Return from Consultant'}</option>
        </select>
        
        <hr style="margin: 1rem 0; border-color: #E5E7EB;" />
        <h4 style="font-size: 1rem; font-weight: bold; color: #1F2937; margin-bottom: 1rem; text-align: ${isRtl ? 'right' : 'left'};">${isRtl ? 'تفاصيل الرخص المحددة:' : 'Selected Licenses Details:'}</h4>
        
        <div style="max-height: 400px; overflow-y: auto; padding-left: ${isRtl ? '0' : '0.5rem'}; padding-right: ${isRtl ? '0.5rem' : '0'}; text-align: ${isRtl ? 'right' : 'left'};">
          ${targetIds.map(id => {
            const lic = licenses.find(l => l.id === id);
            return `
              <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                <p style="font-weight: bold; color: #2563EB; margin-bottom: 0.5rem;">${isRtl ? 'رقم الرخصة:' : 'License #:'} ${lic?.license_number || ''}</p>
                
                <label style="display: block; font-weight: bold; margin-bottom: 0.25rem; color: #4B5563; font-size: 0.75rem;">📅 ${isRtl ? 'تاريخ الإعادة (اختياري)' : 'Return Date (Optional)'}</label>
                <input type="date" id="return_date_${id}" class="swal2-input" style="width: 100%; margin: 0 0 0.5rem 0; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; font-size: 0.875rem; height: 35px;" />

                <label style="display: block; font-weight: bold; margin-bottom: 0.25rem; color: #4B5563; font-size: 0.75rem;">📋 ${isRtl ? 'سبب الإعادة (اختياري)' : 'Return Reason (Optional)'}</label>
                <textarea id="reason_${id}" class="swal2-textarea" style="width: 100%; margin: 0 0 0.5rem 0; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; font-size: 0.875rem; resize: none; min-height: 60px;" rows="2" placeholder="${isRtl ? 'اكتب سبب الإعادة لهذه الرخصة...' : 'Write return reason for this license...'}"></textarea>

                <label style="display: block; font-weight: bold; margin-bottom: 0.25rem; color: #4B5563; font-size: 0.75rem;">🖼 ${isRtl ? 'إرفاق صورة (اختياري)' : 'Attach Image (Optional)'}</label>
                <input type="file" id="image_${id}" accept="image/*" class="swal2-file" style="width: 100%; margin: 0; font-size: 0.75rem; padding: 0.25rem; border: 1px dashed #D1D5DB; border-radius: 0.5rem;" />
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const { value: formValues, isConfirmed } = await Swal.fire({
      title: isRtl ? 'إرسال الرخص المحددة' : 'Send Selected Licenses',
      html: htmlContent,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isRtl ? 'إرسال الدفعة' : 'Send Batch',
      cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
      customClass: {
        confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl ml-2 shadow-sm transition-colors',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded-xl mr-2 transition-colors'
      },
      buttonsStyling: false,
      preConfirm: () => {
        const status = document.getElementById('swal-return-status').value;
        const itemsData = targetIds.map(id => {
          const rawDate = document.getElementById(`return_date_${id}`).value;
          // Format date to ISO string if provided, else use current ISO string
          const returnDate = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

          return {
            id: id,
            reason: document.getElementById(`reason_${id}`).value,
            image: document.getElementById(`image_${id}`).files[0] || null,
            return_date: returnDate
          };
        });
        return { status, itemsData };
      }
    });

    if (!isConfirmed || !formValues) return;

    setBulkReturnLoading(true);
    
    // Show a loading Swal while uploading/submitting
    Swal.fire({
      title: isRtl ? 'جاري الإرسال...' : 'Sending...',
      text: isRtl ? 'الرجاء الانتظار، جاري رفع الملفات' : 'Please wait, uploading files',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const token = localStorage.getItem('token');
      const items = [];

      // Process each license sequentially to upload images if present
      for (const itemData of formValues.itemsData) {
        let uploadedImageUrl = '';
        
        if (itemData.image) {
          try {
            const compressedFile = await compressImage(itemData.image);
            const formData = new FormData();
            formData.append('file', compressedFile);
            const uploadRes = await axios.post(`${API}/uploads/image`, formData, {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
            });
            uploadedImageUrl = uploadRes.data?.url || uploadRes.data?.secure_url || '';
          } catch (uploadErr) {
            console.error('Image upload failed for license:', itemData.id, uploadErr);
            toast.error(isRtl ? 'فشل رفع إحدى الصور' : 'An image upload failed');
            setBulkReturnLoading(false);
            Swal.close();
            return;
          }
        }

        const lic = licenses.find(l => l.id === itemData.id);
        items.push({
          id: itemData.id,
          return_date: itemData.return_date,
          status: formValues.status,
          return_reason: itemData.reason.trim(),
          return_image_url: uploadedImageUrl
        });
      }

      const res = await axios.post(`${API}/licenses/bulk-return`, { items }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: isRtl ? 'تم الإرسال بنجاح' : 'Success',
          text: isRtl ? `تم إرسال ${res.data.updated_count} رخصة للمعالجة بنجاح` : `Successfully sent ${res.data.updated_count} licenses`,
          confirmButtonText: 'حسناً',
          customClass: { confirmButton: 'bg-blue-600 text-white font-bold py-2 px-4 rounded-xl' },
          buttonsStyling: false
        });
        setSelectedIds([]);
        setIsAllSelected(false);
        fetchSummary();
        fetchLicenses();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: isRtl ? 'خطأ' : 'Error',
        text: isRtl ? 'حدث خطأ أثناء الإرسال' : 'Error sending licenses',
        confirmButtonText: 'حسناً',
        customClass: { confirmButton: 'bg-blue-600 text-white font-bold py-2 px-4 rounded-xl' },
        buttonsStyling: false
      });
    } finally {
      setBulkReturnLoading(false);
    }
  };

  const handleMarkProcessed = async (license) => {
    const htmlContent = `
      <div style="text-align: ${isRtl ? 'right' : 'left'}; direction: ${isRtl ? 'rtl' : 'ltr'};">
        <p style="margin-bottom: 1rem; color: #4B5563; font-size: 0.875rem;">
          ${isRtl ? 'هل أنت متأكد من الانتهاء من معالجة الرخصة رقم' : 'Are you sure you want to finish processing license #'} <b style="color: #2563EB;">${license.license_number}</b>؟
        </p>
        
        <label style="display: block; font-weight: bold; margin-bottom: 0.25rem; color: #374151; font-size: 0.875rem;">📋 ${isRtl ? 'ملاحظة المعالجة (اختياري)' : 'Processing Note (Optional)'}</label>
        <textarea id="processed_reason" class="swal2-textarea" style="width: 100%; margin: 0 0 1rem 0; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid #D1D5DB; font-size: 0.875rem; resize: none; min-height: 80px;" rows="3" placeholder="${isRtl ? 'اكتب ملاحظة حول كيفية المعالجة...' : 'Write a note about the processing...'}"></textarea>

        <label style="display: block; font-weight: bold; margin-bottom: 0.25rem; color: #374151; font-size: 0.875rem;">🖼 ${isRtl ? 'إرفاق صورة توضح الإصلاح (اختياري)' : 'Attach image showing fix (Optional)'}</label>
        <input type="file" id="processed_image" accept="image/*" class="swal2-file" style="width: 100%; margin: 0; font-size: 0.875rem; padding: 0.5rem; border: 1px dashed #D1D5DB; border-radius: 0.5rem;" />
      </div>
    `;

    const { value: formValues, isConfirmed } = await Swal.fire({
      title: isRtl ? 'تأكيد المعالجة' : 'Confirm Processing',
      html: htmlContent,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: isRtl ? 'نعم، تمت المعالجة' : 'Yes, Processed',
      cancelButtonText: isRtl ? 'إلغاء' : 'Cancel',
      customClass: {
        confirmButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl ml-2 shadow-sm transition-colors',
        cancelButton: 'bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-5 rounded-xl mr-2 transition-colors'
      },
      buttonsStyling: false,
      preConfirm: () => {
        return {
          reason: document.getElementById('processed_reason').value,
          image: document.getElementById('processed_image').files[0] || null
        };
      }
    });

    if (!isConfirmed) return;

    Swal.fire({
      title: isRtl ? 'جاري الإرسال...' : 'Sending...',
      text: isRtl ? 'الرجاء الانتظار' : 'Please wait',
      allowOutsideClick: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const token = localStorage.getItem('token');
      let uploadedImageUrl = '';
      
      if (formValues.image) {
        try {
          const compressedFile = await compressImage(formValues.image);
          const formData = new FormData();
          formData.append('file', compressedFile);
          
          const uploadRes = await axios.post(`${API}/uploads/image`, formData, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
          });
          uploadedImageUrl = uploadRes.data?.url || uploadRes.data?.secure_url || '';
        } catch (uploadErr) {
          console.error('Image upload failed:', uploadErr);
          toast.error(isRtl ? 'فشل رفع الصورة' : 'Image upload failed');
          Swal.close();
          return;
        }
      }

      const res = await axios.post(`${API}/licenses/${license.id}/processed`, {
        processed_reason: formValues.reason.trim(),
        processed_image_url: uploadedImageUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: isRtl ? 'تم بنجاح' : 'Success',
          text: isRtl ? 'تم تحديث حالة المعالجة بنجاح' : 'Processing status updated successfully',
          confirmButtonText: isRtl ? 'حسناً' : 'OK',
          customClass: { confirmButton: 'bg-blue-600 text-white font-bold py-2 px-4 rounded-xl' },
          buttonsStyling: false
        });
        fetchLicenses();
        fetchSummary();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: isRtl ? 'خطأ' : 'Error',
        text: isRtl ? 'حدث خطأ أثناء المعالجة' : 'Error during processing',
        confirmButtonText: isRtl ? 'حسناً' : 'OK',
        customClass: { confirmButton: 'bg-blue-600 text-white font-bold py-2 px-4 rounded-xl' },
        buttonsStyling: false
      });
    }
  };

  const handleRevertReturn = async (license) => {
    const confirm = await Swal.fire({
      title: isRtl ? 'التراجع عن إرسال الرخصة؟' : 'Revert Return License?',
      text: isRtl ? 'سيتم التراجع عن إرسال هذه الرخصة للمعالجة ومسح بيانات الإعادة.' : 'This will revert sending this license for processing and clear return data.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isRtl ? 'نعم، تراجع' : 'Yes, Revert',
      cancelButtonText: isRtl ? 'إلغاء' : 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`${API}/licenses/${license.id}/revert-return`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          Swal.fire({
            icon: 'success',
            title: isRtl ? 'تم التراجع بنجاح' : 'Reverted successfully',
            timer: 1500,
            showConfirmButton: false
          });
          fetchLicenses();
          fetchSummary();
        }
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.detail || (isRtl ? 'حدث خطأ أثناء التراجع' : 'Failed to revert');
        Swal.fire({
          icon: 'error',
          title: isRtl ? 'خطأ' : 'Error',
          text: msg
        });
      }
    }
  };

  /* old pdf export removed */

  const handleInfraClose = async (lic) => {
    try {
      const result = await Swal.fire({
        title: isRtl ? 'تأكيد الإغلاق' : 'Confirm Closure',
        text: isRtl 
          ? `هل أنت متأكد من إغلاق الرخصة (${lic.license_number}) على منصة البنية التحتية؟` 
          : `Are you sure you want to close license (${lic.license_number}) on the infrastructure platform?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#888',
        confirmButtonText: isRtl ? 'نعم، تأكيد' : 'Yes, Confirm',
        cancelButtonText: isRtl ? 'إلغاء' : 'Cancel'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: isRtl ? 'جاري التحديث...' : 'Updating...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await axios.put(`${API}/licenses/${lic.id}/infra-close`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Update local state - infra-close returns { status, date }
        setLicenses(prev => prev.map(l => 
          l.id === lic.id ? { ...l, center_closure_status: res.data.status, center_closure_date: res.data.date, processing_status: 'processed' } : l
        ));
        
        await Swal.fire({
          icon: 'success',
          title: isRtl ? 'تم بنجاح!' : 'Success!',
          text: isRtl ? 'تم تحديث حالة الإغلاق على منصة البنية التحتية.' : 'Infra closure status updated.',
          confirmButtonText: isRtl ? 'حسناً' : 'OK'
        });
        fetchLicenses();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error in infra closure:', error);
      Swal.fire({
        icon: 'error',
        title: isRtl ? 'خطأ!' : 'Error!',
        text: isRtl ? 'حدث خطأ أثناء تحديث الحالة.' : 'Failed to update status.',
        confirmButtonText: isRtl ? 'حسناً' : 'OK'
      });
    }
  };


  const handleReuploadToCenter = async (lic) => {
    try {
      const result = await Swal.fire({
        title: isRtl ? 'تأكيد إعادة الرفع للمركز' : 'Confirm Re-upload to Center',
        text: isRtl ? `هل أنت متأكد من إعادة الرفع للمركز للرخصة (${lic.license_number}) بعد المعالجة؟` : `Are you sure you want to re-upload license (${lic.license_number}) to the center after processing?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10B981',
        cancelButtonColor: '#888',
        confirmButtonText: isRtl ? 'نعم، إعادة رفع' : 'Yes, Re-upload',
        cancelButtonText: isRtl ? 'إلغاء' : 'Cancel'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: isRtl ? 'جاري التحديث...' : 'Updating...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await axios.put(`${API}/licenses/${lic.id}/reupload-center`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        await Swal.fire({
          icon: 'success',
          title: isRtl ? 'تم بنجاح!' : 'Success!',
          text: isRtl ? 'تم إعادة رفع الرخصة للمركز بنجاح وتم مسح حالات الإعادة.' : 'License re-uploaded to center and return states cleared.',
          confirmButtonText: isRtl ? 'حسناً' : 'OK'
        });
        fetchLicenses();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error re-uploading to center:', error);
      Swal.fire({
        icon: 'error',
        title: isRtl ? 'خطأ!' : 'Error!',
        text: isRtl ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'Server connection error.',
      });
    }
  };

  const handleCenterClosure = async (lic) => {
    const isCanceling = !!lic.center_closure_status;
    try {
      const result = await Swal.fire({
        title: isCanceling ? (isRtl ? 'تأكيد إلغاء الرفع' : 'Confirm Cancel Submission') : (isRtl ? 'تأكيد الرفع والإغلاق للمركز' : 'Confirm Center Closure'),
        text: isCanceling 
          ? (isRtl ? `هل أنت متأكد من إلغاء الرفع للمركز للرخصة (${lic.license_number})؟` : `Are you sure you want to cancel center closure submission for license (${lic.license_number})?`)
          : (isRtl ? `هل أنت متأكد من الرفع والإغلاق للمركز للرخصة (${lic.license_number})؟` : `Are you sure you want to submit license (${lic.license_number}) for center closure?`),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: isCanceling ? '#d33' : '#3085d6',
        cancelButtonColor: '#888',
        confirmButtonText: isRtl ? 'نعم، تأكيد' : 'Yes, Confirm',
        cancelButtonText: isRtl ? 'إلغاء' : 'Cancel'
      });

      if (result.isConfirmed) {
        Swal.fire({
          title: isRtl ? 'جاري التحديث...' : 'Updating...',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        const res = await axios.put(`${API}/licenses/${lic.id}/center-closure-toggle`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        // Update local state - toggle endpoint returns { status, date }
        setLicenses(prev => prev.map(l => 
          l.id === lic.id ? { ...l, center_closure_status: res.data.status, center_closure_date: res.data.date } : l
        ));
        
        await Swal.fire({
          icon: 'success',
          title: isRtl ? 'تم بنجاح!' : 'Success!',
          text: isRtl ? 'تم تحديث حالة الرفع والإغلاق للمركز.' : 'Center closure status updated.',
          confirmButtonText: isRtl ? 'حسناً' : 'OK'
        });
        fetchLicenses();
        fetchSummary();
      }
    } catch (error) {
      console.error('Error in center closure:', error);
      Swal.fire({
        icon: 'error',
        title: isRtl ? 'خطأ!' : 'Error!',
        text: isRtl ? 'حدث خطأ أثناء تحديث الحالة.' : 'Failed to update status.',
        confirmButtonText: isRtl ? 'حسناً' : 'OK'
      });
    }
  };

  // Helper for Badge Color styling
  const getBadgeStyle = (color) => {
    switch (color) {
      case 'red':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'yellow':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'green':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // حساب الحالة الفعلية من جانب الفرونت اد — احتياطي إذا لم يرسل الباك اد effective_status
  const computeEffectiveStatus = (lic) => {
    if (!lic) return 'active';
    // الباك اد أرسل الحالة الفعلية — استخدمها مباشرة
    if (lic.effective_status) return lic.effective_status;
    // احتياط: حساب محلي إذا لم يصل effective_status
    const stored = lic.status || 'active';
    if (stored === 'closed') return 'closed';
    const extStatus = lic.extension_status || 'original';
    
    if (!lic.expiry_date) return 'expired';

    try {
      const expDate = new Date(lic.expiry_date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today) return 'expired';
    } catch(e) {
      return 'expired';
    }
    
    if (extStatus === 'extended') return 'extended';
    return stored;
  };

  const getStatusLabel = (lic) => {
    const s = computeEffectiveStatus(lic);
    switch (s) {
      case 'extended': return isRtl ? 'ممددة' : 'Extended';
      case 'expired':  return isRtl ? 'منتهية' : 'Expired';
      case 'closed':   return isRtl ? 'مغلقة' : 'Closed';
      case 'returned_consultant': return isRtl ? 'الرخصة معادة من الاستشاري' : 'Returned (Consultant)';
      case 'returned_infra': return isRtl ? 'الرخصة معادة من مركز البنية التحتية' : 'Returned (Infra)';
      case 'active':
      default:         return isRtl ? 'سارية' : 'Active';
    }
  };

  const translateBadgeText = (text, isRtl) => {
    if (!text) return '';
    if (text === 'تنتهي اليوم') return isRtl ? 'تنتهي اليوم' : 'Ends Today';
    if (text.startsWith('منتهية منذ')) {
      const days = text.replace(/\D/g, '');
      return isRtl ? `منتهية منذ ${days} يوم` : `Expired ${days} days ago`;
    }
    if (text.startsWith('متبقي')) {
      const days = text.replace(/\D/g, '');
      return isRtl ? `متبقي ${days} يوم` : `${days} days left`;
    }
    return text;
  };

  const getStatusBadge = (lic) => {
    const s = computeEffectiveStatus(lic);
    switch (s) {
      case 'extended': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired':  return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'closed':   return 'bg-gray-200 text-gray-600 border-gray-300';
      case 'returned_consultant': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'returned_infra': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'active':
      default:         return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const getProcessingStatusLabel = (lic) => {
    if (lic.status === 'returned_consultant') return isRtl ? 'الرخصة معادة من الاستشاري' : 'Returned (Consultant)';
    if (lic.status === 'returned_infra') return isRtl ? 'الرخصة معادة من مركز البنية التحتية' : 'Returned (Infra)';
    return isRtl ? 'لا يوجد ملاحظة' : 'No notes';
  };

  const getProcessingStatusBadge = (lic) => {
    if (lic.status === 'returned_consultant') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (lic.status === 'returned_infra') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getCenterClosureLabel = (lic) => {
    if (!lic.center_closure_status) return '-';
    if (lic.center_closure_status === 'مرفوعة للاغلاق للمركز') {
      if (lic.processing_status === 'processing') return isRtl ? 'الرخصة مرفوعة للإغلاق لمركز البنية التحتية' : 'Submitted for Center Closure';
      if (lic.status === 'returned_infra') return isRtl ? 'الرخصة معادة من مركز البنية التحتية' : 'Returned (Infra Center)';
      if (lic.status === 'returned_consultant') return isRtl ? 'الرخصة معادة من الاستشاري' : 'Returned (Consultant)';
      return isRtl ? 'الرخصة مرفوعة للإغلاق لمركز البنية التحتية' : 'Submitted for Center Closure';
    }
    if (lic.center_closure_status === 'مغلقة علي منصة البنية التحتية') return isRtl ? 'مغلقة علي منصة البنية التحتية' : 'Closed on Infra Platform';
    return lic.center_closure_status;
  };

  const getCenterClosureBadge = (lic) => {
    if (!lic.center_closure_status) return '';
    if (lic.center_closure_status === 'مرفوعة للاغلاق للمركز') {
      if (lic.processing_status === 'processing') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      if (lic.status === 'returned_infra') return 'bg-orange-100 text-orange-800 border-orange-200';
      if (lic.status === 'returned_consultant') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (lic.center_closure_status === 'مغلقة علي منصة البنية التحتية') return 'bg-slate-800 text-white border-slate-900';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const getCenterClosureTooltip = (lic) => {
    if (lic.center_closure_status === 'مرفوعة للاغلاق للمركز' && (lic.processing_status === 'processing' || (lic.status !== 'returned_infra' && lic.status !== 'returned_consultant'))) {
      return isRtl 
        ? 'ليس من الضروري أن الرخصة المرفوعة للإغلاق لمركز البنية التحتية بأنه سوف يتم الإغلاق، حيث أنه من الممكن أن تكون هناك ملاحظات ويتم إعادتها من مركز البنية التحتية أو يتم إعادتها من الاستشاري' 
        : 'It is not necessarily that a license submitted for closure to the infrastructure center will be closed, as it is possible that there are notes and it gets returned from the infrastructure center or returned by the consultant.';
    }
    return undefined;
  };

  const getEmptyMessage = () => {
    const currentFilter = quickFilter !== 'all' ? quickFilter : selectedStatus;
    
    if (currentFilter === 'returned_consultant') return isRtl ? 'لا توجد رخص معادة من الاستشاري' : 'No licenses returned by consultant';
    if (currentFilter === 'returned_infra') return isRtl ? 'لا توجد رخص معادة من مركز البنية التحتية' : 'No licenses returned by infra center';
    if (currentFilter === 'center_closure') return isRtl ? 'لا توجد رخص مرفوعة للإغلاق لمركز البنية التحتية' : 'No licenses submitted for center closure';
    if (currentFilter === 'expired') return isRtl ? 'لا توجد رخص منتهية بعد فترة صلاحيتها الصادرة بـ 10 أيام' : 'No expired licenses';
    if (currentFilter === 'expiring_soon') return isRtl ? 'لا توجد رخص أوشكت على الانتهاء خلال فترة صلاحيتها الصادرة بـ 10 أيام' : 'No licenses expiring soon';
    if (currentFilter === 'valid' || currentFilter === 'active') return isRtl ? 'لا توجد رخص سارية' : 'No active licenses';
    
    return isRtl ? 'لا توجد رخص مطابقة' : 'No licenses found';
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 sm:p-6 space-y-5">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                {isRtl ? 'إدارة الرخص' : 'License Management'}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {isRtl ? 'متابعة رخص البلاغات الصادرة وحالة اغلاقها علي منصة مركز البنية التحتية والتنبيه التلقائي' : 'Track and extend project licenses with automated expiry alerts'}
              </p>
            </div>
          </div>

          {/* Add License button removed */}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_auto_1fr_1fr] gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-[14px] text-gray-600 font-bold">{isRtl ? 'إجمالي الرخص' : 'Total Licenses'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-gray-900">{summary.total}</span>
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <span className="text-[14px] text-gray-600 font-bold">{isRtl ? 'رخص سارية' : 'Active Licenses'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600">{summary.active}</span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-3 lg:col-span-1">
            <span className="text-[14px] text-gray-600 font-bold whitespace-nowrap">{isRtl ? 'رخص أوشكت علي الانتهاء خلال فترة صلاحيتها الصادرة بـ10 ايام' : 'Nearing Expiration (10 days)'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-600">{summary.expiring_soon}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>



          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[14px] text-gray-600 font-bold">{isRtl ? 'الرخص المنتهية بعد فترة صلاحيتها الصادرة بـ 10 أيام' : 'Expired Licenses'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-rose-600">{summary.expired}</span>
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <span className="text-[14px] text-gray-600 font-bold">{isRtl ? 'الرخصة مرفوعة للإغلاق لمركز البنية التحتية' : 'Center Closure'}</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-blue-600">{summary.center_closure || 0}</span>
              <UploadCloud className="w-5 h-5 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          
          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
            <button
              onClick={() => { setQuickFilter('all'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {isRtl ? 'جميع الرخص' : 'All Licenses'}
            </button>
            <button
              onClick={() => { setQuickFilter('valid'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'valid' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🟢 {isRtl ? 'رخص سارية' : 'Active Licenses'}
            </button>
            <button
              onClick={() => { setQuickFilter('expiring_soon'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'expiring_soon' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🟡 {isRtl ? 'رخص أوشكت على الانتهاء' : 'Nearing Expiration'}
            </button>

            <button
              onClick={() => { setQuickFilter('expired'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'expired' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🔴 {isRtl ? 'الرخص المنتهية بعد فترة صلاحيتها الصادرة بـ 10 أيام' : 'Expired Licenses'}
            </button>
            <button
              onClick={() => { setQuickFilter('center_closure'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'center_closure' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              ☁️ {isRtl ? 'الرخصة مرفوعة للإغلاق لمركز البنية التحتية' : 'Center Closure'}
            </button>
            <button
              onClick={() => { setQuickFilter('returned_consultant'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'returned_consultant' ? 'bg-rose-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🟥 {isRtl ? 'الرخصة معادة من الاستشاري' : 'Returned Consultant'}
            </button>
            <button
              onClick={() => { setQuickFilter('returned_infra'); setPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-sm sm:text-base font-semibold transition-all ${quickFilter === 'returned_infra' ? 'bg-orange-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              🟧 {isRtl ? 'الرخصة معادة من مركز البنية التحتية' : 'Returned Infra'}
            </button>

            <div className="flex-1 flex justify-end gap-2">
              
              {canProcessSend && selectedIds.length > 0 && (
                  <button onClick={() => handleBulkReturn()} disabled={bulkReturnLoading} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-bold">{isRtl ? `الرخص المعادة (${selectedIds.length})` : `Process (${selectedIds.length})`}</span>
                  </button>
                )}
              {canMatchFile && (
                <label className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer">
                <UploadCloud className="w-4 h-4" />
                <span className="text-sm font-bold">{isRtl ? 'مطابقة الملف' : 'Match File'}</span>
                <input type="file" accept=".xlsx, .xls" onChange={handleFileMatch} className="hidden" />
              </label>
              )}

              {canInfraClose && selectedIds.length > 0 && (
                  <button onClick={handleBulkInfraClose} disabled={bulkInfraLoading} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-colors shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-bold">{isRtl ? `إغلاق بنية تحتية (${selectedIds.length})` : `Infra Close (${selectedIds.length})`}</span>
                  </button>
              )}
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-bold">{isRtl ? `حذف (${selectedIds.length})` : `Delete (${selectedIds.length})`}</span>
                </button>
              )}
              <button onClick={exportToPDF} disabled={exporting} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold">PDF {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
              </button>
              <button onClick={exportToExcel} disabled={exporting} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-sm font-bold">Excel {selectedIds.length > 0 && `(${selectedIds.length})`}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder={isRtl ? 'ابحث برقم الرخصة...' : 'Search by license #...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pr-9 pl-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
              />
            </div>

            {/* Project Filter */}
            <select
              value={selectedFilterProject}
              onChange={(e) => { 
                setSelectedFilterProject(e.target.value); 
                setSelectedGov(''); 
                setPage(1); 
              }}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            >
              <option value="">{isRtl ? 'جميع المشاريع' : 'All Projects'}</option>
              {projectsList.map(proj => (
                <option key={proj.name} value={proj.name}>{translateBrandingText(proj.name, isRtl)}</option>
              ))}
            </select>

            {/* Governorate Filter */}
            <select
              value={selectedGov}
              onChange={(e) => { setSelectedGov(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            >
              <option value="">{isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>
              {(() => {
                let options = [];
                if (selectedFilterProject && projectGovernoratesMap[selectedFilterProject]) {
                  options = projectGovernoratesMap[selectedFilterProject];
                } else if (Object.keys(projectGovernoratesMap).length > 0) {
                  const allGovs = new Set();
                  Object.values(projectGovernoratesMap).forEach(govs => {
                    if (Array.isArray(govs)) {
                      govs.forEach(g => allGovs.add(g));
                    }
                  });
                  options = Array.from(allGovs).sort();
                } else {
                  options = typeof SAUDI_GOVERNORATES !== 'undefined' ? SAUDI_GOVERNORATES : [];
                }
                
                // فلترة المحافظات بناءً على صلاحيات المستخدم
                options = options.filter(gov => {
                  if (user.role === 'admin') return true;
                  if (!user.governorates || user.governorates.length === 0) return true;
                  if (user.governorates.some(g => ['الكل', 'جميع المحافظات', 'كل المحافظات'].includes(g))) return true;
                  return user.governorates.includes(gov);
                });
                
                return options.map(gov => (
                  <option key={gov} value={gov}>{typeof translateBrandingText === 'function' ? translateBrandingText(gov, isRtl) : gov}</option>
                ));
              })()}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/50"
            >
              <option value="">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
              <option value="active">{isRtl ? 'الرخص السارية' : 'Active License'}</option>
              <option value="expiring_soon">{isRtl ? 'رخص أوشكت على الانتهاء خلال فترة صلاحيتها الصادرة بـ 10 أيام' : 'Licenses Expiring Soon (Within 10 days)'}</option>
              <option value="expired">{isRtl ? 'الرخص المنتهية بعد فترة صلاحيتها الصادرة بـ 10 أيام' : 'Expired Licenses (After 10 days)'}</option>
              <option value="center_closure">{isRtl ? 'الرخصة مرفوعة للإغلاق لمركز البنية التحتية' : 'Submitted for Center Closure'}</option>
              <option value="returned_consultant">{isRtl ? 'الرخصة معادة من الاستشاري' : 'Returned by Consultant'}</option>
              <option value="returned_infra">{isRtl ? 'الرخصة معادة من مركز البنية التحتية' : 'Returned by Infra Center'}</option>
            </select>

            {/* Reset Filters */}
            <button
              onClick={() => {
                setSearch('');
                setSelectedFilterProject('');
                setSelectedGov('');
                setSelectedStatus('');
                setSelectedOffice('');
                setQuickFilter('all');
                setPage(1);
              }}
              className="px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg text-sm transition-colors"
            >
              {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm font-medium">{isRtl ? 'جاري تحميل الرخص...' : 'Loading licenses...'}</p>
            </div>
          ) : licenses.length === 0 ? (
            <div className="p-12 text-center text-gray-500 space-y-3">
              <Award className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-base font-semibold">{getEmptyMessage()}</p>
              <p className="text-xs text-gray-400">{isRtl ? 'جرب تغيير خيارات البحث أو قم بإضافة رخصة صادرة' : 'Try adjusting your filters or add a new license'}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-right text-[15.5px] border-collapse table-auto">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-gray-200 text-gray-700 text-sm font-bold">
                    <th className="px-3 py-3 w-10 text-center text-base">
                      <input
                        type="checkbox"
                        checked={isAllSelected && licenses.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                      />
                    </th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'رقم الرخصة' : 'License #'}</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'نوع البلاغ' : 'Report Type'}</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'تاريخ الإعادة' : 'Return Date'}</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'المشروع' : 'Project'}</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'المحافظة' : 'Governorate'}</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'المقاول' : 'Contractor'}</th>
                    <th className="px-3 py-3 text-right whitespace-nowrap text-base">{isRtl ? 'الاستشاري' : 'Consultant'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'الأيام المتبقية' : 'Remaining Days'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'حالة الرفع والإغلاق للمركز' : 'Center Closure Status'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'سجل الإعادات' : 'Return History'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'حالة الرخصة' : 'License Status'}</th>
                    <th className="px-3 py-3 text-center whitespace-nowrap text-base">{isRtl ? 'إجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {licenses.map((lic) => {
                    const effStatus = computeEffectiveStatus(lic);
                    const isExtended = lic.extension_status === 'extended';
                    const isExpired = effStatus === 'expired';
                    const isClosed = effStatus === 'closed';
                    return (
                      <tr key={lic.id} className={`transition-colors hover:bg-blue-50/30 ${
                        isClosed ? 'bg-gray-50/60 opacity-70' :
                        isExtended ? 'bg-purple-50/30' : 'bg-white'
                      }`}>
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(lic.id)}
                            onChange={(e) => handleSelectOne(e, lic.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
                          />
                        </td>

                        {/* رقم الرخصة */}
                        <td className="px-3 py-2.5 font-bold text-gray-900 whitespace-nowrap">
                          <span className="text-sm">{lic.license_number}</span>
                          {lic.processing_status === 'processing' && (
                             <span className="block text-xs text-orange-600 font-bold bg-orange-50 px-1 py-0.5 rounded mt-1 w-max">
                               ⏳ {isRtl ? 'جاري المعالجة' : 'Processing'}
                             </span>
                          )}
                          {lic.processing_status === 'processed' && (
                             <span className="block text-xs text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded mt-1 w-max">
                               ✅ {isRtl ? 'تمت المعالجة' : 'Processed'}
                             </span>
                          )}
                        </td>

                        {/* نوع البلاغ */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-[15.5px] font-bold text-gray-800">
                            {lic.report_type ? (
                              isRtl ? lic.report_type : (
                                (lic.report_type.trim() === 'اسفلت' || lic.report_type.trim() === 'أسفلت') ? 'Asphalt' :
                                lic.report_type.trim() === 'ترابي' ? 'Dirt' :
                                lic.report_type.trim() === 'بلاط' ? 'Tiles' :
                                lic.report_type
                              )
                            ) : '-'}
                          </span>
                        </td>

                        {/* تاريخ الإعادة */}
                        <td className="px-3 py-2.5 text-[15.5px] text-gray-800 font-bold whitespace-nowrap">
                          {lic.return_date ? <span className="text-rose-600 font-bold">{lic.return_date.split('T')[0]}</span> : <span className="text-gray-300">-</span>}
                        </td>

                        {/* المشروع */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="font-bold text-gray-900 text-[15.5px]" title={lic.project}>
                            {translateBrandingText(lic.project, isRtl) || '-'}
                          </span>
                        </td>

                        {/* المحافظة */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-sm font-medium text-blue-700">
                            {translateBrandingText(lic.governorate, isRtl) || '-'}
                          </span>
                        </td>

                        {/* المقاول */}
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-xs font-medium text-gray-800">{translateBrandingText(lic.contractor, isRtl) || '-'}</span>
                        </td>

                        {/* الاستشاري */}
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <span className="text-xs text-gray-600 block leading-tight" title={lic.consultant_office}>
                            {translateBrandingText(lic.consultant_office, isRtl) || '-'}
                          </span>
                        </td>

                        {/* تاريخ الإصدار */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          <span className="text-xs text-gray-700 font-medium">
                            {lic.issue_date || '-'}
                          </span>
                        </td>

                        {/* تاريخ الانتهاء */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          <span className={`text-xs font-semibold ${
                            isExpired ? 'text-rose-600' : 'text-gray-800'
                          }`}>
                            {lic.expiry_date || '-'}
                          </span>
                        </td>

                        {/* الأيام المتبقية */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-bold border ${getBadgeStyle(lic.badge_color)}`}>
                            {translateBadgeText(lic.badge_text, isRtl)}
                          </span>
                        </td>

                        {/* الحالة */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-semibold border ${getStatusBadge(lic)}`}>
                            {getStatusLabel(lic)}
                          </span>
                        </td>

                        {/* حالة الرفع والاغلاق للمركز */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          {lic.center_closure_status ? (
                            <div className="flex flex-col items-center gap-1">
                              <span 
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-bold border shadow-sm cursor-help ${getCenterClosureBadge(lic)}`}
                            title={getCenterClosureTooltip(lic)}
                          >
                            {getCenterClosureLabel(lic)}
                          </span>
                              {lic.center_closure_date && (
                                <span className="text-[14px] text-gray-600 font-bold font-mono" dir="ltr">
                                  {lic.center_closure_date}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        {/* سجل الإعادات */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          {lic.return_history && lic.return_history.length > 0 ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedLicense(lic); setShowViewModal(true); }}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold transition-colors bg-blue-50 px-2 py-1 rounded-md text-center w-full"
                            >
                              <div className="mb-0.5 text-[12px]">
                                {isRtl 
                                  ? `أعيدت ${lic.return_history.length} ${lic.return_history.length === 1 ? 'مرة' : 'مرات'}`
                                  : `Returned ${lic.return_history.length} ${lic.return_history.length === 1 ? 'time' : 'times'}`}
                              </div>
                              <div className="text-gray-600 font-normal space-y-0.5 text-center">
                                {lic.return_history.filter(h => h.status === 'returned_consultant').length > 0 && (
                                  <div>
                                    {isRtl ? 'الاستشاري:' : 'Consultant:'} {lic.return_history.filter(h => h.status === 'returned_consultant').length}
                                  </div>
                                )}
                                {lic.return_history.filter(h => h.status === 'returned_infra').length > 0 && (
                                  <div>
                                    {isRtl ? 'البنية التحتية:' : 'Infrastructure:'} {lic.return_history.filter(h => h.status === 'returned_infra').length}
                                  </div>
                                )}
                              </div>
                            </button>
                          ) : (
                            <span className="text-gray-300 text-[13px] bg-gray-50 px-2 py-1 rounded-md">
                              {isRtl ? 'لا توجد ملاحظات' : 'No notes'}
                            </span>
                          )}
                        </td>
                        {/* حالة الرخصة (الوضع) */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-semibold border ${getProcessingStatusBadge(lic)}`}>
                            {getProcessingStatusLabel(lic)}
                          </span>
                        </td>

                        {/* إجراءات */}
                        <td className="px-3 py-3 text-center whitespace-nowrap text-[15.5px]">
                          <div className="flex justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openActionLic?.id === lic.id) { setOpenActionLic(null); return; }
                                const rect = e.currentTarget.getBoundingClientRect();
                                setDropdownPos({ top: rect.bottom, left: isRtl ? rect.left : rect.right - 144 });
                                setOpenActionLic(lic);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Fixed Action Dropdown */}
          {openActionLic && (
            <div 
              className="fixed z-[9999] w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 overflow-hidden" 
              style={{ top: dropdownPos.top, left: dropdownPos.left }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedLicense(openActionLic); setShowViewModal(true); setOpenActionLic(null); }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>{isRtl ? 'عرض التفاصيل' : 'View'}</span>
              </button>

              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setOpenActionLic(null); 
                  navigate(`/reports?search=${openActionLic?.license_number || ''}`);
                }}
                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <FileText className="w-4 h-4 text-purple-600" />
                <span>{isRtl ? 'عرض البلاغ' : 'View Report'}</span>
              </button>

              {(user?.role === 'admin' || hasProjectPermission(user, openActionLic?.project, 'licenses_center_closure')) && (
                <>
                  {openActionLic?.center_closure_status === 'مرفوعة للاغلاق للمركز' && (openActionLic?.status === 'returned_consultant' || openActionLic?.status === 'returned_infra') && openActionLic?.processing_status === 'processed' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenActionLic(null); handleReuploadToCenter(openActionLic); }}
                      className="w-full text-right px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>{isRtl ? 'إعادة الرفع للمركز' : 'Re-upload to Center'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenActionLic(null); handleCenterClosure(openActionLic); }}
                      className={`w-full text-right px-4 py-2 text-sm flex items-center gap-2 transition-colors border-t border-gray-100 ${
                        openActionLic?.center_closure_status 
                          ? 'text-rose-600 hover:bg-rose-50' 
                          : 'text-blue-700 hover:bg-blue-50'
                      }`}
                    >
                      {openActionLic?.center_closure_status ? <XCircle className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                      <span>{isRtl 
                        ? (openActionLic?.center_closure_status ? 'إلغاء الرفع للمركز' : 'الرفع والإغلاق للمركز') 
                        : (openActionLic?.center_closure_status ? 'Cancel Center Submission' : 'Center Closure')
                      }</span>
                    </button>
                  )}

                  {canInfraClose && openActionLic?.center_closure_status === 'مرفوعة للاغلاق للمركز' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenActionLic(null); handleInfraClose(openActionLic); }}
                      className="w-full text-right px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors border-t border-gray-100"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{isRtl ? 'مغلقة على منصة البنية التحتية' : 'Closed on Infra Platform'}</span>
                    </button>
                  )}
                </>
              )}


              {(user?.role === 'admin' || hasProjectPermission(user, openActionLic?.project, 'licenses_review')) && (openActionLic?.processing_status === 'processing' || openActionLic?.status === 'returned_consultant' || openActionLic?.status === 'returned_infra') && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenActionLic(null); handleMarkProcessed(openActionLic); }}
                  className="w-full text-right px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isRtl ? 'مراجعة المعالجة' : 'Review Processing'}</span>
                </button>
              )}

              {(user?.role === 'admin' || hasProjectPermission(user, openActionLic?.project, 'licenses_process_send')) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenActionLic(null); handleBulkReturn([openActionLic.id]); }}
                  className="w-full text-right px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isRtl ? 'الرخص المعادة' : 'Mark Processed'}</span>
                </button>
              )}

              {(user?.role === 'admin' || hasProjectPermission(user, openActionLic?.project, 'licenses_process_send')) && (openActionLic?.status === 'returned_consultant' || openActionLic?.status === 'returned_infra') && (
                <button
                  onClick={(e) => { e.stopPropagation(); setOpenActionLic(null); handleRevertReturn(openActionLic); }}
                  className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isRtl ? 'التراجع عن إرسال الرخص المعادة' : 'Cancel Send'}</span>
                </button>
              )}

              {(user?.role === 'admin' || hasProjectPermission(user, openActionLic?.project, 'licenses_edit')) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLicense(openActionLic);
                    setFormData({
                      project: openActionLic.project || '',
                      governorate: openActionLic.governorate || 'شقراء',
                      contractor: openActionLic.contractor || '',
                      license_number: openActionLic.license_number || '',
                      consultant_office: openActionLic.consultant_office || '',
                      issue_date: openActionLic.issue_date || '',
                      expiry_date: openActionLic.expiry_date || '',
                      status: openActionLic.status || 'active',
                      notes: openActionLic.notes || '',
                      return_date: openActionLic.return_date ? openActionLic.return_date.split('T')[0] : ''
                    });
                    setShowEditModal(true);
                    setOpenActionLic(null);
                  }}
                  className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                </button>
              )}



              {(user?.role === 'admin' || hasProjectPermission(user, openActionLic?.project, 'licenses_delete')) && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(openActionLic.id, openActionLic.license_number); setOpenActionLic(null); }}
                  className="w-full text-right px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isRtl ? 'حذف' : 'Delete'}</span>
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="p-4 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{isRtl ? 'رخص بالصفحة:' : 'Rows per page:'}</span>
                <select 
                  value={limit} 
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                  className="border border-gray-200 rounded px-2 py-1 text-sm bg-white"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>{isRtl ? '500' : '500'}</option>
                  <option value={10000}>{isRtl ? 'الكل' : 'All'}</option>
                </select>
              </div>
              <div className="text-sm font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 shadow-sm flex items-center">
                <span className="text-blue-600">{isRtl ? 'صفحة' : 'Page'}</span> <span className="mx-1">{page}</span> <span className="text-blue-600">{isRtl ? 'من' : 'of'}</span> <span className="mx-1">{Math.ceil(total / limit) || 1}</span>
                <span className="mx-2 text-blue-300">|</span>
                <span className="text-blue-600">{isRtl ? 'عرض' : 'Showing'}</span> <span className="mx-1">{licenses.length}</span> <span className="text-blue-600">{isRtl ? 'من إجمالي' : 'of total'}</span> <span className="mx-1">{total}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-white transition-colors font-medium text-xs"
                >
                  {isRtl ? 'الأولى' : 'First'}
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-white transition-colors"
                >
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
                
                <span className="text-xs font-bold text-gray-700 bg-white border border-gray-200 px-3 py-2 rounded-lg">{page}</span>
                
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-white transition-colors"
                >
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(Math.ceil(total / limit))}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-white transition-colors font-medium text-xs"
                >
                  {isRtl ? 'الأخيرة' : 'Last'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: Add License */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  <span>{isRtl ? 'إضافة رخصة صادرة' : 'Add Issued License'}</span>
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'المشروع المصرح له *' : 'Authorized Project *'}</label>
                    <select
                      value={formData.project}
                      onChange={(e) => {
                        setFormData({ ...formData, project: e.target.value, governorate: '', contractor: '' });
                      }}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">{isRtl ? '-- اختر المشروع --' : '-- Select Project --'}</option>
                      {projectsList.map(proj => (
                        <option key={proj.name} value={proj.name}>{translateBrandingText(proj.name, isRtl)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'حالة الرخصة' : 'License Status'}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="active">سارية</option>
                      <option value="extended">ممددة</option>
                      <option value="closed">مغلقة</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">اسم المقاول *</label>
                    <select
                      value={formData.contractor || ''}
                      onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                      disabled={!formData.project}
                    >
                      <option value="">{isRtl ? '-- اختر المقاول --' : '-- Select Contractor --'}</option>
                      {contractorsList
                        .filter(c => (c.projects || []).includes(formData.project) || c.project === formData.project)
                        .map(c => (
                          <option key={c.id} value={c.name}>{translateBrandingText(c.name, isRtl)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'رقم الرخصة *' : 'License Number *'}</label>
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      pattern="^\d{1,7}$"
                      maxLength={7}
                      title="يجب أن يكون رقم الرخصة أرقاماً فقط ولا يزيد عن 7 أرقام"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'الاستشاري *' : 'Consultant *'}</label>
                  <input
                    type="text"
                    value={formData.consultant_office}
                    onChange={(e) => setFormData({ ...formData, consultant_office: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'تاريخ الانتهاء *' : 'Expiry Date *'}</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'المحافظة *' : 'Governorate *'}</label>
                  <select
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    disabled={!formData.project}
                  >
                    <option value="">{isRtl ? '-- اختر المحافظة --' : '-- Select Governorate --'}</option>
                    {getAllowedGovernorates(formData.project).map(gov => (
                      <option key={gov} value={gov}>{translateBrandingText(gov, isRtl)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                  <textarea
                    rows={2}
                    placeholder="أي ملاحظات إضافية..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'جاري الحفظ...' : 'حفظ الرخصة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Edit License */}
        {showEditModal && selectedLicense && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-600" />
                  <span>تعديل الرخصة ({selectedLicense.license_number})</span>
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'المشروع المصرح له *' : 'Authorized Project *'}</label>
                    <select
                      value={formData.project}
                      onChange={(e) => {
                        setFormData({ ...formData, project: e.target.value, governorate: '', contractor: '' });
                      }}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    >
                      <option value="">{isRtl ? '-- اختر المشروع --' : '-- Select Project --'}</option>
                      {projectsList.map(proj => (
                        <option key={proj.name} value={proj.name}>{translateBrandingText(proj.name, isRtl)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'حالة الرخصة' : 'License Status'}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="active">سارية</option>
                      <option value="extended">ممددة</option>
                      <option value="closed">مغلقة</option>
                      <option value="expired">الرخص المنتهية بعد فترة صلاحيتها الصادرة بـ 10 أيام</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">اسم المقاول *</label>
                    <select
                      value={formData.contractor || ''}
                      onChange={(e) => setFormData({ ...formData, contractor: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                      disabled={!formData.project}
                    >
                      <option value="">{isRtl ? '-- اختر المقاول --' : '-- Select Contractor --'}</option>
                      {contractorsList
                        .filter(c => (c.projects || []).includes(formData.project) || c.project === formData.project)
                        .map(c => (
                          <option key={c.id} value={c.name}>{translateBrandingText(c.name, isRtl)}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'رقم الرخصة *' : 'License Number *'}</label>
                    <input
                      type="text"
                      value={formData.license_number}
                      onChange={(e) => setFormData({ ...formData, license_number: e.target.value.replace(/\D/g, '') })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      pattern="^\d{1,7}$"
                      maxLength={7}
                      title="يجب أن يكون رقم الرخصة أرقاماً فقط ولا يزيد عن 7 أرقام"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'الاستشاري *' : 'Consultant *'}</label>
                  <input
                    type="text"
                    value={formData.consultant_office}
                    onChange={(e) => setFormData({ ...formData, consultant_office: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</label>
                    <input
                      type="date"
                      value={formData.issue_date}
                      onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'تاريخ الانتهاء *' : 'Expiry Date *'}</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'تاريخ الإعادة' : 'Return Date'}</label>
                    <input
                      type="date"
                      value={formData.return_date || ''}
                      onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                      className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'المحافظة *' : 'Governorate *'}</label>
                  <select
                    value={formData.governorate}
                    onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                    disabled={!formData.project}
                  >
                    <option value="">{isRtl ? '-- اختر المحافظة --' : '-- Select Governorate --'}</option>
                    {getAllowedGovernorates(formData.project).map(gov => (
                      <option key={gov} value={gov}>{translateBrandingText(gov, isRtl)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  ></textarea>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl disabled:opacity-50"
                  >
                    {submitting ? 'جاري التحديث...' : 'تحديث الرخصة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Extend / Edit Extension */}
        {showExtendModal && selectedLicense && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowExtendModal(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  <span>
                    {selectedLicense.extension_status === 'extended'
                      ? `تعديل تمديد الرخصة (${selectedLicense.license_number})`
                      : `تمديد الرخصة (${selectedLicense.license_number})`}
                  </span>
                </h3>
                <button onClick={() => setShowExtendModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* معلومات الرخصة الحالية */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-900 space-y-1">
                <p><strong>تاريخ الانتهاء الأصلي:</strong> {selectedLicense.original_expiry_date || selectedLicense.expiry_date}</p>
                {selectedLicense.extension_status === 'extended' && (
                  <>
                    <p><strong>تاريخ الانتهاء بعد التمديد:</strong> {selectedLicense.expiry_date}</p>
                    <p><strong>تاريخ التمديد السابق:</strong> {selectedLicense.extension_date || '-'}</p>
                    <div className="mt-2 pt-2 border-t border-purple-200">
                      <p className="text-purple-700 font-semibold">هذه الرخصة ممددة بالفعل — يمكنك تعديل التمديد أو إلغائه.</p>
                    </div>
                  </>
                )}
                {selectedLicense.extension_status !== 'extended' && (
                  <p className="text-[13px] text-purple-700 mt-1">
                    * تمديد الرخصة سيقوم بتحديث تاريخ الانتهاء مع إظهار شارة "ممدد" وتاريخ التمديد.
                  </p>
                )}
              </div>

              <form onSubmit={handleExtendSubmit} className="space-y-4 text-sm">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">تاريخ الانتهاء الجديد *</label>
                  <input
                    type="date"
                    value={extendData.new_expiry_date}
                    onChange={(e) => setExtendData({ ...extendData, new_expiry_date: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">تاريخ إجراء التمديد *</label>
                  <input
                    type="date"
                    value={extendData.extension_date}
                    onChange={(e) => setExtendData({ ...extendData, extension_date: e.target.value })}
                    className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                    required
                  />
                </div>

                <div className="flex flex-wrap justify-between gap-2 pt-3 border-t">
                  {/* زر إلغاء التمديد — يظهر فقط إذا كانت ممددة بالفعل */}
                  {selectedLicense.extension_status === 'extended' && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={async () => {
                        setShowExtendModal(false);
                        await handleCancelExtend(selectedLicense);
                      }}
                      className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium rounded-xl text-sm"
                    >
                      إلغاء التمديد
                    </button>
                  )}
                  <div className="flex gap-2 mr-auto">
                    <button
                      type="button"
                      onClick={() => setShowExtendModal(false)}
                      className="px-4 py-2 border rounded-xl text-gray-600 hover:bg-gray-50"
                    >
                      إغلاق
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl disabled:opacity-50"
                    >
                      {submitting ? 'جاري التمديد...' : (selectedLicense.extension_status === 'extended' ? 'تحديث التمديد' : 'تأكيد التمديد')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: View Details */}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>{isRtl ? 'سجل إعادات الرخصة' : 'License Return History'}</span>
              </h3>
              <button onClick={() => setShowHistoryModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 space-y-4">
              {showHistoryModal.return_history && showHistoryModal.return_history.length > 0 ? (
                showHistoryModal.return_history.map((hist, idx) => (
                  <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">
                        {isRtl ? (hist.status === 'returned_consultant' ? 'الاستشاري' : 'مركز البنية التحتية') : hist.status}
                      </span>
                      <span className="text-xs text-gray-500 font-mono" dir="ltr">{hist.date?.split('T')[0]}</span>
                    </div>
                    {hist.reason && (
                      <div className="text-sm text-gray-800 bg-white p-2 rounded border border-gray-100 mt-2">
                        {hist.reason}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  {isRtl ? 'لا يوجد سجل إعادات.' : 'No return history.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
        {showViewModal && selectedLicense && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowViewModal(false)}>
            <div className="bg-white rounded-2xl max-w-2xl w-[95%] sm:w-full p-4 sm:p-6 shadow-2xl border border-gray-100 space-y-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span>تفاصيل الترخيص ({selectedLicense.license_number})</span>
                </h3>
                <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm divide-y divide-gray-100">
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">رقم الرخصة:</span>
                  <span className="font-bold text-gray-900">{selectedLicense.license_number}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">المحافظة:</span>
                  <span className="font-semibold text-gray-900">{translateBrandingText(selectedLicense.governorate, isRtl)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">المشروع:</span>
                  <span className="font-semibold text-gray-900">{translateBrandingText(selectedLicense.project, isRtl) || '-'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">الاستشاري:</span>
                  <span className="font-semibold text-gray-900">{translateBrandingText(selectedLicense.consultant_office, isRtl) || '-'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">تاريخ الإصدار:</span>
                  <span className="font-semibold text-gray-900">{selectedLicense.issue_date || '-'}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">تاريخ الانتهاء الحالي:</span>
                  <span className="font-semibold text-gray-900">{selectedLicense.expiry_date || '-'}</span>
                </div>
                {/* سجل التمديد الكامل */}
                {selectedLicense.extension_status === 'extended' && (
                  <div className="pt-2 bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                      <span className="text-purple-800 font-bold text-sm">سجل التمديد</span>
                    </div>
                    {selectedLicense.original_expiry_date && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">تاريخ الانتهاء الأصلي:</span>
                        <span className="text-gray-600 line-through">{selectedLicense.original_expiry_date}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">تاريخ الانتهاء بعد التمديد:</span>
                      <span className="text-purple-800 font-bold">{selectedLicense.expiry_date}</span>
                    </div>
                    {selectedLicense.extension_date && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">تاريخ إجراء التمديد:</span>
                        <span className="text-purple-700 font-semibold">{selectedLicense.extension_date}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">الأيام المتبقية:</span>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getBadgeStyle(selectedLicense.badge_color)}`}>
                    {selectedLicense.badge_text}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-gray-500 font-medium">حالة الرخصة:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(selectedLicense)}`}>
                    {getStatusLabel(selectedLicense)}
                  </span>
                </div>
                {selectedLicense.status === 'closed' && selectedLicense.closed_date && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500 font-medium">تاريخ الإغلاق:</span>
                    <span className="font-semibold text-gray-900">{selectedLicense.closed_date}</span>
                  </div>
                )}
                {selectedLicense.status === 'closed' && selectedLicense.closed_by_name && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500 font-medium">أُغلقت بواسطة:</span>
                    <span className="font-semibold text-gray-900">{selectedLicense.closed_by_name}</span>
                  </div>
                )}
                {selectedLicense.return_date && (
                  <div className="pt-2 flex justify-between">
                    <span className="text-gray-500 font-medium">تاريخ الإعادة:</span>
                    <span className="font-semibold text-rose-600">{selectedLicense.return_date.split('T')[0]}</span>
                  </div>
                )}
                {selectedLicense.notes && (
                  <div className="pt-2 space-y-1">
                    <span className="text-gray-500 font-medium block">الملاحظات:</span>
                    <div className="bg-gray-50 p-3 rounded-xl text-gray-700 text-xs whitespace-pre-wrap">
                      {selectedLicense.notes}
                    </div>
                  </div>
                )}
                {/* ===== UNIFIED HISTORY TIMELINE ===== */}
                {(selectedLicense.return_history && selectedLicense.return_history.length > 0) ? (
                  <div className="pt-4 space-y-3 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      <span>السجل الزمني الكامل للإعادات والمعالجة</span>
                    </h4>
                    {/* Stats row */}
                    <div className="flex gap-3 mb-4 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                        إجمالي الإعادات: {selectedLicense.return_history.length}
                      </span>
                      {selectedLicense.return_history.filter(h => h.status === 'returned_consultant').length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                          الاستشاري: {selectedLicense.return_history.filter(h => h.status === 'returned_consultant').length}
                        </span>
                      )}
                      {selectedLicense.return_history.filter(h => h.status === 'returned_infra').length > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          البنية التحتية: {selectedLicense.return_history.filter(h => h.status === 'returned_infra').length}
                        </span>
                      )}
                    </div>
                    {/* Return entries */}
                    <div className="space-y-4">
                      {selectedLicense.return_history.map((hist, idx) => {
                        const ordinals = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة','السادسة','السابعة','الثامنة','التاسعة','العاشرة'];
                        const ordinal = ordinals[idx] || (idx+1).toString();
                        const isConsultant = hist.status === 'returned_consultant';
                        const dateStr = hist.date ? hist.date.split('T')[0].split('-').reverse().join('/') : '-';
                        
                        // Find related process actions
                        const nextReturnDate = selectedLicense.return_history[idx + 1] ? selectedLicense.return_history[idx + 1].date : null;
                        const relatedProcesses = selectedLicense.full_history 
                          ? selectedLicense.full_history.filter(h => h.action === 'process' && h.date >= hist.date && (!nextReturnDate || h.date < nextReturnDate))
                          : [];
                          
                        // Fallback: last processed image if no full_history and it's the last return
                        const isLastReturn = idx === selectedLicense.return_history.length - 1;
                        const hasFallbackProcess = isLastReturn && (selectedLicense.processed_reason || selectedLicense.processed_image_url) && (!selectedLicense.full_history || selectedLicense.full_history.filter(h => h.action === 'process').length === 0);

                        return (
                          <div key={idx} className="space-y-3">
                            <div className={`p-4 rounded-xl border-r-4 ${isConsultant ? 'bg-orange-50 border-r-orange-400 border border-orange-200' : 'bg-red-50 border-r-red-400 border border-red-200'}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${isConsultant ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>
                                  المرة {ordinal} — {isConsultant ? 'إعادة من الاستشاري' : 'إعادة من البنية التحتية'}
                                </span>
                                <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded border" dir="ltr">{dateStr}</span>
                              </div>
                              {hist.reason && (
                                <div className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border border-gray-100 mt-2 whitespace-pre-wrap">
                                  <span className="text-gray-400 text-xs block mb-1">سبب الإعادة:</span>
                                  {hist.reason}
                                </div>
                              )}
                              {hist.image_url && (
                                <div className="mt-3">
                                  <span className="text-gray-400 text-xs block mb-1">صورة الإعادة:</span>
                                  <a href={hist.image_url} target="_blank" rel="noopener noreferrer">
                                    <img
                                      src={hist.image_url}
                                      alt={`صورة الإعادة المرة ${ordinal}`}
                                      className="w-full max-h-52 object-contain rounded-xl border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity bg-white"
                                    />
                                    <span className="text-xs text-blue-600 underline mt-1 block text-center">اضغط لعرض الصورة كاملة</span>
                                  </a>
                                </div>
                              )}
                            </div>
                            
                            {/* Render corresponding responses directly underneath */}
                            {relatedProcesses.map((phist, pidx) => {
                              const pdateStr = phist.date ? phist.date.split('T')[0].split('-').reverse().join('/') : '-';
                              return (
                                <div key={`proc-${pidx}`} className="p-4 mr-6 sm:mr-10 rounded-xl border-r-4 border-r-emerald-400 border border-emerald-200 bg-emerald-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                      ✅ الرد الخاص بـ {isConsultant ? 'الاستشاري' : 'البنية التحتية'}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono bg-white px-2 py-0.5 rounded border" dir="ltr">{pdateStr}</span>
                                  </div>
                                  {phist.reason && (
                                    <div className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border border-gray-100 mt-2 whitespace-pre-wrap">
                                      <span className="text-gray-400 text-xs block mb-1">ملاحظة المعالجة:</span>
                                      {phist.reason}
                                    </div>
                                  )}
                                  {phist.image_url && (
                                    <div className="mt-3">
                                      <span className="text-gray-400 text-xs block mb-1">صورة الإصلاح:</span>
                                      <a href={phist.image_url} target="_blank" rel="noopener noreferrer">
                                        <img
                                          src={phist.image_url}
                                          alt="صورة المعالجة"
                                          className="w-full max-h-52 object-contain rounded-xl border border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity bg-white"
                                        />
                                        <span className="text-xs text-blue-600 underline mt-1 block text-center">اضغط لعرض الصورة كاملة</span>
                                      </a>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                            
                            {hasFallbackProcess && (
                               <div className="p-4 mr-6 sm:mr-10 rounded-xl border-r-4 border-r-emerald-400 border border-emerald-200 bg-emerald-50">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                      ✅ الرد الخاص بـ {isConsultant ? 'الاستشاري' : 'البنية التحتية'}
                                    </span>
                                  </div>
                                  {selectedLicense.processed_reason && (
                                    <div className="text-sm text-gray-800 bg-white p-2.5 rounded-lg border border-gray-100 mt-2 whitespace-pre-wrap">
                                      {selectedLicense.processed_reason}
                                    </div>
                                  )}
                                  {selectedLicense.processed_image_url && (
                                    <a href={selectedLicense.processed_image_url} target="_blank" rel="noopener noreferrer">
                                      <img src={selectedLicense.processed_image_url} alt="صورة المعالجة" className="w-full max-h-52 object-contain rounded-xl border border-emerald-200 cursor-pointer hover:opacity-90 mt-2 bg-white" />
                                      <span className="text-xs text-blue-600 underline mt-1 block text-center">اضغط لعرض الصورة كاملة</span>
                                    </a>
                                  )}
                               </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedLicense.return_reason && (
                      <div className="pt-2 space-y-1">
                        <span className="text-gray-500 font-medium block">📋 سبب الإعادة:</span>
                        <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl text-orange-800 text-xs whitespace-pre-wrap font-medium">
                          {selectedLicense.return_reason}
                        </div>
                      </div>
                    )}
                    {selectedLicense.return_image_url && (
                      <div className="pt-2 space-y-1">
                        <span className="text-gray-500 font-medium block">🖼 صورة الإعادة:</span>
                        <a href={selectedLicense.return_image_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedLicense.return_image_url} alt="صورة الإعادة" className="w-full max-h-48 object-contain rounded-xl border border-orange-200 cursor-pointer hover:opacity-90 transition-opacity" />
                          <span className="text-xs text-blue-600 underline mt-1 block text-center">اضغط لعرض الصورة كاملة</span>
                        </a>
                      </div>
                    )}
                    {selectedLicense.processed_reason && (
                      <div className="pt-2 space-y-1">
                        <span className="text-gray-500 font-medium block">✅ ملاحظة المعالجة:</span>
                        <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-xs whitespace-pre-wrap font-medium">
                          {selectedLicense.processed_reason}
                        </div>
                      </div>
                    )}
                    {selectedLicense.processed_image_url && (
                      <div className="pt-2 space-y-1">
                        <span className="text-gray-500 font-medium block">🖼 صورة الإصلاح:</span>
                        <a href={selectedLicense.processed_image_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedLicense.processed_image_url} alt="صورة المعالجة" className="w-full max-h-48 object-contain rounded-xl border border-emerald-200 cursor-pointer hover:opacity-90 transition-opacity" />
                          <span className="text-xs text-blue-600 underline mt-1 block text-center">اضغط لعرض الصورة كاملة</span>
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
