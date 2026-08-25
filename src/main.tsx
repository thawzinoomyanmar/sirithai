import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './utils/LanguageContext';
import { SplashScreen } from './components/SplashScreen';

import { ErrorBoundary } from './components/ErrorBoundary';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

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
      }
    };

    const handleError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (msg.includes('clerk.browser.js') || msg.includes('Clerk')) {
        console.warn("⚠️ [Clerk Auth] Clerk runtime error detected. Enabling fallback mode.");
        setHasTimedOut(true);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('error', handleError);

    let timeoutId: ReturnType<typeof setTimeout>;
    if (!isLoaded) {
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
      }, 2500);
    }

    return () => {
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('error', handleError);
      if (timeoutId) clearTimeout(timeoutId);
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

const root = createRoot(document.getElementById('root')!);

if (PUBLISHABLE_KEY && PUBLISHABLE_KEY.trim() !== '') {
  console.log("✅ [Clerk Auth] Publishable Key loaded.");
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <BrowserRouter>
          <AuthWrapper>
            <LanguageProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </LanguageProvider>
          </AuthWrapper>
        </BrowserRouter>
      </ClerkProvider>
    </StrictMode>
  );
} else {
  console.warn("⚠️ [Clerk Auth] Missing or empty VITE_CLERK_PUBLISHABLE_KEY.");
  root.render(
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1 style={{ color: '#e53e3e' }}>Authentication Error</h1>
      <p>The application is missing the Clerk Publishable Key.</p>
      <p>Please check your <code>.env</code> file and ensure <code>VITE_CLERK_PUBLISHABLE_KEY</code> is set.</p>
    </div>
  );
}