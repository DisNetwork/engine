import { ExecutorManager, ProcessData } from "./protocol";

export interface Manager {
    execute(): void;
}

export class MessageManager implements Manager {
    public type: 'create' | 'update' | 'delete' = 'create';
    public body: any;

    public constructor(
        private botId: string,
        private appId: string
    ) {
    }

    public execute(): void {
        const executorManager: ExecutorManager = ExecutorManager.instance;
        executorManager.execute(this.botId, this.appId, {
            type: this.type,
            body: this.body
        }, (data: ProcessData) => {
            if (data.code === 0) {
                console.log("Executed message");
            }
        });
        return;
    }
}

export enum GuildEventType {
    LOAD = "load",
    JOIN = "join",
    UPDATE = "update",
    DELETE = "delete",
    BAN_ADD = "ban_add",
    BAN_REMOVE = "ban_remove",
    EMOJIS_UPDATE = "emojis_update",
    INTEGRATIONS_UPDATE = "integrations_update",
    MEMBER_ADD = "member_add",
    MEMBER_REMOVE = "member_remove",
    MEMBER_UPDATE = "member_update"
}

export class GuildManager implements Manager {
    public type: GuildEventType = GuildEventType.LOAD;
    public body: any;

    public constructor(
        public botId: string,
        public appId: string
    ) {
    }

    public execute(): void {
        const executorManager: ExecutorManager = ExecutorManager.instance;
        executorManager.execute(this.botId, this.appId, {
            type: this.type,
            body: this.body
        }, (data) => {
            console.log("Executed guild");
        });
    }
}
