import { ExecutorManager, ProcessData } from "./protocol";

export interface Manager {
    execute(): void;
}

export enum MessageEventType {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete",
    DELETE_BULK = "delete_bulk",
    REACTION_ADD = "reaction_add",
    REACTION_REMOVE = "reaction_remove",
    REACTION_REMOVE_ALL = "reaction_remove_all",
    TYPING = "typing"
}

export class MessageManager implements Manager {
    public type: MessageEventType = MessageEventType.CREATE;
    public body: any;

    public constructor(
        private botId: string,
        private appId: string
    ) {
    }

    public execute(): void {
        const executorManager: ExecutorManager = ExecutorManager.instance;
        executorManager.execute(this.botId, this.appId, {
            type: 'message_' + this.type,
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
    MEMBER_UPDATE = "member_update",
    ROLE_CREATE = "role_create",
    ROLE_UPDATE = "role_update",
    ROLE_DELETE = "role_delete"
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
            type: 'guild_' + this.type,
            body: this.body
        }, (data) => {
            console.log("Executed guild");
        });
    }
}

export class ChannelManager implements Manager {
    public type: 'create' | 'update' | 'delete' | 'pins' = 'create';
    public body: any;

    public constructor(
        public botId: string,
        public appId: string
    ) {
    }

    public execute(): void {
        const executorManager: ExecutorManager = ExecutorManager.instance;
        executorManager.execute(this.botId, this.appId, {
            type: 'channel_' + this.type,
            body: this.body
        }, (data) => {
            console.log("Executed channel");
        });
    }
}

export class UserManager implements Manager {
    public type: 'presence_update' = 'presence_update';
    public body: any;

    public constructor(
        public botId: string,
        public appId: string
    ) {
    }

    public execute(): void {
        const executorManager: ExecutorManager = ExecutorManager.instance;
        executorManager.execute(this.botId, this.appId, {
            type: 'user_' + this.type,
            body: this.body
        }, (data) => {
            return;
        });
    }
}
