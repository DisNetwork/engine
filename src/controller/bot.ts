import { Router, Request, Response } from 'express';

const router: Router = Router();

router.post('start', (req: Request, res: Response) => {
    // TODO start the bot
});

export const BotController: Router = router;
