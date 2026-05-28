import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { resolveImageUrl } from '../utils/imageUrl';
import { toast } from 'react-toastify';
import imageCompression from 'browser-image-compression';
import { useTranslation } from 'react-i18next';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Cars({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [editingCar, setEditingCar] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCarDetails, setSelectedCarDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);

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
    project: '',
    assigned_user_id: '',
    assigned_user_name: '',
    car_type: '',
    plate_number: '',
    model: '',
    authorization_start: '',
    authorization_end: '',
    color: '',
    notes: '',
    kilometers: ''
  });

  const isAdmin = user?.role === 'admin';
  const isLevel2 = user?.can_create_subusers && !isAdmin;
  const hasCarsPermission = user?.permissions?.includes('cars');
  const hasManagePermission = user?.permissions?.includes('cars_manage');
  // صلاحية التسليم: Admin أو من لديه صلاحية cars_manage
  const canManage = isAdmin || hasManagePermission;

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedProject) params.append('project', selectedProject);
      // Fetch all for client-side pagination
      params.append('limit', 1000); 
      
      const response = await axios.get(`${API}/cars?${params}`);
      const data = response.data;
      
      if (Array.isArray(data)) {
        setCars(data);
        const count = data.length;
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      } else {
        const carsList = data.cars || [];
        const count = data.total_count || carsList.length;
        setCars(carsList);
        setTotalCount(count);
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      toast.error(t('carsPage.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [selectedProject, itemsPerPage, t]); // Removed currentPage from dependencies to allow client-side slicing without re-fetching

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchProjectUsers = async (projectName) => {
    try {
      // إذا كان لديه صلاحية الإدارة، جلب جميع المستخدمين
      if (canManage && !projectName) {
        const response = await axios.get(`${API}/cars/all-users`);
        setProjectUsers(response.data);
      } else if (projectName) {
        const response = await axios.get(`${API}/cars/project/${encodeURIComponent(projectName)}/users`);
        setProjectUsers(response.data);
      } else {
        setProjectUsers([]);
      }
    } catch (error) {
      console.error('Error fetching project users:', error);
      setProjectUsers([]);
    }
  };

  const handleRemoveUserFromList = async (userId, userName) => {
    if (!formData.project) {
      toast.error(t('carsPage.errors.selectProjectFirst'));
      return;
    }
    if (!window.confirm(t('carsPage.errors.deleteUserConfirm', { name: userName }))) return;
    
    try {
      await axios.delete(`${API}/cars/project-users/${userId}?project=${encodeURIComponent(formData.project)}`);
      toast.success(t('carsPage.errors.deleteUserSuccess'));
      fetchProjectUsers(formData.project);
      if (formData.assigned_user_id === userId) {
        setFormData(prev => ({ ...prev, assigned_user_id: '', assigned_user_name: '' }));
      }
    } catch (error) {
      toast.error(t('carsPage.errors.deleteUserError'));
    }
  };

  useEffect(() => {
    fetchCars();
    fetchProjects();
  }, [fetchCars]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProject]);

  // جلب المستخدمين عند تغيير المشروع أو فتح النافذة
  useEffect(() => {
    if (showModal) {
      if (formData.project) {
        fetchProjectUsers(formData.project);
      } else if (canManage) {
        // لمن لديه صلاحية: جلب جميع المستخدمين
        fetchProjectUsers('');
      }
    }
  }, [formData.project, showModal, canManage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'assigned_user_id') {
      if (value === 'custom') {
        // المستخدم اختار الإدخال اليدوي - امسح الاسم ليتمكن من إدخاله
        setFormData(prev => ({ ...prev, assigned_user_name: '', assigned_user_id: 'custom' }));
      } else if (value) {
        const selectedUser = projectUsers.find(u => u.id === value);
        if (selectedUser) {
          setFormData(prev => ({ ...prev, assigned_user_name: selectedUser.full_name || selectedUser.username }));
        }
      } else {
        setFormData(prev => ({ ...prev, assigned_user_name: '' }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      project: '',
      assigned_user_id: '',
      assigned_user_name: '',
      car_type: '',
      plate_number: '',
      model: '',
      authorization_start: '',
      authorization_end: '',
      color: '',
      notes: '',
      kilometers: ''
    });
    setEditingCar(null);
    setProjectUsers([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // التحقق من الحقول المطلوبة
    if (!formData.project || !formData.car_type || !formData.plate_number) {
      toast.error(t('carsPage.errors.fillRequired'));
      return;
    }
    
    // التحقق من اسم المستلم
    if (!formData.assigned_user_name) {
      toast.error(t('carsPage.errors.selectRecipient'));
      return;
    }
    
    // إعداد البيانات للإرسال
    const dataToSend = { ...formData };
    
    // إذا كان الإدخال يدوي، استخدم ID فريد
    if (dataToSend.assigned_user_id === 'custom' || !dataToSend.assigned_user_id) {
      dataToSend.assigned_user_id = `manual_${Date.now()}`;
    }

    try {
      if (editingCar) {
        await axios.put(`${API}/cars/${editingCar.id}`, dataToSend);
        toast.success(t('carsPage.errors.updateSuccess'));
      } else {
        await axios.post(`${API}/cars`, dataToSend);
        toast.success(t('carsPage.errors.addSuccess'));
      }
      setShowModal(false);
      resetForm();
      fetchCars();
    } catch (error) {
      console.error('Error saving car:', error);
      toast.error(error.response?.data?.detail || t('carsPage.errors.saveError'));
    }
  };

  const handleEdit = (car) => {
    setEditingCar(car);
    setFormData({
      project: car.project,
      assigned_user_id: car.assigned_user_id,
      assigned_user_name: car.assigned_user_name,
      car_type: car.car_type,
      plate_number: car.plate_number,
      model: car.model,
      authorization_start: car.authorization_start,
      authorization_end: car.authorization_end,
      color: car.color,
      notes: car.notes || '',
      kilometers: car.kilometers || ''
    });
    fetchProjectUsers(car.project);
    setShowModal(true);
  };

  const handleDelete = async (carId) => {
    if (!window.confirm(t('carsPage.errors.deleteCarConfirm'))) return;
    
    try {
      await axios.delete(`${API}/cars/${carId}`);
      toast.success(t('carsPage.errors.deleteCarSuccess'));
      fetchCars();
    } catch (error) {
      console.error('Error deleting car:', error);
      toast.error(t('carsPage.errors.deleteCarError'));
    }
  };

  const handleImageUpload = async (carId, file) => {
    if (!file) return;
    
    setUploadingImage(true);
    toast.info(t('carsPage.errors.compressingImage'), { autoClose: 1500 });
    try {
      const options = { maxSizeMB: 0.1, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressed = await imageCompression(file, options).catch(() => file);
      const imageForm = new FormData();
      imageForm.append('image', compressed);
      await axios.post(`${API}/cars/${carId}/image`, imageForm, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(t('carsPage.errors.uploadSuccess'));
      fetchCars();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(t('carsPage.errors.uploadError'));
    } finally {
      setUploadingImage(false);
    }
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🚗 {t('carsPage.title')}</h1>
          
          <div className="flex flex-wrap gap-3">
            {/* فلتر المشروع */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('carsPage.allProjects')}</option>
              {projects.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
            
            {canManage && (
              <button
                onClick={() => { resetForm(); setShowModal(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <span>➕</span>
                <span>{t('carsPage.assignCar')}</span>
              </button>
            )}
          </div>
        </div>


        {/* Cars Table */}
        {loading ? (
          <div className="text-center py-10">{t('carsPage.loading')}</div>
        ) : cars.length === 0 ? (
          <div className="text-center py-10 text-gray-500">{t('carsPage.noCars')}</div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.carType')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.plateNumber')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.project')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.recipient')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.model')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.authorization')}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('carsPage.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cars.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(car => (
                    <tr key={car.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer relative group">
                          {car.image ? (
                            <img src={resolveImageUrl(car.image)} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-400">🚗</div>
                          )}
                          {canManage && (
                            <>
                              <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white text-xs">📷</span>
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleImageUpload(car.id, e.target.files[0])}
                                disabled={uploadingImage}
                              />
                            </>
                          )}
                        </label>
                        <span className="font-medium">{car.car_type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">{car.plate_number}</span>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{car.project?.replace('مشروع إصلاح أعمال ', '').replace(' - القطاع الأوسط', '')}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{car.assigned_user_name}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{car.model} - {car.color}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{car.authorization_start} → {car.authorization_end}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setSelectedCarDetails(car); setShowDetailsModal(true); }}
                          className="p-2 text-cyan-600 hover:bg-cyan-50 rounded-lg"
                          title={t('carsPage.viewDetails')}
                        >
                          👁️
                        </button>
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleEdit(car)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg"
                              title={t('carsPage.edit')}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(car.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title={t('carsPage.delete')}
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Pagination */}
        {!loading && cars.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              itemsPerPageOptions={[10, 15, 20, 50, 100]}
              itemLabel={t('carsPage.carLabel') || 'سيارة'}
            />
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">
                    {editingCar ? `✏️ ${t('carsPage.editCar')}` : `➕ ${t('carsPage.assignNewCar')}`}
                  </h2>
                  <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Project */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.projectLabel')}</label>
                    <select
                      name="project"
                      value={formData.project}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">{t('carsPage.selectProject')}</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* User - قائمة مخصصة مع أزرار حذف */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.recipientLabel')}</label>
                    <div className="relative">
                      <div 
                        className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex justify-between items-center ${!formData.project ? 'bg-gray-100 text-gray-400' : 'bg-white'}`}
                        onClick={() => formData.project && setShowUserDropdown(!showUserDropdown)}
                      >
                        <span>
                          {formData.assigned_user_id === 'custom' 
                            ? t('carsPage.enterNameManually') 
                            : formData.assigned_user_name || t('carsPage.selectRecipientFromList')}
                        </span>
                        <span className="text-gray-400">▼</span>
                      </div>
                      
                      {showUserDropdown && formData.project && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          <div 
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, assigned_user_id: '', assigned_user_name: '' }));
                              setShowUserDropdown(false);
                            }}
                          >
                            {t('carsPage.selectRecipientFromList')}
                          </div>
                          {projectUsers.map(u => (
                            <div key={u.id} className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 border-b">
                              <span 
                                className="flex-1 cursor-pointer"
                                onClick={() => {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    assigned_user_id: u.id, 
                                    assigned_user_name: u.full_name || u.username 
                                  }));
                                  setShowUserDropdown(false);
                                }}
                              >
                                {u.full_name || u.username}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveUserFromList(u.id, u.full_name || u.username);
                                }}
                                className="p-1 text-red-500 hover:bg-red-100 rounded"
                                title={t('carsPage.removeFromList')}
                              >
                                🗑️
                              </button>
                            </div>
                          ))}
                          <div 
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-blue-600 font-medium"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, assigned_user_id: 'custom', assigned_user_name: '' }));
                              setShowUserDropdown(false);
                            }}
                          >
                            {t('carsPage.enterNameManually')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* اسم المستلم يدوياً - يظهر عند اختيار "إدخال يدوي" أو عندما المستخدم غير موجود */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('carsPage.recipientName')} {formData.assigned_user_id === 'custom' ? '*' : `(${t('carsPage.optionalEditName')})`}
                    </label>
                    <input
                      type="text"
                      name="assigned_user_name"
                      value={formData.assigned_user_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('carsPage.recipientNamePlaceholder')}
                      required={formData.assigned_user_id === 'custom'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t('carsPage.recipientNameHelp')}
                    </p>
                  </div>
                  
                  {/* Car Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.carTypeLabel')}</label>
                    <input
                      type="text"
                      name="car_type"
                      value={formData.car_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('carsPage.carTypePlaceholder')}
                      required
                    />
                  </div>
                  
                  {/* Plate Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.plateNumberLabel')}</label>
                    <input
                      type="text"
                      name="plate_number"
                      value={formData.plate_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('carsPage.plateNumberPlaceholder')}
                      required
                    />
                  </div>
                  
                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.modelLabel')}</label>
                    <input
                      type="text"
                      name="model"
                      value={formData.model}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('carsPage.modelPlaceholder')}
                    />
                  </div>
                  
                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.colorLabel')}</label>
                    <input
                      type="text"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('carsPage.colorPlaceholder')}
                    />
                  </div>
                  
                  {/* Authorization Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.authStart')}</label>
                      <input
                        type="date"
                        name="authorization_start"
                        value={formData.authorization_start}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.authEnd')}</label>
                      <input
                        type="date"
                        name="authorization_end"
                        value={formData.authorization_end}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  {/* Kilometers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.kilometersLabel')}</label>
                    <input
                      type="text"
                      name="kilometers"
                      value={formData.kilometers}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={t('carsPage.kilometersPlaceholder')}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('carsPage.notesLabel')}</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder={t('carsPage.notesPlaceholder')}
                    />
                  </div>
                  
                  {/* Submit */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                    >
                      {editingCar ? `💾 ${t('carsPage.saveChanges')}` : `➕ ${t('carsPage.addCar')}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      {t('carsPage.cancel')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Image Modal */}
        {showImageModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowImageModal(false)}
          >
            <img 
              src={resolveImageUrl(selectedImage)} 
              alt={t('carsPage.carType')} 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button 
              className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
              onClick={() => setShowImageModal(false)}
            >
              ×
            </button>
          </div>
        )}
        
        {/* Modal تفاصيل السيارة */}
        {showDetailsModal && selectedCarDetails && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">🚗 {t('carsPage.carDetails')}</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-white text-2xl hover:text-gray-200">×</button>
              </div>
              <div className="p-6 space-y-4">
                {selectedCarDetails.image && (
                  <img src={resolveImageUrl(selectedCarDetails.image)} alt={t('carsPage.carType')} className="w-full h-48 object-cover rounded-lg" />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.carType')}</p>
                    <p className="font-semibold">{selectedCarDetails.car_type}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.plateNumber')}</p>
                    <p className="font-semibold text-blue-600">{selectedCarDetails.plate_number}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.project')}</p>
                    <p className="font-semibold">{selectedCarDetails.project}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.recipient')}</p>
                    <p className="font-semibold">{selectedCarDetails.assigned_user_name}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.model')}</p>
                    <p className="font-semibold">{selectedCarDetails.model}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.colorLabel')}</p>
                    <p className="font-semibold">{selectedCarDetails.color}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.kilometersLabel')}</p>
                    <p className="font-semibold">{selectedCarDetails.kilometers || '-'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('carsPage.authorization')}</p>
                    <p className="font-semibold text-sm">{selectedCarDetails.authorization_start} → {selectedCarDetails.authorization_end}</p>
                  </div>
                  {selectedCarDetails.created_by_name && (
                    <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500">{t('carsPage.assignedBy')}</p>
                      <p className="font-semibold text-blue-600">{selectedCarDetails.created_by_name}</p>
                    </div>
                  )}
                  {selectedCarDetails.notes && (
                    <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                      <p className="text-xs text-gray-500">{t('carsPage.notes')}</p>
                      <p className="font-semibold">{selectedCarDetails.notes}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">{t('carsPage.close')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Cars;
