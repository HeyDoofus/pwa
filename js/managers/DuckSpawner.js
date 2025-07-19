/**
 * DuckSpawner - Handles duck generation, positioning, and spawning logic
 */
class DuckSpawner {
    constructor() {
        this.duckTypes = [
            { emoji: '🐥', name: 'Yellow Duck', points: 10, rarity: 0.6 },
            { emoji: '🌟', name: 'Golden Duck', points: 50, rarity: 0.3 },
            { emoji: '👑', name: 'Royal Duck', points: 100, rarity: 0.1 }
        ];
        
        this.spawnTimer = null;
        this.isSpawning = false;
        this.onDuckSpawned = null; // Callback for when duck is spawned
        this.spawnSettings = {
            baseInterval: 10000, // 10 seconds base interval
            randomVariation: 5000, // ±5 seconds variation
            spawnChance: 0.3, // 30% chance per interval
            maxConcurrentDucks: 3 // Maximum ducks at once
        };
        this.activeDucks = [];
    }

    /**
     * Initialize duck spawner
     */
    init() {
        console.log('Initializing Duck Spawner...');
        console.log(`Duck types loaded: ${this.duckTypes.length}`);
    }

    /**
     * Start automatic duck spawning
     */
    startSpawning() {
        if (this.isSpawning) {
            console.log('Duck spawning already active');
            return;
        }

        console.log('Starting duck spawning...');
        this.isSpawning = true;
        this.scheduleNextSpawn();
    }

    /**
     * Stop automatic duck spawning
     */
    stopSpawning() {
        console.log('Stopping duck spawning...');
        this.isSpawning = false;
        
        if (this.spawnTimer) {
            clearTimeout(this.spawnTimer);
            this.spawnTimer = null;
        }
        
        this.clearActiveDucks();
    }

    /**
     * Schedule the next duck spawn
     */
    scheduleNextSpawn() {
        if (!this.isSpawning) return;

        const baseInterval = this.spawnSettings.baseInterval;
        const variation = this.spawnSettings.randomVariation;
        const interval = baseInterval + (Math.random() * variation * 2 - variation);

        this.spawnTimer = setTimeout(() => {
            this.attemptSpawn();
            this.scheduleNextSpawn();
        }, interval);
    }

    /**
     * Attempt to spawn a duck based on spawn chance and conditions
     */
    attemptSpawn() {
        if (!this.isSpawning) return;

        // Check if we should spawn based on chance and active duck count
        if (Math.random() > this.spawnSettings.spawnChance) {
            console.log('Duck spawn attempt failed (random chance)');
            return;
        }

        if (this.activeDucks.length >= this.spawnSettings.maxConcurrentDucks) {
            console.log('Duck spawn attempt failed (max concurrent ducks reached)');
            return;
        }

        this.spawnDuck();
    }

    /**
     * Spawn a duck with random type and position
     */
    spawnDuck() {
        const duckType = this.getDuckByRarity();
        const position = this.generateSpawnPosition();
        
        const duck = {
            id: Date.now() + Math.random(),
            type: duckType,
            position: position,
            spawnTime: Date.now(),
            isActive: true
        };

        this.activeDucks.push(duck);
        
        console.log(`Spawned ${duckType.name} at position:`, position);
        
        if (this.onDuckSpawned) {
            this.onDuckSpawned(duck);
        }

        // Auto-remove duck after some time if not collected
        setTimeout(() => {
            this.removeDuck(duck.id);
        }, 30000); // 30 seconds timeout
    }

    /**
     * Generate a spawn position for AR space
     */
    generateSpawnPosition() {
        // Generate position in AR coordinate system
        // Positions are relative to camera (0,0,0)
        const distance = 1.5 + Math.random() * 2; // 1.5 to 3.5 meters away
        const angle = Math.random() * Math.PI * 2; // Full circle
        const height = -0.5 + Math.random() * 1; // -0.5 to 0.5 meters relative to camera
        
        return {
            x: Math.cos(angle) * distance,
            y: height,
            z: -Math.sin(angle) * distance
        };
    }

