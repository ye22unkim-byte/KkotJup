"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { writeBuyerSession, writeSellerSession } from "@/lib/auth-session";

type Mode = "closed" | "menu" | "guest" | "seller";

export function LoginPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("closed");
  const [nickname, setNickname] = useState("");
  const [shopName, setShopName] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function openMenu() {
    setError("");
    setMode("menu");
  }

  function closeAll() {
    setMode("closed");
    setError("");
  }

  function loginGuest(e: React.FormEvent) {
    e.preventDefault();
    const name = nickname.trim();
    if (!name) {
      setError("닉네임을 입력해주세요.");
      return;
    }
    writeBuyerSession({ nickname: name });
    router.push("/buyer");
  }

  async function loginSeller(e: React.FormEvent) {
    e.preventDefault();
    const name = shopName.trim();
    if (!name) {
      setError("가게 이름은 필수입니다.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/sellers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName: name, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "로그인 실패");

      writeSellerSession({
        id: data.seller.id,
        sellerName: data.seller.shopName,
        stallZone: data.seller.location || "",
        stallCode: data.seller.shopName,
      });
      router.push("/seller");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {mode === "closed" && (
        <button
          type="button"
          className="btn-primary w-full animate-pulse-glow text-lg shadow-[0_12px_28px_rgba(214,116,141,0.28)]"
          onClick={openMenu}
        >
          로그인
        </button>
      )}

      {mode === "menu" && (
        <div className="space-y-2 rounded-[1.2rem] border border-[var(--line)] bg-[#fffaf4]/90 p-4 shadow-sm">
          <p className="text-sm font-bold text-ink">어떻게 로그인할까요?</p>
          <button
            type="button"
            className="btn-primary w-full"
            onClick={() => {
              setError("");
              setMode("guest");
            }}
          >
            손님으로 로그인
          </button>
          <button
            type="button"
            className="btn-secondary w-full"
            onClick={() => {
              setError("");
              setMode("seller");
            }}
          >
            상인으로 로그인
          </button>
          <button
            type="button"
            className="w-full py-2 text-sm font-semibold text-ink-soft underline"
            onClick={closeAll}
          >
            닫기
          </button>
        </div>
      )}

      {mode === "guest" && (
        <form
          onSubmit={loginGuest}
          className="space-y-3 rounded-[1.2rem] border border-[var(--line)] bg-[#fffaf4]/90 p-4 shadow-sm"
        >
          <p className="text-sm font-bold">손님 로그인</p>
          <input
            className="field"
            placeholder="닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1">
              로그인
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode("menu")}>
              뒤로
            </button>
          </div>
        </form>
      )}

      {mode === "seller" && (
        <form
          onSubmit={(e) => void loginSeller(e)}
          className="space-y-3 rounded-[1.2rem] border border-[var(--line)] bg-[#fffaf4]/90 p-4 shadow-sm"
        >
          <p className="text-sm font-bold">상인 로그인</p>
          <input
            className="field"
            placeholder="가게 이름 (필수)"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            autoFocus
          />
          <input
            className="field"
            placeholder="자세한 위치 (선택, 예: 장미관 1층 A-12)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <p className="text-xs text-ink-soft">
            이미 등록된 가게 이름이면 그대로 입장하고, 없으면 새로 등록됩니다.
          </p>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={loading}>
              {loading ? "확인 중…" : "로그인"}
            </button>
            <button type="button" className="btn-secondary" onClick={() => setMode("menu")}>
              뒤로
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="rounded-xl bg-petal/10 px-3 py-2 text-sm font-semibold text-petal">{error}</p>
      )}
    </div>
  );
}
