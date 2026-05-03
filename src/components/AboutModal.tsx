import React from 'react';
import { X, Info, Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function AboutModal({ onClose }: { onClose: () => void }) {
  const { t, language } = useLanguage();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" style={{ zIndex: 60 }}>
      {/* Click outside to close (optional, but let's just use the X for now to keep it simple, or cover the whole background) */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        className="relative bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-700">
            <Info size={24} />
            <h2 className="text-xl font-bold">{t('about.title')}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-gray-700 text-sm leading-relaxed">
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>

          <div className="bg-emerald-50 text-emerald-900 p-4 rounded-xl border border-emerald-100 shadow-sm">
            <h3 className="font-bold mb-3">{t('about.features_title')}</h3>
            <ul className="list-disc mx-5 space-y-2 marker:text-emerald-500">
              <li>{t('about.feature1')}</li>
              <li>{t('about.feature2')}</li>
              <li>{t('about.feature3')}</li>
              <li>{t('about.feature4')}</li>
            </ul>
          </div>

          <p className="font-bold text-center text-emerald-600 text-base">{t('about.goal')}</p>

          <hr className="border-gray-200" />

          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 text-blue-600">
              <Users size={22} />
              <h3 className="text-lg font-bold">{t('about.team_title')}</h3>
            </div>
            <p>{t('about.team_desc')}</p>
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 text-center font-bold text-base shadow-sm">
              {t('about.team_members')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
