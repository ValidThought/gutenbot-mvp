'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { useLetterStore } from '@/store/letterStore';
import { useFileUpload } from '@/hooks/useCamera';
import { DocumentScanner } from '@/components/scanner/DocumentScanner';
import { ArrowRight, Camera, Upload, RefreshCw, Check, AlertCircle, FileText, Image, Send, Download } from 'lucide-react';

type PreviewView = 'original' | 'text';

export default function ScannerPage() {
  const router = useRouter();
  const { profile, isOnboarded } = useUserStore();
  const { setOcrResult: storeOcrResult } = useLetterStore();
  const [mode, setMode] = useState<'smart' | 'upload' | 'preview'>('smart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<{
    text: string;
    confidence: number;
  } | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [previewView, setPreviewView] = useState<PreviewView>('text');
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
    setCapturedImage(imageData);
    await processImageDataUrl(imageData);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    handleFileSelect(e);
    setMode('preview');
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCapturedImage(ev.target.result as string);
      }
    };
    reader.readAsDataURL(selectedFile);

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
      storeOcrResult({
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        wordCount: ocrResult.text.split(/\s+/).length,
      });
      router.push('/analysis/new');
    }
  };

  const handleRetake = () => {
    setOcrResult(null);
    setCapturedImage(null);
    setError(null);
    if (file) {
      clearFile();
    }
    setMode('smart');
    setPreviewView('text');
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
            <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
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
                <>
                  <div className="flex gap-2 p-2 border-b border-border bg-card">
                    <button
                      onClick={() => setPreviewView('original')}
                      className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${
                        previewView === 'original' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Image className="w-4 h-4" />
                      Original
                    </button>
                    <button
                      onClick={() => setPreviewView('text')}
                      className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition-colors ${
                        previewView === 'text' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Erkannter Text
                    </button>
                  </div>
                  
                  <div className="h-[calc(100%-56px)] overflow-auto p-4">
                    {previewView === 'original' && capturedImage && (
                      <img
                        src={capturedImage}
                        alt="Scanned document"
                        className="w-full h-auto object-contain"
                      />
                    )}
                    {previewView === 'text' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-500" />
                          <span className="font-medium">
                            {Math.round(ocrResult.confidence)}% Erkennungsgenauigkeit
                          </span>
                        </div>
                        <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                          {ocrResult.text}
                        </pre>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {ocrResult && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([ocrResult.text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'erkannter-brief.txt';
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    PDF herunterladen
                  </button>
                  <button
                    onClick={() => alert('Entwurf gespeichert - kommt bald')}
                    className="flex-1 py-3 bg-muted text-muted-foreground rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Als Entwurf senden
                  </button>
                </div>
                
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
