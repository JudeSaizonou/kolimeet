import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });

  // Écouter les messages du Service Worker pour la navigation
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[App] Message from SW:', event.data);
    
    if (event.data && event.data.type === 'NAVIGATE_TO') {
      const url = event.data.url;
      console.log('[App] Navigating to:', url);
      
      // Extraire le path de l'URL
      try {
        const urlObj = new URL(url, window.location.origin);
        const path = urlObj.pathname + urlObj.search + urlObj.hash;
        window.location.href = path;
      } catch (e) {
        // Si ce n'est pas une URL valide, utiliser directement
        window.location.href = url;
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
