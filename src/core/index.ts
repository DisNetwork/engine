export class SnowFlakeConvertor {

    public static fromString(id: string): CoreSnowFlake {
        const stringToNumber: number = parseInt(id, undefined);
        const snowFlake: CoreSnowFlake = new CoreSnowFlake(stringToNumber);
        return snowFlake;
    }

}

export class CoreSnowFlake {
    public static readonly EMPTY: CoreSnowFlake = SnowFlakeConvertor.fromString('0');

    public readonly id: number;

    public constructor(id: number) {
        this.id = id;
    }

    public toString = (): string => {
        return "" + this.id;
    }
}

// Export everything from guild.ts
export * from "./guild";

// Export everything from channel.ts
export * from "./channel";
