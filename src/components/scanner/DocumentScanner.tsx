'use client';

import React, { useEffect, useState } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Camera, RefreshCw, Check, AlertCircle, Loader2, Shield, Settings, Maximize2 } from 'lucide-react';

interface DocumentScannerProps {
  onCapture: (imageData: string) => void;
  onCancel?: () => void;
}

// A4 aspect ratio: 210mm × 297mm = 1:1.414
const A4_ASPECT_RATIO = 1 / Math.sqrt(2); // ≈ 0.707
const A4_WIDTH_RATIO = 0.75; // A4 width as percentage of container

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
    requestPermission,
  } = useCamera({ facingMode: 'environment' });

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showGuidelines, setShowGuidelines] = useState(true);

  useEffect(() => {
    const initCamera = async () => {
      await requestPermission();
    };
    initCamera();
  }, [requestPermission]);

  const handleCapture = () => {
    const imageData = capture();
    if (imageData) {
      onCapture(imageData);
    }
  };

  const handleRetake = () => {
    retake();
    startCamera();
  };

  const handleRequestPermission = async () => {
    setShowPermissionDialog(false);
    await requestPermission();
  };

  const handleOpenSettings = () => {
    setShowPermissionDialog(false);
    window.open('chrome://settings/content/camera', '_blank');
  };

  const calculateA4Frame = () => {
    if (containerSize.width === 0 || containerSize.height === 0) return null;
    
    const containerAspect = containerSize.width / containerSize.height;
    const a4Aspect = A4_ASPECT_RATIO;
    
    let frameWidth, frameHeight, frameX, frameY;
    
    if (containerAspect > a4Aspect) {
      // Container is wider - fit A4 to height
      frameHeight = containerSize.height * A4_WIDTH_RATIO;
      frameWidth = frameHeight * a4Aspect;
    } else {
      // Container is taller - fit A4 to width
      frameWidth = containerSize.width * A4_WIDTH_RATIO;
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
      <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center p-6">
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
            onClick={startCamera}
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

  if (isRequestingPermission || (!stream && !error)) {
    return (
      <div className="aspect-[4/3] bg-black rounded-lg flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white mb-4" />
        <p className="text-center font-medium text-white">Kamera wird gestartet...</p>
        <p className="text-sm text-gray-400 mt-2 text-center">
          Bitte erlauben Sie den Kamerazugriff wenn dazu aufgefordert
        </p>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center p-6">
        <Camera className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-center font-medium">Kamera nicht verfügbar</p>
        <button
          onClick={startCamera}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />Kamera starten
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Brief scannen</h2>
          <p className="text-muted-foreground text-sm">
            {isReady ? 'Positionieren Sie das Dokument im Rahmen' : 'Kamera wird gestartet...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`p-2 rounded-lg transition-colors ${
              showGuidelines ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
            title="Führungslinien umschalten"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          {isReady && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-700">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </div>
          )}
        </div>
      </div>

      <div 
        ref={(el) => {
          if (el) {
            const rect = el.getBoundingClientRect();
            setContainerSize({ width: rect.width, height: rect.height });
          }
        }}
        className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden"
      >
        <video 
          ref={videoRef} 
          className="absolute inset-0 w-full h-full object-cover"
          playsInline 
          muted 
          autoPlay
        />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        
        {showGuidelines && frame && (
          <>
            {/* A4 Frame */}
            <div
              className="absolute border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]"
              style={{
                left: frame.x,
                top: frame.y,
                width: frame.width,
                height: frame.height,
              }}
            />
            
            {/* Corner Markers */}
            {[
              { x: frame.x, y: frame.y }, // Top-left
              { x: frame.x + frame.width - 30, y: frame.y }, // Top-right
              { x: frame.x, y: frame.y + frame.height - 30 }, // Bottom-left
              { x: frame.x + frame.width - 30, y: frame.y + frame.height - 30 }, // Bottom-right
            ].map((corner, i) => (
              <React.Fragment key={i}>
                {/* Horizontal line */}
                <div
                  className="absolute bg-primary w-8 h-1"
                  style={{ left: corner.x - (i % 2 === 0 ? 0 : 8), top: corner.y }}
                />
                {/* Vertical line */}
                <div
                  className="absolute bg-primary w-1 h-8"
                  style={{ left: corner.x, top: corner.y - (i < 2 ? 0 : 8) }}
                />
              </React.Fragment>
            ))}
            
            {/* A4 Label */}
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
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-10"
            aria-label="Scannen"
          >
            <div className="w-12 h-12 rounded-full bg-primary" />
          </button>
        )}
        
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-10"
            aria-label="Abbrechen"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>Richten Sie den Brief im A4-Rahmen aus</p>
        {isReady && (
          <button
            onClick={handleRetake}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />Neu starten
          </button>
        )}
      </div>
    </div>
  );
}
