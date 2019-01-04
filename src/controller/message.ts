import { Router, Request, Response } from 'express';
import { BotExecutor } from '..';
import { ExecutorManager } from '../protocol';

const router: Router = Router();

router.post('/create', (req: Request, res: Response) => {
   const botId: string = (req as any).botId;
   const appId: string = (req as any).appId;
   const executorManager: ExecutorManager = ExecutorManager.instance;
   const executor: BotExecutor = executorManager.message(appId, botId, 'create', req.body);
   executor.execute();
   res.sendStatus(200);
});

router.post('/update', (req: Request, res: Response) => {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.message(appId, botId, 'update', req.body);
    executor.execute();
    res.sendStatus(200);
});

router.post('/delete', (req: Request, res: Response) => {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.message(appId, botId, 'delete', req.body);
    executor.execute();
    res.sendStatus(200);
});

export const MessageController: Router = router;
