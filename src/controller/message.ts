import { Router, Request, Response } from 'express';

const router: Router = Router();

router.get('/create', (req: Request, res: Response) => {
    // TODO message create execute
    console.log(req.body);
});

router.get('/update', (req: Request, res: Response) => {
    // TODO message update execute
});

router.get('/delete', (req: Request, res: Response) => {
    // TODO message delete execute
});

export const MessageController: Router = router;
