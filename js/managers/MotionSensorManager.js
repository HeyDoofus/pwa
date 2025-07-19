/**
 * MotionSensorManager - Handles device motion sensors for AR duck positioning
 */
class MotionSensorManager {
    constructor() {
        this.isActive = false;
        this.hasPermission = false;
        this.orientation = { alpha: 0, beta: 0, gamma: 0 };
        this.motion = { x: 0, y: 0, z: 0 };
        this.lastMotion = { x: 0, y: 0, z: 0 };
        this.motionThreshold = 2.0; // Minimum motion to trigger events
        this.smoothingFactor = 0.8; // For smoothing sensor data
        
        // Callbacks
        this.onOrientationChange = null;
        this.onMotionDetected = null;
        this.onSignificantMovement = null;
        
        // Motion tracking
        this.movementHistory = [];
        this.maxHistoryLength = 10;
        this.lastSignificantMovement = 0;
        this.movementCooldown = 2000; // 2 seconds between movement triggers
    }

    /**
     * Initialize motion sensor manager
     */
    async init() {
        console.log('Initializing Motion Sensor Manager...');
        
        // Check for sensor availability
        if (!this.checkSensorSupport()) {
            console.warn('Motion sensors not supported on this device');
            return false;
        }

        try {
            // Request permissions for iOS 13+
            await this.requestPermissions();
            this.setupEventListeners();
            console.log('Motion Sensor Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize motion sensors:', error);
            return false;
        }
    }

    /**
     * Check if motion sensors are supported
     */
    checkSensorSupport() {
        return 'DeviceOrientationEvent' in window && 'DeviceMotionEvent' in window;
    }

