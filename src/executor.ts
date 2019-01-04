import { Response, CoreOptions } from 'request';
import SocketIO from 'socket.io';
import SocketIOClient from 'socket.io-client';
import program from 'commander';
import { ChildProcess, execFile } from 'child_process';
import { wait } from './until';

console.log = (print: any) => {
    io.emit('print', print);
};

enum HTTPCode {
    DONE = 0,
    URL_NOT_FOR_HTTP = -1,
    REJECTED_HOSTNAME = -2
}

class HTTPResponse {
    public id: string = "";
    public done: boolean = false;
    public error: Error | undefined;
    public response: Response | undefined;
    public body: any | undefined;
    public code: HTTPCode = HTTPCode.DONE;
}

class HTTPRequest {

    public constructor(
        public id: string,
        public processId: string,
        public type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD',
        public url: string,
        public options: CoreOptions,
        public tokenHeader: boolean
    ) {
    }

}

class ProcessData {
    public id: string = "";
    public started: number  = new Date().getTime();
    public stopped: number = new Date().getTime();
    public outOfTime: boolean = false;
    public code: number = 0;
}

class Process {
    public httpReqest: HTTPRequest | undefined;
    public started: number | undefined = undefined;
    public stopped: number | undefined = undefined;
    public socket: SocketIO.Socket | undefined = undefined;
    public process: ChildProcess;

    public constructor(
        public id: string,
        public botId: string,
        private path: string,
        private timeout: number,
        public payload: any
    ) {
        console.log("Running the process...");
        const command: string = 'node "' + this.path + `" -h ${host} -p ${listen} -k ${this.id}`;
        const nodeExePath: string = process.execPath;
        const args: string[] = [
            this.path,
            "-h",
            host,
            "-p",
            "" + listen,
            "-k",
            this.id
        ];
        console.log("Command -> " + command);
        this.process = execFile(nodeExePath, args);
        console.log("[Process] Started with PID::" + this.process.pid);
        this.process.on('close', (code) => this.onClose(code));
    }

    public async start(): Promise<any> {
        return new Promise(async (resolve: any) => {
            if (this.socket !== undefined) {
                this.started = new Date().getTime();
                this.payload.botId = this.botId;
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
                        console.log("[AUTO-KILL] killed process PID::" + process.pid);
                        processData.code = -1;
                    }
                    this.stopped = new Date().getTime();
                    resolve(processData);
                    return;
                }
                processData.stopped = this.stopped;
                if (!this.process.killed) {
                    this.process.kill();
                    console.log("[AUTO-KILL] killed process PID::" + process.pid);
                    processData.code = -1;
                }
                resolve(processData);
            }
        });
    }

    private onClose(code: number): void {
        this.stopped = new Date().getTime();
        console.log("Process closed with CODE::" + code);
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
const processes: Map<string, Process> = new Map();
const requests: Map<string, string> = new Map();

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
    const botId: string = data.botId;
    const process: Process = new Process(id, botId, path, timeout, payload);
    processes.set(id, process);
});

io.on('http', (data: HTTPResponse) => {
    const processID: string | undefined = requests.get(data.id);
    if (processID) {
        const process: Process | undefined = processes.get(processID);
        if (process && process.socket) {
            data.id = data.id.substring(processID.length + 1, data.id.length);
            process.socket.emit('http', data);
        }
    }
});

io.connect();

// A server for converstion between executor and apps
const server: SocketIO.Server = SocketIO();
server.on('connection', (socket) => {

    // Log the stuff from the applications
    socket.on('log', (print: any) => {
        console.log(`[APP] [Process::${(socket as any).process.process.pid}] => ` + print);
    });

    // Identitiy the connection and start processing
    socket.on('identity', async (id) => {
        if (processes.has(id)) {
            const process: Process | undefined = processes.get(id);
            if (process !== undefined) {
                process.socket = socket;
                (socket as any).process = process;
                const processData: ProcessData = await process.start();
                if (!process.process.killed) {
                    process.process.kill();
                    console.log("[AUTO-KILL] killed process PID -> " + process.process.pid);
                }
                (processData as any).botId = process.id;
                io.emit('stop', processData);
            }
        } else {
            socket.disconnect(true);
        }
    });

    // Handle the http request
    socket.on('http', async (data: any) => {
        const id: string = data.id;
        const type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' = data.type;
        const url: string  = data.url;
        const options: CoreOptions = data.options;
        const process: Process = (socket as any).process;
        const tokenHeader: boolean = data.tokenHeader;
        // Check if there's a process and current request is handling
        if (process && !process.httpReqest) {
            const request: HTTPRequest = new HTTPRequest(
                process.id + "_" + id, // kill the overwrite bug
                process.id, type, url, options, tokenHeader
            );
            requests.set(request.id, process.id);
            io.emit('http', {
                id: request.id,
                processId: process.id,
                type: request.type,
                url: request.url,
                options: request.options,
                tokenHeader: tokenHeader
            });
        }
    });

    // Tell the process that he connected
    socket.emit('connect');
});
