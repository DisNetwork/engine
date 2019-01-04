import { CoreSnowFlake } from '.';

export enum ChannelType {
    TEXT = 0,
    DM = 1,
    VOICE = 2,
    CATEGORY = 4
}

export class CoreChannel {
    public id: CoreSnowFlake;
    public type: ChannelType;
    public guild_id: CoreSnowFlake | undefined;
    public position: number = 0;
    public name: string | undefined;
    public topic: string = "";
    public nsfw: boolean = false;
    public last_message_id: CoreSnowFlake | undefined;
    public bitrate: number | undefined;
    public user_limit: number | undefined;
    public rate_limit_per_user: number | undefined;
    public parent_id: CoreSnowFlake | undefined;

    public constructor(id: CoreSnowFlake, type: ChannelType) {
        this.id = id;
        this.type = type;
    }
}

// TODO implement channels from core
export class CoreChannels {
    private channels: Map<CoreSnowFlake, CoreChannel>;

    public constructor() {
        this.channels = new Map();
    }

    public add(channel: CoreChannel): void {
        this.channels.set(channel.id, channel);
    }

    public get(id: CoreSnowFlake): CoreChannel | undefined {
        const channel: CoreChannel | undefined = this.channels.get(id);
        return channel;
    }

    public has(id: CoreSnowFlake): boolean {
        return this.channels.has(id);
    }
}
