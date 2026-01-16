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
  requestPermission: () => Promise<boolean>;
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
    console.log('[Camera] startCamera called');
    
    setError(null);
    setIsRequestingPermission(true);
    
    if (streamRef.current) {
      console.log('[Camera] Stopping existing stream');
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsReady(false);

    const constraints = {
      video: {
        facingMode,
        width: { ideal: width },
        height: { ideal: height },
      },
    };

    console.log('[Camera] Creating timeout promise (10s)...');
    const timeoutPromise = new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        console.log('[Camera] Timeout reached!');
        reject(new Error('Camera request timeout after 10s'));
      }, 10000);
    });

    console.log('[Camera] Calling getUserMedia...');
    const mediaStreamPromise = navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        console.log('[Camera] getUserMedia succeeded');
        return stream;
      })
      .catch(err => {
        console.log('[Camera] getUserMedia failed:', err.message);
        throw err;
      });

    try {
      console.log('[Camera] Racing promises...');
      const stream = await Promise.race<MediaStream>([mediaStreamPromise, timeoutPromise as Promise<MediaStream>]);
      console.log('[Camera] Got stream:', stream ? 'yes' : 'no');
      
      streamRef.current = stream;
      setStream(stream);
      setIsRequestingPermission(false);
      console.log('[Camera] States updated, stream is set');
      
      if (videoRef.current) {
        console.log('[Camera] Setting srcObject...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('[Camera] Metadata loaded');
        };
        
        videoRef.current.oncanplay = () => {
          console.log('[Camera] Can play');
        };
        
        videoRef.current.onerror = (e) => {
          console.error('[Camera] Video error:', e);
        };

        console.log('[Camera] Calling play()...');
        await videoRef.current.play();
        console.log('[Camera] Play succeeded, setting isReady=true');
        setIsReady(true);
      }
    } catch (err) {
      console.error('[Camera] Error in startCamera:', err);
      setIsRequestingPermission(false);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
    }
  }, [facingMode, width, height]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      await startCamera();
      return true;
    } catch {
      setError('Kameraberechtigung verweigert');
      return false;
    }
  }, [startCamera]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    setIsReady(false);
    setIsCapturing(false);
  }, []);

  const capture = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('[Camera] Video or canvas ref not available');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[Camera] Could not get canvas context');
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
        streamRef.current.getTracks().forEach((track) => track.stop());
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
    requestPermission,
  };
}

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Bitte wählen Sie ein Bildformat (JPEG, PNG, TIFF oder WebP)');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('Datei ist zu groß. Maximale Größe: 10MB');
      return;
    }

    setFile(selectedFile);
    setError(null);

    // Create preview
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
