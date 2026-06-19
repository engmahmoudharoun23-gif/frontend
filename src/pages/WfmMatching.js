import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import Layout from '../components/Layout';
import { translateBrandingText } from '../utils/brandingTranslation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function WfmMatching({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const fileInputRef = useRef(null);

  const [availableProjects, setAvailableProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    matched: 0,
    unmatched: 0,
    duplicates: 0,
    platformTotal: 0
  });
  
  const [platformMissing, setPlatformMissing] = useState([]);
  const [wfmMissing, setWfmMissing] = useState([]);
  const [activeTab, setActiveTab] = useState('platform'); // 'platform' | 'wfm'
  
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadFilename, setDownloadFilename] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (user.role === 'admin') {
          const response = await axios.get(`${API}/projects`);
          const projects = response.data.map(p => p.name).sort((a, b) => a.localeCompare(b, 'ar'));
          setAvailableProjects(projects);
        } else {
          const projects = user.projects || [];
          setAvailableProjects(projects);
        }
      } catch (err) {
        console.error("Error fetching projects", err);
      }
    };
    fetchProjects();
  }, [user]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setDownloadUrl(null);
      setProgress(0);
      setStats({ total: 0, matched: 0, unmatched: 0, duplicates: 0, platformTotal: 0 });
      setPlatformMissing([]);
      setWfmMissing([]);
    }
  };

  const findTicketColumnIndex = (headers) => {
    const possibleNames = ['ticket number', 'رقم البلاغ', 'complaint number', 'ticket', 'ticket_number', 'report number', 'report_number', 'الرقم', 'رقم الطلب', 'complaint'];
    for (let i = 0; i < headers.length; i++) {
      const headerText = String(headers[i] || '').toLowerCase().trim();
      if (possibleNames.some(name => headerText.includes(name))) {
        return i;
      }
    }
    return -1;
  };

  const startMatching = async () => {
    if (!selectedProject) {
      toast.warning(t('wfmMatching.selectProjectFirst', 'يرجى تحديد المشروع أولاً.'));
      return;
    }
    if (!file) {
      toast.warning(t('wfmMatching.uploadPrompt', 'يرجى رفع ملف Excel أولاً.'));
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setPlatformMissing([]);
    setWfmMissing([]);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            toast.error(t('wfmMatching.errorMatching', 'الملف فارغ أو لا يحتوي على بيانات.'));
            setIsProcessing(false);
            return;
          }

          setProgress(30);

          const headers = jsonData[0];
          const ticketColIdx = findTicketColumnIndex(headers);
          
          if (ticketColIdx === -1) {
            toast.error(t('wfmMatching.noTicketColumn', 'لم يتم العثور على عمود يحتوي على أرقام البلاغات. يرجى التأكد من الملف.'));
            setIsProcessing(false);
            return;
          }

          let actualTotalRows = 0;
          let actualDuplicates = 0;
          const uniqueRows = [];
          const seenTickets = new Set();
          const extractedTickets = [];
          const wfmMissingList = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row.length === 0 || row.every(cell => String(cell).trim() === '')) continue;
            
            actualTotalRows++;

            const originalTicketVal = String(row[ticketColIdx] || '');
            const ticketVal = originalTicketVal.trim();

            if (!ticketVal) {
               wfmMissingList.push({ report_number: t('wfmMatching.noNumber', 'بدون رقم'), reason: t('wfmMatching.rowHasDataButNoNumber', 'الصف يحتوي بيانات لكن خلية رقم البلاغ فارغة') });
               continue;
            }

            if (seenTickets.has(ticketVal)) {
              actualDuplicates++;
              wfmMissingList.push({ report_number: ticketVal, reason: t('wfmMatching.duplicateInWfm', 'تكرار البلاغ داخل ملف WFM') });
            } else {
              seenTickets.add(ticketVal);
              uniqueRows.push({ row, ticketVal, originalTicketVal });
              extractedTickets.push(ticketVal);
            }
          }

          setProgress(50);

          const token = localStorage.getItem("token");
          const response = await axios.post(
            `${API}/wfm_matching/check`,
            { 
              project: selectedProject,
              report_numbers: extractedTickets 
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          setProgress(70);

          const matchedOriginals = response.data.matched || [];
          const platformMissingData = response.data.platform_missing || [];
          const platformTotal = response.data.platform_total || 0;
          const matchedSet = new Set(matchedOriginals);

          const matchedRows = [];
          for (const item of uniqueRows) {
            const { row, ticketVal, originalTicketVal } = item;
            if (matchedSet.has(ticketVal)) {
              matchedRows.push(row);
            } else {
              let reason = t('wfmMatching.notFoundInPlatform', 'البلاغ غير موجود داخل المنصة');
              if (originalTicketVal !== ticketVal) {
                 reason = t('wfmMatching.hasSpacesAndNotFound', 'وجود مسافات قبل أو بعد رقم البلاغ (وغير موجود بالمنصة)');
              } else if (ticketVal.startsWith('0')) {
                 reason = t('wfmMatching.hasZerosAndNotFound', 'اختلاف في صيغة الرقم (يحتوي على أصفار) وغير موجود بالمنصة');
              }
              wfmMissingList.push({
                report_number: originalTicketVal,
                reason: reason
              });
            }
          }

          const finalMatchedCount = matchedRows.length;
          const unmatchedCount = uniqueRows.length - finalMatchedCount;

          setStats({
            total: actualTotalRows,
            duplicates: actualDuplicates,
            matched: finalMatchedCount,
            unmatched: unmatchedCount,
            platformTotal: platformTotal
          });
          
          setPlatformMissing(platformMissingData);
          setWfmMissing(wfmMissingList);

          setProgress(90);

          const finalAOA = [headers, ...matchedRows];
          const newWorksheet = XLSX.utils.aoa_to_sheet(finalAOA);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Matched Reports");

          const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          
          setDownloadUrl(url);
          setDownloadFilename(`Cleaned_WFM_${selectedProject}_${new Date().getTime()}.xlsx`);
          
          setProgress(100);
          toast.success(t('wfmMatching.matchingComplete', 'تمت عملية المطابقة بنجاح!'));
          
        } catch (error) {
          console.error("Matching Error:", error);
          toast.error(t('wfmMatching.errorMatching', 'حدث خطأ أثناء عملية المطابقة.'));
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        toast.error(t('wfmMatching.errorMatching', 'حدث خطأ أثناء قراءة الملف.'));
        setIsProcessing(false);
      };

      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      console.error(error);
      toast.error(t('wfmMatching.errorMatching', 'حدث خطأ أثناء عملية المطابقة.'));
      setIsProcessing(false);
    }
  };

  const hasExceptions = platformMissing.length > 0 || wfmMissing.length > 0;

  return (
    <Layout user={user} onLogout={onLogout} title={t("wfmMatching.title", "مطابقة بلاغات WFM")}>
      <div className="p-4 md:p-8 mx-auto max-w-7xl animate-fade-in-up">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
              <span className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </span>
              {t("wfmMatching.title", "مطابقة بلاغات WFM")}
            </h1>
            <p className="text-gray-500 font-medium mr-14">
              {t("wfmMatching.subtitle", "رفع ملف WFM لمطابقة البلاغات مع قاعدة بيانات المنصة")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              
              <div className="mb-5">
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('wfmMatching.selectProjectToMatch', 'اختر المشروع للمطابقة')}</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="" disabled>{t('wfmMatching.selectProjectFromList', '-- اختر المشروع من القائمة --')}</option>
                  {availableProjects.map(p => (
                    <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">{t("wfmMatching.uploadExcel", "رفع ملف WFM (Excel)")}</label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center p-6 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer group"
                >
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  </div>
                  <span className="font-bold text-indigo-700 text-center text-sm">
                    {file ? file.name : t("wfmMatching.uploadExcel", "اختر ملف Excel")}
                  </span>
                </button>
              </div>

              <button
                onClick={startMatching}
                disabled={!file || !selectedProject || isProcessing}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-gray-900/20"
              >
                {isProcessing ? (
                  <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {t("wfmMatching.matchingProgress", "جاري عملية المطابقة...")}</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {t("wfmMatching.startMatching", "بدء المطابقة")}</>
                )}
              </button>

              {isProcessing && (
                <div className="mt-6">
                  <div className="flex justify-between text-xs font-bold text-indigo-700 mb-2">
                    <span>التقدم</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {downloadUrl && (
              <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">{t("wfmMatching.matchingComplete", "تمت المطابقة بنجاح")}</h3>
                    <p className="text-xs text-emerald-700 mt-1">يحتوي على {stats.matched} بلاغ مطابق</p>
                  </div>
                </div>
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {t("wfmMatching.downloadClean", "تنزيل الملف النهائي المطابق")}
                </a>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8 h-full">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                {t('wfmMatching.statsTitle', 'نتائج وإحصائيات المطابقة')}
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-gray-500 mb-1">{t("wfmMatching.totalWfm", "إجمالي WFM")}</p>
                  <p className="text-2xl font-black text-gray-900">{stats.total.toLocaleString()}</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-blue-700 mb-1">{t('wfmMatching.platformTotal', 'بلاغات المنصة للمشروع')}</p>
                  <p className="text-2xl font-black text-blue-800">{stats.platformTotal.toLocaleString()}</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-emerald-700 mb-1">{t("wfmMatching.matchedReports", "المطابقة المشتركة")}</p>
                  <p className="text-2xl font-black text-emerald-700">{stats.matched.toLocaleString()}</p>
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-orange-700 mb-1">{t("wfmMatching.duplicateWfm", "تكرارات WFM")}</p>
                  <p className="text-2xl font-black text-orange-700">{stats.duplicates.toLocaleString()}</p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-red-700 mb-1">{t('wfmMatching.platformExceptions', 'استثناءات المنصة')}</p>
                  <p className="text-2xl font-black text-red-700">{platformMissing.length.toLocaleString()}</p>
                </div>

                <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex flex-col items-center text-center">
                  <p className="text-xs font-bold text-pink-700 mb-1">{t('wfmMatching.wfmExceptions', 'استثناءات WFM')}</p>
                  <p className="text-2xl font-black text-pink-700">{wfmMissing.length.toLocaleString()}</p>
                </div>
              </div>
              
              {!downloadUrl && !isProcessing && stats.total === 0 && (
                <div className="mt-8 flex flex-col items-center justify-center text-center py-6 opacity-50">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="text-gray-500 font-bold text-sm">{t('wfmMatching.uploadToSeeResults', 'ارفع الملف وابدأ المطابقة لظهور النتائج والتفاصيل')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Exception Reports Tables */}
        {hasExceptions && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            
            {/* Header / Tabs */}
            <div className="flex border-b border-gray-200">
              <button 
                onClick={() => setActiveTab('platform')}
                className={`flex-1 py-4 px-6 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'platform' ? 'bg-red-50 text-red-700 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {t('wfmMatching.platformMissingTab', 'بلاغات بالمنصة ولم تعتمد بالملف')} ({platformMissing.length})
              </button>
              <button 
                onClick={() => setActiveTab('wfm')}
                className={`flex-1 py-4 px-6 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'wfm' ? 'bg-pink-50 text-pink-700 border-b-2 border-pink-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {t('wfmMatching.wfmMissingTab', 'استثناءات ملف WFM المرفوع')} ({wfmMissing.length})
              </button>
            </div>

            {/* Platform Missing Tab */}
            {activeTab === 'platform' && (
              <div className="p-6">
                {platformMissing.length > 0 ? (
                  <>
                    <div className="bg-red-100 text-red-800 p-4 rounded-xl mb-6 font-bold flex items-center gap-3">
                      <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t('wfmMatching.platformMissingMessage', { count: platformMissing.length, defaultValue: `يوجد ${platformMissing.length} بلاغ موجود بالمنصة ولم يتم العثور عليه داخل ملف WFM للمشروع المحدد.` }).replace('{{count}}', platformMissing.length)}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-4 py-3 font-bold border-b">{t('wfmMatching.reportNumber', 'رقم البلاغ')}</th>
                            <th className="px-4 py-3 font-bold border-b">{t('wfmMatching.governorate', 'المحافظة')}</th>
                            <th className="px-4 py-3 font-bold border-b">{t('wfmMatching.contractor', 'المقاول')}</th>
                            <th className="px-4 py-3 font-bold border-b">{t('wfmMatching.reportDate', 'تاريخ البلاغ')}</th>
                            <th className="px-4 py-3 font-bold border-b text-red-600">{t('wfmMatching.mismatchReason', 'سبب عدم المطابقة')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {platformMissing.map((item, idx) => (
                            <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                              <td className="px-4 py-3 font-black text-gray-900" dir="ltr">{item.report_number}</td>
                              <td className="px-4 py-3 font-semibold text-gray-700">{translateBrandingText(item.governorate, isRtl)}</td>
                              <td className="px-4 py-3 font-semibold text-gray-700">{translateBrandingText(item.contractor, isRtl)}</td>
                              <td className="px-4 py-3 text-gray-500" dir="ltr">{item.created_at ? new Date(item.created_at).toLocaleDateString('en-GB') : '-'}</td>
                              <td className="px-4 py-3 font-bold text-red-600">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-emerald-600 font-bold">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t('wfmMatching.allPlatformMatched', 'ممتاز! جميع البلاغات المسجلة في المنصة مطابقة تماماً وموجودة في ملف الـ WFM.')}
                  </div>
                )}
              </div>
            )}

            {/* WFM Missing Tab */}
            {activeTab === 'wfm' && (
              <div className="p-6">
                {wfmMissing.length > 0 ? (
                  <>
                    <div className="bg-pink-100 text-pink-800 p-4 rounded-xl mb-6 font-bold flex items-center gap-3">
                      <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {t('wfmMatching.wfmMissingMessage', { count: wfmMissing.length, defaultValue: `يوجد ${wfmMissing.length} تكرار أو استثناء من بلاغات ملف WFM غير مسجلة بالمنصة.` }).replace('{{count}}', wfmMissing.length)}
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-4 py-3 font-bold border-b">{t('wfmMatching.wfmReportNumber', 'رقم البلاغ (WFM)')}</th>
                            <th className="px-4 py-3 font-bold border-b text-pink-600">{t('wfmMatching.reasonOrCategory', 'التصنيف أو السبب')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {wfmMissing.map((item, idx) => (
                            <tr key={idx} className="hover:bg-pink-50/50 transition-colors">
                              <td className="px-4 py-3 font-black text-gray-900" dir="ltr">{item.report_number}</td>
                              <td className="px-4 py-3 font-bold text-pink-600">{item.reason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-emerald-600 font-bold">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t('wfmMatching.allWfmMatched', 'لا توجد أي بلاغات زائدة أو غير مطابقة في ملف WFM.')}
                  </div>
                )}
              </div>
            )}
            
          </div>
        )}
      </div>
    </Layout>
  );
}

export default WfmMatching;
