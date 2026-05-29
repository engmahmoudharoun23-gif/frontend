import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

function ProjectSettings({ user, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeTab, setActiveTab] = useState('types');
  const [loading, setLoading] = useState(false);
  
  // أنواع البلاغ
  const [types, setTypes] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  
  // حالات البلاغ
  const [statuses, setStatuses] = useState([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  
  // بطاقات المشروع
  const [cards, setCards] = useState([]);
  const [showCardModal, setShowCardModal] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [editCardLabel, setEditCardLabel] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      if (activeTab === 'types') fetchTypes();
      if (activeTab === 'statuses') fetchStatuses();
      if (activeTab === 'cards') fetchCards();
    }
  }, [selectedProject, activeTab]);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      let list = res.data.map(p => p.name);
      if (user.role !== 'admin' && user.projects?.length > 0) {
        /* removed redundant filter */
      }
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0]);
    } catch (e) {
      console.error(e);
    }
  };

  // ===== أنواع البلاغ =====
  const fetchTypes = async () => {
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/report-types?project=${encodeURIComponent(selectedProject)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTypes(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error('الرجاء إدخال اسم النوع');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/report-types`, {
        name: newTypeName.trim(),
        project: selectedProject
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('تم إضافة النوع بنجاح');
      setNewTypeName('');
      setShowTypeModal(false);
      fetchTypes();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleDeleteType = async (typeId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا النوع؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/report-types/${typeId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف النوع بنجاح');
      fetchTypes();
    } catch (e) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ===== حالات البلاغ =====
  const fetchStatuses = async () => {
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/report-statuses?project=${encodeURIComponent(selectedProject)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatuses(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) {
      toast.error('الرجاء إدخال اسم الحالة');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/report-statuses`, {
        name: newStatusName.trim(),
        project: selectedProject
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('تم إضافة الحالة بنجاح');
      setNewStatusName('');
      setShowStatusModal(false);
      fetchStatuses();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الحالة؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/report-statuses/${statusId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف الحالة بنجاح');
      fetchStatuses();
    } catch (e) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  // ===== بطاقات المشروع =====
  const fetchCards = async () => {
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/project-cards/${encodeURIComponent(selectedProject)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCards(res.data.cards || []);
    } catch (e) {
      console.error(e);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCardLabel.trim()) {
      toast.error('الرجاء إدخال عنوان البطاقة');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/project-cards/${encodeURIComponent(selectedProject)}`, {
        label: newCardLabel.trim()
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('تم إضافة البطاقة بنجاح');
      setNewCardLabel('');
      setShowCardModal(false);
      fetchCards();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleUpdateCard = async () => {
    if (!editCardLabel.trim()) {
      toast.error('الرجاء إدخال العنوان');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/project-cards/${encodeURIComponent(selectedProject)}/${editingCard.id}`, {
        label: editCardLabel.trim()
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('تم تعديل البطاقة بنجاح');
      setEditingCard(null);
      setEditCardLabel('');
      fetchCards();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'حدث خطأ');
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه البطاقة؟')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/project-cards/${encodeURIComponent(selectedProject)}/${cardId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('تم حذف البطاقة بنجاح');
      fetchCards();
    } catch (e) {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const startEditCard = (card) => {
    setEditingCard(card);
    setEditCardLabel(card.label);
  };

  const shortName = (p) => p.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '');

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 max-w-4xl mx-auto">
        <h1 className="text-xl font-bold mb-4">⚙️ إعدادات المشروع</h1>

        {/* اختيار المشروع - Combobox ديناميكي */}
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium mb-2">اختر المشروع:</label>
          <select 
            value={selectedProject} 
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full p-3 border-2 border-blue-300 rounded-lg text-lg font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {projects.map(p => (
              <option key={p} value={p}>{shortName(p)}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">يتم تحميل جميع المشاريع تلقائياً</p>
        </div>

        {/* التبويبات */}
        <div className="flex gap-2 mb-4 border-b overflow-x-auto">
          <button 
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'types' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500'}`}
          >
            📂 أنواع البلاغ
          </button>
          <button 
            onClick={() => setActiveTab('statuses')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'statuses' ? 'border-b-2 border-purple-500 text-purple-600' : 'text-gray-500'}`}
          >
            📋 حالات البلاغ
          </button>
          <button 
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'cards' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            🏷️ مسميات البطاقات
          </button>
        </div>

        {/* ===== تبويب أنواع البلاغ ===== */}
        {activeTab === 'types' && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">📂 أنواع البلاغ</h2>
              <button 
                onClick={() => setShowTypeModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600"
              >
                + إضافة نوع
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
            ) : types.length === 0 ? (
              <div className="text-center py-4 text-gray-500">لا توجد أنواع مضافة</div>
            ) : (
              <div className="space-y-2">
                {types.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    <span className="font-medium">{t.name}</span>
                    <button 
                      onClick={() => handleDeleteType(t.id)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== تبويب حالات البلاغ ===== */}
        {activeTab === 'statuses' && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">📋 حالات البلاغ</h2>
              <button 
                onClick={() => setShowStatusModal(true)}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600"
              >
                + إضافة حالة
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
            ) : statuses.length === 0 ? (
              <div className="text-center py-4 text-gray-500">لا توجد حالات مضافة</div>
            ) : (
              <div className="space-y-2">
                {statuses.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    <span className="font-medium">{s.name}</span>
                    <button 
                      onClick={() => handleDeleteStatus(s.id)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      🗑️ حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== تبويب بطاقات المشروع ===== */}
        {activeTab === 'cards' && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold">🏷️ بطاقات المشروع</h2>
                <p className="text-sm text-gray-500">إدارة بطاقات لوحة التحكم لهذا المشروع</p>
              </div>
              <button 
                onClick={() => setShowCardModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600"
              >
                + إضافة بطاقة
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
            ) : cards.length === 0 ? (
              <div className="text-center py-4 text-gray-500">لا توجد بطاقات</div>
            ) : (
              <div className="space-y-2">
                {cards.map(card => (
                  <div key={card.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    {editingCard?.id === card.id ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <input
                          type="text"
                          value={editCardLabel}
                          onChange={(e) => setEditCardLabel(e.target.value)}
                          className="flex-1 p-2 border rounded"
                        />
                        <button onClick={handleUpdateCard} className="text-green-500 hover:text-green-700">✓</button>
                        <button onClick={() => setEditingCard(null)} className="text-gray-500 hover:text-gray-700">✗</button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">{card.label}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => startEditCard(card)}
                            className="text-blue-500 text-sm hover:text-blue-700"
                          >
                            ✏️ تعديل
                          </button>
                          <button 
                            onClick={() => handleDeleteCard(card.id)}
                            className="text-red-500 text-sm hover:text-red-700"
                          >
                            🗑️ حذف
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal إضافة نوع */}
        {showTypeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">إضافة نوع جديد</h3>
              <div className="mb-4">
                <label className="block text-sm mb-1">اسم النوع *</label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="مثال: أسفلت، بلاط، ترابي"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-1">المشروع</label>
                <div className="p-2 bg-green-50 rounded-lg text-green-700 font-medium">
                  {shortName(selectedProject)}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => { setShowTypeModal(false); setNewTypeName(''); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleAddType}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal إضافة حالة */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">إضافة حالة جديدة</h3>
              <div className="mb-4">
                <label className="block text-sm mb-1">اسم الحالة *</label>
                <input
                  type="text"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="مثال: قيد المعاينة"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-1">المشروع</label>
                <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                  {shortName(selectedProject)}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => { setShowStatusModal(false); setNewStatusName(''); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleAddStatus}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal إضافة بطاقة */}
        {showCardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">إضافة بطاقة جديدة</h3>
              <div className="mb-4">
                <label className="block text-sm mb-1">المشروع</label>
                <div className="p-2 bg-blue-50 rounded-lg text-blue-700 font-medium">
                  {shortName(selectedProject)}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm mb-1">عنوان البطاقة *</label>
                <input
                  type="text"
                  value={newCardLabel}
                  onChange={(e) => setNewCardLabel(e.target.value)}
                  placeholder="مثال: عدد البلاغات المعلقة"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => { setShowCardModal(false); setNewCardLabel(''); }}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleAddCard}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                >
                  إضافة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ProjectSettings;
