"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import styles from "./style-note.module.css";
import { MAKEUP_STYLE_NOTES, type MakeupStyleNote } from "@/lib/makeup-style-notes";

const POLAROID_POS = [styles.p1, styles.p2, styles.p3];

function CountryDetail({ note, onBack }: { note: MakeupStyleNote; onBack: () => void }) {
  return (
    <div className={styles.notebook}>
      <div className={styles.topbar}>
        <button type="button" className={styles.back} onClick={onBack} aria-label="목록으로">
          ←
        </button>
      </div>
      <div className={styles.noteHeader}>
        <div className={styles.eyebrowScript}>Beauty Passport&apos;s</div>
        <h1>Style Note</h1>
        <p>{note.intro}</p>
      </div>

      <div className={styles.collage}>
        {note.coverCaptions.map((cap, i) => (
          <div key={cap + i} className={`${styles.polaroid} ${POLAROID_POS[i % POLAROID_POS.length]}`}>
            <div className={styles.frame}>{note.flag}</div>
            <div className={styles.cap}>{cap}</div>
          </div>
        ))}
        <div className={styles.stickyNote}>{note.country} TRIP</div>
      </div>

      <div className={styles.pointSection}>
        {note.points.map((p) => (
          <div key={p.label} className={styles.pointBlock}>
            <div className={styles.pointLabel}>{p.label}</div>
            <div className={styles.pointTitleTag}>
              {p.title} · {p.tagline}
            </div>
            <div className={styles.pointPhoto}>{note.flag}</div>
            <div className={styles.tipBox}>
              <div className={styles.tipHead}>💡 TIP</div>
              <p>{p.tip}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.shareBar}>
        <button type="button" onClick={() => alert("공유 기능은 준비 중이에요.")}>
          공유하기
        </button>
        <button type="button" className={styles.primary} onClick={() => alert("제품 신청 기능은 준비 중이에요.")}>
          제품 신청하기
        </button>
      </div>
    </div>
  );
}

function CountryGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <>
      <div className={styles.topbar} />
      <div className={styles.hero}>
        <div className={styles.eyebrowScript}>Beauty Passport&apos;s</div>
        <h1>Style Note</h1>
        <p>
          여행 가는 나라를 골라보세요. 현지 화장법과 포인트 메이크업 팁,
          <br />
          어울리는 제품까지 한번에 알려드릴게요.
        </p>
      </div>
      <div className={styles.countryGrid}>
        {MAKEUP_STYLE_NOTES.map((c) => (
          <button key={c.id} type="button" className={styles.countryCard} onClick={() => onSelect(c.id)}>
            <div className={styles.thumb}>{c.flag}</div>
            <div className={styles.countryName}>
              {c.countryCode} · {c.country}
            </div>
            <div className={styles.countryCity}>{c.city}</div>
          </button>
        ))}
      </div>
      <div className={styles.footnote}>
        콘텐츠가 마음에 들었다면 저장하고 공유해보세요 🤍
        <br />
        나라는 계속 추가되고 있어요.
      </div>
    </>
  );
}

export function StyleNoteModal({
  countryCode,
  onClose,
}: {
  countryCode?: string | null;
  onClose: () => void;
}) {
  const initial = MAKEUP_STYLE_NOTES.find((n) => n.countryCode === countryCode?.toUpperCase()) ?? null;
  const [activeId, setActiveId] = useState<string | null>(initial?.id ?? null);
  const active = MAKEUP_STYLE_NOTES.find((n) => n.id === activeId) ?? null;

  return (
    <>
      <motion.div
        className="absolute inset-0 z-[70] bg-black/35"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-[71] max-h-[92%] overflow-y-auto rounded-t-[28px]"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className={`${styles.root} relative`}>
          <button type="button" className={`${styles.close} absolute right-4 top-3`} onClick={onClose} aria-label="닫기">
            ×
          </button>
          {active ? <CountryDetail note={active} onBack={() => setActiveId(null)} /> : <CountryGrid onSelect={setActiveId} />}
        </div>
      </motion.div>
    </>
  );
}
