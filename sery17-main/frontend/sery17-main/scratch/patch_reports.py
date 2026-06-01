import codecs

file_path = 'frontend/src/pages/Reports.js'
with codecs.open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State
state_hook = "const [currentNotes, setCurrentNotes] = useState('');"
state_insert = """
  const [showConsultantNoteModal, setShowConsultantNoteModal] = useState(false);
  const [currentConsultantNote, setCurrentConsultantNote] = useState('');
  const [selectedConsultantReportId, setSelectedConsultantReportId] = useState(null);
  const [isSavingConsultantNote, setIsSavingConsultantNote] = useState(false);
"""
content = content.replace(state_hook, state_hook + state_insert)

# 2. Button
btn_hook = "{/* خيار مغلقة بواسطة الاستشاري - يظهر لمديري المشاريع ومن لديهم صلاحية الكل */}"
btn_insert = """
                                {/* خيار ملاحظات الاستشاري */}
                                {(user?.role === 'admin' || user?.can_create_subusers || user?.role === 'level2') && (
                                  <button 
                                    onClick={() => {
                                      setSelectedConsultantReportId(report.id);
                                      setCurrentConsultantNote(report.consultant_note || '');
                                      setShowConsultantNoteModal(true);
                                      setActiveDropdown(null);
                                    }} 
                                    className={`group flex items-center px-4 py-3 text-sm text-teal-700 hover:bg-teal-600 hover:text-white w-full transition-colors font-bold ${isRtl ? 'text-right' : 'text-left'}`}
                                  >
                                    <svg className={`h-5 w-5 text-teal-500 group-hover:text-white ${isRtl ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    ملاحظات الاستشاري
                                  </button>
                                )}
                                """
content = content.replace(btn_hook, btn_insert + btn_hook)

# 3. Save Function
func_hook = "const fetchReports = async ("
func_insert = """
  const handleSaveConsultantNote = async () => {
    if (!selectedConsultantReportId) return;
    setIsSavingConsultantNote(true);
    try {
      await axios.put(`${API}/reports/${selectedConsultantReportId}/consultant_note`, {
        consultant_note: currentConsultantNote
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setReports(reports.map(r => 
        r.id === selectedConsultantReportId 
          ? { ...r, consultant_note: currentConsultantNote } 
          : r
      ));
      
      toast.success('تم حفظ ملاحظة الاستشاري بنجاح وإرسال إشعار لصاحب البلاغ');
      setShowConsultantNoteModal(false);
    } catch (error) {
      console.error('Error saving consultant note:', error);
      toast.error('حدث خطأ أثناء حفظ الملاحظة');
    } finally {
      setIsSavingConsultantNote(false);
    }
  };

"""
content = content.replace(func_hook, func_insert + func_hook)

# 4. Modal
modal_hook = "{/* Modal الملاحظات */}"
modal_insert = """
      {/* Modal ملاحظات الاستشاري */}
      {showConsultantNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowConsultantNoteModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-5 border-b pb-3">
              <h3 className="text-xl font-bold text-teal-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                ملاحظات الاستشاري
              </h3>
              <button
                onClick={() => setShowConsultantNoteModal(false)}
                className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">اكتب الملاحظة هنا:</label>
              <textarea
                value={currentConsultantNote}
                onChange={(e) => setCurrentConsultantNote(e.target.value)}
                placeholder="اكتب ملاحظات الاستشاري..."
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all"
                dir="auto"
              ></textarea>
              <p className="text-xs text-gray-500 mt-2">يمكنك تعديل أو حذف الملاحظة عن طريق مسح النص وحفظه.</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConsultantNoteModal(false)}
                className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 font-bold rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveConsultantNote}
                disabled={isSavingConsultantNote}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSavingConsultantNote ? 'جاري الحفظ...' : 'حفظ وإرسال'}
              </button>
            </div>
          </div>
        </div>
      )}

"""
content = content.replace(modal_hook, modal_insert + modal_hook)

with codecs.open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to Reports.js")
