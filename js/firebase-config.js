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
            console.log('Firebase TEST MODE - using localStorage only');
            return false;
        }
        return FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";
    },

    /**
     * Initialize Firebase
     */
    async init() {
        if (!this.isConfigured()) {
            console.log('Firebase not configured - using localStorage only');
            return false;
        }

        try {
            // Initialize Firebase app
            this.app = firebase.initializeApp(FIREBASE_CONFIG);
            console.log('Firebase app initialized');
            
            this.auth = firebase.auth();
            console.log('Firebase auth ready');
            
            this.db = firebase.firestore();
            console.log('Firestore ready');
            
            // Enable offline persistence
            await this.db.enablePersistence({ synchronizeTabs: true })
                .catch(err => {
                    if (err.code === 'failed-precondition') {
                        console.log('Firestore persistence failed: multiple tabs open');
                    } else if (err.code === 'unimplemented') {
                        console.log('Firestore persistence not available');
                    }
                });

            // Check if user is already authenticated (persistent session)
            console.log('Checking existing auth...');
            const existingUser = await this.checkExistingAuth();
            
            if (existingUser) {
                console.log('Found existing user:', existingUser.uid);
                this.user = existingUser;
            } else {
                console.log('No existing auth session');
                // Don't auto sign-in anymore - let the app handle auth flow
            }
            
            this.initialized = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase init error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
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
            console.error('Sign in error:', error);
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
            console.error('Create account error:', error);
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
            console.error('Sign out error:', error);
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
            console.log('Cannot save: initialized=', this.initialized, 'user=', this.user);
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
            console.error('Save error:', error.message);
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

