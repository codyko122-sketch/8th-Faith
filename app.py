# -*- coding: utf-8 -*-
"""
Beauty Passport — 여행지 맞춤 스킨케어 프로토타입
시나리오 2. Global Beauty

기능
  - 피부 설문(피부타입 · 고민 · 여행지 · 여행일수)
  - 여행지 기후 데이터 연동 + AI 스타일 서머리
  - 피부 이슈 지수 + 날씨 캘린더(더운날/습한날/미세먼지 이모지)
  - 맞춤 스킨케어 루틴 추천
  - 소용량 맞춤 화장품 신청/배송
  - 제품 성분 설명 및 검색

실행
  pip install -r requirements.txt
  python app.py
  → http://127.0.0.1:5000
"""

from datetime import date, timedelta
import random

from flask import Flask, render_template_string, request, redirect, url_for

app = Flask(__name__)

# --------------------------------------------------------------------------
# 데이터: 여행지 기후 프로파일
#   temp   : 평균 최고기온(℃)          humidity : 평균 습도(%)
#   uv     : UV 지수(0~11+)             dust     : 미세먼지 지수(0~150+)
# 실제 서비스에서는 여기를 실시간 날씨/미세먼지 API 연동으로 교체하면 됩니다.
# --------------------------------------------------------------------------
DESTINATIONS = {
    "서울": {"temp": 22, "humidity": 60, "uv": 6, "dust": 78, "tag": "온대"},
    "도쿄": {"temp": 24, "humidity": 68, "uv": 7, "dust": 45, "tag": "온난습윤"},
    "방콕": {"temp": 34, "humidity": 82, "uv": 11, "dust": 60, "tag": "고온다습"},
    "싱가포르": {"temp": 32, "humidity": 84, "uv": 11, "dust": 40, "tag": "열대"},
    "파리": {"temp": 19, "humidity": 55, "uv": 5, "dust": 30, "tag": "서안해양"},
    "두바이": {"temp": 40, "humidity": 45, "uv": 11, "dust": 95, "tag": "사막"},
    "뉴욕": {"temp": 21, "humidity": 58, "uv": 6, "dust": 42, "tag": "온대"},
    "제주": {"temp": 23, "humidity": 72, "uv": 7, "dust": 35, "tag": "해양성"},
    "베이징": {"temp": 26, "humidity": 50, "uv": 7, "dust": 120, "tag": "건조/황사"},
    "발리": {"temp": 31, "humidity": 80, "uv": 11, "dust": 38, "tag": "열대"},
}

