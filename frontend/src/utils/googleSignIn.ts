import {
    GoogleAuthProvider,
    signInWithCredential,
    UserCredential,
} from 'firebase/auth';
import { backendUrl } from '@/utils/api';
import { getFirebaseAuth } from '@/utils/firebase';

declare global {
    interface Window {
        google?: any;
    }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;

const createBackendSession = async (result: UserCredential) => {
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

export const renderGoogleSignInButton = (
    element: HTMLElement,
    onSuccess?: () => void,
    onError?: (error: Error) => void
) => {
    if (!window.google?.accounts?.id) {
        onError?.(new Error('Google Identity Services SDK not loaded'));
        return;
    }

    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential?: string }) => {
            try {
                if (!response.credential) {
                    throw new Error('Google Sign-In failed: No credential');
                }

                const auth = getFirebaseAuth();

                const firebaseCredential =
                    GoogleAuthProvider.credential(response.credential);

                const result = await signInWithCredential(
                    auth,
                    firebaseCredential
                );

                await createBackendSession(result);

                onSuccess?.();
            } catch (error) {
                onError?.(error as Error);
            }
        },
    });

    element.innerHTML = '';

    window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        text: 'signin_with',
        shape: 'rectangular',
        width: 100
    });
};