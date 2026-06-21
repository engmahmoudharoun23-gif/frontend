import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { Plus, Edit2, Trash2, Eye, ImageIcon, Wrench, Car, X, Camera, Upload, Bell, Download, ZoomIn, ChevronLeft, ChevronRight, History, User, Search } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { resolveImageUrl } from '../utils/imageUrl';
import { translateBrandingText } from '../utils/brandingTranslation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function FleetMaintenance({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [editingCar, setEditingCar] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); // بحث برقم السيارة
  const [uploading, setUploading] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [carHistory, setCarHistory] = useState([]);
  const [selectedCarForHistory, setSelectedCarForHistory] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null); // صورة مكبرة
  
  // Pagination state
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [itemsPerPage, setItemsPerPage] = useState(parseInt(searchParams.get('limit')) || 10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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
  
  const [carForm, setCarForm] = useState({
    plate_number: '', car_type: '', model: '', year: '', color: '',
    owner_name: '', company: '', project_name: '', current_user_name: '',
    registration_start: '', registration_end: '',
    inspection_start: '', inspection_end: '', authorization_start: '', authorization_end: '', notes: ''
  });
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenance_type: '', description: '', cost: '', workshop: '', date: '', notes: ''
  });

  // جلب سجل تسليم السيارة
  const fetchCarHistory = async (carId) => {
    try {
      const res = await axios.get(`${API}/fleet-cars/${carId}/history`);
      setCarHistory(res.data);
    } catch { toast.error(t('fleetPage.toast.loadHistoryFailed')); }
  };

  // فحص التنبيهات
  const checkAlerts = useCallback((carsData) => {
    const newAlerts = [];
    const today = new Date();
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    carsData.forEach(car => {
      if (car.registration_end) {
        const regEnd = new Date(car.registration_end);
        const diff = regEnd - today;
        if (diff > 0 && diff <= oneMonth) {
          newAlerts.push({
            type: 'registration', car,
            message: t('fleetPage.alerts.registration', { plate: car.plate_number, days: Math.ceil(diff / (24 * 60 * 60 * 1000)) }),
            severity: diff <= oneWeek ? 'high' : 'medium'
          });
        }
      }
      if (car.inspection_end) {
        const inspEnd = new Date(car.inspection_end);
        const diff = inspEnd - today;
        if (diff > 0 && diff <= oneMonth) {
          newAlerts.push({
            type: 'inspection', car,
            message: t('fleetPage.alerts.inspection', { plate: car.plate_number, days: Math.ceil(diff / (24 * 60 * 60 * 1000)) }),
            severity: diff <= oneWeek ? 'high' : 'medium'
          });
        }
      }
      if (car.authorization_end) {
        const authEnd = new Date(car.authorization_end);
        const diff = authEnd - today;
        if (diff > 0 && diff <= oneWeek) {
          newAlerts.push({
            type: 'authorization', car,
            message: t('fleetPage.alerts.authorization', { plate: car.plate_number, days: Math.ceil(diff / (24 * 60 * 60 * 1000)) }),
            severity: 'high'
          });
        }
      }
    });
    setAlerts(newAlerts);
  }, [t]);

  const fetchCars = useCallback(async () => {
    // setLoading(true);
    try {
      const res = await axios.get(`${API}/fleet-cars`);
      const data = res.data;
      setCars(data);
      setTotalCount(data.length);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      checkAlerts(data);
    } catch { toast.error(t('fleetPage.toast.loadCarsFailed')); }
    finally { setLoading(false); }
  }, [itemsPerPage, checkAlerts, t]);

  const fetchMaintenance = async (carId) => {
    try {
      const res = await axios.get(`${API}/fleet-cars/${carId}/maintenance`);
      setMaintenanceRecords(res.data);
    } catch { toast.error(t('fleetPage.toast.loadMaintenanceFailed')); }
  };

  useEffect(() => { fetchCars(); }, [fetchCars]);

  // Reset page when filter or itemsPerPage changes
  useEffect(() => {
    setTotalPages(Math.ceil(cars.length / itemsPerPage));
    setCurrentPage(1);
  }, [itemsPerPage, cars.length]);

  const resetCarForm = () => {
    setCarForm({ plate_number: '', car_type: '', model: '', year: '', color: '', owner_name: '', company: '', project_name: '', current_user_name: '', registration_start: '', registration_end: '', inspection_start: '', inspection_end: '', authorization_start: '', authorization_end: '', notes: '' });
  };

  const handleSaveCar = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingCar) {
        await axios.put(`${API}/fleet-cars/${editingCar.id}`, carForm);
        toast.success(t('fleetPage.toast.saveCarSuccess'));
      } else {
        await axios.post(`${API}/fleet-cars`, carForm);
        toast.success(t('fleetPage.toast.saveCarSuccess'));
      }
      fetchCars();
      setShowCarModal(false);
      setEditingCar(null);
      resetCarForm();
    } catch { toast.error(t('fleetPage.toast.saveCarError')); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteCar = async (id) => {
    if (!window.confirm(t('fleetPage.confirmDeleteCar'))) return;
    try {
      await axios.delete(`${API}/fleet-cars/${id}`);
      toast.success(t('fleetPage.toast.deleteCarSuccess'));
      fetchCars();
    } catch { toast.error(t('fleetPage.toast.deleteCarError')); }
  };

  const compressImage = async (file) => {
    const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1024, useWebWorker: true };
    try { return await imageCompression(file, options); }
    catch { return file; }
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    const newImages = [];
    for (const file of files) {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      await new Promise(resolve => {
        reader.onload = () => { newImages.push(reader.result); resolve(); };
        reader.readAsDataURL(compressed);
      });
    }
    setPendingImages(prev => [...prev, ...newImages]);
    setUploading(false);
    toast.success(
      files.length > 1
        ? t('fleetPage.toast.imagesCompressed', { count: files.length })
        : t('fleetPage.toast.imageCompressed'),
      { autoClose: 2500 }
    );
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      let recordId;
      if (editingRecord) {
        await axios.put(`${API}/maintenance/${editingRecord.id}`, null, { params: maintenanceForm });
        recordId = editingRecord.id;
        toast.success(t('fleetPage.toast.saveMaintenanceSuccess'));
      } else {
        const response = await axios.post(`${API}/fleet-cars/${selectedCar.id}/maintenance`, { ...maintenanceForm, fleet_car_id: selectedCar.id });
        recordId = response.data.id;
        toast.success(t('fleetPage.toast.addMaintenanceSuccess'));
      }
      
      if (pendingImages.length > 0 && recordId) {
        toast.info(t('fleetPage.toast.uploadingImages', { count: pendingImages.length }));
        const formData = new FormData();
        for (let i = 0; i < pendingImages.length; i++) {
          const response = await fetch(pendingImages[i]);
          const blob = await response.blob();
          formData.append('files', blob, `image_${i}.jpg`);
        }
        try {
          await axios.post(`${API}/maintenance/${recordId}/images`, formData);
          toast.success(t('fleetPage.toast.uploadImagesSuccess'));
        } catch { toast.error(t('fleetPage.toast.uploadImagesError')); }
      }
      
      fetchMaintenance(selectedCar.id);
      setShowMaintenanceModal(false);
      setEditingRecord(null);
      setPendingImages([]);
      setMaintenanceForm({ maintenance_type: '', description: '', cost: '', workshop: '', date: '', notes: '' });
    } catch { toast.error(t('fleetPage.toast.saveMaintenanceError')); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteMaintenance = async (id) => {
    if (!window.confirm(t('fleetPage.confirmDeleteRecord'))) return;
    try {
      await axios.delete(`${API}/maintenance/${id}`);
      toast.success(t('fleetPage.toast.deleteMaintenanceSuccess'));
      fetchMaintenance(selectedCar.id);
    } catch { toast.error(t('fleetPage.toast.deleteMaintenanceError')); }
  };

  const handleUploadImages = async (recordId, files) => {
    const formData = new FormData();
    for (const file of Array.from(files)) {
      const compressed = await compressImage(file);
      formData.append('files', compressed);
    }
    try {
      await axios.post(`${API}/maintenance/${recordId}/images`, formData);
      toast.success(t('fleetPage.toast.uploadImagesSuccess'));
      fetchMaintenance(selectedCar.id);
    } catch { toast.error(t('fleetPage.toast.uploadImagesError')); }
  };

  const handleDeleteImage = async (recordId, imageIndex) => {
    if (!window.confirm(t('fleetPage.confirmDeleteImage'))) return;
    try {
      await axios.delete(`${API}/maintenance/${recordId}/images/${imageIndex}`);
      toast.success(t('fleetPage.toast.deleteImageSuccess'));
      fetchMaintenance(selectedCar.id);
      // تحديث عارض الصور
      if (showDetailsModal && selectedRecord) {
        const updated = maintenanceRecords.find(r => r.id === recordId);
        if (updated) {
          setSelectedRecord({...updated, images: (updated.images || []).filter((_, i) => i !== imageIndex)});
        }
      }
    } catch { toast.error(t('fleetPage.toast.deleteImageError')); }
  };

  const handleUploadCarImage = async (carId, file) => {
    const compressed = await compressImage(file);
    const formData = new FormData();
    formData.append('file', compressed);
    try {
      await axios.post(`${API}/fleet-cars/${carId}/image`, formData);
      toast.success(t('fleetPage.toast.uploadCarImageSuccess'));
      fetchCars();
    } catch { toast.error(t('fleetPage.toast.uploadCarImageError')); }
  };

  const openImageViewer = (images, index = 0) => {
    if (!images || images.length === 0) { toast.info(t('fleetPage.toast.noImagesInfo')); return; }
    setViewerImages(images);
    setViewerIndex(index);
    setShowImageViewer(true);
  };

  const downloadImage = (imageUrl, filename = 'image.jpg') => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewRecordDetails = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  // تصدير السيارات إلى Excel
  const exportCarsToExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/fleet-cars/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${t('fleetPage.title')}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('fleetPage.toast.exportSuccess'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('fleetPage.toast.exportError'));
    }
  };

  const maintenanceTypes = [
    { value: 'صيانة دورية', labelKey: 'periodic' },
    { value: 'تغيير زيت', labelKey: 'oil' },
    { value: 'إطارات', labelKey: 'tires' },
    { value: 'فرامل', labelKey: 'brakes' },
    { value: 'كهرباء', labelKey: 'electricity' },
    { value: 'تكييف', labelKey: 'air_conditioning' },
    { value: 'صدمة', labelKey: 'shock' },
    { value: 'دهان', labelKey: 'paint' },
    { value: 'أخرى', labelKey: 'other' }
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* التنبيهات */}
        {alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${alert.severity === 'high' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <Bell className={`w-5 h-5 ${alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className={`text-sm ${alert.severity === 'high' ? 'text-red-700' : 'text-yellow-700'}`}>{alert.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Car className="w-7 h-7 text-orange-500" />
              {t('fleetPage.title')}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{t('fleetPage.subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCarsToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="w-5 h-5" /> {t('fleetPage.exportExcel')}
            </button>
            <button onClick={() => { setEditingCar(null); resetCarForm(); setShowCarModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              <Plus className="w-5 h-5" /> {t('fleetPage.addCar')}
            </button>
          </div>
        </div>

        {/* Search Box - البحث برقم السيارة */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('fleetPage.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              {t('fleetPage.searchResult', {
                count: cars.filter(c => 
                  c.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.car_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.model?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length,
                total: cars.length
              })}
            </p>
          )}
        </div>

        {/* Cars Table */}
        {cars.length === 0 && loading ? (
          <div className="text-center py-10">{t('fleetPage.loading')}</div>
        ) : cars.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl">
            <Car className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">{t('fleetPage.noCars')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.car')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.plate')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.owner')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.projectUser')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.registration')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.inspection')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.authorization')}</th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cars.filter(car => 
                    !searchQuery || 
                    car.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    car.car_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    car.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    car.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    car.project_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    car.current_user_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(car => (
                    <tr key={car.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer relative group">
                            {car.image ? <img src={resolveImageUrl(car.image)} alt="" className="w-10 h-10 rounded object-cover" />
                            : <div className="w-10 h-10 bg-orange-100 rounded flex items-center justify-center text-orange-500">🚗</div>}
                            <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Camera className="w-4 h-4 text-white" />
                            </div>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && handleUploadCarImage(car.id, e.target.files[0])} />
                          </label>
                          <div>
                            <p className="font-medium text-sm">{translateBrandingText(car.car_type, isRtl)}</p>
                            <p className="text-xs text-gray-500">{translateBrandingText(car.model, isRtl)} {car.year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-bold" dir="ltr">{translateBrandingText(car.plate_number, isRtl)}</span>
                      </td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">{translateBrandingText(car.owner_name, isRtl)}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          {car.project_name && (
                            <span className="text-green-700 text-xs bg-green-50 px-1.5 py-0.5 rounded">{translateBrandingText(car.project_name, isRtl)}</span>
                          )}
                          {car.current_user_name ? (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-500" />
                              <span className="text-blue-700 text-xs">{translateBrandingText(car.current_user_name, isRtl)}</span>
                            </div>
                          ) : (
                            !car.project_name && <span className="text-gray-400 text-xs">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        {car.registration_end && (
                          <span className={`px-2 py-1 rounded ${new Date(car.registration_end) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {car.registration_end}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        {car.inspection_end && (
                          <span className={`px-2 py-1 rounded ${new Date(car.inspection_end) < new Date() ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {car.inspection_end}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-[10px]">{t('fleetPage.start')}</span>
                            {car.authorization_start ? (
                              <span className="text-blue-600 font-medium">{car.authorization_start}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 text-[10px]">{t('fleetPage.end')}</span>
                            {car.authorization_end ? (
                              <span className={`px-2 py-0.5 rounded ${new Date(car.authorization_end) < new Date() ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}>
                                {car.authorization_end}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelectedCar(car); fetchMaintenance(car.id); }} className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg" title={t('fleetPage.maintenanceLog')}>
                            <Wrench className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setSelectedCarForHistory(car); fetchCarHistory(car.id); setShowHistoryModal(true); }} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg" title={t('fleetPage.deliveryLog')}>
                            <History className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingCar(car); setCarForm(car); setShowCarModal(true); }} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg" title={t('fleetPage.edit')}>
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteCar(car.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title={t('fleetPage.delete')}>
                            <Trash2 className="w-4 h-4" />
                          </button>
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
              totalItems={cars.filter(car => 
                !searchQuery || 
                car.plate_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                car.car_type?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleLimitChange}
              itemsPerPageOptions={[10, 20, 50, 100]}
              itemLabel={t('fleetPage.itemLabel')}
            />
          </div>
        )}

        {/* Selected Car Maintenance Records */}
        {selectedCar && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-500" />
                {t('fleetPage.maintenanceRecord')}: {translateBrandingText(selectedCar.car_type, isRtl)} - <span dir="ltr">{translateBrandingText(selectedCar.plate_number, isRtl)}</span>
              </h2>
              <div className="flex gap-2">
                <button onClick={() => { setEditingRecord(null); setPendingImages([]); setMaintenanceForm({ maintenance_type: '', description: '', cost: '', workshop: '', date: '', notes: '' }); setShowMaintenanceModal(true); }}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm">
                  <Plus className="w-4 h-4" /> {t('fleetPage.addMaintenance')}
                </button>
                <button onClick={() => setSelectedCar(null)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {maintenanceRecords.length === 0 ? (
              <p className="text-center py-10 text-gray-500">{t('fleetPage.noMaintenance')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.date')}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.type')}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.description')}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.cost')}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.workshop')}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.images')}</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">{t('fleetPage.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {maintenanceRecords.map(record => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm whitespace-nowrap">{record.date}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">
                            {maintenanceTypes.find(t => t.value === record.maintenance_type)
                              ? t(`fleetPage.maintenanceTypes.${maintenanceTypes.find(t => t.value === record.maintenance_type).labelKey}`)
                              : record.maintenance_type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm max-w-[150px] truncate">{record.description}</td>
                        <td className="px-3 py-2 text-sm font-medium whitespace-nowrap">
                          {record.cost ? t('fleetPage.costFormat', { val: record.cost }) : '-'}
                        </td>
                        <td className="px-3 py-2 text-sm whitespace-nowrap">{record.workshop || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button 
                            onClick={() => {
                              if ((record.images || []).length > 0) {
                                setSelectedRecord(record);
                                openImageViewer(record.images, 0);
                              } else {
                                toast.info(t('fleetPage.toast.noImagesInfo'));
                              }
                            }} 
                            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                          >
                            <ImageIcon className="w-4 h-4" />
                            <span>{(record.images || []).length}</span>
                          </button>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button onClick={() => viewRecordDetails(record)} className="p-1.5 text-cyan-600 hover:bg-cyan-50 rounded" title={t('fleetPage.viewDetails')}>
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingRecord(record); setMaintenanceForm(record); setPendingImages([]); setShowMaintenanceModal(true); }} className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded" title={t('fleetPage.edit')}>
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteMaintenance(record.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title={t('fleetPage.delete')}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Car Modal */}
        {showCarModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-orange-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">{editingCar ? t('fleetPage.editCar') : t('fleetPage.addNewCar')}</h3>
                <button onClick={() => setShowCarModal(false)} className="text-white text-2xl">×</button>
              </div>
              <form onSubmit={handleSaveCar} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.plateNumberLabel')}</label><input type="text" value={carForm.plate_number ? translateBrandingText(carForm.plate_number, isRtl) : ''} onChange={e => setCarForm({...carForm, plate_number: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" dir="ltr" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.carTypeLabel')}</label><input type="text" value={carForm.car_type ? translateBrandingText(carForm.car_type, isRtl) : ''} onChange={e => setCarForm({...carForm, car_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.modelLabel')}</label><input type="text" value={carForm.model ? translateBrandingText(carForm.model, isRtl) : ''} onChange={e => setCarForm({...carForm, model: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.colorLabel')}</label><input type="text" value={carForm.color ? translateBrandingText(carForm.color, isRtl) : ''} onChange={e => setCarForm({...carForm, color: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.ownerNameLabel')}</label><input type="text" value={carForm.owner_name ? translateBrandingText(carForm.owner_name, isRtl) : ''} onChange={e => setCarForm({...carForm, owner_name: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.companyLabel')}</label><input type="text" value={carForm.company ? translateBrandingText(carForm.company, isRtl) : ''} onChange={e => setCarForm({...carForm, company: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-700">{t('fleetPage.projectNameLabel')}</label>
                    <input type="text" value={carForm.project_name ? translateBrandingText(carForm.project_name, isRtl) : ''} onChange={e => setCarForm({...carForm, project_name: e.target.value})} className="w-full px-3 py-2 border-2 border-green-200 rounded-lg bg-green-50" placeholder={t('fleetPage.projectNamePlaceholder')} autoComplete="off" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-blue-700">{t('fleetPage.currentUserLabel')}</label>
                    <input type="text" value={carForm.current_user_name ? translateBrandingText(carForm.current_user_name, isRtl) : ''} onChange={e => setCarForm({...carForm, current_user_name: e.target.value})} className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg bg-blue-50" placeholder={t('fleetPage.currentUserPlaceholder')} autoComplete="off" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.registrationStart')}</label><input type="date" value={carForm.registration_start} onChange={e => setCarForm({...carForm, registration_start: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.registrationEnd')}</label><input type="date" value={carForm.registration_end} onChange={e => setCarForm({...carForm, registration_end: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.inspectionStart')}</label><input type="date" value={carForm.inspection_start} onChange={e => setCarForm({...carForm, inspection_start: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.inspectionEnd')}</label><input type="date" value={carForm.inspection_end} onChange={e => setCarForm({...carForm, inspection_end: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.authorizationStart')}</label><input type="date" value={carForm.authorization_start || ''} onChange={e => setCarForm({...carForm, authorization_start: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.authorizationEnd')}</label><input type="date" value={carForm.authorization_end} onChange={e => setCarForm({...carForm, authorization_end: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">{t('fleetPage.notesLabel')}</label><textarea value={carForm.notes} onChange={e => setCarForm({...carForm, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" /></div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isSubmitting} className={`flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : t('fleetPage.save')}</button>
                  <button type="button" onClick={() => setShowCarModal(false)} className="flex-1 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200">{t('fleetPage.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Maintenance Modal */}
        {showMaintenanceModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-green-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h3 className="text-lg font-bold text-white">{editingRecord ? t('fleetPage.editMaintenance') : t('fleetPage.addMaintenance')}</h3>
                <button onClick={() => { setShowMaintenanceModal(false); setPendingImages([]); }} className="text-white text-2xl">×</button>
              </div>
              <form onSubmit={handleSaveMaintenance} className="p-6 space-y-4">
                <div><label className="block text-sm font-medium mb-1">{t('fleetPage.type')}</label>
                  <select value={maintenanceForm.maintenance_type} onChange={e => setMaintenanceForm({...maintenanceForm, maintenance_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                    <option value="">{t('fleetPage.selectMaintenanceType')}</option>
                    {maintenanceTypes.map(tOption => <option key={tOption.value} value={tOption.value}>{t(`fleetPage.maintenanceTypes.${tOption.labelKey}`)}</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">{t('fleetPage.description')}</label><textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm({...maintenanceForm, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.date')}</label><input type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm({...maintenanceForm, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium mb-1">{t('fleetPage.cost')}</label><input type="number" value={maintenanceForm.cost} onChange={e => setMaintenanceForm({...maintenanceForm, cost: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                </div>
                <div><label className="block text-sm font-medium mb-1">{t('fleetPage.workshop')}</label><input type="text" value={maintenanceForm.workshop} onChange={e => setMaintenanceForm({...maintenanceForm, workshop: e.target.value})} className="w-full px-3 py-2 border rounded-lg" autoComplete="off" /></div>
                <div><label className="block text-sm font-medium mb-1">{t('fleetPage.notesLabel')}</label><textarea value={maintenanceForm.notes} onChange={e => setMaintenanceForm({...maintenanceForm, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows="2" /></div>
                
                {/* قسم رفع الصور */}
                <div className="border-t pt-4 bg-blue-50 -mx-6 px-6 pb-4">
                  <label className="block text-sm font-bold mb-3 text-blue-800">{t('fleetPage.maintenanceImagesSection')}</label>
                  
                  {/* عرض الصور الموجودة مسبقاً في حالة التعديل */}
                  {editingRecord && editingRecord.images && editingRecord.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-600 mb-2">{t('fleetPage.savedImages', { count: editingRecord.images.length })}</p>
                      <div className="flex flex-wrap gap-2">
                        {editingRecord.images.map((img, i) => (
                          <div key={`existing-${i}`} className="relative group">
                            <img src={resolveImageUrl(img)} alt="" className="w-16 h-16 rounded object-cover border-2 border-green-300 cursor-pointer" onClick={() => setZoomedImage(img)} />
                            {/* أيقونات التحكم */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                              <button type="button" onClick={() => setZoomedImage(img)} className="p-1 bg-white/80 rounded-full hover:bg-white" title={t('fleetPage.zoomedImageAlt')}>
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button type="button" onClick={() => handleDeleteImage(editingRecord.id, i)} className="p-1 bg-red-500 rounded-full hover:bg-red-600" title={t('fleetPage.delete')}>
                                <Trash2 className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* الصور الجديدة المراد رفعها */}
                  {pendingImages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-600 mb-2">{t('fleetPage.newImages', { count: pendingImages.length })}</p>
                      <div className="flex flex-wrap gap-2">
                        {pendingImages.map((img, i) => (
                          <div key={i} className="relative group">
                            <img src={resolveImageUrl(img)} alt="" className="w-16 h-16 rounded object-cover border-2 border-blue-300 cursor-pointer" onClick={() => setZoomedImage(img)} />
                            {/* أيقونات التحكم */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                              <button type="button" onClick={() => setZoomedImage(img)} className="p-1 bg-white/80 rounded-full hover:bg-white" title={t('fleetPage.zoomedImageAlt')}>
                                <ZoomIn className="w-3 h-3 text-gray-700" />
                              </button>
                              <button type="button" onClick={() => setPendingImages(prev => prev.filter((_, idx) => idx !== i))} className="p-1 bg-red-500 rounded-full hover:bg-red-600" title={t('fleetPage.delete')}>
                                <Trash2 className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* أزرار رفع الصور */}
                  <div className="flex gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:border-blue-600 hover:bg-blue-100 bg-white transition-colors">
                      <Upload className="w-5 h-5 text-blue-500" /><span className="text-sm text-blue-700 font-medium">{t('fleetPage.chooseImages')}</span>
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} disabled={uploading} />
                    </label>
                    <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-400 rounded-lg cursor-pointer hover:border-blue-600 hover:bg-blue-100 bg-white transition-colors">
                      <Camera className="w-5 h-5 text-blue-500" /><span className="text-sm text-blue-700 font-medium">{t('fleetPage.camera')}</span>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageSelect} disabled={uploading} />
                    </label>
                  </div>
                  {uploading && <p className="text-sm text-blue-600 mt-2 animate-pulse">{t('fleetPage.preparingImages')}</p>}
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={isSubmitting} className={`flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isSubmitting ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : <>{t('fleetPage.save')} {pendingImages.length > 0 ? `(${pendingImages.length})` : ''}</>}
                  </button>
                  <button type="button" onClick={() => { setShowMaintenanceModal(false); setPendingImages([]); }} className="flex-1 py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200">{t('fleetPage.cancel')}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Details Modal with Images Gallery */}
        {showDetailsModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-cyan-600 px-6 py-4 flex justify-between items-center rounded-t-xl">
                <h3 className="text-lg font-bold text-white">{t('fleetPage.maintenanceDetailsTitle')}</h3>
                <button onClick={() => setShowDetailsModal(false)} className="text-white text-2xl">×</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{t('fleetPage.date')}</p><p className="font-medium">{selectedRecord.date || '-'}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">{t('fleetPage.type')}</p>
                    <p className="font-medium">
                      {maintenanceTypes.find(t => t.value === selectedRecord.maintenance_type)
                        ? t(`fleetPage.maintenanceTypes.${maintenanceTypes.find(t => t.value === selectedRecord.maintenance_type).labelKey}`)
                        : selectedRecord.maintenance_type || '-'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{t('fleetPage.cost')}</p><p className="font-medium text-green-600">{selectedRecord.cost ? t('fleetPage.costFormat', { val: selectedRecord.cost }) : '-'}</p></div>
                  <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{t('fleetPage.workshop')}</p><p className="font-medium">{selectedRecord.workshop || '-'}</p></div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{t('fleetPage.description')}</p><p className="font-medium">{selectedRecord.description || '-'}</p></div>
                {selectedRecord.notes && <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">{t('fleetPage.notesLabel')}</p><p className="font-medium">{selectedRecord.notes}</p></div>}
                
                {/* معرض الصور مع أزرار الحذف والتكبير والتحميل */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium">{t('fleetPage.images')} ({(selectedRecord.images || []).length})</p>
                    <label className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-200 text-sm">
                      <Upload className="w-4 h-4" /> {t('fleetPage.addImages')}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                        handleUploadImages(selectedRecord.id, e.target.files);
                        setTimeout(() => fetchMaintenance(selectedCar.id).then(() => {
                          const updated = maintenanceRecords.find(r => r.id === selectedRecord.id);
                          if (updated) setSelectedRecord(updated);
                        }), 1000);
                      }} />
                    </label>
                  </div>
                  
                  {(selectedRecord.images || []).length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg"><ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" /><p className="text-gray-500">{t('fleetPage.noImages')}</p></div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 sm:grid-cols-4 gap-3">
                      {selectedRecord.images.map((img, i) => (
                        <div key={i} className="relative group rounded-lg overflow-hidden border">
                          <img src={resolveImageUrl(img)} alt="" className="w-full h-24 object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button onClick={() => openImageViewer(selectedRecord.images, i)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full" title={t('fleetPage.zoomedImageAlt')}>
                              <ZoomIn className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={() => downloadImage(img, `maintenance_${i+1}.jpg`)} className="p-2 bg-white/20 hover:bg-white/40 rounded-full" title={t('fleetPage.download')}>
                              <Download className="w-4 h-4 text-white" />
                            </button>
                            <button onClick={() => handleDeleteImage(selectedRecord.id, i)} className="p-2 bg-red-500/80 hover:bg-red-600 rounded-full" title={t('fleetPage.delete')}>
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <button onClick={() => setShowDetailsModal(false)} className="w-full py-2.5 bg-gray-100 rounded-lg hover:bg-gray-200">{t('fleetPage.close')}</button>
              </div>
            </div>
          </div>
        )}

        {/* Image Gallery Popup - معرض الصور المنبثق الصغير */}
        {showImageViewer && viewerImages.length > 0 && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setShowImageViewer(false)}>
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-blue-600 px-4 py-3 flex justify-between items-center">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  {t('fleetPage.imageGalleryTitle', { count: viewerImages.length })}
                </h3>
                <button onClick={() => setShowImageViewer(false)} className="text-white hover:bg-white/20 rounded-full p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Images Grid - شبكة الصور */}
              <div className="p-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {viewerImages.map((img, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors cursor-pointer" onClick={() => setZoomedImage(img)}>
                      <img 
                         src={resolveImageUrl(img)} 
                         alt={t('fleetPage.imageAlt', { index: i + 1 })} 
                         className="w-full h-28 object-cover"
                      />
                      {/* أيقونات التحكم على كل صورة */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none group-hover:pointer-events-auto">
                        <button 
                          onClick={(e) => { e.stopPropagation(); setZoomedImage(img); }}
                          className="p-2 bg-white/90 hover:bg-white rounded-full shadow-lg" 
                          title={t('fleetPage.zoomedImageAlt')}
                        >
                          <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); downloadImage(img, `maintenance_${i+1}.jpg`); }}
                          className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full shadow-lg" 
                          title={t('fleetPage.download')}
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                        {selectedRecord && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(t('fleetPage.confirmDeleteImage'))) {
                                handleDeleteImage(selectedRecord.id, i);
                                if (viewerImages.length === 1) {
                                  setShowImageViewer(false);
                                } else {
                                  setViewerImages(prev => prev.filter((_, idx) => idx !== i));
                                }
                              }
                            }}
                            className="p-2 bg-red-500 hover:bg-red-600 rounded-full shadow-lg" 
                            title={t('fleetPage.delete')}
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        )}
                      </div>
                      {/* رقم الصورة */}
                      <div className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded pointer-events-none">
                        {i + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t px-4 py-3 bg-gray-50 flex justify-end">
                <button 
                  onClick={() => setShowImageViewer(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium"
                >
                  {t('fleetPage.close')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Car User History Modal - سجل تسليم السيارة */}
        {showHistoryModal && selectedCarForHistory && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistoryModal(false)}>
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-purple-600 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    {t('fleetPage.deliveryHistoryTitle')}
                  </h3>
                  <p className="text-purple-200 text-sm mt-1">
                    {translateBrandingText(selectedCarForHistory.car_type, isRtl)} - <span dir="ltr">{translateBrandingText(selectedCarForHistory.plate_number, isRtl)}</span>
                  </p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-white text-2xl hover:bg-white/20 rounded-full p-1">&times;</button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* معلومات السيارة */}
                <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-500">{t('fleetPage.owner')}:</span> <span className="font-medium">{translateBrandingText(selectedCarForHistory.owner_name, isRtl)}</span></div>
                    <div><span className="text-gray-500">{t('fleetPage.modelLabel')}:</span> <span className="font-medium">{translateBrandingText(selectedCarForHistory.model, isRtl)} {selectedCarForHistory.year}</span></div>
                    <div><span className="text-gray-500">{t('fleetPage.currentUserLabel')}:</span> <span className="font-bold text-blue-600">{selectedCarForHistory.current_user_name ? translateBrandingText(selectedCarForHistory.current_user_name, isRtl) : t('fleetPage.unspecified')}</span></div>
                    <div><span className="text-gray-500">{t('fleetPage.colorLabel')}:</span> <span className="font-medium">{translateBrandingText(selectedCarForHistory.color, isRtl)}</span></div>
                  </div>
                </div>

                {/* سجل التسليم */}
                <h4 className="text-md font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" />
                  {t('fleetPage.previousUsersTitle')}
                </h4>
                
                {carHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    <History className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>{t('fleetPage.noHistory')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('fleetPage.noHistorySub')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {carHistory.map((record, idx) => (
                      <div key={record.id || idx} className={`p-4 rounded-lg border-r-4 ${!record.returned_date ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-800 flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-500" />
                              {translateBrandingText(record.user_name, isRtl)}
                              {!record.returned_date && (
                                <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">{t('fleetPage.currentLabel')}</span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('fleetPage.deliveredLabel')} {new Date(record.assigned_date).toLocaleDateString()}
                              {record.assigned_by_name && ` ${t('fleetPage.byLabel')} ${record.assigned_by_name}`}
                            </p>
                          </div>
                          {record.returned_date && (
                            <div className="text-left">
                              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                {t('fleetPage.returnedLabel')} {new Date(record.returned_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        {record.notes && <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded">{record.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 bg-gray-50">
                <button onClick={() => setShowHistoryModal(false)} className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium">
                  {t('fleetPage.close')}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Zoomed Image Modal - عرض صورة مكبرة */}
        {zoomedImage && (
          <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
            <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => setZoomedImage(null)} 
                className="absolute -top-12 right-0 text-white bg-white/20 hover:bg-white/30 rounded-full p-2"
              >
                <X className="w-6 h-6" />
              </button>
              <img 
                src={resolveImageUrl(zoomedImage)} 
                alt={t('fleetPage.zoomedImageAlt')} 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                <button 
                  onClick={() => downloadImage(zoomedImage, 'image.jpg')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('fleetPage.download')}
                </button>
                <button 
                  onClick={() => setZoomedImage(null)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg"
                >
                  {t('fleetPage.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default FleetMaintenance;
