'use client';

import Loading from '@/components/Loading';
import SiteHeader from '@/components/SiteHeader';
import { RoomCard } from '@/components/housing/Rooms';
import { useAuth } from '@/hooks/useAuth';
import { Building, Room } from '@/types';
import { backendUrl } from '@/utils/api';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DynamicRooms() {
    const params = useParams();
    const { id } = params; // Pass building id as a parameter in the URL
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [buildingNotFound, setBuildingNotFound] = useState(false);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [building, setBuilding] = useState<Building | null>(null);
    const [safeName, setSafeName] = useState<string>('');
    const { user, loading: authLoading } = useAuth();
    const [showFloorPlans, setShowFloorPlans] = useState(false);

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
                ];

                if (!authLoading && user) {
                    requests.push(
                        fetch(
                            `${backendUrl}/api/campus/housing/${buildingId}/ratings`,
                            { credentials: 'include' }
                        )
                    );
                }

                const [buildingResponse, roomsResponse, ratingsResponse] =
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

                const [buildingData, roomsData, ratingsMap] = await Promise.all(
                    [
                        buildingResponse.json(),
                        roomsResponse.ok
                            ? roomsResponse.json()
                            : ([] as Room[]),
                        ratingsResponse?.ok
                            ? ratingsResponse.json()
                            : ({} as Record<
                                  number,
                                  {
                                      overallAverage: number;
                                      reviewCount: number;
                                  }
                              >),
                    ]
                );

                setBuilding(buildingData);
                setSafeName(
                    buildingData.name
                        .toLowerCase()
                        .replace(/\s+/g, '-')
                        .replace(/-+/g, '-')
                );

                setRooms(
                    roomsData.map((room: Room) => ({
                        ...room,
                        averageRating: ratingsMap[room.id]?.overallAverage || 0,
                        reviewCount: ratingsMap[room.id]?.reviewCount || 0,
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

                <h1 className="mb-4 font-display text-4xl font-semibold text-sas-black">
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
                        <h2 className="mb-4 font-display text-2xl font-semibold text-sas-green">
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
                    <h1 className="font-display text-3xl font-semibold text-sas-black">
                        Rooms in {building.name}
                    </h1>
                    <p className="mt-2 text-sas-black/65">
                        {building.name} has {rooms.length} room
                        {rooms.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {rooms.map((room) => (
                            <RoomCard
                                key={room.id}
                                buildingName={building.name}
                                room={room}
                                canViewReviews={!!user}
                            />
                        ))}
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