# --------------------------------------------------------------------------
# 데이터: 소용량 맞춤 제품 카탈로그
# --------------------------------------------------------------------------
PRODUCTS = [
    {
        "id": "cleanser-mild",
        "name": "저자극 젤 클렌저 (30ml)",
        "step": "클렌징",
        "ingredients": ["코카미도프로필베타인", "판테놀", "알로에베라추출물"],
        "for_types": ["건성", "민감성", "복합성"],
        "for_concerns": ["건조", "홍조", "민감"],
        "desc": "약산성 세정 성분으로 여행 중 수분 손실을 최소화합니다.",
    },
    {
        "id": "cleanser-clay",
        "name": "클레이 딥클렌저 (30ml)",
        "step": "클렌징",
        "ingredients": ["카올린", "살리실산", "티트리오일"],
        "for_types": ["지성", "복합성"],
        "for_concerns": ["여드름", "피지", "모공"],
        "desc": "고온다습 환경의 과잉 피지와 미세먼지를 흡착 세정합니다.",
    },
    {
        "id": "toner-hydra",
        "name": "히알루론 수분 토너 (30ml)",
        "step": "토너",
        "ingredients": ["히알루론산", "베타글루칸", "글리세린"],
        "for_types": ["건성", "복합성", "민감성"],
        "for_concerns": ["건조", "민감"],
        "desc": "건조한 기내·사막 기후에서 각질층 수분을 즉시 보충합니다.",
    },
    {
        "id": "serum-cica",
        "name": "시카 진정 세럼 (15ml)",
        "step": "세럼",
        "ingredients": ["센텔라아시아티카추출물", "마데카소사이드", "판테놀"],
        "for_types": ["민감성", "건성", "복합성"],
        "for_concerns": ["홍조", "민감", "트러블"],
        "desc": "환경 변화로 인한 붉은기와 자극을 빠르게 가라앉힙니다.",
    },
    {
        "id": "serum-niacin",
        "name": "나이아신 브라이트 세럼 (15ml)",
        "step": "세럼",
        "ingredients": ["나이아신아마이드", "아연", "비타민C유도체"],
        "for_types": ["지성", "복합성", "건성"],
        "for_concerns": ["색소침착", "피지", "모공"],
        "desc": "강한 자외선 지역의 색소 침착과 톤 불균형을 케어합니다.",
    },
    {
        "id": "cream-barrier",
        "name": "세라마이드 배리어 크림 (20ml)",
        "step": "크림",
        "ingredients": ["세라마이드", "스쿠알란", "시어버터"],
        "for_types": ["건성", "민감성", "복합성"],
        "for_concerns": ["건조", "민감"],
        "desc": "피부 장벽을 재건해 기후 스트레스에 대한 저항력을 높입니다.",
    },
    {
        "id": "cream-gel",
        "name": "오일프리 수분 젤크림 (20ml)",
        "step": "크림",
        "ingredients": ["히알루론산", "판테놀", "알란토인"],
        "for_types": ["지성", "복합성"],
        "for_concerns": ["피지", "여드름"],
        "desc": "습한 기후에서 끈적임 없이 가볍게 수분을 잡아줍니다.",
    },
    {
        "id": "spf-daily",
        "name": "데일리 선크림 SPF50+ (15ml)",
        "step": "자외선차단",
        "ingredients": ["징크옥사이드", "타이타늄다이옥사이드", "나이아신아마이드"],
        "for_types": ["건성", "지성", "복합성", "민감성"],
        "for_concerns": ["색소침착", "민감"],
        "desc": "UV 지수가 높은 여행지 필수 아이템. 무기자차 베이스.",
    },
]

SKIN_TYPES = ["건성", "지성", "복합성", "민감성"]
CONCERNS = ["여드름", "홍조", "건조", "색소침착", "피지", "모공", "민감", "트러블"]

# --------------------------------------------------------------------------
# 로직
# --------------------------------------------------------------------------
def build_calendar(dest, days):
    """여행 일수만큼 일별 날씨/미세먼지 이모지 캘린더 생성.
    기후 프로파일을 기준으로 현실적인 범위 내에서 일별 값을 생성합니다."""
    profile = DESTINATIONS.get(dest, {"temp": 24, "humidity": 60, "uv": 6, "dust": 50})
    rng = random.Random(hash((dest, days)) & 0xFFFFFFFF)
    cal = []
    start = date.today()
    for i in range(days):
        d = start + timedelta(days=i)
        temp = profile["temp"] + rng.randint(-3, 3)
        humidity = min(100, max(10, profile["humidity"] + rng.randint(-8, 8)))
        dust = max(0, profile["dust"] + rng.randint(-20, 20))

        emojis = []
        if temp >= 30:
            emojis.append(("🔥", "더운 날"))
        elif temp <= 15:
            emojis.append(("❄️", "쌀쌀함"))
        else:
            emojis.append(("☀️", "온화함"))
        if humidity >= 75:
            emojis.append(("💧", "습한 날"))
        elif humidity <= 35:
            emojis.append(("🌵", "건조함"))
        if dust >= 100:
            emojis.append(("😷", "미세먼지 나쁨"))
        elif dust >= 60:
            emojis.append(("🌫️", "미세먼지 보통"))

        cal.append({
            "date": d.strftime("%m/%d"),
            "weekday": "월화수목금토일"[d.weekday()],
            "temp": temp,
            "humidity": humidity,
            "dust": dust,
            "emojis": emojis,
        })
    return cal


