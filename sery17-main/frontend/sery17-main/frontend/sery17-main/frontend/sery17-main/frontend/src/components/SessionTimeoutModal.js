import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const decodeJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const SessionTimeoutModal = ({ token, onLogout, onExtend }) => {
  const [showModal, setShowModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!token) {
      setShowModal(false);
      return;
    }

    const decoded = decodeJwt(token);
    if (!decoded || !decoded.exp) return;

    const expirationTimeMs = decoded.exp * 1000;
    
    // Interval to check time left
    const interval = setInterval(() => {
      const currentTimeMs = Date.now();
      const remainingMs = expirationTimeMs - currentTimeMs;
      
      if (remainingMs <= 0) {
        // Session expired
        clearInterval(interval);
        onLogout();
        toast.info("انتهت جلسة العمل الخاصة بك بسبب عدم التمديد، يرجى تسجيل الدخول مجدداً.", { theme: "colored" });
      } else if (remainingMs <= 5 * 60 * 1000) { // 5 minutes
        // Show modal
        if (!showModal) {
          setShowModal(true);
        }
        setTimeLeft(Math.floor(remainingMs / 1000));
      } else {
        // Hide modal if somehow it's shown (e.g. after extending)
        setShowModal(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token, onLogout, showModal]);

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/extend`);
      const { access_token, user: userData } = response.data;
      onExtend(access_token, userData);
      setShowModal(false);
      toast.success("تم تمديد الجلسة بنجاح لمدة 24 ساعة أخرى", { theme: "colored" });
    } catch (error) {
      console.error("Failed to extend session:", error);
      toast.error("فشل تمديد الجلسة", { theme: "colored" });
      onLogout();
    } finally {
      setIsExtending(false);
    }
  };

  if (!showModal) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center border-t-4 border-orange-500 transform transition-all scale-100">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <svg className="w-8 h-8 text-orange-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-extrabold text-gray-900 mb-2">تنبيه انتهاء الجلسة</h3>
        <p className="text-sm font-semibold text-gray-600 mb-4 leading-relaxed">
          أمامك <span className="font-black text-lg text-orange-600 mx-1">{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span> دقيقة قبل أن تنتهي جلسة العمل الحالية كإجراء أمني.
        </p>
        <p className="text-xs text-gray-500 mb-6 font-medium">
          هل ترغب في الاستمرار وتمديد الجلسة؟
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
          <button 
            onClick={handleExtend}
            disabled={isExtending}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-md flex-1 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExtending ? 'جاري التمديد...' : 'تمديد الجلسة'}
          </button>
          <button 
            onClick={onLogout}
            className="px-4 py-2.5 bg-gray-100 border border-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-200 hover:text-red-600 transition-colors flex-1"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
