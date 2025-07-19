# Duck Hunt AR - Project Overview

## Project Description
Duck Hunt AR is an augmented reality web application that combines classic duck hunting gameplay with modern AR technology. Players use their device's camera and motion sensors to discover and collect virtual rubber ducks in their real environment.

## Technology Stack
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **AR Framework**: A-Frame 1.4.0 for WebXR and AR functionality
- **Architecture**: Modular manager-based architecture
- **PWA**: Progressive Web App with service worker for offline functionality
- **Sensors**: Device motion and orientation APIs for AR positioning

## Core Features
- AR duck hunting with camera integration
- Motion sensor-based duck positioning
- Collection system with points and achievements
- Progressive Web App capabilities
- Offline functionality with service worker
- Responsive design for mobile devices

## Project Structure
```
/
├── working-duck-hunt.html          # Main application entry point
├── js/
│   ├── app.js                      # Main application controller
│   └── managers/                   # Modular manager classes
│       ├── ARManager.js            # AR functionality and camera
│       ├── CollectionManager.js    # Duck collection and points
│       ├── DuckSpawner.js          # Duck generation and positioning
│       ├── MotionSensorManager.js  # Device motion sensors
│       └── PWAManager.js           # Progressive Web App features
└── .kiro/
    └── steering/                   # Project documentation and standards
```

## Key Design Principles
1. **Modular Architecture**: Each manager handles a specific domain
2. **Event-Driven**: Managers communicate through callbacks
3. **Progressive Enhancement**: Core functionality works without AR
4. **Mobile-First**: Optimized for mobile AR experiences
5. **Offline-Ready**: Service worker enables offline functionality