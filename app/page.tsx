"use client";
//
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { skinIssueIndexP, buildCalendarP, buildCalendarFromDaily } from "@/lib/logic";
import { COUNTRIES, FALLBACK_CLIMATE } from "@/lib/places";
import { fetchWeather, type WeatherResult } from "@/lib/weather";
import {
  recommendCosmetics,
  recommendVolume,
  samplePrice,
  SAMPLE_TIERS,
  COSMETICS,
  type Cosmetic,
} from "@/lib/products";
import { StyleNoteModal } from "@/components/style-note";
import { ComplianceBadge } from "@/components/compliance-badge";
import { IngredientSafety } from "@/components/ingredient-safety";
import {
  signup as authSignup,
  login as authLogin,
  findAccount,
  saveSkinToAccount,
  daysAgoLabel,
  getSession,
  clearSession,
  getRememberedId,
  setRememberedId,
  isAutoLoginEnabled,
  setAutoLogin,
  findAccountsByName,
  maskId,
  resetPassword,
  saveProductToAccount,
  getSavedProducts,
  removeSavedProduct,
  type SavedProduct,
} from "@/lib/auth";
import type { ScanResult } from "@/lib/scan-types";
import {
  PassportTopBar,
  PassportEyebrow,
  PassportTitle,
  PassportKSub,
  PassportField,
  PassportButton,
  PassportDivider,
  PassportBackLink,
  PassportError,
  PassportBarcode,
  PassportNote,
  PassportOptionCard,
  PassportFooter,
  PassportStampChip,
  PassportTag,
  PassportPlaneIcon,
  PassportBeachIcon,
  PassportSurveyIcon,
} from "@/components/passport-ui";
import { CLIMATE_BY_COUNTRY, CLIMATE_PROFILE, CONCERNS } from "@/lib/aftercare-data";
import { AcScreenChrome, AcLabel, AcOpt, AcChip, AcBtnBar, AcBtn, AcTripCard, AcStampRect, AcStampSeal, AcProductCard, acStyles } from "@/components/aftercare-ui";
import { DestinationCareTab } from "@/components/destination-ui";

type Stage =
  | "intro"
  | "login"
  | "findId"
  | "findPw"
  | "signup"
  | "member"
  | "checkin"
  | "journey"
  | "travel"
  | "skin"
  | "scan"
  | "acArrival"
  | "acQ1"
  | "acQ2"
  | "acQ3"
  | "acResult"
  | "result"
  | "receive"
  | "delivery"
  | "pickup"
  | "payment"
  | "done";
const EASE = [0.22, 1, 0.36, 1] as const;
// 공용 테스트 계정 — 개인정보 입력 없이 모든 기능을 바로 체험할 수 있는 공유 게스트 계정
const COSMAX_GUEST = {
  id: "cosmax-guest",
  password: "cosmax-guest-2026",
  name: "COSMAX 게스트",
  age: "25",
  gender: "여성",
};
// 로딩(발급) 화면 스캔 바코드용 고정 막대 높이(%) 패턴
const ANALYZE_BARS = [40, 70, 30, 90, 52, 62, 34, 80, 46, 66, 54, 76, 40, 86, 30, 60, 50, 70, 36, 90, 44, 56, 64, 40, 80, 30, 74, 50, 60, 36, 86, 46, 70, 54, 40, 66, 30, 80, 50, 62, 36, 76, 46, 90, 40, 56];

/* ════════════════════════ [6-1] 여정 타임라인 ════════════════════════ */
const CHECKLIST_ITEMS = [
  "여권/신분증 확인",
  "소용량 스킨케어 키트 도착 확인",
  "기내 반입 규정(100ml 이하) 확인",
  "충전기·여행자보험 등 준비물 점검",
];
// 귀국 후 진정·장벽 회복 루틴 추천 (판테놀 진정 세럼 + 세라마이드 배리어 크림)
const RECOVERY_IDS = ["layerlab-panthenol", "estra-atobarrier"];
// "직접 고르기" 카테고리 탭 — 전체 카탈로그(lib/products.ts) 기준
const PICK_CATEGORIES = Array.from(new Set(COSMETICS.map((c) => c.category)));

/* ════════════════════════ [6-2]~[6-4] 장바구니 · 수령 · 완료 ════════════════════════ */
const PICKUP_AIRPORTS = ["인천공항 T1", "인천공항 T2", "김포공항", "김해공항", "제주공항"];
function buildPickupTimeSlots() {
  const slots: string[] = [];
  for (let h = 5; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) continue;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
const PICKUP_TIME_SLOTS = buildPickupTimeSlots();
function genOrderNo() {
  return "BP" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
function genLockerNo() {
  const letter = "ABCDEF"[Math.floor(Math.random() * 6)];
  const num = Math.floor(Math.random() * 89) + 10;
  return `${letter}-${num}`;
}
type CartLine = { item: { id: string; ml: number; qty: number }; p: Cosmetic; unit: number; lineTotal: number };

/* ════════════════════════ 도트 지구본 (인트로) ════════════════════════ */
// 저해상 대륙 마스크 (ROWS x COLS, 등장방형). 세그먼트 [시작열, 끝열]로 육지 표기.
const GLOBE_ROWS = 24;
const GLOBE_COLS = 48;
const LAND: [number, number][][] = [
  [], // +90
  [[9, 13], [17, 19], [33, 43]],
  [[7, 15], [16, 19], [30, 45]],
  [[5, 16], [24, 27], [28, 46]],
  [[4, 16], [22, 27], [28, 46]],
  [[5, 15], [22, 28], [29, 46]],
  [[6, 14], [22, 31], [32, 45]],
  [[7, 13], [21, 29], [30, 43], [45, 46]],
  [[9, 13], [21, 31], [33, 43]],
  [[10, 12], [20, 29], [32, 35], [37, 42]],
  [[11, 12], [20, 28], [33, 34], [37, 42]],
  [[14, 18], [20, 28], [38, 44]],
  [[13, 19], [21, 28], [38, 45]], // 적도
  [[14, 20], [22, 28], [39, 44]],
  [[14, 20], [23, 27], [40, 46]],
  [[14, 19], [24, 27], [39, 47]],
  [[15, 18], [25, 26], [40, 46]],
  [[15, 17], [47, 47]],
  [[15, 16]],
  [[15, 15]],
  [],
  [],
  [[0, 47]], // 남극
  [[0, 47]],
];

function isLand(lat: number, lon: number) {
  let row = Math.floor(((90 - lat) / 180) * GLOBE_ROWS);
  row = Math.max(0, Math.min(GLOBE_ROWS - 1, row));
  let col = Math.floor(((lon + 180) / 360) * GLOBE_COLS);
  col = ((col % GLOBE_COLS) + GLOBE_COLS) % GLOBE_COLS;
  for (const [a, b] of LAND[row]) if (col >= a && col <= b) return true;
  return false;
}

// 도트 비행기: 3D 포인트 클라우드 (기체/날개/꼬리/엔진). +z가 기수 방향.
function buildPlanePoints(): [number, number, number][] {
  const P: [number, number, number][] = [];
  const push = (x: number, y: number, z: number) => P.push([x, y, z]);
  // 동체(원형 단면 링)
  for (let z = -3; z <= 3.001; z += 0.2) {
    let r = 0.3;
    if (z > 2.0) r = 0.3 * Math.max(0.06, 1 - (z - 2.0) / 1.25); // 기수 테이퍼
    if (z < -2.3) r = 0.3 * Math.max(0.06, 1 - (-2.3 - z) / 0.9); // 꼬리 테이퍼
    const ring = 8;
    for (let k = 0; k < ring; k++) {
      const a = (k / ring) * Math.PI * 2;
      push(Math.cos(a) * r, Math.sin(a) * r * 0.82, z);
    }
  }
  // 주익 (후퇴각·테이퍼)
  for (let s = -1; s <= 1; s += 2) {
    for (let u = 0; u <= 1.0001; u += 0.05) {
      const x = s * (0.28 + u * 2.3);
      const z = 0.6 - u * 1.15;
      const chord = 0.95 * (1 - u * 0.72);
      for (let c = 0; c <= 1.0001; c += 0.25) push(x, -0.05, z - chord * c + chord * 0.5);
    }
  }
  // 윙렛
  for (let s = -1; s <= 1; s += 2) for (let u = 0; u <= 1.0001; u += 0.25) push(s * 2.55, -0.05 + u * 0.34, -0.55 - u * 0.06);
  // 수직 꼬리날개
  for (let u = 0; u <= 1.0001; u += 0.08) {
    const y = 0.22 + u * 1.0;
    const z0 = -2.5 - u * 0.18;
    for (let c = 0; c <= 1.0001; c += 0.34) push(0, y, z0 + c * 0.34 * (1 - u));
  }
  // 수평 안정판
  for (let s = -1; s <= 1; s += 2) for (let u = 0; u <= 1.0001; u += 0.12) {
    const x = s * (0.1 + u * 0.95);
    for (let c = 0; c <= 1.0001; c += 0.4) push(x, 0.05, -2.45 + c * 0.3 * (1 - u));
  }
  // 엔진 2기
  for (let s = -1; s <= 1; s += 2) for (let a = 0; a < Math.PI * 2; a += Math.PI / 4)
    for (let z = 0.3; z <= 0.95; z += 0.22) push(0.95 * s + Math.cos(a) * 0.17, -0.26 + Math.sin(a) * 0.17, z);
  return P.map((p) => [p[0] * 0.2, p[1] * 0.2, p[2] * 0.2]);
}
const PLANE_POINTS = buildPlanePoints();
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

function DotGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let running = true;
    let angle = 0;
    let startTs = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const ramp = " .·:+*xX#@";
    const lx = -0.5;
    const ly = -0.45;
    const lz = 0.74;
    // 비행기 궤적 타이밍(ms): 지연 후 지구본을 한 바퀴 돌아 화면 밖으로
    const PLANE_DELAY = 800;
    const PLANE_DUR = 4200;
    const camZ = 4.2; // 카메라 위치 (0,0,camZ), -z 를 바라봄
    const Rw = 1.4; // 지구본 월드 반경

    const resize = () => {
      canvas.width = Math.floor(canvas.clientWidth * DPR);
      canvas.height = Math.floor(canvas.clientHeight * DPR);
    };
    resize();

    const frame = (ts: number) => {
      if (!running) return;
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.fillStyle = "#f4f6f9";
      ctx.fillRect(0, 0, W, H);

      const ppx = W / 2;
      const ppy = H / 2;
      // 지구본을 화면 위쪽으로 올려 배치
      const gsy = H * 0.4;
      const Rpx = Math.min(W, H) * 0.44;
      // 지구본 화면 반경(Rpx)에 맞춰 원근 초점거리 f 산출 → 비행기 원근과 일관
      const f = (Rpx * Math.sqrt(camZ * camZ - Rw * Rw)) / Rw;
      const Gcy = ((ppy - gsy) * camZ) / f; // 지구본 중심 월드 y

      // 윤곽을 살려주는 은은한 배경 원반 (흰 배경에서 구가 도드라지게)
      const backing = ctx.createRadialGradient(ppx, gsy, Rpx * 0.15, ppx, gsy, Rpx * 1.06);
      backing.addColorStop(0, "rgba(110,140,175,0.16)");
      backing.addColorStop(0.7, "rgba(110,140,175,0.08)");
      backing.addColorStop(1, "rgba(110,140,175,0)");
      ctx.fillStyle = backing;
      ctx.beginPath();
      ctx.arc(ppx, gsy, Rpx * 1.06, 0, Math.PI * 2);
      ctx.fill();

      // ── 지구본 (도트) ──
      const cell = 9;
      const cols = Math.ceil(W / cell);
      const rows = Math.ceil(H / cell);
      ctx.font = `bold ${cell}px ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = i * cell + cell / 2;
          const py = j * cell + cell / 2;
          const nx = (px - ppx) / Rpx;
          const ny = (py - gsy) / Rpx;
          const r2 = nx * nx + ny * ny;
          if (r2 > 1) continue;
          const nz = Math.sqrt(1 - r2);
          const mx = nx * cosA - nz * sinA;
          const mz = nx * sinA + nz * cosA;
          const my = -ny;
          const lat = (Math.asin(Math.max(-1, Math.min(1, my))) * 180) / Math.PI;
          const lon = (Math.atan2(mx, mz) * 180) / Math.PI;
          const land = isLand(lat, lon);
          const diff = Math.max(0, nx * lx + -ny * ly + nz * lz);
          let b = (land ? 0.98 : 0.52) + (land ? 0.1 : 0.16) * diff;
          b *= 0.78 + 0.22 * nz;
          b *= 0.96 + 0.04 * Math.random();
          if (b < 0.12) continue;
          const ch = ramp[Math.max(0, Math.min(ramp.length - 1, Math.floor(b * ramp.length)))];
          ctx.fillStyle = `rgba(12,16,22,${Math.min(1, b)})`;
          ctx.fillText(ch, px, py);
        }
      }
      angle += 0.005;

      // ── 도트 비행기 (지구본을 도는 3D 궤도, 뒤로 가면 가려짐) ──
      const t = (elapsed - PLANE_DELAY) / PLANE_DUR;
      if (t >= 0 && t <= 1) {
        const S = 0.42; // 기체 크기(작게)
        const fade = Math.min(1, t / 0.1) * Math.min(1, (1 - t) / 0.14);
        // 지구본 주위 궤도 위치 (front = +z 카메라 쪽)
        const orbit = (tt: number): [number, number, number] => {
          const e = easeInOut(tt);
          const theta = -2.6 + 3.9 * e; // 뒤(좌)에서 앞(우)으로 회전
          const rho = Rw * (1.14 + 1.5 * tt * tt); // 후반부 바깥으로 이탈
          return [rho * Math.sin(theta), Gcy + Rw * (-0.2 + 0.95 * e), rho * Math.cos(theta)];
        };
        const P0 = orbit(t);
        const P1 = orbit(Math.min(1, t + 0.02));
        // 진행방향(기수) 기준 정규직교 기저
        let fx = P1[0] - P0[0], fy = P1[1] - P0[1], fz = P1[2] - P0[2];
        const fl = Math.hypot(fx, fy, fz) || 1;
        fx /= fl; fy /= fl; fz /= fl;
        let rx = fz, ry = 0, rz = -fx; // cross(worldUp, forward)
        const rl = Math.hypot(rx, ry, rz) || 1;
        rx /= rl; ry /= rl; rz /= rl;
        const ux = fy * rz - fz * ry; // cross(forward, right)
        const uy = fz * rx - fx * rz;
        const uz = fx * ry - fy * rx;
        const roll = -0.5; // 뱅크
        const cr = Math.cos(roll), sr = Math.sin(roll);
        // 오클루전용 상수 (카메라-구 교차)
        const ocY = -Gcy, ocZ = camZ; // (O - Sc), O=(0,0,camZ) Sc=(0,Gcy,0)
        const cc = Gcy * Gcy + camZ * camZ - Rw * Rw;
        ctx.globalAlpha = Math.max(0, Math.min(1, fade));
        ctx.fillStyle = "rgba(9,11,15,1)"; // 지구본보다 아주 조금 진하게
        for (const p of PLANE_POINTS) {
          // 기수축(local z) 기준 뱅크 회전
          const rlx = cr * p[0] - sr * p[1];
          const rly = sr * p[0] + cr * p[1];
          const rlz = p[2];
          // 기저로 월드 오프셋
          const wx = P0[0] + S * (rx * rlx + ux * rly + fx * rlz);
          const wy = P0[1] + S * (ry * rlx + uy * rly + fy * rlz);
          const wz = P0[2] + S * (rz * rlx + uz * rly + fz * rlz);
          // 지구본에 가려지는가? (카메라→점 선분이 구를 먼저 통과)
          const dx = wx, dy = wy, dz = wz - camZ;
          const a = dx * dx + dy * dy + dz * dz;
          const bq = 2 * (dy * ocY + dz * ocZ);
          const disc = bq * bq - 4 * a * cc;
          if (disc >= 0) {
            const u1 = (-bq - Math.sqrt(disc)) / (2 * a);
            if (u1 > 0.001 && u1 < 0.999) continue; // 구 뒤 → 가림
          }
          const depth = camZ - wz;
          if (depth <= 0.15) continue;
          const sx = ppx + (wx / depth) * f;
          const sy = ppy - (wy / depth) * f;
          const r = Math.max(0.9, Math.min(2.4, (f / depth) * 0.02 * S));
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} className="h-full w-full" />;
}

/* ════════════════════════ 비주얼 시스템 (본편) ════════════════════════ */

function Grain() {
  return (
    <svg className="pointer-events-none absolute inset-0 z-40 h-full w-full opacity-[0.06] mix-blend-overlay">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
}

function Sky({ warm = false }: { warm?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: warm
            ? "linear-gradient(180deg,#e9f4fb 0%,#d3e6f2 40%,#cfe0ee 70%,#f3e6cf 100%)"
            : "linear-gradient(180deg,#e4eff8 0%,#cfe1f0 42%,#bcd6ea 78%,#aecbe2 100%)",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: "radial-gradient(120% 80% at 50% 0%,rgba(255,255,255,0.55),transparent 60%)" }} />
      <div className="absolute inset-0" style={{ boxShadow: "inset 0 -80px 120px rgba(120,150,180,0.28), inset 0 40px 90px rgba(255,255,255,0.35)" }} />
    </div>
  );
}

function VCloud({
  className,
  w = 200,
  delay = 0,
  from = "left",
  drift = 16,
}: {
  className?: string;
  w?: number;
  delay?: number;
  from?: "left" | "right";
  drift?: number;
}) {
  return (
    <motion.div
      className={`pointer-events-none absolute ${className ?? ""}`}
      style={{ width: w, filter: "drop-shadow(0 16px 20px rgba(110,150,185,0.35))" }}
      initial={{ opacity: 0, x: from === "left" ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 1, ease: EASE }}
    >
      <motion.div animate={{ x: [0, drift, 0], y: [0, -5, 0] }} transition={{ duration: 9 + delay, repeat: Infinity, ease: "easeInOut" }}>
        <svg viewBox="0 0 200 116" className="w-full">
          <defs>
            <radialGradient id="cg" cx="42%" cy="28%" r="80%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="62%" stopColor="#eef5fb" />
              <stop offset="100%" stopColor="#cbdcec" />
            </radialGradient>
          </defs>
          <g fill="url(#cg)">
            <ellipse cx="70" cy="78" rx="66" ry="34" />
            <ellipse cx="118" cy="72" rx="60" ry="40" />
            <circle cx="70" cy="52" r="34" />
            <circle cx="112" cy="44" r="40" />
            <circle cx="150" cy="60" r="30" />
          </g>
        </svg>
      </motion.div>
    </motion.div>
  );
}

function Jet({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 280 140" className={className} style={style}>
      <defs>
        <linearGradient id="jbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f1f6fb" />
          <stop offset="1" stopColor="#cfdcea" />
        </linearGradient>
        <linearGradient id="jwing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef4fa" />
          <stop offset="1" stopColor="#b9cbdd" />
        </linearGradient>
        <linearGradient id="jtail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb59a" />
          <stop offset="1" stopColor="#ff8f7a" />
        </linearGradient>
      </defs>
      <path d="M182 56 L246 22 L242 62 L196 70 Z" fill="url(#jwing)" />
      <path d="M244 74 Q262 68 258 58 L236 64 Z" fill="url(#jtail)" />
      <path d="M20 78 Q78 52 158 55 Q222 57 252 74 Q222 90 158 89 Q80 93 34 90 Q10 88 20 78 Z" fill="url(#jbody)" />
      <path d="M20 78 Q8 82 34 90 Q22 84 20 78 Z" fill="#c2d2e2" />
      <path d="M98 84 L156 114 L184 109 L138 82 Z" fill="url(#jwing)" />
      <path d="M42 74 Q130 62 232 70 L232 76 Q130 68 42 80 Z" fill="#ff9f7a" opacity="0.9" />
      {[60, 82, 104, 126, 148, 170, 192].map((x) => (
        <circle key={x} cx={x} cy={70} r="3.3" fill="#9cc6e6" />
      ))}
      <path d="M28 74 Q36 66 48 66 L48 74 Z" fill="#9cc6e6" />
      <ellipse cx="150" cy="63" rx="90" ry="4" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}

function AmbientClouds() {
  return (
    <>
      <VCloud className="left-2 top-14" w={140} delay={0.1} />
      <VCloud className="right-0 top-32" w={165} from="right" delay={0.5} drift={-16} />
      <VCloud className="left-6 top-52" w={110} delay={0.9} />
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-transparent bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] text-white shadow-[0_8px_18px_rgba(255,127,168,0.4)]"
          : "border-white/70 bg-white/60 text-[#2b6b86] backdrop-blur hover:bg-white/90"
      }`}
    >
      {children}
    </motion.button>
  );
}

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      className="w-full rounded-[14px] bg-[#0a0a0a] px-6 py-4 text-[15px] font-extrabold text-white transition disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
    >
      {children}
    </motion.button>
  );
}

