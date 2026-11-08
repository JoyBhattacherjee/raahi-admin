import '@testing-library/jest-dom/vitest';
import { cloneElement } from 'react';
import { vi } from 'vitest';

// jsdom has no layout engine, so Recharts' ResponsiveContainer measures 0×0.
// Give charts a fixed size in tests so they actually render.
vi.mock('recharts', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    ResponsiveContainer: ({ children }) => cloneElement(children, { width: 600, height: 300 }),
  };
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = globalThis.ResizeObserver || ResizeObserverStub;
window.scrollTo = () => {};
