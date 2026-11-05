import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': path.resolve(__dirname, 'resources/js') },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['resources/js/tests/setup.ts'],
        include: ['resources/js/**/*.test.{ts,tsx}'],
        css: false,
        coverage: {
            provider: 'v8',
            reporter: ['text-summary', 'text', 'html', 'lcov'],
            reportsDirectory: 'coverage/frontend',
            include: ['resources/js/**/*.{ts,tsx}'],
            exclude: [
                'resources/js/actions/**',
                'resources/js/routes/**',
                'resources/js/wayfinder/**',
                'resources/js/types/**',
                'resources/js/tests/**',
                'resources/js/**/*.test.{ts,tsx}',
                'resources/js/app.tsx',
                'resources/js/ssr.tsx',
            ],
            thresholds: {
                lines: 75,
                statements: 75,
                functions: 75,
                branches: 75,
            },
        },
    },
});
