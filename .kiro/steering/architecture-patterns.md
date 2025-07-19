# Architecture Patterns and Design Guidelines

## Manager Pattern

### Overview
The application uses a manager-based architecture where each manager handles a specific domain of functionality. This promotes separation of concerns and maintainability.

### Manager Structure
```javascript
class ManagerName {
    constructor() {
        // State properties
        this.isActive = false;
        this.data = {};
        
        // Callbacks for communication
        this.onEventCallback = null;
    }

    async init() {
        // Initialization logic
        // Return boolean indicating success
    }

    // Public API methods
    start() { /* ... */ }
    stop() { /* ... */ }
    
    // Callback setters
    setEventCallback(callback) {
        this.onEventCallback = callback;
    }
}
```

### Manager Communication
Managers communicate through callbacks rather than direct coupling:

```javascript
// In main app
this.arManager.setDuckCollectedCallback((duckType) => {
    this.collectionManager.collectDuck(duckType);
});

this.collectionManager.setPointsUpdatedCallback((points) => {
    this.updatePointsDisplay();
});
```

## State Management

### Local State
Each manager maintains its own state:
- ARManager: AR session state, active ducks
- CollectionManager: collected ducks, points, achievements
- DuckSpawner: spawn settings, active spawns

### Persistent State
Use localStorage for data persistence:

```javascript
// Save data
saveData() {
    localStorage.setItem('collectedDucks', JSON.stringify(this.ducks));
    localStorage.setItem('loyaltyPoints', this.points.toString());
}

// Load data with error handling
loadSavedData() {
    try {
        this.ducks = JSON.parse(localStorage.getItem('collectedDucks') || '[]');
        this.points = parseInt(localStorage.getItem('loyaltyPoints') || '0');
    } catch (error) {
        console.error('Error loading saved data:', error);
        this.resetData();
    }
}
```

## Event-Driven Architecture

### Callback Pattern
Use callbacks for loose coupling between components:

```javascript
// Manager provides callback setter
setDuckCollectedCallback(callback) {
    this.onDuckCollected = callback;
}

// Manager triggers callback when event occurs
if (this.onDuckCollected) {
    this.onDuckCollected(duckType);
}
```

### Event Handling Best Practices
- Always check if callback exists before calling
- Use try-catch around callback execution
- Provide meaningful event data
- Document callback signatures

## Error Handling Patterns

### Graceful Degradation
Provide fallbacks when features are unavailable:

```javascript
async init() {
    try {
        const motionInitialized = await this.motionSensorManager.init();
        if (motionInitialized) {
            this.setupMotionSensorCallbacks();
        } else {
            this.showMotionPermissionPrompt();
        }
    } catch (error) {
        console.warn('Motion sensors initialization failed:', error.message);
        // Continue without motion sensors
    }
}
```

### Error Boundaries
Implement error boundaries to prevent cascading failures:

```javascript
handleGlobalError(error) {
    // Log error
    console.error('Global error:', error);
    
    // Show user-friendly message
    this.showErrorNotification(error.message);
    
    // Attempt recovery
    this.attemptRecovery();
}
```

## Async Patterns

### Initialization Chain
Handle async initialization with proper error handling:

```javascript
async initializeManagers() {
    // Initialize in dependency order
    this.collectionManager.init();
    this.duckSpawner.init();
    
    const arInitialized = await this.arManager.init();
    if (!arInitialized) {
        console.warn('AR functionality not available');
    }
    
    this.pwaManager.init();
}
```

### Promise Handling
Use async/await with proper error handling:

```javascript
async startAR() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        
        // Process stream
        this.handleCameraStream(stream);
        
    } catch (error) {
        console.error('Camera access error:', error);
        this.handleCameraError(error);
    }
}
```

## Data Flow Patterns

### Unidirectional Data Flow
Data flows from managers to UI through callbacks:

```
User Action → Manager → State Change → Callback → UI Update
```

### State Synchronization
Keep UI in sync with manager state:

```javascript
// Manager notifies of state changes
if (this.onPointsUpdated) {
    this.onPointsUpdated(this.points);
}

// App updates UI based on state
updatePointsDisplay() {
    const pointsElement = document.getElementById('pointsCount');
    if (pointsElement) {
        pointsElement.textContent = this.collectionManager.getPoints();
    }
}
```

## Testing Patterns

### Manager Testing
Each manager should be testable in isolation:

```javascript
// Mock dependencies
const mockCollectionManager = {
    collectDuck: jest.fn(),
    getPoints: jest.fn(() => 100)
};

// Test manager behavior
const arManager = new ARManager();
arManager.setDuckCollectedCallback(mockCollectionManager.collectDuck);
```

### Integration Testing
Test manager interactions:

```javascript
// Test callback flow
arManager.collectDuck('test-duck');
expect(mockCollectionManager.collectDuck).toHaveBeenCalled();
```