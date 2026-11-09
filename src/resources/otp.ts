import type { Otp, OtpVerification, SendOtpParams, VerifyOtpParams } from '../types';
import type { Call } from './messages';

export class OneTimeCodes {
  constructor(
    private readonly call: Call,
    private readonly base: string,
  ) {}

  /** Texts a fresh code to `to`. Keep the returned `id` for verify(). */
  send(params: SendOtpParams): Promise<Otp> {
    return this.call({ method: 'POST', path: this.base, body: params, idempotent: false });
  }

  /** Checks what the user typed. `valid` is false with a `reason` when it's wrong, expired or used. */
  verify(params: VerifyOtpParams): Promise<OtpVerification> {
    return this.call({ method: 'POST', path: `${this.base}/verify`, body: params, idempotent: false });
  }
}
