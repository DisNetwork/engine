import { Router, Request, Response } from 'express';
import { BotExecutor } from '..';
import { ExecutorManager } from '../protocol';
import { MessageEventType } from '../manager';

const router: Router = Router();

function execute(req: Request, res: Response, type: MessageEventType) {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.message(appId, botId, type, req.body);
    executor.execute();
    res.sendStatus(200);
}

router.post('/create', (req: Request, res: Response) => {
   execute(req, res, MessageEventType.CREATE);
});

router.post('/update', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.UPDATE);
});

router.post('/delete', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.DELETE);
});

router.post('/delete/bulk', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.DELETE_BULK);
});

router.post('/reaction/add', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.REACTION_ADD);
});

router.post('/reaction/remove', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.REACTION_REMOVE);
});

router.post('/reaction/remove/all', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.REACTION_REMOVE_ALL);
});

router.post('/typing', (req: Request, res: Response) => {
    execute(req, res, MessageEventType.TYPING);
});

export const MessageController: Router = router;
