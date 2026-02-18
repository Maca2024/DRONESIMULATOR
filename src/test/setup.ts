import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage for zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

// Mock performance.now for consistent testing
let mockTime = 0;
const mockPerformanceNow = vi.fn(() => mockTime);
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

// Helper to advance mock time (exported for tests that need it)
(global as Record<string, unknown>).__setMockTime = (t: number) => { mockTime = t; };
(global as Record<string, unknown>).__advanceMockTime = (dt: number) => { mockTime += dt; };

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback): number => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
};

global.cancelAnimationFrame = (id: number): void => {
  clearTimeout(id);
};

// Mock navigator.getGamepads
Object.defineProperty(navigator, 'getGamepads', {
  value: () => [],
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

// Mock WebGL context
HTMLCanvasElement.prototype.getContext = function (contextId: string) {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return {
      createShader: () => ({}),
      shaderSource: () => {},
      compileShader: () => {},
      getShaderParameter: () => true,
      createProgram: () => ({}),
      attachShader: () => {},
      linkProgram: () => {},
      getProgramParameter: () => true,
      useProgram: () => {},
      getUniformLocation: () => ({}),
      getAttribLocation: () => 0,
      enableVertexAttribArray: () => {},
      createBuffer: () => ({}),
      bindBuffer: () => {},
      bufferData: () => {},
      vertexAttribPointer: () => {},
      viewport: () => {},
      clearColor: () => {},
      clear: () => {},
      drawArrays: () => {},
      getExtension: () => null,
      getParameter: () => '',
      createTexture: () => ({}),
      bindTexture: () => {},
      texImage2D: () => {},
      texParameteri: () => {},
      enable: () => {},
      disable: () => {},
      blendFunc: () => {},
      depthFunc: () => {},
      cullFace: () => {},
      frontFace: () => {},
      createFramebuffer: () => ({}),
      bindFramebuffer: () => {},
      framebufferTexture2D: () => {},
      checkFramebufferStatus: () => 36053, // FRAMEBUFFER_COMPLETE
    } as unknown as WebGLRenderingContext;
  }
  return null;
} as typeof HTMLCanvasElement.prototype.getContext;
