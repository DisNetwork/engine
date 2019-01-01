import SocketIO from "socket.io-client";
import program from 'commander';

program
    .option('-p, --port <port>', 'Set the port of the socket')
    .option('-h, --host <host>', 'Set the host of the socket')
    .option('-k, --key <key>', 'A key to identity our selves')
    .parse(process.argv);

let host: string = "http://localhost";
let port: number = 2030;
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

const io: SocketIOClient.Socket = SocketIO(`${host}:${port}`);

io.on('connect', () => {
    io.emit('identity', key);
});

io.connect();
