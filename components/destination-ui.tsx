"use client";

import { useState } from "react";
import styles from "./destination.module.css";
import productsRaw from "@/data/products.json";
import { checkCosmeticCompliance } from "@/lib/compliance/check";
import type { ComplianceProduct } from "@/lib/compliance/types";
import { COUNTRIES, type Country, type City } from "@/lib/places";
import { COSMETICS } from "@/lib/products";

const COMPLIANCE_PRODUCTS = productsRaw as ComplianceProduct[];

/* ============================================================
   근처 뷰티 매장 추천 — beauty-passport-destination.html 원본 데모 데이터 그대로.
   (실제 목적지가 바뀌어도 이 매장/제품 목록 자체는 데모 예시로 고정)
============================================================ */
const SURVEY = { concerns: ["미백·톤", "수분", "진정"], ings: ["비타민C", "세라마이드", "나이아신아마이드"] };
const RECO_ING = [
  "히알루론산", "세라마이드", "스쿠알란", "센텔라(시카)", "마데카소사이드", "판테놀",
  "비타민C", "나이아신아마이드", "알부틴", "트라넥삼산", "레티놀", "펩타이드", "항산화제",
];
const CAUTION_ING = ["고농도 알코올", "강한 각질제거", "인공향료", "에센셜오일", "고농도 산", "무방비 햇볕 노출", "자외선 방치"];
const REGULATED: Record<string, string> = {
  하이드로퀴논: "국내에선 전문의약품 성분이라 화장품 형태로는 반입이 제한될 수 있어요. 개인 반입 수량·통관 기준 확인이 필요해요.",
};

