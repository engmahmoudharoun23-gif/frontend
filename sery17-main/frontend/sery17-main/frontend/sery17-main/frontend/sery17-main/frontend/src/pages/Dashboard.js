import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Dashboard({ user, onLogout }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ total: 0, byStatus: {}, byType: {}, byGovernorate: {} });
  const [analysis, setAnalysis] = useState(null);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedGov, setSelectedGov] = useState('');
  const [govStats, setGovStats] = useState({ total: 0, fixed: 0, fixedPending: 0 });
  const [allReports, setAllReports] = useState([]);
  
  const [governorates, setGovernorates] = useState([]);

  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const response = await axios.get(`${API}/project-governorates`);
        const allGovs = Object.values(response.data).flat();
        setGovernorates([...new Set(allGovs)].sort());
      } catch (error) {
        console.error('Failed to fetch governorates:', error);
      }
    };
    fetchGovernorates();
  }, []);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${API}/reports`);
      const reports = response.data || [];
      setAllReports(reports);
      
      const byStatus = {};
      const byType = {};
      const byGovernorate = {};
      
      reports.forEach(report => {
        byStatus[report.status] = (byStatus[report.status] || 0) + 1;
        byType[report.report_type] = (byType[report.report_type] || 0) + 1;
        byGovernorate[report.governorate] = (byGovernorate[report.governorate] || 0) + 1;
      });
      
      setStats({ total: reports.length, byStatus, byType, byGovernorate });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setStats({ total: 0, byStatus: {}, byType: {}, byGovernorate: {} });
    } finally {
      setLoading(false);
    }
  };
  
  const updateGovStats = (reports, gov) => {
    const govReports = reports.filter(r => r.governorate === gov);
    const fixed = govReports.filter(r => r.status === 'تم الإصلاح').length;
    const fixedPending = govReports.filter(r => r.status === 'تم الإصلاح-ومتبقي الأسفلت').length;
    setGovStats({ total: govReports.length, fixed, fixedPending });
  };
  
  const handleGovChange = (gov) => {
    setSelectedGov(gov);
    if (gov) {
      updateGovStats(allReports, gov);
    } else {
      setGovStats({ total: 0, fixed: 0, fixedPending: 0 });
    }
  };

  const handleAnalyze = async () => {
    setAnalyzingLoading(true);
    try {
      const response = await axios.post(`${API}/reports/analyze`);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze:', error);
      alert(t('common.error'));
    } finally {
      setAnalyzingLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="text-center py-12">
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-900">{t('reports.dashboard.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reports.dashboard.totalReports')}</p>
                <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">{t('reports.dashboard.reportsByGovernorate')}</p>
                  <select 
                    value={selectedGov} 
                    onChange={(e) => handleGovChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  >
                    <option value="">{t('reports.allGovernorates')}</option>
                    {governorates.map(gov => (
                      <option key={gov} value={gov}>{gov}</option>
                    ))}
                  </select>
                </div>
                <svg className="w-10 h-10 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              
              {selectedGov && (
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{t('reports.dashboard.totalReports')}:</span>
                    <span className="text-lg font-bold text-green-600">{govStats.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{t('reports.dashboard.completedReports')}:</span>
                    <span className="text-md font-semibold text-purple-600">{govStats.fixed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">{t('reports.dashboard.pendingReports')}:</span>
                    <span className="text-md font-semibold text-orange-600">{govStats.fixedPending}</span>
                  </div>
                </div>
              )}
              
              {!selectedGov && (
                <div className="text-center text-xs text-gray-400 pt-2">
                  {t('reports.allGovernorates')}
                </div>
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reports.dashboard.completedReports')}</p>
                <p className="text-3xl font-bold text-purple-600">{stats.byStatus['تم الإصلاح'] || 0}</p>
              </div>
              <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('reports.dashboard.pendingReports')}</p>
                <p className="text-3xl font-bold text-orange-600">{stats.byStatus['تم الإصلاح-ومتبقي الأسفلت'] || 0}</p>
              </div>
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('reports.dashboard.statistics')}</h3>
          <button onClick={handleAnalyze} disabled={analyzingLoading || stats.total === 0} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-all disabled:opacity-50">
            {analyzingLoading ? t('common.loading') : t('reports.dashboard.statistics')}
          </button>
          {analysis && <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200"><h4 className="text-lg font-bold text-gray-900 mb-2">{t('reports.dashboard.recentActivity')}:</h4><div className="whitespace-pre-wrap text-gray-800">{analysis.analysis}</div></div>}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('reports.dashboard.reportsByStatus')}</h3>
            <div className="space-y-3">{Object.entries(stats.byStatus).map(([status, count]) => <div key={status} className="flex items-center justify-between"><span className="text-gray-700">{t(`statusMap.${status}`, status)}</span><span className="text-gray-900 font-bold">{count}</span></div>)}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('reports.dashboard.reportsByType')}</h3>
            <div className="space-y-3">{Object.entries(stats.byType).map(([type, count]) => <div key={type} className="flex items-center justify-between"><span className="text-gray-700">{t(`statusMap.${type}`, type)}</span><span className="text-gray-900 font-bold">{count}</span></div>)}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Dashboard;

