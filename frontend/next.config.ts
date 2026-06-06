import type { NextConfig } from 'next';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
const backendHostname = (() => {
    try {
        return new URL(backendUrl).hostname;
    } catch {
        return 'localhost';
    }
})();

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: backendUrl.startsWith('https') ? 'https' : 'http',
                hostname: backendHostname,
                pathname: '/api/**',
            },
        ],
    },
};

export default nextConfig;
