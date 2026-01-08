import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
    registerSW({
        immediate: true,
        onNeedRefresh() {
            console.log('PWA: New content available, auto-updating...');
        },
        onOfflineReady() {
            console.log('PWA: Ready for offline use.');
        },
        onRegisterError(error) {
            console.error('PWA: SW registration error', error);
        }
    });
}
