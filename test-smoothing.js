// Test script to verify orientation smoothing algorithm
console.log('Testing orientation smoothing algorithm...');

// Smoothing configuration
let smoothingFactor = 0.8;
let smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };

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
    
    return { ...smoothedOrientation };
}

// Test cases
console.log('\n=== Test 1: Basic smoothing ===');
let result = applySmoothingToOrientation({ alpha: 90, beta: 30, gamma: 15 });
console.log('Input: alpha=90, beta=30, gamma=15');
console.log('Output:', result);

console.log('\n=== Test 2: Angle wrapping (359° to 1°) ===');
smoothedOrientation = { alpha: 359, beta: 0, gamma: 0 };
result = applySmoothingToOrientation({ alpha: 1, beta: 0, gamma: 0 });
console.log('Input: alpha=1 (from 359)');
console.log('Output:', result);

console.log('\n=== Test 3: Multiple smoothing iterations ===');
smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };
const targetOrientation = { alpha: 180, beta: 45, gamma: -30 };

for (let i = 0; i < 10; i++) {
    result = applySmoothingToOrientation(targetOrientation);
    console.log(`Iteration ${i + 1}:`, {
        alpha: result.alpha.toFixed(1),
        beta: result.beta.toFixed(1),
        gamma: result.gamma.toFixed(1)
    });
}

console.log('\n=== Test 4: Different smoothing factors ===');
const testFactors = [0.0, 0.5, 0.8, 0.9];
testFactors.forEach(factor => {
    smoothingFactor = factor;
    smoothedOrientation = { alpha: 0, beta: 0, gamma: 0 };
    result = applySmoothingToOrientation({ alpha: 90, beta: 30, gamma: 15 });
    console.log(`Factor ${factor}:`, {
        alpha: result.alpha.toFixed(1),
        beta: result.beta.toFixed(1),
        gamma: result.gamma.toFixed(1)
    });
});

console.log('\nSmoothing algorithm tests completed!');