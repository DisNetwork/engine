import { CoreGuild } from '../core/guild';
import { CoreChannel, CoreSnowFlake } from '../core';

export namespace CloudDatabase {

    export interface Guilds {
        add(id: CoreGuild): void;
        get(id: CoreSnowFlake): CoreGuild;
        has(id: CoreSnowFlake): boolean;
    }

    export interface Channels {
        add(channel: CoreChannel): void;
        get(id: CoreSnowFlake): CoreChannel;
        has(id: CoreSnowFlake): boolean;
    }

    export interface Users {
        get(id: CoreSnowFlake): any;
        has(id: CoreSnowFlake): boolean;
    }

    export interface Apps {
        get(id: string): string;
        has(id: string): boolean;
    }

    export interface Bots {
        get(id: string): string;
        has(id: string): boolean;
    }

}
