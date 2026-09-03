import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './utils/LanguageContext';
import { SplashScreen } from './components/SplashScreen';
import { useAudioUnlocker } from './hooks/useAudioUnlocker';

import { ErrorBoundary } from './components/ErrorBoundary';

const DEFAULT_CLERK_KEY = "pk_test_ZGVzaXJlZC1iaXNvbi0zMi5jbGVyay5hY2NvdW50cy5kZXYk";
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_KEY;

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [forceContinue, setForceContinue] = useState(false);

  useEffect(() => {
    // Detect Clerk script load failures (e.g. ERR_NAME_NOT_RESOLVED for invalid instance host)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const str = reason ? String(reason.stack || reason.message || reason) : '';
      if (str.includes('failed_to_load_clerk_js') || str.includes('clerk.browser.js') || str.includes('failed to load script')) {
        console.warn("⚠️ [Clerk Auth] Clerk script load failed (ERR_NAME_NOT_RESOLVED / Network error). Enabling fallback mode.");
        setHasTimedOut(true);
        setForceContinue(true);
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('clerk.browser.js') || msg.includes('Clerk')) {
        console.warn("⚠️ [Clerk Auth] Clerk runtime error detected. Enabling fallback mode.");
        setHasTimedOut(true);
        setForceContinue(true);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    let timeoutId: ReturnType<typeof setTimeout>;
    let autoContinueId: ReturnType<typeof setTimeout>;

    if (!isLoaded) {
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
      }, 2000);

      // Auto-continue into app after 3.5 seconds so users are never stuck on splash
      autoContinueId = setTimeout(() => {
        setForceContinue(true);
      }, 3500);
    }

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
      if (timeoutId) clearTimeout(timeoutId);
      if (autoContinueId) clearTimeout(autoContinueId);
    };
  }, [isLoaded]);
  
  if (!isLoaded && !forceContinue) {
    return (
      <SplashScreen
        message="Authenticating & preparing your Thai course material..."
        hasTimedOut={hasTimedOut}
        onRetry={() => window.location.reload()}
        onContinue={() => setForceContinue(true)}
      />
    );
  }
  
  return <>{children}</>;
}

function AudioUnlockBoundary({ children }: { children: React.ReactNode }) {
  useAudioUnlocker();
  return <>{children}</>;
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <BrowserRouter>
        <AudioUnlockBoundary>
          <AuthWrapper>
            <LanguageProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </LanguageProvider>
          </AuthWrapper>
        </AudioUnlockBoundary>
      </BrowserRouter>
    </ClerkProvider>
  </StrictMode>
);
