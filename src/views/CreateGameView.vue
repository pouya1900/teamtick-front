<script setup>
import {reactive, ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'
import {onMounted} from 'vue'

const router = useRouter()
const gameStore = useGameStore()

const isLoading = ref(false)
const errorMessage = ref('')

const teams = reactive(
    history.state?.teams ?? [
      {name: 'تیم قرمز', color_hex: '#EF4444', players: ['علی', 'رضا']},
      {name: 'تیم آبی', color_hex: '#3B82F6', players: ['سارا', 'مینا']},
    ]
)

const formData = reactive({
  rounds_count: 5,
  turn_duration: 60,
  difficulty: 'medium',
  language: 'fa',
  category_ids: [],
  teams,
})

const roundOptions = [3, 5, 7]
const timeOptions = [45, 60, 90]
const diffOptions = [
  {value: 'easy', label: 'آسان'},
  {value: 'medium', label: 'متوسط'},
  {value: 'hard', label: 'سخت'},
]
const langOptions = [
  {value: 'fa', label: 'فارسی'},
  {value: 'en', label: 'English'},
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
    errorMessage.value = 'حداقل یک دسته‌بندی باید انتخاب شود.'
    return
  }
  for (const team of formData.teams) {
    const valid = team.players.filter(p => p.trim() !== '')
    if (valid.length !== 2) {
      errorMessage.value = `${team.name} باید ۲ بازیکن داشته باشد.`
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
    errorMessage.value = error?.response?.data?.message ?? 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="screen" dir="rtl">
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <main class="panel">
      <!-- هدر -->
      <header class="page-header">
        <button class="back-btn" @click="router.back()" aria-label="برگشت">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="page-icon">⚙️</div>
        <h1 class="page-title">تنظیمات بازی</h1>
        <p class="page-subtitle">تنظیمات دلخواه خود را انتخاب کنید</p>
      </header>

      <div class="panel-body">
        <!-- تعداد دور -->
        <div class="setting-row">
          <div class="setting-label"><span>🏆</span><span>تعداد دور</span></div>
          <div class="pill-group">
            <button
                v-for="n in roundOptions" :key="n"
                class="pill-btn" :class="{ active: formData.rounds_count === n }"
                @click="formData.rounds_count = n"
            >{{ n }} دور
            </button>
          </div>
        </div>
        <div class="divider"></div>

        <!-- زمان -->
        <div class="setting-row">
          <div class="setting-label"><span>⏱️</span><span>زمان هر دور</span></div>
          <div class="pill-group">
            <button
                v-for="t in timeOptions" :key="t"
                class="pill-btn" :class="{ active: formData.turn_duration === t }"
                @click="formData.turn_duration = t"
            >{{ t }} ثانیه
            </button>
          </div>
        </div>
        <div class="divider"></div>

        <!-- سختی -->
        <div class="setting-row">
          <div class="setting-label"><span>📊</span><span>درجه سختی</span></div>
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

        <!-- زبان -->
        <div class="setting-row">
          <div class="setting-label"><span>🌐</span><span>زبان بازی</span></div>
          <div class="pill-group">
            <button
                v-for="l in langOptions" :key="l.value"
                class="pill-btn" :class="{ active: formData.language === l.value }"
                @click="formData.language = l.value"
            >{{ l.label }}
            </button>
          </div>
        </div>
        <div class="divider"></div>

        <!-- دسته‌بندی -->
        <div class="cat-section">
          <div class="cat-header">
            <span>✨</span>
            <span class="cat-title">انتخاب دسته‌بندی <small>(حداکثر ۲۰ مورد)</small></span>
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
              <span class="cat-label">{{ cat.name_fa }}</span>
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
