import express, { Request, Response } from 'express';
import { getFirebaseAuth } from '../firebaseAdmin';
import { Users } from '../models/User';

const router = express.Router();
const usesSecureFrontend =
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    Boolean(process.env.RENDER_SERVICE_ID) ||
    (process.env.FRONTEND_URL || '').includes('https://');
const sessionHintCookieName = 'sas_has_session';
const sessionHintCookieOptions = {
    secure: usesSecureFrontend,
    sameSite: usesSecureFrontend ? 'none' : 'lax',
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000,
} as const;

router.get('/current_user', (req: Request, res: Response) => {
    if (!req.session.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
    }

    res.json({ user: req.session.user });
});

router.post('/login', async (req: Request, res: Response) => {
    const idToken = String(req.body.idToken || '');

    if (!idToken) {
        res.status(400).json({ message: 'Firebase ID token is required' });
        return;
    }

    try {
        const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
        const email = decodedToken.email?.trim().toLowerCase();

        if (!email) {
            res.status(400).json({ message: 'Google account email is required' });
            return;
        }

        const [firstName = 'Housing', ...lastNameParts] = (
            decodedToken.name || email.split('@')[0]
        )
            .split(/\s+/)
            .filter(Boolean);
        const lastName = lastNameParts.join(' ') || 'Reviewer';

        const user = await Users.findOneAndUpdate(
            { uid: decodedToken.uid },
            {
                $set: {
                    email,
                    firstName,
                    lastName,
                },
                $setOnInsert: {
                    isAdmin: false,
                },
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
            }
        );

        req.session.user = {
            id: user.uid,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            isAdmin: user.isAdmin,
        };

        res.cookie(sessionHintCookieName, 'true', sessionHintCookieOptions);
        res.status(200).json({ user: req.session.user });
    } catch (error) {
        console.error('Firebase login error:', error);
        res.status(401).json({ message: 'Invalid Google sign-in token' });
    }
});

router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy((error) => {
        if (error) {
            res.status(500).json({ message: 'Could not log out' });
            return;
        }

        res.clearCookie('connect.sid', {
            secure: usesSecureFrontend,
            sameSite: usesSecureFrontend ? 'none' : 'lax',
            httpOnly: true,
        });
        res.clearCookie(sessionHintCookieName, {
            secure: usesSecureFrontend,
            sameSite: usesSecureFrontend ? 'none' : 'lax',
            httpOnly: false,
        });
        res.status(204).send();
    });
});

export default router;
