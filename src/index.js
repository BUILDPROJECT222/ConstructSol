import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.js';
import { Buffer } from 'buffer';

window.Buffer = Buffer;

// Error handling untuk browser extensions
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args[0]?.includes('browser extension') || 
      args[0]?.includes('content.1.bundle.js')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// Error handling untuk unhandled errors
window.addEventListener('error', (event) => {
  if (event.filename?.includes('content.1.bundle.js') || 
      event.message?.includes('browser extension')) {
    event.preventDefault();
    return false;
  }
}, true);

window.addEventListener('unhandledrejection', event => {
  if (event.reason?.message?.includes('browser extension') ||
      event.reason?.stack?.includes('content.1.bundle.js')) {
    event.preventDefault();
    return false;
  }
});

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);