import express, { Express, Request, Response, NextFunction } from 'express';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import authRoutes from './routes/AuthRoutes';
import housingRoutes from './routes/HousingRoutes';
import { connectDb } from './db';

dotenv.config();

const app: Express = express();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
}

app.set('trust proxy', 1);

app.use(
    cors({
        origin: frontendUrl.split(',').map((origin) => origin.trim()),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    })
);

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'replace-this-session-secret',
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: mongoUri,
            ttl: 24 * 60 * 60,
            autoRemove: 'native',
        }),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
        },
    })
);

app.use(async (_req: Request, _res: Response, next: NextFunction) => {
    try {
        await connectDb();
        next();
    } catch (error) {
        next(error);
    }
});

app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/campus/housing', housingRoutes);

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
});

export default app;
