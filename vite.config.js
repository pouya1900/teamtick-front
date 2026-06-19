import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import {VitePWA} from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [vue(), tailwindcss(), VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
            name: 'TeamTick Game',
            short_name: 'TeamTick',
            description: 'بهترین بازی تیمی',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
            icons: [{
                src: '/images/icons/icon-192x192.png', sizes: '192x192', type: 'image/png'
            }, {
                src: '/images/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable'
            }]
        }
    })],
})
