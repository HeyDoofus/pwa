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
let camera = null;

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

    // Add device orientation event listener
    window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    orientationActive = true;

    console.log('Device orientation tracking initialized');
    return true;
}

function handleDeviceOrientation(event) {
    if (!orientationActive || !camera) return;

    // Store current orientation values
    currentOrientation.alpha = event.alpha || 0;  // Compass heading (0-360°)
    currentOrientation.beta = event.beta || 0;    // Front-back tilt (-180° to 180°)
    currentOrientation.gamma = event.gamma || 0;  // Left-right tilt (-90° to 90°)

    // Convert orientation to A-Frame camera rotation
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

    console.log(`Orientation: α=${alpha.toFixed(1)}° β=${beta.toFixed(1)}° γ=${gamma.toFixed(1)}°`);
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

console.log('\n=== Test Complete ===');