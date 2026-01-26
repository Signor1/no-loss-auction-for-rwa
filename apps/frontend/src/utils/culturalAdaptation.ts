'use client';

import { Language } from '../lib/i18n';

export interface CulturalSettings {
    measurementSystem: 'metric' | 'imperial';
    dateFormat: string;
    currencySymbol: string;
    firstDayOfWeek: number; // 0 for Sunday, 1 for Monday
}

export const getCulturalAdaptation = (language: Language): CulturalSettings => {
    switch (language) {
        case 'en':
            return {
                measurementSystem: 'imperial',
                dateFormat: 'MM/DD/YYYY',
                currencySymbol: '$',
                firstDayOfWeek: 0
            };
        case 'fr':
        case 'es':
        case 'de':
        case 'it':
            return {
                measurementSystem: 'metric',
                dateFormat: 'DD/MM/YYYY',
                currencySymbol: '€',
                firstDayOfWeek: 1
            };
        case 'ar':
            return {
                measurementSystem: 'metric',
                dateFormat: 'DD/MM/YYYY',
                currencySymbol: 'د.إ',
                firstDayOfWeek: 6 // Saturday in some regions, but vary
            };
        default:
            return {
                measurementSystem: 'metric',
                dateFormat: 'DD/MM/YYYY',
                currencySymbol: '$',
                firstDayOfWeek: 1
            };
    }
};
