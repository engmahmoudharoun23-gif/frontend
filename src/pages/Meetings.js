import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Meetings({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const [meetings, setMeetings] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'أسبوعي',
    date: new Date().toISOString().split('T')[0],
    contractor: '',
    consultant: '',
    description: ''
  });
  const [images, setImages] = useState([]); // File objects
  const [previews, setPreviews] = useState([]); // Object URLs
  const [pdfFiles, setPdfFiles] = useState([]); // File objects
  const [existingImages, setExistingImages] = useState([]); // Paths for edit mode
  const [existingPdfs, setExistingPdfs] = useState([]); // Paths for edit mode
  const [fullscreenImage, setFullscreenImage] = useState(null);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  
  // For debouncing search
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchMeetings();
    
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [currentPage, itemsPerPage, dateFilter, typeFilter, debouncedSearch]);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      let url = `${API}/meetings?skip=${skip}&limit=${itemsPerPage}`;
      if (dateFilter) url += `&date=${dateFilter}`;
      if (typeFilter && typeFilter !== 'الكل') url += `&type=${typeFilter}`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMeetings(res.data.meetings || []);
      setTotalItems(res.data.total || 0);
    } catch (error) {
      console.error(error);
      toast.error(t('meetings.errorFetch', { defaultValue: 'حدث خطأ أثناء تحميل الاجتماعات' }));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Compress Image function
  const compressImage = (file, maxSizeKB) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let quality = 0.9;
          let width = img.width;
          let height = img.height;
          
          // Initial scale down if very large
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width *= ratio;
            height *= ratio;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const tryCompress = (q) => {
            canvas.toBlob((blob) => {
              if (blob.size / 1024 <= maxSizeKB || q <= 0.2) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }));
              } else {
                width *= 0.85;
                height *= 0.85;
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                tryCompress(q - 0.15);
              }
            }, 'image/jpeg', q);
          };
          
          tryCompress(quality);
        };
      };
    });
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    const loadingToast = toast.loading('جاري ضغط الصور تلقائياً...');
    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast.error(`صيغة غير مدعومة للصورة: ${file.name}`);
        continue;
      }
      
      try {
        const compressed = await compressImage(file, 100);
        validFiles.push(compressed);
        validPreviews.push(URL.createObjectURL(compressed));
      } catch (err) {
        console.error("Compression error", err);
      }
    }

    toast.dismiss(loadingToast);
    setImages(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...validPreviews]);
  };

  const removeImage = (index, isExisting = false) => {
    if (isExisting) {
      setExistingImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
      setPreviews(prev => {
        const newPreviews = [...prev];
        URL.revokeObjectURL(newPreviews[index]); // Free memory
        newPreviews.splice(index, 1);
        return newPreviews;
      });
    }
  };

  const handlePdfSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const validPdfs = files.filter(f => f.type === 'application/pdf');
    if (validPdfs.length !== files.length) toast.error('بعض الملفات ليست بصيغة PDF وتم استبعادها');
    
    setPdfFiles(prev => [...prev, ...validPdfs]);
  };

  const removePdf = (index, isExisting = false) => {
    if (isExisting) {
      setExistingPdfs(prev => prev.filter((_, i) => i !== index));
    } else {
      setPdfFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const openAddModal = () => {
    setSelectedMeeting(null);
    setFormData({
      title: '',
      type: 'أسبوعي',
      date: new Date().toISOString().split('T')[0],
      project: '',
      governorate: '',
      contractor: '',
      consultant: '',
      description: ''
    });
    setImages([]);
    setPreviews([]);
    setPdfFiles([]);
    setExistingImages([]);
    setExistingPdfs([]);
    setShowFormModal(true);
  };

  const openEditModal = (meeting) => {
    setSelectedMeeting(meeting);
    setFormData({
      title: meeting.title,
      type: meeting.type,
      date: meeting.date,
      project: meeting.project || '',
      governorate: meeting.governorate || '',
      contractor: meeting.contractor || '',
      consultant: meeting.consultant || '',
      description: meeting.description || ''
    });
    setImages([]);
    setPreviews([]);
    setPdfFiles([]);
    setExistingImages(meeting.images || []);
    setExistingPdfs(meeting.pdf_paths || (meeting.pdf_path ? [meeting.pdf_path] : []));
    setShowFormModal(true);
    setActiveDropdown(null);
  };

  const openViewModal = (meeting) => {
    setSelectedMeeting(meeting);
    setShowViewModal(true);
    setActiveDropdown(null);
  };

  const openImagesModal = (meeting) => {
    setSelectedMeeting(meeting);
    setShowImagesModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('meetings.confirmDelete', { defaultValue: 'هل أنت متأكد من حذف هذا الاجتماع نهائياً؟' }))) return;
    try {
      await axios.delete(`${API}/meetings/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(t('meetings.successDelete', { defaultValue: 'تم حذف الاجتماع بنجاح' }));
      fetchMeetings();
    } catch (error) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.project) {
      toast.error('يرجى تعبئة جميع الحقول الإلزامية');
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('type', formData.type);
    data.append('date', formData.date);
    data.append('project', formData.project);
    data.append('governorate', formData.governorate);
    data.append('contractor', formData.contractor || '');
    data.append('consultant', formData.consultant || '');
    data.append('description', formData.description);

    images.forEach(img => data.append('images', img));
    pdfFiles.forEach(pdf => data.append('pdfs', pdf));

    const savePromise = (async () => {
      try {
        if (selectedMeeting) {
          data.append('existing_images', JSON.stringify(existingImages));
          data.append('existing_pdfs', JSON.stringify(existingPdfs));
          await axios.put(`${API}/meetings/${selectedMeeting.id}`, data, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        } else {
          await axios.post(`${API}/meetings`, data, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
        }
        fetchMeetings();
      } catch (error) {
        throw error?.response?.data?.detail || error.message;
      }
    })();

    toast.promise(savePromise, {
      pending: 'جاري الحفظ والضغط في الخلفية... ⚡',
      success: selectedMeeting ? t('meetings.successEdit', { defaultValue: 'تم تعديل الاجتماع بنجاح!' }) : t('meetings.successAdd', { defaultValue: 'تم إضافة الاجتماع بنجاح!' }),
      error: {
        render({ data }) {
          return `حدث خطأ: ${data}`;
        }
      }
    });

    // Close immediately for high performance UX
    setShowFormModal(false);
    setIsSubmitting(false);
  };

  const getFullUrl = (path) => {
    if (!path) return '';
    const str = String(path);
    if (str.startsWith('http') || str.startsWith('data:') || str.startsWith('blob:')) return str;
    return `${BACKEND_URL}${str}`;
  };

  const downloadImage = async (url, index) => {
    try {
      const response = await fetch(getFullUrl(url));
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `meeting_attachment_${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل الصورة');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout} title={t("sidebar.meetings", { defaultValue: "الاجتماعات" })}> 
      <div className="p-4 md:p-6 mx-auto max-w-7xl animate-fade-in-up">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">{t("meetings.title", { defaultValue: "سجل الاجتماعات" })}</h1>
              <p className="text-xs font-medium text-gray-500 mt-1">{t("meetings.subtitle", { defaultValue: "إدارة اجتماعات المقاولين والاستشاريين" })} ({totalItems})</p>
            </div>
          </div>
          {(user?.role === 'admin' || user?.permissions?.includes('meetings_add') || (user?.project_permissions && Object.values(user.project_permissions).some(perms => perms?.includes('meetings_add')))) && (
            <button 
              onClick={openAddModal}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("meetings.addMeeting", { defaultValue: "إضافة اجتماع" })}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/3 relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" 
              placeholder={t("meetings.search", { defaultValue: "بحث في الاجتماعات..." })} 
              value={searchQuery}
              onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
              className="w-full pr-10 p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
            />
          </div>
          <div className="w-full md:w-1/3">
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => {setDateFilter(e.target.value); setCurrentPage(1);}}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
            />
          </div>
          <div className="w-full md:w-1/3">
            <select 
              value={typeFilter}
              onChange={(e) => {setTypeFilter(e.target.value); setCurrentPage(1);}}
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 text-sm"
            >
              <option value="الكل">{t("meetings.allTypes", { defaultValue: "كل أنواع الاجتماعات" })}</option>
              <option value="أسبوعي">{t("meetings.weekly", { defaultValue: "أسبوعي" })}</option>
              <option value="شهري">{t("meetings.monthly", { defaultValue: "شهري" })}</option>
              <option value="زيارة للفرع">زيارة للفرع</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3"></div>
              <p className="text-indigo-600 font-medium">{t("meetings.loading", { defaultValue: "جاري تحميل البيانات..." })}</p>
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-24 text-center">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium text-lg">{t("meetings.noMeetings", { defaultValue: "لا توجد اجتماعات مسجلة حالياً" })}</p>
            </div>
          ) : (
            <div className={`w-full transition-all duration-300 ${activeDropdown ? 'pb-56 lg:pb-4' : 'pb-4'} overflow-x-auto lg:overflow-visible`}>
              <table className="min-w-full text-sm text-center">
                <thead className="bg-gray-50/80 text-gray-700 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏷️ {t("meetings.meetingName", { defaultValue: "اسم الاجتماع" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📊 {t("meetings.type", { defaultValue: "النوع" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📅 {t("meetings.date", { defaultValue: "التاريخ" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏛️ {t("meetings.governorate", { defaultValue: "المحافظة التي تم فيها الاجتماع" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">🏗️ {t("meetings.project", { defaultValue: "المشروع" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">👷 {t("meetings.contractor", { defaultValue: "المقاول" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">👔 {t("meetings.consultant", { defaultValue: "الاستشاري" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50">📎 {t("meetings.attachments", { defaultValue: "المرفقات" })}</th>
                    <th className="px-4 py-4 font-black whitespace-nowrap text-center text-blue-900 bg-gray-100/50 w-20">⚙️ {t("meetings.actions", { defaultValue: "إجراءات" })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {meetings.map((meeting) => (
                    <tr key={meeting.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-900 text-center">{meeting.title}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-black inline-block ${meeting.type === 'شهري' ? 'bg-purple-100 text-purple-700' : meeting.type === 'زيارة للفرع' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {meeting.type === 'أسبوعي' ? t('meetings.weekly', { defaultValue: 'أسبوعي' }) : meeting.type === 'شهري' ? t('meetings.monthly', { defaultValue: 'شهري' }) : meeting.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600 font-bold text-center" dir="ltr">{new Date(meeting.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-4 text-gray-800 font-bold text-center">{meeting.governorate || '-'}</td>
                      <td className="px-4 py-4 text-gray-800 font-bold text-center">{meeting.project || '-'}</td>
                      <td className="px-4 py-4 text-gray-800 font-medium text-center">{meeting.contractor || '-'}</td>
                      <td className="px-4 py-4 text-gray-800 font-medium text-center">{meeting.consultant || '-'}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {meeting.images && meeting.images.length > 0 ? (
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold" title="صور مرفقة">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              {meeting.images.length}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                          
                          {(meeting.pdf_paths && meeting.pdf_paths.length > 0) ? (
                            <button onClick={() => window.open(getFullUrl(meeting.pdf_paths[0]), '_blank')} className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold" title="عرض ملفات PDF">
                              PDF ({meeting.pdf_paths.length})
                            </button>
                          ) : meeting.pdf_path ? (
                            <button onClick={() => window.open(getFullUrl(meeting.pdf_path), '_blank')} className="text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold">
                              PDF
                            </button>
                          ) : null}
                          
                          {!(meeting.images?.length > 0) && !meeting.pdf_paths?.length && !meeting.pdf_path && (
                             <span className="text-gray-300">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center overflow-visible">
                        <div className="relative inline-block text-center overflow-visible">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === meeting.id ? null : meeting.id); }}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                          >
                            <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                          
                          {activeDropdown === meeting.id && (
                            <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 shadow-2xl rounded-xl z-[1000] overflow-hidden left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 origin-top animate-in fade-in slide-in-from-top-2 duration-200 text-right">
                              <button onClick={(e) => { e.stopPropagation(); openViewModal(meeting); }} className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold flex items-center gap-3 border-b border-gray-50">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {t("meetings.viewDetails", { defaultValue: "عرض التفاصيل" })}
                              </button>
                              
                              {meeting.images && meeting.images.length > 0 && (
                                <button onClick={(e) => { e.stopPropagation(); openImagesModal(meeting); }} className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold flex items-center gap-3 border-b border-gray-50">
                                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                  {t("meetings.viewImages", { defaultValue: "عرض الصور" })}
                                </button>
                              )}

                              {((meeting.pdf_paths && meeting.pdf_paths.length > 0) || meeting.pdf_path) && (
                                <button onClick={(e) => { e.stopPropagation(); window.open(getFullUrl(meeting.pdf_paths && meeting.pdf_paths.length > 0 ? meeting.pdf_paths[0] : meeting.pdf_path), '_blank'); setActiveDropdown(null); }} className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold flex items-center gap-3 border-b border-gray-50">
                                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v2h6v18H3V5.5h6v-2H3c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-18c0-1.1-.9-2-2-2z" /></svg>
                                  {t("meetings.viewPdf", { defaultValue: "عرض ال pdf" })}
                                </button>
                              )}
                              
                              {(user?.role === 'admin' || user?.permissions?.includes('meetings_add') || (user?.project_permissions && Object.values(user.project_permissions).some(perms => perms?.includes('meetings_add')))) && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); openEditModal(meeting); }} className="w-full text-right px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 font-bold flex items-center gap-3 border-b border-gray-50">
                                    <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    {t("meetings.edit", { defaultValue: "تعديل" })}
                                  </button>
                                  
                                  <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); handleDelete(meeting.id); }} className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-3">
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    {t("meetings.delete", { defaultValue: "حذف" })}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalItems / itemsPerPage)}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                itemLabel={t("meetings.meetingItem", { defaultValue: "اجتماع" })}
              />
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => !isSubmitting && setShowFormModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 p-5 flex justify-between items-center z-10 rounded-t-2xl">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {selectedMeeting ? t('meetings.editMeeting', { defaultValue: 'تعديل الاجتماع' }) : t('meetings.addNewMeeting', { defaultValue: 'إضافة اجتماع جديد' })}
              </h2>
              <button onClick={() => !isSubmitting && setShowFormModal(false)} className="p-2 bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.titleLabel", { defaultValue: "اسم الاجتماع *" })}</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder={t("meetings.titlePlaceholder", { defaultValue: "مثال: اجتماع التنسيق الأسبوعي" })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.typeLabel", { defaultValue: "نوع الاجتماع *" })}</label>
                  <select name="type" required value={formData.type} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors font-bold text-gray-700 text-sm">
                    <option value="أسبوعي">{t("meetings.weekly", { defaultValue: "أسبوعي" })}</option>
                    <option value="شهري">{t("meetings.monthly", { defaultValue: "شهري" })}</option>
                    <option value="زيارة للفرع">زيارة للفرع</option>
                  </select>
                </div>
                <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.contractorLabel", { defaultValue: "المقاول" })}</label>
                    <input type="text" name="contractor" value={formData.contractor} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder={t("meetings.contractorPlaceholder", { defaultValue: "أدخل اسم المقاول" })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.consultantLabel", { defaultValue: "الاستشاري" })}</label>
                    <input type="text" name="consultant" value={formData.consultant} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder={t("meetings.consultantPlaceholder", { defaultValue: "أدخل اسم الاستشاري" })} />
                  </div>
                </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">اسم {t("meetings.projectLabel", { defaultValue: "المشروع *" })}</label>
                  <input type="text" name="project" required value={formData.project} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder="أدخل اسم المشروع" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.governorate", { defaultValue: "المحافظة التي تم فيها الاجتماع" })}</label>
                  <input type="text" name="governorate" value={formData.governorate} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" placeholder={t("meetings.governoratePlaceholder", { defaultValue: "أدخل المحافظة التي تم فيها الاجتماع" })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.dateLabel", { defaultValue: "تاريخ الاجتماع *" })}</label>
                  <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors text-sm" />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">{t("meetings.descriptionLabel", { defaultValue: "وصف الاجتماع ومحضر الجلسة" })}</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors min-h-[80px] resize-y text-sm" placeholder={t("meetings.descriptionPlaceholder", { defaultValue: "اكتب تفاصيل الاجتماع هنا..." })}></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    إرفاق الصور
                  </h3>
                  <div className="flex flex-col gap-2 flex-grow justify-center">
                    <label className="flex items-center justify-center w-full py-3 px-2 border-2 border-dashed border-blue-300 rounded-xl bg-white hover:bg-blue-50 cursor-pointer transition-colors group">
                      <div className="flex flex-col items-center gap-1 text-blue-500 group-hover:text-blue-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-sm font-bold">اختيار صور</span>
                      </div>
                      <input type="file" multiple accept="image/jpeg, image/png, image/jpg" onChange={handleImageSelect} className="hidden" />
                    </label>
                    
                    {(existingImages.length > 0 || previews.length > 0) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {existingImages.map((path, idx) => (
                          <div key={`ext-${idx}`} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 group shadow-sm">
                            <img src={getFullUrl(path)} alt="preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx, true)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                        {previews.map((src, idx) => (
                          <div key={`new-${idx}`} className="relative w-12 h-12 rounded-lg overflow-hidden border border-indigo-400 group shadow-sm">
                            <img src={src} alt="preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx, false)} className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-red-50/50 p-4 rounded-xl border border-red-100 flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    إرفاق PDF
                  </h3>
                  
                  <div className="flex flex-col gap-2 flex-grow justify-center">
                    <label className="flex items-center justify-center w-full py-3 px-2 border-2 border-dashed border-red-300 rounded-xl bg-white hover:bg-red-50 cursor-pointer transition-colors group">
                      <div className="flex flex-col items-center gap-1 text-red-500 group-hover:text-red-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        <span className="text-sm font-bold">اختيار ملفات PDF</span>
                      </div>
                      <input type="file" multiple accept="application/pdf" onChange={handlePdfSelect} className="hidden" />
                    </label>

                    {(existingPdfs.length > 0 || pdfFiles.length > 0) && (
                      <div className="flex flex-col gap-1.5 mt-2 max-h-[100px] overflow-y-auto pr-1">
                        {existingPdfs.map((path, idx) => (
                          <div key={`ext-pdf-${idx}`} className="flex items-center justify-between p-2 border border-red-200 bg-white rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="bg-red-100 p-1 rounded-md text-red-600 flex-shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v2h6v18H3V5.5h6v-2H3c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-18c0-1.1-.9-2-2-2z" /></svg>
                              </div>
                              <p className="text-[10px] font-bold text-gray-800 truncate" dir="ltr">{path.split('/').pop()}</p>
                            </div>
                            <button type="button" onClick={() => removePdf(idx, true)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        {pdfFiles.map((file, idx) => (
                          <div key={`new-pdf-${idx}`} className="flex items-center justify-between p-2 border border-indigo-200 bg-white rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <div className="bg-indigo-100 p-1 rounded-md text-indigo-600 flex-shrink-0">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v2h6v18H3V5.5h6v-2H3c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-18c0-1.1-.9-2-2-2z" /></svg>
                              </div>
                              <p className="text-[10px] font-bold text-gray-800 truncate" dir="ltr">{file.name}</p>
                            </div>
                            <button type="button" onClick={() => removePdf(idx, false)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowFormModal(false)} disabled={isSubmitting} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors disabled:opacity-50 text-sm">
                  إلغاء
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2 text-sm">
                  {isSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {t("meetings.saving", { defaultValue: "جاري الحفظ..." })}</>
                  ) : (
                    <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> {t("meetings.saveMeeting", { defaultValue: "حفظ الاجتماع" })}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={() => setShowViewModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="bg-indigo-600 p-5 flex justify-between items-center text-white">
              <h2 className="text-xl font-black flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t("meetings.meetingDetails", { defaultValue: "تفاصيل الاجتماع" })}
              </h2>
              <button onClick={() => setShowViewModal(false)} className="p-2 bg-indigo-700 hover:bg-red-500 rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="text-2xl font-black text-gray-900 mb-6">{selectedMeeting.title}</h3>
              
              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.date", { defaultValue: "تاريخ الاجتماع" })}</span>
                  <span className="text-gray-800 font-black" dir="ltr">{new Date(selectedMeeting.date).toLocaleDateString('en-GB')}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.type", { defaultValue: "نوع الاجتماع" })}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-black inline-block ${selectedMeeting.type === 'شهري' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{selectedMeeting.type === 'أسبوعي' ? t('meetings.weekly', { defaultValue: 'أسبوعي' }) : selectedMeeting.type === 'شهري' ? t('meetings.monthly', { defaultValue: 'شهري' }) : selectedMeeting.type}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.contractor", { defaultValue: "المقاول" })}</span>
                  <span className="text-gray-800 font-bold">{selectedMeeting.contractor || '-'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.consultant", { defaultValue: "الاستشاري" })}</span>
                  <span className="text-gray-800 font-bold">{selectedMeeting.consultant || '-'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <span className="block text-xs font-bold text-gray-400 mb-1">المشروع</span>
                  <span className="text-gray-800 font-bold">{selectedMeeting.project || '-'}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                  <span className="block text-xs font-bold text-gray-400 mb-1">{t("meetings.governorate", { defaultValue: "المحافظة التي تم فيها الاجتماع" })}</span>
                  <span className="text-gray-800 font-bold">{selectedMeeting.governorate || '-'}</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="block text-sm font-bold text-gray-700 mb-2">{t("meetings.meetingDescription", { defaultValue: "وصف ومحضر الاجتماع" })}</span>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 min-h-[100px] text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                  {selectedMeeting.description || <span className="text-gray-400 italic">لا يوجد وصف</span>}
                </div>
              </div>

              {selectedMeeting.images && selectedMeeting.images.length > 0 && (
                <div className="mb-6">
                  <span className="block text-sm font-bold text-gray-700 mb-2">الصور المرفقة</span>
                  <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                    {selectedMeeting.images.map((img, i) => (
                      <div key={i} className="relative flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-gray-200 cursor-pointer group snap-center shadow-sm" onClick={() => setFullscreenImage(img)}>
                        <img src={getFullUrl(img)} alt={`مرفق ${i+1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <svg className="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(selectedMeeting.pdf_paths?.length > 0 || selectedMeeting.pdf_path) && (
                <div className="mb-6">
                  <span className="block text-sm font-bold text-gray-700 mb-2">ملفات PDF</span>
                  <div className="flex flex-col gap-2">
                    {(selectedMeeting.pdf_paths || [selectedMeeting.pdf_path]).map((pdf, i) => (
                      <a key={i} href={getFullUrl(pdf)} target="_blank" rel="noopener noreferrer" className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 p-3 rounded-xl font-bold transition-colors flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16.5l4-4h-3v-9h-2v9H8l4 4zm9-13h-6v2h6v18H3V5.5h6v-2H3c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2v-18c0-1.1-.9-2-2-2z" /></svg>
                          <span dir="ltr" className="text-sm">{pdf.split('/').pop()}</span>
                        </div>
                        <span className="text-xs bg-red-200 text-red-800 px-3 py-1.5 rounded-lg shadow-sm">عرض</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* نافذة عرض الصور - تصميم محسّن */}
      {showImagesModal && selectedMeeting && selectedMeeting.images && selectedMeeting.images.length > 0 && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4" onClick={() => setShowImagesModal(false)}>
          <div className="bg-blue-50 rounded-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-600 to-blue-700 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>الوسائط (صور)</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{selectedMeeting.images.length}</span>
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={async () => {
                    toast.info(`📥 جارِ تحميل ${selectedMeeting.images.length} ملف...`);
                    for (let i = 0; i < selectedMeeting.images.length; i++) {
                      await downloadImage(selectedMeeting.images[i], i);
                      await new Promise(resolve => setTimeout(resolve, 300));
                    }
                    toast.success(`✅ تم تحميل ${selectedMeeting.images.length} ملف بنجاح`);
                  }}
                  className="flex items-center gap-1 px-2 sm:px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs sm:text-sm transition-colors font-bold"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">تحميل الكل</span>
                </button>
                <button onClick={() => setShowImagesModal(false)} className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-70px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {selectedMeeting.images.map((img, index) => (
                  <div key={index} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                    {/* الصورة مع أيقونة العين */}
                    <div 
                      className="relative aspect-square cursor-pointer group" 
                      onClick={() => setFullscreenImage(img)}
                    >
                      <img src={getFullUrl(img)} alt={`صورة ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      {/* أيقونة العين للتكبير */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    {/* معلومات الصورة */}
                    <div className="p-2 sm:p-3 bg-blue-100/50 flex items-center justify-between border-t border-blue-100">
                      <p className="text-xs sm:text-sm font-semibold text-blue-800">مرفق {index + 1}</p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadImage(img, index); }}
                        className="p-1.5 sm:p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="تحميل الصورة"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الصورة المكبرة (Fullscreen) */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4"
          onClick={() => setFullscreenImage(null)}
        >
          <img 
            src={getFullUrl(fullscreenImage)} 
            alt="صورة مكبرة" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button 
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            onClick={() => setFullscreenImage(null)}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button 
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors font-bold"
            onClick={(e) => { 
              e.stopPropagation(); 
              downloadImage(fullscreenImage, 0); 
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            تحميل
          </button>
        </div>
      )}

    </Layout>
  );
}

export default Meetings;
