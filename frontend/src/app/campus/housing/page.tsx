'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Loading from '@/components/Loading';
import { backendUrl } from '@/utils/api';
import SiteHeader from '@/components/SiteHeader';

type BuildingDoc = {
    id: number;
    name: string;
    campus: string;
    description: string;
    floors: number;
};

type BuildingCard = {
    id: number;
    name: string;
    image: string;
    description: string;
    floors: number;
};

type CampusGroup = {
    campus: string;
    buildings: BuildingCard[];
};

const HousingPage = () => {
    const [housingData, setHousingData] = useState<CampusGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHousingData = async () => {
            try {
                const response = await fetch(
                    `${backendUrl}/api/campus/housing`,
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
                    <h1 className="font-display text-4xl font-semibold text-sas-black">
                        SAS Housing Reviews
                    </h1>
                    <p className="mt-2 max-w-2xl text-sas-black/70">
                        Browse residence halls and room reviews from the student
                        community.
                    </p>
                </div>
                {housingData.map((campus, index) => (
                    <section key={index} className="mb-12">
                        <h2 className="mb-6 border-b border-sas-line pb-2 font-display text-3xl font-semibold text-sas-green">
                            {campus.campus}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {campus.buildings.map((building) => (
                                <Link
                                    key={building.id}
                                    href={`/campus/housing/${building.id}`}
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
                                        <h3 className="mb-2 font-display text-2xl font-semibold text-sas-black">
                                            {building.name}
                                        </h3>
                                        <p className="text-sm text-sas-black/70">
                                            {building.description?.slice(
                                                0,
                                                100
                                            )}
                                            ...
                                        </p>
                                        <span className="mt-4 inline-block font-medium text-sas-green hover:underline">
                                            View Details
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};

export default HousingPage;
