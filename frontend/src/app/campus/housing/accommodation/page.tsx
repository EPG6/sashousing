import HousingInfoLayout from '@/components/housing/HousingInfoLayout';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Housing Accommodation | SAS Housing Platform',
    description:
        'Learn about housing accommodations and residential life options at Scripps College.',
};

export default function HousingAccommodationPage() {
    return (
        <HousingInfoLayout
            title="Housing Accommodation"
            heroImage={{
                src: '/housing/accommodation-hero.jpg',
                alt: 'Scripps College residence hall exterior',
            }}
        >
            <p>
                Scripps College offers a range of housing accommodations designed
                to foster community and support students&apos; academic and
                personal growth. With a variety of dormitories, including
                traditional residence halls, apartment-style living, and language
                specific halls, students have the opportunity to live in a
                supportive, inclusive environment.
            </p>
            <p>
                Each housing option provides a unique living experience, from
                quiet study spaces to vibrant social settings. Students are
                encouraged to engage with their peers and create lasting
                connections through these close-knit living arrangements.
                Scripps is committed to offering a safe, comfortable, and
                engaging home away from home for all its students.
            </p>
            <p>
                For more information go to the{' '}
                <Link
                    href="https://inside.scrippscollege.edu/reslife/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Residential Life website
                </Link>
                , which includes important forms, links, and contact information
                for ResLife.
            </p>
        </HousingInfoLayout>
    );
}
