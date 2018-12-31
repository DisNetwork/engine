import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/create', (req: Request, res: Response) => {
    // TODO message create execute
});

router.get('/update', (req: Request, res: Response) => {
    // TODO message update execute
});

router.get('/delete', (req: Request, res: Response) => {
    // TODO message delete execute
});

export const MessageController: Router = router;
