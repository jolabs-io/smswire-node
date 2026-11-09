import { afterEach, describe, expect, it, vi } from 'vitest';
import { SMSWire, SMSWireError } from '../src';

function recorder(...responses: (() => Response | Promise<Response>)[]) {
  const calls: { url: URL; init: RequestInit }[] = [];
  const fetch = vi.fn(async (url: URL, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses[Math.min(calls.length, responses.length) - 1]!;
    return next();
  });
  return { calls, fetch: fetch as unknown as typeof globalThis.fetch };
}
const ok = (body: unknown, status = 200) => () => Response.json(body, { status });

describe('SMSWire client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('sends with the key, project path, JSON body and a fresh Idempotency-Key', async () => {
    const { calls, fetch } = recorder(ok({ id: 'msg_1' }, 202));
    const sms = new SMSWire({ apiKey: 'smswire_live_x', project: 'prj_1', baseUrl: 'https://gw.test/', fetch });
    await sms.messages.send({ to: '+251911234567', body: 'Hi' });
    await sms.messages.send({ to: '+251911234567', body: 'Hi' });
    const [first, second] = calls;
    expect(first!.url.toString()).toBe('https://gw.test/v1/p/prj_1/messages');
    expect(first!.init.method).toBe('POST');
    const headers = first!.init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer smswire_live_x');
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toMatch(/^smswire-node\//);
    expect(JSON.parse(first!.init.body as string)).toEqual({ to: '+251911234567', body: 'Hi' });
    const key = (h: RequestInit) => (h.headers as Record<string, string>)['Idempotency-Key'];
    expect(key(first!.init)).toMatch(/^[0-9a-f-]{36}$/);
    expect(key(second!.init)).not.toBe(key(first!.init));
  });

  it('keeps your Idempotency-Key across its own retries', async () => {
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => (fn(), 0)) as any);
    const { calls, fetch } = recorder(() => Promise.reject(new TypeError('fetch failed')), ok({ id: 'msg_1' }, 202));
    const sms = new SMSWire({ apiKey: 'k', project: 'p', fetch });
    await sms.messages.send({ to: '+1', body: 'x' }, { idempotencyKey: 'order-1234' });
    expect(calls.map((c) => (c.init.headers as Record<string, string>)['Idempotency-Key'])).toEqual(['order-1234', 'order-1234']);
  });

  it('does not retry a bulk send after a dropped connection', async () => {
    const { calls, fetch } = recorder(() => Promise.reject(new TypeError('fetch failed')));
    const sms = new SMSWire({ apiKey: 'k', project: 'p', fetch });
    const err = await sms.messages.sendBulk({ messages: [{ to: '+1', body: 'x' }] }).catch((e) => e);
    expect(err).toBeInstanceOf(SMSWireError);
    expect(err).toMatchObject({ status: null, code: 'network_error' });
    expect(calls).toHaveLength(1);
  });

  it('gives up after maxRetries', async () => {
    vi.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void) => (fn(), 0)) as any);
    const { calls, fetch } = recorder(ok({ error: 'internal_error', message: 'Boom' }, 503));
    const sms = new SMSWire({ apiKey: 'k', project: 'p', fetch, maxRetries: 3 });
    await expect(sms.messages.get('msg_1')).rejects.toMatchObject({ status: 503, code: 'internal_error' });
    expect(calls).toHaveLength(4);
  });

  it('reports a timeout', async () => {
    const fetch = (async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    }) as unknown as typeof globalThis.fetch;
    const sms = new SMSWire({ apiKey: 'k', project: 'p', fetch, maxRetries: 0, timeout: 5 });
    await expect(sms.messages.get('msg_1')).rejects.toMatchObject({ status: null, code: 'timeout' });
  });

  it('lists with query parameters and walks every page', async () => {
    const { calls, fetch } = recorder(
      ok({ data: [{ id: 'a' }, { id: 'b' }], next_cursor: 'c1' }),
      ok({ data: [{ id: 'c' }], next_cursor: null }),
    );
    const sms = new SMSWire({ apiKey: 'k', project: 'p', fetch });
    const ids: string[] = [];
    for await (const m of sms.messages.listAll({ status: 'delivered', tag: 'login', limit: 2 })) ids.push(m.id);
    expect(ids).toEqual(['a', 'b', 'c']);
    expect(calls[0]!.url.search).toBe('?status=delivered&tag=login&limit=2');
    expect(calls[1]!.url.searchParams.get('cursor')).toBe('c1');
  });

  it('reads its settings from the environment', async () => {
    vi.stubEnv('SMSWIRE_KEY', 'env_key');
    vi.stubEnv('SMSWIRE_PROJECT', 'env_project');
    vi.stubEnv('SMSWIRE_URL', 'https://env.test');
    const { calls, fetch } = recorder(ok({ data: [] }));
    await new SMSWire({ fetch }).schedules.list();
    expect(calls[0]!.url.toString()).toBe('https://env.test/v1/p/env_project/schedules');
    expect((calls[0]!.init.headers as Record<string, string>).Authorization).toBe('Bearer env_key');
  });

  it('needs a key and a project', () => {
    vi.stubEnv('SMSWIRE_KEY', '');
    vi.stubEnv('SMSWIRE_PROJECT', '');
    expect(() => new SMSWire({ project: 'p' })).toThrow(/apiKey/);
    expect(() => new SMSWire({ apiKey: 'k' })).toThrow(/project/);
  });

  it('treats a 204 as no body', async () => {
    const { fetch } = recorder(() => new Response(null, { status: 204 }));
    await expect(new SMSWire({ apiKey: 'k', project: 'p', fetch }).schedules.delete('sch_1')).resolves.toBeUndefined();
  });
});
