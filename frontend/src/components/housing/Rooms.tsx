'use client';
import { RoomCardProps } from '@/types';
import { getUserSafeMessage } from '@/utils/apiErrors';
import Link from 'next/link';
import { useState } from 'react';

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
            case 4:
                return 'Suite';
            case 5:
                return 'Apartment';
            default:
                return occupancy_type;
        }
    } else {
        return 'Unknown';
    }
};

const formatBooleanFeature = (label: string, value: boolean | undefined) => {
    if (value === undefined) {
        return null;
    }

    return `${label}: ${value ? 'Yes' : 'No'}`;
};

export const RoomCard = ({
    buildingName,
    room,
    canViewReviews = true,
    canReportRoomDraw = false,
    canOverrideRoomDraw = false,
    canMarkRoomTaken = true,
    roomTakenDisabledMessage,
    canManagePreferences = false,
    isInPreferenceRanking = false,
    onAddPreference,
    onRemovePreference,
    onRoomDrawStatusChange,
}: RoomCardProps) => {
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingPreference, setUpdatingPreference] = useState(false);
    const [preferenceMessage, setPreferenceMessage] = useState<string | null>(
        null
    );
    const [actionError, setActionError] = useState<string | null>(null);
    const isTaken = room.roomDrawStatus?.status === 'taken';
    const canChangeTakenStatus =
        !isTaken || room.roomDrawStatus?.isOwner || canOverrideRoomDraw;
    const markedBy =
        room.roomDrawStatus?.markedByName ||
        room.roomDrawStatus?.markedByEmail ||
        'Unknown';
    const markedAt = room.roomDrawStatus?.updatedAt
        ? new Date(room.roomDrawStatus.updatedAt).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : null;
    const preferenceHolder = room.roomPreferenceHolder;
    const preferenceHolderDrawTime = preferenceHolder?.drawDate
        ? new Date(preferenceHolder.drawDate).toLocaleString(undefined, {
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : null;
    const preferenceHolderLabel = preferenceHolder
        ? [
              preferenceHolder.initials,
              preferenceHolder.classYear
                  ? `Year ${preferenceHolder.classYear}`
                  : null,
              preferenceHolderDrawTime,
          ]
              .filter(Boolean)
              .join(' - ')
        : null;
    const roomDrawCardClasses = canReportRoomDraw
        ? isTaken
            ? 'border-red-300 bg-red-50/70'
            : 'border-sas-green bg-sas-green/5'
        : 'border-sas-line bg-sas-white';
    const roomDrawBadgeClasses = isTaken
        ? 'border-red-200 bg-red-100 text-red-800'
        : 'border-sas-green/30 bg-sas-green text-sas-white';

    const changeRoomDrawStatus = async (nextStatus: 'taken' | 'not_taken') => {
        if (!onRoomDrawStatusChange) {
            return;
        }

        try {
            setUpdatingStatus(true);
            setActionError(null);
            await onRoomDrawStatusChange(room.id, nextStatus);
        } catch (error) {
            setActionError(
                getUserSafeMessage(
                    error instanceof Error ? error.message : null,
                    'Failed to update room status'
                )
            );
        } finally {
            setUpdatingStatus(false);
        }
    };

    const togglePreference = async () => {
        const handler = isInPreferenceRanking
            ? onRemovePreference
            : onAddPreference;
        if (!handler) {
            return;
        }

        try {
            setUpdatingPreference(true);
            setPreferenceMessage(null);
            setActionError(null);
            await handler(room.id);
            setPreferenceMessage(
                isInPreferenceRanking
                    ? 'Removed from ranking'
                    : 'Added to ranking'
            );
        } catch (error) {
            setActionError(
                getUserSafeMessage(
                    error instanceof Error ? error.message : null,
                    'Failed to update room preference'
                )
            );
        } finally {
            setUpdatingPreference(false);
        }
    };

    return (
        <div
            className={`w-full rounded-md border p-4 shadow-sm transition-shadow hover:border-sas-green hover:shadow-md ${roomDrawCardClasses}`}
        >
            <div className="mb-6">
                <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-xl font-semibold text-sas-black">
                        Room {room.room_number}
                    </h2>
                    {canReportRoomDraw && (
                        <span
                            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${roomDrawBadgeClasses}`}
                        >
                            {isTaken ? 'Taken' : 'Not Taken'}
                        </span>
                    )}
                </div>
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
                <div className="mt-3 flex flex-wrap gap-2 text-sm text-sas-black/65">
                    {room.floor && (
                        <span className="rounded-md bg-sas-mist px-2 py-1">
                            Floor {room.floor}
                        </span>
                    )}
                    {room.eligibleYear && (
                        <span className="rounded-md bg-sas-mist px-2 py-1">
                            Year {room.eligibleYear}
                        </span>
                    )}
                    {[
                        formatBooleanFeature('Sink', room.sink),
                        formatBooleanFeature('Closet', room.closet),
                        room.closetType
                            ? `Closet: ${room.closetType}`
                            : null,
                        formatBooleanFeature('Balcony', room.balcony),
                        formatBooleanFeature('Private bath', room.privateBath),
                        formatBooleanFeature('Suite bath', room.suiteBath),
                    ]
                        .filter(Boolean)
                        .map((feature) => (
                            <span
                                key={feature}
                                className="rounded-md bg-sas-mist px-2 py-1"
                            >
                                {feature}
                            </span>
                        ))}
                </div>
                {room.note && (
                    <p className="mt-3 line-clamp-2 break-words text-sm text-sas-black/65">
                        {room.note}
                    </p>
                )}
            </div>

            {canReportRoomDraw && (
                <div className="mb-5 rounded-md border border-sas-line bg-sas-white p-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-medium text-sas-black">
                                Room Draw Status
                            </p>
                            <p className="text-sm text-sas-black/65">
                                {isTaken ? 'Taken' : 'Not Taken'}
                            </p>
                        </div>
                        {canViewReviews ? (
                            isTaken ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        changeRoomDrawStatus('not_taken')
                                    }
                                    disabled={
                                        updatingStatus || !canChangeTakenStatus
                                    }
                                    className="rounded-md border border-sas-green px-3 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:cursor-not-allowed disabled:border-sas-line disabled:text-sas-black/35 disabled:hover:bg-transparent"
                                >
                                    {updatingStatus
                                        ? 'Updating...'
                                        : canChangeTakenStatus
                                          ? 'Mark Not Taken'
                                          : 'Taken'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        changeRoomDrawStatus('taken')
                                    }
                                    disabled={
                                        updatingStatus || !canMarkRoomTaken
                                    }
                                    className="rounded-md bg-sas-green px-3 py-2 text-sm font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                                >
                                    {updatingStatus
                                        ? 'Updating...'
                                        : 'Mark Taken'}
                                </button>
                            )
                        ) : (
                            <span className="text-xs text-sas-black/50">
                                Sign in to report
                            </span>
                        )}
                    </div>
                    {canOverrideRoomDraw && isTaken && (
                        <div className="mt-3 border-t border-sas-line pt-3 text-xs text-sas-black/60">
                            <p>Marked by {markedBy}</p>
                            {markedAt && <p>Marked {markedAt}</p>}
                        </div>
                    )}
                    {!canOverrideRoomDraw && isTaken && markedAt && (
                        <div className="mt-3 border-t border-sas-line pt-3 text-xs text-sas-black/60">
                            <p>Updated {markedAt}</p>
                        </div>
                    )}
                    {!isTaken &&
                        canViewReviews &&
                        !canMarkRoomTaken &&
                        roomTakenDisabledMessage && (
                            <p className="mt-3 border-t border-sas-line pt-3 text-xs text-sas-black/60">
                                {roomTakenDisabledMessage}
                            </p>
                        )}
                </div>
            )}

            {actionError && (
                <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {actionError}
                </p>
            )}

            <Link
                href={`/campus/housing/${room.housing_building_id}/${room.room_number}`}
                prefetch={false}
            >
                <button className="rounded-md border border-sas-green px-6 py-2 font-medium text-sas-green transition-colors hover:bg-sas-green hover:text-sas-white">
                    {canViewReviews ? 'View Reviews' : 'Sign in to View Reviews'}
                </button>
            </Link>
            {canManagePreferences && (
                <div className="mt-3">
                    {preferenceHolderLabel && (
                        <div className="mb-3 rounded-md border border-sas-line bg-sas-mist px-3 py-2 text-xs text-sas-black/65">
                            <p className="font-medium text-sas-black">
                                Ranked by {preferenceHolderLabel}
                            </p>
                            {!preferenceHolder?.isOwner && (
                                <p className="mt-1">
                                    Better room priority can bump this ranking.
                                </p>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={togglePreference}
                        disabled={updatingPreference}
                        className={`rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                            isInPreferenceRanking
                                ? 'border border-sas-green text-sas-green hover:bg-sas-green hover:text-sas-white'
                                : 'bg-sas-green text-sas-white hover:bg-sas-black'
                        }`}
                    >
                        {updatingPreference
                            ? 'Updating...'
                            : isInPreferenceRanking
                              ? 'Remove from Ranking'
                              : preferenceHolder
                                ? 'Bump and Rank'
                                : 'Add to Ranking'}
                    </button>
                    {preferenceMessage && (
                        <p className="mt-2 text-sm text-sas-green">
                            {preferenceMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
