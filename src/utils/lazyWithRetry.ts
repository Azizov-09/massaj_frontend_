import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Enhanced lazy loader with automatic retries and chunk-load error recovery for SPAs.
 * Recovers seamlessly when new Vercel deployments invalidate previous chunk hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 2,
  interval = 800
): LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then(resolve)
          .catch((err) => {
            const message = err?.message || String(err);
            const isChunkError =
              message.includes('Failed to fetch dynamically imported module') ||
              message.includes('dynamically imported module') ||
              message.includes('Loading chunk') ||
              message.includes('error loading dynamically imported module');

            // If it's a chunk error, it likely means a new deployment invalidated older hashes
            if (isChunkError && typeof window !== 'undefined') {
              const sessionKey = `retry_chunk_${window.location.pathname}`;
              const alreadyRetried = sessionStorage.getItem(sessionKey);
              if (!alreadyRetried) {
                sessionStorage.setItem(sessionKey, '1');
                console.warn('[Router] Chunk load error detected, triggering reload to fetch latest assets...', message);
                window.location.reload();
                return;
              }
            }

            if (remaining <= 0) {
              reject(err);
              return;
            }

            setTimeout(() => {
              attempt(remaining - 1);
            }, interval);
          });
      };

      attempt(retries);
    })
  );
}
