import type { components, operations } from './types.gen';

type S = components['schemas'];

export type MessageType = S['MessageType'];
export type MessageStatus = S['MessageStatus'];
export type SendMessageParams = S['SendMessageRequest'];
export type BulkItem = S['BulkItem'];
export type SendBulkParams = S['BulkSendRequest'];
export type Message = S['MessageView'];
export type MessagePage = S['MessagePage'];
export type BulkResult = S['BulkSendResponse'];
export type RejectedItem = S['RejectedItem'];
export type ListMessagesParams = NonNullable<operations['listMessages']['parameters']['query']>;
export type SendOtpParams = S['OtpRequest'];
export type Otp = S['OtpResponse'];
export type VerifyOtpParams = S['OtpVerifyRequest'];
export type OtpVerification = S['OtpVerifyResponse'];
export type OtpFailure = S['OtpFailure'];
export type CreateScheduleParams = S['ScheduleRequest'];
export type UpdateScheduleParams = S['ScheduleUpdate'];
export type Schedule = S['ScheduleView'];
export type ScheduleRun = S['ScheduleRunView'];
export type SchedulePage = S['SchedulePage'];
export type StatusEvent = S['StatusWebhookPayload'];
export type ReceivedEvent = S['InboundWebhookPayload'];
export type AlertEvent = S['AlertWebhookPayload'];
/** Anything POSTed to a webhook; narrow on `event`. */
export type WebhookEvent = StatusEvent | ReceivedEvent | AlertEvent;
