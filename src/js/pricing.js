/* =========================================
   Pricing Page Logic
   ========================================= */

export class PricingManager {
    constructor() {
        this.init();
    }

    init() {
        // 1. Handle "Coming Soon" Button Clicks
        const pricingButtons = document.querySelectorAll('.btn-pricing.coming-soon');

        pricingButtons.forEach(btn => {
            // Check if this is the Pro Tier (usually the second card or identified by content)
            const card = btn.closest('.pricing-card');
            const tierName = card ? card.querySelector('.tier-name').textContent.trim() : '';

            if (tierName.includes('Pro') || tierName.includes('Team')) { // Adjust based on actual text
                // Convert to Link
                const link = document.createElement('a');
                link.href = 'https://forms.gle/RJ9r4UyEw2eNdRYb9';
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'btn-pricing';
                link.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                    Vote for Features`;

                btn.replaceWith(link);
                return; // Skip adding event listener
            }

            btn.addEventListener('click', (e) => {
                e.preventDefault();

                // Get tier name for context
                const card = btn.closest('.pricing-card');
                const tierName = card ? card.querySelector('.tier-name').textContent.trim() : 'Premium Tier';

                // Show toast notification
                if (typeof window.showToast === 'function') {
                    window.showToast('Coming Soon!', `You've been added to the notify list for the ${tierName}.`, 'success', 4000);
                }

                // Analytics
                if (window.gaTracker) {
                    window.gaTracker.trackEvent('pricing_notify_click', { tier: tierName });
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

        // 2. Handle Pricing Toggle (Monthly vs Yearly)
        const pricingToggle = document.getElementById('pricing-toggle');
        const priceAmounts = document.querySelectorAll('.price-amount');
        const monthlyLabel = document.getElementById('monthly-label');
        const yearlyLabel = document.getElementById('yearly-label');

        if (pricingToggle) {
            pricingToggle.addEventListener('change', () => {
                const isYearly = pricingToggle.checked;

                // Update Labels
                if (isYearly) {
                    monthlyLabel.classList.remove('active');
                    yearlyLabel.classList.add('active');
                } else {
                    monthlyLabel.classList.add('active');
                    yearlyLabel.classList.remove('active');
                }

                // Update Prices
                priceAmounts.forEach(price => {
                    const newPrice = isYearly ? price.dataset.yearly : price.dataset.monthly;

                    // Simple animation for price change
                    price.style.opacity = '0';
                    price.style.transform = 'translateY(-10px)';

                    setTimeout(() => {
                        price.textContent = newPrice;
                        price.style.opacity = '1';
                        price.style.transform = 'translateY(0)';
                    }, 200);
                });

                // Analytics
                if (window.gaTracker) {
                    window.gaTracker.trackEvent('pricing_toggle_click', { plan_type: isYearly ? 'yearly' : 'monthly' });
                }
            });
        }

        // 3. Pricing Navigation Handler (if linked from header)
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
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    new PricingManager();
});
