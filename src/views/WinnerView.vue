<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const router = useRouter()
const gameStore = useGameStore()
const winAudio = ref(null)

const winner = computed(() => gameStore.gameData?.winner ?? null)
const teams = computed(() => gameStore.teams ?? [])

const winnerTeam = computed(() => {
  if (!winner.value) return null
  return teams.value.find(team => team.id === winner.value.id) ?? null
})

const winnerName = computed(() => {
  return winner.value?.name ?? winnerTeam.value?.name ?? t('winner.winner')
})

const winnerColor = computed(() => {
  return winnerTeam.value?.color_hex ?? '#F59E0B'
})

const confettiPieces = Array.from({length: 64}, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 1.8}s`,
  duration: `${3.6 + Math.random() * 2.4}s`,
  opacity: 0.65 + Math.random() * 0.35,
  width: `${6 + Math.random() * 8}px`,
  height: `${10 + Math.random() * 14}px`,
  rotate: `${Math.random() * 360}deg`,
  color: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#A855F7', '#FACC15'][i % 6],
}))

const goHome = () => {
  router.replace({name: 'home'})
}

const startNewGame = () => {
  gameStore.clearGame()
  router.replace({name: 'setup'})
}

onMounted(async () => {
  if (!winner.value) {
    await router.replace({name: 'home'})
    return
  }

  try {
    if (winAudio.value) {
      winAudio.value.currentTime = 0
      await winAudio.value.play()
    }
  } catch (error) {
    console.warn('Winner audio autoplay blocked:', error)
  }
})
</script>

<template>
  <div class="screen winner-screen">
    <audio
        ref="winAudio"
        src="/audio/winner-short.mp3"
        preload="auto"
    ></audio>

    <div class="winner-bg-layer"></div>
    <div class="winner-bg-overlay"></div>

    <div class="confetti-layer" aria-hidden="true">
      <span
          v-for="piece in confettiPieces"
          :key="piece.id"
          class="confetti-piece"
          :style="{
          left: piece.left,
          animationDelay: piece.delay,
          animationDuration: piece.duration,
          opacity: piece.opacity,
          width: piece.width,
          height: piece.height,
          '--rotate-start': piece.rotate,
          '--confetti-color': piece.color,
        }"
      ></span>
    </div>

    <div class="winner-glow" :style="{ '--winner-color': winnerColor }"></div>

    <section class="winner-card">
      <div class="winner-crown-ring">
        <div class="winner-trophy-wrap" :style="{ '--winner-color': winnerColor }">
          <svg class="winner-trophy" viewBox="0 0 64 64" fill="none">
            <path d="M20 10h24v8c0 7.5-4.8 13.8-12 16-7.2-2.2-12-8.5-12-16v-8Z" fill="currentColor"/>
            <path d="M22 38h20" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <path d="M26 46h12" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
            <path d="M18 14H10c0 8 3.5 13 10 14" stroke="currentColor" stroke-width="4" stroke-linecap="round"
                  stroke-linejoin="round"/>
            <path d="M46 14h8c0 8-3.5 13-10 14" stroke="currentColor" stroke-width="4" stroke-linecap="round"
                  stroke-linejoin="round"/>
          </svg>
        </div>
      </div>

      <p class="winner-kicker">{{ t('winner.champion') }}</p>
      <h1 class="winner-title">
        <span class="winner-name" :style="{ color: winnerColor }">{{ winnerName }}</span>
        <span>{{ t('winner.won') }}</span>
      </h1>

      <p class="winner-subtitle">
        {{ t('winner.description', {name: winnerName}) }}
      </p>

      <div class="winner-actions">
        <button class="winner-btn winner-btn-secondary" type="button" @click="goHome">
          بازگشت به خانه
        </button>
        <button class="winner-btn winner-btn-primary" type="button" @click="startNewGame">
          بازی جدید
        </button>
      </div>
    </section>
  </div>
</template>
