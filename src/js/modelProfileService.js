/*
 * ModelProfileService.js
 * Central database of capabilities and constraints for AI video generation models.
 * Enforces guardrails and provides platform-specific intelligence.
 */
export class ModelProfileService {
    constructor() {
        this.profiles = {
            veo: {
                id: 'veo',
                name: 'Google Veo',
                maxResolution: '1080p', // Veo current public limit hypothesis
                allowedResolutions: ['1080p'],
                allowedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '21:9'],
                allowedFrameRates: ['24', '30'],
                supportsNegativePrompt: true,
                supportsCameraControls: true,
                maxPromptLength: 500, // words
                description: "Google's high-fidelity video generation model aimed at cinematic realism."
            },
            sora: {
                id: 'sora',
                name: 'OpenAI Sora',
                maxResolution: '1080p',
                allowedResolutions: ['1080p'],
                allowedAspectRatios: ['16:9', '9:16', '1:1', '4:3', '21:9'],
                allowedFrameRates: ['24', '30', '60'],
                supportsNegativePrompt: false, // Hypothesis: Sora handles this internally via safety system
                supportsCameraControls: true,
                maxPromptLength: 300,
                description: "OpenAI's physics-simulating video model known for complex motion."
            },
            runway: {
                id: 'runway',
                name: 'Runway Gen-3 Alpha',
                maxResolution: '4K', // Gen-3 supports upscaling
                allowedResolutions: ['720p', '1080p', '4K'],
                allowedAspectRatios: ['16:9', '9:16', '21:9'],
                allowedFrameRates: ['24', '30', '60'],
                supportsNegativePrompt: false, // Gen-3 alpha focus is positive prompting
                supportsCameraControls: true, // Advanced camera control features
                maxPromptLength: 500,
                description: "Runway's latest model with advanced temporal consistency and realistic motion."
            },
            luma: {
                id: 'luma',
                name: 'Luma Dream Machine',
                maxResolution: '1080p', // Standard generation
                allowedResolutions: ['1080p'],
                allowedAspectRatios: ['16:9', '9:16', '1:1', '4:3'],
                allowedFrameRates: ['24', '30'],
                supportsNegativePrompt: true,
                supportsCameraControls: true, // Keyframes and endframes
                maxPromptLength: 400,
                description: "Fast, high-quality video model optimized for creative workflows."
            },
            kling: {
                id: 'kling',
                name: 'Kling',
                maxResolution: '1080p',
                allowedResolutions: ['1080p'],
                allowedAspectRatios: ['16:9', '9:16', '1:1'],
                allowedFrameRates: ['30'],
                supportsNegativePrompt: true,
                supportsCameraControls: true,
                maxPromptLength: 600,
                description: "Emerging high-motion model with strong character consistency."
            }
        };
    }

    /**
     * Get the full profile for a specific model ID
     * @param {string} modelId 
     * @returns {object|null}
     */
    getProfile(modelId) {
        return this.profiles[modelId] || null;
    }

    /**
     * Get a specific capability for a model
     * @param {string} modelId 
     * @param {string} capabilityKey - e.g. 'supportsNegativePrompt'
     * @returns {any}
     */
    getCapability(modelId, capabilityKey) {
        const profile = this.profiles[modelId];
        return profile ? profile[capabilityKey] : null;
    }

    /**
     * Validate a set of parameters against a model's constraints
     * @param {string} modelId 
     * @param {object} params - { resolution, aspectRatio, frameRate }
     * @returns {object} - { valid: boolean, violations: [] }
     */
    validateParams(modelId, params) {
        const profile = this.profiles[modelId];
        if (!profile) return { valid: true, violations: [] }; // Unknown model, assume valid

        const violations = [];

        if (params.resolution && !profile.allowedResolutions.includes(params.resolution)) {
            violations.push({
                param: 'resolution',
                message: `Resolution '${params.resolution}' is not supported by ${profile.name}. Supported: ${profile.allowedResolutions.join(', ')}`,
                suggested: profile.allowedResolutions[0] // Suggest first valid
            });
        }

        if (params.aspectRatio && !profile.allowedAspectRatios.includes(params.aspectRatio)) {
            violations.push({
                param: 'aspect_ratio',
                message: `Aspect Ratio '${params.aspectRatio}' is not supported by ${profile.name}. Supported: ${profile.allowedAspectRatios.join(', ')}`,
                suggested: profile.allowedAspectRatios[0]
            });
        }

        if (params.frameRate && !profile.allowedFrameRates.includes(String(params.frameRate))) {
            violations.push({
                param: 'frame_rate',
                message: `Frame Rate '${params.frameRate}' is not supported by ${profile.name}. Supported: ${profile.allowedFrameRates.join(', ')}`,
                suggested: profile.allowedFrameRates[0]
            });
        }

        return {
            valid: violations.length === 0,
            violations
        };
    }

    /**
     * Check if a specific feature is supported (boolean)
     */
    supports(modelId, feature) {
        const profile = this.profiles[modelId];
        if (!profile) return true; // Fail open
        return !!profile[feature];
    }

    /**
     * Safety Layer: Validate content against basic prohibited terms
     * @param {string} text 
     * @returns {object} { safe: boolean, flagged: [] }
     */
    validateContent(text) {
        if (!text) return { safe: true, flagged: [] };

        // Basic list for demonstration - in production this would be more comprehensive
        const prohibited = ['nsfw', 'naked', 'graphic violence', 'blood', 'hate speech'];
        const flagged = prohibited.filter(term => text.toLowerCase().includes(term));

        return {
            safe: flagged.length === 0,
            flagged
        };
    }

    /**
     * Template Engine: Format final JSON payload based on model requirements
     * @param {string} modelId 
     * @param {object} coreData - { scenes, globalParams, version }
     */
    formatPayload(modelId, coreData) {
        // Here we can restructure the JSON output based on the target model
        // For now, we wrap it in a standard envelope but mark the specific target

        const base = {
            target_model: this.profiles[modelId]?.name || modelId,
            generated_at: new Date().toISOString(),
            ...coreData
        };

        // Example: Sora might expect a different structure (Hypothetical)
        if (modelId === 'sora') {
            return {
                model: "sora-1.0",
                prompts: coreData.scenes.map(s => s.description),
                advanced_params: {
                    ...coreData.global_parameters
                },
                metadata: base
            };
        }

        // Default Structure
        return base;
    }
}


