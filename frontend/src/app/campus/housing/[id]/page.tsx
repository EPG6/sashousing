'use client';

import Loading from '@/components/Loading';
import SiteHeader from '@/components/SiteHeader';
import { RoomCard, getRoomOccupancyType } from '@/components/housing/Rooms';
import { useAuth } from '@/hooks/useAuth';
import { Building, Room, RoomDrawStatusResponse } from '@/types';
import { backendUrl } from '@/utils/api';
import Image from 'next/image';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type RoomDrawStatusFilter = 'all' | 'not_taken' | 'taken';

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
    const [safeName, setSafeName] = useState<string>('');
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

                setBuilding(buildingData);
                setSafeName(
                    buildingData.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                );

                setRoomDrawVisible(roomDrawData.isVisible);
                setRooms(
                    roomsData.map((room: Room) => ({
                        ...room,
                        averageRating: ratingsMap[room.id]?.overallAverage || 0,
                        reviewCount: ratingsMap[room.id]?.reviewCount || 0,
                        roomDrawStatus: roomDrawData.statuses[room.id],
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
            const data = await response.json().catch(() => null);
            throw new Error(data?.message || 'Failed to update room status');
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
                                        markedByName: data.markedByName,
                                        markedByEmail: data.markedByEmail,
                                    }
                                  : undefined,
                      }
                    : currentRoom
            )
        );
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
            const aTaken = a.roomDrawStatus?.status === 'taken';
            const bTaken = b.roomDrawStatus?.status === 'taken';

            if (aTaken === bTaken) {
                return a.room_number.localeCompare(b.room_number, undefined, {
                    numeric: true,
                });
            }

            return aTaken ? 1 : -1;
        });
    }, [rooms, roomSearchQuery, roomDrawStatusFilter, roomDrawVisible]);

    const takenRoomCount = rooms.filter(
        (room) => room.roomDrawStatus?.status === 'taken'
    ).length;
    const notTakenRoomCount = rooms.length - takenRoomCount;

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
                    src={`/buildings/${safeName}.jpg`}
                    width={800}
                    height={400}
                    alt={building.name}
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
                            Not Taken rooms are shown first. Use the status
                            filters to quickly scan availability.
                        </p>
                    </div>
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

                {roomDrawVisible && (
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
                                canReportRoomDraw={roomDrawVisible}
                                canOverrideRoomDraw={!!user?.isAdmin}
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
