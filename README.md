# SMSWire for Node.js

Send SMS and one-time codes from your app through your own Android phones with [SMSWire](https://smswire.app).

```sh
npm install smswire
```

Node 20+ (also Bun, Deno and edge runtimes with `fetch` and Web Crypto). No dependencies.

## Set up

Each project on the dashboard has an API key and a slug (the part after `/p/` in its endpoint). Keep them in the environment:

```sh
SMSWIRE_KEY="smswire_live_…"
SMSWIRE_PROJECT="prj_…"
SMSWIRE_WEBHOOK_SECRET="whsec_…"   # only if you receive webhooks
# SMSWIRE_URL="https://api.smswire.app"   # your server, if you host SMSWire yourself
```

```ts
import { SMSWire } from 'smswire';

const sms = new SMSWire(); // or new SMSWire({ apiKey, project, baseUrl })
```

## Send

```ts
const message = await sms.messages.send({
  to: '+251911234567',
  body: 'Your order {{order}} shipped',
  variables: { order: 'A-1042' },
  type: 'transactional',          // otp | transactional | notification | marketing
  tags: ['orders'],
  metadata: { user_id: 42 },      // echoed back in webhooks
});
// → { id: 'msg_…', status: 'queued', segments: 1, … }

// Your own idempotency key makes your retries safe too (the SDK adds a random one otherwise).
await sms.messages.send({ to, body }, { idempotencyKey: `order-${order.id}` });

await sms.messages.get(message.id);
await sms.messages.cancel(message.id);      // before it reaches a phone

const page = await sms.messages.list({ status: 'failed', limit: 50 });
for await (const m of sms.messages.listAll({ tag: 'orders' })) console.log(m.id, m.status);

const batch = await sms.messages.sendBulk({
  name: 'Weekend sale',
  body: 'Hi {{name}}, 20% off this weekend',
  rate: 30, // per minute
  messages: [{ to: '+251911234567', variables: { name: 'Abebe' } }, { to: '+251922345678', variables: { name: 'Sara' } }],
});
// → { batch_id, accepted, rejected: [{ index, to, reason }] }
```

## One-time codes

```ts
const otp = await sms.otp.send({ to: '+251911234567', length: 6, ttl: 300 });
// later, with what the user typed:
const { valid, reason } = await sms.otp.verify({ id: otp.id, code: input });
// reason: invalid | expired | too_many_attempts | already_used
```

## Recurring sends

```ts
const schedule = await sms.schedules.create({
  name: 'Weekly report',
  cron: '0 9 * * 1',
  timezone: 'Africa/Addis_Ababa',
  to: '+251911234567',
  body: 'Your weekly report is ready',
});
await sms.schedules.update(schedule.id, { enabled: false });
await sms.schedules.list();
await sms.schedules.delete(schedule.id);
```

## Webhooks

Status updates (`message.status`) and replies (`message.received`) are POSTed to the project's webhook URL, signed with `X-SMSWire-Signature`. Verify the **raw** body:

```ts
import express from 'express';
import { SMSWireSignatureError } from 'smswire';

app.post('/hooks/smswire', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = await sms.webhooks.verify(req.body, req.get('X-SMSWire-Signature'));
  } catch (e) {
    if (e instanceof SMSWireSignatureError) return res.sendStatus(400);
    throw e;
  }
  if (event.event === 'message.status') await markOrder(event.metadata, event.status);
  if (event.event === 'message.received') await handleReply(event.from, event.body);
  res.sendStatus(200);
});
```

Without a client: `verifyWebhook(rawBody, signature, secret)`. The same event can arrive twice; make the handler idempotent.

## Errors and retries

Failed calls throw `SMSWireError` with `status` (null when no answer came), `code` (`invalid_request`, `invalid_api_key`, `rate_limited`, `daily_limit_reached`, `network_error`, `timeout`, …), `message` and `retryAfter`.

The SDK retries (default `maxRetries: 2`, waiting `Retry-After` or backing off):

- reads, updates, deletes and `messages.send` (it carries an idempotency key): on 429, 5xx and network errors;
- `sendBulk`, `otp.send`, `otp.verify`, `schedules.create`: on 429 only, since a 5xx or a dropped connection may already have done the work.

A `Retry-After` longer than `maxRetryWait` (60 s, e.g. a daily limit) throws at once.
