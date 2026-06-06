'use client';

import Image from 'next/image';
import { useState } from 'react';
import { signInWithGoogleSession } from '@/utils/googleSignIn';

export default function LoginRequired() {
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const login = async () => {
        setSubmitting(true);
        setError(null);

        try {
            await signInWithGoogleSession();
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
                    Sign in to review housing and see room status.
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
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-sas-green px-4 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                >
                    <Image
                        src="/google-sign.svg"
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5"
                    />
                    {submitting ? 'Signing in...' : 'Sign in with Google'}
                </button>
            </div>
        </main>
    );
}