def skin_issue_index(dest, skin_type, concerns):
    """여행지 환경 × 피부 특성을 조합한 피부 이슈 지수(0~100)와 코멘트."""
    p = DESTINATIONS.get(dest, {"temp": 24, "humidity": 60, "uv": 6, "dust": 50})
    score = 20
    notes = []

    if p["humidity"] >= 75:
        if skin_type in ("지성", "복합성"):
            score += 25
            notes.append("높은 습도 + 지성/복합성 → 피지·트러블 주의")
        else:
            score += 8
    if p["humidity"] <= 40:
        if skin_type in ("건성", "민감성"):
            score += 25
            notes.append("건조한 기후 + 건성/민감성 → 수분 장벽 손상 주의")
        else:
            score += 10
    if p["uv"] >= 9:
        score += 20
        notes.append(f"UV 지수 {p['uv']} → 색소 침착·광노화 위험 높음")
    if p["dust"] >= 100:
        score += 20
        notes.append(f"미세먼지 지수 {p['dust']} → 모공 막힘·자극 주의")
    elif p["dust"] >= 60:
        score += 10

    if "여드름" in concerns or "트러블" in concerns:
        score += 8
    if "홍조" in concerns or "민감" in concerns:
        score += 6

    score = min(100, score)
    if score >= 70:
        level = ("높음", "#e5484d")
    elif score >= 45:
        level = ("보통", "#f2a20b")
    else:
        level = ("낮음", "#30a46c")
    if not notes:
        notes.append("전반적으로 피부에 우호적인 환경입니다.")
    return score, level, notes


def recommend_products(skin_type, concerns):
    """피부타입·고민에 맞는 소용량 제품을 스텝별로 추천."""
    scored = []
    for p in PRODUCTS:
        s = 0
        if skin_type in p["for_types"]:
            s += 2
        s += sum(1 for c in concerns if c in p["for_concerns"])
        if s > 0:
            scored.append((s, p))
    scored.sort(key=lambda x: -x[0])

    # 스텝별로 가장 점수 높은 제품 하나씩 (루틴 구성)
    step_order = ["클렌징", "토너", "세럼", "크림", "자외선차단"]
    routine = []
    used = set()
    for step in step_order:
        for s, p in scored:
            if p["step"] == step and p["id"] not in used:
                routine.append(p)
                used.add(p["id"])
                break
    return routine


