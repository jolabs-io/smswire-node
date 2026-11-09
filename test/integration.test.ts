import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SMSWire, SMSWireError, verifyWebhook } from '../src';

/*
 * Against the real API (apps/api's sdk-server: in-memory database, a phone that delivers at
 * once). Skipped outside the monorepo.
 */
const api = fileURLToPath(new URL('../../../apps/api/', import.meta.url));
const tsx = `${api}node_modules/.bin/tsx`;

interface Server { baseUrl: string; project: string; apiKey: string; webhookSecret: string; control: string }

describe.skipIf(!existsSync(tsx))('against the API', () => {
  let child: ChildProcess;
  let server: Server;
  let sms: SMSWire;
  const control = async <T>(path: string, body?: unknown): Promise<T> =>
    (await fetch(server.control + path, body ? { method: 'POST', body: JSON.stringify(body) } : {})).json() as Promise<T>;
  const eventually = async <T>(read: () => Promise<T>, ok: (v: T) => boolean): Promise<T> => {
    for (let i = 0; i < 100; i++) {
      const v = await read();
      if (ok(v)) return v;
      await new Promise((r) => setTimeout(r, 50));
    }
    throw new Error('timed out');
  };

  beforeAll(async () => {
    child = spawn(tsx, ['test/sdkServer.ts'], { cwd: api, stdio: ['pipe', 'pipe', 'inherit'] });
    const [line] = await createInterface({ input: child.stdout! })[Symbol.asyncIterator]().next().then((r) => [r.value as string]);
    server = JSON.parse(line!);
    sms = new SMSWire({ apiKey: server.apiKey, project: server.project, baseUrl: server.baseUrl, webhookSecret: server.webhookSecret });
  }, 60_000);
  afterAll(() => {
    child?.kill();
  });

  it('sends a message that the phone delivers', async () => {
    const sent = await sms.messages.send({ to: '+251911234567', body: 'Your order shipped', tags: ['orders'], metadata: { order: 7 } });
    expect(sent).toMatchObject({ status: 'queued', tags: ['orders'], metadata: { order: 7 }, segments: 1 });
    const delivered = await eventually(() => sms.messages.get(sent.id), (m) => m.status === 'delivered');
    expect(delivered.delivered_at).toBeTruthy();
    const page = await sms.messages.list({ tag: 'orders' });
    expect(page.data.map((m) => m.id)).toContain(sent.id);
  });

  it('replays a send with the same idempotency key', async () => {
    const a = await sms.messages.send({ to: '+251911234567', body: 'Once' }, { idempotencyKey: 'order-42' });
    const b = await sms.messages.send({ to: '+251911234567', body: 'Once' }, { idempotencyKey: 'order-42' });
    expect(b.id).toBe(a.id);
  });

  it('cancels a scheduled message', async () => {
    const later = new Date(Date.now() + 3_600_000).toISOString();
    const m = await sms.messages.send({ to: '+251911234567', body: 'Later', send_at: later });
    expect((await sms.messages.cancel(m.id)).status).toBe('cancelled');
  });

  it('sends a batch and rejects bad numbers one by one', async () => {
    const result = await sms.messages.sendBulk({
      name: 'SDK test',
      body: 'Hi {{name}}',
      messages: [
        { to: '+251911234567', variables: { name: 'Abebe' } },
        { to: 'not a number', variables: { name: 'Nobody' } },
      ],
    });
    expect(result.accepted).toBe(1);
    expect(result.rejected).toMatchObject([{ index: 1, to: 'not a number' }]);
  });

  it('sends and verifies a one-time code', async () => {
    const otp = await sms.otp.send({ to: '+251922345678', length: 6 });
    const text = await eventually(
      () => control<{ messageId: string; body: string }[]>('/sms'),
      (all) => all.some((s) => s.messageId === otp.message_id),
    );
    const code = text.find((s) => s.messageId === otp.message_id)!.body.match(/\d{6}/)![0];
    expect(await sms.otp.verify({ id: otp.id, code: code === '000000' ? '111111' : '000000' })).toEqual({ valid: false, reason: 'invalid' });
    expect(await sms.otp.verify({ id: otp.id, code })).toMatchObject({ valid: true });
    expect(await sms.otp.verify({ id: otp.id, code })).toMatchObject({ valid: false, reason: 'already_used' });
  });

  it('manages a recurring send', async () => {
    const created = await sms.schedules.create({ name: 'Weekly', cron: '0 9 * * 1', timezone: 'Africa/Addis_Ababa', to: '+251911234567', body: 'Weekly report' });
    expect(created).toMatchObject({ name: 'Weekly', enabled: true, recipients: { numbers: 1 } });
    expect((await sms.schedules.update(created.id, { enabled: false })).enabled).toBe(false);
    expect((await sms.schedules.list()).data.map((s) => s.id)).toContain(created.id);
    expect((await sms.schedules.get(created.id)).id).toBe(created.id);
    await sms.schedules.delete(created.id);
    await expect(sms.schedules.get(created.id)).rejects.toMatchObject({ status: 404 });
  });

  it('verifies the webhooks the API really sends', async () => {
    await control('/reply', { from: '+251911234567', body: 'Thanks!' });
    const hooks = await eventually(
      () => control<{ body: string; headers: Record<string, string> }[]>('/webhooks'),
      (all) => all.some((h) => h.headers['X-SMSWire-Event'] === 'message.received') && all.some((h) => JSON.parse(h.body).status === 'delivered'),
    );
    for (const hook of hooks) {
      const event = await sms.webhooks.verify(hook.body, hook.headers['X-SMSWire-Signature']);
      expect(event.event).toBe(hook.headers['X-SMSWire-Event']);
    }
    const tampered = hooks[0]!.body.replace('+251', '+252');
    await expect(verifyWebhook(tampered, hooks[0]!.headers['X-SMSWire-Signature'], server.webhookSecret)).rejects.toThrow();
  });

  it('turns API errors into SMSWireError', async () => {
    const wrong = new SMSWire({ apiKey: 'smswire_live_wrong', project: server.project, baseUrl: server.baseUrl });
    const err = await wrong.messages.list().catch((e) => e);
    expect(err).toBeInstanceOf(SMSWireError);
    expect(err).toMatchObject({ status: 401, code: 'invalid_api_key' });
    await expect(sms.messages.send({ to: '+251911234567' } as never)).rejects.toMatchObject({ status: 400, code: 'invalid_request' });
  });
});
