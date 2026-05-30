import {createRouter, createWebHistory} from 'vue-router'
import {useGameStore} from '../stores/gameStore'

import HomeView from '../views/HomeView.vue'
import CreateGameView from '../views/CreateGameView.vue'
import PlayView from '../views/PlayView.vue'
import SetupView from '../views/SetupView.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL), routes: [{
        path: '/', name: 'home', component: HomeView
    }, {
        path: '/setup', name: 'setup', component: SetupView
    }, {
        path: '/create', name: 'create-game', component: CreateGameView
    }, {
        path: '/play', name: 'play-game', component: PlayView, beforeEnter: (to, from, next) => {
            const store = useGameStore()
            if (store.hasActiveGame()) {
                next()
            } else {
                next({name: 'home'})
            }
        }
    }]
})

export default router