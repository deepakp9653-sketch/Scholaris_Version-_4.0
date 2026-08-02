"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
      setError(null);
    } catch {
      setError("Camera not available. Please use file upload instead.");
    }
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }

  function captureFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
    stopCamera();
  }

  function confirmCapture() {
    if (!captured) return;
    const byteString = atob(captured.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], `scan-${Date.now()}.jpg`, { type: "image/jpeg" });
    onCapture(file);
    setCaptured(null);
  }

  function retake() {
    setCaptured(null);
    setActive(false);
    startCamera();
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {!active && !captured && (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={startCamera}>
            <Camera className="mr-1 h-3 w-3" />
            Open Camera
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}

      {active && !captured && (
        <div className="space-y-2">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full max-w-sm rounded-lg border border-border"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={captureFrame}>
              Capture
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { stopCamera(); onCancel(); }}>
              <X className="mr-1 h-3 w-3" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {captured && (
        <div className="space-y-2">
          <img src={captured} alt="Captured scan" className="w-full max-w-sm rounded-lg border border-border" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmCapture}>
              Use This Photo
            </Button>
            <Button size="sm" variant="outline" onClick={retake}>
              Retake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
