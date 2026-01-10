/**
 * Crypto Utilities for Secure Key Management
 * Uses Web Crypto API (AES-GCM) for client-side encryption
 */

const CryptoUtils = {
    // Configuration
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256,
    IV_LENGTH: 12,
    SALT_LENGTH: 16,
    ITERATIONS: 100000,

    /**
     * Derive a cryptographic key from a password using PBKDF2
     * @param {string} password - User's master password
     * @param {Uint8Array} salt - Random salt for key derivation
     * @returns {Promise<CryptoKey>} - Derived AES key
     */
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.ITERATIONS,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: this.ALGORITHM, length: this.KEY_LENGTH },
            false,
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Encrypt plaintext data
     * @param {string} plaintext - Data to encrypt
     * @param {string} password - Master password for encryption
     * @returns {Promise<string>} - Base64 encoded encrypted data (salt:iv:ciphertext)
     */
    async encrypt(plaintext, password) {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
        const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
        const key = await this.deriveKey(password, salt);

        const ciphertext = await crypto.subtle.encrypt(
            { name: this.ALGORITHM, iv: iv },
            key,
            encoder.encode(plaintext)
        );

        // Combine salt + iv + ciphertext into single array
        const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

        return this.arrayBufferToBase64(combined);
    },

    /**
     * Decrypt encrypted data
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @param {string} password - Master password for decryption
     * @returns {Promise<string>} - Decrypted plaintext
     */
    async decrypt(encryptedData, password) {
        const decoder = new TextDecoder();
        const combined = this.base64ToArrayBuffer(encryptedData);

        const salt = combined.slice(0, this.SALT_LENGTH);
        const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
        const ciphertext = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

        const key = await this.deriveKey(password, salt);

        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: this.ALGORITHM, iv: iv },
                key,
                ciphertext
            );
            return decoder.decode(decrypted);
        } catch (e) {
            throw new Error('Decryption failed. Invalid password or corrupted data.');
        }
    },

    /**
     * Generate a device-specific fingerprint for passwordless encryption
     * Falls back to a fixed salt if fingerprinting fails
     * @returns {Promise<string>} - Device fingerprint hash
     */
    async getDeviceFingerprint() {
        try {
            const components = [
                navigator.userAgent,
                navigator.language,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset().toString(),
                navigator.hardwareConcurrency?.toString() || 'unknown'
            ];
            const fingerprint = components.join('|');
            const encoder = new TextEncoder();
            const hash = await crypto.subtle.digest('SHA-256', encoder.encode(fingerprint));
            return this.arrayBufferToBase64(new Uint8Array(hash));
        } catch (e) {
            // Fallback to a fixed but unique per-origin salt
            return 'default_device_salt_' + window.location.origin;
        }
    },

    // Utility: ArrayBuffer to Base64
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    // Utility: Base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }
};

// Export for module usage or attach to window
window.CryptoUtils = CryptoUtils;
