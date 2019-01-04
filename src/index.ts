import { CoreGuilds } from './core/guild';
import { CloudEngine } from './cloud';
import { LoggerLevel, Logger } from './logger';
import { Manager, MessageManager, GuildManager } from './manager';
import { GatewayManager } from './gateway';
import { CoreChannels } from './core/channel';
import { get, post, CoreOptions, Response } from 'request';

export class BotExecutor {
    private _botId: string;
    private _appId: string;
    private token: string;
    private logger: Logger;
    private _manager: Manager | undefined;
    private _cloud: CloudEngine | undefined;
    private _coreGuilds: CoreGuilds | undefined;
    private _coreChannels: CoreChannels | undefined;

    public constructor(
        private endpoint: string,
        botId: string,
        appId: string,
        token: string,
        type: BotExecuteType,
        logLevel: LoggerLevel,
        cloud?: CloudEngine
    ) {
        this._botId = botId;
        this._appId = appId;
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
        } else if (type === BotExecuteType.MESSAGE) {
            this._manager = new MessageManager(botId, appId);
        } else if (type === BotExecuteType.GUILD) {
            this._manager = new GuildManager(botId, appId);
        }
    }

    public execute(): void {
        if (this.manager) {
            this.manager.execute();
        }
    }

    public fire(type: 'GET' | 'POST', path: string, $body?: any): void {
        const url: string = this.endpoint + path;
        const options: CoreOptions = {
            headers: {
                "authorization": this._botId,
                "user-agent": this._appId
            },
            json: $body
        };
        this.logger.debug(`${type} -> ${path} [ ${this._appId} ]`);
        const callback: any = (error: any, res: Response, body: any) => {
                if (error) {
                    this.logger.err(`Error while firing [ ${type} ${path} ]: ` + error);
                    return;
                }
                this.logger.debug(`${res.statusCode} <- ${type} ${path} [ ${this._appId} ]`);
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

    get manager(): Manager | GatewayManager | MessageManager | undefined {
        return this._manager;
    }

    get botId(): string {
        return this._botId;
    }

    get appId(): string {
        return this._appId;
    }

}

export enum BotExecuteType {
    GATEWAY = 0,
    MESSAGE = 1,
    GUILD = 2
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
