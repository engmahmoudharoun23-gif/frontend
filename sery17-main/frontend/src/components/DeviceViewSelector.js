import React, { useState, useEffect } from 'react';

function DeviceViewSelector({ onViewSelected }) {
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // كشف إذا كان الجهاز هاتف محمول
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      return mobileRegex.test(userAgent) || window.innerWidth <= 768;
    };

    const mobile = checkMobile();
    setIsMobile(mobile);

    // التحقق من وجود اختيار سابق
    const savedView = localStorage.getItem('deviceView');
    
    if (mobile && !savedView) {
      // أول مرة من الهاتف - عرض Modal
      setShowModal(true);
    } else if (savedView) {
      // تطبيق الاختيار المحفوظ
      applyView(savedView);
    }
  }, []);

  const applyView = (view) => {
    if (view === 'mobile') {
      // تطبيق meta viewport للعرض المحمول
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }
      viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.body.classList.add('mobile-view');
      document.body.classList.remove('desktop-view');
    } else {
      // تطبيق meta viewport لعرض سطح المكتب
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
      }
      viewport.content = 'width=1200';
      document.body.classList.add('desktop-view');
      document.body.classList.remove('mobile-view');
    }
    
    if (onViewSelected) {
      onViewSelected(view);
    }
  };

  const handleViewSelection = (view) => {
    localStorage.setItem('deviceView', view);
    localStorage.setItem('deviceViewFirstTime', 'true');
    applyView(view);
    setShowModal(false);
  };

  if (!showModal) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>📱</div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '10px',
          color: '#1e40af'
        }}>
          اختر طريقة العرض
        </h2>
        
        <p style={{ 
          color: '#6b7280', 
          marginBottom: '30px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          تم اكتشاف أنك تستخدم هاتف محمول.
          <br />
          يرجى اختيار طريقة العرض المناسبة:
        </p>

        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '15px'
        }}>
          <button
            onClick={() => handleViewSelection('mobile')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
            }}
          >
            <span style={{ fontSize: '24px' }}>📱</span>
            <div style={{ textAlign: 'right' }}>
              <div>عرض الهاتف المحمول</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 'normal' }}>
                محسّن للشاشات الصغيرة
              </div>
            </div>
          </button>

          <button
            onClick={() => handleViewSelection('desktop')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)'
            }}
          >
            <span style={{ fontSize: '24px' }}>🖥️</span>
            <div style={{ textAlign: 'right' }}>
              <div>عرض سطح المكتب</div>
              <div style={{ fontSize: '12px', opacity: 0.9, fontWeight: 'normal' }}>
                العرض الكامل للبيانات
              </div>
            </div>
          </button>
        </div>

        <p style={{ 
          fontSize: '12px', 
          color: '#9ca3af', 
          marginTop: '20px'
        }}>
          💡 يمكنك تغيير الاختيار لاحقاً من الإعدادات
        </p>
      </div>
    </div>
  );
}

export default DeviceViewSelector;
