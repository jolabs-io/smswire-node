import type { CreateScheduleParams, Schedule, SchedulePage, UpdateScheduleParams } from '../types';
import type { Call } from './messages';

export class Schedules {
  constructor(
    private readonly call: Call,
    private readonly base: string,
  ) {}

  /** A message (or batch) sent again and again on a cron schedule. */
  create(params: CreateScheduleParams): Promise<Schedule> {
    return this.call({ method: 'POST', path: this.base, body: params, idempotent: false });
  }

  list(): Promise<SchedulePage> {
    return this.call({ method: 'GET', path: this.base, idempotent: true });
  }

  /** One schedule, with its recent runs. */
  get(id: string): Promise<Schedule> {
    return this.call({ method: 'GET', path: `${this.base}/${encodeURIComponent(id)}`, idempotent: true });
  }

  /** Absent fields stay as they are; recipients can't change. */
  update(id: string, params: UpdateScheduleParams): Promise<Schedule> {
    return this.call({ method: 'PATCH', path: `${this.base}/${encodeURIComponent(id)}`, body: params, idempotent: true });
  }

  async delete(id: string): Promise<void> {
    await this.call({ method: 'DELETE', path: `${this.base}/${encodeURIComponent(id)}`, idempotent: true });
  }
}
