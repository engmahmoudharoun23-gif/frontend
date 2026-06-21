import sys
import re

def patch_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        code = f.read()

    # Add files array to emptyForm
    code = re.sub(
        r"file_url:\s*'',\s*file_name:\s*''",
        r"file_url: '', file_name: '', files: []",
        code
    )

    # Edit handling
    code = code.replace(
        "file_name: r.file_name || ''",
        "file_name: r.file_name || '', files: r.files || []"
    )

    # handleFileSelect modification
    if "const handleFileSelect" in code:
        old_handle = """  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/storage/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      const { storage_path } = res.data;
      const resolvedUrl = storage_path.startsWith('http') ? storage_path : `${API}/storage/files/${storage_path}`;
      setForm(prev => ({
        ...prev,
        file_url: resolvedUrl,
        file_name: file.name
      }));
      toast.success(t('businessReports.saveSuccess') || 'تم رفع الملف بنجاح');
    } catch (err) {
      toast.error('فشل في رفع الملف');
    } finally {
      setUploading(false);
    }
  };"""

        new_handle = """  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('token');
      const newFiles = [...(form.files || [])];
      
      let i = 0;
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const res = await axios.post(`${API}/storage/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(((i * 100) + (progressEvent.loaded * 100) / progressEvent.total) / files.length);
            setUploadProgress(percentCompleted);
          }
        });
        
        const { storage_path } = res.data;
        const resolvedUrl = storage_path.startsWith('http') ? storage_path : `${API}/storage/files/${storage_path}`;
        
        newFiles.push({
           url: resolvedUrl,
           name: file.name
        });
        i++;
      }
      
      setForm(prev => ({
        ...prev,
        files: newFiles,
        file_url: newFiles.length > 0 ? newFiles[0].url : '',
        file_name: newFiles.length > 0 ? newFiles[0].name : ''
      }));
      toast.success(t('businessReports.saveSuccess') || 'تم رفع الملف بنجاح');
    } catch (err) {
      toast.error('فشل في رفع الملف');
    } finally {
      setUploading(false);
    }
  };
  
  const removeFile = (idx) => {
     const newFiles = [...(form.files || [])];
     newFiles.splice(idx, 1);
     setForm(prev => ({
        ...prev,
        files: newFiles,
        file_url: newFiles.length > 0 ? newFiles[0].url : '',
        file_name: newFiles.length > 0 ? newFiles[0].name : ''
     }));
  };
"""

        # We will just replace it using regex to handle variations
        code = re.sub(r"const handleFileSelect = async \(e\) => \{[\s\S]*?(?:setUploading\(false\);\s*\}\s*\}\s*};|setUploading\(false\);\s*\}\s*\};)\n", new_handle, code)

    # multiple on input
    code = code.replace('<input type="file" onChange={handleFileSelect}', '<input type="file" multiple onChange={handleFileSelect}')

    # UI changes for the form modal preview
    preview_block = """                  {form.file_url && (
                    <div className="mt-3 relative bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-blue-900 truncate" dir="ltr">{form.file_name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setShowDeleteFileConfirm(true)} 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                        title={isRtl ? 'حذف الملف' : 'Delete file'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}"""

    new_preview_block = """                  {form.files && form.files.length > 0 ? (
                    <div className="mt-3 flex flex-col gap-2">
                       {form.files.map((f, idx) => (
                          <div key={idx} className="relative bg-blue-50 p-3 rounded-xl flex items-center justify-between border border-blue-100">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <FileText className="w-6 h-6 text-blue-500 shrink-0" />
                              <span className="text-sm font-medium text-blue-900 truncate" dir="ltr">{f.name || f.file_name}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeFile(idx)} 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                       ))}
                    </div>
                  ) : form.file_url && (
                    <div className="mt-3 relative bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-blue-900 truncate" dir="ltr">{form.file_name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({...prev, file_url: '', file_name: ''}))} 
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}"""

    code = code.replace(preview_block, new_preview_block)

    # In the table view, we should show the number of files if there are multiple.
    td_block = """                        <td className="px-4 py-3.5 text-center max-w-[180px] truncate">
                          {r.file_name ? (
                            <button
                              onClick={() => handleViewFile(r)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-100 font-bold max-w-full truncate cursor-pointer transition-colors"
                              title={r.file_name}
                            >
                              📎 <span className="truncate">{r.file_name}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>"""
                        
    new_td_block = """                        <td className="px-4 py-3.5 text-center max-w-[180px] truncate">
                          {(r.files && r.files.length > 0) ? (
                            <div className="flex flex-col gap-1 items-center">
                              {r.files.map((f, i) => (
                                <button
                                  key={i}
                                  onClick={() => handleViewFile({ file_url: f.url, file_name: f.name })}
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-100 font-bold max-w-full truncate cursor-pointer transition-colors"
                                  title={f.name}
                                >
                                  📎 <span className="truncate">{f.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : r.file_name ? (
                            <button
                              onClick={() => handleViewFile(r)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-100 font-bold max-w-full truncate cursor-pointer transition-colors"
                              title={r.file_name}
                            >
                              📎 <span className="truncate">{r.file_name}</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>"""
                        
    code = code.replace(td_block, new_td_block)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)

patch_file(r'd:\sery17-main\sery17-main\frontend\src\pages\BusinessReports.js')
print("Patched Business Reports!")
