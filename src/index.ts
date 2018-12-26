import { CloudEngine } from './cloud';
import { LoggerLevel, Logger } from './logger';
import { Manager } from './manager';
import { GatewayManager } from './gateway';

export class BotExecutor {
    private static instance: BotExecutor;
    private token: string;
    private logger: Logger;
    private manager: Manager | GatewayManager | undefined;
    private _cloud: CloudEngine | undefined;

    public constructor(
        token: string,
        type: BotExecuteType,
        logLevel: LoggerLevel,
        cloud?: CloudEngine
    ) {
        if (BotExecutor.instance) {
            throw new Error("More then one instance for the bot executor");
        }
        this.token = token;
        this.logger = new Logger(logLevel, "[DisNetwork] [LOG] ");
        if (cloud) {
            this._cloud = cloud;
        }
        if (type === BotExecuteType.GATEWAY) {
            this.manager = new GatewayManager(this.token, this.logger);
            this.manager.execute();
        }
    }

    get cloud(): CloudEngine | undefined {
        return this._cloud;
    }

}

export enum BotExecuteType {
    GATEWAY = 0
}

// Export everything from Manager
export * from './manager';

// Export everything from the logger
export * from './logger';

// Export everything from the cloud
export * from './cloud';

// Export everything from the cloud/database
export * from "./cloud/database";
