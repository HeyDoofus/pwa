// Test device orientation functions
console.log('Testing device orientation functions...');

// Mock DOM elements
const mockCamera = {
    setAttribute: function (attr, value) {
        console.log(`Camera ${attr} set to: ${value}`);
    }
};

// Mock document.querySelector
global.document = {
    querySelector: function (selector) {
        if (selector === 'a-camera') {
            return mockCamera;
        }
        return null;
    }
};

// Mock window
global.window = {
    DeviceOrientationEvent: true,
    addEventListener: function (event, handler, options) {
        console.log(`Event listener added for: ${event}`);
    },
    removeEventListener: function (event, handler) {
        console.log(`Event listener removed for: ${event}`);
    }
};

// Copy the functions from the HTML file
let orientationActive = false;
let currentOrientation = { alpha: 0, beta: 0, gamma: 0 };
let smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };
let camera = null;

// Orientation smoothing configuration
let smoothingFactor = 0.8;
let lastOrientationUpdate = 0;
let orientationUpdateThreshold = 16;

// Orientation smoothing functions
function smoothValue(current, target, factor, isAlpha = false) {
    // Handle angle wrapping for compass heading (alpha) which uses 0-360 range
    if (isAlpha && Math.abs(target - current) > 180) {
        if (target > current) {
            current += 360;
        } else {
            target += 360;
        }
    }

    // Apply smoothing interpolation
    const smoothed = current * factor + target * (1 - factor);

    // Normalize alpha angle to 0-360 range
    if (isAlpha) {
        return smoothed > 360 ? smoothed - 360 : (smoothed < 0 ? smoothed + 360 : smoothed);
    }

    // For beta and gamma, keep in their natural ranges
    return smoothed;
}

function applySmoothingToOrientation(rawOrientation) {
    // Apply smoothing to each orientation axis with appropriate handling
    smoothedOrientation.alpha = smoothValue(smoothedOrientation.alpha, rawOrientation.alpha, smoothingFactor, true);
    smoothedOrientation.beta = smoothValue(smoothedOrientation.beta, rawOrientation.beta, smoothingFactor, false);
    smoothedOrientation.gamma = smoothValue(smoothedOrientation.gamma, rawOrientation.gamma, smoothingFactor, false);

    return smoothedOrientation;
}

function initializeDeviceOrientation() {
    camera = document.querySelector('a-camera');
    if (!camera) {
        console.error('Camera element not found');
        return false;
    }

    // Check if device orientation is supported
    if (!window.DeviceOrientationEvent) {
        console.warn('Device orientation not supported');
        return false;
    }

    // Initialize smoothed orientation to current values
    smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };
    lastOrientationUpdate = 0;

    // Add device orientation event listener
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    orientationActive = true;

    console.log(`Device orientation tracking initialized with smoothing factor: ${smoothingFactor}`);
    return true;
}

function handleDeviceOrientation(event) {
    if (!orientationActive || !camera) return;

    // Throttle orientation updates to prevent excessive processing
    const now = Date.now();
    if (now - lastOrientationUpdate < orientationUpdateThreshold) {
        return;
    }
    lastOrientationUpdate = now;

    // Store raw orientation values
    const rawOrientation = {
        alpha: event.alpha || 0,  // Compass heading (0-360°)
        beta: event.beta || 0,    // Front-back tilt (-180° to 180°)
        gamma: event.gamma || 0   // Left-right tilt (-90° to 90°)
    };

    // Apply smoothing to prevent jitter
    currentOrientation = applySmoothingToOrientation(rawOrientation);

    // Convert smoothed orientation to A-Frame camera rotation
    updateCameraRotation();
}

function updateCameraRotation() {
    if (!camera) return;

    const { alpha, beta, gamma } = currentOrientation;

    // Convert device orientation to A-Frame rotation
    // A-Frame uses degrees and follows right-handed coordinate system
    // Y-axis rotation (yaw) - compass heading
    const yaw = -alpha; // Negative to match expected rotation direction

    // X-axis rotation (pitch) - front-back tilt
    const pitch = beta;

    // Z-axis rotation (roll) - left-right tilt
    const roll = -gamma; // Negative to match expected rotation direction

    // Apply rotation to camera
    camera.setAttribute('rotation', `${pitch} ${yaw} ${roll}`);

    console.log(`Smoothed Orientation: α=${alpha.toFixed(1)}° β=${beta.toFixed(1)}° γ=${gamma.toFixed(1)}°`);
    console.log(`Camera rotation: ${pitch.toFixed(1)} ${yaw.toFixed(1)} ${roll.toFixed(1)}`);
}

// Test the functions
console.log('\n=== Testing Device Orientation Functions ===');

// Test initialization
const initialized = initializeDeviceOrientation();
console.log(`Initialization result: ${initialized}`);

// Test orientation handling
console.log('\n--- Testing orientation changes ---');

// Test case 1: Level device
currentOrientation = { alpha: 0, beta: 0, gamma: 0 };
updateCameraRotation();

// Test case 2: Turn right
currentOrientation = { alpha: 90, beta: 0, gamma: 0 };
updateCameraRotation();

// Test case 3: Look up
currentOrientation = { alpha: 0, beta: 30, gamma: 0 };
updateCameraRotation();

// Test case 4: Tilt left
currentOrientation = { alpha: 0, beta: 0, gamma: 30 };
updateCameraRotation();

console.log('\n--- Testing smoothing functionality ---');

// Reset smoothed orientation
smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };

// Test rapid orientation changes to demonstrate smoothing
console.log('Testing rapid orientation changes with smoothing:');
const rapidChanges = [
    { alpha: 90, beta: 0, gamma: 0 },
    { alpha: 180, beta: 30, gamma: 0 },
    { alpha: 270, beta: 0, gamma: -15 },
    { alpha: 0, beta: -30, gamma: 0 }
];

rapidChanges.forEach((change, index) => {
    console.log(`\nRapid change ${index + 1}: Input α=${change.alpha}° β=${change.beta}° γ=${change.gamma}°`);
    currentOrientation = applySmoothingToOrientation(change);
    updateCameraRotation();
});

console.log('\n--- Testing different smoothing factors ---');
const testFactors = [0.0, 0.5, 0.8, 0.9];
testFactors.forEach(factor => {
    smoothingFactor = factor;
    smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };
    const result = applySmoothingToOrientation({ alpha: 90, beta: 30, gamma: 15 });
    console.log(`Factor ${factor}: α=${result.alpha.toFixed(1)}° β=${result.beta.toFixed(1)}° γ=${result.gamma.toFixed(1)}°`);
});

console.log('\n=== Test Complete ===');