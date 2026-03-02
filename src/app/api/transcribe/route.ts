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
import type { TranscribeApiResponse } from '@/types/transcript';

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

  try {
    const uploadForm = new FormData();
    uploadForm.append('file', new File([audioFile], 'audio.webm', { type: audioFile.type || 'audio/webm' }));
    uploadForm.append('model', 'whisper-1');
    uploadForm.append('response_format', 'verbose_json');
    uploadForm.append('timestamp_granularities[]', 'segment');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: uploadForm,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error('[transcribe] Whisper API error:', response.status, errBody);
      return NextResponse.json(
        { error: errBody?.error?.message ?? `Whisper HTTP ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    const result: TranscribeApiResponse = {
      text: data.text,
      language: data.language ?? 'en',
      confidence: calculateAverageConfidence(data.segments),
      segments: data.segments?.map((s: { id: number; start: number; end: number; text: string; avg_logprob?: number }) => ({
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
    return NextResponse.json({ error: 'Transcription failed' }, { status: 500 });
  }
}

function calculateAverageConfidence(segments?: Array<{ avg_logprob?: number }>): number {
  if (!segments || segments.length === 0) return 0.9;
  const total = segments.reduce(
    (sum, s) => sum + (s.avg_logprob ? Math.exp(s.avg_logprob) : 0.9),
    0
  );
  return total / segments.length;
}
