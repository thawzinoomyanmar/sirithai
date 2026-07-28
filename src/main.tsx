import React, { useState, useEffect, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider, useAuth } from '@clerk/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './utils/LanguageContext';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (!isLoaded) {
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
      }, 10000); // 10 seconds timeout
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoaded]);
  
  if (!isLoaded) {
    if (hasTimedOut) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center p-4">
          <div className="text-red-500 font-bold mb-2">Authentication Timeout</div>
          <p className="text-sm text-gray-600">
            The authentication service took too long to respond. Please check your connection, ad-blockers, or try refreshing the page.
          </p>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin"></div>
      </div>
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