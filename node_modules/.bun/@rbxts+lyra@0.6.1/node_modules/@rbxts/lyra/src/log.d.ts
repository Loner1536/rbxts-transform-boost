/**
 * Represents a log message.
 *
 * @interface LogMessage
 */
export interface LogMessage {
    message: string;
    level: LogLevel;
    context?: Record<string, any>;
}

/**
 * An enum value representing a log level.
 *
 * @type {LogLevel}
 */
export type LogLevel = "fatal" | "error" | "warn" | "info" | "debug" | "trace";
