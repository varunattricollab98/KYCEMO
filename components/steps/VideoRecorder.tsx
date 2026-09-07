"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

type Phase = "idle" | "ready" | "recording" | "recorded" | "uploading";

// In-browser video KYC recorder. Uses getUserMedia + MediaRecorder, shows the
// script on screen, enforces a max duration, and lets the client review /
// re-record before uploading to the private kyc-video bucket.
export function VideoRecorder({
  token,
  script,
  maxSeconds,
}: {
  token: string;
  script: string;
  maxSeconds: number;
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const geoRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(
    null
  );
  const [locating, setLocating] = useState(false);

  // Clean up camera + timers on unmount.
  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function pickMimeType(): string {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ];
    for (const c of candidates) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
        return c;
      }
    }
    return "";
  }

  // Mandatory: capture the client's GPS location (compliance requirement).
  // Resolves only when permission is granted and a fix is obtained.
  function captureLocation(): Promise<{
    lat: number;
    lng: number;
    accuracy: number;
  }> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("unsupported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  }

  async function enableCamera() {
    setError(null);

    // 1) Location is legally required for office KYC — request it FIRST.
    setLocating(true);
    try {
      const geo = await captureLocation();
      geoRef.current = geo;
      // Persist immediately so it's recorded even if they drop off later.
      fetch(`/api/kyc/${token}/geo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geo),
      }).catch(() => {});
    } catch (err) {
      setLocating(false);
      const code =
        err instanceof GeolocationPositionError ? err.code : undefined;
      if (code === 1) {
        setError(
          "Location access is required for KYC verification. Please allow location permission in your browser and try again."
        );
      } else if ((err as Error)?.message === "unsupported") {
        setError(
          "Your browser doesn't support location. Please open this link on your phone's browser to complete KYC."
        );
      } else {
        setError(
          "We couldn't get your location. Please enable GPS/location and try again."
        );
      }
      return; // Block: no location → no camera → no recording.
    }
    setLocating(false);

    // 2) Location granted — now enable the camera + microphone.
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError(
        "Your browser doesn't support in-page video. Please open this link in Chrome or Safari on your phone."
      );
      return;
    }
    try {
      let stream: MediaStream;
      try {
        // Front camera for the selfie-style video KYC.
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
      } catch {
        // Fallback: some phones/browsers reject the facingMode constraint —
        // retry with any available camera.
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute("muted", "");
        videoRef.current.setAttribute("playsinline", "");
        await videoRef.current.play().catch(() => {});
      }
      setPhase("ready");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError(
          "Camera & microphone access is required. Please allow permissions in your browser and try again."
        );
      } else if (name === "NotFoundError" || name === "NotReadableError") {
        setError(
          "No camera was found or it's in use by another app. Close other apps and try again."
        );
      } else {
        setError(
          "Could not access the camera/microphone. Please allow permissions and try again."
        );
      }
    }
  }

  function startRecording() {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      streamRef.current,
      mimeType ? { mimeType } : undefined
    );
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/webm",
      });
      recordedBlobRef.current = blob;
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setPhase("recorded");
      // Show the recording in the preview element.
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
        videoRef.current.controls = true;
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    setPhase("recording");
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        if (next >= maxSeconds) stopRecording();
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    stopTimer();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function reRecord() {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    recordedBlobRef.current = null;
    setSeconds(0);
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.controls = false;
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.muted = true;
      await videoRef.current.play().catch(() => {});
    }
    setPhase("ready");
  }

  async function submitVideo() {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    // Safety net: location is mandatory. Re-post it before finalising.
    if (!geoRef.current) {
      setError(
        "Location is required for KYC. Please re-record and allow location access."
      );
      return;
    }
    setPhase("uploading");
    setError(null);
    try {
      await fetch(`/api/kyc/${token}/geo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geoRef.current),
      }).catch(() => {});
      const ext = blob.type.includes("mp4") ? "mp4" : "webm";
      const filename = `kyc-video.${ext}`;

      const signRes = await fetch(`/api/kyc/${token}/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_type: "kyc_video", filename }),
      });
      const sign = await signRes.json();
      if (!signRes.ok) throw new Error(sign.error ?? "Could not prepare upload");

      const put = await fetch(sign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": blob.type || "video/webm" },
        body: blob,
      });
      if (!put.ok) throw new Error("Video upload failed, please try again");

      await fetch(`/api/kyc/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: "kyc_video",
          storage_path: sign.path,
          original_name: filename,
          bucket: sign.bucket,
        }),
      });

      // Finalise the whole KYC submission.
      const submit = await fetch(`/api/kyc/${token}/submit`, { method: "POST" });
      if (!submit.ok) throw new Error((await submit.json()).error ?? "Submit failed");

      // Free the camera.
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.push(`/kyc/${token}/done`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("recorded");
    }
  }

  const remaining = maxSeconds - seconds;

  return (
    <div className="space-y-4">
      {/* On-screen script */}
      <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold">
          <span aria-hidden>🎬</span> Read this aloud
        </div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-navy/80">
          {script}
        </p>
      </div>

      {/* Camera / recording preview */}
      <div className="relative overflow-hidden rounded-xl bg-navy shadow-card ring-1 ring-navy/20">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="aspect-video w-full bg-navy object-cover"
        />
        {phase === "recording" && (
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {String(Math.floor(seconds / 60)).padStart(1, "0")}:
            {String(seconds % 60).padStart(2, "0")} · {remaining}s left
          </div>
        )}
        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
            <span className="text-3xl">🎥</span>
            <span className="text-sm">Camera is off</span>
          </div>
        )}
        {phase === "recorded" && (
          <div className="absolute left-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            ✓ Recorded — review below
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Controls */}
      {phase === "idle" && (
        <>
          <div className="rounded-lg bg-brand-light px-3 py-2.5 text-xs text-brand">
            📍 For KYC compliance, we&apos;ll ask for your{" "}
            <b>camera, microphone &amp; location</b>. Please allow all three to
            continue.
          </div>
          <Button type="button" onClick={enableCamera} disabled={locating}>
            {locating ? "Getting your location…" : "🎥 Enable camera & location"}
          </Button>
        </>
      )}
      {phase === "ready" && (
        <Button type="button" variant="danger" onClick={startRecording}>
          ● Start recording
        </Button>
      )}
      {phase === "recording" && (
        <Button type="button" variant="danger" onClick={stopRecording}>
          ■ Stop recording
        </Button>
      )}
      {phase === "recorded" && (
        <div className="flex flex-col gap-2">
          <Button type="button" onClick={submitVideo}>
            Submit KYC <span aria-hidden>→</span>
          </Button>
          <Button type="button" variant="ghost" onClick={reRecord}>
            ↻ Re-record
          </Button>
        </div>
      )}
      {phase === "uploading" && (
        <Button type="button" disabled>
          Uploading &amp; submitting…
        </Button>
      )}
    </div>
  );
}
