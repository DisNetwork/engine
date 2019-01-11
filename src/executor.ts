import { v1 } from 'uuid';
import { ChildProcess, execFile } from "child_process";
import { wait } from "./until";
import SocketIO from 'socket.io';
import program from 'commander';
import SocketIOClient from 'socket.io-client';
import { CoreOptions } from 'request';

console.log = (print: any) => {
    io.emit('print', print);
};

class Process {
    public timeout: number = 30 * 1000;
    private finish: boolean = false;

    public constructor(
        private _id: string,
        private _botId: string,
        private _payload: string
    ) {
    }

    get id(): string {
        return this._id;
    }

    get botId(): string {
        return this._botId;
    }

    get payload(): any {
        return this._payload;
    }
}

enum InstanceState {
    NORMAL,
    STESS,
    USELESS,
    BROKEN
}

enum InstanceTimeoutType {
    NONE,
    USELESS,
    STRESS,
    START
}

class Instance {
    public socket: SocketIO.Socket | undefined;
    private process: ChildProcess;
    private processes: Map<string, Process> = new Map();
    private _state: InstanceState = InstanceState.NORMAL;
    private timeoutType: InstanceTimeoutType = InstanceTimeoutType.NONE;
    private timeout: number = 0;
    private preStart: Process[] = [];

    public constructor(
        private _id: string,
        private path: string,
    ) {
        this.log('Starting...');
        const execPath: string = process.execPath;
        const args: string[] = [
            this.path,
            "-h",
            host,
            "-p",
            "" + listen,
            "-k",
            this._id
        ];
        while (this.path.includes("\\")) {
            this.path = this.path.replace("\\", "/");
        }
        this.log('EXE => node "' + this.path + `" -h ${host} -p ${listen} -k ${this.id}`);
        this.process = execFile(execPath, args);
        this.process.on('close', (code) => this.onClose(code));
    }

    public async init(): Promise<number> {
        if (this.socket !== undefined) {
            this.onStart();
            return 2;
        }
        this.timeout = 30 * 1000;
        this.timeoutType = InstanceTimeoutType.START;
        while (this.timeout > 0) {
            if (this.socket !== undefined) {
                this.timeout = 0;
                this.timeoutType = InstanceTimeoutType.NONE;
                this.onStart();
                return 1;
            }
            this.timeout -= 1;
            await wait(1);
        }
        this.timeout = 0;
        this.timeoutType = InstanceTimeoutType.NONE;
        this._state = InstanceState.BROKEN;
        this.log('Failed to start!');
        return 0;
    }

    public start(_process: Process): void {
        if (this.socket === undefined) {
            this.log('Pre start process -> ' + _process.id);
            this.preStart.push(_process);
            return;
        }
        this.log('Processing -> ' + _process.id);
        this.processes.set(_process.id, _process);
        this.socket.emit('start', {
            id: _process.id,
            botId: _process.botId,
            payload: _process.payload
        });
    }

    public done(id: string): void {
        this.log('Done from processing -> ' + id);
        this.processes.delete(id);
    }

    public get(id: string): Process | undefined {
        return this.processes.get(id);
    }

    public log(print: string): void {
        console.log(`[Instance] - [ID::${this._id}]: ${print}`);
    }

    private async lifecycle(): Promise<any> {
        // Convert to STRESS when handling 60 requests
        if (this.processes.size >= 60) {
            if (this.timeoutType === InstanceTimeoutType.STRESS) {
                this.timeout += 1;
                if (this.timeout >= 30 * 1000) {
                    // TODO kill the instance saftey
                    this.process.kill();
                    this._state = InstanceState.BROKEN;
                }
            } else {
                this._state = InstanceState.STESS;
                this.timeoutType = InstanceTimeoutType.STRESS;
                this.timeout = 0;
            }
        } else if (this.processes.size <= 0) {
            // When the instance is useless ( no one use it )
            if (this.timeoutType === InstanceTimeoutType.USELESS) {
                this.timeout += 1;
                if (this.timeout >= 30 * 1000) {
                    // TODO kill the instance safety
                    this.process.kill();
                    this._state = InstanceState.BROKEN;
                }
            } else {
                this._state = InstanceState.USELESS;
                this.timeoutType = InstanceTimeoutType.USELESS;
                this.timeout = 0;
            }
        } else {
            // When the instance is handling and working very well
            this._state = InstanceState.NORMAL;
        }
        for (const _process of this.processes.values()) {
            _process.timeout -= 1;
            if (_process.timeout <= 0) {
                this.processes.delete(_process.id);
            }
        }
        await wait(1);
        this.lifecycle();
    }

    private onStart(): void {
        this.lifecycle();
        this.preStart.forEach((_process: Process) => {
            if (this.socket !== undefined) {
                this.log('Starting to process -> ' + _process.id);
                this.processes.set(_process.id, _process);
                this.socket.emit('start', {
                    id: _process.id,
                    botId: _process.botId,
                    payload: _process.payload
                });
            }
        });
        this.log('Started!');
    }

    private onClose(code: number): void {
        this._state = InstanceState.BROKEN;
        this.log('Closed! with code: ' + code);
    }

