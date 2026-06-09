'use client';

import Loading from '@/components/Loading';
import LoginRequired from '@/components/LoginRequired';
import SiteHeader from '@/components/SiteHeader';
import { getRoomOccupancyType } from '@/components/housing/Rooms';
import { useAuth } from '@/hooks/useAuth';
import { RoomDrawSettings, RoomPreference } from '@/types';
import { backendUrl } from '@/utils/api';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function RoomPreferencesPage() {
    const { user, loading: authLoading } = useAuth();
    const [preferences, setPreferences] = useState<RoomPreference[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [roomDrawVisible, setRoomDrawVisible] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            setLoading(false);
            return;
        }

        const fetchPreferences = async () => {
            try {
                const settingsResponse = await fetch(
                    `${backendUrl}/api/campus/housing/room-draw/settings`,
                    { credentials: 'include' }
                );
                const settings = settingsResponse.ok
                    ? ((await settingsResponse.json()) as RoomDrawSettings)
                    : null;
                const isRoomDrawVisible = Boolean(settings?.isVisible);
                setRoomDrawVisible(isRoomDrawVisible);
                if (!isRoomDrawVisible) {
                    return;
                }

                const response = await fetch(
                    `${backendUrl}/api/campus/housing/room-preferences`,
                    { credentials: 'include' }
                );

                if (!response.ok) {
                    throw new Error('Failed to load room preferences');
                }

                setPreferences(await response.json());
            } catch (error) {
                console.error('Room preference load error:', error);
                setError('Could not load your room ranking.');
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, [authLoading, user]);

    const movePreference = (index: number, direction: -1 | 1) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= preferences.length) {
            return;
        }

        setPreferences((currentPreferences) => {
            const nextPreferences = [...currentPreferences];
            [nextPreferences[index], nextPreferences[nextIndex]] = [
                nextPreferences[nextIndex],
                nextPreferences[index],
            ];
            return nextPreferences.map((preference, preferenceIndex) => ({
                ...preference,
                rank: preferenceIndex + 1,
            }));
        });
        setMessage(null);
    };

    const updateNotes = (index: number, notes: string) => {
        setPreferences((currentPreferences) =>
            currentPreferences.map((preference, preferenceIndex) =>
                preferenceIndex === index ? { ...preference, notes } : preference
            )
        );
        setMessage(null);
    };

    const removePreference = (index: number) => {
        setPreferences((currentPreferences) =>
            currentPreferences
                .filter((_, preferenceIndex) => preferenceIndex !== index)
                .map((preference, preferenceIndex) => ({
                    ...preference,
                    rank: preferenceIndex + 1,
                }))
        );
        setMessage(null);
    };

    const savePreferences = async () => {
        setSaving(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/room-preferences`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        items: preferences.map((preference) => ({
                            housing_room_id: preference.housing_room_id,
                            notes: preference.notes || '',
                        })),
                    }),
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to save room ranking');
            }

            setMessage('Room ranking saved.');
        } catch (error) {
            console.error('Room preference save error:', error);
            setError(
                error instanceof Error
                    ? error.message
                    : 'Could not save your room ranking.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading) {
        return <Loading />;
    }

    if (!user) {
        return <LoginRequired />;
    }

    return (
        <div className="min-h-screen bg-sas-mist text-sas-black">
            <SiteHeader />
            <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
                <Link
                    href="/campus/housing"
                    className="mb-6 inline-flex rounded-md border border-sas-line bg-sas-white px-4 py-2 text-sm font-medium text-sas-black shadow-sm hover:border-sas-green hover:text-sas-green"
                >
                    Back to Housing
                </Link>

                <div className="mb-8 border-b border-sas-line pb-5">
                    <h1 className="font-display text-2xl font-semibold text-sas-black sm:text-4xl">
                        My Room Ranking
                    </h1>
                    <p className="mt-2 max-w-2xl text-sas-black/70">
                        Arrange rooms in preference order for room draw planning.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-800">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="mb-5 rounded-md border border-sas-green/30 bg-sas-green/10 px-4 py-3 text-sas-green">
                        {message}
                    </div>
                )}

                {!roomDrawVisible ? (
                    <div className="rounded-md border border-sas-line bg-sas-white py-12 text-center">
                        <p className="text-lg text-sas-black/75">
                            Room ranking is available during room draw.
                        </p>
                    </div>
                ) : preferences.length === 0 ? (
                    <div className="rounded-md border border-sas-line bg-sas-white py-12 text-center">
                        <p className="text-lg text-sas-black/75">
                            No rooms ranked yet.
                        </p>
                        <Link
                            href="/campus/housing"
                            className="mt-4 inline-flex rounded-md bg-sas-green px-4 py-2 text-sm font-medium text-sas-white hover:bg-sas-black"
                        >
                            Browse Rooms
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-sas-line rounded-md border border-sas-line bg-sas-white">
                            {preferences.map((preference, index) => (
                                <div
                                    key={preference.housing_room_id}
                                    className="grid gap-4 p-4 sm:grid-cols-[4rem_1fr_auto]"
                                >
                                    <div className="font-display text-2xl font-semibold text-sas-green">
                                        #{index + 1}
                                    </div>
                                    <div>
                                        <h2 className="font-display text-xl font-semibold text-sas-black">
                                            {preference.building?.name ||
                                                'Unknown Building'}{' '}
                                            {preference.room?.room_number ||
                                                'Unknown Room'}
                                        </h2>
                                        <p className="mt-1 text-sm text-sas-black/65">
                                            {getRoomOccupancyType(
                                                preference.room?.occupancy_type
                                            )}
                                        </p>
                                        <label
                                            htmlFor={`preference-notes-${preference.housing_room_id}`}
                                            className="mt-3 block text-sm font-medium text-sas-black/75"
                                        >
                                            Notes
                                        </label>
                                        <textarea
                                            id={`preference-notes-${preference.housing_room_id}`}
                                            value={preference.notes || ''}
                                            onChange={(event) =>
                                                updateNotes(
                                                    index,
                                                    event.target.value
                                                )
                                            }
                                            rows={2}
                                            className="mt-1 w-full rounded-md border border-sas-line px-3 py-2 text-sm focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                        />
                                    </div>
                                    <div className="flex flex-wrap items-start gap-2 sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                movePreference(index, -1)
                                            }
                                            disabled={index === 0}
                                            className="rounded-md border border-sas-line px-3 py-2 text-sm font-medium text-sas-black hover:border-sas-green hover:text-sas-green disabled:opacity-40"
                                        >
                                            Up
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                movePreference(index, 1)
                                            }
                                            disabled={
                                                index === preferences.length - 1
                                            }
                                            className="rounded-md border border-sas-line px-3 py-2 text-sm font-medium text-sas-black hover:border-sas-green hover:text-sas-green disabled:opacity-40"
                                        >
                                            Down
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removePreference(index)
                                            }
                                            className="rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={savePreferences}
                                disabled={saving}
                                className="rounded-md bg-sas-green px-5 py-2 text-sm font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                            >
                                {saving ? 'Saving...' : 'Save Ranking'}
                            </button>
                            <Link
                                href="/campus/housing"
                                className="rounded-md border border-sas-green px-5 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white"
                            >
                                Add More Rooms
                            </Link>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
