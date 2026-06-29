import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { translateBrandingText } from '../utils/brandingTranslation';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { PROJECT_GOVERNORATES as BASE_PROJECT_GOVERNORATES, getGovernoratesByProjects } from '../utils/projectGovernoratesMap';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { MoreVertical, Edit, Shield, Power, Trash2, CheckCircle, XCircle, User, UserCircle, Briefcase, Folder, MapPin, Activity, Settings, Lock, Unlock, Eye } from "lucide-react";
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function Users({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const getCached = (key, fallback) => {
    try { const c = localStorage.getItem(key); if (c) return JSON.parse(c); } catch (e) {}
    return fallback;
  };
  const [users, setUsers] = useState(() => getCached('cache_Users.js_users', []));
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);

  // حالة التحكم بإظهار/إخفاء مستخدمي المستوى الثالث بصورة هرمية تحت المستوى الثاني
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (userId) => {
    setExpandedRows(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage);
    setSearchParams(newParams);
    setCurrentPage(newPage);
  };

  const handleUserLimitChange = (newLimit) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', newLimit);
    newParams.set('page', 1);
    setSearchParams(newParams);
    setItemsPerPage(newLimit);
    setCurrentPage(1);
  };
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ username: '', full_name: '', title: '', password: '', role: 'user' });
  const [selectedGovernorates, setSelectedGovernorates] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  
  // الصلاحيات
  const [allPermissions, setAllPermissions] = useState(() => getCached('cache_Users.js_perms_v2', []));
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [editSelectedPermissions, setEditSelectedPermissions] = useState([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState(null);
  const [savingPermissions, setSavingPermissions] = useState(false);
  
  // إدارة المشاريع - جلب من قاعدة البيانات
  const [availableProjects, setAvailableProjects] = useState(() => getCached('cache_Users.js_projects', []));
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');
  
  // إدارة المحافظات الديناميكية
  const [projectGovernorates, setProjectGovernorates] = useState(() => getCached('cache_Users.js_govs', BASE_PROJECT_GOVERNORATES));
  const [showGovernorateManager, setShowGovernorateManager] = useState(false);
  const [newGovernorateName, setNewGovernorateName] = useState('');
  const [selectedProjectForGov, setSelectedProjectForGov] = useState('');
  const [editingGovernorate, setEditingGovernorate] = useState(null);
  const [editingGovernorateName, setEditingGovernorateName] = useState('');
  
  // محافظات التعديل للمستخدم
  const [editSelectedGovernorates, setEditSelectedGovernorates] = useState([]);
  const [editSelectedProjects, setEditSelectedProjects] = useState([]);
  
  // إدارة حالات وأنواع البلاغ (Inline Project Settings)
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [selectedProjectSettings, setSelectedProjectSettings] = useState('');
  const [settingsTab, setSettingsTab] = useState('types');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [reportTypes, setReportTypes] = useState([]);
  const [reportStatuses, setReportStatuses] = useState([]);
  const [projectCards, setProjectCards] = useState([]);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [editCardLabel, setEditCardLabel] = useState('');
  
  // صلاحيات التوصيلات لكل مشروع (legacy - للتوافق)
  const [editConnectionPermissions, setEditConnectionPermissions] = useState({});
  
  // صلاحيات لكل مشروع على حدة (الميزة الجديدة)
  const [editProjectPermissions, setEditProjectPermissions] = useState({});
  
  // قائمة الصلاحيات المرتبطة بمشروع
  const PROJECT_SCOPED = [
    'support_messages', 'trash', 'settings', 'dashboard', 'performance_indicators', 'reports_view', 'reports_add', 'reports_edit', 'reports_delete',
    'reports_review', 'reports_import', 'reports_notifications', 'consultant_notes', 'report_notes', 'owner_notes', 'ai_image_audit',
    'water_connections', 'water_connections_import',
    'sewage_connections', 'sewage_connections_import',
    'invoices', 'review_invoices', 'review_invoices_3', 'view_all_invoices',
    'extracts', 'view_extracts_all',
    'employee_requests', 'review_employee_requests', 'view_all_employee_requests',
    'contractors', 'projects', 'users_manage', 'team', 'project_settings',
    'cars', 'cars_manage', 'fleet_maintenance', 'hr_management',
    'safety_reports', 'quality_reports', 'business_reports', 'safety_reports_edit', 'safety_reports_delete', 'quality_reports_edit', 'quality_reports_delete', 'business_reports_edit', 'business_reports_delete', 'business_reports_review', 'consultant_close',
    'work_permits', 'work_permits_edit', 'work_permits_delete', 'violations', 'meetings', 'meetings_add', 'wfm_matching', 'update_reports', 'audit_logs'
  ];
  
  // دالة توحيد النص العربي للمقارنة (تعالج اختلافات الهمزات والتاء المربوطة)
  const normalizeArabicStr = (text) => {
    if (!text) return '';
    return text.trim()
      .replace(/\s+/g, ' ')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
  };

  // جلب محافظات مشروع مع دعم التطابق المُعادَل (لتجنب مشاكل الأحرف العربية)
  const getGovernoratesForProject = (projectName) => {
    if (!projectName) return [];
    // تطابق مباشر أولاً
    if (projectGovernorates[projectName]) return projectGovernorates[projectName];
    // تطابق مُعادَل كحل احتياطي
    const normalizedTarget = normalizeArabicStr(projectName);
    const entry = Object.entries(projectGovernorates).find(
      ([k]) => normalizeArabicStr(k) === normalizedTarget
    );
    return entry ? entry[1] : [];
  };

  // المحافظات المتاحة حسب المشاريع المحددة (مع مراعاة صلاحيات المدير)
  const getAvailableGovernorates = (projects) => {
    let govs = [];
    
    if (!projects || projects.length === 0) {
      // إذا لم يتم اختيار مشروع، نأخذ كل المحافظات المتاحة للمدير
      govs = Object.values(projectGovernorates).flat();
    } else {
      projects.forEach(project => {
        const projGovs = getGovernoratesForProject(project);
        govs.push(...projGovs);
      });
    }

    // ⚡ الحل الجذري: إذا لم يكن أدمن، نفلتر النتائج لتشمل فقط المحافظات الممنوحة له من المستوى الأول
    if (user.role !== 'admin') {
      const myGovs = user.governorates || [];
      return [...new Set(govs.filter(g => myGovs.includes(g)))];
    }

    return [...new Set(govs)];
  };
  
  const availableGovernorates = getAvailableGovernorates(selectedProjects);
  const editAvailableGovernorates = getAvailableGovernorates(editSelectedProjects);

  // دالة لبناء الهيكل الهرمي للمستخدمين (المستوى الأول -> المستوى الثاني -> المستوى الثالث)
  const buildHierarchy = (flatUsers) => {
    if (user.role !== 'admin') {
      // للمدراء من المستوى 2: يظهر فقط المستخدمون الفرعيون للمستوى 3
      return flatUsers.map(u => ({ ...u, level: 3, children: [] }));
    }
    
    // للأدمن (المستوى الأول)
    const admin = flatUsers.find(u => u.role === 'admin');
    
    // المستوى 2: المستخدمون الذين تم إنشاؤهم بواسطة الأدمن (أو لا يوجد لهم منشئ أو منشئهم غير موجود في القائمة، أو منشئهم هو الأدمن)
    const level2 = flatUsers.filter(u => 
      u.role !== 'admin' && 
      (!u.created_by || u.created_by === admin?.id || !flatUsers.some(x => x.id === u.created_by && x.role !== 'admin'))
    );
    
    const hierarchy = [];
    if (admin) {
      hierarchy.push({ ...admin, level: 1, children: [] });
    }
    
    level2.forEach(l2 => {
      const children = flatUsers.filter(u => u.created_by === l2.id);
      hierarchy.push({
        ...l2,
        level: 2,
        children: children.map(c => ({ ...c, level: 3 }))
      });
    });
    
    return hierarchy;
  };

  // دالة لرسم صف مستخدم واحد في الجدول مع دعم التنسيق الهرمي المتميز
  const renderUserRow = (u, isChild = false, parentName = '') => {
    const hasChildren = u.level === 2 && u.children && u.children.length > 0;
    const isExpanded = expandedRows[u.id];

    return (
      <tr key={u.id} className={`${isChild ? 'bg-slate-50/70 hover:bg-slate-100/90 border-r-4 border-blue-500' : u.role === 'admin' ? 'bg-purple-50/20 hover:bg-purple-50/40' : hasChildren ? 'bg-indigo-50/5 hover:bg-indigo-50/15' : 'hover:bg-gray-50'} transition-colors`}>
        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 text-right">
          <span className="flex items-center gap-1">
            {isChild && <span className="text-blue-400 font-black mr-2 ml-2">└──</span>}
            {hasChildren && (
              <button
                type="button"
                onClick={() => toggleRow(u.id)}
                className="p-1 hover:bg-indigo-100 rounded text-indigo-600 font-bold transition-all flex items-center justify-center ml-2 border border-indigo-100 shadow-sm bg-white cursor-pointer"
                title={isExpanded ? t('users.hideSubUsers') : t('users.showSubUsers')}
              >
                <span className="text-xs transition-transform duration-200">
                  {isExpanded ? '📂' : '📁'}
                </span>
              </button>
            )}
            {u.username}
          </span>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
          <div className="flex flex-col">
            <span className="flex items-center gap-2">
              {u.title && (
                <span className="text-xl">
                  {u.title.includes('مهندس') || u.title.includes('المهندس') || u.title.toLowerCase().includes('eng') ? '👨‍💼' : 
                   u.title.includes('دكتور') || u.title.includes('الدكتور') || u.title.toLowerCase().includes('dr') ? '👨‍⚕️' :
                   u.title.includes('أستاذ') || u.title.includes('الأستاذ') || u.title.toLowerCase().includes('mr') ? '👨‍🏫' :
                   u.title.includes('مدير') || u.title.includes('المدير') || u.title.toLowerCase().includes('manager') ? '👔' :
                   '👤'}
                </span>
              )}
              <span className="font-bold">{translateBrandingText(u.full_name, isRtl)}</span>
            </span>
            {isChild && parentName && (
              <span className="text-[10px] text-slate-500 font-black mr-8 mt-1 flex items-center gap-1">
                <span>👤 {t('users.underSupervision')}</span>
                <span className="text-blue-600">{translateBrandingText(parentName, isRtl)}</span>
              </span>
            )}
            {hasChildren && (
              <span className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-1">
                <span>👥 {t('users.hasCount')}</span>
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded font-black">{u.children.length} {t('users.subUsersLabel')}</span>
                <button
                  type="button"
                  onClick={() => toggleRow(u.id)}
                  className="text-blue-600 hover:text-blue-800 font-black mr-2 hover:underline cursor-pointer"
                >
                  [{isExpanded ? `${t('users.hideDetails')} ⬆️` : `${t('users.showDetails')} ⬇️`}]
                </button>
              </span>
            )}
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
          {u.title ? translateBrandingText(u.title, isRtl) : '-'}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
          {u.role === 'admin' ? (
            <span className="px-2.5 py-1 text-xs font-black rounded-full bg-purple-100 text-purple-800 border border-purple-200 shadow-sm">
              👑 {t('users.level1')}
            </span>
          ) : u.level === 2 ? (
            <span className="px-2.5 py-1 text-xs font-black rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
              👔 {t('users.level2')}
            </span>
          ) : (
            <span className="px-2.5 py-1 text-xs font-black rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-sm">
              👤 {t('users.level3')}
            </span>
          )}
        </td>
        <td className="px-4 py-4 text-sm text-gray-900 text-right">
          {u.projects && u.projects.length > 0 ? (
            <select className="text-xs bg-blue-50 border border-blue-200 text-blue-800 px-2 py-1 rounded cursor-pointer outline-none focus:ring-1 focus:ring-blue-400">
              <option>📂 {u.projects.length} {t('users.projects')}</option>
              {u.projects.map((p, idx) => {
                const projectName = typeof p === 'string' ? p.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '') : p.name?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '') || p;
                return (
                  <option key={idx} disabled className="text-gray-700">
                    {translateBrandingText(projectName, isRtl)}
                  </option>
                );
              })}
            </select>
          ) : (
            <span className="text-xs text-gray-500 italic">{t('users.allProjects')}</span>
          )}
        </td>
        <td className="px-4 py-4 text-sm text-gray-900 text-right">
          {u.governorates && u.governorates.length > 0 ? (
            <select className="text-xs bg-green-50 border border-green-200 text-green-800 px-2 py-1 rounded cursor-pointer outline-none focus:ring-1 focus:ring-green-400">
              <option>🏛️ {u.governorates.length} {t('users.governorates')}</option>
              {u.governorates.map((gov, idx) => (
                <option key={idx} disabled className="text-gray-700">{translateBrandingText(gov, isRtl)}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-500 italic">{t('users.allGovernorates')}</span>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {u.is_active ? t('users.active') : t('users.suspended')}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-xl border border-gray-100 rounded-xl p-1">
              <DropdownMenuItem 
                onClick={() => openEditModal(u)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
              >
                <Edit className="w-4 h-4 text-gray-500" /> {t('users.editInfo')}
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => openPermissionsModal(u)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg cursor-pointer font-medium"
              >
                <Shield className="w-4 h-4 text-gray-500" /> {t('users.managePerms')}
              </DropdownMenuItem>



              <DropdownMenuSeparator className="my-1 bg-gray-100" />
              
              <DropdownMenuItem 
                onClick={() => handleToggleActive(u.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer font-medium ${u.is_active ? 'text-orange-600 hover:bg-orange-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
              >
                {u.is_active ? (
                  <>
                    <Lock className="w-4 h-4" /> {t('users.deactivateBtn')}
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" /> {t('users.activateBtn')}
                  </>
                )}
              </DropdownMenuItem>

              {u.username !== 'admin' && (
                <DropdownMenuItem 
                  onClick={() => handleDeleteUser(u.id)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg cursor-pointer font-medium"
                >
                  <Trash2 className="w-4 h-4" /> {t('users.deleteUserBtn')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {u.username === 'admin' && (
            <div className="mt-1">
              <span className="text-[10px] text-gray-400 font-medium italic">{t('users.protectedAccount')}</span>
            </div>
          )}
        </td>
      </tr>
    );
  };

  useEffect(() => {
    // تحميل البيانات بالتوازي — البيانات المحفوظة في cache تظهر فوراً، ثم يتم التحديث في الخلفية
    const loadData = async () => {
      try {
        const [usersRes, projectsRes, connProjectsRes, govsRes, permsRes] = await Promise.all([
          axios.get(`${API}/users`).catch(e => ({ data: [] })),
          axios.get(`${API}/projects`).catch(e => ({ data: [] })),
          axios.get(`${API}/connection-projects`).catch(e => ({ data: [] })),
          axios.get(`${API}/project-governorates`).catch(e => ({ data: BASE_PROJECT_GOVERNORATES })),
          axios.get(`${API}/permissions`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }).catch(e => ({ data: [] }))
        ]);

        // ── المستخدمون ──
        const freshUsers = usersRes.data || [];
        setUsers(freshUsers);
        try { localStorage.setItem('cache_Users.js_users', JSON.stringify(freshUsers)); } catch(e) {}

        // ── المشاريع ──
        const allProjects = [...(projectsRes.data || []), ...(connProjectsRes.data || [])];
        const uniqueProjects = Array.from(new Set(allProjects.map(p => p.name)));
        const projects = uniqueProjects.sort((a, b) => a.localeCompare(b, 'ar'));
        const finalProjects = projects.length > 0 ? projects : [];
        setAvailableProjects(finalProjects);
        try { localStorage.setItem('cache_Users.js_projects', JSON.stringify(finalProjects)); } catch(e) {}
        window.all_connection_projects = connProjectsRes.data || [];

        // ── المحافظات ──
        const freshGovs = govsRes.data || BASE_PROJECT_GOVERNORATES;
        setProjectGovernorates(freshGovs);
        try { localStorage.setItem('cache_Users.js_govs', JSON.stringify(freshGovs)); } catch(e) {}

        // ── الصلاحيات ──
        const freshPerms = permsRes.data || [];
        setAllPermissions(freshPerms);
        try { localStorage.setItem('cache_Users.js_perms_v2', JSON.stringify(freshPerms)); } catch(e) {}
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // جلب بيانات إعدادات المشروع (أنواع، حالات، بطاقات)
  useEffect(() => {
    if (showStatusManager && selectedProjectSettings) {
      if (settingsTab === 'types') fetchReportTypes();
      if (settingsTab === 'statuses') fetchReportStatuses();
      if (settingsTab === 'cards') fetchProjectCards();
    }
  }, [showStatusManager, selectedProjectSettings, settingsTab]);

  const fetchReportTypes = async () => {
    setSettingsLoading(true);
    try {
      const res = await axios.get(`${API}/report-types?project=${encodeURIComponent(selectedProjectSettings)}`);
      setReportTypes(res.data);
    } catch (e) { console.error(e); }
    finally { setSettingsLoading(false); }
  };

  const fetchReportStatuses = async () => {
    setSettingsLoading(true);
    try {
      const res = await axios.get(`${API}/report-statuses?project=${encodeURIComponent(selectedProjectSettings)}`);
      setReportStatuses(res.data);
    } catch (e) { console.error(e); }
    finally { setSettingsLoading(false); }
  };

  const fetchProjectCards = async () => {
    setSettingsLoading(true);
    try {
      const res = await axios.get(`${API}/project-cards/${encodeURIComponent(selectedProjectSettings)}`);
      setProjectCards(res.data.cards || []);
    } catch (e) { console.error(e); setProjectCards([]); }
    finally { setSettingsLoading(false); }
  };

  const handleAddType = async () => {
    if (!newTypeName.trim()) return toast.error(t('users.enterTypeName'));
    try {
      await axios.post(`${API}/report-types`, { name: newTypeName.trim(), project: selectedProjectSettings });
      toast.success(t('users.typeAddSuccess'));
      setNewTypeName(''); setShowTypeModal(false); fetchReportTypes();
    } catch (e) { toast.error(e.response?.data?.detail || (i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred')); }
  };

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return toast.error(t('users.enterStatusName'));
    try {
      await axios.post(`${API}/report-statuses`, { name: newStatusName.trim(), project: selectedProjectSettings });
      toast.success(t('users.statusAddSuccess'));
      setNewStatusName(''); setShowStatusModal(false); fetchReportStatuses();
    } catch (e) { toast.error(e.response?.data?.detail || (i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred')); }
  };

  const handleAddCard = async () => {
    if (!newCardLabel.trim()) return toast.error(t('users.enterCardLabel'));
    try {
      await axios.post(`${API}/project-cards/${encodeURIComponent(selectedProjectSettings)}`, { label: newCardLabel.trim() });
      toast.success(t('users.cardAddSuccess'));
      setNewCardLabel(''); setShowCardModal(false); fetchProjectCards();
    } catch (e) { toast.error(e.response?.data?.detail || (i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred')); }
  };

  const handleDeleteType = async (id) => {
    if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try { await axios.delete(`${API}/report-types/${id}`); toast.success(i18n.language === 'ar' ? 'تم الحذف' : 'Deleted successfully'); fetchReportTypes(); }
    catch (e) { toast.error(i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleDeleteStatus = async (id) => {
    if (!window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) return;
    try { await axios.delete(`${API}/report-statuses/${id}`); toast.success(i18n.language === 'ar' ? 'تم الحذف' : 'Deleted successfully'); fetchReportStatuses(); }
    catch (e) { toast.error(i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred'); }
  };

  const handleUpdateCard = async () => {
    if (!editCardLabel.trim()) return;
    try {
      await axios.put(`${API}/project-cards/${encodeURIComponent(selectedProjectSettings)}/${editingCard.id}`, { label: editCardLabel.trim() });
      setEditingCard(null); setEditCardLabel(''); fetchProjectCards();
    } catch (e) { toast.error(i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred'); }
  };

  // جلب قائمة الصلاحيات
  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllPermissions(response.data);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data || []);
      try { localStorage.setItem('cache_Users.js_users', JSON.stringify(response.data || [])); } catch(e) {}
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  
  // جلب المشاريع من قاعدة البيانات
  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      // ترتيب المشاريع: الأساسية أولاً ثم المضافة
      const defaultOrder = [];
      const projects = response.data.map(p => p.name).sort((a, b) => {
        const indexA = defaultOrder.indexOf(a);
        const indexB = defaultOrder.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b, 'ar');
      });
      // للمستوى 2: إظهار فقط المشاريع المتاحة له
      const normalizeArabic = (text) => {
        if (!text) return "";
        return text.toString().trim().replace(/\s+/g, " ")
          .replace(/[أإآ]/g, "ا")
          .replace(/ة/g, "ه")
          .replace(/ى/g, "ي");
      };
      const myNormalizedProjects = (user.projects || []).map(p => normalizeArabic(p));
      const filteredProjects = user.role === 'admin' 
        ? projects 
        : projects.filter(p => myNormalizedProjects.includes(normalizeArabic(p)));
      setAvailableProjects(filteredProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      // استخدام المشاريع الأساسية في حالة الخطأ
      setAvailableProjects([]);
    }
  };
  
  // جلب المحافظات من قاعدة البيانات
  const fetchProjectGovernorates = async () => {
    try {
      const response = await axios.get(`${API}/project-governorates`);
      setProjectGovernorates(response.data);
    } catch (error) {
      console.error('Failed to fetch project governorates:', error);
      // استخدام المحافظات الأساسية في حالة الخطأ
      setProjectGovernorates(BASE_PROJECT_GOVERNORATES);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const targetUser = users.find(u => u.id === userId);
      const isEnabling = targetUser && !targetUser.is_active;
      
      await axios.put(`${API}/users/${userId}/toggle-active`);
      fetchUsers();
      
      if (isEnabling) {
        toast.success(t('users.userActivateSuccess'));
      } else {
        toast.success(t('users.userDeactivateSuccess'));
      }
    } catch (error) {
      console.error('Failed to toggle user status:', error);
      toast.error(t('users.userStatusError'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('users.confirmDeleteUser'))) return;
    try {
      await axios.delete(`${API}/users/${userId}`);
      fetchUsers();
      toast.success(t('users.userDeleteSuccess'));
    } catch (error) {
      console.error('Failed to delete user:', error);
      const errorMessage = error.response?.data?.detail || t('users.userDeleteError');
      toast.error(errorMessage);
    }
  };

  const handleDeleteAllUsers = async () => {
    if (!window.confirm(t('users.confirmDeleteAll'))) return;
    try {
      const response = await axios.delete(`${API}/users/bulk/delete-all`);
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete all users:', error);
      toast.error(error.response?.data?.detail || t('users.userDeleteError'));
    }
  };

  // فتح modal الصلاحيات
  const openPermissionsModal = (targetUser) => {
    setPermissionsUser(targetUser);
    setEditSelectedPermissions(targetUser.permissions || []);
    setEditSelectedProjects(targetUser.projects || []);
    setEditConnectionPermissions(targetUser.connection_permissions || {});
    setEditProjectPermissions(targetUser.project_permissions || {});
    setShowPermissionsModal(true);
  };



  // حفظ الصلاحيات والمشاريع
  const handleSavePermissions = async () => {
    if (savingPermissions) return;
    setSavingPermissions(true);
    try {
      const token = localStorage.getItem('token');
      
      // فلترة project_permissions: فقط للمشاريع المحددة، وإزالة المشاريع الفارغة
      const cleanedProjectPerms = {};
      for (const proj of editSelectedProjects) {
        const perms = editProjectPermissions[proj] || [];
        if (perms.length > 0) {
          cleanedProjectPerms[proj] = perms;
        }
      }
      
      // حفظ الصلاحيات الأساسية والمشاريع والصلاحيات لكل مشروع
      await axios.put(`${API}/users/${permissionsUser.id}/permissions`, 
        { 
          permissions: editSelectedPermissions,
          projects: editSelectedProjects,
          project_permissions: cleanedProjectPerms
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // حفظ صلاحيات التوصيلات (legacy)
      await axios.put(`${API}/users/${permissionsUser.id}/connection-permissions`,
        { connection_permissions: editConnectionPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(t('users.permsSaveSuccess'));
      setShowPermissionsModal(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || (i18n.language === 'ar' ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setSavingPermissions(false);
    }
  };
  
  // تبديل صلاحية لمشروع محدد
  const toggleProjectPermission = (project, permKey) => {
    setEditProjectPermissions(prev => {
      const current = prev[project] || [];
      const isSelected = current.includes(permKey);
      return {
        ...prev,
        [project]: isSelected 
          ? current.filter(p => p !== permKey)
          : [...current, permKey]
      };
    });
  };
  
  // تبديل صلاحية توصيلات لمشروع معين
  const toggleConnectionPermission = (projectId, permType) => {
    setEditConnectionPermissions(prev => {
      const updated = { ...prev };
      if (!updated[projectId]) {
        updated[projectId] = {};
      }
      updated[projectId][permType] = !updated[projectId][permType];
      return updated;
    });
  };

  // تبديل صلاحية
  const togglePermission = (permKey) => {
    setEditSelectedPermissions(prev => 
      prev.includes(permKey) 
        ? prev.filter(p => p !== permKey)
        : [...prev, permKey]
    );
  };

  // تحديد/إلغاء جميع صلاحيات مجموعة
  const toggleGroupPermissions = (group) => {
    // للمستوى 2: استخدام فقط الصلاحيات المتاحة له (عامة + لكل مشروع)
    const groupPerms = allPermissions.filter(p => p.group === group);
    
    const myAllPerms = new Set([...(user.permissions || [])]);
    const userPP = user.project_permissions || {};
    for (const pList of Object.values(userPP)) {
      for (const p of (pList || [])) myAllPerms.add(p);
    }
    
    const availablePerms = user.role === 'admin' 
      ? groupPerms.map(p => p.key)
      : groupPerms.filter(p => myAllPerms.has(p.key)).map(p => p.key);
    
    const allSelected = availablePerms.every(p => editSelectedPermissions.includes(p));
    
    if (allSelected) {
      setEditSelectedPermissions(prev => prev.filter(p => !availablePerms.includes(p)));
    } else {
      setEditSelectedPermissions(prev => [...new Set([...prev, ...availablePerms])]);
    }
  };


  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const userData = { ...formData, governorates: selectedGovernorates, projects: selectedProjects };
      await axios.post(`${API}/auth/register`, userData);
      setShowAddUser(false);
      setFormData({ username: '', full_name: '', title: '', password: '', role: 'user' });
      setSelectedGovernorates([]);
      setSelectedProjects([]);
      fetchUsers();
      toast.success(t('users.userAddSuccess'));
    } catch (error) {
      console.error('Failed to add user:', error);
      toast.error(error.response?.data?.detail || t('users.userAddError'));
    }
  };
  
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        username: formData.username,
        full_name: formData.full_name,
        title: formData.title,
        governorates: editSelectedGovernorates,
        projects: editSelectedProjects
      };
      
      // إضافة الباسورد فقط إذا تم إدخاله
      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      await axios.put(`${API}/users/${editingUser.id}`, updateData);
      setShowEditUser(false);
      setEditingUser(null);
      setFormData({ username: '', full_name: '', title: '', password: '', role: 'user' });
      setEditSelectedGovernorates([]);
      setEditSelectedProjects([]);
      fetchUsers();
      toast.success(t('users.userUpdateSuccess'));
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.detail || t('users.userUpdateError'));
    }
  };
  
  const openEditModal = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      username: userToEdit.username,
      full_name: userToEdit.full_name,
      title: userToEdit.title || '',
      password: '',
      role: userToEdit.role
    });
    setEditSelectedGovernorates(userToEdit.governorates || []);
    setEditSelectedProjects(userToEdit.projects || []);
    setShowProjectManager(false);
    setShowGovernorateManager(false);
    setShowStatusManager(false);
    setShowAddUser(false);
    setShowEditUser(true);
  };
  
  const toggleGovernorate = (gov) => {
    if (selectedGovernorates.includes(gov)) {
      setSelectedGovernorates(selectedGovernorates.filter(g => g !== gov));
    } else {
      setSelectedGovernorates([...selectedGovernorates, gov]);
    }
  };
  
  const toggleProject = (project) => {
    if (selectedProjects.includes(project)) {
      setSelectedProjects(selectedProjects.filter(p => p !== project));
    } else {
      setSelectedProjects([...selectedProjects, project]);
    }
  };
  
  // إضافة مشروع جديد
  const handleAddProject = async () => {
    if (newProjectName.trim() && !availableProjects.includes(newProjectName.trim())) {
      try {
        const formData = new FormData();
        formData.append('name', newProjectName.trim());
        await axios.post(`${API}/projects`, formData);
        await fetchProjects(); // إعادة جلب المشاريع
        setNewProjectName('');
        toast.success(t('users.projectAddSuccess'));
      } catch (error) {
        console.error('Error adding project:', error);
        toast.error(t('users.projectAddError'));
      }
    } else if (availableProjects.includes(newProjectName.trim())) {
      toast.warning(t('users.projectExists'));
    } else {
      toast.warning(t('users.enterProjectName'));
    }
  };
  
  // حذف مشروع
  const handleDeleteProject = async (index) => {
    const projectToDelete = availableProjects[index];
    if (window.confirm(`${t('users.confirmDeleteProject')} "${projectToDelete}"?`)) {
      try {
        // البحث عن ID المشروع
        const projectsRes = await axios.get(`${API}/projects`);
        const project = projectsRes.data.find(p => p.name === projectToDelete);
        if (project) {
          const deleteId = project.id || project.name;
          await axios.delete(`${API}/projects/${encodeURIComponent(deleteId)}`);
        }
        await fetchProjects();
        setSelectedProjects(selectedProjects.filter(p => p !== projectToDelete));
        toast.success(t('users.projectDeleteSuccess'));
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error(t('users.projectDeleteError'));
      }
    }
  };

  // أرشفة مشروع
  const handleArchiveProject = async (index) => {
    const projectToArchive = availableProjects[index];
    const confirmMessage = i18n.language === 'ar' ? `هل أنت متأكد من نقل المشروع "${projectToArchive}" إلى الأرشيف؟` : `Are you sure you want to archive project "${projectToArchive}"?`;
    if (window.confirm(confirmMessage)) {
      try {
        const projectsRes = await axios.get(`${API}/projects`);
        const project = projectsRes.data.find(p => p.name === projectToArchive);
        if (project) {
          await axios.post(`${API}/projects/${project.id}/archive`, { archive: true });
        }
        await fetchProjects();
        setSelectedProjects(selectedProjects.filter(p => p !== projectToArchive));
        toast.success(i18n.language === 'ar' ? "تم نقل المشروع إلى الأرشيف بنجاح" : "Project archived successfully");
      } catch (error) {
        console.error('Error archiving project:', error);
        toast.error(i18n.language === 'ar' ? "فشل في أرشفة المشروع" : "Failed to archive project");
      }
    }
  };
  
  // بدء تعديل اسم مشروع
  const startEditingProject = (index) => {
    setEditingProjectIndex(index);
    setEditingProjectName(availableProjects[index]);
  };
  
  // حفظ تعديل اسم مشروع
  const handleSaveProjectEdit = async () => {
    if (editingProjectName.trim() && editingProjectIndex !== null) {
      const oldName = availableProjects[editingProjectIndex];
      const newName = editingProjectName.trim();
      
      if (oldName === newName) {
        setEditingProjectIndex(null);
        setEditingProjectName('');
        return;
      }
      
      try {
        // البحث عن ID المشروع
        const projectsRes = await axios.get(`${API}/projects`);
        const project = projectsRes.data.find(p => p.name === oldName);
        
        if (project) {
          await axios.put(`${API}/projects/${project.id}`, { name: newName }, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          });
        }
        
        // تحديث القائمة المحلية
        await fetchProjects();
        
        // تحديث المشاريع المحددة
        if (selectedProjects.includes(oldName)) {
          setSelectedProjects(selectedProjects.map(p => p === oldName ? newName : p));
        }
        
        setEditingProjectIndex(null);
        setEditingProjectName('');
        toast.success(t('users.projectUpdateSuccess'));
      } catch (error) {
        console.error('Error updating project:', error);
        toast.error(t('users.projectUpdateError'));
      }
    }
  };
  
  // إلغاء تعديل اسم مشروع
  const cancelEditingProject = () => {
    setEditingProjectIndex(null);
    setEditingProjectName('');
  };
  
  // ============= إدارة المحافظات =============
  
  // إضافة محافظة جديدة
  const handleAddGovernorate = async () => {
    if (!newGovernorateName.trim()) {
      toast.warning(t('users.enterGovName'));
      return;
    }
    if (!selectedProjectForGov) {
      toast.warning(t('users.selectProjectWarning'));
      return;
    }
    
    // التحقق مسبقاً من وجود المحافظة في نفس المشروع (بمقارنة معادَلة)
    const existingGovs = getGovernoratesForProject(selectedProjectForGov);
    const normalizedNew = normalizeArabicStr(newGovernorateName.trim());
    if (existingGovs.some(g => normalizeArabicStr(g) === normalizedNew)) {
      toast.warning(`${t('users.govExistsInProject')}: "${newGovernorateName.trim()}"`);
      return;
    }
    
    try {
      await axios.post(`${API}/project-governorates`, {
        name: newGovernorateName.trim(),
        project: selectedProjectForGov
      });
      
      setNewGovernorateName('');
      toast.success(t('users.govAddSuccess'));
      fetchProjectGovernorates(); // إعادة تحميل البيانات من السيرفر
    } catch (error) {
      console.error('Failed to add governorate:', error);
      toast.error(error.response?.data?.detail || t('users.govAddError'));
    }
  };
  
  // حذف محافظة
  const handleDeleteGovernorate = async (project, govName) => {
    if (!window.confirm(`${t('users.confirmDeleteGov')} "${govName}"?`)) return;
    
    try {
      await axios.delete(`${API}/project-governorates/${encodeURIComponent(project)}/${encodeURIComponent(govName)}`);
      
      // تحديث القائمة المحلية
      setProjectGovernorates(prev => ({
        ...prev,
        [project]: (prev[project] || []).filter(g => g !== govName)
      }));
      
      toast.success(t('users.govDeleteSuccess'));
      fetchProjectGovernorates();
    } catch (error) {
      console.error('Failed to delete governorate:', error);
      toast.error(error.response?.data?.detail || t('users.govDeleteError'));
    }
  };
  
  // بدء تعديل محافظة
  const startEditingGovernorate = (project, govName) => {
    setEditingGovernorate({ project, name: govName });
    setEditingGovernorateName(govName);
  };
  
  // حفظ تعديل محافظة
  const handleSaveGovernorateEdit = async () => {
    if (!editingGovernorateName.trim() || !editingGovernorate) return;
    
    try {
      await axios.put(`${API}/project-governorates`, {
        old_name: editingGovernorate.name,
        new_name: editingGovernorateName.trim(),
        project: editingGovernorate.project
      });
      
      // تحديث القائمة المحلية
      setProjectGovernorates(prev => ({
        ...prev,
        [editingGovernorate.project]: (prev[editingGovernorate.project] || []).map(g => 
          g === editingGovernorate.name ? editingGovernorateName.trim() : g
        )
      }));
      
      setEditingGovernorate(null);
      setEditingGovernorateName('');
      toast.success(t('users.govUpdateSuccess'));
      fetchProjectGovernorates();
    } catch (error) {
      console.error('Failed to update governorate:', error);
      toast.error(error.response?.data?.detail || t('users.govUpdateError'));
    }
  };
  
  // إلغاء تعديل محافظة
  const cancelEditingGovernorate = () => {
    setEditingGovernorate(null);
    setEditingGovernorateName('');
  };
  
  // Toggle functions للتعديل
  const toggleEditGovernorate = (gov) => {
    if (editSelectedGovernorates.includes(gov)) {
      setEditSelectedGovernorates(editSelectedGovernorates.filter(g => g !== gov));
    } else {
      setEditSelectedGovernorates([...editSelectedGovernorates, gov]);
    }
  };
  
  const toggleEditProject = (project) => {
    if (editSelectedProjects.includes(project)) {
      setEditSelectedProjects(editSelectedProjects.filter(p => p !== project));
    } else {
      setEditSelectedProjects([...editSelectedProjects, project]);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header حديث بتصميم بطاقات */}
        <div className="bg-gradient-to-l from-blue-600 to-indigo-700 rounded-2xl shadow-xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-3xl">
                👥
              </div>
              <div>
                <h2 className="text-2xl font-bold" data-testid="users-page-title">{t('users.title')}</h2>
                <p className="text-sm text-blue-100 mt-1">{t('users.subTitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-2xl">👤</span>
              <span className="font-semibold">{users.length} {t('users.userCount')}</span>
            </div>
          </div>
        </div>
        
        {/* بطاقات الإدارة السريعة - بديل عن الأزرار والروابط */}
        {user.role === 'admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <button
              data-testid="action-card-projects"
              onClick={() => { setShowProjectManager(!showProjectManager); setShowGovernorateManager(false); setShowAddUser(false); setShowStatusManager(false); setShowEditUser(false); }}
              className={`group relative overflow-hidden rounded-xl p-4 text-right transition-all duration-300 ${
                showProjectManager 
                  ? 'bg-gradient-to-br from-green-800 to-emerald-950 shadow-xl scale-105 text-white' 
                  : 'bg-white hover:shadow-lg border-2 border-slate-100 hover:border-green-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-110 ${showProjectManager ? 'bg-white/20' : 'bg-green-50 text-green-800'}`}>🏗️</div>
              <div className={`font-bold text-base ${showProjectManager ? 'text-white' : 'text-slate-800'}`}>{t('users.manageProjects')}</div>
              <div className={`text-xs mt-1 ${showProjectManager ? 'text-green-100' : 'text-slate-500'}`}>{t('users.manageProjectsSub')}</div>
            </button>
            
            <button
              data-testid="action-card-governorates"
              onClick={() => { setShowGovernorateManager(!showGovernorateManager); setShowProjectManager(false); setShowAddUser(false); setShowStatusManager(false); setShowEditUser(false); }}
              className={`group relative overflow-hidden rounded-xl p-4 text-right transition-all duration-300 ${
                showGovernorateManager 
                  ? 'bg-gradient-to-br from-stone-600 to-stone-800 shadow-xl scale-105 text-white' 
                  : 'bg-white hover:shadow-lg border-2 border-slate-100 hover:border-stone-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-110 ${showGovernorateManager ? 'bg-white/20' : 'bg-stone-50 text-stone-700'}`}>🏛️</div>
              <div className={`font-bold text-base ${showGovernorateManager ? 'text-white' : 'text-slate-800'}`}>{t('users.manageGovs')}</div>
              <div className={`text-xs mt-1 ${showGovernorateManager ? 'text-stone-100' : 'text-slate-500'}`}>{t('users.manageGovsSub')}</div>
            </button>
            
            <button
              data-testid="action-card-statuses"
              onClick={() => { 
                setShowStatusManager(!showStatusManager); 
                setShowProjectManager(false); 
                setShowGovernorateManager(false); 
                setShowAddUser(false);
                setShowEditUser(false);
                if (!selectedProjectSettings && availableProjects.length > 0) setSelectedProjectSettings(availableProjects[0]);
              }}
              className={`group relative overflow-hidden rounded-xl p-4 text-right transition-all duration-300 ${
                showStatusManager 
                  ? 'bg-gradient-to-br from-indigo-900 to-slate-950 shadow-xl scale-105 text-white' 
                  : 'bg-white hover:shadow-lg border-2 border-slate-100 hover:border-indigo-300'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-110 ${showStatusManager ? 'bg-white/20' : 'bg-indigo-50 text-indigo-900'}`}>📋</div>
              <div className={`font-bold text-base ${showStatusManager ? 'text-white' : 'text-slate-800'}`}>{t('users.reportStatuses')}</div>
              <div className={`text-xs mt-1 ${showStatusManager ? 'text-indigo-100' : 'text-slate-500'}`}>{t('users.reportStatusesSub')}</div>
            </button>
            
            {user.can_create_subusers && (
              <button
                data-testid="action-card-add-user"
                onClick={() => { setShowAddUser(true); setShowProjectManager(false); setShowGovernorateManager(false); setShowStatusManager(false); setShowEditUser(false); }}
                className={`group relative overflow-hidden rounded-xl p-4 text-right transition-all duration-300 ${
                  showAddUser
                    ? 'bg-gradient-to-br from-blue-900 to-indigo-950 shadow-xl scale-105 text-white'
                    : 'bg-white hover:shadow-lg border-2 border-slate-100 hover:border-blue-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-3xl mb-3 transition-transform group-hover:scale-110 ${showAddUser ? 'bg-white/20' : 'bg-blue-50 text-blue-900'}`}>➕</div>
                <div className={`font-bold text-base ${showAddUser ? 'text-white' : 'text-slate-800'}`}>{t('users.addUser')}</div>
                <div className={`text-xs mt-1 ${showAddUser ? 'text-blue-100' : 'text-slate-500'}`}>{t('users.addUserSub')}</div>
              </button>
            )}
          </div>
        )}
        
        {/* للمستوى الأول (مدير) - بدون مسؤول */}
        {user.role !== 'admin' && user.can_create_subusers && (
          <div className="flex justify-end">
            <button
              data-testid="action-card-add-user"
              onClick={() => { setShowAddUser(true); setShowStatusManager(false); }}
              className="text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(to left, var(--color-primary), var(--color-secondary))' }}
            >
              <span className="text-xl">➕</span>
              <span>{t('users.addNewUser')}</span>
            </button>
          </div>
        )}
        
        {user.role === 'admin' && users.length > 1 && (
          <div className="flex justify-end">
            <button
              onClick={handleDeleteAllUsers}
              className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            >
              <span>🗑️</span>
              <span>{t('users.deleteAllUsers')}</span>
            </button>
          </div>
        )}
        
        {/* قسم إدارة المشاريع */}
        {showProjectManager && user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">⚙️ {t('users.manageProjects')}</h3>
            
            {/* إضافة مشروع جديد */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.addProjectTitle')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('users.newProjectPlaceholder')}
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddProject()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddProject}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ➕ {t('users.add')}
                </button>
              </div>
            </div>
            
            {/* قائمة المشاريع الحالية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('users.currentProjects')} ({availableProjects.length})
              </label>
              <div className="space-y-2">
                {availableProjects.map((project, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    {editingProjectIndex === index ? (
                      <>
                        <input
                          type="text"
                          value={editingProjectName}
                          onChange={(e) => setEditingProjectName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveProjectEdit()}
                          className="flex-1 px-3 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={handleSaveProjectEdit}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          ✓ {t('users.save')}
                        </button>
                        <button
                          onClick={cancelEditingProject}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          ✕ {t('users.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-gray-800">{translateBrandingText(project, isRtl)}</span>
                        <button
                          onClick={() => startEditingProject(index)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          ✏️ {t('users.edit')}
                        </button>
                        <button
                          onClick={() => handleArchiveProject(index)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          📦 {i18n.language === 'ar' ? 'الأرشيف' : 'Archive'}
                        </button>
                        <button
                          onClick={() => handleDeleteProject(index)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          🗑️ {t('users.delete')}
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {availableProjects.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    {i18n.language === 'ar' ? 'لا توجد مشاريع. قم بإضافة مشروع جديد أعلاه.' : 'No projects. Add a new project above.'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowProjectManager(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t('users.close')}
              </button>
            </div>
          </div>
        )}
        
        {/* قسم إدارة المحافظات */}
        {showGovernorateManager && user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🏛️ {t('users.manageGovs')}</h3>
            
            {/* إضافة محافظة جديدة */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('users.addGovTitle')}
              </label>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={selectedProjectForGov}
                  onChange={(e) => setSelectedProjectForGov(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">{t('users.selectProject')}</option>
                  {availableProjects.map(project => (
                    <option key={project} value={project}>{translateBrandingText(project, isRtl)}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={t('users.newGovPlaceholder')}
                  value={newGovernorateName}
                  onChange={(e) => setNewGovernorateName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddGovernorate()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={handleAddGovernorate}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ➕ {t('users.add')}
                </button>
              </div>
            </div>
            
            {/* قائمة المحافظات لكل مشروع */}
            <div className="space-y-4">
              {availableProjects.map(project => (
                <div key={project} className="border rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3 text-lg">
                    {translateBrandingText(project, isRtl)}
                    <span className="text-sm font-normal text-gray-500 mr-2">
                      ({getGovernoratesForProject(project).length} {t('users.governorates')})
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {getGovernoratesForProject(project).map(gov => (
                      <div key={gov} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        {editingGovernorate?.project === project && editingGovernorate?.name === gov ? (
                          <>
                            <input
                              type="text"
                              value={editingGovernorateName}
                              onChange={(e) => setEditingGovernorateName(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSaveGovernorateEdit()}
                              className="flex-1 px-2 py-1 border border-purple-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                              autoFocus
                            />
                            <button
                              onClick={handleSaveGovernorateEdit}
                              className="text-green-600 hover:text-green-800 text-sm"
                              title={t('users.save')}
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingGovernorate}
                              className="text-gray-600 hover:text-gray-800 text-sm"
                              title={t('users.cancel')}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm text-gray-700">{translateBrandingText(gov, isRtl)}</span>
                            <button
                              onClick={() => startEditingGovernorate(project, gov)}
                              className="text-blue-600 hover:text-blue-800 text-xs"
                              title={t('users.edit')}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteGovernorate(project, gov)}
                              className="text-red-600 hover:text-red-800 text-xs"
                              title={t('users.delete')}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {getGovernoratesForProject(project).length === 0 && (
                    <p className="text-gray-500 text-sm">{i18n.language === 'ar' ? 'لا توجد محافظات لهذا المشروع. أضف محافظة من الأعلى باختيار هذا المشروع.' : 'No governorates for this project. Add a governorate above by selecting this project.'}</p>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowGovernorateManager(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t('users.close')}
              </button>
            </div>
          </div>
        )}

        {/* قسم إدارة حالات وأنواع البلاغات (Inline) */}
        {showStatusManager && user.role === 'admin' && (
          <div className="bg-white rounded-lg shadow p-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span>📋 {t('users.projectSettingsTitle')}</span>
                <select 
                  value={selectedProjectSettings}
                  onChange={(e) => setSelectedProjectSettings(e.target.value)}
                  className="bg-slate-100 border border-slate-200 rounded-lg px-3 py-1 text-slate-800 font-bold outline-none cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  {availableProjects.map(p => {
                    const cleanP = p.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '');
                    return <option key={p} value={p}>{translateBrandingText(cleanP, isRtl)}</option>;
                  })}
                </select>
              </h3>
            </div>

            {/* التبويبات الداخلية */}
            <div className="flex gap-4 mb-6 border-b border-slate-100">
              <button 
                onClick={() => setSettingsTab('types')}
                className={`pb-3 px-2 text-sm font-black transition-all ${settingsTab === 'types' ? '' : 'text-slate-400 hover:text-slate-600'}`}
                style={settingsTab === 'types' ? { borderBottom: '4px solid var(--color-primary)', color: 'var(--color-primary)' } : {}}
              >
                📂 {t('users.reportTypes')}
              </button>
              <button 
                onClick={() => setSettingsTab('statuses')}
                className={`pb-3 px-2 text-sm font-black transition-all ${settingsTab === 'statuses' ? '' : 'text-slate-400 hover:text-slate-600'}`}
                style={settingsTab === 'statuses' ? { borderBottom: '4px solid var(--color-primary)', color: 'var(--color-primary)' } : {}}
              >
                📋 {t('users.reportStatuses')}
              </button>
              <button 
                onClick={() => setSettingsTab('cards')}
                className={`pb-3 px-2 text-sm font-black transition-all ${settingsTab === 'cards' ? '' : 'text-slate-400 hover:text-slate-600'}`}
                style={settingsTab === 'cards' ? { borderBottom: '4px solid var(--color-primary)', color: 'var(--color-primary)' } : {}}
              >
                🏷️ {t('users.cardTitles')}
              </button>
            </div>

            {settingsLoading ? (
              <div className="flex flex-col items-center py-12 gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
                <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading Data...' : 'جاري تحميل البيانات...'}</span></div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-300">
                {settingsTab === 'types' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                      <span className="text-sm font-black text-slate-500">{t('users.editReportTypesInfo')} {translateBrandingText(selectedProjectSettings, isRtl)}</span>
                      <button onClick={() => setShowTypeModal(true)} className="text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>{t('users.addTypeBtn')}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reportTypes.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                          <span className="font-black text-slate-700">{translateBrandingText(t.name, isRtl)}</span>
                          <button onClick={() => handleDeleteType(t.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all">🗑️</button>
                        </div>
                      ))}
                      {reportTypes.length === 0 && <div className="col-span-2 text-center py-8 text-slate-300 font-bold italic">{t('users.noTypesAdded')}</div>}
                    </div>
                  </div>
                )}

                {settingsTab === 'statuses' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                      <span className="text-sm font-black text-slate-500">{t('users.editStatusesInfo')} {translateBrandingText(selectedProjectSettings, isRtl)}</span>
                      <button onClick={() => setShowStatusModal(true)} className="text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>{t('users.addStatusBtn')}</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {reportStatuses.map(s => (
                        <div key={s.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                          <span className="font-black text-slate-700">{translateBrandingText(s.name, isRtl)}</span>
                          <button onClick={() => handleDeleteStatus(s.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all">🗑️</button>
                        </div>
                      ))}
                      {reportStatuses.length === 0 && <div className="col-span-2 text-center py-8 text-slate-300 font-bold italic">{t('users.noStatusesAdded')}</div>}
                    </div>
                  </div>
                )}

                {settingsTab === 'cards' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                      <span className="text-sm font-black text-slate-500">{t('users.editCardsInfo')} {translateBrandingText(selectedProjectSettings, isRtl)}</span>
                      <button onClick={() => setShowCardModal(true)} className="text-white px-4 py-2 rounded-xl text-sm font-black shadow-lg transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>{t('users.addCardBtn')}</button>
                    </div>
                    <div className="space-y-3">
                      {projectCards.map(card => (
                        <div key={card.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-md transition-all">
                          {editingCard?.id === card.id ? (
                            <div className="flex-1 flex gap-3 items-center">
                              <input
                                type="text"
                                value={editCardLabel}
                                onChange={(e) => setEditCardLabel(e.target.value)}
                                className="flex-1 p-2 border-2 rounded-xl outline-none font-bold"
                                style={{ borderColor: 'var(--color-primary)' }}
                                autoFocus
                              />
                              <button onClick={handleUpdateCard} className="bg-green-500 text-white p-2 rounded-xl">✓</button>
                              <button onClick={() => setEditingCard(null)} className="bg-slate-200 text-slate-600 p-2 rounded-xl">✕</button>
                            </div>
                          ) : (
                            <>
                              <span className="font-black text-slate-700">{translateBrandingText(card.label, isRtl)}</span>
                              <div className="flex gap-2">
                                <button onClick={() => { setEditingCard(card); setEditCardLabel(card.label); }} className="text-blue-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50">✏️</button>
                                <button onClick={() => { if(window.confirm(i18n.language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?')) axios.delete(`${API}/project-cards/${encodeURIComponent(selectedProjectSettings)}/${card.id}`).then(()=>fetchProjectCards()) }} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50">🗑️</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {projectCards.length === 0 && <div className="text-center py-8 text-slate-300 font-bold italic">{t('users.noCardsAdded')}</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatusManager(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition-all"
              >
                {t('users.close')}
              </button>
            </div>
          </div>
        )}

        {/* Modals with themed buttons */}
        {showTypeModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
              <h3 className="text-2xl font-black mb-6 text-slate-800">{t('users.addNewTypeTitle')}</h3>
              <input
                type="text"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder={t('users.typeNamePlaceholder')}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 outline-none transition-all font-bold focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={handleAddType} className="flex-1 text-white py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>{t('users.add')}</button>
                <button onClick={() => setShowTypeModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black">{t('users.cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {showStatusModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
              <h3 className="text-2xl font-black mb-6 text-slate-800">{t('users.addNewStatusTitle')}</h3>
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder={t('users.statusNamePlaceholder')}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 outline-none transition-all font-bold focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={handleAddStatus} className="flex-1 text-white py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>{t('users.add')}</button>
                <button onClick={() => setShowStatusModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black">{t('users.cancel')}</button>
              </div>
            </div>
          </div>
        )}

        {showCardModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl scale-in-center">
              <h3 className="text-2xl font-black mb-6 text-slate-800">{t('users.addNewCardTitle')}</h3>
              <input
                type="text"
                value={newCardLabel}
                onChange={(e) => setNewCardLabel(e.target.value)}
                placeholder={t('users.cardTitlePlaceholder')}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-6 outline-none transition-all font-bold focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button onClick={handleAddCard} className="flex-1 text-white py-4 rounded-2xl font-black shadow-lg hover:scale-105 transition-all" style={{ backgroundColor: 'var(--color-primary)' }}>{t('users.add')}</button>
                <button onClick={() => setShowCardModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black">{t('users.cancel')}</button>
              </div>
            </div>
          </div>
        )}
        
        {showAddUser && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('users.addNewUser')}</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder={t('users.username')} 
                  required 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="text" 
                  placeholder={t('users.fullName')} 
                  required 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="text" 
                  placeholder={t('users.titlePlaceholder')} 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="password" 
                  placeholder={t('users.password')} 
                  required 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <select 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="user">{t('users.user')}</option>
                  <option value="admin">{t('users.admin')}</option>
                </select>
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.assignedProjectsEmptyText')}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {availableProjects.map(project => (
                    <label key={project} className="flex items-center space-x-2 space-x-reverse cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedProjects.includes(project)}
                        onChange={() => toggleProject(project)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{translateBrandingText(project, isRtl)}</span>
                    </label>
                  ))}
                </div>
                {selectedProjects.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    {t('users.selectedProjectsCount')} {selectedProjects.length}
                  </div>
                )}
              </div>
              
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.assignedGovsEmptyText')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {availableGovernorates.map(gov => (
                    <label key={gov} className="flex items-center space-x-2 space-x-reverse cursor-pointer p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={selectedGovernorates.includes(gov)}
                        onChange={() => toggleGovernorate(gov)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{translateBrandingText(gov, isRtl)}</span>
                      {user.role === 'admin' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const project = Object.keys(projectGovernorates).find(p => projectGovernorates[p].includes(gov));
                            if (project) handleDeleteGovernorate(project, gov);
                          }}
                          className="mr-auto text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                          title={t('users.deleteFromSystem')}
                        >
                          🗑️
                        </button>
                      )}
                    </label>
                  ))}
                </div>
                {selectedGovernorates.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600">
                    {t('users.selectedGovsCount')} {selectedGovernorates.join(', ')}
                  </div>
                )}
                
                {/* إضافة محافظة يدوياً */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('users.addGovManually')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('users.govNamePlaceholder')}
                      id="newGovernorate"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('newGovernorate');
                        const newGov = input.value.trim();
                        if (newGov && !selectedGovernorates.includes(newGov)) {
                          setSelectedGovernorates([...selectedGovernorates, newGov]);
                          input.value = '';
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      ➕ {t('users.add')}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  {t('users.save')}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowAddUser(false); setSelectedGovernorates([]); setSelectedProjects([]); }} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('users.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Edit User Modal */}
        {showEditUser && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('users.editUserTitle')}</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder={t('users.username')} 
                  required 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="text" 
                  placeholder={t('users.fullName')} 
                  required 
                  value={formData.full_name} 
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="text" 
                  placeholder={t('users.titlePlaceholder')} 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
                <input 
                  type="password" 
                  placeholder={t('users.newPasswordPlaceholder')} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <p className="text-sm text-gray-600">{t('users.passwordHint')}</p>
              
              {/* تعديل المشاريع - للأدمن والمستوى 2 */}
              {(user.role === 'admin' || user.can_create_subusers) && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('users.projects')}
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {availableProjects.map(project => (
                      <label key={project} className="flex items-center space-x-2 space-x-reverse cursor-pointer p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={editSelectedProjects.includes(project)}
                          onChange={() => toggleEditProject(project)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{translateBrandingText(project, isRtl)}</span>
                      </label>
                    ))}
                  </div>
                  {editSelectedProjects.length > 0 && (
                    <div className="mt-2 text-sm text-blue-600">
                      {t('users.selectedProjectsCount')} {editSelectedProjects.length}
                    </div>
                  )}
                </div>
              )}
              
              {/* تعديل المحافظات - للأدمن والمستوى 2 */}
              {(user.role === 'admin' || user.can_create_subusers) && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('users.authGovs')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                    {editAvailableGovernorates.map(gov => (
                      <label key={gov} className="flex items-center space-x-2 space-x-reverse cursor-pointer p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={editSelectedGovernorates.includes(gov)}
                          onChange={() => toggleEditGovernorate(gov)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{translateBrandingText(gov, isRtl)}</span>
                        {user.role === 'admin' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const project = Object.keys(projectGovernorates).find(p => projectGovernorates[p].includes(gov));
                              if (project) handleDeleteGovernorate(project, gov);
                            }}
                            className="mr-auto text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                            title={t('users.deleteFromSystem')}
                          >
                            🗑️
                          </button>
                        )}
                      </label>
                    ))}
                  </div>
                  {editSelectedGovernorates.length > 0 && (
                    <div className="mt-2 text-sm text-blue-600">
                      {t('users.selectedGovsCount')} {editSelectedGovernorates.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                  {t('users.save')}
                </button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowEditUser(false); 
                    setEditingUser(null);
                    setFormData({ username: '', full_name: '', title: '', password: '', role: 'user' });
                    setEditSelectedGovernorates([]);
                    setEditSelectedProjects([]);
                  }} 
                  className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {t('users.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* عرض قائمة المستخدمين فقط في حال عدم فتح أي لوحة إدارة */}
        {!showProjectManager && !showGovernorateManager && !showStatusManager && !showAddUser && !showEditUser && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-start">
                        <User className="w-4 h-4 text-blue-600" />
                        {t('users.username')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-start">
                        <UserCircle className="w-4 h-4 text-blue-600" />
                        {t('users.fullName')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-start">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        {t('users.titleHeader')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-start">
                        <Shield className="w-4 h-4 text-blue-600" />
                        {t('users.roleHeader')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-start">
                        <Folder className="w-4 h-4 text-blue-600" />
                        {t('users.projects')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-2 justify-start">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        {t('users.authGovs')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        {t('users.statusHeader')}
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-xs font-black text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <Settings className="w-4 h-4 text-blue-600" />
                        {t('users.actionsHeader')}
                      </div>
                    </th>
                  </tr>
                </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 && loading ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading Data...' : 'جاري تحميل البيانات...'}</span></div>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                          {t('users.noUsersFound')}
                        </td>
                      </tr>
                    ) : (
                      (() => {
                        const hierarchy = buildHierarchy(users);
                        const paginatedHierarchy = hierarchy.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
                        
                        return paginatedHierarchy.map(u => (
                          <React.Fragment key={u.id}>
                            {renderUserRow(u, false)}
                            {u.children && u.children.length > 0 && expandedRows[u.id] && u.children.map(child => (
                              renderUserRow(child, true, u.full_name)
                            ))}
                          </React.Fragment>
                        ));
                      })()
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {!loading && users.length > 0 && (
                (() => {
                  const hierarchy = buildHierarchy(users);
                  const totalHierarchyItems = hierarchy.length;
                  
                  return (
                    <div className="bg-white border-t border-gray-100">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalHierarchyItems / itemsPerPage)}
                        totalItems={totalHierarchyItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={handleUserLimitChange}
                        itemsPerPageOptions={[10, 20, 50, 100]}
                        itemLabel={t('users.managerOrMainUser')}
                      />
                    </div>
                  );
                })()
              )}
            </div>
        )}

        {/* Modal الصلاحيات */}
        {showPermissionsModal && permissionsUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-900">
                    🔐 {t('users.permissionsFor')} {translateBrandingText(permissionsUser.full_name, isRtl)}
                  </h3>
                  <button onClick={() => setShowPermissionsModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {i18n.language === 'ar' ? (
                    <>
                      📌 يمكنك منح صلاحيات لكل مشروع على حدة.
                      <br />
                      الصلاحية الممنوحة في مشروع محدد تعمل لذلك مشروع فقط.
                    </>
                  ) : (
                    <>
                      📌 You can grant permissions per project.
                      <br />
                      Permissions granted in a specific project work for that project only.
                    </>
                  )}
                </p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* الصلاحيات الاستثنائية (عامة) */}
                <div className="border-2 border-red-200 rounded-xl p-4 bg-red-50/50 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-red-800 flex items-center gap-2 text-lg">
                      ⭐ {i18n.language === 'ar' ? 'صلاحيات استثنائية (عامة)' : 'Exceptional Permissions (Global)'}
                    </h4>
                  </div>
                  <label className="flex items-center gap-4 p-4 bg-white rounded-xl border border-red-100 cursor-pointer hover:bg-red-50 transition-all shadow-sm">
                    <div className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${editSelectedPermissions.includes('view_governorate_data') ? 'bg-red-600' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-md ${editSelectedPermissions.includes('view_governorate_data') ? 'translate-x-8' : 'translate-x-1'}`} />
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={editSelectedPermissions.includes('view_governorate_data')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditSelectedPermissions([...editSelectedPermissions, 'view_governorate_data']);
                        } else {
                          setEditSelectedPermissions(editSelectedPermissions.filter(p => p !== 'view_governorate_data'));
                        }
                      }}
                    />
                    <div>
                      <span className="font-bold text-gray-900 block text-base">{i18n.language === 'ar' ? 'رؤية إجمالي بيانات المحافظة' : 'View Total Governorate Data'}</span>
                      <span className="text-sm text-gray-600 block mt-1">{i18n.language === 'ar' ? 'تسمح للمستخدم برؤية جميع البلاغات والتقارير داخل المحافظات الموكلة إليه، متجاوزاً شرط أن يكون هو منشئ البلاغ.' : 'Allows the user to see all reports within their assigned governorates, bypassing the creator restriction.'}</span>
                    </div>
                  </label>
                </div>

                {/* قسم المشاريع المتاحة */}
                <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-blue-800 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {t('users.availableProjects')}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditSelectedProjects([...availableProjects])}
                        className="text-xs px-3 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200"
                      >
                        {t('users.selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditSelectedProjects([])}
                        className="text-xs px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                      >
                        {t('users.cancelAll')}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mb-3">
                    {i18n.language === 'ar' 
                      ? `المشاريع المحددة (${editSelectedProjects.length}): المستخدم سيرى فقط هذه المشاريع في الصفحات المتاحة له`
                      : `Selected Projects (${editSelectedProjects.length}): The user will only see these projects on their accessible pages`}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableProjects.map((project) => (
                      <label 
                        key={project} 
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          editSelectedProjects.includes(project) 
                            ? 'bg-blue-100 border-2 border-blue-400' 
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={editSelectedProjects.includes(project)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditSelectedProjects([...editSelectedProjects, project]);
                            } else {
                              setEditSelectedProjects(editSelectedProjects.filter(p => p !== project));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-700 truncate">{translateBrandingText(project, isRtl)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* قسم الصلاحيات لكل مشروع على حدة (الميزة الجديدة) */}
                {editSelectedProjects.length > 0 && (
                  <div className="border-2 border-purple-300 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-purple-800 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {t('users.scopedPermissionsTitle')}
                      </h4>
                      <span className="text-xs text-purple-600 bg-white px-2 py-1 rounded-full">{t('users.new')}</span>
                    </div>
                    <p className="text-xs text-purple-700 mb-3 leading-relaxed">
                      {t('users.scopedPermissionsDesc')}
                    </p>
                    
                    <div className="space-y-3">
                      {editSelectedProjects.map((project) => {
                        const projectScopedPerms = allPermissions.filter(p => PROJECT_SCOPED.includes(p.key));
                        // تجميع حسب المجموعة
                        const groupedByGroup = {};
                        projectScopedPerms.forEach(p => {
                          if (!groupedByGroup[p.group]) groupedByGroup[p.group] = [];
                          groupedByGroup[p.group].push(p);
                        });
                        
                        const currentProjectPerms = editProjectPermissions[project] || [];
                        const projectShortName = project.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '');
                        
                        return (
                          <details key={project} className="bg-white rounded-lg border border-purple-200" data-testid={`project-perms-${project}`}>
                            <summary className="cursor-pointer p-3 font-semibold text-purple-900 flex items-center justify-between hover:bg-purple-50 rounded-lg">
                              <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                {translateBrandingText(projectShortName, isRtl)}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                {currentProjectPerms.length} {i18n.language === 'ar' ? 'صلاحية' : 'permissions'}
                              </span>
                            </summary>
                            <div className="p-3 border-t border-purple-100 space-y-3">
                              {Object.entries(groupedByGroup).map(([group, perms]) => {
                                // للمستوى 2: الصلاحيات المتاحة لمشروع معين = عامة + لكل مشروع (لنفس المشروع)
                                const normalizeArabic = (text) => {
                                  if (!text) return "";
                                  return text.toString().trim().replace(/\s+/g, " ")
                                    .replace(/[أإآ]/g, "ا")
                                    .replace(/ة/g, "ه")
                                    .replace(/ى/g, "ي");
                                };
                                
                                const projNorm = normalizeArabic(project);
                                const myPP = user.project_permissions || {};
                                // البحث عن المشروع في صلاحيات المدير باستخدام التوحيد لضمان التطابق
                                const myProjKey = Object.keys(myPP).find(k => normalizeArabic(k) === projNorm);
                                const myProjPerms = myProjKey ? (myPP[myProjKey] || []) : [];
 
                                // ⚡ دعم صلاحيات التوصيلات (Legacy) للمدير
 
                                 const myCP = user.connection_permissions || {};
                                 const legacyPerms = [];
                                 const connProj = (window.all_connection_projects || []).find(p => normalizeArabic(p.name) === projNorm);
                                 
                                 if (connProj && myCP[connProj.id]) {
                                   if (myCP[connProj.id].water_connections) legacyPerms.push('water_connections');
                                   if (myCP[connProj.id].sewage_connections) legacyPerms.push('sewage_connections');
                                 }
 
                                 const myPermsForProj = new Set([
                                   ...(user.permissions || []),
                                   ...myProjPerms,
                                   ...legacyPerms
                                 ]);
                                 
                                 // تصفية الصلاحيات: الأدمن يرى الكل، المستوى 2 يرى فقط ما يملكه
                                 const availablePerms = user.role === 'admin' 
                                   ? perms 
                                   : perms.filter(p => {
                                       // ⚡ دعم التوريث الديناميكي: المدير يرى الصلاحية إذا كان يملكها عامة أو لهذا المشروع
                                       return myPermsForProj.has(p.key);
                                     });
                                if (availablePerms.length === 0) return null;
                                
                                const allSelected = availablePerms.every(p => currentProjectPerms.includes(p.key));
                                
                                return (
                                  <div key={group} className="border border-gray-100 rounded-lg p-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-gray-700">{t('users.permissionGroups.' + group, group)}</span>
                                      <button
                                        type="button"
                                        data-testid={`toggle-all-${project}-${group}`}
                                        onClick={() => {
                                          setEditProjectPermissions(prev => {
                                            const updated = { ...prev };
                                            const currentPerms = updated[project] || [];
                                            const groupKeys = availablePerms.map(p => p.key);
                                            if (allSelected) {
                                              updated[project] = currentPerms.filter(p => !groupKeys.includes(p));
                                            } else {
                                              updated[project] = [...new Set([...currentPerms, ...groupKeys])];
                                            }
                                            return updated;
                                          });
                                        }}
                                        className={`text-xs px-2 py-0.5 rounded ${allSelected ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                      >
                                        {allSelected ? t('users.cancelAll') : t('users.selectAll')}
                                      </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                                      {availablePerms.map(perm => (
                                        <label key={`${project}-${perm.key}`} className="flex items-center gap-2 p-1 rounded hover:bg-purple-50 cursor-pointer text-xs">
                                          <input
                                            type="checkbox"
                                            checked={(editProjectPermissions[project] || []).includes(perm.key)}
                                            onChange={() => toggleProjectPermission(project, perm.key)}
                                            className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                                          />
                                          <span className="text-gray-700">{t('users.permissionsList.' + perm.key, perm.label)}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white flex gap-3 justify-end">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  {t('users.cancel')}
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={savingPermissions}
                  data-testid="save-permissions-btn"
                  className={`px-6 py-2 text-white rounded-lg flex items-center gap-2 ${savingPermissions ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                >
                  {savingPermissions ? (i18n.language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('users.savePermissions')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Users;
