import React from 'react';

const OccasionWatermark = ({ type, isRtl, occasionsList }) => {
  if (!type || type === 'none' || !occasionsList) return null;

  const occasion = occasionsList.find(o => o.id === type);
  if (!occasion) return null;

  const text = isRtl ? occasion.name_ar : occasion.name_en;
  const color = '#0055ff';
  const secondaryColor = '#0033cc';

  if (!text) return null;

  // Define a custom animation for the pulsing text in a style tag
  const pulseKeyframes = `
    @keyframes textPulse {
      0% { opacity: 0.6; transform: scale(1) translateZ(0); }
      50% { opacity: 1; transform: scale(1.05) translateZ(0); text-shadow: 0px 0px 40px ${color}80; }
      100% { opacity: 0.6; transform: scale(1) translateZ(0); }
    }
    .watermark-pulse {
      animation: textPulse 3s ease-in-out infinite;
    }
  `;

  const DecorationGroup = ({ style }) => {
    return (
      <svg width="120" height="300" viewBox="0 0 120 300" fill="none" className="absolute top-0 opacity-80" style={style}>
        {/* String 1 (Main Balloon) */}
        <path d="M40 0 L40 100" stroke={color} strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Main Balloon */}
        <ellipse cx="40" cy="140" rx="30" ry="40" fill={color} opacity="0.95" />
        <ellipse cx="30" cy="125" rx="8" ry="12" fill="#ffffff" opacity="0.6" transform="rotate(-30 30 125)" />
        <path d="M32 180 L48 180 L44 190 L36 190 Z" fill={secondaryColor} />
        <path d="M40 190 Q20 220 50 240" stroke={secondaryColor} strokeWidth="1.5" fill="none" />
        
        {/* Depending on type, add an extra specific icon hanging nearby */}
        {type === 'ramadan' && (
          <g transform="translate(45, 30)">
            <path d="M20 0 L20 60" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M15 60 L25 60 L22 75 L18 75 Z" fill={color} />
            <path d="M18 75 L13 100 L27 100 L22 75 Z" fill={secondaryColor} opacity="0.9" />
            <path d="M13 100 L27 100 L20 110 Z" fill={color} />
          </g>
        )}

        {(type === 'national_day' || type === 'foundation_day') && (
          <g transform="translate(50, 40)">
            <path d="M10 0 L10 50" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M10 50 L35 65 L10 80 Z" fill={color} />
            <circle cx="15" cy="65" r="3" fill="#fff" />
          </g>
        )}

        {(type === 'eid_adha' || type === 'eid_fitr') && (
          <g transform="translate(60, 20)">
            <path d="M10 0 L10 80" stroke={secondaryColor} strokeWidth="1.5" strokeDasharray="3 3" />
            <ellipse cx="10" cy="100" rx="15" ry="20" fill={secondaryColor} opacity="0.9" />
            <path d="M5 120 L15 120 L12 125 L8 125 Z" fill={color} />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none flex justify-between px-2 sm:px-8">
      <style>{pulseKeyframes}</style>
      
      {/* Right Side (since Arabic is RTL, right is often start, but we'll show on both) */}
      <div className="relative h-full flex flex-col items-center opacity-90">
        <DecorationGroup style={{ right: '0px', transform: 'scaleX(-1)' }} />
        <div className="mt-[320px] flex items-center justify-center watermark-pulse" style={{ transform: 'rotate(-10deg)', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: '2.5' }}>
          <span className="text-3xl sm:text-5xl lg:text-5xl flex flex-col items-center gap-20 font-black" style={{ color: color, textShadow: `0px 0px 10px rgba(255,255,255,0.8), 0px 0px 30px ${color}`, fontFamily: '"Amiri", "Aref Ruqaa", serif' }}>
            {text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
          </span>
        </div>
      </div>

      {/* Left Side */}
      <div className="relative h-full flex flex-col items-center opacity-90">
        <DecorationGroup style={{ left: '0px' }} />
        <div className="mt-[320px] flex items-center justify-center watermark-pulse" style={{ transform: 'rotate(10deg)', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: '2.5' }}>
          <span className="text-3xl sm:text-5xl lg:text-5xl flex flex-col items-center gap-20 font-black" style={{ color: color, textShadow: `0px 0px 10px rgba(255,255,255,0.8), 0px 0px 30px ${color}`, fontFamily: '"Amiri", "Aref Ruqaa", serif' }}>
            {text.split('\n').map((line, i) => <div key={i}>{line}</div>)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OccasionWatermark;
