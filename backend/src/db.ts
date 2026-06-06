import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let connectionPromise: Promise<typeof mongoose> | null = null;
let housingReviewPictures: GridFSBucket | null = null;

export async function connectDb() {
    if (mongoose.connection.readyState === 1 && housingReviewPictures) {
        return { housingReviewPictures };
    }

    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI is not defined');
    }

    if (!connectionPromise) {
        connectionPromise = mongoose.connect(mongoUri);
    }

    await connectionPromise;

    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('MongoDB connection is not ready');
    }

    housingReviewPictures = new GridFSBucket(db, {
        bucketName: 'housingreviewpictures',
    });

    return { housingReviewPictures };
}

export function getHousingReviewPictures() {
    if (!housingReviewPictures) {
        throw new Error('Housing review picture bucket is not ready');
    }

    return housingReviewPictures;
}
