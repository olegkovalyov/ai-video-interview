export * from './user.events';
export declare const KAFKA_CONFIG: {
    brokers: string[];
    clientId: string;
    groupId: string;
};
export declare const KAFKA_TOPICS: {
    readonly USER_COMMANDS: "user-commands";
    readonly USER_COMMANDS_DLQ: "user-commands-dlq";
    readonly INTERVIEW_COMMANDS: "interview-commands";
    readonly INTERVIEW_COMMANDS_DLQ: "interview-commands-dlq";
    readonly AUTH_EVENTS: "auth-events";
    readonly AUTH_EVENTS_DLQ: "auth-events-dlq";
    readonly USER_EVENTS: "user-events";
    readonly USER_EVENTS_DLQ: "user-events-dlq";
    readonly INTERVIEW_EVENTS: "interview-events";
    readonly INTERVIEW_EVENTS_DLQ: "interview-events-dlq";
    readonly ANALYSIS_EVENTS: "analysis-events";
    readonly ANALYSIS_EVENTS_DLQ: "analysis-events-dlq";
    readonly USER_ANALYTICS: "user-analytics";
    readonly USER_ANALYTICS_DLQ: "user-analytics-dlq";
};
