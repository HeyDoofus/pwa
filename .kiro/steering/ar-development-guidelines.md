# AR Development Guidelines

## A-Frame Best Practices

### Scene Structure
- Keep the scene hierarchy flat when possible
- Use entity-component-system architecture
- Group related entities under parent containers
- Implement proper cleanup for dynamically created entities

```html
<!-- Good structure -->
<a-scene>
  <a-camera arjs-camera look-controls="false" wasd-controls="false">
  </a-camera>
  
  <a-entity id="duck-container">
    <!-- Dynamically spawned ducks go here -->
  </a-entity>
  
  <a-light type="ambient" color="#404040"></a-light>
</a-scene>
```

### Performance Optimization
- Use object pooling for frequently spawned entities
- Implement frustum culling for off-screen objects
- Limit the number of active entities (max 10-15 ducks)
- Use low-poly models for better performance

### Duck Entity Standards
- All ducks must have consistent scale (0.5 0.5 0.5)
- Use yellow color scheme (#ffeb3b primary, #ff9800 secondary)
- Include rotation animation for visual appeal
- Add click/touch event handlers for collection

```javascript
// Duck creation template
function createDuck(position, type) {
  const duck = document.createElement('a-entity');
  duck.setAttribute('position', position);
  duck.setAttribute('scale', '0.5 0.5 0.5');
  duck.setAttribute('animation', 'property: rotation; to: 0 360 0; loop: true; dur: 3000');
  duck.classList.add('collectible-duck');
  
  // Add visual components
  const body = document.createElement('a-box');
  body.setAttribute('color', '#ffeb3b');
  duck.appendChild(body);
  
  return duck;
}
```

## AR.js Integration

### Camera Configuration
- Use 480x360 resolution for optimal performance
- Enable debugUIEnabled only in development
- Set appropriate sourceWidth/sourceHeight for device
- Handle camera permission errors gracefully

### Tracking Optimization
- Use marker-less tracking for better user experience
- Implement tracking loss recovery
- Provide user guidance for optimal tracking conditions
- Monitor tracking quality and adjust accordingly

## Motion Sensor Integration

### Device Orientation
- Always check for sensor availability before use
- Implement permission requests for motion sensors
- Handle orientation changes smoothly
- Provide fallback for devices without sensors

```javascript
// Motion sensor setup
function setupMotionSensors() {
  if ('DeviceOrientationEvent' in window) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+ permission request
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        });
    } else {
      // Android and older iOS
      window.addEventListener('deviceorientation', handleOrientation);
    }
  }
}
```

### Sensor Data Processing
- Smooth sensor data to reduce jitter
- Implement dead zones for small movements
- Use quaternions for rotation calculations
- Limit update frequency to 30-60 FPS

## AR User Experience

### Visual Feedback
- Provide clear visual indicators for interactive elements
- Use consistent highlighting for targetable ducks
- Implement smooth transitions and animations
- Show loading states during AR initialization

### User Guidance
- Display clear instructions for first-time users
- Provide contextual help during AR sessions
- Show camera permission explanations
- Guide users to optimal lighting conditions

### Error Recovery
- Implement automatic retry for failed camera access
- Provide manual refresh options for tracking issues
- Show helpful error messages with solutions
- Maintain app state during AR session interruptions