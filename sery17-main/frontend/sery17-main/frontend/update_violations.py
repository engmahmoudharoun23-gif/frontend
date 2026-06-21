import re

path = 'd:/sery17-main/sery17-main/frontend/src/components/ViolationsModal.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

start_marker = '{/* Add/Edit Form */}'
end_marker = '{/* View violation images */}'

start_idx = code.find(start_marker)
end_idx = code.find(end_marker)

old_block = code[start_idx:end_idx]

# Extract the form
form_start = old_block.find('<form')
form_end = old_block.find('</form>') + len('</form>')

form_code = old_block[form_start:form_end]

new_block = '''{/* Add/Edit Form */}
      {showForm && (
        <div className={isFullScreen ? "w-full animate-fade-in" : "fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4"} onClick={() => !isFullScreen && setShowForm(false)}>
          <div className={isFullScreen ? "bg-white w-full" : "bg-white rounded-2xl w-full max-w-lg max-h-[95vh] overflow-y-auto shadow-2xl"} dir={isRtl ? 'rtl' : 'ltr'} onClick={e => !isFullScreen && e.stopPropagation()}>
            {isFullScreen ? (
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 border-r-4 border-red-500 pr-4">
                  {editingId ? d('تعديل المخالفة', 'Edit Violation') : d('إضافة مخالفة', 'Add Violation')}
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 text-gray-600 font-bold">
                  <span className="text-2xl leading-none">{isRtl ? '←' : '→'}</span>
                  <span>{isRtl ? 'الرجوع للقائمة' : 'Back to list'}</span>
                </button>
              </div>
            ) : (
              <div className="sticky top-0 bg-red-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {editingId ? d('تعديل المخالفة', 'Edit Violation') : d('إضافة مخالفة', 'Add Violation')}
                </h3>
                <button type="button" onClick={() => setShowForm(false)} className="text-white hover:text-red-200 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}
            
''' + form_code + '''
          </div>
        </div>
      )}

      '''

new_code = code[:start_idx] + new_block + code[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_code)

print('Successfully replaced form section')
