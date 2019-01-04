import SocketIO from 'socket.io';

import { BotExecutor, BotExecuteType } from './index';
import { CloudEngine } from './cloud/index';
import { LoggerLevel } from './logger';
import { ChildProcess, exec } from 'child_process';
import { v1 } from 'uuid';
import { wait } from './until';
import path = require('path');
import { CoreOptions } from 'request';
import { HTTPRequest } from './http';
import { MessageManager, GuildEventType, GuildManager, ChannelManager } from './manager';

export class ProcessData {
    public botId: string = "";
    public token: string = "";
    public started: number = new Date().getTime();
    public stopped: number = new Date().getTime();
    public outOfTimeout: boolean = false;
    public code: number = 0;
}

enum HTTPCode {
    DONE = 0,
    URL_NOT_FOR_HTTP = -1,
    REJECTED_HOSTNAME = -2
}

export class ExecutorManager {
    public static instance: ExecutorManager;

    private _cloud: CloudEngine | undefined;
    private apps: any | undefined;
    private bots: any | undefined;
    private map: Map<string, BotExecutor>;
    private process: ChildProcess | undefined;

    public constructor(
        private _protocol: ExecutorProtocol,
        private executorPath: string,
        private host: string,
        private _endpoint: string,
        private logLevel: LoggerLevel,
        private debug: boolean,
        cloud?: CloudEngine,
        apps?: any,
        bots?: any,
    ) {
        this._cloud = cloud;
        this.map = new Map();
        ExecutorManager.instance = this;
        if (apps !== undefined) {
            this.apps = apps;
            for (const appId in apps) {
                console.log('[Local Apps] '.cyan + 'Loaded! '.green + ("" + appId).reset);
            }
        }
        if (bots !== undefined) {
            this.bots = bots;
            for (const botId in bots) {
                console.log('[Local Bots] '.green + 'Loaded! '.green + ("" + botId).reset);
            }
        }
    }

    public execute(botId: string, appId: string, payload: any, listener: (data: ProcessData) => void) {
        const appPath: string = this.apps[appId];
        const token: string = this.bots[botId].token;
        const timeout: number = 5000;
        const uuid: string = v1();
        this.protocol.execute(`${botId}${uuid}`, botId, token, appPath, timeout, payload, listener);
    }

    public executor(
        appId: string,
        botId: string,
        type: BotExecuteType
    ): BotExecutor {
        let token: string = "";
        if (this.cloud === undefined) {
            token = this.bots[botId].token;
        } else {
            token = this.cloud.bots.get(botId);
        }
        const executor: BotExecutor = new BotExecutor(
            this._endpoint, botId, appId, token, type, this.logLevel, this.cloud
        );
        return executor;
    }

    public async run(): Promise<any> {
        return new Promise(async (resolve: any) => {
            const p: string = path.resolve(this.executorPath);
            const key: string = this.protocol.init();
            if (this.debug) {
                console.log('[DEBUG] '.yellow + "Host:".yellow + (" " + this.host).white);
                console.log('[DEBUG] '.yellow + "Port:".yellow + (" " + this.protocol.port).white);
                console.log('[DEBUG] '.yellow + "Key:".yellow + (" " + key).white);
            }
            const d: string = this.debug ? " --inspect-brk=41032" : "";
            const command: string = 'node "' + p + `"${d} -h http://${this.host} -p ${this.protocol.port} -k ${key}`;
            this.process = exec(command);
            this.process.on('close', (code: number) => {
                console.log("[CONSOLE] ".yellow + ("Died with code " + code).red);
            });
            const opened: boolean = await this.protocol.open();
            if (!opened) {
                if (this.process !== undefined) {
                    this.process.kill();
                }
            }
            this.process = undefined;
            resolve(opened);
        });
    }

    public gateway(appId: string, botId: string): BotExecutor {
        const executor: BotExecutor = this.executor(appId, botId, BotExecuteType.GATEWAY);
        this.add('gateway_' + botId, executor);
        return executor;
    }

    public message(appId: string, botId: string, type: 'create' | 'update' | 'delete', body: any): BotExecutor {
        const executor: BotExecutor = this.executor(appId, botId, BotExecuteType.MESSAGE);
        (executor.manager as MessageManager).type = type;
        (executor.manager as MessageManager).body = body;
        return executor;
    }

    public guild(appId: string, botId: string, type: GuildEventType, body: any): BotExecutor {
        const executor: BotExecutor = this.executor(appId, botId, BotExecuteType.GUILD);
        (executor.manager as GuildManager).type = type;
        (executor.manager as GuildManager).body = body;
        return executor;
    }

