import SocketIO from 'socket.io';
import SocketIOClient from 'socket.io-client';
import program from 'commander';
import { ChildProcess, exec } from 'child_process';
import { wait } from './until';

class ProcessData {
    public id: string = "";
    public started: number  = new Date().getTime();
    public stopped: number = new Date().getTime();
    public outOfTime: boolean = false;
    public code: number = 0;
}

class Process {
    public started: number | undefined = undefined;
    public stopped: number | undefined = undefined;
    public socket: SocketIO.Socket | undefined = undefined;
    private process: ChildProcess;

    public constructor(
        public id: string,
        private path: string,
        private timeout: number,
        public payload: any
    ) {
        this.process = exec('node "' + this.path + `" -h ${host} -p ${port} -k ${this.id}`);
        this.process.on('close', (code) => this.onClose(code));
    }

    public async start(): Promise<any> {
        return new Promise(async (resolve: any) => {
            if (this.socket !== undefined) {
                this.started = new Date().getTime();
                this.socket.emit('start', this.payload);
                while (this.timeout > 0) {
                    if (this.stopped === undefined) {
                        this.timeout -= 1;
                        await wait(1);
                        continue;
                    }
                    break;
                }
                const processData: ProcessData = new ProcessData();
                processData.id = this.id;
                processData.started = this.started;
                if (this.stopped === undefined) {
                    processData.outOfTime = true;
                    if (!this.process.killed) {
                        this.process.kill();
                        processData.code = -1;
                    }
                    this.stopped = new Date().getTime();
                    resolve(processData);
                    return;
                }
                processData.stopped = this.stopped;
                if (!this.process.killed) {
                    this.process.kill();
                    processData.code = -1;
                }
                resolve(processData);
            }
        });
    }

    private onClose(code: number): void {
        this.stopped = new Date().getTime();
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
const map: Map<string, Process> = new Map();

io.on('connect', () => {
    io.emit('identity', key);
});

io.on('identity', (authorized: boolean) => {
    if (authorized === true) {
        server.listen(listen);
    }
});

io.on('start', (data: any) => {
    const id: string = data.id;
    const payload: any = data.payload;
    const path: string = data.path;
    const timeout: number = data.timeout;
    const process: Process = new Process(id, path, timeout, payload);
    map.set(id, process);
});

io.connect();

// A server for converstion between executor and apps
const server: SocketIO.Server = SocketIO();
server.on('connection', (socket) => {
    socket.on('identity', async (id) => {
        if (map.has(id)) {
            const process: Process | undefined = map.get(id);
            if (process !== undefined) {
                process.socket = socket;
                const processData: ProcessData = await process.start();
                io.emit('stop', processData);
            }
        } else {
            socket.disconnect(true);
        }
    });
    socket.emit('connect');
});
