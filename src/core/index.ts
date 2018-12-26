import { SnowFlake } from "@disnetwork/core";

export class CoreSnowFlake implements SnowFlake {
    public readonly id: number;

    public constructor(id: number) {
        this.id = id;
    }
}

export class SnowFlakeConvertor {

    public static fromString(id: string): SnowFlake {
        const stringToNumber: number = parseInt(id, undefined);
        const snowFlake: SnowFlake = new CoreSnowFlake(stringToNumber);
        return snowFlake;
    }

}
