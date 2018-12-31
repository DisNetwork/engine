import { BotExecutor } from './index';
import { CloudEngine } from './cloud/index';

export class ExecutorManager {
    public static instance: ExecutorManager;

    private _cloud: CloudEngine | undefined;
    private map: Map<string, BotExecutor>;

    public constructor(cloud: CloudEngine | undefined) {
        this._cloud = cloud;
        this.map = new Map();
        ExecutorManager.instance = this;
    }

    public add(name: string, executor: BotExecutor) {
        this.map.set(name, executor);
    }

    public remove(name: string) {
        if (this.map.has(name)) {
            this.map.delete(name);
        }
    }

    get cloud(): CloudEngine | undefined {
        return this._cloud;
    }
}
