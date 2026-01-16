'use client';

import React, { useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Camera, RefreshCw, Check, AlertCircle, Loader2 } from 'lucide-react';

interface DocumentScannerProps {
  onCapture: (imageData: string) => void;
  onCancel?: () => void;
}

export function DocumentScanner({ onCapture, onCancel }: DocumentScannerProps) {
  const {
    videoRef,
    canvasRef,
    stream,
    error,
    isReady,
    isCapturing,
    startCamera,
    stopCamera,
    capture,
    retake,
  } = useCamera({ facingMode: 'environment' });

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const imageData = capture();
    if (imageData) {
      onCapture(imageData);
    }
  };

  const handleRetake = () => {
    retake();
  };

  if (error) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-center font-medium text-destructive">Kamerazugriff fehlgeschlagen</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">{error}</p>
        <button
          onClick={startCamera}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />Erneut versuchen
        </button>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="aspect-[4/3] bg-black rounded-lg flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
        <p className="text-center font-medium text-white">Kamera wird gestartet...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Brief scannen</h2>
          <p className="text-muted-foreground text-sm">
            {isReady ? 'Bereit zum Scannen' : 'Kamera wird gestartet...'}
          </p>
        </div>
        {isReady && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-yellow-100 text-yellow-700">
            <Camera className="w-4 h-4" />Bereit
          </div>
        )}
      </div>

      <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        
        {isReady && (
          <button
            onClick={handleCapture}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary" />
          </button>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Richten Sie die Kamera auf das Dokument und tippen Sie zum Scannen
      </p>
    </div>
  );
}
