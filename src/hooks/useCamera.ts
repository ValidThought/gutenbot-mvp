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
    try {
      setError(null);
      setIsRequestingPermission(true);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
      };

      console.log('[Camera] Requesting media with constraints:', constraints);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints).catch(async (err) => {
        await new Promise(resolve => setTimeout(resolve, 100));
        throw err;
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Camera request timeout')), 30000)
      );
      
      const finalStream = await Promise.race([mediaStream, timeoutPromise]);
      const streamToUse = finalStream as MediaStream;
      
      streamRef.current = streamToUse;
      setStream(streamToUse);
      setIsRequestingPermission(false);
      
      console.log('[Camera] Media stream obtained, connecting to video element');
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamToUse;
        
        videoRef.current.onloadedmetadata = () => {
          console.log('[Camera] Video metadata loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
        };
        
        videoRef.current.oncanplay = () => {
          console.log('[Camera] Video can play now');
        };
        
        videoRef.current.onerror = (e) => {
          console.error('[Camera] Video error:', e);
          setError('Video element error');
        };

        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('[Camera] Video started playing');
            setIsReady(true);
          }).catch((playErr) => {
            console.error('[Camera] Play error:', playErr);
            setIsReady(true);
          });
        } else {
          setIsReady(true);
        }
      }
    } catch (err) {
      setIsRequestingPermission(false);
      const errorMessage = err instanceof Error ? err.message : 'Camera access denied';
      setError(errorMessage);
      console.error('[Camera] Error:', errorMessage);
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
