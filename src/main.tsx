import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(<App />);
