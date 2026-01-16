'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Camera, RefreshCw, AlertCircle, Loader2, Shield, Settings, Maximize2 } from 'lucide-react';

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
    isRequestingPermission,
    startCamera,
    stopCamera,
    capture,
    retake,
  } = useCamera({ facingMode: 'environment' });

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showGuidelines, setShowGuidelines] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    }
  }, []);

  useEffect(() => {
    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(() => {
      updateContainerSize();
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [updateContainerSize]);

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log('[Scanner] Stream received, setting srcObject');
      videoRef.current.srcObject = stream;
      const playVideo = async () => {
        try {
          console.log('[Scanner] Starting video play...');
          await videoRef.current?.play();
          console.log('[Scanner] Video playing successfully');
        } catch (e) {
          console.error('[Scanner] Auto-play failed:', e);
        }
      };
      playVideo();
    } else {
      console.log('[Scanner] No stream yet or videoRef not ready', { 
        hasVideoRef: !!videoRef.current, 
        hasStream: !!stream 
      });
    }
  }, [stream]);

  const handleStartCamera = useCallback(async () => {
    console.log('[Camera] User clicked start camera button');
    try {
      await startCamera();
    } catch (err) {
      console.error('[Camera] Failed to start:', err);
    }
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const videoWidth = video.videoWidth || 1280;
    const videoHeight = video.videoHeight || 720;
    
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    onCapture(canvas.toDataURL('image/jpeg', 0.9));
  }, [onCapture]);

  const handleRetake = () => {
    retake();
    startCamera();
  };

  const handleRequestPermission = async () => {
    setShowPermissionDialog(false);
    await startCamera();
  };

  const handleOpenSettings = () => {
    setShowPermissionDialog(false);
    window.open('chrome://settings/content/camera', '_blank');
  };

  const calculateA4Frame = () => {
    if (containerSize.width === 0 || containerSize.height === 0) return null;
    
    const a4Aspect = 1 / Math.sqrt(2);
    const containerAspect = containerSize.width / containerSize.height;
    
    let frameWidth, frameHeight, frameX, frameY;
    
    if (containerAspect > a4Aspect) {
      frameHeight = containerSize.height * 0.85;
      frameWidth = frameHeight * a4Aspect;
    } else {
      frameWidth = containerSize.width * 0.85;
      frameHeight = frameWidth / a4Aspect;
    }
    
    frameX = (containerSize.width - frameWidth) / 2;
    frameY = (containerSize.height - frameHeight) / 2;
    
    return { width: frameWidth, height: frameHeight, x: frameX, y: frameY };
  };

  const frame = calculateA4Frame();

  if (error) {
    const isPermissionDenied = error.toLowerCase().includes('denied') || 
                               error.toLowerCase().includes('permission') ||
                               error.toLowerCase().includes('not allowed');

    return (
      <div className="w-full max-w-md mx-auto bg-muted rounded-lg flex flex-col items-center justify-center p-6 min-h-[400px]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <p className="text-center font-medium text-destructive">Kamerazugriff fehlgeschlagen</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          {isPermissionDenied 
            ? 'Kameraberechtigung wurde verweigert. Bitte erlauben Sie den Zugriff auf die Kamera.'
            : error}
        </p>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowPermissionDialog(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2"
          >
            <Shield className="w-4 h-4" />Berechtigung erteilen
          </button>
          <button
            onClick={handleStartCamera}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />Erneut versuchen
          </button>
        </div>

        {showPermissionDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg p-6 max-w-sm w-full shadow-lg">
              <h3 className="text-lg font-semibold mb-2">Kamerazugriff erlauben</h3>
              <p className="text-muted-foreground mb-4">
                GutenBot benötigt Zugriff auf Ihre Kamera, um Dokumente zu scannen.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestPermission}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                >
                  Erlauben
                </button>
                <button
                  onClick={handleOpenSettings}
                  className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />Einstellungen
                </button>
              </div>
              <button
                onClick={() => setShowPermissionDialog(false)}
                className="w-full mt-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Abbrechen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isRequestingPermission) {
    return (
      <div className="w-full max-w-md mx-auto bg-black rounded-lg flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
        <p className="text-center font-medium text-white">Kamera wird gestartet...</p>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="w-full max-w-md mx-auto bg-muted rounded-lg flex flex-col items-center justify-center p-6 min-h-[400px]">
        <Camera className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-center font-medium">Kamera nicht verfügbar</p>
        <button
          onClick={handleStartCamera}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />Kamera starten
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
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          controls={false}
          style={{ display: stream ? 'block' : 'none' }}
        />
        {stream && !isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none hidden" />
        
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
            
            {[
              { x: frame.x, y: frame.y },
              { x: frame.x + frame.width - 30, y: frame.y },
              { x: frame.x, y: frame.y + frame.height - 30 },
              { x: frame.x + frame.width - 30, y: frame.y + frame.height - 30 },
            ].map((corner, i) => (
              <React.Fragment key={i}>
                <div
                  className="absolute bg-primary"
                  style={{
                    left: corner.x,
                    top: corner.y,
                    width: i % 2 === 0 ? 30 : 8,
                    height: i < 2 ? 8 : 30,
                  }}
                />
              </React.Fragment>
            ))}
            
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
            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-lg z-10"
            aria-label="Scannen"
          >
            <div className="w-12 h-12 rounded-full bg-primary" />
          </button>
        )}
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center z-10"
            aria-label="Abbrechen"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
        <p>Richten Sie den Brief im A4-Rahmen aus</p>
        {isReady && (
          <button
            onClick={handleRetake}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <RefreshCw className="w-4 h-4" />Neu starten
          </button>
        )}
      </div>
    </div>
  );
}
