import { SnowFlake, Guilds, Guild, Channel, ChannelType } from '@disnetwork/core';

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
    GATEWAY = 0
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
        get(id: SnowFlake): any;
        has(id: SnowFlake): boolean;
    }

    /**
     * Deal with channels in the cloud
     */
    export interface Channels {
        get(id: SnowFlake): any;
        has(id: SnowFlake): boolean;
    }

    /**
     * Deal with users in the cloud
     */
    export interface Users {
        get(id: SnowFlake): any;
        has(id: SnowFlake): boolean;
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
 * Convert from string to SnowFlake
 */
export declare class SnowFlakeConvertor {

    public static fromString(id: string): SnowFlake;
}

/**
 * Overrided core snowflake
 */
export declare class CoreSnowFlake implements SnowFlake {

    /**
     * The id of the snowflake
     */
    public readonly id: number;
}

/**
 * Deal with the guild
 */
export declare class CoreGuild implements Guild {

    /**
     * SnowFlake ID of the guild
     */
    public id: SnowFlake;

    /**
     * Name of the guild
     */
    public name: string;

    /**
     * Icon url of the guild
     */
    public icon?: string;

    /**
     * Owner SnowFlake ID of the guild
     */
    public ownerId: SnowFlake;
}

/**
 * Deal with the guilds of the bot
 */
export declare class CoreGuilds implements Guilds {

    /**
     * Get the guild that the bot is apart of it
     */
    public get(id: SnowFlake): CoreGuild;

    /**
     * Check if the bot is in that guild or not
     */
    public has(id: SnowFlake): boolean;
}

/**
 * Deal with channel
 */
export declare class CoreChannel implements Channel {

    /**
     * Id of the channel
     */
    public id: SnowFlake;

    /**
     * Type of the channel
     */
    public type: ChannelType;
    
    /**
     * Guild id of the channel
     */
    public guild_id: SnowFlake | undefined;

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
    public last_message_id: SnowFlake | undefined;

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
    public parent_id: SnowFlake | undefined;
}

/**
 * Deal with channels in the bot
 */
export declare class CoreChannels {

    /**
     * Get the channel of the bot
     */
    public get(id: SnowFlake): CoreChannel;

    /**
     * Check if the bot is here
     */
    public has(id: SnowFlake): boolean;
}
