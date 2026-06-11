import sys
import re

def patch_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Add images array to emptyForm
    code = re.sub(
        r"image:\s*''",
        r"image: '', images: []",
        code
    )

    # State for multiple previews
    code = code.replace(
        "const [imagePreview, setImagePreview] = useState('');",
        "const [imagePreview, setImagePreview] = useState('');\n  const [imagePreviews, setImagePreviews] = useState([]);"
    )

    # Edit handling
    code = code.replace(
        "image: r.image || '' });",
        "image: r.image || '', images: r.images || [] });"
    )
    code = code.replace(
        "setImagePreview(r.image || '');",
        "setImagePreview(r.image || ''); setImagePreviews(r.images || []);"
    )

    # handleImageSelect modification
    if "const handleImageSelect" in code:
        old_handle = """  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm(prev => ({ ...prev, image: reader.result }));
        setUploading(false);
        toast.success(t('qualityReports.compressedSuccess') || 'تم إضافة الصورة بنجاح');
      };
      reader.readAsDataURL(compressed);
    } catch { setUploading(false); }
  };"""
        
        old_handle_safety = """  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      if (file.type === 'application/pdf') {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(t('safetyReports.pdfTooLarge') || 'حجم ملف الـ PDF كبير جداً (الحد الأقصى 10 ميجا)');
          setUploading(false);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64pdf = reader.result;
          setImagePreview(base64pdf);
          setForm(prev => ({ ...prev, image: base64pdf }));
          setUploading(false);
          toast.success(t('safetyReports.pdfAddSuccess') || 'تم إضافة ملف الـ PDF بنجاح');
        };
        reader.readAsDataURL(file);
        return;
      }

      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm(prev => ({ ...prev, image: reader.result }));
        setUploading(false);
        toast.success(t('safetyReports.imageAddSuccess') || 'تم إضافة الصورة بنجاح');
      };
      reader.readAsDataURL(compressed);
    } catch (e) { 
      console.error(e);
      setUploading(false); 
    }
  };"""

        new_handle = """  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const newPreviews = [...imagePreviews];
      const newImages = [...(form.images || [])];
      
      for (let file of files) {
        if (file.type === 'application/pdf') {
           const reader = new FileReader();
           await new Promise(resolve => {
               reader.onloadend = () => {
                  newPreviews.push(reader.result);
                  newImages.push(reader.result);
                  resolve();
               };
               reader.readAsDataURL(file);
           });
        } else {
           const compressed = await compressImage(file);
           const reader = new FileReader();
           await new Promise(resolve => {
               reader.onloadend = () => {
                  newPreviews.push(reader.result);
                  newImages.push(reader.result);
                  resolve();
               };
               reader.readAsDataURL(compressed);
           });
        }
      }
      
      setImagePreviews(newPreviews);
      setForm(prev => ({ ...prev, images: newImages, image: newImages[0] || '' }));
      setUploading(false);
      toast.success(t('safetyReports.imageAddSuccess') || 'تم إضافة الملفات بنجاح');
    } catch (e) { 
      console.error(e);
      setUploading(false); 
    }
  };
  const removeImage = (idx) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== idx);
    const updatedImages = (form.images || []).filter((_, i) => i !== idx);
    setImagePreviews(updatedPreviews);
    setForm(prev => ({...prev, images: updatedImages, image: updatedImages[0] || ''}));
  };
"""

        # We will just replace it using regex to handle variations
        code = re.sub(r"const handleImageSelect = async \(e\) => \{[\s\S]*?(?:setUploading\(false\); \} \}|\}\n  \};)\n", new_handle, code)

    # multiple on input
    code = code.replace('accept="image/*"', 'accept="image/*,application/pdf" multiple')
    
    # Render logic
    # Find {imagePreview && (
    preview_block = """                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      <img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-teal-200 cursor-zoom-in" onClick={() => setZoomedImage(imagePreview)} />
                      <button type="button" onClick={() => { setImagePreview(''); setForm(prev => ({...prev, image: ''})); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600">×</button>
                    </div>
                  )}"""
                  
    preview_block_alt = """                  {imagePreview && (
                    <div className="mb-3 relative inline-block">
                      {imagePreview.startsWith('data:application/pdf') || imagePreview.endsWith('.pdf') ? (
                        <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-teal-200 flex flex-col items-center justify-center p-2 cursor-pointer" onClick={() => handleDownloadPDF({ image: imagePreview })}>
                          <FileText className="w-10 h-10 text-red-500 mb-2" />
                          <span className="text-xs text-gray-600 font-bold text-center">PDF File</span>
                        </div>
                      ) : (
                        <img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-teal-200 cursor-zoom-in" onClick={() => setZoomedImage(imagePreview)} />
                      )}
                      <button type="button" onClick={() => { setImagePreview(''); setForm(prev => ({...prev, image: ''})); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg">×</button>
                    </div>
                  )}"""

    new_preview_block = """                  {imagePreviews.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-3">
                      {imagePreviews.map((img, idx) => (
                        <div key={idx} className="relative inline-block">
                          {img.startsWith('data:application/pdf') || img.endsWith('.pdf') ? (
                            <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-teal-200 flex flex-col items-center justify-center p-2 cursor-pointer">
                              <span className="text-xs text-gray-600 font-bold text-center">PDF File</span>
                            </div>
                          ) : (
                            <img src={resolveImageUrl(img)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-teal-200 cursor-zoom-in" onClick={() => setZoomedImage(img)} />
                          )}
                          <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg">×</button>
                        </div>
                      ))}
                    </div>
                  ) : (imagePreview && (
                    <div className="mb-3 relative inline-block">
                      {imagePreview.startsWith('data:application/pdf') || imagePreview.endsWith('.pdf') ? (
                        <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-teal-200 flex flex-col items-center justify-center p-2 cursor-pointer">
                          <span className="text-xs text-gray-600 font-bold text-center">PDF File</span>
                        </div>
                      ) : (
                        <img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-teal-200 cursor-zoom-in" onClick={() => setZoomedImage(imagePreview)} />
                      )}
                      <button type="button" onClick={() => { setImagePreview(''); setForm(prev => ({...prev, image: ''})); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow-lg">×</button>
                    </div>
                  ))}"""

    # We use regex to replace the preview block
    code = re.sub(r"\{imagePreview && \([\s\S]*?<\/div>\s*\)\}", new_preview_block, code)

    # For the view mode
    # we need to display multiple images
    view_image_block = """{viewReport.image && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('qualityReports.image')}</p>
                    <img src={resolveImageUrl(viewReport.image)} alt="" className="w-full rounded-xl object-cover max-h-64 cursor-zoom-in border border-gray-100" onClick={() => setZoomedImage(viewReport.image)} />
                  </div>
                )}"""
                
    new_view_block = """{(viewReport.images && viewReport.images.length > 0) ? (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('safetyReports.attachments') || 'المرفقات'}</p>
                    <div className="flex flex-wrap gap-2">
                    {viewReport.images.map((img, idx) => (
                      <div key={idx}>
                        {img.startsWith('data:application/pdf') || img.endsWith('.pdf') ? (
                          <div className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-2 cursor-pointer" onClick={() => handleDownloadPDF({ image: img })}>
                            <span className="text-xs text-gray-600 font-bold text-center">PDF {idx+1}</span>
                          </div>
                        ) : (
                          <img src={resolveImageUrl(img)} alt="" className="w-32 h-32 rounded-xl object-cover cursor-zoom-in border border-gray-100" onClick={() => setZoomedImage(img)} />
                        )}
                      </div>
                    ))}
                    </div>
                  </div>
                ) : (viewReport.image && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">{t('safetyReports.attachments') || 'المرفقات'}</p>
                    {viewReport.image.startsWith('data:application/pdf') || viewReport.image.endsWith('.pdf') ? (
                      <div className="w-32 h-32 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center p-2 cursor-pointer" onClick={() => handleDownloadPDF({ image: viewReport.image })}>
                        <span className="text-xs text-gray-600 font-bold text-center">PDF File</span>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(viewReport.image)} alt="" className="w-full rounded-xl object-cover max-h-64 cursor-zoom-in border border-gray-100" onClick={() => setZoomedImage(viewReport.image)} />
                    )}
                  </div>
                ))}"""
                
    code = re.sub(r"\{viewReport\.image && \([\s\S]*?<\/div>\s*\)\}", new_view_block, code)

    # Empty form initialization inside openAdd
    code = code.replace("setImagePreview(''); setShowModal(true);", "setImagePreview(''); setImagePreviews([]); setShowModal(true);")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

patch_file(r'd:\sery17-main\sery17-main\frontend\src\pages\SafetyReports.js')
patch_file(r'd:\sery17-main\sery17-main\frontend\src\pages\QualityReports.js')
print("Patched Safety and Quality Reports!")
