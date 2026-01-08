class DictionaryService {
    constructor() {
        this.data = null;
        this.categories = [];
        this.userCategories = [];
        this.isInitialized = false;
        this.USER_DATA_KEY = 'user_cinematic_terms';
    }

    async init() {
        if (this.isInitialized) return;
        if (this.loadingPromise) return this.loadingPromise;

        this.loadingPromise = (async () => {
            try {
                const response = await fetch('src/data/dictionary.json');
                if (!response.ok) throw new Error('Failed to load dictionary data');

                this.data = await response.json();
                this.categories = [...this.data.categories];

                // Load user-contributed data from localStorage
                this.loadUserData();

                this.isInitialized = true;
                this.loadingPromise = null;
                // DictionaryService initialized
            } catch (error) {
                console.error('DictionaryService Error:', error);
                this.loadingPromise = null;
                throw error;
            }
        })();

        return this.loadingPromise;
    }

    // Load user data from localStorage
    loadUserData() {
        try {
            const stored = localStorage.getItem(this.USER_DATA_KEY);
            if (stored) {
                const userData = JSON.parse(stored);
                // Clear existing state before re-loading to prevent double merges
                this.userCategories = userData.categories || [];

                this.userCategories.forEach(userCat => {
                    const existingCat = this.categories.find(c => c.id === userCat.id);
                    if (existingCat) {
                        // Avoid duplicates if terms already exist (system terms shouldn't overlap but user terms might)
                        userCat.terms.forEach(term => {
                            if (!existingCat.terms.find(t => t.id === term.id)) {
                                existingCat.terms.push(term);
                            }
                        });
                    } else {
                        // Add new category
                        this.categories.push(userCat);
                    }
                });
            }
        } catch (e) {
            console.error('Error loading user data:', e);
        }
    }

    // Save user data to localStorage
    saveUserData() {
        try {
            localStorage.setItem(this.USER_DATA_KEY, JSON.stringify({
                categories: this.userCategories
            }));
        } catch (e) {
            console.error('Error saving user data:', e);
        }
    }

    getAllCategories() {
        return this.categories;
    }

    getTermsByCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        return category ? category.terms : [];
    }

    searchTerm(query) {
        if (!query || !this.isInitialized) return [];

        const lowerQuery = query.toLowerCase().trim();
        const results = [];

        this.categories.forEach(category => {
            const matchingTerms = category.terms.filter(term =>
                term.name.toLowerCase().includes(lowerQuery) ||
                term.definition.toLowerCase().includes(lowerQuery)
            );

            if (matchingTerms.length > 0) {
                results.push({
                    categoryName: category.name,
                    categoryId: category.id,
                    terms: matchingTerms
                });
            }
        });

        return results;
    }

    // Add a new category (user-generated)
    addCategory(categoryData) {
        // Check if category already exists
        const existing = this.categories.find(c => c.id === categoryData.id);
        if (existing) {
            console.warn('Category already exists:', categoryData.id);
            return false;
        }

        const newCategory = {
            id: categoryData.id,
            name: categoryData.name,
            author: categoryData.author || 'Anonymous',
            terms: categoryData.terms || []
        };

        this.categories.push(newCategory);

        // Track in user data
        this.userCategories.push(newCategory);
        this.saveUserData();

        return true;
    }

    // Add a term to a category
    addTerm(categoryId, termData) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) {
            console.error('Category not found:', categoryId);
            return false;
        }

        const newTerm = {
            id: termData.id || 'user_' + Date.now(),
            name: termData.name,
            definition: termData.definition,
            difficulty: termData.difficulty || 'beginner',
            examples: termData.examples || [],
            author: termData.author || 'Anonymous',
            likes: termData.likes || 0
        };

        category.terms.push(newTerm);

        // Track in user data - only if this is NOT a shared reference already
        // (if it's a user category, category and userCat are the same object)
        let userCat = this.userCategories.find(c => c.id === categoryId);
        if (!userCat) {
            // Create tracking entry for existing system category
            userCat = { id: categoryId, name: category.name, terms: [] };
            this.userCategories.push(userCat);
        }

        // Push only if they aren't the same object to avoid duplication
        if (userCat.terms !== category.terms) {
            userCat.terms.push(newTerm);
        }
        this.saveUserData();

        return true;
    }

    // Delete a user-contributed term
    deleteTerm(categoryId, termId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return false;

        const termIndex = category.terms.findIndex(t => t.id === termId);
        if (termIndex > -1) {
            category.terms.splice(termIndex, 1);

            // Also remove from user data
            const userCat = this.userCategories.find(c => c.id === categoryId);
            if (userCat) {
                const userTermIndex = userCat.terms.findIndex(t => t.id === termId);
                if (userTermIndex > -1) {
                    userCat.terms.splice(userTermIndex, 1);
                }
            }
            this.saveUserData();
            return true;
        }
        return false;
    }

    // Edit/Update a user-contributed term
    editTerm(categoryId, termId, updatedData) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return false;

        const term = category.terms.find(t => t.id === termId);
        if (!term) return false;

        // Update term properties
        Object.assign(term, {
            name: updatedData.name || term.name,
            definition: updatedData.definition || term.definition,
            difficulty: updatedData.difficulty || term.difficulty,
            examples: updatedData.examples || term.examples,
            author: updatedData.author || term.author
        });

        // Also update in user data
        const userCat = this.userCategories.find(c => c.id === categoryId);
        if (userCat) {
            const userTerm = userCat.terms.find(t => t.id === termId);
            if (userTerm) {
                Object.assign(userTerm, {
                    name: updatedData.name || userTerm.name,
                    definition: updatedData.definition || userTerm.definition,
                    difficulty: updatedData.difficulty || userTerm.difficulty,
                    examples: updatedData.examples || userTerm.examples,
                    author: updatedData.author || userTerm.author
                });
            }
        }
        this.saveUserData();
        return true;
    }

    // Delete a user-created category and all its terms
    deleteCategory(categoryId) {
        // Only allow deletion of user-created categories
        const userCatIndex = this.userCategories.findIndex(c => c.id === categoryId && categoryId.startsWith('user_'));
        if (userCatIndex === -1) {
            console.warn('Cannot delete system category:', categoryId);
            return false;
        }

        // Remove from main categories
        const catIndex = this.categories.findIndex(c => c.id === categoryId);
        if (catIndex > -1) {
            this.categories.splice(catIndex, 1);
        }

        // Remove from user categories
        this.userCategories.splice(userCatIndex, 1);
        this.saveUserData();
        return true;
    }

    // Get a specific term by ID across all categories
    getTermById(termId) {
        for (const category of this.categories) {
            const term = category.terms.find(t => t.id === termId);
            if (term) {
                return { term, categoryId: category.id };
            }
        }
        return null;
    }

    // Check if a term is user-created
    isUserCreated(termId) {
        return termId && termId.startsWith('user_');
    }

    // Check if a category is user-created
    isCategoryUserCreated(categoryId) {
        return categoryId && categoryId.startsWith('user_');
    }
}

// Export for module usage or attach to window
window.DictionaryService = DictionaryService;
