import { SMSWire } from './client';

export { SMSWire, VERSION, type ClientOptions } from './client';
export { SMSWireError, SMSWireSignatureError } from './errors';
export { verifyWebhook, SIGNATURE_HEADER, type VerifyOptions } from './webhooks';
export type { SendOptions } from './resources/messages';
export type * from './types';
export default SMSWire;
