import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';

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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [historyFiles, setHistoryFiles] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const handleViewExcel = async (url) => {
    try {
      setActiveDropdown(null);
      toast.info(t('wfmMatching.loadingPreview', 'جاري تحميل البيانات للعرض...'));
      const response = await axios.get(`${BACKEND_URL}${url}`, { responseType: 'arraybuffer' });
      const data = new Uint8Array(response.data);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true });
      // Remove completely empty rows from the end
      let lastRowIndex = jsonData.length - 1;
      while (lastRowIndex >= 0 && (!jsonData[lastRowIndex] || jsonData[lastRowIndex].length === 0)) {
        lastRowIndex--;
      }
      
      const cleanedData = jsonData.slice(0, lastRowIndex + 1);
      
      // Post-process the data for Date formatting and auto-numbering
      if (cleanedData.length > 0) {
        const headers = cleanedData[0];
        const dateIndices = [];
        const mIndex = headers.findIndex(h => typeof h === 'string' && (h.trim() === 'م' || h.trim() === '#'));
        
        headers.forEach((h, idx) => {
          if (typeof h === 'string' && (h.includes('تاريخ') || h.toLowerCase().includes('date'))) {
            dateIndices.push(idx);
          }
        });
        
        for (let i = 1; i < cleanedData.length; i++) {
          const row = cleanedData[i];
          if (!row) continue;
          
          // 1. Auto-numbering for 'م'
          if (mIndex !== -1) {
             row[mIndex] = i; 
          }
          
          // 2. Format dates (Excel serial numbers to JS readable string)
          dateIndices.forEach(idx => {
            const val = row[idx];
            if (typeof val === 'number' && val > 30000 && val < 60000) {
              // Convert Excel serial date to JS Date
              const date = new Date(Math.round((val - 25569) * 86400 * 1000));
              const d = String(date.getDate()).padStart(2, '0');
              const m = String(date.getMonth() + 1).padStart(2, '0');
              const y = date.getFullYear();
              row[idx] = `${d}-${m}-${y}`;
            }
          });
        }
      }
      
      setPreviewData(cleanedData);
      setShowPreviewModal(true);
    } catch (error) {
      console.error("Preview error:", error);
      toast.error(t('wfmMatching.previewError', 'حدث خطأ أثناء محاولة عرض الملف.'));
    }
  };

  const fetchHistory = async () => {
    try {
      setFetchingHistory(true);
      const token = localStorage.getItem("token");
      const url = selectedProject ? `${API}/wfm-matching/history?project=${encodeURIComponent(selectedProject)}` : `${API}/wfm-matching/history`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setHistoryFiles(res.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [selectedProject, user]);

  const handleDeleteHistory = async (fileId) => {
    if (!window.confirm(t('wfmMatching.confirmDelete', 'هل أنت متأكد من حذف هذا الملف؟'))) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/wfm-matching/${fileId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t('wfmMatching.deleteSuccess', 'تم حذف الملف بنجاح'));
      fetchHistory();
    } catch (err) {
      toast.error(t('wfmMatching.deleteError', 'حدث خطأ أثناء الحذف'));
    }
  };


  useEffect(() => {
    const fetchProjects = async () => {
      try {
        if (user.role === 'admin') {
          try {
            const response = await axios.get(`${API}/projects`);
            const projects = response.data.map(p => p.name).sort((a, b) => a.localeCompare(b, 'ar'));
            setAvailableProjects(projects);
          } catch (e) {
            console.error("API/projects failed, using fallback:", e);
            setAvailableProjects(['مشروع المحافظات الغربية', 'مشروع كشف التسربات وإصلاحها', 'مشروع التشوه البصري']);
          }
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
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (jsonData.length < 2) {
            toast.error(t('wfmMatching.errorMatching', 'الملف فارغ أو لا يحتوي على بيانات.'));
            setIsProcessing(false);
            return;
          }

          setProgress(30);

          let headerRowIdx = -1;
          let ticketColIdx = -1;
          let headers = [];

          for (let r = 0; r < Math.min(10, jsonData.length); r++) {
            const currentHeaders = jsonData[r];
            const idx = findTicketColumnIndex(currentHeaders);
            if (idx !== -1) {
              headerRowIdx = r;
              headers = currentHeaders;
              ticketColIdx = idx;
              break;
            }
          }

          if (ticketColIdx === -1) {
            toast.error(t('wfmMatching.noTicketColumn', 'لم يتم العثور على عمود يحتوي على أرقام البلاغات. يرجى التأكد من الملف.'));
            setIsProcessing(false);
            return;
          }

          const prefixRows = [];
          for (let i = 0; i < headerRowIdx; i++) {
            prefixRows.push(jsonData[i]);
          }

          let actualTotalRows = 0;
          let actualDuplicates = 0;
          const uniqueRows = [];
          const seenTickets = new Set();
          const extractedTickets = [];
          const wfmMissingList = [];

          for (let i = headerRowIdx + 1; i < jsonData.length; i++) {
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

          const finalAOA = [...prefixRows, headers, ...matchedRows];
          const newWorksheet = XLSX.utils.aoa_to_sheet(finalAOA);
          const newWorkbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Matched Reports");

          const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });

          const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          
          setDownloadUrl(url);
          const fname = `Cleaned_WFM_${selectedProject}_${new Date().getTime()}.xlsx`;
          setDownloadFilename(fname);
          setDownloadFilename(fname);
          
          // Save to backend automatically
          try {
            const formData = new FormData();
            formData.append('file', blob, fname);
            formData.append('project', selectedProject);
            formData.append('stats', JSON.stringify({
              total: actualTotalRows,
              matched: finalMatchedCount,
              unmatched: unmatchedCount,
              platformTotal: platformTotal,
              duplicates: actualDuplicates
            }));
            
            await axios.post(`${API}/wfm-matching/save`, formData, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            });
            fetchHistory(); // refresh history
          } catch (saveErr) {
            console.error("Error saving file to backend:", saveErr);
            // non-blocking
          }

          
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
              <div className="bg-emerald-50 rounded-3xl border border-emerald-100 p-6 mt-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-emerald-900">{t("wfmMatching.matchingComplete", "تمت المطابقة بنجاح")}</h3>
                    <p className="text-xs text-emerald-700 mt-1">يحتوي على {stats.matched} بلاغ مطابق</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <a
                    href={downloadUrl}
                    download={downloadFilename}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    تنزيل الاكسل بعد المطابقة (تمت إزالة المكرر والغير موجود)
                  </a>
                </div>
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
                    <div className="overflow-x-auto rounded-xl border border-gray-200 w-full">
                      <table className="w-full text-right text-sm min-w-[800px]">
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
                    <div className="overflow-x-auto rounded-xl border border-gray-200 w-full">
                      <table className="w-full text-right text-sm min-w-[600px]">
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

        {/* History Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mt-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {t('wfmMatching.historyTitle', 'سجل الملفات المطابقة السابقة')}
            </h2>
            <button onClick={fetchHistory} className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors">
              <svg className={`w-5 h-5 ${fetchingHistory ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            </button>
          </div>
          
          {historyFiles.length > 0 ? (
            <>
            <div className="overflow-visible rounded-xl border border-gray-200 w-full">
              <table className="w-full text-right text-sm min-w-[1000px]">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 font-bold border-b text-center whitespace-nowrap">{t('wfmMatching.filename', 'اسم الملف')}</th>
                    <th className="px-4 py-3 font-bold border-b text-center whitespace-nowrap">{t('wfmMatching.project', 'المشروع')}</th>
                    <th className="px-4 py-3 font-bold border-b text-center w-full min-w-[400px]">{t('wfmMatching.stats', 'الإحصائيات')}</th>
                    <th className="px-4 py-3 font-bold border-b text-center whitespace-nowrap">{t('wfmMatching.date', 'التاريخ')}</th>
                    <th className="px-4 py-3 font-bold border-b text-center whitespace-nowrap">{t('wfmMatching.actions', 'إجراءات')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historyFiles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((file, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-center font-semibold text-gray-900 whitespace-nowrap" dir="ltr" title={file.filename}>
                        <div className="flex items-center justify-center gap-2 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
                          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                          <span>{t('wfmMatching.defaultFileName', 'ملف WFM')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-indigo-700 whitespace-nowrap">{translateBrandingText(file.project, isRtl)}</td>
                      <td className="px-4 py-3 text-gray-600 text-center min-w-[350px]">
                        {file.stats && (
                          <div className="flex justify-center items-center flex-wrap gap-2 text-xs w-full">
                            {file.stats.total !== undefined && (
                              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md border border-gray-200 font-bold">
                                {t('wfmMatching.totalWfm', 'إجمالي WFM')}: <span dir="ltr" className="inline-block">{file.stats.total}</span>
                              </span>
                            )}
                            {file.stats.platformTotal !== undefined && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md border border-blue-200 font-bold">
                                {t('wfmMatching.platformTotalShort', 'إجمالي المنصة')}: <span dir="ltr" className="inline-block">{file.stats.platformTotal}</span>
                              </span>
                            )}
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md border border-emerald-200 font-bold">
                              {t('wfmMatching.matched', 'مطابق')}: <span dir="ltr" className="inline-block">{file.stats.matched || 0}</span>
                            </span>
                            <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded-md border border-pink-200 font-bold">
                              {t('wfmMatching.wfmExceptions', 'استثناءات WFM')}: <span dir="ltr" className="inline-block">{file.stats.unmatched || 0}</span>
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap" dir="ltr">
                        {new Date(file.created_at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td className="px-4 py-3 text-center relative">
                        <button
                          onClick={() => setActiveDropdown(activeDropdown === file.id ? null : file.id)}
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 focus:outline-none"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                        </button>

                        {activeDropdown === file.id && (
                          <div 
                            className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden text-sm font-bold`}
                            onMouseLeave={() => setActiveDropdown(null)}
                          >
                            <button
                              onClick={() => handleViewExcel(file.url)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors text-right"
                            >
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                              {t('wfmMatching.viewExcel', 'عرض الملف')}
                            </button>
                            <a
                              href={`${BACKEND_URL}${file.url}`}
                              download
                              onClick={() => {
                                toast.success(t('wfmMatching.downloadSuccessToast', 'تم تنزيل الملف بنجاح ✅'));
                                setActiveDropdown(null);
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 transition-colors border-t border-gray-50"
                            >
                              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                              {t('wfmMatching.download', 'تنزيل')}
                            </a>
                            {(user.role === 'admin' || user.id === file.created_by) && (
                              <button
                                onClick={() => {
                                  handleDeleteHistory(file.id);
                                  setActiveDropdown(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-red-600 transition-colors border-t border-gray-50 text-right"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                {t('wfmMatching.delete', 'حذف')}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {historyFiles.length > 0 && (
              <div className="mt-6 bg-white border border-gray-100 rounded-xl">
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(historyFiles.length / itemsPerPage) || 1}
                  totalItems={historyFiles.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(limit) => {
                    setItemsPerPage(limit);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                  itemLabel={t('wfmMatching.files', 'ملفات')}
                />
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              {t('wfmMatching.noHistory', 'لا يوجد سجل للملفات المطابقة حتى الآن')}
            </div>
          )}
        </div>
      </div>
      {/* Excel Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {t('wfmMatching.previewTitle', 'معاينة الملف المطابق')}
              </h3>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200 sticky top-0 z-10">
                      <tr>
                        {previewData[0] && previewData[0].map((cell, i) => (
                          <th key={i} className="px-4 py-3 whitespace-nowrap border-l border-gray-200 last:border-l-0 shadow-sm">{cell}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {previewData.slice(1).map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-blue-50/50 transition-colors">
                          {previewData[0].map((_, colIdx) => (
                            <td key={colIdx} className="px-4 py-2 whitespace-nowrap border-l border-gray-100 last:border-l-0 text-gray-700">
                              {row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="px-6 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md"
              >
                {t('wfmMatching.closePreview', 'إغلاق المعاينة')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>

  );
}

export default WfmMatching;
