import { NextRequest, NextResponse } from 'next/server';
import { extractText, extractKeyFields, needsFallback, OCRResult } from '@/lib/ocr/tesseract';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File | Blob | null;

    if (!image) {
      return NextResponse.json(
        { error: 'Kein Bild vorhanden. Bitte laden Sie ein Bild hoch.' },
        { status: 400 }
      );
    }

    console.log(`[OCR] Received image: type=${image.constructor.name}, size=${image.size || 'unknown'}`);

    // Validate file
    if (image instanceof File) {
      console.log(`[OCR] File type: ${image.type}, size: ${image.size}`);
      if (!ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          { error: 'Ungültiges Dateiformat. Erlaubt: JPEG, PNG, TIFF, WebP' },
          { status: 400 }
        );
      }

      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Datei ist zu groß. Maximale Größe: 10MB' },
          { status: 400 }
        );
      }
    } else if (image instanceof Blob) {
      console.log(`[OCR] Blob type: ${image.type}, size: ${image.size}`);
      // Allow blobs without explicit type from mobile browsers
      if (!image.type && image.size > 0) {
        console.log('[OCR] Blob has no MIME type, will attempt to process');
      }
    }

    // Perform OCR
    const result = await extractText(image);

    // Check if we need fallback (low confidence)
    const requiresFallback = needsFallback(result);

    // Extract key fields from the text
    const keyFields = extractKeyFields(result.text);

    const response: OCRResponse = {
      text: result.text,
      confidence: result.confidence,
      wordCount: result.words.length,
      processingTime: result.processingTime,
      keyFields,
      requiresFallback,
      status: requiresFallback ? 'low_confidence' : 'success',
    };

    console.log(`[OCR] Completed: ${result.confidence.toFixed(1)}% confidence, ${result.words.length} words`);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[OCR] Error:', error);
    return NextResponse.json(
      { error: 'OCR-Verarbeitung fehlgeschlagen. Bitte versuchen Sie es erneut.' },
      { status: 500 }
    );
  }
}

interface OCRResponse {
  text: string;
  confidence: number;
  wordCount: number;
  processingTime: number;
  keyFields: {
    datum?: string;
    aktenzeichen?: string;
    absender?: string;
  };
  requiresFallback: boolean;
  status: 'success' | 'low_confidence';
}
