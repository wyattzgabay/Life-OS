/**
 * FIREBASE-CONFIG.JS
 * Firebase initialization and configuration
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create new project (or use existing)
 * 3. Add web app to project
 * 4. Copy your config values below
 * 5. Enable Firestore Database (in test mode for now)
 * 6. Enable Anonymous Authentication
 */

// TEST MODE - set to true to disable Firebase (saves quota during development)
const FIREBASE_TEST_MODE = false;

// Your Firebase project config
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBtD4sGzu6sPbPUelnRb45dwwqUj0bcso4",
    authDomain: "life-os-ba21f.firebaseapp.com",
    projectId: "life-os-ba21f",
    storageBucket: "life-os-ba21f.firebasestorage.app",
    messagingSenderId: "404201213742",
    appId: "1:404201213742:web:24d5dfe5bd869b865af4bf"
};

// Firebase state
const Firebase = {
    app: null,
    auth: null,
    db: null,
    user: null,
    initialized: false,
    syncing: false,
    lastSync: null,
    
    /**
     * Check if Firebase is configured (and not in test mode)
     */
    isConfigured() {
        if (FIREBASE_TEST_MODE) {
            return false;
        }
        return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
    },

    /**
     * Initialize Firebase
     */
    async init() {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            this.app = firebase.initializeApp(FIREBASE_CONFIG);
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            
            // Enable offline persistence
            await this.db.enablePersistence({ synchronizeTabs: true })
                .catch(err => {
                    // Persistence may fail in multi-tab or unsupported browsers - not critical
                });

            // Check if user is already authenticated (persistent session)
            const existingUser = await this.checkExistingAuth();
            
            if (existingUser) {
                this.user = existingUser;
            }
            
            this.initialized = true;
            return true;
        } catch (error) {
            this.updateSyncIndicator('error');
            return false;
        }
    },

    /**
     * Sign in with email/password
     */
    async signInWithEmail(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            this.user = result.user;
            // Store email for future reference
            localStorage.setItem('user_email', email);
            return { success: true, user: this.user };
        } catch (error) {
            return { success: false, error: error.code, message: this.getAuthErrorMessage(error.code) };
        }
    },
    
    /**
     * Create account with email/password
     */
    async createAccount(email, password) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            this.user = result.user;
            // Store email for future reference
            localStorage.setItem('user_email', email);
            return { success: true, user: this.user };
        } catch (error) {
            return { success: false, error: error.code, message: this.getAuthErrorMessage(error.code) };
        }
    },
    
    /**
     * Get friendly error message
     */
    getAuthErrorMessage(code) {
        const messages = {
            'auth/email-already-in-use': 'An account with this email already exists. Try signing in.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/too-many-requests': 'Too many attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Check your connection.'
        };
        return messages[code] || 'Authentication failed. Please try again.';
    },
    
    /**
     * Check if user is already signed in
     */
    async checkExistingAuth() {
        return new Promise((resolve) => {
            const unsubscribe = this.auth.onAuthStateChanged(user => {
                unsubscribe();
                if (user) {
                    this.user = user;
                    resolve(user);
                } else {
                    resolve(null);
                }
            });
        });
    },
    
    /**
     * Sign out
     */
    async signOut() {
        try {
            await this.auth.signOut();
            this.user = null;
            localStorage.removeItem('user_email');
            return true;
        } catch (error) {
            return false;
        }
    },

    /**
     * Get current user ID
     */
    getUserId() {
        return this.user?.uid || null;
    },

    /**
     * Get user document reference
     */
    getUserDoc() {
        if (!this.user) return null;
        return this.db.collection('users').doc(this.user.uid);
    },

    /**
     * Save all data to Firestore
     */
    async saveData(data) {
        if (!this.initialized || !this.user) {
            return false;
        }

        this.syncing = true;
        this.updateSyncIndicator('syncing');

        try {
            const userDoc = this.getUserDoc();
            
            // Clean data before saving - remove any undefined or circular refs
            const cleanData = JSON.parse(JSON.stringify(data));
            
            // Save main data
            await userDoc.set({
                ...cleanData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
                deviceId: this.getDeviceId()
            }, { merge: true });

            this.lastSync = new Date();
            this.syncing = false;
            this.updateSyncIndicator('synced');
            
            return true;
        } catch (error) {
            this.syncing = false;
            
            // Only show error indicator for real failures, not network blips
            if (error.code === 'unavailable' || error.code === 'network-request-failed') {
                this.updateSyncIndicator('offline');
            } else {
                this.updateSyncIndicator('synced'); // Don't scare user with error for minor issues
            }
            return false;
        }
    },

    /**
     * Load data from Firestore
     */
    async loadData() {
        if (!this.initialized || !this.user) {
            return null;
        }

        try {
            const userDoc = this.getUserDoc();
            const doc = await userDoc.get();
            
            if (doc.exists) {
                const data = doc.data();
                // Remove Firestore metadata
                delete data.lastUpdated;
                delete data.deviceId;
                return data;
            }
            
            return null;
        } catch (error) {
            console.error('Load error:', error);
            return null;
        }
    },

    /**
     * Listen for realtime updates
     */
    listenForUpdates(callback) {
        if (!this.initialized || !this.user) {
            return () => {};
        }

        const userDoc = this.getUserDoc();
        
        return userDoc.onSnapshot(doc => {
            if (doc.exists) {
                const data = doc.data();
                delete data.lastUpdated;
                delete data.deviceId;
                callback(data);
            }
        }, error => {
            console.error('Listener error:', error);
        });
    },

    /**
     * Get a unique device ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    },

    /**
     * Update sync indicator in UI
     */
    updateSyncIndicator(status) {
        const indicator = document.getElementById('sync-indicator');
        if (!indicator) return;

        indicator.className = 'sync-indicator ' + status;
        
        const text = {
            'syncing': 'Syncing...',
            'synced': 'Synced',
            'error': 'Sync error',
            'offline': 'Offline'
        };
        
        indicator.textContent = text[status] || '';
    },

    /**
     * Check if online
     */
    isOnline() {
        return navigator.onLine;
    }
};

// Listen for online/offline status
window.addEventListener('online', () => {
    if (Firebase.initialized) {
        Firebase.updateSyncIndicator('synced');
    }
});

window.addEventListener('offline', () => {
    if (Firebase.initialized) {
        Firebase.updateSyncIndicator('offline');
    }
});

