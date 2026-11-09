// Generated from sdks/openapi.json by test/types.test.ts. Do not edit.
/* eslint-disable */
export interface paths {
    "/v1/p/{project}/messages": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        /** List messages, newest first */
        get: operations["listMessages"];
        put?: never;
        /** Send one SMS */
        post: operations["sendMessage"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/p/{project}/messages/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Message id (`msg_…`). */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        /** Get one message */
        get: operations["getMessage"];
        put?: never;
        post?: never;
        /** Cancel a message that has not reached a phone yet */
        delete: operations["cancelMessage"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/p/{project}/messages/bulk": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * Send a batch
         * @description Invalid or opted-out items are rejected one by one; the rest are queued as one batch.
         */
        post: operations["sendBulk"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/p/{project}/otp": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Text a fresh code */
        post: operations["sendOtp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/p/{project}/otp/verify": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Check a code */
        post: operations["verifyOtp"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/p/{project}/schedules": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        /** List the project's recurring sends */
        get: operations["listSchedules"];
        put?: never;
        /** Create a recurring send */
        post: operations["createSchedule"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/v1/p/{project}/schedules/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule id. */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        /** Get one recurring send, with its recent runs */
        get: operations["getSchedule"];
        put?: never;
        post?: never;
        /** Delete a recurring send */
        delete: operations["deleteSchedule"];
        options?: never;
        head?: never;
        /**
         * Change a recurring send
         * @description Absent fields stay as they are; recipients can't change.
         */
        patch: operations["updateSchedule"];
        trace?: never;
    };
}
export interface webhooks {
    alert: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * A phone needs attention, or is fine again
         * @description POSTed to the workspace's alert webhook URL.
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description Same for every retry of one delivery. */
                    "X-SMSWire-Delivery": string;
                    "X-SMSWire-Event": string;
                    /** @description `t=<unix seconds>,v1=<hex HMAC-SHA256(signing secret, "<t>.<raw body>")>`. Reject a `t` older than 5 minutes. */
                    "X-SMSWire-Signature": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["AlertWebhookPayload"];
                };
            };
            responses: {
                /** @description Received. Anything else (or no answer in 10 s) is retried. */
                "2XX": {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "message.received": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * The phone received a reply
         * @description POSTed to the project's webhook URL.
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description Same for every retry of one delivery. */
                    "X-SMSWire-Delivery": string;
                    "X-SMSWire-Event": string;
                    /** @description `t=<unix seconds>,v1=<hex HMAC-SHA256(signing secret, "<t>.<raw body>")>`. Reject a `t` older than 5 minutes. */
                    "X-SMSWire-Signature": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["InboundWebhookPayload"];
                };
            };
            responses: {
                /** @description Received. Anything else (or no answer in 10 s) is retried. */
                "2XX": {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "message.status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /**
         * A message changed status
         * @description POSTed to the project's webhook URL. One message's updates arrive in order; the same event can arrive twice.
         */
        post: {
            parameters: {
                query?: never;
                header: {
                    /** @description Same for every retry of one delivery. */
                    "X-SMSWire-Delivery": string;
                    "X-SMSWire-Event": string;
                    /** @description `t=<unix seconds>,v1=<hex HMAC-SHA256(signing secret, "<t>.<raw body>")>`. Reject a `t` older than 5 minutes. */
                    "X-SMSWire-Signature": string;
                };
                path?: never;
                cookie?: never;
            };
            requestBody: {
                content: {
                    "application/json": components["schemas"]["StatusWebhookPayload"];
                };
            };
            responses: {
                /** @description Received. Anything else (or no answer in 10 s) is retried. */
                "2XX": {
                    headers: {
                        [name: string]: unknown;
                    };
                    content?: never;
                };
            };
        };
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export interface components {
    schemas: {
        AlertWebhookPayload: {
            alert: {
                created_at: string;
                device: {
                    id: string;
                    name: string;
                };
                id: string;
                kind: string;
                message: string;
                resolved_at?: string | null;
            };
            /** @enum {string} */
            event: "alert.raised" | "alert.resolved" | "alert.test";
        };
        BulkItem: {
            body?: string | null;
            metadata?: components["schemas"]["Metadata"] | null;
            tags?: components["schemas"]["Tags"] | null;
            to: string;
            type?: components["schemas"]["MessageType"] | null;
            variables?: components["schemas"]["Variables"] | null;
        };
        BulkSendRequest: {
            body?: string | null;
            messages: components["schemas"]["BulkItem"][];
            metadata?: components["schemas"]["Metadata"] | null;
            name?: string | null;
            rate?: number | null;
            send_at?: string | null;
            sim?: number | null;
            tags?: components["schemas"]["Tags"] | null;
            template?: string | null;
            type?: components["schemas"]["MessageType"] | null;
        };
        BulkSendResponse: {
            accepted: number;
            batch_id: string;
            /** @default [] */
            rejected: components["schemas"]["RejectedItem"][];
        };
        Error: {
            error: string;
            message: string;
        };
        InboundWebhookPayload: {
            body: string;
            /** @constant */
            event: "message.received";
            from: string;
            id: string;
            project_id?: string | null;
            received_at: string;
            sim?: number | null;
        };
        MessagePage: {
            data: components["schemas"]["MessageView"][];
            next_cursor?: string | null;
        };
        /** @enum {string} */
        MessageStatus: "queued" | "sending" | "sent" | "delivered" | "failed" | "cancelled";
        /** @enum {string} */
        MessageType: "otp" | "transactional" | "notification" | "marketing";
        MessageView: {
            batch_id?: string | null;
            delivered_at?: string | null;
            error?: string | null;
            id: string;
            metadata?: {
                [key: string]: unknown;
            } | null;
            received_at: string;
            redacted?: boolean;
            scheduled_at?: string | null;
            segments: number;
            sent_at?: string | null;
            status: components["schemas"]["MessageStatus"];
            /** @default [] */
            tags: string[];
            to: string;
            /** @default transactional */
            type: components["schemas"]["MessageType"];
        };
        Metadata: {
            [key: string]: unknown;
        };
        /** @enum {string} */
        OtpFailure: "invalid" | "expired" | "too_many_attempts" | "already_used";
        OtpRequest: {
            body?: string | null;
            /** @default 6 */
            length?: number;
            sim?: number | null;
            template?: string | null;
            to: string;
            /** @default 300 */
            ttl?: number;
        };
        OtpResponse: {
            expires_at: string;
            id: string;
            message_id: string;
            to: string;
        };
        OtpVerifyRequest: {
            code: string;
            id: string;
        };
        OtpVerifyResponse: {
            reason?: components["schemas"]["OtpFailure"] | null;
            valid: boolean;
        };
        RejectedItem: {
            index: number;
            reason: string;
            to: string;
        };
        SchedulePage: {
            data: components["schemas"]["ScheduleView"][];
        };
        ScheduleRecipient: {
            to: string;
            variables?: components["schemas"]["Variables"] | null;
        };
        ScheduleRequest: {
            body?: string | null;
            cron: string;
            /** @default true */
            enabled?: boolean;
            ends_at?: string | null;
            group_ids?: string[] | null;
            max_runs?: number | null;
            messages?: components["schemas"]["ScheduleRecipient"][] | null;
            metadata?: components["schemas"]["Metadata"] | null;
            name?: string | null;
            rate?: number | null;
            sim?: number | null;
            tags?: components["schemas"]["Tags"] | null;
            template?: string | null;
            /** @default UTC */
            timezone?: string;
            to?: string | null;
            type?: components["schemas"]["MessageType"] | null;
            variables?: components["schemas"]["Variables"] | null;
        };
        ScheduleRunView: {
            accepted: number;
            at: string;
            batch_id?: string | null;
            error?: string | null;
            message_id?: string | null;
            rejected: number;
            /** @enum {string} */
            status: "sent" | "failed" | "skipped";
        };
        ScheduleUpdate: {
            body?: string | null;
            cron?: string | null;
            enabled?: boolean | null;
            ends_at?: string | null;
            max_runs?: number | null;
            name?: string | null;
            template?: string | null;
            timezone?: string | null;
            type?: components["schemas"]["MessageType"] | null;
        };
        ScheduleView: {
            body?: string | null;
            created_at: string;
            cron: string;
            enabled: boolean;
            ends_at?: string | null;
            id: string;
            last_run?: components["schemas"]["ScheduleRunView"] | null;
            last_run_at?: string | null;
            max_runs?: number | null;
            name: string;
            next_run_at?: string | null;
            recipients: {
                /** @default [] */
                group_ids: string[];
                numbers: number;
            };
            run_count: number;
            runs?: components["schemas"]["ScheduleRunView"][] | null;
            /** @default [] */
            tags: string[];
            template_id?: string | null;
            timezone: string;
            type?: components["schemas"]["MessageType"] | null;
        };
        SendMessageRequest: {
            body?: string | null;
            metadata?: components["schemas"]["Metadata"] | null;
            send_at?: string | null;
            sim?: number | null;
            tags?: components["schemas"]["Tags"] | null;
            template?: string | null;
            to: string;
            type?: components["schemas"]["MessageType"] | null;
            variables?: components["schemas"]["Variables"] | null;
        };
        StatusWebhookPayload: {
            batch_id?: string | null;
            delivered_at?: string | null;
            error?: string | null;
            /**
             * @default message.status
             * @constant
             */
            event: "message.status";
            id: string;
            metadata?: {
                [key: string]: unknown;
            } | null;
            project_id?: string | null;
            segments: number;
            sent_at?: string | null;
            status: components["schemas"]["MessageStatus"];
            /** @default [] */
            tags: string[];
            to: string;
            /** @default transactional */
            type: components["schemas"]["MessageType"];
        };
        Tags: string[];
        Variables: {
            [key: string]: string | number | boolean;
        };
    };
    responses: {
        /** @description Invalid request (`invalid_request`, …). */
        BadRequest: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description No such project, message or schedule. */
        NotFound: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description `rate_limited`, `daily_limit_reached`, `monthly_limit_reached` or `too_many_otp_requests`. */
        TooManyRequests: {
            headers: {
                /** @description Seconds until trying again makes sense. */
                "Retry-After"?: number;
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Missing or wrong API key. */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: {
        /** @description The project's slug. */
        Project: string;
    };
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listMessages: {
        parameters: {
            query?: {
                /** @description Only this batch. */
                batch_id?: string;
                /** @description `next_cursor` from the previous page. */
                cursor?: string;
                /** @description Received at or after (ISO 8601). */
                from?: string;
                /** @description Page size. */
                limit?: number;
                /** @description Only this status. */
                status?: components["schemas"]["MessageStatus"];
                /** @description Only messages with this tag. */
                tag?: string;
                /** @description Recipient number, or part of it. */
                to?: string;
                /** @description Only this type. */
                type?: components["schemas"]["MessageType"];
                /** @description Received before (ISO 8601). */
                until?: string;
            };
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description One page. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessagePage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    sendMessage: {
        parameters: {
            query?: never;
            header?: {
                /** @description Repeating a request with the same key returns the first message instead of sending again. */
                "Idempotency-Key"?: string;
            };
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SendMessageRequest"];
            };
        };
        responses: {
            /** @description Queued for the phone. */
            202: {
                headers: {
                    /** @description `true` when this is a replay of an earlier request. */
                    "Idempotent-Replayed"?: string;
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageView"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    getMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Message id (`msg_…`). */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The message. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageView"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    cancelMessage: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Message id (`msg_…`). */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The cancelled message. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["MessageView"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    sendBulk: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BulkSendRequest"];
            };
        };
        responses: {
            /** @description Batch queued. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["BulkSendResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    sendOtp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OtpRequest"];
            };
        };
        responses: {
            /** @description Code sent. */
            202: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OtpResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    verifyOtp: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OtpVerifyRequest"];
            };
        };
        responses: {
            /** @description Whether the code is right, and why not. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OtpVerifyResponse"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    listSchedules: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description All of them. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SchedulePage"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    createSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScheduleRequest"];
            };
        };
        responses: {
            /** @description Created. */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduleView"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    getSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule id. */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The schedule. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduleView"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    deleteSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule id. */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Deleted. */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
    updateSchedule: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Schedule id. */
                id: string;
                /** @description The project's slug. */
                project: components["parameters"]["Project"];
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ScheduleUpdate"];
            };
        };
        responses: {
            /** @description The updated schedule. */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ScheduleView"];
                };
            };
            400: components["responses"]["BadRequest"];
            401: components["responses"]["Unauthorized"];
            404: components["responses"]["NotFound"];
            429: components["responses"]["TooManyRequests"];
        };
    };
}
