import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Global error handler for uncaught errors
window.addEventListener('error', (event) => {
  console.error('[GlobalError] Uncaught error:', event.error);
  
  // Check if this is a critical loading error (chunk load failure)
  const isChunkError = event.message?.includes('Loading chunk') || 
                       event.message?.includes('Failed to fetch dynamically imported module') ||
                       event.message?.includes('error loading dynamically imported module');
  
  if (isChunkError) {
    console.warn('[GlobalError] Chunk loading error detected, will attempt recovery on next action');
  }
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('[GlobalError] Unhandled promise rejection:', event.reason);
});

// Register Service Worker for offline functionality and caching
const updateSW = registerSW({
  onNeedRefresh() {
    // When a new version is available, update automatically
    console.log('[SW] New content available, updating...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('[SW] App ready to work offline');
  },
  onRegistered(registration) {
    if (registration) {
      console.log('[SW] Service Worker registered successfully');
      // Check for updates every 30 minutes
      setInterval(() => {
        registration.update();
      }, 30 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('[SW] Service Worker registration failed:', error);
  }
});

// Mount app
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error('[Init] Root element not found');
}
