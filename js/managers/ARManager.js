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
        
        // Motion sensor integration
        this.motionSensorManager = null;
        this.activeDucks = new Map(); // Track active duck entities
        this.duckUpdateTimer = null;
        this.lastOrientation = { alpha: 0, beta: 0, gamma: 0 };
        
        // Debug mode
        this.debugMode = window.location.search.includes('debug=true');
        if (this.debugMode) {
            console.log('AR Manager debug mode enabled');
        }
    }

    /**
     * Initialize AR components and event listeners
     */
    async init() {
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

        // Initialize motion sensor manager
        this.motionSensorManager = new MotionSensorManager();
        
        // Try to initialize motion sensors
        try {
            const motionInitialized = await this.motionSensorManager.init();
            
            if (motionInitialized) {
                this.setupMotionSensorCallbacks();
                console.log('Motion sensors initialized for AR');
                if (this.debugMode) {
                    this.logDebugInfo('Motion sensors successfully initialized');
                }
            } else {
                this.showMotionPermissionPrompt();
            }
        } catch (error) {
            console.warn('Motion sensors initialization failed:', error.message);
            if (error.message.includes('permission')) {
                this.showMotionPermissionPrompt();
            }
            if (this.debugMode) {
                this.logDebugInfo(`Motion sensors failed: ${error.message}`);
            }
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
        
        // Test duck spawn button
        const spawnTestButton = document.getElementById('spawnTestDuck');
        if (spawnTestButton) {
            spawnTestButton.addEventListener('click', () => {
                if (this.isARActive) {
                    this.spawnTestDuck();
                }
            });
        }
        
        // Touch/click detection for AR duck collection
        this.arScene.addEventListener('click', (event) => {
            if (this.isARActive) {
                this.handleARInteraction(event);
            }
        });
    }

    /**
     * Setup motion sensor callbacks for AR integration
     */
    setupMotionSensorCallbacks() {
        if (!this.motionSensorManager) return;

        // Handle orientation changes for duck positioning
        this.motionSensorManager.setOrientationChangeCallback((orientation) => {
            this.handleOrientationChange(orientation);
        });

        // Handle significant movement for duck spawning
        this.motionSensorManager.setSignificantMovementCallback((magnitude, orientation) => {
            this.handleSignificantMovement(magnitude, orientation);
        });

        // Handle general motion for duck animation
        this.motionSensorManager.setMotionDetectedCallback((motion, magnitude) => {
            this.handleMotionDetected(motion, magnitude);
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

            // Start motion sensors if available
            if (this.motionSensorManager) {
                const motionStarted = this.motionSensorManager.start();
                if (motionStarted) {
                    console.log('Motion sensors activated for AR session');
                    this.updateARInstructions('Move your device to discover ducks in AR space!');
                } else {
                    this.updateARInstructions('Looking for ducks... (Motion sensors unavailable)');
                }
            }

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
        this.clearDuckUpdateTimer();
        this.clearActiveDucks();
        this.stopCameraStreams();
        
        // Stop motion sensors
        if (this.motionSensorManager) {
            this.motionSensorManager.stop();
        }
        
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
     * Start duck hunting session with motion-based duck spawning
     */
    startDuckHunt() {
        console.log('Starting AR duck hunt experience...');
        
        this.updateARInstructions('🦆 Welcome to Duck Hunt! Turn around to find hidden ducks!');
        
        if (this.motionSensorManager) {
            this.startDuckPositionUpdates();
            
            // Spawn initial duck after brief delay
            setTimeout(() => {
                if (this.isARActive) {
                    console.log('Spawning initial hunt duck...');
                    this.spawnTestDuck();
                }
            }, 3000);
            
            // Regular spawning based on movement and time
            this.duckSpawnTimer = setInterval(() => {
                if (this.isARActive && this.activeDucks.size < 2) {
                    const isMoving = this.motionSensorManager.isMoving();
                    const spawnChance = isMoving ? 0.6 : 0.3;
                    
                    if (Math.random() < spawnChance) {
                        const orientation = this.motionSensorManager.getOrientation();
                        this.spawnMotionBasedDuck(orientation);
                    }
                }
            }, 8000);
        } else {
            // Fallback mode without motion sensors
            this.updateARInstructions('🦆 Duck Hunt Mode! Turn your camera around to find ducks!');
            
            // Spawn first duck
            setTimeout(() => {
                if (this.isARActive) {
                    this.spawnTestDuck();
                }
            }, 2000);
            
            // Regular spawning
            this.duckSpawnTimer = setInterval(() => {
                if (this.isARActive && this.activeDucks.size < 2 && Math.random() < 0.4) {
                    this.spawnTestDuck();
                }
            }, 10000);
        }
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
            const timestamp = new Date().toLocaleTimeString();
            instructionsElement.innerHTML = `${text}<br><small>[${timestamp}] Active ducks: ${this.activeDucks.size}</small>`;
        }
        console.log(`AR Instructions: ${text}`);
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
     * Handle device orientation changes for duck positioning
     */
    handleOrientationChange(orientation) {
        if (!this.isARActive) return;

        // Update duck positions based on orientation
        this.updateDuckPositions(orientation);
        this.lastOrientation = orientation;
    }

    /**
     * Handle significant movement for motion-based duck spawning
     */
    handleSignificantMovement(magnitude, orientation) {
        if (!this.isARActive) return;

        console.log(`Significant movement detected in AR: ${magnitude.toFixed(2)}`);
        
        // Spawn duck based on movement
        if (this.activeDucks.size < 3 && Math.random() < 0.4) {
            this.spawnMotionBasedDuck(orientation);
        }

        // Update instructions
        this.updateARInstructions('Movement detected! Look around for new ducks...');
        setTimeout(() => {
            if (this.isARActive) {
                this.updateARInstructions('Keep moving to discover more ducks!');
            }
        }, 2000);
    }

    /**
     * Handle general motion for duck animation
     */
    handleMotionDetected(motion, magnitude) {
        if (!this.isARActive) return;

        // Animate existing ducks based on motion
        this.animateDucksWithMotion(magnitude);
    }

    /**
     * Spawn a duck based on device motion and orientation
     */
    spawnMotionBasedDuck(orientation) {
        if (!this.motionSensorManager) {
            // Fallback to random positioning if no motion sensors
            this.spawnTestDuck();
            return;
        }

        // Calculate position based on current orientation but add randomness
        const basePosition = this.motionSensorManager.calculateDuckPosition(2.5);
        
        // Add more randomness to make it a proper hunt
        const randomDistance = 1.5 + Math.random() * 3; // 1.5 to 4.5 meters
        const randomAngle = Math.random() * Math.PI * 2; // Full circle
        const randomHeight = -1 + Math.random() * 2; // -1 to +1 meters
        
        const position = {
            x: Math.cos(randomAngle) * randomDistance,
            y: randomHeight,
            z: Math.sin(randomAngle) * randomDistance
        };
        
        // Create duck entity
        const duckId = 'motion-duck-' + Date.now();
        const duckEntity = this.createDuckEntity(position, duckId);
        
        if (duckEntity) {
            this.activeDucks.set(duckId, {
                entity: duckEntity,
                spawnTime: Date.now(),
                position: position,
                type: this.getDuckByRarity()
            });

            const direction = this.getDirectionDescription(randomAngle);
            console.log(`Spawned motion-based duck at position:`, position);
            this.updateARInstructions(`Duck appeared ${direction}! Look around to find it.`);
            
            // Auto-remove after 30 seconds
            setTimeout(() => {
                this.removeDuckEntity(duckId);
            }, 30000);
        }
    }

    /**
     * Create a duck entity in the AR scene
     */
    createDuckEntity(position, duckId) {
        const scene = this.arScene;
        if (!scene) {
            console.error('AR scene not found!');
            return null;
        }

        console.log(`Creating duck entity ${duckId} at position:`, position);

        // Create main duck container - MUCH smaller scale for realistic rubber duck size
        const duckEntity = document.createElement('a-entity');
        duckEntity.setAttribute('id', duckId);
        duckEntity.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
        duckEntity.setAttribute('scale', '0.08 0.08 0.08'); // Much smaller - like a real rubber duck
        duckEntity.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 6000');
        duckEntity.setAttribute('visible', 'true');
        // Ensure duck stays in world space, not camera space
        duckEntity.setAttribute('look-controls', 'enabled: false');
        duckEntity.setAttribute('wasd-controls', 'enabled: false');
        duckEntity.classList.add('collectible-duck');

        // Duck body - rounded like a real rubber duck
        const body = document.createElement('a-sphere');
        body.setAttribute('color', '#ffeb3b');
        body.setAttribute('radius', '1');
        body.setAttribute('position', '0 0 0');
        body.setAttribute('scale', '1 0.8 1.2'); // Squash to make duck-like body shape
        body.setAttribute('material', 'color: #ffeb3b; metalness: 0.2; roughness: 0.8');
        duckEntity.appendChild(body);

        // Duck head - smaller sphere on top
        const head = document.createElement('a-sphere');
        head.setAttribute('color', '#ffeb3b');
        head.setAttribute('radius', '0.6');
        head.setAttribute('position', '0 0.7 0.3');
        head.setAttribute('material', 'color: #ffeb3b; metalness: 0.2; roughness: 0.8');
        duckEntity.appendChild(head);

        // Duck beak - small orange triangle
        const beak = document.createElement('a-cone');
        beak.setAttribute('color', '#ff9800');
        beak.setAttribute('radius-bottom', '0.15');
        beak.setAttribute('radius-top', '0.05');
        beak.setAttribute('height', '0.3');
        beak.setAttribute('position', '0 0.7 0.8');
        beak.setAttribute('rotation', '90 0 0');
        beak.setAttribute('material', 'color: #ff9800; metalness: 0.3; roughness: 0.7');
        duckEntity.appendChild(beak);

        // Duck eyes - two small black spheres
        const leftEye = document.createElement('a-sphere');
        leftEye.setAttribute('color', '#000000');
        leftEye.setAttribute('radius', '0.08');
        leftEye.setAttribute('position', '-0.15 0.8 0.55');
        leftEye.setAttribute('material', 'color: #000000; metalness: 0.8; roughness: 0.2');
        duckEntity.appendChild(leftEye);

        const rightEye = document.createElement('a-sphere');
        rightEye.setAttribute('color', '#000000');
        rightEye.setAttribute('radius', '0.08');
        rightEye.setAttribute('position', '0.15 0.8 0.55');
        rightEye.setAttribute('material', 'color: #000000; metalness: 0.8; roughness: 0.2');
        duckEntity.appendChild(rightEye);

        // Duck tail - small curved element
        const tail = document.createElement('a-sphere');
        tail.setAttribute('color', '#ffeb3b');
        tail.setAttribute('radius', '0.2');
        tail.setAttribute('position', '0 0.2 -1');
        tail.setAttribute('scale', '0.8 1.2 0.6');
        tail.setAttribute('material', 'color: #ffeb3b; metalness: 0.2; roughness: 0.8');
        duckEntity.appendChild(tail);

        // Subtle glow effect for visibility
        const glow = document.createElement('a-sphere');
        glow.setAttribute('color', '#ffff00');
        glow.setAttribute('radius', '1.3');
        glow.setAttribute('position', '0 0 0');
        glow.setAttribute('material', 'color: #ffff00; opacity: 0.1; transparent: true');
        duckEntity.appendChild(glow);

        // Add floating animation
        duckEntity.setAttribute('animation__float', 'property: position; to: ' + 
            `${position.x} ${position.y + 0.05} ${position.z}; dir: alternate; loop: true; dur: 2000; easing: easeInOutSine`);

        // Add click handler for collection
        duckEntity.addEventListener('click', (event) => {
            console.log('Duck clicked:', duckId);
            this.collectDuck(duckId);
            event.stopPropagation();
        });

        // Add touch handler for mobile
        duckEntity.addEventListener('touchstart', (event) => {
            console.log('Duck touched:', duckId);
            this.collectDuck(duckId);
            event.preventDefault();
            event.stopPropagation();
        });

        // Add to scene
        scene.appendChild(duckEntity);
        console.log(`Duck entity ${duckId} added to scene`);
        
        return duckEntity;
    }

    /**
     * Update positions of existing ducks based on orientation
     */
    updateDuckPositions(orientation) {
        if (this.activeDucks.size === 0) return;

        // Calculate orientation change
        const deltaAlpha = orientation.alpha - this.lastOrientation.alpha;
        const deltaBeta = orientation.beta - this.lastOrientation.beta;
        
        // Only update if significant change
        if (Math.abs(deltaAlpha) < 1 && Math.abs(deltaBeta) < 1) return;

        this.activeDucks.forEach((duck, duckId) => {
            const entity = duck.entity;
            if (!entity) return;

            // Adjust position based on orientation change
            const currentPos = entity.getAttribute('position');
            if (currentPos) {
                // Subtle position adjustment based on device movement
                const adjustmentFactor = 0.01;
                const newX = currentPos.x + (deltaAlpha * adjustmentFactor);
                const newY = currentPos.y + (deltaBeta * adjustmentFactor * 0.5);
                
                entity.setAttribute('position', `${newX} ${newY} ${currentPos.z}`);
            }
        });
    }

    /**
     * Animate ducks based on device motion
     */
    animateDucksWithMotion(motionMagnitude) {
        if (this.activeDucks.size === 0) return;

        // Scale animation speed based on motion
        const animationSpeed = Math.max(2000, 5000 - (motionMagnitude * 200));
        
        this.activeDucks.forEach((duck, duckId) => {
            const entity = duck.entity;
            if (!entity) return;

            // Update rotation animation speed
            entity.setAttribute('animation', `property: rotation; to: 0 360 0; loop: true; dur: ${animationSpeed}`);
            
            // Add subtle bobbing motion
            if (motionMagnitude > 1) {
                const bobbingAnimation = `property: position; to: ${entity.getAttribute('position').x} ${entity.getAttribute('position').y + 0.1} ${entity.getAttribute('position').z}; dir: alternate; loop: true; dur: 1000`;
                entity.setAttribute('animation__bob', bobbingAnimation);
            }
        });
    }

    /**
     * Collect a duck from the AR scene
     */
    collectDuck(duckId) {
        const duck = this.activeDucks.get(duckId);
        if (!duck) return;

        console.log('Duck collected in AR:', duckId);
        
        // Trigger collection callback
        if (this.onDuckCollected) {
            this.onDuckCollected(duck.type);
        }

        // Remove duck entity
        this.removeDuckEntity(duckId);
        
        // Visual feedback
        this.updateARInstructions('Duck collected! Keep exploring...');
        setTimeout(() => {
            if (this.isARActive) {
                this.updateARInstructions('Move around to find more ducks!');
            }
        }, 2000);
    }

    /**
     * Remove a duck entity from the scene
     */
    removeDuckEntity(duckId) {
        const duck = this.activeDucks.get(duckId);
        if (duck && duck.entity) {
            duck.entity.parentNode.removeChild(duck.entity);
        }
        this.activeDucks.delete(duckId);
    }

    /**
     * Clear all active duck entities
     */
    clearActiveDucks() {
        this.activeDucks.forEach((duck, duckId) => {
            this.removeDuckEntity(duckId);
        });
        this.activeDucks.clear();
    }

    /**
     * Start periodic duck position updates
     */
    startDuckPositionUpdates() {
        this.duckUpdateTimer = setInterval(() => {
            if (this.isARActive && this.motionSensorManager) {
                const orientation = this.motionSensorManager.getOrientation();
                this.handleOrientationChange(orientation);
            }
        }, 100); // Update every 100ms
    }

    /**
     * Clear duck update timer
     */
    clearDuckUpdateTimer() {
        if (this.duckUpdateTimer) {
            clearInterval(this.duckUpdateTimer);
            this.duckUpdateTimer = null;
        }
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

    /**
     * Log debug information to console and UI
     */
    logDebugInfo(message) {
        if (!this.debugMode) return;
        
        console.log(`[AR Debug] ${message}`);
        
        // Also show in AR overlay if active
        if (this.isARActive) {
            const debugElement = document.getElementById('arInstructions');
            if (debugElement) {
                debugElement.innerHTML += `<br><small>[Debug] ${message}</small>`;
            }
        }
    }

    /**
     * Show motion permission prompt to user
     */
    showMotionPermissionPrompt() {
        const prompt = document.getElementById('motionPermissionPrompt');
        const enableButton = document.getElementById('enableMotionSensors');
        
        if (prompt && enableButton) {
            prompt.style.display = 'block';
            
            enableButton.addEventListener('click', async () => {
                try {
                    const motionInitialized = await this.motionSensorManager.init();
                    if (motionInitialized) {
                        this.setupMotionSensorCallbacks();
                        prompt.style.display = 'none';
                        console.log('Motion sensors enabled by user');
                        
                        // Show success message
                        this.showTemporaryMessage('✅ Motion sensors enabled!');
                    }
                } catch (error) {
                    console.error('Failed to enable motion sensors:', error);
                    this.showTemporaryMessage('❌ Motion sensors not available');
                }
            });
        }
    }

    /**
     * Show temporary message to user
     */
    showTemporaryMessage(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            z-index: 1000;
            font-weight: bold;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Spawn a test duck in a random world position for duck hunting
     */
    spawnTestDuck() {
        console.log('Spawning test duck in random world position...');
        
        // Generate random position in 3D world space around the user
        const distance = 1.5 + Math.random() * 2.5; // 1.5 to 4 meters away
        const angle = Math.random() * Math.PI * 2; // Full 360 degrees
        const height = -0.8 + Math.random() * 1.6; // -0.8 to +0.8 meters (eye level range)
        
        const position = {
            x: Math.cos(angle) * distance,
            y: height,
            z: Math.sin(angle) * distance
        };
        
        const duckId = 'test-duck-' + Date.now();
        const duckEntity = this.createDuckEntity(position, duckId);
        
        if (duckEntity) {
            this.activeDucks.set(duckId, {
                entity: duckEntity,
                spawnTime: Date.now(),
                position: position,
                type: this.getDuckByRarity()
            });

            // Calculate direction for user guidance
            const direction = this.getDirectionDescription(angle);
            console.log(`Test duck spawned at position:`, position);
            this.updateARInstructions(`Duck spawned ${direction}! Turn around to find it. Total ducks: ${this.activeDucks.size}`);
            
            // Auto-remove after 30 seconds
            setTimeout(() => {
                this.removeDuckEntity(duckId);
            }, 30000);
        } else {
            console.error('Failed to create test duck entity');
        }
    }

    /**
     * Get direction description based on angle
     */
    getDirectionDescription(angle) {
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        if (degrees < 45 || degrees >= 315) return "to your right";
        if (degrees >= 45 && degrees < 135) return "behind you";
        if (degrees >= 135 && degrees < 225) return "to your left";
        if (degrees >= 225 && degrees < 315) return "in front of you";
        
        return "around you";
    }

    /**
     * Get motion sensor status for debugging
     */
    getMotionSensorStatus() {
        if (!this.motionSensorManager) {
            return { available: false, error: 'Motion sensor manager not initialized' };
        }
        
        return this.motionSensorManager.getMovementStats();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ARManager;
}