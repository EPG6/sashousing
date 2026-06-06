'use client';

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
        <main className="min-h-screen bg-gray-100 text-gray-900 flex items-center justify-center px-4">
            <form
                onSubmit={login}
                className="w-full max-w-sm rounded-md bg-white p-6 shadow-sm border border-gray-200"
            >
                <h1 className="text-2xl font-semibold mb-2">
                    Sign in to review housing
                </h1>
                <p className="text-sm text-gray-600 mb-5">
                    Enter an email to start a session.
                </p>
                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-5 w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                    {submitting ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
        </main>
    );
}
