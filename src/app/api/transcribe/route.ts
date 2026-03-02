/**
 * POST /api/transcribe
 *
 * Proxies audio data to the OpenAI Whisper API for speech-to-text.
 * Accepts multipart/form-data with an 'audio' file field.
 * API key is kept server-side only.
 *
 * Request body (FormData):
 *   audio: Blob  - audio data (webm, mp4, ogg, etc.)
 *
 * Response (JSON):
 *   { text, language, confidence, segments }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { TranscribeApiResponse } from '@/types/transcript';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OpenAI API key is not configured' },
      { status: 500 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audioFile = formData.get('audio');
  if (!(audioFile instanceof Blob)) {
    return NextResponse.json({ error: 'Audio file is required' }, { status: 400 });
  }

  // Validate file size (Whisper limit: 25 MB)
  if (audioFile.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Audio file exceeds 25 MB limit' }, { status: 413 });
  }

  // OpenAI SDK expects a File object
  const audioAsFile = new File([audioFile], 'audio.webm', { type: audioFile.type || 'audio/webm' });

  try {
    const response = await openai.audio.transcriptions.create({
      file: audioAsFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    });

    const result: TranscribeApiResponse = {
      text: response.text,
      language: response.language ?? 'en',
      confidence: calculateAverageConfidence(response),
      segments: response.segments?.map((s) => ({
        id: s.id,
        start: s.start,
        end: s.end,
        text: s.text,
        confidence: s.avg_logprob ? Math.exp(s.avg_logprob) : 0.9,
      })),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('[transcribe] Whisper API error:', err);

    if (err instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: err.message, code: err.status },
        { status: err.status ?? 500 }
      );
    }

    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}

function calculateAverageConfidence(
  response: OpenAI.Audio.Transcriptions.TranscriptionVerbose
): number {
  if (!response.segments || response.segments.length === 0) return 0.9;
  const total = response.segments.reduce(
    (sum, s) => sum + (s.avg_logprob ? Math.exp(s.avg_logprob) : 0.9),
    0
  );
  return total / response.segments.length;
}
