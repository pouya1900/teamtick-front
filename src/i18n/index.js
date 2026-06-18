import {createI18n} from 'vue-i18n'
import fa from './locales/fa.json'
import en from './locales/en.json'

export const SUPPORTED_LOCALES = ['fa', 'en']

export const i18n = createI18n({
    legacy: false, locale: localStorage.getItem('locale') ?? 'en', fallbackLocale: 'en', messages: {en, fa},
})