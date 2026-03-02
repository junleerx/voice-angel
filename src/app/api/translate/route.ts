/**
 * POST /api/translate
 *
 * Proxies text translation using Google Cloud Translation API or DeepL.
 * The translation provider is configured via TRANSLATION_PROVIDER env var.
 *
 * Request body (JSON):
 *   { text: string, targetLanguage?: string }
 *
 * Response (JSON):
 *   { translatedText, sourceLanguage, targetLanguage }
 */

import { NextRequest, NextResponse } from 'next/server';
import type { TranslateApiResponse } from '@/types/transcript';

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: { text?: string; targetLanguage?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, targetLanguage = 'ko' } = body;

  if (!text || text.trim().length === 0) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  const provider = process.env.TRANSLATION_PROVIDER ?? 'google';

  try {
    let result: TranslateApiResponse;

    if (provider === 'deepl') {
      result = await translateWithDeepL(text, targetLanguage);
    } else {
      result = await translateWithGoogle(text, targetLanguage);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[translate] Translation API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Translation failed' },
      { status: 500 }
    );
  }
}

async function translateWithGoogle(
  text: string,
  targetLanguage: string
): Promise<TranslateApiResponse> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_TRANSLATE_API_KEY is not configured');

  const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target: targetLanguage, format: 'text' }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message ?? `Google Translate HTTP ${res.status}`);
  }

  const data = await res.json();
  const translation = data.data?.translations?.[0];

  return {
    translatedText: translation?.translatedText ?? '',
    sourceLanguage: translation?.detectedSourceLanguage ?? 'en',
    targetLanguage,
  };
}

async function translateWithDeepL(
  text: string,
  targetLanguage: string
): Promise<TranslateApiResponse> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) throw new Error('DEEPL_API_KEY is not configured');

  // DeepL uses KO for Korean
  const deeplTarget = targetLanguage.toUpperCase();

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: [text], target_lang: deeplTarget }),
  });

  if (!res.ok) {
    throw new Error(`DeepL HTTP ${res.status}`);
  }

  const data = await res.json();
  const translation = data.translations?.[0];

  return {
    translatedText: translation?.text ?? '',
    sourceLanguage: translation?.detected_source_language?.toLowerCase() ?? 'en',
    targetLanguage,
  };
}
