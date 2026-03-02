/**
 * Tests for the /api/transcribe route.
 */

import { NextRequest } from 'next/server';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      audio: {
        transcriptions: {
          create: jest.fn().mockResolvedValue({
            text: 'Hello world',
            language: 'en',
            segments: [
              { id: 0, start: 0, end: 2, text: 'Hello world', avg_logprob: -0.1 },
            ],
          }),
        },
      },
    })),
    APIError: class APIError extends Error {
      status: number;
      constructor(message: string, status: number) {
        super(message);
        this.status = status;
      }
    },
  };
});

// Set env var before importing route
process.env.OPENAI_API_KEY = 'test-api-key';

import { POST } from '@/app/api/transcribe/route';

describe('POST /api/transcribe', () => {
  it('returns error when no audio provided', async () => {
    const formData = new FormData();
    const request = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeTruthy();
  });

  it('transcribes audio successfully', async () => {
    const formData = new FormData();
    const audioBlob = new Blob(['fake audio data'], { type: 'audio/webm' });
    formData.append('audio', audioBlob, 'audio.webm');

    const request = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.text).toBe('Hello world');
    expect(body.language).toBe('en');
  });

  it('returns 413 for oversized audio', async () => {
    const formData = new FormData();
    // Create a mock blob that reports size > 25MB
    const bigBlob = new Blob(['x'.repeat(100)], { type: 'audio/webm' });
    Object.defineProperty(bigBlob, 'size', { value: 26 * 1024 * 1024 });
    formData.append('audio', bigBlob, 'big.webm');

    const request = new NextRequest('http://localhost/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    expect(response.status).toBe(413);
  });
});
