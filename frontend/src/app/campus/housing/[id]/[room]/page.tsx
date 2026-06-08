'use client';

import Loading from '@/components/Loading';
import LoginRequired from '@/components/LoginRequired';
import SiteHeader from '@/components/SiteHeader';
import { PictureModal, ReviewForm } from '@/components/housing/Reviews';
import { StarRating, getRoomOccupancyType } from '@/components/housing/Rooms';
import { useAuth } from '@/hooks/useAuth';
import { Review, RoomWithReviews } from '@/types';
import { FormattedReviewText } from '@/utils/textFormatting';
import { backendUrl } from '@/utils/api';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const RoomPage = () => {
    const params = useParams();
    const { id, room } = params;
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [buildingName, setBuildingName] = useState<string>('');
    const [roomReviews, setRoomReviews] = useState<RoomWithReviews | null>(
        null
    );
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [selectedPicture, setSelectedPicture] = useState<string | null>(null);
    const { user, loading: authLoading } = useAuth();

    const handleAddNewReviewClick = (shouldScrollToForm = false) => {
        if (isCreatingNew) {
            setIsCreatingNew(false);
        } else if (selectedReview) {
            if (
                window.confirm(
                    'Are you sure you want to cancel editing this review? All new changes will be lost.'
                )
            ) {
                setSelectedReview(null);
            }
        } else {
            setIsCreatingNew(true);
        }

        if (shouldScrollToForm) {
            scrollToReviewForm();
        }
    };

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);

                const [buildingResponse, reviewsResponse] = await Promise.all([
                    fetch(
                        `${backendUrl}/api/campus/housing/${id}`,
                        {
                            credentials: 'include',
                        }
                    ),
                    fetch(
                        `${backendUrl}/api/campus/housing/${id}/${room}/reviews`,
                        {
                            credentials: 'include',
                        }
                    ),
                ]);

                if (!buildingResponse.ok)
                    throw new Error(
                        `Failed to fetch building: ${buildingResponse.status}`
                    );
                if (!reviewsResponse.ok)
                    throw new Error(
                        `Failed to fetch reviews: ${reviewsResponse.status}`
                    );

                const [buildingData, reviewsData] = await Promise.all([
                    buildingResponse.json(),
                    reviewsResponse.json(),
                ]);

                setBuildingName(buildingData.name);
                setRoomReviews(reviewsData);
            } catch (error) {
                console.error('Error fetching room reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, [id, room]);

    const targetRef = useRef<HTMLButtonElement | null>(null);

    const scrollToReviewForm = () => {
        setTimeout(() => {
            if (targetRef.current) {
                targetRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });
            }
        }, 0);
    };

    const reviewActionLabel = selectedReview
        ? 'Cancel review edit'
        : isCreatingNew
          ? 'Cancel new review'
          : 'Add Review';

    if (loading || authLoading) {
        return <Loading />;
    }

    if (!user) {
        return <LoginRequired />;
    }

    const formatDate = (date: Date) => {
        const d = new Date(date);
        const month = d.toLocaleString('default', { month: 'long' });
        const year = d.getFullYear();
        return `${month} ${year}`;
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            try {
                setLoading(true);
                const response = await fetch(
                    `${backendUrl}/api/campus/housing/reviews/${id}`,
                    {
                        method: 'DELETE',
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to delete review');
                }

                alert('Review deleted successfully!');
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                console.error('Error deleting review', error);
                alert('Failed to delete review');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-sas-mist text-sas-black">
            <SiteHeader />
            <div
                className={`mx-auto max-w-6xl px-4 py-8 sm:px-6 ${!isCreatingNew && !selectedReview ? 'pb-24' : ''}`}
            >
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 inline-flex items-center rounded-md border border-sas-line bg-sas-white px-4 py-2 text-sm font-medium text-sas-black shadow-sm hover:border-sas-green hover:text-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green focus:ring-offset-2"
                >
                    Back
                </button>

                <div className="mb-8">
                    <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="font-display text-2xl font-semibold text-sas-black sm:text-3xl">
                            Reviews for {buildingName} {room}
                        </h1>
                        <button
                            className="w-fit rounded-md bg-sas-green px-6 py-2 font-medium text-sas-white transition-colors hover:bg-sas-black"
                            onClick={() => handleAddNewReviewClick()}
                            ref={targetRef}
                        >
                            {reviewActionLabel}
                        </button>
                    </div>

                    {(isCreatingNew || selectedReview) && (
                        <div className="mb-8">
                            <ReviewForm review={selectedReview} />
                        </div>
                    )}

                    <div className="py-4 flex-grow">
                        {roomReviews &&
                        roomReviews.averages &&
                        roomReviews.averages.reviewCount > 0 ? (
                            <>
                                <div className="mb-6 rounded-md border border-sas-line bg-sas-white p-4">
                                    <h4 className="mb-3 font-display text-xl font-semibold text-sas-green">
                                        Summary
                                    </h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <p className="text-sas-black/65">
                                            Occupancy:{' '}
                                            {getRoomOccupancyType(
                                                roomReviews.room.occupancy_type
                                            )}
                                        </p>

                                        {roomReviews.room.size && (
                                            <p className="text-sas-black/65">
                                                Size: {roomReviews.room.size}{' '}
                                                sq. ft.
                                            </p>
                                        )}
                                        <div>
                                            <p className="text-sas-black/65">
                                                Overall
                                            </p>
                                            <div className="flex items-center">
                                                <StarRating
                                                    rating={
                                                        roomReviews.averages
                                                            .overallAverage
                                                    }
                                                />
                                                <span className="ml-2">
                                                    {roomReviews.averages.overallAverage.toFixed(
                                                        1
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sas-black/65">
                                                Quiet
                                            </p>
                                            <div className="flex items-center">
                                                <StarRating
                                                    rating={
                                                        roomReviews.averages
                                                            .quietAverage
                                                    }
                                                />
                                                <span className="ml-2">
                                                    {roomReviews.averages.quietAverage.toFixed(
                                                        1
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sas-black/65">
                                                Layout
                                            </p>
                                            <div className="flex items-center">
                                                <StarRating
                                                    rating={
                                                        roomReviews.averages
                                                            .layoutAverage
                                                    }
                                                />
                                                <span className="ml-2">
                                                    {roomReviews.averages.layoutAverage.toFixed(
                                                        1
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sas-black/65">
                                                Temperature
                                            </p>
                                            <div className="flex items-center">
                                                <StarRating
                                                    rating={
                                                        roomReviews.averages
                                                            .temperatureAverage
                                                    }
                                                />
                                                <span className="ml-2">
                                                    {roomReviews.averages.temperatureAverage.toFixed(
                                                        1
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sas-black/55">
                                        Based on{' '}
                                        {roomReviews.averages.reviewCount}{' '}
                                        review
                                        {roomReviews.averages.reviewCount !== 1
                                            ? 's'
                                            : ''}
                                    </p>
                                </div>

                                <div className="py-4">
                                    <hr className="border-t border-sas-line" />
                                </div>

                                {/* User Reviews */}
                                <div className="space-y-6">
                                    {roomReviews.reviews.map((review) => (
                                        <div
                                            key={review._id}
                                            className="border-b border-sas-line pb-4"
                                        >
                                            <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex flex-wrap items-center rounded-md bg-sas-white p-3">
                                                    <span className="text-m mr-2 text-sas-black/65">
                                                        Overall Rating:
                                                    </span>
                                                    <span>
                                                        <StarRating
                                                            rating={
                                                                review.overall_rating ||
                                                                0
                                                            }
                                                        />
                                                    </span>
                                                    <span className="ml-2">
                                                        {review.overall_rating ||
                                                            ''}
                                                    </span>
                                                </div>

                                                {review.isOwner && (
                                                    <div className="flex shrink-0 gap-2 p-2 sm:gap-4">
                                                        <button
                                                            className="text-m rounded-md bg-sas-green px-4 py-2 text-sas-white hover:bg-sas-black"
                                                            onClick={() => {
                                                                setSelectedReview(
                                                                    review
                                                                );
                                                                scrollToReviewForm();
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="text-m rounded-md border border-sas-green px-4 py-2 text-sas-green hover:bg-sas-green hover:text-sas-white"
                                                            onClick={() => {
                                                                handleDelete(
                                                                    review.id
                                                                );
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                                                <div className="text-sm flex items-center mb-2">
                                                    <span className="mr-2 text-sas-black/65">
                                                        Quiet:
                                                    </span>
                                                    <span className="inline">
                                                        <StarRating
                                                            rating={
                                                                review.quiet_rating ||
                                                                0
                                                            }
                                                        />
                                                    </span>
                                                </div>
                                                <div className="text-sm flex items-center mb-1">
                                                    <span className="mr-2 text-sas-black/65">
                                                        Layout:
                                                    </span>
                                                    <span className="inline">
                                                        <StarRating
                                                            rating={
                                                                review.layout_rating ||
                                                                0
                                                            }
                                                        />
                                                    </span>
                                                </div>
                                                <div className="text-sm flex items-center mb-2">
                                                    <span className="mr-2 text-sas-black/65">
                                                        Temperature:
                                                    </span>
                                                    <span className="inline">
                                                        <StarRating
                                                            rating={
                                                                review.temperature_rating ||
                                                                0
                                                            }
                                                        />
                                                    </span>
                                                </div>
                                            </div>

                                            {review.comments && (
                                                <div className="mt-2 mb-2">
                                                    <FormattedReviewText
                                                        text={review.comments}
                                                        className="text-sas-black"
                                                    />
                                                </div>
                                            )}

                                            {/* Review Pictures */}
                                            {review.pictures && (
                                                <div className="flex gap-3 overflow-x-auto pb-2">
                                                    {review.pictures &&
                                                        review.pictures.length >
                                                            0 &&
                                                        review.pictures.map(
                                                            (
                                                                picture,
                                                                index
                                                            ) => (
                                                                <button
                                                                    key={index}
                                                                    type="button"
                                                                    className="shrink-0"
                                                                    onClick={() =>
                                                                        setSelectedPicture(
                                                                            picture
                                                                        )
                                                                    }
                                                                >
                                                                    <Image
                                                                        src={`${backendUrl}/api/campus/housing/review_pictures/${picture}`}
                                                                        alt={`Review image ${index + 1}`}
                                                                        width={
                                                                            200
                                                                        }
                                                                        height={
                                                                            200
                                                                        }
                                                                        className="h-24 w-24 rounded-md object-cover sm:h-[200px] sm:w-[200px]"
                                                                    />
                                                                </button>
                                                            )
                                                        )}
                                                </div>
                                            )}

                                            {/* If user clicks a picture, open a popup with enlarged image */}
                                            {selectedPicture && (
                                                <PictureModal
                                                    isOpen={!!selectedPicture}
                                                    onClose={() =>
                                                        setSelectedPicture(null)
                                                    }
                                                    picture={selectedPicture}
                                                />
                                            )}

                                            {/* Date written, last updated */}
                                            <div className="mt-3 flex flex-col gap-1 text-sm text-sas-black/55 sm:flex-row sm:gap-8">
                                                <p>
                                                    Review written{' '}
                                                    {formatDate(
                                                        review.createdAt
                                                    )}
                                                </p>
                                                <p>
                                                    Last updated{' '}
                                                    {formatDate(
                                                        review.updatedAt
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-40">
                                <p className="text-lg text-sas-black/55">
                                    No reviews yet for this room.
                                </p>
                                <p className="text-sas-black/45">
                                    Be the first to leave a review!
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        className="mb-6 mt-4 rounded-md border border-sas-green px-6 py-2 font-medium text-sas-green transition-colors hover:bg-sas-green hover:text-sas-white"
                        onClick={() => handleAddNewReviewClick(true)}
                    >
                        {reviewActionLabel}
                    </button>
                </div>
            </div>
            {!isCreatingNew && !selectedReview && (
                <button
                    type="button"
                    onClick={() => handleAddNewReviewClick(true)}
                    className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-30 rounded-md bg-sas-green px-5 py-3 font-medium text-sas-white shadow-lg transition-colors hover:bg-sas-black focus:outline-none focus:ring-2 focus:ring-sas-green focus:ring-offset-2 sm:bottom-6 sm:left-auto sm:right-6"
                >
                    Add Review
                </button>
            )}
        </div>
    );
};

export default RoomPage;