type Store = { code: string; name: string; type: string; dist: string; x: number; y: number; tel: string; insta: string; web: string; q: string };
const STORES: Record<string, Store> = {
  s1: { code: "MK", name: "마츠모토키요시 신주쿠점", type: "드럭스토어", dist: "240m", x: 20, y: 34, tel: "+81-3-5321-6011", insta: "matsukiyococokara", web: "https://www.matsukiyo.co.jp", q: "マツモトキヨシ 新宿" },
  s2: { code: "DQ", name: "돈키호테 신주쿠점", type: "디스카운트", dist: "520m", x: 70, y: 26, tel: "+81-3-5291-9211", insta: "donki_donki_official", web: "https://www.donki.com", q: "ドンキホーテ 新宿" },
  s3: { code: "@C", name: "@cosme TOKYO 하라주쿠", type: "뷰티 편집숍", dist: "1.9km", x: 42, y: 60, tel: "+81-3-6712-6350", insta: "atcosme_tokyo", web: "https://www.cosme.net", q: "@cosme TOKYO 原宿" },
  s4: { code: "LF", name: "LOFT 시부야", type: "라이프스타일", dist: "2.3km", x: 82, y: 64, tel: "+81-3-3462-3807", insta: "loft_official", web: "https://www.loft.co.jp", q: "渋谷ロフト" },
  s5: { code: "AT", name: "ainz&tulpe 신주쿠", type: "드럭·편집", dist: "360m", x: 30, y: 74, tel: "+81-3-3350-3363", insta: "ainz_tulpe", web: "https://www.ainz-tulpe.jp", q: "アインズトルペ 新宿" },
  s6: { code: "WE", name: "웰시아약국 신주쿠", type: "드럭스토어", dist: "610m", x: 58, y: 44, tel: "+81-3-6274-8871", insta: "welcia_official", web: "https://www.welcia.co.jp", q: "ウエルシア 新宿" },
};
type SrcType = "o" | "b" | "g";
type Avail = { s: string; l: number; src: { t: SrcType; label: string; d: string }[] };
type Product = { id: string; brand: string; name: string; jp: string; c: string[]; i: string[]; y: number; av: Avail[]; image?: string };
const PRODUCTS: Product[] = [
  { id: "p1", brand: "HADA LABO", name: "고쿠준 히알루론산 로션", jp: "肌ラボ 極潤ヒアルロン液", c: ["수분"], i: ["히알루론산"], y: 990, image: "/assets/jp-products/hadalabo-gokujyun-lotion.jpg",
    av: [{ s: "s1", l: 90, src: [{ t: "o", label: "공식 취급", d: "2025.03" }, { t: "b", label: "여행 후기", d: "2025.02" }] }, { s: "s2", l: 86, src: [{ t: "b", label: "하울 후기", d: "2025.01" }] }] },
  { id: "p3", brand: "MELANO CC", name: "약용 비타민C 미용액", jp: "メラノCC 薬用しみ集中対策 美容液", c: ["미백·톤"], i: ["비타민C"], y: 1180, image: "/assets/jp-products/melanocc-vitaminc-essence.jpg",
    av: [{ s: "s1", l: 88, src: [{ t: "b", label: "여행 후기", d: "2025.02" }] }, { s: "s6", l: 74, src: [{ t: "g", label: "구글맵 리뷰", d: "2024.11" }] }] },
  { id: "p4", brand: "IHADA", name: "약용 밤 (고보습)", jp: "イハダ 薬用バーム 高保湿", c: ["진정"], i: ["판테놀"], y: 1540, image: "/assets/jp-products/ihada-medicated-balm.webp",
    av: [{ s: "s6", l: 86, src: [{ t: "o", label: "약국 취급", d: "2025.03" }, { t: "g", label: "구글맵 리뷰", d: "2025.01" }] }, { s: "s1", l: 64, src: [{ t: "b", label: "입고 언급", d: "2024.10" }] }] },
  { id: "p5", brand: "CURÉL", name: "인텐시브 모이스처 크림", jp: "キュレル 潤浸保湿 フェイスクリーム", c: ["수분", "진정"], i: ["세라마이드"], y: 2400, image: "/assets/jp-products/curel-moisture-cream.jpg",
    av: [{ s: "s1", l: 84, src: [{ t: "o", label: "공식 취급", d: "2025.02" }] }, { s: "s6", l: 78, src: [{ t: "g", label: "구글맵 리뷰", d: "2024.12" }] }] },
  { id: "p8", brand: "SABORINO", name: "아침 올인원 마스크", jp: "サボリーノ 目ざまシート", c: ["수분"], i: [], y: 1400, image: "/assets/jp-products/saborino-morning-mask.jpg",
    av: [{ s: "s4", l: 82, src: [{ t: "o", label: "매장 취급", d: "2025.02" }] }, { s: "s1", l: 76, src: [{ t: "b", label: "여행 후기", d: "2024.12" }] }] },
  { id: "p9", brand: "ANUA", name: "어성초 77 토너 (K뷰티)", jp: "アヌア ドクダミ77 トナー", c: ["진정", "트러블"], i: ["어성초"], y: 1900, image: "/assets/jp-products/anua-heartleaf-toner.jpg",
    av: [{ s: "s3", l: 84, src: [{ t: "o", label: "@cosme 취급", d: "2025.03" }, { t: "b", label: "여행 후기", d: "2025.01" }] }] },
  { id: "p12", brand: "ONE THING", name: "나이아신아마이드 토너", jp: "ワンシング ナイアシンアマイド トナー", c: ["미백·톤"], i: ["나이아신아마이드"], y: 1100, image: "/assets/jp-products/onething-niacinamide-toner.jpg",
    av: [{ s: "s3", l: 82, src: [{ t: "o", label: "@cosme 취급", d: "2025.02" }] }, { s: "s5", l: 70, src: [{ t: "g", label: "구글맵 리뷰", d: "2024.12" }] }] },
  { id: "p11", brand: "AMPLEUR", name: "럭셔리 화이트 컨센트레이트 HQ", jp: "アンプルール ラグジュアリーホワイト コンセントレートHQ", c: ["미백·톤"], i: ["하이드로퀴논"], y: 5500, image: "/assets/jp-products/ampleur-luxury-white-hq.jpg",
    av: [{ s: "s3", l: 80, src: [{ t: "o", label: "@cosme 취급", d: "2025.02" }, { t: "b", label: "여행 후기", d: "2025.01" }] }, { s: "s4", l: 66, src: [{ t: "g", label: "구글맵 리뷰", d: "2024.10" }] }] },
];

