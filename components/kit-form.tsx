"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Truck } from "lucide-react";
import type { Product } from "@/lib/data";

export function KitForm({
  dest,
  days,
  routine,
}: {
  dest: string;
  days: number;
  routine: Product[];
}) {
  const [who, setWho] = useState("");
  const [addr, setAddr] = useState("");
  const [done, setDone] = useState<{ who: string; addr: string; eta: string } | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!who.trim() || !addr.trim()) return;
    const eta = new Date();
    eta.setDate(eta.getDate() + 2);
    const etaStr = `${eta.getFullYear()}년 ${eta.getMonth() + 1}월 ${eta.getDate()}일`;
    setDone({ who: who.trim(), addr: addr.trim(), eta: etaStr });
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-line bg-card p-6 shadow-soft sm:p-7">
      <div className="flex items-center gap-2">
        <Package />
        <h3 className="font-serif text-xl font-semibold">소용량 맞춤 키트 신청</h3>
      </div>
      <p className="mt-1 text-sm text-muted">{days}일 일정에 맞춘 소용량 구성입니다.</p>

      <ul className="mt-4 space-y-1.5">
        {routine.map((p) => (
          <li key={p.id} className="flex items-center gap-2 text-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {p.name}
          </li>
        ))}
      </ul>

      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-[#cdebd9] bg-[#f0faf4] p-6 text-center"
          >
            <CheckCircle2 className="mx-auto h-10 w-10 text-[#30a46c]" />
            <h4 className="mt-2 font-serif text-lg font-semibold">신청이 완료되었습니다</h4>
            <p className="mt-1 text-sm text-muted">
              <b className="text-ink">{done.who}</b>님의 {dest} {days}일 맞춤 키트를 준비합니다.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm shadow-soft">
              <Truck className="h-4 w-4 text-accent" />
              배송 예정일 <b>{done.eta}</b>
            </div>
            <p className="mt-2 text-xs text-muted">{done.addr}</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={submit}
            className="mt-6 space-y-4"
          >
            <Field label="배송 받을 이름">
              <input
                value={who}
                onChange={(e) => setWho(e.target.value)}
                placeholder="예: 고민순"
                className="input"
                required
              />
            </Field>
            <Field label="배송지">
              <input
                value={addr}
                onChange={(e) => setAddr(e.target.value)}
                placeholder="주소를 입력하세요"
                className="input"
                required
              />
            </Field>
            <button
              type="submit"
              className="w-full rounded-full bg-accent px-6 py-3.5 font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
              disabled={!who.trim() || !addr.trim()}
            >
              키트 신청하기 →
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid var(--color-line);
          border-radius: 12px;
          font-size: 15px;
          background: #fff;
          font-family: inherit;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        :global(.input:focus) {
          border-color: var(--color-accent);
          box-shadow: 0 0 0 3px var(--color-accent-soft);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}

function Package() {
  return <span className="text-xl">📦</span>;
}
