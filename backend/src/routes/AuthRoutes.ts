import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/current_user', (req: Request, res: Response) => {
    if (!req.session.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    res.json({ user: req.session.user });
});

router.post('/login', (req: Request, res: Response) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
        res.status(400).json({ message: 'Valid email is required' });
        return;
    }

    const [namePart] = email.split('@');
    const [firstName = 'Housing', lastName = 'Reviewer'] = namePart
        .split(/[._-]/)
        .filter(Boolean);

    req.session.user = {
        id: email,
        email,
        firstName,
        lastName,
        isAdmin: false,
    };

    res.status(200).json({ user: req.session.user });
});

router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((error) => {
        if (error) {
            res.status(500).json({ message: 'Could not log out' });
            return;
        }

        res.clearCookie('connect.sid');
        res.status(204).send();
    });
});

export default router;
