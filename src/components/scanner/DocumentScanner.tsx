'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, Maximize2, Loader2, X } from 'lucide-react';

interface DocumentScannerProps {
  onCapture: (imageData: string) => void;
  onCancel?: () => void;
}

export function DocumentScanner({ onCapture, onCancel }: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasStartedRef = useRef(false);
  
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const startCamera = useCallback(async () => {
    if (hasStartedRef.current) {
      console.log('[Scanner] Already started, skipping...');
      return;
    }
    
    console.log('[Scanner] Starting camera...');
    hasStartedRef.current = true;
    setError(null);

    try {
      const constraints = {
        video: {
          facingMode: 'environment' as const,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      console.log('[Scanner] Requesting permission...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[Scanner] Permission granted');
      
      streamRef.current = stream;
      setIsReady(true);
      
      if (videoRef.current) {
        console.log('[Scanner] Setting video source...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('[Scanner] Metadata loaded');
        };
        
        videoRef.current.onerror = (err) => {
          console.error('[Scanner] Video error:', err);
        };
        
        // Try to play, but don't wait for it
        videoRef.current.play().then(() => {
          console.log('[Scanner] Video playing');
        }).catch((e) => {
          console.log('[Scanner] Play failed (ok, button still works):', e);
        });
      }
    } catch (err) {
      console.error('[Scanner] Camera error:', err);
      setError(err instanceof Error ? err.message : 'Camera failed');
      hasStartedRef.current = false;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    hasStartedRef.current = false;
    setIsReady(false);
  }, []);

  useEffect(() => {
    console.log('[Scanner] Component mounted');
    startCamera();

    return () => {
      console.log('[Scanner] Component unmounted');
      stopStream();
    };
  }, [startCamera, stopStream]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCapture = useCallback(() => {
    console.log('[Scanner] Capture clicked, isReady:', isReady);
    
    if (!videoRef.current || !canvasRef.current) {
      console.error('[Scanner] Refs not available');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Scanner] No canvas context');
      return;
    }

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    console.log('[Scanner] Captured image, length:', dataUrl.length);
    onCapture(dataUrl);
  }, [onCapture, isReady]);

  const calculateFrame = () => {
    if (containerSize.width === 0 || containerSize.height === 0) return null;
    
    const aspect = 1 / Math.sqrt(2);
    const containerAspect = containerSize.width / containerSize.height;
    
    let width, height, x, y;
    
    if (containerAspect > aspect) {
      height = containerSize.height * 0.85;
      width = height * aspect;
    } else {
      width = containerSize.width * 0.85;
      height = width / aspect;
    }
    
    x = (containerSize.width - width) / 2;
    y = (containerSize.height - height) / 2;
    
    return { width, height, x, y };
  };

  const frame = calculateFrame();

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto bg-muted rounded-lg flex flex-col items-center justify-center p-6 min-h-[400px]">
        <p className="text-center text-destructive font-medium mb-4">{error}</p>
        <button
          onClick={startCamera}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Brief scannen</h2>
          <p className="text-muted-foreground text-sm">
            Positionieren Sie das Dokument im Rahmen
          </p>
        </div>
        <button
          onClick={() => setShowGuidelines(!showGuidelines)}
          className={`p-2 rounded-lg transition-colors ${
            showGuidelines ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}
          title="Führungslinien umschalten"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full bg-black rounded-lg overflow-hidden"
        style={{ aspectRatio: '3/4' }}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-white" />
          </div>
        )}

        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          style={{ display: isReady ? 'block' : 'none' }}
        />

        <canvas ref={canvasRef} className="hidden" />

        {showGuidelines && frame && (
          <>
            <div
              className="absolute border-2 border-white/80 rounded-lg"
              style={{
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
              }}
            />
            <div
              className="absolute bg-black/60 text-white text-xs px-2 py-1 rounded"
              style={{
                left: frame.x + 8,
                top: frame.y + frame.height + 4,
              }}
            >
              A4 Format
            </div>
          </>
        )}

        {isReady && (
          <button
            onClick={handleCapture}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-lg z-10 cursor-pointer"
            aria-label="Scannen"
          >
            <div className="w-14 h-14 rounded-full bg-primary" />
          </button>
        )}

        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center z-10 cursor-pointer"
            aria-label="Abbrechen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <p>Richten Sie den Brief im A4-Rahmen aus</p>
        {isReady && (
          <button
            onClick={startCamera}
            className="flex items-center gap-1 hover:text-foreground cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />Neu starten
          </button>
        )}
      </div>
    </div>
  );
}
