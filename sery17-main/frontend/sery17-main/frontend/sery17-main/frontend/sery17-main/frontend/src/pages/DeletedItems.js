import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const API = BACKEND_URL + '/api';
console.log('Trash Bin API URL:', API);

function DeletedItems({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');
  const [selectedItems, setSelectedItems] = useState([]); // format: "type-id"
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => { fetchItems(1); }, []);

  const fetchItems = async (p = 1, f = filter, limit = perPage) => {
    try {
      // setLoading(true);
      const res = await axios.get(`${API}/deleted-items?page=${p}&item_type=${f}&limit=${limit}`, authHeaders);
      setItems(res.data?.items || []);
      setPages(res.data?.pages || 1);
      setPage(res.data?.page || 1);
      setTotal(res.data?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePerPageChange = (e) => {
    const newLimit = parseInt(e.target.value);
    setPerPage(newLimit);
    fetchItems(1, filter, newLimit);
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setSelectedItems([]);
    fetchItems(1, newFilter);
  };

  const handleRestore = async (type, id) => {
    console.log('handleRestore triggered with:', type, id);
    try {
      const url = `${API}/deleted-items/${type}/${id}/restore`;
      console.log('Sending Restore POST to:', url);
      const res = await axios.post(url, {}, authHeaders);
      console.log('Restore response:', res.data);
      toast.success(t('deletedItems.toastRestoreSuccess'));
      fetchItems(page);
    } catch (e) { 
      console.error('Restore error:', e);
      toast.error(e.response?.data?.detail || t('deletedItems.toastRestoreError')); 
    }
  };

  const handlePermanentDelete = async (type, id) => {
    console.log('handlePermanentDelete triggered with:', type, id);
    try {
      const url = `${API}/deleted-items/${type}/${id}/permanent`;
      console.log('Sending Permanent Delete DELETE to:', url);
      const res = await axios.delete(url, authHeaders);
      console.log('Delete response:', res.data);
      toast.success(t('deletedItems.toastDeleteSuccess'));
      fetchItems(page);
    } catch (e) { 
      console.error('Delete error:', e);
      toast.error(e.response?.data?.detail || t('deletedItems.toastDeleteError')); 
    }
  };

  const handleBulkDelete = async () => {
    console.log('handleBulkDelete triggered with selectedItems:', selectedItems);
    if (selectedItems.length === 0) return;
    try {
      const itemsToDelete = selectedItems.map(key => {
        const dashIndex = key.indexOf('-');
        const type = key.substring(0, dashIndex);
        const id = key.substring(dashIndex + 1);
        return { type, id };
      });
      console.log('Bulk delete items:', itemsToDelete);

      const res = await axios.post(`${API}/deleted-items/bulk-permanent-delete`, { items: itemsToDelete }, authHeaders);
      console.log('Bulk delete response:', res.data);
      toast.success(t('deletedItems.toastBulkDeleteSuccess', { count: selectedItems.length }));
      setSelectedItems([]);
      fetchItems(page);
    } catch (e) { 
      console.error('Bulk delete error:', e);
      toast.error(t('deletedItems.toastBulkDeleteError')); 
    }
  };

  const toggleItem = (type, id) => {
    const key = `${type}-${id}`;
    setSelectedItems(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const toggleSelectAll = () => {
    if (items.length > 0 && selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => `${i.type}-${i.data.id}`));
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 sm:p-6" data-testid="deleted-items-page">
        {/* Header Section */}
        <div className="rounded-3xl p-8 mb-8 text-white shadow-2xl overflow-hidden relative animate-in fade-in slide-in-from-top-4 duration-700" style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' }}>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-right">
              <h1 className="text-3xl md:text-4xl font-black flex items-center justify-center md:justify-start gap-4 mb-3">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md shadow-inner">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                {t('deletedItems.title')}
              </h1>
              <p className="text-white/80 text-lg font-medium max-w-lg">{t('deletedItems.subtitle')}</p>
            </div>

          </div>
        </div>

        {/* Filters & Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-50 bg-gray-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: '', label: t('deletedItems.filterAll'), icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
                  { key: 'report', label: t('deletedItems.filterReports'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { key: 'safety_report', label: t('deletedItems.filterSafetyReports'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { key: 'quality_report', label: t('deletedItems.filterQualityReports'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { key: 'business_report', label: t('deletedItems.filterBusinessReports'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { key: 'invoice', label: t('deletedItems.filterInvoices'), icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
                  { key: 'employee_request', label: t('deletedItems.filterRequests'), icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
                  { key: 'extract', label: t('deletedItems.filterExtracts'), icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
                  { key: 'water_connection', label: t('deletedItems.filterWater'), icon: 'M12 21.5c-4.14 0-7.5-3.36-7.5-7.5 0-3.9 3.86-8.91 6.84-12.28.36-.41.96-.41 1.32 0C15.64 5.09 19.5 10.1 19.5 14c0 4.14-3.36 7.5-7.5 7.5z' },
                  { key: 'sewage_connection', label: t('deletedItems.filterSewage'), icon: 'M2 10c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3M2 17c3 0 3-3 6-3s3 3 6 3 3-3 6-3 3 3 6 3' }
                ].map(f => (
                  <button 
                    key={f.key}
                    onClick={() => handleFilterChange(f.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-black transition-all ${
                      filter === f.key 
                        ? 'text-white shadow-lg scale-105' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100'
                    }`}
                    style={filter === f.key ? { backgroundColor: 'var(--color-primary)', shadowColor: 'var(--color-accent)' } : {}}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-500">{t('deletedItems.show')}</span>
                <select 
                  value={perPage} 
                  onChange={handlePerPageChange}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                  style={{ '--tw-ring-color': 'var(--color-primary)' }}
                >
                  <option value={10}>{t('deletedItems.items10')}</option>
                  <option value={20}>{t('deletedItems.items20')}</option>
                  <option value={50}>{t('deletedItems.items50')}</option>
                  <option value={100}>{t('deletedItems.items100')}</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <input 
                  type="checkbox" 
                  checked={items.length > 0 && selectedItems.length === items.length} 
                  onChange={toggleSelectAll} 
                  className="w-5 h-5 rounded border-slate-300 transition-all cursor-pointer"
                  style={{ color: 'var(--color-primary)' }} 
                />
                <span className="text-sm font-bold text-gray-700">{t('deletedItems.selectAll')}</span>
              </div>
              
              {selectedItems.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-sm font-black hover:bg-red-600 hover:text-white flex items-center gap-2 transition-all border border-red-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  {t('deletedItems.deleteSelected', { count: selectedItems.length })}
                </button>
              )}
            </div>
            
            {pages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => fetchItems(1)}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30"
                  title={t('deletedItems.firstPage')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => fetchItems(page - 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  {t('deletedItems.previous')}
                </button>
                <span className="px-4 text-sm font-black" style={{ color: 'var(--color-primary)' }}>
                  {page} / {pages}
                </span>
                <button
                  disabled={page === pages}
                  onClick={() => fetchItems(page + 1)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  {t('deletedItems.next')}
                </button>
                <button
                  disabled={page === pages}
                  onClick={() => fetchItems(pages)}
                  className="p-2 rounded-lg hover:bg-slate-50 text-slate-500 disabled:opacity-30"
                  title={t('deletedItems.lastPage')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>

          <div className="p-0">
            {/* Top Pagination */}
            {pages > 1 && (
              <div className="bg-gray-50/30 border-b border-gray-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm font-bold text-slate-500">
                  {t('deletedItems.pageOf', { page, pages })}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1 || loading}
                    onClick={() => fetchItems(page - 1)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <button
                    disabled={page === pages || loading}
                    onClick={() => fetchItems(page + 1)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-slate-100 rounded-full animate-spin mb-4" style={{ borderTopColor: 'var(--color-primary)' }}></div>
                <p className="text-slate-400 font-black">{t('deletedItems.refreshing')}</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <div className="bg-gray-50 p-6 rounded-full mb-4">
                  <svg className="w-20 h-20 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <p className="text-xl font-bold text-gray-300 italic">{t('deletedItems.empty')}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div 
                    key={`${item.type}-${item.data.id}`}
                    className={`group flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 hover:bg-slate-50/50 transition-all duration-300 border-r-4 border-transparent hover:border-primary animate-in fade-in slide-in-from-right duration-500`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start gap-6 flex-1 w-full">
                      <div className="pt-1">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(`${item.type}-${item.data.id}`)} 
                          onChange={() => toggleItem(item.type, item.data.id)} 
                          className="w-6 h-6 rounded-lg border-slate-300 transition-all cursor-pointer shadow-sm"
                          style={{ color: 'var(--color-primary)' }} 
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            item.type === 'report' ? 'bg-blue-100 text-blue-700' :
                            item.type === 'invoice' ? 'bg-emerald-100 text-emerald-700' :
                            item.type === 'extract' ? 'bg-amber-100 text-amber-700' :
                            item.type === 'water_connection' ? 'bg-sky-100 text-sky-700' :
                            item.type === 'sewage_connection' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {item.type === 'report' ? t('deletedItems.filterReports') :
                             item.type === 'invoice' ? t('deletedItems.filterInvoices') :
                             item.type === 'extract' ? t('deletedItems.filterExtracts') :
                             item.type === 'water_connection' ? t('deletedItems.filterWater') :
                             item.type === 'sewage_connection' ? t('deletedItems.filterSewage') :
                             item.type === 'safety_report' ? t('deletedItems.filterSafetyReports') :
                             item.type === 'quality_report' ? t('deletedItems.filterQualityReports') :
                             item.type === 'business_report' ? t('deletedItems.filterBusinessReports') :
                             item.type === 'employee_request' ? t('deletedItems.filterRequests') :
                             item.type_label}
                          </span>
                          <span className="text-xs font-black text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl">{item.data.project || t('deletedItems.general')}</span>
                          {(item.data.report_number || item.data.request_number) && (
                            <span className="text-xs font-black px-3 py-1.5 rounded-xl border-2 animate-pulse" style={{ color: 'var(--color-primary)', backgroundColor: 'var(--color-bg-light)', borderColor: 'var(--color-accent)' }}>
                              #{item.data.report_number || item.data.request_number}
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-800 mb-2 leading-relaxed group-hover:text-blue-600 transition-colors" style={{ '--color-primary': 'var(--color-primary)' }}>
                          {item.type === 'extract' ? t('deletedItems.extractLabel', { number: item.data.extract_number || '', amount: item.data.amount?.toLocaleString() || 0 }) : 
                           item.type === 'water_connection' ? t('deletedItems.waterLabel', { name: item.data.customer_name || '', number: item.data.request_number || '' }) :
                           item.type === 'sewage_connection' ? t('deletedItems.sewageLabel', { name: item.data.customer_name || '', number: item.data.request_number || '' }) :
                           (item.data.description || item.data.request_type || item.data.report_number || item.data.reason || item.data.file_name || item.data.notes || t('deletedItems.untitled'))}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                          <div className="flex items-center gap-2 text-sm text-slate-400 font-bold">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            {item.data.deleted_at ? new Date(item.data.deleted_at).toLocaleDateString(i18n.language.startsWith('ar') ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : t('deletedItems.unknownDate')}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-black px-3 py-1 rounded-xl shadow-inner" style={{ backgroundColor: 'var(--color-bg-light)', color: 'var(--color-primary)' }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {t('deletedItems.by')}: {item.data.deleted_by_name || t('deletedItems.system')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 sm:mt-0 w-full sm:w-auto self-end sm:self-center">
                      <button 
                        onClick={() => handleRestore(item.type, item.data.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-2xl text-base font-black transition-all hover:shadow-lg hover:shadow-emerald-200 active:scale-95"
                        title={t('deletedItems.restore')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {t('deletedItems.restore')}
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(item.type, item.data.id)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl text-base font-black transition-all hover:shadow-lg hover:shadow-red-200 active:scale-95"
                        title={t('deletedItems.permanentDelete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        {t('deletedItems.permanentDelete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Final Improved Pagination */}
          <div className="bg-slate-50/80 border-t border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm font-bold text-slate-500">
              {t('deletedItems.totalItems')}: <span style={{ color: 'var(--color-primary)' }}>{total}</span> | 
              {t('deletedItems.pageOf', { page, pages })}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1 || loading}
                onClick={() => fetchItems(1)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:shadow-md transition-all disabled:opacity-30"
                title={t('deletedItems.firstPage')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
              </button>
              
              <button
                disabled={page === 1 || loading}
                onClick={() => fetchItems(page - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-700 hover:shadow-md transition-all disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                {t('deletedItems.previous')}
              </button>

              <div className="hidden sm:flex items-center gap-1.5">
                {[...Array(pages)].map((_, i) => {
                  const p = i + 1;
                  if (pages > 7 && Math.abs(p - page) > 1 && p !== 1 && p !== pages) {
                    if (p === 2 || p === pages - 1) return <span key={p} className="w-4 text-center text-slate-300">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => fetchItems(p)}
                      className={`w-10 h-10 rounded-xl text-sm font-black transition-all ${
                        page === p 
                          ? 'text-white shadow-xl scale-110' 
                          : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
                      }`}
                      style={page === p ? { backgroundColor: 'var(--color-primary)' } : {}}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === pages || loading}
                onClick={() => fetchItems(page + 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-black text-slate-700 hover:shadow-md transition-all disabled:opacity-30"
              >
                {t('deletedItems.next')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <button
                disabled={page === pages || loading}
                onClick={() => fetchItems(pages)}
                className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:shadow-md transition-all disabled:opacity-30"
                title={t('deletedItems.lastPage')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DeletedItems;
