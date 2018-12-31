import { SnowFlake, Guild, Channel, User } from '@disnetwork/core';
import { CoreGuild } from '../core/guild';
import { CoreChannel } from '../core';

export namespace CloudDatabase {

    export interface Guilds {
        add(id: CoreGuild): void;
        get(id: SnowFlake): Guild;
        has(id: SnowFlake): boolean;
    }

    export interface Channels {
        add(channel: CoreChannel): void;
        get(id: SnowFlake): Channel;
        has(id: SnowFlake): boolean;
    }

    export interface Users {
        get(id: SnowFlake): User;
        has(id: SnowFlake): boolean;
    }

    export interface Apps {
        get(id: string): string;
        has(id: string): boolean;
    }

}
