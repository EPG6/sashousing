'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
    completeRedirectSignIn,
    signInWithGoogleSession,
} from '@/utils/googleSignIn';

export default function LoginRequired() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const closeModal = useCallback(() => {
        if (window.history.length > 1) {
            router.back();
            return;
        }

        router.push('/campus/housing');
    }, [router]);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [closeModal]);

    useEffect(() => {
        let cancelled = false;

        completeRedirectSignIn()
            .then((signedIn) => {
                if (signedIn && !cancelled) {
                    window.location.reload();
                }
            })
            .catch((err) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Google sign-in failed'
                );
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const login = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const signedIn = await signInWithGoogleSession();
            if (signedIn) {
                window.location.reload();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main
            className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-sas-black/45 px-4 text-sas-black"
            onClick={closeModal}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative w-full max-w-sm rounded-md border border-sas-line bg-sas-white p-6 shadow-sm"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={closeModal}
                    className="absolute right-3 top-3 rounded-md px-2 py-1 text-xl leading-none text-sas-black/55 hover:text-sas-green"
                    aria-label="Close sign-in modal"
                >
                    &times;
                </button>
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
                    {submitting ? 'Signing in...' : 'Google Sign In'}
                </button>
            </div>
        </main>
    );
}
