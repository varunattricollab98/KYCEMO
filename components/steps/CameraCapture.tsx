"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Phase = "idle" | "starting" | "live" | "captured" | "denied" | "unsupported";

// In-page live camera capture using getUserMedia + canvas.
// Works on desktop AND mobile — no file picker, so only a real on-the-spot
// photo can be produced. Emits a JPEG File via onCapture.
export function CameraCapture({
  label,
  onCapture,
  disabled,
}: {
  label: string;
  onCapture: (file: File) => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopStream();
      if (preview) URL.revokeObjectURL(preview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function openCamera() {
    setError(null);
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setPhase("unsupported");
      return;
    }
    setPhase("starting");
    try {
      // Prefer the rear camera on phones; desktops fall back to the webcam.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase("live");
      // Attach after render so videoRef exists.
      requestAnimationFrame(async () => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setPhase("denied");
      } else {
        setError("Could not access the camera. Please check permissions.");
        setPhase("idle");
      }
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        if (preview) URL.revokeObjectURL(preview);
        setPreview(URL.createObjectURL(blob));
        const file = new File([blob], `${label.replace(/\s+/g, "_")}.jpg`, {
          type: "image/jpeg",
        });
        stopStream();
        setPhase("captured");
        onCapture(file);
      },
      "image/jpeg",
      0.9
    );
  }

  function retake() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    openCamera();
  }

  const frame =
    "relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-navy ring-1 ring-navy/20";

  if (phase === "captured" && preview) {
    return (
      <div className="mt-3">
        <div className={frame}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="h-full w-full object-cover" />
          <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            ✓ Captured
          </span>
        </div>
        <button
          type="button"
          onClick={retake}
          disabled={disabled}
          className="mt-2 w-full rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 disabled:opacity-50"
        >
          ↻ Retake photo
        </button>
      </div>
    );
  }

  if (phase === "live") {
    return (
      <div className="mt-3">
        <div className={frame}>
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full object-cover"
          />
          {/* alignment guide */}
          <div className="pointer-events-none absolute inset-4 rounded-md border-2 border-dashed border-white/40" />
        </div>
        <button
          type="button"
          onClick={capture}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-3 py-2.5 text-xs font-semibold text-white shadow-glow transition hover:brightness-110"
        >
          ● Capture photo
        </button>
      </div>
    );
  }

  if (phase === "denied") {
    return (
      <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        Camera access was blocked. Please allow camera permission in your browser
        (address-bar icon) and{" "}
        <button onClick={openCamera} className="font-semibold underline">
          try again
        </button>
        .
      </div>
    );
  }

  if (phase === "unsupported") {
    return (
      <div className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        Your browser doesn&apos;t support in-page camera capture. Please open this
        link on your phone&apos;s browser (Chrome / Safari) to take the photo.
      </div>
    );
  }

  // idle
  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={openCamera}
        disabled={disabled || phase === "starting"}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-light px-3 py-2.5 text-xs font-semibold text-brand transition hover:bg-brand-500/10 disabled:opacity-50"
      >
        📷 {phase === "starting" ? "Opening camera…" : "Take photo"}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
