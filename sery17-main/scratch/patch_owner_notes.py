import re

file_path = "d:/sery17-main/sery17-main/frontend/src/pages/Reports.js"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update PROJECT_SCOPED
content = content.replace(
    "const PROJECT_SCOPED = ['reports_view','reports_add','reports_edit','reports_delete','reports_review','reports_import','reports_notifications','consultant_notes'];",
    "const PROJECT_SCOPED = ['reports_view','reports_add','reports_edit','reports_delete','reports_review','reports_import','reports_notifications','consultant_notes','owner_notes'];"
)

# 2. Add states
states_hook = """  const [activeBubbleDropdown, setActiveBubbleDropdown] = useState(null);
  const [isSavingConsultantNote, setIsSavingConsultantNote] = useState(false);"""
new_states = states_hook + """
  const [showOwnerNoteModal, setShowOwnerNoteModal] = useState(false);
  const [currentOwnerNote, setCurrentOwnerNote] = useState('');
  const [selectedOwnerReportId, setSelectedOwnerReportId] = useState(null);
  const [isSavingOwnerNote, setIsSavingOwnerNote] = useState(false);"""
content = content.replace(states_hook, new_states)

# 3. Add handleSaveOwnerNote
save_consultant_func = "  const handleSaveConsultantNote = async () => {"
owner_func = """  const handleSaveOwnerNote = async () => {
    if (!currentOwnerNote.trim()) return;
    setIsSavingOwnerNote(true);
    try {
      const token = localStorage.getItem('token');
      const r = reports.find(rep => rep.id === selectedOwnerReportId);
      if (!r) return;
      const prefix = `ملاحظه عن بلاغ رقم ${r.report_number || ''} من المالك:\\n`;
      const finalNote = r.notes ? `${r.notes}\\n\\n${prefix}${currentOwnerNote}` : `${prefix}${currentOwnerNote}`;
      
      const response = await axios.put(`${API}/reports/${selectedOwnerReportId}/report-note`, 
        { notes: finalNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setReports(reports.map(rep => 
          rep.id === selectedOwnerReportId ? { ...rep, notes: finalNote } : rep
        ));
        toast.success(t('ownerNoteModal.saveSuccess', { defaultValue: 'تم إضافة ملاحظة المالك بنجاح' }));
        setShowOwnerNoteModal(false);
        setCurrentOwnerNote('');
      }
    } catch (error) {
      console.error('Error saving owner note:', error);
      toast.error(t('ownerNoteModal.saveError', { defaultValue: 'حدث خطأ أثناء حفظ ملاحظة المالك' }));
    } finally {
      setIsSavingOwnerNote(false);
    }
  };

"""
content = content.replace(save_consultant_func, owner_func + save_consultant_func)

# 4. Add dropdown button
consultant_button = """                                {/* خيار ملاحظات الاستشاري */}
                                {hasReportPermission(report, 'consultant_notes') && """
owner_button = """                                {/* خيار ملاحظات المالك */}
                                {hasReportPermission(report, 'owner_notes') && (
                                  <button 
                                    onClick={() => {
                                      setSelectedOwnerReportId(report.id);
                                      setCurrentOwnerNote('');
                                      setShowOwnerNoteModal(true);
                                      setActiveDropdown(null);
                                    }} 
                                    className={`group flex items-center px-4 py-3 text-sm text-amber-700 hover:bg-amber-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                  >
                                    <svg className={`h-5 w-5 text-amber-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    {t('ownerNoteModal.titleBtn', { defaultValue: 'ملاحظة المالك لحل البلاغ' })}
                                  </button>
                                )}

"""
content = content.replace(consultant_button, owner_button + consultant_button)

# 5. Add Owner Note Modal
modal_end_pattern = r"(\s+</div>\s+</div>\s+</div>\s+)}\s+</div>\s+\)\s+}"
owner_modal = """
      {/* Modal ملاحظات المالك */}
      {showOwnerNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowOwnerNoteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-amber-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                {t('ownerNoteModal.title', { defaultValue: 'إضافة ملاحظة المالك' })}
              </h3>
              <button
                onClick={() => setShowOwnerNoteModal(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">{t('ownerNoteModal.writeNoteLabel', { defaultValue: 'اكتب الملاحظة (سيتم إضافتها لملاحظات البلاغ):' })}</label>
              <textarea
                value={currentOwnerNote}
                onChange={(e) => setCurrentOwnerNote(e.target.value)}
                placeholder={t('ownerNoteModal.writeNotePlaceholder', { defaultValue: 'اكتب ملاحظة لحل البلاغ...' })}
                className="w-full h-32 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none transition-all"
                dir="auto"
              ></textarea>
            </div>
            
            <div className={`flex justify-end gap-3 pt-3 border-t mt-5`}>
              <button
                onClick={() => setShowOwnerNoteModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
              >
                {t('common.cancel', { defaultValue: 'إلغاء' })}
              </button>
              <button
                onClick={handleSaveOwnerNote}
                disabled={isSavingOwnerNote || !currentOwnerNote.trim()}
                className="px-5 py-2.5 text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                {isSavingOwnerNote ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('common.saving', { defaultValue: 'جاري الحفظ...' })}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {t('common.save', { defaultValue: 'حفظ' })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""

match = re.search(modal_end_pattern, content)
if match:
    # We replace the end pattern with the owner_modal
    # wait, the modal_end_pattern matches the end of the return statement
    # Let's just find the last "</div>\n  );\n}" and insert before it
    pass

last_div_index = content.rfind("</div>\n  );\n}")
if last_div_index != -1:
    content = content[:last_div_index] + owner_modal + content[last_div_index+6:]
else:
    print("Could not find end of file pattern")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied.")
