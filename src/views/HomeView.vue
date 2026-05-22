<template>
  <div class="bg-white p-8 rounded-xl shadow-lg text-center w-full max-w-md">
    <h1 class="text-4xl font-bold mb-8 text-blue-600">بازی دور</h1>

    <div class="space-y-4">
      <button
          v-if="gameStore.hasActiveGame()"
          @click="resumeGame"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        ادامه بازی فعلی (راند {{ gameStore.gameData.current_round_number }})
      </button>

      <button
          @click="startNew"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition"
      >
        شروع بازی جدید
      </button>
    </div>
  </div>
</template>

<script setup>
import {useRouter} from 'vue-router'
import {useGameStore} from '../stores/gameStore'

const router = useRouter()
const gameStore = useGameStore()

const startNew = () => {
  if (gameStore.hasActiveGame()) {
    if (!confirm('بازی فعلی شما پاک می‌شود. مطمئن هستید؟')) return
    gameStore.clearGame()
  }

  router.push({name: 'create-game'})
}

const resumeGame = () => {
  router.push({name: 'play-game'})
}
</script>