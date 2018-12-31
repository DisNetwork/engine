import { ExecutorManager } from './executor';
import 'colors';
import { textSync } from 'figlet';
import { HTTPManager } from './http';
import ora from 'ora';
import { ExecutorProtocol } from './protocol';
import { LoggerLevel } from './logger';
import program from 'commander';
const cliSpinners = require('cli-spinners');
console.log(textSync('DisNetwork', {
    font: 'Standard',
    horizontalLayout: 'fitted',
    verticalLayout: 'fitted'
}));
console.log("-------------------------------");
console.log("DisNetwork® Engine | https://github.com/DisNetwork/engine");

start();

async function start() {
    program
        .version('0.0.2', '-v, --version')
        .option('-l, --log-level <level>', 'Logger level type')
        .option('-a, --apps [file]', 'Enable the using of the local apps ( default: apps.json )')
        .option('-e, --endpoint <endpoint>', 'Change the endpoint of the engine ( default: http://localhost )')
        .option('-hp, --http-port <port>', 'Specify the http port')
        .option('-ep, --execute-port <port>', 'Specify the execute port of the executor protocol')
        .parse(process.argv);
    let loggerLevel: LoggerLevel = LoggerLevel.INFO;
    let apps: any;
    let appsFile: string = "./apps.json";
    let endpoint: string = "http://localhost:2030";
    let httpPort: number = 2030;
    let executePort: number = 2020;
    if (program.logLevel) {
        loggerLevel = program.logLevel;
    }
    if (program.apps) {
        if (program.apps !== true) {
            appsFile = "./" + program.apps;
        }
        apps = require(appsFile);
    }
    if (program.endpoint) {
        endpoint = program.endpoint;
    }
    if (program.httpPort) {
        httpPort = program.httpPort;
    }
    if (program.executePort) {
        executePort = program.executePort;
    }
    const executorManager: ExecutorManager = new ExecutorManager(endpoint, loggerLevel, undefined, apps);
    if (executorManager.cloud === undefined) {
        console.log('[CloudEngine] No cloud engine found! The engine is going to use the local cache'.red);
    }
    // Start the executor manager
    const executorProtocol: ExecutorProtocol = new ExecutorProtocol(executePort);
    const executorSpinner = ora({
        spinner: cliSpinners.dots12,
        color: 'yellow',
        text: '> Executor Protocol'
    }).start();
    await executorProtocol.start();
    executorSpinner.succeed();
    // Start the http server
    const httpServer: HTTPManager = new HTTPManager(httpPort);
    const httpSpinner = ora({
        spinner: cliSpinners.line,
        color: 'yellow',
        text: '> HTTP Server'
    }).start();
    await httpServer.start();
    httpSpinner.succeed();
    console.log("> ".yellow + "Engine is ready to use!".green);
}
