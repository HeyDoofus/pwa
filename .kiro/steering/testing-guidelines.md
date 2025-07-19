# Testing Guidelines

## Testing Strategy

### Testing Pyramid
Follow the testing pyramid approach:
1. **Unit Tests**: Test individual manager methods
2. **Integration Tests**: Test manager interactions
3. **E2E Tests**: Test complete user workflows
4. **Manual Testing**: Test on actual devices

### Test Environment Setup
```javascript
// Jest configuration for ES6 modules
module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    moduleFileExtensions: ['js', 'json'],
    transform: {
        '^.+\\.js$': 'babel-jest'
    }
};
```

## Unit Testing

### Manager Testing Pattern
```javascript
describe('CollectionManager', () => {
    let collectionManager;
    
    beforeEach(() => {
        // Clear localStorage
        localStorage.clear();
        collectionManager = new CollectionManager();
        collectionManager.init();
    });
    
    afterEach(() => {
        // Clean up
        localStorage.clear();
    });
    
    test('should initialize with empty collection', () => {
        expect(collectionManager.getDucks()).toHaveLength(0);
        expect(collectionManager.getPoints()).toBe(0);
    });
    
    test('should collect duck and update points', () => {
        const duckType = { emoji: '🐥', name: 'Yellow Duck', points: 10 };
        
        collectionManager.collectDuck(duckType);
        
        expect(collectionManager.getDucks()).toHaveLength(1);
        expect(collectionManager.getPoints()).toBe(10);
    });
});
```

### Async Testing
```javascript
describe('ARManager', () => {
    let arManager;
    
    beforeEach(() => {
        arManager = new ARManager();
        
        // Mock camera API
        global.navigator.mediaDevices = {
            getUserMedia: jest.fn()
        };
    });
    
    test('should handle camera permission granted', async () => {
        const mockStream = { getTracks: () => [{ stop: jest.fn() }] };
        navigator.mediaDevices.getUserMedia.mockResolvedValue(mockStream);
        
        await arManager.startAR();
        
        expect(arManager.isActive()).toBe(true);
    });
    
    test('should handle camera permission denied', async () => {
        const error = new Error('Permission denied');
        error.name = 'NotAllowedError';
        navigator.mediaDevices.getUserMedia.mockRejectedValue(error);
        
        await expect(arManager.startAR()).rejects.toThrow('Permission denied');
    });
});
```

### Mocking Strategies
```javascript
// Mock A-Frame
global.AFRAME = {
    registerComponent: jest.fn(),
    registerSystem: jest.fn()
};

// Mock device sensors
const mockDeviceOrientationEvent = {
    requestPermission: jest.fn().mockResolvedValue('granted')
};
global.DeviceOrientationEvent = mockDeviceOrientationEvent;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;
```

## Integration Testing

### Manager Communication Testing
```javascript
describe('Manager Integration', () => {
    let app, arManager, collectionManager;
    
    beforeEach(() => {
        app = new DuckCollectorApp();
        arManager = app.arManager;
        collectionManager = app.collectionManager;
    });
    
    test('should collect duck when AR duck is tapped', () => {
        const duckType = { emoji: '🐥', name: 'Yellow Duck', points: 10 };
        const collectSpy = jest.spyOn(collectionManager, 'collectDuck');
        
        // Simulate AR duck collection
        arManager.collectDuck('test-duck-id');
        
        expect(collectSpy).toHaveBeenCalledWith(duckType);
    });
});
```

### Event Flow Testing
```javascript
test('should trigger callbacks in correct order', () => {
    const callbacks = [];
    
    collectionManager.setDuckCollectedCallback(() => {
        callbacks.push('duck-collected');
    });
    
    collectionManager.setPointsUpdatedCallback(() => {
        callbacks.push('points-updated');
    });
    
    collectionManager.collectDuck({ points: 10 });
    
    expect(callbacks).toEqual(['duck-collected', 'points-updated']);
});
```

## Mobile Testing

