/**
 * PWAManager - Handles Progressive Web App functionality including service worker and installation
 */
class PWAManager {
    constructor() {
        this.installPrompt = null;
        this.isInstalled = false;
        this.serviceWorkerRegistration = null;
        this.onInstallPromptReady = null; // Callback when install prompt is available
        this.onInstalled = null; // Callback when app is installed
        this.onServiceWorkerReady = null; // Callback when service worker is ready
    }

    /**
     * Initialize PWA functionality
     */
    init() {
        console.log('Initializing PWA Manager...');
        
        this.registerServiceWorker();
        this.setupInstallPrompt();
        this.checkIfInstalled();
        
        console.log('PWA Manager initialized');
    }

    /**
     * Register service worker for offline functionality and caching
     */
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Worker not supported');
            return;
        }

        try {
            // Create service worker code inline
            const swCode = this.generateServiceWorkerCode();
            const blob = new Blob([swCode], { type: 'application/javascript' });
            const swUrl = URL.createObjectURL(blob);

            this.serviceWorkerRegistration = await navigator.serviceWorker.register(swUrl);
            console.log('Service Worker registered successfully');

            // Handle service worker updates
            this.serviceWorkerRegistration.addEventListener('updatefound', () => {
                console.log('Service Worker update found');
                this.handleServiceWorkerUpdate();
            });

            if (this.onServiceWorkerReady) {
                this.onServiceWorkerReady(this.serviceWorkerRegistration);
            }

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    /**
     * Generate service worker code for caching and offline functionality
     */
    generateServiceWorkerCode() {
        return `
            const CACHE_NAME = 'duck-collector-v1.0.0';
            const STATIC_ASSETS = [
                '/',
                '/index.html',
                '/debug.html',
                '/js/managers/ARManager.js',
                '/js/managers/CollectionManager.js',
                '/js/managers/DuckSpawner.js',
                '/js/managers/PWAManager.js'
            ];

            // Install event - cache static assets
            self.addEventListener('install', (event) => {
                console.log('Service Worker installing...');
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            console.log('Caching static assets');
                            return cache.addAll(STATIC_ASSETS);
                        })
                        .catch((error) => {
                            console.error('Failed to cache assets:', error);
                        })
                );
                self.skipWaiting();
            });

            // Activate event - clean up old caches
            self.addEventListener('activate', (event) => {
                console.log('Service Worker activating...');
                event.waitUntil(
                    caches.keys().then((cacheNames) => {
                        return Promise.all(
                            cacheNames.map((cacheName) => {
                                if (cacheName !== CACHE_NAME) {
                                    console.log('Deleting old cache:', cacheName);
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    })
                );
                self.clients.claim();
            });

            // Fetch event - serve from cache with network fallback
            self.addEventListener('fetch', (event) => {
                // Skip non-GET requests
                if (event.request.method !== 'GET') {
                    return;
                }

                // Skip external requests
                if (!event.request.url.startsWith(self.location.origin)) {
                    return;
                }

                event.respondWith(
                    caches.match(event.request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                // Serve from cache
                                return cachedResponse;
                            }

                            // Fetch from network and cache
                            return fetch(event.request)
                                .then((response) => {
                                    // Don't cache non-successful responses
                                    if (!response || response.status !== 200 || response.type !== 'basic') {
                                        return response;
                                    }

                                    // Clone response for caching
                                    const responseToCache = response.clone();
                                    caches.open(CACHE_NAME)
                                        .then((cache) => {
                                            cache.put(event.request, responseToCache);
                                        });

                                    return response;
                                })
                                .catch(() => {
                                    // Return offline page or default response
                                    if (event.request.destination === 'document') {
                                        return caches.match('/index.html');
                                    }
                                });
                        })
                );
            });

            // Background sync for offline data
            self.addEventListener('sync', (event) => {
                if (event.tag === 'duck-collection-sync') {
                    console.log('Background sync: duck collection');
                    event.waitUntil(syncDuckCollection());
                }
            });

            // Push notification handling
            self.addEventListener('push', (event) => {
                console.log('Push notification received');
                
                const options = {
                    body: event.data ? event.data.text() : 'New ducks are nearby!',
                    icon: '/icons/icon-192.png',
                    badge: '/icons/badge-72.png',
                    vibrate: [200, 100, 200],
                    data: {
                        url: '/'
                    }
                };

                event.waitUntil(
                    self.registration.showNotification('Duck Collector', options)
                );
            });

            // Notification click handling
            self.addEventListener('notificationclick', (event) => {
                console.log('Notification clicked');
                event.notification.close();

                event.waitUntil(
                    clients.openWindow(event.notification.data.url || '/')
                );
            });

            // Sync duck collection data
            async function syncDuckCollection() {
                try {
                    // This would sync with a backend server in a real app
                    console.log('Syncing duck collection data...');
                    // Implementation would go here
                } catch (error) {
                    console.error('Sync failed:', error);
                }
            }
        `;
    }

    /**
     * Setup install prompt handling
     */
    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (event) => {
            console.log('Install prompt available');
            event.preventDefault();
            this.installPrompt = event;
            
            if (this.onInstallPromptReady) {
                this.onInstallPromptReady();
            }
            
            this.showInstallPrompt();
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('App installed successfully');
            this.isInstalled = true;
            this.hideInstallPrompt();
            
            if (this.onInstalled) {
                this.onInstalled();
            }
        });

        // Setup install button click handler
        const installButton = document.getElementById('installButton');
        if (installButton) {
            installButton.addEventListener('click', () => {
                this.triggerInstall();
            });
        }
    }

    /**
     * Show install prompt to user
     */
    showInstallPrompt() {
        const installPromptElement = document.getElementById('installPrompt');
        if (installPromptElement && !this.isInstalled) {
            // Don't show immediately, wait for user engagement
            setTimeout(() => {
                if (this.shouldShowInstallPrompt()) {
                    installPromptElement.style.display = 'block';
                }
            }, 30000); // Wait 30 seconds
        }
    }

    /**
     * Hide install prompt
     */
    hideInstallPrompt() {
        const installPromptElement = document.getElementById('installPrompt');
        if (installPromptElement) {
            installPromptElement.style.display = 'none';
        }
    }

    /**
     * Trigger app installation
     */
    async triggerInstall() {
        if (!this.installPrompt) {
            console.log('Install prompt not available');
            return false;
        }

        try {
            // Show the install prompt
            this.installPrompt.prompt();
            
            // Wait for user choice
            const choiceResult = await this.installPrompt.userChoice;
            console.log('Install choice:', choiceResult.outcome);
            
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted install');
            } else {
                console.log('User dismissed install');
            }
            
            // Clear the prompt
            this.installPrompt = null;
            this.hideInstallPrompt();
            
            return choiceResult.outcome === 'accepted';
            
        } catch (error) {
            console.error('Install failed:', error);
            return false;
        }
    }

    /**
     * Check if app is already installed
     */
    checkIfInstalled() {
        // Check if running in standalone mode
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('App is running in standalone mode');
        }

        // Check if running as PWA on iOS
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('App is running as PWA on iOS');
        }
    }

    /**
     * Determine if install prompt should be shown
     */
    shouldShowInstallPrompt() {
        // Don't show if already installed
        if (this.isInstalled) {
            return false;
        }

        // Don't show if user has dismissed it recently
        const dismissedTime = localStorage.getItem('installPromptDismissed');
        if (dismissedTime) {
            const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
            if (daysSinceDismissed < 7) { // Don't show for 7 days after dismissal
                return false;
            }
        }

        // Show if user has engaged with the app
        const duckCount = JSON.parse(localStorage.getItem('collectedDucks') || '[]').length;
        return duckCount >= 2; // Show after collecting 2 ducks
    }

    /**
     * Handle service worker updates
     */
    handleServiceWorkerUpdate() {
        const newWorker = this.serviceWorkerRegistration.installing;
        
        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.showUpdateNotification();
            }
        });
    }

    /**
     * Show update notification to user
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(37, 99, 235, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        notification.innerHTML = `
            <div>App update available!</div>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #2563eb;
                border: none;
                padding: 5px 15px;
                border-radius: 15px;
                margin-left: 10px;
                cursor: pointer;
            ">Update</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 10000);
    }

    /**
     * Request notification permission
     */
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            console.log('Notifications not supported');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            return false;
        }

        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }

    /**
     * Show local notification
     */
    showNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            console.log('Notification permission not granted');
            return;
        }

        const defaultOptions = {
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            vibrate: [200, 100, 200]
        };

        new Notification(title, { ...defaultOptions, ...options });
    }

    /**
     * Register for push notifications
     */
    async registerPushNotifications() {
        if (!this.serviceWorkerRegistration) {
            console.log('Service Worker not registered');
            return false;
        }

        try {
            const subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: this.urlBase64ToUint8Array('your-vapid-public-key-here')
            });

            console.log('Push subscription:', subscription);
            // Send subscription to server
            return subscription;
            
        } catch (error) {
            console.error('Push subscription failed:', error);
            return false;
        }
    }

    /**
     * Convert VAPID key for push notifications
     */
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    /**
     * Get PWA installation status
     */
    getInstallationStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: !!this.installPrompt,
            serviceWorkerReady: !!this.serviceWorkerRegistration
        };
    }

    /**
     * Set callback for install prompt ready
     */
    setInstallPromptReadyCallback(callback) {
        this.onInstallPromptReady = callback;
    }

    /**
     * Set callback for app installed
     */
    setInstalledCallback(callback) {
        this.onInstalled = callback;
    }

    /**
     * Set callback for service worker ready
     */
    setServiceWorkerReadyCallback(callback) {
        this.onServiceWorkerReady = callback;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWAManager;
}