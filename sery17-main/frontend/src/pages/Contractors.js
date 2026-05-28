import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import Pagination from '../components/Pagination';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const BRANDING_TRANSLATIONS_EN = {
  // Full project names (all variants)
  'مشروع ايصال مكة': 'Makkah Connection Project',
  'مشروع إيصال مكة': 'Makkah Connection Project',
  'مشروع ايصال الرياض': 'Riyadh Connection Project',
  'مشروع إيصال الرياض': 'Riyadh Connection Project',
  'مشروع إصلاح أعمال إيصال مكة': 'Makkah Connection Repair Works Project',
  'مشروع اصلاح اعمال ايصال مكة': 'Makkah Connection Repair Works Project',
  'مشروع إصلاح أعمال إيصال مكة - القطاع الأوسط': 'Makkah Connection Repair Works - Central Sector',
  'مشروع اصلاح اعمال ايصال مكة - القطاع الاوسط': 'Makkah Connection Repair Works - Central Sector',
  'مشروع إصلاح أعمال إيصال الرياض': 'Riyadh Connection Repair Works Project',
  'مشروع اصلاح اعمال ايصال الرياض': 'Riyadh Connection Repair Works Project',
  'مشروع إصلاح أعمال إيصال الرياض - القطاع الأوسط': 'Riyadh Connection Repair Works - Central Sector',
  'مشروع اصلاح اعمال ايصال الرياض - القطاع الاوسط': 'Riyadh Connection Repair Works - Central Sector',
  // Short project names
  'ايصال مكة': 'Makkah Connection',
  'إيصال مكة': 'Makkah Connection',
  'ايصال الرياض': 'Riyadh Connection',
  'إيصال الرياض': 'Riyadh Connection',
  // Contractors
  'شركة الموسي': 'Al-Mousa Company',
  'شركة الموسى': 'Al-Mousa Company',
  'جيزة العربية': 'Giza Arabia',
  'الاداء المتوازن': 'Balanced Performance',
  'الأداء المتوازن': 'Balanced Performance',
  'م/ مدحت حسين': 'Eng. Medhat Hussein',
  'م/عبدالمنعم': 'Eng. Abdel Moneim',
  'م/ عبدالمنعم': 'Eng. Abdel Moneim',
  'ابراهيم حسين طائفي': 'Ibrahim Hussein Taifi',
  'إبراهيم حسين طائفي': 'Ibrahim Hussein Taifi',
  // People
  'سعد الدين': 'Saad El-Din',
  'شادي': 'Shadi',
  'محمود': 'Mahmoud',
  'ابراهيم': 'Ibrahim',
  'إبراهيم': 'Ibrahim',
  'حسين': 'Hussein',
  // Places
  'مكة': 'Makkah',
  'الرياض': 'Riyadh',
  'الطائف': 'Taif',
  'جدة': 'Jeddah',
  'جده': 'Jeddah',
  'القطاع الأوسط': 'Central Sector',
  'القطاع الاوسط': 'Central Sector',
};

// Aggressive normalization: unify ALL Arabic letter variants
const normalizeArabic = (text) => {
  if (!text) return "";
  return text.toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآا]/g, "ا")
    .replace(/[ةه]/g, "ه")
    .replace(/[يى]/g, "ي")
    .replace(/[ؤ]/g, "و")
    .replace(/[ئ]/g, "ي")
    .replace(/[-–—]/g, "-")
    .replace(/\s*-\s*/g, " - ");
};

