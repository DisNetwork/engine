export class Logger {
    private prefix: string;
    private level: LoggerLevel;

    public constructor(level: LoggerLevel, prefix: string) {
        this.level = level;
        this.prefix = prefix;
    }

    public print(level: LoggerLevel, message: string): void {
        if (level >= this.level) {
            console.log(`${this.prefix}${message}`);
        }
    }

    public err(message: string): void {
        this.print(LoggerLevel.ERR, message);
    }

    public warn(message: string): void {
        this.print(LoggerLevel.WARN, message);
    }

    public info(message: string): void {
        this.print(LoggerLevel.INFO, message);
    }

    public debug(message: string): void {
        this.print(LoggerLevel.DEBUG, message);
    }

}

export enum LoggerLevel {
    ERR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    OFF = 4
}
