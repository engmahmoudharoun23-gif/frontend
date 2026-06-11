import sys
import re

with open('d:/sery17-main/sery17-main/frontend/src/pages/WorkPermits.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update emptyForm
content = content.replace(
    "const emptyForm = { date: '', project: '', governorate: '', notes: '', image: '' };",
    "const emptyForm = { date: '', project: '', governorate: '', notes: '', image: '', images: [] };"
)

# 2. Add imagePreviews state
content = content.replace(
    "const [imagePreview, setImagePreview] = useState('');\n  const [uploading",
    "const [imagePreview, setImagePreview] = useState('');\n  const [imagePreviews, setImagePreviews] = useState([]);\n  const [uploading"
)

# 3. Update openAdd
content = content.replace(
    "const openAdd = () => { setEditingReport(null); setForm(emptyForm); setImagePreview(''); setShowModal(true); };",
    "const openAdd = () => { setEditingReport(null); setForm(emptyForm); setImagePreview(''); setImagePreviews([]); setShowModal(true); };"
)

# 4. Update openEdit
content = content.replace(
    "setForm({ date: full.date || '', project: full.project || '', governorate: full.governorate || '', notes: full.notes || '', image: full.image || '' });",
    "setForm({ date: full.date || '', project: full.project || '', governorate: full.governorate || '', notes: full.notes || '', image: full.image || '', images: full.images || [] });"
)
content = content.replace(
    "setImagePreview(full.image || ''); \n      setShowModal(true);",
    "setImagePreview(full.image || ''); \n      setImagePreviews(full.images || []); \n      setShowModal(true);"
)

# 5. Add removeImage function
remove_img_func = """
  const removeImage = (idx) => {
    const updatedPreviews = imagePreviews.filter((_, i) => i !== idx);
    const updatedImages = (form.images || []).filter((_, i) => i !== idx);
    setImagePreviews(updatedPreviews);
    setForm(prev => ({...prev, images: updatedImages, image: updatedImages[0] || ''}));
  };
"""
content = content.replace(
    "const openAdd = () =>",
    remove_img_func + "\n  const openAdd = () =>"
)

# 6. Replace handleImageSelect entirely
new_handleImageSelect = """
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const newPreviews = [...imagePreviews];
      const newImages = [...(form.images || [])];
      
      for (let file of files) {
        if (file.type === 'application/pdf') {
          if (file.size > 10 * 1024 * 1024) {
            toast.error("حجم ملف الـ PDF يتجاوز 10 ميجا. يرجى اختيار ملف أصغر.");
            continue;
          }
          const reader = new FileReader();
          let base64pdf = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API}/compress-pdf`, { pdf: base64pdf }, { headers: { Authorization: `Bearer ${token}` } });
            if (res.data && res.data.pdf) base64pdf = res.data.pdf;
          } catch (e) { console.error('PDF compression failed', e); }
          newPreviews.push(base64pdf);
          newImages.push(base64pdf);
        } else {
          const compressed = await compressImage(file);
          const result = await new Promise(resolve => {
            const r = new FileReader();
            r.onloadend = () => resolve(r.result);
            r.readAsDataURL(compressed);
          });
          newPreviews.push(result);
          newImages.push(result);
        }
      }
      
      setImagePreviews(newPreviews);
      setForm(prev => ({ ...prev, images: newImages, image: newImages[0] || '' }));
      setUploading(false);
      toast.success(isRtl ? 'تم إضافة الملفات وضغطها بنجاح' : 'Files added and compressed successfully');
    } catch (e) { 
      console.error(e);
      setUploading(false); 
    }
  };
"""

# Extract and replace handleImageSelect
start_idx = content.find("const handleImageSelect = async (e) => {")
end_idx = content.find("const openAdd = () =>", start_idx)
content = content[:start_idx] + new_handleImageSelect.strip() + "\n\n  " + content[end_idx:]

# 7. Add multiple attribute to file inputs
content = content.replace(
    'accept="image/*,application/pdf" className="hidden"',
    'accept="image/*,application/pdf" multiple className="hidden"'
)
content = content.replace(
    'accept="image/*" capture="environment" className="hidden"',
    'accept="image/*" multiple capture="environment" className="hidden"'
)

# 8. Render imagePreviews
old_render = """{imagePreview && (
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
                )}"""

new_render = """{imagePreviews.length > 0 ? (
                  <div className="mb-4 flex flex-wrap gap-4">
                    {imagePreviews.map((img, idx) => (
                      <div key={idx} className="relative inline-block">
                        {img.startsWith('data:application/pdf') || img.endsWith('.pdf') ? (
                          <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-teal-200 flex flex-col items-center justify-center p-2 cursor-pointer">
                            <span className="text-xs text-gray-600 font-bold text-center">PDF File</span>
                          </div>
                        ) : (
                          <img src={resolveImageUrl(img)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-teal-200 cursor-zoom-in shadow-sm" onClick={() => setZoomedImage(img)} />
                        )}
                        <button type="button" onClick={() => removeImage(idx)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-red-600 shadow-lg border-2 border-white">×</button>
                      </div>
                    ))}
                  </div>
                ) : (imagePreview && (
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
                ))}"""

content = content.replace(old_render, new_render)

with open('d:/sery17-main/sery17-main/frontend/src/pages/WorkPermits.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("WorkPermits.js patched successfully")