    public channel(
        appId: string, botId: string, type: 'create' | 'update' | 'delete' | 'pins',
        body: any
    ): BotExecutor {
        const executor: BotExecutor = this.executor(appId, botId, BotExecuteType.CHANNEL);
        (executor.manager as ChannelManager).type = type;
        (executor.manager as ChannelManager).body = body;
        return executor;
    }

    public has(name: string): boolean {
        return this.map.has(name);
    }

    public add(name: string, executor: BotExecutor): void {
        this.map.set(name, executor);
    }

    public remove(name: string): void {
        if (this.map.has(name)) {
            this.map.delete(name);
        }
    }

    public get(name: string): BotExecutor | undefined {
        return this.map.get(name);
    }

    get cloud(): CloudEngine | undefined {
        return this._cloud;
    }

    get protocol(): ExecutorProtocol {
        return this._protocol;
    }

    get endpoint(): string {
        return this._endpoint;
    }
}

export class ExecutorProtocol {
    private server: SocketIO.Server;
    private socket: SocketIO.Socket | undefined;
    private timeout: number;
    private key: string | undefined;
    private connected: boolean = false;
    private listeners: Map<string, (data: ProcessData) => void>;
    private tokens: Map<string, string>;

    public constructor(
        private _port: number,
        private default_timeout: number
    ) {
        this.timeout = this.default_timeout;
        this.server = SocketIO();
        this.listeners = new Map();
        this.tokens = new Map();
        this.server.on('connection', (socket) => {
            if (this.socket !== undefined) {
                socket.disconnect(true);
                return;
            }
            this.socket = socket;
            socket.on('identity', (data) => this.onIdentity(data));
            socket.on('ping', () => this.onPing());
            socket.on('http', (data: any) => this.onHttp(data));
            socket.on('stop', (data: ProcessData) => this.onStop(data));
            socket.on('print', (data: any) => this.onPrint(data));
            socket.emit('connect');
        });
    }

    public execute(
        id: string, botId: string, token: string, p: string,
        timeout: number, payload: any, listener: (data: ProcessData) => void
    ) {
        if (this.socket !== undefined) {
            const data: any = {
                id: id,
                path: p,
                timeout: timeout,
                payload: payload,
                botId: botId
            };
            this.listeners.set(id, listener);
            this.tokens.set(id, token);
            this.socket.emit('start', data);
        }
    }

    public async start(): Promise<any> {
        return new Promise((resolve: any, reject: any) => {
            try {
                this.server.listen(this.port);
                resolve();
            } catch (e) {
                reject();
            }
        });
    }

    public init(): string {
        this.key = v1();
        return this.key;
    }

    public async open(): Promise<any> {
        return new Promise(async (resolve: any, reject: any) => {
            this.timeout = this.default_timeout;
            while (this.timeout > 0) {
                await wait(1);
                if (this.connected) {
                    break;
                } else {
                    this.timeout -= 1;
                }
            }
            resolve(this.connected);
        });
    }

    get port(): number {
        return this._port;
    }

    private onIdentity(key: string): void {
        if (this.socket === undefined) {
            return;
        }
        if (this.key === undefined) {
            this.socket.disconnect(true);
            return;
        }
        if (key === this.key) {
            this.socket.emit('identity', true);
            this.connected = true;
            return;
        }
        this.socket.disconnect(true);
        this.socket = undefined;
    }

    private onPing(): void {
        // TODO wait and send the ping
    }

    private async onHttp(data: any) {
        const id: string = data.id;
        const botId: string = data.processId;
        const type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' = data.type;
        const url: string = data.url;
        if (!url.startsWith("http") && !url.startsWith("https")) {
            if (this.socket !== undefined) {
                this.socket.emit('http', {
                    code: HTTPCode.URL_NOT_FOR_HTTP,
                    id: id
                });
            }
        } else if (!url.startsWith("https://discordapp.com")) {
            if (this.socket !== undefined) {
                this.socket.emit('http', {
                    code: HTTPCode.REJECTED_HOSTNAME,
                    id: id
                });
            }
        }
        const options: CoreOptions = data.options;
        const tokenHeader: boolean = data.tokenHeader;
        let token: string | undefined = this.tokens.get(botId);
        if (token === undefined) {
            token = "";
        }
        const request: HTTPRequest = await new HTTPRequest(type, url, 10000, options, tokenHeader, token).send();
        if (this.socket !== undefined) {
            this.socket.emit('http', {
                code: HTTPCode.DONE,
                id: id,
                type: type,
                url: url,
                options: options,
                response: request.response,
                error: request.error,
                body: request.body
            });
        }
    }

    private onStop(procesData: ProcessData): void {
        const listener: ((data: ProcessData) => void) | undefined = this.listeners.get(procesData.botId);
        if (listener !== undefined) {
            listener(procesData);
        }
    }

    private onPrint(print: any): void {
        console.log("[CONSOLE] ".yellow, print);
    }
}
