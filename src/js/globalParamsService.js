import { ModelProfileService } from './modelProfileService.js';

/**
 * GlobalParamsService.js
 * Manages project-wide settings that are inherited by all scenes.
 * Handles persistence, updates, and resetting to defaults.
 */
export class GlobalParamsService {
    constructor() {
        this.STORAGE_KEY = 'json_prompt_gen_global_params';
        this.modelService = new ModelProfileService();

        // Default Configuration
        this.defaults = {
            platform_preset: 'veo',
            aspect_ratio: '16:9',
            resolution: '1080p',
            frame_rate: '24'
        };

        this.params = this.loadState();
    }

    /**
     * Load state from localStorage or return defaults
     */
    loadState() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return { ...this.defaults, ...JSON.parse(stored) };
            }
        } catch (e) {
            console.warn('Failed to load global params:', e);
        }
        return { ...this.defaults };
    }

    /**
     * Save current state to localStorage
     */
    saveState() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.params));
        } catch (e) {
            console.warn('Failed to save global params:', e);
        }
    }

    /**
     * Get all current global parameters
     */
    getParams() {
        return { ...this.params };
    }

    /**
     * Update a specific parameter
     * @param {string} key - The parameter key (e.g., 'aspect_ratio')
     * @param {string} value - The new value
     */
    updateParam(key, value) {
        if (this.params.hasOwnProperty(key)) {
            this.params[key] = value;

            // Validate changes against Model Profile
            const currentModelId = this.params.platform_preset;
            const validation = this.modelService.validateParams(currentModelId, this.params);

            if (!validation.valid) {
                // Auto-correct invalid parameters
                validation.violations.forEach(v => {
                    // Auto-correcting param
                    this.params[v.param] = v.suggested;
                });

                // Dispatch event to notify UI of corrections
                window.dispatchEvent(new CustomEvent('global-params-corrected', {
                    detail: { violations: validation.violations }
                }));
            }

            this.saveState();
            return true;
        }
        return false;
    }

    /**
     * Reset all parameters to default values
     */
    resetDefaults() {
        this.params = { ...this.defaults };
        this.saveState();
        return this.params;
    }
}


