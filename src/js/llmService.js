/*
 * LLM Service - BYOK Integration for OpenAI, Anthropic, and Gemini
 * Local-first PWA implementation with secure key management
 */

export class LLMService {
    constructor() {
        this.STORAGE_KEY = 'llm_vault';
        this.providers = {
            openai: {
                name: 'OpenAI',
                models: [
                    { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro (Recommended)', maxTokens: 4096 },
                    { id: 'o4-mini', name: 'o4-mini', maxTokens: 4096 },
                    { id: 'gpt-4.1-mini', name: 'GPT-4.1 mini', maxTokens: 4096 },
                    { id: 'gpt-4.5', name: 'GPT-4.5', maxTokens: 4096 }
                ],
                endpoint: 'https://api.openai.com/v1/chat/completions',
                validateEndpoint: 'https://api.openai.com/v1/models'
            },
            anthropic: {
                name: 'Anthropic',
                models: [
                    { id: 'claude-opus-4.5', name: 'Claude Opus 4.5 (Recommended)', maxTokens: 4096 },
                    { id: 'claude-sonnet-4.5', name: 'Claude Sonnet 4.5', maxTokens: 4096 },
                    { id: 'claude-opus-4.1', name: 'Claude Opus 4.1', maxTokens: 4096 },
                    { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', maxTokens: 4096 }
                ],
                endpoint: 'https://api.anthropic.com/v1/messages'
            },
            gemini: {
                name: 'Gemini',
                models: [
                    { id: 'gemini-3-pro', name: 'Gemini 3 Pro (Recommended)', maxTokens: 8192 },
                    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', maxTokens: 8192 },
                    { id: 'gemini-3-flash', name: 'Gemini 3 Flash', maxTokens: 8192 },
                    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite', maxTokens: 8192 }
                ],
                endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
            }
        };
        this.activeProvider = null;
        this.config = {};
    }

    /**
     * Initialize service and load saved configuration
     */
    async init() {
        await this.loadConfig();
    }

    /**
     * Load encrypted configuration from localStorage
     */
    async loadConfig() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const deviceKey = await CryptoUtils.getDeviceFingerprint();
                const decrypted = await CryptoUtils.decrypt(stored, deviceKey);
                this.config = JSON.parse(decrypted);
            }
        } catch (e) {
            console.warn('LLMService: Could not load config, starting fresh.', e.message);
            this.config = {};
        }
    }

    /**
     * Save configuration to localStorage (encrypted)
     */
    async saveConfig() {
        try {
            const deviceKey = await CryptoUtils.getDeviceFingerprint();
            const encrypted = await CryptoUtils.encrypt(JSON.stringify(this.config), deviceKey);
            localStorage.setItem(this.STORAGE_KEY, encrypted);
        } catch (e) {
            console.error('LLMService: Failed to save config.', e);
        }
    }

    /**
     * Store an API key for a provider
     * @param {string} providerId - 'openai', 'anthropic', or 'gemini'
     * @param {string} apiKey - The API key to store
     * @param {string} modelId - Default model for this provider
     */
    async setProviderKey(providerId, apiKey, modelId) {
        if (!this.providers[providerId]) {
            throw new Error(`Unknown provider: ${providerId}`);
        }

        this.config[providerId] = {
            key: apiKey,
            model: modelId || this.providers[providerId].models[0].id,
            lastUsed: null,
            requestCount: 0
        };

        await this.saveConfig();
    }

    /**
     * Get stored API key for a provider
     * @param {string} providerId 
     * @returns {string|null}
     */
    getProviderKey(providerId) {
        return this.config[providerId]?.key || null;
    }

    /**
     * Remove a provider's configuration
     * @param {string} providerId 
     */
    async removeProvider(providerId) {
        delete this.config[providerId];
        await this.saveConfig();
    }

    /**
     * Get all configured providers
     * @returns {string[]} Array of configured provider IDs
     */
    getConfiguredProviders() {
        return Object.keys(this.config).filter(id => this.config[id]?.key);
    }

    /**
     * Validate an API key by making a test request
     * @param {string} providerId 
     * @param {string} apiKey 
     * @returns {Promise<{valid: boolean, message: string}>}
     */
    async validateKey(providerId, apiKey) {
        try {
            switch (providerId) {
                case 'openai':
                    return await this._validateOpenAI(apiKey);
                case 'anthropic':
                    return await this._validateAnthropic(apiKey);
                case 'gemini':
                    return await this._validateGemini(apiKey);
                default:
                    return { valid: false, message: 'Unknown provider' };
            }
        } catch (e) {
            return { valid: false, message: e.message };
        }
    }

    async _validateOpenAI(apiKey) {
        const response = await fetch(this.providers.openai.validateEndpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (response.ok) {
            return { valid: true, message: 'API key is valid!' };
        }
        const error = await response.json();
        return { valid: false, message: error.error?.message || 'Invalid API key' };
    }

    async _validateAnthropic(apiKey) {
        // Anthropic doesn't have a dedicated validate endpoint, so we'll do a minimal call
        const response = await fetch(this.providers.anthropic.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: 'claude-3-5-haiku-20241022',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }]
            })
        });
        if (response.ok) {
            return { valid: true, message: 'API key is valid!' };
        }
        const error = await response.json();
        return { valid: false, message: error.error?.message || 'Invalid API key' };
    }

    async _validateGemini(apiKey) {
        const url = `${this.providers.gemini.endpoint}?key=${apiKey}`;
        const response = await fetch(url);
        if (response.ok) {
            return { valid: true, message: 'API key is valid!' };
        }
        const error = await response.json();
        return { valid: false, message: error.error?.message || 'Invalid API key' };
    }

    /**
     * Generate enhanced prompt using selected LLM provider
     * @param {string} providerId - Provider to use
     * @param {object} sceneData - Scene data from the generator
     * @param {object} options - Generation options (temperature, etc.)
     * @returns {Promise<string>} - Enhanced prompt text
     */
    async generatePrompt(providerId, sceneData, options = {}) {
        const providerConfig = this.config[providerId];
        if (!providerConfig?.key) {
            throw new Error(`No API key configured for ${providerId}`);
        }

        // Model-aware system prompt
        const systemPrompt = this._buildSystemPrompt(options.modelProfile || null);
        const userPrompt = this._buildUserPrompt(sceneData);

        let result;
        switch (providerId) {
            case 'openai':
                result = await this._callOpenAI(providerConfig.key, providerConfig.model, systemPrompt, userPrompt, options);
                break;
            case 'anthropic':
                result = await this._callAnthropic(providerConfig.key, providerConfig.model, systemPrompt, userPrompt, options);
                break;
            case 'gemini':
                result = await this._callGemini(providerConfig.key, providerConfig.model, systemPrompt, userPrompt, options);
                break;
            default:
                throw new Error('Unknown provider');
        }

        // Update usage stats
        providerConfig.lastUsed = new Date().toISOString();
        providerConfig.requestCount = (providerConfig.requestCount || 0) + 1;
        await this.saveConfig();

        return this._cleanResponse(result);
    }

    /**
     * Clean LLM responses from common unprofessional prefixes and formatting
     * @param {string} text - Raw LLM output
     * @returns {string} - Cleaned text
     */
    _cleanResponse(text) {
        if (!text) return '';

        return text
            // Remove common prefixes (case insensitive)
            .replace(/^(Prompt|Enhanced Prompt|Result|Response|Scene \d+|Output|Description):?\s*/i, '')
            // Remove wrapping quotes if they exist
            .replace(/^["'](.*)["']$/s, '$1')
            // Trim whitespace
            .trim();
    }

    /**
     * Generate enhanced JSON output for all scenes
     * @param {string} providerId 
     * @param {Array} scenes 
     * @param {object} options 
     */
    async generateFullJson(providerId, scenes, options = {}) {
        const providerConfig = this.config[providerId];
        if (!providerConfig?.key) {
            throw new Error(`No API key configured for ${providerId}`);
        }

        const systemPrompt = `You are a specialized AI for generating professional VEO video prompts in strict JSON format.
        
Your task is to take the user's rough scene inputs and transform them into a polished, cinematic JSON output.
Follow these rules strictly:
1. Output MUST be a valid JSON array of objects.
2. Each object must follow this schema:
   {
     "description": "Enhanced, detailed cinematic description",
     "camera": "Camera angle/movement (keep original if good, or enhance)",
     "lighting": "Lighting style (keep original if good, or enhance)",
     "negative_prompt": "Negative constraints"
   }
3. Enhance the 'description' field to be vivid, detailed, and use professional filmmaking terminology.
4. Keep the 'negative_prompt' robust but concise.
5. Do NOT add any markdown formatting (like \`\`\`json). Output raw JSON string only.
6. Maintain the exact number of scenes as the input.
7. Output ONLY the raw JSON content without any conversational filler or "Prompt" labels.`;

        const userPrompt = `Here is the raw scene data to enhance and format as JSON:\n${JSON.stringify(scenes, null, 2)}`;

        let result;
        switch (providerId) {
            case 'openai':
                result = await this._callOpenAI(providerConfig.key, providerConfig.model, systemPrompt, userPrompt, options);
                break;
            case 'anthropic':
                result = await this._callAnthropic(providerConfig.key, providerConfig.model, systemPrompt, userPrompt, options);
                break;
            case 'gemini':
                result = await this._callGemini(providerConfig.key, providerConfig.model, systemPrompt, userPrompt, options);
                break;
            default:
                throw new Error('Unknown provider');
        }

        // Update usage stats
        providerConfig.lastUsed = new Date().toISOString();
        providerConfig.requestCount = (providerConfig.requestCount || 0) + 1;
        await this.saveConfig();

        // Basic cleaning of potential markdown code blocks
        return result.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    }

    _buildSystemPrompt(modelProfile = null) {
        let prompt = `You are PromptForge AI, an expert cinematic video prompt engineer. Your role is to enhance user scene descriptions into highly detailed, professional video generation prompts.

Guidelines:
- Incorporate specific cinematic techniques (camera angles, movements, lighting styles)
- Use vivid, evocative language that AI video models understand
- Maintain the user's creative intent while adding professional depth
- Keep responses focused and concise (max 200 words per scene)
- Output ONLY the refined descriptive text.
- DO NOT include labels like "Prompt:", "Enhanced:", or "Scene:".
- DO NOT include any introductory or concluding remarks.`;

        // Model-Aware Constraints
        if (modelProfile) {
            prompt += `\n\n**Target Model: ${modelProfile.name}**\n`;
            prompt += `- ${modelProfile.description}\n`;
            if (!modelProfile.supportsCameraControls) {
                prompt += `- This model does NOT support advanced camera controls. Avoid describing specific camera movements like "tracking shot" or "crane shot".\n`;
            }
            if (!modelProfile.supportsNegativePrompt) {
                prompt += `- This model does NOT support negative prompts. If the user mentions things to avoid, try to express constraints positively or rephrase.\n`;
            }
            prompt += `- Allowed Frame Rates: ${modelProfile.allowedFrameRates.join(', ')} fps.\n`;
            prompt += `- Max Resolution: ${modelProfile.maxResolution}.\n`;
        }

        return prompt;
    }

    _buildUserPrompt(sceneData) {
        let prompt = `Enhance this scene description for AI video generation:\n\n`;
        prompt += `Description: ${sceneData.description || 'A cinematic scene'}\n`;

        if (sceneData.camera) {
            prompt += `Camera: ${sceneData.camera}\n`;
        }
        if (sceneData.lighting) {
            prompt += `Lighting: ${sceneData.lighting}\n`;
        }
        if (sceneData.negative_prompt) {
            prompt += `Avoid: ${sceneData.negative_prompt}\n`;
        }

        return prompt;
    }

    async _callOpenAI(apiKey, model, systemPrompt, userPrompt, options) {
        const response = await fetch(this.providers.openai.endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 500
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'OpenAI API error');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async _callAnthropic(apiKey, model, systemPrompt, userPrompt, options) {
        const response = await fetch(this.providers.anthropic.endpoint, {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerous-direct-browser-access': 'true'
            },
            body: JSON.stringify({
                model: model,
                max_tokens: options.maxTokens || 500,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Anthropic API error');
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async _callGemini(apiKey, model, systemPrompt, userPrompt, options) {
        const url = `${this.providers.gemini.endpoint}/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    { role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
                ],
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 500
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Gemini API error');
        }

        const data = await response.json();

        // Robust check for Gemini response structure
        if (!data.candidates || data.candidates.length === 0) {
            // Handle block reasons (safety/quota/finish reasons)
            const finishReason = data.promptFeedback?.blockReason || 'UNKNOWN_REASON';
            throw new Error(`Gemini blocked the request: ${finishReason}. Please try a slightly different prompt.`);
        }

        const candidate = data.candidates[0];

        // Check if content exists (could be blocked by safety filters)
        if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
            const safetyReason = candidate.finishReason || 'SAFETY/FILTERING';
            throw new Error(`Gemini response generation failed: ${safetyReason}. The content may have been flagged by safety filters.`);
        }

        return candidate.content.parts[0].text;
    }

    /**
     * Get usage statistics for all providers
     * @returns {object} Usage stats per provider
     */
    getUsageStats() {
        const stats = {};
        for (const [id, config] of Object.entries(this.config)) {
            if (config?.key) {
                stats[id] = {
                    lastUsed: config.lastUsed,
                    requestCount: config.requestCount || 0,
                    model: config.model
                };
            }
        }
        return stats;
    }
}


