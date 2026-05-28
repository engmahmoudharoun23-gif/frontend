import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../components/ui/dropdown-menu";
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { translateBrandingText } from '../utils/brandingTranslation';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const EMPLOYEE_STATUSES = [
  'على رأس العمل',
  'خروج وعودة',
  'متغيب عن العمل',
  'تم نقل كفالته',
  'إجازة سنوية',
  'إجازة اضطرارية'
];

function HRManagement({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(false);
  
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [advancesCustodies, setAdvancesCustodies] = useState([]);
  const [hrAlerts, setHrAlerts] = useState([]);
  
  const [searchFilter, setSearchFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddContractModal, setShowAddContractModal] = useState(false);
  const [showAddSalaryModal, setShowAddSalaryModal] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesToView, setNotesToView] = useState({ title: '', content: [], description: '' });
  const [showAddAdvanceCustodyModal, setShowAddAdvanceCustodyModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, date: new Date().toISOString().split('T')[0], notes: '' });
  const [hideCompletedAdvances, setHideCompletedAdvances] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [hiddenSalaries, setHiddenSalaries] = useState({});
  const [hideAllSalaries, setHideAllSalaries] = useState(false);
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [selectedItems, setSelectedItems] = useState([]);
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
  
  const emptyEmployeeForm = {
    name: '', employee_number: '', nationality: '', company: '', project: '', id_number: '',
    id_expiry: '', insurance_expiry: '', religion: '', status: 'على رأس العمل', notes: ''
  };
  
  const emptyContractForm = {
    employee_name: '', nationality: '', company: '', project: '',
    contract_duration: '', start_date: '', end_date: '', notes: ''
  };
  
  const emptySalaryForm = {
    employee_name: '', project: '', company: '', basic_salary: 0,
    housing_allowance: 0, transport_allowance: 0, other_allowances: 0,
    overtime: 0, bonus: 0,
    deduction_type: '', deduction_amount: 0,
    month: new Date().getMonth() + 1, year: new Date().getFullYear(), notes: ''
  };

  const emptyAdvanceCustodyForm = {
    employee_name: '', employee_number: '', project: '', company: '', type: 'سلفة', amount: 0, paid_amount: 0, remaining_amount: 0, item_description: '',
    date: new Date().toISOString().split('T')[0], status: 'غير مسددة', action_date: '', notes: ''
  };
  
  const [employeeForm, setEmployeeForm] = useState(emptyEmployeeForm);
  const [contractForm, setContractForm] = useState(emptyContractForm);
  const [salaryForm, setSalaryForm] = useState(emptySalaryForm);
  const [advanceCustodyForm, setAdvanceCustodyForm] = useState(emptyAdvanceCustodyForm);

  const token = localStorage.getItem('token');
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchProjects();
    fetchEmployees();
    fetchContracts();
    fetchSalaries();
    fetchAdvancesCustodies();
    fetchHRAlerts();
  }, []);

  useEffect(() => { setCurrentPage(1); setSelectedItems([]); }, [activeTab, searchFilter, projectFilter, companyFilter, monthFilter, yearFilter]);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`, authHeaders);
      setProjects(res.data || []);
    } catch (e) { console.error('Failed to fetch projects:', e); }
  };

  const platformName = localStorage.getItem('platformName') || 'بيت الخبرة';

  const fetchEmployees = async () => {
    try {
      // setLoading(true);
      const res = await axios.get(`${API}/hr/employees`, authHeaders);
      setEmployees(res.data || []);
    } catch (e) { console.error('Failed to fetch employees:', e); }
    finally { setLoading(false); }
  };

  const fetchContracts = async () => {
    try {
      const res = await axios.get(`${API}/hr/contracts`, authHeaders);
      setContracts(res.data || []);
    } catch (e) { console.error('Failed to fetch contracts:', e); }
  };

  const fetchSalaries = async () => {
    try {
      const res = await axios.get(`${API}/hr/salaries`, authHeaders);
      setSalaries(res.data || []);
    } catch (e) { console.error('Failed to fetch salaries:', e); }
  };

  const fetchAdvancesCustodies = async () => {
    try {
      const res = await axios.get(`${API}/hr/advances-custodies`, authHeaders);
      setAdvancesCustodies(res.data || []);
    } catch (e) { console.error('Failed to fetch advances and custodies:', e); }
  };

  const fetchHRAlerts = async () => {
    try {
      const res = await axios.get(`${API}/hr/alerts`, authHeaders);
      setHrAlerts(res.data?.alerts || []);
    } catch (e) { console.error('Failed to fetch HR alerts:', e); }
  };

  useEffect(() => {
    const uniqueCompanies = [...new Set(employees.map(e => e.company).filter(Boolean))];
    if (uniqueCompanies.length > 0) setCompanies(uniqueCompanies.map(c => ({ name: c })));
  }, [employees]);

  const handleSaveEmployee = async () => {
    if (!employeeForm.name) { toast.error('اسم الموظف مطلوب'); return; }
    try {
      if (editingItem) {
        await axios.put(`${API}/hr/employees/${editingItem.id}`, employeeForm, authHeaders);
        toast.success('تم تحديث بيانات الموظف');
      } else {
        await axios.post(`${API}/hr/employees`, employeeForm, authHeaders);
        toast.success('تم إضافة الموظف بنجاح');
      }
      setShowAddEmployeeModal(false); setEditingItem(null);
      setEmployeeForm(emptyEmployeeForm);
      fetchEmployees();
      fetchHRAlerts();
    } catch (e) { toast.error(e.response?.data?.detail || 'حدث خطأ'); }
  };

  const handleSaveContract = async () => {
    if (!contractForm.employee_name) { toast.error('اسم الموظف مطلوب'); return; }
    try {
      if (editingItem) {
        await axios.put(`${API}/hr/contracts/${editingItem.id}`, contractForm, authHeaders);
        toast.success('تم تحديث العقد');
      } else {
        await axios.post(`${API}/hr/contracts`, contractForm, authHeaders);
        toast.success('تم إضافة العقد بنجاح');
      }
      setShowAddContractModal(false); setEditingItem(null);
      setContractForm(emptyContractForm);
      fetchContracts();
      fetchHRAlerts();
    } catch (e) { toast.error(e.response?.data?.detail || 'حدث خطأ'); }
  };

  const handleSaveSalary = async () => {
    if (!salaryForm.employee_name) { toast.error('اسم الموظف مطلوب'); return; }
    try {
      if (editingItem) {
        await axios.put(`${API}/hr/salaries/${editingItem.id}`, salaryForm, authHeaders);
        toast.success('تم تحديث الراتب');
      } else {
        await axios.post(`${API}/hr/salaries`, salaryForm, authHeaders);
        toast.success('تم إضافة الراتب بنجاح');
      }
      setShowAddSalaryModal(false); setEditingItem(null);
      setSalaryForm(emptySalaryForm);
      fetchSalaries();
    } catch (e) { toast.error(e.response?.data?.detail || 'حدث خطأ'); }
  };

  const handleSaveAdvanceCustody = async () => {
    if (!advanceCustodyForm.employee_name) { toast.error('اسم الموظف مطلوب'); return; }
    try {
      if (editingItem) {
        await axios.put(`${API}/hr/advances-custodies/${editingItem.id}`, advanceCustodyForm, authHeaders);
        toast.success('تم التحديث بنجاح');
      } else {
        await axios.post(`${API}/hr/advances-custodies`, advanceCustodyForm, authHeaders);
        toast.success('تم الإضافة بنجاح');
      }
      setShowAddAdvanceCustodyModal(false); setEditingItem(null);
      setAdvanceCustodyForm(emptyAdvanceCustodyForm);
      fetchAdvancesCustodies();
    } catch (e) { toast.error(e.response?.data?.detail || 'حدث خطأ'); }
  };

  const handleSavePayment = async () => {
    if (selectedAdvance.type === 'سلفة' && (!paymentForm.amount || paymentForm.amount <= 0)) { toast.error('المبلغ غير صحيح'); return; }
    try {
      const currentHistory = selectedAdvance.payment_history || [];
      const newPayment = { ...paymentForm, id: Date.now().toString() };
      const updatedHistory = [...currentHistory, newPayment];
      
      let payload = {
        ...selectedAdvance,
        payment_history: updatedHistory,
        action_date: paymentForm.date
      };

      if (selectedAdvance.type === 'سلفة') {
        const newPaidAmount = updatedHistory.reduce((sum, p) => sum + Number(p.amount), 0);
        const newRemaining = selectedAdvance.amount - newPaidAmount;
        payload.paid_amount = newPaidAmount;
        payload.remaining_amount = newRemaining;
        payload.status = newRemaining <= 0 ? 'مسددة' : 'مسددة جزئياً';
      } else {
        // Custody (عهدة) - recording an action implies a return/update
        payload.status = 'عهدة الشركة';
      }
      
      await axios.put(`${API}/hr/advances-custodies/${selectedAdvance.id}`, payload, authHeaders);
      toast.success('تم تسجيل الإجراء بنجاح');
      setShowPaymentHistoryModal(false);
      setPaymentForm({ amount: 0, date: new Date().toISOString().split('T')[0], notes: '' });
      fetchAdvancesCustodies();
    } catch (e) { toast.error(e.response?.data?.detail || 'حدث خطأ'); }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء!')) return;
    try {
      await axios.delete(`${API}/hr/${type}/${id}`, authHeaders);
      toast.success('تم الحذف بنجاح');
      if (type === 'employees') { fetchEmployees(); fetchHRAlerts(); }
      if (type === 'contracts') { fetchContracts(); fetchHRAlerts(); }
      if (type === 'salaries') fetchSalaries();
      if (type === 'advances-custodies') fetchAdvancesCustodies();
      setEditingItem(null); // Clear editing item if it was deleted
    } catch (e) { toast.error(e.response?.data?.detail || 'حدث خطأ'); }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدفعة؟')) return;
    try {
      const updatedHistory = selectedAdvance.payment_history.filter(p => p.id !== paymentId);
      const newPaidAmount = updatedHistory.reduce((sum, p) => sum + Number(p.amount), 0);
      const newRemaining = selectedAdvance.amount - newPaidAmount;
      const newStatus = newRemaining <= 0 ? 'مسددة' : (newPaidAmount > 0 ? 'مسددة جزئياً' : 'غير مسددة');
      
      const payload = {
        ...selectedAdvance,
        payment_history: updatedHistory,
        paid_amount: newPaidAmount,
        remaining_amount: newRemaining,
        status: newStatus
      };
      
      await axios.put(`${API}/hr/advances-custodies/${selectedAdvance.id}`, payload, authHeaders);
      toast.success('تم حذف الدفعة وتحديث الرصيد');
      fetchAdvancesCustodies();
      setSelectedAdvance(payload);
    } catch (e) { toast.error('فشل في حذف الدفعة'); }
  };

  const getGroupedAdvances = useCallback((data) => {
    const groups = {};
    data.forEach(item => {
      const existing = groups[item.employee_name];
      // Priority: 1. Active (non-paid) items. 2. Most recent date.
      const isItemActive = !['مسددة', 'مرتجعة', 'تم تصفية العهدة'].includes(item.status);
      const isExistingActive = existing && !['مسددة', 'مرتجعة', 'تم تصفية العهدة'].includes(existing.status);

      if (!existing) {
        groups[item.employee_name] = item;
      } else {
        if (isItemActive && !isExistingActive) {
          groups[item.employee_name] = item;
        } else if (isItemActive === isExistingActive) {
          if (new Date(item.date) > new Date(existing.date)) {
            groups[item.employee_name] = item;
          }
        }
      }
    });
    return Object.values(groups);
  }, []);

  const filterData = useCallback((data) => {
    let filtered = data.filter(item => {
      const matchSearch = !searchFilter || 
        (item.name || item.employee_name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.employee_number || '').toLowerCase().includes(searchFilter.toLowerCase());
      const matchProject = !projectFilter || item.project === projectFilter;
      const matchCompany = !companyFilter || item.company === companyFilter;
      const matchMonth = !monthFilter || item.month === Number(monthFilter);
      const matchYear = !yearFilter || item.year === Number(yearFilter);
      const matchDate = !dateFilter || item.date === dateFilter;
      
      if (activeTab === 'advances_custodies' && hideCompletedAdvances) {
        if (['مسددة', 'مرتجعة', 'تالفة', 'تم تصفية العهدة'].includes(item.status)) {
          return false;
        }
      }
      
      return matchSearch && matchProject && matchCompany && matchMonth && matchYear && matchDate;
    });

    // Display all items individually without grouping by employee


    return filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.start_date || 0);
      const dateB = new Date(b.date || b.start_date || 0);
      return dateB - dateA;
    });
  }, [searchFilter, projectFilter, companyFilter, monthFilter, yearFilter, dateFilter, activeTab, hideCompletedAdvances, getGroupedAdvances]);

  const employeeLedgerGroups = useMemo(() => {
    if (!selectedAdvance) return [];
    const empItems = advancesCustodies
      .filter(a => a.employee_name === selectedAdvance.employee_name)
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Most recent first
    
    return empItems.map(item => {
      let payments = [];
      if (item.payment_history && item.payment_history.length > 0) {
        payments = item.payment_history.sort((a, b) => new Date(a.date) - new Date(b.date));
      }
      return {
        ...item,
        payments
      };
    });
  }, [selectedAdvance, advancesCustodies]);

  const empTotals = useMemo(() => {
    if (!selectedAdvance) return { received: 0, paid: 0, remaining: 0 };
    const empItems = advancesCustodies.filter(a => a.employee_name === selectedAdvance.employee_name && a.type === 'سلفة');
    const received = empItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const paid = empItems.reduce((sum, item) => sum + (Number(item.paid_amount) || 0), 0);
    return { received, paid, remaining: received - paid };
  }, [selectedAdvance, advancesCustodies]);

  const toggleSalaryVisibility = (salaryId) => {
    setHiddenSalaries(prev => ({ ...prev, [salaryId]: !prev[salaryId] }));
  };

  const calculateTotalSalaries = () => {
    return filterData(salaries).reduce((total, s) => {
      return total + (s.basic_salary || 0) + (s.housing_allowance || 0) + (s.transport_allowance || 0) + (s.other_allowances || 0) + (s.overtime || 0) + (s.bonus || 0) - (s.deduction_amount || 0);
    }, 0);
  };

  // Check if a salary is hidden (individual toggle takes priority over master toggle)
  const isSalaryHidden = (salaryId) => {
    if (hiddenSalaries[salaryId] !== undefined) return hiddenSalaries[salaryId];
    return hideAllSalaries;
  };

  const getCurrentData = () => {
    let data;
    if (activeTab === 'employees') data = filterData(employees);
    else if (activeTab === 'contracts') data = filterData(contracts);
    else if (activeTab === 'salaries') data = filterData(salaries);
    else data = filterData(advancesCustodies);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(start, start + itemsPerPage);
    return { data: paginatedData, total: data.length, totalPages };
  };

  const getExportData = () => {
    let allData;
    if (activeTab === 'employees') allData = filterData(employees);
    else if (activeTab === 'contracts') allData = filterData(contracts);
    else if (activeTab === 'salaries') allData = filterData(salaries);
    else allData = filterData(advancesCustodies);
    if (selectedItems.length > 0) return allData.filter(item => selectedItems.includes(item.id));
    return allData;
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const currentItems = getCurrentData().data;
    const allSelected = currentItems.every(item => selectedItems.includes(item.id));
    if (allSelected) setSelectedItems(prev => prev.filter(id => !currentItems.find(item => item.id === id)));
    else setSelectedItems(prev => [...new Set([...prev, ...currentItems.map(item => item.id)])]);
  };

  const handleExportExcel = async () => {
    try {
      const data = getExportData();
      if (data.length === 0) { toast.error('لا توجد بيانات للتصدير'); return; }
      toast.info(`جاري تصدير ${selectedItems.length > 0 ? selectedItems.length + ' عنصر' : 'الكل'} إلى Excel...`);
      
      // تصدير محلي للبيانات المحددة
      const XLSX = await import('xlsx');
      let rows, sheetName;
      if (activeTab === 'employees') {
        sheetName = 'الموظفين';
        rows = data.map((e, i) => ({ '#': i+1, 'الاسم': e.name, 'الرقم الوظيفي': e.employee_number, 'الجنسية': e.nationality, 'الشركة': e.company, 'المشروع': e.project, 'رقم الإقامة': e.id_number, 'انتهاء الإقامة': e.id_expiry, 'انتهاء التأمين': e.insurance_expiry, 'الحالة': e.status }));
      } else if (activeTab === 'contracts') {
        sheetName = 'العقود';
        rows = data.map((c, i) => ({ '#': i+1, 'الاسم': c.employee_name, 'الجنسية': c.nationality, 'الشركة': c.company, 'المشروع': c.project, 'مدة العقد': c.contract_duration, 'تاريخ البداية': c.start_date, 'تاريخ الانتهاء': c.end_date, 'ملاحظات': c.notes }));
      } else if (activeTab === 'salaries') {
        sheetName = 'الرواتب';
        rows = data.map((s, i) => {
          const gross = (s.basic_salary||0)+(s.housing_allowance||0)+(s.transport_allowance||0)+(s.other_allowances||0)+(s.overtime||0)+(s.bonus||0);
          return { '#': i+1, 'الاسم': s.employee_name, 'المشروع': s.project, 'الشركة': s.company, 'الراتب': s.basic_salary, 'بدل السكن': s.housing_allowance, 'بدل التنقل': s.transport_allowance, 'بدلات أخرى': s.other_allowances, 'وقت إضافي': s.overtime||0, 'مكافأة': s.bonus||0, 'الخصم': s.deduction_amount||0, 'نوع الخصم': s.deduction_type||'', 'الإجمالي': gross, 'الصافي': gross-(s.deduction_amount||0), 'الشهر': s.month, 'السنة': s.year };
        });
      } else {
        sheetName = 'السلف والعهد';
        rows = data.map((a, i) => ({ '#': i+1, 'الاسم': a.employee_name, 'النوع': a.type, 'الشركة': a.company, 'المشروع': a.project, 'المبلغ': a.amount, 'المسدد': a.paid_amount, 'المتبقي': a.remaining_amount, 'الوصف': a.item_description, 'التاريخ': a.date, 'تاريخ الإجراء': a.action_date, 'الحالة': a.status, 'ملاحظات': a.notes }));
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${activeTab}.xlsx`);
      toast.success('تم التصدير بنجاح');
    } catch (e) { console.error('Excel export error:', e); toast.error('فشل في تصدير Excel'); }
  };

  const handleExportPDF = async () => {
    try {
      const exportData = getExportData();
      if (exportData.length === 0) { toast.error('لا توجد بيانات للتصدير'); return; }
      toast.info(`جاري تصدير ${selectedItems.length > 0 ? selectedItems.length + ' عنصر' : 'الكل'} إلى PDF...`);
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      
      // إنشاء عنصر HTML مؤقت للطباعة
      const container = document.createElement('div');
      container.style.cssText = 'position:absolute;left:-9999px;top:0;width:1200px;direction:rtl;font-family:Arial,Tahoma,sans-serif;background:#fff;padding:30px;';
      
      let title, tableHTML;
      if (activeTab === 'employees') {
        title = 'بيانات الموظفين';
        const rows = exportData.map((e, i) => 
          `<tr><td>${i+1}</td><td>${e.name||''}</td><td>${e.employee_number||''}</td><td>${e.nationality||''}</td><td>${e.company||''}</td><td>${e.project||''}</td><td>${e.id_number||''}</td><td>${e.status||''}</td></tr>`
        ).join('');
        tableHTML = `<table><thead><tr><th>#</th><th>الاسم</th><th>الرقم الوظيفي</th><th>الجنسية</th><th>الشركة</th><th>المشروع</th><th>رقم الإقامة</th><th>الحالة</th></tr></thead><tbody>${rows}</tbody></table>`;
      } else if (activeTab === 'contracts') {
        title = 'العقود';
        const rows = exportData.map((c, i) => 
          `<tr><td>${i+1}</td><td>${c.employee_name||''}</td><td>${c.company||''}</td><td>${c.project||''}</td><td>${c.contract_duration||''}</td><td>${c.start_date||''}</td><td>${c.end_date||''}</td></tr>`
        ).join('');
        tableHTML = `<table><thead><tr><th>#</th><th>الاسم</th><th>الشركة</th><th>المشروع</th><th>مدة العقد</th><th>تاريخ البداية</th><th>تاريخ الانتهاء</th></tr></thead><tbody>${rows}</tbody></table>`;
      } else {
        title = 'الرواتب';
        const rows = exportData.map((s, i) => {
          const gross = (s.basic_salary||0)+(s.housing_allowance||0)+(s.transport_allowance||0)+(s.other_allowances||0)+(s.overtime||0)+(s.bonus||0);
          const net = gross - (s.deduction_amount||0);
          return `<tr><td>${i+1}</td><td>${s.employee_name||''}</td><td>${s.project||''}</td><td>${s.basic_salary||0}</td><td>${s.housing_allowance||0}</td><td>${s.transport_allowance||0}</td><td>${s.other_allowances||0}</td><td style="color:indigo">${s.overtime||0}</td><td style="color:teal">${s.bonus||0}</td><td style="color:red">${s.deduction_amount||0}</td><td style="color:blue;font-weight:bold">${gross}</td><td style="color:green;font-weight:bold">${net}</td><td>${months.find(m=>m.value===s.month)?.label||''} ${s.year||''}</td></tr>`;
        }).join('');
        tableHTML = `<table><thead><tr><th>#</th><th>الاسم</th><th>المشروع</th><th>الراتب</th><th>بدل السكن</th><th>بدل التنقل</th><th>بدلات أخرى</th><th>وقت إضافي</th><th>مكافأة</th><th>الخصم</th><th>الإجمالي</th><th>الصافي</th><th>الفترة</th></tr></thead><tbody>${rows}</tbody></table>`;
      }
      
      container.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
          <img src="/bayt-alkhibra-logo.png" style="height:60px;margin-bottom:10px;" crossorigin="anonymous" />
          <h2 style="color:#475569;font-size:22px;margin:5px 0;">${platformName}</h2>
          <h3 style="color:#64748b;font-size:16px;margin:5px 0;">${title}</h3>
          <p style="color:#94a3b8;font-size:12px;">تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
        </div>
        <style>
          table { width:100%; border-collapse:collapse; font-size:12px; direction:rtl; }
          th { background:#475569; color:#fff; padding:8px 6px; text-align:right; font-weight:bold; }
          td { padding:6px; text-align:right; border-bottom:1px solid #e2e8f0; }
          tr:nth-child(even) { background:#f8fafc; }
        </style>
        ${tableHTML}
      `;
      document.body.appendChild(container);
      
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      document.body.removeChild(container);
      
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = Math.min(pdfW / imgW, pdfH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      
      // If content is longer than one page, split it
      if (h > pdfH) {
        let yOffset = 0;
        while (yOffset < imgH) {
          if (yOffset > 0) pdf.addPage();
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgW;
          pageCanvas.height = Math.min(imgH - yOffset, imgW * (pdfH / pdfW));
          const ctx = pageCanvas.getContext('2d');
          ctx.drawImage(canvas, 0, yOffset, imgW, pageCanvas.height, 0, 0, imgW, pageCanvas.height);
          pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfW * pageCanvas.height / imgW);
          yOffset += pageCanvas.height;
        }
      } else {
        pdf.addImage(imgData, 'JPEG', (pdfW - w) / 2, 0, w, h);
      }
      
      pdf.save(`${activeTab}.pdf`);
      toast.success('تم التصدير بنجاح');
    } catch (e) {
      console.error('PDF export error:', e);
      toast.error('فشل في تصدير PDF');
    }
  };

  const months = [
    { value: 1, label: isRtl ? 'يناير' : 'January' }, { value: 2, label: isRtl ? 'فبراير' : 'February' }, { value: 3, label: isRtl ? 'مارس' : 'March' },
    { value: 4, label: isRtl ? 'أبريل' : 'April' }, { value: 5, label: isRtl ? 'مايو' : 'May' }, { value: 6, label: isRtl ? 'يونيو' : 'June' },
    { value: 7, label: isRtl ? 'يوليو' : 'July' }, { value: 8, label: isRtl ? 'أغسطس' : 'August' }, { value: 9, label: isRtl ? 'سبتمبر' : 'September' },
    { value: 10, label: isRtl ? 'أكتوبر' : 'October' }, { value: 11, label: isRtl ? 'نوفمبر' : 'November' }, { value: 12, label: isRtl ? 'ديسمبر' : 'December' }
  ];

  const { data: pageData, total: totalItems, totalPages } = getCurrentData();

  // دالة لتنسيق التاريخ بشكل جميل
  const formatDate = (dateString) => {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch (e) {
      return dateString;
    }
  };

  const handlePrint = (item, type) => {
    const printWindow = window.open('', '_blank');
    let title = '';
    let detailsHTML = '';

    if (type === 'employees') {
      title = 'بطاقة بيانات موظف';
      detailsHTML = `
        <div class="info-grid">
          <div class="info-item"><div class="label">اسم الموظف</div><div class="value">${item.name}</div></div>
          <div class="info-item"><div class="label">الرقم الوظيفي</div><div class="value">${item.employee_number || '---'}</div></div>
          <div class="info-item"><div class="label">الجنسية</div><div class="value">${item.nationality || '---'}</div></div>
          <div class="info-item"><div class="label">الشركة</div><div class="value">${item.company || '---'}</div></div>
          <div class="info-item"><div class="label">المشروع</div><div class="value">${item.project || '---'}</div></div>
          <div class="info-item"><div class="label">رقم الإقامة</div><div class="value">${item.id_number || '---'}</div></div>
          <div class="info-item"><div class="label">انتهاء الإقامة</div><div class="value">${formatDate(item.id_expiry)}</div></div>
          <div class="info-item"><div class="label">انتهاء التأمين</div><div class="value">${formatDate(item.insurance_expiry)}</div></div>
          <div class="info-item"><div class="label">الديانة</div><div class="value">${item.religion || '---'}</div></div>
          <div class="info-item"><div class="label">الحالة</div><div class="value">${item.status || '---'}</div></div>
          <div class="info-item full-width"><div class="label">ملاحظات</div><div class="value">${item.notes || '---'}</div></div>
        </div>
      `;
    } else if (type === 'contracts') {
      title = 'تفاصيل عقد عمل';
      detailsHTML = `
        <div class="info-grid">
          <div class="info-item"><div class="label">اسم الموظف</div><div class="value">${item.employee_name}</div></div>
          <div class="info-item"><div class="label">الشركة</div><div class="value">${item.company || '---'}</div></div>
          <div class="info-item"><div class="label">المشروع</div><div class="value">${item.project || '---'}</div></div>
          <div class="info-item"><div class="label">مدة العقد</div><div class="value">${item.contract_duration || '---'}</div></div>
          <div class="info-item"><div class="label">تاريخ البداية</div><div class="value">${formatDate(item.start_date)}</div></div>
          <div class="info-item"><div class="label">تاريخ الانتهاء</div><div class="value">${formatDate(item.end_date)}</div></div>
          <div class="info-item full-width"><div class="label">ملاحظات</div><div class="value">${item.notes || '---'}</div></div>
        </div>
      `;
    } else if (type === 'salaries') {
      title = 'كشف راتب موظف';
      const gross = (item.basic_salary || 0) + (item.housing_allowance || 0) + (item.transport_allowance || 0) + (item.other_allowances || 0) + (item.overtime || 0) + (item.bonus || 0);
      const net = gross - (item.deduction_amount || 0);
      detailsHTML = `
        <div class="info-grid">
          <div class="info-item"><div class="label">اسم الموظف</div><div class="value">${item.employee_name}</div></div>
          <div class="info-item"><div class="label">الشهر / السنة</div><div class="value">${months.find(m => m.value === item.month)?.label} ${item.year}</div></div>
          <div class="info-item"><div class="label">الراتب الأساسي</div><div class="value">${item.basic_salary?.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">بدل السكن</div><div class="value">${item.housing_allowance?.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">بدل التنقل</div><div class="value">${item.transport_allowance?.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">بدلات أخرى</div><div class="value">${item.other_allowances?.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">وقت إضافي</div><div class="value">${(item.overtime || 0).toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">مكافأة</div><div class="value">${(item.bonus || 0).toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">الخصومات</div><div class="value text-red">${(item.deduction_amount || 0).toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">نوع الخصم</div><div class="value">${item.deduction_type || '---'}</div></div>
          <div class="info-item"><div class="label">إجمالي المستحق</div><div class="value text-blue">${gross.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">صافي الراتب</div><div class="value text-green">${net.toLocaleString()} ر.س</div></div>
          <div class="info-item full-width"><div class="label">ملاحظات</div><div class="value">${item.notes || '---'}</div></div>
        </div>
      `;
    } else if (type === 'advances_custodies') {
      title = `تفاصيل ${item.type}`;
      detailsHTML = `
        <div class="info-grid">
          <div class="info-item"><div class="label">اسم الموظف</div><div class="value">${item.employee_name}</div></div>
          <div class="info-item"><div class="label">النوع</div><div class="value">${item.type}</div></div>
          <div class="info-item"><div class="label">المبلغ الإجمالي</div><div class="value">${item.amount?.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">المبلغ المسدد</div><div class="value text-green">${item.paid_amount?.toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">المبلغ المتبقي</div><div class="value text-red">${(item.amount - item.paid_amount).toLocaleString()} ر.س</div></div>
          <div class="info-item"><div class="label">الحالة</div><div class="value">${item.status}</div></div>
          <div class="info-item"><div class="label">التاريخ</div><div class="value">${item.date}</div></div>
          <div class="info-item"><div class="label">آخر إجراء</div><div class="value">${item.action_date || '---'}</div></div>
          <div class="info-item full-width"><div class="label">الوصف</div><div class="value">${item.item_description || '---'}</div></div>
        </div>
      `;
    }

    const content = `
      <html dir="rtl">
        <head>
          <title>${title} - ${item.employee_name || item.name}</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #334155; margin: 0; font-size: 24px; }
            .header p { color: #64748b; margin: 5px 0 0; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
            .info-item { border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; background: #fff; }
            .label { font-size: 11px; color: #64748b; margin-bottom: 4px; font-weight: bold; text-transform: uppercase; }
            .value { font-size: 15px; font-weight: bold; color: #1e293b; }
            .full-width { grid-column: span 2; }
            .text-red { color: #dc2626; }
            .text-green { color: #16a34a; }
            .text-blue { color: #2563eb; }
            .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
            .signature-box { border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; font-size: 13px; font-weight: bold; color: #475569; }
            @media print { .no-print { display: none; } body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin-bottom: 10px;">${platformName}</h1>
            <h2 style="margin: 0; color: #475569;">${title}</h2>
            <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
          </div>
          
          ${detailsHTML}

          <div class="signatures">
            <div class="signature-box">توقيع الموظف</div>
            <div class="signature-box">مدير القسم</div>
            <div class="signature-box">اعتماد شؤون الموظفين</div>
          </div>

          <div class="no-print" style="margin-top: 50px; text-align: center;">
            <button onclick="window.print()" style="padding: 12px 30px; background: #334155; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">طباعة المستند</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(content);
    printWindow.document.close();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'على رأس العمل': return 'bg-green-100 text-green-700';
      case 'خروج وعودة': return 'bg-blue-100 text-blue-700';
      case 'متغيب عن العمل': return 'bg-red-100 text-red-700';
      case 'تم نقل كفالته': return 'bg-orange-100 text-orange-700';
      case 'إجازة سنوية': return 'bg-purple-100 text-purple-700';
      case 'إجازة اضطرارية': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-6 overflow-x-visible" data-testid="hr-management-page">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-600 rounded-xl p-6 mb-6 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                {isRtl ? 'شؤون الموظفين' : 'HR Management'}
              </h1>
              <p className="text-slate-200">{isRtl ? 'إدارة بيانات الموظفين والعقود والرواتب' : 'Manage employee records, contracts, and payroll'}</p>
            </div>
          </div>
        </div>

        {/* HR Alerts */}
        {hrAlerts.length > 0 && (
          <div className="mb-6 space-y-2" data-testid="hr-alerts-section">
            {hrAlerts.map((alert, idx) => (
              <div key={idx} className={`p-3 rounded-lg flex items-center gap-3 text-sm ${
                alert.priority === 'expired' ? 'bg-red-50 border border-red-200 text-red-800' :
                alert.priority === 'urgent' ? 'bg-orange-50 border border-orange-200 text-orange-800' :
                'bg-yellow-50 border border-yellow-200 text-yellow-800'
              }`} data-testid={`hr-alert-${idx}`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="flex-1">{translateBrandingText(alert.message, isRtl)}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  alert.priority === 'expired' ? 'bg-red-200' : alert.priority === 'urgent' ? 'bg-orange-200' : 'bg-yellow-200'
                }`}>
                  {alert.type === 'id_expiry' ? (isRtl ? 'إقامة' : 'Residence ID') : alert.type === 'insurance_expiry' ? (isRtl ? 'تأمين' : 'Insurance') : (isRtl ? 'عقد' : 'Contract')}
                </span>
              </div>
            ))}
          </div>
        )}
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow mb-6" data-testid="hr-tabs-container">
          <div className="flex border-b">
            {[
              { key: 'employees', label: isRtl ? '1. الموظفين' : '1. Employees', count: filterData(employees).length, icon: <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
              { key: 'contracts', label: isRtl ? '2. العقود' : '2. Contracts', count: filterData(contracts).length, icon: <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
              { key: 'salaries', label: isRtl ? '3. الرواتب' : '3. Salaries', count: filterData(salaries).length, icon: <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { key: 'advances_custodies', label: isRtl ? '4. السلف والعهد' : '4. Advances & Custody', count: filterData(advancesCustodies).length, icon: <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> }
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} data-testid={`hr-tab-${tab.key}`}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === tab.key ? 'text-slate-700 border-b-2 border-slate-600 bg-slate-50' : 'text-gray-500 hover:bg-gray-50'
                }`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          
          {/* Filters */}
          <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px] flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input type="text" placeholder={isRtl ? "بحث بالاسم أو الرقم الوظيفي..." : "Search by name or employee number..."} value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500" data-testid="hr-search-input" />
              </div>
              {activeTab === 'advances_custodies' && (
                <div className="flex gap-1">
                  <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 text-sm" title={isRtl ? "بحث بالتاريخ" : "Search by date"} />
                  <button className="bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors flex items-center shadow-sm" title={isRtl ? "تنفيذ البحث" : "Execute search"}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </button>
                </div>
              )}
            </div>
            <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 min-w-[160px]" data-testid="hr-project-filter">
              <option value="">{isRtl ? "جميع المشاريع" : "All Projects"}</option>
              {projects.map(p => <option key={p.id || p.name} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)}
            </select>
{/* Company filter hidden as requested */}
            {activeTab === 'salaries' && (
              <>
                <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500" data-testid="hr-month-filter">
                  <option value="">{isRtl ? "كل الشهور" : "All Months"}</option>
                  {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                <input type="number" placeholder={isRtl ? "السنة" : "Year"} value={yearFilter} onChange={e => setYearFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-slate-500 w-24" data-testid="hr-year-filter" />
              </>
            )}
            
            <div className="flex gap-2">
              {activeTab === 'employees' && (
                <button onClick={() => { setEditingItem(null); setEmployeeForm(emptyEmployeeForm); setShowAddEmployeeModal(true); }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium" data-testid="hr-add-employee-btn">
                  {isRtl ? '+ إضافة موظف جديد' : '+ Add New Employee'}
                </button>
              )}
              {activeTab === 'contracts' && (
                <button onClick={() => { setEditingItem(null); setContractForm(emptyContractForm); setShowAddContractModal(true); }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium" data-testid="hr-add-contract-btn">
                  {isRtl ? '+ إضافة عقد' : '+ Add Contract'}
                </button>
              )}
              {activeTab === 'advances_custodies' && (
                <button onClick={() => { setEditingItem(null); setAdvanceCustodyForm(emptyAdvanceCustodyForm); setShowAddAdvanceCustodyModal(true); }}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium" data-testid="hr-add-advance-btn">
                  {isRtl ? '+ إضافة سلفة/عهدة' : '+ Add Advance/Custody'}
                </button>
              )}
              {activeTab === 'salaries' && (
                <>
                  <button onClick={() => { setEditingItem(null); setSalaryForm(emptySalaryForm); setShowAddSalaryModal(true); }}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium" data-testid="hr-add-salary-btn">
                    {isRtl ? '+ إضافة راتب' : '+ Add Salary'}
                  </button>
                  <button onClick={() => { setHideAllSalaries(!hideAllSalaries); setHiddenSalaries({}); }}
                    className={`px-3 py-2 rounded-lg font-medium ${!hideAllSalaries ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    data-testid="hr-toggle-salaries-btn">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {!hideAllSalaries ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />}
                    </svg>
                  </button>
                </>
              )}
              <button onClick={handleExportExcel} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium" data-testid="hr-export-excel-btn">
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Excel {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
              </button>
              <button onClick={handleExportPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium" data-testid="hr-export-pdf-btn">
                <svg className="w-4 h-4 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                PDF {selectedItems.length > 0 ? `(${selectedItems.length})` : ''}
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-4 overflow-x-auto min-h-[500px] pb-40">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
            ) : (
              <>
                {/* Employees Table */}
                {activeTab === 'employees' && (
                  <div className="w-full">
                  <table className="w-full text-sm" data-testid="hr-employees-table">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 text-center w-8"><input type="checkbox" onChange={toggleSelectAll} checked={pageData.length > 0 && pageData.every(item => selectedItems.includes(item.id))} className="w-4 h-4 rounded" /></th>
                        <th className="p-3 text-center font-bold">#</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الاسم' : 'Name'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الرقم الوظيفي' : 'Employee ID'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الجنسية' : 'Nationality'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الشركة' : 'Company'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'المشروع' : 'Project'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'رقم الإقامة' : 'Residence ID'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'انتهاء الإقامة' : 'ID Expiry'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'انتهاء التأمين' : 'Insurance Expiry'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الديانة' : 'Religion'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.length === 0 ? (
                        <tr><td colSpan="14" className="text-center py-8 text-gray-500">{isRtl ? 'لا يوجد موظفين' : 'No employees found'}</td></tr>
                      ) : pageData.map((emp, index) => (
                        <tr key={emp.id} className={`border-b hover:bg-gray-50 ${selectedItems.includes(emp.id) ? 'bg-blue-50' : ''}`} data-testid={`hr-employee-row-${index}`}>
                          <td className="p-3 text-center"><input type="checkbox" checked={selectedItems.includes(emp.id)} onChange={() => toggleSelectItem(emp.id)} className="w-4 h-4 rounded" /></td>
                          <td className="p-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="p-3 font-medium text-slate-700 whitespace-nowrap text-center">{translateBrandingText(emp.name, isRtl)}</td>
                          <td className="p-3 font-bold text-blue-600 bg-blue-50/30 text-center rounded">{emp.employee_number || '---'}</td>
                          <td className="p-3 text-center">{emp.nationality ? translateBrandingText(emp.nationality, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{emp.company ? translateBrandingText(emp.company, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{emp.project ? translateBrandingText(emp.project, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{emp.id_number}</td>
                          <td className="p-3 font-bold text-slate-600 text-center">{formatDate(emp.id_expiry)}</td>
                          <td className="p-3 font-bold text-slate-600 text-center">{formatDate(emp.insurance_expiry)}</td>
                          <td className="p-3 text-center">{emp.religion === 'مسلم' ? (isRtl ? 'مسلم' : 'Muslim') : emp.religion === 'مسيحي' ? (isRtl ? 'مسيحي' : 'Christian') : (emp.religion || '---')}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(emp.status)}`}>
                              {emp.status === 'على رأس العمل' ? (isRtl ? 'على رأس العمل' : 'Active Duty') : emp.status === 'خروج وعودة' ? (isRtl ? 'خروج وعودة' : 'Exit & Re-entry') : emp.status === 'متغيب عن العمل' ? (isRtl ? 'متغيب عن العمل' : 'Absent') : emp.status === 'تم نقل كفالته' ? (isRtl ? 'تم نقل كفالته' : 'Sponsorship Transferred') : emp.status === 'إجازة سنوية' ? (isRtl ? 'إجازة سنوية' : 'Annual Leave') : emp.status === 'إجازة اضطرارية' ? (isRtl ? 'إجازة اضطرارية' : 'Emergency Leave') : (emp.status || (isRtl ? 'على رأس العمل' : 'Active Duty'))}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {emp.notes ? (
                              <button 
                                onClick={() => {
                                  setNotesToView({
                                    title: isRtl ? `ملاحظات الموظف: ${emp.name}` : `Employee Notes: ${emp.name}`,
                                    description: '',
                                    content: [{ text: emp.notes, date: formatDate(emp.created_at || new Date()), type: isRtl ? 'ملاحظة' : 'Note' }]
                                  });
                                  setShowNotesModal(true);
                                }} 
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-sm"
                              >
                                {isRtl ? 'عرض' : 'View'}
                              </button>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="relative flex justify-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveActionMenuId(activeActionMenuId === emp.id ? null : emp.id); }}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 focus:outline-none focus:ring-0"
                                title={isRtl ? 'المزيد من الإجراءات' : 'More Actions'}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                              </button>

                              {activeActionMenuId === emp.id && (
                                <>
                                  <div className="fixed inset-0 z-[60]" onClick={() => setActiveActionMenuId(null)}></div>
                                  <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-8 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-[65] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                    <div className="py-1">
                                      <button onClick={() => { setActiveActionMenuId(null); handlePrint(emp, 'employees'); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                        {isRtl ? 'طباعة البيانات' : 'Print Data'}
                                      </button>
                                      <div className="border-t border-slate-50 my-1"></div>
                                      <button onClick={() => { setActiveActionMenuId(null); setEditingItem(emp); setEmployeeForm({...emptyEmployeeForm, ...emp}); setShowAddEmployeeModal(true); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        {isRtl ? 'تعديل البيانات' : 'Edit Data'}
                                      </button>
                                      <div className="border-t border-slate-50 my-1"></div>
                                      <button onClick={() => { setActiveActionMenuId(null); handleDelete('employees', emp.id); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium`}>
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        {isRtl ? 'حذف الموظف' : 'Delete Employee'}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
                
                {/* Contracts Table */}
                {activeTab === 'contracts' && (
                  <div className="w-full">
                  <table className="w-full text-sm" data-testid="hr-contracts-table">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 text-center w-8"><input type="checkbox" onChange={toggleSelectAll} checked={pageData.length > 0 && pageData.every(item => selectedItems.includes(item.id))} className="w-4 h-4 rounded" /></th>
                        <th className="p-3 text-center font-bold">#</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الاسم' : 'Name'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الجنسية' : 'Nationality'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'الشركة' : 'Company'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'المشروع' : 'Project'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'مدة العقد' : 'Contract Duration'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'تاريخ البداية' : 'Start Date'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'تاريخ الانتهاء' : 'End Date'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                        <th className="p-3 text-center font-bold">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.length === 0 ? (
                        <tr><td colSpan="11" className="text-center py-8 text-gray-500">{isRtl ? 'لا يوجد عقود' : 'No contracts found'}</td></tr>
                      ) : pageData.map((contract, index) => (
                        <tr key={contract.id} className={`border-b hover:bg-gray-50 ${selectedItems.includes(contract.id) ? 'bg-blue-50' : ''}`}>
                          <td className="p-3 text-center"><input type="checkbox" checked={selectedItems.includes(contract.id)} onChange={() => toggleSelectItem(contract.id)} className="w-4 h-4 rounded" /></td>
                          <td className="p-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="p-3 font-medium text-slate-700 text-center whitespace-nowrap">{translateBrandingText(contract.employee_name, isRtl)}</td>
                          <td className="p-3 text-center">{contract.nationality ? translateBrandingText(contract.nationality, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{contract.company ? translateBrandingText(contract.company, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{contract.project ? translateBrandingText(contract.project, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{contract.contract_duration ? translateBrandingText(contract.contract_duration, isRtl) : '---'}</td>
                          <td className="p-3 text-center">{formatDate(contract.start_date)}</td>
                          <td className="p-3 text-center">{formatDate(contract.end_date)}</td>
                          <td className="p-3 text-center">
                            {contract.notes ? (
                              <button 
                                onClick={() => {
                                  setNotesToView({
                                    title: isRtl ? `ملاحظات العقد: ${contract.employee_name}` : `Contract Notes: ${contract.employee_name}`,
                                    description: '',
                                    content: [{ text: contract.notes, date: formatDate(contract.start_date), type: isRtl ? 'ملاحظة' : 'Note' }]
                                  });
                                  setShowNotesModal(true);
                                }} 
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-sm"
                              >
                                {isRtl ? 'عرض' : 'View'}
                              </button>
                            ) : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="relative flex justify-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveActionMenuId(activeActionMenuId === contract.id ? null : contract.id); }}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 focus:outline-none focus:ring-0"
                                title={isRtl ? 'المزيد من الإجراءات' : 'More Actions'}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                              </button>

                              {activeActionMenuId === contract.id && (
                                <>
                                  <div className="fixed inset-0 z-[60]" onClick={() => setActiveActionMenuId(null)}></div>
                                  <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-8 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-[65] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                    <div className="py-1">
                                      <button onClick={() => { setActiveActionMenuId(null); handlePrint(contract, 'contracts'); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                        {isRtl ? 'طباعة العقد' : 'Print Contract'}
                                      </button>
                                      <div className="border-t border-slate-50 my-1"></div>
                                      <button onClick={() => { setActiveActionMenuId(null); setEditingItem(contract); setContractForm({...emptyContractForm, ...contract}); setShowAddContractModal(true); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        {isRtl ? 'تعديل العقد' : 'Edit Contract'}
                                      </button>
                                      <div className="border-t border-slate-50 my-1"></div>
                                      <button onClick={() => { setActiveActionMenuId(null); handleDelete('contracts', contract.id); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium`}>
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        {isRtl ? 'حذف السجل' : 'Delete Record'}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
                
                {/* Salaries Table */}
                {activeTab === 'salaries' && (
                  <>
                    <div className="w-full">
                    <table className="w-full text-sm" data-testid="hr-salaries-table">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="p-3 text-center w-8"><input type="checkbox" onChange={toggleSelectAll} checked={pageData.length > 0 && pageData.every(item => selectedItems.includes(item.id))} className="w-4 h-4 rounded" /></th>
                          <th className="p-3 text-center font-bold">#</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الاسم' : 'Name'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'المشروع' : 'Project'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الشركة' : 'Company'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الراتب الأساسي' : 'Basic Salary'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'بدل السكن' : 'Housing Allowance'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'بدل التنقل' : 'Transport Allowance'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'بدلات أخرى' : 'Other Allowances'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'وقت إضافي' : 'Overtime'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'مكافأة' : 'Bonus'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الخصومات' : 'Deductions'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الإجمالي' : 'Gross'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الصافي' : 'Net'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'الشهر' : 'Month'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                          <th className="p-3 text-center font-bold">{isRtl ? 'إجراءات' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pageData.length === 0 ? (
                          <tr><td colSpan="17" className="text-center py-8 text-gray-500">{isRtl ? 'لا يوجد رواتب' : 'No salaries found'}</td></tr>
                        ) : pageData.map((salary, index) => {
                          const isHidden = isSalaryHidden(salary.id);
                          const gross = (salary.basic_salary || 0) + (salary.housing_allowance || 0) + (salary.transport_allowance || 0) + (salary.other_allowances || 0) + (salary.overtime || 0) + (salary.bonus || 0);
                          const deduction = salary.deduction_amount || 0;
                          const net = gross - deduction;
                          return (
                            <tr key={salary.id} className={`border-b hover:bg-gray-50 ${selectedItems.includes(salary.id) ? 'bg-blue-50' : ''}`}>
                              <td className="p-3 text-center"><input type="checkbox" checked={selectedItems.includes(salary.id)} onChange={() => toggleSelectItem(salary.id)} className="w-4 h-4 rounded" /></td>
                              <td className="p-3 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td className="p-3 font-medium text-slate-700 text-center whitespace-nowrap">{translateBrandingText(salary.employee_name, isRtl)}</td>
                              <td className="p-3 text-center">{salary.project ? translateBrandingText(salary.project, isRtl) : '---'}</td>
                              <td className="p-3 text-center">{salary.company ? translateBrandingText(salary.company, isRtl) : '---'}</td>
                              <td className="p-3 text-center">{isHidden ? '****' : `${salary.basic_salary?.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-center">{isHidden ? '****' : `${salary.housing_allowance?.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-center">{isHidden ? '****' : `${salary.transport_allowance?.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-center">{isHidden ? '****' : `${salary.other_allowances?.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-indigo-600 text-center">{isHidden ? '****' : `${(salary.overtime || 0).toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-teal-600 text-center">{isHidden ? '****' : `${(salary.bonus || 0).toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-red-600 text-center">{isHidden ? '****' : deduction > 0 ? `${deduction.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}` : '-'}{!isHidden && salary.deduction_type ? <span className="block text-xs text-gray-400">{salary.deduction_type === 'غياب' ? (isRtl ? 'غياب' : 'Absence') : salary.deduction_type === 'تأخر' ? (isRtl ? 'تأخر' : 'Late') : salary.deduction_type === 'إجازة بدون راتب' ? (isRtl ? 'إجازة بدون راتب' : 'Unpaid Leave') : salary.deduction_type === 'إجازة سنوية مدفوعة الأجر' ? (isRtl ? 'إجازة سنوية مدفوعة الأجر' : 'Paid Annual Leave') : salary.deduction_type}</span> : ''}</td>
                              <td className="p-3 font-bold text-blue-700 text-center">{isHidden ? '****' : `${gross.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 font-bold text-green-700 text-center">{isHidden ? '****' : `${net.toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}`}</td>
                              <td className="p-3 text-center">{months.find(m => m.value === salary.month)?.label} {salary.year}</td>
                              <td className="p-3 text-center">
                                {salary.notes ? (
                                  <button 
                                    onClick={() => {
                                      setNotesToView({
                                        title: isRtl ? `ملاحظات الراتب: ${salary.employee_name}` : `Salary Notes: ${salary.employee_name}`,
                                        description: `${months.find(m => m.value === salary.month)?.label} ${salary.year}`,
                                        content: [{ text: salary.notes, date: salary.date || new Date().toISOString().split('T')[0], type: isRtl ? 'ملاحظة' : 'Note' }]
                                      });
                                      setShowNotesModal(true);
                                    }} 
                                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 shadow-sm"
                                  >
                                    {isRtl ? 'عرض' : 'View'}
                                  </button>
                                ) : '-'}
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex gap-2 justify-center items-center">
                                  {/* Quick visibility toggle outside menu */}
                                  <button onClick={() => toggleSalaryVisibility(salary.id)}
                                    className={`p-2 rounded-lg transition-all border ${!isHidden ? 'bg-blue-600 text-white border-blue-700 shadow-blue-100' : 'bg-slate-900 text-white border-slate-950 shadow-slate-200'} shadow-md`} 
                                    title={isHidden ? (isRtl ? 'إظهار القيم' : 'Show Values') : (isRtl ? 'إخفاء القيم' : 'Hide Values')}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {!isHidden ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18" />
                                      )}
                                    </svg>
                                  </button>

                                  <div className="relative">
                                    <button 
                                      onClick={(e) => { e.stopPropagation(); setActiveActionMenuId(activeActionMenuId === salary.id ? null : salary.id); }}
                                      className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                                      title={isRtl ? 'المزيد من الإجراءات' : 'More Actions'}
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                    </button>

                                    {activeActionMenuId === salary.id && (
                                      <>
                                        <div className="fixed inset-0 z-[60]" onClick={() => setActiveActionMenuId(null)}></div>
                                        <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-44 bg-white rounded-xl shadow-2xl border border-slate-100 z-[65] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                          <div className="py-1">
                                            <button onClick={() => { setActiveActionMenuId(null); handlePrint(salary, 'salaries'); }}
                                              className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                              {isRtl ? 'كشف الراتب' : 'Payslip'}
                                            </button>
                                            <div className="border-t border-slate-50 my-1"></div>
                                            <button onClick={() => { setActiveActionMenuId(null); setEditingItem(salary); setSalaryForm({...emptySalaryForm, ...salary}); setShowAddSalaryModal(true); }}
                                              className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                              {isRtl ? 'تعديل الراتب' : 'Edit Salary'}
                                            </button>
                                            <div className="border-t border-slate-50 my-1"></div>
                                            <button onClick={() => { setActiveActionMenuId(null); handleDelete('salaries', salary.id); }}
                                              className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium`}>
                                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                              {isRtl ? 'حذف السجل' : 'Delete Record'}
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                    <div className="mt-4 p-4 bg-slate-100 rounded-lg flex justify-between items-center">
                      <span className="font-bold text-slate-700">{isRtl ? 'إجمالي الرواتب:' : 'Total Salaries:'}</span>
                      <span className="text-xl font-bold text-green-700">
                        {!hideAllSalaries ? `${calculateTotalSalaries().toLocaleString()} ${isRtl ? 'ر.س' : 'SAR'}` : '****'}
                      </span>
                    </div>
                  </>
                )}
                
                {/* Advances/Custodies Table */}
                {activeTab === 'advances_custodies' && (
                  <>
                    {/* 'Hide completed' checkbox hidden as requested */}
                    <div className="w-full">
                    <table className="w-full text-sm" data-testid="hr-advances-table">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 text-center w-8"><input type="checkbox" onChange={toggleSelectAll} checked={pageData.length > 0 && pageData.every(item => selectedItems.includes(item.id))} className="w-4 h-4 rounded" /></th>
                        <th className="p-3 text-center font-bold">#</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'الاسم' : 'Name'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'الرقم الوظيفي' : 'Employee ID'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'النوع' : 'Type'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'الشركة' : 'Company'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'المشروع' : 'Project'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'المبلغ' : 'Amount'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'المتبقي' : 'Remaining'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'الوصف' : 'Description'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'التاريخ' : 'Date'}</th>
                        <th className="p-3 font-bold border text-center whitespace-nowrap">{isRtl ? 'تاريخ الإرجاع/الإجراء' : 'Return/Action Date'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'الحالة' : 'Status'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'ملاحظات' : 'Notes'}</th>
                        <th className="p-3 font-bold border text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageData.length === 0 ? (
                        <tr><td colSpan="15" className="text-center py-8 text-gray-500">{isRtl ? 'لا يوجد بيانات' : 'No data found'}</td></tr>
                      ) : pageData.map((item, index) => (
                        <tr key={item.id} className={`border-b hover:bg-gray-50 ${selectedItems.includes(item.id) ? 'bg-blue-50' : ''}`}>
                          <td className="p-3 text-center"><input type="checkbox" checked={selectedItems.includes(item.id)} onChange={() => toggleSelectItem(item.id)} className="w-4 h-4 rounded" /></td>
                          <td className="p-3">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="p-3 font-medium text-slate-800 border text-center">{translateBrandingText(item.employee_name, isRtl)}</td>
                          <td className="p-3 font-bold text-blue-700 bg-blue-50/50 border text-center">{item.employee_number || '---'}</td>
                          <td className="p-3 border text-center"><span className={`px-2 py-1 rounded-full text-xs ${item.type === 'سلفة' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>{item.type === 'سلفة' ? (isRtl ? 'سلفة' : 'Advance') : (isRtl ? 'عهدة' : 'Custody')}</span></td>
                          <td className="p-3 border text-center">{translateBrandingText(item.company, isRtl)}</td>
                          <td className="p-3 border text-center">{translateBrandingText(item.project, isRtl)}</td>
                          <td className="p-3 font-bold text-slate-700 border text-center">{item.amount > 0 ? `${item.amount} ${isRtl ? 'ر.س' : 'SAR'}` : '-'}</td>
                          <td className="p-3 font-bold text-red-600 border text-center">
                            {(item.amount > 0 && item.paid_amount > 0) ? `${(item.amount - item.paid_amount)} ${isRtl ? 'ر.س' : 'SAR'}` : item.amount > 0 && item.status === 'غير مسددة' ? `${item.amount} ${isRtl ? 'ر.س' : 'SAR'}` : '-'}
                          </td>
                          <td className="p-3 max-w-[150px] truncate border text-center">{item.item_description ? translateBrandingText(item.item_description, isRtl) : '-'}</td>
                          <td className="p-3 border text-center">{item.date}</td>
                          <td className="p-3 text-gray-500 border text-center">{item.action_date || '-'}</td>
                          <td className="p-3 border text-center">
                            <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'عهدة الموظف' ? 'bg-blue-100 text-blue-700' : ['مسددة', 'عهدة الشركة', 'تم تصفية العهدة', 'مرتجعة'].includes(item.status) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {item.status === 'عهدة الموظف' ? (isRtl ? 'عهدة الموظف' : "Employee's Custody") : item.status === 'مسددة' ? (isRtl ? 'مسددة' : 'Paid') : (item.status === 'مسددة جزئياً' || item.status === 'مسددة جزئيا') ? (isRtl ? 'مسددة جزئياً' : 'Partially Paid') : item.status === 'عهدة الشركة' ? (isRtl ? 'عهدة الشركة' : "Company's Custody") : item.status === 'تم تصفية العهدة' ? (isRtl ? 'تم تصفية العهدة' : 'Custody Liquidated') : item.status === 'مرتجعة' ? (isRtl ? 'تم اعادة العهدة' : 'Custody Returned') : (isRtl ? (item.status || 'غير مسددة') : (item.status === 'غير مسددة' ? 'Unpaid' : item.status))}
                            </span>
                          </td>
                          <td className="p-3 border text-center">
                            {(() => {
                              const hasAdvanceNote = item.notes && item.notes.trim();
                              const hasPaymentNotes = item.payment_history?.some(p => p.notes && p.notes.trim());
                              const hasAny = hasAdvanceNote || hasPaymentNotes;
                              
                              return (
                                <button 
                                  onClick={() => {
                                    const content = [];
                                    if (hasAdvanceNote) content.push({ type: isRtl ? 'سجل' : 'Record', date: item.date, text: item.notes, amount: item.amount });
                                    if (item.payment_history) {
                                      item.payment_history.forEach(p => {
                                        content.push({ 
                                          type: isRtl ? 'دفعة' : 'Payment', 
                                          date: p.date, 
                                          text: p.notes || (isRtl ? '(بدون ملاحظات)' : '(No notes)'), 
                                          amount: p.amount,
                                          hasNote: !!(p.notes && p.notes.trim())
                                        });
                                      });
                                    }
                                    setNotesToView({ 
                                      title: isRtl ? `السجل المالي: ${item.employee_name}` : `Financial Record: ${item.employee_name}`, 
                                      description: item.item_description,
                                      content: content 
                                    });
                                    setShowNotesModal(true);
                                  }} 
                                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors border shadow-sm ${
                                    hasAny 
                                      ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300' 
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-400 border-slate-200'
                                  }`}
                                >
                                  {isRtl ? 'عرض' : 'View'}
                                </button>
                              );
                            })()}
                          </td>
                          <td className="p-3 border text-center">
                            <div className="relative flex justify-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setActiveActionMenuId(activeActionMenuId === item.id ? null : item.id); }}
                                className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-500 focus:outline-none focus:ring-0"
                                title={isRtl ? 'المزيد من الإجراءات' : 'More Actions'}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                              </button>

                              {activeActionMenuId === item.id && (
                                <>
                                  <div className="fixed inset-0 z-[60]" onClick={() => setActiveActionMenuId(null)}></div>
                                  <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-8 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 z-[65] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200`}>
                                    <div className="py-1">
                                      <button onClick={() => { setActiveActionMenuId(null); setEditingItem(null); setAdvanceCustodyForm({...emptyAdvanceCustodyForm, employee_name: item.employee_name, employee_number: item.employee_number, project: item.project, company: item.company}); setShowAddAdvanceCustodyModal(true); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        {isRtl ? 'إضافة جديد للموظف' : 'Add New for Employee'}
                                      </button>
                                      <button onClick={() => { setActiveActionMenuId(null); setSelectedAdvance(item); setShowPaymentHistoryModal(true); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {isRtl ? 'سجل الإجراءات والدفعات' : 'Action & Payment History'}
                                      </button>
                                      <button onClick={() => { setActiveActionMenuId(null); setEditingItem(item); setAdvanceCustodyForm({...emptyAdvanceCustodyForm, ...item}); setShowAddAdvanceCustodyModal(true); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors`}>
                                        <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        {isRtl ? 'تعديل السجل الحالي' : 'Edit Current Record'}
                                      </button>
                                      <div className="border-t border-slate-50 my-1"></div>
                                      <button onClick={() => { setActiveActionMenuId(null); handleDelete('advances-custodies', item.id); }}
                                        className={`w-full ${isRtl ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-medium`}>
                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        {isRtl ? 'حذف السجل نهائياً' : 'Delete Record Permanently'}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                </>
              )}
                
                {/* Pagination */}
                {totalItems > 0 && (
                  <div className="mt-4 pt-4 border-t" data-testid="hr-pagination">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleLimitChange}
                      itemsPerPageOptions={[10, 15, 25, 50, 100]}
                      itemLabel={activeTab === 'employees' ? (isRtl ? 'موظف' : 'Employee') : activeTab === 'contracts' ? (isRtl ? 'عقد' : 'Contract') : activeTab === 'salaries' ? (isRtl ? 'راتب' : 'Salary') : (isRtl ? 'سلفة/عهدة' : 'Advance/Custody')}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Modal: Add/Edit Employee */}
        {showAddEmployeeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="hr-employee-modal">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingItem ? (isRtl ? 'تعديل موظف' : 'Edit Employee') : (isRtl ? 'إضافة موظف جديد' : 'Add New Employee')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الاسم *' : 'Name *'}</label>
                  <input value={employeeForm.name} onChange={e => setEmployeeForm({...employeeForm, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" data-testid="hr-employee-name-input" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الرقم الوظيفي' : 'Employee ID'}</label>
                  <input value={employeeForm.employee_number} onChange={e => setEmployeeForm({...employeeForm, employee_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg" data-testid="hr-employee-number-input" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الجنسية' : 'Nationality'}</label>
                  <input value={employeeForm.nationality} onChange={e => setEmployeeForm({...employeeForm, nationality: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الشركة' : 'Company'}</label>
                  <input value={employeeForm.company} onChange={e => setEmployeeForm({...employeeForm, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المشروع' : 'Project'}</label>
                  <select value={employeeForm.project} onChange={e => setEmployeeForm({...employeeForm, project: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">{isRtl ? 'بدون مشروع' : 'No Project'}</option>
                    {projects.map(p => <option key={p.id || p.name} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)}
                  </select></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'رقم الإقامة' : 'Residence ID'}</label>
                  <input value={employeeForm.id_number} onChange={e => setEmployeeForm({...employeeForm, id_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'انتهاء الإقامة' : 'ID Expiry'}</label>
                  <input type="date" value={employeeForm.id_expiry} onChange={e => setEmployeeForm({...employeeForm, id_expiry: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'انتهاء التأمين' : 'Insurance Expiry'}</label>
                  <input type="date" value={employeeForm.insurance_expiry} onChange={e => setEmployeeForm({...employeeForm, insurance_expiry: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الديانة' : 'Religion'}</label>
                  <input value={employeeForm.religion} onChange={e => setEmployeeForm({...employeeForm, religion: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select value={employeeForm.status} onChange={e => setEmployeeForm({...employeeForm, status: e.target.value})} className="w-full px-3 py-2 border rounded-lg" data-testid="hr-employee-status-select">
                    {EMPLOYEE_STATUSES.map(s => {
                      let label = s;
                      if (!isRtl) {
                        if (s === 'على رأس العمل') label = 'Active Duty';
                        else if (s === 'خروج وعودة') label = 'Exit & Re-entry';
                        else if (s === 'متغيب عن العمل') label = 'Absent';
                        else if (s === 'تم نقل كفالته') label = 'Sponsorship Transferred';
                        else if (s === 'إجازة سنوية') label = 'Annual Leave';
                        else if (s === 'إجازة اضطرارية') label = 'Emergency Leave';
                      }
                      return <option key={s} value={s}>{label}</option>;
                    })}
                  </select></div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-600 mb-1">{isRtl ? 'ملاحظات على الموظف' : 'Employee Notes'}</label>
                  <textarea value={employeeForm.notes} onChange={e => setEmployeeForm({...employeeForm, notes: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg" placeholder={isRtl ? "اكتب أي ملاحظات إضافية هنا..." : "Type any additional notes here..."}></textarea>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowAddEmployeeModal(false); setEditingItem(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSaveEmployee} className="px-4 py-2 bg-slate-600 text-white rounded-lg" data-testid="hr-employee-save-btn">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal: Add/Edit Contract */}
        {showAddContractModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="hr-contract-modal">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingItem ? (isRtl ? 'تعديل عقد' : 'Edit Contract') : (isRtl ? 'إضافة عقد جديد' : 'Add New Contract')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'اسم الموظف *' : 'Employee Name *'}</label>
                  <input value={contractForm.employee_name} onChange={e => setContractForm({...contractForm, employee_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الجنسية' : 'Nationality'}</label>
                  <input value={contractForm.nationality} onChange={e => setContractForm({...contractForm, nationality: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الشركة' : 'Company'}</label>
                  <input value={contractForm.company} onChange={e => setContractForm({...contractForm, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المشروع' : 'Project'}</label>
                  <select value={contractForm.project} onChange={e => setContractForm({...contractForm, project: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">{isRtl ? 'بدون مشروع' : 'No Project'}</option>
                    {projects.map(p => <option key={p.id || p.name} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)}
                  </select></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'مدة العقد' : 'Contract Duration'}</label>
                  <input value={contractForm.contract_duration} onChange={e => setContractForm({...contractForm, contract_duration: e.target.value})} placeholder={isRtl ? "مثال: سنة واحدة" : "e.g., 1 year"} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'تاريخ البداية' : 'Start Date'}</label>
                  <input type="date" value={contractForm.start_date} onChange={e => setContractForm({...contractForm, start_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'تاريخ الانتهاء' : 'End Date'}</label>
                  <input type="date" value={contractForm.end_date} onChange={e => setContractForm({...contractForm, end_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                  <textarea value={contractForm.notes} onChange={e => setContractForm({...contractForm, notes: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg"></textarea></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowAddContractModal(false); setEditingItem(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSaveContract} className="px-4 py-2 bg-slate-600 text-white rounded-lg" data-testid="hr-contract-save-btn">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal: Add/Edit Salary */}
        {showAddSalaryModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="hr-salary-modal">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingItem ? (isRtl ? 'تعديل راتب' : 'Edit Salary') : (isRtl ? 'إضافة راتب جديد' : 'Add New Salary')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'اسم الموظف *' : 'Employee Name *'}</label>
                  <input value={salaryForm.employee_name} onChange={e => setSalaryForm({...salaryForm, employee_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المشروع' : 'Project'}</label>
                  <select value={salaryForm.project} onChange={e => setSalaryForm({...salaryForm, project: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">{isRtl ? 'بدون مشروع' : 'No Project'}</option>
                    {projects.map(p => <option key={p.id || p.name} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)}
                  </select></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الشركة' : 'Company'}</label>
                  <input value={salaryForm.company} onChange={e => setSalaryForm({...salaryForm, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الراتب الأساسي' : 'Basic Salary'}</label>
                  <input type="number" value={salaryForm.basic_salary} onChange={e => setSalaryForm({...salaryForm, basic_salary: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'بدل السكن' : 'Housing Allowance'}</label>
                  <input type="number" value={salaryForm.housing_allowance} onChange={e => setSalaryForm({...salaryForm, housing_allowance: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'بدل التنقل' : 'Transport Allowance'}</label>
                  <input type="number" value={salaryForm.transport_allowance} onChange={e => setSalaryForm({...salaryForm, transport_allowance: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'بدلات أخرى' : 'Other Allowances'}</label>
                  <input type="number" value={salaryForm.other_allowances} onChange={e => setSalaryForm({...salaryForm, other_allowances: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'وقت إضافي' : 'Overtime'}</label>
                  <input type="number" value={salaryForm.overtime} onChange={e => setSalaryForm({...salaryForm, overtime: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'مكافأة' : 'Bonus'}</label>
                  <input type="number" value={salaryForm.bonus} onChange={e => setSalaryForm({...salaryForm, bonus: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الخصومات' : 'Deductions'}</label>
                  <select value={salaryForm.deduction_type} onChange={e => setSalaryForm({...salaryForm, deduction_type: e.target.value, deduction_amount: e.target.value ? salaryForm.deduction_amount : 0})} className="w-full px-3 py-2 border rounded-lg" data-testid="hr-salary-deduction-type">
                    <option value="">{isRtl ? 'بدون خصم' : 'No Deduction'}</option>
                    <option value="غياب">{isRtl ? 'غياب' : 'Absence'}</option>
                    <option value="تأخر">{isRtl ? 'تأخر' : 'Late'}</option>
                    <option value="إجازة بدون راتب">{isRtl ? 'إجازة بدون راتب' : 'Unpaid Leave'}</option>
                    <option value="إجازة سنوية مدفوعة الأجر">{isRtl ? 'إجازة سنوية مدفوعة الأجر' : 'Paid Annual Leave'}</option>
                  </select></div>
                {salaryForm.deduction_type && (
                  <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'مبلغ الخصم' : 'Deduction Amount'}</label>
                    <input type="number" value={salaryForm.deduction_amount} onChange={e => setSalaryForm({...salaryForm, deduction_amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg border-red-300" data-testid="hr-salary-deduction-amount" /></div>
                )}
                {salaryForm.deduction_type && salaryForm.deduction_amount > 0 && (
                  <div className="col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                    <div className="flex justify-between"><span>{isRtl ? 'الإجمالي قبل الخصم:' : 'Gross Total:'}</span><span className="font-bold">{((salaryForm.basic_salary || 0) + (salaryForm.housing_allowance || 0) + (salaryForm.transport_allowance || 0) + (salaryForm.other_allowances || 0) + (salaryForm.overtime || 0) + (salaryForm.bonus || 0)).toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</span></div>
                    <div className="flex justify-between text-red-600"><span>{isRtl ? 'الخصم' : 'Deduction'} ({salaryForm.deduction_type === 'غياب' ? (isRtl ? 'غياب' : 'Absence') : salaryForm.deduction_type === 'تأخر' ? (isRtl ? 'تأخر' : 'Late') : salaryForm.deduction_type === 'إجازة بدون راتب' ? (isRtl ? 'إجازة بدون راتب' : 'Unpaid Leave') : salaryForm.deduction_type === 'إجازة سنوية مدفوعة الأجر' ? (isRtl ? 'إجازة سنوية مدفوعة الأجر' : 'Paid Annual Leave') : salaryForm.deduction_type}):</span><span className="font-bold">- {salaryForm.deduction_amount.toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</span></div>
                    <div className="flex justify-between border-t border-yellow-300 pt-1 mt-1 text-green-700 font-bold"><span>{isRtl ? 'الصافي:' : 'Net Salary:'}</span><span>{((salaryForm.basic_salary || 0) + (salaryForm.housing_allowance || 0) + (salaryForm.transport_allowance || 0) + (salaryForm.other_allowances || 0) + (salaryForm.overtime || 0) + (salaryForm.bonus || 0) - (salaryForm.deduction_amount || 0)).toLocaleString()} {isRtl ? 'ر.س' : 'SAR'}</span></div>
                  </div>
                )}
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الشهر' : 'Month'}</label>
                  <select value={salaryForm.month} onChange={e => setSalaryForm({...salaryForm, month: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg">
                    {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'السنة' : 'Year'}</label>
                  <input type="number" value={salaryForm.year} onChange={e => setSalaryForm({...salaryForm, year: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                  <textarea value={salaryForm.notes} onChange={e => setSalaryForm({...salaryForm, notes: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg"></textarea></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowAddSalaryModal(false); setEditingItem(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSaveSalary} className="px-4 py-2 bg-slate-600 text-white rounded-lg" data-testid="hr-salary-save-btn">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add/Edit Advance/Custody */}
        {showAddAdvanceCustodyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="hr-advance-modal">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">{editingItem ? (isRtl ? 'تعديل سلفة/عهدة' : 'Edit Advance/Custody') : (isRtl ? 'إضافة سلفة/عهدة جديدة' : 'Add New Advance/Custody')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'اسم الموظف *' : 'Employee Name *'}</label>
                  <input value={advanceCustodyForm.employee_name} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, employee_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الرقم الوظيفي' : 'Employee ID'}</label>
                  <input value={advanceCustodyForm.employee_number || ''} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, employee_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg font-bold text-blue-700" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'النوع' : 'Type'}</label>
                  <select value={advanceCustodyForm.type} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, type: e.target.value, status: e.target.value === 'سلفة' ? 'غير مسددة' : 'عهدة الموظف'})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="سلفة">{isRtl ? 'سلفة' : 'Advance'}</option>
                    <option value="عهدة">{isRtl ? 'عهدة' : 'Custody'}</option>
                  </select></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الشركة' : 'Company'}</label>
                  <input value={advanceCustodyForm.company} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المشروع' : 'Project'}</label>
                  <select value={advanceCustodyForm.project} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, project: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">{isRtl ? 'بدون مشروع' : 'No Project'}</option>
                    {projects.map(p => <option key={p.id || p.name} value={p.name}>{translateBrandingText(p.name, isRtl)}</option>)}
                  </select></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المبلغ (اختياري)' : 'Amount (Optional)'}</label>
                  <input type="number" value={advanceCustodyForm.amount} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الوصف' : 'Description'}</label>
                  <input value={advanceCustodyForm.item_description} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, item_description: e.target.value})} placeholder={isRtl ? "مثال: لابتوب، عهدة مالية، الخ..." : "e.g., Laptop, financial custody, etc..."} className="w-full px-3 py-2 border rounded-lg" /></div>
                
                {advanceCustodyForm.status === 'مسددة جزئياً' && (
                  <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المبلغ المسدد' : 'Paid Amount'}</label>
                    <input type="number" value={advanceCustodyForm.paid_amount} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, paid_amount: Number(e.target.value), remaining_amount: advanceCustodyForm.amount - Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg" /></div>
                )}
                {advanceCustodyForm.status === 'مسددة جزئياً' && (
                  <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'المتبقي' : 'Remaining'}</label>
                    <input type="number" value={advanceCustodyForm.amount - (advanceCustodyForm.paid_amount || 0)} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-100" /></div>
                )}

                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'التاريخ' : 'Date'}</label>
                  <input type="date" value={advanceCustodyForm.date} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'الحالة' : 'Status'}</label>
                  <select value={advanceCustodyForm.status} onChange={e => {
                    const newStatus = e.target.value;
                    const isCompleted = ['مسددة', 'مسددة جزئياً', 'عهدة الشركة', 'مفقودة من الموظف', 'تالفة من الموظف', 'تم تصفية العهدة'].includes(newStatus);
                    const isReset = ['غير مسددة', 'عهدة الموظف'].includes(newStatus);
                    setAdvanceCustodyForm({
                      ...advanceCustodyForm, 
                      status: newStatus,
                      action_date: isReset ? '' : (isCompleted && !advanceCustodyForm.action_date) ? new Date().toISOString().split('T')[0] : advanceCustodyForm.action_date
                    });
                  }} className="w-full px-3 py-2 border rounded-lg">
                    {advanceCustodyForm.type === 'سلفة' ? (
                      <>
                        <option value="غير مسددة">{isRtl ? 'غير مسددة' : 'Unpaid'}</option>
                        <option value="مسددة جزئياً">{isRtl ? 'مسددة جزئياً' : 'Partially Paid'}</option>
                        <option value="مسددة">{isRtl ? 'مسددة' : 'Paid'}</option>
                      </>
                    ) : (
                      <>
                        <option value="عهدة الموظف">{isRtl ? 'عهدة الموظف' : "Employee's Custody"}</option>
                        <option value="عهدة الشركة">{isRtl ? 'عهدة الشركة' : "Company's Custody"}</option>
                        <option value="مفقودة من الموظف">{isRtl ? 'مفقودة من الموظف' : 'Lost by Employee'}</option>
                        <option value="تالفة من الموظف">{isRtl ? 'تالفة من الموظف' : 'Damaged by Employee'}</option>
                        <option value="تم تصفية العهدة">{isRtl ? 'تم تصفية العهدة' : 'Custody Cleared'}</option>
                      </>
                    )}
                  </select></div>
                  
                {['مسددة', 'مسددة جزئياً', 'مرتجعة', 'مفقودة', 'تالفة', 'تم تصفية العهدة'].includes(advanceCustodyForm.status) && (
                  <div><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'تاريخ الإجراء / الإرجاع / السداد' : 'Action / Return / Payment Date'}</label>
                    <input type="date" value={advanceCustodyForm.action_date} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, action_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                )}
                
                <div className="col-span-2"><label className="block text-sm text-gray-600 mb-1">{isRtl ? 'ملاحظات' : 'Notes'}</label>
                  <textarea value={advanceCustodyForm.notes} onChange={e => setAdvanceCustodyForm({...advanceCustodyForm, notes: e.target.value})} rows="2" className="w-full px-3 py-2 border rounded-lg"></textarea></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => { setShowAddAdvanceCustodyModal(false); setEditingItem(null); }} className="px-4 py-2 bg-gray-200 rounded-lg">{isRtl ? 'إلغاء' : 'Cancel'}</button>
                <button onClick={handleSaveAdvanceCustody} className="px-4 py-2 bg-slate-600 text-white rounded-lg" data-testid="hr-advance-save-btn">{isRtl ? 'حفظ' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal: Action & Payment History */}
        {showPaymentHistoryModal && selectedAdvance && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">سجل الإجراءات والدفعات - {selectedAdvance.employee_name}</h3>
              
              {!['مسددة', 'عهدة الشركة', 'تالفة', 'تم تصفية العهدة'].includes(selectedAdvance.status) && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-bold mb-3 text-slate-700">
                    {selectedAdvance.type === 'سلفة' ? `إضافة دفعة سداد جديدة (مبلغ السلفة: ${selectedAdvance.amount} ر.س)` : `تسجيل إرجاع / ملاحظة على العهدة (${selectedAdvance.item_description})`}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                    {selectedAdvance.type === 'سلفة' && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">المبلغ</label>
                        <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">التاريخ</label>
                      <input type="date" value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                    </div>
                    <div>
                      <button onClick={handleSavePayment} className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 transition-colors text-white rounded-lg font-bold flex justify-center items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        {selectedAdvance.type === 'سلفة' ? 'تسجيل الدفعة' : 'تأكيد الإرجاع'}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <input type="text" placeholder="ملاحظات الإجراء (اختياري)..." value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none" />
                  </div>
                </div>
              )}
              
              <h4 className="font-bold mb-3 text-green-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                سجل العمليات التاريخي لهذا البند
              </h4>
              <div className="mb-6 overflow-hidden rounded-lg border border-green-200">
                <div className="w-full">
                <table className="w-full text-sm text-center">
                  <thead className="bg-green-50 border-b border-green-100">
                    <tr>
                      <th className="p-2 font-bold">التاريخ</th>
                      <th className="p-2 font-bold">{selectedAdvance.type === 'سلفة' ? 'المبلغ المسدد' : 'الإجراء / ملاحظة'}</th>
                      <th className="p-2 font-bold">الملاحظات</th>
                      <th className="p-2 font-bold">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!selectedAdvance.payment_history || selectedAdvance.payment_history.length === 0) ? (
                      <tr><td colSpan="4" className="p-4 text-gray-400">لا يوجد سجل عمليات مسجل لهذا البند</td></tr>
                    ) : selectedAdvance.payment_history.map((p, idx) => (
                      <tr key={idx} className="border-b last:border-b-0">
                        <td className="p-2">{p.date}</td>
                        <td className="p-2 font-bold text-green-600">{p.amount} ر.س</td>
                        <td className="p-2 text-gray-500">
                          {p.notes ? (
                            <button 
                              onClick={() => window.alert(`ملاحظة الدفعة: ${p.notes}`)} 
                              className="px-2 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 rounded border border-green-200 text-xs font-bold"
                            >
                              عرض
                            </button>
                          ) : '-'}
                        </td>
                        <td className="p-2">
                          <button onClick={() => handleDeletePayment(p.id)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف الدفعة">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>

              <h4 className="font-bold mb-3 text-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                السجل التاريخي الشامل (مقسم حسب السلف والعهد)
              </h4>
              {employeeLedgerGroups.length === 0 ? (
                <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed">لا يوجد سجل تاريخي لهذا الموظف</div>
              ) : (
                <div className="space-y-4">
                  {employeeLedgerGroups.map((group, gIdx) => (
                    <div key={group.id || gIdx} className={`border rounded-lg overflow-hidden ${group.status === 'مسددة' || group.status === 'تم تصفية العهدة' || group.status === 'مرتجعة' ? 'opacity-75 border-gray-200' : 'border-blue-200 shadow-sm'}`}>
                      <div className={`p-3 flex justify-between items-center ${group.status === 'مسددة' || group.status === 'تم تصفية العهدة' || group.status === 'مرتجعة' ? 'bg-gray-100' : 'bg-blue-50'}`}>
                        <div className="flex gap-4">
                          <span className="font-bold text-slate-800">{group.type}: {group.amount || '-'} ر.س</span>
                          <span className="text-sm text-gray-600">التاريخ: {group.date}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${group.status === 'مسددة' || group.status === 'مرتجعة' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {group.status}
                          </span>
                          <button onClick={() => handleDelete('advances-custodies', group.id)} className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors" title="حذف السجل بالكامل">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                      <div className="p-3 bg-white text-sm">
                        <div className="mb-2 text-gray-600 italic">الوصف: {group.item_description || '-'}</div>
                        {group.payments.length > 0 ? (
                          <div className="border-t pt-2 mt-2">
                            <div className="text-xs font-bold text-slate-400 mb-1">دفعات السداد:</div>
                            <div className="grid grid-cols-1 gap-1">
                              {group.payments.map((p, pIdx) => (
                                <div key={pIdx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-xs">
                                  <span>{selectedAdvance.type === 'سلفة' ? 'دفعة بتاريخ' : 'إجراء بتاريخ'} {p.date}</span>
                                  <span className="font-bold text-green-600">{p.amount ? `${p.amount} ر.س` : 'إرجاع / تحديث'}</span>
                                  <span className="text-gray-400">
                                    {p.notes ? (
                                      <button onClick={() => {
                                        setNotesToView({
                                          title: `تفاصيل الإجراء: ${selectedAdvance.employee_name}`,
                                          description: selectedAdvance.item_description,
                                          content: [{ text: p.notes, date: p.date, type: 'إجراء' }]
                                        });
                                        setShowNotesModal(true);
                                      }} className="text-blue-600 hover:underline">عرض</button>
                                    ) : '-'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : group.type === 'سلفة' && (
                          <div className="text-xs text-red-400 italic">لا توجد دفعات سداد مسجلة لهذا البند</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end mt-6 pt-4 border-t">
                <button onClick={() => { setShowPaymentHistoryModal(false); setSelectedAdvance(null); }} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 transition-colors text-slate-800 rounded-lg font-medium">إغلاق نافذة السجل</button>
              </div>
            </div>
          </div>
        )}

        {/* Notes History Modal */}
        {showNotesModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  {notesToView.title}
                </h3>
                <button onClick={() => setShowNotesModal(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {notesToView.description && (
                  <div className="mb-6 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="text-[10px] uppercase tracking-wider text-blue-500 font-black mb-1">وصف العهدة/السلفة</div>
                    <div className="text-sm text-blue-900 italic font-medium leading-relaxed">{notesToView.description}</div>
                  </div>
                )}
                
                <div className="space-y-6">
                  {notesToView.content.length > 0 ? (
                    <div className="relative border-r-2 border-slate-100 pr-6 mr-2 py-2">
                      {notesToView.content.map((note, i) => (
                        <div key={i} className="relative mb-8 last:mb-0">
                          <div className="absolute -right-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-slate-200 shadow-sm"></div>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                               <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                                  note.type === 'سجل' ? 'bg-indigo-100 text-indigo-700' : 
                                  note.type === 'ملاحظة' ? 'bg-amber-100 text-amber-700' :
                                  'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {note.type === 'سجل' ? 'سجل أساسي' : (note.type || 'إجراء')}
                                </span>
                              {note.amount && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {note.amount.toLocaleString()} ر.س
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100/50 px-2 py-1 rounded-md border border-slate-200/50 shadow-sm">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-xs font-bold font-mono tracking-tight">{note.date}</span>
                            </div>
                          </div>
                          <div className={`text-base leading-relaxed p-4 rounded-xl border transition-shadow ${
                            note.hasNote || note.type === 'سجل' || note.type === 'ملاحظة'
                              ? 'text-slate-800 bg-white border-slate-200 shadow-sm hover:shadow-md' 
                              : 'text-slate-400 bg-slate-50/50 border-slate-100 italic'
                          }`}>
                            <div className="mb-2 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 pb-1 flex justify-between">
                              <span>المحتوى:</span>
                              {note.type === 'سجل' && <span className="text-indigo-500 font-bold">البيانات الأساسية للملف</span>}
                            </div>
                            <div className="font-medium whitespace-pre-wrap">{note.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </div>
                      <div className="text-sm text-slate-400 font-medium">لا توجد ملاحظات مسجلة لهذا السجل</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t flex justify-center">
                <button onClick={() => setShowNotesModal(false)} className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-95 shadow-slate-200">
                  حسناً (موافق)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default HRManagement;
