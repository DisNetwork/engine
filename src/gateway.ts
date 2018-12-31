import { CloudEngine } from './cloud/index';
import { CoreGuild, CoreGuilds } from './core/guild';
import { Logger } from './logger';
import { Manager } from './manager';
import { get, CoreOptions, Response } from 'request';
import { DiscordAPI } from './discord';
import WebSocket = require('ws');
import { SnowFlake } from '@disnetwork/core';
import { SnowFlakeConvertor } from './core';
import { BotExecutor } from '.';
import { CoreChannel, CoreChannels } from './core/channel';

class GuildUnavailable {
    public id: SnowFlake;
    public unavailable: boolean;

    public constructor(id: SnowFlake, unavailable: boolean) {
        this.id = id;
        this.unavailable = unavailable;
    }
}

export class GatewayManager implements Manager {
    private url: string | undefined;
    private webSocket: WebSocket | undefined;
    private heartbeatInterval: number | undefined;
    private identified: boolean = false;
    private guilds: Map<number, GuildUnavailable>;

    public constructor(private executor: BotExecutor, private token: string, private logger: Logger) {
        this.guilds = new Map();
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
            if (message.eventName === GatewayEvent.READY) { // Ready event
                const version: number = message.data.v;
                const guilds: GuildUnavailable[] = message.data.guilds;
                for (const guild of guilds) {
                    const snowflakeId: SnowFlake = SnowFlakeConvertor.fromString("" + guild.id);
                    const typedGuild = new GuildUnavailable(snowflakeId, guild.unavailable);
                    this.guilds.set(typedGuild.id.id, typedGuild);
                }
                this.logger.debug("Ready! Gateway version " + version);
            } else if (message.eventName === GatewayEvent.GUILD_CREATE) { // Guild Join/Load event
                // Guild create fires when
                // 1 - Bot joins a guild
                // 2 - Guild loads during the ready event
                // 3 - Guild loads after it became to be available
                //
                const id: SnowFlake = SnowFlakeConvertor.fromString(message.data.id);
                const name: string = message.data.name;
                const icon: string = message.data.icon;
                const ownerId: SnowFlake = SnowFlakeConvertor.fromString(message.data.owner_id);
                const guild: CoreGuild = new CoreGuild(id, name, ownerId);
                guild.icon = icon;
                // Cache the bot when there's no cloud support on running this engine
                const cloudEngine: CloudEngine | undefined = this.executor.cloud;
                if (cloudEngine === undefined) {
                    if (this.executor.coreGuilds !== undefined) {
                        const coreGuilds: CoreGuilds = this.executor.coreGuilds;
                        if (!coreGuilds.has(id)) {
                            coreGuilds.add(guild);
                        }
                    }
                } else { // Executing the services throw the cloud service
                    if (!cloudEngine.guilds.has(id)) {
                        cloudEngine.guilds.add(guild);
                    }
                }
                const channels: CoreChannel[] = message.data.channels;
                // Cache the channels if we are running locally
                for (let index = 0; index < channels.length; index++) {
                    const channel = channels[index];
                    const newChannel = new CoreChannel(channel.id, channel.type);
                    for (const key in channel) {
                        (newChannel as any)[key] = (channel as any)[key];
                    }
                    newChannel.guild_id = guild.id;
                    if (cloudEngine === undefined) {
                        const coreChannels: CoreChannels | undefined = this.executor.coreChannels;
                        if (coreChannels !== undefined) {
                            coreChannels.add(newChannel);
                        }
                    } else {
                        if (!cloudEngine.channels.has(id)) {
                            cloudEngine.channels.add(newChannel);
                        }
                    }
                }

                // Check if this event fired due to load or join
                const guildUnavailable: GuildUnavailable | undefined = this.guilds.get(id.id);
                if (guildUnavailable !== undefined && guildUnavailable.unavailable) {
                    guildUnavailable.unavailable = false;
                    this.guilds.set(guildUnavailable.id.id, guildUnavailable);
                    // TODO load execute
                    this.executor.fire('POST', 'guild/load', {
                        id: guild.id.id,
                        g: guild,
                        c: channels
                    });
                } else {
                    // TODO join execute
                    this.executor.fire('POST', 'guild/join', {
                        id: guild.id.id,
                        g: guild,
                        c: channels
                    });
                }
            } else if (message.eventName === GatewayEvent.GUILD_UPADTE) { // When anything in the guild updated
                // TODO update execute
                this.executor.fire('POST', 'guild/update', {
                    g: message.data
                });
            } else if (message.eventName === GatewayEvent.GUILD_DELETE) { // When delete guild
                // TODO delete execute
                this.executor.fire('POST', 'guild/delete', {
                    g: message.data
                });
            } else if (message.eventName === GatewayEvent.GUILD_BAN_ADD) { // When someone banned
                // TODO ban add execute
                this.executor.fire('POST', 'guild/ban/add', {
                    id: message.data.guild_id,
                    user: message.data.user
                });
            } else if (message.eventName === GatewayEvent.GUILD_BAN_REMOVE) { // When someone unbanned
                // TODO ban remove execute
                this.executor.fire('POST', 'guild/ban/remove', {
                    id: message.data.guild_id,
                    user: message.data.user
                });
            } else if (message.eventName === GatewayEvent.GUILD_EMOJIS_UPDATE) { // When guild updates the emoji
                // TODO emojis update execute
                this.executor.fire('POST', 'guild/emojis', {
                    id: message.data.guild_id,
                    emojis: message.data.emojis
                });
            } else if (message.eventName === GatewayEvent.GUILD_INTERGRATIONS_UPDATE) { // When integrations update
                // TODO integrations update execute
                this.executor.fire('POST', 'guild/integrations', {
                    g: message.data.guild_id
                });
            } else if (message.eventName === GatewayEvent.GUILD_MEMBER_ADD) { // When member add
                // TODO member add execute
                this.executor.fire('POST', 'guild/member/add', {
                    g: message.data.guild_id,
                    user: message.data.user,
                    nick: message.data.nick,
                    roles: message.data.roles,
                    joined_at: message.data.joined_at,
                    deaf: message.data.deaf,
                    mute: message.data.mute
                });
            } else if (message.eventName === GatewayEvent.GUILD_MEMBER_REMOVE) { // When member removes
                // TODO member remove execute
                this.executor.fire('POST', 'guild/member/remove', {
                    g: message.data.guild_id,
                    user: message.data.user
                });
            } else if (message.eventName === GatewayEvent.GUILD_MEMBER_UPDATE) { // When member updates
                // TODO member update execute
                this.executor.fire('POST', 'guild/member/update', {
                    g: message.data.guild_id,
                    roles: message.data.roles,
                    user: message.data.user,
                    nick: message.data.nick
                });
            } else if (message.eventName === GatewayEvent.GUILD_MEMBER_CHUNK) { // When member chunk
                // TODO member chunk execute
            } else if (message.eventName === GatewayEvent.GUILD_ROLE_CREATE) { // When guild role add
                // TODO guild role add execute
                this.executor.fire('POST', 'guild/role/create', {
                    g: message.data.guild_id,
                    role: message.data.role
                });
            } else if (message.eventName === GatewayEvent.GUILD_ROLE_UPDATE) { // When guild role update
                // TODO guild role update execute
                this.executor.fire('POST', 'guild/role/update', {
                    g: message.data.guild_id,
                    role: message.data.role
                });
            } else if (message.eventName === GatewayEvent.GUILD_ROLE_DELETE) { // When guild role delete
                // TODO guild role delete execute
                this.executor.fire('POST', 'guild/role/delete', {
                    g: message.data.guild_id,
                    r: message.data.role_id
                });
            } else if (message.eventName === GatewayEvent.MESSAGE_CREATE) { // When message create
                // TODO message create execute
                this.executor.fire('POST', 'message/create', message.data);
            } else if (message.eventName === GatewayEvent.MESSAGE_UPDATE) { // When message update
                // TODO message update execute
                this.executor.fire('POST', 'message/update', message.data);
            } else if (message.eventName === GatewayEvent.MESSAGE_DELETE) { // When message delete
                // TODO message delete execute
                this.executor.fire('POST', 'message/delete', {
                    id: message.data.id,
                    cid: message.data.channel_id,
                    gid: message.data.guild_id
                });
            } else if (message.eventName === GatewayEvent.MESSAGE_DELETE_BULK) { // When message delete bulk
                // TODO message delete bulk execute
                this.executor.fire('POST', 'message/delete/bulk', {
                    ids: message.data.ids,
                    cid: message.data.channel_id,
                    gid: message.data.guild_id
                });
            } else if (message.eventName === GatewayEvent.MESSAGE_REACTION_ADD) { // When message reaction added
                // TODO message reaction add execute
                this.executor.fire('POST', 'message/reaction/add', {
                    uid: message.data.user_id,
                    cid: message.data.channel_id,
                    mid: message.data.message_id,
                    gid: message.data.guild_id,
                    emoji: message.data.emoji
                });
            } else if (message.eventName === GatewayEvent.MESSAGE_REACTION_REMOVE) { // When message reaction remove
                // TODO message reaction remove execute
                this.executor.fire('POST', 'message/reaction/remove', {
                    uid: message.data.user_id,
                    cid: message.data.channel_id,
                    mid: message.data.message_id,
                    gid: message.data.guild_id,
                    emoji: message.data.emoji
                });
            } else if (message.eventName === GatewayEvent.MESSAGE_REACTION_REMOVE_ALL) {
                // TODO message reaction remove all execute
                this.executor.fire('POST', 'message/reaction/remove/all', {
                    cid: message.data.channel_id,
                    mid: message.data.message_id,
                    gid: message.data.guild_id
                });
            } else if (message.eventName === GatewayEvent.PRESENCE_UPDATE) { // When presence update
                // TODO presence update execute
                this.executor.fire('POST', 'presence/update', {
                    user: message.data.user,
                    roles: message.data.roles,
                    game: message.data.game,
                    gid: message.data.guild_id,
                    status: message.data.status,
                    activties: message.data.activties
                });
            } else if (message.eventName === GatewayEvent.TYPING_START) { // When typing start
                // TODO typing start execute
                this.executor.fire('POST', 'typing', {
                    cid: message.data.channel_id,
                    gid: message.data.guild_id,
                    uid: message.data.user_id,
                    timestamp: message.data.timestamp
                });
            } else if (message.eventName === GatewayEvent.USER_UPDATE) { // When user update
                // TODO user update execute
                this.executor.fire('POST', 'user/update', message.data);
            } else if (message.eventName === GatewayEvent.VOICE_STATE_UPDATE) { // when voice state update
                // TODO voice state update execute
                this.executor.fire('POST', 'voice/update/state', message.data);
            } else if (message.eventName === GatewayEvent.VOICE_SERVER_UPDATE) { // when voice server update
                // TODO voice server update execute
                this.executor.fire('POST', 'voice/update/server', {
                    gid: message.data.guild_id,
                    endpoint: message.data.endpoint
                });
            } else if (message.eventName === GatewayEvent.WEBHOOKS_UPDATE) { // When webhook update
                // TODO webhooks update execute
                this.executor.fire('POST', 'webhooks/update', {
                    gid: message.data.guild_id,
                    cid: message.data.channel_id
                });
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
    PRESENCE_UPDATE = "PRESENCE_UPDATE",
    TYPING_START = "TYPING_START",
    USER_UPDATE = "USER_UPDATE",
    VOICE_STATE_UPDATE = "VOICE_STATE_UPDATE",
    VOICE_SERVER_UPDATE = "VOICE_SERVER_UPDATE",
    WEBHOOKS_UPDATE = "WEBHOOKS_UPDATE"
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
