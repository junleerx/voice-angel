/**
 * Tests for the /api/translate route.
 */

import { NextRequest } from 'next/server';

// Mock fetch for Google Translate API
global.fetch = jest.fn();

process.env.TRANSLATION_PROVIDER = 'google';
process.env.GOOGLE_TRANSLATE_API_KEY = 'test-google-key';

import { POST } from '@/app/api/translate/route';

describe('POST /api/translate', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockReset();
  });

  it('returns error for empty text', async () => {
    const request = new NextRequest('http://localhost/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: '' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns error for invalid JSON', async () => {
    const request = new NextRequest('http://localhost/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json',
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('translates text via Google Translate', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          translations: [
            { translatedText: '안녕 세상', detectedSourceLanguage: 'en' },
          ],
        },
      }),
    });

    const request = new NextRequest('http://localhost/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello world', targetLanguage: 'ko' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.translatedText).toBe('안녕 세상');
    expect(body.sourceLanguage).toBe('en');
    expect(body.targetLanguage).toBe('ko');
  });

  it('returns 500 when Google Translate fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: 'API key invalid' },
      }),
    });

    const request = new NextRequest('http://localhost/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Hello', targetLanguage: 'ko' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });
});
