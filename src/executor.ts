import { BotExecutor, BotExecuteType } from './index';
import { CloudEngine } from './cloud/index';
import { LoggerLevel } from './logger';

export class ExecutorManager {
    public static instance: ExecutorManager;

    private _cloud: CloudEngine | undefined;
    private apps: any | undefined;
    private map: Map<string, BotExecutor>;

    public constructor(
        cloud: CloudEngine | undefined,
        private logLevel: LoggerLevel,
        apps?: any
    ) {
        this._cloud = cloud;
        this.map = new Map();
        ExecutorManager.instance = this;
        if (apps !== undefined) {
            this.apps = apps;
        }
    }

    public executor(
        appId: string,
        type: BotExecuteType
    ): BotExecutor {
        let token: string = "";
        if (this.cloud === undefined) {
            token = this.apps[appId];
        } else {
            token = this.cloud.apps.get(appId);
        }
        const executor: BotExecutor = new BotExecutor(appId, token, type, this.logLevel, this.cloud);
        return executor;
    }

    public gateway(appId: string): BotExecutor {
        const executor: BotExecutor = this.executor(appId, BotExecuteType.GATEWAY);
        this.add('gateway_' + appId, executor);
        return executor;
    }

    public has(name: string): boolean {
        return this.map.has(name);
    }

    public add(name: string, executor: BotExecutor): void {
        this.map.set(name, executor);
    }

    public remove(name: string): void {
        if (this.map.has(name)) {
            this.map.delete(name);
        }
    }

    get cloud(): CloudEngine | undefined {
        return this._cloud;
    }
}
