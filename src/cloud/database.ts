import { SnowFlake, Guild, Channel, User } from '@disnetwork/core';

export namespace CloudDatabase {

    export interface Guilds {
        get(id: SnowFlake): Guild;
        has(id: SnowFlake): boolean;
    }

    export interface Channels {
        get(id: SnowFlake): Channel;
        has(id: SnowFlake): boolean;
    }

    export interface Users {
        get(id: SnowFlake): User;
        has(id: SnowFlake): boolean;
    }

}
