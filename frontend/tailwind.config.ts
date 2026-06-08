import type { Config } from 'tailwindcss';

export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                sas: {
                    black: '#191919',
                    white: '#FFFFFF',
                    green: '#3b561e',
                    mist: '#f6f7f3',
                    line: '#d8ddcf',
                },
            },
            keyframes: {
                'page-in': {
                    from: { opacity: '0', transform: 'translateY(8px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'page-in': 'page-in 0.3s ease-out',
            },
            transitionTimingFunction: {
                smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            },
            fontFamily: {
                sans: [
                    'ITC Franklin Gothic Lt',
                    'Helvetica Now Condensed',
                    'Arial Narrow',
                    'Arial',
                    'sans-serif',
                ],
                display: [
                    'Traditional Arabic',
                    'ITC Franklin Gothic Lt',
                    'Helvetica Now Condensed',
                    'Arial',
                    'sans-serif',
                ],
            },
        },
    },
    plugins: [],
} satisfies Config;
