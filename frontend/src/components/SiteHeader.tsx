'use client';

import { useAuth } from '@/hooks/useAuth';
import { backendUrl } from '@/utils/api';
import { getFirebaseAuth } from '@/utils/firebase';
import {
    completeRedirectSignIn,
    signInWithGoogleSession,
} from '@/utils/googleSignIn';
import { signOut } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SiteHeader() {
    const { user, loading } = useAuth();
    const [loggingIn, setLoggingIn] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        let cancelled = false;

        completeRedirectSignIn()
            .then((signedIn) => {
                if (signedIn && !cancelled) {
                    window.location.reload();
                }
            })
            .catch((error) => {
                console.error('Redirect login failed:', error);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const login = async () => {
        setLoggingIn(true);

        try {
            const signedIn = await signInWithGoogleSession();
            if (signedIn) {
                window.location.reload();
            }
        } catch (error) {
            console.error('Login failed:', error);
        } finally {
            setLoggingIn(false);
        }
    };

    const logout = async () => {
        setLoggingOut(true);

        try {
            await signOut(getFirebaseAuth());
            await fetch(`${backendUrl}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
            window.location.href = '/campus/housing';
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <header className="border-b border-sas-line bg-sas-white">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                <Link
                    href="/campus/housing"
                    className="flex min-w-0 items-center gap-2 text-sas-black sm:gap-3"
                >
                    <Image
                        src="/logos/saslogo.png"
                        alt="SAS"
                        width={56}
                        height={54}
                        priority
                        className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
                    />
                    <span className="truncate font-display text-lg font-semibold leading-none sm:text-2xl">
                        Housing Platform
                    </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <span className="hidden text-sm uppercase text-sas-green sm:inline">
                        Scripps Associated Students
                    </span>
                    {!loading && user?.isAdmin && (
                        <Link
                            href="/admin/housing-data"
                            className="rounded-md border border-sas-line px-3 py-2 text-sm font-medium text-sas-black hover:border-sas-green hover:text-sas-green"
                        >
                            Dashboard
                        </Link>
                    )}
                    {!loading &&
                        (user ? (
                            <button
                                type="button"
                                onClick={logout}
                                disabled={loggingOut}
                                className="rounded-md border border-sas-green px-3 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60"
                            >
                                {loggingOut ? (
                                    '...'
                                ) : (
                                    <>
                                        <span className="sm:hidden">Out</span>
                                        <span className="hidden sm:inline">
                                            Sign out
                                        </span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={login}
                                disabled={loggingIn}
                                className="inline-flex items-center gap-2 rounded-md bg-sas-green px-3 py-2 text-sm font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                            >
                                <Image
                                    src="/google-sign.svg"
                                    alt=""
                                    width={18}
                                    height={18}
                                    className="h-[18px] w-[18px]"
                                />
                                {loggingIn ? (
                                    '...'
                                ) : (
                                    <>
                                        <span className="sm:hidden">Sign in</span>
                                        <span className="hidden sm:inline">
                                            Google Sign In
                                        </span>
                                    </>
                                )}
                            </button>
                        ))}
                </div>
            </div>
        </header>
    );
}