    /**
     * Get duck type based on rarity algorithm
     */
    getDuckByRarity() {
        const rand = Math.random();
        let cumulative = 0;

        for (const duck of this.duckTypes) {
            cumulative += duck.rarity;
            if (rand <= cumulative) {
                return { ...duck }; // Return copy to avoid mutation
            }
        }

        return { ...this.duckTypes[0] }; // fallback to most common duck
    }

    /**
     * Remove a duck from active ducks list
     */
    removeDuck(duckId) {
        const index = this.activeDucks.findIndex(duck => duck.id === duckId);
        if (index !== -1) {
            const removedDuck = this.activeDucks.splice(index, 1)[0];
            console.log(`Removed duck: ${removedDuck.type.name}`);
            return removedDuck;
        }
        return null;
    }

    /**
     * Clear all active ducks
     */
    clearActiveDucks() {
        console.log(`Clearing ${this.activeDucks.length} active ducks`);
        this.activeDucks = [];
    }

    /**
     * Get all currently active ducks
     */
    getActiveDucks() {
        return [...this.activeDucks];
    }

    /**
     * Spawn a specific duck type for demo/testing purposes
     */
    spawnSpecificDuck(duckTypeName) {
        const duckType = this.duckTypes.find(type => type.name === duckTypeName);
        if (!duckType) {
            console.error(`Duck type not found: ${duckTypeName}`);
            return null;
        }

        const position = this.generateSpawnPosition();
        const duck = {
            id: Date.now() + Math.random(),
            type: { ...duckType },
            position: position,
            spawnTime: Date.now(),
            isActive: true
        };

        this.activeDucks.push(duck);
        
        if (this.onDuckSpawned) {
            this.onDuckSpawned(duck);
        }

        return duck;
    }

    /**
     * Spawn a demo duck for testing (simulates finding without AR)
     */
    spawnDemoDuck() {
        const duckType = Math.random() < 0.7 ? this.duckTypes[0] :
                         Math.random() < 0.9 ? this.duckTypes[1] : this.duckTypes[2];
        
        console.log(`Spawning demo duck: ${duckType.name}`);
        
        if (this.onDuckSpawned) {
            this.onDuckSpawned({
                id: Date.now(),
                type: duckType,
                position: { x: 0, y: 0, z: -2 },
                spawnTime: Date.now(),
                isActive: true,
                isDemo: true
            });
        }
    }

    /**
     * Update spawn settings
     */
    updateSpawnSettings(settings) {
        this.spawnSettings = { ...this.spawnSettings, ...settings };
        console.log('Updated spawn settings:', this.spawnSettings);
    }

    /**
     * Get current spawn settings
     */
    getSpawnSettings() {
        return { ...this.spawnSettings };
    }

    /**
     * Get duck type information
     */
    getDuckTypes() {
        return this.duckTypes.map(type => ({ ...type }));
    }

    /**
     * Add a new duck type
     */
    addDuckType(duckType) {
        if (!duckType.emoji || !duckType.name || !duckType.points || !duckType.rarity) {
            console.error('Invalid duck type:', duckType);
            return false;
        }

        this.duckTypes.push({ ...duckType });
        console.log(`Added new duck type: ${duckType.name}`);
        return true;
    }

    /**
     * Set callback for duck spawned events
     */
    setDuckSpawnedCallback(callback) {
        this.onDuckSpawned = callback;
    }

    /**
     * Get spawn statistics
     */
    getSpawnStats() {
        const now = Date.now();
        const recentSpawns = this.activeDucks.filter(duck => 
            now - duck.spawnTime < 60000 // Last minute
        );

        return {
            activeDucks: this.activeDucks.length,
            recentSpawns: recentSpawns.length,
            isSpawning: this.isSpawning,
            duckTypes: this.duckTypes.length
        };
    }

    /**
     * Force spawn a duck immediately (for testing)
     */
    forceSpawn() {
        console.log('Force spawning duck...');
        this.spawnDuck();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DuckSpawner;
}