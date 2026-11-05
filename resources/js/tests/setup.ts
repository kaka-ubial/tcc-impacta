import '@testing-library/jest-dom/vitest';
import { cleanup, configure } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import * as inertia from './inertia-mock';

vi.mock('@inertiajs/react', () => inertia);
beforeEach(() => {
    inertia.setPage();
    inertia.formBehavior.mode = 'success';
    inertia.formCalls.length = 0;
    inertia.formSubmits.length = 0;
    Object.values(inertia.router).forEach((f) => (f as any).mockClear?.());
});

configure({ testIdAttribute: 'data-test' });
afterEach(() => cleanup());

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }),
});

class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
}
(globalThis as any).ResizeObserver = RO;
(globalThis as any).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
        return [];
    }
};
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
window.scrollTo = vi.fn() as any;

vi.mock('maplibre-gl', () => {
    const chain = () => {
        const o: any = {};

        for (const m of [
            'setLngLat',
            'setPopup',
            'addTo',
            'setText',
            'togglePopup',
            'remove',
        ]) {
            o[m] = vi.fn(() => o);
        }

        return o;
    };

    return {
        setWorkerUrl: vi.fn(),
        MapLibreMap: vi.fn(function () {
            return {
                addControl: vi.fn(),
                once: vi.fn((_e: string, cb: () => void) => cb()),
                setStyle: vi.fn(),
                remove: vi.fn(),
            };
        }),
        Marker: vi.fn(function () {
            return chain();
        }),
        Popup: vi.fn(function () {
            return chain();
        }),
        NavigationControl: vi.fn(),
    };
});
vi.mock('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url', () => ({
    default: 'worker.js',
}));
