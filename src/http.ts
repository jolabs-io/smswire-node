import { SMSWireError } from './errors';

export interface HttpOptions {
  apiKey: string;
  baseUrl: string;
  maxRetries: number;
  maxRetryWait: number;
  timeout: number;
  fetch: typeof fetch;
  userAgent: string;
}

export interface Request {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Safe to repeat after a 5xx or a dropped connection (GET, PATCH, DELETE, or a POST with an Idempotency-Key). */
  idempotent: boolean;
}

const sleep = (seconds: number) => new Promise((r) => setTimeout(r, seconds * 1000));

/** Seconds from a Retry-After header (seconds or an HTTP date). */
function retryAfter(header: string | null): number | null {
  if (!header) return null;
  const n = Number(header);
  if (Number.isFinite(n)) return Math.max(0, n);
  const at = Date.parse(header);
  return Number.isNaN(at) ? null : Math.max(0, (at - Date.now()) / 1000);
}

/** Exponential backoff from 0.5 s, capped at 8 s, with up to 25% jitter. */
const backoff = (attempt: number) => Math.min(8, 0.5 * 2 ** attempt) * (1 + Math.random() * 0.25);

/** The SDK's error for a non-2xx answer. */
export async function errorFrom(res: Response): Promise<SMSWireError> {
  const text = await res.text().catch(() => '');
  let code = 'http_error';
  let message = `HTTP ${res.status}`;
  try {
    const body = JSON.parse(text) as { error?: unknown; message?: unknown };
    if (typeof body.error === 'string' && typeof body.message === 'string') {
      code = body.error;
      message = body.message;
    }
  } catch {
    // Not JSON (a proxy's error page): keep the generic code.
  }
  return new SMSWireError(res.status, code, message, retryAfter(res.headers.get('retry-after')));
}

/** Whether to try [err] again on attempt [attempt] (0-based), and after how long. */
export function retryDelay(err: SMSWireError, req: Pick<Request, 'idempotent'>, attempt: number, opts: Pick<HttpOptions, 'maxRetries' | 'maxRetryWait'>): number | null {
  if (attempt >= opts.maxRetries) return null;
  const retryable = err.status === 429 || (req.idempotent && (err.status === null || err.status >= 500));
  if (!retryable) return null;
  if (err.retryAfter !== null) return err.retryAfter <= opts.maxRetryWait ? err.retryAfter : null;
  return backoff(attempt);
}

export async function send<T>(opts: HttpOptions, req: Request): Promise<T> {
  const url = new URL(opts.baseUrl.replace(/\/+$/, '') + req.path);
  for (const [k, v] of Object.entries(req.query ?? {})) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const headers: Record<string, string> = {
    Authorization: `Bearer ${opts.apiKey}`,
    Accept: 'application/json',
    'User-Agent': opts.userAgent,
    ...req.headers,
  };
  if (req.body !== undefined) headers['Content-Type'] = 'application/json';
  const body = req.body === undefined ? undefined : JSON.stringify(req.body);

  for (let attempt = 0; ; attempt++) {
    let res: Response | undefined;
    let err: SMSWireError;
    try {
      res = await opts.fetch(url, { method: req.method, headers, body, signal: AbortSignal.timeout(opts.timeout) });
    } catch (e) {
      const timedOut = e instanceof Error && e.name === 'TimeoutError';
      err = new SMSWireError(
        null,
        timedOut ? 'timeout' : 'network_error',
        timedOut ? `No answer within ${opts.timeout} ms` : `Could not reach ${url.origin}: ${(e as Error).message}`,
        null,
        { cause: e },
      );
    }
    if (res?.ok) {
      const text = await res.text();
      return (text ? JSON.parse(text) : undefined) as T;
    }
    if (res) err = await errorFrom(res);
    const wait = retryDelay(err!, req, attempt, opts);
    if (wait === null) throw err!;
    await sleep(wait);
  }
}
