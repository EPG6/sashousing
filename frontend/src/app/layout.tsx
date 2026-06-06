import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
    title: 'SA Housing Reviews',
    description: 'Standalone housing reviews for rooms and residence halls.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
                <Analytics />
            </body>
        </html>
    );
}