# --------------------------------------------------------------------------
# 템플릿 (공통 레이아웃 + 페이지)
# --------------------------------------------------------------------------
BASE = """
<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Beauty Passport</title>
<style>
  :root{
    --bg:#fbf7f4; --ink:#2a2320; --muted:#8a7d75; --line:#ece3dc;
    --accent:#c8795b; --accent-dark:#a85f43; --card:#ffffff;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo",sans-serif;
       background:var(--bg);color:var(--ink);line-height:1.6}
  a{color:inherit;text-decoration:none}
  header{position:sticky;top:0;z-index:10;background:rgba(251,247,244,.9);
         backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
  .nav{max-width:860px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;gap:20px}
  .brand{font-weight:700;letter-spacing:.5px;font-size:18px}
  .brand span{color:var(--accent)}
  .nav .links{margin-left:auto;display:flex;gap:18px;font-size:14px;color:var(--muted)}
  .nav .links a:hover{color:var(--accent)}
  .wrap{max-width:860px;margin:0 auto;padding:32px 24px 64px}
  h1{font-size:30px;margin:0 0 8px;letter-spacing:-.5px}
  h2{font-size:20px;margin:32px 0 12px}
  .sub{color:var(--muted);margin:0 0 24px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:24px;margin:16px 0}
  .btn{display:inline-block;background:var(--accent);color:#fff;padding:13px 24px;border-radius:999px;
       font-weight:600;border:none;cursor:pointer;font-size:15px;transition:.15s}
  .btn:hover{background:var(--accent-dark)}
  label{display:block;font-weight:600;margin:18px 0 8px;font-size:14px}
  select,input[type=number],input[type=text]{width:100%;padding:12px 14px;border:1px solid var(--line);
       border-radius:10px;font-size:15px;background:#fff;font-family:inherit}
  .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
  .chip input{position:absolute;opacity:0}
  .chip span{display:inline-block;padding:8px 14px;border:1px solid var(--line);border-radius:999px;
       cursor:pointer;font-size:14px;background:#fff}
  .chip input:checked + span{background:var(--accent);color:#fff;border-color:var(--accent)}
  .hero{background:linear-gradient(135deg,#c8795b,#e0a988);color:#fff;border-radius:20px;padding:40px 32px}
  .hero h1{font-size:34px}
  .hero p{opacity:.95;max-width:520px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .index-bar{height:14px;border-radius:999px;background:var(--line);overflow:hidden;margin:10px 0}
  .index-bar > div{height:100%}
  .cal{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px;margin-top:8px}
  .day{border:1px solid var(--line);border-radius:12px;padding:10px;text-align:center;background:#fff}
  .day .d{font-weight:700;font-size:13px}
  .day .e{font-size:22px;margin:6px 0;line-height:1.2}
  .day .m{font-size:11px;color:var(--muted)}
  .step{display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--line)}
  .step:last-child{border-bottom:none}
  .step .no{flex:0 0 34px;height:34px;border-radius:50%;background:var(--accent);color:#fff;
       display:flex;align-items:center;justify-content:center;font-weight:700}
  .tag{display:inline-block;font-size:12px;color:var(--muted);background:#f3ece7;
       padding:2px 10px;border-radius:999px;margin-right:6px}
  .muted{color:var(--muted);font-size:14px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{padding:10px;border-bottom:1px solid var(--line);text-align:left;font-size:14px}
  th{color:var(--muted);font-weight:600}
  .footer{max-width:860px;margin:0 auto;padding:24px;color:var(--muted);font-size:13px}
  @media(max-width:560px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<header><div class="nav">
  <a class="brand" href="{{ url_for('home') }}">Beauty <span>Passport</span></a>
  <div class="links">
    <a href="{{ url_for('survey') }}">진단 시작</a>
    <a href="{{ url_for('ingredients') }}">성분 검색</a>
  </div>
</div></header>
<div class="wrap">{{ body|safe }}</div>
<div class="footer">Beauty Passport · 시나리오 2 Global Beauty · 프로토타입</div>
</body></html>
"""


def page(body):
    return render_template_string(BASE, body=body)


# --------------------------------------------------------------------------
# 라우트
# --------------------------------------------------------------------------
@app.route("/")
def home():
    body = """
    <div class="hero">
      <h1>여행지 맞춤 스킨케어, 여권처럼 챙기세요</h1>
      <p>바쁜 일정, 잦은 출장. 여행지 기후가 바뀔 때마다 피부는 시행착오를 겪습니다.
         내 피부 데이터와 여행 맥락을 결합해 <b>딱 필요한 만큼의 소용량 맞춤 루틴</b>을 설계해 드립니다.</p>
      <p style="margin-top:22px"><a class="btn" href="{url}">1분 피부 진단 시작 →</a></p>
    </div>
    <div class="grid">
      <div class="card"><h2 style="margin-top:0">🌦️ 기후 서머리</h2>
        <p class="muted">목적지의 기온·습도·자외선·미세먼지를 분석해 피부 이슈 지수로 요약합니다.</p></div>
      <div class="card"><h2 style="margin-top:0">📅 날씨 캘린더</h2>
        <p class="muted">여행 일정에 맞춰 더운 날·습한 날·미세먼지를 한눈에 보여줍니다.</p></div>
      <div class="card"><h2 style="margin-top:0">🧴 소용량 맞춤 키트</h2>
        <p class="muted">여행 일수에 맞춘 소용량 구성으로 낭비 없이 신청·배송받으세요.</p></div>
      <div class="card"><h2 style="margin-top:0">🔍 성분 케어</h2>
        <p class="muted">내 고민에 맞는 성분을 검색하고 이유까지 확인할 수 있습니다.</p></div>
    </div>
    """.format(url=url_for("survey"))
    return page(body)


