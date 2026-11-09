import { send, type HttpOptions, type Request } from './http';
import { Messages } from './resources/messages';
import { OneTimeCodes } from './resources/otp';
import { Schedules } from './resources/schedules';
import type { WebhookEvent } from './types';
import { verifyWebhook, type VerifyOptions } from './webhooks';

export const VERSION = '0.1.0';

export interface ClientOptions {
  /** The project's API key (`smswire_live_…`). Defaults to SMSWIRE_KEY. */
  apiKey?: string;
  /** The project's slug, the part after /p/ in its endpoint. Defaults to SMSWIRE_PROJECT. */
  project?: string;
  /** Defaults to SMSWIRE_URL, then https://api.smswire.app. */
  baseUrl?: string;
  /** Signing secret (`whsec_…`) for webhooks.verify(). Defaults to SMSWIRE_WEBHOOK_SECRET. */
  webhookSecret?: string;
  /** Retries after a 429, a 5xx or a network error (see the README for which calls). Default 2. */
  maxRetries?: number;
  /** Longest Retry-After worth waiting for, in seconds; longer ones throw at once. Default 60. */
  maxRetryWait?: number;
  /** Per-attempt timeout in milliseconds. Default 30 000. */
  timeout?: number;
  /** A fetch implementation, for runtimes or tests that need their own. */
  fetch?: typeof fetch;
}

const env = (name: string): string | undefined =>
  typeof process === 'undefined' ? undefined : process.env?.[name] || undefined;

export class SMSWire {
  readonly messages: Messages;
  readonly otp: OneTimeCodes;
  readonly schedules: Schedules;
  readonly webhooks: { verify(rawBody: string | Uint8Array | ArrayBuffer, signature: string | null | undefined, options?: VerifyOptions): Promise<WebhookEvent> };

  constructor(options: ClientOptions = {}) {
    const apiKey = options.apiKey ?? env('SMSWIRE_KEY');
    const project = options.project ?? env('SMSWIRE_PROJECT');
    if (!apiKey) throw new Error('SMSWire: pass apiKey or set SMSWIRE_KEY');
    if (!project) throw new Error('SMSWire: pass project or set SMSWIRE_PROJECT');

    const http: HttpOptions = {
      apiKey,
      baseUrl: options.baseUrl ?? env('SMSWIRE_URL') ?? 'https://api.smswire.app',
      maxRetries: options.maxRetries ?? 2,
      maxRetryWait: options.maxRetryWait ?? 60,
      timeout: options.timeout ?? 30_000,
      fetch: options.fetch ?? globalThis.fetch.bind(globalThis),
      userAgent: `smswire-node/${VERSION}`,
    };
    const call = <T>(req: Request) => send<T>(http, req);
    const p = `/v1/p/${encodeURIComponent(project)}`;
    this.messages = new Messages(call, `${p}/messages`);
    this.otp = new OneTimeCodes(call, `${p}/otp`);
    this.schedules = new Schedules(call, `${p}/schedules`);

    const secret = options.webhookSecret ?? env('SMSWIRE_WEBHOOK_SECRET');
    this.webhooks = {
      verify: (rawBody, signature, opts) => {
        if (!secret) throw new Error('SMSWire: pass webhookSecret or set SMSWIRE_WEBHOOK_SECRET');
        return verifyWebhook(rawBody, signature, secret, opts);
      },
    };
  }
}
