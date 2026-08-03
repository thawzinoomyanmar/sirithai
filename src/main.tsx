import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './utils/LanguageContext';
import { SplashScreen } from './components/SplashScreen';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!isLoaded) {
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
      }, 10000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoaded]);
  
  if (!isLoaded) {
    return (
      <SplashScreen
        message="Authenticating & preparing your Thai course material..."
        hasTimedOut={hasTimedOut}
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  return <>{children}</>;
}

const root = createRoot(document.getElementById('root')!);

if (PUBLISHABLE_KEY && PUBLISHABLE_KEY.trim() !== '') {
  console.log("✅ [Clerk Auth] Publishable Key loaded successfully.");
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <BrowserRouter>
          <AuthWrapper>
            <LanguageProvider>
              <App />
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