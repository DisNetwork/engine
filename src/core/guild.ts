import { Guild, SnowFlake, Guilds } from '@disnetwork/core';
import { CoreSnowFlake } from '.';

export class CoreGuild implements Guild {
    public static readonly EMPTY: CoreGuild = new CoreGuild(CoreSnowFlake.EMPTY, "EMPTY_GUILD", CoreSnowFlake.EMPTY);

    public id: SnowFlake;
    public name: string;
    public icon?: string;
    public ownerId: SnowFlake;

    public constructor(id: SnowFlake, name: string, ownerId: SnowFlake) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
    }

}

export class CoreGuilds implements Guilds {

    private guilds: Map<SnowFlake, CoreGuild>;

    public constructor() {
        this.guilds = new Map();
    }

    public add(guild: CoreGuild): void {
        this.guilds.set(guild.id, guild);
    }

    public get(id: SnowFlake): CoreGuild {
        if (this.has(id)) {
            const guild: CoreGuild | undefined = this.guilds.get(id);
            if (guild === undefined) {
                return CoreGuild.EMPTY;
            } else {
                return guild;
            }
        } else {
            return CoreGuild.EMPTY;
        }
    }

    public has(id: SnowFlake): boolean {
        return this.guilds.has(id);
    }

}
