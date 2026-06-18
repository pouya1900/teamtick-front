<script setup>
import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const router = useRouter()
const gameStore = useGameStore()
const switchCooldown = 15
const switchRemaining = ref(switchCooldown)
const isSwitchReady = computed(() => switchRemaining.value <= 0)

let switchInterval = null
const stressAudio = ref(null)
const successAudio = ref(null)

const teams = computed(() => gameStore.teams)
const activePlayers = computed(() => gameStore.activePlayers)
const currentPlayer = computed(() => gameStore.currentPlayer)
const currentTeam = computed(() => gameStore.currentTeam)
const currentWord = computed(() => gameStore.currentWord)
const currentRotation = computed(() => gameStore.currentRotation)
const isRoundActive = computed(() => gameStore.isRoundActive)
const isRoundEnding = computed(() => gameStore.isRoundEnding)
const showRoundExplosion = computed(() => gameStore.showRoundExplosion)
const roundRemainingSeconds = computed(() => gameStore.roundRemainingSeconds)
const roundDuration = computed(() => gameStore.roundDuration)

const totalSlots = computed(() => activePlayers.value.length)

const centerLabel = computed(() => {
  if (isRoundEnding.value) return t('play.round_end')
  if (!isRoundActive.value) return t('play.start')
  return currentWord.value?.word ?? currentWord.value?.text ?? '...'
})

const switchProgress = computed(() => {
  return ((switchCooldown - switchRemaining.value) / switchCooldown) * 100
})

const roundProgress = computed(() => {
  if (!roundDuration.value) return 0
  return ((roundDuration.value - roundRemainingSeconds.value) / roundDuration.value) * 100
})

const isGameFinished = computed(() => gameStore.isGameFinished)

const getSlotStyle = (slotIndex, total) => {
  const angle = (360 / total) * slotIndex - 90
  const rad = (angle * Math.PI) / 180
  const r = 38
  const x = 50 + r * Math.cos(rad)
  const y = 50 + r * Math.sin(rad)

  return {
    left: x + '%',
    top: y + '%',
    transform: `translate(-50%, -50%) rotate(${-currentRotation.value + 180}deg)`,
  }
}

