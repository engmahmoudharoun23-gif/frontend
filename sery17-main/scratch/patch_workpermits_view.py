import sys

with open('d:/sery17-main/sery17-main/frontend/src/pages/WorkPermits.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_view_image = """{viewReport.image && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('workPermits.image')}</p>
                    {viewReport.image.startsWith('data:application/pdf') || viewReport.image.endsWith('.pdf') ? (
                      <div className="p-6 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-orange-500 mb-3" />
                        <span className="text-sm font-bold text-orange-800 mb-4">ملف PDF مرفق</span>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(viewReport.image)} alt="" className="w-full h-48 object-cover rounded-xl border border-gray-100 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(viewReport.image)} />
                    )}
                  </div>
                )}"""

new_view_image = """{(viewReport.images && viewReport.images.length > 0) ? (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('workPermits.image')}</p>
                    <div className="flex flex-wrap gap-2">
                      {viewReport.images.map((img, idx) => (
                        <div key={idx} className="relative inline-block">
                          {img.startsWith('data:application/pdf') || img.endsWith('.pdf') ? (
                            <div className="w-24 h-24 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-2 cursor-pointer">
                              <FileText className="w-8 h-8 text-orange-500 mb-1" />
                              <span className="text-[10px] text-gray-600 font-bold text-center">PDF File</span>
                            </div>
                          ) : (
                            <img src={resolveImageUrl(img)} alt="" className="w-24 h-24 rounded-xl object-cover border border-gray-200 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(img)} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (viewReport.image && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('workPermits.image')}</p>
                    {viewReport.image.startsWith('data:application/pdf') || viewReport.image.endsWith('.pdf') ? (
                      <div className="p-6 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-orange-500 mb-3" />
                        <span className="text-sm font-bold text-orange-800 mb-4">ملف PDF مرفق</span>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(viewReport.image)} alt="" className="w-full h-48 object-cover rounded-xl border border-gray-100 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(viewReport.image)} />
                    )}
                  </div>
                ))}"""

content = content.replace(old_view_image, new_view_image)

with open('d:/sery17-main/sery17-main/frontend/src/pages/WorkPermits.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched WorkPermits.js viewReport modal")
