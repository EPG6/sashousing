'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Loading from '@/components/Loading';
import { backendUrl } from '@/utils/api';
import SiteHeader from '@/components/SiteHeader';

type BuildingDoc = {
    id: number;
    name: string;
    campus: string;
    description: string;
    floors: number;
    roomNumbers: string[];
};

type BuildingCard = {
    id: number;
    name: string;
    image: string;
    description: string;
    floors: number;
    roomNumbers: string[];
};

type CampusGroup = {
    campus: string;
    buildings: BuildingCard[];
};

const HousingPage = () => {
    const [housingData, setHousingData] = useState<CampusGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    useEffect(() => {
        const fetchHousingData = async () => {
            try {
                const response = await fetch(
                    `${backendUrl}/api/campus/housing/search-index`,
                    {
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch housing data');
                }

                const buildings = (await response.json()) as BuildingDoc[];

                // Organize buildings by campus
                const organizedData: CampusGroup[] = buildings.reduce(
                    (acc, building) => {
                        const campusName =
                            building.campus.charAt(0).toUpperCase() +
                            building.campus.slice(1) +
                            ' Campus';

                        const buildingCard: BuildingCard = {
                            id: building.id,
                            name: building.name,
                            image: `/buildings/${building.name
                                .toLowerCase()
                                .replace(/\s+/g, '-')
                                .replace(/-+/g, '-')}.jpg`,
                            description: building.description,
                            floors: building.floors,
                            roomNumbers: building.roomNumbers || [],
                        };

                        const existingCampus = acc.find(
                            (c) => c.campus === campusName
                        );
                        if (existingCampus) {
                            existingCampus.buildings.push(buildingCard);
                        } else {
                            acc.push({
                                campus: campusName,
                                buildings: [buildingCard],
                            });
                        }

                        return acc;
                    },
                    [] as CampusGroup[]
                );

                setHousingData(organizedData);
            } catch (err) {
                console.error('Error fetching housing data:', err);
                setError(
                    'Could not load housing information. Please try again later.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchHousingData();
    }, []);

    const filteredHousingData = useMemo(() => {
        const normalizedQuery = normalizedSearchQuery;

        if (!normalizedQuery) {
            return housingData;
        }

        return housingData
            .map((campus) => ({
                ...campus,
                buildings: campus.buildings.filter((building) => {
                    const searchText = [
                        campus.campus,
                        building.name,
                        building.description,
                        `${building.floors} floors`,
                        ...building.roomNumbers.map(
                            (roomNumber) => `room ${roomNumber}`
                        ),
                    ]
                        .join(' ')
                        .toLowerCase();

                    return searchText.includes(normalizedQuery);
                }),
            }))
            .filter((campus) => campus.buildings.length > 0);
    }, [housingData, normalizedSearchQuery]);

    if (loading) {
        return <Loading />;
    }

    if (error) {
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
                <div className="mb-10 border-b border-sas-line pb-5">
                    <h1 className="font-display text-2xl font-semibold text-sas-black sm:text-4xl">
                        SAS Housing Reviews
                    </h1>
                    <p className="mt-2 max-w-2xl text-sas-black/70">
                        Browse residence halls and room reviews from the student
                        community.
                    </p>
                </div>

                <div className="mb-8 max-w-xl">
                    <label htmlFor="housing-search" className="sr-only">
                        Search buildings
                    </label>
                    <input
                        id="housing-search"
                        type="search"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search buildings, rooms, campuses, or descriptions"
                        className="w-full rounded-md border border-sas-line bg-sas-white px-4 py-3 text-sas-black shadow-sm focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                    />
                </div>

                {filteredHousingData.map((campus, index) => (
                    <section key={index} className="mb-12">
                        <h2 className="mb-6 border-b border-sas-line pb-2 font-display text-xl font-semibold text-sas-green sm:text-3xl">
                            {campus.campus}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {campus.buildings.map((building) => (
                                <Link
                                    key={building.id}
                                    href={{
                                        pathname: `/campus/housing/${building.id}`,
                                        query: searchQuery.trim()
                                            ? {
                                                  roomSearch:
                                                      searchQuery.trim(),
                                              }
                                            : {},
                                    }}
                                    className="block overflow-hidden rounded-md border border-sas-line bg-sas-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:border-sas-green"
                                >
                                    <Image
                                        src={building.image}
                                        alt={building.name}
                                        width={800}
                                        height={400}
                                        className="w-full h-48 object-cover"
                                    />
                                    <div className="p-6">
                                        <h3 className="mb-2 font-display text-xl font-semibold text-sas-black sm:text-2xl">
                                            {building.name}
                                        </h3>
                                        <p className="text-sm text-sas-black/70">
                                            {building.description?.slice(
                                                0,
                                                100
                                            )}
                                            ...
                                        </p>
                                        {normalizedSearchQuery &&
                                            building.roomNumbers.some(
                                                (roomNumber) =>
                                                    roomNumber
                                                        .toLowerCase()
                                                        .includes(
                                                            normalizedSearchQuery
                                                        )
                                            ) && (
                                                <p className="mt-3 text-sm text-sas-green">
                                                    Matching rooms:{' '}
                                                    {building.roomNumbers
                                                        .filter((roomNumber) =>
                                                            roomNumber
                                                                .toLowerCase()
                                                                .includes(
                                                                    normalizedSearchQuery
                                                                )
                                                        )
                                                        .slice(0, 5)
                                                        .join(', ')}
                                                </p>
                                            )}
                                        <span className="mt-4 inline-block font-medium text-sas-green hover:underline">
                                            View Details
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
                {filteredHousingData.length === 0 && (
                    <div className="rounded-md border border-sas-line bg-sas-white py-12 text-center">
                        <p className="text-lg text-sas-black/75">
                            No buildings match your search.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HousingPage;
