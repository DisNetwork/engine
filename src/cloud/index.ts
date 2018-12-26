import { CloudDatabase } from "./database";

export interface CloudEngine {
    name: string;

    guilds: CloudDatabase.Guilds;
    channels: CloudDatabase.Channels;
    users: CloudDatabase.Users;
}

// Export everything from database
export * from "./database";
