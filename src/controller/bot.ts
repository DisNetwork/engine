import { ExecutorManager } from './../protocol';
import { Router, Request, Response } from 'express';
import { BotExecutor } from '..';
import { GatewayManager, GatewayMessage, GatewayOpcode } from '../gateway';

const router: Router = Router();

router.post('/start', (req: Request, res: Response) => {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.gateway(appId, botId);
    executor.execute();
    res.sendStatus(200);
});

router.post('/activity', (req: Request, res: Response) => {
    const botId: string = (req as any).botId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor | undefined = executorManager.get('gateway_' + botId);
    if (executor && req.body.status) {
        const message: GatewayMessage = new GatewayMessage();
        message.opcode = GatewayOpcode.STATUS_UPDATE;
        message.data = {
            status: req.body.status,
            afk: false,
            since: null,
            game: {}
        };
        const bodyGame = req.body.game;
        if (bodyGame && bodyGame.name && (bodyGame.type || bodyGame.type === 0)) {
            message.data.game = {
                name: bodyGame.name,
                type: bodyGame.type,
                url: bodyGame.url
            };
        }
        (executor.manager as GatewayManager).send(message);
        return res.sendStatus(200);
    }
    return res.sendStatus(201);
});

export const BotController: Router = router;
