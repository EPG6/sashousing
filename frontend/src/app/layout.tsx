import type { Metadata } from 'next';
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
            <body>{children}</body>
        </html>
    );
}
