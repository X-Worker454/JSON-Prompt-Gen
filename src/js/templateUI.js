/**
 * TemplateUI - Manages the user interface for Prompt Templates
 * Handles Modals, Rendering, and User Interactions.
 */
export class TemplateUI {
    constructor() {
        this.services = window.templateService;
        this.currentPromptData = null; // Data to be saved

        // DOM Elements (will be initialized after DOMContentLoad)
        this.saveModal = null;
        this.galleryModal = null;
        this.saveForm = null;
        this.galleryGrid = null;

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Inject Modals into DOM if they don't exist
        this.injectModals();

        // Bind Elements
        this.saveModal = document.getElementById('template-save-modal');
        this.galleryModal = document.getElementById('template-gallery-modal');
        this.saveForm = document.getElementById('template-save-form');
        this.galleryGrid = document.getElementById('template-gallery-grid');

        // Bind Events
        this.bindEvents();

        // TemplateUI Initialized
    }

    injectModals() {
        const modalHTML = `
            <!-- Save Template Modal -->
            <div id="template-save-modal" class="template-modal-overlay">
                <div class="template-modal save-dialog">
                    <div class="template-modal-header">
                        <h3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Save Template</h3>
                        <button class="close-modal-btn" data-target="template-save-modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                    </div>
                    <form id="template-save-form">
                        <div class="template-modal-body">
                            <div class="template-form-group">
                                <label for="template-name">Template Name</label>
                                <input type="text" id="template-name" class="template-form-input" placeholder="e.g., Cinematic Sci-Fi Setup" required>
                            </div>
                            <div class="template-form-group">
                                <label for="template-desc">Description (Optional)</label>
                                <textarea id="template-desc" class="template-form-textarea" placeholder="Briefly describe what this template does..."></textarea>
                            </div>
                            <div class="template-form-group">
                                <label for="template-tags">Tags (Comma separated)</label>
                                <input type="text" id="template-tags" class="template-form-input" placeholder="scifi, dark, 8k">
                            </div>
                        </div>
                        <div class="template-modal-footer">
                            <button type="button" class="btn-secondary close-modal-btn" data-target="template-save-modal">Cancel</button>
                            <button type="submit" class="btn-primary">Save Template</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Template Gallery Modal -->
            <div id="template-gallery-modal" class="template-modal-overlay">
                <div class="template-modal">
                    <div class="template-modal-header">
                        <h3><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> Template Gallery</h3>
                        <button class="close-modal-btn" data-target="template-gallery-modal"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
                    </div>
                    <div class="template-modal-body">
                        <div id="template-gallery-grid" class="template-grid">
                            <!-- Templates will be injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    bindEvents() {
        // Global Click listener for closing modals
        document.addEventListener('click', (e) => {
            // Close button clicks
            if (e.target.closest('.close-modal-btn')) {
                const targetId = e.target.closest('.close-modal-btn').dataset.target;
                this.closeModal(targetId);
            }
            // Overlay clicks (close if clicked outside modal)
            if (e.target.classList.contains('template-modal-overlay')) {
                this.closeModal(e.target.id);
            }
        });

        // Save Form Submit
        this.saveForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSaveSubmit();
        });
    }

    /**
     * Open the Save Template Modal
     * @param {Object} promptData - The current state of the form
     */
    openSaveModal(promptData) {
        this.currentPromptData = promptData;

        // Reset form
        this.saveForm.reset();

        // Open modal
        this.saveModal.classList.add('active');
        document.getElementById('template-name').focus();
    }

    /**
     * Open the Template Gallery
     */
    async openGallery() {
        await this.renderGallery();
        this.galleryModal.classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    /**
     * Handle the actual saving of the template
     */
    async handleSaveSubmit() {
        const name = document.getElementById('template-name').value;
        const desc = document.getElementById('template-desc').value;
        const tagsInput = document.getElementById('template-tags').value;

        const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);

        const templateData = {
            name: name,
            description: desc,
            tags: tags,
            content: this.currentPromptData
        };

        try {
            await this.services.saveTemplate(templateData);
            this.closeModal('template-save-modal');

            // Show Success Notification
            if (window.showToast) {
                window.showToast('Template Saved', `"${name}" has been saved to your gallery.`, 'success');
            }
        } catch (error) {
            console.error('Failed to save template:', error);
            if (window.showToast) {
                window.showToast('Error', 'Failed to save template.', 'error');
            }
        }
    }

    /**
     * Render the list of templates in the gallery
     */
    async renderGallery() {
        this.galleryGrid.innerHTML = '<div class="template-loading">Loading templates...</div>';

        try {
            const templates = await this.services.getAllTemplates();
            this.galleryGrid.innerHTML = '';

            if (templates.length === 0) {
                this.galleryGrid.innerHTML = `
                    <div class="template-empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                        <p>No templates found. Create your first template from the generator!</p>
                    </div>
                `;
                return;
            }

            templates.forEach(template => {
                const card = this.createTemplateCard(template);
                this.galleryGrid.appendChild(card);
            });

        } catch (error) {
            console.error('Error rendering gallery:', error);
            this.galleryGrid.innerHTML = '<div class="template-error">Failed to load templates.</div>';
        }
    }

    createTemplateCard(template) {
        const div = document.createElement('div');
        div.className = 'template-card';
        // Add click listener to apply template
        div.onclick = (e) => {
            if (!e.target.closest('.icon-btn')) { // Ignore clicks on actions
                this.applyTemplate(template);
            }
        };

        const date = new Date(template.updatedAt).toLocaleDateString();

        div.innerHTML = `
            <div class="template-card-header">
                <h4 class="template-name" title="${template.name}">${template.name}</h4>
                <div class="template-actions">
                    <button class="icon-btn delete" title="Delete" onclick="window.templateUI.deleteTemplate('${template.id}', event)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
            <p class="template-desc">${template.description || 'No description'}</p>
            <div class="template-info">
                <span>${date}</span>
                <span class="template-tag">${template.tags[0] || 'Template'}</span>
            </div>
        `;
        return div;
    }

    async deleteTemplate(id, event) {
        event.stopPropagation(); // Prevent card click
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await this.services.deleteTemplate(id);
                this.renderGallery(); // Refresh
                if (window.showToast) window.showToast('Deleted', 'Template removed.', 'success');
            } catch (error) {
                console.error('Delete failed:', error);
            }
        }
    }

    applyTemplate(template) {
        // Dispatch custom event for app.js to catch
        const event = new CustomEvent('apply-template', { detail: template.content });
        window.dispatchEvent(event);

        this.closeModal('template-gallery-modal');
        if (window.showToast) window.showToast('Template Applied', `"${template.name}" loaded successfully.`, 'success');
    }
}


