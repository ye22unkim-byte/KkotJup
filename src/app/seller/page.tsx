"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeResult, SellerSession } from "@/lib/types";
import { Countdown } from "@/components/Countdown";

type Step = "login" | "capture" | "analyzing" | "approve" | "done";

const SESSION_KEY = "kkotjup-seller";

export default function SellerPage() {
  const [step, setStep] = useState<Step>("login");
  const [session, setSession] = useState<SellerSession>({
    stallCode: "",
    stallZone: "",
    sellerName: "",
  });
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [source, setSource] = useState<"gemini" | "mock" | null>(null);
  const [error, setError] = useState("");
  const [holding, setHolding] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const [postedId, setPostedId] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdTimerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const frameRef = useRef<string>("");
  const holdingRef = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SellerSession;
        if (parsed.stallCode && parsed.stallZone) {
          setSession(parsed);
          setStep("capture");
        }
      } catch {
        /* ignore */
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (step !== "capture") {
      stopCamera();
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("카메라/마이크 권한이 필요합니다. 데모는 사진 업로드로도 가능합니다.");
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [step, stopCamera]);

  function saveLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!session.stallCode || !session.stallZone || !session.sellerName) {
      setError("호수/구역/상호를 모두 입력해주세요.");
      return;
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    setError("");
    setStep("capture");
  }

  function captureFrame(): string | null {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1] ?? "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function runAnalyze(opts: {
    imageDataUrl: string;
    audioBlob?: Blob | null;
    transcript?: string;
  }) {
    setStep("analyzing");
    setError("");
    try {
      const imageBase64 = opts.imageDataUrl.split(",")[1];
      const imageMimeType = opts.imageDataUrl.match(/^data:(.*?);/)?.[1] || "image/jpeg";
      let audioBase64: string | undefined;
      let audioMimeType: string | undefined;
      if (opts.audioBlob && opts.audioBlob.size > 0) {
        audioBase64 = await blobToBase64(opts.audioBlob);
        audioMimeType = opts.audioBlob.type || "audio/webm";
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          imageMimeType,
          audioBase64,
          audioMimeType,
          transcript: opts.transcript,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      setAnalysis(data.result);
      setSource(data.source);
      setStep("approve");
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 실패");
      setStep("capture");
    }
  }

  function startHold() {
    if (holdingRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    setRecordingMs(0);
    chunksRef.current = [];
    const frame = captureFrame() || imageDataUrl;
    if (frame) {
      frameRef.current = frame;
      setImageDataUrl(frame);
    }

    const stream = streamRef.current;
    if (stream) {
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.start();
      } catch {
        /* audio optional */
      }
    }

    const started = Date.now();
    tickRef.current = window.setInterval(() => {
      setRecordingMs(Date.now() - started);
    }, 100);

    holdTimerRef.current = window.setTimeout(() => {
      void endHold();
    }, 10000);
  }

  async function endHold() {
    if (!holdingRef.current) return;
    holdingRef.current = false;

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setHolding(false);

    const recorder = mediaRecorderRef.current;
    const frame = frameRef.current || imageDataUrl || captureFrame();
    if (!frame) {
      setError("사진을 먼저 촬영하거나 업로드해주세요.");
      return;
    }
    setImageDataUrl(frame);

    let audioBlob: Blob | null = null;
    if (recorder && recorder.state !== "inactive") {
      audioBlob = await new Promise<Blob | null>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        };
        recorder.stop();
      });
    }

    await runAnalyze({
      imageDataUrl: frame,
      audioBlob,
      transcript: transcript || undefined,
    });
  }

  async function onUploadImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      frameRef.current = dataUrl;
      setImageDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function publish() {
    if (!analysis) return;
    setError("");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...analysis,
          imageDataUrl,
          stallCode: session.stallCode,
          stallZone: session.stallZone,
          sellerName: session.sellerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록 실패");
      setPostedId(data.product.id);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    }
  }

  async function confirmPickup() {
    if (!postedId || !confirmCode) return;
    const res = await fetch(`/api/products/${postedId}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: confirmCode }),
    });
    const data = await res.json();
    setConfirmMsg(data.message);
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-16 pt-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="brand-mark text-3xl text-leaf-deep">
          꽃줍
        </Link>
        <Countdown compact />
      </header>

      {step === "login" && (
        <section className="animate-rise space-y-5">
          <div>
            <h1 className="text-3xl font-black text-ink">상인 로그인</h1>
            <p className="mt-2 text-ink-soft">호수/구역만 입력하면 바로 등록할 수 있어요.</p>
          </div>
          <form onSubmit={saveLogin} className="space-y-3">
            <input
              className="field"
              placeholder="상호명 (예: 행복화훼)"
              value={session.sellerName}
              onChange={(e) => setSession({ ...session, sellerName: e.target.value })}
            />
            <input
              className="field"
              placeholder="구역 (예: 장미관 1층)"
              value={session.stallZone}
              onChange={(e) => setSession({ ...session, stallZone: e.target.value })}
            />
            <input
              className="field"
              placeholder="호수 (예: A-12)"
              value={session.stallCode}
              onChange={(e) => setSession({ ...session, stallCode: e.target.value })}
            />
            <button type="submit" className="btn-primary w-full">
              들어가기
            </button>
          </form>
        </section>
      )}

      {step === "capture" && (
        <section className="animate-rise space-y-4">
          <div>
            <p className="text-sm font-bold text-leaf">
              {session.stallZone} · {session.stallCode}
            </p>
            <h1 className="text-3xl font-black">10초 마감 떨이 등록</h1>
            <p className="mt-2 text-ink-soft">
              촬영 버튼을 누른 채 가격만 말하세요. 최대 10초면 끝납니다.
            </p>
          </div>

          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-black shadow-[var(--shadow)]">
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
            {imageDataUrl && !streamRef.current && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDataUrl} alt="미리보기" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {holding && (
              <div className="absolute inset-x-0 top-0 bg-petal/90 px-4 py-3 text-center text-sm font-bold text-white">
                녹음 중… {Math.min(10, Math.ceil(recordingMs / 1000))}초 / 10초
              </div>
            )}
          </div>

          <textarea
            className="field min-h-20"
            placeholder='음성 대신 입력도 가능: 예) "장미랑 리시안셔스 합쳐서 만 원에 떨이"'
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />

          <label className="btn-secondary w-full cursor-pointer">
            사진 업로드
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUploadImage(file);
              }}
            />
          </label>

          <button
            type="button"
            className={`btn-primary w-full text-lg ${holding ? "animate-pulse-glow scale-[1.02]" : ""}`}
            onMouseDown={() => startHold()}
            onMouseUp={() => void endHold()}
            onMouseLeave={() => {
              if (holding) void endHold();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              startHold();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              void endHold();
            }}
          >
            {holding ? "말하는 중… 손을 떼면 분석" : "길게 눌러 촬영 + 말하기"}
          </button>

          {imageDataUrl && (
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={() =>
                void runAnalyze({
                  imageDataUrl,
                  transcript: transcript || "만 원에 떨이",
                })
              }
            >
              사진만으로 AI 분석하기
            </button>
          )}
        </section>
      )}

      {step === "analyzing" && (
        <section className="animate-rise flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="brand-mark text-5xl text-petal">분석 중</div>
          <p className="mt-4 text-ink-soft">사진 + 음성을 상품 카드로 바꾸는 중…</p>
        </section>
      )}

      {step === "approve" && analysis && (
        <section className="animate-rise space-y-5">
          <div>
            <p className="text-sm font-bold text-leaf">
              AI 생성 {source === "mock" ? "(데모 모드)" : "(Gemini)"}
            </p>
            <h1 className="mt-1 text-4xl font-black leading-tight">{analysis.summary}</h1>
          </div>
          {imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageDataUrl} alt="등록 사진" className="aspect-square w-full rounded-[1.4rem] object-cover" />
          )}
          <ul className="space-y-2 rounded-[1.2rem] bg-white/80 p-4 text-sm">
            <li>
              <strong>구성:</strong>{" "}
              {analysis.flowers.map((f) => `${f.name}${f.approxStems ? ` ${f.approxStems}대` : ""}`).join(", ")}
            </li>
            <li>
              <strong>상태:</strong> {analysis.freshnessTag}
            </li>
            <li>
              <strong>혜택:</strong> 소매 대비 약 {analysis.discountRate}% 저렴
            </li>
          </ul>
          <button type="button" className="btn-primary w-full text-lg" onClick={() => void publish()}>
            올리기
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setStep("capture")}>
            다시 찍기
          </button>
        </section>
      )}

      {step === "done" && (
        <section className="animate-rise space-y-5 text-center">
          <h1 className="text-3xl font-black text-leaf">노출 시작!</h1>
          <p className="text-ink-soft">인근 소비자 피드에 바로 올라갔어요.</p>
          <Link href="/buyer" className="btn-secondary inline-flex">
            소비자 피드 보기
          </Link>
          <div className="rounded-[1.2rem] bg-white/85 p-5 text-left">
            <h2 className="font-bold">픽업 확인</h2>
            <p className="mt-1 text-sm text-ink-soft">손님이 보여준 4자리 번호를 입력하세요.</p>
            <div className="mt-3 flex gap-2">
              <input
                className="field"
                maxLength={4}
                placeholder="1234"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
              />
              <button type="button" className="btn-primary shrink-0 px-5" onClick={() => void confirmPickup()}>
                확인
              </button>
            </div>
            {confirmMsg && <p className="mt-3 text-sm font-bold text-leaf">{confirmMsg}</p>}
          </div>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setAnalysis(null);
              setImageDataUrl("");
              setTranscript("");
              setPostedId(null);
              setConfirmCode("");
              setConfirmMsg("");
              setStep("capture");
            }}
          >
            다음 떨이 등록
          </button>
        </section>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-petal/10 px-4 py-3 text-sm font-semibold text-petal">
          {error}
        </p>
      )}
    </main>
  );
}