// 여권 페이지 넘김 느낌의 전환
const stageVariants: Variants = {
  hidden: { opacity: 0, rotateY: 32, y: 8 },
  show: { opacity: 1, rotateY: 0, y: 0, transition: { duration: 0.55, ease: EASE } },
  exit: { opacity: 0, rotateY: -32, y: -8, transition: { duration: 0.35, ease: EASE } },
};

/* ════════════════════════ 피부 설문 (Baumann 16-타입) ════════════════════════ */
// Leslie Baumann, 'The Skin Type Solution' — 4개 축의 조합으로 피부를 16가지로 분류한다.
//   1) 건성(D) ↔ 지성(O)   2) 민감(S) ↔ 저항(R)   3) 색소(P) ↔ 무색소(N)   4) 주름(W) ↔ 탱탱(T)
// 각 축을 한 문항씩, 총 4문항으로 물어 MBTI처럼 4글자 코드(예: DSNW)로 타입을 도출한다.
type AxisOption = { letter: string; ko: string; en: string; desc: string; icon: string };
const BAUMANN_AXES: { key: string; sectionEn: string; sectionKo: string; q: string; hint: string; a: AxisOption; b: AxisOption }[] = [
  {
    key: "hydration",
    sectionEn: "Hydration",
    sectionKo: "유·수분",
    q: "세안 후, 아무것도 안 바르면?",
    hint: "유·수분 밸런스를 가르는 축이에요.",
    a: { letter: "D", ko: "건조", en: "Dry", desc: "당기고 각질·가려움이 잘 생겨요", icon: "🏜️" },
    b: { letter: "O", ko: "지성", en: "Oily", desc: "번들거리고 피지·모공이 신경 쓰여요", icon: "💧" },
  },
  {
    key: "sensitivity",
    sectionEn: "Sensitivity",
    sectionKo: "민감도",
    q: "새 제품이나 환경 변화에?",
    hint: "장벽이 자극에 반응하는 정도예요.",
    a: { letter: "S", ko: "민감", en: "Sensitive", desc: "붉어짐·따가움·트러블이 쉽게 올라와요", icon: "🔥" },
    b: { letter: "R", ko: "저항", en: "Resistant", desc: "웬만해선 자극 없이 튼튼한 편이에요", icon: "🛡️" },
  },
  {
    key: "pigment",
    sectionEn: "Pigmentation",
    sectionKo: "색소",
    q: "잡티·기미 같은 색소는?",
    hint: "햇볕 노출 뒤 흔적이 남는 정도예요.",
    a: { letter: "P", ko: "색소", en: "Pigmented", desc: "기미·잡티·자국이 잘 생기고 오래가요", icon: "☀️" },
    b: { letter: "N", ko: "무색소", en: "Non-pigmented", desc: "색소 침착이 적고 톤이 균일해요", icon: "🤍" },
  },
  {
    key: "wrinkle",
    sectionEn: "Aging",
    sectionKo: "주름·탄력",
    q: "주름·탄력은 어떤가요?",
    hint: "광노화·주름 경향을 가르는 축이에요.",
    a: { letter: "W", ko: "주름", en: "Wrinkle-prone", desc: "잔주름·탄력 저하가 보이거나 걱정돼요", icon: "🍂" },
    b: { letter: "T", ko: "탱탱", en: "Tight", desc: "아직 주름 걱정은 적고 탄탄해요", icon: "🫧" },
  },
];

type SkinResult = {
  code: string; // Baumann 4글자 코드 (예: DSNW)
  base: string; // 건성/지성
  sensitivity: string; // 민감/둔감
  skinTypeForRec: string; // 제품 추천용 (건성/지성/민감성)
  displayConcerns: string[];
  recConcerns: string[];
};

// 4글자 코드 → 추천 엔진이 쓰는 값으로 매핑
function analyzeBaumann(code: string): SkinResult {
  const dry = code[0] === "D";
  const sensitive = code[1] === "S";
  const pigmented = code[2] === "P";
  const wrinkled = code[3] === "W";
  const base = dry ? "건성" : "지성";
  const sensitivity = sensitive ? "민감" : "둔감";
  const skinTypeForRec = sensitive ? "민감성" : base;
  const displayConcerns: string[] = [dry ? "수분" : "트러블"];
  if (pigmented) displayConcerns.push("기미");
  if (wrinkled) displayConcerns.push("주름");
  const recConcerns = [...displayConcerns];
  if (sensitive) recConcerns.push("민감");
  return { code, base, sensitivity, skinTypeForRec, displayConcerns, recConcerns };
}

// 축(letter)별 특성 설명 + 추천/주의 성분 (Baumann 관리법 기반). 코드 4글자를 조합해 맞춤 솔루션 생성.
const AXIS_INFO: Record<string, { para: string; good: string[]; avoid: string[] }> = {
  D: { para: "유·수분이 쉽게 빠져나가는 건성 경향이에요. 여행 중 기내·냉방에 장벽이 더 마르기 쉬우니 '수분→유분' 순서로 잠가주세요.", good: ["히알루론산", "세라마이드", "스쿠알란"], avoid: ["고농도 알코올", "강한 각질제거"] },
  O: { para: "피지 분비가 많은 지성 경향이에요. 덥고 습한 여행지에서 번들거림·모공이 늘기 쉬우니 가벼운 수분과 피지 관리로 밸런스를 잡으세요.", good: ["나이아신아마이드", "살리실산(BHA)", "아연"], avoid: ["무거운 오일", "코코넛 오일"] },
  S: { para: "외부 자극에 붉어지거나 따가움이 잘 나타나는 민감 경향이에요. 성분 수를 줄인 저자극 진정 케어가 안전합니다.", good: ["센텔라(시카)", "마데카소사이드", "판테놀"], avoid: ["인공향료", "에센셜오일", "고농도 산"] },
  R: { para: "장벽이 튼튼한 저항성 피부예요. 레티놀·비타민C·AHA 같은 활성 성분도 비교적 잘 견디니 목표에 맞춰 적극 활용할 수 있어요.", good: ["비타민C", "레티놀", "AHA"], avoid: [] },
  P: { para: "자외선·자극 뒤 색소 침착이 잘 남는 타입이에요. 미백·톤 케어와 함께 '자외선 차단'이 가장 중요합니다.", good: ["비타민C", "나이아신아마이드", "알부틴", "트라넥삼산"], avoid: ["무방비 햇볕 노출"] },
  N: { para: "색소 침착이 적어 톤이 비교적 균일한 타입이에요. 지금의 맑은 톤은 꾸준한 자외선 차단만으로 충분히 지킬 수 있어요.", good: ["나이아신아마이드", "자외선차단"], avoid: [] },
  W: { para: "잔주름·탄력 저하가 나타나기 쉬운 타입이에요. 항산화·재생 성분과 자외선 차단으로 광노화를 늦춰주세요.", good: ["레티놀", "펩타이드", "항산화제"], avoid: ["자외선 방치"] },
  T: { para: "아직 탄력이 좋은 타입이에요. 항산화 성분과 자외선 차단으로 지금 상태를 오래 지키는 '예방 케어'가 핵심이에요.", good: ["항산화제", "자외선차단"], avoid: [] },
};

// 16타입 닉네임 + 한 줄 설명 + 대표 컬러 (매트릭스 이미지 기준)
const BAUMANN_TYPES: Record<string, { nick: string; tagline: string; color: string }> = {
  DRPT: { nick: "잡티 관리형 도자기", tagline: "건조하지만 튼튼한 장벽, 색소만 잡으면 매끈", color: "#5b7ea3" },
  DRNT: { nick: "물만 주면 되는 순둥이", tagline: "가장 관리 쉬운 타입, 수분 보충이 전부", color: "#8089ad" },
  DSPT: { nick: "예민한 백조", tagline: "건조·민감·색소, 진정하며 톤까지 챙겨야", color: "#b85a86" },
  DSNT: { nick: "여린 순둥이", tagline: "건조하고 예민하지만 색소·주름 걱정은 적어요", color: "#dd90ac" },
  DRPW: { nick: "관록의 그을림", tagline: "건조·색소·주름, 미백과 안티에이징 동시에", color: "#6d7a94" },
  DRNW: { nick: "우아한 세월", tagline: "건조하고 주름 관리가 필요한 튼튼 피부", color: "#9a8dc2" },
  DSPW: { nick: "종합 케어 장인", tagline: "네 가지 모두 신경 써야 하는 섬세한 타입", color: "#c17d9c" },
  DSNW: { nick: "섬세한 시간", tagline: "건조·민감·주름, 저자극 재생 케어가 핵심", color: "#d3a1a1" },
  ORPT: { nick: "생기 넘치는 구릿빛", tagline: "튼튼한 지성, 색소만 잡으면 완벽", color: "#a7bd57" },
  ORNT: { nick: "철벽 피부", tagline: "가장 튼튼한 타입, 피지·자외선 관리면 끝", color: "#b7d091" },
  OSPT: { nick: "번들 예민러", tagline: "지성·민감·색소, 진정과 피지 밸런스가 관건", color: "#e89355" },
  OSNT: { nick: "촉촉 지성 순둥이", tagline: "지성이지만 예민한 편, 색소·주름은 여유", color: "#f2b689" },
  ORPW: { nick: "관리형 오일리", tagline: "튼튼한 지성, 색소·주름을 함께 케어", color: "#7cbf9f" },
  ORNW: { nick: "여유로운 오일리", tagline: "튼튼한 지성, 주름 예방에 집중", color: "#a3c9ac" },
  OSPW: { nick: "복합 고민러", tagline: "지성·민감·색소·주름, 균형 잡힌 진정 케어", color: "#f0a544" },
  OSNW: { nick: "예민한 오일리 타임", tagline: "지성·민감·주름, 자극 없는 안티에이징", color: "#f6cba6" },
};

// 코드 4글자를 조합해 설명 문단 + 추천/주의 성분(중복 제거) 생성
function baumannCare(code: string) {
  const letters = code.split("");
  const paras = letters.map((l) => AXIS_INFO[l]?.para).filter(Boolean) as string[];
  const good = Array.from(new Set(letters.flatMap((l) => AXIS_INFO[l]?.good ?? [])));
  const avoid = Array.from(new Set(letters.flatMap((l) => AXIS_INFO[l]?.avoid ?? [])));
  return { paras, good, avoid };
}

function comboComment(p: { temp: number; humidity: number; uv: number; dust: number }, type: string) {
  const bits: string[] = [];
  if (p.humidity >= 75) bits.push("습도가 높고");
  else if (p.humidity <= 45) bits.push("공기가 건조하고");
  if (p.uv >= 9) bits.push("자외선이 강하고");
  if (p.dust >= 80) bits.push("미세먼지가 많은");
  const env = bits.length ? bits.join(" ").replace(/고$/, "고 ") : "비교적 쾌적한";
  const advice: Record<string, string> = {
    건성: "수분·유분 잠금과 자외선 차단을 놓치지 마세요.",
    지성: "산뜻한 수분과 피지 관리에 집중하세요.",
    복합성: "부위별 맞춤 케어로 균형을 잡아주세요.",
    민감성: "저자극 진정 위주로 장벽을 지켜주세요.",
  };
  return `${env} 여행지에서 ${type} 피부라면 ${advice[type] ?? "기본 보습과 자외선 차단을 챙기세요."}`;
}

// 피부 이슈 지수 세부 항목(자외선노출/색소침착/수분손실/트러블·유수분) — 여행지 기후 × Baumann 코드로 산출
function skinIssueSubindex(p: { temp: number; humidity: number; uv: number; dust: number }, code: string, concerns: string[]) {
  const dry = code[0] === "D";
  const oily = code[0] === "O";
  const pigmented = code[2] === "P";
  const uvExposure = Math.min(100, Math.round(p.uv * 8));
  const pigment = Math.min(100, Math.round(p.uv * 5 + (pigmented ? 20 : 5) + (p.dust >= 70 ? 10 : 0)));
  const hydrationLoss = Math.min(100, Math.round((100 - p.humidity) * 0.6 + (dry ? 25 : 10) + (p.temp >= 30 ? 10 : 0)));
  const troubleSebum = Math.min(
    100,
    Math.round((oily ? 30 : 10) + (p.humidity >= 70 ? 20 : 8) + (p.temp >= 28 ? 15 : 5) + (concerns.includes("트러블") ? 15 : 0))
  );
  return { uvExposure, pigment, hydrationLoss, troubleSebum };
}

// 스캔 결과 성분 태그 색상 (여권 팔레트)
const SCAN_PILL: Record<string, string> = {
  key: "bg-[#0a0a0a] text-white",
  calm: "bg-[#e7f6ee] text-[#1f9d57]",
  base: "bg-[#f4f4f5] text-[#71717a]",
  warn: "bg-[#fbe7e5] text-[#ec1c24]",
};

/* ════════════════════════ 메인 ════════════════════════ */

