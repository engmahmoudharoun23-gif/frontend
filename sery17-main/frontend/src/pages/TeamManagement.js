import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { useTranslation } from 'react-i18next';
import { translateBrandingText } from '../utils/brandingTranslation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { MoreVertical, Edit, Trash2, UserPlus, Users, Briefcase, Phone, Mail } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function TeamManagement({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [availableProjects, setAvailableProjects] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 5);

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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    project: '',
    profile_picture: ''
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error(isRtl ? 'حجم الصورة يجب أن لا يتجاوز 2 ميجابايت' : 'Image size must not exceed 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profile_picture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const isAdmin = user.role === 'admin';

  // جلب المشاريع من قاعدة البيانات
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API}/projects`);
        const defaultOrder = [
          'مشروع إصلاح أعمال المحافظات الغربية - القطاع الأوسط',
          'مشروع إصلاح أعمال المحافظات الشمالية - القطاع الأوسط',
          'مشروع إصلاح أعمال المحافظات الجنوبية - القطاع الأوسط'
        ];
        let projects = response.data.map(p => p.name);
        if (!isAdmin && user.projects?.length > 0) {
          /* removed redundant filter */
        }
        projects.sort((a, b) => {
          const iA = defaultOrder.indexOf(a), iB = defaultOrder.indexOf(b);
          if (iA !== -1 && iB !== -1) return iA - iB;
          if (iA !== -1) return -1;
          if (iB !== -1) return 1;
          return a.localeCompare(b, 'ar');
        });
        setAvailableProjects(projects);
        if (projects.length > 0 && !formData.project) {
          setFormData(prev => ({ ...prev, project: projects[0] }));
        }
      } catch (error) {
        const fallback = user.projects || [];
        setAvailableProjects(fallback);
        if (fallback.length > 0) setFormData(prev => ({ ...prev, project: fallback[0] }));
      }
    };
    fetchProjects();
  }, [isAdmin, user.projects]);

  useEffect(() => {
    fetchTeams();
    setCurrentPage(1); // إعادة التعيين للصفحة الأولى عند تغيير الفلتر
  }, [selectedProject]);

  const fetchTeams = async () => {
    // setLoading(true);
    try {
      const url = isAdmin && selectedProject 
        ? `${API}/team-members?project=${encodeURIComponent(selectedProject)}`
        : `${API}/team-members`;
      const response = await axios.get(url);
      setTeams(response.data);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    // setLoading(true);
    try {
      if (editingMember) {
        // تحديث عضو موجود
        await axios.put(`${API}/team-members/${editingMember.id}`, formData);
        toast.success(isRtl ? 'تم تحديث بيانات الموظف بنجاح' : 'Employee data updated successfully');
      } else {
        // إضافة عضو جديد
        await axios.post(`${API}/team-members`, formData);
        toast.success(isRtl ? 'تم إضافة الموظف بنجاح' : 'Employee added successfully');
      }
      setShowAddMember(false);
      setEditingMember(null);
      setFormData({ name: '', email: '', phone: '', position: '', profile_picture: '', project: user.projects && user.projects.length > 0 ? user.projects[0] : '' });
      fetchTeams();
    } catch (error) {
      console.error('Failed to save member:', error);
      toast.error(error.response?.data?.detail || (isRtl ? 'حدث خطأ في حفظ بيانات الموظف' : 'An error occurred while saving employee data'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone,
      position: member.position,
      project: member.project,
      profile_picture: member.profile_picture || ''
    });
    setShowAddMember(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا الموظف؟' : 'Are you sure you want to delete this employee?')) return;
    try {
      await axios.delete(`${API}/team-members/${id}`);
      toast.success(isRtl ? 'تم حذف الموظف بنجاح' : 'Employee deleted successfully');
      fetchTeams();
    } catch (error) {
      console.error('Failed to delete member:', error);
      toast.error(isRtl ? 'حدث خطأ في حذف الموظف' : 'An error occurred while deleting employee');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <span className="bg-blue-50 p-2 rounded-xl text-blue-600">👥</span>
                {t('sidebar.team')}
              </h1>
              <p className={`text-gray-500 text-sm font-medium ${isRtl ? 'mr-10' : 'ml-10'}`}>
                {isRtl ? 'إدارة مهندسي النظام ومراقبي الاستشاري' : 'Management of system engineers and consultant observers'}
              </p>
            </div>
            
            {user.can_create_subusers && (
              <button
                onClick={() => setShowAddMember(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <UserPlus className="w-5 h-5" />
                {isRtl ? 'إضافة موظف جديد' : 'Add New Employee'}
              </button>
            )}
          </div>
          
          {/* Enhanced Filter */}
          {isAdmin && (
            <div className="mt-8 bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-1 space-y-1 w-full">
                  <label className="text-xs font-bold text-gray-400 mr-2">{isRtl ? 'تصفية حسب المشروع' : 'Filter by Project'}</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full border-none rounded-xl px-4 py-2.5 text-sm bg-white shadow-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  >
                    <option value="">{isRtl ? 'جميع المشاريع' : 'All Projects'}</option>
                    {availableProjects.map(project => (
                      <option key={project} value={project}>
                        {translateBrandingText(project, isRtl)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Member Form */}
        {showAddMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-2xl font-bold mb-4">
                {editingMember 
                  ? (isRtl ? 'تعديل موظف' : 'Edit Employee') 
                  : (isRtl ? 'إضافة موظف' : 'Add Employee')}
              </h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="flex justify-center mb-4">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('profile_picture_upload').click()}>
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                      {formData.profile_picture ? (
                        <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserPlus className="w-8 h-8 text-gray-400" />
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Edit className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <input id="profile_picture_upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    <p className="text-xs text-center text-gray-500 mt-2">{isRtl ? 'صورة الموظف' : 'Employee Picture'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isRtl ? 'الاسم *' : 'Name *'}</label>
                  <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder={isRtl ? 'اسم الموظف' : 'Employee Name'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isRtl ? 'رقم الهاتف *' : 'Phone Number *'}</label>
                  <input required type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="05xxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isRtl ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="example@mail.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isRtl ? 'الوظيفة *' : 'Position *'}</label>
                  <input required type="text" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder={isRtl ? 'مهندس، مشرف، فني...' : 'Engineer, supervisor, technician...'} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{isRtl ? 'المشروع *' : 'Project *'}</label>
                  <select required value={formData.project} onChange={(e) => setFormData({...formData, project: e.target.value})} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">{isRtl ? 'اختر المشروع' : 'Select Project'}</option>
                    {availableProjects.map(project => (
                      <option key={project} value={project}>
                        {translateBrandingText(project, isRtl)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" onClick={() => setShowAddMember(false)} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isRtl ? 'حفظ' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Team Members Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'الصورة' : 'Image'}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'الاسم' : 'Name'}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'البريد الإلكتروني' : 'Email'}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'رقم الهاتف' : 'Phone'}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'الوظيفة' : 'Position'}</th>
                <th className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${isRtl ? 'text-right' : 'text-left'}`}>{isRtl ? 'المشروع' : 'Project'}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500"><div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div></td></tr>
              ) : teams.length === 0 ? (
                <tr><td colSpan="7" className="px-6 py-4 text-center text-gray-500">{isRtl ? 'لا يوجد أعضاء فريق' : 'No team members found'}</td></tr>
              ) : (
                teams.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.profile_picture ? (
                        <div className="w-10 h-10">
                          <img 
                            src={member.profile_picture} 
                            alt={member.name} 
                            className={`w-10 h-10 rounded-full object-cover border border-gray-200 cursor-zoom-in transition-all duration-300 relative z-10 hover:z-50 hover:scale-[4] hover:rounded-xl hover:shadow-2xl ${isRtl ? 'origin-right' : 'origin-left'}`}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name ? translateBrandingText(member.name, isRtl) : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.position ? translateBrandingText(member.position, isRtl) : '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{member.project ? translateBrandingText(member.project, isRtl) : '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical className="w-5 h-5 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white shadow-xl border border-gray-100 rounded-xl p-1">
                          <DropdownMenuItem 
                            onClick={() => handleEdit(member)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
                          >
                            <Edit className="w-4 h-4 text-gray-500" /> {isRtl ? 'تعديل البيانات' : 'Edit Data'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator className="my-1 bg-gray-100" />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDelete(member.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer font-medium"
                          >
                            <Trash2 className="w-4 h-4" /> {isRtl ? 'حذف الموظف' : 'Delete Employee'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination Controls - Bottom Only */}
          {!loading && teams.length > 0 && (
            <div className="bg-white border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(teams.length / itemsPerPage)}
                totalItems={teams.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleLimitChange}
                itemsPerPageOptions={[5, 10, 20, 50]}
                itemLabel={isRtl ? 'موظف' : 'Employee'}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TeamManagement;
