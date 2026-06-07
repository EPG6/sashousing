import { FirebaseError } from 'firebase/app';
import {
    getRedirectResult,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    UserCredential,
} from 'firebase/auth';
import { backendUrl } from '@/utils/api';
import { getFirebaseAuth } from '@/utils/firebase';

const getGoogleProvider = () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    return provider;
};

const createBackendSession = async (result: UserCredential) => {
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential) {
        throw new Error('Google Sign-In failed: No credential');
    }

    const idToken = await result.user.getIdToken();
    const response = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        throw new Error('Could not start a session');
    }

    return result;
};

export const completeRedirectSignIn = async () => {
    const result = await getRedirectResult(getFirebaseAuth());
    if (!result) {
        return false;
    }

    await createBackendSession(result);
    return true;
};

export const signInWithGoogleSession = async () => {
    const auth = getFirebaseAuth();
    const provider = getGoogleProvider();

    try {
        const result = await signInWithPopup(auth, provider);
        await createBackendSession(result);
        return true;
    } catch (error) {
        if (
            error instanceof FirebaseError &&
            error.code === 'auth/popup-blocked'
        ) {
            await signInWithRedirect(auth, provider);
            return false;
        }

        throw error;
    }
};
