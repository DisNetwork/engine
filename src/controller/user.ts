import { BotExecutor } from './../index';
import { Router, Response, Request } from "express";
import { ExecutorManager } from "../protocol";

const router: Router = Router();

function execute(req: Request, res: Response) {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.user(appId, botId, req.body);
    executor.execute();
    res.sendStatus(200);
}

router.post('update/presence', (req: Request, res: Response) => {
    execute(req, res);
});

export const UserController: Router = router;
