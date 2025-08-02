'use client';

import { useEffect } from 'react';

export function ErrorListener() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      fetch('/api/log-client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.message,
          stack: event.error?.stack ?? null,
          pathname: window.location.pathname,
          userAgent: navigator.userAgent,
        }),
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      fetch('/api/log-client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: event.reason?.message ?? 'UnhandledRejection',
          stack: event.reason?.stack ?? null,
          pathname: window.location.pathname,
          userAgent: navigator.userAgent,
        }),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
