/**
 * CollectionManager - Handles duck collection, points calculation, and achievement tracking
 */
class CollectionManager {
    constructor() {
        this.ducks = [];
        this.points = 0;
        this.achievements = [];
        this.onPointsUpdated = null; // Callback for points updates
        this.onDuckCollected = null; // Callback for duck collection
        this.onAchievementUnlocked = null; // Callback for achievements
    }

    /**
     * Initialize collection manager and load saved data
     */
    init() {
        console.log('Initializing Collection Manager...');
        this.loadSavedData();
        console.log(`Loaded ${this.ducks.length} ducks and ${this.points} points`);
    }

    /**
     * Load saved data from localStorage
     */
    loadSavedData() {
        try {
            this.ducks = JSON.parse(localStorage.getItem('collectedDucks') || '[]');
            this.points = parseInt(localStorage.getItem('loyaltyPoints') || '0');
            this.achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
        } catch (error) {
            console.error('Error loading saved data:', error);
            this.resetData();
        }
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem('collectedDucks', JSON.stringify(this.ducks));
            localStorage.setItem('loyaltyPoints', this.points.toString());
            localStorage.setItem('achievements', JSON.stringify(this.achievements));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    /**
     * Reset all data to initial state
     */
    resetData() {
        this.ducks = [];
        this.points = 0;
        this.achievements = [];
        this.saveData();
    }

    /**
     * Collect a duck and update points
     */
    collectDuck(duckType) {
        console.log(`Collecting duck: ${duckType.name}`);
        
        const newDuck = {
            ...duckType,
            id: Date.now(),
            timestamp: new Date(),
            isNew: true
        };

        this.ducks.push(newDuck);
        this.points += duckType.points;

        // Check for achievements
        this.checkAchievements();

        // Save data
        this.saveData();

        // Trigger callbacks
        if (this.onDuckCollected) {
            this.onDuckCollected(newDuck);
        }

        if (this.onPointsUpdated) {
            this.onPointsUpdated(this.points);
        }

        return newDuck;
    }

    /**
     * Check and unlock achievements based on current progress
     */
    checkAchievements() {
        const newAchievements = [];

        // First duck achievement
        if (this.ducks.length === 1 && !this.hasAchievement('first_duck')) {
            newAchievements.push({
                id: 'first_duck',
                name: 'First Duck',
                description: 'Collected your first duck!',
                icon: '🐥'
            });
        }

        // Duck collector achievements
        const milestones = [5, 10, 25, 50, 100];
        milestones.forEach(milestone => {
            const achievementId = `ducks_${milestone}`;
            if (this.ducks.length >= milestone && !this.hasAchievement(achievementId)) {
                newAchievements.push({
                    id: achievementId,
                    name: `Duck Collector ${milestone}`,
                    description: `Collected ${milestone} ducks!`,
                    icon: milestone >= 50 ? '🏆' : '🎖️'
                });
            }
        });

        // Points achievements
        const pointMilestones = [100, 500, 1000, 2500, 5000];
        pointMilestones.forEach(milestone => {
            const achievementId = `points_${milestone}`;
            if (this.points >= milestone && !this.hasAchievement(achievementId)) {
                newAchievements.push({
                    id: achievementId,
                    name: `Point Master ${milestone}`,
                    description: `Earned ${milestone} points!`,
                    icon: '⭐'
                });
            }
        });

        // Rare duck achievements
        const goldenDucks = this.ducks.filter(duck => duck.name === 'Golden Duck').length;
        const royalDucks = this.ducks.filter(duck => duck.name === 'Royal Duck').length;

        if (goldenDucks >= 1 && !this.hasAchievement('golden_duck')) {
            newAchievements.push({
                id: 'golden_duck',
                name: 'Golden Hunter',
                description: 'Found your first Golden Duck!',
                icon: '🌟'
            });
        }

        if (royalDucks >= 1 && !this.hasAchievement('royal_duck')) {
            newAchievements.push({
                id: 'royal_duck',
                name: 'Royal Hunter',
                description: 'Found your first Royal Duck!',
                icon: '👑'
            });
        }

        // Add new achievements
        newAchievements.forEach(achievement => {
            this.achievements.push(achievement);
            if (this.onAchievementUnlocked) {
                this.onAchievementUnlocked(achievement);
            }
        });
    }

    /**
     * Check if user has a specific achievement
     */
    hasAchievement(achievementId) {
        return this.achievements.some(achievement => achievement.id === achievementId);
    }

    /**
     * Calculate rewards based on current points
     */
    calculateRewards() {
        const rewardTiers = [
            { points: 100, reward: 'Free Coffee!' },
            { points: 250, reward: '20% Off Next Purchase' },
            { points: 500, reward: 'Free Dessert!' },
            { points: 1000, reward: 'Double Points Next Visit' },
            { points: 2500, reward: 'VIP Access for a Day' }
        ];

        const availableRewards = rewardTiers.filter(tier => 
            this.points >= tier.points && 
            this.points % tier.points < tier.points
        );

        return availableRewards;
    }

    /**
     * Get collection statistics
     */
    getStats() {
        const yellowDucks = this.ducks.filter(duck => duck.name === 'Yellow Duck').length;
        const goldenDucks = this.ducks.filter(duck => duck.name === 'Golden Duck').length;
        const royalDucks = this.ducks.filter(duck => duck.name === 'Royal Duck').length;

        return {
            totalDucks: this.ducks.length,
            totalPoints: this.points,
            yellowDucks,
            goldenDucks,
            royalDucks,
            achievements: this.achievements.length,
            averagePointsPerDuck: this.ducks.length > 0 ? Math.round(this.points / this.ducks.length) : 0
        };
    }

    /**
     * Get all collected ducks
     */
    getDucks() {
        return [...this.ducks];
    }

    /**
     * Get current points
     */
    getPoints() {
        return this.points;
    }

    /**
     * Get all achievements
     */
    getAchievements() {
        return [...this.achievements];
    }

    /**
     * Mark all ducks as not new (remove new flag)
     */
    markDucksAsViewed() {
        this.ducks.forEach(duck => {
            duck.isNew = false;
        });
        this.saveData();
    }

    /**
     * Set callback for points updates
     */
    setPointsUpdatedCallback(callback) {
        this.onPointsUpdated = callback;
    }

    /**
     * Set callback for duck collection
     */
    setDuckCollectedCallback(callback) {
        this.onDuckCollected = callback;
    }

    /**
     * Set callback for achievement unlocks
     */
    setAchievementUnlockedCallback(callback) {
        this.onAchievementUnlocked = callback;
    }

    /**
     * Export collection data for backup
     */
    exportData() {
        return {
            ducks: this.ducks,
            points: this.points,
            achievements: this.achievements,
            exportDate: new Date().toISOString()
        };
    }

    /**
     * Import collection data from backup
     */
    importData(data) {
        try {
            if (data.ducks && Array.isArray(data.ducks)) {
                this.ducks = data.ducks;
            }
            if (typeof data.points === 'number') {
                this.points = data.points;
            }
            if (data.achievements && Array.isArray(data.achievements)) {
                this.achievements = data.achievements;
            }
            
            this.saveData();
            
            if (this.onPointsUpdated) {
                this.onPointsUpdated(this.points);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CollectionManager;
}