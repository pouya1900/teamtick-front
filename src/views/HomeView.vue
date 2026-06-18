<template>
  <div class="lang_menu">
    <span @click="changeLanguage('en')" :class="localeStore.currentLocale==='en'? 'active' : ''">English</span>
    <span @click="changeLanguage('fa')" :class="localeStore.currentLocale==='fa'? 'active' : ''">فارسی</span>
  </div>
  <div class="screen home-screen">
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <main class="home-content">
      <div class="home-logo-wrap">
        <div class="home-logo-glow"></div>
        <div class="home-logo-icon">🎮</div>
        <h1 class="home-title">{{ t('home.title') }}</h1>
        <p class="home-subtitle">{{ t('home.subtitle') }}</p>
      </div>

      <div class="home-actions">
        <button
            v-if="gameStore.hasActiveGame()"
            @click="resumeGame"
            class="home-btn btn-primary btn-resume"
            type="button"
        >
          <span class="btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </span>
          <span class="btn-text">
            {{ t('home.resume_game') }}
            <small class="btn-subtext">{{ t('home.round_number') }} {{
                gameStore.gameData?.current_round_number ?? 1
              }}</small>
          </span>
        </button>

        <button
            @click="startNew"
            class="home-btn"
            :class="gameStore.hasActiveGame() ? 'btn-secondary' : 'btn-primary'"
            type="button"
        >
          <span class="btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </span>
          <span class="btn-text">  {{ t('home.new_game') }}</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useI18n} from 'vue-i18n'
import {useLocaleStore} from "../stores/localeStore";

const {t} = useI18n()
const router = useRouter()
const gameStore = useGameStore()
const localeStore = useLocaleStore()
const startNew = () => {
  if (gameStore.hasActiveGame()) {
    if (!confirm(t('home.clear_confirm'))) return
    gameStore.clearGame()
  }

  router.push({name: 'setup'})
}

const changeLanguage = (lang) => {
  localeStore.setLocale(lang)
}

const resumeGame = () => {
  router.push({name: 'play-game'})
}
</script>