import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { Trash2, RotateCcw, FileText, FileSpreadsheet, User, Calendar, Clock, Inbox, Droplet, Waves, ShieldAlert, ClipboardCheck, FileBarChart2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Trash({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('water_connections'); // 'water_connections' or 'sewage_connections'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 15);

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
    fetchDeletedItems();
  }, [activeTab]);

  const fetchDeletedItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      let endpoint;
      if (activeTab === 'reports') endpoint = 'reports-trash';
      else if (activeTab === 'extracts') endpoint = 'extracts-trash';
      else if (activeTab === 'water_connections') endpoint = 'water-connections-trash';
      else if (activeTab === 'sewage_connections') endpoint = 'sewage-connections-trash';
      else if (activeTab === 'safety_report') endpoint = 'safety-reports-trash';
      else if (activeTab === 'quality_report') endpoint = 'quality-reports-trash';
      else if (activeTab === 'business_report') endpoint = 'business-reports-trash';
      
      const response = await axios.get(`${API}/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setData(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error(`Failed to fetch deleted ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    let itemLabelKey = 'trash.item';
    if (activeTab === 'reports') itemLabelKey = 'trash.report';
    else if (activeTab === 'extracts') itemLabelKey = 'trash.extract';
    else if (activeTab === 'water_connections') itemLabelKey = 'trash.waterConnectionLabel';
    else if (activeTab === 'sewage_connections') itemLabelKey = 'trash.sewageConnectionLabel';
    else if (activeTab === 'safety_report') itemLabelKey = 'trash.safety_reports';
    else if (activeTab === 'quality_report') itemLabelKey = 'trash.quality_reports';
    else if (activeTab === 'business_report') itemLabelKey = 'trash.business_reports';

    const label = t(itemLabelKey);

    if (!window.confirm(t('trash.confirmRestore', { label }))) return;
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      if (activeTab === 'reports') endpoint = `reports-trash/${id}/restore`;
      else if (activeTab === 'extracts') endpoint = `extracts-trash/${id}/restore`;
      else if (activeTab === 'water_connections') endpoint = `water-connections-trash/${id}/restore`;
      else if (activeTab === 'sewage_connections') endpoint = `sewage-connections-trash/${id}/restore`;
      else if (activeTab === 'safety_report') endpoint = `safety-reports-trash/${id}/restore`;
      else if (activeTab === 'quality_report') endpoint = `quality-reports-trash/${id}/restore`;
      else if (activeTab === 'business_report') endpoint = `business-reports-trash/${id}/restore`;

      await axios.post(`${API}/${endpoint}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert(t('trash.restoreSuccess', { label }));
      fetchDeletedItems();
    } catch (error) {
      alert(t('trash.restoreError', { label }));
    }
  };

  const handlePermanentDelete = async (id) => {
    let itemLabelKey = 'trash.item';
    if (activeTab === 'reports') itemLabelKey = 'trash.report';
    else if (activeTab === 'extracts') itemLabelKey = 'trash.extract';
    else if (activeTab === 'water_connections') itemLabelKey = 'trash.waterConnectionLabel';
    else if (activeTab === 'sewage_connections') itemLabelKey = 'trash.sewageConnectionLabel';
    else if (activeTab === 'safety_report') itemLabelKey = 'trash.safety_reports';
    else if (activeTab === 'quality_report') itemLabelKey = 'trash.quality_reports';
    else if (activeTab === 'business_report') itemLabelKey = 'trash.business_reports';

    const label = t(itemLabelKey);

    if (!window.confirm(t('trash.confirmDelete', { label }))) return;
    try {
      const token = localStorage.getItem('token');
      let endpoint;
      if (activeTab === 'reports') endpoint = `reports-trash/${id}/permanent`;
      else if (activeTab === 'extracts') endpoint = `extracts-trash/${id}/permanent`;
      else if (activeTab === 'water_connections') endpoint = `water-connections-trash/${id}/permanent`;
      else if (activeTab === 'sewage_connections') endpoint = `sewage-connections-trash/${id}/permanent`;
      else if (activeTab === 'safety_report') endpoint = `safety-reports-trash/${id}/permanent`;
      else if (activeTab === 'quality_report') endpoint = `quality-reports-trash/${id}/permanent`;
      else if (activeTab === 'business_report') endpoint = `business-reports-trash/${id}/permanent`;

      await axios.delete(`${API}/${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert(t('trash.deleteSuccess', { label }));
      fetchDeletedItems();
    } catch (error) {
      alert(t('trash.deleteError', { label }));
    }
  };

  const handleDeleteAll = async () => {
    if (activeTab !== 'reports') return; // حالياً الحذف الكل للبلاغات فقط
    if (data.length === 0) return;
    if (!window.confirm(`⚠️ سيتم حذف ${data.length} بلاغ نهائياً!\nهذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/reports-trash/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert(`✅ تم حذف ${data.length} بلاغ نهائياً`);
      fetchDeletedItems();
    } catch (error) {
      alert('❌ فشل حذف الكل');
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const paginatedData = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatDate = (d) => {
    if (!d) return '-';
    const isRtl = i18n.language.startsWith('ar');
    return new Date(d).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  const formatTime = (d) => {
    if (!d) return '';
    const isRtl = i18n.language.startsWith('ar');
    return new Date(d).toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl shadow-sm bg-red-50 text-red-600 border border-red-100">
              <Trash2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900">{t('trash.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('trash.subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center gap-2">
              <span className="text-sm font-bold text-slate-500">{t('trash.total')}: </span>
              <span className="text-xl font-black text-red-600">{data.length}</span>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="flex flex-wrap bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-fit gap-1">
          {(user.role === 'admin' || user.permissions?.includes('trash')) && (
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileText className="w-4 h-4" /> {t('trash.report')}
            </button>
          )}
          {(user.role === 'admin' || user.permissions?.includes('safety_reports') || user.permissions?.includes('trash')) && (
            <button
              onClick={() => setActiveTab('safety_report')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'safety_report' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ShieldAlert className="w-4 h-4" /> {t('trash.safety_reports')}
            </button>
          )}
          {(user.role === 'admin' || user.permissions?.includes('quality_reports') || user.permissions?.includes('trash')) && (
            <button
              onClick={() => setActiveTab('quality_report')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'quality_report' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <ClipboardCheck className="w-4 h-4" /> {t('trash.quality_reports')}
            </button>
          )}
          {(user.role === 'admin' || user.permissions?.includes('business_reports') || user.permissions?.includes('trash')) && (
            <button
              onClick={() => setActiveTab('business_report')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'business_report' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <FileBarChart2 className="w-4 h-4" /> {t('trash.business_reports')}
            </button>
          )}
          {(user.role === 'admin' || user.permissions?.includes('water_connections') || user.permissions?.includes('connections') || user.permissions?.includes('trash')) && (
            <button
              onClick={() => setActiveTab('water_connections')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'water_connections' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Droplet className="w-4 h-4" /> {t('trash.waterTab')}
            </button>
          )}
          {(user.role === 'admin' || user.permissions?.includes('sewage_connections') || user.permissions?.includes('connections') || user.permissions?.includes('trash')) && (
            <button
              onClick={() => setActiveTab('sewage_connections')}
              className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'sewage_connections' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Waves className="w-4 h-4" /> {t('trash.sewageTab')}
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">{t('trash.orderNum')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">{t('trash.project')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">{t('trash.connectionType')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">{t('trash.deletedBy')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">{t('trash.deletedAt')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-slate-600 uppercase">{t('trash.actions')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-bold"><div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div></td></tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Inbox className="w-16 h-16 text-slate-200" />
                        <p className="text-slate-400 font-bold">{t('trash.empty')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-black text-sm">
                          {activeTab === 'safety_report' || activeTab === 'quality_report' ? item.date : 
                           activeTab === 'business_report' ? item.date_from :
                           item.request_number || item.customer_name || t('trash.noNumber')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm font-bold text-slate-600">
                          {item.project?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '') || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-blue-600">
                        {activeTab === 'reports' ? t('trash.report') : 
                         activeTab === 'safety_report' ? t('trash.safety_reports') :
                         activeTab === 'quality_report' ? t('trash.quality_reports') :
                         activeTab === 'business_report' ? t('trash.business_reports') :
                         activeTab === 'water_connections' ? t('trash.waterConnection') : 
                         activeTab === 'sewage_connections' ? t('trash.sewageConnection') : 
                         t('trash.extract')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="bg-red-50 p-1.5 rounded-full text-red-500">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-700">{item.deleted_by_name || t('trash.unknown')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 text-sm font-bold text-slate-600">
                            <Calendar className="w-4 h-4 text-slate-400" /> {formatDate(item.deleted_at)}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-4 h-4" /> {formatTime(item.deleted_at)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleRestore(item.id)} 
                            className="bg-green-50 hover:bg-green-100 text-green-600 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> {t('trash.restore')}
                          </button>
                          {(user.role === 'admin' || user.username === 'Eng Mahmoud Haroun') && (
                            <button 
                              onClick={() => handlePermanentDelete(item.id)} 
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> {t('trash.permanentDelete')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Bottom */}
          {!loading && data.length > 0 && (
            <div className="bg-slate-50 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={data.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleLimitChange}
                itemsPerPageOptions={[10, 15, 25, 50, 100]}
                itemLabel={
                  activeTab === 'water_connections' ? t('trash.itemLabelWater') : t('trash.itemLabelSewage')
                }
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Trash;