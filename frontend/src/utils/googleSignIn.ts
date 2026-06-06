import {
    getAdditionalUserInfo,
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { backendUrl } from '@/utils/api';
import { auth } from '@/utils/firebase';

export const signInWithGoogleSession = async () => {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');

    const result = await signInWithPopup(auth, provider);
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