const NEED_CONCERN_OPTIONS = ["미백·톤", "수분", "진정", "트러블"];

function score(p: Product, concerns: string[]) {
  let m = 0;
  p.c.forEach((c) => { if (concerns.includes(c)) m++; });
  p.i.forEach((i) => { if (RECO_ING.includes(i)) m++; });
  return m;
}
const lc = (l: number) => (l >= 80 ? "h" : l >= 60 ? "m" : "l");
const lw = (l: number) => (l >= 80 ? "높음" : l >= 60 ? "보통" : "낮음");
const SL: Record<SrcType, string> = { o: "공식", b: "여행후기", g: "구글맵" };
function srcClass(t: SrcType) {
  return t === "o" ? styles.so : t === "b" ? styles.sb : styles.sg;
}
function srcUrl(t: SrcType, p: Product, s: Store) {
  if (t === "o") return s.web;
  if (t === "b") return "https://search.naver.com/search.naver?where=view&query=" + encodeURIComponent(`${p.brand} ${p.name} 후기`);
  if (t === "g") return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(s.q);
  return "#";
}
function regOf(p: Product) {
  for (const ing of p.i) if (REGULATED[ing]) return { ing, note: REGULATED[ing] };
  return null;
}
function fallbackCopy(text: string, cb: () => void) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.top = "-9999px";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
  } catch {
    /* 클립보드 미지원 브라우저 — 무시 */
  }
  document.body.removeChild(ta);
  cb();
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </svg>
  );
}
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
// 제품 실사진 — 없거나 로드 실패 시 이름 첫 글자 플레이스홀더로 폴백
function ProdThumb({ product }: { product: Product }) {
  const [err, setErr] = useState(false);
  if (!product.image || err) {
    return <div className={styles.rxThumb}>{product.name.charAt(0)}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={product.image} alt={product.name} onError={() => setErr(true)} className={styles.rxThumb} style={{ objectFit: "cover" }} />
  );
}

