'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types';
import { backendUrl } from '@/utils/api';

type AuthState = {
    user: User | null;
    loading: boolean;
};

let authState: AuthState = {
    user: null,
    loading: true,
};
let authPromise: Promise<void> | null = null;
const subscribers = new Set<(state: AuthState) => void>();

const notifySubscribers = () => {
    subscribers.forEach((subscriber) => subscriber(authState));
};

const loadAuth = () => {
    if (authPromise) {
        return authPromise;
    }

    authPromise = fetch(`${backendUrl}/api/auth/current_user`, {
        credentials: 'include',
    })
        .then(async (response) => {
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
        void loadAuth();

        return () => {
            subscribers.delete(subscriber);
        };
    }, []);

    return user;
}
