/**
 * Main Application Controller - Coordinates all managers and handles UI updates
 */
class DuckCollectorApp {
    constructor() {
        // Initialize managers
        this.arManager = new ARManager();
        this.collectionManager = new CollectionManager();
        this.duckSpawner = new DuckSpawner();
        this.pwaManager = new PWAManager();
        
        // App state
        this.isInitialized = false;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing Duck Collector App...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize all managers
            await this.initializeManagers();
            
            // Setup UI
            this.setupUI();
            
            // Setup manager callbacks
            this.setupCallbacks();
            
            // Start demo duck spawning
            this.startDemoMode();
            
            this.isInitialized = true;
            console.log('Duck Collector App initialized successfully');
            
            // Hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
        } catch (error) {
            console.error('App initialization failed:', error);
            this.showErrorScreen(error);
        }
    }

    /**
     * Initialize all managers
     */
    async initializeManagers() {
        // Initialize collection manager first (loads saved data)
        this.collectionManager.init();
        
        // Initialize duck spawner
        this.duckSpawner.init();
        
        // Initialize AR manager
        const arInitialized = this.arManager.init();
        if (!arInitialized) {
            console.warn('AR functionality not available');
        }
        
        // Initialize PWA manager
        this.pwaManager.init();
    }

    /**
     * Setup UI elements and initial display
     */
    setupUI() {
        this.updatePointsDisplay();
        this.renderDuckCollection();
        this.setupEventListeners();
    }

    /**
     * Setup callbacks between managers
     */
    setupCallbacks() {
        // Collection manager callbacks
        this.collectionManager.setPointsUpdatedCallback((points) => {
            this.updatePointsDisplay();
            this.checkForRewards(points);
        });
        
        this.collectionManager.setDuckCollectedCallback((duck) => {
            this.renderDuckCollection();
            this.showCollectionPopup(duck.type);
        });
        
        this.collectionManager.setAchievementUnlockedCallback((achievement) => {
            this.showAchievementPopup(achievement);
        });

        // Duck spawner callbacks
        this.duckSpawner.setDuckSpawnedCallback((duck) => {
            if (duck.isDemo) {
                // For demo ducks, directly collect them
                this.collectionManager.collectDuck(duck.type);
                this.showDuckFoundNotification();
            } else {
                // For AR ducks, show notification
                this.showDuckSpottedNotification();
            }
        });

        // AR manager callbacks
        this.arManager.setDuckCollectedCallback((duckType) => {
            this.collectionManager.collectDuck(duckType);
        });

        // PWA manager callbacks
        this.pwaManager.setInstallPromptReadyCallback(() => {
            console.log('Install prompt is ready');
        });
        
        this.pwaManager.setInstalledCallback(() => {
            this.showInstallSuccessNotification();
        });
    }

    /**
     * Setup event listeners for UI elements
     */
    setupEventListeners() {
        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.handleGlobalError(e);
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.handleAppHidden();
            } else {
                this.handleAppVisible();
            }
        });
    }

    /**
     * Update points display in UI
     */
    updatePointsDisplay() {
        const points = this.collectionManager.getPoints();
        const pointsElement = document.getElementById('pointsCount');
        const progressElement = document.getElementById('progressFill');
        
        if (pointsElement) {
            pointsElement.textContent = points;
        }
        
        if (progressElement) {
            const progress = (points % 100) / 100 * 100;
            progressElement.style.width = progress + '%';
        }
    }

    /**
     * Render duck collection display
     */
    renderDuckCollection() {
        const container = document.getElementById('duckCollection');
        if (!container) return;

        const ducks = this.collectionManager.getDucks();
        container.innerHTML = '';

        // Show collected ducks and empty slots
        for (let i = 0; i < Math.max(12, ducks.length); i++) {
            const slot = document.createElement('div');
            slot.className = 'duck-slot';

            if (i < ducks.length) {
                const duck = ducks[i];
                slot.textContent = duck.emoji;
                slot.className += ' collected';
                slot.title = `${duck.name} - ${duck.points} points`;

                if (duck.isNew) {
                    slot.className += ' new';
                    // Mark as viewed after animation
                    setTimeout(() => {
                        duck.isNew = false;
                        this.collectionManager.saveData();
                    }, 600);
                }
            } else {
                slot.textContent = '?';
                slot.title = 'Undiscovered duck';
            }

            container.appendChild(slot);
        }
    }

    /**
     * Start demo mode with periodic duck spawning
     */
    startDemoMode() {
        // Spawn initial ducks if collection is empty
        setTimeout(() => {
            const ducks = this.collectionManager.getDucks();
            if (ducks.length < 2) {
                this.duckSpawner.spawnDemoDuck();
            }
        }, 3000);

        // Start periodic demo spawning
        setInterval(() => {
            const ducks = this.collectionManager.getDucks();
            if (ducks.length < 8 && Math.random() < 0.3) {
                this.duckSpawner.spawnDemoDuck();
            }
        }, 10000);
    }

    /**
     * Check for rewards based on points
     */
    checkForRewards(points) {
        if (points >= 100 && points % 100 === 0) {
            this.showRewardPopup();
        }
    }

    /**
     * Show reward popup
     */
    showRewardPopup() {
        const rewards = [
            'Free Coffee!',
            '20% Off Next Purchase',
            'Free Dessert!',
            'Double Points Next Visit',
            'VIP Access for a Day'
        ];

        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        const rewardElement = document.getElementById('rewardText');
        const popupElement = document.getElementById('rewardPopup');
        
        if (rewardElement && popupElement) {
            rewardElement.textContent = `You've earned: ${randomReward}`;
            popupElement.style.display = 'block';
        }
    }

    /**
     * Show collection popup when duck is collected
     */
    showCollectionPopup(duckType) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ffeb3b, #ffc107);
            color: #333;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 2000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: popIn 0.5s ease-out;
            max-width: 300px;
        `;

        popup.innerHTML = `
            <div style="font-size: 4em; margin-bottom: 15px;">${duckType.emoji}</div>
            <h2 style="margin: 0 0 10px 0; color: #333;">Duck Collected!</h2>
            <p style="margin: 0 0 15px 0; font-size: 1.2em; font-weight: bold;">
                ${duckType.name}<br>
                +${duckType.points} points
            </p>
            <button onclick="this.parentNode.remove()" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 1em;
            ">Awesome!</button>
        `;

        document.body.appendChild(popup);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.animation = 'popOut 0.3s ease-in';
                setTimeout(() => {
                    if (popup.parentNode) {
                        popup.parentNode.removeChild(popup);
                    }
                }, 300);
            }
        }, 4000);
    }

    /**
     * Show achievement popup
     */
    showAchievementPopup(achievement) {
        const popup = document.createElement('div');
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
            z-index: 2000;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            animation: popIn 0.5s ease-out;
            max-width: 300px;
        `;

        popup.innerHTML = `
            <div style="font-size: 4em; margin-bottom: 15px;">${achievement.icon}</div>
            <h2 style="margin: 0 0 10px 0;">Achievement Unlocked!</h2>
            <h3 style="margin: 0 0 10px 0;">${achievement.name}</h3>
            <p style="margin: 0 0 15px 0;">${achievement.description}</p>
            <button onclick="this.parentNode.remove()" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 1em;
            ">Great!</button>
        `;

        document.body.appendChild(popup);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (popup.parentNode) {
                popup.style.animation = 'popOut 0.3s ease-in';
                setTimeout(() => {
                    if (popup.parentNode) {
                        popup.parentNode.removeChild(popup);
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Show duck found notification
     */
    showDuckFoundNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 235, 59, 0.95);
            color: #333;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 1000;
            animation: slideDown 0.5s ease-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        notification.textContent = '🐥 A wild rubber duck appeared nearby!';
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.5s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 3000);
    }

    /**
     * Show duck spotted notification (for AR mode)
     */
    showDuckSpottedNotification() {
        // This would be used when AR detects a duck
        console.log('Duck spotted in AR!');
    }

    /**
     * Show install success notification
     */
    showInstallSuccessNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(76, 175, 80, 0.95);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 1000;
            animation: slideDown 0.5s ease-out;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        notification.textContent = '✅ App installed successfully!';
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    /**
     * Show error screen
     */
    showErrorScreen(error) {
        document.body.innerHTML = `
            <div style="padding:20px;color:white;background:#333;min-height:100vh;">
                <h1>🦆 Duck Collector - Error</h1>
                <p><strong>Error:</strong> ${error.message}</p>
                <p><strong>User Agent:</strong> ${navigator.userAgent}</p>
                <p><strong>Location:</strong> ${window.location.href}</p>
                <button onclick="window.location.reload()" style="
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Reload App</button>
            </div>
        `;
    }

    /**
     * Handle global errors
     */
    handleGlobalError(error) {
        // Create error notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            background: red;
            color: white;
            padding: 10px;
            z-index: 9999;
            width: 100%;
            text-align: center;
        `;
        notification.textContent = `Error: ${error.message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    /**
     * Handle app becoming hidden (backgrounded)
     */
    handleAppHidden() {
        console.log('App hidden');
        // Pause non-essential operations
        if (this.arManager.isActive()) {
            // Don't stop AR automatically, let user control it
        }
    }

    /**
     * Handle app becoming visible (foregrounded)
     */
    handleAppVisible() {
        console.log('App visible');
        // Resume operations if needed
    }

    /**
     * Get app statistics
     */
    getStats() {
        return {
            collection: this.collectionManager.getStats(),
            spawner: this.duckSpawner.getSpawnStats(),
            pwa: this.pwaManager.getInstallationStatus(),
            ar: {
                isActive: this.arManager.isActive()
            }
        };
    }
}

// Global function to close reward popup (called from HTML)
function closeRewardPopup() {
    const popup = document.getElementById('rewardPopup');
    if (popup) {
        popup.style.display = 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Duck Collector App...');
    
    // Create global app instance
    window.duckCollectorApp = new DuckCollectorApp();
    
    // Initialize the app
    window.duckCollectorApp.init().catch(error => {
        console.error('Failed to initialize app:', error);
    });
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuckCollectorApp;
}