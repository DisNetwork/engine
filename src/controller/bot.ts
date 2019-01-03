import { ExecutorManager } from './../protocol';
import { Router, Request, Response } from 'express';
import { BotExecutor } from '..';

const router: Router = Router();

router.post('/start', (req: Request, res: Response) => {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.gateway(appId, botId);
    executor.execute();
    res.sendStatus(200);
});

export const BotController: Router = router;
