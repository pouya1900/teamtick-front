<script setup>
import {reactive, ref, computed} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'

const {t} = useI18n()
const router = useRouter()
const teamCount = ref(2)
const editingPlayer = reactive({teamIndex: null, playerIndex: null})
const editingName = ref('')
const showSheet = ref(false)
const errorMessage = ref('')

const TEAM_COLORS = {
  0: {hex: '#EF4444', glow: 'rgba(239,68,68,0.55)', label: t('team.red')},
  1: {hex: '#3B82F6', glow: 'rgba(59,130,246,0.55)', label: t('team.blue')},
  2: {hex: '#10B981', glow: 'rgba(16,185,129,0.55)', label: t('team.green')},
}

const teams = reactive([
  {name: t('team.red'), color_hex: '#EF4444', players: ['', '']},
  {name: t('team.blue'), color_hex: '#3B82F6', players: ['', '']},
  {name: t('team.green'), color_hex: '#10B981', players: ['', '']},
])

const activePlayers = computed(() => {
  const slots = []
  for (let t = 0; t < teamCount.value; t++) {
    slots[t] = {teamIndex: t, playerIndex: 0}
    slots[t + teamCount.value] = {teamIndex: t, playerIndex: 1}
  }
  return slots
})

const totalSlots = computed(() => activePlayers.value.length)

const getSlotStyle = (slotIndex, total) => {
  const angle = (360 / total) * slotIndex - 90
  const rad = (angle * Math.PI) / 180
  const r = 38
  const x = 50 + r * Math.cos(rad)
  const y = 50 + r * Math.sin(rad)
  return {left: x + '%', top: y + '%', transform: 'translate(-50%, -50%)'}
}

const getLabelStyle = (teamIndex, count) => {
  const playersPerTeam = 2
  const startSlot = teamIndex * playersPerTeam
  const midSlot = startSlot + (playersPerTeam - 1) / 2
  const total = count * playersPerTeam
  const angle = (360 / total) * midSlot - 90
  const rad = (angle * Math.PI) / 180
  const r = 51
  const x = 50 + r * Math.cos(rad)
  const y = 50 + r * Math.sin(rad)
  return {left: x + '%', top: y + '%', transform: 'translate(-50%, -50%)'}
}

const openEdit = (teamIndex, playerIndex) => {
  editingPlayer.teamIndex = teamIndex
  editingPlayer.playerIndex = playerIndex
  editingName.value = teams[teamIndex].players[playerIndex]
  showSheet.value = true
  setTimeout(() => document.getElementById('player-input')?.focus(), 120)
}

const savePlayerName = () => {
  if (editingPlayer.teamIndex !== null) {
    teams[editingPlayer.teamIndex].players[editingPlayer.playerIndex] = editingName.value.trim()
  }
  showSheet.value = false
}

const goToSettings = () => {

  for (const team of teams.slice(0, teamCount.value)) {
    const valid = team.players.filter(p => p.trim() !== '')
    if (valid.length !== 2) {
      errorMessage.value = t('errors.TEAM_NEEDS_TWO_PLAYER', {n: team.name})
      return
    }
  }

  errorMessage.value = ''

  router.push({
    name: 'create-game',
    state: {teams: JSON.parse(JSON.stringify(teams.slice(0, teamCount.value))), teamCount: teamCount.value}
  })
}
</script>

<template>
  <div class="screen" @click.self="showSheet && (showSheet = false)">
    <div class="bg-layer"></div>
    <div class="bg-overlay"></div>

    <header class="page-header">
      <div class="page-icon">👑</div>
      <h1 class="page-title">{{ t('setup.start') }}</h1>
      <p class="page-subtitle">{{ t('setup.start_desc') }}</p>
    </header>

    <div class="team-count-selector">
      <span class="selector-label">{{ t('setup.select_team_count') }}</span>
      <div class="pill-group">
        <button
            v-for="n in [2, 3]" :key="n"
            class="pill-btn" :class="{ active: teamCount === n }"
            @click="teamCount = n"
        >{{ n }} {{ t('common.teams') }}
        </button>
      </div>
    </div>

    <div class="arena-wrap">
      <div class="arena-ring">
        <div class="arena-center"><span>⚔️</span></div>

        <div
            v-for="(slot, i) in activePlayers"
            :key="`${slot.teamIndex}-${slot.playerIndex}`"
            class="player-slot"
            :style="{
            ...getSlotStyle(i, totalSlots),
            '--team-color': TEAM_COLORS[slot.teamIndex].hex,
            '--team-glow':  TEAM_COLORS[slot.teamIndex].glow,
          }"
            @click="openEdit(slot.teamIndex, slot.playerIndex)"
        >
          <div class="avatar-ring">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span class="slot-number">{{ slot.playerIndex + 1 }}</span>
          </div>
          <span class="player-name">
            {{ teams[slot.teamIndex].players[slot.playerIndex] || t('setup.player_name') }}
          </span>
          <button class="edit-btn" :aria-label="t('common.edit')"
                  @click.stop="openEdit(slot.teamIndex, slot.playerIndex)">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        <div
            v-for="ti in teamCount" :key="'label-' + ti"
            class="team-label"
            :style="{
            '--team-color': TEAM_COLORS[ti - 1].hex,
            '--team-glow':  TEAM_COLORS[ti - 1].glow,
            ...getLabelStyle(ti - 1, teamCount)
          }"
        >
        </div>
      </div>
    </div>

    <div>

    </div>
    <div class="footer-action">
      <Transition name="fade-err">
        <p v-if="errorMessage" class="error-msg" role="alert">{{ errorMessage }}</p>
      </Transition>
      <button class="btn-continue" @click="goToSettings">
        ادامه <span class="btn-arrow">›</span>
      </button>
    </div>

    <Transition name="sheet">
      <div v-if="showSheet" class="sheet-backdrop" @click.self="showSheet = false">
        <div class="bottom-sheet" role="dialog" aria-modal="true">
          <div class="sheet-handle"></div>
          <h3 class="sheet-title">
            {{ t('setup.player_name') }}
            <span
                v-if="editingPlayer.teamIndex !== null"
                class="sheet-team-badge"
                :style="{ background: TEAM_COLORS[editingPlayer.teamIndex].hex }"
            >{{ TEAM_COLORS[editingPlayer.teamIndex].label }}</span>
          </h3>
          <input
              id="player-input"
              v-model="editingName"
              type="text"
              class="sheet-input"
              :placeholder="t('setup.player_name_desc')"
              @keyup.enter="savePlayerName"
              autocomplete="off"
          />
          <button class="sheet-save-btn" @click="savePlayerName">{{ t('common.save')}}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>
