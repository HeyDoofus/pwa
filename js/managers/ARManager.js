/**
 * ARManager - Handles all AR functionality including camera access, scene management, and AR interactions
 */
class ARManager {
    constructor() {
        this.isARActive = false;
        this.duckSpawnTimer = null;
        this.arScene = null;
        this.arOverlay = null;
        this.closeButton = null;
        this.mainApp = null;
        this.onDuckCollected = null; // Callback for when duck is collected
    }

    /**
     * Initialize AR components and event listeners
     */
    init() {
        console.log('Initializing AR Manager...');
        
        this.arScene = document.getElementById('arScene');
        this.arOverlay = document.getElementById('arOverlay');
        this.closeButton = document.getElementById('closeAR');
        this.mainApp = document.getElementById('mainApp');

        // Check if AR libraries are loaded
        if (typeof AFRAME === 'undefined') {
            console.warn('AR libraries not loaded, disabling AR features');
            this.disableAR();
            return false;
        }

        this.setupEventListeners();
        console.log('AR Manager initialized successfully');
        return true;
    }

    /**
     * Set up event listeners for AR interactions
     */
    setupEventListeners() {
        const startARButton = document.getElementById('startAR');
        
        startARButton.addEventListener('click', () => this.startAR());
        this.closeButton.addEventListener('click', () => this.stopAR());
        
        // Touch/click detection for AR duck collection
        this.arScene.addEventListener('click', (event) => {
            if (this.isARActive) {
                this.handleARInteraction(event);
            }
        });
    }

    /**
     * Start AR session with camera access
     */
    async startAR() {
        try {
            console.log('Starting AR session...');
            
            // Request camera permission
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 480 },
                    height: { ideal: 360 }
                }
            });

            // Stop the stream immediately as AR.js will handle it
            stream.getTracks().forEach(track => track.stop());

            this.isARActive = true;
            this.showARInterface();

            // Wait for AR scene to initialize
            setTimeout(() => {
                this.startDuckHunt();
            }, 1000);

        } catch (error) {
            console.error('Camera access error:', error);
            this.handleCameraError(error);
        }
    }

    /**
     * Stop AR session and clean up resources
     */
    stopAR() {
        console.log('Stopping AR session...');
        
        this.isARActive = false;
        this.clearDuckSpawnTimer();
        this.stopCameraStreams();
        this.hideARInterface();
    }

    /**
     * Show AR interface elements
     */
    showARInterface() {
        this.arScene.style.display = 'block';
        this.arOverlay.style.display = 'block';
        this.closeButton.style.display = 'block';
        this.mainApp.style.display = 'none';
    }

    /**
     * Hide AR interface elements
     */
    hideARInterface() {
        this.arScene.style.display = 'none';
        this.arOverlay.style.display = 'none';
        this.closeButton.style.display = 'none';
        this.mainApp.style.display = 'block';
    }

    /**
     * Start duck hunting session with periodic duck spawning
     */
    startDuckHunt() {
        console.log('Starting duck hunt...');
        this.updateARInstructions('Looking for ducks...');

        // Simulate duck appearances
        this.duckSpawnTimer = setInterval(() => {
            if (this.isARActive && Math.random() < 0.2) {
                this.showDuckSpotted();
            }
        }, 5000);
    }

    /**
     * Handle AR interaction (tap/click) events
     */
    handleARInteraction(event) {
        const randomChance = Math.random();
        
        if (randomChance < 0.3) { // 30% chance to find a duck
            if (this.onDuckCollected) {
                const duckType = this.getDuckByRarity();
                this.onDuckCollected(duckType);
                
                // Visual feedback
                this.updateARInstructions(`Found a ${duckType.name}! Keep looking for more...`);
                
                setTimeout(() => {
                    if (this.isARActive) {
                        this.updateARInstructions('Looking for ducks...');
                    }
                }, 2000);
            }
        }
    }

    /**
     * Show duck spotted notification
     */
    showDuckSpotted() {
        this.updateARInstructions('🦆 Duck spotted! Tap the screen!');
        
        setTimeout(() => {
            if (this.isARActive) {
                this.updateARInstructions('Looking for ducks...');
            }
        }, 3000);
    }

    /**
     * Update AR instructions text
     */
    updateARInstructions(text) {
        const instructionsElement = document.getElementById('arInstructions');
        if (instructionsElement) {
            instructionsElement.textContent = text;
        }
    }

    /**
     * Get duck type based on rarity algorithm
     */
    getDuckByRarity() {
        const duckTypes = [
            { emoji: '🐥', name: 'Yellow Duck', points: 10, rarity: 0.6 },
            { emoji: '🌟', name: 'Golden Duck', points: 50, rarity: 0.3 },
            { emoji: '👑', name: 'Royal Duck', points: 100, rarity: 0.1 }
        ];

        const rand = Math.random();
        let cumulative = 0;

        for (const duck of duckTypes) {
            cumulative += duck.rarity;
            if (rand <= cumulative) {
                return duck;
            }
        }

        return duckTypes[0]; // fallback
    }

    /**
     * Clear duck spawn timer
     */
    clearDuckSpawnTimer() {
        if (this.duckSpawnTimer) {
            clearInterval(this.duckSpawnTimer);
            this.duckSpawnTimer = null;
        }
    }

    /**
     * Stop all camera streams
     */
    stopCameraStreams() {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
            })
            .catch(() => {
                // Ignore errors when stopping streams
            });
    }

    /**
     * Handle camera access errors
     */
    handleCameraError(error) {
        let message = 'Camera access is required for AR features. Please allow camera access and try again.';
        
        if (error.name === 'NotAllowedError') {
            message = 'Camera permission denied. Please enable camera access in your browser settings.';
        } else if (error.name === 'NotFoundError') {
            message = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
            message = 'Camera not supported on this device.';
        }
        
        alert(message);
    }

    /**
     * Disable AR functionality when libraries fail to load
     */
    disableAR() {
        const startARButton = document.getElementById('startAR');
        if (startARButton) {
            startARButton.textContent = '📱 AR Not Available (Libraries Failed)';
            startARButton.disabled = true;
        }
    }

    /**
     * Set callback for duck collection events
     */
    setDuckCollectedCallback(callback) {
        this.onDuckCollected = callback;
    }

    /**
     * Check if AR is currently active
     */
    isActive() {
        return this.isARActive;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARManager;
}