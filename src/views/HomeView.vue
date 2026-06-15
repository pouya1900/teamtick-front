<template>
  <div class="screen home-screen" dir="rtl">
    <!-- استفاده از پس‌زمینه‌های گلوبال پروژه -->
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <main class="home-content">
      <!-- بخش لوگو و عنوان -->
      <div class="home-logo-wrap">
        <div class="home-logo-glow"></div>
        <div class="home-logo-icon">🎮</div>
        <h1 class="home-title">بازی دور</h1>
        <p class="home-subtitle">یک دورهمی پر از هیجان و خنده</p>
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
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span class="btn-text">
            ادامه بازی فعلی
            <small class="btn-subtext">راند {{ gameStore.gameData?.current_round_number ?? 1 }}</small>
          </span>
        </button>

        <button
            @click="startNew"
            class="home-btn"
            :class="gameStore.hasActiveGame() ? 'btn-secondary' : 'btn-primary'"
            type="button"
        >
          <span class="btn-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </span>
          <span class="btn-text">شروع بازی جدید</span>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useGameStore } from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const startNew = () => {
  if (gameStore.hasActiveGame()) {
    if (!confirm('بازی فعلی شما پاک می‌شود. مطمئن هستید؟')) return
    gameStore.clearGame()
  }

  router.push({ name: 'create-game' })
}

const resumeGame = () => {
  router.push({ name: 'play-game' })
}
</script>