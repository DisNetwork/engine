import { CoreSnowFlake } from '.';

export class CoreGuild {
    public static readonly EMPTY: CoreGuild = new CoreGuild(CoreSnowFlake.EMPTY, "EMPTY_GUILD", CoreSnowFlake.EMPTY);

    public id: CoreSnowFlake;
    public name: string;
    public icon?: string;
    public ownerId: CoreSnowFlake;

    public constructor(id: CoreSnowFlake, name: string, ownerId: CoreSnowFlake) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
    }

}

export class CoreGuilds {

    private guilds: Map<CoreSnowFlake, CoreGuild>;

    public constructor() {
        this.guilds = new Map();
    }

    public add(guild: CoreGuild): void {
        this.guilds.set(guild.id, guild);
    }

    public get(id: CoreSnowFlake): CoreGuild {
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

    public has(id: CoreSnowFlake): boolean {
        return this.guilds.has(id);
    }

}
