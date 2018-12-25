import { LoggerLevel, Logger } from './logger';
import { Manager } from './manager';
import { GatewayManager } from './gateway';

export class BotExecutor {
    private static instance: BotExecutor;
    private token: string;
    private logger: Logger;
    private manager: Manager | GatewayManager | undefined;

    public constructor(token: string, type: BotExecuteType, logLevel: LoggerLevel) {
        this.token = token;
        this.logger = new Logger(logLevel, "[DisNetwork] [LOG] ");
        if (BotExecutor.instance) {
            throw new Error("More then one instance for the bot executor");
        }
        if (type === BotExecuteType.GATEWAY) {
            this.manager = new GatewayManager(this.token, this.logger);
            this.manager.execute();
        }
    }

}

export enum BotExecuteType {
    GATEWAY = 0
}

// Export everything from Manager
export * from './manager';

// Export everything from the logger
export * from './logger';
