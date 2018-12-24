export class DiscordAPI {
    public static readonly ENDPOINT: string = "https://discordapp.com/api/";
    public static readonly GET_GATEWAY_BOT: string = "gateway/bot";

    public static getEndpoint(route: string) {
        return this.ENDPOINT + route;
    }
}
