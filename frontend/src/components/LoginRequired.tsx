'use client';

import Image from 'next/image';
import { useState } from 'react';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default function LoginRequired() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const login = async (event: React.FormEvent) => {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${backendUrl}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                throw new Error('Could not start a session');
            }

            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-sas-mist px-4 text-sas-black">
            <form
                onSubmit={login}
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
                    Enter an email to start a session.
                </p>
                <label
                    className="text-sm font-medium text-sas-black"
                    htmlFor="email"
                >
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-md border border-sas-line px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sas-green"
                />
                {error && (
                    <p className="mt-3 text-sm text-sas-green">{error}</p>
                )}
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 w-full rounded-md bg-sas-green px-4 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                >
                    {submitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}
