import { ChannelType } from "./src";

/**
 * Executes the bot ( You can create only one instance )
 */
export declare class BotExecutor {
    public constructor(token: string, type: BotExecuteType);
}

/**
 * The way to let the engine to execute it
 */
export declare enum BotExecuteType {

    /**
     * Runs a gateway to receive events and set the activity of the bot
     */
    GATEWAY = 0,

    /**
     * Execute message events
     */
    MESSAGE = 1,

    /**
     * Execute guild events
     */
    GUILD = 2,

    /**
     * Execute channel events
     */
    CHANNEL = 3
}

/**
 * A manager that can be executed
 */
export declare interface Manager {

    /**
     * Execute the manager
     */
    execute(): void;
}

/**
 * Controlling the way to log in console
 */
export declare class Logger {

    constructor(level: LoggerLevel, prefix: string);

    /**
     * Log with the customize of the level
     */
    public print(level: LoggerLevel, message: string): void;

    /**
     * Log with error level
     */
    public err(message: string): void;

    /**
     * Log with warn level
     */
    public warn(message: string): void;

    /**
     * Log with info level
     */
    public info(message: string): void;

    /**
     * Log with debug level
     */
    public debug(message: string): void;
}

/**
 * Levels of logging
 */
export declare enum LoggerLevel {
    ERR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    OFF = 4
}

/**
 * Deal with the database of the cloud
 */
export declare namespace CloudDatabase {

    /**
     * Deal with guilds in the cloud
     */
    export interface Guilds {
        get(id: CoreSnowFlake): any;
        has(id: CoreSnowFlake): boolean;
    }

    /**
     * Deal with channels in the cloud
     */
    export interface Channels {
        get(id: CoreSnowFlake): any;
        has(id: CoreSnowFlake): boolean;
    }

    /**
     * Deal with users in the cloud
     */
    export interface Users {
        get(id: CoreSnowFlake): any;
        has(id: CoreSnowFlake): boolean;
    }
}

/**
 * Deal with cloud customiztions
 */
export declare interface CloudEngine {

    /**
     * Name of the cloud engine
     */
    name: string;

    /**
     * Deal with guilds in the cloud
     */
    guilds: CloudDatabase.Guilds;

    /**
     * Deal with channels in the cloud
     */
    channels: CloudDatabase.Channels;

    /**
     * Deal with users in the cloud
     */
    users: CloudDatabase.Users;
}

/**
 * Convert from string to CoreSnowFlake
 */
export declare class CoreSnowFlakeConvertor {

    public static fromString(id: string): CoreSnowFlake;
}

/**
 * Overrided core CoreSnowFlake
 */
export declare class CoreSnowFlake implements CoreSnowFlake {

    /**
     * The id of the CoreSnowFlake
     */
    public readonly id: number;
}

/**
 * Deal with the guild
 */
export declare class CoreGuild {

    /**
     * CoreSnowFlake ID of the guild
     */
    public id: CoreSnowFlake;

    /**
     * Name of the guild
     */
    public name: string;

    /**
     * Icon url of the guild
     */
    public icon?: string;

    /**
     * Owner CoreSnowFlake ID of the guild
     */
    public ownerId: CoreSnowFlake;
}

/**
 * Deal with the guilds of the bot
 */
export declare class CoreGuilds {

    /**
     * Get the guild that the bot is apart of it
     */
    public get(id: CoreSnowFlake): CoreGuild;

    /**
     * Check if the bot is in that guild or not
     */
    public has(id: CoreSnowFlake): boolean;
}

/**
 * Deal with channel
 */
export declare class CoreChannel {

    /**
     * Id of the channel
     */
    public id: CoreSnowFlake;

    /**
     * Type of the channel
     */
    public type: ChannelType;

    /**
     * Guild id of the channel
     */
    public guild_id: CoreSnowFlake | undefined;

    /**
     * Position of the channel
     */
    public position: number;

    /**
     * Name of the channel
     */
    public name: string | undefined;

    /**
     * Topic of the channel
     */
    public topic: string;

    /**
     * Nsfw of the channel
     */
    public nsfw: boolean;

    /**
     * Last message Id of the channel
     */
    public last_message_id: CoreSnowFlake | undefined;

    /**
     * Bitrate of the channel
     */
    public bitrate: number | undefined;

    /**
     * User limit of the channel
     */
    public user_limit: number | undefined;

    /**
     * Rate limit per user
     */
    public rate_limit_per_user: number | undefined;

    /**
     * Parent id of the channel
     */
    public parent_id: CoreSnowFlake | undefined;
}

/**
 * Deal with channels in the bot
 */
export declare class CoreChannels {

    /**
     * Get the channel of the bot
     */
    public get(id: CoreSnowFlake): CoreChannel;

    /**
     * Check if the bot is here
     */
    public has(id: CoreSnowFlake): boolean;
}
