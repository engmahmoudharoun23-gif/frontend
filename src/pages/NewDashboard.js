import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useBranding } from '../hooks/useBranding';
import { hasAnyProjectPermission } from '../utils/permissions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// الثيمات المتاحة
const themeColors = {
  blue: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', hover: '#1d4ed8', light: '#dbeafe' },
  green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', hover: '#047857', light: '#d1fae5' },
  gray: { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', hover: '#374151', light: '#e5e7eb' },
  'gray-light': { primary: '#6b7280', secondary: '#9ca3af', accent: '#d1d5db', hover: '#4b5563', light: '#f3f4f6' },
  purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', hover: '#6d28d9', light: '#ede9fe' },
  teal: { primary: '#0d9488', secondary: '#14b8a6', accent: '#2dd4bf', hover: '#0f766e', light: '#ccfbf1' },
  amber: { primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', hover: '#b45309', light: '#fef3c7' },
  rose: { primary: '#e11d48', secondary: '#f43f5e', accent: '#fb7185', hover: '#be123c', light: '#ffe4e6' },
  slate: { primary: '#334155', secondary: '#475569', accent: '#94a3b8', hover: '#1e293b', light: '#f8fafc' },
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const PROJECT_NAMES = {
  west: 'مشروع المحافظات الغربية - القطاع الأوسط',
  leak: 'مشروع كشف التسربات وإصلاحها',
  eisal: 'ايصال',
  eisal_riyadh: 'ايصال الرياض'
};

const normalizeArabic = (text) => {
  if (!text) return "";
  return text.toString()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
};

const cleanProjectName = (name) => {
  if (!name) return "";
  return normalizeArabic(name)
    .replace(/^مشروع\s+/, "")
    .replace(/^اصلاح\s+اعمال\s+/, "")
    .replace(/^بلاغات\s+/, "")
    .replace(/^إجمالي\s+بلاغات\s+/, "")
    .replace(/\s+-\s*القطاع\s+الأوسط$/, "")
    .trim();
};

// دالة للحصول على مفتاح المشروع من الاسم
const getProjectKey = (projectName) => {
  if (!projectName) return 'other';
  const entries = Object.entries(PROJECT_NAMES);
  
  // محاولة المطابقة المباشرة أولاً
  for (const [key, value] of entries) {
    if (value === projectName) return key;
  }
  
  // محاولة المطابقة المرنة (تجاهل الهمزات والمسافات الزائدة)
  const normalize = (s) => s.replace(/[أإآا]/g, 'ا').replace(/\s+/g, ' ').trim();
  const normalizedInput = normalize(projectName);
  
  for (const [key, value] of entries) {
    if (normalize(value) === normalizedInput) return key;
    if (normalizedInput.includes(normalize(value)) || normalize(value).includes(normalizedInput)) return key;
  }
  
  return projectName || 'other';
};

// المسميات الافتراضية للبطاقات
const DEFAULT_CARD_LABELS = {
  asphalt_waiting: 'عدد البلاغات بانتظار الأسفلت',
  asphalt_licensed: 'عدد الرخص الصادرة لبلاغات الأسفلت',
  asphalt_unlicensed: 'عدد الرخص الغير صادرة لبلاغات الأسفلت',
  tile_licensed: 'عدد الرخص الصادرة لبلاغات البلاط',
  tile_unlicensed: 'عدد الرخص الغير صادرة لبلاغات البلاط',
  fixed_title: 'البلاغات التي تم إصلاحها حسب النوع',
  type_terrestrial: 'ترابي',
  type_tile: 'بلاط',
  type_asphalt: 'أسفلت',
  terrestrial_licensed: 'عدد الرخص الصادرة لبلاغات التراب',
  terrestrial_unlicensed: 'عدد الرخص الغير صادرة لبلاغات التراب'
};

const PROJECT_NAMES_EN = {
  'مشروع المحافظات الغربية - القطاع الأوسط': 'Western Governorates Project - Middle Sector',
  'مشروع المحافظات الغربية -القطاع الأوسط': 'Western Governorates Project - Middle Sector',
  'مشروع المحافظات الشمالية -القطاع الأوسط': 'Northern Governorates Project - Middle Sector',
  'مشروع المحافظات الجنوبية -القطاع الأوسط': 'Southern Governorates Project - Middle Sector',
  'مشروع كشف التسربات وإصلاحها': 'Leak Detection and Repair Project',
  'ايصال': 'Eisal Project',
  'ايصال الرياض': 'Eisal Riyadh Project',
  'مشروع ايصال': 'Eisal Project',
  'إيصال': 'Eisal',
  'التشوه البصري': 'Visual Distortion',
  'التشوة البصري': 'Visual Distortion',
  'مشروع التشوه البصري': 'Visual Distortion Project',
  'مشروع التشوة البصري': 'Visual Distortion Project',
  'مشروع معالجة التشوه البصري': 'Visual Distortion Remedy Project',
  'مشروع معالجة التشوة البصري': 'Visual Distortion Remedy Project',
  'معالجة التشوه البصري': 'Visual Distortion Remedy',
  'معالجة التشوة البصري': 'Visual Distortion Remedy',
  'ايصال مكة': 'Eisal Mecca Project',
  'إيصال مكة': 'Eisal Mecca Project',
  'مشروع ايصال مكة': 'Eisal Mecca Project',
  'مشروع إيصال مكة': 'Eisal Mecca Project'
};

const CLEAN_PROJECT_NAMES_EN = {
  'مشروع المحافظات الغربية - القطاع الأوسط': 'Western Governorates',
  'مشروع المحافظات الغربية -القطاع الأوسط': 'Western Governorates',
  'مشروع المحافظات الشمالية -القطاع الأوسط': 'Northern Governorates',
  'مشروع المحافظات الجنوبية -القطاع الأوسط': 'Southern Governorates',
  'مشروع كشف التسربات وإصلاحها': 'Leak Detection & Repair',
  'ايصال': 'Eisal',
  'ايصال الرياض': 'Eisal Riyadh',
  'مشروع ايصال': 'Eisal',
  'إيصال': 'Eisal',
  'التشوه البصري': 'Visual Distortion',
  'التشوة البصري': 'Visual Distortion',
  'مشروع التشوه البصري': 'Visual Distortion',
  'مشروع التشوة البصري': 'Visual Distortion',
  'مشروع معالجة التشوه البصري': 'Visual Distortion',
  'مشروع معالجة التشوة البصري': 'Visual Distortion',
  'معالجة التشوه البصري': 'Visual Distortion',
  'معالجة التشوة البصري': 'Visual Distortion',
  'ايصال مكة': 'Eisal Mecca',
  'إيصال مكة': 'Eisal Mecca',
  'مشروع ايصال مكة': 'Eisal Mecca',
  'مشروع إيصال مكة': 'Eisal Mecca'
};

const DEFAULT_CARD_LABELS_EN = {
  asphalt_waiting: 'Reports Awaiting Asphalt',
  asphalt_licensed: 'Licenses Issued for Asphalt Reports',
  asphalt_unlicensed: 'Licenses Pending for Asphalt Reports',
  tile_licensed: 'Licenses Issued for Tile Reports',
  tile_unlicensed: 'Licenses Pending for Tile Reports',
  fixed_title: 'Repaired Reports by Type',
  type_terrestrial: 'Dirt',
  type_tile: 'Tile',
  type_asphalt: 'Asphalt',
  terrestrial_licensed: 'Licenses Issued for Dirt Reports',
  terrestrial_unlicensed: 'Licenses Pending for Dirt Reports'
};

const mappings = {
  'عدد البلاغات بانتظار الأسفلت': 'Reports Awaiting Asphalt',
  'عدد الرخص الصادرة لبلاغات الأسفلت': 'Licenses Issued for Asphalt Reports',
  'عدد الرخص الغير صادرة لبلاغات الأسفلت': 'Licenses Pending for Asphalt Reports',
  'عدد الرخص الصادرة لبلاغات البلاط': 'Licenses Issued for Tile Reports',
  'عدد الرخص الغير صادرة لبلاغات البلاط': 'Licenses Pending for Tile Reports',
  'عدد الرخص الصادرة لبلاغات التراب': 'Licenses Issued for Dirt Reports',
  'عدد الرخص الغير صادرة لبلاغات التراب': 'Licenses Pending for Dirt Reports',
  'البلاغات التي تم إصلاحها حسب النوع': 'Repaired Reports by Type',
  'ترابي': 'Dirt',
  'بلاط': 'Tile',
  'أسفلت': 'Asphalt',
  'عدد الرخص الصادرة لبلاغات التراب': 'Licenses Issued for Dirt Reports',
  'عدد الرخص الغير صادرة لبلاغات التراب': 'Licenses Pending for Dirt Reports'
};

// دالة للحصول على مسمى البطاقة
const getCardLabel = (cards, key, defaultLabel, isRtl) => {
  const card = cards?.find(c => c.key === key);
  const label = card?.label || defaultLabel;
  if (isRtl) return label;
  return mappings[label] || DEFAULT_CARD_LABELS_EN[key] || label;
};

const STATUSES_EN = {
  'مفتوح': 'Open',
  'مغلق': 'Closed',
  'قيد التنفيذ': 'In Progress',
  'معلق': 'Pending',
  'مكتمل': 'Completed',
  'ملغي': 'Cancelled',
  'تحت المراجعة': 'Under Review',
  'مقبول': 'Approved',
  'مرفوض': 'Rejected',
  'تم الإصلاح': 'Repaired',
  'بانتظار الأسفلت': 'Awaiting Asphalt',
  'جاري': 'In Progress',
  'تم الاصلاح': 'Repaired'
};

const TYPES_EN = {
  'ترابي': 'Dirt',
  'بلاط': 'Tile',
  'أسفلت': 'Asphalt',
  'اسفلت': 'Asphalt',
  'مياه': 'Water',
  'صرف': 'Sewage',
  'صرف صحي': 'Sewage'
};

const BRANDING_TRANSLATIONS_EN = {
  'بيت الخبرة': 'Expert House',
  'شركة بيت الخبرة للإستشارات الهندسية': 'Expert House Engineering Consultancy Company',
  'المهندس أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'المهندس / أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'المهندس/أحمد عبيدات': 'Eng. Ahmed Obeidat',
  'المهندس / احمد عبيدات': 'Eng. Ahmed Obeidat',
  'المهندس/احمد عبيدات': 'Eng. Ahmed Obeidat',
  'أحمد عبيدات': 'Ahmed Obeidat',
  'احمد عبيدات': 'Ahmed Obeidat',
  'مدير عام المشاريع': 'General Projects Manager',
  'الأستاذ أحمد حافظ': 'Mr. Ahmed Hafez',
  'منسق المشاريع': 'Projects Coordinator',
  'مكتب بيت الخبرة للاستشارات الهندسية': 'Expert House Engineering Consultancy',
  'مكتب بيت الخبرة للإستشارات الهندسية': 'Expert House Engineering Consultancy',
  'مكتب بيت الخبره للاستشارات الهندسيه': 'Expert House Engineering Consultancy',
  'مكتب بيت الخبره للإستشارات الهندسيه': 'Expert House Engineering Consultancy',
  'شركة المياة الوطنية': 'National Water Company',
  'شركة المياه الوطنية': 'National Water Company',
  'نظام إدارة البلاغات والمشاريع - WFM': 'Project and Reports Management System - WFM',
  'نظام إدارة البلاغات المستلمة من WFM': 'Reports Management System Received from WFM'
};

const translateProject = (name, isRtl) => {
  if (!name) return "";
  if (isRtl) return name;
  return PROJECT_NAMES_EN[name] || name.replace('مشروع إصلاح أعمال ', 'Repair Works Project ').replace('مشروع ', 'Project ');
};

const translateStatus = (status, isRtl) => {
  if (isRtl || !status) return status;
  return STATUSES_EN[status] || status;
};

const translateType = (type, isRtl) => {
  if (isRtl || !type) return type;
  return TYPES_EN[type] || type;
};

const dynamicTranslationsCache = (() => {
  try {
    const saved = localStorage.getItem('wfm_dynamic_branding_cache');
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    return {};
  }
})();

const saveDynamicCache = () => {
  try {
    localStorage.setItem('wfm_dynamic_branding_cache', JSON.stringify(dynamicTranslationsCache));
  } catch (e) {
    console.error(e);
  }
};

const localWordsMap = {
  'مهندس': 'Eng.',
  'المهندس': 'Eng.',
  'المهندسة': 'Eng.',
  'استشاري': 'Consultant',
  'الاستشاري': 'Consultant',
  'مدير': 'Manager',
  'عام': 'General',
  'المشاريع': 'Projects',
  'مشروع': 'Project',
  'منسق': 'Coordinator',
  'نظام': 'System',
  'إدارة': 'Management',
  'البلاغات': 'Reports',
  'بيت': 'House',
  'الخبرة': 'Expert',
  'شركة': 'Company',
  'المياه': 'Water',
  'المياة': 'Water',
  'الوطنية': 'National',
  'للإستشارات': 'Consultancy',
  'للاستشارات': 'Consultancy',
  'الهندسية': 'Engineering',
  'أحمد': 'Ahmed',
  'احمد': 'Ahmed',
  'حافظ': 'Hafez',
  'عبيدات': 'Obeidat',
  'محمود': 'Mahmoud',
  'على': 'Ali',
  'علي': 'Ali',
  'محمد': 'Mohamed',
  'خالد': 'Khaled',
  'عبد': 'Abdel',
  'الرحمن': 'Rahman',
  'الله': 'Allah',
  'حسن': 'Hassan',
  'حسين': 'Hussein',
  'مكتب': 'Office',
  'شريك': 'Success',
  'النجاح': 'Partner'
};

const translateLocalSmart = (text) => {
  if (!text) return "";
  let cleaned = text.toString().replace(/\s*\/\s*/g, ' ').replace(/\s+/g, ' ').trim();
  let words = cleaned.split(' ');
  let translatedWords = words.map(word => {
    const normalized = word.replace(/[أإآ]/g, 'ا').replace(/ة$/g, 'ه').replace(/ى$/g, 'ي');
    if (localWordsMap[word]) return localWordsMap[word];
    if (localWordsMap[normalized]) return localWordsMap[normalized];
    return word;
  });
  return translatedWords.join(' ');
};

const pendingTranslations = new Set();

const triggerAsyncTranslation = (text) => {
  if (!text || pendingTranslations.has(text) || dynamicTranslationsCache[text]) return;
  pendingTranslations.add(text);
  
  fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`)
    .then(res => res.json())
    .then(data => {
      let trans = data?.responseData?.translatedText || data?.matches?.[0]?.translation;
      if (trans && trans !== text) {
        trans = trans.replace(/\bEngineer\b/gi, 'Eng.').replace(/\bOffice\b/gi, 'Office');
        dynamicTranslationsCache[text] = trans;
        saveDynamicCache();
        const event = new CustomEvent('wfm_translation_updated', { detail: { text, trans } });
        window.dispatchEvent(event);
      }
    })
    .catch(err => {
      console.warn('Dynamic translation failed:', text, err);
    })
    .finally(() => {
      pendingTranslations.delete(text);
    });
};
const translateBrandingText = (text, isRtl) => {
  if (isRtl || !text) return text;
  const trimmed = text.toString().trim();
  
  // 1. Try direct exact match
  if (BRANDING_TRANSLATIONS_EN[trimmed]) return BRANDING_TRANSLATIONS_EN[trimmed];
  
  // 2. Try match using normalized keys
  const normInput = normalizeArabic(trimmed);
  const matchedKey = Object.keys(BRANDING_TRANSLATIONS_EN).find(key => {
    return normalizeArabic(key) === normInput;
  });
  if (matchedKey) return BRANDING_TRANSLATIONS_EN[matchedKey];
  
  // 3. Check dynamic translations cache
  if (dynamicTranslationsCache[trimmed]) return dynamicTranslationsCache[trimmed];
  if (dynamicTranslationsCache[normInput]) return dynamicTranslationsCache[normInput];
  
  // 4. Fallback to smart local rules
  const localSmart = translateLocalSmart(trimmed);
  
  // 5. Trigger asynchronous fetch to MyMemory API to update cache in background
  triggerAsyncTranslation(trimmed);
  
  return localSmart || trimmed;
};

// Project Card Component - يستخدم المسميات الديناميكية
const ProjectCard = ({ title, stats, projectKey, cardLabels = [] }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const translatedTitle = translateProject(title, isRtl);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-600">
      <h3 className="text-xl font-bold text-gray-900 mb-6 pb-3 border-b border-gray-200">
        {translatedTitle}
      </h3>
      
      <div className="space-y-4">
        {/* البلاغات المتبقي الأسفلت */}
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'asphalt_waiting', DEFAULT_CARD_LABELS.asphalt_waiting, isRtl)}</span>
            <span className="text-2xl font-bold text-yellow-600">{stats.asphaltRemaining}</span>
          </div>
        </div>

        {/* الرخص الصادرة */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'asphalt_licensed', DEFAULT_CARD_LABELS.asphalt_licensed, isRtl)}</span>
            <span className="text-2xl font-bold text-green-600">{stats.licensed}</span>
          </div>
        </div>

        {/* الرخص غير الصادرة */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'asphalt_unlicensed', DEFAULT_CARD_LABELS.asphalt_unlicensed, isRtl)}</span>
            <span className="text-2xl font-bold text-red-600">{stats.unlicensed}</span>
          </div>
        </div>

        {/* الرخص الصادرة للبلاط */}
        <div className="bg-teal-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'tile_licensed', DEFAULT_CARD_LABELS.tile_licensed, isRtl)}</span>
            <span className="text-2xl font-bold text-teal-600">{stats.tile_licensed}</span>
          </div>
        </div>

        {/* الرخص غير الصادرة للبلاط */}
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'tile_unlicensed', DEFAULT_CARD_LABELS.tile_unlicensed, isRtl)}</span>
            <span className="text-2xl font-bold text-orange-600">{stats.tile_unlicensed}</span>
          </div>
        </div>

        {/* الرخص الصادرة للتراب */}
        <div className="bg-lime-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'terrestrial_licensed', 'عدد الرخص الصادرة لبلاغات التراب', isRtl)}</span>
            <span className="text-2xl font-bold text-lime-600">{stats.terrestrial_licensed || 0}</span>
          </div>
        </div>

        {/* الرخص غير الصادرة للتراب */}
        <div className="bg-rose-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{getCardLabel(cardLabels, 'terrestrial_unlicensed', 'عدد الرخص الغير صادرة لبلاغات التراب', isRtl)}</span>
            <span className="text-2xl font-bold text-rose-600">{stats.terrestrial_unlicensed || 0}</span>
          </div>
        </div>

        {/* البلاغات التي تم إصلاحها حسب النوع */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">{getCardLabel(cardLabels, 'fixed_title', DEFAULT_CARD_LABELS.fixed_title, isRtl)}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">{getCardLabel(cardLabels, 'type_terrestrial', DEFAULT_CARD_LABELS.type_terrestrial, isRtl)}</div>
              <div className="text-xl font-bold text-amber-800">{stats.terrestrial}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-gray-600 mb-2">{getCardLabel(cardLabels, 'type_tile', DEFAULT_CARD_LABELS.type_tile, isRtl)}</div>
              <div className="text-xl font-bold text-purple-800">{stats.tile}</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-900 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-white mb-2">{getCardLabel(cardLabels, 'type_asphalt', DEFAULT_CARD_LABELS.type_asphalt, isRtl)}</div>
              <div className="text-xl font-bold text-white">{stats.asphalt}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const GOVERNORATES_EN = {
  'الغربية': 'Gharbia',
  'المنوفية': 'Menofia',
  'الشرقية': 'Sharqia',
  'الدقهلية': 'Dakahlia',
  'كفر الشيخ': 'Kafr El-Sheikh',
  'دمياط': 'Damietta',
  'البحيرة': 'Beheira',
  'الاسكندرية': 'Alexandria',
  'الإسكندرية': 'Alexandria',
  'القليوبية': 'Qalyubia',
  'الجيزة': 'Giza',
  'القاهرة': 'Cairo',
  'الفيوم': 'Fayoum',
  'بني سويف': 'Beni Suef',
  'المنيا': 'Minya',
  'أسيوط': 'Asyut',
  'سوهاج': 'Sohag',
  'قنا': 'Qena',
  'الأقصر': 'Luxor',
  'الاقصر': 'Luxor',
  'أسوان': 'Aswan',
  'اسوان': 'Aswan',
  'البحر الأحمر': 'Red Sea',
  'الوادي الجديد': 'New Valley',
  'مطروح': 'Matrouh',
  'شمال سيناء': 'North Sinai',
  'جنوب سيناء': 'South Sinai',
  'بورسعيد': 'Port Said',
  'الإسماعيلية': 'Ismailia',
  'الاسماعيلية': 'Ismailia',
  'السويس': 'Suez',
  // Saudi Arabia Governorates & Cities
  'الطائف': 'Taif',
  'الدوادمي': 'Dawadmi',
  'مرات': 'Marat',
  'شقراء': 'Shaqra',
  'القويعية': 'Quwayiyah',
  'عفيف': 'Afif',
  'القصب': 'Al-Qasab',
  'ساجر': 'Sajir',
  'الرياض': 'Riyadh',
  'جدة': 'Jeddah',
  'المزاحمية': 'Al-Muzahmiyah',
  'ضرماء': 'Dhurma',
  'ضرما': 'Dhurma',
  'المنفوحة': 'Manfouha',
  'مكة': 'Mecca',
  'مكة المكرمة': 'Mecca',
  'المدينة': 'Medina',
  'المدينة المنورة': 'Medina',
  'القصيم': 'Qassim',
  'عسير': 'Asir',
  'تبوك': 'Tabuk',
  'حائل': 'Hail',
  'الحدود الشمالية': 'Northern Borders',
  'جازان': 'Jazan',
  'نجران': 'Najran',
  'الباحة': 'Al-Baha',
  'تاروت': 'Tarout',
  'القطيف': 'Al-Qatif',
  'الجبيل': 'Al-Jubail',
  'الخبر': 'Al-Khobar',
  'الظهران': 'Dhahran',
  'الخفجي': 'Al-Khafji',
  'حفر الباطن': 'Hafar Al-Batin',
  'الأحساء': 'Al-Ahsa',
  'قرية العليا': 'Qaryat Al-Ulya',
  'النعيرية': 'Al-Nairyah',
  'رأس تنورة': 'Ras Tanura',
  'أبقيق': 'Abqaiq',
  'ابقيق': 'Abqaiq',
  'الدمام': 'Dammam'
};

const translateGovernorate = (gov, isRtl) => {
  if (isRtl || !gov) return gov;
  return GOVERNORATES_EN[gov] || gov;
};

function NewDashboard({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const d = (ar, en) => (isRtl ? ar : en);

  const navigate = useNavigate();
  const [, setTranslationTick] = useState(0);
  useEffect(() => {
    const handleTranslationUpdate = () => {
      setTranslationTick(tick => tick + 1);
    };
    window.addEventListener('wfm_translation_updated', handleTranslationUpdate);
    return () => window.removeEventListener('wfm_translation_updated', handleTranslationUpdate);
  }, []);
  const { branding, currentTheme } = useBranding();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatHijriDate = (date) => {
    try {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return '';
    }
  };

  const formatDayName = (date) => {
    return new Intl.DateTimeFormat(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long' }).format(date);
  };

  const [loading, setLoading] = useState(true);
  const [projectsStats, setProjectsStats] = useState({});
  const [allProjects, setAllProjects] = useState([]); // جميع المشاريع المتاحة
  const [projectCardLabels, setProjectCardLabels] = useState({}); // مسميات البطاقات لكل مشروع
  const [connectionsStats, setConnectionsStats] = useState(null); // إحصائيات التوصيلات
  const [connectionsStatsByProject, setConnectionsStatsByProject] = useState({}); // إحصائيات التوصيلات لكل مشروع
  const [currentUser, setCurrentUser] = useState(user); // نسخة محلية من المستخدم لضمان التحديث الديناميكي
  
  // ثيم المنصة
  const [platformTheme, setPlatformTheme] = useState(() => {
    return localStorage.getItem('platformTheme') || 'blue';
  });
  
  // جلب ثيم المنصة
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const response = await axios.get(`${API}/settings/platform`);
        const theme = response.data.theme || 'blue';
        setPlatformTheme(theme);
        localStorage.setItem('platformTheme', theme);
      } catch (error) {
        console.error('Failed to fetch theme:', error);
      }
    };
    fetchTheme();
  }, []);
  
  // الحصول على ألوان الثيم
  const getThemeColor = (colorType) => {
    const colors = themeColors[platformTheme] || themeColors.blue;
    return colors[colorType] || colors.primary;
  };

  // دالة لجلب بيانات المستخدم المحدثة لضمان ديناميكية الصلاحيات
  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to refresh user perms:', error);
    }
  };

  // دالة التحقق من الصلاحية
  const hasPermission = (permKey) => {
    if (currentUser.role === 'admin') return true;
    return hasAnyProjectPermission(currentUser, permKey);
  };
  
  // تعيين الشهر الحالي كقيمة افتراضية
  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  
  // States for 72-hour reports filter
  const [selectedProject72h, setSelectedProject72h] = useState('');
  const [selectedGovernorate72h, setSelectedGovernorate72h] = useState('');
  const [selectedDate72h, setSelectedDate72h] = useState(''); // New State
  const [reports72hCount, setReports72hCount] = useState(0);
  const [reports72hList, setReports72hList] = useState([]);
  const [loading72h, setLoading72h] = useState(false);
  const [selectedCategory72h, setSelectedCategory72h] = useState('reports');
  const [availableGovernorates, setAvailableGovernorates] = useState([]);
  const [showReports72h, setShowReports72h] = useState(false);
  
  const [monthlyStats, setMonthlyStats] = useState({});
  const [last72HoursCounts, setLast72HoursCounts] = useState({});
  const [governorate72hBadges, setGovernorate72hBadges] = useState([]);

  // تعيين القيم الافتراضية لفلتر 72 ساعة بناءً على نوع المستخدم
  useEffect(() => {
    if (user && !selectedDate72h) {
      // 1. تعيين التاريخ الافتراضي لليوم ليظهر سجل 72 ساعة مباشرة عند الفتح
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate72h(today);

      // 2. التحقق من المشاريع المخصصة للمستخدم لتحديد الفئة الافتراضية (توصيلات أو بلاغات)
      const userProjects = user.projects || user.assigned_projects || [];
      const hasConnectionProject = userProjects.some(p => p === 'ايصال' || p === 'مشروع ايصال' || (p && p.includes('إيصال')));

      // جعل المشروع الافتراضي دائماً "جميع المشاريع" (قيمة فارغة)
      setSelectedProject72h('');

      if (hasConnectionProject) {
        setSelectedCategory72h('water_connections');
      } else {
        setSelectedCategory72h('reports');
      }
    }
  }, [user]);

  // جلب إحصائيات التوصيلات
  const fetchConnectionsStats = async () => {
    try {
      const monthParam = selectedMonth ? `?month=${selectedMonth}` : '';
      const cacheBuster = `&t=${new Date().getTime()}`;
      const response = await axios.get(`${API}/connections-stats${monthParam}${monthParam ? cacheBuster : '?' + cacheBuster.substring(1)}`);
      setConnectionsStats(response.data);
    } catch (error) {
      console.error('Error fetching connections stats:', error);
    }
  };

  // جلب إحصائيات التوصيلات لكل مشروع بالتوازي
  const fetchConnectionsStatsByProject = async (projects) => {
    try {
      const token = localStorage.getItem('token');
      
      const promises = projects.map(project => {
        const projectName = project.name || project;
        const monthParam = selectedMonth ? `&month=${selectedMonth}` : '';
        const cacheBuster = `&t=${new Date().getTime()}`;
        return axios.get(`${API}/connections-stats?project=${encodeURIComponent(projectName)}${monthParam}${cacheBuster}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => ({ project: projectName, data: res.data }))
        .catch(err => {
          console.error(`Error fetching connections stats for ${projectName}:`, err);
          return { project: projectName, data: { water: { total: 0 }, sewage: { total: 0 }, grand_total: 0 } };
        });
      });
      
      const results = await Promise.all(promises);
      const statsMap = {};
      results.forEach(({ project, data }) => {
        statsMap[project] = data;
      });
      
      setConnectionsStatsByProject(statsMap);
    } catch (error) {
      console.error('Error fetching connections stats by project:', error);
    }
  };

  // جلب مسميات البطاقات لمشروع معين
  const fetchProjectCardLabels = async (projectName) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/project-cards/${encodeURIComponent(projectName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.cards || [];
    } catch (e) {
      return [];
    }
  };

  useEffect(() => {
    // تحميل البيانات الأساسية التي تعتمد على الشهر - مع عرض شاشة التحميل الكاملة
    const loadMainData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchConnectionsStats(),
          fetchProjectsData(false) // نمرر false لعدم تغيير حالة التحميل داخلياً
        ]);
      } catch (error) {
        console.error('Error loading main dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMainData();
  }, [selectedMonth]);

  useEffect(() => {
    // تحديث بيانات الـ 72 ساعة فقط عند تغيير الفلاتر الخاصة بها - بدون شاشة تحميل كاملة
    const update72hData = async () => {
      try {
        await Promise.all([
          fetchLast72HoursCounts(),
          fetchGovernorate72hBadges()
        ]);
      } catch (error) {
        console.error('Error updating 72h data:', error);
      }
    };
    
    update72hData();
  }, [selectedDate72h, selectedProject72h, selectedCategory72h]);
  
  // تحديث الأيقونات والعدد الإجمالي ديناميكياً
  useEffect(() => {
    const interval = setInterval(() => {
      fetchGovernorate72hBadges();
      fetch72hReportsCount(true);
    }, 15000); // تحديث كل 15 ثانية لضمان ظهور البيانات في الوقت الفعلي
    
    return () => clearInterval(interval);
  }, [selectedDate72h, selectedCategory72h, selectedProject72h, selectedGovernorate72h]);
  
  // Fetch 72-hour reports count
  const fetchGovernorate72hBadges = async () => {
    try {
      // جلب البيانات بطلب واحد بدلاً من التكرار لتجنب التكرار في العد
      const projectParam = selectedProject72h ? `project=${encodeURIComponent(selectedProject72h)}&` : '';
      const response = await axios.get(`${API}/reports/governorate-72h-counts?${projectParam}category=${selectedCategory72h}${selectedDate72h ? `&base_date=${selectedDate72h}` : ''}`);
      
      const allBadges = response.data.map(item => ({
        ...item,
        project: item.project || selectedProject72h || 'جميع المشاريع'
      }));
      
      // ترتيب حسب العدد تنازلياً
      allBadges.sort((a, b) => b.count - a.count);
      
      setGovernorate72hBadges(allBadges);
    } catch (error) {
      console.error('Failed to fetch governorate 72h badges:', error);
    }
  };

  const fetch72hReportsCount = async (isBackground = false) => {
    console.log('🔍 fetch72hReportsCount called:', {
      project: selectedProject72h,
      governorate: selectedGovernorate72h
    });
    
    // السماح بجلب بيانات آخر 72 ساعة افتراضياً حتى لو لم يتم تحديد تاريخ

    if (!isBackground) {
      setLoading72h(true);
    }
    try {
      // استخدام endpoint مخصص لآخر 72 ساعة (بناءً على created_at timestamp)
      const params = new URLSearchParams();
      if (selectedProject72h) params.append('project', selectedProject72h);
      if (selectedGovernorate72h) params.append('governorate', selectedGovernorate72h);
      
      if (selectedDate72h) params.append('base_date', selectedDate72h);
      if (selectedCategory72h) params.append('category', selectedCategory72h);
      console.log('📡 Making API call:', `${API}/reports/last-72-hours-list?${params.toString()}`);
      
      const response = await axios.get(`${API}/reports/last-72-hours-list?${params.toString()}`);
      
      console.log('📦 API Response:', response.data);
      
      const reports = response.data.reports || [];
      const count = reports.length;
      
      console.log('✅ Setting count to:', count);
      setReports72hCount(count);
      setReports72hList(reports);
    } catch (error) {
      console.error('❌ Failed to fetch 72h reports:', error);
      setReports72hCount(0);
      setReports72hList([]);
    } finally {
      if (!isBackground) {
        setLoading72h(false);
      }
    }
  };
  
  useEffect(() => {
    fetch72hReportsCount();
  }, [selectedProject72h, selectedGovernorate72h, selectedDate72h, selectedCategory72h]);
  
  // Export 72-hour reports to Excel
  const handleExport72hReports = async () => {
    // السماح بالتصدير لجميع المشاريع والمحافظات
    try {
      // استخدام endpoint خاص لتصدير 72 ساعة
      const params = new URLSearchParams();
      if (selectedProject72h) params.append('project', selectedProject72h);
      if (selectedGovernorate72h) params.append('governorate', selectedGovernorate72h);
      if (selectedDate72h) params.append('base_date', selectedDate72h);
      if (selectedCategory72h) params.append('category', selectedCategory72h);
      
      const response = await axios.get(`${API}/reports/export-72h/excel?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `بلاغات_72 ساعة_${selectedGovernorate72h}_${new Date().toLocaleDateString('en-GB')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('تم التصدير بنجاح');
    } catch (error) {
      console.error('Failed to export 72h reports:', error);
      alert('حدث خطأ أثناء تصدير البلاغات');
    }
  };
  
  // Get available projects based on user role
  const getAvailableProjects = () => {
    const formatLabel = (proj) => {
      const clean = proj.replace('مشروع إصلاح أعمال ', '').replace('مشروع ', '').replace(' -القطاع الأوسط', '').replace(' - القطاع الأوسط', '');
      if (isRtl) return clean;
      return PROJECT_NAMES_EN[proj] || clean;
    };

    // استخدام allProjects التي تم جلبها من API
    if (user.role === 'admin') {
      // Admin يرى جميع المشاريع من قاعدة البيانات
      return allProjects.map(proj => ({
        value: proj,
        label: formatLabel(proj)
      }));
    }
    
    // المستخدمين الآخرين يرون مشاريعهم المخصصة فقط
    const userProjects = user.projects || user.assigned_projects || [];
    if (userProjects.length > 0) {
      return userProjects.map(proj => ({
        value: proj,
        label: formatLabel(proj)
      }));
    }
    
    return [];
  };
  
  // Fetch governorates from database based on selected project
  const fetchGovernorates = async (project) => {
    // إذا لم يكن هناك مشروع، نمرر قيمة فارغة للباكيند ليجلب كل المحافظات المتاحة للمستخدم
    const projectParam = project ? `project=${encodeURIComponent(project)}` : '';
    console.log('Fetching governorates...', projectParam || 'All');
    
    console.log('Fetching governorates for project:', project);
    
    try {
      const response = await axios.get(`${API}/governorates${projectParam ? `?${projectParam}` : ''}`);
      console.log('✅ Fetched governorates from DB:', response.data);
      setAvailableGovernorates(response.data);
    } catch (error) {
      console.error('❌ Failed to fetch governorates:', error);
      console.error('Error details:', error.response?.data);
      setAvailableGovernorates([]);
    }
  };
  
  // Fetch governorates when project changes
  useEffect(() => {
    console.log('useEffect triggered - selectedProject72h:', selectedProject72h);
    fetchGovernorates(selectedProject72h);
  }, [selectedProject72h]);

  const fetchLast72HoursCounts = async () => {
    try {
      const projectParam = selectedProject72h ? `&project=${encodeURIComponent(selectedProject72h)}` : '';
      const url = `${API}/reports/governorate-72h-counts?category=${selectedCategory72h}${selectedDate72h ? `&base_date=${selectedDate72h}` : ''}${projectParam}`;
      const response = await axios.get(url);
      setLast72HoursCounts(response.data);
    } catch (error) {
      console.error('Error fetching 72 hours counts:', error);
    }
  };
  const fetchProjectsData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // جلب جميع المشاريع من قاعدة البيانات
      let projectsToFetch = [];
      
      if (user.role === 'admin') {
        // Admin يرى جميع المشاريع من قاعدة البيانات
        try {
          const projectsRes = await axios.get(`${API}/projects`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          projectsToFetch = projectsRes.data.map(p => p.name || p);
        } catch {
          projectsToFetch = Object.values(PROJECT_NAMES);
        }
      } else if (user.projects && user.projects.length > 0) {
        // المستخدم لديه مشاريع محددة - يرى فقط هذه المشاريع
        projectsToFetch = user.projects;
      } else if (user.assigned_projects && user.assigned_projects.length > 0) {
        // المستخدم لديه مشاريع معينة عبر assigned_projects
        projectsToFetch = user.assigned_projects;
      } else {
        // المستخدم ليس لديه مشاريع معينة - لا يرى أي مشروع
        projectsToFetch = [];
      }
      
      setAllProjects(projectsToFetch);
      
      // استخدام endpoint الإحصائيات الجديد - أسرع بكثير!
      const monthParam = selectedMonth ? `&month=${selectedMonth}` : '';
      const promises = projectsToFetch.map(project => 
        axios.get(`${API}/reports/stats?project=${encodeURIComponent(project)}${monthParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.data)
        .catch(err => {
          console.error(`Error fetching stats for ${project}:`, err);
          return { total: 0, fixed: 0, asphalt_remaining: 0, licensed: 0, unlicensed: 0 };
        })
      );

      const responses = await Promise.all(promises);
      
      // جلب إحصائيات التوصيلات لكل مشروع
      await fetchConnectionsStatsByProject(projectsToFetch);
      
      // جلب مسميات البطاقات لكل مشروع
      const labelsPromises = projectsToFetch.map(project => 
        fetchProjectCardLabels(project)
        .catch(() => [])
      );
      const labelsResponses = await Promise.all(labelsPromises);
      
      // ربط النتائج بالمشاريع ديناميكياً
      const results = {};
      const monthlyResults = {};
      const labelsMap = {};
      
      projectsToFetch.forEach((project, index) => {
        const key = getProjectKey(project);
        const data = responses[index] || {};
        
        results[key] = {
          name: project,
          total: data.total || 0,
          fixed: data.fixed || 0,
          asphaltRemaining: data.asphalt_remaining || 0,
          licensed: data.licensed || 0,
          unlicensed: data.unlicensed || 0,
          tile_licensed: data.tile_licensed || 0,
          tile_unlicensed: data.tile_unlicensed || 0,
          terrestrial_licensed: data.terrestrial_licensed || 0,
          terrestrial_unlicensed: data.terrestrial_unlicensed || 0,
          terrestrial: data.terrestrial || 0,
          tile: data.tile || 0,
          asphalt: data.asphalt || 0,
          by_type: data.by_type || {}  // أنواع البلاغات ديناميكياً
        };
        
        monthlyResults[key] = {
          terrestrial: data.terrestrial || 0,
          tile: data.tile || 0,
          asphalt: data.asphalt || 0
        };
        
        // حفظ مسميات البطاقات
        labelsMap[project] = labelsResponses[index] || [];
      });
      
      setProjectsStats(results);
      setMonthlyStats(monthlyResults);
      setProjectCardLabels(labelsMap);
    } catch (error) {
      console.error('Failed to fetch projects data:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // دالة موحدة للتحقق من الصلاحيات بشكل هرمي (خاص بالمشروع أو عام) لتحديد نوع المشروع
  const checkExplicitPerm = (projectName, permKey) => {
    if (!currentUser) return false;
    
    const pp = currentUser.project_permissions || {};
    const targetClean = cleanProjectName(projectName);
    
    // 1. البحث عن صلاحية مخصصة لهذا المشروع (الأولوية القصوى - المستوى 1 و 2 و 3)
    const myProjKey = Object.keys(pp).find(k => {
      const keyClean = cleanProjectName(k);
      const isMatch = keyClean === targetClean || (keyClean && targetClean && (keyClean.includes(targetClean) || targetClean.includes(keyClean)));
      return isMatch;
    });
    
    if (myProjKey && Array.isArray(pp[myProjKey]) && pp[myProjKey].length > 0) {
      const hasPerm = pp[myProjKey].includes(permKey);
      return hasPerm;
    }
    
    // 2. للأدمن: لا نعتمد على الصلاحيات العامة (التي تشمل كل شيء) لكي لا تختفي بطاقات الإصلاح لديه بالخطأ
    // إلا إذا تم منح الصلاحية للمشروع بشكل صريح كما في الخطوة 1
    if (currentUser.role === 'admin') return false;

    // 3. البحث في الصلاحيات العامة للمستخدم (للمستويات الأخرى) - الهرمية
    return (currentUser.permissions || []).includes(permKey);
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center justify-center py-20 text-gray-500 text-sm font-medium"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="mr-2">{typeof isRtl !== 'undefined' && !isRtl ? 'Loading...' : 'جاري التحميل...'}</span></div>
        </div>
      </Layout>
    );
  }

  // تحضير بيانات الرسوم البيانية
  // Admin يرى جميع المشاريع، باقي المستخدمين يرون مشاريعهم فقط
  
  // ترتيب المشاريع: الأساسية أولاً ثم المضافة
  const getSortedProjects = () => {
    const defaultOrder = [
      'مشروع المحافظات الغربية -القطاع الأوسط',
      'مشروع المحافظات الشمالية -القطاع الأوسط',
      'مشروع المحافظات الجنوبية -القطاع الأوسط'
    ];
    
    return Object.entries(projectsStats).sort((a, b) => {
      const indexA = defaultOrder.indexOf(a[1].name);
      const indexB = defaultOrder.indexOf(b[1].name);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return (a[1].name || '').localeCompare(b[1].name || '', 'ar');
    });
  };
  
  const getProjectChartData = () => {
    return getSortedProjects().map(([key, stats]) => {
      const connStats = connectionsStatsByProject[stats.name];
      const cleanLabelAr = stats.name ? stats.name.replace('مشروع إصلاح أعمال ', '').replace('مشروع ', '').replace(' -القطاع الأوسط', '').replace(' - القطاع الأوسط', '') : key;
      const cleanLabelEn = CLEAN_PROJECT_NAMES_EN[stats.name] || cleanLabelAr;
      const displayName = isRtl ? cleanLabelAr : cleanLabelEn;
      return {
        name: displayName,
        total: stats.total || 0,
        fixed: stats.fixed || 0,
        asphaltRemaining: stats.asphaltRemaining || 0,
        water: connStats?.water?.total || 0,
        sewage: connStats?.sewage?.total || 0,
        key: stats.name || key
      };
    });
  };
  
  const chartData = getProjectChartData();
  const pieData = chartData.map(item => ({ 
    name: item.name, 
    value: (item.total + item.water + item.sewage) 
  }));

  // حساب مؤشرات الأداء KPIs ديناميكياً
  const totalReports = Object.values(projectsStats).reduce((sum, stats) => sum + (stats.total || 0), 0);
  const totalFixed = Object.values(projectsStats).reduce((sum, stats) => sum + (stats.fixed || 0), 0);
  const completionRate = totalReports > 0 ? ((totalFixed / totalReports) * 100).toFixed(1) : 0;
  
  const totalLicensed = Object.values(projectsStats).reduce((sum, stats) => sum + (stats.licensed || 0), 0);
  const totalAsphaltRemaining = Object.values(projectsStats).reduce((sum, stats) => sum + (stats.asphaltRemaining || 0), 0);
  const licenseRate = totalAsphaltRemaining > 0 ? ((totalLicensed / totalAsphaltRemaining) * 100).toFixed(1) : 0;

  // حساب مؤشرات التوصيلات
  const totalWater = Object.values(connectionsStatsByProject).reduce((sum, s) => sum + (s.water?.total || 0), 0);
  const completedWater = Object.values(connectionsStatsByProject).reduce((sum, s) => sum + (s.water?.completed || 0), 0);
  const waterRate = totalWater > 0 ? ((completedWater / totalWater) * 100).toFixed(1) : 0;

  const totalSewage = Object.values(connectionsStatsByProject).reduce((sum, s) => sum + (s.sewage?.total || 0), 0);
  const completedSewage = Object.values(connectionsStatsByProject).reduce((sum, s) => sum + (s.sewage?.completed || 0), 0);
  const sewageRate = totalSewage > 0 ? ((completedSewage / totalSewage) * 100).toFixed(1) : 0;

  // تحضير بطاقات التحليل الذكي ديناميكياً لتناسب المستوى 1 والمستخدم المخصص
  const getAiAnalysisCards = () => {
    const cards = [];
    
    // 1. بطاقة الإصلاحات (إذا وجدت بيانات أو لديه صلاحية رؤية البلاغات)
    if (totalReports > 0 || hasPermission('reports_view') || user.role === 'admin') {
      cards.push({
        title: d('📈 تحليل الإصلاحات', '📈 Repairs Analysis'),
        content: completionRate >= 80 ? d('✅ أداء ممتاز في الإنجاز العام لبلاغات الإصلاح.', '✅ Excellent performance in overall completion of repair reports.') : d('⚠️ وتيرة الإصلاحات تحتاج لمتابعة لرفع معدل الإنجاز.', '⚠️ Repair pace requires monitoring to boost completion rate.'),
        footer: d(`معدل الإنجاز: ${completionRate}%`, `Completion Rate: ${completionRate}%`)
      });
    }

    // 2. بطاقة توصيلات المياه
    if (totalWater > 0 || hasPermission('water_connections') || user.role === 'admin') {
      cards.push({
        title: d('💧 توصيلات المياه', '💧 Water Connections'),
        content: waterRate >= 80 ? d('✅ إنجاز متميز في قطاع المياه، استمر في الحفاظ على هذا المعدل.', '✅ Outstanding achievement in the water sector, keep up this rate.') : d('⚠️ مطلوب تكثيف العمل في توصيلات المياه لرفع نسبة الإنجاز.', '⚠️ Work must be intensified in water connections to increase completion rate.'),
        footer: d(`معدل الإنجاز: ${waterRate}%`, `Completion Rate: ${waterRate}%`)
      });
    }
    
    // 3. بطاقة توصيلات الصرف
    if (totalSewage > 0 || hasPermission('sewage_connections') || user.role === 'admin') {
      cards.push({
        title: d('🚽 توصيلات الصرف', '🚽 Sewage Connections'),
        content: sewageRate >= 80 ? d('✅ أداء قوي ومستقر في تنفيذ توصيلات الصرف الصحي.', '✅ Strong and stable performance in executing sewage connections.') : d('⚠️ ملاحظة تأخر في بعض بنود الصرف، يوصى بمراجعة فرق التنفيذ.', '⚠️ Delays observed in some sewage items, review implementation teams recommended.'),
        footer: d(`معدل الإنجاز: ${sewageRate}%`, `Completion Rate: ${sewageRate}%`)
      });
    }

    // 4. بطاقة تحليل أداء التوصيلات (بدلاً من الرخص التي تسبب لبس)
    if (totalWater > 0 || totalSewage > 0) {
      const avgRate = ((parseFloat(waterRate) + parseFloat(sewageRate)) / ( (totalWater > 0 && totalSewage > 0) ? 2 : 1 )).toFixed(1);
      cards.push({
        title: d('🚀 تحليل أداء التوصيلات', '🚀 Connections Performance Analysis'),
        content: avgRate >= 85 ? d('✅ وتيرة العمل في قطاع التوصيلات متسارعة وممتازة جداً.', '✅ Work pace in connections sector is accelerated and very excellent.') : 
                 avgRate >= 60 ? d('⚠️ الأداء العام للتوصيلات مستقر، مع إمكانية تحسين سلاسل التوريد.', '⚠️ Overall performance of connections is stable, with potential to improve supply chain.') : 
                 d('❌ يوجد تباطؤ في وتيرة إنجاز التوصيلات، يوصى بمراجعة المقاولين ميدانياً.', '❌ Slowing observed in connections completion pace, field review with contractors recommended.'),
        footer: d(`متوسط الإنجاز: ${avgRate}%`, `Average Completion: ${avgRate}%`)
      });
    }

    // 5. بطاقة الأسفلت (فقط لمشاريع الإصلاح)
    if (totalAsphaltRemaining > 0 && cards.length < 4) {
      cards.push({
        title: d('🎯 توصيات الأسفلت', '🎯 Asphalt Recommendations'),
        content: totalAsphaltRemaining > totalFixed * 0.3 ? d('• يجب التركيز على إنهاء بنود الأسفلت المتبقية لتقليل التراكم.', '• Focus on finishing remaining asphalt items is required to reduce backlog.') : d('• أداء مستقر في إغلاق البلاغات ومتابعة الإغلاق النهائي.', '• Stable performance in closing reports and tracking final closure.'),
        footer: d(`المتبقي: ${totalAsphaltRemaining} بلاغ`, `Remaining: ${totalAsphaltRemaining} reports`)
      });
    }

    // ملء الفراغات إذا نقصت البطاقات عن 4 (مثل حالة الرخص أو غيرها)
    if (cards.length < 4 && totalReports > 0) {
      cards.push({
        title: d('⚡ حالة الرخص', '⚡ Licenses Status'),
        content: parseFloat(licenseRate) >= 80 ? d('✅ نسبة إصدار الرخص جيدة وتدعم سرعة الإغلاق.', '✅ License issuance rate is good and supports speed of closure.') : d('⚠️ يرجى متابعة استكمال الرخص المتبقية لضمان إغلاق البلاغات.', '⚠️ Please follow up on completing remaining licenses to guarantee closing reports.'),
        footer: d(`نسبة الرخص: ${licenseRate}%`, `License Rate: ${licenseRate}%`)
      });
    }

    return cards.slice(0, 4);
  };

  const aiAnalysisCards = getAiAnalysisCards();
  
  const handleCardClick = (project, category) => {
    setSelectedProject72h(project);
    setSelectedCategory72h(category);
    setSelectedGovernorate72h(''); 
    setShowReports72h(true);
    // Scroll to section
    const element = document.getElementById('section-72h');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderAnalogClock = (sizeClasses, borderClasses) => (
    <div className={`relative ${sizeClasses} drop-shadow-xl bg-white rounded-full flex items-center justify-center ${borderClasses} border-[#111827] shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]`}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" />
        {[...Array(60)].map((_, i) => (
          <line 
            key={`tick-${i}`} 
            x1="50" y1="3" 
            x2="50" y2={i % 5 === 0 ? "7" : "5"} 
            stroke={i % 5 === 0 ? "#111827" : "#9ca3af"} 
            strokeWidth={i % 5 === 0 ? "1.5" : "0.5"} 
            style={{ transform: `rotate(${i * 6}deg)`, transformOrigin: '50px 50px' }} 
          />
        ))}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
          const angle = num * 30;
          const rad = (angle - 90) * (Math.PI / 180);
          const x = 50 + 34 * Math.cos(rad);
          const y = 50 + 34 * Math.sin(rad) + 4.5;
          return (
            <text key={`num-${num}`} x={x} y={y} fill="#111827" fontSize="13" fontFamily="Arial, Helvetica, sans-serif" fontWeight="900" textAnchor="middle">{num}</text>
          );
        })}
        <text x="50" y="32" fill="#6b7280" fontSize="3.5" fontFamily="Georgia, serif" fontStyle="italic" textAnchor="middle" style={{ opacity: 0.7 }}>Galaxy</text>
        <g style={{ transform: `rotate(${(currentDateTime.getHours() % 12) * 30 + currentDateTime.getMinutes() * 0.5}deg)`, transformOrigin: '50px 50px' }}>
          <path d="M 48.5 50 L 50 25 L 51.5 50 Z" fill="#111827" />
        </g>
        <g style={{ transform: `rotate(${currentDateTime.getMinutes() * 6 + currentDateTime.getSeconds() * 0.1}deg)`, transformOrigin: '50px 50px' }}>
          <path d="M 49 50 L 50 14 L 51 50 Z" fill="#111827" />
        </g>
        <g style={{ transform: `rotate(${currentDateTime.getSeconds() * 6}deg)`, transformOrigin: '50px 50px', transition: 'transform 0.1s cubic-bezier(0.4, 2.08, 0.55, 0.44)' }}>
          <line x1="50" y1="60" x2="50" y2="12" stroke="#111827" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="50" cy="50" r="1.5" fill="#111827" />
        </g>
        <circle cx="50" cy="50" r="2.5" fill="#111827" />
        <circle cx="50" cy="50" r="1" fill="#e5e7eb" />
      </svg>
    </div>
  );

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header - Responsive */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              {/* Title Section */}
              <div className="w-full lg:w-auto text-right">
                <div className="flex justify-between items-center w-full mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex flex-wrap items-center">
                      {d('لوحة التحكم', 'Dashboard')} 
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full mr-2 ml-2">v1.1 Dynamic</span>
                    </h1>
                  </div>
                  {/* Small Analog Clock - Mobile Only */}
                  <div className="lg:hidden flex-shrink-0 mr-auto ml-2">
                    {renderAnalogClock("w-[60px] h-[60px]", "border-[3px]")}
                  </div>
                </div>
                
                <p className="text-sm sm:text-base text-gray-500 font-medium mr-5 mb-3">{translateBrandingText(branding.dashboard_title, isRtl) || d('نظام إدارة البلاغات والمشاريع - WFM', 'Project and Reports Management System - WFM')}</p>
                
                <div className="inline-flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm mr-5" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                  <svg className="w-3.5 h-3.5 text-blue-600 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="text-blue-800">{formatDayName(currentDateTime)}</span>
                  <span className="text-gray-300">|</span>
                  <span>{currentDateTime.toLocaleDateString('en-GB')}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-emerald-700">{formatHijriDate(currentDateTime)}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-red-600 font-black tracking-wider text-xs sm:text-sm" style={{ direction: 'ltr' }}>{currentDateTime.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
              </div>

              {/* Big Analog Clock - Center (Hidden on Mobile) */}
              <div className="hidden lg:flex justify-center items-center flex-shrink-0 mx-4">
                {renderAnalogClock("w-28 h-28", "border-[5px]")}
              </div>

              {/* Branding Section - Premium Compact Design */}
              <div className="w-full lg:w-auto flex lg:justify-end">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">{d('الاستشاري', 'Consultant')}</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">{translateBrandingText(branding.consultant_name, isRtl) || d('مكتب بيت الخبرة للاستشارات الهندسية', 'Expert House Engineering Consultancy')}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex items-center gap-3">
                    <div className="bg-gray-800 text-white p-2 rounded-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{translateBrandingText(branding.project_manager_title, isRtl) || d('مدير عام المشاريع', 'General Projects Manager')}</p>
                      <p className="text-xs sm:text-sm font-bold text-blue-700">{translateBrandingText(branding.project_manager_name, isRtl) || d('المهندس أحمد عبيدات', 'Eng. Ahmed Obeidat')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
            
            {/* 24-Hour Reports Filter Section - Responsive */}
            <div id="section-72h" className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 sm:p-4 border-2 border-orange-300 shadow-md w-full lg:w-auto">
              <h3 className="text-sm sm:text-base font-bold text-orange-800 mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span>🕐</span>
                  <span>{d('سجل الـ 72 ساعة الأخيرة', 'Last 72 Hours Log')}</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setSelectedCategory72h('reports')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${selectedCategory72h === 'reports' ? 'bg-orange-600 text-white shadow-md' : 'bg-white/50 text-orange-800 hover:bg-white'}`}
                  >
                    {d('بلاغات الإصلاح', 'Repair Reports')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory72h('water_connections')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${selectedCategory72h === 'water_connections' ? 'bg-blue-600 text-white shadow-md' : 'bg-white/50 text-blue-800 hover:bg-white'}`}
                  >
                    {d('توصيلات المياه', 'Water Connections')}
                  </button>
                  <button 
                    onClick={() => setSelectedCategory72h('sewage_connections')}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${selectedCategory72h === 'sewage_connections' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white/50 text-emerald-800 hover:bg-white'}`}
                  >
                    {d('توصيلات الصرف', 'Sewage Connections')}
                  </button>
                </div>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                {/* تاريخ المباشرة Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{d('تاريخ المباشرة:', 'Start Date:')}</label>
                  <input
                    type="date"
                    value={selectedDate72h}
                    onChange={(e) => setSelectedDate72h(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                  />
                </div>
                {/* Project Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{d('المشروع:', 'Project:')}</label>
                  <select
                    value={selectedProject72h}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedProject72h(val);
                      
                      // إذا كان المشروع مشروع إيصال، نغير الفئة تلقائياً لتظهر البيانات
                      if (val && (val.includes('ايصال') || val.includes('إيصال') || val.includes('توصيلات'))) {
                        if (selectedCategory72h === 'reports') {
                          setSelectedCategory72h('water_connections');
                        }
                      } else if (val) {
                        // للمشاريع العادية، نرجع للفئة الافتراضية إذا كانت توصيلات
                        if (selectedCategory72h !== 'reports') {
                          setSelectedCategory72h('reports');
                        }
                      }
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                  >
                    <option value="">{d('جميع المشاريع', 'All Projects')}</option>
                    {getAvailableProjects().map(proj => (
                      <option key={proj.value} value={proj.value}>{proj.label}</option>
                    ))}
                  </select>
                </div>
                
                {/* Governorate Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{d('المحافظة:', 'Governorate:')} ({availableGovernorates.length})</label>
                  <select
                    value={selectedGovernorate72h}
                    onChange={(e) => setSelectedGovernorate72h(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{d('جميع المحافظات', 'All Governorates')}</option>
                    {availableGovernorates.map(gov => (
                      <option key={gov} value={gov}>{translateGovernorate(gov, isRtl)}</option>
                    ))}
                  </select>
                  {selectedProject72h && availableGovernorates.length === 0 && (
                    <p className="text-xs text-red-600 mt-1">{d('لا توجد محافظات لهذا المشروع', 'No governorates found for this project')}</p>
                  )}
                </div>
                
                {/* Reports Count Display */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {selectedCategory72h === 'reports' ? d('عدد البلاغات:', 'Reports Count:') : d('عدد التوصيلات:', 'Connections Count:')}
                  </label>
                  <div className="bg-white rounded-lg px-2 py-1.5 border-2 border-orange-300 text-center">
                    <span className="text-xl font-bold text-orange-600">
                      {loading72h ? '...' : reports72hCount}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setShowReports72h(!showReports72h)}
                    disabled={reports72hCount === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{showReports72h ? d('إخفاء', 'Hide') : d('عرض', 'Show')}</span>
                  </button>
                  <button
                    onClick={handleExport72hReports}
                    disabled={reports72hCount === 0}
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{d('تصدير', 'Export')}</span>
                  </button>
                  <button
                    onClick={() => {
                      const userProjects = user?.projects || user?.assigned_projects || [];
                      const hasConnectionProject = userProjects.some(p => p === 'ايصال' || p === 'مشروع ايصال' || (p && p.includes('إيصال')));
                      
                      setSelectedDate72h('');
                      setSelectedProject72h(hasConnectionProject ? 'ايصال' : '');
                      setSelectedGovernorate72h('');
                      setSelectedCategory72h(hasConnectionProject ? 'water_connections' : 'reports');
                      setShowReports72h(false);
                      toast.success(d('تم بنجاح', 'Reset successful'));
                    }}
                    className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{d('إعادة تعيين', 'Reset')}</span>
                  </button>
                </div>

              </div>
              
              {/* جدول عرض البلاغات */}
              {showReports72h && reports72hList.length > 0 && (
                <div className="mt-4 border-t-2 border-orange-300 pt-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2">
                    {selectedCategory72h === 'reports' ? d('البلاغات', 'Reports') : 
                     selectedCategory72h === 'water_connections' ? d('توصيلات المياه', 'Water Connections') : d('توصيلات الصرف', 'Sewage Connections')} ({reports72hList.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto bg-white rounded-lg border border-gray-300">
                    <div className="overflow-x-auto w-full">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 font-bold">
                            {selectedCategory72h === 'reports' ? d('رقم البلاغ', 'Report ID') : d('رقم الطلب/التوصيلة', 'Request/Connection ID')}
                          </th>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 font-bold">
                            {selectedCategory72h === 'reports' ? d('رقم الرخصة', 'License Number') : d('اسم المشترك', 'Customer Name')}
                          </th>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 font-bold">{d('المشروع', 'Project')}</th>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 font-bold">{d('المحافظة', 'Governorate')}</th>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 font-bold">{d('الحالة', 'Status')}</th>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 font-bold">{d('تاريخ الاستلام', 'Receipt Date')}</th>
                          <th className="px-2 py-1 text-right font-semibold text-gray-700 flex items-center gap-1 font-bold">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {d('تاريخ المباشرة', 'Start Date')}
                          </th>
                          <th className="px-2 py-1 text-center font-semibold text-gray-700 font-bold">
                            {selectedCategory72h === 'reports' ? d('نوع البلاغ', 'Report Type') : d('نوع التوصيلة', 'Connection Type')}
                          </th>
                          {selectedCategory72h === 'reports' && (
                            <th className="px-2 py-1 text-center font-semibold text-gray-700 font-bold">{d('تاريخ الاغلاق', 'Closing Date')}</th>
                          )}
                          <th className="px-2 py-1 text-center font-semibold text-gray-700 font-bold">{d('عرض', 'View')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports72hList.map((item, index) => {
                          const statusVal = selectedCategory72h === 'reports' ? item.status : (item.request_status || '-');
                          const translatedStatus = translateStatus(statusVal, isRtl);
                          const translatedType = translateType(item.report_type || '-', isRtl);
                          return (
                            <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-2 py-1 text-gray-900 font-bold">
                                {selectedCategory72h === 'reports' ? item.report_number : (item.request_number || item.connection_number || '-')}
                              </td>
                              <td className="px-2 py-1 text-blue-600 font-medium">
                                {selectedCategory72h === 'reports' 
                                  ? (translateBrandingText(item.license_number, isRtl) || '-') 
                                  : (translateBrandingText(item.customer_name, isRtl) || '-')}
                              </td>
                              <td className="px-2 py-1 text-gray-800 font-medium text-[10px]">
                                {translateProject(item.project, isRtl) || '-'}
                              </td>
                              <td className="px-2 py-1 text-gray-700">{translateGovernorate(item.governorate, isRtl)}</td>
                              <td className="px-2 py-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  (statusVal === 'تم الإصلاح' || statusVal === 'مكتمل') ? 'bg-green-100 text-green-800' :
                                  (statusVal === 'بانتظار الأسفلت' || statusVal === 'جاري') ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {translatedStatus}
                                </span>
                              </td>
                              <td className="px-2 py-1 text-gray-600">
                                {new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB')}
                              </td>
                              <td className="px-2 py-1 text-gray-600 font-bold">
                                {selectedCategory72h === 'reports' ? 
                                  (item.start_date ? new Date(item.start_date).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB') : '-') : 
                                  (item.created_at ? new Date(item.created_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB') : '-')}
                              </td>
                              <td className="px-2 py-1 text-center text-gray-700 font-semibold">
                                {translatedType}
                              </td>
                              {selectedCategory72h === 'reports' && (
                                <td className="px-2 py-1 text-center text-gray-600 font-bold">
                                  {item.closed_at ? new Date(item.closed_at).toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB') : '-'}
                                </td>
                              )}
                              <td className="px-2 py-1 text-center">
                                <button
                                  onClick={() => {
                                    const searchNum = selectedCategory72h === 'reports' ? item.report_number : (item.request_number || item.ccb_report_number);
                                    const path = selectedCategory72h === 'reports' ? '/reports' : 
                                                 selectedCategory72h === 'water_connections' ? '/water-connections' : '/sewage-connections';
                                    navigate(`${path}?search=${encodeURIComponent(searchNum)}&exact=true`);
                                  }}
                                  className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                                  title={d('عرض التفاصيل', 'View Details')}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

          {/* أيقونات المحافظات - بلاغات آخر 72 ساعة */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-md p-4 border border-green-200">
            <h3 className="text-base font-bold text-green-800 mb-3 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{d('المحافظات', 'Governorates')} - {selectedCategory72h === 'reports' ? d('بلاغات الإصلاح', 'Repair Reports') : selectedCategory72h === 'water_connections' ? d('توصيلات المياه', 'Water Connections') : d('توصيلات الصرف', 'Sewage Connections')} ({d('72 ساعة', '72 Hours')})</span>
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              ⏰ {d('يعرض ', 'Displays ')} {selectedCategory72h === 'reports' ? d('البلاغات', 'reports') : d('التوصيلات', 'connections')} {d(' من تاريخ المباشرة ', ' from start date ')} <strong>{selectedDate72h ? new Date(selectedDate72h).toLocaleString(isRtl ? 'ar-EG' : 'en-GB') : new Date(Date.now() - 72*60*60*1000).toLocaleString(isRtl ? 'ar-EG' : 'en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}</strong> {d('حتى الآن', 'until now')}
            </p>
            
            {governorate72hBadges.filter(b => b.count > 0).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {governorate72hBadges.filter(b => b.count > 0).slice(0, 15).map((badge, index) => {
                  const cleanedProject = badge.project ? badge.project.replace('مشروع إصلاح أعمال ', '').replace('مشروع ', '').split(' -')[0] : '';
                  const translatedProj = isRtl ? cleanedProject : (CLEAN_PROJECT_NAMES_EN[badge.project] || cleanedProject);
                  return (
                    <div 
                      key={`${badge.governorate}-${index}`}
                      className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-green-400 shadow-sm hover:shadow-md transition-all hover:scale-105"
                    >
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-gray-900 leading-tight">{translateGovernorate(badge.governorate, isRtl)}</span>
                        <span className="text-[9px] font-bold text-blue-600/70 truncate max-w-[100px]">
                          {translatedProj}
                        </span>
                      </div>
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-full shadow-sm">
                        {badge.count}
                      </span>
                    </div>
                  );
                })}
                {governorate72hBadges.length > 15 && (
                  <div className="inline-flex items-center gap-1 px-4 py-2 text-sm text-gray-600 font-medium">
                    <span>+{governorate72hBadges.length - 15} {d('محافظة أخرى', 'other governorates')}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center bg-white/50 rounded-xl border border-dashed border-green-300">
                <p className="text-sm font-bold text-green-700">{d('لا توجد بيانات لهذه الفئة في المشروع المختار حالياً', 'No data found for this category in the selected project')}</p>
                <p className="text-[10px] text-gray-500 mt-1">{d('جرب اختيار "جميع المشاريع" أو فئة أخرى', 'Try selecting "All Projects" or another category')}</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-gray-600 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{d('يتم تحديث العدد تلقائياً كل ثانية • الحساب بناءً على وقت الإضافة الفعلي', 'Count updates automatically every second • Based on actual addition time')}</span>
              </p>
            </div>

          </div>
        
        {/* Header with Month Filter */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
            {/* Month Filter - Responsive */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
              <label className="text-xs sm:text-sm font-medium text-gray-700">{d('اختيار الشهر:', 'Select Month:')}</label>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-2 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 sm:flex-none"
                />
                {selectedMonth && (
                  <button
                    onClick={() => setSelectedMonth('')}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    {d('إلغاء', 'Cancel')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {getSortedProjects().map(([key, stats], index) => {
            const shortLabelName = stats.name ? stats.name.replace('مشروع إصلاح أعمال ', '').replace('مشروع ', '').replace(' -القطاع الأوسط', '').replace(' - القطاع الأوسط', '') : key;
            const shortName = isRtl ? shortLabelName : (CLEAN_PROJECT_NAMES_EN[stats.name] || shortLabelName);
            const connStats = connectionsStatsByProject[stats.name];
            
            const explicitlyHasWater = checkExplicitPerm(stats.name, 'water_connections');
            const explicitlyHasSewage = checkExplicitPerm(stats.name, 'sewage_connections');
            
            // Only split into multi-card if BOTH are granted
            const isConnectionProject = explicitlyHasWater && explicitlyHasSewage;
            const showWater = isConnectionProject;
            const showSewage = isConnectionProject;

            return (
              <div 
                key={key} 
                className={`rounded-xl shadow-lg p-4 sm:p-5 text-white transition-all cursor-default ${
                  selectedProject72h === stats.name 
                  ? 'ring-4 ring-white ring-opacity-60 scale-105 z-10 shadow-2xl' 
                  : 'hover:scale-[1.02] opacity-90 hover:opacity-100'
                }`}
                style={{ 
                  background: `linear-gradient(135deg, ${getThemeColor('primary')}, ${getThemeColor('hover')})`
                }}
                onClick={() => {
                  // البطاقة للعرض فقط بناءً على طلب المستخدم
                }}
              >
                {isConnectionProject ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/20 pb-2">
                      <p className="text-sm font-bold opacity-90">{d('مشروع ', 'Project ') + shortName}</p>
                      <span className="text-xl">📁</span>
                    </div>
                    {/* البطاقة أصبحت "متعددة" دائماً كما طلب المستخدم (grid-cols-2) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {showWater && (
                        <div 
                          className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all cursor-default group"
                        >
                          <p className="text-[10px] opacity-80 mb-1 uppercase font-bold group-hover:opacity-100 transition-opacity">{d('توصيلات المياه', 'Water Connections')}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{connStats?.water?.total || 0}</p>
                            <span className="text-xl">💧</span>
                          </div>
                        </div>
                      )}
                      {showSewage && (
                        <div 
                          className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-all cursor-default group"
                        >
                          <p className="text-[10px] opacity-80 mb-1 uppercase font-bold group-hover:opacity-100 transition-opacity">{d('توصيلات الصرف', 'Sewage Connections')}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-2xl font-bold">{connStats?.sewage?.total || 0}</p>
                            <span className="text-xl">🚽</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between h-full">
                    <div>
                      <p className="text-xs sm:text-sm opacity-90 font-bold mb-1">{d('إجمالي بلاغات ', 'Total Reports of ') + shortName}</p>
                      <p className="text-3xl sm:text-4xl font-extrabold tracking-tight">{stats.total || 0}</p>
                    </div>
                    <div className="text-4xl sm:text-6xl opacity-20">🏛️</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Charts - الرسوم البيانية */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{d('مقارنة البلاغات حسب المشاريع', 'Comparison of Reports by Projects')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  style={{ fontSize: '9px', fontWeight: 'bold' }} 
                  reversed={isRtl}
                  interval={0} 
                  height={80} 
                  tick={{ dy: 10 }}
                  textAnchor="middle"
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {/* إظهار أعمدة الإصلاح فقط إذا كان هناك بيانات لها */}
                {chartData.some(d => d.total > 0) && (
                  <>
                    <Bar dataKey="total" fill="#3B82F6" name={d('بلاغات الإصلاح', 'Repair Reports')} />
                    <Bar dataKey="fixed" fill="#10B981" name={d('تم الإصلاح', 'Repaired')} />
                  </>
                )}
                {/* إظهار أعمدة التوصيلات دائماً إذا وجدت */}
                {chartData.some(d => d.water > 0) && <Bar dataKey="water" fill="#0EA5E9" name={d('توصيلات المياه', 'Water Connections')} />}
                {chartData.some(d => d.sewage) && <Bar dataKey="sewage" fill="#059669" name={d('توصيلات الصرف', 'Sewage Connections')} />}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{d('توزيع البلاغات حسب المشاريع', 'Distribution of Reports by Projects')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Analysis - التحليل الذكي */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            🤖 {d('التحليل الذكي بالذكاء الاصطناعي', 'AI Smart Analysis')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiAnalysisCards.map((card, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/5 flex flex-col justify-between">
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">{card.title}</h4>
                  <p className="text-xs sm:text-sm leading-relaxed">{card.content}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-white/10 text-[10px] font-bold opacity-80 uppercase tracking-wider">
                  {card.footer}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 24 Hour Counter per Governorate */}
        {/* يظهر للـ: Admin، المستوى الأول، المستوى الثالث (محمود هارون) الذين لديهم صلاحيات جميع المحافظات */}
        {(
          user.role === 'admin' || 
          hasPermission('reports_view') || 
          hasPermission('water_connections') || 
          hasPermission('sewage_connections') ||
          (user.governorates && user.governorates.length > 0)
        ) && Object.keys(last72HoursCounts).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-red-600">🔴</span>
                {selectedCategory72h === 'reports' ? d('البلاغات', 'Reports') : 
                 selectedCategory72h === 'water_connections' ? d('توصيلات المياه', 'Water Connections') : d('توصيلات الصرف', 'Sewage Connections')} {d('المضافة خلال 72 ساعة لكل محافظة', 'Added in Last 72 Hours by Governorate')}
              </h3>
              <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                📅 {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-GB', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                ⏰ {d('يعرض ', 'Displays ')} {selectedCategory72h === 'reports' ? d('البلاغات', 'reports') : 
                         selectedCategory72h === 'water_connections' ? d('توصيلات المياه', 'water connections') : d('توصيلات الصرف', 'sewage connections')} {d('من تاريخ المباشرة ', ' from start date ')} <strong>{new Date(Date.now() - 72*60*60*1000).toLocaleString(isRtl ? 'ar-EG' : 'en-GB', { 
                  year: 'numeric', 
                  month: 'numeric', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</strong> {d('حتى الآن', 'until now')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {!last72HoursCounts || last72HoursCounts.length === 0 ? (
                <div className="col-span-full text-center py-8 text-gray-500">
                  {d('لا توجد بلاغات جديدة خلال آخر 72 ساعة', 'No new reports during the last 72 hours')}
                </div>
              ) : (
                [...last72HoursCounts]
                  .filter(item => item.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((item, idx) => {
                    const cleanItemProj = item.project ? item.project.replace('مشروع إصلاح أعمال ', '').replace('مشروع ', '').replace(' -القطاع الأوسط', '').replace(' - القطاع الأوسط', '') : '';
                    const translatedItemProj = isRtl ? cleanItemProj : (CLEAN_PROJECT_NAMES_EN[item.project] || cleanItemProj);
                    return (
                      <div 
                        key={`${item.governorate}-${idx}`} 
                        className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-lg p-4 hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                        onClick={() => {
                          setSelectedGovernorate72h(item.governorate);
                          if (item.project && item.project !== 'جميع المشاريع' && item.project !== 'غير محدد') {
                            setSelectedProject72h(item.project);
                          }
                          // تفريغ التاريخ لضمان عرض جميع البلاغات في الـ 72 ساعة للمحافظة المحددة
                          setSelectedDate72h('');
                          setShowReports72h(true);
                          // التمرير لقسم الفلاتر
                          document.getElementById('section-72h')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >
                        <div className="text-xs font-bold text-gray-600 mb-1">🏛️</div>
                        <div className="text-sm font-bold text-gray-800 mb-1">{translateGovernorate(item.governorate, isRtl)}</div>
                        <div className="text-[9px] font-bold text-blue-600 truncate mb-2 px-1 py-0.5 bg-blue-50 rounded border border-blue-100">
                          {translatedItemProj || d('جميع المشاريع', 'All Projects')}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <div className="text-3xl font-bold text-red-600">{item.count}</div>
                          <div className="text-xs text-gray-600 font-bold">
                            {selectedCategory72h === 'reports' ? d('بلاغ', 'Report') : d('توصيلة', 'Connection')}
                          </div>
                        </div>
                        <div className="text-xs text-red-600 mt-1 font-medium">
                          {selectedCategory72h === 'reports' ? d('جديد خلال 72 ساعة', 'New in 72 hours') : d('جديدة خلال 72 ساعة', 'New in 72 hours')}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="mt-4 text-xs text-gray-500 text-center">
              {d('آخر تحديث: ', 'Last update: ')} {new Date().toLocaleTimeString(isRtl ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        )}


        {/* Projects Statistics */}
        {/* Admin فقط يرى جميع المشاريع، Level 1/2/3 يروا مشروعهم المحدد فقط */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {getSortedProjects()
            .filter(([key, stats]) => {
              const projectName = stats.name || key;
              const hasBothPerms = checkExplicitPerm(projectName, 'water_connections') && checkExplicitPerm(projectName, 'sewage_connections');
              return !hasBothPerms;
            })
            .map(([key, stats]) => (
              <ProjectCard 
                key={key}
                title={stats.name || PROJECT_NAMES[key] || key}
                stats={stats}
                projectKey={key}
                cardLabels={projectCardLabels[stats.name || key] || []}
              />
            ))}
        </div>
      </div>
    </Layout>
  );
}

export default NewDashboard;
