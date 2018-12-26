import { SnowFlake } from "@disnetwork/core";

export class SnowFlakeConvertor {

    public static fromString(id: string): SnowFlake {
        const stringToNumber: number = parseInt(id, undefined);
        const snowFlake: SnowFlake = new CoreSnowFlake(stringToNumber);
        return snowFlake;
    }

}

export class CoreSnowFlake implements SnowFlake {
    public static readonly EMPTY: SnowFlake = SnowFlakeConvertor.fromString('0');

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
