import React, { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { hasProjectPermission } from '../utils/permissions';
import { Droplet, Waves, Building2, ChevronLeft, ArrowRight, Settings, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BRANDING_TRANSLATIONS_EN = {
  'توصيلات المياه': 'Water Connections',
  'توصيلات الصرف الصحي': 'Sewage Connections',
  'مشروع ايصال مكة': 'Makkah Connection Project',
  'مشروع ايصال الرياض': 'Riyadh Connection Project',
  'ايصال مكة': 'Makkah Connection',
  'ايصال الرياض': 'Riyadh Connection',
  'نظام إدارة': 'Management System',
  'التوصيلات الذكية': 'Smart Connections',
  'المشروع': 'Project',
  'فتح النظام': 'Open System',
  'توصيلة': 'Connection',
  'قم بالدخول إلى أنظمة التوصيلات المتخصصة لمتابعة الإنجاز الميداني وإدارة البيانات الفنية بكل سهولة.': 'Access specialized connection systems to monitor field progress and manage technical data with ease.',
  'لوحة تحكم ذكية لإدارة طلبات المياه، مراقبة الميدان، وتوثيق التركيبات والعدادات بدقة عالية.': 'Smart dashboard for managing water requests, monitoring the field, and documenting installations and meters with high precision.',
  'نظام تقني متطور لمتابعة حصر المنهولات، قياسات الميول الفنية، وتوثيق توصيلات الصرف السكني.': 'Advanced technical system for tracking inspection chambers, technical slope measurements, and residential sewage connections.'
};

const translateBrandingText = (text, isRtl) => {
  if (isRtl || !text) return text;
  const trimmed = text.toString().trim();
  if (BRANDING_TRANSLATIONS_EN[trimmed]) return BRANDING_TRANSLATIONS_EN[trimmed];
  return trimmed;
};

function ConnectionsHub({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const projectName = searchParams.get('project') || '';
  
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ water: { total: 0 }, sewage: { total: 0 } });
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (projectName) {
          setProject({ name: projectName, id: projectName });
          const token = localStorage.getItem('token');
          const res = await axios.get(`${API}/connections-stats?project=${encodeURIComponent(projectName)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setStats(res.data);
        }
      } catch (error) {
        console.error('Error fetching hub data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, projectName]);
  
  const hasPermission = (permKey) => hasProjectPermission(user, projectName, permKey);

  const hasAnyConnectionPermission = user.role === 'admin' ? true : (
    hasProjectPermission(user, projectName, 'water_connections') ||
    hasProjectPermission(user, projectName, 'sewage_connections')
  );

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const displayName = project?.name || projectName || 'المشروع';

  if (!hasAnyConnectionPermission && user.role !== 'admin') {
    window.location.replace(`/reports?project=${encodeURIComponent(projectName)}`);
    return null;
  }

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="min-h-[calc(100vh-140px)] bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8" data-testid="connections-hub-page">
        {/* Animated Background Orbs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[15%] -right-[5%] w-[45%] h-[45%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute -bottom-[15%] -left-[5%] w-[45%] h-[45%] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-indigo-400/5 rounded-full blur-[150px]"></div>
        </div>

        <div className="w-full max-w-6xl relative z-10">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg shadow-blue-500/5 border border-blue-100/50 mb-8 transform hover:scale-105 transition-transform duration-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Project Portal v2.0</span>
            </div>
                  <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-8 tracking-tight leading-tight">
              {translateBrandingText('نظام إدارة', isRtl)} <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
                {translateBrandingText('التوصيلات الذكية', isRtl)}
              </span>
            </h1>
            
            <div className="flex flex-col items-center gap-4">
              <div className="px-6 py-2 bg-blue-50 border border-blue-100 rounded-2xl shadow-sm inline-flex items-center gap-3 group hover:bg-blue-600 transition-all duration-500 cursor-default">
                <Building2 className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                <span className="text-lg font-bold text-blue-900 group-hover:text-white transition-colors">
                  {translateBrandingText(displayName, isRtl)}
                </span>
              </div>
              <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto leading-relaxed font-medium">
                {translateBrandingText('قم بالدخول إلى أنظمة التوصيلات المتخصصة لمتابعة الإنجاز الميداني وإدارة البيانات الفنية بكل سهولة.', isRtl)}
              </p>
            </div>
          </div>

          {/* Luxury Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-14">
            {/* Water Module */}
            {(hasPermission('water_connections') || user.role === 'admin') && (
              <Link 
                to={`/water-connections?project=${encodeURIComponent(projectName)}`}
                className="group relative h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-15 transition-all duration-700"></div>
                <div className="relative h-full bg-white/90 backdrop-blur-xl rounded-[3.5rem] p-12 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] group-hover:shadow-[0_40px_80px_rgba(37,99,235,0.15)] group-hover:-translate-y-4 transition-all duration-700 flex flex-col items-center text-center overflow-hidden">
                  
                  {/* Glassmorphism Icon Container */}
                  <div className="relative w-32 h-32 mb-10">
                    <div className="absolute inset-0 bg-blue-600/10 rounded-[2.5rem] rotate-6 group-hover:rotate-12 group-hover:bg-blue-600 transition-all duration-700"></div>
                    <div className="absolute inset-0 bg-white shadow-xl rounded-[2.5rem] flex items-center justify-center border border-blue-50 group-hover:bg-blue-600 group-hover:border-blue-600 transition-all duration-700">
                      <Droplet className="w-14 h-14 text-blue-600 group-hover:text-white group-hover:scale-110 transition-all duration-700" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 mb-5 group-hover:text-blue-600 transition-colors">
                    {translateBrandingText('توصيلات المياه', isRtl)}
                  </h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold shadow-sm">
                      {stats.water?.total || 0} {translateBrandingText('توصيلة', isRtl)}
                    </span>
                  </div>
                  <p className="text-slate-500 text-lg leading-relaxed mb-10 flex-1 font-medium">
                    {translateBrandingText('لوحة تحكم ذكية لإدارة طلبات المياه، مراقبة الميدان، وتوثيق التركيبات والعدادات بدقة عالية.', isRtl)}
                  </p>

                  <div className="flex items-center gap-3 px-8 py-4 bg-blue-50 rounded-full text-blue-700 font-black text-sm group-hover:bg-blue-600 group-hover:text-white shadow-sm transition-all duration-500">
                    <span>{translateBrandingText('فتح النظام', isRtl)}</span>
                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:translate-x-[-4px] transition-transform" />
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] opacity-20 -z-10 transition-transform duration-1000 group-hover:scale-150"></div>
                </div>
              </Link>
            )}

            {/* Sewage Module */}
            {(hasPermission('sewage_connections') || user.role === 'admin') && (
              <Link 
                to={`/sewage-connections?project=${encodeURIComponent(projectName)}`}
                className="group relative h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-15 transition-all duration-700"></div>
                <div className="relative h-full bg-white/90 backdrop-blur-xl rounded-[3.5rem] p-12 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] group-hover:shadow-[0_40px_80px_rgba(16,185,129,0.15)] group-hover:-translate-y-4 transition-all duration-700 flex flex-col items-center text-center overflow-hidden">
                  
                  {/* Glassmorphism Icon Container */}
                  <div className="relative w-32 h-32 mb-10">
                    <div className="absolute inset-0 bg-emerald-600/10 rounded-[2.5rem] -rotate-6 group-hover:-rotate-12 group-hover:bg-emerald-600 transition-all duration-700"></div>
                    <div className="absolute inset-0 bg-white shadow-xl rounded-[2.5rem] flex items-center justify-center border border-emerald-50 group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all duration-700">
                       <Waves className="w-14 h-14 text-emerald-600 group-hover:text-white group-hover:scale-110 transition-all duration-700" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-slate-800 mb-5 group-hover:text-emerald-600 transition-colors">
                    {translateBrandingText('توصيلات الصرف الصحي', isRtl)}
                  </h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold shadow-sm">
                      {stats.sewage?.total || 0} {translateBrandingText('توصيلة', isRtl)}
                    </span>
                  </div>
                  <p className="text-slate-500 text-lg leading-relaxed mb-10 flex-1 font-medium">
                    {translateBrandingText('نظام تقني متطور لمتابعة حصر المنهولات، قياسات الميول الفنية، وتوثيق توصيلات الصرف السكني.', isRtl)}
                  </p>

                  <div className="flex items-center gap-3 px-8 py-4 bg-emerald-50 rounded-full text-emerald-700 font-black text-sm group-hover:bg-emerald-600 group-hover:text-white shadow-sm transition-all duration-500">
                    <span>{translateBrandingText('فتح النظام', isRtl)}</span>
                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:translate-x-[-4px] transition-transform" />
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] opacity-20 -z-10 transition-transform duration-1000 group-hover:scale-150"></div>
                </div>
              </Link>
            )}
          </div>

          {/* Project Footnote */}
          <div className="mt-20 flex flex-col items-center gap-4 opacity-40 hover:opacity-100 transition-opacity duration-500">
            <div className="h-[1px] w-32 bg-slate-200"></div>
            <p className="text-slate-500 text-sm font-bold tracking-[0.3em] uppercase">
              WFM Ecosystem • Secure Connection Hub
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default ConnectionsHub;
