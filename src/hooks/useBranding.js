// Hook لجلب إعدادات العلامة التجارية (Branding)
import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DEFAULT_BRANDING = {
  platform_name: 'بيت الخبرة',
  company_name: 'شركة بيت الخبرة للإستشارات الهندسية',
  company_description: '',
  project_manager_name: 'المهندس أحمد عبيدات',
  project_manager_title: 'مدير عام المشاريع',
  project_coordinator_name: 'الأستاذ أحمد حافظ',
  project_coordinator_title: 'منسق المشاريع',
  consultant_name: 'مكتب بيت الخبرة للاستشارات الهندسية',
  partner_company_name: 'شركة المياة الوطنية',
  company_logo_url: '/bayt-alkhibra-logo.png',
  partner_logo_url: '/nwc-logo.png',
  login_description: '',
  global_announcement: '',
  show_announcement: false,
};

// Cache في الذاكرة لتجنب الطلبات المتكررة
let cachedBranding = null;
let fetchPromise = null;

export function useBranding() {
  const [branding, setBranding] = useState(cachedBranding || DEFAULT_BRANDING);
  const [loading, setLoading] = useState(!cachedBranding);

  useEffect(() => {
    if (cachedBranding) {
      setBranding(cachedBranding);
      setLoading(false);
      return;
    }
    
    if (!fetchPromise) {
      fetchPromise = axios.get(`${API}/settings/platform`)
        .then(res => {
          cachedBranding = { ...DEFAULT_BRANDING, ...res.data };
          return cachedBranding;
        })
        .catch(() => {
          cachedBranding = DEFAULT_BRANDING;
          return DEFAULT_BRANDING;
        });
    }
    
    fetchPromise.then(data => {
      setBranding(data);
      setLoading(false);
    });
  }, []);

  return { branding, loading };
}

// لإعادة تحميل الإعدادات بعد حفظها
export function invalidateBrandingCache() {
  cachedBranding = null;
  fetchPromise = null;
}
