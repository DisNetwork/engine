import { ExecutorManager } from './../executor';
import { Router, Request, Response } from 'express';
import { BotExecutor } from '..';

const router: Router = Router();

router.post('/start', (req: Request, res: Response) => {
    if (!req.headers.authorization) {
        res.sendStatus(202);
        return;
    }
    const appId: string = req.headers.authorization;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.gateway(appId);
    executor.execute();
    res.sendStatus(200);
});

export const BotController: Router = router;
