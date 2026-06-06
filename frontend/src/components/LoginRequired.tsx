'use client';

import Image from 'next/image';
import {
    getAdditionalUserInfo,
    GoogleAuthProvider,
    signInWithPopup,
    UserCredential,
} from 'firebase/auth';
import { useState } from 'react';
import { auth } from '@/utils/firebase';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function LoginRequired() {
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const signInWithGoogle = async (result: UserCredential) => {
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
    };

    const login = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');

            const result = await signInWithPopup(auth, provider);
            console.log('Signed in user:', result.user);

            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (!credential) {
                throw new Error('Google Sign-In failed: No credential');
            }

            const additionalUserInfo = getAdditionalUserInfo(result);
            console.log('Additional user info:', additionalUserInfo);

            await signInWithGoogle(result);
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-sas-mist px-4 text-sas-black">
            <div
                className="w-full max-w-sm rounded-md border border-sas-line bg-sas-white p-6 shadow-sm"
            >
                <Image
                    src="/logos/saslogo.png"
                    alt="SAS"
                    width={72}
                    height={69}
                    priority
                    className="mb-4 h-16 w-16 object-contain"
                />
                <h1 className="mb-2 font-display text-3xl font-semibold">
                    Sign in to review housing
                </h1>
                <p className="mb-5 text-sm text-sas-black/65">
                    Use your Google account to view and write room reviews.
                </p>
                {error && (
                    <p className="mt-3 text-sm text-sas-green">{error}</p>
                )}
                <button
                    type="button"
                    onClick={login}
                    disabled={submitting}
                    className="mt-5 w-full rounded-md bg-sas-green px-4 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                >
                    {submitting ? 'Signing in...' : 'Sign in with Google'}
                </button>
            </div>
        </main>
    );
}
