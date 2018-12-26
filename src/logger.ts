export class Logger {
    private prefix: string;
    private level: LoggerLevel;

    public constructor(level: LoggerLevel, prefix: string) {
        this.level = level;
        this.prefix = prefix;
    }

    public print(level: LoggerLevel, message: string): void {
        if (level <= this.level) {
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
    OFF = 5,
    DEBUG = 4,
    INFO = 3,
    WARN = 2,
    ERR = 1
}
