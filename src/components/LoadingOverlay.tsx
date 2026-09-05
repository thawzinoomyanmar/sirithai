import React, { useEffect, useRef } from 'react';
import { LoaderCircle } from 'lucide-react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

/**
 * A blocking, full-screen loading state for app-wide data hydration.
 *
 * The overlay takes focus while it is visible so keyboard users cannot
 * accidentally interact with controls hidden behind it.
 */
export function LoadingOverlay({
  isVisible,
  message = 'Loading your learning data…',
}: LoadingOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    overlayRef.current?.focus();

    const keepFocusOnOverlay = (event: FocusEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        overlayRef.current.focus();
      }
    };

    document.addEventListener('focusin', keepFocusOnOverlay);

    return () => {
      document.removeEventListener('focusin', keepFocusOnOverlay);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
      tabIndex={-1}
      onKeyDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/75 px-6 backdrop-blur-md outline-none cursor-wait"
    >
      <div className="flex w-full max-w-xs flex-col items-center rounded-3xl border border-white/15 bg-[#0b1028]/95 px-8 py-9 text-center text-white shadow-2xl">
        <div className="relative mb-5 flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-brand-purple/25 blur-xl" />
          <LoaderCircle
            aria-hidden="true"
            className="relative h-14 w-14 animate-spin text-cyan-300 motion-reduce:animate-none"
            strokeWidth={2.5}
          />
        </div>

        <p className="text-sm font-black tracking-wide text-white">{message}</p>
        <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-300">
          Please wait while Siri Thai prepares the latest content.
        </p>
      </div>
    </div>
  );
}