@app.route("/survey")
def survey():
    dests = "".join(f'<option value="{d}">{d} ({v["tag"]})</option>'
                    for d, v in DESTINATIONS.items())
    types = "".join(
        f'<label class="chip"><input type="radio" name="skin_type" value="{t}"'
        f'{" checked" if i == 0 else ""}><span>{t}</span></label>'
        for i, t in enumerate(SKIN_TYPES))
    concerns = "".join(
        f'<label class="chip"><input type="checkbox" name="concerns" value="{c}">'
        f'<span>{c}</span></label>' for c in CONCERNS)
    body = f"""
    <h1>피부 진단</h1>
    <p class="sub">피부 정보와 여행 계획을 입력하면 맞춤 루틴과 기후 리포트를 만들어 드립니다.</p>
    <form class="card" method="post" action="{url_for('result')}">
      <label>피부 타입</label>
      <div class="chips">{types}</div>

      <label>피부 고민 (복수 선택)</label>
      <div class="chips">{concerns}</div>

      <div class="grid">
        <div><label>여행지</label><select name="dest">{dests}</select></div>
        <div><label>여행 일수</label><input type="number" name="days" min="1" max="30" value="5"></div>
      </div>
      <p style="margin-top:24px"><button class="btn" type="submit">맞춤 리포트 생성 →</button></p>
    </form>
    """
    return page(body)


@app.route("/result", methods=["POST"])
def result():
    skin_type = request.form.get("skin_type", "복합성")
    concerns = request.form.getlist("concerns")
    dest = request.form.get("dest", "서울")
    try:
        days = max(1, min(30, int(request.form.get("days", 5))))
    except ValueError:
        days = 5

    p = DESTINATIONS.get(dest, DESTINATIONS["서울"])
    score, (level_txt, level_col), notes = skin_issue_index(dest, skin_type, concerns)
    cal = build_calendar(dest, days)
    routine = recommend_products(skin_type, concerns)

    # AI 스타일 서머리
    summary = (f"{dest}은(는) {p['tag']} 기후로 평균 최고 {p['temp']}℃, 습도 {p['humidity']}%, "
               f"UV {p['uv']}, 미세먼지 {p['dust']} 수준입니다. "
               f"{skin_type} 피부"
               + (f"·{'/'.join(concerns)} 고민" if concerns else "")
               + f"을(를) 고려할 때 {days}일 여행 동안 피부 이슈 발생 가능성은 "
               f"'{level_txt}'으로 예상됩니다.")

    notes_html = "".join(f"<li>{n}</li>" for n in notes)
    cal_html = "".join(
        f'<div class="day"><div class="d">{c["date"]}({c["weekday"]})</div>'
        f'<div class="e">{"".join(e for e, _ in c["emojis"])}</div>'
        f'<div class="m">{c["temp"]}℃ · 습도{c["humidity"]}%</div></div>'
        for c in cal)

    routine_html = ""
    for i, prod in enumerate(routine, 1):
        ings = "".join(f'<span class="tag">{ing}</span>' for ing in prod["ingredients"])
        routine_html += (
            f'<div class="step"><div class="no">{i}</div><div>'
            f'<b>{prod["step"]} · {prod["name"]}</b><br>'
            f'<span class="muted">{prod["desc"]}</span><br>{ings}</div></div>')

    kit_items = "".join(f'<li>{pr["name"]}</li>' for pr in routine)
    conc_txt = ", ".join(concerns) if concerns else "없음"

    body = f"""
    <h1>{dest} 피부 리포트</h1>
    <p class="sub">{skin_type} · 고민: {conc_txt} · {days}일 일정</p>

    <div class="card">
      <h2 style="margin-top:0">🌦️ 기후 AI 서머리</h2>
      <p>{summary}</p>
      <div class="grid" style="margin-top:12px">
        <div class="muted">🌡️ 평균기온 <b>{p['temp']}℃</b></div>
        <div class="muted">💧 습도 <b>{p['humidity']}%</b></div>
        <div class="muted">☀️ UV 지수 <b>{p['uv']}</b></div>
        <div class="muted">😷 미세먼지 <b>{p['dust']}</b></div>
      </div>
    </div>

    <div class="card">
      <h2 style="margin-top:0">📊 피부 이슈 지수</h2>
      <div style="display:flex;align-items:baseline;gap:10px">
        <span style="font-size:38px;font-weight:800;color:{level_col}">{score}</span>
        <span style="color:{level_col};font-weight:700">{level_txt}</span>
      </div>
      <div class="index-bar"><div style="width:{score}%;background:{level_col}"></div></div>
      <ul class="muted" style="margin:8px 0 0">{notes_html}</ul>
    </div>

    <div class="card">
      <h2 style="margin-top:0">📅 여행 날씨 캘린더</h2>
      <p class="muted">🔥더운날 ❄️쌀쌀 ☀️온화 💧습함 🌵건조 😷미세먼지나쁨 🌫️보통</p>
      <div class="cal">{cal_html}</div>
    </div>

    <div class="card">
      <h2 style="margin-top:0">🧴 맞춤 스킨케어 루틴</h2>
      {routine_html}
    </div>

    <form class="card" method="post" action="{url_for('apply')}">
      <h2 style="margin-top:0">📦 소용량 맞춤 키트 신청</h2>
      <p class="muted">{days}일 일정에 맞춘 소용량 구성입니다.</p>
      <ul>{kit_items}</ul>
      <input type="hidden" name="dest" value="{dest}">
      <input type="hidden" name="days" value="{days}">
      <label>배송 받을 이름</label><input type="text" name="who" placeholder="예: 고민순" required>
      <label>배송지</label><input type="text" name="addr" placeholder="주소를 입력하세요" required>
      <p style="margin-top:20px"><button class="btn" type="submit">키트 신청하기 →</button></p>
    </form>
    """
    return page(body)


