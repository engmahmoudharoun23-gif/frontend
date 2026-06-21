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

const ReportNotes = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const getInitialReports = () => {
    try {
      const cached = localStorage.getItem('cache_ReportNotes_reports');
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
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchNotes = async (page = currentPage, limit = itemsPerPage, search = searchQuery) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reports/report-notes`, {
        params: { page, limit, search },
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports || []);
      setTotalItems(response.data.total || 0);
      try {
        if (page === 1 && !search) {
          localStorage.setItem('cache_ReportNotes_reports', JSON.stringify(response.data.reports || []));
        }
      } catch(e) {}
    } catch (error) {
      console.error('Error fetching report notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);



  const handleEditNote = async (reportId) => {
    setIsSavingNote(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/reports/${reportId}/report-note`, { notes: editingNoteText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => r.id === reportId ? { ...r, notes: response.data.notes } : r));
        toast.success(t('reportNotesPage.editSuccess', { defaultValue: 'تم التعديل بنجاح' }));
        window.dispatchEvent(new Event('updateBadges'));
        setEditingNoteId(null);
      }
    } catch (error) {
      console.error('Error editing note:', error);
      toast.error(t('reportNotesPage.editError', { defaultValue: 'حدث خطأ أثناء التعديل' }));
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleDeleteNote = async (reportId) => {
    if (!window.confirm(t('reportNotesPage.confirmDelete', { defaultValue: 'هل أنت متأكد من حذف الملاحظة نهائياً من البلاغ؟' }))) return;
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API}/reports/${reportId}/report-note`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.filter(r => r.id !== reportId));
        toast.success(t('reportNotesPage.deleteSuccess', { defaultValue: 'تم حذف الملاحظة بنجاح' }));
        window.dispatchEvent(new Event('updateBadges'));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error(t('reportNotesPage.deleteError', { defaultValue: 'حدث خطأ أثناء الحذف' }));
    }
  };

  const currentItems = reports;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Layout user={user} onLogout={onLogout} title={t("reportNotesPage.title", { defaultValue: "ملاحظات البلاغات" })}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible mt-4">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 whitespace-nowrap">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t("reportNotesPage.title", { defaultValue: "ملاحظات البلاغات" })}
            </h2>
            <span className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap self-end sm:self-auto">
              {totalItems} {t("reportNotesPage.totalNotesCount", { defaultValue: "بلاغ بملاحظة" })}
            </span>
          </div>
          
          <div className={`flex flex-col sm:flex-row gap-3 ${isRtl ? 'justify-start' : 'justify-end'}`}>
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
                className="bg-white border-2 border-gray-200 text-gray-900 text-sm md:text-base rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 pr-11"
                placeholder={t("common.search", { defaultValue: "بحث..." })}
                dir="auto"
              />
            </div>
          </div>
        </div>

        <div className="p-0">
          {reports.length === 0 && loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div><span className="text-indigo-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div>
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
                  ? t("reportNotesPage.noSearchResults", { defaultValue: "لا توجد نتائج مطابقة للبحث" })
                  : t("reportNotesPage.noNotes", { defaultValue: "لا توجد ملاحظات بلاغات حالياً" })
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto pb-72">
                <table className="w-full text-sm text-right min-w-[800px]">
                <thead className="text-[13px] text-gray-800 bg-gray-100/80 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("reportNotesPage.reportNumber", { defaultValue: "رقم البلاغ" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("reportNotesPage.project", { defaultValue: "المشروع" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("reportNotesPage.governorate", { defaultValue: "المحافظة" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap w-[10%]">{t("reportNotesPage.contractor", { defaultValue: "المقاول" })}</th>
                    <th className="px-6 py-5 font-black w-auto min-w-[300px]">{t("reportNotesPage.note", { defaultValue: "الملاحظة" })}</th>
                    <th className="px-6 py-5 font-black whitespace-nowrap text-center w-[5%]">{t("reportNotesPage.actions", { defaultValue: "إجراءات" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((report, idx) => (
                    <tr key={report.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-indigo-600 whitespace-nowrap">
                        <div className="flex items-center justify-start gap-2">
                          <span>{report.report_number || report.id.substring(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{translateBrandingText(report.project, isRtl)}</td>
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">{translateBrandingText(report.governorate, isRtl)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-700 font-bold whitespace-nowrap">{translateBrandingText(report.contractor || '-', isRtl)}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-800">
                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 text-sm p-3 shadow-sm max-w-full">
                          {editingNoteId === report.id ? (
                            <div className="mt-2">
                              <textarea className="w-full p-2 border rounded-md" value={editingNoteText} onChange={e => setEditingNoteText(e.target.value)}></textarea>
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => handleEditNote(report.id)} disabled={isSavingNote} className="bg-indigo-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-indigo-700 shadow-sm border border-indigo-600">{t("common.saveEdit", { defaultValue: "حفظ التعديل" })}</button>
                                <button onClick={() => setEditingNoteId(null)} disabled={isSavingNote} className="bg-white text-gray-700 px-3 py-1 rounded text-xs font-bold hover:bg-gray-50 shadow-sm border border-gray-300">{t("common.cancel", { defaultValue: "إلغاء" })}</button>
                              </div>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                              {translateBrandingText(report.notes, isRtl)}
                            </div>
                          )}
                        </div>
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
                            <div className={`absolute ${idx > 1 && idx >= currentItems.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'} w-56 bg-white border border-gray-100 shadow-xl rounded-xl z-50 overflow-hidden ${isRtl ? 'left-0' : 'right-0'}`}>
                              <Link 
                                to={`/reports?search=${report.report_number || report.id}&exact=true`}
                                className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                              >
                                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {t("reportNotesPage.viewReport", { defaultValue: "عرض البلاغ" })}
                              </Link>
                              
                              {(user?.role === 'admin' || user?.can_create_subusers) && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(null);
                                      setEditingNoteId(report.id);
                                      setEditingNoteText(report.notes);
                                    }}
                                    className="w-full text-right px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                                  >
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    {t("common.edit", { defaultValue: "تعديل الملاحظة" })}
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(null);
                                      handleDeleteNote(report.id);
                                    }}
                                    className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                                  >
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    {t("common.delete", { defaultValue: "حذف الملاحظة" })}
                                  </button>
                                </>
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
                  itemLabel={t("reportNotesPage.reportCount", { defaultValue: "بلاغ بملاحظة" })}
                />
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ReportNotes;
