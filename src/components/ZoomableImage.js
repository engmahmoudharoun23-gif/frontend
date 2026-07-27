import React, { useState, useRef, useEffect } from 'react';

const ZoomableImage = ({ src, alt, className = '', onClick, ...props }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const touchStartDist = useRef(null);
  const containerRef = useRef(null);

  // إعادة ضبط التكبير عند تغيير مصدر الصورة
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  // التحكم بالزوم من عجلة/رول الماوس
  const handleWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
    setScale((prevScale) => {
      const newScale = Math.min(Math.max(prevScale * zoomFactor, 1), 6);
      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  // إضافة استجابة السكرول بشكل آمن لمنع حركة الخلفية
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => handleWheel(e);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // سحب وتحريك الصورة بالماوس
  const handleMouseDown = (e) => {
    if (scale <= 1) return;
    e.preventDefault();
    isDragging.current = true;
    startPos.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - startPos.current.x,
      y: e.clientY - startPos.current.y
    });
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // النقر المزدوج للتكبير/إعادة الضغط السريع
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2.5);
    }
  };

  // دعم إيماءات الهواتف المحمولة (Pinch-to-zoom & Drag)
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      isDragging.current = true;
      startPos.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      setScale((prevScale) => {
        const newScale = Math.min(Math.max(prevScale * factor, 1), 6);
        if (newScale === 1) setPosition({ x: 0, y: 0 });
        return newScale;
      });
      touchStartDist.current = dist;
    } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - startPos.current.x,
        y: e.touches[0].clientY - startPos.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    touchStartDist.current = null;
  };

  return (
    <div
      ref={containerRef}
      className="overflow-hidden flex items-center justify-center w-full h-full select-none cursor-grab active:cursor-grabbing pointer-events-auto"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      onClick={onClick}
    >
      <img
        src={src}
        alt={alt}
        className={`${className} transition-transform duration-75 ease-out`}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          maxHeight: '90vh',
          maxWidth: '90vw',
          objectFit: 'contain'
        }}
        draggable={false}
        {...props}
      />
    </div>
  );
};

export default ZoomableImage;
