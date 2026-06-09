'use client';

import Loading from '@/components/Loading';
import SiteHeader from '@/components/SiteHeader';
import { RoomCard, getRoomOccupancyType } from '@/components/housing/Rooms';
import { useAuth } from '@/hooks/useAuth';
import {
    Building,
    Room,
    RoomDrawPriority,
    RoomDrawStatusResponse,
    RoomPreference,
    RoomPreferenceHolder,
} from '@/types';
import { backendUrl } from '@/utils/api';
import { getApiErrorMessage, getUserSafeMessage } from '@/utils/apiErrors';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type RoomDrawStatusFilter = 'all' | 'not_taken' | 'taken';

const toDateTimeInputValue = (value?: string | Date | null) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 16);
};

const toIsoDateValue = (value: string) =>
    value ? new Date(value).toISOString() : '';

export default function DynamicRooms() {
    const params = useParams();
    const { id } = params; // Pass building id as a parameter in the URL
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRoomSearchQuery = searchParams.get('roomSearch') || '';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buildingNotFound, setBuildingNotFound] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [building, setBuilding] = useState<Building | null>(null);
    const [roomDrawVisible, setRoomDrawVisible] = useState(false);
    const [roomDrawPriority, setRoomDrawPriority] =
        useState<RoomDrawPriority | null>(null);
    const [roomDrawRequiresPriority, setRoomDrawRequiresPriority] =
        useState(false);
    const [priorityForm, setPriorityForm] = useState({
        classYear: '',
        drawDate: '',
    });
    const [savingPriority, setSavingPriority] = useState(false);
    const [preferenceRoomIds, setPreferenceRoomIds] = useState<Set<number>>(
        new Set()
    );
    const [safeName, setSafeName] = useState<string>('');
    const [imageErrored, setImageErrored] = useState(false);
    const { user, loading: authLoading } = useAuth();
    const [showFloorPlans, setShowFloorPlans] = useState(false);
    const [roomSearchQuery, setRoomSearchQuery] = useState('');
    const [roomDrawStatusFilter, setRoomDrawStatusFilter] =
        useState<RoomDrawStatusFilter>('all');

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                setLoading(true);
                setBuildingNotFound(false);

                const buildingId = Number(id);
                if (isNaN(buildingId)) {
                    setBuildingNotFound(true);
                    setError('Invalid building ID format');
                    return;
                }

                const requests = [
                    fetch(`${backendUrl}/api/campus/housing/${buildingId}`, {
                        credentials: 'include',
                    }),
                    fetch(
                        `${backendUrl}/api/campus/housing/${buildingId}/rooms`,
                        { credentials: 'include' }
                    ),
                    fetch(
                        `${backendUrl}/api/campus/housing/${buildingId}/room-draw/statuses`,
                        { credentials: 'include' }
                    ),
                ];

                if (!authLoading && user) {
                    requests.push(
                        fetch(
                            `${backendUrl}/api/campus/housing/${buildingId}/ratings`,
                            { credentials: 'include' }
                        )
                    );
                }

                const [
                    buildingResponse,
                    roomsResponse,
                    roomDrawResponse,
                    ratingsResponse,
                ] =
                    await Promise.all(requests);

                if (!buildingResponse.ok) {
                    if (buildingResponse.status === 404) {
                        setBuildingNotFound(true);
                        setError('Building not found');
                    } else {
                        throw new Error(
                            `Failed to fetch building: ${buildingResponse.status}`
                        );
                    }
                    return;
                }

                if (!roomsResponse.ok) {
                    setError('Failed to load rooms. Please try again later.');
                }

                const [buildingData, roomsData, roomDrawData, ratingsMap] =
                    await Promise.all([
                        buildingResponse.json(),
                        roomsResponse.ok
                            ? roomsResponse.json()
                            : ([] as Room[]),
                        roomDrawResponse?.ok
                            ? roomDrawResponse.json()
                            : ({
                                  isVisible: false,
                                  statuses: {},
                              } as RoomDrawStatusResponse),
                        ratingsResponse?.ok
                            ? ratingsResponse.json()
                            : ({} as Record<
                                  number,
                                  {
                                      overallAverage: number;
                                      reviewCount: number;
                                  }
                              >),
                    ]);
                const preferencesResponse =
                    !authLoading &&
                    user &&
                    roomDrawData.isVisible &&
                    !roomDrawData.requiresPriority
                        ? await fetch(
                              `${backendUrl}/api/campus/housing/room-preferences`,
                              { credentials: 'include' }
                          )
                        : null;
                const preferenceHoldersResponse =
                    !authLoading &&
                    user &&
                    roomDrawData.isVisible &&
                    !roomDrawData.requiresPriority
                        ? await fetch(
                              `${backendUrl}/api/campus/housing/${buildingId}/room-preferences/holders`,
                              { credentials: 'include' }
                          )
                        : null;
                const preferencesData =
                    preferencesResponse?.ok
                        ? ((await preferencesResponse.json()) as RoomPreference[])
                        : [];
                const preferenceHolders =
                    preferenceHoldersResponse?.ok
                        ? ((await preferenceHoldersResponse.json()) as Record<
                              number,
                              RoomPreferenceHolder
                          >)
                        : {};

                setBuilding(buildingData);
                setSafeName(
                    buildingData.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                );
                setImageErrored(false);

                setRoomDrawVisible(roomDrawData.isVisible);
                setRoomDrawPriority(roomDrawData.priority || null);
                setRoomDrawRequiresPriority(
                    Boolean(roomDrawData.requiresPriority)
                );
                setPriorityForm({
                    classYear: roomDrawData.priority?.classYear
                        ? String(roomDrawData.priority.classYear)
                        : '',
                    drawDate: toDateTimeInputValue(
                        roomDrawData.priority?.drawDate
                    ),
                });
                setPreferenceRoomIds(
                    new Set(
                        preferencesData
                            .filter((preference) => preference.status !== 'bumped')
                            .map((preference) => preference.housing_room_id)
                    )
                );
                setRooms(
                    roomsData.map((room: Room) => ({
                        ...room,
                        averageRating: ratingsMap[room.id]?.overallAverage || 0,
                        reviewCount: ratingsMap[room.id]?.reviewCount || 0,
                        roomDrawStatus: roomDrawData.statuses[room.id],
                        roomPreferenceHolder: preferenceHolders[room.id],
                    }))
                );
            } catch (error) {
                console.error('Error fetching rooms:', error);
                setError('Failed to load rooms. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchRooms();
    }, [id, user, authLoading]);

    useEffect(() => {
        setRoomSearchQuery(initialRoomSearchQuery);
    }, [initialRoomSearchQuery]);

    const updateRoomDrawStatus = async (
        roomId: number,
        nextStatus: 'taken' | 'not_taken'
    ) => {
        const response = await fetch(
            `${backendUrl}/api/campus/housing/room-draw/rooms/${roomId}`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status: nextStatus }),
            }
        );

        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(
                    response,
                    'Failed to update room status'
                )
            );
        }

        const data = await response.json();
        setRooms((currentRooms) =>
            currentRooms.map((currentRoom) =>
                currentRoom.id === roomId
                    ? {
                          ...currentRoom,
                          roomDrawStatus:
                              data.status === 'taken'
                                  ? {
                                        status: 'taken',
                                        isOwner: data.isOwner,
                                        updatedAt: data.updatedAt,
                                        markedByUserId: data.markedByUserId,
                                        markedByName: data.markedByName,
                                        markedByEmail: data.markedByEmail,
                                    }
                                  : undefined,
                      }
                    : currentRoom
            )
        );
    };

    const saveRoomDrawPriority = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();
        setSavingPriority(true);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/room-draw/priority`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        classYear: priorityForm.classYear,
                        drawDate: toIsoDateValue(priorityForm.drawDate),
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        'Failed to save draw priority'
                    )
                );
            }

            const data = await response.json();
            setRoomDrawPriority(data.priority);
            setRoomDrawRequiresPriority(false);

            const buildingId = Number(id);
            const [statusesResponse, preferencesResponse, holdersResponse] =
                await Promise.all([
                    fetch(
                        `${backendUrl}/api/campus/housing/${buildingId}/room-draw/statuses`,
                        { credentials: 'include' }
                    ),
                    fetch(`${backendUrl}/api/campus/housing/room-preferences`, {
                        credentials: 'include',
                    }),
                    fetch(
                        `${backendUrl}/api/campus/housing/${buildingId}/room-preferences/holders`,
                        { credentials: 'include' }
                    ),
                ]);
            const statusesData = statusesResponse.ok
                ? ((await statusesResponse.json()) as RoomDrawStatusResponse)
                : null;
            const preferencesData = preferencesResponse.ok
                ? ((await preferencesResponse.json()) as RoomPreference[])
                : [];
            const holdersData = holdersResponse.ok
                ? ((await holdersResponse.json()) as Record<
                      number,
                      RoomPreferenceHolder
                  >)
                : {};

            if (statusesData) {
                setRooms((currentRooms) =>
                    currentRooms.map((room) => ({
                        ...room,
                        roomDrawStatus: statusesData.statuses[room.id],
                        roomPreferenceHolder: holdersData[room.id],
                    }))
                );
            }
            setPreferenceRoomIds(
                new Set(
                    preferencesData
                        .filter((preference) => preference.status !== 'bumped')
                        .map((preference) => preference.housing_room_id)
                )
            );
        } catch (error) {
            setError(
                getUserSafeMessage(
                    error instanceof Error ? error.message : null,
                    'Could not save draw priority.'
                )
            );
        } finally {
            setSavingPriority(false);
        }
    };

    const refreshRoomPreferences = async () => {
        const buildingId = Number(id);
        const [preferencesResponse, holdersResponse] = await Promise.all([
            fetch(`${backendUrl}/api/campus/housing/room-preferences`, {
                credentials: 'include',
            }),
            fetch(
                `${backendUrl}/api/campus/housing/${buildingId}/room-preferences/holders`,
                { credentials: 'include' }
            ),
        ]);
        const preferencesData = preferencesResponse.ok
            ? ((await preferencesResponse.json()) as RoomPreference[])
            : [];
        const holdersData = holdersResponse.ok
            ? ((await holdersResponse.json()) as Record<
                  number,
                  RoomPreferenceHolder
              >)
            : {};

        setPreferenceRoomIds(
            new Set(
                preferencesData
                    .filter((preference) => preference.status !== 'bumped')
                    .map((preference) => preference.housing_room_id)
            )
        );
        setRooms((currentRooms) =>
            currentRooms.map((room) => ({
                ...room,
                roomPreferenceHolder: holdersData[room.id],
            }))
        );
    };

    const addRoomPreference = async (roomId: number) => {
        const response = await fetch(
            `${backendUrl}/api/campus/housing/room-preferences/rooms/${roomId}`,
            {
                method: 'POST',
                credentials: 'include',
            }
        );

        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(
                    response,
                    'Failed to add room preference'
                )
            );
        }

        await refreshRoomPreferences();
    };

    const removeRoomPreference = async (roomId: number) => {
        const response = await fetch(
            `${backendUrl}/api/campus/housing/room-preferences/rooms/${roomId}`,
            {
                method: 'DELETE',
                credentials: 'include',
            }
        );

        if (!response.ok) {
            throw new Error(
                await getApiErrorMessage(
                    response,
                    'Failed to remove room preference'
                )
            );
        }

        await refreshRoomPreferences();
    };

    const displayedRooms = useMemo(() => {
        const normalizedQuery = roomSearchQuery.trim().toLowerCase();

        const filtered = rooms.filter((room) => {
            const isRoomTaken = room.roomDrawStatus?.status === 'taken';
            if (
                roomDrawVisible &&
                roomDrawStatusFilter === 'taken' &&
                !isRoomTaken
            ) {
                return false;
            }
            if (
                roomDrawVisible &&
                roomDrawStatusFilter === 'not_taken' &&
                isRoomTaken
            ) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            const roomDrawStatus = isRoomTaken ? 'taken' : 'not taken';
            const ratingStatus =
                room.reviewCount && room.reviewCount > 0
                    ? `${room.averageRating?.toFixed(1) || ''} rating ${
                          room.reviewCount
                      } reviews`
                    : 'no ratings';

            return [
                room.room_number,
                getRoomOccupancyType(room.occupancy_type),
                room.size ? `${room.size} sq ft` : '',
                roomDrawStatus,
                ratingStatus,
            ]
                .join(' ')
                .toLowerCase()
                .includes(normalizedQuery);
        });

        if (!roomDrawVisible) {
            return filtered;
        }

        return [...filtered].sort((a, b) => {
            if (!user?.isAdmin) {
                const aIsUserTakenRoom = Boolean(a.roomDrawStatus?.isOwner);
                const bIsUserTakenRoom = Boolean(b.roomDrawStatus?.isOwner);

                if (aIsUserTakenRoom !== bIsUserTakenRoom) {
                    return aIsUserTakenRoom ? -1 : 1;
                }
            }

            const aTaken = a.roomDrawStatus?.status === 'taken';
            const bTaken = b.roomDrawStatus?.status === 'taken';

            if (aTaken === bTaken) {
                return a.room_number.localeCompare(b.room_number, undefined, {
                    numeric: true,
                });
            }

            return aTaken ? 1 : -1;
        });
    }, [
        rooms,
        roomSearchQuery,
        roomDrawStatusFilter,
        roomDrawVisible,
        user?.isAdmin,
    ]);

    const takenRoomCount = rooms.filter(
        (room) => room.roomDrawStatus?.status === 'taken'
    ).length;
    const notTakenRoomCount = rooms.length - takenRoomCount;
    const currentUserTakenRoom = user?.isAdmin
        ? null
        : rooms.find((room) => room.roomDrawStatus?.isOwner) || null;

    if (loading) {
        return <Loading />;
    }

    if (buildingNotFound || !building) {
        return (
            <div className="min-h-screen bg-sas-mist text-sas-black">
                <SiteHeader />
                <div className="mx-auto flex min-h-[calc(100vh-12rem)] max-w-6xl items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-md border border-sas-line bg-sas-white p-6 text-center shadow-sm">
                        <h1 className="font-display text-3xl font-semibold text-sas-green">
                            Building Not Found
                        </h1>
                        <p className="mt-4 text-lg text-sas-black/80">
                            The building you&apos;re looking for doesn&apos;t
                            exist. Please check the URL and try again.
                        </p>
                        <p className="mt-2 text-sas-black/60">
                            Error: {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    if (error && !buildingNotFound) {
        return (
            <div className="min-h-screen bg-sas-mist text-sas-black">
                <SiteHeader />
                <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center text-sas-green">
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sas-mist text-sas-black">
            <SiteHeader />
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 inline-flex items-center rounded-md border border-sas-line bg-sas-white px-4 py-2 text-sm font-medium text-sas-black shadow-sm hover:border-sas-green hover:text-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green focus:ring-offset-2"
                >
                    Back
                </button>

                <h1 className="mb-4 font-display text-2xl font-semibold text-sas-black sm:text-4xl">
                    {building.name}
                </h1>
                <Image
                    src={
                        imageErrored
                            ? '/housing/accommodation-hero.jpg'
                            : `/buildings/${safeName}.jpg`
                    }
                    width={800}
                    height={400}
                    alt={building.name}
                    onError={() => setImageErrored(true)}
                    className="mb-6 max-h-[500px] w-full rounded-md object-cover"
                />
                <p className="mb-4 text-lg text-sas-black/75">
                    {building.description}
                </p>

                {roomDrawVisible && (
                    <div className="mb-6 rounded-md border border-sas-green bg-sas-green/10 p-4">
                        <p className="font-medium text-sas-black">
                            Room draw reporting is active.
                        </p>
                        <p className="mt-1 text-sm text-sas-black/70">
                            {roomDrawRequiresPriority
                                ? 'Enter your draw priority to view room statuses and manage your ranking.'
                                : 'Not Taken rooms are shown first. Use the status filters to quickly scan availability.'}
                        </p>
                    </div>
                )}

                {roomDrawVisible && roomDrawRequiresPriority && user && (
                    <form
                        onSubmit={saveRoomDrawPriority}
                        className="mb-8 rounded-md border border-sas-line bg-sas-white p-4 shadow-sm sm:p-6"
                    >
                        <h2 className="font-display text-xl font-semibold text-sas-black sm:text-2xl">
                            Room Draw Priority
                        </h2>
                        <p className="mt-2 text-sm text-sas-black/65">
                            Initials are not needed because your account identifies
                            you.
                        </p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <label className="block">
                                <span className="text-sm font-medium text-sas-black/75">
                                    Year
                                </span>
                                <select
                                    value={priorityForm.classYear}
                                    onChange={(event) =>
                                        setPriorityForm((current) => ({
                                            ...current,
                                            classYear: event.target.value,
                                        }))
                                    }
                                    className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                >
                                    <option value="">Select year</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                </select>
                            </label>
                            <label className="block">
                                <span className="text-sm font-medium text-sas-black/75">
                                    Draw Date
                                </span>
                                <input
                                    type="datetime-local"
                                    value={priorityForm.drawDate}
                                    onChange={(event) =>
                                        setPriorityForm((current) => ({
                                            ...current,
                                            drawDate: event.target.value,
                                        }))
                                    }
                                    className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                />
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={savingPriority}
                            className="mt-5 rounded-md bg-sas-green px-5 py-2 text-sm font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                        >
                            {savingPriority ? 'Saving...' : 'Save Priority'}
                        </button>
                    </form>
                )}

                {/* Button to toggle floor plans */}
                <button
                    onClick={() => setShowFloorPlans(!showFloorPlans)}
                    className="mb-4 rounded-md bg-sas-green px-4 py-2 font-medium text-sas-white transition-colors hover:bg-sas-black"
                >
                    {showFloorPlans ? 'Hide Floor Plans' : 'Show Floor Plans'}
                </button>

                {/* Conditionally render floor plans */}
                {showFloorPlans && (
                    <div className="mb-8">
                        <h2 className="mb-4 font-display text-xl font-semibold text-sas-green sm:text-2xl">
                            Floor Plans
                        </h2>
                        <div className="grid gap-6 pb-6 grid-cols-1 sm:grid-cols-2">
                            {Array.from({ length: building.floors }).map(
                                (_, i) => {
                                    const isLastInOddSet =
                                        building.floors % 2 !== 0 &&
                                        i === building.floors - 1;
                                    const isOnlyOne = building.floors === 1;
                                    const shouldSpanAndCenter =
                                        isLastInOddSet || isOnlyOne;
                                    return (
                                        <div
                                            key={i}
                                            className={`${
                                                shouldSpanAndCenter
                                                    ? 'sm:col-span-2 flex justify-center'
                                                    : ''
                                            }`}
                                        >
                                            <Image
                                                src={`/floorplans/${safeName}-floor${i + 1}.jpg`}
                                                width={800}
                                                height={400}
                                                alt={`Floor plan ${i + 1}`}
                                                className={`h-auto w-full rounded-md border border-sas-line shadow-sm ${
                                                    shouldSpanAndCenter
                                                        ? 'sm:max-w-2xl'
                                                        : ''
                                                }`}
                                            />
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h1 className="font-display text-2xl font-semibold text-sas-black sm:text-3xl">
                        Rooms in {building.name}
                    </h1>
                    <p className="mt-2 text-sas-black/65">
                        {building.name} has {rooms.length} room
                        {rooms.length !== 1 ? 's' : ''}
                    </p>
                    {user && roomDrawVisible && !roomDrawRequiresPriority && (
                        <Link
                            href="/campus/housing/preferences"
                            className="mt-3 inline-flex rounded-md border border-sas-green px-4 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white"
                        >
                            View My Ranking
                        </Link>
                    )}
                </div>

                <div className="mb-6 max-w-xl">
                    <label htmlFor="room-search" className="sr-only">
                        Search rooms
                    </label>
                    <input
                        id="room-search"
                        type="search"
                        value={roomSearchQuery}
                        onChange={(event) =>
                            setRoomSearchQuery(event.target.value)
                        }
                        placeholder="Search rooms by number, type, size, or status"
                        className="w-full rounded-md border border-sas-line bg-sas-white px-4 py-3 text-sas-black shadow-sm focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                    />
                    {roomSearchQuery.trim() && (
                        <p className="mt-2 text-sm text-sas-black/55">
                            Showing {displayedRooms.length} of {rooms.length}{' '}
                            rooms
                        </p>
                    )}
                </div>

                {roomDrawVisible && !roomDrawRequiresPriority && (
                    <div className="mb-6 flex flex-wrap gap-2">
                        {(
                            [
                                ['all', `All (${rooms.length})`],
                                [
                                    'not_taken',
                                    `Not Taken (${notTakenRoomCount})`,
                                ],
                                ['taken', `Taken (${takenRoomCount})`],
                            ] as const
                        ).map(([filter, label]) => {
                            const isActive = roomDrawStatusFilter === filter;

                            return (
                                <button
                                    key={filter}
                                    type="button"
                                    onClick={() =>
                                        setRoomDrawStatusFilter(filter)
                                    }
                                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                                        isActive
                                            ? 'bg-sas-green text-sas-white'
                                            : 'border border-sas-line bg-sas-white text-sas-black hover:border-sas-green hover:text-sas-green'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {rooms.length > 0 && displayedRooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedRooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                buildingName={building.name}
                                room={room}
                                canViewReviews={!!user}
                                canReportRoomDraw={
                                    roomDrawVisible &&
                                    !roomDrawRequiresPriority
                                }
                                canOverrideRoomDraw={!!user?.isAdmin}
                                canMarkRoomTaken={
                                    !currentUserTakenRoom ||
                                    currentUserTakenRoom.id === room.id
                                }
                                roomTakenDisabledMessage={
                                    currentUserTakenRoom
                                        ? `You already marked room ${currentUserTakenRoom.room_number} taken. Mark it not taken before choosing another room.`
                                        : undefined
                                }
                                canManagePreferences={
                                    !!user &&
                                    roomDrawVisible &&
                                    !roomDrawRequiresPriority
                                }
                                isInPreferenceRanking={preferenceRoomIds.has(
                                    room.id
                                )}
                                nextPreferenceRank={preferenceRoomIds.size + 1}
                                onAddPreference={addRoomPreference}
                                onRemovePreference={removeRoomPreference}
                                onRoomDrawStatusChange={updateRoomDrawStatus}
                            />
                        ))}
                    </div>
                ) : rooms.length > 0 ? (
                    <div className="rounded-md border border-sas-line bg-sas-white py-12 text-center">
                        <p className="text-lg text-sas-black/75">
                            No rooms match your search.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border border-sas-line bg-sas-white py-12 text-center">
                        <p className="text-lg text-sas-black/75">
                            No rooms found for this building.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
