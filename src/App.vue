<template>
  <main class="min-h-screen bg-gray-100 flex items-center justify-center">
    <RouterView/>
  </main>
</template>

<script setup>
import {RouterView} from 'vue-router'
import {watch} from 'vue'
import {useI18n} from 'vue-i18n'

const {locale} = useI18n()

watch(locale, (lang) => {
  document.documentElement.lang = lang
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
}, {immediate: true})
</script>