export class GettingStarted {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.modal = document.getElementById('getting-started-modal');
        this.closeBtn = document.getElementById('getting-started-close-btn');
        this.nextBtn = document.getElementById('getting-started-next');
        this.prevBtn = document.getElementById('getting-started-prev');
        this.checkbox = document.getElementById('dont-show-again');

        if (this.modal) {
            this.init();
        }
    }

    init() {
        // Check if user has seen the modal before
        const hasSeen = localStorage.getItem('hasSeenGettingStarted');
        if (!hasSeen) {
            setTimeout(() => this.show(), 1000);
        }

        this.bindEvents();

        // Expose global for external triggers (Help links)
        window.showGettingStarted = () => this.show();
    }

    show() {
        this.modal.classList.remove('hidden');
        this.currentStep = 1;
        this.updateStep();
    }

    hide() {
        this.modal.classList.add('hidden');
        if (this.checkbox.checked) {
            localStorage.setItem('hasSeenGettingStarted', 'true');
        }
    }

    updateStep() {
        // Hide all steps
        document.querySelectorAll('.getting-started-step').forEach(step => {
            step.classList.add('hidden');
        });

        // Show current step
        const activeStep = document.querySelector(`.getting-started-step[data-step="${this.currentStep}"]`);
        if (activeStep) activeStep.classList.remove('hidden');

        // Update progress dots
        document.querySelectorAll('.progress-dot').forEach(dot => {
            const dotStep = parseInt(dot.dataset.dot);
            dot.classList.toggle('active', dotStep === this.currentStep);
        });

        // Update buttons
        this.prevBtn.style.display = this.currentStep === 1 ? 'none' : 'inline-flex';
        this.nextBtn.textContent = this.currentStep === this.totalSteps ? 'Get Started' : 'Next';
    }

    next() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateStep();
        } else {
            this.hide();
        }
    }

    prev() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateStep();
        }
    }

    bindEvents() {
        this.closeBtn.addEventListener('click', () => this.hide());
        this.nextBtn.addEventListener('click', () => this.next());
        this.prevBtn.addEventListener('click', () => this.prev());

        document.querySelectorAll('.progress-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                this.currentStep = parseInt(dot.dataset.dot);
                this.updateStep();
            });
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }
}
