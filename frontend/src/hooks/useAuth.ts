'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';
import { backendUrl } from '@/utils/api';

type AuthState = {
    user: User | null;
    loading: boolean;
};

const SESSION_HINT_KEY = 'sas:hasSession';
const SESSION_HINT_COOKIE = 'sas_has_session=true';

let authState: AuthState = {
    user: null,
    loading: true,
};
let authPromise: Promise<void> | null = null;
const subscribers = new Set<(state: AuthState) => void>();

const notifySubscribers = () => {
    subscribers.forEach((subscriber) => subscriber(authState));
};

export const hasSessionHint = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    return (
        window.localStorage.getItem(SESSION_HINT_KEY) === 'true' ||
        document.cookie.includes(SESSION_HINT_COOKIE)
    );
};

export const setSessionHint = (hasSession: boolean) => {
    if (typeof window === 'undefined') {
        return;
    }

    if (hasSession) {
        window.localStorage.setItem(SESSION_HINT_KEY, 'true');
        document.cookie = 'sas_has_session=true; path=/; max-age=86400; SameSite=Lax';
        return;
    }

    window.localStorage.removeItem(SESSION_HINT_KEY);
    document.cookie = 'sas_has_session=; path=/; max-age=0; SameSite=Lax';
};

const loadAuth = () => {
    if (authPromise) {
        return authPromise;
    }

    authPromise = fetch(`${backendUrl}/api/auth/current_user`, {
        credentials: 'include',
    })
        .then(async (response) => {
            if (!response.ok) {
                setSessionHint(false);
            }
            if (response.ok) {
                setSessionHint(true);
            }

            authState = {
                user: response.ok ? (await response.json()).user : null,
                loading: false,
            };
        })
        .catch((error) => {
            console.error('Auth check error:', error);
            authState = {
                user: null,
                loading: false,
            };
            setSessionHint(false);
        })
        .finally(() => {
            notifySubscribers();
        });

    return authPromise;
};

export function useAuth() {
    const [state, setState] = useState<AuthState>(authState);

    useEffect(() => {
        subscribers.add(setState);
        setState(authState);
        void loadAuth();

        return () => {
            subscribers.delete(setState);
        };
    }, []);

    return state;
}

export function useCurrentUser() {
    const [user, setUser] = useState<User | null>(authState.user);

    useEffect(() => {
        const subscriber = (state: AuthState) => {
            setUser((currentUser) =>
                currentUser === state.user ? currentUser : state.user
            );
        };

        subscribers.add(subscriber);
        setUser((currentUser) =>
            currentUser === authState.user ? currentUser : authState.user
        );
        if (hasSessionHint()) {
            void loadAuth();
        }

        return () => {
            subscribers.delete(subscriber);
        };
    }, []);

    return user;
}
