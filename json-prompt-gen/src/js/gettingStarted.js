// Getting Started Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const gettingStartedModal = document.getElementById('getting-started-modal');
    const gettingStartedCloseBtn = document.getElementById('getting-started-close-btn');
    const gettingStartedNextBtn = document.getElementById('getting-started-next');
    const gettingStartedPrevBtn = document.getElementById('getting-started-prev');
    const dontShowAgainCheckbox = document.getElementById('dont-show-again');

    let currentStep = 1;
    const totalSteps = 4;

    // Check if user has seen the modal before
    const hasSeenGettingStarted = localStorage.getItem('hasSeenGettingStarted');

    if (!hasSeenGettingStarted) {
        // Show modal after a brief delay for first-time users
        setTimeout(() => {
            showGettingStartedModal();
        }, 1000);
    }

    function showGettingStartedModal() {
        gettingStartedModal.classList.remove('hidden');
        currentStep = 1;
        updateStep();
    }

    function hideGettingStartedModal() {
        gettingStartedModal.classList.add('hidden');
        if (dontShowAgainCheckbox.checked) {
            localStorage.setItem('hasSeenGettingStarted', 'true');
        }
    }

    function updateStep() {
        // Hide all steps
        document.querySelectorAll('.getting-started-step').forEach(step => {
            step.classList.add('hidden');
        });

        // Show current step
        const activeStep = document.querySelector(`.getting-started-step[data-step="${currentStep}"]`);
        if (activeStep) {
            activeStep.classList.remove('hidden');
        }

        // Update progress dots
        document.querySelectorAll('.progress-dot').forEach(dot => {
            const dotStep = parseInt(dot.dataset.dot);
            if (dotStep === currentStep) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update button visibility
        if (currentStep === 1) {
            gettingStartedPrevBtn.style.display = 'none';
        } else {
            gettingStartedPrevBtn.style.display = 'inline-flex';
        }

        if (currentStep === totalSteps) {
            gettingStartedNextBtn.textContent = 'Get Started!';
        } else {
            gettingStartedNextBtn.textContent = 'Next →';
        }
    }

    function nextStep() {
        if (currentStep < totalSteps) {
            currentStep++;
            updateStep();
        } else {
            hideGettingStartedModal();
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
            updateStep();
        }
    }

    // Event Listeners
    gettingStartedCloseBtn.addEventListener('click', hideGettingStartedModal);
    gettingStartedNextBtn.addEventListener('click', nextStep);
    gettingStartedPrevBtn.addEventListener('click', prevStep);

    // Click on progress dots to jump to step
    document.querySelectorAll('.progress-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            currentStep = parseInt(dot.dataset.dot);
            updateStep();
        });
    });

    // Close modal when clicking outside
    gettingStartedModal.addEventListener('click', (e) => {
        if (e.target === gettingStartedModal) {
            hideGettingStartedModal();
        }
    });

    // Expose function globally so it can be triggered from help/documentation links
    window.showGettingStarted = showGettingStartedModal;
});
