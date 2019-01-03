import { Router, Request, Response } from 'express';
import { BotExecutor } from '..';
import { ExecutorManager } from '../protocol';

const router: Router = Router();

router.get('/create', (req: Request, res: Response) => {
   const botId: string = (req as any).botId;
   const appId: string = (req as any).appId;
   const executorManager: ExecutorManager = ExecutorManager.instance;
   const executor: BotExecutor = executorManager.message(appId, botId, 'create');
   executor.execute();
});

router.get('/update', (req: Request, res: Response) => {
    // TODO message update execute
});

router.get('/delete', (req: Request, res: Response) => {
    // TODO message delete execute
});

export const MessageController: Router = router;
