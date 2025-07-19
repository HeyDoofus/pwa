# Design Document

## Overview

The AR motion sensor fix will address the core issue where the AR camera view doesn't respond to device orientation changes. The solution involves properly integrating AR.js with A-Frame for WebXR support, fixing motion sensor permission handling, and ensuring the camera controls respond to device movement across different platforms.

## Architecture

### Current Issues Identified in working-duck-hunt.html
1. **Missing Device Orientation Integration**: The A-Frame camera has look-controls but isn't connected to device orientation sensors
2. **No Motion Sensor Implementation**: No JavaScript code to capture and apply device orientation to camera
3. **Static Camera Background**: Using static sky instead of camera feed for true AR experience
4. **Missing Permission Handling**: No iOS 13+ motion sensor permission requests

### Proposed Incremental Architecture
Focus on enhancing the existing `working-duck-hunt.html` file with minimal changes:
```
Device Orientation Events → JavaScript Handler → A-Frame Camera Rotation → Visual Update
                                    ↓
                              Permission Management → iOS Compatibility
```

## Components and Interfaces

### 1. Device Orientation Handler (New JavaScript in working-duck-hunt.html)
**Purpose**: Capture device orientation and apply to A-Frame camera

**Key Implementation**:
- Add deviceorientation event listener
- Convert orientation data to A-Frame camera rotation
- Smooth orientation changes to prevent jitter
- Handle iOS 13+ permission requirements

**Core Functions**:
```javascript
// Request motion sensor permissions (iOS 13+)
async function requestMotionPermissions()

// Handle device orientation changes
function handleDeviceOrientation(event)

// Apply orientation to A-Frame camera
function updateCameraRotation(alpha, beta, gamma)

// Smooth orientation interpolation
function smoothOrientation(current, target)
```

### 2. Camera Background Enhancement
**Purpose**: Replace static sky with camera feed for true AR

**Minimal Changes**:
- Add camera stream request
- Set A-Frame scene background to transparent
- Overlay camera video behind A-Frame canvas
- Handle camera permission errors gracefully

### 3. Permission UI Integration
**Purpose**: Handle iOS motion sensor permissions within existing UI

**Implementation**:
- Add permission request button to existing overlay
- Show permission status in existing status div
- Integrate with existing button controls
- Maintain current UI styling and layout

### 4. Incremental Testing Approach
**Purpose**: Test each enhancement individually

**Testing Strategy**:
- Test device orientation without camera first
- Add camera background as separate enhancement
- Test permission handling on iOS devices
- Validate smooth camera movement across devices

## Data Models

### Orientation Data Structure
```javascript
{
  alpha: number,    // Compass heading (0-360°)
  beta: number,     // Front-back tilt (-180° to 180°)
  gamma: number,    // Left-right tilt (-90° to 90°)
  timestamp: number // For interpolation timing
}
```

### Camera State Model
```javascript
{
  rotation: { x: number, y: number, z: number },
  position: { x: number, y: number, z: number },
  isTracking: boolean,
  hasPermissions: boolean,
  interpolationFactor: number
}
```

### AR Session State
```javascript
{
  isActive: boolean,
  hasCamera: boolean,
  hasMotionSensors: boolean,
  trackingMode: 'webxr' | 'camera' | 'fallback',
  permissionStatus: 'granted' | 'denied' | 'pending'
}
```

## Error Handling

### Permission Denied Scenarios
1. **Camera Permission Denied**:
   - Show clear message explaining AR needs camera access
   - Provide button to retry permission request
   - Offer fallback mode with static background

2. **Motion Sensor Permission Denied (iOS)**:
   - Display iOS-specific instructions for enabling motion sensors
   - Provide manual camera controls as fallback
   - Show visual indicators for manual control mode

3. **WebXR Not Supported**:
   - Fall back to camera-based AR simulation
   - Maintain full functionality with alternative implementation
   - Log capability information for debugging

### Runtime Error Handling
1. **Sensor Reading Errors**:
   - Implement error boundaries around sensor event handlers
   - Use last known good values when sensors fail
   - Gracefully degrade to manual controls

2. **Camera Stream Errors**:
   - Handle camera disconnection during AR session
   - Provide retry mechanism for camera access
   - Show appropriate error messages to user

## Testing Strategy

### Device Testing Matrix
- **iOS Safari**: Test motion sensor permissions and camera integration
- **Android Chrome**: Verify WebXR support and fallback behavior
- **Desktop Browsers**: Ensure fallback controls work properly
- **Various Screen Orientations**: Test portrait/landscape transitions

### Motion Sensor Testing
1. **Permission Flow Testing**:
   - Test permission request on iOS 13+
   - Verify fallback behavior when denied
   - Test retry mechanism functionality

2. **Orientation Tracking Testing**:
   - Test smooth camera movement with device rotation
   - Verify orientation accuracy across different positions
   - Test interpolation smoothness and responsiveness

3. **Error Scenario Testing**:
   - Test behavior when sensors become unavailable
   - Verify graceful degradation to manual controls
   - Test recovery when sensors become available again

### Integration Testing
1. **AR.js Integration**:
   - Verify camera feed appears as background
   - Test virtual object positioning accuracy
   - Validate WebXR feature detection

2. **Cross-Platform Compatibility**:
   - Test consistent behavior across target devices
   - Verify permission handling differences between platforms
   - Test performance impact of AR features

## Performance Considerations

### Optimization Strategies
1. **Sensor Data Processing**:
   - Throttle orientation updates to 60fps maximum
   - Use requestAnimationFrame for smooth camera updates
   - Implement sensor data smoothing to reduce jitter

2. **Camera Feed Performance**:
   - Use appropriate video resolution for device capabilities
   - Implement efficient camera stream management
   - Optimize AR.js configuration for performance

3. **Memory Management**:
   - Properly dispose of camera streams when AR stops
   - Clean up event listeners and timers
   - Monitor memory usage during extended AR sessions

## Implementation Phases

### Phase 1: Basic Device Orientation Integration
- Add device orientation event listeners to working-duck-hunt.html
- Connect orientation data to A-Frame camera rotation
- Test basic camera movement with device rotation
- Ensure compatibility with existing duck spawning logic

### Phase 2: iOS Permission Handling
- Add iOS 13+ motion sensor permission requests
- Integrate permission UI with existing overlay
- Handle permission denied scenarios gracefully
- Test on iOS Safari specifically

### Phase 3: Camera Background Enhancement
- Add camera stream request for AR background
- Replace static sky with transparent background
- Overlay camera feed behind A-Frame scene
- Handle camera permission errors

### Phase 4: Smoothing and Optimization
- Add orientation smoothing to prevent jitter
- Optimize performance for mobile devices
- Fine-tune sensitivity settings
- Test across different device orientations