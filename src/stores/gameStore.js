import {defineStore} from 'pinia'
import {useLocalStorage} from '@vueuse/core'
import axios from 'axios'
import {ref} from "vue";

const API_URL = 'http://localhost:8000/api'

export const useGameStore = defineStore('game', () => {

    // Main game data returned from the backend (stored locally to persist across page refreshes)
    const gameData = useLocalStorage('game_data', null)

    // Words list that the backend provides for the game (stored locally to persist across page refreshes)
    const words = useLocalStorage('game_words', [])

    // Detected word IDs that have been used in the current game session (stored locally to avoid repeats)
    const usedWordIds = useLocalStorage('game_used_words', [])

    const categories = ref([])

    const categoriesLoading = ref(false)
    // --- Getters ---

    // Helper to check if there's an active game (not finished) in the state
    const hasActiveGame = () => {
        return gameData.value !== null && gameData.value.status !== 'finished'
    }

    // Get the next word that hasn't been used yet
    const getNextWord = () => {
        const availableWords = words.value.filter(word => !usedWordIds.value.includes(word.id))

        if (availableWords.length === 0) return null // کلمات تموم شده

        // انتخاب رندوم
        const randomIndex = Math.floor(Math.random() * availableWords.length)
        const selectedWord = availableWords[randomIndex]

        // مارک کردن به عنوان استفاده شده
        usedWordIds.value.push(selectedWord.id)

        return selectedWord
    }

    // --- Actions ---

    // Create a new game on the server
    const createGame = async (payload) => {
        try {
            const response = await axios.post(`${API_URL}/games`, payload)
            const data = response.data.data

            // ذخیره دیتای بک‌اند در استیت ما
            gameData.value = data.game
            words.value = data.words
            usedWordIds.value = [] // ریست کردن کلمات استفاده شده برای بازی جدید

            return true
        } catch (error) {
            console.error('Error creating game:', error)
            throw error
        }
    }

    // اSend the round results to the server and get updated game state
    const submitRound = async (turns) => {
        if (!gameData.value) return

        try {
            const response = await axios.post(`${API_URL}/games/${gameData.value.id}/rounds`, {turns})

            // بک‌اند وضعیت جدید بازی (راند بعدی، تایم‌های جریمه) رو برمی‌گردونه
            gameData.value = response.data.data.game
            return true
        } catch (error) {
            console.error('Error submitting round:', error)
            throw error
        }
    }

    // Get the latest game state from the server (useful for resuming a game after a page refresh)
    const resumeGame = async () => {
        if (!gameData.value) return false

        try {
            const response = await axios.get(`${API_URL}/games/${gameData.value.id}`)
            gameData.value = response.data.data.game
            return true
        } catch (error) {
            console.error('Error resuming game:', error)
            if (error.response && error.response.status === 404) {
                clearGame()
            }
            return false
        }
    }

    // Clear all game data
    const clearGame = () => {
        gameData.value = null
        words.value = []
        usedWordIds.value = []
    }

    const fetchCategories = async () => {
        if (categories.value.length > 0) return

        categoriesLoading.value = true
        try {
            const response = await axios.get(`${API_URL}/categories`)
            categories.value = response.data.data.categories
            console.log(categories.value);
        } catch (error) {
            console.error('خطا در دریافت دسته‌بندی‌ها:', error)
        } finally {
            categoriesLoading.value = false
        }
    }

    return {
        gameData,
        words,
        usedWordIds,
        categories,
        categoriesLoading,
        hasActiveGame,
        getNextWord,
        createGame,
        submitRound,
        resumeGame,
        clearGame,
        fetchCategories
    }
})