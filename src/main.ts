import { CloudEngine } from './cloud/index';
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
        .option('-b, --bots [file]', 'Enable the using of the local bots ( default: bots.json )')
        .option('-f, --executor-file <filename>', 'Set the executor path ( default: out/executor.js )')
        .option('-e, --endpoint <endpoint>', 'Change the endpoint of the engine ( default: http://localhost )')
        .option('-h, --http-port <port>', 'Specify the http port')
        .option('-p, --execute-port <port>', 'Specify the execute port of the executor protocol')
        .option('-t, --executor-timeout <timeout>', 'Change the executor protocol timeout ( default: 20 seconds )')
        .option('-o, --host <host>', 'Change the host ( default: localhost )')
        .option('-d, --debug', 'Enable the debug mode for the executor protocol')
        .option('-c, --cloud [file]', 'Set the JS file that supports the cloud')
        .parse(process.argv);
    let loggerLevel: LoggerLevel = LoggerLevel.INFO;
    let apps: any;
    let bots: any;
    let appsFile: string = "./apps.json";
    let botsFile: string = "./bots.json";
    let executorFile: string = "out/executor.js";
    let endpoint: string = "http://localhost:2030/";
    let host: string = "localhost";
    let httpPort: number = 2030;
    let executePort: number = 2020;
    let executorTimeout: number = 20 * 1000;
    let debug: boolean = false;
    let cloud: boolean = false;
    let cloudFile: string = "./cloud.js";
    if (program.logLevel) {
        loggerLevel = program.logLevel;
    }
    if (program.apps) {
        if (program.apps !== true) {
            appsFile = "./" + program.apps;
        }
        apps = require(appsFile);
    }
    if (program.bots) {
        if (program.bots !== true) {
            botsFile = "./" + program.bots;
        }
        bots = require(botsFile);
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
    if (program.host) {
        host = program.host;
    }
    if (program.debug) {
        debug = program.debug;
        console.log("Warning! ".yellow + "Executor protocol DEBUG mode is ".cyan + "ENABLED".green);
    }
    if (program.cloud) {
        if (program.cloud !== true) {
            cloudFile = "./" + program.cloud;
        }
        cloud = true;
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
    const executorProtocol: ExecutorProtocol = new ExecutorProtocol(
        executePort,
        executorTimeout
    );
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
        host,
        endpoint,
        loggerLevel,
        debug,
        cloud ? require(cloudFile) : undefined,
        apps,
        bots
    );
    if (executorManager.cloud === undefined) {
        console.log('[CloudEngine] No cloud engine found! The engine is going to use the local cache'.red);
    }
    executorSpinner = ora({
        spinner: cliSpinners.dots12,
        color: 'yellow',
        text: '> Starting the executor...'
    });
    if (!debug) {
        executorSpinner.start();
    }
    const success: boolean = await executorManager.run();
    if (!success) {
        if (!debug) {
            executorSpinner.warn();
        }
        process.exit(0);
        return;
    }
    if (!debug) {
        executorSpinner.text = "Executor Process";
        executorSpinner.succeed();
    }
    console.log("> ".yellow + "Engine is ready to use!".green);
}