@app.route("/apply", methods=["POST"])
def apply():
    who = request.form.get("who", "고객")
    addr = request.form.get("addr", "")
    dest = request.form.get("dest", "")
    days = request.form.get("days", "")
    eta = (date.today() + timedelta(days=2)).strftime("%Y년 %m월 %d일")
    body = f"""
    <div class="card" style="text-align:center;padding:48px 24px">
      <div style="font-size:52px">✅</div>
      <h1>신청이 완료되었습니다</h1>
      <p class="sub">{who}님의 {dest} {days}일 맞춤 키트를 준비합니다.</p>
      <p><b>배송 예정일: {eta}</b><br><span class="muted">{addr}</span></p>
      <p style="margin-top:24px">
        <a class="btn" href="{url_for('home')}">홈으로</a>
      </p>
    </div>
    """
    return page(body)


@app.route("/ingredients")
def ingredients():
    q = request.args.get("q", "").strip()
    rows = ""
    matched = 0
    for pr in PRODUCTS:
        hit = (not q) or (q in pr["name"]) or any(q in ing for ing in pr["ingredients"]) \
              or any(q in c for c in pr["for_concerns"])
        if hit:
            matched += 1
            ings = ", ".join(pr["ingredients"])
            rows += (f"<tr><td><b>{pr['name']}</b><br><span class='muted'>{pr['desc']}</span></td>"
                     f"<td>{ings}</td><td>{', '.join(pr['for_concerns'])}</td></tr>")
    if not rows:
        rows = '<tr><td colspan="3" class="muted">검색 결과가 없습니다.</td></tr>'

    body = f"""
    <h1>성분 검색</h1>
    <p class="sub">제품명·성분명·고민 키워드로 검색해 보세요. (예: 나이아신, 여드름, 세라마이드)</p>
    <form class="card" method="get" action="{url_for('ingredients')}"
          style="display:flex;gap:10px;align-items:center">
      <input type="text" name="q" value="{q}" placeholder="성분 또는 고민 키워드">
      <button class="btn" type="submit">검색</button>
    </form>
    <div class="card">
      <p class="muted">{matched}개 제품</p>
      <table>
        <tr><th>제품</th><th>주요 성분</th><th>추천 고민</th></tr>
        {rows}
      </table>
    </div>
    """
    return page(body)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
