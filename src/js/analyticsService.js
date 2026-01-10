export class AnalyticsService {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.init();
    }

    init() {
        // Session started
        this.trackEvent('session_start');
    }

    generateSessionId() {
        return 'sess_' + Math.random().toString(36).substr(2, 9);
    }

    trackEvent(eventName, data = {}) {
        const event = {
            id: this.generateEventId(),
            name: eventName,
            timestamp: new Date().toISOString(),
            data: data,
            sessionId: this.sessionId
        };

        this.events.push(event);

        // Simulating sending to backend
        if (typeof window.gtag === 'function') {
            window.gtag('event', eventName, data);
        }
    }

    generateEventId() {
        return 'evt_' + Math.random().toString(36).substr(2, 9);
    }

    // Example feature usage tracking
    trackGeneration(sceneCount, mode, platform) {
        this.trackEvent('generate_prompt', {
            scene_count: sceneCount,
            mode: mode,
            platform: platform
        });
    }

    trackEnhance(startLength, endLength) {
        this.trackEvent('enhance_scene', {
            char_diff: endLength - startLength
        });
    }

    trackError(type, message) {
        this.trackEvent('error', {
            type: type,
            message: message
        });
    }
}
