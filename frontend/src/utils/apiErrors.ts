const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const USER_SAFE_MESSAGES = new Set([
    'Authentication required',
    'Admin access required',
    'You are not authorized to modify this review',
    'Review not found',
    'Invalid building ID format',
    'Building name is required',
    'Campus is required',
    'Floors must be a positive whole number',
    'Eligible year must be 1, 2, 3, or 4',
    'A building with that name already exists',
    'Invalid room ID format',
    'Room number is required',
    'Building ID must be a number',
    'Building not found',
    'Floor must be a positive whole number',
    'Room not found',
    'Room draw priority is only available during room draw',
    'Year must be a number from 1 to 4',
    'Draw date is required',
    'Invalid date format',
    'Start time must be before end time',
    'Room draw reporting is not active',
    'Enter your draw priority before using room draw',
    'Status must be taken or not_taken',
    'Only the user who marked this room taken can change it',
    'You can only mark one room taken at a time',
    'This room was already marked taken by another user',
    'Room ranking is only available during room draw',
    'Enter your draw priority before using room ranking',
    'Preference lists can include up to 20 rooms',
    'You can rank up to 2 rooms',
    'A room can only appear once in your ranking',
    'One or more rooms were not found',
    'You can only save rooms you currently hold',
    'Room is already in your preferences',
    'Room is already ranked by someone with a better draw time',
    'Room is already ranked by someone with better priority',
    'Overall rating is required',
    'Quiet rating is required',
    'Layout rating is required',
    'Temperature rating is required',
    'Ratings must be whole numbers from 1 to 5',
    'Please leave a comment',
    'Review saved successfully',
    'Review updated',
    'Review deleted',
]);

export const getUserSafeMessage = (
    value: unknown,
    fallback = GENERIC_ERROR_MESSAGE
) => {
    if (typeof value !== 'string') {
        return fallback;
    }

    const message = value.trim();
    if (USER_SAFE_MESSAGES.has(message)) {
        return message;
    }

    return fallback;
};

export const getApiErrorMessage = async (
    response: Response,
    fallback = GENERIC_ERROR_MESSAGE
) => {
    const data = await response.json().catch(() => null);
    return getUserSafeMessage(data?.message, fallback);
};
