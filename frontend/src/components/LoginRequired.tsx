'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { renderGoogleSignInButton } from '@/utils/googleSignIn';

export default function LoginRequired() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    const closeModal = useCallback(() => {
        if (window.history.length > 1) {
            router.back();
            return;
        }

        router.push('/campus/housing');
    }, [router]);

    useEffect(() => {
        if (!buttonRef.current) return;

        renderGoogleSignInButton(
            buttonRef.current,
            () => window.location.reload(),
            (error) => setError(error.message)
        );
    }, []);

    useEffect(() => {
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeModal();
            }
        };

        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [closeModal]);

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

                <h1 className="mb-2 font-display text-2xl font-semibold sm:text-3xl">
                    Sign in to review housing and see room status.
                </h1>

                <p className="mb-5 text-sm text-sas-black/65">
                    Use your Google account to view and write room reviews.
                </p>

                <div className="mt-5">
                    <div ref={buttonRef}
                     className="flex justify-center"
                        />

                    {error && (
                        <p className="mt-2 text-sm text-red-600">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </main>
    );
}