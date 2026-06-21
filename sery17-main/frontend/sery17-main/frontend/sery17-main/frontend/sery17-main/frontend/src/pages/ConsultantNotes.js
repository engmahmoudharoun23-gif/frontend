import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { translateBrandingText } from '../utils/brandingTranslation';
import Pagination from '../components/Pagination';

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
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reply State
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [currentReply, setCurrentReply] = useState('');
  const [selectedReplyReportId, setSelectedReplyReportId] = useState(null);
  const [isSavingReply, setIsSavingReply] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      // setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/consultant-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports || []);
      try { localStorage.setItem('cache_ConsultantNotes.js_reports', JSON.stringify(response.data.reports || [])); } catch(e) {}
    } catch (error) {
      console.error('Error fetching consultant notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProcess = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/reports/${reportId}/consultant_note_processed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => 
          r.id === reportId ? { ...r, consultant_note_processed: response.data.consultant_note_processed } : r
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

  // Filter reports
  const filteredReports = reports.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    return (r.report_number && String(r.report_number).toLowerCase().includes(q)) || 
           (r.id && String(r.id).toLowerCase().includes(q));
  });

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout user={user} onLogout={onLogout} title={t("consultantNotesPage.title", { defaultValue: "ملاحظات الاستشاري" })}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-4">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("consultantNotesPage.title", { defaultValue: "ملاحظات الاستشاري" })}
            </h2>
            
            <span className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap self-end sm:self-auto">
              {filteredReports.length} {t("consultantNotesPage.reportCount", { defaultValue: "بلاغ" })}
            </span>
          </div>
          
          <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'}`}>
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
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">{t("consultantNotesPage.noNotes", { defaultValue: "لا توجد ملاحظات من الاستشاري حالياً" })}</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-20">
              <div className="bg-gray-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium">{t("consultantNotesPage.noSearchResults", { defaultValue: "لا توجد نتائج مطابقة للبحث" })}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                <thead className="text-xs text-gray-600 uppercase bg-gray-50/80 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-700">{t("consultantNotesPage.reportNumber", { defaultValue: "رقم البلاغ" })}</th>
                    <th className="px-6 py-4 font-bold text-gray-700">{t("consultantNotesPage.project", { defaultValue: "المشروع" })}</th>
                    <th className="px-6 py-4 font-bold text-gray-700">{t("consultantNotesPage.governorate", { defaultValue: "المحافظة" })}</th>
                    <th className="px-6 py-4 font-bold text-gray-700">{t("consultantNotesPage.contractor", { defaultValue: "المقاول" })}</th>
                    <th className="px-6 py-4 font-bold text-gray-700 w-1/2">{t("consultantNotesPage.note", { defaultValue: "الملاحظة" })}</th>
                    <th className="px-6 py-4 font-bold text-gray-700 text-center">{t("consultantNotesPage.actions", { defaultValue: "إجراءات" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((report) => (
                    <tr key={report.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <span>{report.report_number || report.id.substring(0, 8)}</span>
                          {!report.consultant_note_processed && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                              {t("consultantNotesPage.new", { defaultValue: "جديد" })}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{translateBrandingText(report.project, isRtl)}</td>
                      <td className="px-6 py-4 text-gray-700">{translateBrandingText(report.governorate, isRtl)}</td>
                      <td className="px-6 py-4 text-gray-700">{translateBrandingText(report.contractor || '-', isRtl)}</td>
                      <td className="px-6 py-4 text-gray-800">
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-900 text-sm mt-4 p-3 shadow-sm">
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
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link 
                            to={`/reports?search=${report.report_number || report.id}&exact=true`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {t("consultantNotesPage.viewReport", { defaultValue: "عرض البلاغ" })}
                          </Link>
                          
                          {/* زر الرد متاح للجميع إذا لم تكن مغلقة */}
                          {!report.consultant_note_processed && (
                            <button
                              onClick={() => {
                                setSelectedReplyReportId(report.id);
                                setCurrentReply('');
                                setShowReplyModal(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm border border-indigo-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              {report.consultant_note_reply 
                                ? t("consultantNotesPage.addReply", { defaultValue: "إضافة رد" })
                                : t("consultantNotesPage.reply", { defaultValue: "رد" })}
                            </button>
                          )}
                          
                          {report.consultant_note_processed && (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-medium text-sm border border-gray-200 cursor-not-allowed">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              {t("consultantNotesPage.conversationClosed", { defaultValue: "المحادثة مغلقة" })}
                            </span>
                          )}
                          
                          {/* عرض الحالة */}
                          {(user?.role === 'admin' || user?.can_create_subusers) ? (
                            <button
                              onClick={() => handleToggleProcess(report.id)}
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg transition-colors font-medium text-sm border ${
                                report.consultant_note_processed 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                                  : 'bg-slate-800 text-white border-slate-900 hover:bg-slate-700'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {report.consultant_note_processed ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                              {report.consultant_note_processed ? t('consultantNotesPage.processed', { defaultValue: 'تمت المعالجة' }) : t('consultantNotesPage.underProcessing', { defaultValue: 'قيد المعالجة' })}
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm border ${
                                report.consultant_note_processed 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                  : 'bg-slate-800 text-white border-slate-900'
                              }`}
                              title={t("consultantNotesPage.processTooltip", { defaultValue: "حالة معالجة الملاحظة من قبل المستوى الثالث" })}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {report.consultant_note_processed ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                              {report.consultant_note_processed ? t('consultantNotesPage.processed', { defaultValue: 'تمت المعالجة' }) : t('consultantNotesPage.underProcessing', { defaultValue: 'قيد المعالجة' })}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredReports.length > 0 && (
              <div className="rounded-b-xl overflow-hidden border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredReports.length}
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
