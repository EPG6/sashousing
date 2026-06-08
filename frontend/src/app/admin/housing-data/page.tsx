'use client';

import Loading from '@/components/Loading';
import LoginRequired from '@/components/LoginRequired';
import SiteHeader from '@/components/SiteHeader';
import AdminTabs from '@/components/admin/AdminTabs';
import { useAuth } from '@/hooks/useAuth';
import { Building, Room } from '@/types';
import { backendUrl } from '@/utils/api';
import Link from 'next/link';
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
};

const toRoomForm = (room: Room): RoomForm => ({
    room_number: room.room_number,
    housing_building_id: String(room.housing_building_id),
    size: room.size ? String(room.size) : '',
    occupancy_type: room.occupancy_type ? String(room.occupancy_type) : '',
    closet_type: room.closet_type ? String(room.closet_type) : '',
    bathroom_type: room.bathroom_type ? String(room.bathroom_type) : '',
});

export default function HousingDataAdminPage() {
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

    const selectedBuilding = useMemo(
        () =>
            buildings.find((building) => building.id === selectedBuildingId) ||
            null,
        [buildings, selectedBuildingId]
    );

    const filteredBuildings = useMemo(() => {
        const normalizedQuery = buildingSearchQuery.trim().toLowerCase();

        if (!normalizedQuery) {
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

            return searchText.includes(normalizedQuery);
        });
    }, [buildings, buildingSearchQuery]);

    const normalizedBuildingSearchQuery = buildingSearchQuery
        .trim()
        .toLowerCase();

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

        if (
            selectedBuildingId &&
            filteredBuildings.some((building) => building.id === selectedBuildingId)
        ) {
            return;
        }

        setSelectedBuildingId(filteredBuildings[0].id);
    }, [filteredBuildings, selectedBuildingId]);

    useEffect(() => {
        if (!selectedBuilding) {
            return;
        }

        setBuildingForm({
            name: selectedBuilding.name,
            campus: selectedBuilding.campus,
            floors: String(selectedBuilding.floors),
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
                        description: buildingForm.description,
                    }),
                }
            );

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to save building');
            }

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
                error instanceof Error
                    ? error.message
                    : 'Could not save building.'
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

            const data = await response.json().catch(() => null);
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to save room');
            }

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
                error instanceof Error ? error.message : 'Could not save room.'
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
                        <h1 className="font-display text-3xl font-semibold text-sas-green">
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
            <SiteHeader />
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <Link
                    href="/campus/housing"
                    className="mb-6 inline-flex items-center rounded-md border border-sas-line bg-sas-white px-4 py-2 text-sm font-medium text-sas-black shadow-sm hover:border-sas-green hover:text-sas-green"
                >
                    Back to Housing
                </Link>

                <AdminTabs activeTab="housing-data" />

                <div className="mb-8 border-b border-sas-line pb-5">
                    <h1 className="font-display text-4xl font-semibold text-sas-black">
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
                                normalizedBuildingSearchQuery
                                    ? building.roomNumbers
                                          .filter((roomNumber) =>
                                              roomNumber
                                                  .toLowerCase()
                                                  .includes(
                                                      normalizedBuildingSearchQuery
                                                  )
                                          )
                                          .slice(0, 5)
                                    : [];

                            return (
                                <button
                                    key={building.id}
                                    type="button"
                                    onClick={() => {
                                        setEditingBuilding(false);
                                        setEditingRoomId(null);
                                        setSelectedBuildingId(building.id);
                                    }}
                                    className={`min-w-[220px] rounded-md border p-4 text-left shadow-sm transition-colors ${
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
                            className="rounded-md border border-sas-line bg-sas-white p-6 shadow-sm"
                        >
                            <h2 className="font-display text-2xl font-semibold text-sas-black">
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
                            <div className="mt-5 flex flex-wrap gap-3">
                                {editingBuilding ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={cancelBuildingEdit}
                                            disabled={savingBuilding}
                                            className="rounded-md border border-sas-green px-5 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={savingBuilding}
                                            className="rounded-md bg-sas-green px-5 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
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
                                        className="rounded-md border border-sas-green px-5 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white"
                                    >
                                        Edit Building
                                    </button>
                                )}
                            </div>
                        </form>

                        <div className="mt-8 rounded-md border border-sas-line bg-sas-white p-6 shadow-sm">
                            <h2 className="font-display text-2xl font-semibold text-sas-black">
                                Rooms
                            </h2>
                            {roomsLoading ? (
                                <p className="mt-4 text-sas-black/65">
                                    Loading rooms...
                                </p>
                            ) : (
                                <div className="mt-5 overflow-x-auto">
                                    <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-sas-line text-sas-black/65">
                                                <th className="py-2 pr-3 font-medium">
                                                    Room
                                                </th>
                                                <th className="py-2 pr-3 font-medium">
                                                    Building ID
                                                </th>
                                                <th className="py-2 pr-3 font-medium">
                                                    Size
                                                </th>
                                                <th className="py-2 pr-3 font-medium">
                                                    Occupancy
                                                </th>
                                                <th className="py-2 pr-3 font-medium">
                                                    Closet
                                                </th>
                                                <th className="py-2 pr-3 font-medium">
                                                    Bathroom
                                                </th>
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
                                                    editingRoomId === room.id;

                                                return (
                                                    <tr
                                                        key={room.id}
                                                        className="border-b border-sas-line last:border-b-0"
                                                    >
                                                        {(
                                                            [
                                                                'room_number',
                                                                'housing_building_id',
                                                                'size',
                                                                'occupancy_type',
                                                                'closet_type',
                                                                'bathroom_type',
                                                            ] as const
                                                        ).map((field) => (
                                                            <td
                                                                key={field}
                                                                className="py-3 pr-3"
                                                            >
                                                                <input
                                                                    type={
                                                                        field ===
                                                                        'room_number'
                                                                            ? 'text'
                                                                            : 'number'
                                                                    }
                                                                    value={
                                                                        roomForm[
                                                                            field
                                                                        ]
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
                                                                                        [field]:
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
                                                        ))}
                                                        <td className="py-3 pr-3">
                                                            {isEditingRoom ? (
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            cancelRoomEdit(
                                                                                room
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            savingRoomId ===
                                                                            room.id
                                                                        }
                                                                        className="rounded-md border border-sas-green px-3 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            saveRoom(
                                                                                room.id
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            savingRoomId ===
                                                                            room.id
                                                                        }
                                                                        className="rounded-md bg-sas-green px-3 py-2 font-medium text-sas-white hover:bg-sas-black disabled:opacity-60"
                                                                    >
                                                                        {savingRoomId ===
                                                                        room.id
                                                                            ? 'Saving...'
                                                                            : 'Save'}
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setEditingRoomId(
                                                                            room.id
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        savingRoomId !==
                                                                        null
                                                                    }
                                                                    className="rounded-md border border-sas-green px-3 py-2 font-medium text-sas-green hover:bg-sas-green hover:text-sas-white disabled:opacity-60"
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
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
