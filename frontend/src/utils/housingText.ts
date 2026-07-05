import { Building } from '@/types';

type BuildingText = Pick<Building, 'name' | 'description'>;

export const getBuildingSlug = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

export const getBuildingImagePath = (name: string) =>
    `/buildings/${getBuildingSlug(name)}.jpg`;

export const getBuildingDisplayDescription = (building: BuildingText) => {
    const description = building.description?.trim();
    if (!description || /spreadsheet|imported/i.test(description)) {
        return `Room information and student reviews for ${building.name}.`;
    }

    return description;
};
