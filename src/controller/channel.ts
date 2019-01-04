import { Router, Request, Response } from 'express';
import { ExecutorManager } from '../protocol';
import { BotExecutor } from '..';
const router: Router = Router();

function execute(req: Request, type: 'create' | 'update' | 'delete' | 'pins') {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.channel(appId, botId, type, req.body);
    executor.execute();
}

router.post('/create', (req: Request, res: Response) => {
    execute(req, 'create');
});

router.post('/update', (req: Request, res: Response) => {
    execute(req, 'update');
});

router.post('/delete', (req: Request, res: Response) => {
    execute(req, 'delete');
});

router.post('/pins', (req: Request, res: Response) => {
    execute(req, 'pins');
});

export const ChannelController: Router = router;
