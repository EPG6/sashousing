import admin from 'firebase-admin';

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

    admin.initializeApp(
        serviceAccount
            ? {
                  credential: admin.credential.cert(serviceAccount),
              }
            : undefined
    );
}

export const firebaseAuth = admin.auth();
