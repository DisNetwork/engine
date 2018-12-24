/**
 * A manager that can be executed
 */
export declare interface Manager {

    /**
     * Execute the manager
     */
    execute(): void;
}

/**
 * Controlling the way to log in console
 */
export declare class Logger {
    
    constructor(level: LoggerLevel, prefix: string);

    /**
     * Log with the customize of the level
     */
    print(level: LoggerLevel, message: string): void;

    /**
     * Log with error level
     */
    err(message: string): void;

    /**
     * Log with warn level
     */
    warn(message: string): void;

    /**
     * Log with info level
     */
    info(message: string): void;

    /**
     * Log with debug level
     */
    debug(message: string): void;
}

/**
 * Levels of logging
 */
export declare enum LoggerLevel {
    ERR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    OFF = 4
}
