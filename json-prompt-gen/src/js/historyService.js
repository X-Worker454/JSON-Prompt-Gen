class HistoryService {
    constructor() {
        this.STORAGE_KEY = 'json_prompt_gen_history';
        this.MAX_ITEMS = 50; // Cap to prevent localStorage bloat
    }

    /**
     * Save a generated JSON output to history
     * @param {Object} data - The JSON object to save
     * @param {string} mode - 'json' or 'ai'
     * @returns {Object} The saved entry
     */
    save(data, mode = 'json') {
        const history = this.getAll();

        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            timestamp: Date.now(),
            mode: mode,
            content: data,
            summary: this._generateSummary(data)
        };

        // Add to front
        history.unshift(entry);

        // Trim if needed
        if (history.length > this.MAX_ITEMS) {
            history.length = this.MAX_ITEMS;
        }

        this._persist(history);
        return entry;
    }

    /**
     * Retrieve all history items
     * @returns {Array} Sorted newest first
     */
    getAll() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Failed to load history:', e);
            return [];
        }
    }

    /**
     * Get a specific entry by ID
     * @param {string} id 
     */
    getById(id) {
        return this.getAll().find(item => item.id === id);
    }

    /**
     * Clear all history
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    /**
     * Delete a specific entry by ID
     * @param {string} id
     */
    delete(id) {
        let history = this.getAll();
        history = history.filter(item => item.id !== id);
        this._persist(history);
    }

    /**
     * Generate a simple diff string (HTML) between two JSON objects
     * Optimized for JSON formatting
     */
    getDiff(oldJson, newJson) {
        const oldStr = JSON.stringify(oldJson, null, 2);
        const newStr = JSON.stringify(newJson, null, 2);

        const oldLines = oldStr.split('\n');
        const newLines = newStr.split('\n');

        let html = '';
        let i = 0, j = 0;

        // Simple line-by-line diff (not a full LCS for performance/size)
        // This is a "Resilient" comparison that tries to match context

        while (i < oldLines.length || j < newLines.length) {
            const oldLine = oldLines[i];
            const newLine = newLines[j];

            if (oldLine === newLine) {
                // Unchanged
                html += `<div class="diff-line">${this._escapeHtml(oldLine || '')}</div>`;
                i++;
                j++;
            } else {
                // Change detected
                // Heuristic: Check if the new line appears later in old lines (deletion)
                // or if old line appears later in new lines (insertion)

                // For MVP, simplistic check:
                if (oldLine !== undefined) {
                    html += `<div class="diff-line diff-remove">- ${this._escapeHtml(oldLine)}</div>`;
                    i++;
                }
                if (newLine !== undefined) {
                    html += `<div class="diff-line diff-add">+ ${this._escapeHtml(newLine)}</div>`;
                    j++;
                }
            }
        }

        return html;
    }

    _generateSummary(data) {
        const sceneCount = data.scenes ? data.scenes.length : 0;
        const platforms = data.platform || 'Unknown';
        return `${sceneCount} Scene${sceneCount !== 1 ? 's' : ''} • ${platforms}`;
    }

    _persist(history) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.error('Failed to save history:', e);
            // Handle quota exceeded
            if (history.length > 1) {
                // Try removing last half
                const halved = history.slice(0, Math.floor(history.length / 2));
                this._persist(halved);
            }
        }
    }

    _escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}
