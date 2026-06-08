import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import {
    isAdmin,
    isAuthenticated,
    isHousingReviewOwner,
} from '../middleware/authMiddleware';
import {
    HousingBuildings,
    HousingReviews,
    HousingRooms,
    RoomDrawSettings,
    RoomDrawStatuses,
} from '../models/Housing';
import { getHousingReviewPictures } from '../db';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const getParam = (param: string | string[]): string =>
    Array.isArray(param) ? param[0] : param;

const ROOM_DRAW_SETTINGS_KEY = 'global';

const isRoomDrawVisible = (settings?: {
    startsAt?: Date | null;
    endsAt?: Date | null;
} | null) => {
    if (!settings?.startsAt || !settings?.endsAt) {
        return false;
    }

    const now = new Date();
    return settings.startsAt <= now && now <= settings.endsAt;
};

const getRoomDrawSettingsPayload = async () => {
    const settings = await RoomDrawSettings.findOne({
        key: ROOM_DRAW_SETTINGS_KEY,
    }).lean();

    return {
        startsAt: settings?.startsAt || null,
        endsAt: settings?.endsAt || null,
        isVisible: isRoomDrawVisible(settings),
    };
};

const getSessionUserName = (user: Express.Request['session']['user']) =>
    user ? `${user.firstName} ${user.lastName}`.trim() : '';

const parseRequiredNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalNumber = (value: unknown) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === '') {
        return null;
    }

    return parseRequiredNumber(value);
};

/**
 * @route   GET /api/campus/housing
 * @desc    Get all housing buildings
 * @access  Public
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const buildings = await HousingBuildings.find({});
        res.json(buildings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   PATCH /api/campus/housing/admin/buildings/:buildingId
 * @desc    Update housing building data
 * @access  Admin
 */
