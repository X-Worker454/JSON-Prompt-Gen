class FeedbackService {
    constructor(analyticsService) {
        this.analytics = analyticsService;
    }

    async submitFeedback(type, message, screenshot = null) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app, this would POST to an API
        // Submitting feedback

        // Log to analytics
        if (this.analytics) {
            this.analytics.trackEvent('feedback_submitted', {
                type: type,
                length: message.length,
                has_screenshot: !!screenshot
            });
        }

        return { success: true, id: 'fb_' + Date.now() };
    }
}
