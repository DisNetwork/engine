import { Router, Request, Response } from "express";
import { GuildEventType } from "../manager";
import { ExecutorManager } from "../protocol";
import { BotExecutor } from "..";

const router: Router = Router();

function execute(req: Request, type: GuildEventType) {
    const botId: string = (req as any).botId;
    const appId: string = (req as any).appId;
    const executorManager: ExecutorManager = ExecutorManager.instance;
    const executor: BotExecutor = executorManager.guild(appId, botId, type, req.body);
    executor.execute();
}

router.post('/load', (req: Request, res: Response) => {
    execute(req, GuildEventType.LOAD);
});

router.post('/join', (req: Request, res: Response) => {
    execute(req, GuildEventType.JOIN);
});

router.post('/update', (req: Request, res: Response) => {
    execute(req, GuildEventType.UPDATE);
});

router.post('/delete', (req: Request, res: Response) => {
    execute(req, GuildEventType.DELETE);
});

router.post('/ban/add', (req: Request, res: Response) => {
    execute(req, GuildEventType.BAN_ADD);
});

router.post('/ban/remove', (req: Request, res: Response) => {
    execute(req, GuildEventType.BAN_REMOVE);
});

router.post('/update/emojis', (req: Request, res: Response) => {
    execute(req, GuildEventType.EMOJIS_UPDATE);
});

router.post('/update/integrations', (req: Request, res: Response) => {
    execute(req, GuildEventType.INTEGRATIONS_UPDATE);
});

router.post('/member/add', (req: Request, res: Response) => {
    execute(req, GuildEventType.MEMBER_ADD);
});

router.post('/member/remove', (req: Request, res: Response) => {
    execute(req, GuildEventType.MEMBER_REMOVE);
});

router.post('/member/update', (req: Request, res: Response) => {
    execute(req, GuildEventType.MEMBER_UPDATE);
});

router.post('/role/create', (req: Request, res: Response) => {
    execute(req, GuildEventType.ROLE_CREATE);
});

router.post('/role/update', (req: Request, res: Response) => {
    execute(req, GuildEventType.ROLE_UPDATE);
});

router.post('/role/delete', (req: Request, res: Response) => {
    execute(req, GuildEventType.ROLE_DELETE);
});

export const GuildController: Router = router;