    /**
     * Request motion sensor permissions (iOS 13+)
     */
    async requestPermissions() {
        try {
            // Check if permission request is needed (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                console.log('Requesting device orientation permission...');
                
                const orientationPermission = await DeviceOrientationEvent.requestPermission();
                console.log('Orientation permission result:', orientationPermission);
                
                if (orientationPermission !== 'granted') {
                    throw new Error(`Device orientation permission ${orientationPermission}`);
                }
            } else {
                console.log('Device orientation permission not required (not iOS 13+)');
            }

            if (typeof DeviceMotionEvent.requestPermission === 'function') {
                console.log('Requesting device motion permission...');
                
                const motionPermission = await DeviceMotionEvent.requestPermission();
                console.log('Motion permission result:', motionPermission);
                
                if (motionPermission !== 'granted') {
                    throw new Error(`Device motion permission ${motionPermission}`);
                }
            } else {
                console.log('Device motion permission not required (not iOS 13+)');
            }

            this.hasPermission = true;
            console.log('Motion sensor permissions granted successfully');
            
        } catch (error) {
            console.error('Permission request failed:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners for motion sensors
     */
    setupEventListeners() {
        // Device orientation (gyroscope/compass)
        window.addEventListener('deviceorientation', (event) => {
            this.handleOrientationChange(event);
        }, { passive: true });

        // Device motion (accelerometer)
        window.addEventListener('devicemotion', (event) => {
            this.handleMotionChange(event);
        }, { passive: true });

        console.log('Motion sensor event listeners setup complete');
    }

    /**
     * Handle device orientation changes
     */
    handleOrientationChange(event) {
        if (!this.isActive) return;

        // Smooth the orientation data
        const alpha = event.alpha || 0; // Z-axis rotation (compass)
        const beta = event.beta || 0;   // X-axis rotation (front-back tilt)
        const gamma = event.gamma || 0; // Y-axis rotation (left-right tilt)

        // Apply smoothing
        this.orientation.alpha = this.smoothValue(this.orientation.alpha, alpha);
        this.orientation.beta = this.smoothValue(this.orientation.beta, beta);
        this.orientation.gamma = this.smoothValue(this.orientation.gamma, gamma);

        // Trigger callback
        if (this.onOrientationChange) {
            this.onOrientationChange(this.orientation);
        }
    }

    /**
     * Handle device motion changes
     */
    handleMotionChange(event) {
        if (!this.isActive) return;

        const acceleration = event.accelerationIncludingGravity;
        if (!acceleration) return;

        // Get motion values
        const x = acceleration.x || 0;
        const y = acceleration.y || 0;
        const z = acceleration.z || 0;

        // Smooth the motion data
        this.motion.x = this.smoothValue(this.motion.x, x);
        this.motion.y = this.smoothValue(this.motion.y, y);
        this.motion.z = this.smoothValue(this.motion.z, z);

        // Calculate motion magnitude
        const motionMagnitude = Math.sqrt(
            Math.pow(this.motion.x - this.lastMotion.x, 2) +
            Math.pow(this.motion.y - this.lastMotion.y, 2) +
            Math.pow(this.motion.z - this.lastMotion.z, 2)
        );

        // Track movement history
        this.addToMovementHistory(motionMagnitude);

        // Detect significant movement
        if (motionMagnitude > this.motionThreshold) {
            this.handleSignificantMovement(motionMagnitude);
        }

        // Update last motion values
        this.lastMotion = { ...this.motion };

        // Trigger motion callback
        if (this.onMotionDetected) {
            this.onMotionDetected(this.motion, motionMagnitude);
        }
    }

    /**
     * Handle significant movement detection
     */
    handleSignificantMovement(magnitude) {
        const now = Date.now();
        
        // Check cooldown period
        if (now - this.lastSignificantMovement < this.movementCooldown) {
            return;
        }

        this.lastSignificantMovement = now;
        
        console.log(`Significant movement detected: ${magnitude.toFixed(2)}`);
        
        if (this.onSignificantMovement) {
            this.onSignificantMovement(magnitude, this.orientation);
        }
    }

    /**
     * Add movement to history for analysis
     */
    addToMovementHistory(magnitude) {
        this.movementHistory.push({
            magnitude: magnitude,
            timestamp: Date.now()
        });

        // Keep history within limits
        if (this.movementHistory.length > this.maxHistoryLength) {
            this.movementHistory.shift();
        }
    }

    /**
     * Smooth sensor values to reduce jitter
     */
    smoothValue(current, target) {
        return current * this.smoothingFactor + target * (1 - this.smoothingFactor);
    }

    /**
     * Start motion tracking
     */
    start() {
        if (!this.hasPermission) {
            console.warn('Cannot start motion tracking: no permission');
            return false;
        }

        this.isActive = true;
        console.log('Motion tracking started');
        return true;
    }

    /**
     * Stop motion tracking
     */
    stop() {
        this.isActive = false;
        console.log('Motion tracking stopped');
    }

    /**
     * Get current orientation in degrees
     */
    getOrientation() {
        return { ...this.orientation };
    }

    /**
     * Get current motion values
     */
    getMotion() {
        return { ...this.motion };
    }

    /**
     * Calculate duck position based on device orientation
     */
    calculateDuckPosition(baseDistance = 2.0) {
        const { alpha, beta, gamma } = this.orientation;
        
        // Convert orientation to radians
        const alphaRad = (alpha * Math.PI) / 180;
        const betaRad = (beta * Math.PI) / 180;
        const gammaRad = (gamma * Math.PI) / 180;
        
        // Calculate position based on orientation
        // Alpha (compass) affects X and Z position
        // Beta (tilt) affects Y position
        // Add some randomness for variety
        const randomOffset = 0.5;
        
        const x = Math.sin(alphaRad) * baseDistance + (Math.random() - 0.5) * randomOffset;
        const y = Math.sin(betaRad) * 0.5 + (Math.random() - 0.5) * randomOffset;
        const z = -Math.cos(alphaRad) * baseDistance + (Math.random() - 0.5) * randomOffset;
        
        return { x, y, z };
    }

    /**
     * Get movement intensity (0-1 scale)
     */
    getMovementIntensity() {
        if (this.movementHistory.length === 0) return 0;
        
        const recentMovements = this.movementHistory.slice(-5);
        const averageMagnitude = recentMovements.reduce((sum, item) => sum + item.magnitude, 0) / recentMovements.length;
        
        // Normalize to 0-1 scale (assuming max meaningful movement is 10)
        return Math.min(averageMagnitude / 10, 1);
    }

    /**
     * Check if device is currently moving
     */
    isMoving() {
        const intensity = this.getMovementIntensity();
        return intensity > 0.1; // 10% threshold
    }

    /**
     * Get movement statistics
     */
    getMovementStats() {
        const now = Date.now();
        const recentMovements = this.movementHistory.filter(item => 
            now - item.timestamp < 5000 // Last 5 seconds
        );
        
        return {
            isActive: this.isActive,
            hasPermission: this.hasPermission,
            currentIntensity: this.getMovementIntensity(),
            isMoving: this.isMoving(),
            recentMovements: recentMovements.length,
            orientation: this.getOrientation(),
            motion: this.getMotion()
        };
    }

    /**
     * Set callback for orientation changes
     */
    setOrientationChangeCallback(callback) {
        this.onOrientationChange = callback;
    }

    /**
     * Set callback for motion detection
     */
    setMotionDetectedCallback(callback) {
        this.onMotionDetected = callback;
    }

    /**
     * Set callback for significant movement
     */
    setSignificantMovementCallback(callback) {
        this.onSignificantMovement = callback;
    }

    /**
     * Update motion sensitivity settings
     */
    updateSettings(settings) {
        if (settings.motionThreshold !== undefined) {
            this.motionThreshold = settings.motionThreshold;
        }
        if (settings.smoothingFactor !== undefined) {
            this.smoothingFactor = Math.max(0, Math.min(1, settings.smoothingFactor));
        }
        if (settings.movementCooldown !== undefined) {
            this.movementCooldown = settings.movementCooldown;
        }
        
        console.log('Motion sensor settings updated:', settings);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MotionSensorManager;
}