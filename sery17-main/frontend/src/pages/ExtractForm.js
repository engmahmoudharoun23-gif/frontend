import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { resolveImageUrl } from '../utils/imageUrl';
import { translateBrandingText } from '../utils/brandingTranslation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' }
];

function ExtractForm({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const isAdmin = user.role === 'admin';

  const [availableProjects, setAvailableProjects] = useState([]);
  const [formData, setFormData] = useState({
    project: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: 'pending'
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // جلب المشاريع من قاعدة البيانات
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects`);
        const defaultOrder = [
          'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
          'مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط',
          'مشروع إصلاح أعمال المحافظات الجنوبية - القطاع الأوسط'
        ];
        let projects = response.data.map(p => p.name);
        if (!isAdmin && user.projects?.length > 0) {
          /* removed redundant filter */
        }
        projects.sort((a, b) => {
          const iA = defaultOrder.indexOf(a), iB = defaultOrder.indexOf(b);
          if (iA !== -1 && iB !== -1) return iA - iB;
          if (iA !== -1) return -1;
          if (iB !== -1) return 1;
          return a.localeCompare(b, 'ar');
        });
        setAvailableProjects(projects);
        if (projects.length > 0 && !formData.project) {
          setFormData(prev => ({ ...prev, project: projects[0] }));
        }
      } catch (error) {
        const fallback = user.projects || [];
        setAvailableProjects(fallback);
        if (fallback.length > 0) setFormData(prev => ({ ...prev, project: fallback[0] }));
      }
    };
    fetchProjects();
  }, [isAdmin, user.projects]);

  useEffect(() => {
    if (isEditMode) {
      fetchExtract();
    }
  }, [id]);

  const fetchExtract = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/extracts/${id}`);
      const extract = response.data;
      setFormData({
        project: extract.project,
        month: extract.month,
        year: extract.year,
        status: extract.status
      });
      setExistingImages(extract.images || []);
    } catch (error) {
      console.error('Failed to fetch extract:', error);
      alert('فشل في تحميل بيانات المستخلص');
      navigate('/extracts');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEditMode && selectedFiles.length === 0) {
      alert('يرجى اختيار صور للمستخلص');
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('project', formData.project);
      formDataToSend.append('month', formData.month);
      formDataToSend.append('year', formData.year);

      if (isEditMode) {
        formDataToSend.append('status', formData.status);
      }

      selectedFiles.forEach((file) => {
        formDataToSend.append('images', file);
      });

      if (isEditMode) {
        await axios.put(`${API}/extracts/${id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('تم تحديث المستخلص بنجاح');
      } else {
        await axios.post(`${API}/extracts`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('تم إضافة المستخلص بنجاح');
      }

      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
      } else if (formData.project) {
        navigate(`/extracts?project=${encodeURIComponent(formData.project)}`);
      } else {
        navigate('/extracts');
      }
    } catch (error) {
      console.error('Failed to save extract:', error);
      const errorMessage = error.response?.data?.detail || 'فشل في حفظ المستخلص';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {isEditMode ? 'تعديل مستخلص' : 'إضافة مستخلص جديد'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* المشروع */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المشروع <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              >
                {availableProjects.map((project) => (
                  <option key={project} value={project}>
                    {translateBrandingText(project, isRtl)}
                  </option>
                ))}
              </select>
            </div>

            {/* الشهر */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الشهر <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* السنة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السنة <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                required
              >
                {Array.from({ length: 31 }, (_, i) => 2020 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* الحالة (للتعديل فقط) */}
            {isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحالة
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                >
                  <option value="pending">{translateBrandingText("تم رفع المستخلص لاعتماده", isRtl)}</option>
                  <option value="approved">{translateBrandingText("معتمد", isRtl)}</option>
                  <option value="rejected">{translateBrandingText("مرفوض", isRtl)}</option>
                </select>
              </div>
            )}

            {/* الصور الموجودة */}
            {isEditMode && existingImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الصور الموجودة ({existingImages.length})
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {existingImages.map((image, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <img
                        src={resolveImageUrl(image)}
                        alt={`صورة ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* رفع صور جديدة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditMode ? 'إضافة صور جديدة' : 'الصور'} 
                {!isEditMode && <span className="text-red-500"> *</span>}
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>اختر الصور</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="sr-only"
                        required={!isEditMode}
                      />
                    </label>
                    <p className="pr-1">أو اسحب وأفلت</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG حتى 10MB لكل صورة
                  </p>
                  <p className="text-xs text-green-600 font-semibold">
                    لا يوجد حد لعدد الصور
                  </p>
                </div>
              </div>
              {selectedFiles.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-gray-600 font-medium">
                    تم اختيار {selectedFiles.length} صورة
                  </p>
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((file, index) => (
                      <p key={index} className="text-xs text-gray-500">
                        {index + 1}. {file.name}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* الأزرار */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'جاري الحفظ...' : isEditMode ? 'حفظ التعديلات' : 'إضافة المستخلص'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/extracts');
                  }
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default ExtractForm;
