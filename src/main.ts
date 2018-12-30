import 'colors';
import { textSync } from 'figlet';
import { HTTPManager } from './http';
import ora from 'ora';
import { wait } from './until';
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
    const spinner = ora({
        spinner: cliSpinners.dots12,
        text: 'Starting...'.yellow,
    }).start();
    await wait(1000);
    // TODO Start the executor manager
    // Start the http server
    const httpServer: HTTPManager = new HTTPManager();
    const httpSpinner = ora({
        spinner: cliSpinners.line,
        color: 'yellow',
        text: '> HTTP Server on port ' + httpServer.port
    }).start();
    await httpServer.start();
    httpSpinner.succeed();
    spinner.text = "> " + "Engine is ready to use!".green;
    spinner.succeed();
}
