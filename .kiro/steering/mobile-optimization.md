# Mobile Optimization Guidelines

## Performance Optimization

### Memory Management
Mobile devices have limited memory, so careful management is crucial:

```javascript
// Clean up AR entities
clearActiveDucks() {
    this.activeDucks.forEach((duck, duckId) => {
        if (duck.entity && duck.entity.parentNode) {
            duck.entity.parentNode.removeChild(duck.entity);
        }
    });
    this.activeDucks.clear();
}

// Stop timers and intervals
stop() {
    if (this.spawnTimer) {
        clearInterval(this.spawnTimer);
        this.spawnTimer = null;
    }
    
    if (this.updateTimer) {
        clearInterval(this.updateTimer);
        this.updateTimer = null;
    }
}
```

### Battery Optimization
Minimize battery drain through efficient sensor usage:

```javascript
// Use passive event listeners
window.addEventListener('deviceorientation', (event) => {
    this.handleOrientationChange(event);
}, { passive: true });

// Implement sensor cooldowns
handleSignificantMovement(magnitude) {
    const now = Date.now();
    if (now - this.lastSignificantMovement < this.movementCooldown) {
        return; // Skip if too soon
    }
    this.lastSignificantMovement = now;
}
```

### Rendering Performance
Optimize 3D rendering for mobile GPUs:

```javascript
// Use appropriate scales for mobile
duck.setAttribute('scale', '0.08 0.08 0.08'); // Small, realistic size

// Limit concurrent entities
if (this.activeDucks.size >= this.maxConcurrentDucks) {
    return; // Don't spawn more ducks
}

// Use efficient materials
body.setAttribute('material', 'color: #ffeb3b; metalness: 0.2; roughness: 0.8');
```

## Touch and Gesture Handling

### Touch Events
Handle both click and touch events for compatibility:

```javascript
// Add both click and touch handlers
duckEntity.addEventListener('click', (event) => {
    this.collectDuck(duckId);
    event.stopPropagation();
});

duckEntity.addEventListener('touchstart', (event) => {
    this.collectDuck(duckId);
    event.preventDefault();
    event.stopPropagation();
});
```

### Gesture Recognition
Implement basic gesture recognition for enhanced interaction:

```javascript
// Track touch movements for gestures
let touchStartX, touchStartY;

element.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

element.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Detect swipe gestures
    if (Math.abs(deltaX) > 50) {
        this.handleSwipe(deltaX > 0 ? 'right' : 'left');
    }
});
```

## Responsive Design

### Viewport Configuration
Ensure proper viewport setup for mobile:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
```

### Flexible Layouts
Use flexible CSS for various screen sizes:

```css
.overlay {
    position: fixed;
    top: 20px;
    left: 20px;
    right: 20px;
    padding: 15px;
    /* Responsive padding */
    padding: min(15px, 3vw);
}

.button {
    padding: 10px 20px;
    font-size: 16px;
    /* Ensure minimum touch target size */
    min-height: 44px;
    min-width: 44px;
}
```

### Safe Areas
Handle device safe areas (notches, home indicators):

```css
.overlay {
    /* Account for safe areas */
    padding-top: max(20px, env(safe-area-inset-top));
    padding-left: max(20px, env(safe-area-inset-left));
    padding-right: max(20px, env(safe-area-inset-right));
}
```

## Device Compatibility

### Feature Detection
Always check for feature availability:

```javascript
checkSensorSupport() {
    return 'DeviceOrientationEvent' in window && 'DeviceMotionEvent' in window;
}

checkCameraSupport() {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
}

checkARSupport() {
    return 'xr' in navigator && navigator.xr;
}
```

### Progressive Enhancement
Provide fallbacks for unsupported features:

```javascript
async init() {
    // Try to initialize motion sensors
    try {
        const motionInitialized = await this.motionSensorManager.init();
        if (!motionInitialized) {
            this.enableFallbackMode();
        }
    } catch (error) {
        console.warn('Motion sensors not available, using fallback');
        this.enableFallbackMode();
    }
}

enableFallbackMode() {
    // Provide alternative interaction methods
    this.showManualControls();
    this.enableTapToSpawn();
}
```

## Network Optimization

### Offline Support
Implement robust offline functionality:

```javascript
// Service worker for caching
const CACHE_NAME = 'duck-collector-v1.0.0';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/js/app.js',
    '/js/managers/*.js'
];

// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                return cachedResponse || fetch(event.request);
            })
    );
});
```

### Data Synchronization
Handle offline data synchronization:

```javascript
// Queue actions when offline
queueOfflineAction(action) {
    const offlineQueue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    offlineQueue.push({
        action,
        timestamp: Date.now()
    });
    localStorage.setItem('offlineQueue', JSON.stringify(offlineQueue));
}

// Process queue when online
window.addEventListener('online', () => {
    this.processOfflineQueue();
});
```

## Error Handling for Mobile

### Network Errors
Handle network connectivity issues gracefully:

```javascript
handleNetworkError(error) {
    if (!navigator.onLine) {
        this.showOfflineMessage();
        return;
    }
    
    // Handle other network errors
    this.showNetworkErrorMessage(error);
}
```

### Permission Errors
Provide clear guidance for permission issues:

```javascript
handleCameraError(error) {
    let message = 'Camera access is required for AR features.';
    
    if (error.name === 'NotAllowedError') {
        message = 'Please enable camera access in your browser settings and refresh the page.';
    } else if (error.name === 'NotFoundError') {
        message = 'No camera found on this device. AR features are not available.';
    }
    
    this.showUserFriendlyError(message);
}
```