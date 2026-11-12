import React from 'react';
import {
  Building2,
  HeartPulse,
  GraduationCap,
  Droplets,
  Zap,
  Landmark,
  Bus,
  HandHeart,
} from 'lucide-react';

export function KeralaEmblem({ size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="keralaShieldBg" x1="8" y1="6" x2="56" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#062b4e" />
          <stop offset="55%" stopColor="#0b4f8a" />
          <stop offset="100%" stopColor="#0d7a5f" />
        </linearGradient>
        <linearGradient id="kasavuGold" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f5d061" />
          <stop offset="50%" stopColor="#d4a024" />
          <stop offset="100%" stopColor="#b4821a" />
        </linearGradient>
      </defs>

      {/* Outer civic crest */}
      <path
        d="M32 4L54 12V30C54 44.5 44.5 54.8 32 60C19.5 54.8 10 44.5 10 30V12L32 4Z"
        fill="url(#keralaShieldBg)"
        stroke="url(#kasavuGold)"
        strokeWidth="2.4"
      />
      <path
        d="M32 8.5L49.5 15V30C49.5 41.8 41.8 50.3 32 54.8C22.2 50.3 14.5 41.8 14.5 30V15L32 8.5Z"
        stroke="rgba(245, 208, 97, 0.35)"
        strokeWidth="1"
      />

      {/* Palm frond arch motif (left & right) */}
      <path
        d="M21 37C18.5 31 19 23.5 24 18.5C21.5 24 21.8 30 24.5 35.5"
        stroke="#86efac"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M43 37C45.5 31 45 23.5 40 18.5C42.5 24 42.2 30 39.5 35.5"
        stroke="#86efac"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Stylized Shankha (Conch) civic center */}
      <path
        d="M32 18C27.5 18 24.5 21.6 24.5 26C24.5 30.8 27.8 34.4 32 37.5C36.2 34.4 39.5 30.8 39.5 26C39.5 21.6 36.5 18 32 18Z"
        fill="url(#kasavuGold)"
      />
      <path
        d="M28.5 25.5C28.5 23.5 30 22 32 22C34 22 35.5 23.5 35.5 25.5C35.5 27.5 33.8 29 32 29"
        stroke="#062b4e"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Backwater waves & Kasavu ribbon */}
      <path
        d="M21 42.5C24.5 40.5 28.5 40.5 32 42.5C35.5 44.5 39.5 44.5 43 42.5"
        stroke="#f5d061"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M23.5 47C26.5 45.4 29.5 45.4 32 47C34.5 48.6 37.5 48.6 40.5 47"
        stroke="#6ee7b7"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export const KERALA_DISTRICTS_META = [
  { name: 'Thiruvananthapuram', ml: 'തിരുവനന്തപുരം', code: 'TVM', region: 'South' },
  { name: 'Kollam', ml: 'കൊല്ലം', code: 'KLM', region: 'South' },
  { name: 'Pathanamthitta', ml: 'പത്തനംതിട്ട', code: 'PTA', region: 'South' },
  { name: 'Alappuzha', ml: 'ആലപ്പുഴ', code: 'ALP', region: 'South' },
  { name: 'Kottayam', ml: 'കോട്ടയം', code: 'KTM', region: 'Central' },
  { name: 'Idukki', ml: 'ഇടുക്കി', code: 'IDK', region: 'Central' },
  { name: 'Ernakulam', ml: 'എറണാകുളം', code: 'EKM', region: 'Central' },
  { name: 'Thrissur', ml: 'തൃശ്ശൂർ', code: 'TSR', region: 'Central' },
  { name: 'Palakkad', ml: 'പാലക്കാട്', code: 'PKD', region: 'North' },
  { name: 'Malappuram', ml: 'മലപ്പുറം', code: 'MLP', region: 'North' },
  { name: 'Kozhikode', ml: 'കോഴിക്കോട്', code: 'KKD', region: 'North' },
  { name: 'Wayanad', ml: 'വയനാട്', code: 'WYD', region: 'North' },
  { name: 'Kannur', ml: 'കണ്ണൂർ', code: 'KNR', region: 'North' },
  { name: 'Kasaragod', ml: 'കാസർഗോഡ്', code: 'KSD', region: 'North' },
];

