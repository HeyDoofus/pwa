# Mobile Optimization Guidelines

## Touch Interface Design

### Touch Target Standards
- Minimum touch target size: 44px × 44px
- Provide adequate spacing between interactive elements (8px minimum)
- Use visual feedback for all touch interactions
- Implement proper touch states (hover, active, focus)

```css
/* Touch-friendly button styling */
.touch-button {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
  margin: 8px;
  border-radius: 8px;
  transition: transform 0.1s ease;
}

.touch-button:active {
  transform: scale(0.95);
}
```

### Gesture Support
- Implement pinch-to-zoom for AR scene (where appropriate)
- Support swipe gestures for navigation
- Handle long-press for contextual actions
- Prevent accidental touches during AR mode

### Haptic Feedback
- Use vibration API for duck collection confirmation
- Provide different vibration patterns for different duck types
- Allow users to disable haptic feedback
- Test vibration intensity across devices

```javascript
// Haptic feedback implementation
function provideFeedback(type) {
  if ('vibrate' in navigator && userPreferences.hapticEnabled) {
    switch(type) {
      case 'duck-collected':
        navigator.vibrate([50, 30, 50]); // Short-pause-short
        break;
      case 'rare-duck':
        navigator.vibrate([100, 50, 100, 50, 100]); // Celebration pattern
        break;
      case 'error':
        navigator.vibrate(200); // Single long vibration
        break;
    }
  }
}
```

## Responsive Design

### Breakpoint Strategy
- Mobile-first approach starting at 320px
- Key breakpoints: 480px, 768px, 1024px
- Use relative units (rem, em, %) over fixed pixels
- Test on actual devices, not just browser dev tools

### Layout Adaptation
- Single column layout for mobile (< 768px)
- Flexible grid system for duck collection display
- Collapsible navigation for smaller screens
- Adaptive typography scaling

```css
/* Responsive duck collection grid */
.duck-collection {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

/* Mobile: 3 columns */
@media (max-width: 480px) {
  .duck-collection {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tablet: 4 columns */
@media (min-width: 481px) and (max-width: 768px) {
  .duck-collection {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Desktop: 6 columns */
@media (min-width: 769px) {
  .duck-collection {
    grid-template-columns: repeat(6, 1fr);
  }
}
```

### Orientation Handling
- Support both portrait and landscape modes
- Adjust AR interface for orientation changes
- Maintain aspect ratios for critical elements
- Handle orientation change events smoothly

## Performance Optimization

### Battery Conservation
- Reduce sensor polling frequency when possible
- Implement power-saving mode for extended sessions
- Monitor battery level and adjust performance accordingly
- Pause non-essential animations when battery is low

```javascript
// Battery-aware performance scaling
async function monitorBattery() {
  if ('getBattery' in navigator) {
    const battery = await navigator.getBattery();
    
    function updatePerformanceMode() {
      if (battery.level < 0.2) {
        // Low battery mode
        setPerformanceMode('low');
      } else if (battery.level < 0.5) {
        // Medium performance mode
        setPerformanceMode('medium');
      } else {
        // Full performance mode
        setPerformanceMode('high');
      }
    }
    
    battery.addEventListener('levelchange', updatePerformanceMode);
    updatePerformanceMode();
  }
}
```

### Memory Management
- Implement object pooling for duck entities
- Clean up unused AR resources promptly
- Monitor memory usage and implement garbage collection triggers
- Use efficient data structures for large collections

### Network Optimization
- Implement adaptive loading based on connection speed
- Use WebP images with fallbacks
- Compress all assets appropriately
- Implement progressive loading for 3D models

## Device Compatibility

### iOS Considerations
- Handle iOS Safari's unique AR limitations
- Implement iOS-specific permission flows
- Test on various iOS versions (13+)
- Handle iOS Safari's viewport quirks

### Android Considerations
- Test across different Android browsers (Chrome, Samsung Internet)
- Handle various screen densities and sizes
- Account for different hardware capabilities
- Test on low-end Android devices

### Cross-Platform Testing
- Test on minimum 5 different device types
- Include both high-end and budget devices
- Test various screen sizes (4" to 7"+)
- Verify functionality across different OS versions

## AR-Specific Mobile Optimization

### Camera Performance
- Use appropriate camera resolution for device capabilities
- Implement dynamic quality adjustment
- Handle camera switching (front/back) gracefully
- Optimize camera stream processing

### Motion Tracking
- Smooth sensor data to reduce jitter
- Implement sensor fusion for better accuracy
- Handle sensor availability gracefully
- Provide calibration options for users

### AR Scene Optimization
- Limit concurrent 3D objects (max 10-15)
- Use efficient rendering techniques
- Implement level-of-detail (LOD) for distant objects
- Optimize lighting and shadows for mobile GPUs

## User Experience Patterns

### Loading States
- Show progress indicators for AR initialization
- Provide estimated loading times
- Allow cancellation of long operations
- Maintain app responsiveness during loading

### Error Handling
- Provide clear, actionable error messages
- Offer retry mechanisms for failed operations
- Show helpful tips for common issues
- Maintain app state during error recovery

### Onboarding
- Create touch-friendly tutorial flow
- Use progressive disclosure for complex features
- Provide skip options for experienced users
- Test onboarding on actual devices

### Accessibility on Mobile
- Ensure screen reader compatibility
- Support voice control where available
- Provide high contrast mode
- Allow font size customization