const dynamicTranslationsCache = (() => {
  try {
    const saved = localStorage.getItem('wfm_dynamic_branding_cache');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
})();

const saveDynamicCache = () => {
  try {
    localStorage.setItem('wfm_dynamic_branding_cache', JSON.stringify(dynamicTranslationsCache));
  } catch (e) {
    console.error(e);
  }
};

const localWordsMap = {
  'مهندس': 'Eng.', 'المهندس': 'Eng.', 'المهندسه': 'Eng.',
  'استشاري': 'Consultant', 'الاستشاري': 'Consultant',
  'مدير': 'Manager', 'عام': 'General',
  'المشاريع': 'Projects', 'مشروع': 'Project',
  'منسق': 'Coordinator',
  'نظام': 'System', 'اداره': 'Management', 'إدارة': 'Management',
  'البلاغات': 'Reports',
  'بيت': 'House', 'الخبره': 'Expert', 'الخبرة': 'Expert',
  'شركه': 'Company', 'شركة': 'Company',
  'المياه': 'Water', 'المياة': 'Water',
  'الوطنيه': 'National', 'الوطنية': 'National',
  'للاستشارات': 'Consultancy', 'للإستشارات': 'Consultancy',
  'الهندسيه': 'Engineering', 'الهندسية': 'Engineering',
  'احمد': 'Ahmed', 'أحمد': 'Ahmed',
  'حافظ': 'Hafez', 'عبيدات': 'Obeidat',
  'محمود': 'Mahmoud',
  'على': 'Ali', 'علي': 'Ali',
  'محمد': 'Mohamed', 'خالد': 'Khaled',
  'عبد': 'Abdel', 'الرحمن': 'Rahman', 'الله': 'Allah',
  'حسن': 'Hassan', 'حسين': 'Hussein',
  'مكتب': 'Office',
  'شريك': 'Partner', 'النجاح': 'Success',
  'مراقب': 'Supervisor',
  'التشوه': 'Visual Distortion', 'التشوة': 'Visual Distortion', 'البصري': 'Visual',
  'شقراء': 'Shaqra', 'مرات': 'Marat', 'ساجر': 'Sajir',
  'الدوادمي': 'Dawadmi', 'عفيف': 'Afif',
  'القويعيه': 'Quway\'iyah', 'القويعية': 'Quway\'iyah',
  'القصب': 'Al-Qasab',
  'المزاحميه': 'Muzahmiyah', 'المزاحمية': 'Muzahmiyah',
  'ضرماء': 'Dharma',
  'مكه': 'Makkah', 'مكة': 'Makkah',
  'الطائف': 'Taif',
  'اصلاح': 'Repair', 'إصلاح': 'Repair',
  'اعمال': 'Works', 'أعمال': 'Works',
  'ايصال': 'Connection', 'إيصال': 'Connection',
  'القطاع': 'Sector',
  'الاوسط': 'Central', 'الأوسط': 'Central',
  'الرياض': 'Riyadh',
  'جده': 'Jeddah', 'جدة': 'Jeddah',
  'سعد': 'Saad', 'الدين': 'El-Din',
  'شادي': 'Shadi',
  'ابراهيم': 'Ibrahim', 'إبراهيم': 'Ibrahim',
  'طائفي': 'Taifi',
  'مدحت': 'Medhat',
  'عبدالمنعم': 'Abdel Moneim',
  'م': 'Eng.',
  'توصيله': 'Connection', 'توصيلة': 'Connection', 'توصيلات': 'Connections',
  'صرف': 'Sewage', 'صحي': 'Sanitary',
  'مياه': 'Water', 'مياة': 'Water',
};

const translateLocalSmart = (text) => {
  if (!text) return "";
  let cleaned = text.toString().replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  // Handle dash separator
  if (cleaned.includes(' - ')) {
    let parts = cleaned.split(' - ');
    let translatedParts = parts.map(part => translateLocalSmart(part.trim()));
    return translatedParts.join(' - ');
  }
  let words = cleaned.split(' ');
  let translatedWords = words.map(word => {
    if (!word || word === '-') return word;
    // Try exact match first
    if (localWordsMap[word]) return localWordsMap[word];
    // Try with ة→ه and ى→ي normalization
    const norm1 = word.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    if (localWordsMap[norm1]) return localWordsMap[norm1];
    // Try matching against normalized keys
    const normWord = normalizeArabic(word);
    const matchedKey = Object.keys(localWordsMap).find(k => normalizeArabic(k) === normWord);
    if (matchedKey) return localWordsMap[matchedKey];
    return word;
  });
  return translatedWords.join(' ');
};

const pendingTranslations = new Set();

const triggerAsyncTranslation = (text) => {
  if (!text || pendingTranslations.has(text) || dynamicTranslationsCache[text]) return;
  pendingTranslations.add(text);
  
  fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`)
    .then(res => res.json())
    .then(data => {
      let trans = data?.responseData?.translatedText || data?.matches?.[0]?.translation;
      if (trans && trans !== text) {
        trans = trans.replace(/\bEngineer\b/gi, 'Eng.').replace(/\bOffice\b/gi, 'Office');
        dynamicTranslationsCache[text] = trans;
        saveDynamicCache();
        const event = new CustomEvent('wfm_translation_updated', { detail: { text, trans } });
        window.dispatchEvent(event);
      }
    })
    .catch(err => {
      console.warn('Dynamic translation failed:', text, err);
    })
    .finally(() => {
      pendingTranslations.delete(text);
    });
};

const translateDynamicText = (text, isRtl) => {
  if (isRtl || !text) return text;
  const trimmed = text.toString().trim();
  
  // 1. Direct exact match
  if (BRANDING_TRANSLATIONS_EN[trimmed]) return BRANDING_TRANSLATIONS_EN[trimmed];
  
  // 2. Normalized match against all dictionary keys
  const normInput = normalizeArabic(trimmed);
  const matchedKey = Object.keys(BRANDING_TRANSLATIONS_EN).find(key => {
    return normalizeArabic(key) === normInput;
  });
  if (matchedKey) return BRANDING_TRANSLATIONS_EN[matchedKey];
  
  // 3. Check dynamic translations cache
  if (dynamicTranslationsCache[trimmed]) return dynamicTranslationsCache[trimmed];
  if (dynamicTranslationsCache[normInput]) return dynamicTranslationsCache[normInput];
  
  // 4. Fallback to smart local rules
  const localSmart = translateLocalSmart(trimmed);
  
  // 5. Trigger asynchronous fetch to MyMemory API to update cache in background
  triggerAsyncTranslation(trimmed);
  
  return localSmart || trimmed;
};

function Contractors({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handleTranslationUpdated = () => {
      forceUpdate(prev => prev + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdated);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdated);
  }, []);
  
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filterProject, setFilterProject] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', project: '' });
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit);
    newParams.set('page', 1);
    setSearchParams(newParams);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      fetchContractors();
      setCurrentPage(1);
    }
  }, [projects, filterProject]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      let list = res.data.map(p => p.name);
      if (user.role !== 'admin' && user.projects?.length > 0) {
        /* removed redundant filter */
      }
      setProjects(list);
      if (list.length > 0 && !formData.project) {
        setFormData(prev => ({ ...prev, project: list[0] }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchContractors = async () => {
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = filterProject 
        ? `${API}/contractors?project=${encodeURIComponent(filterProject)}`
        : `${API}/contractors?all_contractors=true`;
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setContractors(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.project) {
      toast.error(t('contractorsPage.fillAllData'));
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (editingId) {
        await axios.put(`${API}/contractors/${editingId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(t('contractorsPage.contractorEdited'));
      } else {
        await axios.post(`${API}/contractors`, formData, { headers: { Authorization: `Bearer ${token}` } });
        toast.success(t('contractorsPage.contractorAdded'));
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', project: projects[0] || '' });
      fetchContractors();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('contractorsPage.errorOccurred'));
    }
  };

  const handleEdit = (c) => {
    setEditingId(c.id);
    setFormData({ name: c.name, project: c.project });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('contractorsPage.confirmDelete'))) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/contractors/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t('contractorsPage.contractorDeleted'));
      fetchContractors();
    } catch (e) {
      toast.error(t('contractorsPage.deleteError'));
    }
  };

  const displayProjectName = (p) => {
    if (!p) return '';
    if (!isRtl) {
      // In English mode: translate the full project name
      return translateDynamicText(p, isRtl);
    }
    // In Arabic mode: shorten for display
    return p.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '');
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 max-w-4xl mx-auto" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        <div className="flex justify-between items-center mb-4 text-start">
          <h1 className="text-xl font-bold">{t('contractorsPage.title')}</h1>
          <button onClick={() => { setEditingId(null); setFormData({ name: '', project: projects[0] || '' }); setShowModal(true); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
            + {t('contractorsPage.addContractor')}
          </button>
        </div>

        {(user.role === 'admin' || (user.projects && user.projects.length > 1)) && (
          <div className="mb-6 text-start">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('contractorsPage.filterByProject')}</label>
            <select 
              value={filterProject} 
              onChange={(e) => setFilterProject(e.target.value)} 
              className="w-full p-3 border-2 border-blue-50 rounded-xl focus:border-blue-500 focus:ring-0 transition-all outline-none bg-white shadow-sm"
            >
              <option value="">{t('contractorsPage.allProjects')}</option>
              {projects.map(p => <option key={p} value={p}>{displayProjectName(p)}</option>)}
            </select>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div><span className="text-blue-600 font-medium animate-pulse">{t("common.loadingData", { defaultValue: "جاري تحميل البيانات..." })}</span></div></div>
        ) : contractors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t('contractorsPage.noContractors')}</div>
        ) : (
          <>
            <div className="grid gap-3 text-start">
              {contractors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => (
                <div key={c.id} className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-bold text-gray-800 text-lg">{translateDynamicText(c.name, isRtl)}</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                      <span className="text-sm">🏗️</span>
                      {displayProjectName(c.project)}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">{t('contractorsPage.edit')}</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">{t('contractorsPage.delete')}</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination at the bottom only */}
            {!loading && contractors.length > 0 && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" style={{ direction: 'ltr' }}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={Math.ceil(contractors.length / itemsPerPage)}
                  totalItems={contractors.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleLimitChange}
                  itemsPerPageOptions={[10, 20, 50, 100]}
                  itemLabel={isRtl ? 'مقاول' : 'Contractor'}
                />
              </div>
            )}
          </>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-start">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-bold mb-4">{editingId ? t('contractorsPage.editContractor') : t('contractorsPage.addContractor')}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm mb-1">{t('contractorsPage.contractorName')}</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-lg" placeholder={isRtl ? 'اسم المقاول' : 'Contractor Name'} />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1">{t('contractorsPage.project')}</label>
                  <select value={formData.project} onChange={(e) => setFormData({ ...formData, project: e.target.value })} className="w-full p-2 border rounded-lg">
                    {projects.map(p => <option key={p} value={p}>{displayProjectName(p)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 rounded-lg">{t('contractorsPage.cancel')}</button>
                  <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg">{editingId ? t('contractorsPage.save') : t('contractorsPage.add')}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Contractors;
