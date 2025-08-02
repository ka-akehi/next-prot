'use client';

import { useEffect } from 'react';

interface ClientErrorPayload {
  type: 'onerror' | 'unhandledrejection';
  message?: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
  reason?: string;
  timestamp: number;
}

export function ErrorListener() {
  useEffect(() => {
    const log = async (data: ClientErrorPayload) => {
      try {
        await fetch('/api/log-client-error', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }).then((res) => {
          console.log('API response:', res.status);
        });
      } catch (err) {
        console.error('ログ送信失敗:', err);
      }
    };

    window.onerror = function (
      message: string | Event,
      source?: string,
      lineno?: number,
      colno?: number,
      error?: Error
    ) {
      log({
        type: 'onerror',
        message: typeof message === 'string' ? message : undefined,
        source,
        lineno,
        colno,
        stack: error?.stack,
        timestamp: Date.now(),
      });
    };

    window.onunhandledrejection = function (event: PromiseRejectionEvent) {
      const reason = event.reason;
      log({
        type: 'unhandledrejection',
        reason: typeof reason === 'string' ? reason : reason?.message || String(reason),
        stack: reason?.stack,
        timestamp: Date.now(),
      });
    };
  }, []);

  return null; // UIは不要
}
