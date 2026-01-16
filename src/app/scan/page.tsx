'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { useFileUpload } from '@/hooks/useCamera';
import { DocumentScanner } from '@/components/scanner/DocumentScanner';
import { ArrowRight, Camera, Upload, RefreshCw, Check, AlertCircle } from 'lucide-react';

export default function ScannerPage() {
  const router = useRouter();
  const { profile, isOnboarded } = useUserStore();
  const [mode, setMode] = useState<'smart' | 'upload' | 'preview'>('smart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{
    text: string;
    confidence: number;
  } | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const {
    file,
    preview,
    error: uploadError,
    handleFileSelect,
    clearFile,
  } = useFileUpload();

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isOnboarded) {
      router.push('/onboarding');
    }
  }, [hydrated, isOnboarded, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-muted-foreground">Laden...</div>
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-muted-foreground">Weiterleitung...</div>
      </div>
    );
  }

  const handleCameraCapture = async (imageData: string) => {
    await processImageDataUrl(imageData);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    handleFileSelect(e);
    setMode('preview');
    setIsProcessing(true);

    await processImageFromFile(selectedFile);
  };

  const processImageFromFile = async (file: File) => {
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file, file.name);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR failed');
      }

      const result = await response.json();
      setOcrResult({
        text: result.text,
        confidence: result.confidence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const processImageDataUrl = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      const blob = await fetch(imageData).then(r => r.blob());
      formData.append('image', blob, 'scan.jpg');

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'OCR failed');
      }

      const result = await response.json();
      setOcrResult({
        text: result.text,
        confidence: result.confidence,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR-Verarbeitung fehlgeschlagen');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (ocrResult) {
      router.push('/analysis/new');
    }
  };

  const handleRetake = () => {
    setOcrResult(null);
    setError(null);
    if (file) {
      clearFile();
    }
    setMode('smart');
  };

  if (!isOnboarded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Brief scannen</h1>
          <p className="text-muted-foreground">
            Fotografiere deinen Behördenbrief mit automatischer Dokumentenerkennung.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('smart')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              mode === 'smart' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            <Camera className="w-4 h-4" />
            Smart Scan
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              mode === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload
          </button>
        </div>

        {/* Smart Scanner View */}
        {mode === 'smart' && (
          <DocumentScanner
            onCapture={handleCameraCapture}
            onCancel={() => setMode('upload')}
          />
        )}

        {/* Upload View */}
        {mode === 'upload' && (
          <div className="space-y-4">
            <div className="aspect-[4/3] border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/30">
              {!file ? (
                <label className="cursor-pointer flex flex-col items-center p-8">
                  <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    Tippe hier, um ein Bild auszuwählen
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    JPEG, PNG oder WebP, max. 10MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="p-4 w-full h-full flex items-center justify-center">
                  <img
                    src={preview || ''}
                    alt="Uploaded"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              )}
            </div>

            {file && (
              <button
                onClick={() => {
                  clearFile();
                  setMode('smart');
                }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                ← Zurück zum Smart Scan
              </button>
            )}
          </div>
        )}

        {/* Preview / Processing */}
        {mode === 'preview' && (
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-muted rounded-lg p-4 overflow-auto">
              {isProcessing ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <RefreshCw className="w-12 h-12 animate-spin text-primary mb-4" />
                  <p className="text-center">Brief wird analysiert...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Das kann einen Moment dauern
                  </p>
                </div>
              ) : error ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-center text-destructive">{error}</p>
                  <button
                    onClick={handleRetake}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    Erneut versuchen
                  </button>
                </div>
              ) : ocrResult ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="font-medium">
                      {Math.round(ocrResult.confidence)}% Erkennungsgenauigkeit
                    </span>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap bg-muted p-2 rounded">
                    {ocrResult.text.substring(0, 500)}
                    {ocrResult.text.length > 500 && '...'}
                  </pre>
                </div>
              ) : null}
            </div>

            {ocrResult && (
              <div className="flex gap-2">
                <button
                  onClick={handleRetake}
                  className="flex-1 py-3 bg-muted rounded-lg font-medium"
                >
                  Neu aufnehmen
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  Weiter
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
