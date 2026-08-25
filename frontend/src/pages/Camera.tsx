import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

const isNative = Capacitor.isNativePlatform();

const INSTRUCTIONS: Record<string, string> = {
  medicine: "Point your camera at the medicine label. Make sure the words are visible.",
  government: "Point your camera at the document. Hold the phone steady.",
  transport: "Point your camera at the sign.",
  education: "Point your camera at the textbook page.",
  food: "Point your camera at the food package label.",
  default: "Point your camera at what you want to understand. Hold the phone steady."
};

type CaptureStage = "live" | "preview";

export default function CameraPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const hint = (location.state as { hint?: string })?.hint ?? "default";

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<CaptureStage>("live");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);

  useEffect(() => {
    if (isNative) return; // native camera is launched on demand, not previewed in-page
    startCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  async function handleNativeCapture() {
    setError(null);
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90,
        allowEditing: false
      });
      if (photo.dataUrl) {
        setCapturedImage(photo.dataUrl);
        setStage("preview");
        setQualityWarning(await assessImageQuality(photo.dataUrl));
      }
    } catch (err) {
      // User cancelling the native camera sheet throws too — treat quietly.
      console.warn("Native camera capture cancelled or failed:", err);
    }
  }

  async function handleNativeUpload() {
    setError(null);
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos,
        quality: 90
      });
      if (photo.dataUrl) {
        setCapturedImage(photo.dataUrl);
        setStage("preview");
        setQualityWarning(await assessImageQuality(photo.dataUrl));
      }
    } catch (err) {
      console.warn("Native photo picker cancelled or failed:", err);
    }
  }

  async function startCamera() {
    setError(null);
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      setError(
        "Could not access the camera. Please allow camera permission, or upload a photo instead."
      );
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function toggleTorch() {
    const track = streamRef.current?.getVideoTracks()[0];
    // @ts-expect-error - torch is a non-standard MediaTrackConstraint supported on some devices
    if (track && track.getCapabilities?.().torch) {
      // @ts-expect-error non-standard
      track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } else {
      setError("Flash is not available on this device/browser.");
    }
  }

  /**
   * Lightweight blur/lighting check so a genuinely unreadable photo gets
   * caught before it's sent for analysis, rather than producing an
   * inaccurate answer. Uses a fast Laplacian-variance estimate (sharpness)
   * plus average brightness on a downscaled copy of the image — cheap
   * enough to run on any phone, no ML model required.
   */
  function assessImageQuality(dataUrl: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = 160;
        const h = Math.round((img.height / img.width) * w) || 160;
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        const gray = new Float32Array(w * h);
        let brightnessSum = 0;
        for (let i = 0; i < w * h; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          gray[i] = lum;
          brightnessSum += lum;
        }
        const avgBrightness = brightnessSum / (w * h);

        // Simple Laplacian convolution to estimate edge energy (sharpness).
        let lapSum = 0;
        let lapSumSq = 0;
        let count = 0;
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = y * w + x;
            const lap =
              4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - w] - gray[idx + w];
            lapSum += lap;
            lapSumSq += lap * lap;
            count++;
          }
        }
        const mean = lapSum / count;
        const variance = lapSumSq / count - mean * mean;

        if (avgBrightness < 40) {
          resolve("This photo looks quite dark. Try again with more light for a more accurate answer.");
        } else if (avgBrightness > 240) {
          resolve("This photo looks overexposed. Try reducing glare or bright light for a more accurate answer.");
        } else if (variance < 15) {
          resolve("This photo looks blurry. Hold the phone steady and retake for a more accurate answer.");
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(dataUrl);
    setStage("preview");
    setQualityWarning(await assessImageQuality(dataUrl));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      setStage("preview");
      setQualityWarning(await assessImageQuality(dataUrl));
    };
    reader.readAsDataURL(file);
  }

  function handleRetake() {
    setCapturedImage(null);
    setQualityWarning(null);
    setStage("live");
  }

  function handleAnalyze() {
    if (!capturedImage) return;
    stopCamera();
    navigate("/processing", { state: { image: capturedImage } });
  }

  return (
    <div className="min-h-screen bg-ink flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 text-paper">
        <button onClick={() => { stopCamera(); navigate(-1); }} aria-label="Cancel" className="text-2xl">
          ✕
        </button>
        <span className="font-semibold">Scan</span>
        {isNative ? (
          <span className="w-6" aria-hidden="true" />
        ) : (
          <button
            onClick={toggleTorch}
            aria-label="Toggle flash"
            aria-pressed={torchOn}
            className={`text-2xl ${torchOn ? "text-marigold" : ""}`}
          >
            ⚡
          </button>
        )}
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {stage === "live" && isNative ? (
          <div className="flex flex-col items-center gap-6 px-6 text-center">
            <p className="text-paper text-lg">{INSTRUCTIONS[hint] ?? INSTRUCTIONS.default}</p>
            <button
              onClick={handleNativeCapture}
              className="w-24 h-24 rounded-full bg-marigold flex items-center justify-center text-4xl shadow-lift active:scale-95 transition-transform"
              aria-label="Open camera"
            >
              📷
            </button>
            <button onClick={handleNativeUpload} className="text-paper/80 underline text-sm">
              Choose from gallery instead
            </button>
            {error && (
              <div className="bg-signal-red/90 text-white text-sm px-4 py-3 rounded-xl max-w-xs">{error}</div>
            )}
          </div>
        ) : stage === "live" ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-6 left-0 right-0 px-6 text-center">
              <p className="bg-black/50 text-paper inline-block px-4 py-2 rounded-full text-sm">
                {INSTRUCTIONS[hint] ?? INSTRUCTIONS.default}
              </p>
            </div>
            {error && (
              <div className="absolute top-4 left-4 right-4 bg-signal-red/90 text-white text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
          </>
        ) : (
          <>
            {capturedImage && (
              <img src={capturedImage} alt="Captured preview" className="w-full h-full object-contain" />
            )}
            {qualityWarning && (
              <div className="absolute top-4 left-4 right-4 bg-signal-amber/95 text-ink text-sm font-semibold px-4 py-3 rounded-xl">
                ⚠️ {qualityWarning}
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="px-6 py-8 bg-ink">
        {stage === "live" && isNative ? null : stage === "live" ? (
          <div className="flex items-center justify-between max-w-md mx-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload a photo instead"
              className="w-14 h-14 rounded-full bg-paper/10 text-paper flex items-center justify-center text-2xl"
            >
              🖼️
            </button>
            <button
              onClick={handleCapture}
              aria-label="Capture photo"
              className="w-20 h-20 rounded-full bg-paper border-4 border-marigold flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="w-14 h-14 rounded-full bg-marigold" />
            </button>
            <button
              onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
              aria-label="Switch camera"
              className="w-14 h-14 rounded-full bg-paper/10 text-paper flex items-center justify-center text-2xl"
            >
              🔄
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="flex gap-4 max-w-md mx-auto">
            <button
              onClick={handleRetake}
              className="flex-1 bg-paper/10 text-paper font-bold py-4 rounded-button"
            >
              Retake
            </button>
            <button
              onClick={handleAnalyze}
              className="flex-1 bg-marigold text-ink font-bold py-4 rounded-button shadow-lift"
            >
              {qualityWarning ? "Analyze Anyway" : "Analyze"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
