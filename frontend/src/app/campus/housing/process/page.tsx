import HousingInfoLayout from '@/components/housing/HousingInfoLayout';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Housing Process | SAS Housing Platform',
    description:
        'Learn how to complete your Scripps College housing application and access the housing portal.',
};

export default function HousingProcessPage() {
    return (
        <HousingInfoLayout
            title="Housing Process"
            description="How to apply for on-campus housing at Scripps College."
        >
            <p>
                Scripps College sponsored housing is comprised of traditional res
                halls, houses, and apartment style living. The housing
                information is released at around the end of March, and all
                students enrolled for the upcoming academic year must complete
                a housing application.
            </p>
            <p>
                Room types are comprised of triples, doubles, and limited
                single spaces. Students who are enrolled full-time, are within
                their first 8 semesters of their start at Scripps College, and
                meet all housing application deadlines are prioritized for a
                housing placement.
            </p>

            <div className="overflow-hidden rounded-md border border-sas-line">
                <Image
                    src="/housing/process-room.jpg"
                    alt="Scripps College residence hall room"
                    width={1200}
                    height={800}
                    className="h-auto w-full object-cover"
                />
            </div>

            <p>
                Students who miss the housing application deadline and want to be
                considered for housing can complete a late application, and are
                placed on a housing waitlist. Waitlisted students are typically
                placed over the summer. Placement location and room type are
                based on availability and are not guaranteed.
            </p>

            <h2 className="font-display text-xl font-semibold text-sas-black sm:text-2xl">
                Housing Portal Steps
            </h2>
            <p>
                To access the portal, visit the{' '}
                <Link
                    href="https://scripps.starrezhousing.com/StarRezPortalX"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                    Housing Portal Website
                </Link>
                :
            </p>
            <ol className="list-decimal space-y-2 pl-5">
                <li>Click on Login – upper right corner of the main page</li>
                <li>
                    Click on Scripps Student SSO Login on the bottom of the
                    login page
                </li>
                <li>
                    Once logged in, beginning March 25, click on the
                    Housing/Dining Application on the top bar
                </li>
                <li>
                    Select the application for the current term (it should be
                    the only application visible to you)
                </li>
                <li>
                    Begin the application and follow through step by step
                    (Note: The application will not begin until the official
                    opening date)
                </li>
                <li>Once a student has completed:</li>
            </ol>
            <ul className="list-disc space-y-2 pl-5">
                <li>
                    Step 1, including signing the housing contract and
                    completing your roommate questionnaire, your housing
                    application is time stamped with its completed date.
                    Applications received after the deadline are marked as Late
                    and follow the late application waitlist process.
                </li>
                <li>
                    Step 2 (Roommate Matching) remains open to you through the
                    remaining room selection process.
                </li>
                <li>
                    Step 3 (Room selection and meal plans) opens up to you at
                    your assigned selection date/time.
                </li>
            </ul>
        </HousingInfoLayout>
    );
}
