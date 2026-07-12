// Open-Meteo (무료·무키) 예보 연동. 선택 도시 좌표 + 여행 날짜로 fetch.
// 예보 가능 범위를 벗어나거나 실패하면 null 을 반환 → 호출측에서 계절 기본값으로 대체.

export type DailyWx = { dateISO: string; temp: number; humidity: number; uv: number; dust: number; code: number };
export type WeatherResult = { temp: number; humidity: number; uv: number; dust: number; daily: DailyWx[] };

const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export async function fetchWeather(
  lat: number,
  lon: number,
  start: string,
  end: string
): Promise<WeatherResult | null> {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,uv_index_max,weather_code&hourly=relative_humidity_2m&timezone=auto` +
      `&start_date=${start}&end_date=${end}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const dTime: string[] = j?.daily?.time ?? [];
    if (!dTime.length) return null;
    const tmax: number[] = j.daily.temperature_2m_max ?? [];
    const uvmax: number[] = j.daily.uv_index_max ?? [];
    const wcode: number[] = j.daily.weather_code ?? [];

    // 시간별 습도 → 날짜별 평균
    const hTime: string[] = j?.hourly?.time ?? [];
    const hHum: number[] = j?.hourly?.relative_humidity_2m ?? [];
    const humByDay: Record<string, { sum: number; n: number }> = {};
    hTime.forEach((t, i) => {
      const d = t.slice(0, 10);
      (humByDay[d] ??= { sum: 0, n: 0 });
      if (hHum[i] != null) { humByDay[d].sum += hHum[i]; humByDay[d].n++; }
    });

    // 미세먼지(pm2.5) — 별도 대기질 API (실패해도 무시)
    const pmByDay: Record<string, number> = {};
    try {
      const aqRes = await fetch(
        `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
          `&hourly=pm2_5&timezone=auto&start_date=${start}&end_date=${end}`
      );
      if (aqRes.ok) {
        const aj = await aqRes.json();
        const at: string[] = aj?.hourly?.time ?? [];
        const ap: number[] = aj?.hourly?.pm2_5 ?? [];
        const acc: Record<string, { s: number; n: number }> = {};
        at.forEach((t, i) => {
          const d = t.slice(0, 10);
          (acc[d] ??= { s: 0, n: 0 });
          if (ap[i] != null) { acc[d].s += ap[i]; acc[d].n++; }
        });
        Object.entries(acc).forEach(([d, v]) => (pmByDay[d] = v.n ? v.s / v.n : 0));
      }
    } catch {
      /* AQI 실패 무시 */
    }

    const daily: DailyWx[] = dTime.map((d, i) => ({
      dateISO: d,
      temp: Math.round(tmax[i] ?? 0),
      humidity: humByDay[d] && humByDay[d].n ? Math.round(humByDay[d].sum / humByDay[d].n) : 60,
      uv: Math.round(uvmax[i] ?? 0),
      dust: pmByDay[d] != null ? Math.round(pmByDay[d]) : 0,
      code: wcode[i] ?? 1,
    }));

    return {
      temp: Math.round(avg(daily.map((d) => d.temp))),
      humidity: Math.round(avg(daily.map((d) => d.humidity))),
      uv: Math.round(avg(daily.map((d) => d.uv))),
      dust: Math.round(avg(daily.map((d) => d.dust))),
      daily,
    };
  } catch {
    return null;
  }
}