export default function BeautyPassportExperience() {
  const [stage, setStage] = useState<Stage>("intro");

  // 로그인
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  // 계정 (localStorage 기반 — lib/auth.ts)
  const [loggedInId, setLoggedInId] = useState<string | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loginError, setLoginError] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupId, setSignupId] = useState("");
  const [signupPw, setSignupPw] = useState("");
  const [signupPw2, setSignupPw2] = useState("");
  const [signupAge, setSignupAge] = useState("");
  const [signupGender, setSignupGender] = useState("");
  const [signupError, setSignupError] = useState("");
  const [rememberId, setRememberId] = useState(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
  const [findIdName, setFindIdName] = useState("");
  const [findIdResult, setFindIdResult] = useState<string | null>(null);
  const [findIdError, setFindIdError] = useState("");
  const [findPwId, setFindPwId] = useState("");
  const [findPwName, setFindPwName] = useState("");
  const [findPwVerified, setFindPwVerified] = useState(false);
  const [findPwNew, setFindPwNew] = useState("");
  const [findPwNew2, setFindPwNew2] = useState("");
  const [findPwError, setFindPwError] = useState("");
  const [findPwDone, setFindPwDone] = useState(false);
  const [journeyPhase, setJourneyPhase] = useState<"before" | "during" | "after" | null>(null);
  // 애프터케어 (여행 후)
  const [acEntry, setAcEntry] = useState<"journey" | "careplan">("journey");
  const [acQ1, setAcQ1] = useState<"yes" | "no" | null>(null);
  const [acQ2, setAcQ2] = useState<"yes" | "no" | null>(null);
  const [acConcerns, setAcConcerns] = useState<string[]>([]);
  const [acMode, setAcMode] = useState<"concern" | "destination" | null>(null);
  const [acSaved, setAcSaved] = useState(false);
  // 여행지
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState(false);
  const [customCountry, setCustomCountry] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [departDate, setDepartDate] = useState<string | null>(null);
  const [arriveDate, setArriveDate] = useState<string | null>(null);
  // 피부 설문 (스모어 방식)
  const [qIndex, setQIndex] = useState(0);
  const [axes, setAxes] = useState<(string | null)[]>(Array(BAUMANN_AXES.length).fill(null));
  const [analyzing, setAnalyzing] = useState(false);
  const [skin, setSkin] = useState<SkinResult | null>(null);
  const [weather, setWeather] = useState<WeatherResult | null>(null);
  const [shared, setShared] = useState(false);
  // 제품 상세 + 샘플 장바구니
  const [detailId, setDetailId] = useState<string | null>(null);
  const [cart, setCart] = useState<{ id: string; ml: number; qty: number }[]>([]);
  const [volumeSel, setVolumeSel] = useState<Record<string, number>>({});
  // 여정 타임라인
  const [checklist, setChecklist] = useState<boolean[]>(Array(CHECKLIST_ITEMS.length).fill(false));
  // [6-2] 장바구니 시트
  const [cartOpen, setCartOpen] = useState(false);
  // 여행지 대표 메이크업 스타일노트
  const [makeupOpen, setMakeupOpen] = useState(false);
  // 결과 화면 내 서브뷰(보딩패스 요약 ↔ 직접 고르기 ↔ 여행 케어 플랜) · AI 판단 상세 모달 · 여행 전/중/후 탭
  const [resultView, setResultView] = useState<"main" | "pick" | "plan">("main");
  const [showAiDetail, setShowAiDetail] = useState(false);
  const [carePhase, setCarePhase] = useState<0 | 1 | 2>(0);
  const [pickCat, setPickCat] = useState(PICK_CATEGORIES[0]);
  const [recTab, setRecTab] = useState<"set" | "compare">("set");
  // [6-3] 수령 방식
  const [receiveMethod, setReceiveMethod] = useState<"delivery" | "pickup" | null>(null);
  // [6-3A] 배송 신청
  const [deliveryBefore, setDeliveryBefore] = useState(true);
  const [deliveryAfter, setDeliveryAfter] = useState(false);
  const [deliveryName, setDeliveryName] = useState(name);
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  // [6-3B] 공항 픽업 신청
  const [pickupAirport, setPickupAirport] = useState<string | null>(null);
  const [pickupDate, setPickupDate] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string | null>(null);
  const [pickupPhone, setPickupPhone] = useState("");
  // [6-3C] 결제하기 (배송/픽업 폼에서 진입)
  const [pendingReceive, setPendingReceive] = useState<"delivery" | "pickup" | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "kakao" | "naver">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [paying, setPaying] = useState(false);
  // [6-4] 완료
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [lockerNo, setLockerNo] = useState<string | null>(null);

  const timer = useRef<number | null>(null);

  // ── AI 성분 스캔 ──
  const [scanFromResult, setScanFromResult] = useState(false);
  const [scanStep, setScanStep] = useState<"camera" | "loading" | "result" | "error">("camera");
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSaved, setScanSaved] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [memberRefresh, setMemberRefresh] = useState(0);
  const scanVideoRef = useRef<HTMLVideoElement | null>(null);
  const scanStreamRef = useRef<MediaStream | null>(null);
  const scanFileRef = useRef<HTMLInputElement | null>(null);

  function stopScanCamera() {
    if (scanStreamRef.current) {
      scanStreamRef.current.getTracks().forEach((t) => t.stop());
      scanStreamRef.current = null;
    }
    setCameraReady(false);
  }
  function openScan() {
    setScanFromResult(false);
    setScanStep("camera");
    setScanImage(null);
    setScanResult(null);
    setScanError(null);
    setScanSaved(false);
    setStage("scan");
  }
  function openScanFromResult() {
    setScanFromResult(true);
    setScanStep("camera");
    setScanImage(null);
    setScanResult(null);
    setScanError(null);
    setScanSaved(false);
    setStage("scan");
  }
  function exitScan() {
    stopScanCamera();
    setStage(scanFromResult ? "result" : loggedInId ? "member" : "journey");
    setScanFromResult(false);
  }
  async function analyzeScan(dataUrl: string) {
    stopScanCamera();
    setScanImage(dataUrl);
    setScanResult(null);
    setScanError(null);
    setScanSaved(false);
    setScanStep("loading");
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });
      if (!res.ok) {
        const e = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(e.error || "분석에 실패했어요.");
      }
      const data = (await res.json()) as ScanResult;
      setScanResult(data);
      setScanStep("result");
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "분석 중 문제가 생겼어요.");
      setScanStep("error");
    }
  }
  function captureScan() {
    const v = scanVideoRef.current;
    if (v && v.videoWidth) {
      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
      analyzeScan(canvas.toDataURL("image/jpeg", 0.85));
    }
  }
  function onScanFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") analyzeScan(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }
  function saveScanProduct() {
    if (!scanResult || !loggedInId) return;
    saveProductToAccount(loggedInId, {
      brand: scanResult.brand,
      name: scanResult.name,
      category: scanResult.category,
    });
    setScanSaved(true);
  }

  // 카메라 화면일 때만 스트림 열고, 벗어나면 정리
  useEffect(() => {
    if (stage !== "scan" || scanStep !== "camera") {
      stopScanCamera();
      return;
    }
    let cancelled = false;
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then((stream) => {
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          scanStreamRef.current = stream;
          if (scanVideoRef.current) {
            scanVideoRef.current.srcObject = stream;
            scanVideoRef.current.play().catch(() => {});
          }
          setCameraReady(true);
        })
        .catch(() => setCameraReady(false));
    }
    return () => {
      cancelled = true;
      stopScanCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, scanStep]);

  // 아이디 저장/자동 로그인 저장값 복원 (최초 1회)
  useEffect(() => {
    const remembered = getRememberedId();
    if (remembered) {
      setLoginId(remembered);
      setRememberId(true);
    }
    setAutoLoginChecked(isAutoLoginEnabled());
  }, []);

  useEffect(() => {
    if (stage !== "intro") return;
    timer.current = window.setTimeout(() => setStage(tryAutoLogin() ? "member" : "login"), 5300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [stage]);

  // 결과 분석중: 날씨 API fetch + 최소 로딩 3.5초 → 결과
  useEffect(() => {
    if (!analyzing) return;
    let cancelled = false;
    setWeather(null);
    if (!useCustom && city && departDate && arriveDate) {
      fetchWeather(city.lat, city.lon, departDate, arriveDate).then((w) => {
        if (!cancelled) setWeather(w);
      });
    }
    const id = window.setTimeout(() => {
      if (!cancelled) {
        setAnalyzing(false);
        setStage("result");
      }
    }, 3500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [analyzing]);

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? null;
  const city = country?.cities.find((ci) => ci.name === cityName) ?? null;

  const acCountryName = country?.name ?? (useCustom ? customCountry.trim() : "");
  const acClimateKey = CLIMATE_BY_COUNTRY[acCountryName] ?? "temperate";
  const acClimateProfile = CLIMATE_PROFILE[acClimateKey];
  const acChosenConcerns = CONCERNS.filter((c) => acConcerns.includes(c.id));
  const acSubtitle = name ? `${name}님, 여행에서 돌아온 피부를 점검할 시간` : "여행에서 돌아온 내 피부를 점검할 시간";
  const acDestName = acCountryName || "이번 여행";
  const acDestDates = [departDate, arriveDate].filter(Boolean).join("  –  ") || "즐거운 시간 되셨나요?";
  const acFooterCode = `BP ${(acCountryName || "AC").slice(0, 2).toUpperCase()} ${String(new Date().getMonth() + 1).padStart(2, "0")} ${String(new Date().getDate()).padStart(2, "0")} ${String(new Date().getFullYear() % 100).padStart(2, "0")}`;

  const placeDone = useCustom ? customCountry.trim() !== "" && customCity.trim() !== "" : !!city;
  const travelDone = placeDone && !!departDate && !!arriveDate;

  function skipIntro() {
    if (timer.current) clearTimeout(timer.current);
    setStage(tryAutoLogin() ? "member" : "login");
  }
  function selectAxis(letter: string) {
    setAxes((prev) => prev.map((a, i) => (i === qIndex ? letter : a)));
  }
  function skinPrev() {
    if (qIndex === 0) setStage("checkin");
    else setQIndex((i) => i - 1);
  }
  function skinNext() {
    if (qIndex < BAUMANN_AXES.length - 1) {
      setQIndex((i) => i + 1);
    } else {
      // 마지막 축까지 선택 → 4글자 코드 완성 → 여권에 저장
      const code = axes.join("");
      setSkin(analyzeBaumann(code));
      if (loggedInId) saveSkinToAccount(loggedInId, code);
      setStage("journey");
    }
  }
  function cartQty(id: string, ml: number) {
    return cart.find((x) => x.id === id && x.ml === ml)?.qty ?? 0;
  }
  function addSample(id: string, ml: number) {
    setCart((c) => {
      const i = c.findIndex((x) => x.id === id && x.ml === ml);
      if (i >= 0) {
        const n = [...c];
        n[i] = { ...n[i], qty: n[i].qty + 1 };
        return n;
      }
      return [...c, { id, ml, qty: 1 }];
    });
  }
  function decSample(id: string, ml: number) {
    setCart((c) => c.flatMap((x) => (x.id === id && x.ml === ml ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])));
  }
  function removeSample(id: string, ml: number) {
    setCart((c) => c.filter((x) => !(x.id === id && x.ml === ml)));
  }
  const cartCount = cart.reduce((a, b) => a + b.qty, 0);
  const cartLines = cart
    .map((item) => {
      const p = COSMETICS.find((c) => c.id === item.id);
      if (!p) return null;
      const unit = samplePrice(p.price, p.fullMl, item.ml);
      return { item, p, unit, lineTotal: unit * item.qty };
    })
    .filter((x): x is CartLine => x !== null);
  const cartTotalMl = cartLines.reduce((s, l) => s + l.item.ml * l.item.qty, 0);
  const cartTotalPrice = cartLines.reduce((s, l) => s + l.lineTotal, 0);
  const cartAllUnder100 = cart.every((it) => it.ml <= 100);
  function toggleChecklist(i: number) {
    setChecklist((c) => c.map((v, idx) => (idx === i ? !v : v)));
  }
  function addAllRec() {
    if (!result) return;
    const dryHigh = result.profile.humidity <= 45;
    const uvHigh = result.profile.uv >= 8;
    result.recItems.forEach(({ p }) => {
      const rec = recommendVolume(p.category, result.days, dryHigh, uvHigh);
      if (cartQty(p.id, rec.ml) === 0) addSample(p.id, rec.ml);
    });
  }
  function goCheckout() {
    setCartOpen(false);
    setReceiveMethod(null);
    setStage("receive");
  }
  function submitDelivery() {
    setOrderNo(genOrderNo());
    setStage("done");
  }
  function submitPickup() {
    setOrderNo(genOrderNo());
    setLockerNo(genLockerNo());
    setStage("done");
  }
  const deliveryFormValid =
    deliveryName.trim() !== "" && deliveryPhone.trim() !== "" && deliveryAddress.trim() !== "" && (deliveryBefore || deliveryAfter);
  const pickupFormValid = !!pickupAirport && !!pickupDate && !!pickupTime && pickupPhone.trim() !== "";

  function openPayment(kind: "delivery" | "pickup") {
    setPendingReceive(kind);
    setStage("payment");
  }
  const paymentValid =
    paymentMethod !== "card" || (cardNumber.trim() !== "" && cardExpiry.trim() !== "" && cardCvc.trim() !== "");
  function confirmPayment() {
    if (!paymentValid || paying) return;
    setPaying(true);
    window.setTimeout(() => {
      setPaying(false);
      if (pendingReceive === "pickup") submitPickup();
      else submitDelivery();
      setPendingReceive(null);
    }, 1200);
  }
  async function shareResult() {
    const text = `${name || "여행자"}님의 뷰티 여권 · ${result?.placeLabel ?? ""} ${result?.days ?? ""}일`;
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Beauty Passport", text, url });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {
      /* 사용자가 공유 취소 */
    }
  }
  function selectCountry(code: string) {
    setUseCustom(false);
    setCountryCode(code);
    setCityName(null);
  }
  function tryAutoLogin(): boolean {
    if (!isAutoLoginEnabled()) return false;
    const account = getSession();
    if (!account) return false;
    setLoggedInId(account.id);
    setName(account.name);
    setAge(account.age);
    setGender(account.gender);
    return true;
  }
  function handleLogin() {
    const res = authLogin(loginId, loginPw);
    if (!res.ok) {
      setLoginError(res.error);
      return;
    }
    setLoginError("");
    setRememberedId(rememberId ? res.account.id : null);
    setAutoLogin(autoLoginChecked);
    setLoggedInId(res.account.id);
    setName(res.account.name);
    setAge(res.account.age);
    setGender(res.account.gender);
    setStage("member");
  }
  function handleGuestLogin() {
    let res = authLogin(COSMAX_GUEST.id, COSMAX_GUEST.password);
    if (!res.ok) {
      res = authSignup({
        id: COSMAX_GUEST.id,
        password: COSMAX_GUEST.password,
        name: COSMAX_GUEST.name,
        age: COSMAX_GUEST.age,
        gender: COSMAX_GUEST.gender,
      });
    }
    if (!res.ok) {
      setLoginError(res.error);
      return;
    }
    setLoginError("");
    setLoggedInId(res.account.id);
    setName(res.account.name);
    setAge(res.account.age);
    setGender(res.account.gender);
    setStage("member");
  }
  function handleSignup() {
    if (signupPw !== signupPw2) {
      setSignupError("비밀번호가 일치하지 않아요.");
      return;
    }
    const res = authSignup({ id: signupId, password: signupPw, name: signupName, age: signupAge, gender: signupGender });
    if (!res.ok) {
      setSignupError(res.error);
      return;
    }
    setSignupError("");
    setLoggedInId(res.account.id);
    setName(res.account.name);
    setAge(res.account.age);
    setGender(res.account.gender);
    setStage("checkin");
  }
  function handleLogout() {
    clearSession();
    setAutoLogin(false);
    setAutoLoginChecked(false);
    setLoggedInId(null);
    setLoginId(getRememberedId() ?? ""); setLoginPw(""); setLoginError("");
    setStage("login");
  }
  function loadSavedSkin() {
    if (!loggedInId) return;
    const account = findAccount(loggedInId);
    if (!account?.skinCode) return;
    setSkin(analyzeBaumann(account.skinCode));
    setStage("journey");
  }
  function acNextQ1() {
    if (acQ1 === "yes") setStage("acQ2");
    else {
      setAcMode("destination");
      setStage("acResult");
    }
  }
  function acNextQ2() {
    if (acQ2 === "yes") setStage("acQ3");
    else {
      setAcMode("destination");
      setStage("acResult");
    }
  }
  function acToggleConcern(id: string) {
    setAcConcerns((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function acRestart() {
    setAcQ1(null);
    setAcQ2(null);
    setAcConcerns([]);
    setAcMode(null);
    setStage("acArrival");
  }
  function acSave() {
    setAcSaved(true);
    setTimeout(() => setAcSaved(false), 1800);
  }
  function restart() {
    clearSession();
    setAutoLogin(false);
    setAutoLoginChecked(false);
    setLoggedInId(null); setLoginId(getRememberedId() ?? ""); setLoginPw(""); setLoginError("");
    setSignupName(""); setSignupId(""); setSignupPw(""); setSignupPw2(""); setSignupAge(""); setSignupGender(""); setSignupError("");
    setFindIdName(""); setFindIdResult(null); setFindIdError("");
    setFindPwId(""); setFindPwName(""); setFindPwVerified(false); setFindPwNew(""); setFindPwNew2(""); setFindPwError(""); setFindPwDone(false);
    setJourneyPhase(null);
    setAcEntry("journey");
    setAcQ1(null); setAcQ2(null); setAcConcerns([]); setAcMode(null); setAcSaved(false);
    setName(""); setAge(""); setGender("");
    setCountryCode(null); setCityName(null);
    setUseCustom(false); setCustomCountry(""); setCustomCity("");
    setDepartDate(null); setArriveDate(null);
    setQIndex(0); setAxes(Array(BAUMANN_AXES.length).fill(null));
    setAnalyzing(false); setSkin(null);
    setWeather(null); setDetailId(null); setCart([]); setVolumeSel({});
    setChecklist(Array(CHECKLIST_ITEMS.length).fill(false));
    setCartOpen(false); setReceiveMethod(null);
    setDeliveryBefore(true); setDeliveryAfter(false);
    setDeliveryName(""); setDeliveryPhone(""); setDeliveryAddress(""); setDeliveryNote("");
    setPickupAirport(null); setPickupDate(null); setPickupTime(null); setPickupPhone("");
    setPendingReceive(null); setPaymentMethod("card"); setCardNumber(""); setCardExpiry(""); setCardCvc(""); setPaying(false);
    setOrderNo(null); setLockerNo(null);
    setResultView("main"); setShowAiDetail(false); setCarePhase(0); setPickCat(PICK_CATEGORIES[0]);
    setStage("intro");
  }

  const result = useMemo(() => {
    if (stage !== "result" || !skin) return null;
    const cityProfile = useCustom ? FALLBACK_CLIMATE : city ?? FALLBACK_CLIMATE;
    // 날씨 API 성공 시 실측값, 실패 시 계절 기본값(도시 프로파일)
    const profile = weather
      ? {
          temp: weather.temp,
          humidity: weather.humidity,
          uv: weather.uv,
          dust: weather.dust > 0 ? weather.dust : cityProfile.dust,
          tag: cityProfile.tag,
        }
      : cityProfile;
    const wxSource = weather ? "실시간 예보" : "계절 기본값";
    const placeLabel = useCustom ? `${customCountry} · ${customCity}` : `${country?.name ?? ""} · ${city?.name ?? ""}`;
    const seedStr = useCustom ? customCity : city?.name ?? "";
    let seed = 0;
    for (const ch of seedStr) seed += ch.charCodeAt(0);
    const start = departDate ? new Date(departDate) : new Date();
    const days = departDate && arriveDate ? diffDays(departDate, arriveDate) : 5;

    // 피부타입 + 고민 + 여행지 날씨로 실제 제품 필터·스코어링
    const rec = recommendCosmetics(skin.skinTypeForRec, skin.sensitivity, skin.displayConcerns, profile);

    return {
      profile,
      wxSource,
      placeLabel,
      days,
      index: skinIssueIndexP(profile, skin.skinTypeForRec, skin.recConcerns),
      calendar:
        weather && weather.daily.length
          ? buildCalendarFromDaily(weather.daily)
          : buildCalendarP(profile, seed * 1000 + days, days, start),
      recSummary: rec.summary,
      recItems: rec.items,
    };
  }, [stage, useCustom, city, country, customCountry, customCity, departDate, arriveDate, skin, weather]);

  const dday = departDate ? daysUntil(departDate) : null;

  return (
    <div className="min-h-[100dvh] w-full" style={{ background: "linear-gradient(180deg,#c6dcec,#aecbe2)" }}>
      <div className="mx-auto flex min-h-[100dvh] max-w-[480px] items-stretch sm:py-6">
        <div className="relative w-full overflow-hidden min-h-[100dvh] sm:min-h-[calc(100dvh-3rem)] sm:rounded-[38px] sm:shadow-[0_40px_90px_rgba(43,120,170,0.4)]" style={{ perspective: 1600 }}>
          <AnimatePresence mode="wait">
            {/* 1. 인트로 — 도트 지구본 */}
            {stage === "intro" && (
              <motion.section key="intro" className="absolute inset-0 bg-[#f4f6f9]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
                <motion.div className="absolute inset-0" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: EASE }}>
                  <DotGlobe />
                </motion.div>
                {/* 중심 글로우 */}
                <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 45% at 50% 45%,rgba(255,255,255,0.4),transparent 70%)" }} />
                {/* 카피 */}
                <motion.div
                  className="pointer-events-none absolute inset-x-0 bottom-[16%] text-center"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2, duration: 1, ease: EASE }}
                >
                  <div className="text-[11px] font-semibold tracking-[0.55em] text-[#1a1f26]/50">B E A U T Y</div>
                  <div className="mt-1 text-[26px] font-semibold tracking-[0.35em] text-[#151a20]">PASSPORT</div>
                  <motion.div className="mt-3 text-xs tracking-[0.2em] text-[#1a1f26]/45" animate={{ opacity: [0.35, 0.8, 0.35] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
                    세계로 떠나는 뷰티 여정을 준비하는 중…
                  </motion.div>
                </motion.div>
                <button onClick={skipIntro} className="absolute bottom-6 right-5 z-50 rounded-full border border-black/10 bg-black/5 px-4 py-2 text-xs font-semibold text-[#334] backdrop-blur transition hover:bg-black/10">
                  건너뛰기 →
                </button>
              </motion.section>
            )}

            {/* 2. 로그인 — 네이비 보딩패스 */}
            {stage === "login" && (
              <motion.section
                key="login"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar compact />
                <PassportEyebrow>Skin Without Borders</PassportEyebrow>
                <PassportTitle compact>
                  BEAUTY
                  <br />
                  PASSPORT <PassportPlaneIcon className="ml-1 inline-block w-11 -translate-y-1 align-middle" />
                </PassportTitle>
                <PassportKSub>나만의 뷰티 여권으로 로그인</PassportKSub>

                <div className="mt-4 flex flex-col gap-2.5">
                  <PassportField
                    label="ID"
                    labelKo="아이디"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    autoComplete="username"
                  />
                  <PassportField
                    label="Password"
                    labelKo="비밀번호"
                    type="password"
                    value={loginPw}
                    onChange={(e) => setLoginPw(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    autoComplete="current-password"
                  />
                  <PassportError>{loginError}</PassportError>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 font-sans text-[12px] text-[#3f3f46]">
                      <input
                        type="checkbox"
                        checked={rememberId}
                        onChange={(e) => setRememberId(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-[#0a0a0a]"
                      />
                      아이디 저장
                    </label>
                    <label className="flex items-center gap-1.5 font-sans text-[12px] text-[#3f3f46]">
                      <input
                        type="checkbox"
                        checked={autoLoginChecked}
                        onChange={(e) => setAutoLoginChecked(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-[#0a0a0a]"
                      />
                      자동 로그인
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <PassportButton onClick={handleLogin}>로그인 →</PassportButton>
                  <div className="flex items-center justify-center gap-2 font-sans text-[12px] text-[#71717a]">
                    <button
                      type="button"
                      onClick={() => {
                        setFindIdName("");
                        setFindIdResult(null);
                        setFindIdError("");
                        setStage("findId");
                      }}
                      className="font-bold text-[#0a0a0a]"
                    >
                      아이디 찾기
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFindPwId("");
                        setFindPwName("");
                        setFindPwVerified(false);
                        setFindPwNew("");
                        setFindPwNew2("");
                        setFindPwError("");
                        setFindPwDone(false);
                        setStage("findPw");
                      }}
                      className="font-bold text-[#0a0a0a]"
                    >
                      비밀번호 찾기
                    </button>
                  </div>
                  <PassportDivider compact>또는 · OR</PassportDivider>
                  <PassportButton
                    variant="ghost"
                    onClick={() => {
                      setSignupError("");
                      setStage("signup");
                    }}
                  >
                    회원가입
                  </PassportButton>
                  <PassportButton variant="ghost" onClick={handleGuestLogin}>
                    COSMAX 계정으로 로그인
                  </PassportButton>
                  <p className="text-center font-sans text-[11px] text-[#9ca3af]">
                    누구나 바로 체험할 수 있는 공용 테스트 계정이에요 · 개인정보는 저장되지 않아요
                  </p>
                </div>

                <PassportFooter compact />
              </motion.section>
            )}

            {/* 아이디 찾기 */}
            {stage === "findId" && (
              <motion.section
                key="findId"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar onBack={() => setStage("login")} />
                <PassportEyebrow>Recover Passport ID</PassportEyebrow>
                <PassportTitle>
                  FIND
                  <br />
                  ID
                </PassportTitle>
                <PassportKSub>가입할 때 입력한 이름으로 아이디를 찾아드려요</PassportKSub>

                <div className="mt-5 flex flex-col gap-3.5">
                  <PassportField
                    label="Name"
                    labelKo="이름"
                    value={findIdName}
                    onChange={(e) => setFindIdName(e.target.value)}
                    placeholder="가입 시 입력한 이름"
                    autoComplete="name"
                  />
                  <PassportError>{findIdError}</PassportError>
                  {findIdResult && (
                    <div className="rounded-[13px] bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a]">
                      찾은 아이디: <b className="font-extrabold">{findIdResult}</b>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <PassportButton
                    onClick={() => {
                      const matches = findAccountsByName(findIdName);
                      if (matches.length === 0) {
                        setFindIdError("일치하는 계정을 찾을 수 없어요.");
                        setFindIdResult(null);
                      } else {
                        setFindIdError("");
                        setFindIdResult(matches.map((m) => maskId(m.id)).join(", "));
                      }
                    }}
                  >
                    아이디 찾기
                  </PassportButton>
                </div>
                <PassportBackLink onClick={() => setStage("login")}>
                  <b className="font-extrabold text-[#0a0a0a]">로그인</b>으로 돌아가기
                </PassportBackLink>
              </motion.section>
            )}

            {/* 비밀번호 찾기 */}
            {stage === "findPw" && (
              <motion.section
                key="findPw"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar onBack={() => setStage("login")} />
                <PassportEyebrow>Reset Passport Key</PassportEyebrow>
                <PassportTitle>
                  FIND
                  <br />
                  PASSWORD
                </PassportTitle>
                <PassportKSub>{findPwVerified ? "새 비밀번호를 설정해주세요" : "아이디와 이름을 확인해주세요"}</PassportKSub>

                {!findPwVerified ? (
                  <>
                    <div className="mt-5 flex flex-col gap-3.5">
                      <PassportField label="ID" labelKo="아이디" value={findPwId} onChange={(e) => setFindPwId(e.target.value)} placeholder="아이디" autoComplete="username" />
                      <PassportField
                        label="Name"
                        labelKo="이름"
                        value={findPwName}
                        onChange={(e) => setFindPwName(e.target.value)}
                        placeholder="가입 시 입력한 이름"
                        autoComplete="name"
                      />
                      <PassportError>{findPwError}</PassportError>
                    </div>
                    <div className="mt-5">
                      <PassportButton
                        onClick={() => {
                          const account = findAccount(findPwId.trim());
                          if (!account || account.name !== findPwName.trim()) {
                            setFindPwError("일치하는 계정을 찾을 수 없어요.");
                            return;
                          }
                          setFindPwError("");
                          setFindPwVerified(true);
                        }}
                      >
                        확인
                      </PassportButton>
                    </div>
                  </>
                ) : findPwDone ? (
                  <div className="mt-5 flex flex-col gap-3.5">
                    <div className="rounded-[13px] bg-[#f4f4f5] px-4 py-[15px] text-center font-sans text-sm font-bold text-[#0a0a0a]">
                      비밀번호가 재설정됐어요. 새 비밀번호로 로그인해주세요.
                    </div>
                    <PassportButton onClick={() => setStage("login")}>로그인하러 가기 →</PassportButton>
                  </div>
                ) : (
                  <>
                    <div className="mt-5 flex flex-col gap-3.5">
                      <PassportField
                        label="New Password"
                        labelKo="새 비밀번호"
                        type="password"
                        value={findPwNew}
                        onChange={(e) => setFindPwNew(e.target.value)}
                        placeholder="새 비밀번호"
                        autoComplete="new-password"
                      />
                      <PassportField
                        label="Confirm"
                        labelKo="비밀번호 확인"
                        type="password"
                        value={findPwNew2}
                        onChange={(e) => setFindPwNew2(e.target.value)}
                        placeholder="새 비밀번호 다시 입력"
                        autoComplete="new-password"
                      />
                      <PassportError>{findPwError}</PassportError>
                    </div>
                    <div className="mt-5">
                      <PassportButton
                        onClick={() => {
                          if (findPwNew !== findPwNew2) {
                            setFindPwError("비밀번호가 일치하지 않아요.");
                            return;
                          }
                          const res = resetPassword(findPwId.trim(), findPwName.trim(), findPwNew);
                          if (!res.ok) {
                            setFindPwError(res.error);
                            return;
                          }
                          setFindPwError("");
                          setFindPwDone(true);
                        }}
                      >
                        비밀번호 재설정
                      </PassportButton>
                    </div>
                  </>
                )}

                <PassportBackLink onClick={() => setStage("login")}>
                  <b className="font-extrabold text-[#0a0a0a]">로그인</b>으로 돌아가기
                </PassportBackLink>
              </motion.section>
            )}

            {/* 회원가입 */}
            {stage === "signup" && (
              <motion.section
                key="signup"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar onBack={() => setStage("login")} />
                <PassportEyebrow>Issue New Passport</PassportEyebrow>
                <PassportTitle>
                  SIGN
                  <br />
                  UP
                </PassportTitle>
                <PassportKSub>뷰티 여권을 새로 발급받아요</PassportKSub>

                <div className="mt-5 flex flex-col gap-3.5">
                  <PassportField label="Name" labelKo="이름" value={signupName} onChange={(e) => setSignupName(e.target.value)} placeholder="여권에 새길 이름" autoComplete="name" />
                  <PassportField label="ID" labelKo="아이디" value={signupId} onChange={(e) => setSignupId(e.target.value)} placeholder="사용할 아이디" autoComplete="username" />
                  <PassportField
                    label="Password"
                    labelKo="비밀번호"
                    type="password"
                    value={signupPw}
                    onChange={(e) => setSignupPw(e.target.value)}
                    placeholder="비밀번호"
                    autoComplete="new-password"
                  />
                  <PassportField
                    label="Confirm"
                    labelKo="비밀번호 확인"
                    type="password"
                    value={signupPw2}
                    onChange={(e) => setSignupPw2(e.target.value)}
                    placeholder="비밀번호 다시 입력"
                    autoComplete="new-password"
                  />
                  <div>
                    <label className="mb-2 block text-[13px] font-extrabold text-[#0a0a0a]">
                      Age <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· 나이</span>
                    </label>
                    <input
                      value={signupAge}
                      onChange={(e) => setSignupAge(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                      inputMode="numeric"
                      placeholder="예: 27"
                      className="w-full rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0a0a0a] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-[13px] font-extrabold text-[#0a0a0a]">
                      Gender <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· 성별</span>
                    </label>
                    <div className="flex gap-2">
                      {["여성", "남성"].map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSignupGender(g)}
                          className={`flex-1 rounded-[13px] border-[1.5px] px-3 py-2.5 text-sm font-semibold transition ${
                            signupGender === g ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[#e7e7ea] bg-[#f4f4f5] text-[#3f3f46]"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                  <PassportError>{signupError}</PassportError>
                </div>

                <div className="mt-5">
                  <PassportButton onClick={handleSignup}>가입하고 피부 설문 시작하기 →</PassportButton>
                </div>
                <PassportBackLink onClick={() => setStage("login")}>
                  이미 여권이 있나요? <b className="font-extrabold text-[#0a0a0a]">로그인</b>
                </PassportBackLink>

                <PassportFooter />
              </motion.section>
            )}

            {/* 회원 (재로그인) */}
            {stage === "member" && (
              <motion.section
                key="member"
                data-refresh={memberRefresh}
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar compact onBack={() => setStage("login")} />
                <PassportEyebrow>Your Skin Journey</PassportEyebrow>
                <PassportTitle compact>
                  WELCOME
                  <br />
                  BACK
                </PassportTitle>
                <PassportKSub>피부 여권을 확인해 주세요</PassportKSub>

                {(() => {
                  const account = loggedInId ? findAccount(loggedInId) : null;
                  const bt = account?.skinCode ? BAUMANN_TYPES[account.skinCode] : null;
                  return (
                    <div className="mt-4 flex flex-col gap-2.5">
                      <div className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-[#0a0a0a] p-[15px]">
                        <div className="flex items-center justify-between">
                          <div className="font-sans text-[17px] font-black text-[#0a0a0a]">{account?.name ?? name} 님</div>
                          <PassportStampChip>VERIFIED</PassportStampChip>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {bt ? (
                            <>
                              <PassportTag>피부타입 · {bt.nick}</PassportTag>
                              {account?.skinUpdatedAt && <PassportTag>최근 업데이트 · {daysAgoLabel(account.skinUpdatedAt)}</PassportTag>}
                            </>
                          ) : (
                            <PassportTag>아직 진단 기록이 없어요</PassportTag>
                          )}
                        </div>
                        <PassportButton onClick={loadSavedSkin} disabled={!account?.skinCode}>
                          피부 정보 불러오기 →
                        </PassportButton>
                      </div>

                      <PassportOptionCard
                        selected={false}
                        onClick={() => setStage("checkin")}
                        icon={
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        }
                        en="NEW SURVEY"
                        ko="새로 설문 시작하기"
                        desc="피부 상태가 바뀌었다면 다시 진단해요"
                      />

                      <PassportOptionCard
                        selected={false}
                        onClick={openScan}
                        icon={
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        }
                        en="AI SCAN"
                        ko="화장품 성분 스캔"
                        desc="쓰는 화장품을 찍으면 AI가 성분을 분석해요"
                      />

                      {(() => {
                        const saved = loggedInId ? getSavedProducts(loggedInId) : [];
                        if (saved.length === 0) return null;
                        return (
                          <div className="mt-1 rounded-2xl border-[1.5px] border-[#e7e7ea] p-[15px]">
                            <div className="flex items-center justify-between">
                              <div className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9ca3af]">Saved Products · 저장한 제품</div>
                              <div className="font-sans text-[11px] font-bold text-[#71717a]">{saved.length}</div>
                            </div>
                            <div className="mt-2.5 flex flex-col gap-2">
                              {saved.slice(0, 5).map((p: SavedProduct) => (
                                <div key={p.key} className="flex items-center gap-2.5">
                                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#f4f4f5] text-[13px]">🧴</span>
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate font-sans text-[13px] font-bold text-[#0a0a0a]">{p.name}</div>
                                    <div className="font-sans text-[11px] text-[#9ca3af]">{p.brand} · {p.category}</div>
                                  </div>
                                  <button
                                    type="button"
                                    aria-label="삭제"
                                    onClick={() => {
                                      if (loggedInId) {
                                        removeSavedProduct(loggedInId, p.key);
                                        setMemberRefresh((n) => n + 1);
                                      }
                                    }}
                                    className="flex-none rounded-lg px-2 py-1 font-sans text-[11px] font-semibold text-[#9ca3af] transition active:scale-95"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}

                <PassportBackLink compact onClick={handleLogout}>
                  다른 계정으로 <b className="font-extrabold text-[#0a0a0a]">로그인</b>
                </PassportBackLink>

                <PassportFooter compact />
              </motion.section>
            )}

            {/* SKIN CHECK-IN 안내 */}
            {stage === "checkin" && (
              <motion.section
                key="checkin"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar onBack={() => setStage(loggedInId ? "member" : "login")} />
                <PassportEyebrow>피부 여권 업데이트</PassportEyebrow>
                <PassportTitle>
                  SKIN
                  <br />
                  CHECK-IN <PassportSurveyIcon className="ml-1 inline-block w-14 -translate-y-1 align-middle" />
                </PassportTitle>
                <PassportKSub>몇 가지 질문으로 피부 여권을 채워요</PassportKSub>

                <div className="mt-5 flex flex-col gap-3.5">
                  <PassportNote>
                    <p>몇 가지 질문으로 피부를 진단해요.</p>
                    <p>
                      결과는 <b>여권</b>에 저장, 맞춤 케어로 이어져요.
                    </p>
                  </PassportNote>
                  <PassportButton onClick={() => setStage("skin")}>설문 페이지로 이동 →</PassportButton>
                  <PassportButton variant="ghost" onClick={() => setStage(loggedInId ? "member" : "login")}>
                    나중에 하기
                  </PassportButton>
                </div>

                <PassportFooter />
              </motion.section>
            )}

            {/* YOUR JOURNEY — 여행 전/중/후 */}
            {stage === "journey" && (
              <motion.section
                key="journey"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar onBack={() => setStage("member")} />
                <PassportEyebrow>Boarding · 탑승</PassportEyebrow>
                <PassportTitle>
                  YOUR
                  <br />
                  JOURNEY <PassportBeachIcon className="ml-1 inline-block w-16 -translate-y-1 align-middle" />
                </PassportTitle>
                <PassportKSub>지금 어디쯤인가요?</PassportKSub>

                <div className="mt-5 flex flex-col gap-3.5">
                  <PassportOptionCard
                    selected={journeyPhase === "before"}
                    onClick={() => setJourneyPhase("before")}
                    icon={<PassportPlaneIcon selected={journeyPhase === "before"} />}
                    en="BEFORE"
                    ko="여행 전이에요"
                    desc="떠나기 전, 미리 준비하는 케어"
                  />
                  <PassportOptionCard
                    selected={journeyPhase === "during"}
                    onClick={() => setJourneyPhase("during")}
                    icon={<PassportPlaneIcon selected={journeyPhase === "during"} />}
                    en="DURING"
                    ko="여행 중이에요"
                    desc="여행지 환경에 맞춘 실시간 케어"
                  />
                  <PassportOptionCard
                    selected={journeyPhase === "after"}
                    onClick={() => setJourneyPhase("after")}
                    icon={<PassportPlaneIcon selected={journeyPhase === "after"} />}
                    en="AFTER"
                    ko="여행이 끝났어요"
                    desc="돌아온 뒤, 지친 피부 회복 케어"
                  />
                </div>

                <div className="mt-5">
                  <PassportButton
                    disabled={!journeyPhase}
                    onClick={() => {
                      if (journeyPhase === "before" || journeyPhase === "during") setStage("travel");
                      else {
                        setAcEntry("journey");
                        setStage("acArrival");
                      }
                    }}
                  >
                    다음 단계 →
                  </PassportButton>
                </div>
              </motion.section>
            )}

            {/* 애프터케어 — 여행 후: 입국 심사 */}
            {stage === "acArrival" && (
              <motion.section
                key="acArrival"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0"
              >
                <AcScreenChrome
                  step={0}
                  eyebrow="ARRIVAL · 입국 심사"
                  title="즐거운 여행되셨나요?"
                  subtitle={acSubtitle}
                  footerCode={acFooterCode}
                >
                  <AcTripCard dest={acDestName} dates={acDestDates} />
                  <p className={acStyles.lead} style={{ marginBottom: 20 }}>
                    입국 심사를 시작할게요
                  </p>
                  <p className={acStyles.leadSub}>
                    여행지의 날씨와 자외선은 피부에 흔적을 남깁니다.
                    <br />
                    몇 가지 질문으로 지금 피부 상태를 신고하면,
                    <br />
                    딱 맞는 애프터케어를 처방해드려요.
                  </p>
                  <AcBtnBar>
                    <AcBtn variant="ghost" onClick={() => setStage(acEntry === "careplan" ? "result" : "journey")}>
                      ← 이전
                    </AcBtn>
                    <AcBtn onClick={() => setStage("acQ1")}>
                      심사 시작하기 →
                    </AcBtn>
                  </AcBtnBar>
                </AcScreenChrome>
              </motion.section>
            )}

            {/* 애프터케어 — Q1 */}
            {stage === "acQ1" && (
              <motion.section
                key="acQ1"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0"
              >
                <AcScreenChrome step={1} eyebrow="ARRIVAL · 입국 심사" title="즐거운 여행되셨나요?" subtitle={acSubtitle} footerCode={acFooterCode}>
                  <AcLabel en="Skin Check" ko="피부 점검" />
                  <p className={acStyles.lead}>피부 상태가 달라지셨나요?</p>
                  <p className={acStyles.leadSub}>여행 전과 비교해 피부 컨디션에 변화가 느껴지는지 알려주세요.</p>
                  <div className={acStyles.choice2}>
                    <AcOpt selected={acQ1 === "yes"} onClick={() => setAcQ1("yes")} hint="변화가 있어요">
                      예
                    </AcOpt>
                    <AcOpt selected={acQ1 === "no"} onClick={() => setAcQ1("no")} hint="비슷해요">
                      아니요
                    </AcOpt>
                  </div>
                  <AcBtnBar>
                    <AcBtn variant="ghost" onClick={() => setStage("acArrival")}>
                      ← 이전
                    </AcBtn>
                    <AcBtn disabled={!acQ1} onClick={acNextQ1}>
                      다음 →
                    </AcBtn>
                  </AcBtnBar>
                </AcScreenChrome>
              </motion.section>
            )}

            {/* 애프터케어 — Q2 */}
            {stage === "acQ2" && (
              <motion.section
                key="acQ2"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0"
              >
                <AcScreenChrome step={2} eyebrow="ARRIVAL · 입국 심사" title="즐거운 여행되셨나요?" subtitle={acSubtitle} footerCode={acFooterCode}>
                  <AcLabel en="New Concern" ko="새로운 고민" />
                  <p className={acStyles.lead}>새롭게 생긴 피부 고민이 있나요?</p>
                  <p className={acStyles.leadSub}>여행 전에는 없었는데 새로 신경 쓰이는 부분이 생겼는지 알려주세요.</p>
                  <div className={acStyles.choice2}>
                    <AcOpt selected={acQ2 === "yes"} onClick={() => setAcQ2("yes")} hint="생겼어요">
                      예
                    </AcOpt>
                    <AcOpt selected={acQ2 === "no"} onClick={() => setAcQ2("no")} hint="없어요">
                      아니요
                    </AcOpt>
                  </div>
                  <AcBtnBar>
                    <AcBtn variant="ghost" onClick={() => setStage("acQ1")}>
                      ← 이전
                    </AcBtn>
                    <AcBtn disabled={!acQ2} onClick={acNextQ2}>
                      다음 →
                    </AcBtn>
                  </AcBtnBar>
                </AcScreenChrome>
              </motion.section>
            )}

            {/* 애프터케어 — Q3: 고민 신고 */}
            {stage === "acQ3" && (
              <motion.section
                key="acQ3"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0"
              >
                <AcScreenChrome step={3} eyebrow="ARRIVAL · 입국 심사" title="즐거운 여행되셨나요?" subtitle={acSubtitle} footerCode={acFooterCode}>
                  <AcLabel en="Declare" ko="피부 신고" />
                  <p className={acStyles.lead}>어떤 고민이 새롭게 생겼나요?</p>
                  <p className={acStyles.leadSub}>해당하는 항목을 모두 선택해 주세요. (중복 선택 가능)</p>
                  <div className={acStyles.chips}>
                    {CONCERNS.map((c) => (
                      <AcChip key={c.id} selected={acConcerns.includes(c.id)} onClick={() => acToggleConcern(c.id)} icon={c.ico} label={c.label} en={c.en} />
                    ))}
                  </div>
                  <AcBtnBar>
                    <AcBtn variant="ghost" onClick={() => setStage("acQ2")}>
                      ← 이전
                    </AcBtn>
                    <AcBtn
                      disabled={acConcerns.length === 0}
                      onClick={() => {
                        setAcMode("concern");
                        setStage("acResult");
                      }}
                    >
                      처방 받기 →
                    </AcBtn>
                  </AcBtnBar>
                </AcScreenChrome>
              </motion.section>
            )}

            {/* 애프터케어 — 결과 */}
            {stage === "acResult" &&
              (() => {
                const isConcern = acMode === "concern";
                const per = acChosenConcerns.length >= 3 ? 1 : acChosenConcerns.length === 2 ? 2 : 3;
                return (
                  <motion.section
                    key="acResult"
                    variants={stageVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute inset-0"
                  >
                    <AcScreenChrome
                      step={4}
                      eyebrow="ARRIVAL · 입국 심사"
                      title="즐거운 여행되셨나요?"
                      subtitle={acSubtitle}
                      footerCode={acFooterCode}
                      onBack={() => setStage(isConcern ? "acQ3" : "acQ1")}
                    >
                      {isConcern ? <AcStampSeal /> : <AcStampRect />}
                      <h2 className={acStyles.resultHead}>
                        {isConcern
                          ? `'${acChosenConcerns.map((c) => c.label).join(" · ")}' 맞춤 처방`
                          : acCountryName
                            ? `${acCountryName} 여행 후 케어`
                            : "여행지 맞춤 케어"}
                      </h2>
                      <p className={acStyles.resultSub}>
                        {isConcern ? "여행에서 새로 생긴 고민을 위한 처방 루틴이에요." : "큰 변화가 없어도, 여행지 기후에 맞춰 피부를 재정비해요."}
                      </p>
                      <p className={acStyles.focusline}>
                        {isConcern ? (
                          acChosenConcerns.map((c, i) => (
                            <span key={c.id}>
                              <b>{c.label}</b> — {c.focus}
                              {i < acChosenConcerns.length - 1 && <br />}
                            </span>
                          ))
                        ) : (
                          <>
                            <b>{acClimateProfile.label}</b> · {acClimateProfile.focus}
                          </>
                        )}
                      </p>
                      <div className={acStyles.products}>
                        {isConcern
                          ? acChosenConcerns.flatMap((c) => c.products.slice(0, per).map((p, i) => <AcProductCard key={`${c.id}-${i}`} {...p} />))
                          : acClimateProfile.products.map((p, i) => <AcProductCard key={i} {...p} />)}
                      </div>
                      <AcBtnBar>
                        <AcBtn variant="ghost" onClick={acRestart}>
                          처음으로
                        </AcBtn>
                        <AcBtn onClick={acSave}>맞춤 제품 담기 →</AcBtn>
                      </AcBtnBar>
                    </AcScreenChrome>
                    {acSaved && (
                      <div className="fixed bottom-7 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[#111111] px-[22px] py-[13px] text-[13px] font-bold text-white shadow-lg">
                        여권에 저장되었어요
                      </div>
                    )}
                  </motion.section>
                );
              })()}

            {/* 3. 여행지 설문 — 나라 → 도시 → 날짜 */}
            {stage === "travel" && (
              <motion.section
                key="travel"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-sans text-[12px] font-extrabold text-[#3f3f46]">STEP 2 / 2 · 여행 정보</div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/passport-seal.png" alt="" className="h-[42px] w-auto flex-none" />
                </div>

                <h1
                  className="mt-3 flex items-center gap-2 text-[28px] font-black leading-tight tracking-[-0.02em] text-[#0a0a0a]"
                  style={{ fontFamily: "var(--font-inter), sans-serif" }}
                >
                  어디로 떠나시나요? <PassportPlaneIcon className="w-9" />
                </h1>
                <p className="mt-1.5 font-sans text-sm text-[#71717a]">Select your destination</p>

                <div className="mt-5 flex flex-col gap-4">
                  {/* 나라 */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-extrabold text-[#0a0a0a]">
                        Country <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· 나라</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setUseCustom((v) => !v);
                          setCountryCode(null);
                          setCityName(null);
                        }}
                        className="font-sans text-xs font-bold text-[#ec1c24]"
                      >
                        {useCustom ? "목록에서 선택" : "직접 입력"}
                      </button>
                    </div>
                    {useCustom ? (
                      <div className="mt-2 flex flex-col gap-2.5">
                        <input
                          value={customCountry}
                          onChange={(e) => setCustomCountry(e.target.value)}
                          placeholder="나라 (예: 포르투갈)"
                          className="w-full rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0a0a0a] focus:bg-white"
                        />
                        <input
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          placeholder="도시 (예: 리스본)"
                          className="w-full rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0a0a0a] focus:bg-white"
                        />
                      </div>
                    ) : (
                      <div className="relative mt-2">
                        <select
                          value={countryCode ?? ""}
                          onChange={(e) => selectCountry(e.target.value)}
                          className="w-full appearance-none rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition focus:border-[#0a0a0a] focus:bg-white"
                        >
                          <option value="" disabled>
                            나라를 선택하세요
                          </option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 도시 (나라 연동) */}
                  {!useCustom && country && (
                    <div>
                      <label className="text-[13px] font-extrabold text-[#0a0a0a]">
                        City <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· 도시</span>
                      </label>
                      <div className="relative mt-2">
                        <select
                          value={cityName ?? ""}
                          onChange={(e) => setCityName(e.target.value)}
                          className="w-full appearance-none rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition focus:border-[#0a0a0a] focus:bg-white"
                        >
                          <option value="" disabled>
                            도시를 선택하세요
                          </option>
                          {country.cities.map((ci) => (
                            <option key={ci.name} value={ci.name}>
                              {ci.name}
                            </option>
                          ))}
                        </select>
                        <svg
                          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ca3af]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* 날짜 */}
                  <div>
                    <label className="text-[13px] font-extrabold text-[#0a0a0a]">
                      Travel dates <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· 여행 날짜</span>
                    </label>
                    <div className="mt-2 grid grid-cols-2 gap-2.5">
                      <DateField
                        tone="passport"
                        label="출발일 · DEPART"
                        value={departDate}
                        min={todayISO()}
                        onChange={(d) => {
                          setDepartDate(d);
                          if (arriveDate && arriveDate < d) setArriveDate(null);
                        }}
                      />
                      <DateField
                        tone="passport"
                        label="도착일 · RETURN"
                        value={arriveDate}
                        min={departDate ?? todayISO()}
                        disabled={!departDate}
                        onChange={setArriveDate}
                      />
                    </div>
                    {departDate && arriveDate && (
                      <div className="mt-2 font-sans text-xs text-[#71717a]">총 {diffDays(departDate, arriveDate)}일 일정</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <PassportButton variant="muted" fullWidth={false} onClick={() => setStage("journey")}>
                    ← 이전
                  </PassportButton>
                  <div className="flex-1">
                    <PassportButton disabled={!travelDone} onClick={() => setAnalyzing(true)}>
                      다음 →
                    </PassportButton>
                  </div>
                </div>
              </motion.section>
            )}

            {/* 4. 피부 설문 — Baumann 4축 (여권 심사 템플릿) */}
            {stage === "skin" &&
              (() => {
                const ax = BAUMANN_AXES[qIndex];
                const chosen = axes[qIndex];
                const last = qIndex === BAUMANN_AXES.length - 1;
                return (
                  <motion.section
                    key="skin"
                    variants={stageVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
                  >
                    <PassportTopBar onBack={skinPrev} />
                    <PassportEyebrow>피부 여권 심사 · Skin Type</PassportEyebrow>
                    <PassportTitle>
                      SKIN
                      <br />
                      TYPE <PassportSurveyIcon className="ml-1 inline-block w-14 -translate-y-1 align-middle" />
                    </PassportTitle>
                    <PassportKSub>4가지만 답하면 나의 피부 타입이 나와요</PassportKSub>

                    {/* 진행 스텝 (4단계) */}
                    <div className="mt-5 flex items-center gap-1.5">
                      {BAUMANN_AXES.map((_, i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${i <= qIndex ? "bg-[#0a0a0a]" : "bg-[#e7e7ea]"}`}
                        />
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={qIndex}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -24 }}
                        transition={{ duration: 0.28, ease: EASE }}
                      >
                        <div className="mt-5 flex items-baseline gap-2">
                          <span className="font-sans text-[13px] font-extrabold tracking-[0.14em] text-[#0a0a0a]">STEP {qIndex + 1}</span>
                          <span className="font-sans text-[12px] font-semibold text-[#9ca3af]">· {ax.sectionEn} · {ax.sectionKo}</span>
                        </div>
                        <h2 className="mt-2 font-sans text-[22px] font-black leading-[1.2] tracking-[-0.02em] text-[#0a0a0a]">{ax.q}</h2>
                        <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-[#71717a]">{ax.hint}</p>

                        <div className="mt-5 flex flex-col gap-3.5">
                          <PassportOptionCard
                            selected={chosen === ax.a.letter}
                            onClick={() => selectAxis(ax.a.letter)}
                            icon={<span className="text-[22px] leading-none">{ax.a.icon}</span>}
                            en={ax.a.en.toUpperCase()}
                            ko={ax.a.ko}
                            desc={ax.a.desc}
                          />
                          <PassportOptionCard
                            selected={chosen === ax.b.letter}
                            onClick={() => selectAxis(ax.b.letter)}
                            icon={<span className="text-[22px] leading-none">{ax.b.icon}</span>}
                            en={ax.b.en.toUpperCase()}
                            ko={ax.b.ko}
                            desc={ax.b.desc}
                          />
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    <div className="mt-6">
                      <PassportButton disabled={!chosen} onClick={skinNext}>
                        {last ? "진단 완료 →" : "다음 →"}
                      </PassportButton>
                    </div>

                    <PassportFooter />
                  </motion.section>
                );
              })()}

            {/* AI 성분 스캔 — 카메라 → 분석 → 결과 */}
            {stage === "scan" && (
              <motion.section
                key="scan"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <PassportTopBar onBack={scanStep === "camera" || scanStep === "loading" ? exitScan : () => setScanStep("camera")} />
                <input ref={scanFileRef} type="file" accept="image/*" className="hidden" onChange={onScanFile} />

                {scanStep === "camera" && (
                  <>
                    <PassportEyebrow>Ingredient Scan · 성분 스캔</PassportEyebrow>
                    <PassportTitle>
                      SCAN YOUR
                      <br />
                      PRODUCT
                    </PassportTitle>
                    <PassportKSub>쓰는 화장품을 프레임에 담아 촬영하세요</PassportKSub>

                    <div className="relative mt-5 overflow-hidden rounded-[22px] bg-[#141416]" style={{ aspectRatio: "3 / 4" }}>
                      <video ref={scanVideoRef} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
                      {!cameraReady && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[#6b6b74]">
                          <span className="text-5xl opacity-60 grayscale">🧴</span>
                          <span className="px-6 text-center text-xs">카메라를 준비하거나 앨범에서 불러오세요</span>
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-4">
                        <span className="absolute left-0 top-0 h-7 w-7 rounded-tl-lg border-l-[3px] border-t-[3px] border-white" />
                        <span className="absolute right-0 top-0 h-7 w-7 rounded-tr-lg border-r-[3px] border-t-[3px] border-white" />
                        <span className="absolute bottom-0 left-0 h-7 w-7 rounded-bl-lg border-b-[3px] border-l-[3px] border-white" />
                        <span className="absolute bottom-0 right-0 h-7 w-7 rounded-br-lg border-b-[3px] border-r-[3px] border-white" />
                      </div>
                      <div className="absolute inset-x-0 bottom-3 text-center text-xs font-semibold text-white" style={{ textShadow: "0 1px 6px rgba(0,0,0,.6)" }}>
                        제품 라벨이 잘 보이게 맞춰주세요
                      </div>
                    </div>

                    <div className="mt-5 flex items-center justify-center gap-6">
                      <button
                        type="button"
                        onClick={() => scanFileRef.current?.click()}
                        aria-label="앨범에서 불러오기"
                        className="flex h-12 w-12 items-center justify-center rounded-2xl border-[1.5px] border-[#e7e7ea] bg-white text-xl transition active:scale-95"
                      >
                        🖼️
                      </button>
                      <button
                        type="button"
                        onClick={captureScan}
                        disabled={!cameraReady}
                        aria-label="촬영"
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-[#0a0a0a] bg-white transition active:scale-90 disabled:opacity-40"
                      >
                        <span className="h-14 w-14 rounded-full bg-[#0a0a0a]" />
                      </button>
                      <div className="flex h-12 w-12 items-center justify-center font-sans text-[11px] font-extrabold text-[#9ca3af]">AI</div>
                    </div>
                    <p className="mt-3 text-center font-sans text-[11px] text-[#9ca3af]">촬영 · 앨범 불러오기 모두 지원해요</p>
                  </>
                )}

                {scanStep === "loading" && (
                  <>
                    <PassportEyebrow>Analyzing · 분석 중</PassportEyebrow>
                    <PassportTitle>
                      READING
                      <br />
                      LABEL…
                    </PassportTitle>
                    {scanImage && (
                      <div className="mt-5 overflow-hidden rounded-[20px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={scanImage} alt="촬영 이미지" className="h-44 w-full object-cover" />
                      </div>
                    )}
                    <div className="mt-6 flex flex-col gap-3.5">
                      {[
                        { t: "제품 인식", s: "브랜드·제품명 판독" },
                        { t: "전성분 조회", s: "성분 데이터 대조" },
                        { t: "내 피부와 매칭", s: "적합도·주의 성분 산출" },
                      ].map((step, i) => (
                        <div key={step.t} className="flex items-center gap-3">
                          <span className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-[#0a0a0a]" style={{ animationDelay: `${i * 0.25}s` }} />
                          <div>
                            <div className="font-sans text-[14px] font-bold text-[#0a0a0a]">{step.t}</div>
                            <div className="font-sans text-[11.5px] text-[#9ca3af]">{step.s}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-7 flex items-center gap-3 font-sans text-[13px] text-[#71717a]">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#e7e7ea] border-t-[#0a0a0a]" />
                      AI가 제품과 성분을 분석하고 있어요…
                    </div>
                  </>
                )}

                {scanStep === "result" && scanResult && (
                  <>
                    <PassportEyebrow>Result · 분석 결과</PassportEyebrow>
                    {scanResult.identified ? (
                      <>
                        <div className="mt-2 font-sans text-[26px] font-black tracking-[-0.02em] text-[#0a0a0a]">스캔 완료</div>

                        <div className="mt-3 flex items-center gap-3.5 rounded-2xl border-[1.5px] border-[#e7e7ea] p-3.5">
                          <div className="flex h-[70px] w-[70px] flex-none items-center justify-center rounded-2xl bg-[#f4f4f5] text-3xl">🧴</div>
                          <div className="min-w-0 flex-1">
                            <div className="font-sans text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#9ca3af]">{scanResult.brand}</div>
                            <div className="mt-0.5 font-sans text-[15px] font-black leading-tight text-[#0a0a0a]">{scanResult.name}</div>
                            <span className="mt-1.5 inline-block rounded-full bg-[#f4f4f5] px-2.5 py-1 font-sans text-[11px] font-bold text-[#3f3f46]">{scanResult.category}</span>
                          </div>
                          <div className="flex-none text-right font-sans text-[10px] font-bold text-[#9ca3af]">
                            AI 인식
                            <br />
                            {scanResult.confidence}%
                          </div>
                        </div>
                        {scanResult.summary && <p className="mt-3 font-sans text-[13px] leading-relaxed text-[#3f3f46]">{scanResult.summary}</p>}

                        <div className="mt-5 flex items-baseline gap-2">
                          <span className="font-sans text-[14px] font-black text-[#0a0a0a]">전성분 분석</span>
                          <span className="font-sans text-[11px] font-bold tracking-[0.06em] text-[#9ca3af]">KEY INGREDIENTS</span>
                        </div>
                        <div className="mt-2.5 flex flex-col gap-2">
                          {scanResult.ingredients.map((g, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-[#e7e7ea] px-3 py-2.5">
                              <div className="min-w-0 flex-1">
                                <div className="font-sans text-[14px] font-extrabold text-[#0a0a0a]">{g.name}</div>
                                <div className="font-sans text-[11.5px] text-[#71717a]">
                                  {g.role}
                                  {g.caution ? ` · ⚠️ ${g.caution}` : ""}
                                </div>
                              </div>
                              <span className={`flex-none rounded-full px-2.5 py-1 font-sans text-[10px] font-extrabold ${SCAN_PILL[g.type] ?? SCAN_PILL.base}`}>{g.label}</span>
                            </div>
                          ))}
                        </div>

                        {scanResult.safety.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {scanResult.safety.map((s) => (
                              <span key={s} className="rounded-full bg-[#f4f4f5] px-2.5 py-1 font-sans text-[11px] font-bold text-[#3f3f46]">{s}</span>
                            ))}
                          </div>
                        )}

                        {/* 알레르기·규제 성분 체크 (AI 라벨 판독 + 규제 성분 DB 교차검증) */}
                        <IngredientSafety
                          ingredients={scanResult.ingredients.map((g) => g.name)}
                          allergens={scanResult.allergens ?? []}
                        />

                        {scanResult.caution && (
                          <div className="mt-3 rounded-lg border-l-[3px] border-[#ec1c24] bg-[#fef3f2] px-3.5 py-2.5 font-sans text-[12.5px] leading-relaxed text-[#8a2b28]">⚠️ {scanResult.caution}</div>
                        )}
                        {scanResult.demo && (
                          <div className="mt-3 rounded-lg bg-[#f4f4f5] px-3.5 py-2.5 font-sans text-[12px] leading-relaxed text-[#71717a]">ℹ️ 데모 응답이에요. 서버에 <b className="font-bold text-[#0a0a0a]">ANTHROPIC_API_KEY</b>를 설정하면 실제 사진을 분석합니다.</div>
                        )}

                        <div className="mt-5 flex gap-3">
                          <PassportButton onClick={saveScanProduct} disabled={!loggedInId || scanSaved}>
                            {scanSaved ? "✓ 여권에 저장됨" : loggedInId ? "＋ 내 여권에 저장" : "로그인 후 저장 가능"}
                          </PassportButton>
                          <PassportButton variant="muted" fullWidth={false} onClick={() => setScanStep("camera")}>
                            다시 스캔
                          </PassportButton>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mt-2 font-sans text-[23px] font-black tracking-[-0.02em] text-[#0a0a0a]">제품을 특정하지 못했어요</div>
                        <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#71717a]">{scanResult.note || "라벨이 잘 보이게 다시 촬영해 주세요."}</p>
                        {scanResult.candidates.length > 0 && (
                          <>
                            <div className="mt-5 font-sans text-[13px] font-black text-[#0a0a0a]">혹시 이 제품인가요?</div>
                            <div className="mt-2.5 flex flex-col gap-2">
                              {scanResult.candidates.map((c, i) => (
                                <div key={i} className="rounded-xl border border-[#e7e7ea] px-3.5 py-3">
                                  <div className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">{c.brand}</div>
                                  <div className="mt-0.5 font-sans text-[14px] font-extrabold text-[#0a0a0a]">{c.name}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        <div className="mt-5">
                          <PassportButton onClick={() => setScanStep("camera")}>다시 촬영하기 →</PassportButton>
                        </div>
                      </>
                    )}
                  </>
                )}

                {scanStep === "error" && (
                  <>
                    <PassportEyebrow>Error · 오류</PassportEyebrow>
                    <div className="mt-2 font-sans text-[24px] font-black tracking-[-0.02em] text-[#0a0a0a]">분석에 실패했어요</div>
                    <p className="mt-2 font-sans text-[13px] leading-relaxed text-[#71717a]">{scanError}</p>
                    {scanImage && (
                      <div className="mt-4 overflow-hidden rounded-[16px] opacity-70">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={scanImage} alt="촬영 이미지" className="h-32 w-full object-cover" />
                      </div>
                    )}
                    <div className="mt-5 flex gap-3">
                      <PassportButton onClick={() => scanImage && analyzeScan(scanImage)}>다시 시도 →</PassportButton>
                      <PassportButton variant="muted" fullWidth={false} onClick={() => setScanStep("camera")}>
                        다시 촬영
                      </PassportButton>
                    </div>
                  </>
                )}

                <PassportFooter />
              </motion.section>
            )}

            {/* 결과 분석중 (피부설문 또는 여행지설문 완료 후) */}
            {analyzing && (
              <motion.section
                key="analyzing"
                variants={stageVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="absolute inset-0 z-40 overflow-y-auto bg-white px-7 pb-6 pt-5"
              >
                <div className="flex min-h-full flex-col items-center justify-center text-center">
                  <div className="font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#71717a]">ANALYZING · 분석 중</div>
                  <h1
                    className="mt-3 text-[30px] font-black leading-[0.95] tracking-[-0.02em] text-[#0a0a0a]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    ISSUING
                    <br />
                    PASSPORT
                  </h1>
                  <p className="mt-3 max-w-[260px] font-sans text-[13.5px] leading-relaxed text-[#71717a]">
                    여행지 기후와 내 피부 상태를 결합해
                    <br />
                    맞춤 여권을 발급하고 있어요.
                  </p>
                  <div className="relative mt-9 h-[70px] w-[210px] overflow-hidden">
                    <div className="flex h-full items-end justify-center gap-[1.5px]">
                      {ANALYZE_BARS.map((h, i) => (
                        <span key={i} className="w-[2px] bg-[#0a0a0a]" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                    <motion.div
                      className="absolute inset-x-0 h-[2px] bg-[#ec1c24]"
                      style={{ boxShadow: "0 0 10px 1px rgba(236,28,36,0.6)" }}
                      animate={{ top: [6, 60, 6] }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="mt-6 h-[5px] w-[180px] overflow-hidden rounded-full bg-[#f4f4f5]">
                    <motion.span
                      className="block h-full bg-[#0a0a0a]"
                      initial={{ width: "8%" }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 3.2, ease: "easeInOut" }}
                    />
                  </div>
                  <div className="mt-4 font-sans text-[13px] font-bold tracking-[0.3em] text-[#71717a]">SCANNING…</div>
                </div>
              </motion.section>
            )}

            {/* 5. 결과 */}
            {stage === "result" && result && (
              <motion.section key="result" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto bg-white px-7 pb-8 pt-5">
                <div className="min-h-full">
                  <div className="mb-3 text-center font-sans text-[10px] font-bold uppercase tracking-[0.28em] text-[#71717a]">{name || "여행자"}님의 뷰티 여권</div>

                  {resultView === "main" && (
                    <>
                      {/* 보딩패스 요약 + 피부 이슈 지수 + 날씨 캘린더 + AI 써머리 (통합 카드) */}
                      {skin &&
                        (() => {
                          const bt = BAUMANN_TYPES[skin.code];
                          const sub = skinIssueSubindex(result.profile, skin.code, skin.recConcerns);
                          return (
                            <div className="overflow-hidden rounded-2xl border border-[#e7e7ea] bg-white shadow-[0_8px_24px_rgba(20,30,50,0.06)]">
                              {/* 헤더 스트립 */}
                              <div className="flex items-center justify-between bg-[#0a0a0a] px-[18px] py-3 text-white">
                                <span className="text-[12px] font-extrabold tracking-[0.18em]">BOARDING PASS</span>
                                <span className="text-[12px] font-bold tracking-[0.06em] text-white/70">BP-{(departDate ?? "2026-08").slice(2, 4)}{(departDate ?? "2026-08-08").slice(5, 7)}</span>
                              </div>

                              <div className="p-[18px]">
                                {/* 탑승객 · 항로 · 일정 · Baumann 요약 */}
                                <div className="flex items-end justify-between">
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Passenger</div>
                                    <div className="mt-0.5 text-[22px] font-black tracking-[-0.02em] text-[#0a0a0a]">{name || "여행자"}</div>
                                  </div>
                                  <div className="text-right text-xs text-[#71717a]">
                                    {age && <>만 {age}세 · </>}{gender}
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between border-y border-dashed border-[#e7e7ea] py-3">
                                  <div>
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">From</div>
                                    <div className="mt-0.5 text-base font-extrabold text-[#0a0a0a]">일상</div>
                                  </div>
                                  <div className="text-[15px] text-[#ec1c24]">✈</div>
                                  <div className="text-right">
                                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">To</div>
                                    <div className="mt-0.5 text-base font-extrabold text-[#0a0a0a]">{result.placeLabel}</div>
                                  </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-sm">
                                  <div className="text-[#3f3f46]">
                                    {departDate && arriveDate ? `${fmtISO(departDate)} ~ ${fmtISO(arriveDate)}` : "일정 미정"}
                                  </div>
                                  <div className="rounded-full border border-[#ec1c24] px-2.5 py-0.5 text-[11px] font-extrabold text-[#ec1c24]">
                                    {result.days - 1}박 {result.days}일
                                  </div>
                                </div>

                                <div className="mt-4">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Baumann Skin Type</div>
                                  <div className="mt-1.5 flex items-center gap-3">
                                    <div className="flex h-14 items-center rounded-xl bg-[#0a0a0a] px-4 text-2xl font-black tracking-[0.08em] text-white">
                                      {skin.code}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-[17px] font-black leading-tight text-[#0a0a0a]">{bt?.nick ?? skin.code}</div>
                                      <div className="text-[12px] leading-snug text-[#71717a]">{bt?.tagline}</div>
                                    </div>
                                  </div>
                                </div>

                                {/* 피부 이슈 지수 */}
                                <div className="mt-[17px] border-t border-dashed border-[#e7e7ea] pt-[17px]">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Skin Issue Index</div>
                                  <h3 className="mt-0.5 text-[15px] font-extrabold text-[#0a0a0a]">📊 피부 이슈 지수</h3>
                                  <div className="mt-3 flex items-center gap-4">
                                    <div
                                      className="relative grid h-[88px] w-[88px] flex-none place-items-center rounded-full"
                                      style={{ background: `conic-gradient(#ec1c24 ${result.index.score}%, #f4f4f5 0)` }}
                                    >
                                      <div className="absolute h-[68px] w-[68px] rounded-full bg-white" />
                                      <div className="relative text-center leading-none">
                                        <div className="text-2xl font-black text-[#0a0a0a]">{result.index.score}</div>
                                        <div className="text-[9px] text-[#9ca3af]">/ 100</div>
                                        <div className="mt-0.5 text-[9px] font-extrabold tracking-[0.06em] text-[#ec1c24]">{result.index.level}</div>
                                      </div>
                                    </div>
                                    <div className="grid flex-1 grid-cols-2 gap-x-3.5 gap-y-2.5">
                                      <SubindexBar label="자외선 노출" value={sub.uvExposure} />
                                      <SubindexBar label="색소 침착" value={sub.pigment} />
                                      <SubindexBar label="수분 손실" value={sub.hydrationLoss} />
                                      <SubindexBar label="트러블·유수분" value={sub.troubleSebum} />
                                    </div>
                                  </div>
                                </div>

                                {/* 여행 날씨 캘린더 */}
                                <div className="mt-[17px] border-t border-dashed border-[#e7e7ea] pt-[17px]">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Weather Calendar</div>
                                  <h3 className="mt-0.5 text-[15px] font-extrabold text-[#0a0a0a]">📅 여행 날씨 캘린더</h3>
                                  <p className="mt-1 text-xs text-[#71717a]">{result.placeLabel} · 좌우로 넘겨보세요</p>
                                  <div className="scroll-x mt-3 flex gap-1.5 overflow-x-auto pb-1">
                                    {result.calendar.map((c, k) => {
                                      const hot = c.emojis.some((e) => e.icon === "🔥");
                                      return (
                                        <div
                                          key={k}
                                          className={`relative w-[66px] flex-none overflow-hidden rounded-xl border px-1.5 py-2 text-center ${
                                            hot ? "border-[#f6d0d0] bg-gradient-to-b from-white to-[#fef6f6]" : "border-[#e7e7ea] bg-white"
                                          }`}
                                        >
                                          <span className={`absolute inset-x-0 top-0 h-[3px] ${hot ? "bg-[#ec1c24]" : "bg-[#9ca3af]"}`} />
                                          <div className="text-[11px] font-bold text-[#0a0a0a]">
                                            {c.date} <span className="text-[#9ca3af]">({c.weekday})</span>
                                          </div>
                                          <div className="my-1 text-lg leading-none">{c.emojis.map((e) => e.icon).join("")}</div>
                                          <div className="text-[11px] font-bold text-[#0a0a0a]">{c.temp}℃</div>
                                          <div className="mt-0.5 text-[9px] leading-tight text-[#9ca3af]">습도 {c.humidity}% · 미세먼지 {c.dust}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-2 flex gap-3 text-[10.5px] text-[#71717a]">
                                    <span className="inline-flex items-center gap-1">
                                      <i className="inline-block h-[3px] w-3.5 rounded bg-[#ec1c24]" />더운 날
                                    </span>
                                    <span className="inline-flex items-center gap-1">
                                      <i className="inline-block h-[3px] w-3.5 rounded bg-[#9ca3af]" />보통
                                    </span>
                                  </div>
                                </div>

                                {/* AI 써머리 */}
                                <div className="mt-[17px] border-t border-dashed border-[#e7e7ea] pt-[17px]">
                                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">AI Summary</div>
                                  <h3 className="mt-0.5 text-[15px] font-extrabold text-[#0a0a0a]">🤖 AI가 이렇게 판단했어요</h3>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {age && <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10.5px] font-bold text-[#3f3f46]">{age}세</span>}
                                    <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10.5px] font-bold text-[#3f3f46]">{skin.code}</span>
                                    {result.profile.tag && (
                                      <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10.5px] font-bold text-[#3f3f46]">{result.profile.tag}</span>
                                    )}
                                    <span className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10.5px] font-bold text-[#3f3f46]">UV {result.profile.uv}</span>
                                  </div>
                                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-[#444]">💬 {comboComment(result.profile, skin.skinTypeForRec)}</p>
                                  <button
                                    type="button"
                                    onClick={() => setShowAiDetail(true)}
                                    className="mt-3.5 w-full rounded-[14px] bg-[#0a0a0a] px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.985]"
                                  >
                                    📋 상세보기 — AI 판단 · 날씨 · 성분 · 루틴
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                      {/* 추천 제품 (추천 세트 · 내 제품과 비교) */}
                      <Card>
                        <CardTitle>🧴 AI가 고른 여행 스킨케어</CardTitle>

                        <div className="mt-3 flex gap-1.5 rounded-[14px] bg-[#f4f4f5] p-1">
                          <button
                            type="button"
                            onClick={() => setRecTab("set")}
                            className={`flex-1 rounded-xl px-2 py-2.5 text-[13.5px] font-extrabold transition ${
                              recTab === "set" ? "bg-white text-[#0a0a0a] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.14)]" : "text-[#71717a]"
                            }`}
                          >
                            추천 세트
                          </button>
                          <button
                            type="button"
                            onClick={() => setRecTab("compare")}
                            className={`flex-1 rounded-xl px-2 py-2.5 text-[13.5px] font-extrabold transition ${
                              recTab === "compare" ? "bg-white text-[#0a0a0a] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.14)]" : "text-[#71717a]"
                            }`}
                          >
                            내 제품과 비교
                          </button>
                        </div>

                        {recTab === "set" && (
                          <div className="mt-4">
                            <div className="rounded-xl bg-[#f4f4f5] px-4 py-3 text-center text-[13px] font-semibold text-[#3f3f46]">
                              {result.recSummary}
                            </div>
                            <p className="mt-3 text-xs text-[#71717a]">카테고리별 대표 {result.recItems.length}개 · 좌우로 넘겨보세요</p>
                            <div className="scroll-x mt-2 flex gap-2.5 overflow-x-auto pb-1">
                              {result.recItems.map(({ p }) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => setDetailId(p.id)}
                                  className="flex w-[108px] flex-none flex-col overflow-hidden rounded-xl border border-[#e7e7ea] bg-white text-left"
                                >
                                  <div className="flex h-[52px] items-center justify-center bg-[#f4f4f5]">
                                    <ProductImage product={p} />
                                  </div>
                                  <div className="p-2">
                                    <div className="line-clamp-2 text-[11.5px] font-extrabold leading-tight text-[#0a0a0a]">{p.name}</div>
                                    <span className="mt-1.5 inline-block rounded-full bg-[#f4f4f5] px-1.5 py-0.5 text-[9px] font-semibold text-[#71717a]">{p.category}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                onClick={addAllRec}
                                className="flex-1 rounded-[12px] bg-[#0a0a0a] px-3 py-3 text-[13.5px] font-extrabold text-white transition active:scale-[0.985]"
                              >
                                전체 담기 →
                              </button>
                              <button
                                type="button"
                                onClick={() => setResultView("pick")}
                                className="flex-1 rounded-[12px] border-[1.5px] border-[#e7e7ea] bg-white px-3 py-3 text-[13.5px] font-extrabold text-[#0a0a0a] transition active:bg-[#f4f4f5]"
                              >
                                직접 고르기 →
                              </button>
                            </div>
                          </div>
                        )}

                        {recTab === "compare" && (
                          <div className="mt-4 rounded-2xl border-[1.5px] border-dashed border-[#d7dbe0] bg-[#fafbfc] p-6 text-center">
                            <div className="text-3xl">📷</div>
                            <p className="mt-2.5 text-[13.5px] text-[#0a0a0a]">
                              내가 쓰는 화장품을 촬영하면 <b className="text-[#ec1c24]">AI가 성분을 분석</b>해줘요.
                            </p>
                            <p className="mt-1 text-xs text-[#71717a]">이 여행지 기준 주의 성분·안전 여부까지 함께 확인할 수 있어요.</p>
                            <button
                              type="button"
                              onClick={openScanFromResult}
                              className="mt-4 w-full rounded-[14px] bg-[#0a0a0a] px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.985]"
                            >
                              촬영해서 내 제품 분석하기 →
                            </button>
                          </div>
                        )}
                      </Card>

                      {/* [6-2] 장바구니는 우측 하단 플로팅 버튼에서 확인 */}
                      {cart.length > 0 && (
                        <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-[#e7e7ea] bg-white px-4 py-2.5 text-sm text-[#0a0a0a]">
                          <span>🧳 담긴 샘플 {cartCount}개</span>
                          <button onClick={() => setCartOpen(true)} className="font-bold text-[#0a0a0a]">장바구니 보기 →</button>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setResultView("plan")}
                        className="mt-4 w-full rounded-[14px] bg-[#0a0a0a] px-4 py-[15px] text-[14.5px] font-extrabold text-white transition active:scale-[0.985]"
                      >
                        여행 케어 플랜 보기 →
                      </button>

                      {/* 하단 영수증 바코드 */}
                      <footer className="mt-6 border-t-[1.5px] border-dashed border-[#e7e7ea] pt-4 text-center">
                        <div className="font-sans text-[11px] font-extrabold tracking-[0.32em] text-[#0a0a0a]">BEAUTY PASSPORT</div>
                        <PassportBarcode />
                        <div className="font-sans text-xs font-bold tracking-[0.28em] text-[#ec1c24]">
                          {`BP ${(departDate ?? "2026-08-08").slice(2, 4)}${(departDate ?? "2026-08-08").slice(5, 7)} ${(arriveDate ?? "2026-08-18").slice(5, 7)} ${(arriveDate ?? "2026-08-18").slice(8, 10)}`}
                        </div>
                      </footer>
                    </>
                  )}

                  {/* 직접 고르기: 전체 카탈로그 · 카테고리 탭 */}
                  {resultView === "pick" && (
                    <div>
                      <button type="button" onClick={() => setResultView("main")} className="text-sm font-semibold text-[#71717a]">← 추천으로</button>
                      <h2
                        className="mt-3 text-[22px] font-black tracking-[-0.02em] text-[#0a0a0a]"
                        style={{ fontFamily: "var(--font-inter), sans-serif" }}
                      >
                        전체 제품에서 고르기
                      </h2>
                      <p className="mt-1 text-xs text-[#71717a]">카테고리별로 모든 제품을 둘러보고 담을 수 있어요.</p>

                      <div className="scroll-x mt-3 flex gap-2 overflow-x-auto pb-2">
                        {PICK_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setPickCat(cat)}
                            className={`flex-none rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                              pickCat === cat ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[#e7e7ea] bg-white text-[#71717a]"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 space-y-3">
                        {COSMETICS.filter((p) => p.category === pickCat).map((p) => {
                          const dryHigh = result.profile.humidity <= 45;
                          const uvHigh = result.profile.uv >= 8;
                          const rec = recommendVolume(p.category, result.days, dryHigh, uvHigh);
                          const ml = volumeSel[p.id] ?? rec.ml;
                          const price = samplePrice(p.price, p.fullMl, ml);
                          const qty = cartQty(p.id, ml);
                          return (
                            <div key={p.id} className="rounded-2xl border border-[#e7e7ea] bg-white p-3.5 shadow-[0_8px_24px_rgba(20,30,50,0.05)]">
                              <button type="button" onClick={() => setDetailId(p.id)} className="flex w-full gap-3 text-left">
                                <ProductImage product={p} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-[#9ca3af]">{p.brand}</span>
                                    <span className="ml-auto flex items-center gap-0.5 text-[12px] font-bold text-[#ec1c24]">★ {p.rating.toFixed(2)}</span>
                                  </div>
                                  <div className="mt-0.5 truncate text-sm font-extrabold text-[#0a0a0a]">{p.name}</div>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                    {p.ingredients.map((ing) => (
                                      <span key={ing} className="rounded-full bg-[#f4f4f5] px-2 py-0.5 text-[10px] text-[#3f3f46]">#{ing}</span>
                                    ))}
                                  </div>
                                  <div className="mt-1 text-right text-[10px] font-bold text-[#0a0a0a]">자세히 보기 →</div>
                                </div>
                              </button>

                              <ComplianceBadge cosmeticId={p.id} destinationCountry={countryCode} compact />

                              <div className="mt-2 flex items-center gap-2 border-t border-dashed border-[#e7e7ea] pt-2">
                                <select
                                  value={ml}
                                  onChange={(e) => setVolumeSel((v) => ({ ...v, [p.id]: Number(e.target.value) }))}
                                  className="flex-1 rounded-xl border border-[#e7e7ea] bg-white px-2 py-1.5 text-[12px] text-[#0a0a0a] outline-none focus:border-[#0a0a0a]"
                                >
                                  {SAMPLE_TIERS.map((t) => (
                                    <option key={t} value={t}>
                                      {t}ml{t === rec.ml ? " · 추천" : ""}
                                    </option>
                                  ))}
                                </select>
                                <span className="rounded-full bg-[#f4f4f5] px-2 py-1 text-[10px] font-semibold text-[#3f3f46]">기내 반입 가능 ✈️</span>
                                <span className="text-sm font-extrabold text-[#0a0a0a]">{price.toLocaleString()}원</span>
                                {qty === 0 ? (
                                  <button
                                    onClick={() => addSample(p.id, ml)}
                                    className="rounded-full bg-[#0a0a0a] px-3 py-1.5 text-xs font-bold text-white transition active:scale-95"
                                  >
                                    담기
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 rounded-full bg-[#f4f4f5] px-2 py-1">
                                    <button onClick={() => decSample(p.id, ml)} className="text-sm font-bold text-[#0a0a0a]">−</button>
                                    <span className="w-4 text-center text-xs font-bold text-[#0a0a0a]">{qty}</span>
                                    <button onClick={() => addSample(p.id, ml)} className="text-sm font-bold text-[#0a0a0a]">＋</button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 여행 케어 플랜: 여행 전 · 중 · 후 탭 */}
                  {resultView === "plan" && (
                    <div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setResultView("main")}
                          className="flex h-9 w-9 items-center justify-center rounded-[11px] border-[1.5px] border-[#e7e7ea] bg-white text-[#0a0a0a]"
                        >
                          ‹
                        </button>
                        <span className="font-sans text-[11px] font-bold tracking-[0.06em] text-[#71717a]">PAGE 2 / 2</span>
                      </div>
                      <h1
                        className="mt-2.5 text-[24px] font-black leading-[0.95] tracking-[-0.02em] text-[#0a0a0a]"
                        style={{ fontFamily: "var(--font-inter), sans-serif" }}
                      >
                        여행 전 · 중 · 후
                      </h1>
                      <p className="mt-1 text-xs text-[#71717a]">시점을 고르면 체크리스트와 타임라인 케어가 나와요.</p>

                      <div className="mt-4 flex gap-2">
                        {(["여행 전", "여행 중", "여행 후"] as const).map((label, i) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => setCarePhase(i as 0 | 1 | 2)}
                            className={`flex-1 rounded-2xl border px-1.5 py-2.5 text-center transition ${
                              carePhase === i ? "border-[#0a0a0a] bg-[#0a0a0a]" : "border-[#e7e7ea] bg-white"
                            }`}
                          >
                            <b className={`block text-[13.5px] ${carePhase === i ? "text-white" : "text-[#0a0a0a]"}`}>{label}</b>
                          </button>
                        ))}
                      </div>

                      {carePhase === 0 && (
                        <Card>
                          <CardTitle>🛫 출국 전</CardTitle>
                          {dday !== null ? (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="text-sm text-[#3f3f46]">출발까지</span>
                              <span className="text-xl font-black text-[#ec1c24]">
                                {dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : "여행 중"}
                              </span>
                            </div>
                          ) : (
                            <p className="mt-2 text-sm text-[#71717a]">출발일을 선택하면 D-day가 표시돼요.</p>
                          )}
                          {departDate && (
                            <div className="mt-2 rounded-xl bg-[#f4f4f5] px-3 py-2 text-xs text-[#3f3f46]">
                              📦 소용량 키트 도착 예정일 <b className="text-[#0a0a0a]">{fmtISO(addDaysISO(departDate, -2))}</b> (출발 2일 전)
                            </div>
                          )}
                          <div className="mt-3 space-y-2">
                            {CHECKLIST_ITEMS.map((item, i) => (
                              <label key={i} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={checklist[i]}
                                  onChange={() => toggleChecklist(i)}
                                  className="h-4 w-4 rounded accent-[#0a0a0a]"
                                />
                                <span className={checklist[i] ? "text-[#9ca3af] line-through" : "text-[#3f3f46]"}>{item}</span>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCarePhase(1)}
                            className="mt-4 w-full rounded-[14px] bg-[#0a0a0a] px-4 py-3 text-sm font-extrabold text-white transition active:scale-[0.985]"
                          >
                            출국하기 →
                          </button>
                        </Card>
                      )}

                      {carePhase === 1 && (
                        <Card>
                          <DestinationCareTab
                            country={country}
                            city={city}
                            onSelectDestination={(code, cName) => {
                              selectCountry(code);
                              setCityName(cName);
                            }}
                            recItems={result.recItems}
                            destinationCountryCode={countryCode}
                            onShowMakeup={() => setMakeupOpen(true)}
                            onCareArrival={() => {
                              setAcEntry("careplan");
                              setStage("acArrival");
                            }}
                          />
                        </Card>
                      )}

                      {carePhase === 2 && (
                        <Card>
                          <CardTitle>🏠 귀국 후 · 리커버리</CardTitle>
                          <p className="mt-2 text-sm leading-relaxed text-[#3f3f46]">
                            여행 중 자극받은 피부 장벽을 되돌리는 진정 회복 루틴을 추천해요.
                          </p>
                          <div className="mt-3 space-y-2">
                            {RECOVERY_IDS.map((id) => {
                              const p = COSMETICS.find((c) => c.id === id);
                              if (!p) return null;
                              return (
                                <div key={id} className="flex items-center gap-3 rounded-xl bg-[#f4f4f5] p-2.5">
                                  <ProductImage product={p} />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#9ca3af]">{p.brand}</div>
                                    <div className="truncate text-sm font-extrabold text-[#0a0a0a]">{p.name}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#f4f4f5] px-4 py-3">
                            <span className="text-sm text-[#3f3f46]">이번 여행 피부 이슈 지수</span>
                            <span className="text-lg font-black text-[#0a0a0a]">
                              {result.index.score} · {result.index.level}
                            </span>
                          </div>
                        </Card>
                      )}

                      {/* 하단 버튼 */}
                      <div className="mt-8 flex gap-3">
                        <button
                          onClick={restart}
                          className="flex-1 rounded-[14px] border-[1.5px] border-[#e7e7ea] bg-white px-6 py-4 text-[15px] font-extrabold text-[#0a0a0a] transition active:bg-[#f4f4f5]"
                        >
                          다시하기 ↺
                        </button>
                        <div className="flex-1">
                          <PrimaryButton onClick={shareResult}>공유하기 🔗</PrimaryButton>
                        </div>
                      </div>
                      {shared && <div className="mt-3 text-center text-sm text-[#71717a]">링크가 복사되었어요!</div>}

                      {/* 하단 영수증 바코드 */}
                      <footer className="mt-6 border-t-[1.5px] border-dashed border-[#e7e7ea] pt-4 text-center">
                        <div className="font-sans text-[11px] font-extrabold tracking-[0.32em] text-[#0a0a0a]">BEAUTY PASSPORT</div>
                        <PassportBarcode />
                        <div className="font-sans text-xs font-bold tracking-[0.28em] text-[#ec1c24]">
                          {`BP ${(departDate ?? "2026-08-08").slice(2, 4)}${(departDate ?? "2026-08-08").slice(5, 7)} ${(arriveDate ?? "2026-08-18").slice(5, 7)} ${(arriveDate ?? "2026-08-18").slice(8, 10)}`}
                        </div>
                      </footer>
                    </div>
                  )}
                </div>
              </motion.section>
            )}

            {/* [6-3] 수령 방식 선택 */}
            {stage === "receive" && (
              <motion.section key="receive" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto bg-white px-7 pb-8 pt-5">
                <div className="min-h-full">
                  <button onClick={() => setStage("result")} className="text-sm font-semibold text-[#71717a]">← 뒤로</button>
                  <h2
                    className="mt-3 text-[26px] font-black leading-tight tracking-[-0.02em] text-[#0a0a0a]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    어떻게 받으실래요?
                  </h2>
                  <p className="mt-2 text-sm text-[#71717a]">담긴 샘플 {cartCount}개 · {cartTotalPrice.toLocaleString()}원</p>

                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setReceiveMethod("delivery"); setStage("delivery"); }}
                    className="mt-6 w-full rounded-2xl border border-[#e7e7ea] bg-white p-5 text-left shadow-[0_8px_24px_rgba(20,30,50,0.05)] transition active:bg-[#fafafa]"
                  >
                    <div className="text-3xl">📦</div>
                    <div className="mt-2 text-lg font-black text-[#0a0a0a]">배송으로 받기</div>
                    <p className="mt-1 text-sm text-[#71717a]">출발 전 미리 집(또는 원하는 곳)에서 받아보세요.</p>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    onClick={() => { setReceiveMethod("pickup"); setStage("pickup"); }}
                    className="mt-4 w-full rounded-2xl border border-[#e7e7ea] bg-white p-5 text-left shadow-[0_8px_24px_rgba(20,30,50,0.05)] transition active:bg-[#fafafa]"
                  >
                    <div className="text-3xl">🛄</div>
                    <div className="mt-2 text-lg font-black text-[#0a0a0a]">공항에서 픽업</div>
                    <p className="mt-1 text-sm text-[#71717a]">짐을 줄이고 출국 당일 공항 보관함에서 바로 받으세요.</p>
                  </motion.button>
                </div>
              </motion.section>
            )}

            {/* [6-3A] 배송 신청 */}
            {stage === "delivery" && (
              <motion.section key="delivery" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto bg-white px-7 pb-8 pt-5">
                <div className="min-h-full">
                  <button onClick={() => setStage("receive")} className="text-sm font-semibold text-[#71717a]">← 뒤로</button>
                  <h2
                    className="mt-3 text-[26px] font-black tracking-[-0.02em] text-[#0a0a0a]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    배송 신청
                  </h2>

                  <Card>
                    <CardTitle>배송 시점</CardTitle>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center justify-between rounded-xl border border-[#e7e7ea] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-[#0a0a0a]">출국 전 배송</div>
                          <div className="text-xs text-[#71717a]">
                            {departDate ? `예상 도착 ${fmtISO(addDaysISO(departDate, -2))} (출발 2일 전)` : "출발일을 먼저 선택해 주세요"}
                          </div>
                        </div>
                        <input type="checkbox" checked={deliveryBefore} onChange={(e) => setDeliveryBefore(e.target.checked)} className="h-5 w-5 accent-[#0a0a0a]" />
                      </label>
                      <label className="flex items-center justify-between rounded-xl border border-[#e7e7ea] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-[#0a0a0a]">여행 후 케어 배송</div>
                          <div className="text-xs text-[#71717a]">
                            {arriveDate ? `예상 도착 ${fmtISO(addDaysISO(arriveDate, 3))} (귀국 후)` : "도착일을 먼저 선택해 주세요"}
                          </div>
                        </div>
                        <input type="checkbox" checked={deliveryAfter} onChange={(e) => setDeliveryAfter(e.target.checked)} className="h-5 w-5 accent-[#0a0a0a]" />
                      </label>
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>배송 정보</CardTitle>
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">받는 사람</label>
                    <input value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)} placeholder="이름" className="np-input" />
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">연락처</label>
                    <input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="010-0000-0000" inputMode="tel" className="np-input" />
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">배송지</label>
                    <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="주소를 입력하세요" className="np-input" />
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">요청사항 (선택)</label>
                    <input value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="예: 부재 시 경비실에 맡겨주세요" className="np-input" />
                  </Card>

                  <Card>
                    <CardTitle>주문 요약</CardTitle>
                    <div className="mt-2 space-y-1.5">
                      {cartLines.map(({ item, p, lineTotal }) => (
                        <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#3f3f46]">
                          <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                          <span className="font-semibold text-[#0a0a0a]">{lineTotal.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-dashed border-[#e7e7ea] pt-2 text-sm font-extrabold text-[#0a0a0a]">
                      <span>합계</span>
                      <span>{cartTotalPrice.toLocaleString()}원</span>
                    </div>
                  </Card>

                  <motion.button
                    disabled={!deliveryFormValid}
                    whileTap={deliveryFormValid ? { scale: 0.985 } : undefined}
                    onClick={() => openPayment("delivery")}
                    className="mt-6 w-full rounded-[14px] bg-[#0a0a0a] py-4 text-[15px] font-extrabold text-white transition disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
                  >
                    결제하기 · {cartTotalPrice.toLocaleString()}원
                  </motion.button>
                  <motion.button
                    disabled={!deliveryFormValid}
                    whileTap={deliveryFormValid ? { scale: 0.985 } : undefined}
                    onClick={submitDelivery}
                    className="mt-2.5 w-full rounded-[14px] bg-[#0a0a0a] py-4 text-[15px] font-extrabold text-white transition disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
                  >
                    주문 완료
                  </motion.button>
                </div>
              </motion.section>
            )}

            {/* [6-3B] 공항 픽업 신청 */}
            {stage === "pickup" && (
              <motion.section key="pickup" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto bg-white px-7 pb-8 pt-5">
                <div className="min-h-full">
                  <button onClick={() => setStage("receive")} className="text-sm font-semibold text-[#71717a]">← 뒤로</button>
                  <h2
                    className="mt-3 text-[26px] font-black tracking-[-0.02em] text-[#0a0a0a]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    공항 픽업 신청
                  </h2>

                  <Card>
                    <CardTitle>픽업 정보</CardTitle>
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">픽업 공항</label>
                    <select
                      value={pickupAirport ?? ""}
                      onChange={(e) => setPickupAirport(e.target.value || null)}
                      className="np-input"
                    >
                      <option value="">공항을 선택하세요</option>
                      {PICKUP_AIRPORTS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>

                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">픽업 날짜</label>
                    <DateField
                      label="픽업 날짜"
                      value={pickupDate}
                      min={todayISO()}
                      max={departDate ?? undefined}
                      onChange={setPickupDate}
                      tone="passport"
                    />
                    <p className="mt-1 text-xs text-[#71717a]">
                      출발일({departDate ? fmtISO(departDate) : "미정"}) 이후는 선택할 수 없어요 · 출발 당일 픽업을 권장해요.
                    </p>

                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">픽업 시간</label>
                    <select
                      value={pickupTime ?? ""}
                      onChange={(e) => setPickupTime(e.target.value || null)}
                      className="np-input"
                    >
                      <option value="">시간을 선택하세요</option>
                      {PICKUP_TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-[#71717a]">✈️ 출발 시각 최소 2시간 전 픽업을 권장해요.</p>
                  </Card>

                  <Card>
                    <CardTitle>신청자 정보</CardTitle>
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">이름</label>
                    <input value={name || "여행자"} disabled className="np-input opacity-60" />
                    <label className="mt-3 block text-sm font-extrabold text-[#0a0a0a]">연락처</label>
                    <input value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="010-0000-0000" inputMode="tel" className="np-input" />
                  </Card>

                  <Card>
                    <CardTitle>주문 요약</CardTitle>
                    <div className="mt-2 space-y-1.5">
                      {cartLines.map(({ item, p, lineTotal }) => (
                        <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#3f3f46]">
                          <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                          <span className="font-semibold text-[#0a0a0a]">{lineTotal.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-dashed border-[#e7e7ea] pt-2 text-sm font-extrabold text-[#0a0a0a]">
                      <span>합계</span>
                      <span>{cartTotalPrice.toLocaleString()}원</span>
                    </div>
                    {pickupAirport && pickupDate && pickupTime && (
                      <div className="mt-2 text-xs text-[#71717a]">픽업: {pickupAirport} · {fmtISO(pickupDate)} · {pickupTime}</div>
                    )}
                  </Card>

                  <motion.button
                    disabled={!pickupFormValid}
                    whileTap={pickupFormValid ? { scale: 0.985 } : undefined}
                    onClick={() => openPayment("pickup")}
                    className="mt-6 w-full rounded-[14px] bg-[#0a0a0a] py-4 text-[15px] font-extrabold text-white transition disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
                  >
                    결제하기 · {cartTotalPrice.toLocaleString()}원
                  </motion.button>
                  <motion.button
                    disabled={!pickupFormValid}
                    whileTap={pickupFormValid ? { scale: 0.985 } : undefined}
                    onClick={submitPickup}
                    className="mt-2.5 w-full rounded-[14px] bg-[#0a0a0a] py-4 text-[15px] font-extrabold text-white transition disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
                  >
                    예약 완료
                  </motion.button>
                </div>
              </motion.section>
            )}

            {/* [6-3C] 결제하기 */}
            {stage === "payment" && (
              <motion.section key="payment" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto bg-white px-7 pb-8 pt-5">
                <div className="min-h-full">
                  <button
                    onClick={() => setStage(pendingReceive === "pickup" ? "pickup" : "delivery")}
                    className="text-sm font-semibold text-[#71717a]"
                  >
                    ← 뒤로
                  </button>
                  <h2
                    className="mt-3 text-[26px] font-black tracking-[-0.02em] text-[#0a0a0a]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    결제하기
                  </h2>

                  <Card>
                    <CardTitle>주문 요약</CardTitle>
                    <div className="mt-2 space-y-1.5">
                      {cartLines.map(({ item, p, lineTotal }) => (
                        <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#3f3f46]">
                          <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                          <span className="font-semibold text-[#0a0a0a]">{lineTotal.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-dashed border-[#e7e7ea] pt-2 text-sm font-extrabold text-[#0a0a0a]">
                      <span>총 결제금액</span>
                      <span>{cartTotalPrice.toLocaleString()}원</span>
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>결제 수단</CardTitle>
                    <div className="mt-3 space-y-2">
                      {(
                        [
                          { id: "card", label: "신용·체크카드", icon: "💳" },
                          { id: "kakao", label: "카카오페이", icon: "🟡" },
                          { id: "naver", label: "네이버페이", icon: "🟢" },
                        ] as const
                      ).map((m) => (
                        <label
                          key={m.id}
                          className={`flex items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 transition ${
                            paymentMethod === m.id ? "border-[#0a0a0a] bg-[#fafafa]" : "border-[#e7e7ea]"
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            checked={paymentMethod === m.id}
                            onChange={() => setPaymentMethod(m.id)}
                            className="h-4 w-4 accent-[#0a0a0a]"
                          />
                          <span className="text-lg">{m.icon}</span>
                          <span className="text-sm font-bold text-[#0a0a0a]">{m.label}</span>
                        </label>
                      ))}
                    </div>

                    {paymentMethod === "card" && (
                      <div className="mt-4 space-y-3 border-t border-dashed border-[#e7e7ea] pt-4">
                        <label className="block text-sm font-extrabold text-[#0a0a0a]">카드 번호</label>
                        <input
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value.replace(/[^0-9]/g, "").slice(0, 16))}
                          placeholder="0000 0000 0000 0000"
                          inputMode="numeric"
                          className="np-input"
                        />
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-sm font-extrabold text-[#0a0a0a]">유효기간</label>
                            <input
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value.replace(/[^0-9/]/g, "").slice(0, 5))}
                              placeholder="MM/YY"
                              inputMode="numeric"
                              className="np-input"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-extrabold text-[#0a0a0a]">CVC</label>
                            <input
                              value={cardCvc}
                              onChange={(e) => setCardCvc(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                              placeholder="000"
                              inputMode="numeric"
                              className="np-input"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  <motion.button
                    disabled={!paymentValid || paying}
                    whileTap={paymentValid && !paying ? { scale: 0.985 } : undefined}
                    onClick={confirmPayment}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#0a0a0a] py-4 text-[15px] font-extrabold text-white transition disabled:bg-[#d4d4d8] disabled:text-[#fafafa]"
                  >
                    {paying ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        결제 처리 중…
                      </>
                    ) : (
                      `${cartTotalPrice.toLocaleString()}원 결제하기`
                    )}
                  </motion.button>
                  <p className="mt-3 text-center text-xs text-[#9ca3af]">※ 데모 결제입니다 · 실제 결제는 진행되지 않아요.</p>
                </div>
              </motion.section>
            )}

            {/* [6-4] 완료 화면 */}
            {stage === "done" && (
              <motion.section key="done" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto bg-white px-7 pb-8 pt-5">
                <div className="flex min-h-full flex-col items-center text-center">
                  <div className="mt-6 text-5xl">{receiveMethod === "pickup" ? "🛄" : "📦"}</div>
                  <h2
                    className="mt-4 text-2xl font-black tracking-[-0.02em] text-[#0a0a0a]"
                    style={{ fontFamily: "var(--font-inter), sans-serif" }}
                  >
                    {receiveMethod === "pickup" ? "예약이 완료되었습니다!" : "주문이 완료되었습니다!"}
                  </h2>
                  <div className="mt-1 text-sm text-[#71717a]">주문번호 {orderNo}</div>

                  <div className="mt-5 w-full text-left">
                    <Card>
                      <CardTitle>주문 요약</CardTitle>
                      <div className="mt-2 space-y-1.5">
                        {cartLines.map(({ item, p, lineTotal }) => (
                          <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#3f3f46]">
                            <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                            <span className="font-semibold text-[#0a0a0a]">{lineTotal.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between border-t border-dashed border-[#e7e7ea] pt-2 text-sm font-extrabold text-[#0a0a0a]">
                        <span>합계</span>
                        <span>{cartTotalPrice.toLocaleString()}원</span>
                      </div>
                      <div className="mt-2 text-xs text-[#71717a]">✈️ 전 제품 100ml 이하 · 기내 반입 가능</div>
                    </Card>

                    {receiveMethod === "delivery" ? (
                      <Card>
                        <CardTitle>📦 배송 안내</CardTitle>
                        <p className="mt-2 text-sm leading-relaxed text-[#3f3f46]">여행 일정에 맞춰 소용량 키트를 준비해 배송합니다.</p>
                        <div className="mt-2 space-y-1 text-xs text-[#71717a]">
                          {deliveryBefore && departDate && <div>· 출국 전 배송 — 예상 도착 {fmtISO(addDaysISO(departDate, -2))}</div>}
                          {deliveryAfter && arriveDate && <div>· 여행 후 케어 배송 — 예상 도착 {fmtISO(addDaysISO(arriveDate, 3))}</div>}
                        </div>
                      </Card>
                    ) : (
                      <Card>
                        <CardTitle>🛄 픽업 안내</CardTitle>
                        <div className="mt-2 text-sm text-[#3f3f46]">
                          {pickupAirport} · {pickupDate ? fmtISO(pickupDate) : ""} · {pickupTime}
                        </div>
                        <div className="mt-3 rounded-xl bg-[#f4f4f5] p-4 text-center">
                          <div className="text-xs text-[#71717a]">{pickupAirport} 보관함</div>
                          <div className="text-4xl font-black tracking-[0.04em] text-[#ec1c24]">{lockerNo}</div>
                          <div className="text-xs text-[#71717a]">번 보관함에서 찾아가세요</div>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-xs text-[#71717a]">
                          <li>· 예약 시간 이후 수령 가능해요.</li>
                          <li>· 픽업 시 주문번호·연락처를 확인해 주세요.</li>
                          <li>· 출발 2시간 전, 여유 있게 방문해 주세요.</li>
                        </ul>
                      </Card>
                    )}
                  </div>

                  <button
                    onClick={restart}
                    className="mt-8 w-full rounded-[14px] border-[1.5px] border-[#e7e7ea] bg-white px-6 py-4 text-[15px] font-extrabold text-[#0a0a0a] transition active:bg-[#f4f4f5]"
                  >
                    처음으로 ↺
                  </button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* [6-2] 플로팅 장바구니 + 시트 */}
          <AnimatePresence>
            {stage === "result" && resultView !== "plan" && cartCount > 0 && !cartOpen && (
              <motion.button
                key="cart-fab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={() => setCartOpen(true)}
                className="absolute bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#0a0a0a] px-5 py-3.5 font-extrabold text-white shadow-[0_16px_36px_rgba(10,10,10,0.28)]"
              >
                🧳 <span className="text-sm">{cartCount}</span>
              </motion.button>
            )}
            {cartOpen && (
              <CartSheet
                key="cart-sheet"
                lines={cartLines}
                totalQty={cartCount}
                totalMl={cartTotalMl}
                totalPrice={cartTotalPrice}
                allUnder100={cartAllUnder100}
                onInc={addSample}
                onDec={decSample}
                onRemove={removeSample}
                onClose={() => setCartOpen(false)}
                onCheckout={goCheckout}
              />
            )}
          </AnimatePresence>

          {/* 여행지 대표 메이크업 스타일노트 */}
          <AnimatePresence>
            {makeupOpen && (
              <StyleNoteModal key="style-note" countryCode={countryCode} onClose={() => setMakeupOpen(false)} />
            )}
          </AnimatePresence>

          {/* [5-detail] 제품 상세 바텀시트 */}
          <AnimatePresence>
            {detailId && result && (
              <ProductDetail
                key={detailId}
                product={COSMETICS.find((c) => c.id === detailId)!}
                days={result.days}
                dryHigh={result.profile.humidity <= 45}
                uvHigh={result.profile.uv >= 8}
                reason={result.recItems.find((it) => it.p.id === detailId)?.reason ?? ""}
                destinationCountry={countryCode}
                cartQty={cartQty}
                onAdd={addSample}
                onDec={decSample}
                onClose={() => setDetailId(null)}
              />
            )}
          </AnimatePresence>

          {/* AI 판단 상세 모달 */}
          <AnimatePresence>
            {showAiDetail && skin && result && (
              <AiDetailModal key="ai-detail" skin={skin} result={result} onClose={() => setShowAiDetail(false)} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ 결과 보조 ════════════════════════ */

function StepBadge({ step, total, label }: { step: number; total: number; label: string }) {
  return <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-[#2b6b86] backdrop-blur">STEP {step}/{total} · {label}</div>;
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="mt-3.5 rounded-2xl border border-[#e7e7ea] bg-white p-[18px] shadow-[0_8px_24px_rgba(20,30,50,0.05)]">{children}</div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="flex items-center gap-2 text-[15px] font-extrabold tracking-[-0.01em] text-[#0a0a0a]">{children}</h3>;
}
function hashHue(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

// 카테고리별 화장품 용기 일러스트 (저작권 안전한 자체 제작 SVG)
function CosmeticArt({ product, showName = false }: { product: Cosmetic; showName?: boolean }) {
  const hue = hashHue(product.brand);
  const body = `hsl(${hue} 60% 62%)`;
  const bodyLt = `hsl(${hue} 65% 74%)`;
  const cap = `hsl(${hue} 45% 42%)`;
  const bg1 = `hsl(${hue} 60% 93%)`;
  const bg2 = `hsl(${hue} 55% 84%)`;
  const cat = product.category;
  const gid = `g-${product.id}`;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bodyLt} />
          <stop offset="1" stopColor={body} />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="16" fill={bg1} />
      <rect x="0" y="52" width="100" height="48" rx="16" fill={bg2} opacity="0.5" />
      {cat === "크림" ? (
        <>
          <rect x="26" y="24" width="48" height="14" rx="6" fill={cap} />
          <rect x="23" y="37" width="54" height="46" rx="12" fill={`url(#${gid})`} />
          <rect x="31" y="54" width="38" height="18" rx="5" fill="#fff" opacity="0.9" />
        </>
      ) : cat === "클렌징" || cat === "선크림" ? (
        <>
          <rect x="41" y="12" width="18" height="12" rx="3" fill={cap} />
          <path d="M34 26 h32 v54 a10 10 0 0 1 -10 10 h-12 a10 10 0 0 1 -10 -10 Z" fill={`url(#${gid})`} />
          <rect x="37" y="46" width="26" height="20" rx="5" fill="#fff" opacity="0.9" />
        </>
      ) : (
        <>
          <rect x="40" y="10" width="20" height="12" rx="3" fill={cap} />
          <rect x="44" y="20" width="12" height="6" fill={cap} opacity="0.8" />
          <rect x="30" y="26" width="40" height="60" rx="11" fill={`url(#${gid})`} />
          <rect x="35" y="48" width="30" height="20" rx="5" fill="#fff" opacity="0.9" />
        </>
      )}
      <text x="50" y={cat === "크림" ? 65 : 58} textAnchor="middle" fontSize="7" fontWeight="700" fill={cap}>
        {product.brand}
      </text>
      {showName && (
        <text x="50" y={cat === "크림" ? 74 : 66} textAnchor="middle" fontSize="4.5" fill={`hsl(${hue} 30% 40%)`}>
          {product.category}
        </text>
      )}
    </svg>
  );
}

// 실제 제품 이미지 (image URL) / 로드 실패 시 브랜드 컬러 플레이스홀더로 폴백
function ProductImage({ product }: { product: Cosmetic }) {
  const [err, setErr] = useState(false);
  if (!product.image || err) {
    return (
      <div className="h-16 w-16 flex-none overflow-hidden rounded-2xl">
        <CosmeticArt product={product} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={product.image}
      alt={product.name}
      onError={() => setErr(true)}
      className="h-16 w-16 flex-none rounded-2xl object-cover"
    />
  );
}

function SubindexBar({ label, value }: { label: string; value: number }) {
  const high = value >= 70;
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px]">
        <span className="text-[#3f3f46]">{label}</span>
        <span className={`font-bold ${high ? "text-[#ec1c24]" : "text-[#0a0a0a]"}`}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#f4f4f5]">
        <motion.div
          className={`h-full rounded-full ${high ? "bg-[#ec1c24]" : "bg-[#0a0a0a]"}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: 0.3, duration: 0.9, ease: EASE }}
        />
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-[#2b6b86]">{children}</label>;
}

// AI 판단 상세 모달 — 상세보기 버튼에서 열리는 바텀시트
function AiDetailModal({
  skin,
  result,
  onClose,
}: {
  skin: SkinResult;
  result: {
    profile: { temp: number; humidity: number; uv: number; dust: number; tag?: string };
    calendar: { date: string; weekday: string; temp: number; humidity: number; dust: number; emojis: { icon: string; label: string }[] }[];
  };
  onClose: () => void;
}) {
  const bt = BAUMANN_TYPES[skin.code];
  const care = baumannCare(skin.code);
  return (
    <>
      <motion.div className="absolute inset-0 z-[70] bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-[71] max-h-[92%] overflow-y-auto rounded-t-[28px] bg-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-[#e7e7ea] bg-white/95 px-5 py-3 backdrop-blur">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Detail · 상세 리포트</div>
            <div className="mt-0.5 text-lg font-black text-[#0a0a0a]">{skin.code} · {bt?.nick ?? skin.code}</div>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#f4f4f5] text-base text-[#0a0a0a]">×</button>
        </div>

        <div className="px-5 pb-8 pt-4">
          {/* AI 판단 상세 */}
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">AI Reasoning · AI 판단 상세</div>
          {care.paras.map((para, i) => (
            <p key={i} className="mt-2.5 text-[13px] leading-relaxed text-[#444]">{para}</p>
          ))}

          {/* 날짜별 날씨 */}
          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Weather Detail · 날짜별 날씨</div>
          <table className="mt-3 w-full border-collapse text-xs">
            <thead>
              <tr className="text-left text-[10px] font-bold text-[#71717a]">
                <th className="border-b border-[#e7e7ea] pb-1.5 pr-2">날짜</th>
                <th className="border-b border-[#e7e7ea] pb-1.5 pr-2">날씨</th>
                <th className="border-b border-[#e7e7ea] pb-1.5 pr-2">기온</th>
                <th className="border-b border-[#e7e7ea] pb-1.5 pr-2">습도</th>
                <th className="border-b border-[#e7e7ea] pb-1.5">미세먼지</th>
              </tr>
            </thead>
            <tbody>
              {result.calendar.map((c, k) => (
                <tr key={k} className="text-[#3f3f46]">
                  <td className="border-b border-[#e7e7ea] py-1.5 pr-2">{c.date} {c.weekday}</td>
                  <td className="border-b border-[#e7e7ea] py-1.5 pr-2">{c.emojis.map((e) => e.icon).join("")}</td>
                  <td className="border-b border-[#e7e7ea] py-1.5 pr-2">{c.temp}℃</td>
                  <td className="border-b border-[#e7e7ea] py-1.5 pr-2">{c.humidity}%</td>
                  <td className="border-b border-[#e7e7ea] py-1.5">{c.dust}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* 바우만 4축 */}
          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Baumann Axis · 피부 타입 4축</div>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {BAUMANN_AXES.map((ax, i) => {
              const opt = skin.code[i] === ax.a.letter ? ax.a : ax.b;
              return (
                <div key={ax.key} className="rounded-xl border border-[#e7e7ea] bg-white p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{opt.icon}</span>
                    <span className="text-sm font-extrabold text-[#0a0a0a]">{opt.ko}</span>
                  </div>
                  <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">{opt.en}</div>
                  <div className="mt-1.5 text-[11px] leading-snug text-[#71717a]">{opt.desc}</div>
                </div>
              );
            })}
          </div>

          {/* 성분 가이드 */}
          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Ingredients · 성분 가이드</div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-extrabold text-[#0a0a0a]">👍 추천 성분</div>
              <ul className="mt-2 space-y-1.5 text-[12px] text-[#3f3f46]">
                {care.good.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#ec1c24]">⚠️ 주의 성분</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {care.avoid.length ? (
                  care.avoid.map((g) => (
                    <span key={g} className="rounded-full border border-[#ec1c24] bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#ec1c24]">{g}</span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#9ca3af]">특별히 피할 성분은 없어요</span>
                )}
              </div>
            </div>
          </div>

          {/* 데일리 루틴 */}
          <div className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-[#9ca3af]">Daily Routine · 데일리 루틴</div>
          <div className="mt-3 space-y-2.5">
            <div className="rounded-xl border border-[#e7e7ea] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-extrabold text-[#0a0a0a]">
                <span className="h-2 w-2 rounded-full bg-[#0a0a0a]" /> 아침 (AM)
              </div>
              <p className="text-[12px] leading-relaxed text-[#3f3f46]">
                저자극 클렌징 → <b className="text-[#ec1c24]">{care.good[0] ?? "수분 세럼"}</b> → 수분크림 → SPF50+ 재도포
              </p>
            </div>
            <div className="rounded-xl border border-[#e7e7ea] p-3.5">
              <div className="mb-1.5 flex items-center gap-2 text-xs font-extrabold text-[#0a0a0a]">
                <span className="h-2 w-2 rounded-full bg-[#0a0a0a]" /> 저녁 (PM)
              </div>
              <p className="text-[12px] leading-relaxed text-[#3f3f46]">
                이중 세정 → <b className="text-[#ec1c24]">{care.good[1] ?? care.good[0] ?? "진정 토너"}</b> → {care.good[2] ?? "수분 세럼"} → 세라마이드 크림
              </p>
            </div>
          </div>

          <button onClick={onClose} className="mt-6 w-full rounded-[14px] bg-[#0a0a0a] px-4 py-3.5 text-base font-extrabold text-white transition">닫기</button>
        </div>
      </motion.div>
    </>
  );
}

// [5-detail] 제품 상세 바텀시트
function ProductDetail({
  product,
  days,
  dryHigh,
  uvHigh,
  reason,
  destinationCountry,
  cartQty,
  onAdd,
  onDec,
  onClose,
}: {
  product: Cosmetic;
  days: number;
  dryHigh: boolean;
  uvHigh: boolean;
  reason: string;
  destinationCountry: string | null;
  cartQty: (id: string, ml: number) => number;
  onAdd: (id: string, ml: number) => void;
  onDec: (id: string, ml: number) => void;
  onClose: () => void;
}) {
  const rec = recommendVolume(product.category, days, dryHigh, uvHigh);
  const [ml, setMl] = useState(rec.ml);
  const price = samplePrice(product.price, product.fullMl, ml);
  const qty = cartQty(product.id, ml);
  const nights = Math.max(0, days - 1);

  return (
    <>
      <motion.div className="absolute inset-0 z-[70] bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-[71] max-h-[92%] overflow-y-auto rounded-t-[28px] bg-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        {/* 상단 바 */}
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#e7e7ea] bg-white/95 px-5 py-3 backdrop-blur">
          <button onClick={onClose} className="text-sm font-semibold text-[#71717a]">← 목록으로</button>
          <div className="mx-auto h-1 w-10 rounded-full bg-[#e7e7ea]" />
        </div>

        <div className="px-5 pb-8 pt-4">
          {/* 큰 이미지 */}
          <div className="mx-auto w-full max-w-[220px]">
            <ProductImageLarge product={product} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-[0.05em] text-[#9ca3af]">{product.brand}</span>
            <span className="ml-auto text-sm font-bold text-[#ec1c24]">★ {product.rating.toFixed(2)}</span>
          </div>
          <h2 className="mt-0.5 text-xl font-black tracking-[-0.01em] text-[#0a0a0a]">{product.name}</h2>
          <div className="mt-1 text-sm text-[#71717a]">
            정품 {product.fullMl}ml · 정가 {product.price.toLocaleString()}원
          </div>

          {/* 안전 배지 */}
          {product.safety.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.safety.map((s) => (
                <span key={s} className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-semibold text-[#0a0a0a]">✓ {s}</span>
              ))}
            </div>
          )}

          {/* 성분 기반 반입 주의 플래그 (여행지 규정) */}
          <ComplianceBadge cosmeticId={product.id} destinationCountry={destinationCountry} />

          {/* 성분 · 적합/고민 태그 */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.ingredients.map((ing) => (
              <span key={ing} className="rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[11px] text-[#3f3f46]">#{ing}</span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.forTypes.map((t) => (
              <span key={t} className="rounded-full border border-[#e7e7ea] px-2.5 py-1 text-[11px] text-[#52525b]">{t}</span>
            ))}
            {product.concerns.map((c) => (
              <span key={c} className="rounded-full border border-[#ec1c24] bg-white px-2.5 py-1 text-[11px] text-[#ec1c24]">{c}</span>
            ))}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#52525b]">{product.desc}</p>

          {/* 이 여행에 왜 맞는지 */}
          {reason && (
            <div className="mt-3 rounded-xl bg-[#f4f4f5] px-4 py-3 text-[13px] leading-relaxed text-[#3f3f46]">
              💡 이 여행에 딱 맞아요 — {reason}
            </div>
          )}

          {/* 소용량 선택 */}
          <div className="mt-5 rounded-2xl border border-[#e7e7ea] bg-[#fafafa] p-4">
            <div className="text-sm font-extrabold text-[#0a0a0a]">소용량 선택 (기내 반입 가능 ✈️)</div>
            <select
              value={ml}
              onChange={(e) => setMl(Number(e.target.value))}
              className="mt-2 w-full appearance-none rounded-xl border border-[#e7e7ea] bg-white px-4 py-3 text-[15px] text-[#0a0a0a] outline-none focus:border-[#0a0a0a]"
            >
              {SAMPLE_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}ml · 기내 반입 가능 ✈️{t === rec.ml ? " (추천)" : ""}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[#71717a]">
                {nights}박 {days}일에 딱 맞는 <b className="text-[#0a0a0a]">{rec.ml}ml</b>
                {rec.qty > 1 && <> (×{rec.qty})</>}
              </span>
              <span className="text-xl font-black text-[#0a0a0a]">{price.toLocaleString()}원</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.open(product.oliveYoungUrl, "_blank", "noopener")}
              className="w-full rounded-[14px] border-[1.5px] border-[#e7e7ea] py-3.5 text-base font-extrabold text-[#0a0a0a] transition hover:bg-[#f4f4f5]"
            >
              본품 구매하기 (올리브영){product.linkType === "search" && <span className="ml-1 text-xs font-normal text-[#9ca3af]">· 검색</span>}
            </button>
            {qty === 0 ? (
              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={() => onAdd(product.id, ml)}
                className="w-full rounded-[14px] bg-[#0a0a0a] py-3.5 text-base font-extrabold text-white transition"
              >
                샘플 담기 · {price.toLocaleString()}원
              </motion.button>
            ) : (
              <div className="flex items-center justify-between rounded-[14px] bg-[#f4f4f5] px-4 py-2.5">
                <span className="text-sm font-semibold text-[#0a0a0a]">샘플 {ml}ml 담김</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => onDec(product.id, ml)} className="text-xl text-[#0a0a0a]">−</button>
                  <span className="w-5 text-center font-bold text-[#0a0a0a]">{qty}</span>
                  <button onClick={() => onAdd(product.id, ml)} className="text-xl text-[#0a0a0a]">＋</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

// [6-2] 장바구니 바텀시트
function CartSheet({
  lines,
  totalQty,
  totalMl,
  totalPrice,
  allUnder100,
  onInc,
  onDec,
  onRemove,
  onClose,
  onCheckout,
}: {
  lines: CartLine[];
  totalQty: number;
  totalMl: number;
  totalPrice: number;
  allUnder100: boolean;
  onInc: (id: string, ml: number) => void;
  onDec: (id: string, ml: number) => void;
  onRemove: (id: string, ml: number) => void;
  onClose: () => void;
  onCheckout: () => void;
}) {
  return (
    <>
      <motion.div className="absolute inset-0 z-[70] bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-[71] max-h-[85%] overflow-y-auto rounded-t-[28px] bg-white"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#e7e7ea] bg-white/95 px-5 py-3 backdrop-blur">
          <span className="text-lg font-black text-[#0a0a0a]">🧳 여행 샘플 장바구니</span>
          <button onClick={onClose} className="ml-auto text-sm font-semibold text-[#71717a]">닫기</button>
        </div>

        <div className="px-5 pb-8 pt-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9ca3af]">장바구니가 비어있어요.</p>
          ) : (
            <div className="space-y-3">
              {lines.map(({ item, p, lineTotal }) => (
                <div key={`${item.id}-${item.ml}`} className="flex items-center gap-3 rounded-2xl border border-[#e7e7ea] p-3">
                  <ProductImage product={p} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#9ca3af]">{p.brand}</div>
                    <div className="truncate text-sm font-extrabold text-[#0a0a0a]">{p.name}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-full bg-[#f4f4f5] px-2 py-0.5 text-[10px] font-semibold text-[#3f3f46]">{item.ml}ml</span>
                      <span className="rounded-full bg-[#f4f4f5] px-2 py-0.5 text-[10px] font-semibold text-[#3f3f46]">기내 반입 ✈️</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 rounded-full bg-[#f4f4f5] px-2 py-1">
                      <button onClick={() => onDec(item.id, item.ml)} className="text-sm font-bold text-[#0a0a0a]">−</button>
                      <span className="w-4 text-center text-xs font-bold text-[#0a0a0a]">{item.qty}</span>
                      <button onClick={() => onInc(item.id, item.ml)} className="text-sm font-bold text-[#0a0a0a]">＋</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#0a0a0a]">{lineTotal.toLocaleString()}원</span>
                      <button onClick={() => onRemove(item.id, item.ml)} className="text-xs text-[#9ca3af] underline">삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lines.length > 0 && (
            <>
              <div className="mt-4 space-y-1 rounded-2xl bg-[#f4f4f5] p-4 text-sm">
                <div className="flex justify-between text-[#71717a]"><span>총 제품 수</span><span className="font-semibold text-[#0a0a0a]">{totalQty}개</span></div>
                <div className="flex justify-between text-[#71717a]"><span>총 용량</span><span className="font-semibold text-[#0a0a0a]">{totalMl}ml</span></div>
                <div className="flex justify-between border-t border-dashed border-[#e7e7ea] pt-1.5 font-extrabold text-[#0a0a0a]"><span>총 금액</span><span>{totalPrice.toLocaleString()}원</span></div>
              </div>

              <div className={`mt-3 rounded-xl px-4 py-3 text-[12px] leading-relaxed ${allUnder100 ? "bg-[#f4f4f5] text-[#3f3f46]" : "border border-[#ec1c24] bg-white text-[#ec1c24]"}`}>
                ✈️ {allUnder100 ? "전 제품 개별 100ml 이하 — 기내 반입 가능해요." : "일부 제품이 100ml를 초과해요 — 위탁수하물로 부쳐야 해요."}
                <br />
                <span className="text-[11px] opacity-80">기내 액체 규정: 개별 100ml 이하 · 총합 1L 이하 · 투명 지퍼백 권장</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.985 }}
                onClick={onCheckout}
                className="mt-4 w-full rounded-[14px] bg-[#0a0a0a] py-3.5 text-base font-extrabold text-white transition"
              >
                신청하기 →
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

function ProductImageLarge({ product }: { product: Cosmetic }) {
  const [err, setErr] = useState(false);
  if (!product.image || err) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-3xl">
        <CosmeticArt product={product} showName />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={product.image} alt={product.name} onError={() => setErr(true)} className="aspect-square w-full rounded-3xl object-cover" />
  );
}

function StubField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-[0.12em] text-[#9aa6bf]">{label}</div>
      <div className="mt-0.5 text-2xl font-black text-[#0a0a0a]">{value}</div>
    </div>
  );
}

// CSS 바코드 (고정 패턴)
function Barcode() {
  const widths = [6, 2, 4, 2, 2, 6, 2, 4, 4, 2, 2, 4, 6, 2, 2, 4, 2, 6, 4, 2, 4, 2, 2, 6, 2, 4, 2, 4, 6, 2, 2, 4, 4, 2, 6, 2, 2, 4, 2, 4];
  return (
    <div className="mt-5 flex h-14 items-stretch justify-center bg-white">
      {widths.map((w, i) => (
        <div key={i} style={{ width: w, background: i % 2 === 0 ? "#22315a" : "transparent" }} />
      ))}
    </div>
  );
}

/* ════════════════════════ 날짜 선택 ════════════════════════ */

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function fmtISO(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${y}.${m}.${d}`;
}
function diffDays(a: string, b: string) {
  const n = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(60, n));
}
function daysUntil(iso: string) {
  return Math.round((new Date(iso).getTime() - new Date(todayISO()).getTime()) / 86400000);
}
function addDaysISO(iso: string, delta: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + delta);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function DateField({
  label,
  value,
  min,
  max,
  disabled,
  onChange,
  tone = "sky",
}: {
  label: string;
  value: string | null;
  min: string;
  max?: string;
  disabled?: boolean;
  onChange: (d: string) => void;
  tone?: "sky" | "passport";
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const passport = tone === "passport";
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full rounded-[13px] border px-4 py-3 text-left transition ${
          passport
            ? disabled
              ? "border-[#e7e7ea] bg-[#f4f4f5] text-[#9ca3af]"
              : "border-transparent bg-[#f4f4f5] text-[#0a0a0a]"
            : disabled
              ? "rounded-2xl border-white/50 bg-white/40 text-[#9cb6c2]"
              : "rounded-2xl border-white bg-white/80 text-[#2b4b58]"
        }`}
      >
        <span className={`block text-[10px] tracking-widest ${passport ? "text-[#9ca3af]" : "text-[#7aa7ba]"}`}>{label}</span>
        <span className="font-sans text-sm font-semibold">{value ? fmtISO(value) : "날짜 선택"}</span>
      </button>
      {/* 모달은 document.body로 포털해 상위 backdrop-filter/perspective 스태킹 컨텍스트를 벗어나게 한다.
          (그렇지 않으면 하단 '다음' 버튼이 캘린더 위로 그려져 마지막 주 날짜 클릭이 막힘) */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && !disabled && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="relative w-[288px] rounded-3xl border border-white/70 bg-white p-4 shadow-[0_30px_70px_rgba(43,120,170,0.4)]"
                >
                  <div className={`mb-2 text-center ${passport ? "font-sans text-[15px] font-extrabold text-[#0a0a0a]" : "font-sans text-[15px] font-extrabold text-[#0a0a0a]"}`}>{label} 선택</div>
                  <CalendarPopup value={value} min={min} max={max} tone={tone} onPick={(d) => { onChange(d); setOpen(false); }} />
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

function CalendarPopup({
  value,
  min,
  max,
  onPick,
  tone = "sky",
}: {
  value: string | null;
  min: string;
  max?: string;
  onPick: (d: string) => void;
  tone?: "sky" | "passport";
}) {
  const passport = tone === "passport";
  const base = value ? new Date(value) : new Date(min);
  const [ym, setYm] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const startDow = new Date(ym.y, ym.m, 1).getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const prev = () => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }));
  const next = () => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }));
  return (
    <div>
      <div className="flex items-center justify-between px-1">
        <button onClick={prev} className={`px-2 text-xl ${passport ? "text-[#9ca3af]" : "text-[#7aa7ba]"}`}>‹</button>
        <div className={`font-semibold ${passport ? "font-sans text-[#0a0a0a]" : "text-[#2b4b58]"}`}>{ym.y}. {pad(ym.m + 1)}</div>
        <button onClick={next} className={`px-2 text-xl ${passport ? "text-[#9ca3af]" : "text-[#7aa7ba]"}`}>›</button>
      </div>
      <div className={`mt-2 grid grid-cols-7 text-center text-[10px] ${passport ? "font-sans text-[#9ca3af]" : "text-[#9cb6c2]"}`}>
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
          const disabled = iso < min || (!!max && iso > max);
          const selected = value === iso;
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onPick(iso)}
              className={`h-8 rounded-lg font-sans text-sm transition ${
                selected
                  ? passport
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-gradient-to-br from-[#ff9f7a] to-[#ff7fa8] text-white"
                  : disabled
                    ? passport
                      ? "text-[#e7e7ea]"
                      : "text-[#d3e0e8]"
                    : passport
                      ? "text-[#0a0a0a] hover:bg-[#f4f4f5]"
                      : "text-[#2b4b58] hover:bg-[#eef6fb]"
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
