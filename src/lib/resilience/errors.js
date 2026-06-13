// Vendored from cubiczan-resilience/typescript/src/errors.ts (types stripped for
// the Forge JS/ESM runtime). Keep API-compatible with the shared library.

/**
 * Typed error thrown by the resilience primitives. Carries a machine-readable
 * `kind` ("timeout" | "network" | "http" | "ssrf" | "exhausted" | "aborted"),
 * the number of attempts made, and (for HTTP failures) the status code.
 */
export class ResilienceError extends Error {
  constructor(kind, message, options = {}) {
    super(message);
    this.name = 'ResilienceError';
    this.kind = kind;
    this.attempts = options.attempts ?? 1;
    this.status = options.status;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
    Object.setPrototypeOf(this, ResilienceError.prototype);
  }
}

/** Type guard for ResilienceError. */
export function isResilienceError(value) {
  return value instanceof ResilienceError;
}
