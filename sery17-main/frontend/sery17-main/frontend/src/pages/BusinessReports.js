import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { resolveImageUrl } from '../utils/imageUrl';
import { translateBrandingText } from '../utils/brandingTranslation';
import { Plus, Trash2, Edit2, Eye, X, Upload, MoreVertical, FileText, Filter, Search, Download, FileBarChart2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyForm = { date_from: '', date_to: '', project: '', governorate: '', notes: '', file_url: '', file_name: '', files: [] };

const parseDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  
  let match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  
  match = dateStr.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

function BusinessReports({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleTranslationUpdated = () => forceUpdate(prev => prev + 1);
    window.addEventListener('wfm_translation_updated', handleTranslationUpdated);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdated);
  }, []);

  const getInitialReports = () => {
    try {
      const cached = localStorage.getItem('cache_BusinessReports.js_reports');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  };
  const [reports, setReports] = useState(getInitialReports);
  const hasPermission = (permKey) => {
    if (user?.role === 'admin') return true;
    if ((user?.permissions || []).includes(permKey)) return true;
    const pp = user?.project_permissions || {};
    return Object.values(pp).some(perms => (perms || []).includes(permKey));
  };

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [viewReport, setViewReport] = useState(null);
  const [viewNote, setViewNote] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
  const [projectGovs, setProjectGovs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage, setReportsPerPage] = useState(10);
  
  // Filter states
  const [tempDateFrom, setTempDateFrom] = useState('');
  const [tempDateTo, setTempDateTo] = useState('');
  const [tempProject, setTempProject] = useState('');
  const [tempGov, setTempGov] = useState('');

  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');
  const [appliedProject, setAppliedProject] = useState('');
  const [appliedGov, setAppliedGov] = useState('');

  const handleSearch = () => {
    setAppliedDateFrom(tempDateFrom);
    setAppliedDateTo(tempDateTo);
    setAppliedProject(tempProject);
    setAppliedGov(tempGov);
  };

  const handleReset = () => {
    setTempDateFrom('');
    setTempDateTo('');
    setTempProject('');
    setTempGov('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
    setAppliedProject('');
    setAppliedGov('');
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
      const rDateFrom = parseDate(r.date_from);
      const rDateTo = parseDate(r.date_to);
      const filterDateFrom = parseDate(appliedDateFrom);
      const filterDateTo = parseDate(appliedDateTo);

      const matchDateFrom = !filterDateFrom || (rDateFrom && rDateFrom >= filterDateFrom);
      const matchDateTo = !filterDateTo || (rDateTo && rDateTo <= filterDateTo);
      const matchProject = !appliedProject || (r.project && r.project === appliedProject);
      const matchGov = !appliedGov || (r.governorate && r.governorate === appliedGov);
      return matchDateFrom && matchDateTo && matchProject && matchGov;
    });
  }, [reports, appliedDateFrom, appliedDateTo, appliedProject, appliedGov]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports, appliedDateFrom, appliedDateTo, appliedProject, appliedGov]);

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
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/business-reports`, { headers: { Authorization: `Bearer ${token}` } });
      setReports(res.data || []);
      try { localStorage.setItem('cache_BusinessReports.js_reports', JSON.stringify(res.data || [])); } catch(e) {}
    } catch { 
      toast.error(t('businessReports.downloadError') || 'حدث خطأ أثناء تحميل البيانات'); 
    } finally { 
      setLoading(false); 
    }
  }, [t]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const canReviewReport = useCallback((r) => {
    if (user?.role === 'admin') return true;
    
    const normalize = (text) => {
      if (!text) return "";
      return text.toString().trim().replace(/\s+/g, " ")
        .replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");
    };
    const reportProjNorm = normalize(r.project);
    
    // Check if user has review permission explicitly for this project via project_permissions
    if (user?.project_permissions) {
      for (const [proj, perms] of Object.entries(user.project_permissions)) {
        if (normalize(proj) === reportProjNorm && (perms || []).includes('business_reports_review')) {
          return true;
        }
      }
    }
    
    // Fallback: Check if they have the global permission AND the project is in their projects array (or they have all projects)
    const hasGlobalReview = (user?.permissions || []).includes('business_reports_review');
    const hasAllProjects = !user?.projects || user.projects.length === 0;
    const isProjectAssigned = hasAllProjects || (user?.projects || []).some(proj => normalize(proj) === reportProjNorm);
    
    console.log('canReviewReport debug:', {
      reportId: r.id, reportProjNorm,
      hasGlobalReview, hasAllProjects, isProjectAssigned,
      userProjects: user?.projects,
      userPerms: user?.permissions,
      userProjPerms: user?.project_permissions
    });
    
    return hasGlobalReview && isProjectAssigned;
  }, [user]);


  const handleRevertReport = async (reportId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/business-reports/${reportId}`, { status: 'قيد المراجعة' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(i18n.language === 'ar' ? 'تم اعادة فتح حالة المراجعة' : 'Review status reopened');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleReviewReport = async (reportId) => {
    const token = localStorage.getItem('token');
    try {
      await axios.put(`${API}/business-reports/${reportId}`, { status: 'تمت المراجعة' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(i18n.language === 'ar' ? 'تم مراجعة البلاغ بنجاح' : 'Report reviewed successfully');
      fetchReports();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'حدث خطأ');
    }
  };

    const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('token');
      const newFiles = [...(form.files || [])];
      
      let i = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await axios.post(`${API}/storage/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(((i * 100) + (progressEvent.loaded * 100) / progressEvent.total) / files.length);
            setUploadProgress(percentCompleted);
          }
        });
        
        const { storage_path } = res.data;
        const resolvedUrl = storage_path.startsWith('http') ? storage_path : `${API}/storage/files/${storage_path}`;
        
        newFiles.push({
           url: resolvedUrl,
           name: file.name
        });
        i++;
      }
      
      setForm(prev => ({
        ...prev,
        files: newFiles,
        file_url: newFiles.length > 0 ? newFiles[0].url : '',
        file_name: newFiles.length > 0 ? newFiles[0].name : ''
      }));
      toast.success(t('businessReports.saveSuccess') || 'تم رفع الملف بنجاح');
    } catch (err) {
      toast.error('فشل في رفع الملف');
    } finally {
      setUploading(false);
    }
  };
  
  const removeFile = (idx) => {
     const newFiles = [...(form.files || [])];
     newFiles.splice(idx, 1);
     setForm(prev => ({
        ...prev,
        files: newFiles,
        file_url: newFiles.length > 0 ? newFiles[0].url : '',
        file_name: newFiles.length > 0 ? newFiles[0].name : ''
     }));
  };

  const openAdd = () => { 
    setEditingReport(null); 
    setForm(emptyForm); 
    setShowModal(true); 
  };

  const openEdit = (r) => { 
    setEditingReport(r); 
    setForm({ 
      date_from: r.date_from || '', 
      date_to: r.date_to || '', 
      project: r.project || '', 
      governorate: r.governorate || '', 
      notes: r.notes || '', 
      file_url: r.file_url || '',
      file_name: r.file_name || '', files: r.files || []
    }); 
    setShowModal(true); 
    setActiveMenu(null); 
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (uploading) {
      toast.info('يرجى الانتظار، جاري رفع الملف');
      return;
    }
    if (!form.file_url) {
      toast.error('يرجى رفع ملف أولاً');
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem('token');
    try {
      if (editingReport) {
        await axios.put(`${API}/business-reports/${editingReport.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(t('businessReports.updateSuccess'));
      } else {
        await axios.post(`${API}/business-reports`, form, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(t('businessReports.saveSuccess'));
      }
      setShowModal(false);
      fetchReports();
    } catch (err) { 
      toast.error(err.response?.data?.detail || 'حدث خطأ أثناء الحفظ'); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('businessReports.deleteConfirm'))) return;
    const token = localStorage.getItem('token');
    try {
      await axios.delete(`${API}/business-reports/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t('businessReports.deleteSuccess'));
      fetchReports();
    } catch { 
      toast.error(t('businessReports.deleteError')); 
    }
    setActiveMenu(null);
  };

  const handleDownloadFile = (report) => {
    if (!report.file_url) {
      toast.error('لا يوجد ملف للتحميل');
      return;
    }
    const token = localStorage.getItem('token') || '';
    const fileUrlParam = encodeURIComponent(report.file_url);
    const downloadUrl = `${process.env.REACT_APP_BACKEND_URL || ''}/api/storage/files/${fileUrlParam}?download=1&auth=${encodeURIComponent(token)}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = report.file_name || 'report';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('businessReports.downloadSuccess') || 'بدأ تحميل الملف');
  };

  const handleViewFile = (report) => {
    if (!report.file_url) {
      toast.error('لا يوجد ملف للاطلاع');
      return;
    }
    const ext = getFileExtension(report.file_name);
    
    if (ext === 'ppt' || ext === 'pptx') {
      const publicUrl = report.file_url.startsWith('http') 
        ? report.file_url 
        : resolveImageUrl(report.file_url);
      window.open(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(publicUrl)}`, '_blank');
    } else {
      const token = localStorage.getItem('token') || '';
      const fileUrlParam = encodeURIComponent(report.file_url);
      const viewUrl = `${process.env.REACT_APP_BACKEND_URL || ''}/api/storage/files/${fileUrlParam}?auth=${encodeURIComponent(token)}`;
      window.open(viewUrl, '_blank');
    }
  };

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  const getFileExtension = (filename) => {
    if (!filename) return '';
    return filename.split('.').pop().toLowerCase();
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="p-2 bg-blue-100 rounded-xl"><FileBarChart2 className="w-7 h-7 text-blue-600" /></span>
              {t('businessReports.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1 mr-12">{t('businessReports.subTitle')}</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" /> {t('businessReports.addNew')}
          </button>
        </div>

        {/* Filters Section */}
        {!loading && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-start">
            <div className="flex items-center gap-2 text-gray-700 font-bold text-sm min-w-[120px] pt-5 md:pt-0">
              <Filter className="w-5 h-5 text-blue-600" />
              <span>{t('businessReports.filterTitle')}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full flex-1 items-end">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 w-full flex-1">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 px-1">{t('businessReports.dateFrom')}</label>
                  <input
                    type="date"
                    value={tempDateFrom}
                    onChange={e => setTempDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-700 bg-white h-[38px]"
                    placeholder={t('businessReports.dateFrom')}
                    title={t('businessReports.dateFrom')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 px-1">{t('businessReports.dateTo')}</label>
                  <input
                    type="date"
                    value={tempDateTo}
                    onChange={e => setTempDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-700 bg-white h-[38px]"
                    placeholder={t('businessReports.dateTo')}
                    title={t('businessReports.dateTo')}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 px-1">{t('businessReports.project')}</label>
                  <select
                    value={tempProject}
                    onChange={e => setTempProject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-700 bg-white h-[38px]"
                  >
                    <option value="">{t('reports.allProjects')}</option>
                    {projectOptions.map(p => (
                      <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-500 px-1">{t('businessReports.governorate')}</label>
                  <select
                    value={tempGov}
                    onChange={e => setTempGov(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 outline-none text-sm text-gray-700 bg-white h-[38px]"
                  >
                    <option value="">{t('reports.allGovernorates')}</option>
                    {govOptions.map(g => (
                      <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSearch}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5 justify-center cursor-pointer text-sm font-bold h-[38px]"
                    title={t('businessReports.searchBtn')}
                  >
                    <Search className="w-4 h-4" />
                    <span>{t('businessReports.searchBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
            {(appliedDateFrom || appliedDateTo || appliedProject || appliedGov || tempDateFrom || tempDateTo || tempProject || tempGov) && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-xs text-red-600 hover:text-red-700 font-bold hover:bg-red-50 rounded-xl transition-all cursor-pointer border border-dashed border-red-200 self-end md:self-center shrink-0 h-[38px] flex items-center justify-center mt-3 md:mt-0"
              >
                {t('businessReports.resetBtn')}
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {reports.length === 0 && loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري تحميل البيانات...'}</span></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <FileBarChart2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">{t('businessReports.noReports')}</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Filter className="w-16 h-16 mx-auto text-gray-300 mb-4 animate-bounce" />
            <p className="text-gray-500 font-medium">{t('businessReports.noFilteredReports')}</p>
            <button
              onClick={handleReset}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition-all shadow-md cursor-pointer"
            >
              {t('businessReports.resetFilters')}
            </button>
          </div>
        ) : (
          <>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">#</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">{t('businessReports.project')}</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">
                      {isRtl ? 'الفترة الزمنية' : 'Period'}
                    </th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">{t('businessReports.governorate')}</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">{t('businessReports.file')}</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">{isRtl ? 'استشاري المشروع' : 'Project Consultant'}</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">{t('safetyReports.status')}</th>
                    <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-700">{t('businessReports.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentReports.map((r, idx) => {
                    const globalIdx = indexOfFirstReport + idx + 1;
                    return (
                      <tr key={r.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-3.5 text-center text-sm text-gray-500 font-medium">{globalIdx}</td>
                        <td className="px-4 py-3.5 text-center text-sm font-bold text-blue-600">{r.project ? translateBrandingText(r.project, isRtl) : '-'}</td>
                        <td className="px-4 py-3.5 text-center text-sm text-gray-700 font-medium">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-xs text-gray-400">{isRtl ? 'من:' : 'From:'} <strong className="text-slate-700">{r.date_from || '-'}</strong></span>
                            <span className="text-xs text-gray-400">{isRtl ? 'إلى:' : 'To:'} <strong className="text-slate-700">{r.date_to || '-'}</strong></span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 whitespace-nowrap">
                            🏛️ {r.governorate ? translateBrandingText(r.governorate, isRtl) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center max-w-[180px] truncate">
                          {(r.files && r.files.length > 0) ? (
                            <div className="flex flex-col gap-1 items-center">
                              {r.files.map((f, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleViewFile({ file_url: f.url, file_name: f.name })}
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100 font-bold max-w-full truncate cursor-pointer transition-colors"
                                  title={f.name}
                                >
                                  📎 <span className="truncate">{f.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : r.file_name ? (
                            <button
                              onClick={() => handleViewFile(r)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-100 font-bold max-w-full truncate cursor-pointer transition-colors"
                              title={r.file_name}
                            >
                              📎 <span className="truncate">{r.file_name}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center text-sm text-purple-600 font-semibold">{r.created_by || '-'}</td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {(r.status || 'قيد المراجعة') !== 'تمت المراجعة' && (
                              <span className="text-base animate-bounce" title="يحتاج مراجعة">🔔</span>
                            )}
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                              r.status === 'تمت المراجعة'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                            }`}>
                              {translateBrandingText(r.status || 'قيد المراجعة', isRtl)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  className="p-2 rounded-xl transition-all focus:outline-none hover:bg-gray-100 text-gray-500 hover:text-gray-700 cursor-pointer"
                                  title={t('businessReports.actions')}
                                >
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white shadow-2xl border border-slate-100 rounded-2xl p-1 z-[65]">
                                <div className="py-1">
                                  <DropdownMenuItem
                                    onClick={() => setViewReport(r)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-blue-600" /> {t('businessReports.viewReport')}
                                  </DropdownMenuItem>
                                  {r.notes && (
                                    <DropdownMenuItem
                                      onClick={() => setViewNote(r.notes)}
                                      className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                    >
                                      <FileText className="w-4 h-4 text-blue-600" /> {isRtl ? 'عرض الملاحظات' : 'View Notes'}
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => handleDownloadFile(r)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                  >
                                    <Download className="w-4 h-4 text-blue-600" /> {t('businessReports.downloadReport')}
                                  </DropdownMenuItem>
                                  {canReviewReport(r) && (r.status || 'قيد المراجعة') === 'قيد المراجعة' && (
                                    <DropdownMenuItem
                                      onClick={() => handleReviewReport(r.id)}
                                      className="w-full text-right px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 hover:text-green-800 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer border-t border-slate-100"
                                    >
                                      <CheckCircle className="w-4 h-4 text-green-600" /> {t('safetyReports.reviewedAction')}
                                    </DropdownMenuItem>
                                  )}

                                  {canReviewReport(r) && (r.status || 'قيد المراجعة') === 'تمت المراجعة' && (
                                    <DropdownMenuItem
                                      onClick={() => handleRevertReport(r.id)}
                                      className="w-full text-right px-4 py-2.5 text-sm text-yellow-700 hover:bg-yellow-50 hover:text-yellow-800 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer border-t border-slate-100"
                                    >
                                      <FileText className="w-4 h-4 text-yellow-600" /> {t('safetyReports.revertAction') || 'إعادة للمراجعة'}
                                    </DropdownMenuItem>
                                  )}
                                </div>
                                <div className="py-1 bg-slate-50/50 border-t border-slate-100">
                                  {hasPermission('business_reports_edit') && (
                                    <DropdownMenuItem
                                    onClick={() => openEdit(r)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 flex items-center gap-2 transition-colors font-medium rounded-lg cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4 text-yellow-600" /> {t('businessReports.edit')}
                                  </DropdownMenuItem>
                                  )}
                                  {hasPermission('business_reports_delete') && (
                                    <DropdownMenuItem
                                    onClick={() => handleDelete(r.id)}
                                    className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-2 transition-colors font-semibold rounded-lg cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" /> {t('businessReports.delete')}
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
          </div>

          {/* Pagination */}
            {filteredReports.length > 0 && (
              <div className="rounded-2xl border border-gray-100 px-4 py-4 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">{t('safetyReports.reportsPerPage')}:</label>
                  <select
                    value={reportsPerPage}
                    onChange={(e) => {
                      setReportsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                
                <div className="text-sm font-bold text-blue-900 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm">
                  <span className="text-blue-600">{t('safetyReports.page')}</span> {currentPage} <span className="text-blue-600">{t('safetyReports.of')}</span> {totalPages || 1} 
                  <span className="mx-2 text-blue-300">|</span> 
                  <span className="text-blue-600">{t('safetyReports.showing')}</span> {currentReports.length} <span className="text-blue-600">{t('safetyReports.reportsOfTotal')}</span> {filteredReports.length}
                </div>
                
                <div className="flex items-center gap-2" dir="ltr">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer'
                    }`}
                  >
                    {t('safetyReports.first')}
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer'
                    }`}
                  >
                    {t('safetyReports.previous')}
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
                          className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white shadow-sm'
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
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer'
                    }`}
                  >
                    {t('safetyReports.next')}
                  </button>
                  
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                      (currentPage === totalPages || totalPages === 0)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm cursor-pointer'
                    }`}
                  >
                    {t('safetyReports.last')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in duration-300">
              <div className="sticky top-0 bg-blue-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-white">
                  {editingReport ? t('businessReports.editReport') : t('businessReports.addNew')}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-white text-2xl hover:text-blue-200 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('businessReports.dateFrom')} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={form.date_from} 
                      onChange={e => setForm({...form, date_from: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('businessReports.dateTo')} <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" 
                      required 
                      value={form.date_to} 
                      onChange={e => setForm({...form, date_to: e.target.value})} 
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('businessReports.project')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.project}
                      onChange={e => setForm({...form, project: e.target.value, governorate: ''})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                    >
                      <option value="">{t('businessReports.selectProject')}</option>
                      {allowedProjectsList.map(p => (
                        <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('businessReports.governorate')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={form.governorate}
                      onChange={e => setForm({...form, governorate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
                      disabled={!form.project}
                    >
                      <option value="">{t('businessReports.selectGov')}</option>
                      {form.project && (
                        <option value="جميع المحافظات">{t('reports.allGovernorates')}</option>
                      )}
                      {allowedGovsList.map(g => (
                        <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('businessReports.notes')}</label>
                  <textarea 
                    value={form.notes} 
                    onChange={e => setForm({...form, notes: e.target.value})} 
                    rows={4} 
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none resize-none" 
                  />
                </div>

                {/* File Attachment Upload */}
                <div className="border-t pt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-3">📁 {t('businessReports.file')}</label>
                  <div className="flex gap-2 mb-3">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer hover:bg-blue-50 transition-colors">
                      <Upload className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-blue-700 font-medium">{t('businessReports.selectFile')}</span>
                      <input 
                        type="file" 
                        accept=".ppt,.pptx,.pdf,image/*" 
                        multiple
                        className="hidden" 
                        onChange={handleFileSelect} 
                        disabled={uploading} 
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="mb-3 space-y-1.5">
                      <div className="flex justify-between items-center text-xs text-blue-600 font-bold">
                        <span>{t('businessReports.uploadingFile') || 'جاري رفع الملف...'}</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {form.file_url && (
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-lg">📎</span>
                        <span className="text-sm text-blue-800 font-bold truncate">{form.file_name || 'ملف التقرير'}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteFileConfirm(true)} 
                        className="text-red-500 hover:text-red-700 text-lg font-bold px-2 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="submit" 
                    disabled={isSubmitting || uploading}
                    className={`flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold transition-all ${isSubmitting || uploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}
                  >
                    {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : editingReport ? t('businessReports.saveChangesBtn') : t('businessReports.saveBtn')}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="flex-1 py-3 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium cursor-pointer"
                  >
                    {t('businessReports.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {viewReport && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center rounded-t-2xl shrink-0">
                <h3 className="text-lg font-bold text-white">{t('businessReports.detailsTitle')}</h3>
                <button onClick={() => setViewReport(null)} className="text-white hover:text-blue-200 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-400">{t('businessReports.dateFrom')}</p>
                    <p className="font-bold text-gray-800 mt-1">{viewReport.date_from || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-400">{t('businessReports.dateTo')}</p>
                    <p className="font-bold text-gray-800 mt-1">{viewReport.date_to || '-'}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">{t('businessReports.project')}</p>
                  <p className="font-bold text-gray-800 mt-1">{viewReport.project ? translateBrandingText(viewReport.project, isRtl) : '-'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-400">{t('businessReports.governorate')}</p>
                  <p className="font-bold text-gray-800 mt-1">{viewReport.governorate ? translateBrandingText(viewReport.governorate, isRtl) : '-'}</p>
                </div>
                {viewReport.notes && (
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-400">{t('businessReports.notes')}</p>
                    <p className="text-gray-700 mt-1 leading-relaxed whitespace-pre-wrap">{viewReport.notes}</p>
                  </div>
                )}
                
                {/* File Preview */}
                {viewReport.file_url && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">👁️ معاينة الملف المرفق:</p>
                    {['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(getFileExtension(viewReport.file_name)) ? (
                      <div className="flex justify-center border rounded-xl p-2 bg-gray-50">
                        <img 
                          src={resolveImageUrl(viewReport.file_url)} 
                          alt={viewReport.file_name} 
                          className="max-h-[400px] object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    ) : getFileExtension(viewReport.file_name) === 'pdf' ? (
                      <div className="border rounded-xl overflow-hidden h-[450px]">
                        <iframe 
                          src={resolveImageUrl(viewReport.file_url)} 
                          title={viewReport.file_name}
                          width="100%" 
                          height="100%"
                          className="border-0"
                        />
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <span className="text-4xl block mb-2">📊</span>
                        <p className="font-bold text-slate-700 mb-1">{viewReport.file_name}</p>
                        <p className="text-xs text-slate-500 mb-4">ملف عرض تقدمي (PowerPoint) أو مستند لا يدعم المعاينة المباشرة في المتصفح</p>
                        <button
                          onClick={() => handleDownloadFile(viewReport)}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md inline-flex items-center gap-2 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>تحميل الملف لعرضه</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <p>
                    {t('businessReports.addedBy')}: {viewReport.created_by || '-'} | {viewReport.created_at ? new Date(viewReport.created_at).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : ''}
                  </p>
                  <button
                    onClick={() => handleDownloadFile(viewReport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all text-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t('businessReports.downloadReport')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Note Modal */}
        {viewNote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-scale-in">
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" /> {t('businessReports.notesTitle') || 'ملاحظات التقرير'}
                </h3>
                <button onClick={() => setViewNote(null)} className="text-white hover:text-blue-100 cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{viewNote}</p>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
                <button onClick={() => setViewNote(null)} className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-colors shadow-md cursor-pointer">{t('businessReports.close') || 'إغلاق'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Delete File Confirmation Modal */}
        {showDeleteFileConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-scale-in text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">تأكيد حذف المرفق</h3>
              <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من حذف المرفق؟</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({ ...prev, file_url: '', file_name: '', files: [] }));
                    setShowDeleteFileConfirm(false);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all cursor-pointer text-sm"
                >
                  موافق
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteFileConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-all cursor-pointer text-sm"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default BusinessReports;
