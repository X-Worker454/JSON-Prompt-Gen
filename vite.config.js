import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: "/JSON-Prompt-Gen/",
    plugins: [
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.png', 'apple-touch-icon.png', 'assets/*.png'],
            manifest: {
                name: 'JSON Prompt Gen',
                short_name: 'JSONGen',
                start_url: './index.html',
                display: 'standalone',
                background_color: '#0F0A1F',
                theme_color: '#2196F3',
                description: 'Generate JSON prompts for AI video generation platforms.',
                icons: [
                    {
                        src: 'assets/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'assets/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    },
                    {
                        src: 'assets/maskable-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                cleanupOutdatedCaches: true,
                clientsClaim: true,
                skipWaiting: true
            },
            devOptions: {
                enabled: true,
                type: 'module'
            }
        })
    ]
});
