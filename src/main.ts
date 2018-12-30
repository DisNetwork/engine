import { textSync } from 'figlet';
import { HTTPManager } from './http';
import ora from 'ora';
const cliSpinners = require('cli-spinners');
console.log(textSync('DisNetwork', {
    font: 'Standard',
    horizontalLayout: 'fitted',
    verticalLayout: 'fitted'
}));
console.log("-------------------------------");
console.log("DisNetwork Engine© | https://github.com/DisNetwork/engine");

start();

async function start() {
    // TODO Start the executor manager
    // Start the http server
    const httpServer: HTTPManager = new HTTPManager();
    const httpSpinner = ora({
        spinner: cliSpinners.dots12,
        color: 'yellow',
        text: 'Starting HTTP Server...'
    }).start();
    await httpServer.start();
    httpSpinner.succeed();
    httpSpinner.text = "HTTP Server is listening on port " + httpServer.port;
}
