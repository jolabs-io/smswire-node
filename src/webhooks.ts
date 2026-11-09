import { SMSWireSignatureError } from './errors';
import type { WebhookEvent } from './types';

export interface VerifyOptions {
  /** Oldest (and furthest in the future) signature accepted, in seconds. Default 300. */
  tolerance?: number;
  /** The current time in unix seconds; for tests. */
  now?: number;
}

/** The header the signature arrives in. */
export const SIGNATURE_HEADER = 'X-SMSWire-Signature';

const encoder = new TextEncoder();

function bytes(body: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof body === 'string') return encoder.encode(body);
  return body instanceof Uint8Array ? body : new Uint8Array(body);
}

/** `t=<unix>,v1=<hex>[,v1=<hex>…]`, in any order; null when it isn't one. */
function parse(header: string): { t: number; signatures: string[] } | null {
  let t: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const key = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (key === 't' && /^\d+$/.test(value)) t = Number(value);
    else if (key === 'v1' && /^[0-9a-f]{64}$/i.test(value)) signatures.push(value.toLowerCase());
  }
  return t === null || !signatures.length ? null : { t, signatures };
}

async function hmacHex(secret: string, message: Uint8Array<ArrayBuffer>): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, message));
  return Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compares two equal-length strings without stopping at the first difference. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Checks a webhook's X-SMSWire-Signature against the **raw** request body (not re-serialised JSON)
 * and returns the parsed event. Throws SMSWireSignatureError when the signature is missing,
 * wrong, or more than `tolerance` seconds off.
 */
export async function verifyWebhook(
  rawBody: string | Uint8Array | ArrayBuffer,
  signature: string | null | undefined,
  secret: string,
  options: VerifyOptions = {},
): Promise<WebhookEvent> {
  if (!secret) throw new SMSWireSignatureError('No webhook signing secret given');
  const parsed = parse(signature ?? '');
  if (!parsed) throw new SMSWireSignatureError(`Missing or malformed ${SIGNATURE_HEADER} header`);
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.t) > (options.tolerance ?? 300)) {
    throw new SMSWireSignatureError('Signature timestamp is outside the tolerance');
  }
  const body = bytes(rawBody);
  const prefix = encoder.encode(`${parsed.t}.`);
  const signed = new Uint8Array(prefix.length + body.length);
  signed.set(prefix);
  signed.set(body, prefix.length);
  const expected = await hmacHex(secret, signed);
  if (!parsed.signatures.some((s) => constantTimeEqual(s, expected))) {
    throw new SMSWireSignatureError('Signature does not match');
  }
  return JSON.parse(new TextDecoder().decode(body)) as WebhookEvent;
}
