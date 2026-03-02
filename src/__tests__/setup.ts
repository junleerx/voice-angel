import '@testing-library/jest-dom';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  state: 'inactive',
  mimeType: 'audio/webm',
  ondataavailable: null as ((event: BlobEvent) => void) | null,
  onstop: null as (() => void) | null,
  onerror: null as ((event: Event) => void) | null,
  isTypeSupported: jest.fn().mockReturnValue(true),
};

Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: jest.fn().mockImplementation(() => mockMediaRecorder),
});

(global.MediaRecorder as unknown as { isTypeSupported: jest.Mock }).isTypeSupported = jest
  .fn()
  .mockReturnValue(true);

// Mock navigator.mediaDevices
Object.defineProperty(global.navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: jest.fn().mockReturnValue([{ stop: jest.fn() }]),
    }),
  },
});

// Mock AudioContext
class MockAudioContext {
  createMediaStreamSource() {
    return { connect: jest.fn() };
  }
  createAnalyser() {
    return {
      fftSize: 256,
      smoothingTimeConstant: 0,
      frequencyBinCount: 128,
      getByteFrequencyData: jest.fn(),
      connect: jest.fn(),
    };
  }
  close() {
    return Promise.resolve();
  }
}

Object.defineProperty(global, 'AudioContext', {
  writable: true,
  value: MockAudioContext,
});

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});
global.cancelAnimationFrame = jest.fn();

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  },
});

// Mock IndexedDB (via fake-indexeddb would be better, but use this minimal mock)
global.indexedDB = {
  open: jest.fn(),
} as unknown as IDBFactory;
