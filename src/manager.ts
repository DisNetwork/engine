import { ExecutorManager, ProcessData } from "./protocol";

export interface Manager {
    execute(): void;
}

export class MessageManager implements Manager {
    public type: 'create' | 'update' | 'delete' = 'create';

    public constructor(
        private botId: string,
        private appId: string
    ) {
    }

    public execute(): void {
        const executorManager: ExecutorManager = ExecutorManager.instance;
        executorManager.execute(this.botId, this.appId, {
            type: this.type
        }, (data: ProcessData) => {
            if (data.code === 0) {
                console.log("Executed message");
            }
        });
        return;
    }
}
