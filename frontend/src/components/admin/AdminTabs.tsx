'use client';

import Link from 'next/link';

type AdminTabsProps = {
    activeTab: 'housing-data' | 'room-draw';
};

const tabs = [
    {
        id: 'housing-data',
        label: 'Housing Data',
        href: '/admin/housing-data',
    },
    {
        id: 'room-draw',
        label: 'Room Draw',
        href: '/admin/room-draw',
    },
] as const;

export default function AdminTabs({ activeTab }: AdminTabsProps) {
    return (
        <nav className="mb-8 flex gap-2 border-b border-sas-line pb-3">
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;

                return (
                    <Link
                        key={tab.id}
                        href={tab.href}
                        className={`flex-1 rounded-md px-4 py-2 text-center text-sm font-medium transition-all duration-200 ease-smooth sm:flex-none sm:text-left ${
                            isActive
                                ? 'bg-sas-green text-sas-white shadow-sm'
                                : 'border border-sas-line bg-sas-white text-sas-black hover:border-sas-green hover:text-sas-green'
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
