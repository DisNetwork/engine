import SocketIO from 'socket.io';

import { BotExecutor, BotExecuteType } from './index';
import { CloudEngine } from './cloud/index';
import { LoggerLevel } from './logger';
import { dirname } from 'path';
import { ChildProcess, exec } from 'child_process';
import { v1 } from 'uuid';
import { wait } from './until';
import path = require('path');

export class ExecutorManager {
    public static instance: ExecutorManager;

    private _cloud: CloudEngine | undefined;
    private apps: any | undefined;
    private map: Map<string, BotExecutor>;
    private process: ChildProcess | undefined;

    public constructor(
        private protocol: ExecutorProtocol,
        private executorPath: string,
        private host: string,
        private endpoint: string,
        private logLevel: LoggerLevel,
        private debug: boolean,
        cloud?: CloudEngine,
        apps?: any
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
    }

    public executor(
        appId: string,
        type: BotExecuteType
    ): BotExecutor {
        let token: string = "";
        if (this.cloud === undefined) {
            token = this.apps[appId];
        } else {
            token = this.cloud.apps.get(appId);
        }
        const executor: BotExecutor = new BotExecutor(this.endpoint, appId, token, type, this.logLevel, this.cloud);
        return executor;
    }

    public async run(): Promise<any> {
        return new Promise(async (resolve: any) => {
            const p: string = path.resolve(this.executorPath);
            const key: string = this.protocol.init();
            if (!this.debug) {
                const command: string = 'node "' + p + `" -h http://${this.host} -p ${this.protocol.port} -k ${key}`;
                this.process = exec(command);
            } else {
                console.log('[DEBUG] '.yellow + "Host:".yellow + (" " + this.host).white);
                console.log('[DEBUG] '.yellow + "Port:".yellow + (" " + this.protocol.port).white);
                console.log('[DEBUG] '.yellow + "Key:".yellow + (" " + key).white);
            }
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

    public gateway(appId: string): BotExecutor {
        const executor: BotExecutor = this.executor(appId, BotExecuteType.GATEWAY);
        this.add('gateway_' + appId, executor);
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

    get cloud(): CloudEngine | undefined {
        return this._cloud;
    }
}

export class ExecutorProtocol {
    private server: SocketIO.Server;
    private socket: SocketIO.Socket | undefined;
    private timeout: number;
    private key: string | undefined;
    private connected: boolean = false;

    public constructor(
        private _port: number,
        private default_timeout: number
    ) {
        this.timeout = this.default_timeout;
        this.server = SocketIO();
        this.server.on('connection', (socket) => {
            if (this.socket !== undefined) {
                socket.disconnect(true);
                return;
            }
            this.socket = socket;
            socket.on('identity', (data) => this.onIdentity(data));
            socket.on('ping', () => this.onPing());
            socket.on('http', () => this.onHttp());
            socket.on('start', () => this.onStart());
            socket.on('stop', () => this.onStop());
            socket.emit('connect');
        });
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

    private onHttp(): void {
        // TODO vaild the request and do the request and do the response
    }

    private onStart(): void {
        // TODO start
    }

    private onStop(): void {
        // TODO stop
    }
}
