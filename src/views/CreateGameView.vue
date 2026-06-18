<script setup>
import {reactive, ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {useLocaleStore} from '../stores/localeStore'
import {onMounted} from 'vue'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const router = useRouter()
const gameStore = useGameStore()
const localeStore = useLocaleStore()

const isLoading = ref(false)
const errorMessage = ref('')

const teams = reactive(
    history.state?.teams ?? [
      {name: t('team.red'), color_hex: '#EF4444', players: [t('team.players.0'), t('team.players.1')]},
      {name: t('team.blue'), color_hex: '#3B82F6', players: [t('team.players.2'), t('team.players.3')]},
    ]
)

const formData = reactive({
  rounds_count: 5,
  turn_duration: 60,
  difficulty: 'medium',
  language: localeStore.currentLocale,
  category_ids: [],
  teams,
})

const roundOptions = [3, 5, 7]
const timeOptions = [45, 60, 90]
const diffOptions = [
  {value: 'easy', label: t('setting.difficulty.easy')},
  {value: 'medium', label: t('setting.difficulty.medium')},
  {value: 'hard', label: t('setting.difficulty.hard')},
  {value: 'all', label: t('setting.difficulty.all')},
]

onMounted(() => {
  gameStore.fetchCategories()
})

const catCount = computed(() => formData.category_ids.length)

const toggleCat = (id) => {
  const idx = formData.category_ids.indexOf(id)
  if (idx === -1) {
    formData.category_ids.push(id)
  } else if (formData.category_ids.length > 1) {
    formData.category_ids.splice(idx, 1)
  }
}

const isCatSelected = (id) => formData.category_ids.includes(id)

const submitForm = async () => {
  if (formData.category_ids.length === 0) {
    errorMessage.value = t('errors.CATEGORY_NOT_SELECTED')
    return
  }
  for (const team of formData.teams) {
    const valid = team.players.filter(p => p.trim() !== '')
    if (valid.length !== 2) {
      errorMessage.value = t('errors.TEAM_NEEDS_TWO_PLAYER', {n: team.name})
      return
    }
    team.players = valid
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await gameStore.createGame(formData)
    await router.push({name: 'play-game'})
  } catch (error) {
    errorMessage.value = error?.response?.data?.message ?? t('error.GENERIC')
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="screen">
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <main class="panel">
      <header class="page-header">
        <button class="back-btn" @click="router.back()" aria-label="برگشت">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="page-icon">⚙️</div>
        <h1 class="page-title">{{ t('setting.game_settings') }}</h1>
        <p class="page-subtitle">{{ t('setting.game_settings_desc') }}</p>
      </header>

      <div class="panel-body">
        <div class="setting-row">
          <div class="setting-label"><span>🏆</span><span>{{ t('setting.round_count') }}</span></div>
          <div class="pill-group">
            <button
                v-for="n in roundOptions" :key="n"
                class="pill-btn" :class="{ active: formData.rounds_count === n }"
                @click="formData.rounds_count = n"
            >{{ n }} {{ t('setting.rounds') }}
            </button>
          </div>
        </div>
        <div class="divider"></div>

        <div class="setting-row">
          <div class="setting-label"><span>⏱️</span><span>{{ t('setting.round_time') }}</span></div>
          <div class="pill-group">
            <button
                v-for="time in timeOptions" :key="time"
                class="pill-btn" :class="{ active: formData.turn_duration === time }"
                @click="formData.turn_duration = time"
            >{{ time }} {{ t('setting.second') }}
            </button>
          </div>
        </div>
        <div class="divider"></div>

        <div class="setting-row">
          <div class="setting-label"><span>📊</span><span>{{ t('setting.difficulty_level') }}</span></div>
          <div class="pill-group">
            <button
                v-for="d in diffOptions" :key="d.value"
                class="pill-btn" :class="{ active: formData.difficulty === d.value }"
                @click="formData.difficulty = d.value"
            >{{ d.label }}
            </button>
          </div>
        </div>
        <div class="divider"></div>


        <div class="cat-section">
          <div class="cat-header">
            <span>✨</span>
            <span class="cat-title">{{ t('setting.select_category') }}</span>
            <span class="cat-count">{{ catCount }} / 20</span>
          </div>
          <div v-if="gameStore.categoriesLoading" class="cat-loading">
            <span class="spinner"></span>
          </div>
          <div v-else class="cat-grid">
            <button
                v-for="cat in gameStore.categories" :key="cat.id"
                class="cat-btn" :class="{ selected: isCatSelected(cat.id) }"
                @click="toggleCat(cat.id)"
                :aria-pressed="isCatSelected(cat.id)"
            >
              <span class="cat-emoji">{{ cat.icon }}</span>
              <span class="cat-label">{{ localeStore.localized(cat, 'name') }}</span>
              <span v-if="isCatSelected(cat.id)" class="cat-check">✓</span>
            </button>
          </div>
        </div>
      </div>

      <!-- footer -->
      <div class="panel-footer">
        <Transition name="fade-err">
          <p v-if="errorMessage" class="error-msg" role="alert">{{ errorMessage }}</p>
        </Transition>
        <button class="btn-start" @click="submitForm" :disabled="isLoading">
          <template v-if="isLoading">
            <span class="spinner"></span> در حال بارگذاری...
          </template>
          <template v-else>▶ شروع بازی</template>
        </button>
      </div>
    </main>
  </div>
</template>
