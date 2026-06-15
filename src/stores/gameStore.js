import {defineStore} from 'pinia'
import {useLocalStorage} from '@vueuse/core'
import axios from 'axios'
import {computed, ref} from 'vue'

const API_URL = 'http://localhost:8000/api'

export const useGameStore = defineStore('game', () => {
    const gameData = useLocalStorage('game_data', null)
    const words = useLocalStorage('game_words', [])
    const usedWordIds = useLocalStorage('game_used_words', [])

    const categories = ref([])
    const categoriesLoading = ref(false)

    const currentWord = ref(null)
    const currentTurnIndex = useLocalStorage('game_current_turn_index', 0)
    const currentRotation = useLocalStorage('game_current_rotation', 0)

    const roundRemainingSeconds = useLocalStorage('game_round_remaining_seconds', 0)
    const isRoundActive = useLocalStorage('game_is_round_active', false)

    const roundTimerInterval = ref(null)
    const isRoundEnding = ref(false)
    const showRoundExplosion = ref(false)

    const roundTurns = ref([])
    const currentTurnElapsedSeconds = ref(0)

    const gameWinner = computed(() => gameData.value?.winner ?? null)

    const isGameFinished = computed(() => {
        return gameData.value?.status === 'finished' || !!gameWinner.value
    })

    const hasActiveGame = () => {
        return gameData.value !== null && gameData.value.status !== 'finished'
    }

    const teams = computed(() => gameData.value?.teams ?? [])

    const activePlayers = computed(() => {
        const gameTeams = teams.value
        if (!gameTeams.length) return []

        const arranged = []
        const maxPlayers = Math.max(...gameTeams.map(team => team.players?.length ?? 0), 0)

        for (let playerIndex = 0; playerIndex < maxPlayers; playerIndex++) {
            for (let teamIndex = 0; teamIndex < gameTeams.length; teamIndex++) {
                const team = gameTeams[teamIndex]
                const player = team.players?.[playerIndex]

                if (player) {
                    arranged.push({
                        ...player,
                        team_id: team.id,
                        team_name: team.name,
                        team_color: team.color_hex,
                        team_index: teamIndex,
                        player_index: playerIndex,
                    })
                }
            }
        }

        return arranged
    })

    const currentPlayer = computed(() => {
        if (!activePlayers.value.length) return null
        return activePlayers.value[currentTurnIndex.value] ?? activePlayers.value[0]
    })

    const currentTeam = computed(() => {
        if (!currentPlayer.value) return null
        return teams.value.find(team => team.id === currentPlayer.value.team_id) ?? null
    })

    const rotationStep = computed(() => {
        if (!activePlayers.value.length) return 0
        return 360 / activePlayers.value.length
    })

    const roundDuration = computed(() => {
        return Number(gameData.value?.settings?.turn_duration_seconds ?? 60)
    })

    const formatTime = (seconds) => {
        const total = Number(seconds ?? 0)
        const mins = Math.floor(total / 60)
        const secs = total % 60
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    const incrementCurrentTeamTime = () => {
        if (!currentTeam.value || !gameData.value?.teams?.length) return

        const teamIndex = gameData.value.teams.findIndex(team => team.id === currentTeam.value.id)
        if (teamIndex === -1) return

        const currentPenalty = Number(gameData.value.teams[teamIndex].total_penalty_time ?? 0)
        gameData.value.teams[teamIndex].total_penalty_time = currentPenalty + 1
    }

    const getNextWord = () => {
        const availableWords = words.value.filter(word => !usedWordIds.value.includes(word.id))

        if (availableWords.length === 0) return null

        const randomIndex = Math.floor(Math.random() * availableWords.length)
        const selectedWord = availableWords[randomIndex]

        usedWordIds.value.push(selectedWord.id)

        return selectedWord
    }

    const createGame = async (payload) => {
        try {
            const response = await axios.post(`${API_URL}/games`, payload)
            const data = response.data.data

            gameData.value = data.game
            words.value = data.words
            usedWordIds.value = []

            currentWord.value = null
            currentTurnIndex.value = 0
            currentRotation.value = 0

            resetRoundState(true)

            return true
        } catch (error) {
            console.error('Error creating game:', error)
            throw error
        }
    }

    const submitRound = async (turns = []) => {
        if (!gameData.value) return

        try {
            const response = await axios.post(`${API_URL}/games/${gameData.value.id}/rounds`, {turns})
            gameData.value = response.data.data.game
            return true
        } catch (error) {
            console.error('Error submitting round:', error)
            throw error
        }
    }

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

    const clearGame = () => {
        stopRoundTimer()

        gameData.value = null
        words.value = []
        usedWordIds.value = []
        currentWord.value = null
        currentTurnIndex.value = 0
        currentRotation.value = 0
        roundRemainingSeconds.value = 0
        isRoundActive.value = false
        isRoundEnding.value = false
        showRoundExplosion.value = false
    }

    const fetchCategories = async () => {
        if (categories.value.length > 0) return

        categoriesLoading.value = true
        try {
            const response = await axios.get(`${API_URL}/categories`)
            categories.value = response.data.data.categories
        } catch (error) {
            console.error('خطا در دریافت دسته‌بندی‌ها:', error)
        } finally {
            categoriesLoading.value = false
        }
    }

    const resetRoundState = (resetPlayerTurn = false) => {
        stopRoundTimer()

        isRoundActive.value = false
        isRoundEnding.value = false
        showRoundExplosion.value = false
        roundRemainingSeconds.value = roundDuration.value
        currentWord.value = null

        roundTurns.value = []
        currentTurnElapsedSeconds.value = 0

        if (resetPlayerTurn) {
            currentTurnIndex.value = 0
            currentRotation.value = 0
        }
    }

    const startGameSession = () => {
        resetRoundState(false)
    }

    const setNextWord = () => {
        currentWord.value = getNextWord()
        return currentWord.value
    }

    const moveToNextTurn = () => {
        if (!activePlayers.value.length || !isRoundActive.value || isRoundEnding.value) return null

        if (currentPlayer.value && currentTurnElapsedSeconds.value > 0) {
            roundTurns.value.push({
                player_id: currentPlayer.value.id,
                elapsed_seconds: currentTurnElapsedSeconds.value
            })
        }
        currentTurnElapsedSeconds.value = 0

        currentTurnIndex.value = (currentTurnIndex.value + 1) % activePlayers.value.length
        currentRotation.value -= rotationStep.value
        setNextWord()

        return currentPlayer.value
    }

    const startRound = () => {
        if (isRoundActive.value || isRoundEnding.value) return

        roundRemainingSeconds.value = roundDuration.value
        isRoundActive.value = true

        if (!currentWord.value) {
            currentWord.value = getNextWord()
        }

        startRoundTimer()
    }

    const stopRoundTimer = () => {
        if (roundTimerInterval.value) {
            clearInterval(roundTimerInterval.value)
            roundTimerInterval.value = null
        }
    }

    const finishRound = async () => {
        if (isRoundEnding.value) return

        isRoundEnding.value = true
        isRoundActive.value = false
        stopRoundTimer()
        showRoundExplosion.value = true

        if (currentPlayer.value) {
            roundTurns.value.push({
                player_id: currentPlayer.value.id,
                elapsed_seconds: currentTurnElapsedSeconds.value
            })
        }
        try {
            await submitRound(roundTurns.value)
        } catch (error) {
            console.error('Error finishing round:', error)
        }

        setTimeout(() => {
            showRoundExplosion.value = false
            resetRoundState(false)
        }, 1000)
    }

    const startRoundTimer = () => {
        if (roundTimerInterval.value) return

        roundTimerInterval.value = setInterval(async () => {
            if (!isRoundActive.value || isRoundEnding.value) return

            if (roundRemainingSeconds.value > 0) {
                roundRemainingSeconds.value -= 1
                currentTurnElapsedSeconds.value += 1
                incrementCurrentTeamTime()
            }

            if (roundRemainingSeconds.value <= 0) {
                await finishRound()
            }
        }, 1000)
    }

    return {
        gameData,
        words,
        usedWordIds,
        categories,
        categoriesLoading,
        currentWord,
        currentTurnIndex,
        currentRotation,
        roundRemainingSeconds,
        isRoundActive,
        isRoundEnding,
        showRoundExplosion,
        teams,
        activePlayers,
        currentPlayer,
        currentTeam,
        rotationStep,
        roundDuration,
        hasActiveGame,
        formatTime,
        getNextWord,
        createGame,
        submitRound,
        resumeGame,
        clearGame,
        fetchCategories,
        startGameSession,
        setNextWord,
        moveToNextTurn,
        resetRoundState,
        startRound,
        stopRoundTimer,
        finishRound,
        gameWinner,
        isGameFinished,
    }
})