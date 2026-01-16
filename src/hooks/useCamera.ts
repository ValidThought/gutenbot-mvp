import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
  isCapturing: boolean;
  isRequestingPermission: boolean;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capture: () => string | null;
  retake: () => void;
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const { facingMode = 'environment', width = 1280, height = 720 } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    console.log('[useCamera] startCamera called');
    setError(null);
    setIsRequestingPermission(true);

    try {
      const constraints = {
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
      };

      console.log('[useCamera] Requesting camera...');
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[useCamera] Camera granted');

      streamRef.current = stream;
      setStream(stream);
      setIsRequestingPermission(false);
      setIsReady(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('[useCamera] Error:', err);
      setIsRequestingPermission(false);
      setError(err instanceof Error ? err.message : 'Camera access denied');
    }
  }, [facingMode, width, height]);

  const stopCamera = useCallback(() => {
    console.log('[useCamera] stopCamera called');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsReady(false);
    setIsCapturing(false);
  }, []);

  const capture = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[useCamera] Refs not available');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[useCamera] No canvas context');
      return null;
    }

    ctx.drawImage(video, 0, 0);
    setIsCapturing(true);
    return canvas.toDataURL('image/jpeg', 0.9);
  }, []);

  const retake = useCallback(() => {
    setIsCapturing(false);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
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
  };
}

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Bitte wählen Sie ein Bildformat (JPEG, PNG, TIFF oder WebP)');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Datei ist zu groß. Maximale Größe: 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
  }, []);

  return {
    file,
    preview,
    error,
    handleFileSelect,
    clearFile,
  };
}
