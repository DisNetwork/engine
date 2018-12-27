import { Channel, ChannelType, SnowFlake } from '@disnetwork/core';

export class CoreChannel implements Channel {
    public id: SnowFlake;
    public type: ChannelType;
    public guild_id: SnowFlake | undefined;
    public position: number = 0;
    public name: string | undefined;
    public topic: string = "";
    public nsfw: boolean = false;
    public last_message_id: SnowFlake | undefined;
    public bitrate: number | undefined;
    public user_limit: number | undefined;
    public rate_limit_per_user: number | undefined;
    public parent_id: SnowFlake | undefined;

    public constructor(id: SnowFlake, type: ChannelType) {
        this.id = id;
        this.type = type;
    }
}

// TODO implement channels from core
export class CoreChannels {
    private channels: Map<SnowFlake, CoreChannel>;

    public constructor() {
        this.channels = new Map();
    }

    public add(channel: CoreChannel): void {
        this.channels.set(channel.id, channel);
    }

    public get(id: SnowFlake): CoreChannel | undefined {
        const channel: CoreChannel | undefined = this.channels.get(id);
        return channel;
    }

    public has(id: SnowFlake): boolean {
        return this.channels.has(id);
    }
}
