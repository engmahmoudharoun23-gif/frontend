import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { translateBrandingText } from '../utils/brandingTranslation';
import Pagination from '../components/Pagination';
import { hasProjectPermission } from '../utils/permissions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConsultantNotes = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const getInitialReports = () => {
    try {
      const cached = localStorage.getItem('cache_ConsultantNotes.js_reports');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return [];
  };
  const [reports, setReports] = useState(getInitialReports);
  const [loading, setLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Reply State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [currentReply, setCurrentReply] = useState('');
  const [selectedReplyReportId, setSelectedReplyReportId] = useState(null);
  const [isSavingReply, setIsSavingReply] = useState(false);
  const [editingBubbleIndex, setEditingBubbleIndex] = useState(null);
  const [editingBubbleText, setEditingBubbleText] = useState('');
  const [activeBubbleDropdown, setActiveBubbleDropdown] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const fetchNotes = async (page = currentPage, limit = itemsPerPage, search = searchQuery, status = statusFilter) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/consultant-notes`, {
        params: { page, limit, search, status_filter: status },
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports || []);
      setTotalItems(response.data.total || 0);
      try {
        if (page === 1 && !search) {
          localStorage.setItem('cache_ConsultantNotes.js_reports', JSON.stringify(response.data.reports || []));
        }
      } catch(e) {}
    } catch (error) {
      console.error('Error fetching consultant notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(currentPage, itemsPerPage, searchQuery, statusFilter);
  }, [currentPage, itemsPerPage, searchQuery, statusFilter]);

  const handleToggleProcess = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/reports/${reportId}/consultant_note_processed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === reportId ? { ...r, consultant_note_processed: response.data.consultant_note_processed, consultant_note_processed_date: response.data.consultant_note_processed_date } : r
        ));
        toast.success(response.data.consultant_note_processed 
          ? t('consultantNotesPage.processSuccess', { defaultValue: 'تمت المعالجة بنجاح' }) 
          : t('consultantNotesPage.processCanceled', { defaultValue: 'تم إلغاء المعالجة' }));
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(t('consultantNotesPage.processError', { defaultValue: 'حدث خطأ أثناء تغيير الحالة' }));
    }
  };

  const handleSaveReply = async () => {
    if (!selectedReplyReportId) return;
    setIsSavingReply(true);
    try {
      const token = localStorage.getItem('token');
      const report = reports.find(r => r.id === selectedReplyReportId);
      const userName = user?.full_name || user?.username || 'المستوى الثالث';
      let payloadReply = `---رد: ${userName}---\n${currentReply}`;
      
      if (report && report.consultant_note_reply) {
        payloadReply = report.consultant_note_reply + '\n\n' + payloadReply;
      }

      const response = await axios.put(`${API}/reports/${selectedReplyReportId}/consultant_note_reply`, { reply: payloadReply }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === selectedReplyReportId ? { ...r, consultant_note_reply: response.data.reply, consultant_note_replied_by: response.data.replied_by } : r
        ));
        toast.success(t('consultantNotesPage.replySuccess', { defaultValue: 'تم إرسال الرد بنجاح' }));
        setShowReplyModal(false);
      }
    } catch (error) {
      console.error('Error saving reply:', error);
      toast.error(t('consultantNotesPage.replyError', { defaultValue: 'حدث خطأ أثناء إرسال الرد' }));
    } finally {
      setIsSavingReply(false);
    }
  };

  const updateConsultantReplyString = async (reportId, newReplyStr) => {
    setIsSavingReply(true);
    try {
      const response = await axios.put(`${API}/reports/${reportId}/consultant_note_reply`, { reply: newReplyStr }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === reportId 
            ? { ...r, consultant_note_reply: response.data.reply, consultant_note_replied_by: response.data.replied_by } 
            : r
        ));
        toast.success(t('consultantNotesPage.replySuccess', { defaultValue: 'تم التحديث بنجاح' }));
        setEditingBubbleIndex(null);
      }
    } catch (error) {
      console.error('Error updating reply:', error);
      toast.error(t('consultantNotesPage.replyError', { defaultValue: 'حدث خطأ أثناء التحديث' }));
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!window.confirm(t('consultantNotesPage.confirmDeleteReply', { defaultValue: 'هل أنت متأكد من حذف الرد نهائياً؟' }))) return;
    setIsSavingReply(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/reports/${selectedReplyReportId}/consultant_note_reply`, { reply: '' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === selectedReplyReportId ? { ...r, consultant_note_reply: '', consultant_note_replied_by: '' } : r
        ));
        toast.success(t('consultantNotesPage.replyDeleted', { defaultValue: 'تم حذف الرد بنجاح' }));
        setShowReplyModal(false);
      }
    } catch (error) {
      console.error('Error deleting reply:', error);
      toast.error(t('consultantNotesPage.replyDeleteError', { defaultValue: 'حدث خطأ أثناء حذف الرد' }));
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleDeleteNote = async (reportId) => {
    if (!window.confirm(t('consultantNotesPage.confirmDeleteNote', { defaultValue: 'هل أنت متأكد من حذف الملاحظة وجميع الردود التابعة لها نهائياً؟' }))) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/reports/${reportId}/consultant_note`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success(t('consultantNotesPage.noteDeletedSuccess', { defaultValue: 'تم حذف الملاحظة بنجاح' }));
        fetchNotes(currentPage, itemsPerPage, searchQuery, statusFilter);
      }
    } catch (error) {
      console.error('Error deleting consultant note:', error);
      toast.error(t('consultantNotesPage.noteDeleteError', { defaultValue: 'حدث خطأ أثناء حذف الملاحظة' }));
    }
  };

  // Since we use server-side pagination and search:
  const currentItems = reports;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout user={user} onLogout={onLogout} title={t("consultantNotesPage.title", { defaultValue: "ملاحظات الاستشاري" })}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible mt-4">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("consultantNotesPage.title", { defaultValue: "ملاحظات الاستشاري" })}
            </h2>
            
            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap self-end sm:self-auto">
              {totalItems} {t("consultantNotesPage.totalNotesCount", { defaultValue: "ملاحظة" })}
            </span>
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-3 ${isRtl ? 'justify-start' : 'justify-end'}`}>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-bold text-gray-700 shadow-sm"
            >
              <option value="">{t("consultantNotesPage.allStatuses", { defaultValue: "جميع الحالات" })}</option>
              <option value="processed">{t("consultantNotesPage.processed", { defaultValue: "تمت المعالجة" })}</option>
              <option value="unprocessed">{t("consultantNotesPage.underProcessing", { defaultValue: "قيد المعالجة" })}</option>
            </select>
            <div className="relative w-full sm:w-1/2 md:w-1/3">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border-2 border-gray-200 text-gray-900 text-sm md:text-base rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-11"
                placeholder={t("common.search", { defaultValue: "بحث..." })}
                dir="auto"
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          {reports.length === 0 && loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>
            </div>
          ) : totalItems === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={searchQuery ? "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" : "M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"} />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">
                {searchQuery 
                  ? t("consultantNotesPage.noSearchResults", { defaultValue: "لا توجد نتائج مطابقة للبحث" })
                  : t("consultantNotesPage.noNotes", { defaultValue: "لا توجد ملاحظات من الاستشاري حالياً" })
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto pb-48">
                <table className="w-full text-sm text-right min-w-[800px]">
                <thead className="text-[13px] text-gray-800 bg-gray-100/80 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.reportNumber", { defaultValue: "رقم البلاغ" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.project", { defaultValue: "المشروع" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.governorate", { defaultValue: "المحافظة" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.contractor", { defaultValue: "المقاول" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.noteDate", { defaultValue: "تاريخ الملاحظة" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.status", { defaultValue: "الحالة" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("consultantNotesPage.closingDate", { defaultValue: "تاريخ إغلاق الملاحظة" })}</th>
                    <th className="px-6 py-5 font-black w-auto min-w-[300px]">{t("consultantNotesPage.note", { defaultValue: "الملاحظة" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap text-center w-[5%]">{t("consultantNotesPage.actions", { defaultValue: "إجراءات" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((report) => (
                    <tr key={report.id} className="hover:bg-blue-50/30 transition-colors">

                      <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">
                        <div className="flex items-center justify-start gap-2">
                          <span>{report.report_number || report.id.substring(0, 8)}</span>
                          {!report.consultant_note_processed && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                              {t("consultantNotesPage.new", { defaultValue: "جديد" })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{translateBrandingText(report.project, isRtl)}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{translateBrandingText(report.governorate, isRtl)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700 font-bold whitespace-nowrap">{translateBrandingText(report.contractor || '-', isRtl)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.consultant_note_date ? (
                          <span className="text-gray-500 font-bold text-[13px]" dir="ltr">
                            {new Date(report.consultant_note_date).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-bold text-[13px]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border ${
                          report.consultant_note_processed 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-800 text-white border-slate-900'
                        }`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {report.consultant_note_processed ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            )}
                          </svg>
                          {report.consultant_note_processed ? t('consultantNotesPage.processed', { defaultValue: 'تمت المعالجة' }) : t('consultantNotesPage.underProcessing', { defaultValue: 'قيد المعالجة' })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {report.consultant_note_processed_date ? (
                          <span className="text-emerald-600 font-bold text-[13px]" dir="ltr">
                            {new Date(report.consultant_note_processed_date).toLocaleDateString('en-GB')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-bold text-[13px]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-900 text-sm mt-2 p-3 shadow-sm w-fit min-w-[200px] max-w-full">
                          <div className="font-bold mb-2 opacity-90 text-[13px]">
                            {t("consultantNotesPage.consultantNoteBy", { defaultValue: "ملاحظة الاستشاري:" })} {(() => {
                              const name = report.consultant_note_by;
                              if (!name) return t('consultantNotesPage.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                              const lowerName = name.toLowerCase();
                              if (lowerName.includes('shazly') || lowerName.includes('شاذلي')) {
                                return t('consultantNotesPage.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                              }
                              if (lowerName.includes('motlaq') || lowerName.includes('مطلق')) {
                                return t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                              }
                              if (lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('استشاري')) {
                                return t('consultantNotesPage.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                              }
                              return translateBrandingText(name, isRtl);
                            })()}
                          </div>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {translateBrandingText(report.consultant_note, isRtl)}
                          </div>
                        </div>
                        {report.consultant_note_reply && (
                          <div className="mt-5 flex flex-col gap-4">
                            {(() => {
                              const replyText = report.consultant_note_reply;
                              if (!replyText.includes('---رد:') && !replyText.includes('--- إضافة جديدة ---')) {
                                return (
                                  <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm mt-3 p-3 shadow-sm">
                                    <div className="font-bold mb-2 opacity-90 text-[12px]">
                                      {t("consultantNotesPage.replyPrefix", { defaultValue: "رد:" })} {(() => {
                                        const name = report.consultant_note_replied_by;
                                        if (!name) return t('consultantNotesPage.level3', { defaultValue: 'المستوى الثالث' });
                                        const lowerName = name.toLowerCase();
                                        if (lowerName.includes('shazly') || lowerName.includes('شاذلي')) {
                                          return t('consultantNotesPage.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                                        }
                                        if (lowerName.includes('motlaq') || lowerName.includes('مطلق')) {
                                          return t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                                        }
                                        if (lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('استشاري')) {
                                          return t('consultantNotesPage.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                                        }
                                        return translateBrandingText(name, isRtl);
                                      })()}
                                    </div>
                                    <div className="whitespace-pre-wrap break-words leading-relaxed">
                                      {translateBrandingText(replyText, isRtl)}
                                    </div>
                                  </div>
                                );
                              }
                              
                              // Convert legacy delimiters to the new format sequentially
                              let currentText = replyText;
                              if (currentText.includes('--- إضافة جديدة ---')) {
                                const legacyParts = currentText.split(/---\s*إضافة جديدة\s*---/);
                                const lastIndex = legacyParts.length - 1;
                                currentText = legacyParts.map((part, index) => {
                                  if (index === 0) return part;
                                  const author = index === lastIndex ? (report.consultant_note_replied_by || t('consultantNotesPage.level3', { defaultValue: 'المستوى الثالث' })) : t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'مطلق الغامدي' });
                                  return `---رد: ${author}---${part}`;
                                }).join('');
                              }
                              
                              const parts = currentText.split(/---رد:\s*(.*?)---/);
                              const bubbles = [];
                              
                              if (parts[0].trim()) {
                                const firstAuthor = parts.length > 1 && replyText.includes('--- إضافة جديدة ---') 
                                  ? t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'مطلق الغامدي' }) 
                                  : (report.consultant_note_replied_by || t('consultantNotesPage.level3', { defaultValue: 'المستوى الثالث' }));
                                bubbles.push({ name: firstAuthor, text: parts[0].trim() });
                              }
                              
                              for (let i = 1; i < parts.length; i += 2) {
                                if (parts[i] && parts[i+1] && parts[i+1].trim()) {
                                  bubbles.push({ name: parts[i].trim(), text: parts[i+1].trim() });
                                }
                              }
                              
                              return bubbles.map((b, i) => {
                                let bubbleName = b.name;
                                const lowerName = bubbleName.toLowerCase();
                                const isShazly = lowerName.includes('shazly') || lowerName.includes('شاذلي');
                                const isMotlaq = lowerName.includes('motlaq') || lowerName.includes('مطلق');
                                const isConsultant = lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('الاستشاري');
                                
                                if (isShazly) {
                                  bubbleName = t('consultantNotesPage.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                                } else if (isMotlaq) {
                                  bubbleName = t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                                } else if (isConsultant) {
                                  bubbleName = t('consultantNotesPage.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                                } else {
                                  bubbleName = translateBrandingText(bubbleName, isRtl);
                                }
                                
                                let bgClass = 'bg-blue-50 border-blue-200 text-blue-900';
                                let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                                let prefixText = t("consultantNotesPage.employeeReply", { defaultValue: "رد الموظف:" });
                                
                                if (isMotlaq) {
                                  bgClass = 'bg-purple-50 border-purple-200 text-purple-900';
                                  badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                                } else if (isConsultant || isShazly) {
                                  bgClass = 'bg-yellow-50 border-yellow-200 text-yellow-900';
                                  badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                                  prefixText = t("consultantNotesPage.consultantFollowUp", { defaultValue: "تعقيب الاستشاري:" });
                                }
                                
                                return (
                                  <div key={i} className={`rounded-xl border text-sm mt-3 p-3 shadow-sm ${bgClass} w-fit min-w-[200px] max-w-full`}>
                                    <div className="font-bold mb-2 opacity-90 text-[12px] flex justify-between items-center">
                                      <span>{prefixText} {bubbleName}</span>
                                      {(!report.consultant_note_processed && (user?.full_name === b.name || user?.username === b.name || (b.name === 'المستوى الثالث' && !user?.full_name && !user?.username) || (b.name && user?.username?.toLowerCase().includes('medhat') && b.name.toLowerCase().includes('medhat')))) && (
                                        <div className="flex gap-2">
                                          <button onClick={() => { setEditingBubbleIndex(`${report.id}-${i}`); setEditingBubbleText(b.text); }} className="text-blue-600 hover:text-blue-800 transition-colors bg-white px-2 py-0.5 rounded shadow-sm border border-blue-200">{t("common.edit", { defaultValue: "تعديل" })}</button>
                                          <button onClick={() => {
                                            if(!window.confirm(t("consultantNotesPage.confirmDeleteReply", { defaultValue: "هل أنت متأكد من حذف ردك؟" }))) return;
                                            const newBubbles = bubbles.filter((_, idx) => idx !== i);
                                            const newStr = newBubbles.map(bub => `---رد: ${bub.name}---\n${bub.text}`).join('\n\n');
                                            updateConsultantReplyString(report.id, newStr);
                                          }} className="text-red-600 hover:text-red-800 transition-colors bg-white px-2 py-0.5 rounded shadow-sm border border-red-200">{t("common.delete", { defaultValue: "حذف" })}</button>
                                        </div>
                                      )}
                                    </div>
                                    {editingBubbleIndex === `${report.id}-${i}` ? (
                                      <div className="mt-2">
                                        <textarea className="w-full p-2 border rounded-md" value={editingBubbleText} onChange={e => setEditingBubbleText(e.target.value)}></textarea>
                                        <div className="flex gap-2 mt-2">
                                          <button onClick={() => {
                                            const newBubbles = [...bubbles];
                                            newBubbles[i].text = editingBubbleText;
                                            const newStr = newBubbles.map(bub => `---رد: ${bub.name}---\n${bub.text}`).join('\n\n');
                                            updateConsultantReplyString(report.id, newStr);
                                          }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700 shadow-sm border border-blue-600">{t("common.saveEdit", { defaultValue: "حفظ التعديل" })}</button>
                                          <button onClick={() => setEditingBubbleIndex(null)} className="bg-white text-gray-700 px-3 py-1 rounded text-xs font-bold hover:bg-gray-50 shadow-sm border border-gray-300">{t("common.cancel", { defaultValue: "إلغاء" })}</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="whitespace-pre-wrap break-words leading-relaxed">
                                        {translateBrandingText(b.text, isRtl)}
                                      </div>
                                    )}
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-right">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === report.id ? null : report.id); }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                          
                          {activeDropdown === report.id && (
                            <div className={`absolute top-full mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden ${isRtl ? 'left-0' : 'right-0'}`}>
                              <Link 
                                to={`/reports?search=${report.report_number || report.id}&exact=true`}
                                className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                              >
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {t("consultantNotesPage.viewReport", { defaultValue: "عرض البلاغ" })}
                              </Link>
                              
                              {!report.consultant_note_processed && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(null);
                                    setSelectedReplyReportId(report.id);
                                    setCurrentReply('');
                                    setShowReplyModal(true);
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                                >
                                  <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                  </svg>
                                  {report.consultant_note_reply 
                                    ? t("consultantNotesPage.addReply", { defaultValue: "إضافة رد" })
                                    : t("consultantNotesPage.reply", { defaultValue: "رد" })}
                                </button>
                              )}
                              
                              {report.consultant_note_processed && (
                                <div className="w-full text-right px-4 py-3 text-sm text-gray-400 font-bold flex items-center gap-3 border-b border-gray-50 cursor-not-allowed">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                  </svg>
                                  {t("consultantNotesPage.conversationClosed", { defaultValue: "المحادثة مغلقة" })}
                                </div>
                              )}

                              {hasProjectPermission(user, report.project, 'consultant_notes') && 
                               (report.consultant_note_by === user?.username || report.consultant_note_by === user?.full_name || (!report.consultant_note_by && (user?.username?.toLowerCase().includes('medhat') || user?.full_name?.includes('مدحت')))) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(null);
                                    handleDeleteNote(report.id);
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                                >
                                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  {t("consultantNotesPage.deleteNote", { defaultValue: "حذف الملاحظة" })}
                                </button>
                              )}
                              
                              {(user?.role === 'admin' || user?.can_create_subusers) ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(null);
                                    handleToggleProcess(report.id);
                                  }}
                                  className={`w-full text-right px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${
                                    report.consultant_note_processed 
                                      ? 'text-emerald-700 hover:bg-emerald-50' 
                                      : 'text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <svg className={`w-4 h-4 ${report.consultant_note_processed ? 'text-emerald-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {report.consultant_note_processed ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                  </svg>
                                  {report.consultant_note_processed ? t('consultantNotesPage.processed', { defaultValue: 'تمت المعالجة' }) : t('consultantNotesPage.underProcessing', { defaultValue: 'قيد المعالجة' })}
                                </button>
                              ) : (
                                <div
                                  className={`w-full text-right px-4 py-3 text-sm font-bold flex items-center gap-3 ${
                                    report.consultant_note_processed 
                                      ? 'text-emerald-700' 
                                      : 'text-slate-700'
                                  }`}
                                  title={t("consultantNotesPage.processTooltip", { defaultValue: "حالة معالجة الملاحظة من قبل المستوى الثالث" })}
                                >
                                  <svg className={`w-4 h-4 ${report.consultant_note_processed ? 'text-emerald-500' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    {report.consultant_note_processed ? (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : (
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    )}
                                  </svg>
                                  {report.consultant_note_processed ? t('consultantNotesPage.processed', { defaultValue: 'تمت المعالجة' }) : t('consultantNotesPage.underProcessing', { defaultValue: 'قيد المعالجة' })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="rounded-b-xl overflow-hidden border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={paginate}
                  onItemsPerPageChange={(newLimit) => {
                    setItemsPerPage(newLimit);
                    setCurrentPage(1);
                  }}
                  itemLabel={t("consultantNotesPage.reportCount", { defaultValue: "ملاحظة" })}
                />
              </div>
            )}
            </>
          )}
        </div>
      </div>

      {/* نافذة الرد */}
      {showReplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowReplyModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                {t("consultantNotesPage.replyModalTitle", { defaultValue: "رد المستوى الثالث" })}
              </h3>
              <button
                onClick={() => setShowReplyModal(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              {reports.find(r => r.id === selectedReplyReportId)?.consultant_note_reply && (
                <div className="mb-6 flex flex-col gap-4">
                  <div className="text-sm font-bold text-gray-700 mb-1 border-b pb-1">{t("consultantNotesPage.previousReplies", { defaultValue: "الردود السابقة:" })}</div>
                  {(() => {
                    const r = reports.find(rep => rep.id === selectedReplyReportId);
                    const replyText = r.consultant_note_reply;
                    
                    if (!replyText.includes('---رد:') && !replyText.includes('--- إضافة جديدة ---')) {
                      return (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-sm mt-3 p-3 shadow-sm">
                          <div className="font-bold mb-2 opacity-90 text-[12px]">
                            {t("consultantNotesPage.replyPrefix", { defaultValue: "رد:" })} {(() => {
                              const name = r.consultant_note_replied_by;
                              if (!name) return t('consultantNotesPage.level3', { defaultValue: 'المستوى الثالث' });
                              const lowerName = name.toLowerCase();
                              if (lowerName.includes('shazly') || lowerName.includes('شاذلي')) {
                                return t('consultantNotesPage.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                              }
                              if (lowerName.includes('motlaq') || lowerName.includes('مطلق')) {
                                return t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                              }
                              if (lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('استشاري')) {
                                return t('consultantNotesPage.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                              }
                              return translateBrandingText(name, isRtl);
                            })()}
                          </div>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {translateBrandingText(replyText, isRtl)}
                          </div>
                        </div>
                      );
                    }
                    
                    // Convert legacy delimiters to the new format sequentially
                    let currentText = replyText;
                    if (currentText.includes('--- إضافة جديدة ---')) {
                      const legacyParts = currentText.split(/---\s*إضافة جديدة\s*---/);
                      const lastIndex = legacyParts.length - 1;
                      currentText = legacyParts.map((part, index) => {
                        if (index === 0) return part;
                        const author = index === lastIndex ? (r.consultant_note_replied_by || t('consultantNotesPage.level3', { defaultValue: 'المستوى الثالث' })) : t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'مطلق الغامدي' });
                        return `---رد: ${author}---${part}`;
                      }).join('');
                    }
                    
                    const parts = currentText.split(/---رد:\s*(.*?)---/);
                    const bubbles = [];
                    
                    if (parts[0].trim()) {
                      const firstAuthor = parts.length > 1 && replyText.includes('--- إضافة جديدة ---') 
                        ? t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'مطلق الغامدي' }) 
                        : (r.consultant_note_replied_by || t('consultantNotesPage.level3', { defaultValue: 'المستوى الثالث' }));
                      bubbles.push({ name: firstAuthor, text: parts[0].trim() });
                    }
                    
                    for (let i = 1; i < parts.length; i += 2) {
                      if (parts[i] && parts[i+1] && parts[i+1].trim()) {
                        bubbles.push({ name: parts[i].trim(), text: parts[i+1].trim() });
                      }
                    }
                    
                    return bubbles.map((b, i) => {
                      let bubbleName = b.name;
                      const lowerName = bubbleName.toLowerCase();
                      const isShazly = lowerName.includes('shazly') || lowerName.includes('شاذلي');
                      const isMotlaq = lowerName.includes('motlaq') || lowerName.includes('مطلق');
                      const isConsultant = lowerName.includes('medhat') || lowerName.includes('مدحت') || lowerName.includes('consultant') || lowerName.includes('الاستشاري');
                      
                      if (isShazly) {
                        bubbleName = t('consultantNotesPage.shazlyHamed', { defaultValue: 'المهندس الشاذلي حامد' });
                      } else if (isMotlaq) {
                        bubbleName = t('consultantNotesPage.motlaqAlGhamdi', { defaultValue: 'المهندس مطلق الغامدي' });
                      } else if (isConsultant) {
                        bubbleName = t('consultantNotesPage.defaultConsultantName', { defaultValue: 'م/ مدحت حسين' });
                      } else {
                        bubbleName = translateBrandingText(bubbleName, isRtl);
                      }
                      
                      let bgClass = 'bg-blue-50 border-blue-200 text-blue-900';
                      let badgeClass = 'bg-blue-100 text-blue-800 border-blue-200';
                      let prefixText = t("consultantNotesPage.employeeReply", { defaultValue: "رد الموظف:" });
                      
                      if (isMotlaq) {
                        bgClass = 'bg-purple-50 border-purple-200 text-purple-900';
                        badgeClass = 'bg-purple-100 text-purple-800 border-purple-200';
                      } else if (isConsultant || isShazly) {
                        bgClass = 'bg-yellow-50 border-yellow-200 text-yellow-900';
                        badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                        prefixText = t("consultantNotesPage.consultantFollowUp", { defaultValue: "تعقيب الاستشاري:" });
                      }
                      
                      return (
                        <div key={i} className={`rounded-xl border text-sm mt-3 p-3 shadow-sm ${bgClass}`}>
                          <div className="font-bold mb-2 opacity-90 text-[12px]">
                            {prefixText} {bubbleName}
                          </div>
                          <div className="whitespace-pre-wrap break-words leading-relaxed">
                            {translateBrandingText(b.text, isRtl)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}

              <label className="block text-sm font-bold text-gray-700 mb-2">{t("consultantNotesPage.writeReplyLabel", { defaultValue: "اكتب الرد أو الإفادة هنا:" })}</label>
              <textarea
                value={currentReply}
                onChange={(e) => setCurrentReply(e.target.value)}
                placeholder={t("consultantNotesPage.writeReplyPlaceholder", { defaultValue: "اكتب ردك على ملاحظة الاستشاري هنا..." })}
                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                dir="auto"
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">{t("consultantNotesPage.replyHelpText", { defaultValue: "سيظهر هذا الرد لمستخدمي المستوى الأول والثاني أسفل ملاحظة الاستشاري." })}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
              <div>
                {reports.find(r => r.id === selectedReplyReportId)?.consultant_note_reply && (
                  <button
                    onClick={handleDeleteReply}
                    disabled={isSavingReply}
                    className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-bold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t("consultantNotesPage.deleteReply", { defaultValue: "حذف الرد" })}
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition-colors"
                >
                  {t("consultantNotesPage.cancel", { defaultValue: "إلغاء" })}
                </button>
                <button
                  onClick={handleSaveReply}
                  disabled={isSavingReply}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSavingReply ? t('consultantNotesPage.sending', { defaultValue: 'جاري الإرسال...' }) : t('consultantNotesPage.sendReply', { defaultValue: 'إرسال الرد' })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ConsultantNotes;
