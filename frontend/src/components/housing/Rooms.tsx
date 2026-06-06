'use client';
import { RoomCardProps } from '@/types';
import Link from 'next/link';

export const StarRating = ({ rating }: { rating: number }) => {
    const totalStars = 5;
    const fullStars = Math.floor(rating);

    return (
        <div className="flex">
            {[...Array(totalStars)].map((_, i) => (
                <span key={i} className="text-xl">
                    {i < fullStars ? (
                        <span className="text-sas-green">★</span>
                    ) : (
                        <span className="text-sas-line">★</span>
                    )}
                </span>
            ))}
        </div>
    );
};

export const getRoomOccupancyType = (occupancy_type: number | undefined) => {
    if (occupancy_type) {
        switch (occupancy_type) {
            case 1:
                return 'Single';
            case 2:
                return 'Double';
            case 3:
                return 'Triple';
            default:
                return occupancy_type;
        }
    } else {
        return 'Unknown';
    }
};

export const RoomCard = ({
    buildingName,
    room,
    canViewReviews = true,
}: RoomCardProps) => {
    return (
        <div className="w-full rounded-md border border-sas-line bg-sas-white p-4 shadow-sm transition-shadow hover:border-sas-green hover:shadow-md">
            <div className="mb-6">
                <h2 className="font-display text-xl font-semibold text-sas-black">
                    Room {room.room_number}
                </h2>
                <p className="text-sm text-sas-black/55">{buildingName}</p>
            </div>

            {canViewReviews ? (
                <div className="mb-4 flex items-center">
                    <span className="mr-2 text-sas-black/65">Rating:</span>
                    {room.reviewCount && room.reviewCount > 0 ? (
                        <div className="flex items-center">
                            <StarRating rating={room.averageRating || 0} />
                            <span className="ml-2 text-sas-black/55">
                                ({room.reviewCount})
                            </span>
                        </div>
                    ) : (
                        <span className="text-sas-black/55">
                            No ratings yet
                        </span>
                    )}
                </div>
            ) : (
                <p className="mb-4 text-sm text-sas-black/55">
                    Sign in to view reviews and ratings.
                </p>
            )}

            <div className="mb-6">
                <p className="text-lg text-sas-black/75">
                    {getRoomOccupancyType(room.occupancy_type)}
                </p>
                {room.size && (
                    <p className="text-lg text-sas-black/75">
                        Size: {room.size} sq. ft.
                    </p>
                )}
            </div>

            <Link
                href={`/campus/housing/${room.housing_building_id}/${room.room_number}`}
                prefetch={false}
            >
                <button className="rounded-md border border-sas-green px-6 py-2 font-medium text-sas-green transition-colors hover:bg-sas-green hover:text-sas-white">
                    {canViewReviews ? 'View Reviews' : 'Sign in to View Reviews'}
                </button>
            </Link>
        </div>
    );
};
