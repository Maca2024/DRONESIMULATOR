import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn(() => 0);
Object.defineProperty(global, 'performance', {
  value: {
    now: mockPerformanceNow,
  },
  writable: true,
});

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
