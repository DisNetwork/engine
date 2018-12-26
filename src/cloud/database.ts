import { SnowFlake } from '@disnetwork/core';

export namespace CloudDatabase {

    export interface Guilds {
        get(id: SnowFlake): any;
        has(id: SnowFlake): boolean;
    }

}
