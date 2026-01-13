// Core Services
import { CryptoUtils } from './cryptoUtils.js';
import { DictionaryService } from './dictionaryService.js';
import { LLMService } from './llmService.js';
import { HistoryService } from './historyService.js';
import { AnalyticsService } from './analyticsService.js';
import { FeedbackService } from './feedbackService.js';
import { GettingStarted } from './gettingStarted.js';
import { GlobalParamsService } from './globalParamsService.js';
import { PricingManager } from './pricing.js';
import { TemplateService } from './services/templateService.js';
import { TemplateUI } from './templateUI.js';

// Global access for services needed in callbacks
window.CryptoUtils = CryptoUtils;
window.AnalyticsService = AnalyticsService;
// Initialize global services that don't need UI wait
window.historyService = new HistoryService();

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Core UI-dependent Services
    try {
        new GettingStarted();
    } catch (e) {
        console.error('GettingStarted Init Error:', e);
    }

    try {
        new PricingManager();
    } catch (e) {
        console.error('PricingManager Init Error:', e);
    }

    // Initialize Template System
    try {
        const templateService = new TemplateService();
        const templateUI = new TemplateUI(templateService);
        window.templateUI = templateUI;
    } catch (e) {
        console.error('Template System Init Error:', e);
    }

    const scenesContainer = document.getElementById('scenes-container');
    const addSceneBtn = document.getElementById('add-scene-btn');
    const generateBtn = document.getElementById('generate-btn');
    const outputArea = document.getElementById('output-json');

    /* ============================
        Sidebar Menu Logic
       ============================ */
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const sidebarClose = document.getElementById('sidebar-close');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sidebarResetBtn = document.getElementById('sidebar-reset-btn');
    const sidebarExportBtn = document.getElementById('sidebar-export-btn');

    function openSidebar() {
        sidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    hamburgerBtn.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.dataset.section;
            if (sectionId) {
                e.preventDefault();
                switchSection(sectionId);
                closeSidebar();
            }
        });
    });

    if (sidebarResetBtn) {
        sidebarResetBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebar();
            document.getElementById('reset-btn')?.click();
        });
    }

    if (sidebarExportBtn) {
        sidebarExportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeSidebar();
            document.getElementById('download-btn')?.click();
        });
    }


    // Initialize Services
    const analyticsService = new AnalyticsService();
    const feedbackService = new FeedbackService(analyticsService);

    // Initialize History Service early
    const historyService = new HistoryService(); // Ensure HistoryService.js is loaded before app.js in HTML

    /* ============================
        Feedback Logic
       ============================ */
    const feedbackModal = document.getElementById('feedback-modal');
    const feedbackBtn = document.getElementById('sidebar-feedback-btn');
    const feedbackClose = document.getElementById('feedback-close-btn');
    const feedbackCancel = document.getElementById('feedback-cancel-btn');
    const feedbackSubmit = document.getElementById('feedback-submit-btn');
    const feedbackTypeChips = document.querySelectorAll('#feedback-type-chips .chip');
    let feedbackType = 'bug';

    function openFeedback() {
        if (feedbackModal) {
            feedbackModal.classList.remove('hidden');
            analyticsService.trackEvent('feedback_open');
            closeSidebar();
        }
    }

    function closeFeedback() {
        if (feedbackModal) feedbackModal.classList.add('hidden');
    }

    const footerFeedbackBtn = document.getElementById('footer-feedback-btn');

    if (feedbackBtn) feedbackBtn.addEventListener('click', openFeedback);
    if (footerFeedbackBtn) footerFeedbackBtn.addEventListener('click', openFeedback);
    if (feedbackClose) feedbackClose.addEventListener('click', closeFeedback);
    if (feedbackCancel) feedbackCancel.addEventListener('click', closeFeedback);

    feedbackTypeChips.forEach(chip => {
        chip.addEventListener('click', () => {
            feedbackTypeChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            feedbackType = chip.dataset.value;
        });
    });

    if (feedbackSubmit) {
        feedbackSubmit.addEventListener('click', async () => {
            const msg = document.getElementById('feedback-message').value;
            if (!msg.trim()) {
                showToast('Error', 'Please enter a message.', 'error');
                return;
            }

            feedbackSubmit.classList.add('loading');
            try {
                await feedbackService.submitFeedback(feedbackType, msg);
                showToast('Feedback Sent', 'Thank you for your feedback!', 'success');
                document.getElementById('feedback-message').value = '';
                closeFeedback();
            } catch (err) {
                showToast('Error', 'Failed to send feedback.', 'error');
            } finally {
                feedbackSubmit.classList.remove('loading');
            }
        });
    }


    // Initialize Global Parameters Service
    let globalParams;
    try {
        globalParams = new GlobalParamsService();
    } catch (e) {
        console.error('GlobalParamsService Init Error:', e);
        // Fallback mock to prevent crashes in dependent code
        globalParams = {
            getParams: () => ({ platform_preset: 'veo', aspect_ratio: '16:9', resolution: '1080p', frame_rate: '24' }),
            updateParam: () => false,
            resetDefaults: () => ({}),
            modelService: { validateContent: () => ({ safe: true }), validateParams: () => ({ valid: true }) }
        };
    }

    // Global Params Dropdown Configuration
    const globalDropdowns = [
        { key: 'aspect_ratio', wrapperId: 'global-aspect-ratio-dropdown', inputId: 'global-aspect-ratio', displayId: 'global-aspect-ratio-display' },
        { key: 'resolution', wrapperId: 'global-resolution-dropdown', inputId: 'global-resolution', displayId: 'global-resolution-display' },
        { key: 'frame_rate', wrapperId: 'global-frame-rate-dropdown', inputId: 'global-frame-rate', displayId: 'global-frame-rate-display' },
        { key: 'platform_preset', wrapperId: 'global-platform-dropdown', inputId: 'global-platform', displayId: 'global-platform-display' }
    ];

    // Bind Dropdown Events
    globalDropdowns.forEach(conf => {
        const wrapper = document.getElementById(conf.wrapperId);
        if (!wrapper) return;

        const trigger = wrapper.querySelector('.dropdown-trigger');
        const menu = wrapper.querySelector('.dropdown-menu');
        const input = document.getElementById(conf.inputId);
        const display = document.getElementById(conf.displayId);

        // Toggle Dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            // Close other global dropdowns
            globalDropdowns.forEach(other => {
                if (other.wrapperId !== conf.wrapperId) {
                    document.getElementById(other.wrapperId)?.classList.remove('open');
                }
            });
            wrapper.classList.toggle('open');
        });

        // Select Item
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.dropdown-item');
            if (item) {
                const val = item.dataset.value;
                const text = item.textContent;

                // Update UI
                display.textContent = text;
                menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');

                // Update State
                input.value = val;
                globalParams.updateParam(conf.key, val);

                // Update UI Capabilities
                updateModelUI();

                // Close
                wrapper.classList.remove('open');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        globalDropdowns.forEach(conf => {
            document.getElementById(conf.wrapperId)?.classList.remove('open');
        });
    });

    function syncGlobalUI() {
        const params = globalParams.getParams();

        const updateDropdownUI = (conf, val) => {
            const wrapper = document.getElementById(conf.wrapperId);
            const input = document.getElementById(conf.inputId);
            const display = document.getElementById(conf.displayId);

            if (wrapper && input && display) {
                input.value = val;
                const item = wrapper.querySelector(`.dropdown-item[data-value="${val}"]`);
                if (item) {
                    display.textContent = item.textContent;
                    wrapper.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                }
            }
        };

        updateDropdownUI(globalDropdowns[0], params.aspect_ratio);
        updateDropdownUI(globalDropdowns[1], params.resolution);
        updateDropdownUI(globalDropdowns[2], params.frame_rate);
        updateDropdownUI(globalDropdowns[3], params.platform_preset);

        updateModelUI(); // Update UI capabilities based on model
    }

    // Update UI based on Model Capabilities
    function updateModelUI() {
        const params = globalParams.getParams();
        const modelId = params.platform_preset;
        const service = globalParams.modelService;

        // 1. Negative Prompts
        const supportsNeg = service.supports(modelId, 'supportsNegativePrompt');

        // Comprehensive selector to find the Negative Prompt group
        // We look for both the input class and a potential container class for robustness
        document.querySelectorAll('.scene-negative-prompt').forEach(el => {
            const container = el.closest('.form-group');
            if (container) {
                const prevSibling = container.previousElementSibling;
                if (supportsNeg) {
                    container.classList.remove('hidden');
                    // Ensure the previous group has its separator if this one is visible
                    if (prevSibling) prevSibling.classList.remove('no-separator');
                } else {
                    container.classList.add('hidden');
                    // Hide the separator of the group above if this one is hidden to avoid double lines/spacing
                    if (prevSibling) prevSibling.classList.add('no-separator');
                }
            }
        });

        // 2. Camera Controls
        const supportsCam = service.supports(modelId, 'supportsCameraControls');
        document.querySelectorAll('.scene-camera-input').forEach(el => {
            const container = el.closest('.form-group');
            if (container) {
                if (supportsCam) {
                    container.classList.remove('disabled-group');
                    el.disabled = false;
                    container.style.opacity = '1';
                    container.style.pointerEvents = 'auto';
                } else {
                    container.classList.add('disabled-group');
                    el.disabled = true;
                    container.style.opacity = '0.5';
                    container.style.pointerEvents = 'none';
                }
            }
        });
    }

    // Listener for Auto-Corrections
    window.addEventListener('global-params-corrected', (e) => {
        const violations = e.detail.violations;
        // Create a user-friendly message
        const msgList = violations.map(v => `• ${v.message}`).join('<br>');
        showToast('Settings Adjusted', msgList, 'warning', 6000);
        syncGlobalUI();
        updateModelUI();
    });

    // Initial Sync
    syncGlobalUI();

    const resetGlobalBtn = document.getElementById('reset-global-params');
    if (resetGlobalBtn) {
        resetGlobalBtn.addEventListener('click', () => {
            if (confirm('Reset all global parameters to defaults?')) {
                globalParams.resetDefaults();
                syncGlobalUI();
                showToast('Global Parameters Reset', 'All global settings have been restored to defaults.', 'info');
            }
        });
    }

    let sceneCount = 1;

    // Add Scene Function
    addSceneBtn.addEventListener('click', () => {
        sceneCount++;
        const sceneId = sceneCount;

        const sceneHtml = `
            <div class="scene-item" data-scene-id="${sceneId}">
                <div class="scene-header">
                    <h4 class="scene-title" style="margin: 0; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px;">Scene ${sceneId}</h4>
                    <div class="scene-actions">
                        <button class="scene-undo-btn hidden" title="Undo AI Enhancement">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h10a5 5 0 0 1 5 5v2"/><path d="m3 10 6 6"/><path d="m3 10 6-6"/></svg>
                        </button>
                        <button class="scene-redo-btn hidden" title="Redo AI Enhancement">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10H11a5 5 0 0 0-5 5v2"/><path d="m21 10-6 6"/><path d="m21 10-6-6"/></svg>
                        </button>
                        <button class="scene-enhance-btn" title="Enhance with AI">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" class="enhance-stars-icon">
                                <path d="M15.5 5.5 L16.8 10.2 L21.5 11.5 L16.8 12.8 L15.5 17.5 L14.2 12.8 L9.5 11.5 L14.2 10.2 Z" />
                                <path d="M5.5 2.5 L6.2 4.8 L8.5 5.5 L6.2 6.2 L5.5 8.5 L4.8 6.2 L2.5 5.5 L4.8 4.8 Z" />
                                <path d="M6.5 15.5 L7.2 17.8 L9.5 18.5 L7.2 19.2 L6.5 21.5 L5.8 19.2 L3.5 18.5 L5.8 17.8 Z" />
                            </svg>
                        </button>
                        <button class="remove-scene-btn" onclick="removeScene(this)" title="Remove Scene">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                </div>
                <div class="form-group mb-30">
                    <label class="section-label">Scene Description</label>
                    <textarea class="scene-description" placeholder="Describe your scene in detail..." style="min-height: 100px;"></textarea>
                </div>
                <div class="form-group mb-30">
                    <label class="section-label">Camera Angle</label>
                    <div class="input-with-dropdown">
                        <input type="text" class="scene-camera-input" 
                            placeholder="Select angle or type custom..."
                            aria-label="Camera Angle">
                        <div class="input-dropdown-wrapper">
                            <button type="button" class="input-dropdown-trigger" aria-label="Open camera presets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="input-dropdown-menu">
                                <div class="dropdown-item" data-value="pan_left">Pan Left</div>
                                <div class="dropdown-item" data-value="pan_right">Pan Right</div>
                                <div class="dropdown-item" data-value="zoom_in">Zoom In</div>
                                <div class="dropdown-item" data-value="zoom_out">Zoom Out</div>
                                <div class="dropdown-item" data-value="dolly_zoom">Dolly Zoom</div>
                                <div class="dropdown-item" data-value="tracking_shot">Track</div>
                                <div class="dropdown-item" data-value="eye_level">Eye Level</div>
                                <div class="dropdown-item" data-value="low_angle">Low Angle</div>
                                <div class="dropdown-item" data-value="high_angle">High Angle</div>
                                <div class="dropdown-item" data-value="aerial_view">Aerial View</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group mb-30">
                    <label class="section-label">Lighting Style</label>
                    <div class="input-with-dropdown">
                        <input type="text" class="scene-lighting-input" 
                            placeholder="Select lighting or type custom..."
                            aria-label="Lighting Style">
                        <div class="input-dropdown-wrapper">
                            <button type="button" class="input-dropdown-trigger" aria-label="Open lighting presets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="input-dropdown-menu">
                                <div class="dropdown-item" data-value="natural">Natural</div>
                                <div class="dropdown-item" data-value="golden_hour">Golden Hour</div>
                                <div class="dropdown-item" data-value="blue_hour">Blue Hour</div>
                                <div class="dropdown-item" data-value="neon">Neon Cyberpunk</div>
                                <div class="dropdown-item" data-value="studio">Studio</div>
                                <div class="dropdown-item" data-value="dramatic">Dramatic</div>
                                <div class="dropdown-item" data-value="cinematic">Cinematic</div>
                                <div class="dropdown-item" data-value="softbox">Softbox</div>
                                <div class="dropdown-item" data-value="backlit">Backlit</div>
                                <div class="dropdown-item" data-value="rim_light">Rim Light</div>
                            </div>
                        </div>
                    </div>
                <div class="form-group mb-30">
                    <label class="section-label">Color Palettes</label>
                    <div class="input-with-dropdown">
                        <input type="text" class="scene-color-input" placeholder="Select palette or type custom..." aria-label="Color Palette">
                        <div class="input-dropdown-wrapper">
                            <button type="button" class="input-dropdown-trigger" aria-label="Open color presets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <div class="input-dropdown-menu">
                                <div class="dropdown-item" data-value="monochromatic">Monochromatic</div>
                                <div class="dropdown-item" data-value="complementary">Complementary</div>
                                <div class="dropdown-item" data-value="analogous">Analogous</div>
                                <div class="dropdown-item" data-value="teal_orange">Cinematic Teal & Orange</div>
                                <div class="dropdown-item" data-value="cyberpunk">Cyberpunk Glow</div>
                                <div class="dropdown-item" data-value="sepia">Sepia Tone</div>
                                <div class="dropdown-item" data-value="vibrant">High Saturation</div>
                                <div class="dropdown-item" data-value="desaturated">Moody Desaturated</div>
                                <div class="dropdown-item" data-value="pastel">Pastel Tones</div>
                                <div class="dropdown-item" data-value="bw">Classic B&W</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group mb-30">
                    <label class="section-label">Mood Descriptors</label>
                    <div class="input-with-dropdown">
                        <input type="text" class="scene-mood-input" placeholder="Select mood or type custom..." aria-label="Mood Descriptors">
                        <div class="input-dropdown-wrapper">
                            <button type="button" class="input-dropdown-trigger" aria-label="Open mood presets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <div class="input-dropdown-menu">
                                <div class="dropdown-item" data-value="ethereal">Ethereal/Dreamy</div>
                                <div class="dropdown-item" data-value="ominous">Dark/Ominous</div>
                                <div class="dropdown-item" data-value="energetic">High Energy</div>
                                <div class="dropdown-item" data-value="calm">Calm/Peaceful</div>
                                <div class="dropdown-item" data-value="nostalgic">Nostalgic</div>
                                <div class="dropdown-item" data-value="cyberpunk">Cyberpunk/Neon</div>
                                <div class="dropdown-item" data-value="epic">Epic/Cinematic</div>
                                <div class="dropdown-item" data-value="suspenseful">Suspenseful</div>
                                <div class="dropdown-item" data-value="melancholic">Melancholic</div>
                                <div class="dropdown-item" data-value="whimsical">Whimsical</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group mb-30">
                    <label class="section-label">Sound Design</label>
                    <div class="input-with-dropdown">
                        <input type="text" class="scene-sound-input" placeholder="Describe sound or select presets..." aria-label="Sound Design">
                        <div class="input-dropdown-wrapper">
                            <button type="button" class="input-dropdown-trigger" aria-label="Open sound presets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                            </button>
                            <div class="input-dropdown-menu">
                                <div class="dropdown-item" data-value="ambient_wind">Ambient Wind</div>
                                <div class="dropdown-item" data-value="orchestral">Cinematic Orchestral</div>
                                <div class="dropdown-item" data-value="low_hum">Low Hum</div>
                                <div class="dropdown-item" data-value="nature">Nature Sounds</div>
                                <div class="dropdown-item" data-value="urban_traffic">Urban Traffic</div>
                                <div class="dropdown-item" data-value="synthwave">80s Synth</div>
                                <div class="dropdown-item" data-value="industrial">Heavy Industrial</div>
                                <div class="dropdown-item" data-value="silence">Deep Silence</div>
                                <div class="dropdown-item" data-value="asmr">ASMR Rustle</div>
                                <div class="dropdown-item" data-value="glitch">Glitchy Beats</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="section-label">Negative Prompts</label>
                    <div class="input-with-dropdown">
                        <input type="text" class="scene-negative-prompt" 
                            placeholder="Type elements to exclude or select from presets..."
                            aria-label="Custom negative prompts">
                        <div class="input-dropdown-wrapper">
                            <button type="button" class="input-dropdown-trigger" aria-label="Open presets">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="input-dropdown-menu">
                                <div class="dropdown-item" data-value="blurry">Blurry</div>
                                <div class="dropdown-item" data-value="low_res">Low Res</div>
                                <div class="dropdown-item" data-value="deformed">Deformed</div>
                                <div class="dropdown-item" data-value="watermark">Watermark</div>
                                <div class="dropdown-item" data-value="flicker">Flicker</div>
                                <div class="dropdown-item" data-value="grainy">Grainy</div>
                                <div class="dropdown-item" data-value="overexposed">Overexposed</div>
                                <div class="dropdown-item" data-value="extra_limbs">Extra Limbs</div>
                                <div class="dropdown-item" data-value="distorted">Distorted</div>
                                <div class="dropdown-item" data-value="unrealistic">Unrealistic</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        scenesContainer.insertAdjacentHTML('beforeend', sceneHtml);

        // Ensure the new scene respects model capabilities
        updateModelUI();
    });

    // Event Delegation for Pills & Dropdowns
    scenesContainer.addEventListener('click', (e) => {
        // --- Dropdown Toggle --- //
        const dropdownTrigger = e.target.closest('.input-dropdown-trigger');
        if (dropdownTrigger) {
            e.stopPropagation();
            const wrapper = dropdownTrigger.closest('.input-dropdown-wrapper');

            // Close all other dropdowns first
            document.querySelectorAll('.input-dropdown-wrapper.open').forEach(openWrapper => {
                if (openWrapper !== wrapper) openWrapper.classList.remove('open');
            });

            wrapper.classList.toggle('open');
        }

        // --- Negative Prompt Dropdown Item Selection ---
        const dropdownItem = e.target.closest('.input-dropdown-menu .dropdown-item');
        if (dropdownItem) {
            e.stopPropagation();
            const wrapper = dropdownItem.closest('.input-dropdown-wrapper');
            const input = wrapper.closest('.input-with-dropdown').querySelector('input');
            const value = dropdownItem.textContent.trim();

            let currentVal = input.value.trim();
            if (currentVal) {
                // Check if already contains the value
                const items = currentVal.split(',').map(i => i.trim().toLowerCase());
                if (!items.includes(value.toLowerCase())) {
                    input.value = `${currentVal}, ${value}`;
                }
            } else {
                input.value = value;
            }

            wrapper.classList.remove('open');
            input.focus();
        }
    });

    // Close all input dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.input-dropdown-wrapper.open').forEach(wrapper => {
            wrapper.classList.remove('open');
        });
    });

    // Remove Scene Function (Global wrapper)
    window.removeScene = function (btn) {
        const sceneItem = btn.closest('.scene-item');
        if (sceneItem) {
            sceneItem.remove();
            updateSceneNumbers();
        }
    };

    function updateSceneNumbers() {
        const scenes = scenesContainer.querySelectorAll('.scene-item');
        scenes.forEach((scene, index) => {
            const title = scene.querySelector('h4');
            if (title) {
                title.textContent = `Scene ${index + 1}`;
            }
        });
        sceneCount = scenes.length;
    }

    // Reset Generator Function
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset the generator? All current work will be lost.')) {
                // 1. Clear first scene
                const firstScene = scenesContainer.querySelector('.scene-item[data-scene-id="1"]');
                if (firstScene) {
                    firstScene.querySelector('.scene-description').value = '';
                    firstScene.querySelector('.scene-negative-prompt').value = '';
                    firstScene.querySelector('.scene-camera-input').value = '';
                    firstScene.querySelector('.scene-lighting-input').value = '';
                    firstScene.querySelector('.scene-color-input').value = '';
                    firstScene.querySelector('.scene-mood-input').value = '';
                    firstScene.querySelector('.scene-sound-input').value = '';
                    // Hide undo/redo if they were visible
                    firstScene.querySelector('.scene-undo-btn')?.classList.add('hidden');
                    firstScene.querySelector('.scene-redo-btn')?.classList.add('hidden');
                }

                // 2. Remove all other scenes
                const otherScenes = scenesContainer.querySelectorAll('.scene-item:not([data-scene-id="1"])');
                otherScenes.forEach(s => s.remove());

                // 3. Reset count
                sceneCount = 1;

                // 4. Reset Output Area
                outputArea.value = JSON.stringify({
                    platform: "veo",
                    prompt: "Waiting for input...",
                    parameters: {
                        aspect_ratio: "16:9",
                        resolution: "1080p"
                    }
                }, null, 2);

                showToast('Generator Reset', 'All scenes and outputs have been cleared.', 'info');
            }
        });
    }

    // Generate JSON logic
    generateBtn.addEventListener('click', async () => {
        // Cinematic Loading Effect
        generateBtn.classList.add('loading');
        await new Promise(r => setTimeout(r, 600)); // Short cinematic delay

        try {
            const scenes = [];
            const sceneElements = scenesContainer.querySelectorAll('.scene-item');

            sceneElements.forEach(sceneEl => {
                const description = sceneEl.querySelector('.scene-description').value;
                // Get values from new input fields
                const camera = sceneEl.querySelector('.scene-camera-input').value.trim();
                const lighting = sceneEl.querySelector('.scene-lighting-input').value.trim();
                const color = sceneEl.querySelector('.scene-color-input').value.trim();
                const mood = sceneEl.querySelector('.scene-mood-input').value.trim();
                const sound = sceneEl.querySelector('.scene-sound-input').value.trim();

                // Get negative prompt from the input field (which handles both manual and presets)
                const finalNegative = sceneEl.querySelector('.scene-negative-prompt').value.trim();

                // Only add if description exists
                if (description.trim()) {
                    scenes.push({
                        description: description.trim(),
                        negative_prompt: finalNegative || null,
                        parameters: {
                            camera: camera || null,
                            lighting: lighting || null,
                            color_palette: color || null,
                            mood: mood || null,
                            sound_design: sound || null
                        }
                    });
                }
            });

            if (scenes.length === 0) {
                showToast('Empty Prompt', 'Please add at least one scene description.', 'warning');
                return;
            }

            // --- Safety Check (Master Mode) ---
            const safetyCheck = globalParams.modelService.validateContent(JSON.stringify(scenes));
            if (!safetyCheck.safe) {
                showToast('Safety Violation', `Content contains prohibited terms: ${safetyCheck.flagged.join(', ')}`, 'error');
                return;
            }

            // --- Dual Mode Logic ---
            const modeInput = document.querySelector('input[name="gen-mode"]:checked');
            const mode = modeInput ? modeInput.value : 'json';

            const currentGlobalParams = globalParams.getParams();

            // Base output structure
            const outputStructure = {
                platform: currentGlobalParams.platform_preset,
                version: "1.0",
                scenes: [],
                global_parameters: {
                    aspect_ratio: currentGlobalParams.aspect_ratio,
                    resolution: currentGlobalParams.resolution,
                    frame_rate: currentGlobalParams.frame_rate
                }
            };

            if (mode === 'ai') {
                // AI Mode
                const configured = llmService.getConfiguredProviders();
                if (configured.length === 0) {
                    showToast('Configuration Required', 'Please configure an AI provider in the integration hub first.', 'warning');
                    return;
                }

                const providerId = configured[0];
                generateBtn.disabled = true;

                try {
                    const jsonStr = await llmService.generateFullJson(providerId, scenes);
                    let enhancedScenes;

                    try {
                        enhancedScenes = JSON.parse(jsonStr);
                    } catch (e) {
                        throw new Error('Failed to parse AI response as valid JSON.');
                    }

                    outputStructure.scenes = enhancedScenes;

                    // Format Payload using Template Engine
                    const finalPayload = globalParams.modelService.formatPayload(currentGlobalParams.platform_preset, outputStructure);
                    outputArea.value = JSON.stringify(finalPayload, null, 2);

                    if (historyService) historyService.save(finalPayload, 'ai');
                    showToast('AI Generation Complete', 'Enhanced JSON prompt generated successfully!', 'success');
                    document.getElementById('output-section').classList.remove('hidden');
                    document.getElementById('output-section').scrollIntoView({ behavior: 'smooth', block: 'start' });

                } catch (e) {
                    console.error('AI Gen Error:', e);
                    showToast('Generation Failed', e.message, 'error');
                } finally {
                    generateBtn.disabled = false;
                }

            } else {
                // JSON Mode (Standard)
                outputStructure.scenes = scenes;

                // Format Payload using Template Engine
                const finalPayload = globalParams.modelService.formatPayload(currentGlobalParams.platform_preset, outputStructure);
                outputArea.value = JSON.stringify(finalPayload, null, 2);

                // Save to History
                if (historyService) historyService.save(finalPayload, 'json');

                showToast('Success', 'JSON generated successfully!', 'success');
                document.getElementById('output-section').classList.remove('hidden');
                document.getElementById('output-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        } catch (error) {
            console.error('Generation Error:', error);
            showToast('Error', 'An unexpected error occurred.', 'error');
        } finally {
            generateBtn.classList.remove('loading');
        }
    });

    // Copy Content
    document.getElementById('copy-btn').addEventListener('click', () => {
        const text = outputArea.value;
        if (!text || text.includes('Waiting for input...')) {
            showToast('No Content', 'Generate a prompt first.', 'warning');
            return;
        }
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied', 'JSON prompt copied to clipboard!', 'success');
        }).catch(err => {
            showToast('Error', 'Failed to copy to clipboard.', 'error');
        });
    });

    // Download Content
    document.getElementById('download-btn').addEventListener('click', () => {
        const text = outputArea.value;
        if (!text || text.includes('Waiting for input...')) {
            showToast('No Content', 'Generate a prompt first.', 'warning');
            return;
        }
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `veo-prompt-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded', 'JSON file downloaded successfully.', 'success');
    });

    /* ============================
        Cinematic Dictionary Logic
       ============================ */
    const dictionaryService = new DictionaryService();
    const dictionarySection = document.getElementById('dictionary-section');
    const generatorSection = document.getElementById('generator-section');
    const outputSection = document.getElementById('output-section');
    const navLinks = document.querySelectorAll('.main-nav a');
    const dictContentArea = document.getElementById('dict-content');
    const dictCategoryList = document.getElementById('dict-category-list');
    const dictSearchInput = document.getElementById('dict-search');
    const dictActiveCategoryTitle = document.getElementById('dict-active-category-title');

    const dictSidebar = document.getElementById('dict-sidebar');
    const dictSidebarOverlay = document.getElementById('dict-sidebar-overlay');
    const dictHamburgerBtn = document.getElementById('dict-hamburger-btn');
    const dictSidebarClose = document.getElementById('dict-sidebar-close');

    function openDictSidebar() {
        dictSidebar?.classList.add('active');
        dictSidebarOverlay?.classList.add('active');
    }

    function closeDictSidebar() {
        dictSidebar?.classList.remove('active');
        dictSidebarOverlay?.classList.remove('active');
    }

    if (dictHamburgerBtn) dictHamburgerBtn.addEventListener('click', openDictSidebar);
    if (dictSidebarClose) dictSidebarClose.addEventListener('click', closeDictSidebar);
    if (dictSidebarOverlay) dictSidebarOverlay.addEventListener('click', closeDictSidebar);

    /* ============================
        LLM Integration Logic
       ============================ */
    const llmService = new LLMService();
    const llmSection = document.getElementById('llm-section');
    const aiEnhanceBtn = document.getElementById('ai-enhance-btn');
    const llmKeyModal = document.getElementById('llm-key-modal');
    const llmModalCloseBtn = document.getElementById('llm-modal-close-btn');
    const keyModalCancel = document.getElementById('key-modal-cancel');
    const keyModalSave = document.getElementById('key-modal-save');
    const providerApiKeyInput = document.getElementById('provider-api-key');
    const keyValidationStatus = document.getElementById('key-validation-status');
    const providerCards = document.querySelectorAll('.provider-card');
    const usageDashboard = document.querySelector('.usage-dashboard');

    let currentSetupProvider = null;
    let selectedModelId = null;

    // Initialize LLM Service
    llmService.init().then(() => {
        updateLLMUI();
    });

    // Modal Elements
    const contributionModal = document.getElementById('contribution-modal');
    const contributeBtn = document.getElementById('dict-contribute-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalSubmitBtn = document.getElementById('modal-submit-btn');
    const contribCategorySelect = document.getElementById('contrib-category');
    const newCategoryCheck = document.getElementById('new-category-check');
    const newCategoryInput = document.getElementById('new-category-name');
    const contribDifficultyPills = document.getElementById('contrib-difficulty-pills');

    let activeCategoryId = null;

    // API Key Visibility Toggle
    const toggleApiKeyBtn = document.getElementById('toggle-api-key');
    if (toggleApiKeyBtn) {
        toggleApiKeyBtn.addEventListener('click', () => {
            const input = document.getElementById('provider-api-key');
            const eyeIcon = toggleApiKeyBtn.querySelector('.eye-icon');
            const eyeOffIcon = toggleApiKeyBtn.querySelector('.eye-off-icon');

            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        });
    }

    // Navigation Switcher Logic
    function switchSection(sectionId) {
        if (!sectionId) return;

        // Update Nav UI
        document.querySelectorAll('.main-nav a').forEach(l => {
            if (l.dataset.section === sectionId) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        // Update Sidebar Nav UI
        document.querySelectorAll('.sidebar-link').forEach(l => {
            if (l.dataset.section === sectionId) {
                l.classList.add('active');
            } else {
                l.classList.remove('active');
            }
        });

        // Hide all sections and heroes
        document.querySelectorAll('section').forEach(sect => sect.classList.add('hidden'));
        const mainHero = document.querySelector('.hero-section');
        const dictHero = document.querySelector('.dict-hero');
        const pricingHero = document.querySelector('.pricing-hero');

        mainHero?.classList.add('hidden');
        dictHero?.classList.add('hidden');
        pricingHero?.classList.add('hidden');

        // Show target section and related components
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        if (sectionId === 'generator-section') {
            mainHero?.classList.remove('hidden');
            document.getElementById('global-params-section')?.classList.remove('hidden');
            document.getElementById('output-section')?.classList.remove('hidden');
        } else if (sectionId === 'dictionary-section') {
            dictHero?.classList.remove('hidden');
            if (!dictionaryService.isInitialized) {
                dictionaryService.init().then(() => {
                    renderSidebarCategories();
                    populateModalCategories();

                    // Default selection: First available category
                    setTimeout(() => {
                        const firstCategoryLi = dictCategoryList?.querySelector('li');
                        if (firstCategoryLi) {
                            firstCategoryLi.querySelector('.category-name').click();
                        }
                    }, 100);
                });
            }
        } else if (sectionId === 'llm-section') {
            updateLLMUI();
        } else if (sectionId === 'history-section') {
            if (typeof renderHistoryView === 'function') {
                renderHistoryView('section');
            }
        } else if (sectionId === 'pricing-section') {
            pricingHero?.classList.remove('hidden');
        }
    }

    // Expose for external access (e.g., from pricing.js)
    window.switchSection = switchSection;

    // Bind Navigation Links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            switchSection(sectionId);
        });
    });

    // Render Sidebar Categories
    function renderSidebarCategories() {
        if (!dictCategoryList) return;
        dictCategoryList.innerHTML = '';

        const categories = dictionaryService.getAllCategories();

        categories.forEach(cat => {
            const li = document.createElement('li');
            const isUserCategory = dictionaryService.isCategoryUserCreated(cat.id);
            if (isUserCategory) li.classList.add('user-category');

            // Create category name span
            const nameSpan = document.createElement('span');
            nameSpan.textContent = cat.name;
            nameSpan.className = 'category-name';
            li.appendChild(nameSpan);

            // Add delete button for user-created categories
            if (isUserCategory) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'category-delete-btn';
                deleteBtn.title = 'Delete Category';
                deleteBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                `;
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleDeleteCategory(cat.id);
                });
                li.appendChild(deleteBtn);
            }

            li.dataset.catId = cat.id;
            nameSpan.addEventListener('click', () => {
                dictCategoryList.querySelectorAll('li').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                activeCategoryId = cat.id;
                dictActiveCategoryTitle.textContent = cat.name;
                renderTermsByCategory(cat.id);
                closeDictSidebar();
            });
            dictCategoryList.appendChild(li);
        });
    }

    // Render Terms
    function renderTermsByCategory(categoryId) {
        dictContentArea.innerHTML = '';

        if (!categoryId) {
            dictContentArea.innerHTML = '<div class="empty-state">Select a category from the sidebar to view terms</div>';
            return;
        }

        const terms = dictionaryService.getTermsByCategory(categoryId);
        terms.forEach(term => {
            const card = createEnhancedTermCard(term);
            dictContentArea.appendChild(card);
        });
    }

    function createEnhancedTermCard(term) {
        const div = document.createElement('div');
        const isUserTerm = dictionaryService.isUserCreated(term.id);
        div.className = `term-card ${isUserTerm ? 'user-term' : ''}`;
        div.dataset.termId = term.id;

        const examplesHtml = term.examples && term.examples.length > 0
            ? `<div class="term-examples">
                <h5>Examples:</h5>
                <ul>${term.examples.map(ex => `<li>${ex}</li>`).join('')}</ul>
               </div>`
            : '';

        const difficultyClass = term.difficulty || 'beginner';
        const authorName = term.author || 'System';
        const likes = term.likes || 0;

        // Add edit/delete buttons for user-created terms
        const managementButtons = isUserTerm ? `
            <button class="term-manage-btn edit-btn" data-term-id="${term.id}" title="Edit Term">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
            <button class="term-manage-btn delete-btn" data-term-id="${term.id}" title="Delete Term">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>
        ` : '';

        div.innerHTML = `
            <div class="term-header">
                <h4 class="term-title">${term.name}</h4>
                <div class="term-header-right">
                    <span class="difficulty-badge ${difficultyClass}">${difficultyClass}</span>
                    ${managementButtons}
                </div>
            </div>
            <p class="term-definition">${term.definition}</p>
            ${examplesHtml}
            <div class="term-footer">
                <div class="term-author">By: <span>@${authorName}</span></div>
                <div class="term-actions">
                    <button class="term-action-btn like-btn" data-term-id="${term.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <span class="like-count">${likes}</span>
                    </button>
                    <button class="btn-use-prompt" data-term-name="${term.name}">Use in Prompt</button>
                </div>
            </div>
        `;

        // Event Listeners
        const likeBtn = div.querySelector('.like-btn');
        likeBtn.addEventListener('click', () => handleLike(term.id, likeBtn));

        const useBtn = div.querySelector('.btn-use-prompt');
        useBtn.addEventListener('click', () => handleUseInPrompt(term.name));

        // Management buttons for user-created terms
        if (isUserTerm) {
            const editBtn = div.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => handleEditTerm(term.id));

            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => handleDeleteTerm(term.id));
        }

        return div;
    }

    // Handle Like
    function handleLike(termId, btnElement) {
        // Toggle liked state visually
        btnElement.classList.toggle('liked');
        const countSpan = btnElement.querySelector('.like-count');
        let currentLikes = parseInt(countSpan.textContent) || 0;

        if (btnElement.classList.contains('liked')) {
            currentLikes++;
        } else {
            currentLikes = Math.max(0, currentLikes - 1);
        }
        countSpan.textContent = currentLikes;

        // Persist to localStorage (simulated)
        const likedTerms = JSON.parse(localStorage.getItem('likedTerms') || '[]');
        if (btnElement.classList.contains('liked')) {
            if (!likedTerms.includes(termId)) likedTerms.push(termId);
        } else {
            const idx = likedTerms.indexOf(termId);
            if (idx > -1) likedTerms.splice(idx, 1);
        }
        localStorage.setItem('likedTerms', JSON.stringify(likedTerms));
    }

    // Handle Use in Prompt
    function handleUseInPrompt(termName) {
        // Find the first scene's description and append the term
        const firstSceneDesc = document.querySelector('.scene-description');

        if (firstSceneDesc) {
            // Update value
            const currentValue = firstSceneDesc.value;
            firstSceneDesc.value = currentValue ? `${currentValue}, ${termName}` : termName;

            // Dispatch input event to ensure auto-generation/preview logic triggers
            firstSceneDesc.dispatchEvent(new Event('input', { bubbles: true }));

            // Switch to generator view by triggering the nav link click
            // This ensures centralized logic (showing global params, etc.) runs properly
            const generatorLink = Array.from(navLinks).find(l => l.textContent.trim() === 'JSON Generator');
            if (generatorLink) {
                generatorLink.click();
            } else {
                // Fallback for UI consistency
                document.querySelectorAll('section').forEach(sect => sect.classList.add('hidden'));
                generatorSection.classList.remove('hidden');
                document.getElementById('global-params-section')?.classList.remove('hidden');
                document.getElementById('output-section')?.classList.remove('hidden');
                document.querySelector('.hero-section')?.classList.remove('hidden');
                navLinks.forEach(l => l.classList.remove('active'));
                if (navLinks[0]) navLinks[0].classList.add('active');
            }

            if (typeof showToast === 'function') {
                showToast('Term Applied', `"${termName}" added to scene 1`, 'success');
            }
        } else {
            // No scene found, switch to generator and warn user
            const generatorLink = Array.from(navLinks).find(l => l.textContent.trim() === 'JSON Generator');
            if (generatorLink) generatorLink.click();

            if (typeof showToast === 'function') {
                showToast('No Active Scene', 'Add a scene first to use dictionary terms.', 'warning');
            }
        }
    }

    // Handle Edit Term
    let editingTermId = null;
    let editingCategoryId = null;

    function handleEditTerm(termId) {
        const result = dictionaryService.getTermById(termId);
        if (!result) return;

        const { term, categoryId } = result;
        editingTermId = termId;
        editingCategoryId = categoryId;

        // Populate modal with existing data
        document.getElementById('contrib-username').value = term.author || '';
        document.getElementById('contrib-term-name').value = term.name || '';
        document.getElementById('contrib-definition').value = term.definition || '';
        document.getElementById('contrib-examples').value = term.examples ? term.examples.join(', ') : '';

        // Set category in dropdown
        selectedCategoryId = categoryId;
        const category = dictionaryService.getAllCategories().find(c => c.id === categoryId);
        if (category) {
            dropdownValue.textContent = category.name;
        }

        // Set difficulty
        const difficultyPills = contribDifficultyPills.querySelectorAll('.pill');
        difficultyPills.forEach(pill => {
            pill.classList.remove('active');
            if (pill.dataset.value === term.difficulty) {
                pill.classList.add('active');
            }
        });

        // Update modal title and button
        document.querySelector('.modal-header h3').textContent = 'Edit Term';
        modalSubmitBtn.textContent = 'Update Term';

        contributionModal.classList.remove('hidden');
    }

    // Handle Delete Term
    function handleDeleteTerm(termId) {
        if (!confirm('Are you sure you want to delete this term? This action cannot be undone.')) {
            return;
        }

        const result = dictionaryService.getTermById(termId);
        if (!result) return;

        const { categoryId } = result;
        if (dictionaryService.deleteTerm(categoryId, termId)) {
            // Refresh view if viewing this category
            if (activeCategoryId === categoryId) {
                renderTermsByCategory(categoryId);
            }
        }
    }

    // Handle Delete Category
    function handleDeleteCategory(categoryId) {
        const category = dictionaryService.getAllCategories().find(c => c.id === categoryId);
        const categoryName = category ? category.name : 'this category';

        if (!confirm(`Are you sure you want to delete "${categoryName}"? All terms in this category will also be deleted. This action cannot be undone.`)) {
            return;
        }

        if (dictionaryService.deleteCategory(categoryId)) {
            renderSidebarCategories();
            populateModalCategories(); // Refresh dropdown menu

            // If viewing deleted category, clear content
            if (activeCategoryId === categoryId) {
                activeCategoryId = null;
                dictActiveCategoryTitle.textContent = 'Select a Category';
                dictContentArea.innerHTML = '<div class="empty-state">Select a category from the sidebar to view terms</div>';
            }
        }
    }

    // Search Logic
    if (dictSearchInput) {
        dictSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            if (query.length > 0) {
                dictCategoryList?.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                dictActiveCategoryTitle.textContent = `Search: "${query}"`;

                const results = dictionaryService.searchTerm(query);
                renderSearchResults(results);
            } else {
                if (activeCategoryId) {
                    const cat = dictionaryService.getAllCategories().find(c => c.id === activeCategoryId);
                    dictActiveCategoryTitle.textContent = cat ? cat.name : 'Select a Category';
                    renderTermsByCategory(activeCategoryId);
                } else {
                    dictActiveCategoryTitle.textContent = 'Select a Category';
                    dictContentArea.innerHTML = '<div class="empty-state">Select a category from the sidebar to view terms</div>';
                }
            }
        });
    }

    function renderSearchResults(results) {
        dictContentArea.innerHTML = '';

        if (results.length === 0) {
            dictContentArea.innerHTML = '<div class="empty-state">No terms found matching your query.</div>';
            return;
        }

        results.forEach(group => {
            const header = document.createElement('div');
            header.className = 'search-category-header';
            header.textContent = group.categoryName;
            dictContentArea.appendChild(header);

            group.terms.forEach(term => {
                const card = createEnhancedTermCard(term);
                dictContentArea.appendChild(card);
            });
        });
    }

    // --- Contribution Modal ---
    if (contributeBtn) {
        contributeBtn.addEventListener('click', () => {
            resetModal();
            contributionModal.classList.remove('hidden');
        });
    }

    // Modal close handlers moved below to avoid duplication

    // Custom Dropdown Logic
    const customDropdown = document.getElementById('custom-category-dropdown');
    const dropdownTrigger = document.getElementById('dropdown-trigger');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const dropdownValue = document.querySelector('.dropdown-value');
    let selectedCategoryId = null;

    if (dropdownTrigger) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            customDropdown.classList.toggle('open');
            dropdownMenu.classList.toggle('hidden');
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (customDropdown && !customDropdown.contains(e.target)) {
            customDropdown.classList.remove('open');
            dropdownMenu?.classList.add('hidden');
        }
    });

    // Difficulty Pills Toggle
    if (contribDifficultyPills) {
        contribDifficultyPills.addEventListener('click', (e) => {
            if (e.target.classList.contains('pill')) {
                contribDifficultyPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    // Populate Modal Categories (Custom Dropdown)
    function populateModalCategories() {
        if (!dropdownMenu) return;

        // Clear existing items but keep some state if needed
        dropdownMenu.innerHTML = '';

        const categories = dictionaryService.getAllCategories();
        categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.categoryId = cat.id;
            item.textContent = cat.name;
            if (cat.id === selectedCategoryId) item.classList.add('selected');
            dropdownMenu.appendChild(item);
        });

        // Add "Create New Category" button
        const newCategoryBtn = document.createElement('div');
        newCategoryBtn.className = 'dropdown-item new-category-btn';
        newCategoryBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create New Category
        `;
        dropdownMenu.appendChild(newCategoryBtn);
    }

    // Event Delegation for Custom Dropdown Menu
    if (dropdownMenu) {
        dropdownMenu.addEventListener('click', (e) => {
            const item = e.target.closest('.dropdown-item');
            if (!item) return;

            if (item.classList.contains('new-category-btn')) {
                dropdownValue.textContent = 'New Category';
                selectedCategoryId = null;
                newCategoryInput.classList.remove('hidden');
                newCategoryInput.focus();
            } else {
                const catId = item.dataset.categoryId;
                const catName = item.textContent;

                // Update selection
                dropdownMenu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                dropdownValue.textContent = catName;
                selectedCategoryId = catId;
                newCategoryInput.classList.add('hidden');
            }

            // Close dropdown
            customDropdown.classList.remove('open');
            dropdownMenu.classList.add('hidden');
        });
    }

    // Submit New Term / Update Term
    if (modalSubmitBtn) {
        modalSubmitBtn.addEventListener('click', () => {
            const username = document.getElementById('contrib-username').value.trim() || 'Anonymous';
            const termName = document.getElementById('contrib-term-name').value.trim();
            const definition = document.getElementById('contrib-definition').value.trim();
            const examplesRaw = document.getElementById('contrib-examples').value.trim();
            const activeDiffPill = contribDifficultyPills.querySelector('.pill.active');
            const difficulty = activeDiffPill ? activeDiffPill.dataset.value : 'beginner';

            if (!termName || !definition) {
                showToast('Fields Required', 'Please fill in both the term name and its definition.', 'warning');
                return;
            }

            const examples = examplesRaw ? examplesRaw.split(',').map(s => s.trim()) : [];

            // Check if we're editing or creating
            if (editingTermId && editingCategoryId) {
                // Edit mode
                const updatedData = {
                    name: termName,
                    definition: definition,
                    difficulty: difficulty,
                    examples: examples,
                    author: username.replace('@', '')
                };

                if (dictionaryService.editTerm(editingCategoryId, editingTermId, updatedData)) {
                    // Refresh view if viewing the edited category
                    if (activeCategoryId === editingCategoryId) {
                        renderTermsByCategory(editingCategoryId);
                    }
                    resetModal();
                    contributionModal.classList.add('hidden');
                }
            } else {
                // Create mode
                let categoryId;
                // Check if creating new category
                if (!selectedCategoryId && !newCategoryInput.classList.contains('hidden')) {
                    const newCatName = newCategoryInput.value.trim();
                    if (!newCatName) {
                        showToast('Category Name Required', 'Please enter a name for the new category.', 'warning');
                        return;
                    }
                    categoryId = 'user_' + newCatName.toLowerCase().replace(/\s+/g, '_');
                    // Add new category to service
                    dictionaryService.addCategory({
                        id: categoryId,
                        name: newCatName,
                        author: username,
                        terms: []
                    });
                    renderSidebarCategories();
                    populateModalCategories();
                } else if (selectedCategoryId) {
                    categoryId = selectedCategoryId;
                } else {
                    showToast('Category Selection Required', 'Please select a category from the dropdown.', 'warning');
                    return;
                }

                const newTerm = {
                    id: 'user_' + Date.now(),
                    name: termName,
                    definition: definition,
                    difficulty: difficulty,
                    examples: examples,
                    author: username.replace('@', ''),
                    likes: 0
                };

                dictionaryService.addTerm(categoryId, newTerm);

                // Refresh terms if viewing that category
                if (activeCategoryId === categoryId) {
                    renderTermsByCategory(categoryId);
                }

                resetModal();
                contributionModal.classList.add('hidden');
            }
        });
    }

    // Reset modal to create mode
    function resetModal() {
        editingTermId = null;
        editingCategoryId = null;
        document.querySelector('.modal-header h3').textContent = 'Contribute a Term';
        modalSubmitBtn.textContent = 'Submit Term';
        document.getElementById('contrib-username').value = '';
        document.getElementById('contrib-term-name').value = '';
        document.getElementById('contrib-definition').value = '';
        document.getElementById('contrib-examples').value = '';
        newCategoryInput.value = '';
        newCategoryInput.classList.add('hidden');
        selectedCategoryId = null;
        dropdownValue.textContent = 'Select a category';
        contribDifficultyPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    }

    // Reset modal when closing
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            resetModal();
            contributionModal.classList.add('hidden');
        });
    }
    if (modalCancelBtn) {
        modalCancelBtn.addEventListener('click', () => {
            resetModal();
            contributionModal.classList.add('hidden');
        });
    }

    /* --- LLM UI Helpers --- */

    function updateLLMUI() {
        if (!llmSection) return;

        const configured = llmService.getConfiguredProviders();
        providerCards.forEach(card => {
            const providerId = card.dataset.provider;
            const statusEl = card.querySelector('.provider-setup-status');
            const setupBtn = card.querySelector('.setup-key-btn');

            if (configured.includes(providerId)) {
                statusEl.textContent = 'CONFIGURED';
                statusEl.classList.add('configured');
                setupBtn.textContent = 'Update Key';
            } else {
                statusEl.textContent = 'NOT CONFIGURED';
                statusEl.classList.remove('configured');
                setupBtn.textContent = 'Setup API Key';
            }
        });

        // Show/Hide AI Enhance button
        if (aiEnhanceBtn) {
            aiEnhanceBtn.style.display = configured.length > 0 ? 'flex' : 'none';
        }

        // Update Dashboard
        const stats = llmService.getUsageStats();
        const hasStats = Object.keys(stats).length > 0;
        usageDashboard?.classList.toggle('hidden', !hasStats);

        if (hasStats && usageDashboard) {
            const grid = usageDashboard.querySelector('.usage-stats-grid');
            const totalTokensEl = usageDashboard.querySelector('.usage-total-tokens');
            grid.innerHTML = '';

            let totalRequests = 0;

            for (const [id, stat] of Object.entries(stats)) {
                totalRequests += stat.requestCount;
                const lastUsedDate = stat.lastUsed ? new Date(stat.lastUsed).toLocaleDateString() : 'Never';

                const box = document.createElement('div');
                box.className = 'stat-box';
                box.innerHTML = `
                    <div class="stat-header">
                        <div class="stat-provider">${llmService.providers[id].name}</div>
                        <div class="stat-indicator"></div>
                    </div>
                    <div class="stat-main">
                        <div class="stat-value">${stat.requestCount}<span class="stat-unit">Requests</span></div>
                    </div>
                    <div class="stat-footer">
                        <div class="stat-info">
                            <span>Active Model</span>
                            <span>${stat.model || 'Default'}</span>
                        </div>
                        <div class="stat-info">
                            <span>Last Used</span>
                            <span>${lastUsedDate}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(box);
            }

            if (totalTokensEl) {
                totalTokensEl.textContent = `Total Requests: ${totalRequests}`;
            }
        }
    }

    function openLLMModal(providerId) {
        currentSetupProvider = providerId;
        const provider = llmService.providers[providerId];
        document.getElementById('modal-provider-name').textContent = `Configure ${provider.name}`;
        providerApiKeyInput.value = llmService.getProviderKey(providerId) || '';

        // Update Provider Dropdown UI (though hidden, we keep state consistent)
        const providerTriggerValue = document.querySelector('#llm-provider-dropdown .dropdown-value');
        if (providerTriggerValue) providerTriggerValue.textContent = provider.name;

        document.querySelectorAll('#llm-provider-dropdown .dropdown-item').forEach(item => {
            item.classList.toggle('selected', item.dataset.providerId === providerId);
        });

        // Reset status
        keyValidationStatus.classList.add('hidden');
        keyValidationStatus.classList.remove('success', 'error');

        const input = document.getElementById('provider-api-key');
        input.type = 'password';
        const toggleBtn = document.getElementById('toggle-api-key');
        if (toggleBtn) {
            toggleBtn.querySelector('.eye-icon').classList.remove('hidden');
            toggleBtn.querySelector('.eye-off-icon').classList.add('hidden');
        }

        // Hide custom group initially
        document.getElementById('custom-model-group').classList.add('hidden');
        document.getElementById('custom-model-id').value = '';

        populateModelDropdown(providerId);
        llmKeyModal.classList.remove('hidden');
    }

    function populateModelDropdown(providerId) {
        const menu = document.getElementById('model-dropdown-menu');
        const triggerValue = document.querySelector('#llm-model-dropdown .dropdown-value');
        const customGroup = document.getElementById('custom-model-group');
        const customInput = document.getElementById('custom-model-id');
        const provider = llmService.providers[providerId];

        const savedConfig = llmService.config[providerId];
        const currentModelId = savedConfig?.model || provider.models[0].id;

        // Check if current model is one of the defaults
        const isDefault = provider.models.some(m => m.id === currentModelId);

        menu.innerHTML = '';

        // Add default models
        provider.models.forEach(model => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            if (model.id === currentModelId) {
                item.classList.add('selected');
                triggerValue.textContent = model.name;
                selectedModelId = model.id;
            }
            item.textContent = model.name;
            item.dataset.modelId = model.id;

            item.addEventListener('click', () => {
                menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                triggerValue.textContent = model.name;
                selectedModelId = model.id;
                customGroup.classList.add('hidden');
                document.getElementById('model-dropdown-menu').classList.add('hidden');
                document.getElementById('llm-model-dropdown').classList.remove('open');
            });

            menu.appendChild(item);
        });

        // Add Custom Option
        const customItem = document.createElement('div');
        customItem.className = 'dropdown-item';
        customItem.textContent = 'Custom Model';
        customItem.dataset.modelId = 'custom';

        if (!isDefault) {
            customItem.classList.add('selected');
            triggerValue.textContent = 'Custom Model';
            selectedModelId = 'custom';
            customGroup.classList.remove('hidden');
            customInput.value = currentModelId;
        }

        customItem.addEventListener('click', () => {
            menu.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('selected'));
            customItem.classList.add('selected');
            triggerValue.textContent = 'Custom Model';
            selectedModelId = 'custom';
            customGroup.classList.remove('hidden');
            customInput.focus();
            document.getElementById('model-dropdown-menu').classList.add('hidden');
            document.getElementById('llm-model-dropdown').classList.remove('open');
        });
        menu.appendChild(customItem);
    }

    // Modal Events
    providerCards.forEach(card => {
        const setupBtn = card.querySelector('.setup-key-btn');
        setupBtn.addEventListener('click', () => {
            openLLMModal(card.dataset.provider);
        });
    });

    if (llmModalCloseBtn) {
        llmModalCloseBtn.addEventListener('click', () => llmKeyModal.classList.add('hidden'));
    }
    if (keyModalCancel) {
        keyModalCancel.addEventListener('click', () => llmKeyModal.classList.add('hidden'));
    }

    if (keyModalSave) {
        keyModalSave.addEventListener('click', async () => {
            const key = providerApiKeyInput.value.trim();
            let finalModelId = selectedModelId;

            if (!key) {
                showToast('Input Required', 'Please enter an API key', 'warning');
                return;
            }

            if (selectedModelId === 'custom') {
                const customId = document.getElementById('custom-model-id').value.trim();
                if (!customId) {
                    showToast('Input Required', 'Please enter a custom model ID', 'warning');
                    return;
                }
                finalModelId = customId;
            }

            keyValidationStatus.classList.remove('hidden');
            keyValidationStatus.innerHTML = '<div class="loader-small"></div><span>Validating key...</span>';

            const result = await llmService.validateKey(currentSetupProvider, key);

            keyValidationStatus.innerHTML = `<span>${result.message}</span>`;
            keyValidationStatus.classList.replace('hidden', result.valid ? 'success' : 'error');
            if (!result.valid) keyValidationStatus.classList.add('error');

            if (result.valid) {
                await llmService.setProviderKey(currentSetupProvider, key, finalModelId);
                setTimeout(() => {
                    llmKeyModal.classList.add('hidden');
                    updateLLMUI();
                }, 1000);
            }
        });
    }

    // Dropdown Triggers
    const dropdowns = [
        { triggerId: 'provider-dropdown-trigger', menuId: 'provider-dropdown-menu', wrapperId: 'llm-provider-dropdown' },
        { triggerId: 'model-dropdown-trigger', menuId: 'model-dropdown-menu', wrapperId: 'llm-model-dropdown' }
    ];

    dropdowns.forEach(dd => {
        const trigger = document.getElementById(dd.triggerId);
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns first
                dropdowns.forEach(other => {
                    if (other.triggerId !== dd.triggerId) {
                        const menu = document.getElementById(other.menuId);
                        const wrap = document.getElementById(other.wrapperId);
                        if (menu) menu.classList.add('hidden');
                        if (wrap) wrap.classList.remove('open');
                    }
                });
                document.getElementById(dd.wrapperId).classList.toggle('open');
                document.getElementById(dd.menuId).classList.toggle('hidden');
            });
        }
    });

    // Provider Dropdown Items
    document.querySelectorAll('#llm-provider-dropdown .dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const providerId = item.dataset.providerId;
            const providerName = item.textContent;

            // Update UI
            document.querySelector('#llm-provider-dropdown .dropdown-value').textContent = providerName;
            document.querySelectorAll('#llm-provider-dropdown .dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');

            // Update State
            currentSetupProvider = providerId;
            providerApiKeyInput.value = llmService.getProviderKey(providerId) || '';

            // Re-populate models for this provider
            populateModelDropdown(providerId);

            // Hide menu
            document.getElementById('provider-dropdown-menu').classList.add('hidden');
            document.getElementById('llm-provider-dropdown').classList.remove('open');
        });
    });

    // Document click to close dropdowns
    document.addEventListener('click', () => {
        dropdowns.forEach(dd => {
            const menu = document.getElementById(dd.menuId);
            const wrap = document.getElementById(dd.wrapperId);
            if (menu) menu.classList.add('hidden');
            if (wrap) wrap.classList.remove('open');
        });
    });

    /* --- Toast Logic --- */
    window.showToast = function (title, message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ?
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` :
            `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Per-scene Original Prompt Tracking
    // Scene History State
    const sceneHistories = new Map();

    /**
     * Initialize or update history for a scene
     * @param {HTMLElement} sceneEl 
     * @param {string} text 
     * @param {boolean} isInitial - If true, resets history. If false, pushes new version.
     */
    function updateSceneHistory(sceneEl, text, isInitial = false) {
        if (!sceneHistories.has(sceneEl) || isInitial) {
            sceneHistories.set(sceneEl, {
                stack: [text],
                index: 0
            });
        } else {
            const history = sceneHistories.get(sceneEl);
            // If we've branched (manually typed or undo-ed then enhanced), truncate future
            if (history.index < history.stack.length - 1) {
                history.stack = history.stack.slice(0, history.index + 1);
            }

            // Only push if different from current
            if (text !== history.stack[history.index]) {
                history.stack.push(text);
                history.index++;
            }
        }
        updateHistoryButtons(sceneEl);
    }

    function updateHistoryButtons(sceneEl) {
        const history = sceneHistories.get(sceneEl);
        if (!history) return;

        const undoBtn = sceneEl.querySelector('.scene-undo-btn');
        const redoBtn = sceneEl.querySelector('.scene-redo-btn');

        if (undoBtn) undoBtn.classList.toggle('hidden', history.index <= 0);
        if (redoBtn) redoBtn.classList.toggle('hidden', history.index >= history.stack.length - 1);
    }

    // Track manual input
    scenesContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('scene-description')) {
            const sceneEl = e.target.closest('.scene-item');

            // For manual typing, we update the current index value 
            // but we don't automatically push a new history state for every keystroke
            // to avoid cluttering. However, we do want to hide redo if they start typing.
            const history = sceneHistories.get(sceneEl);
            if (history) {
                history.stack[history.index] = e.target.value;
                // If they change something manually, redo should be lost as they are on a new path
                if (history.index < history.stack.length - 1) {
                    history.stack = history.stack.slice(0, history.index + 1);
                }
                updateHistoryButtons(sceneEl);
            } else {
                // First-time manual input
                updateSceneHistory(sceneEl, e.target.value, true);
            }
        }
    });

    // AI Enhance Logic (Delegated)
    if (scenesContainer) {
        scenesContainer.addEventListener('click', async (e) => {
            // Undo Handler
            const undoBtn = e.target.closest('.scene-undo-btn');
            if (undoBtn) {
                const sceneEl = undoBtn.closest('.scene-item');
                const history = sceneHistories.get(sceneEl);
                if (history && history.index > 0) {
                    history.index--;
                    const textarea = sceneEl.querySelector('.scene-description');
                    textarea.value = history.stack[history.index];
                    updateHistoryButtons(sceneEl);
                    showToast('Undo', 'Reverted to previous version', 'info');
                }
                return;
            }

            // Redo Handler
            const redoBtn = e.target.closest('.scene-redo-btn');
            if (redoBtn) {
                const sceneEl = redoBtn.closest('.scene-item');
                const history = sceneHistories.get(sceneEl);
                if (history && history.index < history.stack.length - 1) {
                    history.index++;
                    const textarea = sceneEl.querySelector('.scene-description');
                    textarea.value = history.stack[history.index];
                    updateHistoryButtons(sceneEl);
                    showToast('Redo', 'Restored next version', 'info');
                }
                return;
            }

            // Enhance Handler
            const enhanceBtn = e.target.closest('.scene-enhance-btn');
            if (!enhanceBtn) return;

            const sceneEl = enhanceBtn.closest('.scene-item');
            if (!sceneEl) return;

            const textarea = sceneEl.querySelector('.scene-description');

            const configured = llmService.getConfiguredProviders();
            if (configured.length === 0) {
                showToast('Configuration Required', 'Please configure an AI provider in the integration hub first.', 'warning');
                return;
            }

            const providerId = configured[0];

            // Visual feedback
            enhanceBtn.classList.add('loading');
            enhanceBtn.disabled = true;

            try {
                const description = textarea.value.trim();
                const camera = sceneEl.querySelector('.scene-camera-value').value;
                const lighting = sceneEl.querySelector('.scene-lighting-value').value;
                const negative = sceneEl.querySelector('.scene-negative-prompt').value.trim();

                if (!description) {
                    showToast('Description Required', 'Please describe the scene before enhancing.', 'warning');
                    return;
                }

                // Ensure current state is in history before pushing new AI one
                if (!sceneHistories.has(sceneEl)) {
                    updateSceneHistory(sceneEl, description, true);
                }

                const sceneData = {
                    description,
                    camera: camera || '',
                    lighting: lighting || '',
                    negative_prompt: negative || ''
                };

                // Get current model profile for model-aware AI generation
                const currentModelId = globalParams.getParams().platform_preset;
                const modelProfile = globalParams.modelService.getProfile(currentModelId);

                const enhanced = await llmService.generatePrompt(providerId, sceneData, { modelProfile });
                textarea.value = enhanced;

                // Push enhanced version to history
                updateSceneHistory(sceneEl, enhanced);

                showToast('Scene Enhanced', 'AI version added to history stack!', 'success');

            } catch (e) {
                console.error('Enhance Error:', e);
                let errorTitle = 'AI Enhancement Failed';
                let errorMsg = e.message;

                if (e.message.toLowerCase().includes('quota') || e.message.toLowerCase().includes('rate limit')) {
                    errorTitle = 'Quota Exceeded';
                    errorMsg = 'Wait a moment or switch to Gemini 1.5 Flash.';
                }
                showToast(errorTitle, errorMsg, 'error');

            } finally {
                enhanceBtn.classList.remove('loading');
                enhanceBtn.disabled = false;
            }
        });
    }

    /* ============================
        History & Diff Logic
       ============================ */
    // historyService is already initialized at the top
    const historyModal = document.getElementById('history-modal');

    // Selectors for Modal
    const modalList = document.getElementById('history-list');
    const modalPreview = document.getElementById('history-preview-code');
    const modalActions = document.getElementById('history-preview-actions');

    // Selectors for Section
    const sectionList = document.getElementById('history-section-list');
    const sectionPreview = document.getElementById('history-section-preview-code');
    const sectionActions = document.getElementById('history-section-preview-actions');

    let selectedHistoryItem = null;

    // History Sidebar is managed by history-sidebar.js

    // Trigger Modal Open
    document.getElementById('history-trigger-btn')?.addEventListener('click', () => {
        renderHistoryView('modal');
        historyModal?.classList.remove('hidden');
    });

    // Close Modal
    document.getElementById('history-close-btn')?.addEventListener('click', () => {
        historyModal?.classList.add('hidden');
    });

    // Clear History
    const clearAllHistory = () => {
        if (confirm('Are you sure you want to clear all history?')) {
            historyService.clear();
            renderHistoryView('modal');
            renderHistoryView('section');
            if (modalPreview) modalPreview.textContent = "History cleared.";
            if (sectionPreview) sectionPreview.textContent = "History cleared.";
            if (modalActions) modalActions.classList.add('hidden');
            if (sectionActions) sectionActions.classList.add('hidden');
            showToast('History Cleared', 'All recorded versions have been removed.', 'info');
        }
    };

    document.getElementById('history-clear-btn')?.addEventListener('click', clearAllHistory);
    document.getElementById('history-section-clear-btn')?.addEventListener('click', clearAllHistory);

    // Restore Version
    const restoreHistoryItem = () => {
        if (selectedHistoryItem) {
            outputArea.value = JSON.stringify(selectedHistoryItem.content, null, 2);
            historyModal?.classList.add('hidden');

            // If in section view, return to generator
            const activeNav = document.querySelector('.main-nav a.active');
            if (activeNav?.textContent.trim() === 'History') {
                const genLink = Array.from(document.querySelectorAll('.main-nav a')).find(a => a.textContent.trim() === 'JSON Generator');
                genLink?.click();
            }

            document.getElementById('output-section').classList.remove('hidden');
            document.getElementById('output-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Restored', 'Version loaded into output editor.', 'success');
        }
    };

    document.getElementById('history-restore-btn')?.addEventListener('click', restoreHistoryItem);
    document.getElementById('history-section-restore-btn')?.addEventListener('click', restoreHistoryItem);

    // Render Sidebar
    function renderHistoryView(view) {
        const items = historyService.getAll();
        const container = view === 'modal' ? modalList : sectionList;

        if (!container) return;
        container.innerHTML = '';

        if (items.length === 0) {
            container.innerHTML = `<div class="empty-state" style="padding: 20px; font-size: 0.85rem;">No history found.</div>`;
            return;
        }

        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.dataset.id = item.id;

            const date = new Date(item.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const dateStr = date.toLocaleDateString();

            const badgeClass = item.mode === 'ai' ? 'badge-ai' : 'badge-json';
            const badgeText = item.mode === 'ai' ? 'AI' : 'JSON';

            el.innerHTML = `
                <div class="history-item-top">
                    <div class="history-summary">${item.summary || 'Generated Prompt'}</div>
                    <span class="history-badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="history-item-bottom">
                    <div class="history-date">${dateStr} ${timeStr}</div>
                    <button class="history-delete-btn" title="Delete Version">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            `;

            const deleteBtn = el.querySelector('.history-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Delete this version history?')) {
                    historyService.delete(item.id);
                    renderHistoryView('modal');
                    renderHistoryView('section');

                    if (selectedHistoryItem && selectedHistoryItem.id === item.id) {
                        selectedHistoryItem = null;
                        if (modalActions) modalActions.classList.add('hidden');
                        if (sectionActions) sectionActions.classList.add('hidden');
                        if (modalPreview) modalPreview.innerHTML = '<div class="placeholder-content">Select an item from the sidebar...</div>';
                        if (sectionPreview) sectionPreview.innerHTML = '<div class="placeholder-content">Select an item from the sidebar...</div>';
                    }
                }
            });

            el.addEventListener('click', () => selectHistoryItem(item, el, view));
            container.appendChild(el);
        });
    }

    // Select Item Logic
    function selectHistoryItem(item, element, view) {
        const container = view === 'modal' ? modalList : sectionList;
        container?.querySelectorAll('.history-item').forEach(i => i.classList.remove('active'));
        element.classList.add('active');

        selectedHistoryItem = item;

        const previewArea = view === 'modal' ? modalPreview : sectionPreview;
        const actionsArea = view === 'modal' ? modalActions : sectionActions;

        if (actionsArea) actionsArea.classList.remove('hidden');
        if (previewArea) previewArea.textContent = JSON.stringify(item.content, null, 2);

        // Close sidebar on select (using global controller from history-sidebar.js)
        if (view === 'modal' && window.historysSidebarController) {
            window.historysSidebarController.close();
        }
    }

    // Expose for nav
    window.renderHistoryView = renderHistoryView;

    // We need to inject the save call into the existing event listener logic
    // Since we can't easily "inject" code into a closure without rewriting it, 
    // we'll listen for the OUTPUT text area change? No, that's unreliable.
    // We will attach a secondary listener that checks if output changed?
    // Better: We explicitly call historyService.save() inside the generateBtn block.
    // Use the MutationObserver for now? Or just rewrite the generateBtn handler?
    // *Strategy*: Refactor the generateBtn handler one last time to include save().

    // --- Template System Integration ---
    const saveTemplateBtn = document.getElementById('save-as-template');
    const openGalleryBtn = document.getElementById('open-template-gallery');

    if (saveTemplateBtn) {
        saveTemplateBtn.addEventListener('click', () => {
            // Collect Current State
            const scenes = [];
            const sceneElements = scenesContainer.querySelectorAll('.scene-item');

            sceneElements.forEach(sceneEl => {
                const desc = sceneEl.querySelector('.scene-description').value;
                const cam = sceneEl.querySelector('.scene-camera-value').value;
                const light = sceneEl.querySelector('.scene-lighting-value').value;
                // Save data-values for restoration
                const negPills = Array.from(sceneEl.querySelectorAll('.negative-pills .pill.active')).map(p => p.dataset.value);
                const custNeg = sceneEl.querySelector('.scene-negative-prompt').value;

                // Camera/Light Pills are single select and stored in hidden input 'cam'/'light'

                scenes.push({
                    description: desc,
                    camera: cam,
                    lighting: light,
                    negativePills: negPills,
                    customNegative: custNeg
                });
            });

            // Prevent saving empty state if desired, or allow it.
            // Templates can be partial.

            const templateData = {
                scenes: scenes,
                globalParams: globalParams.getParams()
            };

            if (window.templateUI) {
                window.templateUI.openSaveModal(templateData);
            } else {
                console.error('TemplateUI not found');
            }
        });
    }

    if (openGalleryBtn) {
        openGalleryBtn.addEventListener('click', () => {
            if (window.templateUI) window.templateUI.openGallery();
        });
    }

    // Apply Template Event
    window.addEventListener('apply-template', (e) => {
        const data = e.detail;
        if (!data || !data.scenes) return;

        if (confirm('Apply this template? Current scenes will be replaced.')) {
            // 1. Reset Scenes
            // Use the reset logic from reset-btn roughly but simpler
            const allScenes = scenesContainer.querySelectorAll('.scene-item');
            allScenes.forEach(s => s.remove());
            sceneCount = 0;

            // 2. Restore Scenes
            data.scenes.forEach((sceneData) => {
                // Add a new scene
                addSceneBtn.click();

                const newScene = scenesContainer.lastElementChild;
                if (newScene) {
                    newScene.querySelector('.scene-description').value = sceneData.description || '';

                    // Restore Camera
                    if (sceneData.camera) {
                        newScene.querySelector('.scene-camera-value').value = sceneData.camera;
                        // Activate Pill
                        const camPills = newScene.querySelectorAll('.camera-pills .pill');
                        camPills.forEach(p => {
                            if (p.dataset.value === sceneData.camera) p.classList.add('active');
                        });
                    }

                    // Restore Lighting
                    if (sceneData.lighting) {
                        newScene.querySelector('.scene-lighting-value').value = sceneData.lighting;
                        // Activate Pill
                        const lightPills = newScene.querySelectorAll('.lighting-pills .pill');
                        lightPills.forEach(p => {
                            if (p.dataset.value === sceneData.lighting) p.classList.add('active');
                        });
                    }

                    newScene.querySelector('.scene-negative-prompt').value = sceneData.customNegative || '';

                    // Restore Negative Pills
                    if (sceneData.negativePills && Array.isArray(sceneData.negativePills)) {
                        const container = newScene.querySelector('.negative-pills');
                        if (container) {
                            const pills = container.querySelectorAll('.pill');
                            pills.forEach(p => {
                                if (sceneData.negativePills.includes(p.dataset.value)) {
                                    p.classList.add('active');
                                }
                            });
                        }
                    }
                }
            });

            // 3. Restore Global Params
            if (data.globalParams) {
                ['aspect_ratio', 'resolution', 'frame_rate', 'platform_preset'].forEach(key => {
                    if (data.globalParams[key]) {
                        globalParams.updateParam(key, data.globalParams[key]);
                    }
                });

                syncGlobalUI();
            }

            showToast('Template Applied', 'Configuration loaded successfully.', 'success');
        }
    });

}); // End of DOMContentLoaded
