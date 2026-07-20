import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { translateBrandingText } from '../utils/brandingTranslation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function UpdateReports({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const fileInputRef = useRef(null);

  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    platformTotal: 0,
    newReports: 0,
    updatedReports: 0,
    excelCount: 0,
    newReportList: [],
    updatedReportList: [],
    downloadUrl: null
  });
  
  const [showSummary, setShowSummary] = useState(false);
  const [activeTab, setActiveTab] = useState('updated'); // 'updated' | 'new'

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const [projectsRes, connProjectsRes] = await Promise.all([
          axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] })),
          axios.get(`${API}/connection-projects`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
        ]);
        
        const allProjects = [...(projectsRes.data || []), ...(connProjectsRes.data || [])];
        const uniqueProjects = Array.from(new Set(allProjects.map(p => p.name)));
        
        const normalizeArabic = (text) => text ? text.toString().trim().replace(/\s+/g, " ").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي") : "";
        const myNormalizedProjects = (user.projects || []).map(p => normalizeArabic(p));
        
        const filtered = user.role === 'admin' 
          ? uniqueProjects 
          : uniqueProjects.filter(p => myNormalizedProjects.includes(normalizeArabic(p)));
          
        setAvailableProjects(filtered.sort((a, b) => a.localeCompare(b, 'ar')));
      } catch (error) {
        console.error("Failed to fetch projects", error);
      }
    };
    fetchProjects();
  }, [user]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!file) return toast.error(t('updateReports.selectFile', 'الرجاء اختيار ملف Excel أولاً'));
    if (!selectedProject) return toast.error(t('updateReports.selectProject', 'الرجاء اختيار المشروع'));

    setIsProcessing(true);
    setProgress(0);
    setShowSummary(false);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress(prev => prev >= 90 ? 90 : prev + 10);
    }, 500);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('project', selectedProject);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/update-reports/process`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      clearInterval(interval);
      setProgress(100);
      
      setStats({
        platformTotal: response.data.platform_total || 0,
        newReports: response.data.new_reports_count,
        updatedReports: response.data.updated_reports_count,
        excelCount: response.data.uploaded_excel_count || 0,
        newReportList: response.data.new_reports,
        updatedReportList: response.data.updated_reports,
        downloadUrl: response.data.url
      });
      
      setTimeout(() => {
        setIsProcessing(false);
        setShowSummary(true);
      }, 500);

    } catch (error) {
      clearInterval(interval);
      setIsProcessing(false);
      setProgress(0);
      toast.error(error.response?.data?.detail || t('updateReports.processError', 'حدث خطأ أثناء المعالجة'));
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className={`p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-xl">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{t('sidebar.updateReports', 'تحديث البلاغات')}</h1>
            <p className="text-gray-500 mt-1">{t('updateReports.subtitle', 'قم برفع ملف الإكسيل لتحديث بياناته بناءً على أحدث البلاغات في المنصة')}</p>
          </div>
        </div>

        {/* Main Area: Grid 1/3 and 2/3 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto w-full mb-8">
          
          {/* Left Column: Uploader */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 h-full flex flex-col space-y-6">
              
              <div className="w-full">
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('updateReports.projectSelect', 'اختر المشروع')}</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-3 bg-gray-50 text-gray-800 font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all cursor-pointer hover:bg-white"
                >
                  <option value="" disabled>{t('updateReports.projectSelectPlaceholder', '-- اختر المشروع --')}</option>
                  {availableProjects.map((p, idx) => (
                    <option key={idx} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
              </div>

              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group flex-1 flex flex-col justify-center items-center text-center ${isProcessing ? 'border-indigo-300 bg-indigo-50 opacity-80 cursor-wait' : file ? 'border-emerald-400 bg-emerald-50 hover:bg-emerald-100' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'}`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-4 w-full overflow-hidden">
                    <div className="bg-emerald-100 p-4 rounded-full text-emerald-600 shrink-0">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="w-full px-2">
                      <p className="font-bold text-emerald-800 text-sm truncate" dir="ltr" title={file.name}>{file.name}</p>
                      <p className="text-emerald-600 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    {!isProcessing && <p className="text-gray-400 text-xs mt-2">{t('updateReports.clickToChange', 'انقر لتغيير الملف')}</p>}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-500 group-hover:text-indigo-600 transition-colors">
                    <div className="bg-gray-100 p-4 rounded-full group-hover:bg-indigo-100 transition-colors">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm">{t('updateReports.uploadInstruction', 'انقر هنا لاختيار ملف الإكسيل')}</p>
                      <p className="text-xs opacity-70">.xlsx, .xls</p>
                    </div>
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="w-full space-y-2">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs font-bold text-indigo-600 animate-pulse text-center">{t('updateReports.processing', 'جاري معالجة وتحديث الملف...')}</p>
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={!file || !selectedProject || isProcessing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black px-6 py-4 rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {t('updateReports.processingBtn', 'جاري التحديث...')}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    {t('updateReports.startUpdateBtn', 'ابدأ تحديث الملف')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Stats */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 h-full">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                {t('updateReports.summaryTitle', 'نتائج وإحصائيات التحديث')}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-blue-700 mb-1">{t('updateReports.excelCount', 'بلاغات الإكسيل المرفوع')}</p>
                  <p className="text-2xl font-black text-blue-700">{stats.excelCount}</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-emerald-700 mb-1">{t('updateReports.newCount', 'بلاغات جديدة أُضيفت')}</p>
                  <p className="text-2xl font-black text-emerald-700">{stats.newReports}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-yellow-700 mb-1">{t('updateReports.updatedCount', 'بلاغات تم تحديثها')}</p>
                  <p className="text-2xl font-black text-yellow-700">{stats.updatedReports}</p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-gray-500 mb-1">{t('updateReports.platformTotal', 'إجمالي بلاغات المنصة')}</p>
                  <p className="text-2xl font-black text-gray-900">{stats.platformTotal}</p>
                </div>
              </div>

              {!stats.downloadUrl && !isProcessing && (stats.updatedReports + stats.newReports === 0) && (
                <div className="mt-8 flex flex-col items-center justify-center text-center py-6 opacity-50">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-gray-500 font-bold text-sm">{t('updateReports.uploadToSeeResults', 'ارفع الملف وابدأ التحديث لظهور النتائج')}</p>
                </div>
              )}

              {stats.downloadUrl && (
                <div className="mt-8 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 animate-fade-in-up">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-emerald-900">{t("updateReports.summaryTitle", "تم التحديث بنجاح")}</h3>
                      <p className="text-xs text-emerald-700 mt-1">يحتوي على تفاصيل {stats.updatedReports + stats.newReports} إجراء</p>
                    </div>
                  </div>
                  <a
                    href={`${BACKEND_URL}${stats.downloadUrl}`}
                    download
                    onClick={() => toast.success(t('updateReports.downloading', 'جاري تنزيل الملف...'))}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    {t('updateReports.downloadExcel', 'تنزيل الإكسيل المحدث')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Tables */}
        {(stats.updatedReportList.length > 0 || stats.newReportList.length > 0) && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up max-w-7xl mx-auto w-full mb-8">
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button 
                className={`flex-1 py-4 px-6 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'updated' ? 'bg-white text-yellow-600 border-b-2 border-yellow-500' : 'text-gray-500 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('updated')}
              >
                {t('updateReports.updatedTab', 'البلاغات المحدثة')} ({stats.updatedReports})
              </button>
              <button 
                className={`flex-1 py-4 px-6 font-bold text-sm transition-colors flex items-center justify-center gap-2 ${activeTab === 'new' ? 'bg-white text-green-600 border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('new')}
              >
                {t('updateReports.newTab', 'البلاغات الجديدة')} ({stats.newReports})
              </button>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto p-0">
              {activeTab === 'updated' && (
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.reportNum', 'رقم البلاغ')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">رقم الرخصة</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.date', 'تاريخ البلاغ')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.gov', 'المحافظة')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.observer', 'المراقب')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.oldStatus', 'الحالة السابقة')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.newStatus', 'الحالة الجديدة')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.updatedReportList.length > 0 ? stats.updatedReportList.map((r, i) => {
                      const formattedDate = r.date || '-';
                      return (
                      <tr key={i} className="hover:bg-yellow-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <a href={`/reports?search=${r.number}&exact=true`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 border px-3 py-1.5 rounded-lg font-mono text-xs shadow-sm transition-colors group ${r.changed_fields?.some(f => f.field === 'رقم البلاغ') ? 'bg-yellow-200 border-yellow-300 text-yellow-800 hover:bg-yellow-300' : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'}`} dir="ltr" title={t('updateReports.viewReport', 'عرض البلاغ')}>
                            <span>{r.number}</span>
                            <svg className={`w-3.5 h-3.5 transition-colors ${r.changed_fields?.some(f => f.field === 'رقم البلاغ') ? 'text-yellow-600 group-hover:text-yellow-800' : 'text-indigo-400 group-hover:text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {r.license ? (
                            <span className={`text-[11px] font-mono px-2 py-1 rounded border ${r.changed_fields?.some(f => f.field === 'رقم الرخصة') ? 'bg-yellow-200 border-yellow-300 text-yellow-800' : 'bg-gray-100 border-gray-200 text-gray-600'}`} dir="ltr">
                              {r.license}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{formattedDate}</td>
                        <td className="px-4 py-3 text-gray-600">{translateBrandingText(r.gov, isRtl) || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{r.observer || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{r.old_status || '-'}</td>
                        <td className="px-4 py-3 font-black text-yellow-600 bg-yellow-50/30">{r.new_status || '-'}</td>
                      </tr>
                    )}) : <tr><td colSpan="7" className="text-center py-8 text-gray-400">{t('updateReports.noUpdates', 'لا توجد بلاغات محدثة')}</td></tr>}
                  </tbody>
                </table>
              )}

              {activeTab === 'new' && (
                <table className="w-full text-right text-sm">
                  <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.reportNum', 'رقم البلاغ')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">رقم الرخصة</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.date', 'تاريخ البلاغ')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.gov', 'المحافظة')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.observer', 'المراقب')}</th>
                      <th className="px-4 py-3 font-bold text-gray-600 bg-gray-100">{t('updateReports.status', 'الحالة')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.newReportList.length > 0 ? stats.newReportList.map((r, i) => {
                      const formattedDate = r.date || '-';
                      return (
                      <tr key={i} className="hover:bg-green-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <a href={`/reports?search=${r.number}&exact=true`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-3 py-1.5 rounded-lg font-mono text-xs shadow-sm transition-colors group" dir="ltr" title={t('updateReports.viewReport', 'عرض البلاغ')}>
                            <span>{r.number}</span>
                            <svg className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </a>
                        </td>
                        <td className="px-4 py-3">
                          {r.license ? (
                            <span className="text-[11px] text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded border border-gray-200" dir="ltr">
                              {r.license}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{formattedDate}</td>
                        <td className="px-4 py-3 text-gray-600">{translateBrandingText(r.gov, isRtl) || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{r.observer || '-'}</td>
                        <td className="px-4 py-3 font-black text-green-600 bg-green-50/30">{r.status || '-'}</td>
                      </tr>
                    )}) : <tr><td colSpan="6" className="text-center py-8 text-gray-400">{t('updateReports.noNew', 'لا توجد بلاغات جديدة')}</td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default UpdateReports;