    get state(): InstanceState {
        return this._state;
    }

    get id(): string {
        return this._id;
    }
}

// Extract data from the arguments
program
    .option('-p, --port <port>', 'Set the port of the socket')
    .option('-h, --host <host>', 'Set the host of the socket')
    .option('-k, --key <key>', 'A key to identity our selves')
    .option('-l, --listen <port>', 'Set the listen port of the server')
    .parse(process.argv);

let host: string = "http://localhost";
let port: number = 2030;
let listen: number = 2050;
let key: string = "";

if (program.host) {
    host = program.host;
}

if (program.port) {
    port = program.port;
}

if (program.key) {
    key = program.key;
}

if (program.listen) {
    listen = program.listen;
}

// Connection to the engine
const io: SocketIOClient.Socket = SocketIOClient(`${host}:${port}`);
const instances: Map<string, Instance[]> = new Map();
const instanceById: Map<string, Instance> = new Map();

// Send our identity
io.on('connect', () => {
    io.emit('identity', key);
});

// Verify the connection
io.on('identity', (authorized: boolean) => {
    if (authorized === true) {
        server.listen(listen);
    }
});

io.on('start', (data: any) => {
    const id: string = data.id;
    const path: string = data.path;
    const payload: string = data.payload;
    const botId: string = data.botId;
    const appId: string = data.appId;
    let appInstances: Instance[] | undefined = instances.get(appId);
    let instance: Instance | undefined;
    if (appInstances === undefined) {
        appInstances = [];
        instances.set(appId, appInstances);
        const instanceId: string = v1();
        instance = new Instance(instanceId, path);
        instance.init();
        instanceById.set(instanceId, instance);
        console.log('[AutoScale] Created a new instance ' + `[${instance.id}]`);
    } else {
        for (const i of appInstances) {
            if (i.state === InstanceState.USELESS) {
                console.log('[AutoScale] Processing in USELESS Instance ' + `[${i.id}]`);
                instance = i;
                break;
            } else if (i.state === InstanceState.NORMAL) {
                console.log('[AutoScale] Processing in NORMAL Instance ' + `[${i.id}]`);
                instance = i;
                break;
            } else if (i.state === InstanceState.BROKEN || i.state === InstanceState.STESS) {
                console.log('[AutoScale] Skipped STRESS | BROKEN Instance ' + `[${i.id}]`);
                continue;
            }
        }
        if (instance === undefined) {
            const instanceId: string = v1();
            instance = new Instance(instanceId, path);
            instance.init();
            appInstances.push(instance);
            instanceById.set(instanceId, instance);
            console.log('[AutoScale] Created a new instance ' + `[${instance.id}]`);
        }
    }
    if (instance !== undefined) {
        instance.start(new Process(id, botId, payload));
    } else {
        console.log("[Start] Can't find any instance to start the process on it");
    }
});

io.on('http', (data: any) => {
    const fullID: string = data.id;
    const instanceId: string = fullID.substring(0, fullID.indexOf('_'));
    const processId: string = fullID.substring(fullID.indexOf('_') + 1, fullID.length);
    const requestId: string = processId.substring(processId.indexOf('_') + 1, processId.length);
    const instance: Instance | undefined = instanceById.get(instanceId);
    if (instance === undefined) {
        return;
    }
    if (instance.socket !== undefined) {
        data.id = requestId;
        instance.socket.emit('http', data);
    }
});

io.connect();

const server: SocketIO.Server = SocketIO();
server.on('connection', (socket) => {

    // Log the stuff from the applications
    socket.on('log', (print: any) => {
        const instance: Instance | undefined = (socket as any).instance;
        if (instance !== undefined) {
            instance.log('[App-Source] ' + print);
        }
    });

    // Identity
    socket.on('identity', (id) => {
        const instance: Instance | undefined = instanceById.get(id);
        if (instance === undefined) {
            return socket.disconnect(true);
        }
        instance.socket = socket;
    });

    // Handle http request
    socket.on('http', (data) => {
        const id: string = data.id;
        if (id === undefined) {
            return socket.disconnect(true);
        }
        const instance: Instance | undefined = instanceById.get(id);
        if (instance === undefined) {
            return socket.disconnect(true);
        }
        (socket as any).instance = instance;
        const process: Process | undefined = instance.get(data.pid);
        if (process === undefined) {
            return socket.disconnect(true);
        }
        const botId: string = process.botId;
        const type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' = data.type;
        const url: string  = data.url;
        const options: CoreOptions = data.options;
        const tokenHeader: boolean = data.tokenHeader;
        io.emit('http', {
            id: instance.id + '_' + process.id + '_' + data.rid,
            processId: botId,
            type: type,
            url: url,
            options: options,
            tokenHeader: tokenHeader
        });
    });

    // Handle a done
    socket.on('done', (data) => {
        const id: string = data.id;
        const processId: string = data.processId;
        if (id === undefined) {
            return socket.disconnect(true);
        }
        const instance: Instance | undefined = instanceById.get(id);
        if (instance === undefined) {
            return socket.disconnect(true);
        }
        instance.done(processId);
    });

});
