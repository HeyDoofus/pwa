# AR Development Guide

## A-Frame Best Practices

### Entity Creation
Always create A-Frame entities programmatically for dynamic content:

```javascript
// Create duck entity
const duck = document.createElement('a-entity');
duck.setAttribute('id', duckId);
duck.setAttribute('position', `${x} ${y} ${z}`);
duck.setAttribute('scale', '0.08 0.08 0.08');

// Add components
const body = document.createElement('a-sphere');
body.setAttribute('color', '#ffeb3b');
body.setAttribute('radius', '1');
duck.appendChild(body);

// Add to scene
document.querySelector('a-scene').appendChild(duck);
```

### Coordinate System
- A-Frame uses a right-handed coordinate system
- Y-axis points up, Z-axis points toward the user
- Positions are in meters
- Use realistic scales for AR objects (rubber duck ≈ 0.08 scale)

### Animation Guidelines
- Use A-Frame's animation component for smooth animations
- Combine multiple animations for complex movements
- Consider performance impact of continuous animations

```javascript
// Rotation animation
duck.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 6000');

// Floating animation
duck.setAttribute('animation__float', 
    'property: position; to: x y+0.05 z; dir: alternate; loop: true; dur: 2000');
```

## Motion Sensor Integration

### Device Orientation
- Alpha: Compass heading (0-360°)
- Beta: Front-back tilt (-180° to 180°)
- Gamma: Left-right tilt (-90° to 90°)

### Motion Detection
- Use accelerometer data for movement detection
- Apply smoothing to reduce sensor noise
- Implement cooldown periods to prevent spam

```javascript
// Smooth sensor values
smoothValue(current, target) {
    return current * this.smoothingFactor + target * (1 - this.smoothingFactor);
}
```

### Position Calculation
Convert device orientation to 3D positions:

```javascript
calculateDuckPosition(baseDistance = 2.0) {
    const { alpha, beta } = this.orientation;
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = (beta * Math.PI) / 180;
    
    return {
        x: Math.sin(alphaRad) * baseDistance,
        y: Math.sin(betaRad) * 0.5,
        z: -Math.cos(alphaRad) * baseDistance
    };
}
```

## Camera and Permissions

### Camera Access
- Request camera permission before starting AR
- Handle permission denied gracefully
- Provide fallback for devices without camera

### iOS Considerations
- iOS 13+ requires explicit permission for motion sensors
- Use `DeviceOrientationEvent.requestPermission()`
- Handle permission states properly

```javascript
async requestPermissions() {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
            throw new Error('Permission denied');
        }
    }
}
```

## Performance Optimization

### Entity Management
- Limit concurrent AR entities (max 3 ducks)
- Remove entities after timeout to prevent memory leaks
- Use object pooling for frequently created objects

### Rendering Optimization
- Use appropriate LOD (Level of Detail) for 3D models
- Minimize texture sizes
- Avoid complex shaders on mobile devices

### Event Handling
- Use passive event listeners for sensor events
- Debounce high-frequency events
- Clean up event listeners on component destruction

## Testing and Debugging

### AR Testing
- Test on actual mobile devices, not desktop browsers
- Test in various lighting conditions
- Test with different device orientations

### Debug Tools
- Use A-Frame inspector for scene debugging
- Enable debug mode with URL parameter `?debug=true`
- Log sensor data for motion debugging

### Common Issues
- **Entities not appearing**: Check positioning and scale
- **Poor performance**: Reduce entity count or complexity
- **Motion sensors not working**: Verify permissions and HTTPS
- **Camera not starting**: Check browser permissions and HTTPS requirement