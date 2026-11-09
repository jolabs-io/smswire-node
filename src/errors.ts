/** A request that failed: the API's answer (status, code, message) or a network problem (status null). */
export class SMSWireError extends Error {
  override readonly name: string = 'SMSWireError';

  constructor(
    /** HTTP status, or null when no answer arrived. */
    readonly status: number | null,
    /** Stable machine code, e.g. `invalid_request`, `rate_limited`, `network_error`, `timeout`. */
    readonly code: string,
    message: string,
    /** Seconds until trying again makes sense (from Retry-After), when the API said. */
    readonly retryAfter: number | null = null,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}

/** A webhook whose signature is missing, wrong or too old. Answer it with 400. */
export class SMSWireSignatureError extends Error {
  override readonly name = 'SMSWireSignatureError';
}
