'use client';

const Skeleton = ({ className = '' }: { className?: string }) => (
    <div
        className={`animate-pulse rounded-md bg-sas-line/60 ${className}`}
        aria-hidden="true"
    />
);

export const BuildingCardSkeleton = () => (
    <div className="overflow-hidden rounded-md border border-sas-line bg-sas-white shadow-sm">
        <Skeleton className="h-48 w-full rounded-none" />
        <div className="p-6">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <Skeleton className="mt-6 h-5 w-28" />
        </div>
    </div>
);

export const RoomCardSkeleton = () => (
    <div className="rounded-md border border-sas-line bg-sas-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-4 w-24" />
        <Skeleton className="mt-8 h-5 w-36" />
        <Skeleton className="mt-3 h-5 w-28" />
        <div className="mt-5 flex gap-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-24" />
        </div>
        <Skeleton className="mt-8 h-10 w-32" />
    </div>
);

export const ReviewSkeleton = () => (
    <div className="rounded-md border border-sas-line bg-sas-white p-4">
        <Skeleton className="h-7 w-40" />
        <div className="mt-5 grid grid-cols-2 gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="mt-6 h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-5/6" />
    </div>
);

export const AdminRoomTableSkeleton = () => (
    <div className="mt-5 space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
            <div
                key={index}
                className="grid gap-3 rounded-md border border-sas-line bg-sas-white p-3 md:grid-cols-5"
            >
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
            </div>
        ))}
    </div>
);

export default Skeleton;
