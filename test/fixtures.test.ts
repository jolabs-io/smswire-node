import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SMSWire, SMSWireError, SMSWireSignatureError, verifyWebhook } from '../src';

/* The shared vectors in sdks/fixtures, which every SDK passes the same way. */
type Case = Record<string, any>;
const fixture = (name: string): { cases: Case[]; [k: string]: any } => JSON.parse(readFileSync(new URL(`../../fixtures/${name}`, import.meta.url), 'utf8'));

describe('webhook signatures', () => {
  const { secret, tolerance, cases } = fixture('webhooks.json');
  it.each(cases.map((c) => [c.name, c] as [string, Case]))('%s', async (_, c) => {
    const result = verifyWebhook(c.body, c.header, secret, { tolerance, now: c.now });
    if (c.valid) {
      expect((await result).event).toBe(c.event ?? 'message.status');
      // Bytes verify the same as a string.
      await expect(verifyWebhook(new TextEncoder().encode(c.body), c.header, secret, { tolerance, now: c.now })).resolves.toBeTruthy();
    } else {
      await expect(result).rejects.toBeInstanceOf(SMSWireSignatureError);
    }
  });
});

describe('errors and retries', () => {
  const { cases, max_retry_wait } = fixture('errors.json');
  beforeEach(() => {
    // Retries don't really wait.
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => {
      fn();
      return 0;
    }) as any);
  });
  afterEach(() => vi.restoreAllMocks());

  function client(c: any) {
    const calls: RequestInit[] = [];
    const fetch = vi.fn(async (_url: URL, init: RequestInit) => {
      calls.push(init);
      if (calls.length === 1) return new Response(c.body, { status: c.status, headers: c.headers });
      return Response.json({ id: 'msg_1', to: '+1', expires_at: '', message_id: 'msg_1' });
    });
    return { calls, sms: new SMSWire({ apiKey: 'k', project: 'p', fetch: fetch as any, maxRetries: 1, maxRetryWait: max_retry_wait }) };
  }

  for (const [kind, flag, call] of [
    ['a safe request', 'retry', (s: SMSWire) => s.messages.get('msg_1')],
    ['a POST without idempotency', 'retry_post', (s: SMSWire) => s.otp.send({ to: '+1' })],
  ] as const) {
    it.each(cases.map((c) => [c.name, c] as [string, Case]))(`${kind}: %s`, async (_, c) => {
      const { calls, sms } = client(c);
      if (c[flag]) {
        await expect(call(sms)).resolves.toBeTruthy();
        expect(calls).toHaveLength(2);
      } else {
        const err = await call(sms).catch((e) => e);
        expect(err).toBeInstanceOf(SMSWireError);
        expect({ status: err.status, code: err.code, message: err.message, retryAfter: err.retryAfter }).toEqual({
          status: c.status,
          code: c.code,
          message: c.message,
          retryAfter: c.retry_after,
        });
        expect(calls).toHaveLength(1);
      }
    });
  }
});
