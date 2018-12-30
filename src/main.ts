import 'colors';
import { textSync } from 'figlet';
import { HTTPManager } from './http';
import ora from 'ora';
import { wait } from './until';
import { ExecutorProtocol } from './protocol';
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
    // Start the executor manager
    const executorProtocol: ExecutorProtocol = new ExecutorProtocol();
    const executorSpinner = ora({
        spinner: cliSpinners.line,
        color: 'yellow',
        text: '> Executor Protocol'
    }).start();
    await executorProtocol.start();
    executorSpinner.succeed();
    // Start the http server
    const httpServer: HTTPManager = new HTTPManager();
    const httpSpinner = ora({
        spinner: cliSpinners.line,
        color: 'yellow',
        text: '> HTTP Server on port ' + httpServer.port
    }).start();
    await httpServer.start();
    httpSpinner.succeed();
    console.log("> ".yellow + "Engine is ready to use!".green);
}
