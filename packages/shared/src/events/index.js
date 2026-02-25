"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KAFKA_TOPICS = exports.KAFKA_CONFIG = void 0;
__exportStar(require("./user.events"), exports);
exports.KAFKA_CONFIG = {
    brokers: ['localhost:9092'],
    clientId: 'ai-interview-platform',
    groupId: 'ai-interview-group',
};
exports.KAFKA_TOPICS = {
    USER_COMMANDS: 'user-commands',
    USER_COMMANDS_DLQ: 'user-commands-dlq',
    INTERVIEW_COMMANDS: 'interview-commands',
    INTERVIEW_COMMANDS_DLQ: 'interview-commands-dlq',
    AUTH_EVENTS: 'auth-events',
    AUTH_EVENTS_DLQ: 'auth-events-dlq',
    USER_EVENTS: 'user-events',
    USER_EVENTS_DLQ: 'user-events-dlq',
    INTERVIEW_EVENTS: 'interview-events',
    INTERVIEW_EVENTS_DLQ: 'interview-events-dlq',
    ANALYSIS_EVENTS: 'analysis-events',
    ANALYSIS_EVENTS_DLQ: 'analysis-events-dlq',
    USER_ANALYTICS: 'user-analytics',
    USER_ANALYTICS_DLQ: 'user-analytics-dlq',
};
//# sourceMappingURL=index.js.map