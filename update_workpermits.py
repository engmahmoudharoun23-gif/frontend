import re

path = 'd:/sery17-main/sery17-main/frontend/src/pages/WorkPermits.js'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

old_return = '''  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}'''

new_return = '''  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        {showModal ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 animate-fade-in">
            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex items-center gap-2 text-gray-600 font-bold">
                <span className="text-2xl leading-none">{isRtl ? '←' : '→'}</span>
                <span>{isRtl ? 'الرجوع' : 'Back'}</span>
              </button>
              <h2 className="text-2xl font-bold text-gray-800 border-r-4 border-orange-500 pr-4">
                {editingReport ? t('workPermits.editReport') : t('workPermits.addNew')}
              </h2>
            </div>
            <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.date')} <span className="text-red-500">*</span></label>
                  <input type="date" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none bg-gray-50" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.governorate')} <span className="text-red-500">*</span></label>
                  <select
                    required
                    value={form.governorate}
                    onChange={e => setForm({...form, governorate: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none bg-gray-50"
                    disabled={!form.project}
                  >
                    <option value="">{t('workPermits.selectGov')}</option>
                    {allowedGovsList.map(g => (
                      <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.project')} <span className="text-red-500">*</span></label>
                <select
                  required
                  value={form.project}
                  onChange={e => setForm({...form, project: e.target.value, governorate: ''})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none bg-gray-50"
                >
                  <option value="">{t('workPermits.selectProject')}</option>
                  {allowedProjectsList.map(p => (
                    <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">{t('workPermits.notes')}</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={5} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-200 outline-none resize-none bg-gray-50" />
              </div>
              <div className="border-t border-gray-100 pt-6">
                <label className="block text-sm font-bold text-gray-700 mb-4">📷 {t('workPermits.image')}</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex-1 flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors bg-white">
                    <Upload className="w-6 h-6 text-orange-500" /><span className="text-sm text-orange-700 font-bold">{t('workPermits.selectImage')}</span>
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleImageSelect} disabled={uploading} />
                  </label>
                  <label className="flex items-center justify-center gap-3 px-4 py-4 border-2 border-dashed border-orange-300 rounded-xl cursor-pointer hover:bg-orange-50 transition-colors bg-white">
                    <Camera className="w-6 h-6 text-orange-500" /><span className="text-sm text-orange-700 font-bold">{t('workPermits.camera')}</span>
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} disabled={uploading} />
                  </label>
                </div>
                {uploading && <p className="text-sm text-orange-600 mb-4 font-bold animate-pulse">{t('workPermits.uploadingImage')}</p>}
                {imagePreview && (
                  <div className="mb-4 relative inline-block">
                    {imagePreview.startsWith('data:application/pdf') || imagePreview.endsWith('.pdf') ? (
                      <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200 flex items-center justify-center min-w-[128px] min-h-[128px]">
                        <div className="text-center">
                          <FileText className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                          <span className="text-xs font-bold text-orange-800">ملف PDF مرفق</span>
                        </div>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-orange-200 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(imagePreview)} />
                    )}
                    <button type="button" onClick={() => { setImagePreview(''); setForm(prev => ({...prev, image: ''})); }} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-600 shadow-lg border-2 border-white">×</button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <button type="submit" disabled={isSubmitting || uploading} className={`flex-1 py-4 bg-orange-600 text-white rounded-xl font-bold text-lg transition-all shadow-md ${isSubmitting || uploading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-orange-700 hover:shadow-lg hover:-translate-y-0.5'}`}>{isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : editingReport ? t('workPermits.saveChangesBtn') : t('workPermits.saveBtn')}</button>
              </div>
            </form>
          </div>
        ) : (
          <>
        {/* Header */}'''

code = code.replace(old_return, new_return)

code = re.sub(r'\{\/\* Add\/Edit Modal \*\/\}.*?\{\/\* View Modal \*\/\}', '{/* View Modal */}', code, flags=re.DOTALL)

old_view_modal = '''        {/* View Modal */}'''
new_view_modal = '''          </>
        )}
        {/* View Modal */}'''
code = code.replace(old_view_modal, new_view_modal)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print('Updated WorkPermits.js successfully')
