// Vendored from cubiczan-resilience/typescript/src/retry.ts (types stripped for
// the Forge JS/ESM runtime). Keep API-compatible with the shared library.

import { ResilienceError } from './errors.js';

const defaultSleep = (ms) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (typeof t === 'object' && t !== null && 'unref' in t) {
      t.unref();
    }
  });

/**
 * Compute an exponential backoff delay with full jitter.
 *
 * delay = random(0, min(maxDelayMs, baseDelayMs * 2^(attempt-1)))
 *
 * Full jitter prevents thundering-herd retries against a struggling upstream.
 */
export function computeBackoff(attempt, baseDelayMs, maxDelayMs, random = Math.random) {
  const exponential = baseDelayMs * 2 ** Math.max(0, attempt - 1);
  const capped = Math.min(maxDelayMs, exponential);
  return Math.floor(random() * capped);
}

/**
 * Run `fn` with retry + exponential backoff and full jitter.
 *
 * Stops early when `shouldRetry` returns false, when attempts are exhausted,
 * or when the provided `signal` aborts.
 */
export async function retry(fn, options = {}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 30_000;
  const shouldRetry = options.shouldRetry ?? (() => true);
  const sleep = options.sleep ?? defaultSleep;
  const random = options.random ?? Math.random;

  if (maxAttempts < 1) {
    throw new ResilienceError('exhausted', 'maxAttempts must be >= 1', {
      attempts: 0,
    });
  }

  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (options.signal?.aborted) {
      throw new ResilienceError('aborted', 'retry aborted by signal', {
        attempts: attempt - 1,
        cause: options.signal.reason,
      });
    }

    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt >= maxAttempts;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        break;
      }

      const delayMs = computeBackoff(attempt, baseDelayMs, maxDelayMs, random);
      options.onRetry?.({ error, attempt, delayMs });
      await sleep(delayMs);
    }
  }

  if (lastError instanceof ResilienceError) {
    throw lastError;
  }
  throw new ResilienceError(
    'exhausted',
    `operation failed after ${maxAttempts} attempt(s)`,
    { attempts: maxAttempts, cause: lastError },
  );
}
