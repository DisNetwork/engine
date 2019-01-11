import { CloudDatabase } from "./database";

export interface CloudEngine {
    name: string;

    guilds: CloudDatabase.Guilds;
    channels: CloudDatabase.Channels;
    users: CloudDatabase.Users;
    apps: CloudDatabase.Apps;
    bots: CloudDatabase.Bots;

    init(): void;
}

// Export everything from database
export * from "./database";
