'use client';

import Loading from '@/components/Loading';
import LoginRequired from '@/components/LoginRequired';
import SiteHeader from '@/components/SiteHeader';
import AppModal from '@/components/AppModal';
import AdminTabs from '@/components/admin/AdminTabs';
import { useAuth } from '@/hooks/useAuth';
import { Building, Room } from '@/types';
import { backendUrl } from '@/utils/api';
import { getApiErrorMessage, getUserSafeMessage } from '@/utils/apiErrors';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type BuildingSearchDoc = Building & {
    roomNumbers: string[];
};

type RoomForm = {
    room_number: string;
    housing_building_id: string;
    size: string;
    occupancy_type: string;
    closet_type: string;
    bathroom_type: string;
    floor: string;
    eligibleYear: string;
    sink: string;
    closet: string;
    closetType: string;
    balcony: string;
    privateBath: string;
    suiteBath: string;
    note: string;
};

const toRoomForm = (room: Room): RoomForm => ({
    room_number: room.room_number,
    housing_building_id: String(room.housing_building_id),
    size: room.size ? String(room.size) : '',
    occupancy_type: room.occupancy_type ? String(room.occupancy_type) : '',
    closet_type: room.closet_type ? String(room.closet_type) : '',
    bathroom_type: room.bathroom_type ? String(room.bathroom_type) : '',
    floor: room.floor ? String(room.floor) : '',
    eligibleYear: room.eligibleYear ? String(room.eligibleYear) : '',
    sink: room.sink === undefined ? '' : String(room.sink),
    closet: room.closet === undefined ? '' : String(room.closet),
    closetType: room.closetType || '',
    balcony: room.balcony === undefined ? '' : String(room.balcony),
    privateBath:
        room.privateBath === undefined ? '' : String(room.privateBath),
    suiteBath: room.suiteBath === undefined ? '' : String(room.suiteBath),
    note: room.note || '',
});

const ROOM_FIELDS = [
    { key: 'room_number' as const, label: 'Room', type: 'text' as const },
    {
        key: 'housing_building_id' as const,
        label: 'Building ID',
        type: 'number' as const,
    },
    { key: 'size' as const, label: 'Size', type: 'number' as const },
    {
        key: 'occupancy_type' as const,
        label: 'Occupancy',
        type: 'number' as const,
    },
    { key: 'closet_type' as const, label: 'Closet', type: 'number' as const },
    {
        key: 'bathroom_type' as const,
        label: 'Bathroom',
        type: 'number' as const,
    },
    { key: 'floor' as const, label: 'Floor', type: 'number' as const },
    {
        key: 'eligibleYear' as const,
        label: 'Year',
        type: 'number' as const,
    },
    { key: 'sink' as const, label: 'Sink', type: 'text' as const },
    { key: 'closet' as const, label: 'Closet?', type: 'text' as const },
    {
        key: 'closetType' as const,
        label: 'Closet Type',
        type: 'text' as const,
    },
    { key: 'balcony' as const, label: 'Balcony', type: 'text' as const },
    {
        key: 'privateBath' as const,
        label: 'Private Bath',
        type: 'text' as const,
    },
    {
        key: 'suiteBath' as const,
        label: 'Suite Bath',
        type: 'text' as const,
    },
    { key: 'note' as const, label: 'Note', type: 'text' as const },
] as const;

const BOOLEAN_ROOM_FIELD_KEYS = new Set<keyof RoomForm>([
    'sink',
    'closet',
    'balcony',
    'privateBath',
    'suiteBath',
]);

const getRoomFieldValue = (
    roomForm: RoomForm,
    fieldKey: keyof RoomForm,
    isEditingRoom: boolean
) => {
    const value = roomForm[fieldKey];
    if (isEditingRoom || !BOOLEAN_ROOM_FIELD_KEYS.has(fieldKey)) {
        return value;
    }

    if (value === 'true') {
        return 'Yes';
    }
    if (value === 'false') {
        return 'No';
    }

    return value;
};

