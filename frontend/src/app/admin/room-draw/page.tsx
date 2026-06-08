'use client';

import Loading from '@/components/Loading';
import LoginRequired from '@/components/LoginRequired';
import SiteHeader from '@/components/SiteHeader';
import AdminTabs from '@/components/admin/AdminTabs';
import { useAuth } from '@/hooks/useAuth';
import { RoomDrawSettings } from '@/types';
import { backendUrl } from '@/utils/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const toDateTimeLocalValue = (value: string | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
};

const toIsoValue = (value: string) =>
    value ? new Date(value).toISOString() : null;

export default function RoomDrawAdminPage() {
    const { user, loading: authLoading } = useAuth();
    const [settings, setSettings] = useState<RoomDrawSettings | null>(null);
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [ending, setEnding] = useState(false);
    const [closing, setClosing] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const controlsDisabled = saving || clearing || ending || closing;

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch(
                    `${backendUrl}/api/campus/housing/room-draw/settings`,
                    {
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to load room draw settings');
                }

                const data = (await response.json()) as RoomDrawSettings;
                setSettings(data);
                setStartsAt(toDateTimeLocalValue(data.startsAt));
                setEndsAt(toDateTimeLocalValue(data.endsAt));
            } catch (error) {
                console.error('Room draw settings error:', error);
                setError('Could not load room draw settings.');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const saveSettings = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/room-draw/settings`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        startsAt: toIsoValue(startsAt),
                        endsAt: toIsoValue(endsAt),
                    }),
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to save settings');
            }

            setSettings(data);
            setStartsAt(toDateTimeLocalValue(data.startsAt));
            setEndsAt(toDateTimeLocalValue(data.endsAt));
            setMessage('Room draw window saved.');
        } catch (error) {
            console.error('Room draw save error:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not save room draw settings.'
            );
        } finally {
            setSaving(false);
        }
    };

    const clearStatuses = async () => {
        if (
            !window.confirm(
                'Clear every room draw status? This will make all rooms Not Taken.'
            )
        ) {
            return;
        }

        setClearing(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/room-draw/clear-statuses`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to clear statuses');
            }

            setMessage(
                `Room draw statuses cleared. ${data.deletedCount || 0} status${
                    data.deletedCount === 1 ? '' : 'es'
                } removed.`
            );
        } catch (error) {
            console.error('Room draw clear error:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not clear room draw statuses.'
            );
        } finally {
            setClearing(false);
        }
    };

    const closeRoomDraw = async () => {
        if (
            !window.confirm(
                'Close room draw now and clear every room status? This cannot be undone.'
            )
        ) {
            return;
        }

        setClosing(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/room-draw/close`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to close room draw');
            }

            setSettings(data);
            setStartsAt(toDateTimeLocalValue(data.startsAt));
            setEndsAt(toDateTimeLocalValue(data.endsAt));
            setMessage(
                `Room draw closed. ${data.deletedCount || 0} status${
                    data.deletedCount === 1 ? '' : 'es'
                } removed.`
            );
        } catch (error) {
            console.error('Room draw close error:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not close room draw.'
            );
        } finally {
            setClosing(false);
        }
    };

    const endRoomDraw = async () => {
        if (
            !window.confirm(
                'End the room draw period now? Existing room statuses will be kept.'
            )
        ) {
            return;
        }

        setEnding(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/room-draw/end`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to end room draw');
            }

            setSettings(data);
            setStartsAt(toDateTimeLocalValue(data.startsAt));
            setEndsAt(toDateTimeLocalValue(data.endsAt));
            setMessage('Room draw period ended. Existing statuses were kept.');
        } catch (error) {
            console.error('Room draw end error:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not end room draw.'
            );
        } finally {
            setEnding(false);
        }
    };

    if (authLoading || loading) {
        return <Loading />;
    }

    if (!user) {
        return <LoginRequired />;
    }

    if (!user.isAdmin) {
        return (
            <div className="min-h-screen bg-sas-mist text-sas-black">
                <SiteHeader />
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-md border border-sas-line bg-sas-white p-6 text-center shadow-sm">
                        <h1 className="font-display text-2xl font-semibold text-sas-green sm:text-3xl">
                            Admin Access Required
                        </h1>
                        <p className="mt-3 text-sas-black/65">
                            You need admin permissions to manage room draw.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sas-mist text-sas-black">
            <SiteHeader />
            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
                <Link
                    href="/campus/housing"
                    className="mb-6 inline-flex items-center rounded-md border border-sas-line bg-sas-white px-4 py-2 text-sm font-medium text-sas-black shadow-sm hover:border-sas-green hover:text-sas-green"
                >
                    Back to Housing
                </Link>

                <AdminTabs activeTab="room-draw" />

                <div className="mb-8 border-b border-sas-line pb-5">
                    <h1 className="font-display text-2xl font-semibold text-sas-black sm:text-4xl">
                        Room Draw Reporting
                    </h1>
                    <p className="mt-2 text-sas-black/70">
                        Set the window when students can report rooms as taken.
                    </p>
                </div>

                <form
                    onSubmit={saveSettings}
                    className="rounded-md border border-sas-line bg-sas-white p-4 shadow-sm sm:p-6"
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                            <span className="text-sm font-medium text-sas-black/75">
                                Starts
                            </span>
                            <input
                                type="datetime-local"
                                value={startsAt}
                                onChange={(event) =>
                                    setStartsAt(event.target.value)
                                }
                                className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-sas-black/75">
                                Ends
                            </span>
                            <input
                                type="datetime-local"
                                value={endsAt}
                                onChange={(event) =>
                                    setEndsAt(event.target.value)
                                }
                                className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                            />
                        </label>
                    </div>

                    <div className="mt-5 rounded-md border border-sas-line bg-sas-mist p-4">
                        <p className="text-sm font-medium text-sas-black">
                            Current Visibility
                        </p>
                        <p
                            className={`mt-1 text-sm ${
                                settings?.isVisible
                                    ? 'text-sas-green'
                                    : 'text-sas-black/60'
                            }`}
                        >
                            {settings?.isVisible
                                ? 'Visible to users now'
                                : 'Hidden from users now'}
                        </p>
                    </div>

                    {message && (
                        <p className="mt-4 text-sm text-sas-green">
                            {message}
                        </p>
                    )}
                    {error && (
                        <p className="mt-4 text-sm text-red-700">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={controlsDisabled}
                        className="mt-6 w-full rounded-md bg-sas-green px-5 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60 sm:w-auto"
                    >
                        {saving ? 'Saving...' : 'Save Window'}
                    </button>
                </form>

                <div className="mt-6 rounded-md border border-sas-line bg-sas-white p-4 shadow-sm sm:p-6">
                    <h2 className="font-display text-xl font-semibold text-sas-black sm:text-2xl">
                        Status Controls
                    </h2>
                    <p className="mt-2 text-sm text-sas-black/65">
                        Reset room draw statuses without changing reviews or
                        room data.
                    </p>
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                        <button
                            type="button"
                            onClick={clearStatuses}
                            disabled={controlsDisabled}
                            className="w-full rounded-md border border-sas-green px-4 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60 sm:w-auto"
                        >
                            {clearing ? 'Clearing...' : 'Clear All Statuses'}
                        </button>
                        <button
                            type="button"
                            onClick={endRoomDraw}
                            disabled={controlsDisabled}
                            className="w-full rounded-md border border-sas-line px-4 py-2 font-medium text-sas-black hover:border-sas-green hover:text-sas-green disabled:opacity-60 sm:w-auto"
                        >
                            {ending ? 'Ending...' : 'End Period Only'}
                        </button>
                        <button
                            type="button"
                            onClick={closeRoomDraw}
                            disabled={controlsDisabled}
                            className="w-full rounded-md bg-sas-black px-4 py-2 font-medium text-sas-white hover:bg-sas-green disabled:opacity-60 sm:w-auto"
                        >
                            {closing
                                ? 'Closing...'
                                : 'Close Room Draw and Clear'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
