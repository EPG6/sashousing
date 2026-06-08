export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isAdmin: boolean;
}

export interface Building {
    id: number;
    name: string;
    campus: string;
    floors: number;
    description?: string;
}

export interface Room {
    _id: string;
    id: number;
    room_number: string;
    size?: number;
    occupancy_type?: number;
    closet_type?: number;
    bathroom_type?: number;
    housing_building_id: number;
    averageRating?: number;
    reviewCount?: number;
    roomDrawStatus?: RoomDrawRoomStatus;
}

export interface RoomDrawSettings {
    startsAt: string | null;
    endsAt: string | null;
    isVisible: boolean;
}

export interface RoomDrawRoomStatus {
    status: 'taken';
    isOwner: boolean;
    updatedAt?: string;
    markedByName?: string;
    markedByEmail?: string;
}

export interface RoomDrawStatusResponse extends RoomDrawSettings {
    statuses: Record<number, RoomDrawRoomStatus>;
}

export interface Review {
    _id: string;
    id: number;
    overall_rating?: number;
    quiet_rating?: number;
    layout_rating?: number;
    temperature_rating?: number;
    comments?: string;
    housing_room_id: number;
    isOwner: boolean;
    pictures?: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface ReviewAverages {
    overallAverage: number;
    quietAverage: number;
    layoutAverage: number;
    temperatureAverage: number;
    reviewCount: number;
}

export interface RoomWithReviews {
    room: Room;
    reviews: Review[];
    averages: ReviewAverages;
}

export interface RoomCardProps {
    buildingName: string;
    room: Room;
    canViewReviews?: boolean;
    canReportRoomDraw?: boolean;
    canOverrideRoomDraw?: boolean;
    onRoomDrawStatusChange?: (
        roomId: number,
        nextStatus: 'taken' | 'not_taken'
    ) => Promise<void>;
}

export interface ReviewFormProps {
    review: Review | null;
}
