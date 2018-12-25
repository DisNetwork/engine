import { Logger } from './logger';
import { Manager } from './manager';
import { get, CoreOptions, Response } from 'request';
import { DiscordAPI } from './discord';
import WebSocket = require('ws');

export class GatewayManager implements Manager {
    private url: string | undefined;
    private webSocket: WebSocket | undefined;
    private heartbeatInterval: number | undefined;
    private identified: boolean = false;

    public constructor(private token: string, private logger: Logger) {
    }

    public execute(): void {
        this.logger.info("[Gateway] Discovering...");
        const options: CoreOptions = {
            headers: {
                Authorization: this.token
            }
        };
        const url: string = DiscordAPI.getEndpoint(DiscordAPI.GET_GATEWAY_BOT);
        get(url, options, (error: any, response: Response, body: any) => {
            if (error) {
                this.logger.info("[Gateway] Failed to discover!");
                this.logger.err(error);
                process.exit(0);
                return;
            }
            if (response.statusCode === 200) {
                this.logger.info("[Gateway] Connecting...");
                body = JSON.parse(body);
                this.url = body.url;
                this.url = this.url + `?v=${DiscordAPI.GATEWAY_VERSION}&encoding=${DiscordAPI.GATEWAY_COMPRESS}`;
                this.webSocket = new WebSocket(this.url);
                this.webSocket.on('open', () => this.onConnect());
                this.webSocket.on('message', (data) => this.onMessage(data));
                this.webSocket.on('error', (err) => console.error(err));
                this.webSocket.on('close', (code: number, reason: string) => {
                    this.logger.err(`[Gateway] Closed [ Code(${code}) ] Reason: ${reason}`);
                });
            } else {
                this.logger.info("[Gateway] Failed to discover!");
                this.logger.err("Can't request a gateway endpoint for the bot");
                process.exit(0);
                return;
            }
        });
    }

    private send(message: GatewayMessage) {
        if (this.webSocket) {
            this.logger.debug("[Gateway] <- " + JSON.stringify(message));
            this.webSocket.send(JSON.stringify(message.encode()));
        }
    }

    private onConnect(): void {
        this.logger.info("[Gateway] Connected!");
    }

    private onMessage(data: WebSocket.Data): void {
        const json: any = JSON.parse(data as string);
        const msg: GatewayMessage = new GatewayMessage();
        msg.opcode = json.op;
        msg.sequence = json.s;
        msg.eventName = json.t;
        msg.data = json.d;
        this.logger.debug("[Gateway] -> " + JSON.stringify(msg));
        this.process(msg);
    }

    private process(message: GatewayMessage) {

        if (message.opcode === GatewayOpcode.HELLO) {
            this.heartbeatInterval = message.data.heartbeat_interval;
            const heartbeat: GatewayMessage = new GatewayMessage();
            heartbeat.data = {};
            heartbeat.opcode = GatewayOpcode.HEARTBEAT;
            this.send(heartbeat);
        } else if (message.opcode === GatewayOpcode.HEARTBEAT_ACK) {
            if (!this.identified) {
                const identify: GatewayMessage = new GatewayMessage();
                identify.opcode = GatewayOpcode.IDENTIFY;
                identify.data = {
                    token: this.token,
                    properties: {
                        $os: "win",
                        $browser: "disnet",
                        $device: "disnet"
                    }
                };
                this.send(identify);
            }
            this.ping();
        }

    }

    private ping(): void {
        setTimeout(() => {
            const heartbeat: GatewayMessage = new GatewayMessage();
            heartbeat.opcode = GatewayOpcode.HEARTBEAT;
            this.send(heartbeat);
        }, this.heartbeatInterval);
    }

}

export enum GatewayOpcode {
    DISPATCH = 0,
    HEARTBEAT = 1,
    IDENTIFY = 2,
    STATUS_UPDATE = 3,
    VOICE_STATE_UPDATE = 4,
    RESUME = 5,
    RECONNECT = 6,
    REQUEST_GUILD_MEMBERS = 7,
    INVAILD_SESSION = 9,
    HELLO = 10,
    HEARTBEAT_ACK = 11
}

export class GatewayMessage {
    public opcode: GatewayOpcode = GatewayOpcode.DISPATCH;
    public data: any;
    public sequence: number | undefined = undefined;
    public eventName: string | undefined = undefined;

    public encode(): any {
        return {
            d: this.data,
            op: this.opcode,
            s: this.sequence,
            t: this.eventName
        };
    }
}
