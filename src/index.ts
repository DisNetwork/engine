import { LoggerLevel, Logger } from './logger';

export class BotExecutor {
    private static instance: BotExecutor;
    private token: string;
    private logger: Logger;

    public constructor(token: string, type: BotExecuteType, logLevel: LoggerLevel) {
        this.token = token;
        this.logger = new Logger(logLevel, "[DisNetwork] [LOG] ");
        if (BotExecutor.instance) {
            throw new Error("More then one instance for the bot executor");
        }
        if (type === BotExecuteType.GATEWAY) {
            // TODO create and execute gateway manager
        }
    }

}

export enum BotExecuteType {
    GATEWAY
}

// Export everything from Manager
export * from './manager';

// Export everything from the logger
export * from './logger';
