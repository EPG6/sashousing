import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const getFirebasePrivateKey = () =>
    process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const getServiceAccount = () => {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }

    if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_CLIENT_EMAIL &&
        process.env.FIREBASE_PRIVATE_KEY
    ) {
        return {
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: getFirebasePrivateKey(),
        };
    }

    return null;
};

if (!admin.apps.length) {
    const serviceAccount = getServiceAccount();

    if (!serviceAccount) {
        throw new Error(
            'Firebase Admin credentials are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
        );
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

export const firebaseAuth = admin.auth();
