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
import { MAKEUP_STYLE_NOTES } from "@/lib/makeup-style-notes";
import { StyleNoteModal } from "@/components/style-note";

type Stage = "intro" | "login" | "travel" | "skin" | "result" | "receive" | "delivery" | "pickup" | "done";
const EASE = [0.22, 1, 0.36, 1] as const;

/* ════════════════════════ [6-1] 여정 타임라인 ════════════════════════ */
const CHECKLIST_ITEMS = [
  "여권/신분증 확인",
  "소용량 스킨케어 키트 도착 확인",
  "기내 반입 규정(100ml 이하) 확인",
  "충전기·여행자보험 등 준비물 점검",
];
// 귀국 후 진정·장벽 회복 루틴 추천 (판테놀 진정 세럼 + 세라마이드 배리어 크림)
const RECOVERY_IDS = ["layerlab-panthenol", "estra-atobarrier"];

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
      whileHover={disabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      className="w-full rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] px-6 py-4 font-cute text-lg text-white shadow-[0_14px_30px_rgba(255,127,168,0.42)] disabled:opacity-50"
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

// Baumann 축 선택 카드 (A vs B) — 큰 알파벳 배지 + 한글/영문/설명
function AxisChoice({ option, active, onClick }: { option: AxisOption; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
      onClick={onClick}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
        active
          ? "border-transparent bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] text-white shadow-[0_12px_26px_rgba(255,127,168,0.4)]"
          : "border-white/70 bg-white/80 text-[#2b4b58] backdrop-blur hover:bg-white/90"
      }`}
    >
      <span className="font-cute text-xl">
        {option.ko} <span className={`text-xs ${active ? "text-white/80" : "text-[#9cb6c2]"}`}>{option.en}</span>
      </span>
      <span className={`mt-0.5 block whitespace-nowrap text-[12px] leading-snug ${active ? "text-white/90" : "text-[#6f909d]"}`}>
        {option.desc}
      </span>
    </motion.button>
  );
}

/* ════════════════════════ 피부 설문 (Baumann 16-타입) ════════════════════════ */
// Leslie Baumann, 'The Skin Type Solution' — 4개 축의 조합으로 피부를 16가지로 분류한다.
//   1) 건성(D) ↔ 지성(O)   2) 민감(S) ↔ 저항(R)   3) 색소(P) ↔ 무색소(N)   4) 주름(W) ↔ 탱탱(T)
// 각 축을 한 문항씩, 총 4문항으로 물어 MBTI처럼 4글자 코드(예: DSNW)로 타입을 도출한다.
type AxisOption = { letter: string; ko: string; en: string; desc: string };
const BAUMANN_AXES: { key: string; icon: string; q: string; hint: string; a: AxisOption; b: AxisOption }[] = [
  {
    key: "hydration",
    icon: "💧",
    q: "세안 후, 아무것도 안 바르면?",
    hint: "유·수분 밸런스를 가르는 축이에요",
    a: { letter: "D", ko: "건조", en: "Dry", desc: "당기고 각질·가려움이 잘 생겨요" },
    b: { letter: "O", ko: "지성", en: "Oily", desc: "번들거리고 피지·모공이 신경 쓰여요" },
  },
  {
    key: "sensitivity",
    icon: "🌡️",
    q: "새 제품이나 환경 변화에?",
    hint: "장벽이 자극에 반응하는 정도예요",
    a: { letter: "S", ko: "민감", en: "Sensitive", desc: "붉어짐·따가움·트러블이 쉽게 올라와요" },
    b: { letter: "R", ko: "저항", en: "Resistant", desc: "웬만해선 자극 없이 튼튼한 편이에요" },
  },
  {
    key: "pigment",
    icon: "🎨",
    q: "잡티·기미 같은 색소는?",
    hint: "햇볕 노출 뒤 흔적이 남는 정도예요",
    a: { letter: "P", ko: "색소", en: "Pigmented", desc: "기미·잡티·자국이 잘 생기고 오래가요" },
    b: { letter: "N", ko: "무색소", en: "Non-pigmented", desc: "색소 침착이 적고 톤이 균일해요" },
  },
  {
    key: "wrinkle",
    icon: "⏳",
    q: "주름·탄력은 어떤가요?",
    hint: "광노화·주름 경향을 가르는 축이에요",
    a: { letter: "W", ko: "주름", en: "Wrinkle-prone", desc: "잔주름·탄력 저하가 보이거나 걱정돼요" },
    b: { letter: "T", ko: "탱탱", en: "Tight", desc: "아직 주름 걱정은 적고 탄탄해요" },
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

/* ════════════════════════ 메인 ════════════════════════ */

export default function BeautyPassportExperience() {
  const [stage, setStage] = useState<Stage>("intro");

  // 로그인
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
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
  const [deliveryRequested, setDeliveryRequested] = useState(false);
  // [6-2] 장바구니 시트
  const [cartOpen, setCartOpen] = useState(false);
  // 여행지 대표 메이크업 스타일노트
  const [makeupOpen, setMakeupOpen] = useState(false);
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
  // [6-4] 완료
  const [orderNo, setOrderNo] = useState<string | null>(null);
  const [lockerNo, setLockerNo] = useState<string | null>(null);

  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (stage !== "intro") return;
    timer.current = window.setTimeout(() => setStage("login"), 5300);
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
  const makeupNote = MAKEUP_STYLE_NOTES.find((n) => n.countryCode === countryCode) ?? null;

  const loginDone = name.trim() !== "" && age.trim() !== "" && gender !== "";
  const placeDone = useCustom ? customCountry.trim() !== "" && customCity.trim() !== "" : !!city;
  const travelDone = placeDone && !!departDate && !!arriveDate;

  function skipIntro() {
    if (timer.current) clearTimeout(timer.current);
    setStage("login");
  }
  function chooseAxis(letter: string) {
    const next = axes.map((a, i) => (i === qIndex ? letter : a));
    setAxes(next);
    if (qIndex < BAUMANN_AXES.length - 1) {
      setQIndex((i) => i + 1); // 다음 축으로 자동 슬라이드
    } else {
      // 마지막 축까지 선택 → 4글자 코드 완성 후 분석
      setSkin(analyzeBaumann(next.join("")));
      setAnalyzing(true);
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
  function restart() {
    setName(""); setAge(""); setGender("");
    setCountryCode(null); setCityName(null);
    setUseCustom(false); setCustomCountry(""); setCustomCity("");
    setDepartDate(null); setArriveDate(null);
    setQIndex(0); setAxes(Array(BAUMANN_AXES.length).fill(null));
    setAnalyzing(false); setSkin(null);
    setWeather(null); setDetailId(null); setCart([]); setVolumeSel({});
    setChecklist(Array(CHECKLIST_ITEMS.length).fill(false)); setDeliveryRequested(false);
    setCartOpen(false); setReceiveMethod(null);
    setDeliveryBefore(true); setDeliveryAfter(false);
    setDeliveryName(""); setDeliveryPhone(""); setDeliveryAddress(""); setDeliveryNote("");
    setPickupAirport(null); setPickupDate(null); setPickupTime(null); setPickupPhone("");
    setOrderNo(null); setLockerNo(null);
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
                className="absolute inset-0 overflow-y-auto"
                style={{ background: "linear-gradient(180deg,#3a4d7a 0%,#2b3a63 45%,#22315a 100%)" }}
              >
                <div className="relative flex min-h-full flex-col items-center px-6 py-10">
                  {/* 헤더: 비행기 + 타이틀 */}
                  <motion.div
                    className="w-40"
                    animate={{ y: [0, -10, 0], rotate: [-4, -2, -4] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ filter: "drop-shadow(0 22px 26px rgba(0,0,0,0.35))" }}
                  >
                    <Jet className="w-full" />
                  </motion.div>
                  <h1 className="mt-5 font-cute text-3xl text-white">나만의 뷰티 여권</h1>
                  <p className="mt-1 text-sm text-white/70">여권을 만들고 여름 여행을 시작해요</p>

                  {/* 보딩패스 카드 */}
                  <div className="relative mt-7 w-full overflow-hidden rounded-[26px] bg-white shadow-[0_30px_70px_rgba(0,0,0,0.35)]">
                    {/* 폼 영역 */}
                    <div className="p-6">
                      <label className="block text-sm font-bold text-[#22315a]">이름</label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="여권에 새길 이름"
                        className="np-input"
                      />
                      <label className="mt-4 block text-sm font-bold text-[#22315a]">나이</label>
                      <input
                        value={age}
                        onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                        inputMode="numeric"
                        placeholder="예: 27"
                        className="np-input"
                      />
                      <label className="mt-4 block text-sm font-bold text-[#22315a]">성별</label>
                      <div className="mt-2 flex gap-2">
                        {["여성", "남성", "기타"].map((g) => (
                          <button
                            key={g}
                            onClick={() => setGender(g)}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                              gender === g
                                ? "border-transparent bg-[#22315a] text-white"
                                : "border-[#e3e8f0] bg-[#f6f8fb] text-[#5a6b8c] hover:bg-[#eef2f8]"
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                      <motion.button
                        onClick={() => setStage("travel")}
                        disabled={!loginDone}
                        whileHover={loginDone ? { scale: 1.02, y: -1 } : undefined}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="mt-5 w-full rounded-2xl bg-[#22315a] py-4 font-cute text-lg text-white shadow-[0_12px_24px_rgba(34,49,90,0.35)] disabled:opacity-40"
                      >
                        여행 시작하기
                      </motion.button>
                    </div>

                    {/* 절취선 + 양쪽 노치 */}
                    <div className="relative">
                      <div className="absolute left-0 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b3a63]" />
                      <div className="absolute right-0 top-1/2 h-7 w-7 translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2b3a63]" />
                      <div className="mx-6 border-t-2 border-dashed border-[#d7deea]" />
                    </div>

                    {/* 스텁: FLIGHT / SEAT / GATE + 바코드 */}
                    <div className="p-6 pt-5">
                      <div className="grid grid-cols-2 gap-y-4">
                        <StubField label="FLIGHT" value="COSMAX" />
                        <StubField label="SEAT" value="23A" />
                        <StubField label="GATE" value="6" />
                        <StubField label="CLASS" value="BEAUTY" />
                      </div>
                      <Barcode />
                    </div>
                  </div>
                </div>
              </motion.section>
            )}

            {/* 3. 여행지 설문 — 나라 → 도시 → 날짜 */}
            {stage === "travel" && (
              <motion.section key="travel" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky />
                <AmbientClouds />
                <div className="relative min-h-full px-6 pb-10 pt-14">
                  <StepBadge step={1} total={2} label="여행 정보" />
                  <h2 className="mt-3 font-cute text-3xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,140,0.5)" }}>
                    어디로 떠나시나요?
                  </h2>

                  {/* 나라 */}
                  <div className="mt-5 rounded-[26px] border border-white/60 bg-white/72 p-5 shadow-[0_20px_50px_rgba(43,120,170,0.2)] backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <FieldLabel>나라</FieldLabel>
                      <button
                        onClick={() => { setUseCustom((v) => !v); setCountryCode(null); setCityName(null); }}
                        className="text-xs font-semibold text-[#ff7fa8]"
                      >
                        {useCustom ? "목록에서 선택" : "직접 입력"}
                      </button>
                    </div>
                    {useCustom ? (
                      <div className="mt-3 space-y-2">
                        <input value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} placeholder="나라 (예: 포르투갈)" className="glass-input" />
                        <input value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="도시 (예: 리스본)" className="glass-input" />
                      </div>
                    ) : (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            onClick={() => selectCountry(c.code)}
                            className={`flex flex-col items-center rounded-2xl border px-2 py-3 text-xs transition ${
                              countryCode === c.code
                                ? "border-transparent bg-gradient-to-br from-[#ff9f7a] to-[#ff7fa8] text-white shadow-[0_8px_18px_rgba(255,127,168,0.35)]"
                                : "border-white/70 bg-white/60 text-[#2b6b86] hover:bg-white/90"
                            }`}
                          >
                            <span className="text-2xl leading-none">{c.flag}</span>
                            <span className="mt-1 font-semibold">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 도시 (나라 연동) */}
                  {!useCustom && country && (
                    <div className="mt-4 rounded-[26px] border border-white/60 bg-white/72 p-5 shadow-[0_20px_50px_rgba(43,120,170,0.2)] backdrop-blur-xl">
                      <FieldLabel>도시</FieldLabel>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {country.cities.map((ci) => (
                          <Chip key={ci.name} active={cityName === ci.name} onClick={() => setCityName(ci.name)}>
                            {ci.name}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 날짜 */}
                  <div className="mt-4 rounded-[26px] border border-white/60 bg-white/72 p-5 shadow-[0_20px_50px_rgba(43,120,170,0.2)] backdrop-blur-xl">
                    <FieldLabel>여행 날짜</FieldLabel>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <DateField
                        label="출발일"
                        value={departDate}
                        min={todayISO()}
                        onChange={(d) => {
                          setDepartDate(d);
                          if (arriveDate && arriveDate < d) setArriveDate(null);
                        }}
                      />
                      <DateField label="도착일" value={arriveDate} min={departDate ?? todayISO()} disabled={!departDate} onChange={setArriveDate} />
                    </div>
                    {departDate && arriveDate && (
                      <div className="mt-2 text-xs text-[#7aa7ba]">총 {diffDays(departDate, arriveDate)}일 일정</div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button onClick={() => setStage("login")} className="rounded-full bg-white/70 px-5 py-4 text-sm font-semibold text-[#2b6b86] backdrop-blur">
                      ← 이전
                    </button>
                    <div className="flex-1">
                      <PrimaryButton onClick={() => setStage("skin")} disabled={!travelDone}>
                        다음 →
                      </PrimaryButton>
                    </div>
                  </div>
                </div>
                <Grain />
              </motion.section>
            )}

            {/* 4. 피부 설문 — 스모어 방식 (한 문항씩) */}
            {stage === "skin" && (
              <motion.section key="skin" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky />
                <AmbientClouds />
                {analyzing ? (
                  <div className="relative flex min-h-full flex-col items-center justify-center px-8 text-center">
                    <motion.div
                      className="h-16 w-16 rounded-full border-[3px] border-white/50 border-t-[#ff7fa8]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="mt-6 font-cute text-2xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,140,0.5)" }}>
                      결과 분석중…
                    </div>
                    <p className="mt-2 text-sm text-white/90">당신의 피부와 여행지를 매칭하고 있어요</p>
                  </div>
                ) : (
                  <div className="relative min-h-full px-7 pb-10 pt-14">
                    {/* 진행바 */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => (qIndex === 0 ? setStage("travel") : setQIndex((i) => i - 1))}
                        className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-semibold text-[#2b6b86] backdrop-blur"
                      >
                        ← 이전
                      </button>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/50">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8]"
                          animate={{ width: `${((qIndex + 1) / BAUMANN_AXES.length) * 100}%` }}
                          transition={{ duration: 0.4, ease: EASE }}
                        />
                      </div>
                      <div className="text-xs font-semibold text-white">
                        {Math.min(qIndex + 1, BAUMANN_AXES.length)}/{BAUMANN_AXES.length}
                      </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {qIndex < BAUMANN_AXES.length && (() => {
                        const ax = BAUMANN_AXES[qIndex];
                        return (
                          <motion.div
                            key={qIndex}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.35, ease: EASE }}
                            className="flex min-h-[62vh] flex-col justify-center"
                          >
                            <div className="text-sm font-semibold tracking-[0.15em] text-white/80">STEP {qIndex + 1}</div>
                            <h2 className="mt-2 whitespace-nowrap font-cute text-[22px] leading-snug text-white" style={{ textShadow: "0 3px 14px rgba(43,110,140,0.5)" }}>
                              {ax.icon} {ax.q}
                            </h2>
                            <p className="mt-2 text-sm text-white/85">{ax.hint}</p>
                            <div className="mt-7 space-y-3">
                              <AxisChoice option={ax.a} active={axes[qIndex] === ax.a.letter} onClick={() => chooseAxis(ax.a.letter)} />
                              <div className="text-center text-xs font-bold tracking-[0.2em] text-white/70">VS</div>
                              <AxisChoice option={ax.b} active={axes[qIndex] === ax.b.letter} onClick={() => chooseAxis(ax.b.letter)} />
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>
                )}
                <Grain />
              </motion.section>
            )}

            {/* 5. 결과 */}
            {stage === "result" && result && (
              <motion.section key="result" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky warm />
                <AmbientClouds />
                <div className="relative min-h-full px-6 pb-12 pt-12">
                  <div className="mb-2 text-center font-cute text-white/90">{name || "여행자"}님의 뷰티 여권</div>

                  {/* 보딩패스 종합 요약 */}
                  {skin && (
                    <div className="overflow-hidden rounded-[26px] bg-white/90 shadow-[0_24px_60px_rgba(43,120,170,0.28)] backdrop-blur-xl">
                      {/* 헤더 스트립 */}
                      <div className="flex items-center justify-between px-5 py-3 text-white" style={{ background: "linear-gradient(90deg,#ff9f7a,#ff7fa8)" }}>
                        <span className="text-[11px] font-bold tracking-[0.2em]">BOARDING PASS</span>
                        <span className="font-cute text-sm">BP-{(departDate ?? "2026-08").slice(2, 4)}{(departDate ?? "2026-08-08").slice(5, 7)}</span>
                      </div>

                      <div className="p-5">
                        {/* 탑승객 */}
                        <div className="flex items-end justify-between">
                          <div>
                            <div className="text-[10px] tracking-widest text-[#9cb6c2]">PASSENGER</div>
                            <div className="font-cute text-2xl text-[#2b4b58]">{name || "여행자"}</div>
                          </div>
                          <div className="text-right text-xs text-[#6f909d]">
                            {age && <>만 {age}세 · </>}{gender}
                          </div>
                        </div>

                        {/* 항로 */}
                        <div className="mt-4 flex items-center justify-between border-y border-dashed border-[#dbe8ef] py-3">
                          <div>
                            <div className="text-[10px] tracking-widest text-[#9cb6c2]">FROM</div>
                            <div className="font-cute text-lg text-[#2b4b58]">일상</div>
                          </div>
                          <div className="text-xl text-[#ff7fa8]">✈</div>
                          <div className="text-right">
                            <div className="text-[10px] tracking-widest text-[#9cb6c2]">TO</div>
                            <div className="font-cute text-lg text-[#2b4b58]">{result.placeLabel}</div>
                          </div>
                        </div>

                        {/* 일정 */}
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="text-[#4a6b78]">
                            {departDate && arriveDate ? `${fmtISO(departDate)} ~ ${fmtISO(arriveDate)}` : "일정 미정"}
                          </div>
                          <div className="rounded-full bg-[#f0fbff] px-3 py-1 font-cute text-[#ff7fa8]">
                            {result.days - 1}박 {result.days}일
                          </div>
                        </div>

                        {/* 여행지 날씨 (Open-Meteo 예보 / 실패 시 계절 기본값) */}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-[10px] tracking-widest text-[#9cb6c2]">WEATHER</div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              result.wxSource === "실시간 예보" ? "bg-[#e9f8f0] text-[#268a5b]" : "bg-[#f0f4f7] text-[#7aa7ba]"
                            }`}
                          >
                            {result.wxSource === "실시간 예보" ? "🛰️ 실시간 예보" : "📊 계절 기본값"}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2">
                          <Metric icon="🌡️" label="기온" value={`${result.profile.temp}℃`} />
                          <Metric icon="💧" label="습도" value={`${result.profile.humidity}%`} />
                          <Metric icon="☀️" label="UV" value={`${result.profile.uv}`} />
                          <Metric icon="😷" label="미세먼지" value={`${result.profile.dust}`} />
                        </div>

                        {/* 피부 타입 — Baumann 16-타입 */}
                        {(() => {
                          const bt = BAUMANN_TYPES[skin.code];
                          const care = baumannCare(skin.code);
                          return (
                            <div className="mt-5 border-t border-dashed border-[#dbe8ef] pt-4">
                              <div className="text-[10px] tracking-widest text-[#9cb6c2]">BAUMANN SKIN TYPE</div>
                              <div className="mt-1.5 flex items-center gap-3">
                                <div
                                  className="flex h-14 items-center rounded-2xl px-4 font-cute text-3xl tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(43,120,170,0.28)]"
                                  style={{ background: bt?.color ?? "#8aa7bd" }}
                                >
                                  {skin.code}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-cute text-xl leading-tight text-[#2b4b58]">{bt?.nick ?? skin.code}</div>
                                  <div className="text-[12px] leading-snug text-[#6f909d]">{bt?.tagline}</div>
                                </div>
                              </div>

                              {/* 4축 요약 배지 */}
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {BAUMANN_AXES.map((ax, i) => {
                                  const opt = skin.code[i] === ax.a.letter ? ax.a : ax.b;
                                  return (
                                    <div key={ax.key} className="flex items-center gap-2 rounded-xl bg-[#f2f8fb] px-3 py-2">
                                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white font-cute text-sm text-[#ff7fa8]">{opt.letter}</span>
                                      <span className="text-[13px] font-semibold text-[#2b4b58]">{opt.ko}</span>
                                      <span className="ml-auto text-[10px] text-[#9cb6c2]">{opt.en}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {care.paras.map((para, i) => (
                                <p key={i} className="mt-2 text-[13px] leading-relaxed text-[#5b7683]">{para}</p>
                              ))}

                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <div>
                                  <div className="text-xs font-bold text-[#2fae74]">👍 추천 성분</div>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {care.good.map((g) => (
                                      <span key={g} className="rounded-full bg-[#e9f8f0] px-2.5 py-0.5 text-[11px] text-[#268a5b]">{g}</span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#e5804d]">⚠️ 주의 성분</div>
                                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                                    {care.avoid.length ? (
                                      care.avoid.map((g) => (
                                        <span key={g} className="rounded-full bg-[#fdeee6] px-2.5 py-0.5 text-[11px] text-[#c9622f]">{g}</span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] text-[#9cb6c2]">특별히 피할 성분은 없어요</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* 날씨+피부 한 줄 코멘트 */}
                        <div className="mt-4 rounded-2xl bg-gradient-to-r from-[#fff2ea] to-[#ffe9f0] px-4 py-3 text-[13px] leading-relaxed text-[#8a4b52]">
                          💬 {comboComment(result.profile, skin.skinTypeForRec)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 스크롤 인디케이터 */}
                  <motion.div
                    className="mt-5 flex flex-col items-center text-white/90"
                    animate={{ y: [0, 6, 0], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-xs tracking-[0.2em]">아래로 스크롤</span>
                    <span className="text-lg leading-none">⌄</span>
                  </motion.div>

                  <Card>
                    <CardTitle>🌦️ 기후 리포트</CardTitle>
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      <Metric icon="🌡️" label="기온" value={`${result.profile.temp}℃`} />
                      <Metric icon="💧" label="습도" value={`${result.profile.humidity}%`} />
                      <Metric icon="☀️" label="UV" value={`${result.profile.uv}`} />
                      <Metric icon="😷" label="미세먼지" value={`${result.profile.dust}`} />
                    </div>
                  </Card>
                  <Card>
                    <CardTitle>📊 피부 이슈 지수</CardTitle>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-cute text-5xl" style={{ color: result.index.color }}>{result.index.score}</span>
                      <span className="font-semibold" style={{ color: result.index.color }}>{result.index.level}</span>
                      <span className="text-sm text-[#7aa7ba]">/ 100</span>
                    </div>
                    <div className="mt-3 h-3.5 overflow-hidden rounded-full bg-[#e3f1f7]">
                      <motion.div className="h-full rounded-full" style={{ background: result.index.color }} initial={{ width: 0 }} animate={{ width: `${result.index.score}%` }} transition={{ delay: 0.3, duration: 0.9, ease: EASE }} />
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {result.index.notes.map((n, k) => (
                        <li key={k} className="flex gap-2 text-sm text-[#4a6b78]">
                          <span style={{ color: result.index.color }}>•</span>
                          {n}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card>
                    <CardTitle>📅 여행 날씨 캘린더</CardTitle>
                    <div className="scroll-x mt-3 flex gap-2 overflow-x-auto pb-2">
                      {result.calendar.map((c, k) => (
                        <motion.div key={k} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + k * 0.03, duration: 0.3 }} className="flex min-w-[76px] flex-col items-center rounded-2xl bg-[#f0fbff] px-3 py-2.5 text-center">
                          <div className="text-[12px] font-bold text-[#2b6b86]">
                            {c.date}
                            <span className="text-[#9cc3d1]">({c.weekday})</span>
                          </div>
                          <div className="my-1 text-xl leading-none">{c.emojis.map((e) => e.icon).join("")}</div>
                          <div className="text-[10px] text-[#7aa7ba]">{c.temp}℃</div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                  {makeupNote && (
                    <Card>
                      <CardTitle>💄 현지 메이크업</CardTitle>
                      <p className="mt-2 text-sm leading-relaxed text-[#4a6b78]">
                        {makeupNote.country}에서 통하는 포인트 메이크업 팁을 사진과 함께 확인해보세요.
                      </p>
                      <button
                        type="button"
                        onClick={() => setMakeupOpen(true)}
                        className="mt-3 w-full rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] px-4 py-3 text-sm font-bold text-white"
                      >
                        {makeupNote.country}의 대표메이크업 보기 →
                      </button>
                    </Card>
                  )}
                  <div className="mt-7 text-center font-cute text-2xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,140,0.5)" }}>
                    🧴 맞춤 스킨케어 추천
                  </div>
                  {/* 근거 흐름 요약 */}
                  <div className="mt-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 text-center text-[13px] font-semibold text-[#2b4b58] backdrop-blur-xl">
                    {result.recSummary}
                  </div>

                  <div className="mt-3 space-y-3">
                    {result.recItems.map(({ p, reason }, k) => {
                      const dryHigh = result.profile.humidity <= 45;
                      const uvHigh = result.profile.uv >= 8;
                      const rec = recommendVolume(p.category, result.days, dryHigh, uvHigh);
                      const ml = volumeSel[p.id] ?? rec.ml;
                      const price = samplePrice(p.price, p.fullMl, ml);
                      const qty = cartQty(p.id, ml);
                      const nights = Math.max(0, result.days - 1);
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + k * 0.08, duration: 0.4, ease: EASE }}
                          className="rounded-[22px] border border-white/70 bg-white p-3 shadow-[0_14px_34px_rgba(43,120,170,0.16)]"
                        >
                          <button
                            type="button"
                            onClick={() => setDetailId(p.id)}
                            className="flex w-full gap-3 text-left"
                          >
                            <ProductImage product={p} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#7aa7ba]">{p.brand}</span>
                                <span className="text-[11px] text-[#c3d4dd]">·</span>
                                <span className="text-[11px] text-[#9cb6c2]">{p.category}</span>
                                <span className="ml-auto flex items-center gap-0.5 text-[12px] font-bold text-[#ff8f4d]">★ {p.rating.toFixed(2)}</span>
                              </div>
                              <div className="mt-0.5 truncate text-sm font-semibold text-[#2b4b58]">{p.name}</div>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                {p.ingredients.map((ing) => (
                                  <span key={ing} className="rounded-full bg-[#eef6fb] px-2 py-0.5 text-[10px] text-[#3f7d97]">#{ing}</span>
                                ))}
                                {p.safety[0] && (
                                  <span className="rounded-full bg-[#e9f8f0] px-2 py-0.5 text-[10px] font-semibold text-[#268a5b]">✓ {p.safety[0]}</span>
                                )}
                              </div>
                              <div className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-[#8a6b52]">
                                <span>💡</span>
                                <span>{reason}</span>
                              </div>
                              <div className="mt-1 text-right text-[10px] font-semibold text-[#ff7fa8]">자세히 보기 →</div>
                            </div>
                          </button>

                          {/* [5-4] 소용량 선택 + 담기 */}
                          <div className="mt-2 flex items-center gap-2 border-t border-dashed border-[#eef2f7] pt-2">
                            <select
                              value={ml}
                              onChange={(e) => setVolumeSel((v) => ({ ...v, [p.id]: Number(e.target.value) }))}
                              className="flex-1 rounded-xl border border-[#e3e8f0] bg-white px-2 py-1.5 text-[12px] text-[#2b4b58] outline-none focus:border-[#22315a]"
                            >
                              {SAMPLE_TIERS.map((t) => (
                                <option key={t} value={t}>
                                  {t}ml{t === rec.ml ? " · 추천" : ""}
                                </option>
                              ))}
                            </select>
                            <span className="rounded-full bg-[#eef6fb] px-2 py-1 text-[10px] font-semibold text-[#3f7d97]">기내 반입 가능 ✈️</span>
                            <span className="text-sm font-bold text-[#2b4b58]">{price.toLocaleString()}원</span>
                            {qty === 0 ? (
                              <button
                                onClick={() => addSample(p.id, ml)}
                                className="rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] px-3 py-1.5 text-xs font-bold text-white"
                              >
                                담기
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 rounded-full bg-[#fff0f5] px-2 py-1">
                                <button onClick={() => decSample(p.id, ml)} className="text-sm font-bold text-[#ff7fa8]">−</button>
                                <span className="w-4 text-center text-xs font-bold text-[#2b4b58]">{qty}</span>
                                <button onClick={() => addSample(p.id, ml)} className="text-sm font-bold text-[#ff7fa8]">＋</button>
                              </div>
                            )}
                          </div>
                          <div className="mt-1 text-[10px] text-[#9cb6c2]">
                            {nights}박 {result.days}일에 딱 맞는 <b className="text-[#ff7fa8]">{rec.ml}ml</b>
                            {rec.qty > 1 && <> (×{rec.qty})</>}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* [6-2] 장바구니는 우측 하단 플로팅 버튼에서 확인 */}
                  {cart.length > 0 && (
                    <div className="mt-5 flex items-center justify-between rounded-full border border-white/60 bg-white/85 px-4 py-2.5 text-sm text-[#2b4b58] backdrop-blur-xl">
                      <span>🧳 담긴 샘플 {cartCount}개</span>
                      <button onClick={() => setCartOpen(true)} className="font-bold text-[#ff7fa8]">장바구니 보기 →</button>
                    </div>
                  )}

                  {/* [6-1] 여행 전·중·후 타임라인 */}
                  <div className="mt-8 text-center font-cute text-2xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,140,0.5)" }}>
                    🗺️ 여행 전 · 중 · 후 타임라인
                  </div>

                  <Card>
                    <CardTitle>🛫 출국 전</CardTitle>
                    {dday !== null ? (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm text-[#4a6b78]">출발까지</span>
                        <span className="font-cute text-2xl text-[#ff7fa8]">
                          {dday > 0 ? `D-${dday}` : dday === 0 ? "D-DAY" : "여행 중"}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-[#7aa7ba]">출발일을 선택하면 D-day가 표시돼요.</p>
                    )}
                    {departDate && (
                      <div className="mt-2 rounded-xl bg-[#f0fbff] px-3 py-2 text-xs text-[#3f7d97]">
                        📦 소용량 키트 도착 예정일 <b>{fmtISO(addDaysISO(departDate, -2))}</b> (출발 2일 전)
                      </div>
                    )}
                    <div className="mt-3 space-y-2">
                      {CHECKLIST_ITEMS.map((item, i) => (
                        <label key={i} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checklist[i]}
                            onChange={() => toggleChecklist(i)}
                            className="h-4 w-4 rounded accent-[#ff7fa8]"
                          />
                          <span className={checklist[i] ? "text-[#9cb6c2] line-through" : "text-[#4a6b78]"}>{item}</span>
                        </label>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>🧳 여행 중 · 오늘의 피부 브리핑</CardTitle>
                    <ul className="mt-2 space-y-1.5">
                      {result.index.notes.map((n, k) => (
                        <li key={k} className="flex gap-2 text-sm text-[#4a6b78]">
                          <span style={{ color: result.index.color }}>•</span>
                          {n}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#fff2ea] to-[#ffe9f0] px-4 py-3 text-[13px] leading-relaxed text-[#8a4b52]">
                      🧴 소용량 키트를 미리 다 챙겨왔으니 현지 구매 걱정 없어요!
                    </div>
                    {!deliveryRequested ? (
                      <button
                        onClick={() => setDeliveryRequested(true)}
                        className="mt-3 w-full rounded-full border border-[#ff9fc0] px-4 py-2.5 text-sm font-semibold text-[#ff7fa8] transition hover:bg-[#fff0f5]"
                      >
                        현지/추가 배송 요청 →
                      </button>
                    ) : (
                      <div className="mt-3 rounded-full bg-[#fff0f5] px-4 py-2.5 text-center text-sm font-semibold text-[#ff7fa8]">
                        배송 요청이 접수됐어요 🚚
                      </div>
                    )}
                  </Card>

                  <Card>
                    <CardTitle>🏠 귀국 후 · 리커버리</CardTitle>
                    <p className="mt-2 text-sm leading-relaxed text-[#4a6b78]">
                      여행 중 자극받은 피부 장벽을 되돌리는 진정 회복 루틴을 추천해요.
                    </p>
                    <div className="mt-3 space-y-2">
                      {RECOVERY_IDS.map((id) => {
                        const p = COSMETICS.find((c) => c.id === id);
                        if (!p) return null;
                        return (
                          <div key={id} className="flex items-center gap-3 rounded-2xl bg-[#f8fafc] p-2.5">
                            <ProductImage product={p} />
                            <div className="min-w-0 flex-1">
                              <div className="text-[11px] font-bold text-[#7aa7ba]">{p.brand}</div>
                              <div className="truncate text-sm font-semibold text-[#2b4b58]">{p.name}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center justify-between rounded-2xl bg-[#f0fbff] px-4 py-3">
                      <span className="text-sm text-[#4a6b78]">이번 여행 피부 이슈 지수</span>
                      <span className="font-cute text-xl" style={{ color: result.index.color }}>
                        {result.index.score} · {result.index.level}
                      </span>
                    </div>
                  </Card>

                  {/* 하단 버튼 */}
                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={restart}
                      className="flex-1 rounded-full border border-white/70 bg-white/70 px-6 py-4 font-cute text-lg text-[#2b6b86] backdrop-blur transition hover:bg-white/90"
                    >
                      다시하기 ↺
                    </button>
                    <div className="flex-1">
                      <PrimaryButton onClick={shareResult}>공유하기 🔗</PrimaryButton>
                    </div>
                  </div>
                  {shared && <div className="mt-3 text-center text-sm text-white/90">링크가 복사되었어요!</div>}
                </div>
                <Grain />
              </motion.section>
            )}

            {/* [6-3] 수령 방식 선택 */}
            {stage === "receive" && (
              <motion.section key="receive" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky warm />
                <AmbientClouds />
                <div className="relative min-h-full px-6 pb-12 pt-14">
                  <button onClick={() => setStage("result")} className="text-sm font-semibold text-white/90">← 뒤로</button>
                  <h2 className="mt-3 font-cute text-3xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,140,0.5)" }}>
                    어떻게 받으실래요?
                  </h2>
                  <p className="mt-2 text-sm text-white/85">담긴 샘플 {cartCount}개 · {cartTotalPrice.toLocaleString()}원</p>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setReceiveMethod("delivery"); setStage("delivery"); }}
                    className="mt-6 w-full rounded-[26px] border border-white/60 bg-white/90 p-5 text-left shadow-[0_18px_44px_rgba(43,120,170,0.22)] backdrop-blur-xl transition hover:bg-white"
                  >
                    <div className="text-3xl">📦</div>
                    <div className="mt-2 font-cute text-xl text-[#2b4b58]">배송으로 받기</div>
                    <p className="mt-1 text-sm text-[#6f909d]">출발 전 미리 집(또는 원하는 곳)에서 받아보세요.</p>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setReceiveMethod("pickup"); setStage("pickup"); }}
                    className="mt-4 w-full rounded-[26px] border border-white/60 bg-white/90 p-5 text-left shadow-[0_18px_44px_rgba(43,120,170,0.22)] backdrop-blur-xl transition hover:bg-white"
                  >
                    <div className="text-3xl">🛄</div>
                    <div className="mt-2 font-cute text-xl text-[#2b4b58]">공항에서 픽업</div>
                    <p className="mt-1 text-sm text-[#6f909d]">짐을 줄이고 출국 당일 공항 보관함에서 바로 받으세요.</p>
                  </motion.button>
                </div>
                <Grain />
              </motion.section>
            )}

            {/* [6-3A] 배송 신청 */}
            {stage === "delivery" && (
              <motion.section key="delivery" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky warm />
                <AmbientClouds />
                <div className="relative min-h-full px-6 pb-12 pt-14">
                  <button onClick={() => setStage("receive")} className="text-sm font-semibold text-white/90">← 뒤로</button>
                  <h2 className="mt-3 font-cute text-3xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,170,0.5)" }}>
                    배송 신청
                  </h2>

                  <Card>
                    <CardTitle>배송 시점</CardTitle>
                    <div className="mt-3 space-y-2">
                      <label className="flex items-center justify-between rounded-2xl border border-[#e3e8f0] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-[#2b4b58]">출국 전 배송</div>
                          <div className="text-xs text-[#7aa7ba]">
                            {departDate ? `예상 도착 ${fmtISO(addDaysISO(departDate, -2))} (출발 2일 전)` : "출발일을 먼저 선택해 주세요"}
                          </div>
                        </div>
                        <input type="checkbox" checked={deliveryBefore} onChange={(e) => setDeliveryBefore(e.target.checked)} className="h-5 w-5 accent-[#ff7fa8]" />
                      </label>
                      <label className="flex items-center justify-between rounded-2xl border border-[#e3e8f0] px-4 py-3">
                        <div>
                          <div className="text-sm font-semibold text-[#2b4b58]">여행 후 케어 배송</div>
                          <div className="text-xs text-[#7aa7ba]">
                            {arriveDate ? `예상 도착 ${fmtISO(addDaysISO(arriveDate, 3))} (귀국 후)` : "도착일을 먼저 선택해 주세요"}
                          </div>
                        </div>
                        <input type="checkbox" checked={deliveryAfter} onChange={(e) => setDeliveryAfter(e.target.checked)} className="h-5 w-5 accent-[#ff7fa8]" />
                      </label>
                    </div>
                  </Card>

                  <Card>
                    <CardTitle>배송 정보</CardTitle>
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">받는 사람</label>
                    <input value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)} placeholder="이름" className="np-input" />
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">연락처</label>
                    <input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="010-0000-0000" inputMode="tel" className="np-input" />
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">배송지</label>
                    <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="주소를 입력하세요" className="np-input" />
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">요청사항 (선택)</label>
                    <input value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="예: 부재 시 경비실에 맡겨주세요" className="np-input" />
                  </Card>

                  <Card>
                    <CardTitle>주문 요약</CardTitle>
                    <div className="mt-2 space-y-1.5">
                      {cartLines.map(({ item, p, lineTotal }) => (
                        <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#4a6b78]">
                          <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                          <span className="font-semibold text-[#2b4b58]">{lineTotal.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-dashed border-[#dbe8ef] pt-2 text-sm font-bold text-[#2b4b58]">
                      <span>합계</span>
                      <span>{cartTotalPrice.toLocaleString()}원</span>
                    </div>
                  </Card>

                  <motion.button
                    disabled={!deliveryFormValid}
                    whileHover={deliveryFormValid ? { scale: 1.02, y: -1 } : undefined}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitDelivery}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] py-4 font-cute text-lg text-white shadow-[0_12px_26px_rgba(255,127,168,0.4)] disabled:opacity-40"
                  >
                    주문 완료
                  </motion.button>
                </div>
                <Grain />
              </motion.section>
            )}

            {/* [6-3B] 공항 픽업 신청 */}
            {stage === "pickup" && (
              <motion.section key="pickup" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky warm />
                <AmbientClouds />
                <div className="relative min-h-full px-6 pb-12 pt-14">
                  <button onClick={() => setStage("receive")} className="text-sm font-semibold text-white/90">← 뒤로</button>
                  <h2 className="mt-3 font-cute text-3xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,170,0.5)" }}>
                    공항 픽업 신청
                  </h2>

                  <Card>
                    <CardTitle>픽업 정보</CardTitle>
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">픽업 공항</label>
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

                    <label className="mt-3 block text-sm font-bold text-[#22315a]">픽업 날짜</label>
                    <DateField
                      label="픽업 날짜"
                      value={pickupDate}
                      min={todayISO()}
                      max={departDate ?? undefined}
                      onChange={setPickupDate}
                    />
                    <p className="mt-1 text-xs text-[#7aa7ba]">
                      출발일({departDate ? fmtISO(departDate) : "미정"}) 이후는 선택할 수 없어요 · 출발 당일 픽업을 권장해요.
                    </p>

                    <label className="mt-3 block text-sm font-bold text-[#22315a]">픽업 시간</label>
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
                    <p className="mt-1 text-xs text-[#7aa7ba]">✈️ 출발 시각 최소 2시간 전 픽업을 권장해요.</p>
                  </Card>

                  <Card>
                    <CardTitle>신청자 정보</CardTitle>
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">이름</label>
                    <input value={name || "여행자"} disabled className="np-input opacity-60" />
                    <label className="mt-3 block text-sm font-bold text-[#22315a]">연락처</label>
                    <input value={pickupPhone} onChange={(e) => setPickupPhone(e.target.value.replace(/[^0-9-]/g, ""))} placeholder="010-0000-0000" inputMode="tel" className="np-input" />
                  </Card>

                  <Card>
                    <CardTitle>주문 요약</CardTitle>
                    <div className="mt-2 space-y-1.5">
                      {cartLines.map(({ item, p, lineTotal }) => (
                        <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#4a6b78]">
                          <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                          <span className="font-semibold text-[#2b4b58]">{lineTotal.toLocaleString()}원</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-between border-t border-dashed border-[#dbe8ef] pt-2 text-sm font-bold text-[#2b4b58]">
                      <span>합계</span>
                      <span>{cartTotalPrice.toLocaleString()}원</span>
                    </div>
                    {pickupAirport && pickupDate && pickupTime && (
                      <div className="mt-2 text-xs text-[#7aa7ba]">픽업: {pickupAirport} · {fmtISO(pickupDate)} · {pickupTime}</div>
                    )}
                  </Card>

                  <motion.button
                    disabled={!pickupFormValid}
                    whileHover={pickupFormValid ? { scale: 1.02, y: -1 } : undefined}
                    whileTap={{ scale: 0.98 }}
                    onClick={submitPickup}
                    className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] py-4 font-cute text-lg text-white shadow-[0_12px_26px_rgba(255,127,168,0.4)] disabled:opacity-40"
                  >
                    예약 완료
                  </motion.button>
                </div>
                <Grain />
              </motion.section>
            )}

            {/* [6-4] 완료 화면 */}
            {stage === "done" && (
              <motion.section key="done" variants={stageVariants} initial="hidden" animate="show" exit="exit" className="absolute inset-0 overflow-y-auto">
                <Sky warm />
                <AmbientClouds />
                <div className="relative flex min-h-full flex-col items-center px-6 pb-12 pt-16 text-center">
                  <div className="text-5xl">{receiveMethod === "pickup" ? "🛄" : "📦"}</div>
                  <h2 className="mt-4 font-cute text-2xl text-white" style={{ textShadow: "0 3px 14px rgba(43,110,170,0.5)" }}>
                    {receiveMethod === "pickup" ? "예약이 완료되었습니다!" : "주문이 완료되었습니다!"}
                  </h2>
                  <div className="mt-1 text-sm text-white/85">주문번호 {orderNo}</div>

                  <div className="mt-5 w-full text-left">
                    <Card>
                      <CardTitle>주문 요약</CardTitle>
                      <div className="mt-2 space-y-1.5">
                        {cartLines.map(({ item, p, lineTotal }) => (
                          <div key={`${item.id}-${item.ml}`} className="flex justify-between text-sm text-[#4a6b78]">
                            <span className="truncate">{p.brand} {p.name} · {item.ml}ml ×{item.qty}</span>
                            <span className="font-semibold text-[#2b4b58]">{lineTotal.toLocaleString()}원</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between border-t border-dashed border-[#dbe8ef] pt-2 text-sm font-bold text-[#2b4b58]">
                        <span>합계</span>
                        <span>{cartTotalPrice.toLocaleString()}원</span>
                      </div>
                      <div className="mt-2 text-xs text-[#7aa7ba]">✈️ 전 제품 100ml 이하 · 기내 반입 가능</div>
                    </Card>

                    {receiveMethod === "delivery" ? (
                      <Card>
                        <CardTitle>📦 배송 안내</CardTitle>
                        <p className="mt-2 text-sm leading-relaxed text-[#4a6b78]">여행 일정에 맞춰 소용량 키트를 준비해 배송합니다.</p>
                        <div className="mt-2 space-y-1 text-xs text-[#7aa7ba]">
                          {deliveryBefore && departDate && <div>· 출국 전 배송 — 예상 도착 {fmtISO(addDaysISO(departDate, -2))}</div>}
                          {deliveryAfter && arriveDate && <div>· 여행 후 케어 배송 — 예상 도착 {fmtISO(addDaysISO(arriveDate, 3))}</div>}
                        </div>
                      </Card>
                    ) : (
                      <Card>
                        <CardTitle>🛄 픽업 안내</CardTitle>
                        <div className="mt-2 text-sm text-[#4a6b78]">
                          {pickupAirport} · {pickupDate ? fmtISO(pickupDate) : ""} · {pickupTime}
                        </div>
                        <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#fff2ea] to-[#ffe9f0] p-4 text-center">
                          <div className="text-xs text-[#8a4b52]">{pickupAirport} 보관함</div>
                          <div className="font-cute text-4xl text-[#ff7fa8]">{lockerNo}</div>
                          <div className="text-xs text-[#8a4b52]">번 보관함에서 찾아가세요</div>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-xs text-[#7aa7ba]">
                          <li>· 예약 시간 이후 수령 가능해요.</li>
                          <li>· 픽업 시 주문번호·연락처를 확인해 주세요.</li>
                          <li>· 출발 2시간 전, 여유 있게 방문해 주세요.</li>
                        </ul>
                      </Card>
                    )}
                  </div>

                  <button
                    onClick={restart}
                    className="mt-8 w-full rounded-full border border-white/70 bg-white/70 px-6 py-4 font-cute text-lg text-[#2b6b86] backdrop-blur transition hover:bg-white/90"
                  >
                    처음으로 ↺
                  </button>
                </div>
                <Grain />
              </motion.section>
            )}
          </AnimatePresence>

          {/* [6-2] 플로팅 장바구니 + 시트 */}
          <AnimatePresence>
            {stage === "result" && cartCount > 0 && !cartOpen && (
              <motion.button
                key="cart-fab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={() => setCartOpen(true)}
                className="absolute bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] px-5 py-3.5 font-cute text-white shadow-[0_16px_36px_rgba(255,127,168,0.5)]"
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
                cartQty={cartQty}
                onAdd={addSample}
                onDec={decSample}
                onClose={() => setDetailId(null)}
              />
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
  return <div className="mt-4 rounded-[26px] border border-white/60 bg-white/78 p-5 shadow-[0_18px_44px_rgba(43,120,170,0.2)] backdrop-blur-xl">{children}</div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-cute text-xl text-[#2b4b58]">{children}</h3>;
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

function Metric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f0fbff] px-2 py-3 text-center">
      <div className="text-lg">{icon}</div>
      <div className="mt-0.5 text-[10px] text-[#7aa7ba]">{label}</div>
      <div className="font-cute text-base text-[#2b4b58]">{value}</div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-[#2b6b86]">{children}</label>;
}

// [5-detail] 제품 상세 바텀시트
function ProductDetail({
  product,
  days,
  dryHigh,
  uvHigh,
  reason,
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
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#eef2f7] bg-white/95 px-5 py-3 backdrop-blur">
          <button onClick={onClose} className="text-sm font-semibold text-[#5a6b8c]">← 목록으로</button>
          <div className="mx-auto h-1 w-10 rounded-full bg-[#e3e8f0]" />
        </div>

        <div className="px-5 pb-8 pt-4">
          {/* 큰 이미지 */}
          <div className="mx-auto w-full max-w-[220px]">
            <ProductImageLarge product={product} />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-bold text-[#7aa7ba]">{product.brand}</span>
            <span className="ml-auto text-sm font-bold text-[#ff8f4d]">★ {product.rating.toFixed(2)}</span>
          </div>
          <h2 className="mt-0.5 font-cute text-2xl text-[#22315a]">{product.name}</h2>
          <div className="mt-1 text-sm text-[#6f909d]">
            정품 {product.fullMl}ml · 정가 {product.price.toLocaleString()}원
          </div>

          {/* 안전 배지 */}
          {product.safety.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {product.safety.map((s) => (
                <span key={s} className="rounded-full bg-[#e9f8f0] px-2.5 py-1 text-[11px] font-semibold text-[#268a5b]">✓ {s}</span>
              ))}
            </div>
          )}

          {/* 성분 · 적합/고민 태그 */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.ingredients.map((ing) => (
              <span key={ing} className="rounded-full bg-[#eef6fb] px-2.5 py-1 text-[11px] text-[#3f7d97]">#{ing}</span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.forTypes.map((t) => (
              <span key={t} className="rounded-full border border-[#e3e8f0] px-2.5 py-1 text-[11px] text-[#5a6b8c]">{t}</span>
            ))}
            {product.concerns.map((c) => (
              <span key={c} className="rounded-full bg-[#fff0f5] px-2.5 py-1 text-[11px] text-[#ff7fa8]">{c}</span>
            ))}
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#5b7683]">{product.desc}</p>

          {/* 이 여행에 왜 맞는지 */}
          {reason && (
            <div className="mt-3 rounded-2xl bg-gradient-to-r from-[#fff2ea] to-[#ffe9f0] px-4 py-3 text-[13px] leading-relaxed text-[#8a4b52]">
              💡 이 여행에 딱 맞아요 — {reason}
            </div>
          )}

          {/* 소용량 선택 */}
          <div className="mt-5 rounded-2xl border border-[#e3e8f0] bg-[#f8fafc] p-4">
            <div className="text-sm font-bold text-[#22315a]">소용량 선택 (기내 반입 가능 ✈️)</div>
            <select
              value={ml}
              onChange={(e) => setMl(Number(e.target.value))}
              className="mt-2 w-full appearance-none rounded-xl border border-[#e3e8f0] bg-white px-4 py-3 text-[15px] text-[#22315a] outline-none focus:border-[#22315a]"
            >
              {SAMPLE_TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}ml · 기내 반입 가능 ✈️{t === rec.ml ? " (추천)" : ""}
                </option>
              ))}
            </select>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-[#6f909d]">
                {nights}박 {days}일에 딱 맞는 <b className="text-[#ff7fa8]">{rec.ml}ml</b>
                {rec.qty > 1 && <> (×{rec.qty})</>}
              </span>
              <span className="font-cute text-xl text-[#22315a]">{price.toLocaleString()}원</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="mt-4 space-y-2">
            <button
              onClick={() => window.open(product.oliveYoungUrl, "_blank", "noopener")}
              className="w-full rounded-2xl border border-[#22315a] py-3.5 font-cute text-base text-[#22315a] transition hover:bg-[#f2f5fa]"
            >
              본품 구매하기 (올리브영){product.linkType === "search" && <span className="ml-1 text-xs font-normal text-[#8aa]">· 검색</span>}
            </button>
            {qty === 0 ? (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onAdd(product.id, ml)}
                className="w-full rounded-2xl bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] py-3.5 font-cute text-base text-white shadow-[0_12px_26px_rgba(255,127,168,0.4)]"
              >
                샘플 담기 · {price.toLocaleString()}원
              </motion.button>
            ) : (
              <div className="flex items-center justify-between rounded-2xl bg-[#fff0f5] px-4 py-2.5">
                <span className="text-sm font-semibold text-[#ff7fa8]">샘플 {ml}ml 담김</span>
                <div className="flex items-center gap-4">
                  <button onClick={() => onDec(product.id, ml)} className="text-xl text-[#ff7fa8]">−</button>
                  <span className="w-5 text-center font-bold text-[#22315a]">{qty}</span>
                  <button onClick={() => onAdd(product.id, ml)} className="text-xl text-[#ff7fa8]">＋</button>
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
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-[#eef2f7] bg-white/95 px-5 py-3 backdrop-blur">
          <span className="font-cute text-lg text-[#2b4b58]">🧳 여행 샘플 장바구니</span>
          <button onClick={onClose} className="ml-auto text-sm font-semibold text-[#5a6b8c]">닫기</button>
        </div>

        <div className="px-5 pb-8 pt-4">
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#9cb6c2]">장바구니가 비어있어요.</p>
          ) : (
            <div className="space-y-3">
              {lines.map(({ item, p, lineTotal }) => (
                <div key={`${item.id}-${item.ml}`} className="flex items-center gap-3 rounded-2xl border border-[#eef2f7] p-3">
                  <ProductImage product={p} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-[#7aa7ba]">{p.brand}</div>
                    <div className="truncate text-sm font-semibold text-[#2b4b58]">{p.name}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="rounded-full bg-[#fff0f5] px-2 py-0.5 text-[10px] font-semibold text-[#ff7fa8]">{item.ml}ml</span>
                      <span className="rounded-full bg-[#eef6fb] px-2 py-0.5 text-[10px] font-semibold text-[#3f7d97]">기내 반입 ✈️</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 rounded-full bg-[#f0f4f9] px-2 py-1">
                      <button onClick={() => onDec(item.id, item.ml)} className="text-sm font-bold text-[#5a6b8c]">−</button>
                      <span className="w-4 text-center text-xs font-bold">{item.qty}</span>
                      <button onClick={() => onInc(item.id, item.ml)} className="text-sm font-bold text-[#5a6b8c]">＋</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#2b4b58]">{lineTotal.toLocaleString()}원</span>
                      <button onClick={() => onRemove(item.id, item.ml)} className="text-xs text-[#c3d4dd] underline">삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {lines.length > 0 && (
            <>
              <div className="mt-4 space-y-1 rounded-2xl bg-[#f8fafc] p-4 text-sm">
                <div className="flex justify-between text-[#4a6b78]"><span>총 제품 수</span><span className="font-semibold text-[#2b4b58]">{totalQty}개</span></div>
                <div className="flex justify-between text-[#4a6b78]"><span>총 용량</span><span className="font-semibold text-[#2b4b58]">{totalMl}ml</span></div>
                <div className="flex justify-between border-t border-dashed border-[#dbe8ef] pt-1.5 font-bold text-[#2b4b58]"><span>총 금액</span><span>{totalPrice.toLocaleString()}원</span></div>
              </div>

              <div className={`mt-3 rounded-2xl px-4 py-3 text-[12px] leading-relaxed ${allUnder100 ? "bg-[#e9f8f0] text-[#268a5b]" : "bg-[#fdeee6] text-[#c9622f]"}`}>
                ✈️ {allUnder100 ? "전 제품 개별 100ml 이하 — 기내 반입 가능해요." : "일부 제품이 100ml를 초과해요 — 위탁수하물로 부쳐야 해요."}
                <br />
                <span className="text-[11px] opacity-80">기내 액체 규정: 개별 100ml 이하 · 총합 1L 이하 · 투명 지퍼백 권장</span>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onCheckout}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#ff9f7a] to-[#ff7fa8] py-3.5 font-cute text-base text-white shadow-[0_12px_26px_rgba(255,127,168,0.4)]"
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
      <div className="mt-0.5 font-cute text-2xl text-[#22315a]">{value}</div>
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
}: {
  label: string;
  value: string | null;
  min: string;
  max?: string;
  disabled?: boolean;
  onChange: (d: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
          disabled ? "border-white/50 bg-white/40 text-[#9cb6c2]" : "border-white bg-white/80 text-[#2b4b58]"
        }`}
      >
        <span className="block text-[10px] tracking-widest text-[#7aa7ba]">{label}</span>
        <span className="text-sm font-semibold">{value ? fmtISO(value) : "날짜 선택"}</span>
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
                  <div className="mb-2 text-center font-cute text-[#2b4b58]">{label} 선택</div>
                  <CalendarPopup value={value} min={min} max={max} onPick={(d) => { onChange(d); setOpen(false); }} />
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
}: {
  value: string | null;
  min: string;
  max?: string;
  onPick: (d: string) => void;
}) {
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
        <button onClick={prev} className="px-2 text-xl text-[#7aa7ba]">‹</button>
        <div className="font-semibold text-[#2b4b58]">{ym.y}. {pad(ym.m + 1)}</div>
        <button onClick={next} className="px-2 text-xl text-[#7aa7ba]">›</button>
      </div>
      <div className="mt-2 grid grid-cols-7 text-center text-[10px] text-[#9cb6c2]">
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
              className={`h-8 rounded-lg text-sm transition ${
                selected
                  ? "bg-gradient-to-br from-[#ff9f7a] to-[#ff7fa8] text-white"
                  : disabled
                    ? "text-[#d3e0e8]"
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
