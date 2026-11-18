"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnalyzeResult, BloomState, SellerSession } from "@/lib/types";
import { AppHeader } from "@/components/AppHeader";
import { FinalProductPreview } from "@/components/FinalProductPreview";
import {
  clearSellerSession,
  readSellerSession,
  writeSellerSession,
} from "@/lib/auth-session";
import { compressImageDataUrl } from "@/lib/image";

type Step = "capture" | "analyzing" | "approve" | "preview" | "done";

const BLOOM_OPTIONS: BloomState[] = ["봉오리", "만개", "빠른 감상"];

function recalcDiscount(price: number, retailEstimate: number) {
  if (!retailEstimate || retailEstimate <= 0) return 0;
  return Math.max(0, Math.round((1 - price / retailEstimate) * 100));
}

function buildSummary(title: string, price: number) {
  const short = title.replace(/\s*떨이.*$/, "").trim() || title;
  return `${short} / ${price.toLocaleString("ko-KR")}원`;
}

export default function SellerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>("capture");
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
  const [transcribing, setTranscribing] = useState(false);
  const [recordingMs, setRecordingMs] = useState(0);
  const [postedId, setPostedId] = useState<string | null>(null);
  const [postedPickupCode, setPostedPickupCode] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const holdTimerRef = useRef<number | null>(null);
  const tickRef = useRef<number | null>(null);
  const frameRef = useRef<string>("");
  const holdingRef = useRef(false);
  const recordStartedAtRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const parsed = readSellerSession();
    if (!parsed) {
      router.replace("/");
      return;
    }
    setSession(parsed);
    writeSellerSession(parsed);
    setReady(true);
  }, [router]);

  const stopMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const clearRecordTimers = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (step !== "capture") {
      clearRecordTimers();
      holdingRef.current = false;
      setHolding(false);
      stopMic();
    }
  }, [step, stopMic, clearRecordTimers]);

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

  function pickRecorderMimeType() {
    if (typeof MediaRecorder === "undefined") return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  async function runAnalyze(opts: {
    imageDataUrl: string;
    audioBlob?: Blob | null;
    transcript?: string;
  }) {
    setStep("analyzing");
    setError("");
    try {
      const compressed = await compressImageDataUrl(opts.imageDataUrl);
      setImageDataUrl(compressed.dataUrl);
      frameRef.current = compressed.dataUrl;

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
          imageBase64: compressed.base64,
          imageMimeType: compressed.mimeType,
          audioBase64,
          audioMimeType,
          transcript: opts.transcript,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      const result = data.result as AnalyzeResult;
      const careTips = [...(result.careTips ?? [])];
      while (careTips.length < 3) careTips.push("");
      setAnalysis({
        ...result,
        careTips: careTips.slice(0, 3),
        flowers: result.flowers?.length ? result.flowers : [{ name: "", approxStems: 1 }],
        summary: result.summary || buildSummary(result.title, result.price),
        discountRate: recalcDiscount(result.price, result.retailEstimate),
      });
      setSource(data.source);
      if (data.source === "mock") {
        setError("AI(Gemini) 대신 데모 분석이 적용됐어요. 사진·색감이 다르면 직접 수정하세요.");
      }
      setStep("approve");
    } catch (err) {
      setError(err instanceof Error ? err.message : "분석 실패");
      setStep("capture");
    }
  }

  async function ensureMic() {
    if (streamRef.current) {
      const live = streamRef.current.getTracks().some((t) => t.readyState === "live");
      if (live) return streamRef.current;
      stopMic();
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("이 브라우저에서는 마이크 녹음을 지원하지 않아요.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;
    return stream;
  }

  async function transcribeBlob(audioBlob: Blob) {
    setTranscribing(true);
    setError("");
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64,
          audioMimeType: audioBlob.type || "audio/webm",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "음성 정리 실패");
      const text = String(data.text || "").trim();
      if (!text) throw new Error("정리된 텍스트가 비어 있어요.");
      setTranscript(text);
      if (data.source === "mock") {
        setError("AI 음성 정리 대신 데모 문장이 들어갔어요. 직접 고친 뒤 AI 요약 하기를 누르세요.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "음성 정리 실패");
    } finally {
      setTranscribing(false);
    }
  }

  async function startRecording() {
    if (holdingRef.current || transcribing) return;
    if (!imageDataUrl && !frameRef.current) {
      setError("먼저 사진을 업로드해주세요.");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("이 브라우저에서는 녹음을 지원하지 않아요. 아래에 직접 입력하세요.");
      return;
    }

    setError("");
    chunksRef.current = [];
    mediaRecorderRef.current = null;

    try {
      const stream = await ensureMic();
      const mimeType = pickRecorderMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      // timeslice: 손을 빨리 떼도 chunk가 쌓이도록
      recorder.start(200);

      holdingRef.current = true;
      setHolding(true);
      recordStartedAtRef.current = Date.now();
      setRecordingMs(0);

      tickRef.current = window.setInterval(() => {
        setRecordingMs(Date.now() - recordStartedAtRef.current);
      }, 100);

      holdTimerRef.current = window.setTimeout(() => {
        void stopRecordingAndTranscribe();
      }, 10000);
    } catch (err) {
      holdingRef.current = false;
      setHolding(false);
      clearRecordTimers();
      stopMic();
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("지원")
          ? msg
          : "마이크 권한이 필요합니다. 주소창 왼쪽 자물쇠에서 마이크를 허용한 뒤 다시 눌러주세요.",
      );
    }
  }

  async function stopRecordingAndTranscribe() {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    clearRecordTimers();
    setHolding(false);

    const recorder = mediaRecorderRef.current;
    const elapsed = Date.now() - recordStartedAtRef.current;

    let audioBlob: Blob | null = null;
    if (recorder && recorder.state !== "inactive") {
      audioBlob = await new Promise<Blob | null>((resolve) => {
        const finish = () => {
          const type = recorder.mimeType || pickRecorderMimeType() || "audio/webm";
          resolve(new Blob(chunksRef.current, { type }));
        };
        recorder.onstop = finish;
        try {
          if (recorder.state === "recording") recorder.requestData();
          recorder.stop();
        } catch {
          finish();
        }
      });
    }

    mediaRecorderRef.current = null;
    stopMic();

    if (elapsed < 600) {
      setError("너무 짧게 눌렀어요. 버튼을 한 번 눌러 녹음을 시작하고, 말한 뒤 다시 눌러 주세요.");
      return;
    }

    if (!audioBlob || audioBlob.size < 200) {
      setError("녹음이 비어 있어요. 마이크 권한을 확인한 뒤 다시 녹음하거나, 아래에 직접 입력하세요.");
      return;
    }

    await transcribeBlob(audioBlob);
  }

  function toggleRecording() {
    if (transcribing) return;
    if (holdingRef.current) {
      void stopRecordingAndTranscribe();
      return;
    }
    void startRecording();
  }

  function onUploadImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      frameRef.current = dataUrl;
      setImageDataUrl(dataUrl);
      setError("");
      // 마이크 권한을 미리 받아 두면 녹음 시작이 안정적
      void ensureMic().catch(() => {
        /* 사용자가 나중에 녹음 버튼에서 다시 허용하면 됨 */
      });
    };
    reader.readAsDataURL(file);
  }

  function updateAnalysis(patch: Partial<AnalyzeResult>) {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      if (patch.price !== undefined || patch.retailEstimate !== undefined) {
        next.discountRate = recalcDiscount(next.price, next.retailEstimate);
      }
      if (patch.title !== undefined || patch.price !== undefined) {
        if (patch.summary === undefined) {
          next.summary = buildSummary(next.title, next.price);
        }
      }
      // 요약만 고친 경우에도 상품명·구성과 맞추기
      if (patch.summary !== undefined && patch.title === undefined) {
        const fromSummary = patch.summary.split("/")[0]?.trim();
        if (fromSummary) next.title = fromSummary;
      }

      // 상품명을 바꾸면 구성 꽃(1개일 때)도 같이 맞춤 — 상인 입력 기준으로 통일
      if ((patch.title !== undefined || patch.summary !== undefined) && next.flowers.length === 1) {
        const cleaned = next.title.replace(/\s*떨이.*$/u, "").trim() || next.title;
        if (cleaned) {
          next.flowers = [{ ...next.flowers[0], name: cleaned }];
        }
      }
      return next;
    });
  }

  function goToPreview() {
    if (!analysis) return;
    let flowers = analysis.flowers.filter((f) => f.name.trim());
    if (flowers.length === 0 && analysis.title.trim()) {
      flowers = [{ name: analysis.title.trim(), approxStems: 1 }];
    }
    if (!analysis.title.trim() || !analysis.price) {
      setError("상품명과 가격을 확인해주세요.");
      return;
    }
    if (flowers.length === 0) {
      setError("AI 요약 하기를 먼저 실행하거나 구성을 입력해주세요.");
      return;
    }
    setAnalysis({ ...analysis, flowers });
    setError("");
    setStep("preview");
  }

  function updateFlower(index: number, patch: { name?: string; approxStems?: number }) {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const flowers = prev.flowers.map((f, i) => (i === index ? { ...f, ...patch } : f));
      return { ...prev, flowers };
    });
  }

  function addFlower() {
    setAnalysis((prev) => {
      if (!prev) return prev;
      return { ...prev, flowers: [...prev.flowers, { name: "", approxStems: 1 }] };
    });
  }

  function removeFlower(index: number) {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const flowers = prev.flowers.filter((_, i) => i !== index);
      return { ...prev, flowers: flowers.length ? flowers : [{ name: "", approxStems: 1 }] };
    });
  }

  function updateCareTip(index: number, value: string) {
    setAnalysis((prev) => {
      if (!prev) return prev;
      const careTips = [...prev.careTips];
      while (careTips.length < 3) careTips.push("");
      careTips[index] = value;
      return { ...prev, careTips: careTips.slice(0, 3) };
    });
  }

  async function publish() {
    if (!analysis) return;
    const flowers = analysis.flowers.filter((f) => f.name.trim());
    if (!analysis.title.trim() || !analysis.price || flowers.length === 0) {
      setError("최종 카드의 상품명·가격·구성을 확인해주세요.");
      setStep("approve");
      return;
    }
    setError("");
    try {
      const payload = {
        ...analysis,
        title: analysis.title.trim(),
        summary: analysis.summary || buildSummary(analysis.title, analysis.price),
        discountRate: recalcDiscount(analysis.price, analysis.retailEstimate),
        flowers,
        careTips: analysis.careTips.filter((t) => t.trim()),
        imageDataUrl,
        stallCode: session.stallCode,
        stallZone: session.stallZone,
        sellerName: session.sellerName,
      };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "등록 실패");
      setPostedId(data.product.id);
      setPostedPickupCode(data.product.pickupCode || null);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록 실패");
    }
  }

  const hasPhoto = Boolean(imageDataUrl);

  if (!ready) {
    return <main className="p-8 text-ink-soft">로그인 확인 중…</main>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-5 pb-16 pt-6">
      <AppHeader backLabel="홈" fallbackHref="/" />

      {step === "capture" && (
        <section className="animate-rise space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-leaf">
                {session.sellerName}
                {session.stallZone ? ` · ${session.stallZone}` : ""}
              </p>
              <button
                type="button"
                className="text-xs font-semibold text-ink-soft underline"
                onClick={() => {
                  clearSellerSession();
                  router.push("/");
                }}
              >
                로그아웃
              </button>
            </div>
            <Link
              href="/seller/products"
              className="mt-3 flex w-full items-center justify-center rounded-full bg-dawn px-4 py-2.5 text-sm font-bold text-leaf-deep shadow-sm transition hover:bg-leaf hover:text-white"
            >
              {session.sellerName} 상품 카드 확인하기
            </Link>
            <h1 className="mt-4 text-3xl font-black">10초 마감 떨이 등록</h1>
            <p className="mt-2 text-ink-soft">
              {hasPhoto
                ? "녹음 버튼을 눌러 말한 뒤 다시 누르면, AI가 아래 칸에 텍스트로 정리합니다."
                : "먼저 꽃 양동이 사진 한 장을 업로드해주세요."}
            </p>
          </div>

          <div className="relative aspect-[3/4] overflow-hidden rounded-[1.5rem] bg-leaf-deep/20 shadow-[var(--shadow)]">
            {hasPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDataUrl} alt="업로드한 꽃 사진" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <p className="text-lg font-bold text-ink">1단계 · 사진 업로드</p>
                <p className="text-sm text-ink-soft">남은 꽃 양동이 사진을 올려주세요</p>
              </div>
            )}
            {holding && (
              <div className="absolute inset-x-0 top-0 bg-petal/90 px-4 py-3 text-center text-sm font-bold text-white">
                녹음 중… {Math.min(10, Math.ceil(recordingMs / 1000))}초 / 10초
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadImage(file);
              e.target.value = "";
            }}
          />

          {!hasPhoto ? (
            <button
              type="button"
              className="btn-primary w-full text-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              사진 업로드
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                사진 재업로드
              </button>

              <textarea
                className="field min-h-20"
                placeholder='음성 대신 입력도 가능: 예) "장미랑 리시안셔스 합쳐서 만 원에 떨이"'
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                disabled={transcribing}
              />

              <button
                type="button"
                disabled={transcribing}
                className={`btn-primary w-full text-lg ${holding ? "animate-pulse-glow scale-[1.02]" : ""}`}
                onClick={() => toggleRecording()}
              >
                {holding
                  ? `녹음 중 ${Math.min(10, Math.ceil(recordingMs / 1000))}초 · 다시 눌러 완료`
                  : transcribing
                    ? "AI가 음성 정리 중…"
                    : "눌러서 말하기 (최대 10초)"}
              </button>

              <button
                type="button"
                className="btn-secondary w-full"
                disabled={transcribing}
                onClick={() =>
                  void runAnalyze({
                    imageDataUrl,
                    transcript: transcript || undefined,
                  })
                }
              >
                AI 요약 하기
              </button>
            </>
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
              AI 생성 {source === "mock" ? "(데모 모드)" : "(Gemini)"} · 탭해서 수정
            </p>
            <input
              className="mt-2 w-full border-0 bg-transparent p-0 text-3xl font-black leading-tight text-ink outline-none"
              value={analysis.summary}
              onChange={(e) => updateAnalysis({ summary: e.target.value })}
              aria-label="상품 요약"
            />
            <p className="mt-1 text-xs text-ink-soft">위 요약을 직접 고쳐도 됩니다</p>
          </div>

          {imageDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageDataUrl}
              alt="등록 사진"
              className="aspect-square w-full rounded-[1.4rem] object-cover"
            />
          )}

          <div className="space-y-4 rounded-[1.2rem] bg-white/90 p-4 shadow-sm">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-bold">오늘 구출 구성 (상인 입력)</p>
                <button type="button" className="text-sm font-bold text-leaf" onClick={addFlower}>
                  + 꽃 추가
                </button>
              </div>
              <p className="mb-2 text-xs text-ink-soft">
                AI 추측이 틀리면 여기서 사진/말씀하신 내용으로 꼭 고쳐주세요. 소비자 화면에 그대로
                나갑니다.
              </p>
              <div className="space-y-2">
                {analysis.flowers.map((flower, index) => (
                  <div key={`flower-${index}`} className="flex gap-2">
                    <input
                      className="field"
                      placeholder="꽃 이름 (예: 핑크 튤립)"
                      value={flower.name}
                      onChange={(e) => updateFlower(index, { name: e.target.value })}
                    />
                    <input
                      className="field w-24 shrink-0"
                      type="number"
                      min={0}
                      placeholder="대수"
                      value={flower.approxStems ?? ""}
                      onChange={(e) =>
                        updateFlower(index, {
                          approxStems: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <button
                      type="button"
                      className="shrink-0 px-2 text-sm font-bold text-petal"
                      onClick={() => removeFlower(index)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <label className="block text-sm font-bold">
              상태
              <input
                className="field mt-1"
                value={analysis.freshnessTag}
                onChange={(e) => updateAnalysis({ freshnessTag: e.target.value })}
                placeholder="예: 지금 가장 예쁜 만개"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold">
                개화 상태
                <select
                  className="field mt-1"
                  value={analysis.bloomState}
                  onChange={(e) =>
                    updateAnalysis({ bloomState: e.target.value as BloomState })
                  }
                >
                  {BLOOM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold">
                수량
                <input
                  className="field mt-1"
                  type="number"
                  min={1}
                  value={analysis.quantity}
                  onChange={(e) =>
                    updateAnalysis({ quantity: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-bold">
                판매가 (원)
                <input
                  className="field mt-1"
                  type="number"
                  min={0}
                  value={analysis.price}
                  onChange={(e) => updateAnalysis({ price: Number(e.target.value) || 0 })}
                />
              </label>
              <label className="block text-sm font-bold">
                소매 추정가 (원)
                <input
                  className="field mt-1"
                  type="number"
                  min={0}
                  value={analysis.retailEstimate}
                  onChange={(e) =>
                    updateAnalysis({ retailEstimate: Number(e.target.value) || 0 })
                  }
                />
              </label>
            </div>

            <p className="text-sm font-semibold text-petal">
              혜택: 소매 대비 약 {analysis.discountRate}% 저렴
            </p>

            <label className="block text-sm font-bold">
              상품명
              <input
                className="field mt-1"
                value={analysis.title}
                onChange={(e) => updateAnalysis({ title: e.target.value })}
              />
            </label>

            <label className="block text-sm font-bold">
              색감 키워드 (쉼표)
              <input
                className="field mt-1"
                value={analysis.colorKeywords.join(", ")}
                onChange={(e) =>
                  updateAnalysis({
                    colorKeywords: e.target.value
                      .split(",")
                      .map((k) => k.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-bold">관리 팁</p>
              <div className="space-y-2">
                {(analysis.careTips.length ? analysis.careTips : ["", "", ""]).map(
                  (tip, index) => (
                    <input
                      key={`tip-${index}`}
                      className="field"
                      placeholder={`${index + 1}번째 팁`}
                      value={tip}
                      onChange={(e) => updateCareTip(index, e.target.value)}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          <button type="button" className="btn-primary w-full text-lg" onClick={goToPreview}>
            최종 카드 확인
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              setAnalysis(null);
              setStep("capture");
            }}
          >
            이전으로
          </button>
        </section>
      )}

      {step === "preview" && analysis && (
        <section className="animate-rise space-y-5">
          <div>
            <p className="text-sm font-bold text-leaf">소비자에게 이렇게 보여요</p>
            <h1 className="mt-1 text-2xl font-black">최종 카드 미리보기</h1>
            <p className="mt-2 text-sm text-ink-soft">
              구성·가격·상태는 위에서 수정한 상인 입력값 그대로입니다. 확인 후 업로드하세요.
            </p>
          </div>

          <FinalProductPreview
            analysis={analysis}
            session={session}
            imageDataUrl={imageDataUrl}
          />

          <button type="button" className="btn-primary w-full text-lg" onClick={() => void publish()}>
            업로드
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setStep("approve")}>
            수정하기
          </button>
        </section>
      )}

      {step === "done" && (
        <section className="animate-rise space-y-5 text-center">
          <h1 className="text-3xl font-black text-leaf">노출 시작!</h1>
          <p className="text-ink-soft">소비자 피드에 바로 올라갔어요.</p>
          <div className="rounded-[1.4rem] bg-leaf-deep p-6 text-white">
            <p className="text-sm font-semibold text-white/80">픽업 번호</p>
            <p className="brand-mark mt-2 text-6xl tracking-widest">
              {postedPickupCode || "----"}
            </p>
            <p className="mt-3 text-sm text-white/85">
              손님이 예약하면 같은 번호를 보여줍니다. 이 번호로 꽃을 건네주세요.
            </p>
          </div>
          {postedId && (
            <p className="text-xs text-ink-soft">상품 ID: {postedId}</p>
          )}
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setAnalysis(null);
              setImageDataUrl("");
              frameRef.current = "";
              setTranscript("");
              setPostedId(null);
              setPostedPickupCode(null);
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
