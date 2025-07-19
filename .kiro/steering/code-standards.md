# Code Standards and Best Practices

## JavaScript Standards

### Code Style
- Use ES6+ features (const/let, arrow functions, destructuring)
- Prefer async/await over Promise chains
- Use meaningful variable and function names
- Keep functions small and focused (max 20-30 lines)
- Add JSDoc comments for complex functions

### Error Handling
- Always wrap async operations in try-catch blocks
- Provide user-friendly error messages
- Log errors with context for debugging
- Implement graceful fallbacks for critical features

```javascript
// Good
async function requestCameraAccess() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    return stream;
  } catch (error) {
    console.error('Camera access failed:', error);
    showUserFriendlyError('Camera access is required for AR features');
    return null;
  }
}
```

### Performance
- Use object pooling for frequently created/destroyed objects
- Implement lazy loading for non-critical resources
- Debounce expensive operations (sensor readings, API calls)
- Clean up event listeners and resources properly

## HTML Standards

### Semantic Markup
- Use semantic HTML5 elements (header, main, section, article)
- Include proper ARIA labels for accessibility
- Ensure all interactive elements are keyboard accessible
- Use proper heading hierarchy (h1 → h2 → h3)

### Mobile Optimization
- Include viewport meta tag with proper scaling
- Use touch-friendly target sizes (minimum 44px)
- Implement proper focus management for touch devices

## CSS Standards

### Architecture
- Use CSS custom properties for theming
- Implement mobile-first responsive design
- Use CSS Grid and Flexbox for layouts
- Keep specificity low, avoid !important

### Performance
- Minimize reflows and repaints
- Use transform and opacity for animations
- Implement efficient CSS selectors
- Use will-change property sparingly

```css
/* Good - Mobile first approach */
.duck-collection {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .duck-collection {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}
```

## Testing Standards

### Unit Testing
- Test all business logic functions
- Mock external dependencies (camera, sensors)
- Test error conditions and edge cases
- Maintain >80% code coverage for critical paths

### Integration Testing
- Test AR scene initialization and cleanup
- Verify camera permission flows
- Test PWA installation process
- Validate offline functionality