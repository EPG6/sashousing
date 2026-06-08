import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import SiteFooter from '@/components/SiteFooter';
import './globals.css';

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    title: 'SA Housing Plaform',
    description: 'Review Rooms. View Room Status.',
    icons: {
        icon: '/logos/saslogo.png',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="flex min-h-screen flex-col">
                {children}
                <SiteFooter />
                <Analytics />
            </body>
        </html>
    );
}
