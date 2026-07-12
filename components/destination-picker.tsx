"use client";

import { useState } from "react";
import type { Country } from "@/lib/places";

// 여행지 선택: 나라 자동완성 검색 → 나라 선택 시 추천 도시 칩.
// 목록에 없으면 '직접 입력'으로 나라·도시 자유 입력(기존 동작 유지).
export function DestinationPicker({
  countries,
  countryCode,
  cityName,
  useCustom,
  customCountry,
  customCity,
  setCountryCode,
  setCityName,
  setUseCustom,
  setCustomCountry,
  setCustomCity,
}: {
  countries: Country[];
  countryCode: string | null;
  cityName: string | null;
  useCustom: boolean;
  customCountry: string;
  customCity: string;
  setCountryCode: (v: string | null) => void;
  setCityName: (v: string | null) => void;
  setUseCustom: (v: boolean) => void;
  setCustomCountry: (v: string) => void;
  setCustomCity: (v: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const selected = countries.find((c) => c.code === countryCode) ?? null;
  const q = query.trim();
  const matches = q
    ? countries.filter((c) => c.name.includes(q) || c.cities.some((ci) => ci.name.includes(q)))
    : countries;
  const showList = focused && !selected && matches.length > 0;

  const fieldCls =
    "w-full rounded-[13px] border border-transparent bg-[#f4f4f5] px-4 py-[15px] font-sans text-sm text-[#0a0a0a] outline-none transition placeholder:text-[#9ca3af] focus:border-[#0a0a0a] focus:bg-white";

  function pickCountry(code: string) {
    setUseCustom(false);
    setCountryCode(code);
    setCityName(null);
    setQuery("");
    setFocused(false);
  }
  function clearCountry() {
    setCountryCode(null);
    setCityName(null);
    setQuery("");
  }
  function toggleCustom() {
    setUseCustom(!useCustom);
    setCountryCode(null);
    setCityName(null);
    setQuery("");
  }

  return (
    <div>
      {/* 라벨 + 모드 전환 */}
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-extrabold text-[#0a0a0a]">
          Country <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· 나라</span>
        </label>
        <button type="button" onClick={toggleCustom} className="font-sans text-xs font-bold text-[#ec1c24]">
          {useCustom ? "목록에서 선택" : "직접 입력"}
        </button>
      </div>

      {useCustom ? (
        /* 직접 입력: 목록에 없는 나라·도시 */
        <div className="mt-2 flex flex-col gap-2.5">
          <input value={customCountry} onChange={(e) => setCustomCountry(e.target.value)} placeholder="나라 (예: 포르투갈)" className={fieldCls} />
          <input value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="도시 (예: 리스본)" className={fieldCls} />
        </div>
      ) : selected ? (
        /* 나라 선택됨 → 추천 도시 */
        <>
          <div className="mt-2 flex items-center gap-2 rounded-[13px] border-[1.5px] border-[#0a0a0a] bg-white px-4 py-[13px]">
            <span className="text-xl">{selected.flag}</span>
            <span className="text-[15px] font-extrabold text-[#0a0a0a]">{selected.name}</span>
            <button type="button" onClick={clearCountry} className="ml-auto font-sans text-xs font-bold text-[#ec1c24]">
              변경
            </button>
          </div>

          <div className="mt-4">
            <div className="text-[13px] font-extrabold text-[#0a0a0a]">
              City <span className="ml-1 font-sans text-[12px] font-medium text-[#9ca3af]">· {selected.name}의 추천 도시</span>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {selected.cities.map((ci) => {
                const on = cityName === ci.name;
                return (
                  <button
                    key={ci.name}
                    type="button"
                    onClick={() => setCityName(ci.name)}
                    className={`rounded-full border px-4 py-2 font-sans text-[13px] font-semibold transition ${
                      on ? "border-[#0a0a0a] bg-[#0a0a0a] text-white" : "border-[#e7e7ea] bg-white text-[#3f3f46] active:bg-[#f4f4f5]"
                    }`}
                  >
                    {ci.name}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* 나라 검색 (자동완성) */
        <div className="relative mt-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            placeholder="나라를 검색하세요 (예: 대만, 포르투갈)"
            className={fieldCls}
            autoComplete="off"
          />
          {showList && (
            <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-[13px] border border-[#e7e7ea] bg-white shadow-[0_10px_30px_rgba(20,30,50,0.12)]">
              {matches.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickCountry(c.code);
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-[#f4f4f5] px-4 py-3 text-left font-sans text-sm text-[#0a0a0a] first:border-t-0 hover:bg-[#f4f4f5]"
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="font-semibold">{c.name}</span>
                  <span className="ml-auto text-[11px] text-[#9ca3af]">도시 {c.cities.length}</span>
                </button>
              ))}
            </div>
          )}
          <p className="mt-1.5 font-sans text-[11px] text-[#9ca3af]">목록에 없으면 오른쪽 위 ‘직접 입력’으로 추가할 수 있어요.</p>
        </div>
      )}
    </div>
  );
}
