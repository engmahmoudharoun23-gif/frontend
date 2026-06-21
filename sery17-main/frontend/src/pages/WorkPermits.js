import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import imageCompression from 'browser-image-compression';
import { resolveImageUrl } from '../utils/imageUrl';
import { translateBrandingText } from '../utils/brandingTranslation';
import { Plus, Trash2, Edit2, Eye, X, Camera, Upload, ZoomIn, MoreVertical, ShieldAlert, FileText, Filter, Search, Download, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = { date: '', project: '', governorate: '', notes: '', image: '', images: [] };

function WorkPermits({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleTranslationUpdated = () => {
      forceUpdate(prev => prev + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdated);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdated);
  }, []);

  const [reports, setReports] = useState([]);
  const hasPermission = (permKey) => {
    if (user?.role === 'admin') return true;
    if ((user?.permissions || []).includes(permKey)) return true;
    const pp = user?.project_permissions || {};
    return Object.values(pp).some(perms => (perms || []).includes(permKey));
  };

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [activeNotesReportId, setActiveNotesReportId] = useState(null);
  const [consultantNote, setConsultantNote] = useState('');
  const [consultantReply, setConsultantReply] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [notePopupAction, setNotePopupAction] = useState('save_only');
  const isLevel3 = user?.role !== 'admin' && !user?.can_create_subusers;
  const showRedDot = (r) => {
    if (isLevel3) return r.consultant_note && !r.report_note_processed;
    return r.consultant_reply && !r.consultant_note_processed;
  };
  const [editingReport, setEditingReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [viewNote, setViewNote] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [projectGovs, setProjectGovs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(10);
  const [tempDate, setTempDate] = useState('');
  const [tempProject, setTempProject] = useState('');
  const [tempGov, setTempGov] = useState('');

  const [appliedDate, setAppliedDate] = useState('');
  const [appliedProject, setAppliedProject] = useState('');
  const [appliedGov, setAppliedGov] = useState('');

  const handleSearch = () => {
    setAppliedDate(tempDate);
    setAppliedProject(tempProject);
    setAppliedGov(tempGov);
  };

  const handleReset = () => {
    setTempDate('');
    setTempProject('');
    setTempGov('');
    setAppliedDate('');
    setAppliedProject('');
    setAppliedGov('');
  };

  const openNotesModal = (report) => {
    setActiveNotesReportId(report.id);
    setConsultantNote(report.consultant_note || '');
    setConsultantReply(report.consultant_reply || '');

    if (isLevel3 && report.consultant_note && !report.report_note_processed) {
      axios.put(`${API}/work-permits/${report.id}`, { report_note_processed: true }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setReports(prev => prev.map(rep => rep.id === report.id ? { ...rep, report_note_processed: true } : rep));
    } else if (!isLevel3 && report.consultant_reply && !report.consultant_note_processed) {
      axios.put(`${API}/work-permits/${report.id}`, { consultant_note_processed: true }, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      setReports(prev => prev.map(rep => rep.id === report.id ? { ...rep, consultant_note_processed: true } : rep));
    }
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

    const updatePayload = { consultant_note: consultantNote, consultant_reply: consultantReply };
    if (!isLevel3) updatePayload.report_note_processed = isProcessed;
    else updatePayload.consultant_note_processed = isProcessed;

    try {
      setReports(prev => prev.map(rep => rep.id === activeNotesReportId ? { ...rep, ...updatePayload } : rep));
      toast.success(isRtl ? 'تم حفظ الملاحظة بنجاح' : 'Note saved successfully');
      
      if (notePopupAction === 'save_and_close') {
        setActiveNotesReportId(null);
      }

      await axios.put(`${API}/work-permits/${activeNotesReportId}`, updatePayload, { headers: { Authorization: `Bearer ${token}` } });
      
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ');
    } finally {
      setIsSavingNote(false);
      setNotePopupAction('save_only');
    }
  };

  const projectOptions = useMemo(() => {
    let projs = user?.role === 'admin' 
      ? Object.keys(projectGovs) 
      : (user?.projects || []);
    if (projs.length === 0) {
      projs = reports.map(r => r.project).filter(Boolean);
    }
    return [...new Set(projs)].sort();
  }, [projectGovs, user, reports]);

  const govOptions = useMemo(() => {
    if (tempProject) {
      return [...new Set(projectGovs[tempProject] || [])].sort();
    }
    const projs = user?.role === 'admin' 
      ? Object.keys(projectGovs) 
      : (user?.projects || []);
    let govs = [];
    projs.forEach(p => {
      if (projectGovs[p]) {
        govs.push(...projectGovs[p]);
      }
    });
    if (govs.length === 0) {
      govs = reports.map(r => r.governorate).filter(Boolean);
    }
    return [...new Set(govs)].sort();
  }, [projectGovs, tempProject, user, reports]);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchDate = !appliedDate || (r.date && r.date.includes(appliedDate));
      const matchProject = !appliedProject || (r.project && r.project === appliedProject);
      const matchGov = !appliedGov || (r.governorate && r.governorate === appliedGov);
      return matchDate && matchProject && matchGov;
    });
  }, [reports, appliedDate, appliedProject, appliedGov]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports, appliedDate, appliedProject, appliedGov]);

  useEffect(() => {
    const fetchProjectGovs = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/project-governorates`, { headers: { Authorization: `Bearer ${token}` } });
        setProjectGovs(res.data || {});
      } catch (err) {
        console.error('Failed to fetch project governorates', err);
      }
    };
    fetchProjectGovs();
  }, []);

  const allowedProjects = user?.role === 'admin' 
    ? Object.keys(projectGovs) 
    : (user?.projects || []);

  const getAllowedGovernorates = () => {
    if (!form.project) return [];
    const projectGovsList = projectGovs[form.project] || [];
    
    if (user?.role !== 'admin' && user?.governorates && user.governorates.length > 0) {
      const hasAll = user.governorates.some(g => ["الكل", "جميع المحافظات", "كل المحافظات"].includes(g));
      if (!hasAll) {
        return projectGovsList.filter(g => user.governorates.includes(g));
      }
    }
    return projectGovsList;
  };

  const allowedProjectsList = [...allowedProjects];
  if (form.project && !allowedProjectsList.includes(form.project)) {
    allowedProjectsList.push(form.project);
  }

  const allowedGovs = getAllowedGovernorates();
  const allowedGovsList = [...allowedGovs];
  if (form.governorate && !allowedGovsList.includes(form.governorate)) {
    allowedGovsList.push(form.governorate);
  }

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/work-permits`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data || []);
    } catch (err) {
      console.error('Failed to fetch work permits:', err);
      toast.error(isRtl ? 'حدث خطأ أثناء تحميل تصاريح العمل' : 'Failed to load work permits');
    } finally {
      setLoading(false);
    }
  }, [isRtl]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const canReviewReport = useCallback((r) => {
    if (user?.role === 'admin') return true;
    if (!user?.can_create_subusers) return false;
    
    const normalize = (text) => {
      if (!text) return "";
      return text.toString().trim().replace(/\s+/g, " ")
        .replace(/[أإآ]/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي");
    };
    
    const reportProjNorm = normalize(r.project);
    const hasAllProjects = !user?.projects || user.projects.length === 0;
    return hasAllProjects || (user?.projects || []).some(proj => normalize(proj) === reportProjNorm);
  }, [user]);

  const handleReviewReport = async (reportId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/work-permits/${reportId}`, { status: 'تمت المراجعة' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(i18n.language === 'ar' ? 'تم مراجعة البلاغ بنجاح' : 'Report reviewed successfully');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleRevertReview = async (reportId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/work-permits/${reportId}`, { status: 'قيد المراجعة' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(i18n.language === 'ar' ? 'تم اعادة فتح حالة المراجعة' : 'Review status reopened');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ');
    }
  };

  const compressImage = async (file) => {
    const options = { 
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1200, 
      useWebWorker: true,
      initialQuality: 0.75
    };
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
      
      for (let file of files) {
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (isPdf) {
          if (file.size > 10 * 1024 * 1024) {
            toast.error("حجم ملف الـ PDF يتجاوز 10 ميجا. يرجى اختيار ملف أصغر.");
            continue;
          }
          const reader = new FileReader();
          let base64pdf = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/compress-pdf`, { pdf: base64pdf }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data && res.data.pdf) base64pdf = res.data.pdf;
          } catch (e) { console.error('PDF compression failed', e); }
          newPreviews.push(base64pdf);
          newImages.push(base64pdf);
        } else {
          const compressed = await compressImage(file);
          const result = await new Promise(resolve => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.readAsDataURL(compressed);
          });
          newPreviews.push(result);
          newImages.push(result);
        }
      }
      
      setImagePreviews(newPreviews);
      setForm(prev => ({ ...prev, images: newImages, image: newImages[0] || '' }));
      setUploading(false);
      toast.success(isRtl ? 'تم إضافة الملفات وضغطها بنجاح' : 'Files added and compressed successfully');
    } catch (e) { 
      console.error(e);
      setUploading(false); 
    }
  };

  const openAdd = () => { setEditingReport(null); setForm(emptyForm); setImagePreview(''); setImagePreviews([]); setShowModal(true); };
  
  const handleViewReport = async (r) => {
    toast.info(isRtl ? 'جاري التحميل...' : 'Loading...', { autoClose: false, toastId: 'loadingReport' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/work-permits/${r.id}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.dismiss('loadingReport');
      setViewReport(res.data);
    } catch (err) {
      toast.dismiss('loadingReport');
      toast.error(isRtl ? 'خطأ في جلب التفاصيل' : 'Error loading details');
    }
  };

  const openEdit = async (r) => { 
    toast.info(isRtl ? 'جاري التحميل...' : 'Loading...', { autoClose: false, toastId: 'loadingReport' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/work-permits/${r.id}`, { headers: { Authorization: `Bearer ${token}` }});
      toast.dismiss('loadingReport');
      const full = res.data;
      setEditingReport(full); 
      setForm({ date: full.date || '', project: full.project || '', governorate: full.governorate || '', notes: full.notes || '', image: full.image || '', images: full.images || [] }); 
      setImagePreview(full.image || ''); 
      setImagePreviews(full.images || []); 
      setShowModal(true); 
      setActiveMenu(null); 
    } catch (err) {
      toast.dismiss('loadingReport');
      toast.error('Error loading details');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting || uploading) return;
    
    toast.success(editingReport ? t('workPermits.updateSuccess') : t('workPermits.saveSuccess'));
    setShowModal(false);
    
    const tempId = 'temp-' + Date.now();
    const optimisticReport = {
       id: tempId,
       date: form.date,
       project: form.project,
       governorate: form.governorate,
       notes: form.notes,
       status: 'جاري الرفع...',
       created_by: user?.name || 'أنا',
       image: form.image,
       images: form.images
    };

    if (!editingReport) {
      setReports(prev => [optimisticReport, ...prev]);
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      if (editingReport) {
        await axios.put(`${API}/work-permits/${editingReport.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/work-permits`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      fetchReports();
    } catch (err) {
      if (!editingReport) {
         setReports(prev => prev.filter(r => r.id !== tempId));
      }
      if (err.response?.status === 413 || err.message.includes('Network') || err.message.includes('timeout')) {
        toast.error(isRtl ? 'الإنترنت لديك ضعيف لرفع الملف، المحاولة فشلت في الخلفية' : 'Your internet is weak, background upload failed');
      } else {
        toast.error(err.response?.data?.detail || (isRtl ? 'حدث خطأ أثناء الحفظ في الخلفية' : 'Error saving permit in background'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('workPermits.deleteConfirm'))) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/work-permits/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t('workPermits.deleteSuccess'));
      fetchReports();
    } catch { toast.error(t('workPermits.deleteError')); }
    setActiveMenu(null);
  };

  const handleDownloadPDF = async (report, titleText) => {
    let fullReport = report;
    if (!fullReport.image) {
      toast.info(isRtl ? 'جاري تجهيز الملف...' : 'Preparing file...', { autoClose: false, toastId: 'loadingReport' });
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/work-permits/${report.id}`, { headers: { Authorization: `Bearer ${token}` }});
        toast.dismiss('loadingReport');
        fullReport = res.data;
      } catch (err) {
        toast.dismiss('loadingReport');
        toast.error('Error loading details');
        return;
      }
    }

    if (!fullReport.image) {
      toast.error('لا يوجد صورة أو ملف مرفق للتحميل');
      return;
    }
    
    try {
      const token = localStorage.getItem('token') || '';
      
      if (fullReport.image.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fullReport.image;
        let ext = '.jpg';
        if (fullReport.image.startsWith('data:application/pdf')) ext = '.pdf';
        else if (fullReport.image.startsWith('data:image/png')) ext = '.png';
        link.download = `report_attachment_${fullReport.id || 'file'}${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('workPermits.downloadSuccess') || 'تم بدء التحميل بنجاح');
      } else {
        const fileUrlParam = encodeURIComponent(fullReport.image);
        const downloadUrl = `${process.env.REACT_APP_BACKEND_URL || ''}/api/storage/files/${fileUrlParam}?download=1&auth=${encodeURIComponent(token)}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        let ext = '';
        if (fullReport.image.toLowerCase().endsWith('.pdf')) ext = '.pdf';
        else if (fullReport.image.toLowerCase().endsWith('.png')) ext = '.png';
        else if (fullReport.image.toLowerCase().endsWith('.jpg') || fullReport.image.toLowerCase().endsWith('.jpeg')) ext = '.jpg';
        link.download = `report_attachment_${fullReport.id || 'file'}${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t('workPermits.downloadSuccess') || 'تم بدء التحميل بنجاح');
      }
    } catch (e) {
      console.error('File download error:', e);
      toast.error(t('workPermits.downloadError') || 'فشل تحميل الملف');
    }
  };

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  useEffect(() => {
    setAppliedDate(tempDate);
    setCurrentPage(1);
  }, [tempDate]);

  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {showModal ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 text-gray-600 font-bold">
                <span className="text-2xl leading-none">{isRtl ? '←' : '→'}</span>
                <span>{isRtl ? 'الرجوع' : 'Back'}</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-800 border-r-4 border-orange-500 pr-4">
                {editingReport ? t('workPermits.editReport') : t('workPermits.addNew')}
              </h2>
            </div>
            <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.date')} <span className="text-red-500">*</span></label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.governorate')} <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={form.governorate}
                    onChange={e => setForm({...form, governorate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none bg-gray-50"
                    disabled={!form.project}
                  >
                    <option value="">{t('workPermits.selectGov')}</option>
                    {allowedGovsList.map(g => (
                      <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.project')} <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.project}
                  onChange={e => setForm({...form, project: e.target.value, governorate: ''})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none bg-gray-50"
                >
                  <option value="">{t('workPermits.selectProject')}</option>
                  {allowedProjectsList.map(p => (
                    <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.notes')}</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none resize-none bg-gray-50" />
              </div>
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-700 mb-4">📷 {t('workPermits.image')}</label>
                <p className="text-xs text-gray-400 mb-3">{isRtl ? 'يتم ضغط الصور تلقائياً إلى 100KB والـ PDF إلى 150KB' : 'Images auto-compressed to 100KB, PDFs to 150KB'}</p>
                <div className="flex gap-4 mb-4">
                  <label className="flex-1 flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors bg-white">
                    <Upload className="w-6 h-6 text-orange-500" /><span className="text-sm text-orange-700 font-bold">{t('workPermits.selectImage')}</span>
                    <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleImageSelect} disabled={uploading} />
                  </label>
                  <label className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors bg-white">
                    <Camera className="w-6 h-6 text-orange-500" /><span className="text-sm text-orange-700 font-bold">{t('workPermits.camera')}</span>
                    <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={handleImageSelect} disabled={uploading} />
                  </label>
                </div>
                {uploading && <p className="text-sm text-orange-600 mb-4 font-bold animate-pulse">{t('workPermits.uploadingImage')}</p>}
                {imagePreviews.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-4">
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative inline-block">
                        {img.startsWith('data:application/pdf') || img.endsWith('.pdf') ? (
                          <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-teal-200 flex flex-col items-center justify-center p-2 cursor-pointer">
                            <span className="text-xs text-gray-600 font-bold text-center">PDF File</span>
                          </div>
                        ) : (
                          <img src={resolveImageUrl(img)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-teal-200 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(img)} />
                        )}
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-600 shadow-lg border-2 border-white">×</button>
                      </div>
                    ))}
                  </div>
                ) : (imagePreview && (
                  <div className="mb-4 relative inline-block">
                    {imagePreview.startsWith('data:application/pdf') || imagePreview.endsWith('.pdf') ? (
                      <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200 flex items-center justify-center min-w-[128px] min-h-[128px]">
                        <div className="text-center">
                          <FileText className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                          <span className="text-xs font-bold text-orange-800">ملف PDF مرفق</span>
                        </div>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-orange-200 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(imagePreview)} />
                    )}
                    <button type="button" onClick={() => { setImagePreview(''); setForm(prev => ({...prev, image: ''})); }} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-600 shadow-lg border-2 border-white">×</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting || uploading} className={`flex-1 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg transition-all shadow-md ${isSubmitting || uploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-700 hover:shadow-lg hover:-translate-y-0.5'}`}>{isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : editingReport ? t('workPermits.saveChangesBtn') : t('workPermits.saveBtn')}</button>
              </div>
            </form>
          </div>
        ) : (
          <>
        {/* Back Arrow + Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/safety-reports"
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-bold"
          >
            {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            <span>{isRtl ? 'الرجوع لتقارير السلامة' : 'Back to Safety Reports'}</span>
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-orange-100 rounded-xl"><ShieldAlert className="w-7 h-7 text-orange-600" /></span>
              {t('workPermits.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1 mr-12">{t('workPermits.subTitle')}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-md transition-all"
            >
              <Plus className="w-5 h-5" /> {t('workPermits.addNew')}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        {!loading && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-start animate-fade-in animate-scale-in">
            <div className="flex items-center gap-2 text-gray-700 font-bold text-sm min-w-[120px]">
              <Filter className="w-5 h-5 text-orange-600 animate-pulse" />
              <span>{t('workPermits.filterTitle')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 w-full">
              <input
                type="date"
                value={tempDate}
                onChange={e => setTempDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none text-sm text-gray-700 bg-white"
              />
              <select
                value={tempProject}
                onChange={e => {
                  setTempProject(e.target.value);
                  setTempGov('');
                  if (!e.target.value) {
                    setAppliedProject('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none text-sm text-gray-700 bg-white"
              >
                <option value="">{t('reports.allProjects')}</option>
                {projectOptions.map(p => (
                  <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                ))}
              </select>
              <select
                value={tempGov}
                onChange={e => {
                  setTempGov(e.target.value);
                  if (!e.target.value) {
                    setAppliedGov('');
                  }
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none text-sm text-gray-700 bg-white"
              >
                <option value="">{t('reports.allGovernorates')}</option>
                {govOptions.map(g => (
                  <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 justify-center shrink-0 cursor-pointer text-sm font-bold"
                  title={t('workPermits.searchBtn')}
                >
                  <Search className="w-4 h-4" />
                  <span>{t('workPermits.searchBtn')}</span>
                </button>
                {(appliedDate || appliedProject || appliedGov || tempDate || tempProject || tempGov) && (
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-xs text-red-600 hover:text-red-700 font-bold hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-dashed border-red-200 shrink-0"
                  >
                    {t('workPermits.resetBtn')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table & Content */}
        {reports.length === 0 && loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <ShieldAlert className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{t('workPermits.noReports')}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-bounce" />
            <p className="text-gray-500 font-medium">{t('workPermits.noFilteredReports')}</p>
            <button
              onClick={handleReset}
              className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 text-sm font-medium transition-all shadow-md"
            >
              {t('workPermits.resetFilters')}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-orange-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">#</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">{t('workPermits.date')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">{t('workPermits.governorate')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">{t('workPermits.project')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">{t('workPermits.addedBy')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">{t('workPermits.status')}</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">{t('workPermits.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentReports.map((r, idx) => {
                    const globalIdx = indexOfFirstReport + idx + 1;
                    return (
                      <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-3 text-center text-sm text-gray-500">{globalIdx}</td>
                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-800">{r.date || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">{translateBrandingText(r.governorate, isRtl) || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-700 max-w-[150px] truncate">{translateBrandingText(r.project, isRtl) || '-'}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{r.created_by || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(r.status || 'قيد المراجعة') !== 'تمت المراجعة' && (
                              <span className="text-base animate-bounce" title="يحتاج مراجعة">🔔</span>
                            )}
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              r.status === 'تمت المراجعة'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-slate-700 text-white shadow-sm border border-slate-600'
                            }`}>
                              {translateBrandingText(r.status || 'قيد المراجعة', isRtl)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-2 rounded-xl transition-all focus:outline-none hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                  title={t('workPermits.actions')}
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white shadow-2xl border border-slate-100 rounded-2xl p-1 z-[65]">
                                <div className="py-1">
                                  <DropdownMenuItem
                                    onClick={() => handleViewReport(r)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-orange-600" /> {t('workPermits.viewDetails')}
                                  </DropdownMenuItem>
                                  {(!r.report_note_processed || user?.role === 'admin' || user?.level === 1 || user?.level === 2 || (user?.level === 3 && r.consultant_note)) && (
                                    <DropdownMenuItem
                                      onClick={() => openNotesModal(r)}
                                      className="w-full text-right px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 hover:text-amber-800 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer relative"
                                    >
                                      <FileText className="w-4 h-4 text-amber-600" /> {isRtl ? 'اضافة ملاحظة للتقرير' : 'Add Note to Report'}
                                      {showRedDot(r) && (
                                        <span className="absolute left-2 top-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                      )}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadPDF(r, t('workPermits.title'))}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                  >
                                    <Download className="w-4 h-4 text-orange-600" /> {t('workPermits.downloadReport')}
                                  </DropdownMenuItem>
                                  {canReviewReport(r) && (r.status || 'قيد المراجعة') === 'قيد المراجعة' && (
                                    <DropdownMenuItem
                                      onClick={() => handleReviewReport(r.id)}
                                      className="w-full text-right px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 hover:text-green-800 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer border-t border-slate-100"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" /> {t('workPermits.reviewedAction')}
                                    </DropdownMenuItem>
                                  )}
                                  {canReviewReport(r) && r.status === 'تمت المراجعة' && (
                                    <DropdownMenuItem
                                      onClick={() => handleRevertReview(r.id)}
                                      className="w-full text-right px-4 py-2.5 text-sm text-orange-700 hover:bg-orange-50 hover:text-orange-800 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer border-t border-slate-100"
                                    >
                                      <span className="w-4 h-4 text-orange-600 font-bold">↩</span> {isRtl ? 'إعادة للمراجعة' : 'Revert to Review'}
                                    </DropdownMenuItem>
                                  )}
                                </div>
                                <div className="py-1 bg-slate-50/50 border-t border-slate-100">
                                  {hasPermission('work_permits_edit') && !(user?.role !== 'admin' && user?.can_create_subusers) && (
                                    <DropdownMenuItem
                                    onClick={() => openEdit(r)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4 text-yellow-600" /> {t('workPermits.edit')}
                                  </DropdownMenuItem>
                                  )}
                                  {hasPermission('work_permits_delete') && !(user?.role !== 'admin' && user?.can_create_subusers) && (
                                    <DropdownMenuItem
                                    onClick={() => handleDelete(r.id)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors font-semibold rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" /> {t('workPermits.delete')}
                                  </DropdownMenuItem>
                                  )}
                                </div>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls inside the Card */}
            {filteredReports.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">{t('workPermits.reportsPerPage')}:</label>
                  <select
                    value={reportsPerPage}
                    onChange={(e) => {
                      setReportsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="text-sm font-bold text-orange-900 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100 shadow-sm">
                  <span className="text-orange-600">{t('workPermits.page')}</span> {currentPage} <span className="text-orange-600">{t('workPermits.of')}</span> {totalPages || 1} 
                  <span className="mx-2 text-orange-300">|</span> 
                  <span className="text-orange-600">{t('workPermits.showing')}</span> {currentReports.length} <span className="text-orange-600">{t('workPermits.reportsOfTotal')}</span> {filteredReports.length}
                </div>
                
                <div className="flex items-center gap-2" dir="ltr">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                    }`}
                  >
                    {t('workPermits.first')}
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                    }`}
                  >
                    {t('workPermits.previous')}
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
                          className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                            currentPage === pageNum
                              ? 'bg-orange-600 text-white shadow-sm'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      (currentPage === totalPages || totalPages === 0)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                    }`}
                  >
                    {t('workPermits.next')}
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      (currentPage === totalPages || totalPages === 0)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 text-white hover:bg-orange-700 shadow-sm'
                    }`}
                  >
                    {t('workPermits.last')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          </>
        )}
        {/* View Modal */}
        {viewReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
              <div className="bg-cyan-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">{t('workPermits.detailsTitle')}</h3>
                <button onClick={() => setViewReport(null)} className="text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">{t('workPermits.date')}</p><p className="font-bold text-gray-800 mt-1 text-sm">{viewReport.date || '-'}</p></div>
                  <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">{t('workPermits.governorate')}</p><p className="font-bold text-gray-800 mt-1 text-sm">{translateBrandingText(viewReport.governorate, isRtl) || '-'}</p></div>
                  <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">{t('workPermits.status')}</p><p className="font-bold text-gray-800 mt-1 text-sm">{translateBrandingText(viewReport.status || 'قيد المراجعة', isRtl)}</p></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">{t('workPermits.project')}</p><p className="font-bold text-gray-800 mt-1">{translateBrandingText(viewReport.project, isRtl) || '-'}</p></div>
                <div className="bg-gray-50 p-3 rounded-xl"><p className="text-xs text-gray-400">{t('workPermits.notes')}</p><p className="text-gray-700 mt-1 leading-relaxed">{viewReport.notes || '-'}</p></div>
                {viewReport.image && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('workPermits.image')}</p>
                    {viewReport.image.startsWith('data:application/pdf') || viewReport.image.endsWith('.pdf') ? (
                      <div className="p-6 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-orange-500 mb-3" />
                        <span className="text-sm font-bold text-orange-800 mb-4">ملف PDF مرفق</span>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(viewReport.image)} alt="" className="w-full rounded-xl object-cover max-h-64 cursor-zoom-in border border-gray-100" onClick={() => setZoomedImage(viewReport.image)} />
                    )}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <p>{t('workPermits.addedBy')}: {viewReport.created_by || '-'} | {viewReport.created_at ? new Date(viewReport.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : ''}</p>
                  <button
                    onClick={() => handleDownloadPDF(viewReport, t('workPermits.title'))}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-all text-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('workPermits.downloadReport')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consultant Notes Modal */}
        {activeNotesReportId && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 animate-pulse" /> {isRtl ? 'اضافة ملاحظة للتقرير' : 'Add Note to Report'}
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
                    disabled={user?.role !== 'admin' && user?.level !== 1 && user?.level !== 2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none resize-none text-sm text-gray-700 bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-500 min-h-[120px] transition-all"
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
                    disabled={user?.role === 'admin' || user?.level === 1 || user?.level === 2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none resize-none text-sm text-gray-700 bg-blue-50/10 disabled:bg-gray-100 disabled:text-gray-500 min-h-[120px] transition-all"
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
                    setNotePopupAction('save_only');
                    setTimeout(handleSaveNote, 0);
                  }}
                  disabled={isSavingNote}
                  className="px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-all shadow-sm shadow-amber-200 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingNote && notePopupAction === 'save_only' ? <span className="animate-spin text-lg leading-none">⏳</span> : '💾'} {isRtl ? 'حفظ' : 'Save'}
                </button>
                <button 
                  onClick={() => {
                    setNotePopupAction('save_and_close');
                    setTimeout(handleSaveNote, 0);
                  }}
                  disabled={isSavingNote}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-bold transition-all shadow-sm shadow-emerald-200 flex items-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingNote && notePopupAction === 'save_and_close' ? <span className="animate-spin text-lg leading-none">⏳</span> : '📨'} {isRtl ? 'حفظ وإرسال وإغلاق' : 'Save, Send & Close'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Note Modal */}
        {viewNote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-up">
              <div className="bg-amber-500 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 animate-pulse" /> {t('workPermits.notesTitle')}
                </h3>
                <button onClick={() => setViewNote(null)} className="text-white hover:text-amber-100"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{viewNote}</p>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
                <button onClick={() => setViewNote(null)} className="px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-bold transition-colors shadow-md">{t('workPermits.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Zoom Modal */}
        {zoomedImage && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
            <button className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30"><X className="w-6 h-6" /></button>
            <img src={resolveImageUrl(zoomedImage)} alt="" className="max-w-full max-h-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    </Layout>
  );
}

export default WorkPermits;