### Device Testing Checklist
- [ ] Test on iOS Safari (latest 2 versions)
- [ ] Test on Android Chrome (latest 2 versions)
- [ ] Test on various screen sizes (phone, tablet)
- [ ] Test in portrait and landscape orientations
- [ ] Test with different device performance levels
- [ ] Test camera permissions flow
- [ ] Test motion sensor permissions (iOS)
- [ ] Test offline functionality
- [ ] Test PWA installation

### Sensor Testing
```javascript
describe('Motion Sensors', () => {
    let motionManager;
    
    beforeEach(() => {
        motionManager = new MotionSensorManager();
        
        // Mock sensor events
        global.window.addEventListener = jest.fn();
    });
    
    test('should handle orientation change', () => {
        const callback = jest.fn();
        motionManager.setOrientationChangeCallback(callback);
        
        // Simulate orientation event
        const orientationEvent = {
            alpha: 90,
            beta: 0,
            gamma: 0
        };
        
        motionManager.handleOrientationChange(orientationEvent);
        
        expect(callback).toHaveBeenCalledWith({
            alpha: 90,
            beta: 0,
            gamma: 0
        });
    });
});
```

## AR Testing

### A-Frame Testing
```javascript
describe('AR Scene Management', () => {
    let arManager;
    
    beforeEach(() => {
        // Mock A-Frame scene
        document.body.innerHTML = `
            <a-scene id="arScene">
                <a-camera></a-camera>
            </a-scene>
        `;
        
        arManager = new ARManager();
    });
    
    test('should create duck entity in scene', () => {
        const position = { x: 1, y: 0, z: -2 };
        const duckId = 'test-duck';
        
        const duckEntity = arManager.createDuckEntity(position, duckId);
        
        expect(duckEntity).toBeTruthy();
        expect(duckEntity.getAttribute('position')).toBe('1 0 -2');
        expect(duckEntity.getAttribute('id')).toBe(duckId);
    });
});
```

### Performance Testing
```javascript
describe('Performance', () => {
    test('should not exceed maximum concurrent ducks', () => {
        const arManager = new ARManager();
        const maxDucks = 3;
        
        // Try to spawn more ducks than allowed
        for (let i = 0; i < 5; i++) {
            arManager.spawnTestDuck();
        }
        
        expect(arManager.activeDucks.size).toBeLessThanOrEqual(maxDucks);
    });
    
    test('should clean up duck entities after timeout', (done) => {
        const arManager = new ARManager();
        
        arManager.spawnTestDuck();
        expect(arManager.activeDucks.size).toBe(1);
        
        // Wait for auto-cleanup (mocked timeout)
        setTimeout(() => {
            expect(arManager.activeDucks.size).toBe(0);
            done();
        }, 100);
    });
});
```

## Test Data and Fixtures

### Duck Type Fixtures
```javascript
export const DUCK_TYPES = {
    YELLOW: { emoji: '🐥', name: 'Yellow Duck', points: 10, rarity: 0.6 },
    GOLDEN: { emoji: '🌟', name: 'Golden Duck', points: 50, rarity: 0.3 },
    ROYAL: { emoji: '👑', name: 'Royal Duck', points: 100, rarity: 0.1 }
};
```

### Test Utilities
```javascript
export class TestUtils {
    static createMockDuck(type = 'YELLOW') {
        return {
            id: Date.now(),
            type: DUCK_TYPES[type],
            position: { x: 0, y: 0, z: -2 },
            spawnTime: Date.now()
        };
    }
    
    static simulateDeviceMotion(x = 0, y = 0, z = 0) {
        const event = new Event('devicemotion');
        event.accelerationIncludingGravity = { x, y, z };
        window.dispatchEvent(event);
    }
    
    static simulateDeviceOrientation(alpha = 0, beta = 0, gamma = 0) {
        const event = new Event('deviceorientation');
        event.alpha = alpha;
        event.beta = beta;
        event.gamma = gamma;
        window.dispatchEvent(event);
    }
}
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Coverage Requirements
- Maintain minimum 80% code coverage
- Focus on critical paths (AR functionality, data persistence)
- Exclude generated code and vendor libraries