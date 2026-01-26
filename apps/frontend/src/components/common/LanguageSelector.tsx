'use client';

import React from 'react';
import { useI18n, i18nUtils, Language } from '../../lib/i18n';

export const LanguageSelector = () => {
    const { language, setLanguage, isRTL } = useI18n();
    const availableLanguages = i18nUtils.getAvailableLanguages();

    return (
        <div className="relative group">
            <button
                className="flex items-center space-x-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 transition-all font-bold text-xs uppercase tracking-widest text-gray-500 hover:text-indigo-600"
                aria-label="Selection de la langue"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                <span>{i18nUtils.getNativeLanguageName(language)}</span>
            </button>

            <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 py-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]`}>
                <div className="px-4 pb-2 mb-2 border-b dark:border-gray-700">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Language</p>
                </div>
                <div className="max-h-64 overflow-y-auto px-2 space-y-1">
                    {availableLanguages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setLanguage(lang as Language)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${language === lang ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <span>{i18nUtils.getNativeLanguageName(lang as Language)}</span>
                            {language === lang && <div className="h-1.5 w-1.5 rounded-full bg-indigo-600"></div>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