export function getDepartmentIcon(code) {
  switch (String(code || '').toUpperCase()) {
    case 'HLTH':
      return HeartPulse;
    case 'EDU':
      return GraduationCap;
    case 'WTR':
      return Droplets;
    case 'PWR':
      return Zap;
    case 'REV':
      return Landmark;
    case 'TRN':
      return Bus;
    case 'WEL':
      return HandHeart;
    case 'PWD':
    default:
      return Building2;
  }
}

export const KERALA_HELPLINES = [
  { label: 'Emergency Response (ERSS)', ml: 'അടിയന്തര സഹായം', number: '112' },
  { label: 'CM Grievance Desk (Sample)', ml: 'പരാതി പരിഹാര ഡെസ്ക്', number: '1076' },
  { label: 'State Police Control', ml: 'പോലീസ്', number: '100' },
  { label: 'Fire & Rescue Services', ml: 'അഗ്നിരക്ഷാ സേവനം', number: '101' },
  { label: 'Medical / Ambulance', ml: 'ആംബുലൻസ്', number: '108' },
  { label: 'Cyber Crime Helpline', ml: 'സൈബർ സുരക്ഷ', number: '1930' },
];

export function KeralaSecretariatBackdrop() {
  return (
    <svg
      viewBox="0 0 1200 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: 0,
        bottom: 0,
        width: 'min(900px, 75vw)',
        height: 'auto',
        opacity: 0.14,
        pointerEvents: 'none',
      }}
    >
      {/* Classical Secretariat Pediment & Colonnade Silhouette */}
      <path d="M520 75L730 22L940 75H520Z" fill="#fde68a" />
      <rect x="545" y="75" width="370" height="14" fill="#fef3c7" />
      <rect x="560" y="96" width="22" height="140" fill="#e2e8f0" />
      <rect x="615" y="96" width="22" height="140" fill="#e2e8f0" />
      <rect x="670" y="96" width="22" height="140" fill="#e2e8f0" />
      <rect x="768" y="96" width="22" height="140" fill="#e2e8f0" />
      <rect x="823" y="96" width="22" height="140" fill="#e2e8f0" />
      <rect x="878" y="96" width="22" height="140" fill="#e2e8f0" />
      <rect x="708" y="92" width="44" height="144" rx="22" fill="#bbf7d0" fillOpacity="0.55" />
      <rect x="330" y="110" width="215" height="126" fill="#cbd5e1" fillOpacity="0.6" />
      <rect x="915" y="110" width="235" height="126" fill="#cbd5e1" fillOpacity="0.6" />
      <rect x="300" y="236" width="870" height="24" fill="#f5d061" fillOpacity="0.55" />
      {/* Stylized Coconut Palm Fronds on Left & Right */}
      <path d="M235 260C235 200 245 160 272 135" stroke="#86efac" strokeWidth="7" strokeLinecap="round" />
      <path d="M272 135C242 122 212 128 192 148" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
      <path d="M272 135C298 118 326 125 344 146" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
      <path d="M272 135C255 104 235 95 215 102" stroke="#86efac" strokeWidth="4" strokeLinecap="round" />
      <path d="M1110 260C1108 205 1094 166 1066 142" stroke="#86efac" strokeWidth="7" strokeLinecap="round" />
      <path d="M1066 142C1095 126 1126 130 1146 150" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
      <path d="M1066 142C1038 128 1012 136 996 156" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
      {/* Backwater Wave Accents */}
      <path
        d="M80 288C165 270 250 270 335 288C420 306 505 306 590 288C675 270 760 270 845 288C930 306 1015 306 1120 288"
        stroke="#6ee7b7"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
