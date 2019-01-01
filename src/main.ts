import 'colors';
import { textSync } from 'figlet';
import { HTTPManager } from './http';
import ora from 'ora';
import { ExecutorManager, ExecutorProtocol } from './protocol';
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
        .option('-f, --executor-file <filename>', 'Set the executor path ( default: executor.js )')
        .option('-e, --endpoint <endpoint>', 'Change the endpoint of the engine ( default: http://localhost )')
        .option('-h, --http-port <port>', 'Specify the http port')
        .option('-p, --execute-port <port>', 'Specify the execute port of the executor protocol')
        .option('-t, --executor-timeout <timeout>', 'Change the executor protocol timeout ( default: 20 seconds )')
        .parse(process.argv);
    let loggerLevel: LoggerLevel = LoggerLevel.INFO;
    let apps: any;
    let appsFile: string = "./apps.json";
    let executorFile: string = "executor.js";
    let endpoint: string = "http://localhost:2030/";
    let httpPort: number = 2030;
    let executePort: number = 2020;
    let executorTimeout: number = 20 * 1000;
    if (program.logLevel) {
        loggerLevel = program.logLevel;
    }
    if (program.apps) {
        if (program.apps !== true) {
            appsFile = "./" + program.apps;
        }
        apps = require(appsFile);
    }
    if (program.executorFile) {
        executorFile = program.executorFile;
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
    if (program.executorTimeout) {
        executorTimeout = program.executorTimeout;
    }
    // Start the http server
    const httpServer: HTTPManager = new HTTPManager(httpPort);
    const httpSpinner = ora({
        spinner: cliSpinners.line,
        color: 'yellow',
        text: '> HTTP Server'
    }).start();
    await httpServer.start();
    httpSpinner.succeed();
    // Start the executor manager
    const executorProtocol: ExecutorProtocol = new ExecutorProtocol(executePort, executorTimeout);
    let executorSpinner = ora({
        spinner: cliSpinners.dots12,
        color: 'yellow',
        text: '> Executor Protocol'
    }).start();
    await executorProtocol.start();
    executorSpinner.succeed();
    const executorManager: ExecutorManager =  new ExecutorManager(
        executorProtocol,
        executorFile,
        endpoint,
        loggerLevel,
        undefined,
        apps
    );
    if (executorManager.cloud === undefined) {
        console.log('[CloudEngine] No cloud engine found! The engine is going to use the local cache'.red);
    }
    executorSpinner = ora({
        spinner: cliSpinners.dots12,
        color: 'yellow',
        text: '> Starting the executor...'
    }).start();
    const success: boolean = await executorManager.run();
    if (!success) {
        executorSpinner.warn();
        process.exit(0);
        return;
    }
    executorSpinner.succeed();
    console.log("> ".yellow + "Engine is ready to use!".green);
}
