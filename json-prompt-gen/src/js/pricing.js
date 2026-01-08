/* =========================================
   Pricing Page Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Pricing Page Interactions
    initPricingInteractions();
});

function initPricingInteractions() {
    // 1. Handle "Coming Soon" Button Clicks
    const pricingButtons = document.querySelectorAll('.btn-pricing.coming-soon');

    pricingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();

            // Get tier name for context
            const card = btn.closest('.pricing-card');
            const tierName = card ? card.querySelector('.tier-name').textContent.trim() : 'Premium Tier';

            // Show toast notification
            if (typeof window.showToast === 'function') {
                window.showToast('Coming Soon!', `You've been added to the notify list for the ${tierName}.`, 'success', 4000);
            }

            // Visual feedback on button
            const originalText = btn.textContent;
            btn.textContent = 'Notified!';
            btn.classList.add('active');

            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('active');
            }, 3000);
        });
    });

    // 2. Pricing Navigation Handler (if linked from header)
    const pricingLinks = document.querySelectorAll('a[href="#pricing-section"]');
    pricingLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.switchSection) {
                window.switchSection('pricing-section');
            } else {
                console.warn('Navigation function not available');
            }
        });
    });
}
