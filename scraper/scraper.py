#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
فرصتك - جالب الفرص التلقائي (مصدران)
1) emploi-public.ma  -> API ووردبريس  -> قطاع: عمومي
2) marocannonces.com -> صفحة Offres emploi (309) -> قطاع: خاص
يكتب النتيجة في data/opportunities.json
"""
import json, re, hashlib, datetime, html, os
from urllib.request import urlopen, Request

OUT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "opportunities.json")

# حذف إعلانات القطاع الخاص الأقدم من هذا العدد من الأيام
PRIVATE_MAX_AGE_DAYS = 30

CITIES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fes", "Meknes",
          "Oujda", "Kenitra", "Tetouan", "Mohammedia", "Sale", "Beni Mellal",
          "Nador", "Safi", "El Jadida", "Settat", "Berrechid", "Tifelt",
          "Khouribga", "Ouarzazate", "Essaouira", "Laayoune", "Dakhla"]

MA_BASE = "https://www.marocannonces.com"

def clean_html(text):
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()

def norm_title(t):
    """عنوان مُطبَّع لمقارنة الفرص المكررة"""
    return re.sub(r"\s+", " ", (t or "")).strip().lower()

def fix_ma_url(url):
    """تصليح روابط MarocAnnonces الخايبة القديمة والجديدة"""
    if not url or "marocannonces" not in url:
        return url
    # استخراج كل شيء ابتداءً من /annonce/ وإعادة بناء رابط صحيح
    m = re.search(r"/annonce/\d+", url)
    if m:
        return MA_BASE + "/categorie/309/Emploi" + url[m.start():]
    return url

def build_ma_url(href):
    """بناء رابط صحيح من أي صيغة يرجعها الموقع"""
    href = (href or "").strip()
    if href.startswith("http"):
        return fix_ma_url(href)
    if href.startswith("//"):
        return fix_ma_url("https:" + href)
    if href.startswith("/"):
        return fix_ma_url(MA_BASE + href)
    # رابط نسبي بلا "/" في البداية -> نظيف "/" يدوياً
    return fix_ma_url(MA_BASE + "/" + href)

def fetch(url):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (ForsatekBot/1.0)"})
    with urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="ignore")

def extract_deadline(text):
    dates = re.findall(r"(\d{2}/\d{2}/\d{4}|\d{4}-\d{2}-\d{2})", text)
    if not dates:
        return None
    today = datetime.date.today().isoformat()
    future = []
    for d in dates:
        try:
            iso = datetime.datetime.strptime(d, "%d/%m/%Y").date().isoformat() if "/" in d else d
            if iso >= today:
                future.append(iso)
        except ValueError:
            pass
    return min(future) if future else None

def detect_city(text):
    for c in CITIES:
        if c.lower() in text.lower():
            return c
    return "المغرب"

def detect_public_type(title):
    t = title.lower()
    if any(k in t for k in ["منحة", "بورصة", "bourse"]): return "منحة"
    if any(k in t for k in ["مباراة", "concours"]): return "مباراة"
    if any(k in t for k in ["تكوين", "formation"]): return "تكوين"
    return "وظيفة"

def fetch_public(today, seen):
    posts = json.loads(fetch("https://www.emploi-public.ma/wp-json/wp/v2/posts?per_page=30"))
    out = []
    for p in posts:
        title = clean_html(p["title"]["rendered"])
        content = clean_html(p["content"]["rendered"])
        oid = "pub-" + hashlib.md5(p["slug"].encode()).hexdigest()[:12]
        if oid in seen:
            continue
        out.append({
            "id": oid,
            "title": title,
            "organization": "التوظيف العمومي بالمغرب",
            "type": detect_public_type(title),
            "sector": "عمومي",
            "location": "المغرب",
            "level": "",
            "deadline": extract_deadline(content),
            "description": content[:800],
            "source_url": p.get("link", ""),
            "posted_date": p.get("date", "")[:10] or today,
            "manual": False,
        })
    return out

MA_PAGES = [
    MA_BASE + "/categorie/309/Emploi/Offres-emploi.html",
    MA_BASE + "/categorie/309/Emploi/Offres-emploi/2.html",
]

def fetch_private(today, seen):
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        print("تنبيه: مكتبة beautifulsoup4 غير مثبتة، تم تخطي القطاع الخاص")
        return []
    out = []
    for page_url in MA_PAGES:
        try:
            soup = BeautifulSoup(fetch(page_url), "html.parser")
        except Exception as e:
            print(f"تعذر جلب {page_url}: {e}")
            continue
        for a in soup.select('a[href*="/annonce/"]'):
            href = a.get("href", "")
            m = re.search(r"/annonce/(\d+)", href)
            if not m:
                continue
            oid = "pri-" + m.group(1)
            if oid in seen:
                continue
            title = a.get_text(" ", strip=True)
            if len(title) < 8:
                continue
            seen.add(oid)
            out.append({
                "id": oid,
                "title": title,
                "organization": "قطاع خاص - MarocAnnonces",
                "type": "وظيفة",
                "sector": "خاص",
                "location": detect_city(title),
                "level": "",
                "deadline": None,
                "description": title + "\n\nفرصة من القطاع الخاص منشورة على MarocAnnonces. اضغط على زر التقديم لمشاهدة التفاصيل الكاملة والتقديم مباشرة لدى المعلن.",
                "source_url": build_ma_url(href),
                "posted_date": today,
                "manual": False,
            })
    return out

def clean_and_dedupe(opportunities):
    """1) حذف البطاقات التجريبية  2) حذف إعلانات الخاص القديمة
       3) تصليح الروابط الخايبة  4) حذف المكرر حسب العنوان"""
    # حذف البطاقات الوهمية (sample)
    opportunities = [o for o in opportunities if not str(o.get("id", "")).startswith("sample")]
    # حذف إعلانات القطاع الخاص الأقدم من 30 يوماً
    cutoff = (datetime.date.today() - datetime.timedelta(days=PRIVATE_MAX_AGE_DAYS)).isoformat()
    opportunities = [o for o in opportunities
                     if not (str(o.get("id", "")).startswith("pri-")
                             and (o.get("posted_date", "") or "") < cutoff)]
    # تصليح الروابط الخايبة في القديم والجديد
    for o in opportunities:
        o["source_url"] = fix_ma_url(o.get("source_url", ""))
    # حذف المكرر حسب العنوان (نُبقي الأحدث لأن القائمة مرتبة تنازلياً)
    seen_titles, deduped = set(), []
    for o in opportunities:
        key = norm_title(o.get("title"))
        if key and key in seen_titles:
            continue
        seen_titles.add(key)
        deduped.append(o)
    return deduped

def main():
    today = datetime.date.today().isoformat()
    existing, seen = [], set()
    if os.path.exists(OUT_FILE):
        with open(OUT_FILE, encoding="utf-8") as f:
            existing = json.load(f).get("opportunities", [])
        seen = {str(o["id"]) for o in existing}
    opportunities = list(existing)
    for source in (fetch_public, fetch_private):
        try:
            new_items = source(today, seen)
            opportunities.extend(new_items)
            seen.update(str(o["id"]) for o in new_items)
            print(f"{source.__name__}: +{len(new_items)} فرصة")
        except Exception as e:
            print(f"خطأ في {source.__name__}: {e} (تم الاستمرار)")
    opportunities.sort(key=lambda o: o.get("posted_date", ""), reverse=True)
    opportunities = clean_and_dedupe(opportunities)
    data = {"last_update": today, "count": len(opportunities), "opportunities": opportunities}
    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"المجموع: {len(opportunities)} فرصة | آخر تحديث: {today}")

if __name__ == "__main__":
    main()
