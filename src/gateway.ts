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
            const json: string = JSON.stringify(message.encode());
            let logJson: string = json;
            if (logJson.length > 60) {
                logJson = json.substring(0, 60);
                logJson += "...";
            }
            this.logger.debug("[Gateway] <- " + logJson);
            this.webSocket.send(json);
        }
    }

    private onConnect(): void {
        this.logger.info("[Gateway] Connected!");
        this.lifecycle();
    }

    private onMessage(data: WebSocket.Data): void {
        const json: any = JSON.parse(data as string);
        const msg: GatewayMessage = new GatewayMessage();
        msg.opcode = json.op;
        msg.sequence = json.s;
        msg.eventName = json.t;
        msg.data = json.d;
        let logJson: string = JSON.stringify(msg);
        if (logJson.length >= 60) {
            logJson = logJson.substring(0, 60);
            logJson += "...";
        }
        this.logger.debug("[Gateway] -> " + logJson);
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
                this.identified = true;
                this.send(identify);
            }
            this.ping();
        } else if (message.opcode === GatewayOpcode.DISPATCH) {
            if (message.eventName === GatewayEvent.READY) {
                const version: number = message.data.v;
                this.logger.debug("Ready! Gateway version " + version);
            }
        }

    }

    private ping(): void {
        setTimeout(() => {
            const heartbeat: GatewayMessage = new GatewayMessage();
            heartbeat.opcode = GatewayOpcode.HEARTBEAT;
            this.send(heartbeat);
        }, this.heartbeatInterval);
    }

    private lifecycle(): void {
        setTimeout(() => {
            if (this.webSocket !== undefined && this.webSocket.readyState === WebSocket.OPEN) {
                this.lifecycle();
            } else {
                this.logger.err("Can't find any life for the websocket");
                if (this.webSocket !== undefined) {
                    this.logger.err("[WebSocket] Ready State: " + this.webSocket.readyState);
                }
                console.log("Auto exiting...");
                process.exit(0);
            }
        }, 2500);
    }

}

export enum GatewayOpcode {
    DISPATCH = 0,
    HEARTBEAT = 1,
    IDENTIFY = 2,
    STATUS_UPDATE = 3,
    VOICE_STATE_UPDATE = 4,
    RESUME = 6,
    RECONNECT = 7,
    REQUEST_GUILD_MEMBERS = 8,
    INVAILD_SESSION = 9,
    HELLO = 10,
    HEARTBEAT_ACK = 11
}

export enum GatewayEvent {
    READY = "READY",
    RESUMED = "RESUMED",
    CHANNEL_CREATE = "CHANNEL_CREATE",
    CHANNEL_UPADTE = "CHANNEL_UPDATE",
    CHANNEL_DELETE = "CHANNEL_DELETE",
    CHANNEL_PINS_UPDATE = "CHANNEL_PINS_UPDATE",
    GUILD_CREATE = "GUILD_CREATE",
    GUILD_UPADTE = "GUILD_UPDATE",
    GUILD_DELETE = "GUILD_DELETE",
    GUILD_BAN_ADD = "GUILD_BAN_ADD",
    GUILD_BAN_REMOVE = "GUILD_BAN_REMOVED",
    GUILD_EMOJIS_UPDATE = "GUILD_EMOJIS_UPDATE",
    GUILD_INTERGRATIONS_UPDATE = "GUILD_INTERGRATIONS_UPDATE",
    GUILD_MEMBER_ADD = "GUILD_MEMBER_ADD",
    GUILD_MEMBER_REMOVE = "GUILD_MEMBER_REMOVE",
    GUILD_MEMBER_UPDATE = "GUILD_MEMBER_UPDATE",
    GUILD_MEMBER_CHUNK = "GUILD_MEMBER_CHUNK",
    GUILD_ROLE_CREATE = "GUILD_ROLE_CREATE",
    GUILD_ROLE_UPDATE = "GUILD_ROLE_UPDATE",
    GUILD_ROLE_DELETE = "GUILD_ROLE_DELETE",
    MESSAGE_CREATE = "MESSAGE_CREATE",
    MESSAGE_UPDATE = "MESSAGE_UPDATE",
    MESSAGE_DELETE = "MESSAGE_DELETE",
    MESSAGE_DELETE_BULK = "MESSAGE_DELETE_BULK",
    MESSAGE_REACTION_ADD = "MESSAGE_REACTION_ADD",
    MESSAGE_REACTION_REMOVE = "MESSAGE_REACTION_REMOVE",
    MESSAGE_REACTION_REMOVE_ALL = "MESSAGE_REACTION_REMOVE_ALL",
    PRESENCE_UPDATE = "PRESENCE_UPDATE"
}

export class GatewayMessage {
    public opcode: GatewayOpcode = GatewayOpcode.DISPATCH;
    public data: any;
    public sequence: number | undefined = undefined;
    public eventName: string | undefined = undefined;

    public encode(): any {
        return {
            d: this.data === undefined ? "{}" : this.data,
            op: this.opcode,
            s: this.sequence,
            t: this.eventName
        };
    }
}