router.patch(
    '/admin/buildings/:buildingId',
    isAdmin,
    async (req: Request, res: Response) => {
        try {
            const buildingId = parseInt(getParam(req.params.buildingId), 10);
            if (isNaN(buildingId)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            const updateData: Record<string, unknown> = {};
            const { name, campus, floors, description } = req.body;

            if (name !== undefined) {
                const trimmedName = String(name).trim();
                if (!trimmedName) {
                    res.status(400).json({ message: 'Building name is required' });
                    return;
                }

                updateData.name = trimmedName;
            }

            if (campus !== undefined) {
                const trimmedCampus = String(campus).trim();
                if (!trimmedCampus) {
                    res.status(400).json({ message: 'Campus is required' });
                    return;
                }

                updateData.campus = trimmedCampus;
            }

            if (floors !== undefined) {
                const parsedFloors = parseRequiredNumber(floors);
                if (
                    parsedFloors === null ||
                    !Number.isInteger(parsedFloors) ||
                    parsedFloors < 1
                ) {
                    res.status(400).json({
                        message: 'Floors must be a positive whole number',
                    });
                    return;
                }

                updateData.floors = parsedFloors;
            }

            if (description !== undefined) {
                updateData.description = String(description).trim();
            }

            const updatedBuilding = await HousingBuildings.findOneAndUpdate(
                { id: buildingId },
                updateData,
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!updatedBuilding) {
                res.status(404).json({ message: 'Building not found' });
                return;
            }

            res.json(updatedBuilding);
        } catch (error) {
            if (
                typeof error === 'object' &&
                error !== null &&
                'code' in error &&
                error.code === 11000
            ) {
                res.status(400).json({
                    message: 'A building with that name already exists',
                });
                return;
            }

            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   PATCH /api/campus/housing/admin/rooms/:roomId
 * @desc    Update housing room data
 * @access  Admin
 */
router.patch(
    '/admin/rooms/:roomId',
    isAdmin,
    async (req: Request, res: Response) => {
        try {
            const roomId = parseInt(getParam(req.params.roomId), 10);
            if (isNaN(roomId)) {
                res.status(400).json({ message: 'Invalid room ID format' });
                return;
            }

            const update = {
                $set: {} as Record<string, unknown>,
                $unset: {} as Record<string, ''>,
            };
            const {
                room_number,
                housing_building_id,
                size,
                occupancy_type,
                closet_type,
                bathroom_type,
            } = req.body;

            if (room_number !== undefined) {
                const trimmedRoomNumber = String(room_number).trim();
                if (!trimmedRoomNumber) {
                    res.status(400).json({ message: 'Room number is required' });
                    return;
                }

                update.$set.room_number = trimmedRoomNumber;
            }

            if (housing_building_id !== undefined) {
                const parsedBuildingId = parseRequiredNumber(housing_building_id);
                if (parsedBuildingId === null) {
                    res.status(400).json({
                        message: 'Building ID must be a number',
                    });
                    return;
                }

                const building = await HousingBuildings.findOne({
                    id: parsedBuildingId,
                });
                if (!building) {
                    res.status(404).json({ message: 'Building not found' });
                    return;
                }

                update.$set.housing_building_id = parsedBuildingId;
            }

            const optionalNumberFields = {
                size,
                occupancy_type,
                closet_type,
                bathroom_type,
            };

            for (const [field, value] of Object.entries(optionalNumberFields)) {
                const parsedValue = parseOptionalNumber(value);
                if (parsedValue === undefined) {
                    continue;
                }

                if (parsedValue === null) {
                    update.$unset[field] = '';
                    continue;
                }

                update.$set[field] = parsedValue;
            }

            const updatePayload: Record<string, unknown> = {};
            if (Object.keys(update.$set).length > 0) {
                updatePayload.$set = update.$set;
            }
            if (Object.keys(update.$unset).length > 0) {
                updatePayload.$unset = update.$unset;
            }

            const updatedRoom = await HousingRooms.findOneAndUpdate(
                { id: roomId },
                updatePayload,
                {
                    new: true,
                    runValidators: true,
                }
            );

            if (!updatedRoom) {
                res.status(404).json({ message: 'Room not found' });
                return;
            }

            res.json(updatedRoom);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /api/campus/housing/room-draw/settings
 * @desc    Get room draw visibility settings
 * @access  Public
 */
router.get('/room-draw/settings', async (_req: Request, res: Response) => {
    try {
        res.json(await getRoomDrawSettingsPayload());
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route   PATCH /api/campus/housing/room-draw/settings
 * @desc    Update room draw visibility settings
 * @access  Admin
 */
router.patch(
    '/room-draw/settings',
    isAdmin,
    async (req: Request, res: Response) => {
        try {
            const { startsAt, endsAt } = req.body;

            const parsedStartsAt = startsAt ? new Date(startsAt) : null;
            const parsedEndsAt = endsAt ? new Date(endsAt) : null;

            if (
                (startsAt && Number.isNaN(parsedStartsAt?.getTime())) ||
                (endsAt && Number.isNaN(parsedEndsAt?.getTime()))
            ) {
                res.status(400).json({ message: 'Invalid date format' });
                return;
            }

            if (
                parsedStartsAt &&
                parsedEndsAt &&
                parsedStartsAt >= parsedEndsAt
            ) {
                res.status(400).json({
                    message: 'Start time must be before end time',
                });
                return;
            }

            await RoomDrawSettings.findOneAndUpdate(
                { key: ROOM_DRAW_SETTINGS_KEY },
                {
                    key: ROOM_DRAW_SETTINGS_KEY,
                    startsAt: parsedStartsAt,
                    endsAt: parsedEndsAt,
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

            res.json(await getRoomDrawSettingsPayload());
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   POST /api/campus/housing/room-draw/clear-statuses
 * @desc    Clear all room draw statuses
 * @access  Admin
 */
router.post(
    '/room-draw/clear-statuses',
    isAdmin,
    async (_req: Request, res: Response) => {
        try {
            const result = await RoomDrawStatuses.deleteMany({});
            res.json({
                message: 'Room draw statuses cleared',
                deletedCount: result.deletedCount,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   POST /api/campus/housing/room-draw/end
 * @desc    End room draw without clearing room draw statuses
 * @access  Admin
 */
router.post(
    '/room-draw/end',
    isAdmin,
    async (_req: Request, res: Response) => {
        try {
            const now = new Date();

            await RoomDrawSettings.findOneAndUpdate(
                { key: ROOM_DRAW_SETTINGS_KEY },
                {
                    key: ROOM_DRAW_SETTINGS_KEY,
                    startsAt: null,
                    endsAt: now,
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

            res.json({
                ...(await getRoomDrawSettingsPayload()),
                message: 'Room draw ended',
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   POST /api/campus/housing/room-draw/close
 * @desc    Close room draw and clear all room draw statuses
 * @access  Admin
 */
router.post(
    '/room-draw/close',
    isAdmin,
    async (_req: Request, res: Response) => {
        try {
            const now = new Date();

            await RoomDrawSettings.findOneAndUpdate(
                { key: ROOM_DRAW_SETTINGS_KEY },
                {
                    key: ROOM_DRAW_SETTINGS_KEY,
                    startsAt: null,
                    endsAt: now,
                },
                {
                    new: true,
                    upsert: true,
                    setDefaultsOnInsert: true,
                }
            );

            const result = await RoomDrawStatuses.deleteMany({});
            res.json({
                ...(await getRoomDrawSettingsPayload()),
                message: 'Room draw closed and statuses cleared',
                deletedCount: result.deletedCount,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /api/campus/housing/:building/room-draw/statuses
 * @desc    Get active room draw statuses for a building
 * @access  Public
 */
router.get(
    '/:building/room-draw/statuses',
    async (req: Request, res: Response) => {
        try {
            const buildingId = parseInt(getParam(req.params.building), 10);

            if (isNaN(buildingId)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            const settings = await getRoomDrawSettingsPayload();
            if (!settings.isVisible) {
                res.json({ ...settings, statuses: {} });
                return;
            }

            const rooms = await HousingRooms.find({
                housing_building_id: buildingId,
            }).lean();
            const roomIds = rooms.map((room) => room.id);
            const statuses = await RoomDrawStatuses.find({
                housing_room_id: { $in: roomIds },
            }).lean();
            const sessionEmail = req.session.user?.email;
            const isSessionAdmin = Boolean(req.session.user?.isAdmin);

            const statusMap = statuses.reduce<
                Record<
                    number,
                    {
                        status: 'taken';
                        isOwner: boolean;
                        updatedAt?: Date;
                        markedByName?: string;
                        markedByEmail?: string;
                    }
                >
            >((acc, status) => {
                acc[status.housing_room_id] = {
                    status: 'taken',
                    isOwner: status.markedByEmail === sessionEmail,
                    updatedAt: status.updatedAt,
                };

                if (isSessionAdmin) {
                    acc[status.housing_room_id].markedByName =
                        status.markedByName;
                    acc[status.housing_room_id].markedByEmail =
                        status.markedByEmail;
                }

                return acc;
            }, {});

            res.json({ ...settings, statuses: statusMap });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   PATCH /api/campus/housing/room-draw/rooms/:roomId
 * @desc    Mark a room taken or not taken during room draw
 * @access  isAuthenticated
 */
router.patch(
    '/room-draw/rooms/:roomId',
    isAuthenticated,
    async (req: Request, res: Response) => {
        try {
            const settings = await getRoomDrawSettingsPayload();
            if (!settings.isVisible) {
                res.status(403).json({
                    message: 'Room draw reporting is not active',
                });
                return;
            }

            const roomId = parseInt(getParam(req.params.roomId), 10);
            if (isNaN(roomId)) {
                res.status(400).json({ message: 'Invalid room ID format' });
                return;
            }

            const room = await HousingRooms.findOne({ id: roomId });
            if (!room) {
                res.status(404).json({ message: 'Room not found' });
                return;
            }

            const requestedStatus = String(req.body.status || '');
            if (!['taken', 'not_taken', 'available'].includes(requestedStatus)) {
                res.status(400).json({
                    message: 'Status must be taken or not_taken',
                });
                return;
            }

            const sessionUser = req.session.user!;
            const existingStatus = await RoomDrawStatuses.findOne({
                housing_room_id: roomId,
            });

            if (
                existingStatus &&
                existingStatus.markedByEmail !== sessionUser.email &&
                !sessionUser.isAdmin
            ) {
                res.status(403).json({
                    message: 'Only the user who marked this room taken can change it',
                });
                return;
            }

            if (
                requestedStatus === 'not_taken' ||
                requestedStatus === 'available'
            ) {
                await RoomDrawStatuses.deleteOne({ housing_room_id: roomId });
                res.json({
                    roomId,
                    status: 'not_taken',
                    isOwner: false,
                    ...settings,
                });
                return;
            }

            let updatedStatus;
            if (existingStatus) {
                updatedStatus = await RoomDrawStatuses.findOneAndUpdate(
                    sessionUser.isAdmin
                        ? { housing_room_id: roomId }
                        : {
                              housing_room_id: roomId,
                              markedByEmail: sessionUser.email,
                          },
                    {
                        status: 'taken',
                        markedByEmail: sessionUser.email,
                        markedByName: getSessionUserName(sessionUser),
                    },
                    {
                        new: true,
                    }
                );
            } else {
                try {
                    updatedStatus = await RoomDrawStatuses.create({
                        housing_room_id: roomId,
                        status: 'taken',
                        markedByEmail: sessionUser.email,
                        markedByName: getSessionUserName(sessionUser),
                    });
                } catch (error) {
                    if (
                        typeof error === 'object' &&
                        error !== null &&
                        'code' in error &&
                        error.code === 11000
                    ) {
                        res.status(403).json({
                            message: 'This room was already marked taken by another user',
                        });
                        return;
                    }

                    throw error;
                }
            }

            if (!updatedStatus) {
                res.status(403).json({
                    message: 'Only the user who marked this room taken can change it',
                });
                return;
            }

            res.json({
                roomId,
                status: updatedStatus.status,
                isOwner: true,
                updatedAt: updatedStatus.updatedAt,
                ...(sessionUser.isAdmin
                    ? {
                          markedByName: updatedStatus.markedByName,
                          markedByEmail: updatedStatus.markedByEmail,
                      }
                    : {}),
                ...settings,
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /api/campus/housing/:building
 * @desc    Get housing building by id
 * @access  Public
 */
router.get(
    '/:building',
    async (req: Request, res: Response) => {
        try {
            // Get building id
            const buildingId = parseInt(getParam(req.params.building), 10);

            // Check if conversion is valid
            if (isNaN(buildingId)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            // Find building by id
            const buildingData = await HousingBuildings.findOne({
                id: buildingId,
            });
            if (!buildingData) {
                res.status(404).json({ message: 'Building not found' });
                return;
            }

            // Return building
            res.json(buildingData);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /campus/housing/:building/rooms
 * @desc    Get all roms in a building (by building id)
 * @access  Public
 */
router.get(
    '/:building/rooms',
    async (req: Request, res: Response) => {
        try {
            // Get building id
            const buildingId = parseInt(getParam(req.params.building), 10);

            // Check if conversion is valid
            if (isNaN(buildingId)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            // Get all rooms in the building
            const rooms = await HousingRooms.find({
                housing_building_id: buildingId,
            }).sort({ room_number: 1 });

            if (!rooms || rooms.length === 0) {
                res.status(404).json({ message: 'Rooms not found' });
                return;
            }

            res.json(rooms);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /api/campus/:room/reviews
 * @desc    Get housing reviews for a room
 * @access  isAuthenticated
 */
router.get(
    '/:room/reviews',
    isAuthenticated,
    async (req: Request, res: Response) => {
        try {
            // Get room id and convert it to a number
            const roomId = parseInt(getParam(req.params.room), 10);

            // Check if conversion is valid
            if (isNaN(roomId)) {
                res.status(400).json({ message: 'Invalid room ID format' });
                return;
            }

            // Find the room by room id
            const roomData = await HousingRooms.findOne({ id: roomId });

            if (!roomData) {
                res.status(404).json({ message: 'Room not found' });
                return;
            }

            // Get all reviews for the room
            const reviews = await HousingReviews.find({
                housing_room_id: roomId,
            }).lean();

            const sessionEmail = req.session.user!.email;
            const safeReviews = reviews.map(({ user_email, ...fields }) => ({
                ...fields,
                isOwner: user_email === sessionEmail,
            }));

            // Calculate average ratings
            if (reviews.length > 0) {
                const overallRatings = reviews
                    .map((r) => r.overall_rating)
                    .filter(Boolean) as number[];
                const quietRatings = reviews
                    .map((r) => r.quiet_rating)
                    .filter(Boolean) as number[];
                const layoutRatings = reviews
                    .map((r) => r.layout_rating)
                    .filter(Boolean) as number[];
                const temperatureRatings = reviews
                    .map((r) => r.temperature_rating)
                    .filter(Boolean) as number[];

                const calcAverage = (arr: number[]) =>
                    arr.length > 0
                        ? arr.reduce((sum, val) => sum + val, 0) / arr.length
                        : 0;

                const averages = {
                    overallAverage: calcAverage(overallRatings),
                    quietAverage: calcAverage(quietRatings),
                    layoutAverage: calcAverage(layoutRatings),
                    temperatureAverage: calcAverage(temperatureRatings),
                    reviewCount: reviews.length,
                };

                // Return reviews and averages as well as the room data itself
                res.json({
                    room: roomData,
                    reviews: safeReviews,
                    averages: averages,
                });
                return;
            }

            // Return reviews (even if empty)
            res.json({
                room: roomData,
                reviews: safeReviews,
                averages: {
                    overallAverage: 0,
                    quietAverage: 0,
                    layoutAverage: 0,
                    temperatureAverage: 0,
                    reviewCount: 0,
                },
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /api/campus/housing/:buildingId/:roomNumber/reviews
 * @desc    Get reviews for a room by building id and room number
 * @access  isAuthenticated
 */
router.get(
    '/:buildingId/:roomNumber/reviews',
    isAuthenticated,
    async (req: Request, res: Response) => {
        try {
            // Get room id and convert it to a number
            const buildingId = getParam(req.params.buildingId);
            const roomNumber = getParam(req.params.roomNumber);
            const buildingIdNumber = parseInt(buildingId, 10);

            // Find the room by building and room number
            if (isNaN(buildingIdNumber)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            const roomData = await HousingRooms.findOne({
                housing_building_id: buildingIdNumber,
                room_number: roomNumber,
            });

            if (!roomData) {
                res.status(404).json({ message: 'Room not found' });
                return;
            }

            // Get all reviews for the room using room id
            const reviews = await HousingReviews.find({
                housing_room_id: roomData.id,
            }).lean();

            const sessionEmail = req.session.user!.email;
            const safeReviews = reviews.map(({ user_email, ...fields }) => ({
                ...fields,
                isOwner: user_email === sessionEmail,
            }));

            // Calculate average ratings
            if (reviews.length > 0) {
                const overallRatings = reviews
                    .map((r) => r.overall_rating)
                    .filter(Boolean) as number[];
                const quietRatings = reviews
                    .map((r) => r.quiet_rating)
                    .filter(Boolean) as number[];
                const layoutRatings = reviews
                    .map((r) => r.layout_rating)
                    .filter(Boolean) as number[];
                const temperatureRatings = reviews
                    .map((r) => r.temperature_rating)
                    .filter(Boolean) as number[];

                const calcAverage = (arr: number[]) =>
                    arr.length > 0
                        ? arr.reduce((sum, val) => sum + val, 0) / arr.length
                        : 0;

                const averages = {
                    overallAverage: calcAverage(overallRatings),
                    quietAverage: calcAverage(quietRatings),
                    layoutAverage: calcAverage(layoutRatings),
                    temperatureAverage: calcAverage(temperatureRatings),
                    reviewCount: reviews.length,
                };

                // Return reviews and averages as well as the room data itself
                res.json({
                    room: roomData,
                    reviews: safeReviews,
                    averages: averages,
                });
                return;
            }

            // Return reviews (even if empty)
            res.json({
                room: roomData,
                reviews: safeReviews,
                averages: {
                    overallAverage: 0,
                    quietAverage: 0,
                    layoutAverage: 0,
                    temperatureAverage: 0,
                    reviewCount: 0,
                },
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   POST /api/campus/housing/:buildingId/:roomNumber/reviews
 * @desc    Add new housing room review
 * @access  isAuthenticated
 */
router.post(
    '/:buildingId/:roomNumber/reviews',
    isAuthenticated,
    upload.array('pictures'),
    async (req: Request, res: Response) => {
        try {
            const pictureIds: mongoose.mongo.ObjectId[] = [];

            // Upload each file to GridFS
            if (Array.isArray(req.files)) {
                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i] as Express.Multer.File;
                    const housingReviewPictures = getHousingReviewPictures();

                    // Create a writable stream to upload to GridFS
                    const uploadStream = housingReviewPictures.openUploadStream(
                        file.originalname,
                        {
                            contentType: file.mimetype,
                        }
                    );

                    // Upload the file buffer to GridFS
                    uploadStream.end(file.buffer);

                    // Wait for the file upload to finish and get the file ID
                    uploadStream.on('finish', () => {
                        pictureIds.push(uploadStream.id);
                    });

                    // Wait for the stream to finish before continuing
                    await new Promise((resolve) => {
                        uploadStream.on('finish', resolve);
                    });
                }
            }

            // need to find new max id for the new review
            const result = await HousingReviews.aggregate([
                {
                    $group: {
                        _id: null, // No need to group, so _id is null
                        maxValue: { $max: '$id' }, // Find the max value of fieldName
                    },
                },
            ]);

            const maxId = (result[0]?.maxValue || 0) + 1;

            // Find room id by building and room number
            const buildingId = getParam(req.params.buildingId);
            const roomNumber = getParam(req.params.roomNumber);
            const buildingIdNumber = parseInt(buildingId, 10);

            if (isNaN(buildingIdNumber)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            const roomData = await HousingRooms.findOne({
                housing_building_id: buildingIdNumber,
                room_number: roomNumber,
            });

            if (!roomData) {
                res.status(404).json({ message: 'Room not found' });
                return;
            }

            // parse review fields from request
            const { overall, quiet, layout, temperature, comments } = req.body;

            // construct review data
            const reviewData = {
                id: maxId,
                overall_rating: overall,
                quiet_rating: quiet,
                layout_rating: layout,
                temperature_rating: temperature,
                comments: comments,
                housing_room_id: roomData.id,
                user_email: req.session.user!.email,
                pictures: pictureIds,
            };

            const review = new HousingReviews(reviewData);
            await review.save();

            req.files = undefined; // free up memory
            res.status(201).json({ message: 'Review saved successfully' });
        } catch (error) {
            res.status(400).json({ message: 'Error creating member' });
        }
    }
);

/**
 * @route   PATCH /api/campus/housing/reviews/:id
 * @desc    Update housing review by review id
 * @access  isHousingReviewOwner
 */
router.patch(
    '/reviews/:reviewId',
    isHousingReviewOwner,
    upload.array('pictures'),
    async (req: Request, res: Response) => {
        try {
            if (!req.files && !req.body) {
                return;
            }

            const reviewId = Number(getParam(req.params.reviewId));
            const oldReview = await HousingReviews.findOne({ id: reviewId });

            if (!oldReview) {
                console.log('cant find old review');
                res.status(404).json({ message: 'Review not found' });
                return;
            }

            // parse review fields from request
            const { overall, quiet, layout, temperature, comments } = req.body;

            // construct review data
            let updateData = {
                overall_rating: overall,
                quiet_rating: quiet,
                layout_rating: layout,
                temperature_rating: temperature,
                comments: comments,
                pictures: oldReview.pictures,
            };

            const pictureIds: mongoose.mongo.ObjectId[] = [];

            if (Array.isArray(req.files) && req.files.length > 0) {
                // if new pictures provided, delete old pictures from database
                if (oldReview.pictures && oldReview.pictures.length > 0) {
                    for (const pictureId of oldReview.pictures) {
                        const oldPictureId = new mongoose.mongo.ObjectId(
                            pictureId
                        );
                        const housingReviewPictures =
                            getHousingReviewPictures();
                        console.log(
                            `Deleting image with ObjectId: ${oldPictureId}`
                        );

                        await housingReviewPictures.delete(oldPictureId);
                        console.log(
                            `Image with ObjectId ${oldPictureId} deleted from GridFS`
                        );
                    }
                }

                for (let i = 0; i < req.files.length; i++) {
                    const file = req.files[i] as Express.Multer.File;
                    const housingReviewPictures = getHousingReviewPictures();

                    // Create a writable stream to upload to GridFS
                    const uploadStream = housingReviewPictures.openUploadStream(
                        file.originalname,
                        {
                            contentType: file.mimetype,
                        }
                    );

                    // Upload the file buffer to GridFS
                    uploadStream.end(file.buffer);

                    // Wait for the file upload to finish and get the file ID
                    uploadStream.on('finish', () => {
                        pictureIds.push(uploadStream.id);
                    });

                    // Wait for the stream to finish before continuing
                    await new Promise((resolve) => {
                        uploadStream.on('finish', resolve);
                    });
                }

                updateData.pictures = pictureIds;
            }

            const updatedReview = await HousingReviews.findOneAndUpdate(
                { id: reviewId },
                updateData,
                { new: true }
            );
            res.status(200).json({
                message: 'Review updated',
                updatedReview,
            });
        } catch (error) {
            console.error('update error: ', error);
            res.status(400).json({ message: 'Error updating review' });
        }
    }
);

/**
 * @route   DELETE /api/campus/housing/reviews/:id
 * @desc    Delete housing room review
 * @access  isHousingReviewOwner
 */
router.delete(
    '/reviews/:reviewId',
    isHousingReviewOwner,
    async (req: Request, res: Response) => {
        try {
            const review = await HousingReviews.findOneAndDelete({
                id: Number(getParam(req.params.reviewId)),
            });

            if (!review) {
                res.status(404).json({ message: 'Review not found' });
                return;
            }

            res.status(200).json({ message: 'Review deleted' });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

/**
 * @route   GET /api/campus/housing/review_pictures/:id
 * @desc    Get review picture by id
 * @access  isAuthenticated
 */
router.get(
    '/review_pictures/:id',
    isAuthenticated,
    async (req: Request, res: Response) => {
        try {
            const fileId = new mongoose.mongo.ObjectId(getParam(req.params.id));
            const housingReviewPictures = getHousingReviewPictures();

            // Check if file exists
            const files = await housingReviewPictures
                .find({ _id: fileId })
                .toArray();
            if (!files.length) {
                res.status(404).json({ message: 'Profile picture not found' });
                return;
            }

            // Set appropriate headers
            res.set('Content-Type', files[0].contentType);

            // Create download stream
            const downloadStream =
                housingReviewPictures.openDownloadStream(fileId);

            // Pipe the file to the response
            downloadStream.pipe(res);

            downloadStream.on('error', () => {
                res.status(404).json({
                    message: 'Error retrieving profile picture',
                });
            });
        } catch (error) {
            res.status(400).json({ message: 'Invalid profile picture ID' });
        }
    }
);

/**
 * @route   GET /api/campus/housing/:building/ratings
 * @desc    Get ratings for all rooms in a building
 * @access  isAuthenticated
 */
router.get(
    '/:building/ratings',
    isAuthenticated,
    async (req: Request, res: Response) => {
        try {
            const buildingId = parseInt(getParam(req.params.building), 10);
            if (isNaN(buildingId)) {
                res.status(400).json({ message: 'Invalid building ID format' });
                return;
            }

            // Get all rooms for the building
            const rooms = await HousingRooms.find({
                housing_building_id: buildingId,
            });
            if (!rooms || rooms.length === 0) {
                res.json({});
                return;
            }

            const roomIds = rooms.map((r) => r.id);

            // Fetch all reviews for all rooms in one query
            const allReviews = await HousingReviews.find({
                housing_room_id: { $in: roomIds },
            });

            // Group reviews by room id and calculate averages
            const calcAverage = (arr: number[]) =>
                arr.length > 0
                    ? arr.reduce((sum, val) => sum + val, 0) / arr.length
                    : 0;

            const ratingsMap: Record<
                number,
                { overallAverage: number; reviewCount: number }
            > = {};

            for (const room of rooms) {
                const roomReviews = allReviews.filter(
                    (r) => r.housing_room_id === room.id
                );
                const overallRatings = roomReviews
                    .map((r) => r.overall_rating)
                    .filter(Boolean) as number[];
                ratingsMap[room.id] = {
                    overallAverage: calcAverage(overallRatings),
                    reviewCount: roomReviews.length,
                };
            }

            res.json(ratingsMap);
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
