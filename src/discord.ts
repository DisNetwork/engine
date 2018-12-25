export class DiscordAPI {
    public static readonly ENDPOINT: string = "https://discordapp.com/api/";
    public static readonly GET_GATEWAY_BOT: string = "gateway/bot";

    public static readonly GATEWAY_VERSION: number = 6;
    public static readonly GATEWAY_COMPRESS: string = "json";

    public static getEndpoint(route: string) {
        return this.ENDPOINT + route;
    }
}
