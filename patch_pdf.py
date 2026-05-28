import os

def patch_file(filepath, is_work_permit=False):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. handleImageSelect
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
        toast.success(t('"""
    
    # We match it slightly more loosely if needed
    if "const compressed = await compressImage(file);" in content:
        # let's just do a string replace for the whole body of handleImageSelect
        pass

    # Actually, let's just replace the exact substrings since we know what they are.
    
    # 1. Update handleImageSelect body
    # We replace the try block inside handleImageSelect
    try_block_old = """    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setForm(prev => ({ ...prev, image: reader.result }));
        setUploading(false);"""
    
    try_block_new = """    try {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setForm(prev => ({ ...prev, image: reader.result }));
          setUploading(false);
          toast.success("تم إرفاق الملف بنجاح");
        };
        reader.readAsDataURL(file);
      } else {
        const compressed = await compressImage(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
          setForm(prev => ({ ...prev, image: reader.result }));
          setUploading(false);"""
          
    content = content.replace(try_block_old, try_block_new)
    
    # 2. Update accept attribute
    content = content.replace('accept="image/*" className="hidden"', 'accept="image/*,application/pdf" className="hidden"')
    # Note: camera input should stay image/* since camera can't capture PDF
    
    # 3. Update preview image inside Modal (Add Form)
    preview_old = """<img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-orange-200 cursor-zoom-in" onClick={() => setZoomedImage(imagePreview)} />"""
    
    preview_new = """{imagePreview.startsWith('data:application/pdf') || imagePreview.endsWith('.pdf') ? (
                        <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-200 flex items-center justify-center min-w-[128px] min-h-[128px]">
                          <div className="text-center">
                            <FileText className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                            <span className="text-xs font-bold text-orange-800">ملف PDF مرفق</span>
                          </div>
                        </div>
                      ) : (
                        <img src={resolveImageUrl(imagePreview)} alt="" className="w-32 h-32 rounded-xl object-cover border-2 border-orange-200 cursor-zoom-in" onClick={() => setZoomedImage(imagePreview)} />
                      )}"""
    
    content = content.replace(preview_old, preview_new)
    
    # 4. Update preview image inside View Details Modal
    view_preview_old = """<img src={resolveImageUrl(viewReport.image)} alt="" className="w-full rounded-xl object-cover max-h-64 cursor-zoom-in border border-gray-100" onClick={() => setZoomedImage(viewReport.image)} />"""
    
    view_preview_new = """{viewReport.image.startsWith('data:application/pdf') || viewReport.image.endsWith('.pdf') ? (
                      <div className="p-6 bg-orange-50 rounded-xl border-2 border-dashed border-orange-200 flex flex-col items-center justify-center">
                        <FileText className="w-16 h-16 text-orange-500 mb-3" />
                        <span className="text-sm font-bold text-orange-800 mb-4">ملف PDF مرفق</span>
                      </div>
                    ) : (
                      <img src={resolveImageUrl(viewReport.image)} alt="" className="w-full rounded-xl object-cover max-h-64 cursor-zoom-in border border-gray-100" onClick={() => setZoomedImage(viewReport.image)} />
                    )}"""
                    
    content = content.replace(view_preview_old, view_preview_new)
    
    # 5. Add arrow right for WorkPermits back button
    if is_work_permit:
        if "lucide-react';" in content and "ArrowRight" not in content:
            content = content.replace("CheckCircle } from", "CheckCircle, ArrowRight } from")
        
        back_btn_old = """<FileText className="w-5 h-5" /> {t('workPermits.goToSafety', { defaultValue: 'تقارير السلامة' })}"""
        back_btn_new = """{isRtl ? <ArrowRight className="w-5 h-5" /> : <FileText className="w-5 h-5" />} {t('workPermits.goToSafety', { defaultValue: 'تقارير السلامة' })}"""
        content = content.replace(back_btn_old, back_btn_new)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
def main():
    base = r"d:\sery17-main\sery17-main\frontend\src\pages"
    patch_file(os.path.join(base, "SafetyReports.js"), is_work_permit=False)
    patch_file(os.path.join(base, "WorkPermits.js"), is_work_permit=True)
    print("Patched both files for PDF support!")

if __name__ == "__main__":
    main()
