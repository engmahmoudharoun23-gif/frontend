import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

function Archive({ user, onLogout }) {
  const { i18n } = useTranslation();
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArchivedProjects();
  }, []);

  const fetchArchivedProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/archive/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setArchivedProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch archived projects:', error);
      toast.error(i18n.language === 'ar' ? 'فشل في جلب المشاريع المؤرشفة' : 'Failed to fetch archived projects');
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (e, project) => {
    e.stopPropagation(); // منع التنقل عند الضغط على زر استعادة
    const confirmMessage = i18n.language === 'ar' ? `هل أنت متأكد من استعادة المشروع "${project.name}" من الأرشيف؟` : `Are you sure you want to unarchive project "${project.name}"?`;
    if (window.confirm(confirmMessage)) {
      try {
        const token = localStorage.getItem('token');
        const projectsRes = await axios.get(`${API}/projects?archived=true`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const proj = projectsRes.data.find(p => p.name === project.name);
        if (proj) {
          await axios.post(`${API}/projects/${proj.id}/archive`, { archive: false }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success(i18n.language === 'ar' ? 'تمت استعادة المشروع بنجاح' : 'Project unarchived successfully');
          fetchArchivedProjects();
        }
      } catch (error) {
        toast.error(i18n.language === 'ar' ? 'فشل في استعادة المشروع' : 'Failed to unarchive project');
      }
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-6 max-w-7xl mx-auto min-h-screen" dir="rtl">
        <div className="bg-gradient-to-l from-orange-600 to-amber-700 rounded-2xl shadow-xl p-6 text-white mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                📦
              </div>
              <div>
                <h2 className="text-2xl font-bold">{i18n.language === 'ar' ? 'أرشيف المشاريع' : 'Projects Archive'}</h2>
                <p className="text-sm text-orange-100 mt-1">{i18n.language === 'ar' ? 'المشاريع المنتهية والبيانات التاريخية' : 'Completed projects and historical data'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-2xl">📁</span>
              <span className="font-semibold">{archivedProjects.length} {i18n.language === 'ar' ? 'مشروع مؤرشف' : 'Archived Project'}</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        ) : archivedProjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">{i18n.language === 'ar' ? 'الأرشيف فارغ' : 'Archive is empty'}</h3>
            <p className="text-gray-500">{i18n.language === 'ar' ? 'لا توجد أي مشاريع مؤرشفة حالياً.' : 'There are no archived projects currently.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedProjects.map((project, index) => (
              <div 
                key={index}
                onClick={() => navigate(`/reports?project=${encodeURIComponent(project.name)}`)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden group"
              >
                <div className="h-2 w-full bg-gradient-to-r from-orange-400 to-amber-500"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                      {project.name}
                    </h3>
                    <div className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                      {i18n.language === 'ar' ? 'مؤرشف' : 'Archived'}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-gray-600 mb-6 bg-gray-50 p-3 rounded-xl">
                    <span className="text-2xl">📊</span>
                    <div>
                      <div className="text-xs text-gray-500">{i18n.language === 'ar' ? 'إجمالي البلاغات' : 'Total Reports'}</div>
                      <div className="font-bold text-lg text-gray-800">{project.reports_count}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/reports?project=${encodeURIComponent(project.name)}`);
                      }}
                      className="flex-1 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-700 py-2 rounded-xl font-bold text-sm transition-colors text-center"
                    >
                      👁️ {i18n.language === 'ar' ? 'استعراض البلاغات' : 'View Reports'}
                    </button>
                    <button 
                      onClick={(e) => handleUnarchive(e, project)}
                      className="bg-gray-100 hover:bg-green-100 text-gray-500 hover:text-green-700 px-3 py-2 rounded-xl transition-colors"
                      title={i18n.language === 'ar' ? 'استعادة المشروع' : 'Restore Project'}
                    >
                      ♻️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Archive;
