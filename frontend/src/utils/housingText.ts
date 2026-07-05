import { Building } from '@/types';

type BuildingText = Pick<Building, 'name' | 'description'>;

export const getBuildingSlug = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const getBuildingImagePath = (name: string) =>
    `/buildings/${getBuildingSlug(name)}.jpg`;

const buildingFloorPlans: Record<string, string[]> = {
    '240-house': ['240-house.jpg'],
    '709-house': ['709-house.jpg'],
    browning: ['browning-1.jpg', 'browning-2.jpg', 'browning-3.jpg'],
    clark: ['clark-1.jpg', 'clark-2.jpg'],
    'clark-north': ['clark-north.jpg'],
    dorsey: ['dorsey-1.jpg', 'dorsey-2.jpg'],
    frankel: ['frankel.jpg'],
    gjw: ['gjw-1.jpg', 'gjw-2.jpg', 'gjw-3.jpg'],
    kimbo: ['kimbo-1.jpg', 'kimbo-2.jpg'],
    'revelle-house': ['revelle-house.jpg'],
    routt: ['routt.jpg'],
    schow: ['schow-1.jpg', 'schow-2.jpg', 'schow-3.jpg'],
    'senior-routt-apartments': ['senior-routt-apartments.jpg'],
    toll: ['toll-1.jpg', 'toll-2.jpg', 'toll-3.jpg', 'toll-north.jpg'],
    wilbur: ['wilbur.jpg'],
};

export const getBuildingFloorPlanPaths = (name: string) =>
    (buildingFloorPlans[getBuildingSlug(name)] || []).map(
        (filename) => `/floors/${filename}`
    );

export const getBuildingDisplayDescription = (building: BuildingText) => {
    const description = building.description?.trim();
    if (!description || /spreadsheet|imported/i.test(description)) {
        return `Room information and student reviews for ${building.name}.`;
    }

    return description;
};
