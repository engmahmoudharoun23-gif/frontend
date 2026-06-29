import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import axios from 'axios';
import { UploadCloud, FileImage, CheckCircle, AlertTriangle, Info, Camera, Search, Cpu } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';

function AIImageAudit({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError(isRtl ? 'الرجاء اختيار ملف صورة صالح' : 'Please select a valid image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setError(isRtl ? 'الرجاء اختيار ملف صورة صالح' : 'Please select a valid image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const triggerScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('lang', isRtl ? 'ar' : 'en');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai-image-audit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setResult(response.data.result);
      } else {
        setError(response.data.error || (isRtl ? 'حدث خطأ أثناء فحص الصورة' : 'Error scanning image'));
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        (isRtl ? 'فشل الاتصال بالخادم الذكي. تأكد من اتصالك أو جرب لاحقاً' : 'Failed to connect to AI server.')
      );
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} title={isRtl ? "تدقيق الصور بالذكاء الاصطناعي" : "AI Image Audit"}>
      <div className="max-w-5xl mx-auto p-4 md:p-6 lg:p-8 space-y-8 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white opacity-5 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-indigo-500 opacity-10 blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
              <Cpu className="w-12 h-12 text-indigo-300" />
            </div>
            <div className="text-center md:text-right flex-1">
              <h1 className="text-3xl font-black mb-2 tracking-tight">
                {isRtl ? 'المدقق الجنائي الذكي للصور' : 'AI Forensic Image Auditor'}
              </h1>
              <p className="text-indigo-200 text-lg max-w-2xl font-medium">
                {isRtl 
                  ? 'ارفع أي صورة لكشف التعديلات المخفية، التلاعب بالبرامج (مثل الفوتوشوب)، أو التزييف بدقة عالية وبشفافية تامة.'
                  : 'Upload an image to detect hidden modifications, software manipulation (like Photoshop), or forgery with high accuracy.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Upload Area */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-50">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Camera className="w-6 h-6 text-indigo-600" />
                {isRtl ? 'إدخال الصورة' : 'Image Input'}
              </h2>
              
              {!previewUrl ? (
                <div 
                  className="border-3 border-dashed border-indigo-200 rounded-2xl p-10 text-center hover:bg-indigo-50 hover:border-indigo-400 transition-all cursor-pointer group h-80 flex flex-col justify-center items-center"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="bg-indigo-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    <UploadCloud className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">
                    {isRtl ? 'اسحب الصورة هنا أو اضغط للاختيار' : 'Drag image here or click to select'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isRtl ? 'يدعم JPG, PNG, WEBP' : 'Supports JPG, PNG, WEBP'}
                  </p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 group shadow-lg h-80 flex items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${isScanning ? 'opacity-40 blur-sm' : 'opacity-100'}`} 
                  />
                  
                  {isScanning && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="w-full h-1 bg-indigo-500 absolute top-0 shadow-[0_0_15px_#6366f1] animate-scan"></div>
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4 shadow-lg"></div>
                      <p className="text-white font-bold text-lg animate-pulse bg-black/50 px-4 py-2 rounded-xl backdrop-blur-sm">
                        {isRtl ? 'جاري الفحص العميق بالذكاء الاصطناعي...' : 'Deep AI Scanning...'}
                      </p>
                    </div>
                  )}

                  {!isScanning && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                      <button 
                        onClick={triggerScan}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl hover:scale-105 transition-all flex items-center gap-2"
                      >
                        <Search className="w-5 h-5" />
                        {isRtl ? 'بدء الفحص الآن' : 'Start Scan Now'}
                      </button>
                      <button 
                        onClick={resetScanner}
                        className="bg-gray-200 hover:bg-white text-gray-800 px-6 py-3 rounded-xl font-bold shadow-2xl hover:scale-105 transition-all"
                      >
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
              
              {error && (
                <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3 animate-fade-in">
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-semibold mt-0.5">{error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Results Area */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-indigo-50 h-full flex flex-col relative overflow-hidden">
              
              {!result && !isScanning && (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
                  <Cpu className="w-20 h-20 mb-4" />
                  <p className="text-lg font-medium">{isRtl ? 'النتائج ستظهر هنا بعد الفحص' : 'Results will appear here after scanning'}</p>
                </div>
              )}

              {isScanning && (
                <div className="flex-1 flex flex-col items-center justify-center text-indigo-400 space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="font-bold animate-pulse">{isRtl ? 'يتم تحليل البكسلات والبحث عن أدلة التلاعب...' : 'Analyzing pixels and searching for manipulation evidence...'}</p>
                </div>
              )}

              {result && (
                <div className="animate-fade-in-up space-y-6 flex-1">
                  
                  {/* Status Banner */}
                  <div className={`p-5 rounded-2xl flex flex-col gap-4 shadow-sm border ${
                    result.is_manipulated 
                      ? 'bg-red-50 border-red-200 text-red-800' 
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-inner flex-shrink-0 ${result.is_manipulated ? 'bg-red-100' : 'bg-green-100'}`}>
                        {result.is_manipulated ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-black mb-1">
                          {result.is_manipulated 
                            ? (isRtl ? 'تم اكتشاف تلاعب خارجي (إضافة نصوص/أرقام)' : 'External Manipulation Detected')
                            : (isRtl ? 'الصورة سليمة وطبيعية 100%' : 'Image is 100% authentic')}
                        </h3>
                        <p className="font-medium opacity-90">
                          {isRtl ? 'اكتمل الفحص الجنائي بنجاح' : 'Forensic scan completed successfully'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Scene Authentic Badge */}
                    {result.scene_authentic !== undefined && (
                      <div className={`mt-2 p-3 rounded-xl border flex items-center gap-3 ${
                        result.scene_authentic 
                          ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                          : 'bg-rose-100 border-rose-300 text-rose-900'
                      }`}>
                        {result.scene_authentic ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-rose-600" />}
                        <p className="font-bold text-sm">
                          {result.scene_authentic 
                            ? (isRtl ? 'تأكيد أمني: المشهد الحقيقي (الأسفلت/الحفرية/الموقع) أصلي ولم يتم تزييفه أو التلاعب به.' : 'Security Confirmation: The physical scene (asphalt/excavation) is authentic and untampered.')
                            : (isRtl ? 'تحذير خطير: المشهد الفعلي (الأسفلت/الحفرية) مزيف أو تم التلاعب به ببرامج التعديل!' : 'CRITICAL WARNING: The physical scene has been tampered with!')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Software Used */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      {isRtl ? 'البرنامج المستخدم' : 'Software Used'}
                    </h4>
                    <p className="text-lg font-bold text-gray-900">{result.software_used}</p>
                  </div>

                  {/* Modifications List */}
                  {result.modifications && result.modifications.length > 0 && (
                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100 shadow-sm">
                      <h4 className="text-sm font-bold text-orange-800 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        {isRtl ? 'أماكن ونوع التعديل' : 'Modification Areas & Types'}
                      </h4>
                      <ul className="space-y-2">
                        {result.modifications.map((mod, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span className="text-gray-800 font-medium leading-relaxed">{mod}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deep Analysis Details */}
                  <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100 shadow-sm flex-1">
                    <h4 className="text-sm font-bold text-indigo-800 mb-2 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      {isRtl ? 'تقرير التحليل المفصل' : 'Detailed Analysis Report'}
                    </h4>
                    <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                      {result.details}
                    </p>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Global style for scan animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        .animate-scan {
          animation: scan 3s ease-in-out infinite;
        }
      `}} />
    </Layout>
  );
}

export default AIImageAudit;
