/*
 * TemplateService - Manages IndexedDB storage for Prompt Templates
 * Handles CRUD operations, schema management, and data persistence.
 */
export class TemplateService {
    constructor() {
        this.dbName = 'JsonPromptGenDB';
        this.storeName = 'templates';
        this.dbVersion = 1;
        this.db = null;
        this.initPromise = this.initDB();
    }

    /**
     * Initialize the IndexedDB connection
     */
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('TemplateService: Database error', event.target.error);
                reject('Database error: ' + event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                // Database initialized
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    // Create indexes for searching/sorting
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
                    objectStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
                    // Object store created
                }
            };
        });
    }

    /**
     * Ensure DB is initialized before performing operations
     */
    async getDB() {
        if (!this.db) {
            await this.initPromise;
        }
        return this.db;
    }

    /**
     * Save a template (Create or Update)
     * @param {Object} templateData 
     * @returns {Promise<Object>} The saved template object
     */
    async saveTemplate(templateData) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);

            const template = {
                id: templateData.id || crypto.randomUUID(),
                name: templateData.name || 'Untitled Template',
                description: templateData.description || '',
                content: templateData.content || {}, // The actual prompt form data
                tags: templateData.tags || [],
                createdAt: templateData.createdAt || Date.now(),
                updatedAt: Date.now(),
                usageCount: templateData.usageCount || 0
            };

            const request = store.put(template);

            request.onsuccess = () => {
                resolve(template);
            };

            request.onerror = (event) => {
                reject('Error saving template: ' + event.target.error);
            };
        });
    }

    /**
     * Get a specific template by ID
     * @param {string} id 
     * @returns {Promise<Object>}
     */
    async getTemplate(id) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                reject('Error fetching template: ' + event.target.error);
            };
        });
    }

    /**
     * Get all templates, sorted by updatedAt desc
     * @returns {Promise<Array>}
     */
    async getAllTemplates() {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('updatedAt');
            const request = index.openCursor(null, 'prev'); // Descending order
            const templates = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    templates.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(templates);
                }
            };

            request.onerror = (event) => {
                reject('Error fetching all templates: ' + event.target.error);
            };
        });
    }

    /**
     * Delete a template by ID
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async deleteTemplate(id) {
        const db = await this.getDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve(true);
            };

            request.onerror = (event) => {
                reject('Error deleting template: ' + event.target.error);
            };
        });
    }
}


