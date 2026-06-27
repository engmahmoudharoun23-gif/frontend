import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { translateBrandingText } from '../utils/brandingTranslation';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;



const getLocalDateString = (d) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const today = new Date();
const currentMonthFirstDay = getLocalDateString(new Date(today.getFullYear(), today.getMonth(), 1));
const currentMonthLastDay = getLocalDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));

export default function PerformanceIndicators({ user, onLogout }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [dateFrom, setDateFrom] = useState(currentMonthFirstDay);
  const [dateTo, setDateTo] = useState(currentMonthLastDay);
  const [loading, setLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [duplicates, setDuplicates] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [governorates, setGovernorates] = useState([]);
  const [allGovsMap, setAllGovsMap] = useState({});

  // جلب المشاريع
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API}/projects`, { headers: { Authorization: `Bearer ${token}` } });
        setProjects(res.data || []);
      } catch (e) { console.error(e); }
    };
    fetchProjects();
  }, []);

  // جلب المحافظات
  useEffect(() => {
    const fetchGovs = async () => {
      try {
        const res = await axios.get(`${API}/project-governorates`);
        setAllGovsMap(res.data);
      } catch (e) {}
    };
    fetchGovs();
  }, []);

  // تحديث قائمة المحافظات الذكية عند تغيير المشروع
  useEffect(() => {
    if (selectedProject && allGovsMap[selectedProject]) {
      setGovernorates(allGovsMap[selectedProject]);
    } else {
      const all = Object.values(allGovsMap).flat();
      setGovernorates([...new Set(all)]);
    }
    // مسح المحافظة المختارة إذا لم تعد موجودة في القائمة الجديدة
    setSelectedGovernorate('');
  }, [selectedProject, allGovsMap]);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (selectedProject) params.project = selectedProject;
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await axios.get(`${API}/performance/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setSummary(res.data);
    } catch (e) {
      toast.error('فشل جلب ملخص الأداء');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, selectedGovernorate, dateFrom, dateTo]);

  const fetchDuplicates = useCallback(async () => {
    setAnalysisLoading(true);
    setDuplicates(null);
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (selectedProject) params.project = selectedProject;
      if (selectedGovernorate) params.governorate = selectedGovernorate;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await axios.get(`${API}/performance/location-duplicates`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setDuplicates(res.data);
    } catch (e) {
      toast.error('فشل تحليل المواقع المكررة');
    } finally {
      setAnalysisLoading(false);
    }
  }, [selectedProject, selectedGovernorate, dateFrom, dateTo]);

  useEffect(() => {
    fetchSummary();
    fetchDuplicates();
  }, [selectedProject, selectedGovernorate, dateFrom, dateTo, fetchSummary, fetchDuplicates]);

  const handleExportExcel = () => {
    if (!duplicates || !duplicates.duplicate_locations || duplicates.duplicate_locations.length === 0) {
      toast.info('لا توجد بيانات للتصدير');
      return;
    }
    const excelData = [];
    
    // Filter duplicates by selected project & governorate unless both are empty (allowAll)
    const allowAll = (selectedProject === '' && selectedGovernorate === '');
    const filteredLocations = duplicates.duplicate_locations.filter(group => {
      if (allowAll) return true;
      const matchesProject = !selectedProject || (group.project === selectedProject || group.reports?.some(r => r.project === selectedProject));
      const matchesGov = !selectedGovernorate || (group.governorate === selectedGovernorate);
      return matchesProject && matchesGov;
    });

    if (filteredLocations.length === 0) {
      toast.info('لا توجد بيانات مطابقة للفلاتر المحددة للتصدير');
      return;
    }

    let groupIndexCount = 1;
    filteredLocations.forEach((group) => {
      const groupName = `مجموعة تكرار ${groupIndexCount++}`;
      group.reports.forEach(report => {
        if (!allowAll) {
          if (selectedProject && report.project && report.project !== selectedProject) return;
          if (selectedGovernorate && report.governorate && report.governorate !== selectedGovernorate) return;
        }
        
        excelData.push({
          'المجموعة': groupName,
          'رقم البلاغ': report.report_number || 'غير محدد',
          'رقم الرخصة': report.license_number || 'بدون رخصة',
          'المشروع': translateBrandingText(report.project || group.project, isRtl) || 'غير محدد',
          'المحافظة': translateBrandingText(report.governorate || group.governorate, isRtl) || 'غير محدد',
          'الحي': translateBrandingText(report.neighborhood || group.neighborhood, isRtl) || 'غير محدد',
          'المقاول': translateBrandingText(report.contractor, isRtl) || 'غير محدد',
          'نوع البلاغ': translateBrandingText(report.report_type || group.report_type, isRtl) || 'غير محدد',
          'الحالة': report.status ? t(`statusMap.${report.status}`, report.status) : 'غير محدد',
          'تاريخ البلاغ': report.created_at ? new Date(report.created_at).toLocaleDateString('en-GB') : 'غير محدد',
          'إحداثية البلاغ': `${report.latitude || ''}, ${report.longitude || ''}`,
          'مركز الإحداثية للمجموعة': `${group.avg_lat?.toFixed(5) || ''}, ${group.avg_lon?.toFixed(5) || ''}`,
          'المسافة عن المركز (متر)': report.distance_from_center != null ? Math.round(report.distance_from_center) : 0
        });
      });
    });
    
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "مواقع مكررة");
    XLSX.writeFile(workbook, `تحليل_التكرار_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('تم التصدير إلى Excel بنجاح');
  };

  const handleExportPDF = async () => {
    if (!summary && (!duplicates || !duplicates.duplicate_locations || duplicates.duplicate_locations.length === 0)) {
      toast.info('لا توجد بيانات للتصدير');
      return;
    }
    try {
      const content = document.getElementById('indicators-content');
      if (!content) return;
      const canvas = await html2canvas(content, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, Math.min(pdfHeight, pdf.internal.pageSize.getHeight()));
      // If height is larger than 1 page, add new pages
      let heightLeft = pdfHeight - pdf.internal.pageSize.getHeight();
      let position = -pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
        position -= pdf.internal.pageSize.getHeight();
      }
      pdf.save(`تحليل_التكرار_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('تم التصدير إلى PDF بنجاح');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء التصدير');
    }
  };

  const StatCard = ({ icon, label, value, color, sub }) => (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      borderTop: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minWidth: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{value?.toLocaleString?.() ?? value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9ca3af' }}>{sub}</div>}
    </div>
  );

  return (
    <Layout user={user} onLogout={onLogout}>
      <div style={{ direction: isRtl ? 'rtl' : 'ltr', fontFamily: 'Segoe UI, Tahoma, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)',
          borderRadius: 20,
          padding: '28px 32px',
          marginBottom: 28,
          color: '#fff',
          boxShadow: '0 8px 32px rgba(30,64,175,0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <span style={{ fontSize: 40 }}>📊</span>
            <div>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{t('sidebar.performance_indicators', 'مؤشرات الأداء وتحليل البيانات')}</h1>
              <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 14 }}>
                {t('performance_indicators.subtitle', 'تحليل تكرار البلاغات بناءً على تطابق الموقع الجغرافي')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              📁 {t('performance_indicators.project', 'المشروع')}
            </label>
            <select
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            >
              <option value="">{t('performance_indicators.all_projects', 'جميع المشاريع')}</option>
              {projects.map(p => <option key={p.name || p.id} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              🏙️ {t('performance_indicators.governorate', 'المحافظة')}
            </label>
            <select
              value={selectedGovernorate}
              onChange={e => setSelectedGovernorate(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none' }}
            >
              <option value="">{t('performance_indicators.all_governorates', 'جميع المحافظات')}</option>
              {governorates.map(g => <option key={g} value={g}>{translateBrandingText(g, isRtl)}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              📅 {t('performance_indicators.from_date', 'من تاريخ')}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              📅 {t('performance_indicators.to_date', 'إلى تاريخ')}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={fetchDuplicates}
            disabled={analysisLoading}
            style={{
              padding: '10px 24px',
              background: analysisLoading ? '#9ca3af' : 'linear-gradient(135deg, #1e40af, #7c3aed)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: analysisLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap'
            }}
          >
            {analysisLoading ? `⏳ ${t('performance_indicators.analyzing', 'جاري التحليل...')}` : `🔍 ${t('performance_indicators.analyze_duplicates', 'تحليل التكرار')}`}
          </button>
          
          {/* أزرار التصدير */}
          <div style={{ display: 'flex', gap: 8, marginLeft: isRtl ? 0 : 'auto', marginRight: isRtl ? 'auto' : 0 }}>
            <button
              onClick={handleExportExcel}
              style={{
                padding: '10px 16px',
                background: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="تصدير إلى Excel"
            >
              📊 Excel
            </button>
            <button
              onClick={handleExportPDF}
              style={{
                padding: '10px 16px',
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              title="تصدير إلى PDF"
            >
              📄 PDF
            </button>
          </div>
        </div>

        <div id="indicators-content">
        {/* Summary Cards */}
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>⏳ {t('performance_indicators.loading', 'جاري التحميل...')}</div>
        )}
        {summary && !loading && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <StatCard icon="📋" label={t('performance_indicators.total_reports', 'إجمالي البلاغات')} value={summary.total} color="#2563eb" sub={t('performance_indicators.in_selected_range', 'في النطاق المحدد')} />
              <StatCard icon="📍" label={t('performance_indicators.reports_with_gps', 'بلاغات بموقع GPS')} value={summary.geo_total} color="#059669"
                sub={`${summary.total > 0 ? Math.round(summary.geo_total / summary.total * 100) : 0}% ${t('performance_indicators.from_total', 'من الإجمالي')}`} />
              <StatCard icon="🏙️" label={t('performance_indicators.num_governorates', 'عدد المحافظات')} value={summary.by_governorate?.length ?? 0} color="#7c3aed" sub={t('performance_indicators.active_governorate', 'محافظة نشطة')} />
              <StatCard icon="🔧" label={t('performance_indicators.report_types', 'أنواع البلاغات')} value={summary.by_type?.length ?? 0} color="#d97706" sub={t('performance_indicators.different_type', 'نوع مختلف')} />
            </div>

            {/* By Governorate (Divided by Project) */}
            {projects.length > 0 && projects
              .filter(proj => !selectedProject || proj.name === selectedProject)
              .map(proj => {
              const projGovs = allGovsMap[proj.name] || [];
              const projData = (summary.by_governorate || []).filter(g => g.project === proj.name);
              const projTotal = projData.reduce((acc, curr) => acc + curr.count, 0);

              return (
                <div key={proj.name} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🏙️ {t('performance_indicators.distribution_by_gov', 'توزيع البلاغات حسب المحافظة')} - {translateBrandingText(proj.name, isRtl)}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {projGovs.length > 0 ? projGovs.map((gov, i) => {
                      const gData = projData.find(d => d.governorate === gov);
                      const count = gData ? gData.count : 0;
                      const pct = projTotal > 0 ? Math.round(count / projTotal * 100) : 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                            <span style={{ fontWeight: 600, color: '#374151' }}>{translateBrandingText(gov, isRtl)}</span>
                            <span style={{ color: '#6b7280' }}>{count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div style={{ background: '#f1f5f9', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #2563eb, #7c3aed)', height: '100%', borderRadius: 8, transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      );
                    }) : (
                      <div style={{ color: '#6b7280', fontSize: 14 }}>{t('performance_indicators.no_gov_for_project', 'لا توجد محافظات مسجلة لهذا المشروع')}</div>
                    )}
                  </div>
                </div>
              );
            })}


          </>
        )}

        {/* Duplicates Analysis Results */}
        {analysisLoading && (
          <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>{t('performance_indicators.analyzing_locations', 'جاري تحليل المواقع...')}</div>
            <div style={{ color: '#6b7280', fontSize: 14 }}>{t('performance_indicators.comparing_coords', 'يتم مقارنة إحداثيات البلاغات للكشف عن التكرار')}</div>
          </div>
        )}

        {duplicates && !analysisLoading && (() => {
          const allowAll = (selectedProject === '' && selectedGovernorate === '');
          const filteredLocations = (duplicates.duplicate_locations || []).filter(loc => {
            if (allowAll) return true;
            const matchesProject = !selectedProject || loc.project === selectedProject || loc.reports?.some(r => r.project === selectedProject);
            const matchesGov = !selectedGovernorate || loc.governorate === selectedGovernorate;
            return matchesProject && matchesGov;
          });

          const totalUniqueLocations = filteredLocations.length;
          const totalDuplicateReports = filteredLocations.reduce((sum, loc) => sum + loc.count, 0);
          
          // Use filtered total analyzed if a filter is selected
          const totalAnalyzed = duplicates.total_analyzed || 0;
          const duplicateRatio = totalAnalyzed > 0 ? Math.round(totalDuplicateReports / totalAnalyzed * 100) : 0;

          return (
            <>
              {/* KPI Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <StatCard icon="📍" label={t('performance_indicators.valid_coords', 'بلاغات بإحداثيات صالحة')} value={totalAnalyzed} color="#2563eb" sub={t('performance_indicators.checked', 'تم فحصها')} />
                <StatCard icon="🔁" label={t('performance_indicators.duplicate_locations', 'مواقع بلاغات مكررة')} value={totalUniqueLocations} color="#dc2626" sub={t('performance_indicators.repeated_location', 'موقع متكرر')} />
                <StatCard icon="⚠️" label={t('performance_indicators.total_duplicate_reports', 'إجمالي البلاغات المكررة')} value={totalDuplicateReports} color="#d97706" sub={t('performance_indicators.report_in_duplicate_locations', 'بلاغ في مواقع مكررة')} />
                <StatCard icon="✅" label={t('performance_indicators.duplicate_ratio', 'نسبة التكرار')} 
                  value={`${duplicateRatio}%`} 
                  color="#7c3aed" sub={t('performance_indicators.from_total_with_location', 'من إجمالي البلاغات ذات الموقع')} />
              </div>

              {/* By Governorate (Divided by Project) - Duplicates */}
              {projects.length > 0 && projects
                .filter(proj => !selectedProject || proj.name === selectedProject)
                .map(proj => {
                const projGovs = allGovsMap[proj.name] || [];
                const projData = (duplicates.by_governorate || [])
                  .filter(g => g.project === proj.name)
                  .filter(g => !selectedGovernorate || g.governorate === selectedGovernorate);

                const finalGovs = projGovs.filter(gov => !selectedGovernorate || gov === selectedGovernorate);

                return (
                  <div key={proj.name} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                      🏙️ {t('performance_indicators.duplicates_by_gov', 'تكرار البلاغات حسب المحافظة')} - {translateBrandingText(proj.name, isRtl)}
                    </h3>
                    <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', border: '1px solid #e5e7eb' }}>{t('performance_indicators.governorate', 'المحافظة')}</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', border: '1px solid #e5e7eb' }}>{t('performance_indicators.neighborhood', 'الحي')}</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', border: '1px solid #e5e7eb' }}>{t('performance_indicators.table_report_location', 'موقع البلاغ')}</th>
                            <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#374151', border: '1px solid #e5e7eb' }}>{t('performance_indicators.table_total_duplicate_locations', 'إجمالي مواقع البلاغات المكررة')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {finalGovs.length > 0 ? finalGovs.map((gov, i) => {
                            const govRows = projData.filter(d => d.governorate === gov);
                            
                            if (govRows.length === 0) {
                              return (
                                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#1e293b', border: '1px solid #e5e7eb' }}>{translateBrandingText(gov, isRtl)}</td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#64748b', border: '1px solid #e5e7eb' }}>-</td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                    <span style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 700, padding: '2px 10px', borderRadius: 20, fontSize: 13 }}>0</span>
                                  </td>
                                  <td style={{ padding: '12px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                    <span style={{ background: '#f1f5f9', color: '#64748b', fontWeight: 700, padding: '2px 10px', borderRadius: 20, fontSize: 13 }}>0</span>
                                  </td>
                                </tr>
                              );
                            }
                            
                            return govRows.map((d, j) => (
                              <tr key={`${i}-${j}`} style={{ background: (i+j) % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: '#1e293b', border: '1px solid #e5e7eb' }}>
                                  {translateBrandingText(gov, isRtl)}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600, color: d.neighborhood && d.neighborhood !== 'غير محدد' ? '#1e293b' : '#64748b', border: '1px solid #e5e7eb' }}>
                                  {d.neighborhood && d.neighborhood !== 'غير محدد' ? translateBrandingText(d.neighborhood, isRtl) : '-'}
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                  <span style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontSize: 13, display: 'inline-block' }}>
                                    {d.duplicate_locations}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
                                  <span style={{ background: '#fee2e2', color: '#991b1b', fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontSize: 13, display: 'inline-block' }}>
                                    {d.duplicate_reports}
                                  </span>
                                </td>
                              </tr>
                            ));
                          }) : (
                            <tr>
                              <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>{t('performance_indicators.no_gov_for_project', 'لا توجد محافظات مسجلة لهذا المشروع')}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}

              {/* Duplicate Locations Detail */}
              {filteredLocations.length > 0 ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                    📍 {t('performance_indicators.duplicate_locations_details', 'تفاصيل المواقع المكررة')} ({filteredLocations.length} {t('performance_indicators.location', 'موقع')})
                  </h3>
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: 10, marginBottom: 20, color: '#166534', fontSize: 13, lineHeight: '1.6' }}>
                    <strong>💡 {t('performance_indicators.algorithm_explanation', 'توضيح الخوارزمية:')}</strong> {t('performance_indicators.algorithm_desc', 'تعني هذه القائمة أن هذه البلاغات متطابقة في نفس المحافظة ونفس الحي، وتقع جغرافياً ضمن نطاق متقارب جداً لا يتجاوز (5 أمتار)، مما يشير بشكل دقيق إلى تكرار الانكسار أو البلاغ في نفس النقطة والموقع عدة مرات.')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filteredLocations.map((loc, idx) => (
                      <div key={idx} style={{ border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                        <div
                          onClick={() => setExpandedGroup(expandedGroup === idx ? null : idx)}
                          style={{
                            padding: '14px 18px',
                            background: expandedGroup === idx ? '#eff6ff' : '#f8fafc',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                              <span style={{ background: '#dc2626', color: '#fff', fontWeight: 800, padding: '4px 14px', borderRadius: 20, fontSize: 14 }}>
                                🚨 {loc.count} {t('performance_indicators.times', 'مرة')}
                              </span>
                              <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 15, background: '#f1f5f9', padding: '4px 12px', borderRadius: 8 }}>
                                🏙️ {translateBrandingText(loc.governorate, isRtl)}
                              </span>
                              <span style={{ background: '#fce7f3', color: '#be185d', fontWeight: 600, padding: '4px 12px', borderRadius: 8, fontSize: 13 }}>
                                🏘️ {isRtl ? 'الحي:' : 'Neighborhood:'} {loc.neighborhood && loc.neighborhood !== 'غير محدد' ? translateBrandingText(loc.neighborhood.replace('حي ', ''), isRtl) : t('performance_indicators.without_neighborhood', 'بدون حي')}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 4 }}>
                              <span style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 600, padding: '4px 12px', borderRadius: 8, fontSize: 13 }}>
                                📋 {isRtl ? 'المشروع:' : 'Project:'} {translateBrandingText(loc.project, isRtl)}
                              </span>
                              <span style={{ background: '#ede9fe', color: '#5b21b6', fontWeight: 600, padding: '4px 12px', borderRadius: 8, fontSize: 13 }}>
                                🚧 {isRtl ? 'النوع:' : 'Type:'} {translateBrandingText(loc.report_type, isRtl)}
                              </span>
                              <span style={{ background: '#fef3c7', color: '#b45309', fontWeight: 600, padding: '4px 12px', borderRadius: 8, fontSize: 13 }}>
                                👷 {isRtl ? 'المقاول:' : 'Contractor:'} {loc.reports?.[0]?.contractor ? translateBrandingText(loc.reports[0].contractor, isRtl) : t('performance_indicators.without_contractor', 'بدون مقاول')}
                              </span>
                              <span style={{ color: '#475569', fontSize: 13, background: '#f8fafc', padding: '4px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                📍 {isRtl ? 'الموقع:' : 'Location:'} {loc.avg_lat?.toFixed(5)}, {loc.avg_lon?.toFixed(5)}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <a
                              href={`https://maps.google.com/?q=${loc.avg_lat},${loc.avg_lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ background: '#10b981', color: '#fff', padding: '4px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                            >
                              🗺️ {t('performance_indicators.maps', 'خرائط')}
                            </a>
                            <span style={{ color: '#6b7280', fontSize: 18 }}>{expandedGroup === idx ? '▲' : '▼'}</span>
                          </div>
                        </div>

                        {expandedGroup === idx && (
                          <div style={{ padding: '12px 18px', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.report_number', 'رقم البلاغ')}</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.license_number', 'رقم الرخصة')}</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.neighborhood', 'الحي')}</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.status', 'الحالة')}</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.contractor', 'المقاول')}</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.date', 'التاريخ')}</th>
                                  <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>{t('performance_indicators.action', 'الإجراء')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {loc.reports.map((r, ri) => (
                                  <tr key={ri} style={{ borderBottom: '1px solid #f1f5f9', background: ri % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2563eb' }}>
                                      <span 
                                        onClick={(e) => { e.stopPropagation(); navigate(`/reports/edit/${r.id}`); }}
                                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                        title="فتح تفاصيل البلاغ"
                                      >
                                        {r.report_number}
                                      </span>
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#374151' }}>{r.license_number}</td>
                                    <td style={{ padding: '8px 10px', color: '#374151' }}>{r.neighborhood && r.neighborhood !== 'غير محدد' ? translateBrandingText(r.neighborhood, isRtl) : '-'}</td>
                                    <td style={{ padding: '8px 10px' }}>
                                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>{translateBrandingText(r.status, isRtl)}</span>
                                    </td>
                                    <td style={{ padding: '8px 10px', color: '#374151' }}>{translateBrandingText(r.contractor, isRtl)}</td>
                                    <td style={{ padding: '8px 10px', color: '#6b7280', fontSize: 12 }}>
                                      {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-SA') : '—'}
                                    </td>
                                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/reports/edit/${r.id}`); }}
                                        style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                                      >
                                        👁️ {t('performance_indicators.view_report', 'عرض البلاغ')}
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 16, padding: 48, textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#059669', marginBottom: 8 }}>{t('performance_indicators.no_duplicates', 'لا توجد مواقع مكررة')}</div>
                  <div style={{ color: '#6b7280', fontSize: 14 }}>
                    {t('performance_indicators.no_duplicates_desc', 'لم يتم العثور على بلاغات متكررة في نفس الموقع الجغرافي ضمن الفلاتر المحددة')}
                  </div>
                </div>
              )}
            </>
          );
        })()}
        </div>
      </div>
    </Layout>
  );
}
