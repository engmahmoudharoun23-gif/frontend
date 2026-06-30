import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { translateBrandingText } from '../utils/brandingTranslation';
import { Search, Trash2, Calendar, Filter, Database, AlertCircle, RefreshCw, ChevronRight, ChevronLeft, Eye, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import arSA from 'date-fns/locale/ar-SA';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuditLogs = ({ user, onLogout }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Available filters data
  const [availableProjects, setAvailableProjects] = useState([]);
  const [availableGovernorates, setAvailableGovernorates] = useState([]);
  const [projectGovsMap, setProjectGovsMap] = useState({});
  
  // Filters
  const [projectFilter, setProjectFilter] = useState('الكل');
  const [govFilter, setGovFilter] = useState('الكل');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination & Selection
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Fetch projects and governorates
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [projectsRes, govsRes] = await Promise.all([
          axios.get(`${API}/projects`),
          axios.get(`${API}/project-governorates`)
        ]);
        
        const projects = Array.from(new Set(projectsRes.data.map(p => p.name)));
        setAvailableProjects(projects);
        
        setProjectGovsMap(govsRes.data);
        
        let govs = [];
        Object.values(govsRes.data).forEach(list => {
          govs = [...govs, ...list];
        });
        setAvailableGovernorates(Array.from(new Set(govs)));
        
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  // Update governorates when project filter changes
  useEffect(() => {
    if (projectFilter === 'الكل') {
      let govs = [];
      Object.values(projectGovsMap).forEach(list => {
        govs = [...govs, ...list];
      });
      setAvailableGovernorates(Array.from(new Set(govs)));
    } else {
      // Find the exact project or normalized name
      const normalizeArabicStr = (text) => text?.trim().replace(/\s+/g, ' ').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي') || '';
      const normalizedTarget = normalizeArabicStr(projectFilter);
      
      const entry = Object.entries(projectGovsMap).find(
        ([k]) => normalizeArabicStr(k) === normalizedTarget
      );
      
      setAvailableGovernorates(entry ? entry[1] : []);
    }
    setGovFilter('الكل'); // Reset gov filter when project changes
  }, [projectFilter, projectGovsMap]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API}/audit-logs`, {
        params: {
          project: projectFilter === 'الكل' || projectFilter === 'All' ? 'الكل' : projectFilter,
          governorate: govFilter === 'الكل' || govFilter === 'All' ? 'الكل' : govFilter
        }
      });
      setLogs(response.data);
    } catch (err) {
      console.error(err);
      setError(isRtl ? 'فشل في جلب السجلات. تأكد من صلاحياتك.' : 'Failed to fetch logs. Check your permissions.');
    } finally {
      setLoading(false);
    }
  }, [projectFilter, govFilter, isRtl]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleDelete = async (logId) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this log?')) return;
    try {
      await axios.delete(`${API}/audit-logs/${logId}`);
      setLogs(logs.filter(log => log.id !== logId));
      setSelectedIds(prev => prev.filter(id => id !== logId));
      toast.success(isRtl ? "تم الحذف بنجاح" : "Deleted successfully");
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setLogs(logs.filter(log => log.id !== logId));
        setSelectedIds(prev => prev.filter(id => id !== logId));
        toast.success(isRtl ? "تم الحذف بالفعل من قبل" : "Already deleted");
      } else {
        toast.error(err.response?.data?.detail || (isRtl ? 'لا تملك الصلاحية لحذف هذا السجل.' : 'You do not have permission to delete this log.'));
      }
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(currentLogs.map(log => log.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(isRtl ? `هل أنت متأكد من حذف ${selectedIds.length} سجلات دفعة واحدة؟` : `Are you sure you want to delete ${selectedIds.length} logs?`)) return;
    
    try {
      await axios.post(`${API}/audit-logs/bulk-delete`, { ids: selectedIds });
      setLogs(logs.filter(log => !selectedIds.includes(log.id)));
      setSelectedIds([]);
      toast.success(isRtl ? "تم حذف السجلات المحددة بنجاح" : "Selected logs deleted successfully");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || (isRtl ? 'فشل في حذف السجلات المحددة.' : 'Failed to delete selected logs.'));
    }
  };

  const filteredLogs = logs.filter(log => {
    let match = true;
    if (dateFilter) {
      const logDate = log.timestamp.split('T')[0];
      match = match && (logDate === dateFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const reportNum = log.report_number ? log.report_number.toLowerCase() : '';
      const licenseNum = log.license_number ? log.license_number.toLowerCase() : '';
      match = match && (reportNum.includes(q) || licenseNum.includes(q));
    }
    return match;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [projectFilter, govFilter, dateFilter, searchQuery, logs.length]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 sm:p-6 lg:p-8 w-full mx-auto space-y-6 animate-fade-in" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm">
              <Database className="w-7 h-7 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{isRtl ? 'سجل التعديلات المتقدم' : 'Advanced Audit Logs'}</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {isRtl ? 'تتبع ورصد كافة التعديلات على البلاغات بشفافية كاملة' : 'Track and monitor all report modifications with full transparency'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {selectedIds.length > 0 && (
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md shadow-red-200"
              >
                <Trash2 className="w-4 h-4" />
                {isRtl ? `حذف المحدد (${selectedIds.length})` : `Delete Selected (${selectedIds.length})`}
              </button>
            )}
            <button 
              onClick={fetchLogs}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {isRtl ? 'تحديث البيانات' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <div className={`flex items-center gap-2 text-indigo-700 font-bold w-full md:w-auto shrink-0 border-b md:border-b-0 ${isRtl ? 'md:border-l md:pl-4' : 'md:border-r md:pr-4'} border-gray-100 pb-3 md:pb-0`}>
            <Filter className="w-5 h-5" />
            {isRtl ? 'تصفية السجلات:' : 'Filter Logs:'}
          </div>
          
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 w-full">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={isRtl ? "رقم البلاغ أو الرخصة" : "Report or License No."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full ${isRtl ? 'pr-3 pl-10' : 'pl-10 pr-3'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all`}
              />
            </div>
            
            <div className="relative">
              <select 
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className={`w-full ${isRtl ? 'pl-3 pr-10' : 'pr-3 pl-10'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none outline-none transition-all`}
              >
                <option value={isRtl ? 'الكل' : 'All'}>{isRtl ? 'جميع المشاريع' : 'All Projects'}</option>
                {availableProjects.map(p => (
                  <option key={p} value={p}>{translateBrandingText(p, isRtl)}</option>
                ))}
              </select>
            </div>
            
            <div className="relative">
              <select 
                value={govFilter}
                onChange={(e) => setGovFilter(e.target.value)}
                className={`w-full ${isRtl ? 'pl-3 pr-10' : 'pr-3 pl-10'} py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none outline-none transition-all`}
              >
                <option value={isRtl ? 'الكل' : 'All'}>{isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>

                {availableGovernorates.map(g => (
                  <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>
                ))}
              </select>
            </div>

            <div className="relative flex items-center gap-2">
              <input 
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-700"
              />
              {dateFilter && (
                <button 
                  onClick={() => setDateFilter('')}
                  className="text-xs text-red-500 font-bold hover:text-red-700 p-2"
                >
                  {isRtl ? 'إلغاء' : 'Clear'}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-r-4 border-red-500 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-indigo-600">
              <RefreshCw className="w-10 h-10 animate-spin" />
              <p className="font-bold">{isRtl ? 'جاري تحميل السجلات...' : 'Loading logs...'}</p>
            </div>
          ) : (
            <>
              <div className="max-lg:overflow-x-auto w-full max-lg:pb-24">
                <table className={`w-full ${isRtl ? 'text-right' : 'text-left'} text-sm`}>
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-700 font-black">
                  <tr>
                    <th className="px-6 py-4 whitespace-nowrap w-10">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        checked={currentLogs.length > 0 && selectedIds.length === currentLogs.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'رقم البلاغ' : 'Report Number'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'رقم الرخصة' : 'License Number'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'المشروع / المحافظة' : 'Project / Gov'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'الإجراء' : 'Action'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'الحالة السابقة' : 'Old State'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'الحالة الجديدة' : 'New State'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'بواسطة' : 'By'}</th>
                    <th className="px-6 py-4 whitespace-nowrap">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-6 py-4 whitespace-nowrap text-center">{isRtl ? 'إدارة' : 'Manage'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-3">
                          <Search className="w-12 h-12 text-gray-300" />
                          <p className="text-lg font-medium">{isRtl ? 'لا توجد سجلات تعديل مطابقة للبحث' : 'No audit logs match the search'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log) => (
                      <tr key={log.id} className={`hover:bg-indigo-50/30 transition-colors ${selectedIds.includes(log.id) ? 'bg-indigo-50/50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                            checked={selectedIds.includes(log.id)}
                            onChange={() => handleSelect(log.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 font-bold tracking-wider inline-flex items-center gap-2 shadow-sm" style={{ direction: 'ltr' }}>
                            {log.report_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 font-bold tracking-wider inline-flex items-center gap-2 shadow-sm" style={{ direction: 'ltr' }}>
                            {log.license_number || <span className="text-amber-400 font-normal">{isRtl ? 'بدون رخصة' : 'No License'}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-gray-800 text-xs">{translateBrandingText(log.project, isRtl)}</span>
                            <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded w-max">{translateBrandingText(log.governorate, isRtl)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-700">{translateBrandingText(log.action, isRtl)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg border border-red-100 font-medium text-xs break-words" title={log.old_value}>
                            {log.old_value ? translateBrandingText(log.old_value, isRtl) : <span className="text-red-300 italic">{isRtl ? 'فارغ' : 'Empty'}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-100 font-medium text-xs break-words" title={log.new_value}>
                            {log.new_value ? translateBrandingText(log.new_value, isRtl) : <span className="text-emerald-300 italic">{isRtl ? 'فارغ' : 'Empty'}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs">
                              {log.modified_by_name?.charAt(0) || '👤'}
                            </div>
                            {log.modified_by_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium text-xs">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {format(new Date(log.timestamp), 'yyyy/MM/dd', isRtl ? { locale: arSA } : undefined)}
                            <span className="mx-1 text-gray-300">|</span>
                            {format(new Date(log.timestamp), 'hh:mm a', isRtl ? { locale: arSA } : undefined)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === log.id ? null : log.id)}
                            onBlur={() => setTimeout(() => setOpenDropdownId(null), 150)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {openDropdownId === log.id && (
                            <div className={`absolute ${isRtl ? 'left-4' : 'right-4'} top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60] animate-fade-in`}>
                              <Link 
                                to={`/reports/edit/${log.report_id}`}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-start"
                              >
                                <Eye className="w-4 h-4 text-indigo-500" />
                                <span className="font-semibold">{isRtl ? 'عرض البلاغ' : 'View Report'}</span>
                              </Link>
                              
                              {(user?.role === 'admin' || user?.id === log.modified_by) && (
                                <button
                                  onClick={() => handleDelete(log.id)}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-start"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="font-semibold">{isRtl ? 'حذف من السجل' : 'Delete from log'}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {filteredLogs.length > 0 && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredLogs.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                  itemLabel={isRtl ? "سجل تعديل" : "Log"}
                />
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AuditLogs;
