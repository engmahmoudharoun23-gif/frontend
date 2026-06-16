import re

file_path = "d:/sery17-main/sery17-main/frontend/src/pages/ReportNotes.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states and hasPermission
state_pattern = "  const [isSavingNote, setIsSavingNote] = useState(false);"
new_states = """  const [isSavingNote, setIsSavingNote] = useState(false);
  const [replyingReportId, setReplyingReportId] = useState(null);
  const [replyNoteText, setReplyNoteText] = useState('');
  const [isSavingReply, setIsSavingReply] = useState(false);

  const hasPermission = (permKey, project = null) => {
    if (user?.role === 'admin') return true;
    if (project) {
      const pp = user?.project_permissions || {};
      const projSpecific = pp[project] || [];
      if (projSpecific.includes(permKey)) return true;
    }
    return (user?.permissions || []).includes(permKey);
  };
"""
content = content.replace(state_pattern, new_states)

# 2. Add handleReplyNote and handleToggleProcessed
handlers_pattern = "  const handleEditNote = async (reportId) => {"
new_handlers = """
  const handleReplyNote = async (reportId) => {
    setIsSavingReply(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/reports/${reportId}/report_note_reply`, { reply: replyNoteText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => r.id === reportId ? { ...r, report_note_reply: response.data.reply, report_note_replied_by: response.data.replied_by, report_note_processed: response.data.reply ? false : r.report_note_processed } : r));
        toast.success(t('reportNotesPage.replySuccess', { defaultValue: 'تم حفظ الرد بنجاح' }));
        setReplyingReportId(null);
      }
    } catch (error) {
      console.error('Error saving reply:', error);
      toast.error(t('reportNotesPage.replyError', { defaultValue: 'حدث خطأ أثناء حفظ الرد' }));
    } finally {
      setIsSavingReply(false);
    }
  };

  const handleToggleProcessed = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/reports/${reportId}/report_note_processed`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setReports(reports.map(r => r.id === reportId ? { ...r, report_note_processed: response.data.report_note_processed, report_note_processed_date: response.data.report_note_processed_date } : r));
        toast.success(t('reportNotesPage.statusSuccess', { defaultValue: 'تم تغيير الحالة بنجاح' }));
      }
    } catch (error) {
      console.error('Error toggling processed status:', error);
      toast.error(t('reportNotesPage.statusError', { defaultValue: 'حدث خطأ أثناء تغيير الحالة' }));
    }
  };

  const handleEditNote = async (reportId) => {
"""
content = content.replace(handlers_pattern, new_handlers)

# 3. Modify the note cell
note_cell_pattern = """                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 text-sm p-3 shadow-sm max-w-full">
                          {editingNoteId === report.id ? ("""
new_note_cell = """                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-900 text-sm p-3 shadow-sm max-w-full relative">
                          <div className="flex justify-between items-start mb-2 border-b border-indigo-100 pb-2">
                             <div className="font-bold text-xs text-indigo-700 opacity-70">الملاحظة الأساسية</div>
                             {report.report_note_processed ? (
                               <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold border border-emerald-200 shadow-sm whitespace-nowrap">تمت المعالجة ✓</span>
                             ) : (
                               <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold border border-amber-200 shadow-sm whitespace-nowrap">قيد المعالجة ⏳</span>
                             )}
                          </div>
                          {editingNoteId === report.id ? ("""
content = content.replace(note_cell_pattern, new_note_cell)

note_content_pattern = """                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                              {translateBrandingText(report.notes, isRtl)}
                            </div>"""
new_note_content = """                            <div className="whitespace-pre-wrap break-words leading-relaxed">
                              {translateBrandingText(report.notes, isRtl)}
                              
                              {report.report_note_reply && (
                                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                                  <div className="text-xs font-bold text-teal-600 mb-1 flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    {t("reportNotesPage.replyFrom", { defaultValue: "رد الاستشاري:" })} {report.report_note_replied_by}
                                  </div>
                                  <div className="text-gray-800 font-medium whitespace-pre-wrap">{report.report_note_reply}</div>
                                </div>
                              )}
                              
                              {replyingReportId === report.id && (
                                <div className="mt-3 bg-white p-2 rounded-lg border border-teal-200 shadow-sm">
                                  <textarea 
                                    className="w-full p-2 border border-gray-200 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm" 
                                    placeholder={t("reportNotesPage.writeReply", { defaultValue: "اكتب ردك هنا (اتركه فارغاً للحذف)..." })}
                                    value={replyNoteText} 
                                    onChange={e => setReplyNoteText(e.target.value)}
                                    rows={3}
                                  ></textarea>
                                  <div className="flex gap-2 mt-2">
                                    <button onClick={() => handleReplyNote(report.id)} disabled={isSavingReply} className="bg-teal-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-teal-700 shadow-sm border border-teal-600 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                      {t("common.save", { defaultValue: "حفظ الرد" })}
                                    </button>
                                    <button onClick={() => setReplyingReportId(null)} disabled={isSavingReply} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-200 shadow-sm border border-gray-200">
                                      {t("common.cancel", { defaultValue: "إلغاء" })}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>"""
content = content.replace(note_content_pattern, new_note_content)

# 4. Modify dropdown actions
dropdown_pattern = """                              {(user?.role === 'admin' || user?.can_create_subusers) && (
                                <>
                                  <button"""
new_dropdown = """                              {hasPermission('consultant_notes', report.project) && !replyingReportId && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdown(null);
                                    setReplyingReportId(report.id);
                                    setReplyNoteText(report.report_note_reply || '');
                                  }}
                                  className="w-full text-right px-4 py-3 text-sm text-teal-600 hover:bg-teal-50 font-bold flex items-center gap-3 transition-colors border-b border-gray-50"
                                >
                                  <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                  {t("common.reply", { defaultValue: "رد الاستشاري" })}
                                </button>
                              )}
                              
                              {(user?.role === 'admin' || user?.can_create_subusers) && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(null);
                                      handleToggleProcessed(report.id);
                                    }}
                                    className={`w-full text-right px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors border-b border-gray-50 ${report.report_note_processed ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                                  >
                                    <svg className={`w-4 h-4 ${report.report_note_processed ? 'text-amber-500' : 'text-emerald-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {report.report_note_processed ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      )}
                                    </svg>
                                    {report.report_note_processed ? t("common.reopen", { defaultValue: "إعادة قيد المعالجة" }) : t("common.closeNote", { defaultValue: "تمت المعالجة (إغلاق)" })}
                                  </button>
                                  <button"""
content = content.replace(dropdown_pattern, new_dropdown)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied for ReportNotes.js")
