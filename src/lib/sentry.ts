import * as Sentry from "@sentry/react";
import { useEffect } from "react";
import {
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const initSentry = () => {
  if (!SENTRY_DSN || import.meta.env.DEV) {
    console.log('[Sentry] Skipping initialization (DEV mode or no DSN)');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.reactRouterV6BrowserTracingIntegration({
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      }),
    ],
    
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% des transactions
    
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% des sessions
    replaysOnErrorSampleRate: 1.0, // 100% des sessions avec erreur
    
    // Filtrer le bruit
    ignoreErrors: [
      // Erreurs réseau
      'NetworkError',
      'Failed to fetch',
      'Load failed',
      // Erreurs de navigateur
      'ResizeObserver loop',
      'Non-Error promise rejection',
      // Erreurs d'extensions navigateur
      'chrome-extension://',
      'moz-extension://',
      // Timeout normal
      'The operation was aborted',
    ],
    
    beforeSend(event, hint) {
      // Ne pas envoyer les erreurs 401 (non authentifié)
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
        return null;
      }
      
      // Ne pas envoyer les erreurs de réseau non critiques
      if (event.exception?.values?.[0]?.value?.includes('NetworkError')) {
        return null;
      }
      
      return event;
    },
  });
};

// Error Boundary component
export const SentryErrorBoundary = Sentry.withErrorBoundary;
