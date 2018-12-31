import { CoreGuilds } from './core/guild';
import { CloudEngine } from './cloud';
import { LoggerLevel, Logger } from './logger';
import { Manager } from './manager';
import { GatewayManager } from './gateway';
import { CoreChannels } from './core/channel';
import { get, post, CoreOptions, Response } from 'request';

export class BotExecutor {
    private static instance: BotExecutor;
    private appId: string;
    private token: string;
    private logger: Logger;
    private _manager: Manager | GatewayManager | undefined;
    private _cloud: CloudEngine | undefined;
    private _coreGuilds: CoreGuilds | undefined;
    private _coreChannels: CoreChannels | undefined;

    public constructor(
        private endpoint: string,
        appId: string,
        token: string,
        type: BotExecuteType,
        logLevel: LoggerLevel,
        cloud?: CloudEngine
    ) {
        if (BotExecutor.instance) {
            throw new Error("More then one instance for the bot executor");
        }
        this.appId = appId;
        this.token = token;
        this.logger = new Logger(logLevel, "[DisNetwork] [LOG] ");
        if (cloud) {
            this._cloud = cloud;
        } else {
            this._coreGuilds = new CoreGuilds();
            this._coreChannels = new CoreChannels();
        }
        if (type === BotExecuteType.GATEWAY) {
            this._manager = new GatewayManager(this, this.token, this.logger);
        }
    }

    public execute(): void {
        if (this.manager) {
            this.manager.execute();
        }
    }

    public fire(type: 'GET' | 'POST', path: string, payload: any): void {
        const url: string = this.endpoint + path;
        const options: CoreOptions = {
            headers: {
                authorization: this.appId
            }
        };
        this.logger.debug(`${type} -> ${path} [ ${this.appId} ]`);
        const callback: any = (error: any, res: Response, body: any) => {
                if (error) {
                    this.logger.err(`Error while firing [ ${type} ${path} ]: ` + error);
                    return;
                }
                this.logger.debug(`${res.statusCode} <- ${type} ${path} [ ${this.appId} ]`);
            };
        if (type === 'GET') {
            get(url, options, callback);
        } else if (type === 'POST') {
            post(url, options, callback);
        }
        return;
    }

    get cloud(): CloudEngine | undefined {
        return this._cloud;
    }

    get coreGuilds(): CoreGuilds | undefined {
        return this._coreGuilds;
    }

    get coreChannels(): CoreChannels | undefined {
        return this._coreChannels;
    }

    get manager(): Manager | GatewayManager | undefined {
        return this._manager;
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
export * from "./cloud/database";

// Export everything from the core
export * from "./core";
export * from "./core/guild";