const formatPenaltyTime = (seconds) => {
  const total = Number(seconds ?? 0)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const teamPenaltyPercent = (team) => {
  const penalty = Number(team.total_penalty_time ?? 0)
  const max = Math.max(1, Number(gameStore.gameData?.turn_duration ?? 60) * 5)
  return Math.max(0, Math.min(100, (penalty / max) * 100))
}

const startSwitchCooldown = () => {
  clearInterval(switchInterval)
  switchRemaining.value = switchCooldown

  switchInterval = setInterval(() => {
    if (switchRemaining.value > 0) {
      switchRemaining.value--
    }

    if (switchRemaining.value <= 0) {
      clearInterval(switchInterval)
      switchInterval = null
    }
  }, 1000)
}

const resetSwitchCooldown = () => {
  clearInterval(switchInterval)
  switchInterval = null
  switchRemaining.value = 0
}

const updateStressAudio = async () => {
  const audio = stressAudio.value
  if (!audio) return

  if (!isRoundActive.value || isRoundEnding.value) {
    audio.pause()
    audio.currentTime = 0
    audio.playbackRate = 1
    return
  }

  const ratio = roundRemainingSeconds.value / Math.max(1, roundDuration.value)

  if (ratio > 0.66) {
    audio.playbackRate = 1
    audio.volume = 0.35
  } else if (ratio > 0.33) {
    audio.playbackRate = 1.12
    audio.volume = 0.45
  } else if (ratio > 0.15) {
    audio.playbackRate = 1.28
    audio.volume = 0.6
  } else {
    audio.playbackRate = 1.45
    audio.volume = 0.75
  }

  try {
    if (audio.paused) {
      await audio.play()
    }
  } catch (error) {
    console.warn('Audio autoplay blocked until user interaction:', error)
  }
}

const handleSwitchWord = () => {
  if (!isRoundActive.value || !isSwitchReady.value || isRoundEnding.value) return
  gameStore.setNextWord()
  startSwitchCooldown()
}

const handleCenterTap = async () => {
  if (isRoundEnding.value) return

  if (!isRoundActive.value) {
    gameStore.startRound()
    startSwitchCooldown()
    await updateStressAudio()
    return
  }
  successAudio.value.volume = 0.4
  successAudio.value?.play()
  gameStore.moveToNextTurn()
  startSwitchCooldown()
}

watch(
    () => isGameFinished.value,
    (finished) => {
      if (finished) {
        router.replace({name: 'winner'})
      }
    },
    {immediate: true}
)
const goBack = () => {
  router.back()
}

watch(
    () => [roundRemainingSeconds.value, isRoundActive.value, isRoundEnding.value],
    () => {
      updateStressAudio()
    },
    {immediate: true}
)

onMounted(() => {
  if (!gameStore.currentWord && !gameStore.isRoundActive) {
    gameStore.startGameSession()
  }

  resetSwitchCooldown()
})

onBeforeUnmount(() => {
  clearInterval(switchInterval)
  gameStore.stopRoundTimer()

  if (stressAudio.value) {
    stressAudio.value.pause()
    stressAudio.value.currentTime = 0
  }
})
</script>

<template>
  <div class="screen play-screen">
    <audio
        ref="stressAudio"
        src="/audio/stress-loop.mp3"
        preload="auto"
        loop
    ></audio>

    <audio
        ref="successAudio"
        src="/audio/success.mp3"
        preload="auto"
    ></audio>

    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <Transition name="boom">
      <div v-if="showRoundExplosion" class="round-finish-overlay">
        <div class="round-finish-burst"></div>
        <div class="round-finish-text">{{ t('play.round_end') }}</div>
      </div>
    </Transition>

    <header class="page-header play-header">
      <button class="back-btn play-back-btn" @click="goBack" :aria-label="t('play.round_end')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>

      <div class="page-icon">🎮</div>
    </header>

    <div class="play-timers" :class="`teams-${teams.length}`">
      <div
          v-for="team in teams"
          :key="team.id"
          class="team-timer-card"
          :class="{ active: currentTeam?.id === team.id && isRoundActive }"
          :style="{
          '--team-color': team.color_hex,
          '--team-glow': team.color_hex + '88'
        }"
      >
        <div class="team-timer-head">
          <span class="team-timer-name">{{ team.name }}</span>
          <span class="team-timer-time">{{ formatPenaltyTime(team.total_penalty_time) }}</span>
        </div>

        <div class="team-timer-bar">
          <div
              class="team-timer-fill"
              :style="{ width: `${teamPenaltyPercent(team)}%`, background: team.color_hex }"
          ></div>
        </div>
      </div>
    </div>
    <div class="round-wrap">
      <span>{{
          t('play.round')
        }} {{ gameStore.gameData?.current_round_number + '/' + gameStore.gameData?.settings?.rounds_count }}</span>
    </div>

    <div class="arena-wrap play-arena-wrap">
      <div class="arena-ring play-arena-ring">
        <button
            class="arena-center play-center"
            :class="{ idle: !isRoundActive, ending: isRoundEnding }"
            @click="handleCenterTap"
            @touchstart.prevent="handleCenterTap"
            type="button"
        >
          <div class="play-word-wrap">
            <span class="play-word">{{ centerLabel }}</span>
          </div>
        </button>

        <div
            class="players-rotation-layer"
            :style="{ transform: `rotate(${currentRotation+180}deg)` }"
        >
          <div
              v-for="(slot, i) in activePlayers"
              :key="slot.id"
              class="player-slot play-player-slot"
              :class="{ active: currentPlayer?.id === slot.id }"
              :style="{
              ...getSlotStyle(i, totalSlots),
              '--team-color': slot.team_color,
              '--team-glow': slot.team_color + '88',
            }"
          >
            <div class="avatar-ring play-avatar-ring">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </div>

            <span class="player-name play-player-name">
              {{ slot.name || t('common.player') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="play-footer">
      <button
          class="btn-switch-word"
          :class="{ ready: isSwitchReady && isRoundActive }"
          :disabled="!isSwitchReady || !isRoundActive || isRoundEnding"
          :style="{ '--switch-fill': `${switchProgress}%` }"
          @click="handleSwitchWord"
      >
        <span class="btn-switch-bg"></span>
        <span class="btn-switch-content">
          {{
            !isRoundActive
                ? t('play.switch_active_after')
                : isSwitchReady
                    ? t('play.switch_word')
                    : t('play.switch_cooldown', {n: switchRemaining})
          }}
        </span>
      </button>
    </div>
  </div>
</template>