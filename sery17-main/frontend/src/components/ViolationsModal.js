import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { translateBrandingText } from '../utils/brandingTranslation';
import { resolveImageUrl } from '../utils/imageUrl';
import { Plus, X, Upload, Camera, Trash2, Eye, Edit2, AlertTriangle, MoreVertical, Download, FileText, Calendar, MapPin, Briefcase, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = {
  date: '',
  project: '',
  governorate: '',
  violation_type: '',
  notes: '',
  images: [],
};

export default function ViolationsModal({ user, projectGovs = {}, onClose, isOpen, isFullScreen, type = 'safety' }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const d = (ar, en) => (isRtl ? ar : en);

  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [viewViolation, setViewViolation] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const titleText = type === 'quality' ? d('مخالفات الجودة', 'Quality Violations') : d('مخالفات السلامة', 'Safety Violations');
  const subTitleText = type === 'quality' ? d('إدارة وعرض مخالفات الجودة الميدانية', 'Manage and view quality violations') : d('إدارة وعرض مخالفات السلامة الميدانية', 'Manage and view field safety violations');

  const [filterGov, setFilterGov] = useState('');
  const [filterProj, setFilterProj] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [appliedFilterGov, setAppliedFilterGov] = useState('');
  const [appliedFilterProj, setAppliedFilterProj] = useState('');
  const [appliedFilterDate, setAppliedFilterDate] = useState('');

  const [activeNotesReportId, setActiveNotesReportId] = useState(null);
  const [consultantNote, setConsultantNote] = useState('');
  const [consultantReply, setConsultantReply] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [notePopupAction, setNotePopupAction] = useState('save_only');

  const hasPermission = (permKey) => {
    if (user?.role === 'admin') return true;
    if ((user?.permissions || []).includes(permKey)) return true;
    const pp = user?.project_permissions || {};
    return Object.values(pp).some(perms => (perms || []).includes(permKey));
  };

  const allowedProjects = user?.role === 'admin'
    ? Object.keys(projectGovs)
    : (user?.projects || []);

  const getAllowedGovernorates = () => {
    if (!form.project) return [];
    const govsList = projectGovs[form.project] || [];
    if (user?.role !== 'admin' && user?.governorates?.length > 0) {
      const hasAll = user.governorates.some(g => ['الكل', 'جميع المحافظات', 'كل المحافظات'].includes(g));
      if (!hasAll) return govsList.filter(g => user.governorates.includes(g));
    }
    return govsList;
  };

  const fetchViolations = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/violations?type=${type}`, { headers: { Authorization: `Bearer ${token}` } });
      setViolations(res.data || []);
    } catch (err) {
      toast.error(d('فشل تحميل المخالفات', 'Failed to load violations'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen || isFullScreen) fetchViolations();
  }, [isOpen, isFullScreen, fetchViolations]);

  const openNotesModal = (violation) => {
    setActiveNotesReportId(violation.id);
    setConsultantNote(violation.consultant_note || '');
    setConsultantReply(violation.consultant_reply || '');
  };

  const handleSaveNote = async () => {
    if (!activeNotesReportId) return;
    if (isSavingNote) return;
    setIsSavingNote(true);
    const token = localStorage.getItem('token');
    
    let isProcessed = false;
    if (notePopupAction === 'save_and_close') {
      isProcessed = true;
    }

    try {
      setViolations(prev => prev.map(rep => rep.id === activeNotesReportId ? { ...rep, consultant_note: consultantNote, consultant_reply: consultantReply, report_note_processed: isProcessed } : rep));
      toast.success(isRtl ? 'تم حفظ الملاحظة بنجاح' : 'Note saved successfully');
      
      if (notePopupAction === 'save_and_close') {
        setActiveNotesReportId(null);
      }

      await axios.put(`${API}/violations/${activeNotesReportId}`, { 
        consultant_note: consultantNote,
        consultant_reply: consultantReply,
        report_note_processed: isProcessed
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchViolations();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ');
    } finally {
      setIsSavingNote(false);
      setNotePopupAction('save_only');
    }
  };

  const compressImage = async (file) => {
    const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1200, useWebWorker: true, initialQuality: 0.75 };
    try { return await imageCompression(file, options); }
    catch { return file; }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const newPreviews = [...imagePreviews];
      const newImages = [...(form.images || [])];
      for (const file of files) {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          let base64pdf = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/compress-pdf`, { pdf: base64pdf }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data && res.data.pdf) base64pdf = res.data.pdf;
          } catch (e) { console.error('PDF compression failed', e); }
          newPreviews.push({ type: 'pdf', data: base64pdf, name: file.name });
          newImages.push({ type: 'pdf', data: base64pdf, name: file.name });
        } else {
          const compressed = await compressImage(file);
          const result = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(compressed);
          });
          newPreviews.push({ type: 'image', data: result });
          newImages.push({ type: 'image', data: result });
        }
      }
      setImagePreviews(newPreviews);
      setForm(prev => ({ ...prev, images: newImages }));
      toast.success(d('تم إضافة الملفات وضغطها بنجاح', 'Files added and compressed successfully'));
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const base64ToBlob = (base64String) => {
    try {
      const parts = base64String.split(';base64,');
      if (parts.length !== 2) return null;
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: contentType });
    } catch {
      return null;
    }
  };

  const openPdfViewer = (e, dataUrl) => {
    e.stopPropagation();
    try {
      if (dataUrl.startsWith('data:')) {
        const blob = base64ToBlob(dataUrl);
        if (blob) {
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
          return;
        }
      }
      window.open(dataUrl, '_blank');
    } catch (err) {
      console.error(err);
      window.open(dataUrl, '_blank');
    }
  };

  const handleViewViolation = async (v) => {
    toast.info(isRtl ? 'جاري التحميل...' : 'Loading...', { autoClose: false, toastId: 'loadingReport' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/violations/${v.id}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.dismiss('loadingReport');
      setViewViolation(res.data);
    } catch (err) {
      toast.dismiss('loadingReport');
      toast.error('Error loading details');
    }
  };

  const handleDownloadFiles = async (v) => {
    let fullV = v;
    if (fullV.images === undefined) {
      toast.info(isRtl ? 'جاري تجهيز الملف...' : 'Preparing file...', { autoClose: false, toastId: 'loadingReport' });
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/violations/${v.id}`, { headers: { Authorization: `Bearer ${token}` }});
        toast.dismiss('loadingReport');
        fullV = res.data;
      } catch (err) {
        toast.dismiss('loadingReport');
        toast.error('Error loading details');
        return;
      }
    }

    if (!fullV.images || fullV.images.length === 0) return;
    fullV.images.forEach((img, idx) => {
      const isString = typeof img === 'string';
      const isPdf = !isString && img.type === 'pdf';
      const dataUrl = isString ? resolveImageUrl(img) : (img.data ? img.data : resolveImageUrl(img));
      
      const extension = isPdf ? 'pdf' : 'jpg';
      const name = (!isString && img.name) ? img.name : `violation_${v.date || 'file'}_${idx + 1}.${extension}`;
      
      try {
        if (isPdf && dataUrl.startsWith('data:')) {
          const blob = base64ToBlob(dataUrl);
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
            return;
          }
        }
      } catch (e) { console.error(e); }
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success(d('بدأ التحميل...', 'Download started...'));
  };

  const removeImage = (idx) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setImagePreviews([]);
    setShowForm(true);
  };

  const openEdit = async (v) => {
    let full = v;
    toast.info(isRtl ? 'جاري التحميل...' : 'Loading...', { autoClose: false, toastId: 'loadingReport' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/violations/${v.id}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.dismiss('loadingReport');
      full = res.data;
    } catch (err) {
      toast.dismiss('loadingReport');
      toast.error('Error loading details');
      return;
    }
    setEditingId(full.id);
    setForm({
      date: full.date || '',
      project: full.project || '',
      governorate: full.governorate || '',
      violation_type: full.violation_type || '',
      notes: full.notes || '',
      images: full.images || [],
    });
    setImagePreviews(full.images || []);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting || uploading) return;
    if (!form.date || !form.project || !form.governorate || !form.violation_type.trim()) {
      toast.error(d('يرجى ملء جميع الحقول المطلوبة', 'Please fill all required fields'));
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      const formToSave = { ...form, type };
      if (editingId) {
        await axios.put(`${API}/violations/${editingId}`, formToSave, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(d('تم تحديث المخالفة بنجاح', 'Violation updated successfully'));
      } else {
        await axios.post(`${API}/violations`, formToSave, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(d('تم حفظ المخالفة بنجاح', 'Violation saved successfully'));
      }
      setShowForm(false);
      fetchViolations();
    } catch (err) {
      toast.error(err.response?.data?.detail || d('حدث خطأ', 'Error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(d('هل تريد حذف هذه المخالفة؟', 'Delete this violation?'))) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/violations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(d('تم الحذف بنجاح', 'Deleted successfully'));
      fetchViolations();
    } catch {
      toast.error(d('فشل الحذف', 'Delete failed'));
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      setViolations(prev => prev.map(v => v.id === id ? { ...v, status: newStatus } : v));
      await axios.put(`${API}/violations/${id}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(d('تم تحديث الحالة بنجاح', 'Status updated successfully'));
    } catch (err) {
      toast.error(d('فشل تحديث الحالة', 'Failed to update status'));
      fetchViolations();
    }
  };

  if (!isOpen && !isFullScreen) return null;

  const allowedGovsList = getAllowedGovernorates();
  const allowedProjectsList = [...new Set(allowedProjects)];
  if (form.project && !allowedProjectsList.includes(form.project)) allowedProjectsList.push(form.project);

  const overlayClass = isFullScreen ? '' : "fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4";
  const modalClass = isFullScreen ? "w-full flex flex-col" : "bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl";

  const handleSearch = () => {
    setAppliedFilterGov(filterGov);
    setAppliedFilterProj(filterProj);
    setAppliedFilterDate(filterDate);
    setCurrentPage(1);
  };

  useEffect(() => {
    setAppliedFilterDate(filterDate);
    setCurrentPage(1);
  }, [filterDate]);

  const handleReset = () => {
    setFilterGov('');
    setFilterProj('');
    setFilterDate('');
    setAppliedFilterGov('');
    setAppliedFilterProj('');
    setAppliedFilterDate('');
    setCurrentPage(1);
  };

  const getFilterGovsList = () => {
    let govs = [];
    if (user?.role === 'admin') {
      govs = [...new Set(violations.map(v => v.governorate).filter(Boolean))];
    } else {
      govs = user?.governorates || [];
    }
    if (filterProj) {
      const projGovs = [...new Set(violations.filter(v => v.project === filterProj).map(v => v.governorate).filter(Boolean))];
      return govs.filter(g => projGovs.includes(g));
    }
    return govs;
  };

  const filteredViolations = violations.filter(v => {
    if (appliedFilterGov && v.governorate !== appliedFilterGov) return false;
    if (appliedFilterProj && v.project !== appliedFilterProj) return false;
    if (appliedFilterDate && v.date !== appliedFilterDate) return false;
    return true;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentViolations = filteredViolations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);

  return (
    <>
      {/* Overlay */}
      <div className={overlayClass} onClick={() => !showForm && !isFullScreen && onClose && onClose()}>
        <div
          className={modalClass}
          dir={isRtl ? 'rtl' : 'ltr'}
          onClick={e => !isFullScreen && e.stopPropagation()}
        >
          {/* Header */}
          {!isFullScreen && (
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 rounded-t-2xl flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{titleText}</h2>
                  <p className="text-red-100 text-xs">{subTitleText}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={openAdd}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white text-red-600 rounded-xl hover:bg-red-50 font-bold text-sm transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {d('إضافة مخالفة', 'Add Violation')}
                </button>
                <button onClick={onClose} className="p-2 text-white hover:text-red-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Filters Section */}
          {!showForm && (
            <div className="bg-gray-50/50 border-b border-gray-100 p-4 shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="date"
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 outline-none text-sm text-gray-700 bg-white"
                />
                <select
                  value={filterProj}
                  onChange={e => {
                    setFilterProj(e.target.value);
                    setFilterGov(''); // Reset Gov when Proj changes
                    if (!e.target.value) {
                       setAppliedFilterProj('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 outline-none text-sm text-gray-700 bg-white"
                >
                  <option value="">{isRtl ? 'جميع المشاريع' : 'All Projects'}</option>
                  {allowedProjectsList.map(p => (
                    <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
                <select
                  value={filterGov}
                  onChange={e => {
                    setFilterGov(e.target.value);
                    if (!e.target.value) {
                       setAppliedFilterGov('');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-200 outline-none text-sm text-gray-700 bg-white"
                >
                  <option value="">{isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>
                  {getFilterGovsList().map(g => (
                    <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 font-bold text-sm"
                  >
                    <Search className="w-4 h-4" />
                    {isRtl ? 'بحث' : 'Search'}
                  </button>
                  {(appliedFilterDate || appliedFilterGov || appliedFilterProj || filterDate || filterGov || filterProj) && (
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-all font-bold text-sm border border-dashed border-red-200 shrink-0"
                    >
                      {isRtl ? 'إلغاء' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {isFullScreen && !showForm && (
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500">{subTitleText}</p>
              <button
                onClick={openAdd}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold text-sm transition-all shadow-md"
              >
                <Plus className="w-5 h-5" />
                {d('إضافة مخالفة', 'Add Violation')}
              </button>
            </div>
          )}

          {/* Content */}
          {showForm && isFullScreen ? null : (
            <div className={isFullScreen ? "flex-1" : "flex-1 overflow-y-auto p-4"}>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400">
                <svg className="animate-spin w-8 h-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {d('جاري التحميل...', 'Loading...')}
              </div>
            ) : violations.length === 0 ? (
              <div className="text-center py-16">
                <AlertTriangle className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">{d('لا توجد مخالفات مسجلة', 'No violations recorded')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentViolations.map((v, idx) => (
                  <div key={v.id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm flex items-center justify-center">
                        {indexOfFirstItem + idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3 w-full lg:w-11/12">
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-red-100 text-red-800 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-1.5 bg-red-50 rounded-lg shrink-0"><Calendar className="w-4 h-4 text-red-500" /></div>
                            <span className="truncate">{v.date || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-100 text-blue-800 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-1.5 bg-blue-50 rounded-lg shrink-0"><MapPin className="w-4 h-4 text-blue-500" /></div>
                            <span className="truncate" title={translateBrandingText(v.governorate, isRtl)}>{translateBrandingText(v.governorate, isRtl) || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm hover:shadow-md transition-shadow">
                            <div className="p-1.5 bg-slate-50 rounded-lg shrink-0"><Briefcase className="w-4 h-4 text-slate-500" /></div>
                            <span className="truncate" title={translateBrandingText(v.project, isRtl)}>{translateBrandingText(v.project, isRtl) || '-'}</span>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-red-700 truncate">⚠ {v.violation_type || '-'}</p>
                        {v.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{v.notes}</p>}
                        <p className="text-xs text-gray-400 mt-1">{d('بواسطة:', 'By:')} {v.created_by || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${v.status === 'تمت المعالجة' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-700 text-white shadow-slate-200'}`}>
                        {v.status || (isRtl ? 'قيد المعالجة' : 'Processing')}
                      </span>
                      <DropdownMenu dir={isRtl ? 'rtl' : 'ltr'}>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-xl transition-all hover:bg-red-100 text-gray-500 hover:text-red-700">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white shadow-2xl border border-slate-100 rounded-2xl p-1 z-[75]">
                          <div className="py-1">
                            <DropdownMenuItem
                              onClick={() => handleViewViolation(v)}
                              className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-red-600" /> {d('عرض المخالفة', 'View Violation')}
                            </DropdownMenuItem>

                            {(!v.report_note_processed || user?.role === 'admin' || String(user?.level) === '1' || (user?.role !== 'admin' && user?.can_create_subusers) || (user?.role !== 'admin' && !user?.can_create_subusers)) && (
                              <DropdownMenuItem
                                onClick={() => openNotesModal(v)}
                                className="w-full text-right px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer relative"
                              >
                                <FileText className="w-4 h-4 text-amber-600" /> {isRtl ? 'اضافة ملاحظة للمخالفة' : 'Add Note to Violation'}
                                {v.consultant_note && !v.report_note_processed && (
                                  <span className="absolute left-2 top-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                )}
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(v.id, v.status === 'تمت المعالجة' ? 'قيد المعالجة' : 'تمت المعالجة')}
                              className="w-full text-right px-4 py-2.5 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                            >
                              {v.status === 'تمت المعالجة' ? (
                                <>⏳ <span className="text-orange-600">{isRtl ? 'تغيير إلى قيد المعالجة' : 'Mark as Processing'}</span></>
                              ) : (
                                <>✅ <span className="text-emerald-600">{isRtl ? 'تغيير إلى تمت المعالجة' : 'Mark as Processed'}</span></>
                              )}
                            </DropdownMenuItem>
                          </div>
                          
                          <div className="py-1 bg-slate-50/50 border-t border-slate-100">
                            {(hasPermission('safety_reports_edit') || hasPermission('business_reports_edit')) && !(user?.role !== 'admin' && user?.can_create_subusers) && (
                              <DropdownMenuItem
                                onClick={() => openEdit(v)}
                                className="w-full text-right px-4 py-2.5 text-sm text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                              >
                                <Edit2 className="w-4 h-4 text-yellow-600" /> {d('تعديل', 'Edit')}
                              </DropdownMenuItem>
                            )}
                            
                            {(hasPermission('safety_reports_delete') || hasPermission('business_reports_delete')) && !(user?.role !== 'admin' && user?.can_create_subusers) && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(v.id)}
                                className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors font-semibold rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" /> {d('حذف', 'Delete')}
                              </DropdownMenuItem>
                            )}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination Controls inside the Card */}
            {filteredViolations.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 flex flex-col lg:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">{isRtl ? 'عدد المخالفات في الصفحة:' : 'Violations per page:'}</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="text-sm font-bold text-red-900 bg-red-50 px-4 py-2 rounded-xl border border-red-100 shadow-sm">
                  <span className="text-red-600">{isRtl ? 'صفحة' : 'Page'}</span> {currentPage} <span className="text-red-600">{isRtl ? 'من' : 'of'}</span> {totalPages || 1} 
                  <span className="mx-2 text-red-300">|</span> 
                  <span className="text-red-600">{isRtl ? 'عرض' : 'Showing'}</span> {currentViolations.length} <span className="text-red-600">{isRtl ? 'مخالفات من إجمالي' : 'violations of total'}</span> {filteredViolations.length}
                </div>
                
                <div className="flex items-center gap-2" dir="ltr">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    }`}
                  >
                    {isRtl ? 'الأولى' : 'First'}
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    }`}
                  >
                    {isRtl ? 'السابق' : 'Previous'}
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
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-9 h-9 rounded-lg font-bold text-sm transition-all flex items-center justify-center ${
                            currentPage === pageNum
                              ? 'bg-red-600 text-white shadow-md transform scale-105'
                              : 'bg-white text-gray-600 border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === totalPages || totalPages === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    }`}
                  >
                    {isRtl ? 'التالي' : 'Next'}
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === totalPages || totalPages === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                    }`}
                  >
                    {isRtl ? 'الأخيرة' : 'Last'}
                  </button>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className={isFullScreen ? "w-full animate-fade-in" : "fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4"} onClick={() => !isFullScreen && setShowForm(false)}>
          <div className={isFullScreen ? "bg-white w-full" : "bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl"} dir={isRtl ? 'rtl' : 'ltr'} onClick={e => !isFullScreen && e.stopPropagation()}>
            {isFullScreen ? (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 border-r-4 border-red-500 pr-4">
                  {editingId ? d('تعديل المخالفة', 'Edit Violation') : d('إضافة مخالفة', 'Add Violation')}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 text-gray-600 font-bold">
                  <span className="text-2xl leading-none">{isRtl ? '←' : '→'}</span>
                  <span>{isRtl ? 'الرجوع للقائمة' : 'Back to list'}</span>
                </button>
              </div>
            ) : (
              <div className="sticky top-0 bg-red-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingId ? d('تعديل المخالفة', 'Edit Violation') : d('إضافة مخالفة', 'Add Violation')}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-white hover:text-red-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}
            
<form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Date & Governorate */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {d('التاريخ', 'Date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {d('المحافظة', 'Governorate')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={form.governorate}
                    onChange={e => setForm({ ...form, governorate: e.target.value })}
                    disabled={!form.project}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm disabled:opacity-50"
                  >
                    <option value="">{d('اختر المحافظة', 'Select Governorate')}</option>
                    {allowedGovsList.map(g => (
                      <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {d('المشروع', 'Project')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.project}
                  onChange={e => setForm({ ...form, project: e.target.value, governorate: '' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm"
                >
                  <option value="">{d('اختر المشروع', 'Select Project')}</option>
                  {allowedProjectsList.map(p => (
                    <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
              </div>

              {/* Violation Type - Manual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {d('نوع المخالفة', 'Violation Type')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={d('اكتب نوع المخالفة يدوياً...', 'Type violation type manually...')}
                  value={form.violation_type}
                  onChange={e => setForm({ ...form, violation_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {d('الملاحظات', 'Notes')}
                </label>
                <textarea
                  rows={3}
                  placeholder={d('ملاحظات إضافية...', 'Additional notes...')}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none resize-none text-sm"
                />
              </div>

              {/* Images */}
              <div className="border-t pt-4">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  📷 {d('صور المخالفة', 'Violation Images')}
                  <span className="text-xs font-normal text-gray-400 mr-2">{d('(تُضغط تلقائياً إلى 100KB)', '(auto-compressed to 100KB)')}</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-200 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                    <Upload className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-600 font-medium">{d('رفع ملفات', 'Upload Files')}</span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={uploading}
                    />
                  </label>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-200 rounded-xl cursor-pointer hover:bg-red-50 transition-colors">
                    <Camera className="w-5 h-5 text-red-400" />
                    <span className="text-sm text-red-600 font-medium">{d('كاميرا', 'Camera')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={uploading}
                    />
                  </label>
                </div>
                {uploading && (
                  <p className="text-sm text-red-500 animate-pulse mb-2">
                    ⏳ {d('جاري ضغط الصور...', 'Compressing images...')}
                  </p>
                )}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imagePreviews.map((imgObj, idx) => {
                      const isString = typeof imgObj === 'string';
                      const isPdf = !isString && imgObj.type === 'pdf';
                      const src = isString ? resolveImageUrl(imgObj) : (isPdf ? null : resolveImageUrl(imgObj.data));
                      
                      return (
                        <div key={idx} className="relative group">
                          {isPdf ? (
                            <div 
                              className="w-20 h-20 bg-red-50 hover:bg-red-100 transition-colors flex flex-col items-center justify-center rounded-xl border-2 border-red-200 cursor-pointer"
                              onClick={(e) => openPdfViewer(e, imgObj.data)}
                            >
                              <FileText className="text-red-500 w-8 h-8 mb-1" />
                              <span className="text-[9px] text-red-700 font-bold px-1 text-center line-clamp-1 w-full truncate">{imgObj.name || 'PDF'}</span>
                            </div>
                          ) : (
                            <img
                              src={src}
                              alt=""
                              className="w-20 h-20 rounded-xl object-cover border-2 border-red-200 cursor-zoom-in"
                              onClick={() => setZoomedImage(isString ? imgObj : imgObj.data)}
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 shadow-md z-10"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className={`flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm transition-all ${
                    isSubmitting || uploading ? 'opacity-60 cursor-not-allowed' : 'hover:bg-red-700 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting
                    ? d('جاري الحفظ...', 'Saving...')
                    : uploading
                    ? d('جاري رفع الصور...', 'Uploading...')
                    : editingId
                    ? d('حفظ التعديلات', 'Save Changes')
                    : d('إضافة مخالفة', 'Add Violation')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all text-sm"
                >
                  {d('إلغاء', 'Cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View violation images */}
      {viewViolation && (
        <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4" onClick={() => setViewViolation(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-lg flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 inline mr-2" />
                {viewViolation.violation_type}
              </h3>
              <div className="flex items-center gap-2">
                {viewViolation.images?.length > 0 && (
                  <button 
                    onClick={() => handleDownloadFiles(viewViolation)} 
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors"
                  >
                    <Download className="w-4 h-4" /> {d('تحميل الملفات', 'Download Files')}
                  </button>
                )}
                <button onClick={() => setViewViolation(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mb-2">
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs">{viewViolation.date}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">{viewViolation.governorate}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs">{viewViolation.project}</span>
            </div>
            {viewViolation.notes && <p className="text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">{viewViolation.notes}</p>}
            <div className="flex flex-wrap gap-3 mt-4">
              {(viewViolation.images || []).map((img, idx) => {
                const isString = typeof img === 'string';
                const isPdf = !isString && img.type === 'pdf';
                const dataUrl = isString ? resolveImageUrl(img) : (img.data ? img.data : resolveImageUrl(img));
                
                if (isPdf) {
                  return (
                    <div 
                      key={idx} 
                      className="w-36 h-36 rounded-xl flex flex-col items-center justify-center border-2 border-red-200 bg-red-50 hover:bg-red-100 cursor-pointer transition-all shadow-sm hover:shadow-md" 
                      onClick={(e) => openPdfViewer(e, dataUrl)}
                      title={d('فتح ملف PDF', 'Open PDF')}
                    >
                      <FileText className="w-12 h-12 text-red-500 mb-2" />
                      <span className="text-xs text-red-700 font-bold px-3 text-center line-clamp-2">{img.name || 'PDF Document'}</span>
                    </div>
                  );
                } else {
                  return (
                    <img
                      key={idx}
                      src={dataUrl}
                      alt=""
                      className="w-36 h-36 rounded-xl object-cover border-2 border-gray-200 cursor-zoom-in hover:border-red-400 transition-colors shadow-sm"
                      onClick={() => setZoomedImage(dataUrl)}
                    />
                  );
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* Consultant Notes Modal */}
      {activeNotesReportId && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" dir={isRtl ? 'rtl' : 'ltr'} onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <FileText className="w-6 h-6 animate-pulse" /> {isRtl ? 'اضافة ملاحظة' : 'Add Note'}
              </h3>
              <button onClick={() => setActiveNotesReportId(null)} className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1.5"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* خانة ملاحظة الاستشاري (للمستوى 1 و 2) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">📝</span>
                  {isRtl ? 'ملاحظة' : 'Note'}
                </label>
                <textarea 
                  value={consultantNote}
                  onChange={e => setConsultantNote(e.target.value)}
                  disabled={!(user?.role === 'admin' || String(user?.level) === '1' || (user?.role !== 'admin' && !user?.can_create_subusers))}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none resize-y text-base text-gray-700 bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-500 min-h-[150px] transition-all"
                  placeholder={isRtl ? 'اكتب ملاحظتك هنا...' : 'Type note here...'}
                />
              </div>

              {/* الديكور الفاصل */}
              <div className="flex items-center justify-center py-2 relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-gray-200"></div></div>
                <div className="relative bg-white px-4 text-gray-400 text-xs font-bold rounded-full border border-gray-100 flex items-center gap-1.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  {isRtl ? 'الرد والإفادة' : 'Reply & Feedback'}
                </div>
              </div>

              {/* خانة الرد (للمستوى 3) */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-800">
                  <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">💬</span>
                  {isRtl ? 'الرد' : 'Reply'}
                </label>
                <textarea 
                  value={consultantReply}
                  onChange={e => setConsultantReply(e.target.value)}
                  disabled={!(user?.role === 'admin' || String(user?.level) === '1' || (user?.role !== 'admin' && user?.can_create_subusers))}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none resize-y text-base text-gray-700 bg-blue-50/10 disabled:bg-gray-100 disabled:text-gray-500 min-h-[150px] transition-all"
                  placeholder={isRtl ? 'اكتب الرد هنا...' : 'Type reply here...'}
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setActiveNotesReportId(null)} 
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:text-gray-800 font-bold transition-colors text-sm"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
              <button 
                onClick={() => {
                  setNotePopupAction('save_and_close');
                  setTimeout(handleSaveNote, 0);
                }}
                disabled={isSavingNote}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-sm shadow-emerald-200 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingNote && notePopupAction === 'save_and_close' ? <span className="animate-spin text-lg leading-none">⏳</span> : '📨'} {isRtl ? 'حفظ وإرسال' : 'Save & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed image */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <img src={resolveImageUrl(zoomedImage)} alt="" className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" />
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors"
            onClick={() => setZoomedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </>
  );
}
