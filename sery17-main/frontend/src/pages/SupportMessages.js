import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function SupportMessages({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
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
    fetchMessages();
    setCurrentPage(1);
  }, [filter]);

  const fetchMessages = async () => {
    // setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = filter ? `${API}/support/messages?status=${filter}` : `${API}/support/messages`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (messageId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API}/support/messages/${messageId}/status?status=${encodeURIComponent(newStatus)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchMessages(); // تحديث القائمة
    } catch (error) {
      alert(t('supportMessages.updateStatusError'));
    }
  };

  const deleteMessage = async (messageId) => {
    if (!window.confirm(t('supportMessages.confirmDelete'))) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/support/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchMessages(); // تحديث القائمة
    } catch (error) {
      alert(t('supportMessages.deleteError'));
    }
  };

  const formatResetMessage = (msg) => {
    const text = msg.message || '';
    const isReset = msg.type === 'password_reset' || 
                    text.includes('استعادة كلمة المرور') || 
                    text.includes('Password Reset');
                    
    if (!isReset) return msg.message;
    
    // Extract code
    let code = '';
    const codeMatch = text.match(/(?:كود التحقق|Verification Code):\s*(\d+)/i) || text.match(/:\s*(\d+)/);
    if (codeMatch) {
      code = codeMatch[1];
    } else {
      const digitMatch = text.match(/\b\d{6}\b/);
      if (digitMatch) code = digitMatch[0];
    }
    
    // Extract username
    const usernameMatch = text.match(/(?:المستخدم|User):\s*([^\n]+)/i);
    const username = usernameMatch ? usernameMatch[1].trim() : (msg.request_username || msg.username || '');
    
    // Extract name
    const nameMatch = text.match(/(?:الاسم|Name):\s*([^\n]+)/i);
    let name = nameMatch ? nameMatch[1].trim() : (msg.name || '');
    
    // Extract project
    let project = '';
    const projectMatch = text.match(/(?:المشروع|Project):\s*([^\n]+)/i);
    if (projectMatch) {
      project = projectMatch[1].trim();
      if (project === 'غير محدد') {
        project = i18n.language.startsWith('en') ? 'Not specified' : 'غير محدد';
      }
    }
    
    if (i18n.language.startsWith('en')) {
      let nameEng = name;
      if (nameEng) {
        nameEng = nameEng.replace(/^م\//, 'Eng. ').replace(/^المهندس\s+/, 'Eng. ');
      }
      
      let projectEng = project;
      if (projectEng) {
        projectEng = projectEng
          .replace(/مشروع التشوة البصري/g, "Visual Distortion Project")
          .replace(/مشروع المحافظات الغربية - القطاع الأوسط/g, "Western Governorates Project - Central Sector")
          .replace(/مشروع كشف التسربات وإصلاحها/g, "Leak Detection and Repair Project")
          .replace(/غير محدد/g, "Not specified");
      }
      
      return `Password Reset Request

User: ${username}
Name: ${nameEng}
Project: ${projectEng || 'Not specified'}

Verification Code: ${code}

⚠️ The code is valid for 10 minutes only`;
    }
    
    return `طلب استعادة كلمة المرور

المستخدم: ${username}
الاسم: ${name}
المشروع: ${project || 'غير محدد'}

كود التحقق: ${code}

⚠️ الكود صالح لمدة 10 دقائق فقط`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'جديدة': return 'bg-red-100 text-red-800';
      case 'قيد المعالجة': return 'bg-yellow-100 text-yellow-800';
      case 'تم الحل': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'جديدة': return t('supportMessages.statusNew');
      case 'قيد المعالجة': return t('supportMessages.statusInProgress');
      case 'تم الحل': return t('supportMessages.statusResolved');
      default: return status;
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">{t('supportMessages.title')}</h2>
        </div>

        {/* فلتر الحالة */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('supportMessages.filterStatus')}</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t('supportMessages.allMessages')}</option>
            <option value="جديدة">{t('supportMessages.statusNew')}</option>
            <option value="قيد المعالجة">{t('supportMessages.statusInProgress')}</option>
            <option value="تم الحل">{t('supportMessages.statusResolved')}</option>
          </select>
        </div>

        {/* Pagination at the top */}
        {!loading && messages.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(messages.length / itemsPerPage)}
              totalItems={messages.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              itemsPerPageOptions={[10, 20, 50, 100]}
              itemLabel={t('supportMessages.msgLabel')}
            />
          </div>
        )}

        {/* قائمة الرسائل */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t('supportMessages.noMessages')}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((msg) => (
              <div key={msg.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{msg.name}</h3>
                    <p className="text-sm text-gray-500">{msg.email}</p>
                    {msg.username && (
                      <p className="text-sm text-blue-600 font-medium">{t('supportMessages.userLabel')}: {msg.username}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(msg.status)}`}>
                    {getStatusLabel(msg.status)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{formatResetMessage(msg)}</p>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>{new Date(msg.created_at).toLocaleString(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-US')}</span>
                  {msg.resolved_by && (
                    <span className="text-green-600">{t('supportMessages.resolvedByLabel')}: {msg.resolved_by}</span>
                  )}
                </div>

                {/* أزرار تحديث الحالة والحذف */}
                <div className="mt-4 flex gap-2 flex-wrap">
                  {msg.status === 'جديدة' && (
                    <button
                      onClick={() => updateStatus(msg.id, 'قيد المعالجة')}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                    >
                      {t('supportMessages.startProcessing')}
                    </button>
                  )}
                  {msg.status !== 'تم الحل' && (
                    <button
                      onClick={() => updateStatus(msg.id, 'تم الحل')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                    >
                      {t('supportMessages.statusResolved')}
                    </button>
                  )}
                  {/* زر الحذف - يظهر دائماً */}
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {t('supportMessages.delete')}
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination at the bottom */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(messages.length / itemsPerPage)}
                totalItems={messages.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleLimitChange}
                itemsPerPageOptions={[10, 20, 50, 100]}
                itemLabel={t('supportMessages.msgLabel')}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SupportMessages;
