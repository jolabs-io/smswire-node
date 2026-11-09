import type { Request } from '../http';
import type { BulkResult, ListMessagesParams, Message, MessagePage, SendBulkParams, SendMessageParams } from '../types';

export type Call = <T>(req: Request) => Promise<T>;

export interface SendOptions {
  /**
   * Repeating a send with the same key returns the first message instead of sending again.
   * Defaults to a fresh random key, so the SDK's own retries never send twice; pass your own
   * (an order id, say) to make your retries safe too.
   */
  idempotencyKey?: string;
}

export class Messages {
  constructor(
    private readonly call: Call,
    private readonly base: string,
  ) {}

  /** Queues one SMS for the project's phone. */
  send(params: SendMessageParams, options: SendOptions = {}): Promise<Message> {
    return this.call({
      method: 'POST',
      path: this.base,
      body: params,
      headers: { 'Idempotency-Key': options.idempotencyKey ?? crypto.randomUUID() },
      idempotent: true,
    });
  }

  /** Queues a batch. Invalid or opted-out items come back in `rejected`; the rest go out as one batch. */
  sendBulk(params: SendBulkParams): Promise<BulkResult> {
    return this.call({ method: 'POST', path: `${this.base}/bulk`, body: params, idempotent: false });
  }

  get(id: string): Promise<Message> {
    return this.call({ method: 'GET', path: `${this.base}/${encodeURIComponent(id)}`, idempotent: true });
  }

  /** Stops a message that hasn't reached a phone yet. */
  cancel(id: string): Promise<Message> {
    return this.call({ method: 'DELETE', path: `${this.base}/${encodeURIComponent(id)}`, idempotent: true });
  }

  /** One page, newest first. Pass `next_cursor` back as `cursor` for the next. */
  list(params: ListMessagesParams = {}): Promise<MessagePage> {
    return this.call({ method: 'GET', path: this.base, query: params, idempotent: true });
  }

  /** Every matching message, newest first, fetching pages as you go. */
  async *listAll(params: Omit<ListMessagesParams, 'cursor'> = {}): AsyncGenerator<Message> {
    let cursor: string | null | undefined;
    do {
      const page = await this.list({ ...params, cursor: cursor ?? undefined });
      yield* page.data;
      cursor = page.next_cursor;
    } while (cursor);
  }
}