export default function HousingDataAdminPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [buildings, setBuildings] = useState<BuildingSearchDoc[]>([]);
    const [buildingSearchQuery, setBuildingSearchQuery] = useState('');
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(
        null
    );
    const [buildingForm, setBuildingForm] = useState({
        name: '',
        campus: '',
        floors: '',
        eligibleYear: '',
        description: '',
    });
    const [rooms, setRooms] = useState<Room[]>([]);
    const [roomForms, setRoomForms] = useState<Record<number, RoomForm>>({});
    const [editingBuilding, setEditingBuilding] = useState(false);
    const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [roomsLoading, setRoomsLoading] = useState(false);
    const [savingBuilding, setSavingBuilding] = useState(false);
    const [savingRoomId, setSavingRoomId] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [pendingBuildingId, setPendingBuildingId] = useState<number | null>(
        null
    );
    const [pendingHref, setPendingHref] = useState<string | null>(null);

    const selectedBuilding = useMemo(
        () =>
            buildings.find((building) => building.id === selectedBuildingId) ||
            null,
        [buildings, selectedBuildingId]
    );

    const normalizedBuildingSearchQuery = buildingSearchQuery
        .trim()
        .toLowerCase();
    const buildingSearchTokens = normalizedBuildingSearchQuery
        .split(/\s+/)
        .filter(Boolean);

    const filteredBuildings = useMemo(() => {
        if (buildingSearchTokens.length === 0) {
            return buildings;
        }

        return buildings.filter((building) => {
            const searchText = [
                building.campus,
                building.name,
                building.description,
                `${building.floors} floors`,
                ...building.roomNumbers.map(
                    (roomNumber) => `room ${roomNumber}`
                ),
            ]
                .join(' ')
                .toLowerCase();

            return buildingSearchTokens.every((token) =>
                searchText.includes(token)
            );
        });
    }, [buildings, buildingSearchTokens]);

    const hasUnsavedEdits = editingBuilding || editingRoomId !== null;

    useEffect(() => {
        if (!hasUnsavedEdits) {
            return;
        }

        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [hasUnsavedEdits]);

    const navigateWithUnsavedCheck = (href: string) => {
        if (hasUnsavedEdits) {
            setPendingHref(href);
            return;
        }

        router.push(href);
    };

    const discardAndNavigate = () => {
        setEditingBuilding(false);
        setEditingRoomId(null);
        if (pendingHref) {
            router.push(pendingHref);
            setPendingHref(null);
        }
    };

    const selectBuilding = (buildingId: number) => {
        if (buildingId === selectedBuildingId) {
            return;
        }

        if (hasUnsavedEdits) {
            setPendingBuildingId(buildingId);
            return;
        }

        setEditingBuilding(false);
        setEditingRoomId(null);
        setSelectedBuildingId(buildingId);
    };

    const confirmBuildingSwitch = () => {
        if (pendingBuildingId === null) {
            return;
        }

        setEditingBuilding(false);
        setEditingRoomId(null);
        setSelectedBuildingId(pendingBuildingId);
        setPendingBuildingId(null);
    };

    useEffect(() => {
        const fetchBuildings = async () => {
            try {
                const response = await fetch(
                    `${backendUrl}/api/campus/housing/search-index`,
                    {
                        credentials: 'include',
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to load buildings');
                }

                const data = (await response.json()) as BuildingSearchDoc[];
                setBuildings(data);
                if (data.length > 0) {
                    setSelectedBuildingId(data[0].id);
                }
            } catch (error) {
                console.error('Housing data load error:', error);
                setError('Could not load housing data.');
            } finally {
                setLoading(false);
            }
        };

        fetchBuildings();
    }, []);

    useEffect(() => {
        if (filteredBuildings.length === 0) {
            return;
        }

        if (hasUnsavedEdits) {
            return;
        }

        if (
            selectedBuildingId &&
            filteredBuildings.some((building) => building.id === selectedBuildingId)
        ) {
            return;
        }

        setSelectedBuildingId(filteredBuildings[0].id);
    }, [filteredBuildings, hasUnsavedEdits, selectedBuildingId]);

    useEffect(() => {
        if (!selectedBuilding) {
            return;
        }

        setBuildingForm({
            name: selectedBuilding.name,
            campus: selectedBuilding.campus,
            floors: String(selectedBuilding.floors),
            eligibleYear: selectedBuilding.eligibleYear
                ? String(selectedBuilding.eligibleYear)
                : '',
            description: selectedBuilding.description || '',
        });
        setEditingBuilding(false);
    }, [selectedBuilding]);

    useEffect(() => {
        if (!selectedBuildingId) {
            setRooms([]);
            setRoomForms({});
            return;
        }

        const fetchRooms = async () => {
            setRoomsLoading(true);
            setMessage(null);
            setError(null);
            setEditingRoomId(null);

            try {
                const response = await fetch(
                    `${backendUrl}/api/campus/housing/${selectedBuildingId}/rooms`,
                    {
                        credentials: 'include',
                    }
                );

                const data = response.ok ? ((await response.json()) as Room[]) : [];
                setRooms(data);
                setRoomForms(
                    data.reduce<Record<number, RoomForm>>((acc, room) => {
                        acc[room.id] = toRoomForm(room);
                        return acc;
                    }, {})
                );
            } catch (error) {
                console.error('Room data load error:', error);
                setError('Could not load room data.');
            } finally {
                setRoomsLoading(false);
            }
        };

        fetchRooms();
    }, [selectedBuildingId]);

    const saveBuilding = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedBuildingId) {
            return;
        }

        setSavingBuilding(true);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/admin/buildings/${selectedBuildingId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        name: buildingForm.name,
                        campus: buildingForm.campus,
                        floors: buildingForm.floors,
                        eligibleYear: buildingForm.eligibleYear,
                        description: buildingForm.description,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(
                        response,
                        'Failed to save building'
                    )
                );
            }

            const data = await response.json();
            setBuildings((currentBuildings) =>
                currentBuildings.map((building) =>
                    building.id === data.id
                        ? {
                              ...data,
                              roomNumbers: building.roomNumbers,
                          }
                        : building
                )
            );
            setMessage('Building saved.');
            setEditingBuilding(false);
        } catch (error) {
            console.error('Building save error:', error);
            setError(
                getUserSafeMessage(
                    error instanceof Error ? error.message : null,
                    'Could not save building.'
                )
            );
        } finally {
            setSavingBuilding(false);
        }
    };

    const cancelBuildingEdit = () => {
        if (!selectedBuilding) {
            return;
        }

        setBuildingForm({
            name: selectedBuilding.name,
            campus: selectedBuilding.campus,
            floors: String(selectedBuilding.floors),
            eligibleYear: selectedBuilding.eligibleYear
                ? String(selectedBuilding.eligibleYear)
                : '',
            description: selectedBuilding.description || '',
        });
        setEditingBuilding(false);
    };

    const saveRoom = async (roomId: number) => {
        const roomForm = roomForms[roomId];
        if (!roomForm) {
            return;
        }

        setSavingRoomId(roomId);
        setMessage(null);
        setError(null);

        try {
            const response = await fetch(
                `${backendUrl}/api/campus/housing/admin/rooms/${roomId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(roomForm),
                }
            );

            if (!response.ok) {
                throw new Error(
                    await getApiErrorMessage(response, 'Failed to save room')
                );
            }

            const data = await response.json();
            setRooms((currentRooms) =>
                currentRooms.map((room) => (room.id === data.id ? data : room))
            );
            setRoomForms((currentForms) => ({
                ...currentForms,
                [data.id]: toRoomForm(data),
            }));
            setMessage(`Room ${data.room_number} saved.`);
            setEditingRoomId(null);
        } catch (error) {
            console.error('Room save error:', error);
            setError(
                getUserSafeMessage(
                    error instanceof Error ? error.message : null,
                    'Could not save room.'
                )
            );
        } finally {
            setSavingRoomId(null);
        }
    };

    const cancelRoomEdit = (room: Room) => {
        setRoomForms((currentForms) => ({
            ...currentForms,
            [room.id]: toRoomForm(room),
        }));
        setEditingRoomId(null);
    };

    const renderRoomActions = (room: Room, isEditingRoom: boolean) =>
        isEditingRoom ? (
            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => cancelRoomEdit(room)}
                    disabled={savingRoomId === room.id}
                    className="rounded-md border border-sas-green px-3 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={() => saveRoom(room.id)}
                    disabled={savingRoomId === room.id}
                    className="rounded-md bg-sas-green px-3 py-2 text-sm font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                >
                    {savingRoomId === room.id ? 'Saving...' : 'Save'}
                </button>
            </div>
        ) : (
            <button
                type="button"
                onClick={() => setEditingRoomId(room.id)}
                disabled={savingRoomId !== null}
                className="rounded-md border border-sas-green px-3 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60"
            >
                Edit
            </button>
        );

    if (authLoading || loading) {
        return <Loading />;
    }

    if (!user) {
        return <LoginRequired />;
    }

    if (!user.isAdmin) {
        return (
            <div className="min-h-screen bg-sas-mist text-sas-black">
                <SiteHeader />
                <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center px-4">
                    <div className="w-full max-w-md rounded-md border border-sas-line bg-sas-white p-6 text-center shadow-sm">
                        <h1 className="font-display text-2xl font-semibold text-sas-green sm:text-3xl">
                            Admin Access Required
                        </h1>
                        <p className="mt-3 text-sas-black/65">
                            You need admin permissions to edit housing data.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-sas-mist text-sas-black">
            <SiteHeader onNavigate={navigateWithUnsavedCheck} />
            <AppModal
                isOpen={pendingBuildingId !== null}
                title="Discard Unsaved Edits?"
                onClose={() => setPendingBuildingId(null)}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setPendingBuildingId(null)}
                            className="rounded-md border border-sas-green px-4 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white"
                        >
                            Keep Editing
                        </button>
                        <button
                            type="button"
                            onClick={confirmBuildingSwitch}
                            className="rounded-md bg-sas-green px-4 py-2 text-sm font-medium text-sas-white hover:bg-sas-black"
                        >
                            Discard Edits
                        </button>
                    </>
                }
            >
                Switching buildings will discard the edits currently on this
                page.
            </AppModal>
            <AppModal
                isOpen={pendingHref !== null}
                title="Discard Unsaved Edits?"
                onClose={() => setPendingHref(null)}
                actions={
                    <>
                        <button
                            type="button"
                            onClick={() => setPendingHref(null)}
                            className="rounded-md border border-sas-green px-4 py-2 text-sm font-medium text-sas-green hover:bg-sas-green hover:text-sas-white"
                        >
                            Keep Editing
                        </button>
                        <button
                            type="button"
                            onClick={discardAndNavigate}
                            className="rounded-md bg-sas-green px-4 py-2 text-sm font-medium text-sas-white hover:bg-sas-black"
                        >
                            Discard Edits
                        </button>
                    </>
                }
            >
                Leaving this page will discard the edits currently on this page.
            </AppModal>
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <button
                    type="button"
                    onClick={() => navigateWithUnsavedCheck('/campus/housing')}
                    className="mb-6 inline-flex items-center rounded-md border border-sas-line bg-sas-white px-4 py-2 text-sm font-medium text-sas-black shadow-sm hover:border-sas-green hover:text-sas-green"
                >
                    Back to Housing
                </button>

                <AdminTabs
                    activeTab="housing-data"
                    onNavigate={navigateWithUnsavedCheck}
                />

                <div className="mb-8 border-b border-sas-line pb-5">
                    <h1 className="font-display text-2xl font-semibold text-sas-black sm:text-4xl">
                        Housing Data
                    </h1>
                    <p className="mt-2 text-sas-black/70">
                        Edit residence hall and room records.
                    </p>
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium text-sas-black/75">
                        Buildings
                    </p>
                    <div className="mt-2 max-w-xl">
                        <label htmlFor="admin-building-search" className="sr-only">
                            Search buildings
                        </label>
                        <input
                            id="admin-building-search"
                            type="search"
                            value={buildingSearchQuery}
                            onChange={(event) =>
                                setBuildingSearchQuery(event.target.value)
                            }
                            placeholder="Search buildings, rooms, campuses, or descriptions"
                            className="w-full rounded-md border border-sas-line bg-sas-white px-4 py-3 text-sas-black shadow-sm focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                        />
                    </div>
                    {buildingSearchQuery.trim() && (
                        <p className="mt-2 text-sm text-sas-black/55">
                            Showing {filteredBuildings.length} of{' '}
                            {buildings.length} buildings
                        </p>
                    )}
                    <div className="mt-2 flex gap-3 overflow-x-auto pb-3">
                        {filteredBuildings.map((building) => {
                            const isSelected =
                                building.id === selectedBuildingId;
                            const matchingRooms =
                                buildingSearchTokens.length > 0
                                    ? building.roomNumbers
                                          .filter((roomNumber) =>
                                              buildingSearchTokens.some(
                                                  (token) =>
                                                      roomNumber
                                                          .toLowerCase()
                                                          .includes(token)
                                                  )
                                          )
                                          .slice(0, 5)
                                    : [];

                            return (
                                <button
                                    key={building.id}
                                    type="button"
                                    onClick={() => selectBuilding(building.id)}
                                    className={`min-h-36 w-72 shrink-0 rounded-md border p-4 text-left shadow-sm transition-colors ${
                                        isSelected
                                            ? 'border-sas-green bg-sas-green text-sas-white'
                                            : 'border-sas-line bg-sas-white text-sas-black hover:border-sas-green'
                                    }`}
                                >
                                    <span className="block font-display text-xl font-semibold">
                                        {building.name}
                                    </span>
                                    <span
                                        className={`mt-2 block text-sm ${
                                            isSelected
                                                ? 'text-sas-white/80'
                                                : 'text-sas-black/60'
                                        }`}
                                    >
                                        {building.campus}
                                    </span>
                                    <span
                                        className={`mt-3 block text-sm ${
                                            isSelected
                                                ? 'text-sas-white/85'
                                                : 'text-sas-black/70'
                                        }`}
                                    >
                                        {building.floors} floor
                                        {building.floors === 1 ? '' : 's'} ·{' '}
                                        {building.roomNumbers.length} room
                                        {building.roomNumbers.length === 1
                                            ? ''
                                            : 's'}
                                    </span>
                                    {matchingRooms.length > 0 && (
                                        <span
                                            className={`mt-3 block text-sm ${
                                                isSelected
                                                    ? 'text-sas-white'
                                                    : 'text-sas-green'
                                            }`}
                                        >
                                            Matching rooms:{' '}
                                            {matchingRooms.join(', ')}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {filteredBuildings.length === 0 && (
                        <div className="mt-2 rounded-md border border-sas-line bg-sas-white p-6 text-center">
                            <p className="text-sas-black/65">
                                No buildings match your search.
                            </p>
                        </div>
                    )}
                </div>

                {message && (
                    <p className="mb-4 text-sm text-sas-green">{message}</p>
                )}
                {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

                {selectedBuilding ? (
                    <>
                        <form
                            onSubmit={saveBuilding}
                            className="rounded-md border border-sas-line bg-sas-white p-4 shadow-sm sm:p-6"
                        >
                            <h2 className="font-display text-xl font-semibold text-sas-black sm:text-2xl">
                                Building Details
                            </h2>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <label className="block">
                                    <span className="text-sm font-medium text-sas-black/75">
                                        Name
                                    </span>
                                    <input
                                        value={buildingForm.name}
                                        disabled={!editingBuilding}
                                        onChange={(event) =>
                                            setBuildingForm((current) => ({
                                                ...current,
                                                name: event.target.value,
                                            }))
                                        }
                                        className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-sas-black/75">
                                        Campus
                                    </span>
                                    <input
                                        value={buildingForm.campus}
                                        disabled={!editingBuilding}
                                        onChange={(event) =>
                                            setBuildingForm((current) => ({
                                                ...current,
                                                campus: event.target.value,
                                            }))
                                        }
                                        className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-sas-black/75">
                                        Floors
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={buildingForm.floors}
                                        disabled={!editingBuilding}
                                        onChange={(event) =>
                                            setBuildingForm((current) => ({
                                                ...current,
                                                floors: event.target.value,
                                            }))
                                        }
                                        className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                    />
                                </label>
                                <label className="block">
                                    <span className="text-sm font-medium text-sas-black/75">
                                        Eligible Year
                                    </span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="4"
                                        value={buildingForm.eligibleYear}
                                        disabled={!editingBuilding}
                                        onChange={(event) =>
                                            setBuildingForm((current) => ({
                                                ...current,
                                                eligibleYear:
                                                    event.target.value,
                                            }))
                                        }
                                        placeholder="All years"
                                        className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                    />
                                </label>
                                <label className="block sm:col-span-2">
                                    <span className="text-sm font-medium text-sas-black/75">
                                        Description
                                    </span>
                                    <textarea
                                        value={buildingForm.description}
                                        disabled={!editingBuilding}
                                        onChange={(event) =>
                                            setBuildingForm((current) => ({
                                                ...current,
                                                description: event.target.value,
                                            }))
                                        }
                                        rows={4}
                                        className="mt-2 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                    />
                                </label>
                            </div>
                            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                {editingBuilding ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={cancelBuildingEdit}
                                            disabled={savingBuilding}
                                            className="w-full rounded-md border border-sas-green px-5 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60 sm:w-auto"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingBuilding}
                                            className="w-full rounded-md bg-sas-green px-5 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60 sm:w-auto"
                                        >
                                            {savingBuilding
                                                ? 'Saving...'
                                                : 'Save Building'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setEditingBuilding(true)}
                                        className="w-full rounded-md border border-sas-green px-5 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white sm:w-auto"
                                    >
                                        Edit Building
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="mt-8 rounded-md border border-sas-line bg-sas-white p-4 shadow-sm sm:p-6">
                            <h2 className="font-display text-xl font-semibold text-sas-black sm:text-2xl">
                                Rooms
                            </h2>
                            {roomsLoading ? (
                                <p className="mt-4 text-sas-black/65">
                                    Loading rooms...
                                </p>
                            ) : rooms.length === 0 ? (
                                <p className="mt-4 text-sas-black/65">
                                    No rooms found for this building.
                                </p>
                            ) : (
                                <>
                                    <div className="mt-5 space-y-4 md:hidden">
                                        {rooms.map((room) => {
                                            const roomForm = roomForms[room.id];
                                            if (!roomForm) {
                                                return null;
                                            }
                                            const isEditingRoom =
                                                editingRoomId === room.id;

                                            return (
                                                <div
                                                    key={room.id}
                                                    className="rounded-md border border-sas-line p-4"
                                                >
                                                    <p className="font-display text-lg font-semibold text-sas-black">
                                                        Room{' '}
                                                        {roomForm.room_number}
                                                    </p>
                                                    <div className="mt-3 grid gap-3">
                                                        {ROOM_FIELDS.map(
                                                            (field) => (
                                                                <label
                                                                    key={
                                                                        field.key
                                                                    }
                                                                    className="block"
                                                                >
                                                                    <span className="text-sm font-medium text-sas-black/75">
                                                                        {
                                                                            field.label
                                                                        }
                                                                    </span>
                                                                    <input
                                                                        type={
                                                                            field.type
                                                                        }
                                                                        value={
                                                                            getRoomFieldValue(
                                                                                roomForm,
                                                                                field.key,
                                                                                isEditingRoom
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            !isEditingRoom
                                                                        }
                                                                        onChange={(
                                                                            event
                                                                        ) =>
                                                                            setRoomForms(
                                                                                (
                                                                                    current
                                                                                ) => ({
                                                                                    ...current,
                                                                                    [room.id]:
                                                                                        {
                                                                                            ...current[
                                                                                                room
                                                                                                    .id
                                                                                            ],
                                                                                            [field.key]:
                                                                                                event
                                                                                                    .target
                                                                                                    .value,
                                                                                        },
                                                                                })
                                                                            )
                                                                        }
                                                                        className="mt-1 w-full rounded-md border border-sas-line px-3 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                                                    />
                                                                </label>
                                                            )
                                                        )}
                                                    </div>
                                                    <div className="mt-4">
                                                        {renderRoomActions(
                                                            room,
                                                            isEditingRoom
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-5 hidden overflow-x-auto md:block">
                                        <p className="mb-3 text-xs text-sas-black/50">
                                            Scroll horizontally to see all
                                            columns.
                                        </p>
                                        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                            <thead>
                                                <tr className="border-b border-sas-line text-sas-black/65">
                                                    {ROOM_FIELDS.map(
                                                        (field) => (
                                                            <th
                                                                key={field.key}
                                                                className="py-2 pr-3 font-medium"
                                                            >
                                                                {field.label}
                                                            </th>
                                                        )
                                                    )}
                                                    <th className="py-2 pr-3 font-medium">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rooms.map((room) => {
                                                    const roomForm =
                                                        roomForms[room.id];
                                                    if (!roomForm) {
                                                        return null;
                                                    }
                                                    const isEditingRoom =
                                                        editingRoomId ===
                                                        room.id;

                                                    return (
                                                        <tr
                                                            key={room.id}
                                                            className="border-b border-sas-line last:border-b-0"
                                                        >
                                                            {ROOM_FIELDS.map(
                                                                (field) => (
                                                                    <td
                                                                        key={
                                                                            field.key
                                                                        }
                                                                        className="py-3 pr-3"
                                                                    >
                                                                        <input
                                                                            type={
                                                                                field.type
                                                                            }
                                                                            value={
                                                                                getRoomFieldValue(
                                                                                    roomForm,
                                                                                    field.key,
                                                                                    isEditingRoom
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !isEditingRoom
                                                                            }
                                                                            onChange={(
                                                                                event
                                                                            ) =>
                                                                                setRoomForms(
                                                                                    (
                                                                                        current
                                                                                    ) => ({
                                                                                        ...current,
                                                                                        [room.id]:
                                                                                            {
                                                                                                ...current[
                                                                                                    room
                                                                                                        .id
                                                                                                ],
                                                                                                [field.key]:
                                                                                                    event
                                                                                                        .target
                                                                                                        .value,
                                                                                            },
                                                                                    })
                                                                                )
                                                                            }
                                                                            className="w-full min-w-24 rounded-md border border-sas-line px-2 py-2 text-sas-black disabled:bg-sas-mist disabled:text-sas-black/65 focus:border-sas-green focus:outline-none focus:ring-2 focus:ring-sas-green/20"
                                                                        />
                                                                    </td>
                                                                )
                                                            )}
                                                            <td className="py-3 pr-3">
                                                                {renderRoomActions(
                                                                    room,
                                                                    isEditingRoom
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="rounded-md border border-sas-line bg-sas-white p-8 text-center shadow-sm">
                        <p className="text-sas-black/65">
                            Select a building to load full room details.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