export function DestinationCareTab({
  country,
  city,
  onSelectDestination,
  recItems,
  destinationCountryCode,
  onShowMakeup,
  onCareArrival,
  onBackToJourney,
  orderedItems,
}: {
  country: Country | null;
  city: City | null;
  onSelectDestination: (countryCode: string, cityName: string) => void;
  recItems: { p: { id: string; brand: string } }[];
  destinationCountryCode: string | null;
  onShowMakeup: () => void;
  onCareArrival: () => void;
  // 제공되면 "여행 후 케어 처방받기" 버튼 왼쪽에 "돌아가기" 버튼을 반씩 나눠 보여준다.
  onBackToJourney?: () => void;
  orderedItems: { id: string; brand: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);
  const [fineOpen, setFineOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // 목록에서 ✕로 지운 제품 id (주문 목록은 그대로 두고, 이 화면에서만 숨김)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [needConcerns, setNeedConcerns] = useState<string[]>([]);
  // 주문 내역과 무관하게 직접 입력으로 추가한 "챙긴 제품"(자동완성으로 카탈로그에서 선택)
  const [extraPacked, setExtraPacked] = useState<{ id: string; brand: string; name: string }[]>([]);
  const [packInput, setPackInput] = useState("");

  function removePacked(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
    setExtraPacked((prev) => prev.filter((e) => e.id !== id));
  }
  function toggleNeed(c: string) {
    setNeedConcerns((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }
  const displayItems = [...orderedItems, ...extraPacked.filter((e) => !orderedItems.some((o) => o.id === e.id))].filter(
    (o) => !removedIds.has(o.id)
  );
  const packQuery = packInput.trim();
  const packSuggestions =
    packQuery.length > 0
      ? COSMETICS.filter(
          (c) => !displayItems.some((o) => o.id === c.id) && (c.name.includes(packQuery) || c.brand.includes(packQuery))
        ).slice(0, 6)
      : [];
  function addPacked(id: string, brand: string, name: string) {
    setExtraPacked((prev) => (prev.some((x) => x.id === id) ? prev : [...prev, { id, brand, name }]));
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPackInput("");
  }
  // 챙기지 않은 제품이 있거나 직접 고른 고민이 있으면 그 기준으로, 아니면 원래 데모 설문 기준으로 매칭.
  const effectiveConcerns = needConcerns.length > 0 ? needConcerns : SURVEY.concerns;

  const destLabel = city && country ? `${city.name} · ${country.name}` : null;

  const cityOptions = COUNTRIES.flatMap((c) => c.cities.map((ci) => ({ city: ci, country: c })));
  const f = filter.trim();
  const filtered = cityOptions.filter((o) => !f || o.city.name.includes(f) || o.country.name.includes(f));

  function selectOption(o: { city: City; country: Country }) {
    onSelectDestination(o.country.code, o.city.name);
    setOpen(false);
    setFilter("");
  }

  function copyJp(id: string, text: string) {
    const done = () => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1200);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  // ---- 근처 스토어 피드 (데모 데이터 매칭 로직 원본 그대로) ----
  type Scored = { p: Product; match: number; reg: { ing: string; note: string } | null; best: Avail };
  let list: Scored[] = PRODUCTS.map((p) => ({ p, match: score(p, effectiveConcerns), reg: regOf(p), best: null as unknown as Avail })).filter((x) => x.match > 0);
  list = list
    .map((x) => {
      let av = x.p.av.slice();
      if (storeId) {
        const hit = av.find((a) => a.s === storeId);
        if (!hit) return null;
        av = [hit, ...av.filter((a) => a.s !== storeId)];
      } else {
        av = [...av].sort((a, b) => b.l - a.l);
      }
      return { ...x, best: av[0] };
    })
    .filter((x): x is Scored => x !== null);
  list.sort((a, b) => b.match - a.match || b.best.l - a.best.l);
  const vis = list.slice(0, 6);
  list.forEach((x) => {
    if (x.reg && !vis.includes(x)) vis.push(x);
  });

  // ---- 반입 주의 배너: 이번 여행 실제 추천 제품 × 실제 반입규제 체크 로직 ----
  const flaggedReal = (recItems ?? [])
    .map(({ p }) => {
      const cp = COMPLIANCE_PRODUCTS.find((x) => x.cosmetic_id === p.id);
      if (!cp) return null;
      const result = checkCosmeticCompliance(cp.ingredients_inci, destinationCountryCode ?? "", {
        ingredientsComplete: cp.ingredients_complete,
        category: cp.category,
      });
      if (result.status === "high_risk" || result.status === "caution") {
        return { brand: p.brand, name: cp.display_name };
      }
      return null;
    })
    .filter((x): x is { brand: string; name: string } => x !== null);

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>
        어디를 여행중이신가요?
        <i className={styles.titleIco} />
      </h1>
      <div className={styles.subtitle}>Select your destination</div>

      <div className={styles.fieldLabel}>
        <div className={styles.l}>
          Country <span>· 나라</span>
        </div>
      </div>
      <div className={`${styles.search} ${open ? styles.open : ""}`}>
        <button type="button" className={styles.searchBox} onClick={() => setOpen((v) => !v)}>
          <SearchIcon className={styles.sc} />
          <div className={`${styles.txt} ${destLabel ? styles.filled : ""}`}>{destLabel ?? "나라 및 도시 검색"}</div>
          <ChevronIcon className={styles.chev} />
        </button>
        {open && (
          <div className={styles.dropdown}>
            <div className={styles.ddSearch}>
              <SearchIcon />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="도시 이름을 입력하세요" autoFocus />
            </div>
            <div className={styles.ddList}>
              {filtered.length === 0 && (
                <div className={styles.ddItem}>
                  <div className={styles.ci}>
                    <div className={styles.cn}>검색 결과 없음</div>
                  </div>
                </div>
              )}
              {filtered.map((o) => (
                <button key={o.country.code + o.city.name} type="button" className={styles.ddItem} onClick={() => selectOption(o)}>
                  <div className={styles.cc}>{o.country.flag}</div>
                  <div className={styles.ci}>
                    <div className={styles.cn}>{o.city.name}</div>
                    <div className={styles.co}>{o.country.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={styles.gpsBar}>
        <span className={styles.gpsChip}>
          <span className={styles.pulse} />
          GPS
        </span>
        <span className={styles.gpsLoc}>
          현재 위치 · {city?.name ?? "도쿄"} 근처 <span>(자동 감지)</span>
        </span>
      </div>
      <div className={styles.map}>
        <svg className={styles.grid} viewBox="0 0 300 140" preserveAspectRatio="none">
          <path d="M-10 48 Q90 28 150 60 T310 66" stroke="#D6D6DA" strokeWidth={9} fill="none" />
          <path d="M62 -10 Q82 70 42 150" stroke="#D6D6DA" strokeWidth={7} fill="none" />
          <path d="M232 -10 Q212 80 252 150" stroke="#DEDEE2" strokeWidth={7} fill="none" />
          <path d="M-10 106 Q120 92 200 114 T310 106" stroke="#DEDEE2" strokeWidth={6} fill="none" />
        </svg>
        <div className={styles.me} style={{ left: "45%", top: "50%" }}>
          <div className={styles.rg} />
          <div className={styles.c} />
        </div>
        {Object.entries(STORES).map(([id, s]) => (
          <button
            key={id}
            type="button"
            className={`${styles.pin} ${storeId === id ? styles.sel : ""}`}
            style={{ left: s.x + "%", top: s.y + "%" }}
            title={s.name}
            onClick={() => setStoreId((v) => (v === id ? null : id))}
          >
            <div className={styles.h}>
              <span>{s.code}</span>
            </div>
          </button>
        ))}
      </div>

      <div className={styles.packSec}>
        <div className={styles.recTitle}>내가 챙긴 제품</div>
        {displayItems.length > 0 ? (
          <>
            <div className={styles.recSub}>구매하신 제품 목록이에요. 빠진 제품은 아래에서 검색해 추가하고, 안 챙기신 건 ✕로 지워주세요.</div>
            <div className={styles.packList}>
              {displayItems.map((o) => (
                <div key={o.id} className={styles.packItem}>
                  <span>{o.brand} {o.name}</span>
                  <button type="button" aria-label="삭제" className={styles.packRemoveBtn} onClick={() => removePacked(o.id)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyNote}>주문한 제품이 없어요. 아래에서 직접 챙긴 제품을 검색해 추가해 보세요.</div>
        )}

        <div className={styles.packAdd}>
          <label className={styles.packAddLabel}>더 챙긴 제품이 있나요?</label>
          <input
            value={packInput}
            onChange={(e) => setPackInput(e.target.value)}
            placeholder="화장품 이름을 입력해 보세요"
            className={styles.packAddInput}
          />
          {packSuggestions.length > 0 && (
            <div className={styles.packSuggest}>
              {packSuggestions.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.packSuggestItem}
                  onClick={() => addPacked(p.id, p.brand, p.name)}
                >
                  <span className={styles.packSuggestName}>{p.name}</span>
                  <span className={styles.packSuggestBrand}>{p.brand}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.recTitle} style={{ marginTop: 18, fontSize: 15 }}>지금 필요한 게 있나요?</div>
        <div className={styles.recSub}>선택하면 아래 추천이 그 고민에 맞춰 바뀌어요. (다중 선택 가능)</div>
        <div className={styles.needChips}>
          {NEED_CONCERN_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.needChip} ${needConcerns.includes(c) ? styles.sel : ""}`}
              onClick={() => toggleNeed(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.recSec}>
        <div className={styles.recTitle}>이 성분, 여기서 채우세요</div>
        <div className={styles.recSub}>
          {needConcerns.length > 0
            ? `선택하신 '${needConcerns.join(", ")}' 고민에 맞춰 제품 속 주요 성분을 표시했어요.`
            : "BEAUTY PASSPORT에 맞춰 제품 속 주요 성분을 표시했어요."}
        </div>

        {flaggedReal.length > 0 && (
          <div className={styles.customs}>
            <div className={styles.ci2}>
              <i className={`${styles.icoSiren} ${styles.lg}`} />
            </div>
            <div>
              <div className={styles.ct}>이 여행지 반입 시 주의가 필요해요</div>
              <div className={styles.cd}>
                이번 여행 추천 제품 중 {flaggedReal.map((x) => x.brand).join(", ")} 제품은 성분 규제 확인이 필요해요.
              </div>
            </div>
          </div>
        )}

        <div className={styles.feedHead}>
          <div className={styles.n}>
            <b>{vis.length}</b> RX · 근처 스토어
          </div>
          <div className={styles.st}>설문 매칭순</div>
        </div>

        {vis.map(({ p, best, reg }, idx) => {
          const s = STORES[best.s];
          const L = lc(best.l);
          const krw = Math.round((p.y * 9.2) / 100) * 100;
          const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.q)}`;
          return (
            <article key={p.id} className={`${styles.rxCard} ${reg ? styles.flagged : ""}`}>
              <div className={styles.rxTop}>
                <span className={styles.rxNo}>Rx.{String(idx + 1).padStart(2, "0")}</span>
                <span className={styles.rxLine} />
                {reg ? (
                  <span className={styles.custBadge}>
                    <i className={`${styles.icoSiren} ${styles.sm}`} />
                    귀국 시 주의
                  </span>
                ) : (
                  <span className={styles.aiBadge}>
                    <span className={styles.sp} />
                    AI 추정
                  </span>
                )}
              </div>
              <div className={styles.rxProdrow}>
                <ProdThumb product={p} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.rxBrand}>{p.brand}</div>
                  <div className={styles.rxName}>{p.name}</div>
                  <div className={styles.rxJpRow}>
                    <a className={styles.rxJp} href={`https://www.google.com/search?q=${encodeURIComponent(p.jp)}`} target="_blank" rel="noopener noreferrer">
                      {p.jp}
                      <span className={styles.ext}>↗</span>
                    </a>
                    <button type="button" className={`${styles.rxCopy} ${copiedId === p.id ? styles.done : ""}`} onClick={() => copyJp(p.id, p.jp)} aria-label="현지어 제품명 복사">
                      {copiedId === p.id ? "✓" : <i className={styles.copyIco} />}
                    </button>
                  </div>
                  <div className={`${styles.rxPrice} ${styles.num}`}>
                    ¥{p.y.toLocaleString()} <span className={styles.krw}>≈ {krw.toLocaleString()}원</span>
                  </div>
                  <div className={styles.rxTags}>
                    {p.c.map((c) => (
                      <span key={c} className={`${styles.rtag} ${effectiveConcerns.includes(c) ? styles.match : ""}`}>
                        ✓ {c}
                      </span>
                    ))}
                    {p.i.map((i) => (
                      <span key={i} className={`${styles.rtag} ${REGULATED[i] ? styles.reg : CAUTION_ING.includes(i) ? styles.warn : RECO_ING.includes(i) ? styles.match : ""}`}>
                        #{i}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {reg && (
                <div className={styles.custNote}>
                  <span className={styles.ic}>
                    <i className={`${styles.icoSiren} ${styles.md}`} />
                  </span>
                  <span className={styles.nt}>
                    <b>귀국 시 주의가 필요해요.</b>
                    {reg.note}
                  </span>
                </div>
              )}

              <div className={styles.rxDiv} />
              <div className={styles.rxStore}>
                <div className={styles.sc}>{s.code}</div>
                <div style={{ flex: 1 }}>
                  <div className={styles.sn}>{s.name}</div>
                  <div className={styles.sm}>
                    {s.type} · <span className={styles.num}>{s.dist}</span>
                  </div>
                </div>
              </div>

              <div className={styles.gauge}>
                <div className={styles.gTop}>
                  <span className={styles.gLab}>
                    이 매장 취급 가능성 <span className={`${styles.gWord} ${styles["w" + L]}`}>{lw(best.l)}</span>
                  </span>
                  <span className={`${styles.gVal} ${styles.num}`}>
                    {best.l}
                    <span style={{ fontSize: 9 }}>%</span>
                  </span>
                </div>
                <div className={styles.gBar}>
                  <i className={styles["b" + L]} style={{ width: best.l + "%" }} />
                </div>
              </div>

              <div className={styles.srcs}>
                <div className={styles.srcLab}>추정 근거 · {best.src.length}건</div>
                <div className={styles.srcChips}>
                  {best.src.map((r, i) => (
                    <a key={i} className={`${styles.src} ${srcClass(r.t)}`} href={srcUrl(r.t, p, s)} target="_blank" rel="noopener noreferrer">
                      <i />
                      {SL[r.t]}·{r.label}
                      <span className={styles.d}>{r.d}</span>
                      <span className={styles.ext}>↗</span>
                    </a>
                  ))}
                </div>
              </div>

              <div className={styles.contacts}>
                <a className={styles.cbtn} href={maps} target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <span>길찾기</span>
                </a>
                <a className={styles.cbtn} href={`tel:${s.tel}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M4 4h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 2 6a2 2 0 0 1 2-2z" />
                  </svg>
                  <span>전화</span>
                </a>
                <a className={styles.cbtn} href={`https://instagram.com/${s.insta}`} target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="3" width="18" height="18" rx="5" />
                    <circle cx="12" cy="12" r="4" />
                    <circle cx="17.5" cy="6.5" r={0.6} fill="currentColor" />
                  </svg>
                  <span>인스타</span>
                </a>
                <a className={styles.cbtn} href={s.web} target="_blank" rel="noopener noreferrer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                  </svg>
                  <span>공식몰</span>
                </a>
              </div>
              <div className={styles.cHint}>방문 전 확인이 가장 정확해요 · 길찾기로 바로 이동</div>
            </article>
          );
        })}

        <div className={`${styles.fine} ${fineOpen ? styles.open : ""}`}>
          <button type="button" className={styles.fineT} onClick={() => setFineOpen((v) => !v)}>
            왜 실제와 다를 수 있나요 · 전체 안내
            <span className={styles.chev}>
              <ChevronIcon />
            </span>
          </button>
          <div className={styles.fineBody}>
            <div className={styles.in}>
              <h4>추천 정보 안내</h4>
              <p>제품·매장 정보는 AI가 여행 블로그, 공식몰, 구글맵 리뷰 등 공개 자료를 분석해 &apos;취급 가능성이 높은&apos; 항목을 추정한 결과예요. 실제 재고·가격·환율과 다를 수 있어요.</p>
              <h4>국내 반입 주의 안내</h4>
              <p>
                <i className={`${styles.icoSiren} ${styles.sm}`} /> 표시된 제품은 국내 화장품 기준상 사용이 제한되거나 반입 수량·통관 확인이 필요한 성분을 포함할 수 있어요. 최종 반입 가능 여부는 관세청·식약처 기준을 확인해 주세요. 본 안내는 참고용이며 통관 결과를 보장하지 않습니다.
              </p>
            </div>
          </div>
        </div>

        <div className={styles.bottomCta}>
          <button type="button" className={styles.btnLine} onClick={onShowMakeup}>
            🌸 이 나라의 뷰티 팁 확인하기
          </button>
          {onBackToJourney ? (
            <div className={styles.bottomCtaRow}>
              <button type="button" className={styles.btnLine} onClick={onBackToJourney}>
                ← 돌아가기
              </button>
              <button type="button" className={styles.btnDark} onClick={onCareArrival}>
                여행 후 케어 처방 받기 →
              </button>
            </div>
          ) : (
            <button type="button" className={styles.btnDark} onClick={onCareArrival}>
              여행 후 케어 처방 받기 →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
