import React from 'react';

interface SplashScreenProps {
  message?: string;
  hasTimedOut?: boolean;
  onRetry?: () => void;
}

export function SplashScreen({ message = "Loading curriculum & learning resources...", hasTimedOut = false, onRetry }: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#05081c] text-white overflow-hidden select-none font-sans">
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Seamless Logo Display - Matching exact dark navy background, no card/box */}
        <div className="relative mb-6">
          <img
            src="/splash-peacock.png"
            alt="Siri Thai Peacock Logo"
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain animate-bounce-subtle"
          />
        </div>

        {/* Brand Titles */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-200 to-pink-300 uppercase drop-shadow-md">
          SIRI THAI
        </h1>
        <p className="text-sm sm:text-base font-extrabold text-cyan-300/90 tracking-wide mt-1.5 mb-8">
          ထိုင်းဘာသာစကားသင်ကြားရေး
        </p>

        {hasTimedOut ? (
          <div className="space-y-3 bg-red-500/10 border border-red-500/30 p-4 rounded-2xl backdrop-blur-md">
            <p className="text-xs text-red-300 font-semibold leading-relaxed">
              Authentication response timed out. Please check your network connection.
            </p>
            <button
              onClick={onRetry || (() => window.location.reload())}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer border border-white/20"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xs space-y-3">
            {/* Animated Loading Bar */}
            <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden p-0.5 border border-white/20 backdrop-blur-md shadow-inner">
              <div className="h-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full animate-loading-bar" />
            </div>
            
            <p className="text-xs font-bold text-slate-200/90 tracking-wider uppercase animate-pulse">
              {message}
            </p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[10.5px] font-mono text-slate-400 uppercase tracking-widest">
        Official Thai Language Mastery App
      </div>
    </div>
  );
}
