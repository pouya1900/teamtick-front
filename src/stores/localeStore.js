import {defineStore} from 'pinia'
import {ref} from 'vue'
import {useI18n} from 'vue-i18n'
import {SUPPORTED_LOCALES} from '../i18n'

export const useLocaleStore = defineStore('locale', () => {
    const currentLocale = ref(localStorage.getItem('locale') ?? 'en')
    const {locale: i18nLocale} = useI18n()

    const setLocale = (locale) => {
        if (!SUPPORTED_LOCALES.includes(locale)) return
        i18nLocale.value = locale
        currentLocale.value = locale
        localStorage.setItem('locale', locale)
        document.documentElement.lang = locale
        document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr'
    }

    const localized = (obj, field) => {
        if (!obj) return ''
        const localizedField = `${field}_${currentLocale.value}`
        return obj[localizedField] ?? obj[`${field}_en`] ?? ''
    }


    return {currentLocale, setLocale, localized}
})