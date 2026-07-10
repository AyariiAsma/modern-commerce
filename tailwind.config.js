/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Outfit', 'Inter', 'sans-serif'],
            },
            width: {
                '68': '17rem'
            },
            colors: {
                slate: {
                    350: '#b8c5de',
                    450: '#8c9ab8',
                    550: '#64748b',
                    655: '#475569',
                    850: '#1e293b',
                    905: '#0f172a'
                },
                indigo: {
                    650: '#4f46e5',
                    150: '#c7d2fe'
                },
                blue: {
                    105: '#dbeafe'
                }
            }
        },
    },
    plugins: [],
}
