#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
فرصتك - جالب الفرص التلقائي (3 مجموعات مصادر)
1) emploi-public.ma  -> المباريات والوظائف العمومية        -> قطاع: عمومي
2) marocannonces.com -> وظائف القطاع الخاص                 -> قطاع: خاص
3) مصادر أوروبا      -> MIEPEEC + ANAPEC + Job Bank + يدوي -> type: خارج المغرب
يكتب النتيجة في data/opportunities.json
"""
import json, re, hashlib, datetime, html, os
from urllib.request import urlopen, Request

OUT_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "opportunities.json")
MANUAL_EUROPE_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "europe_manual.json")

PRIVATE_MAX_AGE_DAYS = 30

CITIES = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fes", "Meknes",
          "Oujda", "Kenitra", "Tetouan", "Mohammedia", "Sale", "Beni Mellal",
          "Nador", "Safi", "El Jadida", "Settat", "Berrechid", "Tifelt",
          "Khouribga", "Ouarzazate", "Essaouira", "Laayoune", "Dakhla"]

COUNTRY_FLAGS = {
    "espana": "🇪🇸", "spain": "🇪🇸", "espagne": "🇪🇸", "إسبانيا": "🇪🇸",
    "portugal": "🇵🇹", "البرتغال": "🇵🇹",
    "france": "🇫🇷", "فرنسا": "🇫🇷",
    "canada": "🇨🇦", "كندا": "🇨🇦",
    "italy": "🇮🇹", "italie": "🇮🇹", "إيطاليا": "🇮🇹",
    "belgium": "🇧🇪", "belgique": "🇧🇪", "بلجيكا": "🇧🇪",
    "germany": "🇩🇪", "allemagne": "🇩🇪", "ألمانيا": "🇩🇪",
    "netherlands": "🇳🇱", "holland": "🇳🇱", "pays-bas": "🇳🇱", "هولندا": "🇳🇱",
    "ireland": "🇮🇪", "irlande": "🇮🇪", "أيرلندا": "🇮🇪",
    "greece": "🇬🇷", "grece": "🇬🇷", "اليونان": "🇬🇷",
    "poland": "🇵🇱", "pologne": "🇵🇱", "بولندا": "🇵🇱",
    "uk": "🇬🇧", "united kingdom": "🇬🇧", "royaume-uni": "🇬🇧", "بريطانيا": "🇬🇧",
}

COUNTRY_NAMES = {
    "espana": "España", "spain": "España", "espagne": "España", "إسبانيا": "إسبانيا",
    "portugal": "Portugal", "البرتغال": "البرتغال",
    "france": "France", "فرنسا": "فرنسا",
    "canada": "Canada", "كندا": "كندا",
    "italy": "Italia", "italie": "Italie", "إيطاليا": "إيطاليا",
    "belgium": "Belgique", "belgique": "Belgique", "بلجيكا": "بلجيكا",
    "germany": "Deutschland", "allemagne": "Allemagne", "ألمانيا": "ألمانيا",
    "netherlands": "Nederland", "holland": "Nederland", "pays-bas": "Pays-Bas", "هولندا": "هولندا",
    "ireland": "Ireland", "irlande": "Irlande", "أيرلندا": "أيرلندا",
    "greece": "Ελλάδα", "grece": "Grèce", "اليونان": "اليونان",
    "poland": "Polska", "pologne": "Pologne", "بولندا": "بولندا",
    "uk": "UK", "united kingdom": "UK", "royaume-uni": "Royaume-Uni", "بريطانيا": "بريطانيا",
}

def detect_country(text):
    t = (text or "").lower()
    for k in COUNTRY_FLAGS:
        if k in t:
            return COUNTRY_NAMES.get(k, k), COUNTRY_FLAGS[k]
    return None, None

MA_BASE = "https://www.marocannonces.com"

EP_LIST = ("https://www.emploi-public.ma/ar/"
           "%D9%82%D8%A7%D8%A6%D9%85%D8%A9-%D8%A7%D9%84%D9%85%D8%A8%D8%A7%D8%B1%D9%8A%D8%A7%D8%AA")

AR_MONTHS = {
    "جانفي": "01", "فيفري": "02", "مارس": "03",
    "أفريل": "04", "افريل": "04",
    "ماي": "05", "جوان": "06", "جويلية": "07",
    "أوت": "08", "اوت": "08",
    "سبتمبر": "09", "أكتوبر": "10", "اكتوبر": "10",
    "نوفمبر": "11", "ديسمبر": "12",
}

def parse_ar_date(text):
    m = re.match(r"\s*(\d{1,2})\s+([^<\s]{2,20})\s+(\d{4})", text)
    if not m:
        return None
    d, mon, y = m.groups()
    mon_num = AR_MONTHS.get(mon)
    return f"{y}-{mon_num}-{d.zfill(2)}" if mon_num else None

def is_french_title(t):
    return bool(re.search(r"[A-Za-z]{4,}", t or ""))

def clean_html(text):
    text = re.sub(r"<[^>]+>", " ", text)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()

def norm_title(t):
    return re.sub(r"\s+", " ", (t or "")).strip().lower()

def fix_ma_url(url):
    if not url or "marocannonces" not in url:
        return url
    m = re.search(r"/annonce/\d+", url)
    if m:
        return MA_BASE + "/categorie/309/Emploi" + url[m.start():]
    return url

def build_ma_url(href):
    href = (href or "").strip()
    if href.startswith("http"):
        return fix_ma_url(href)
    if href.startswith("//"):
        return fix_ma_url("https:" + href)
    if href.startswith("/"):
        return fix_ma_url(MA_BASE + href)
    return fix_ma_url(MA_BASE + "/" + href)

def fetch(url):
    req = Request(url, headers={"User-Agent": "Mozilla/5.0 (ForsatekBot/1.0)"})
    with urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="ignore")

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
    out = []
    for page in (1, 2, 3):
        try:
            page_html = fetch(f"{EP_LIST}?page={page}")
        except Exception as e:
            print(f"تعذر جلب صفحة المباريات {page}: {e}")
            continue
        for m in re.finditer(
            r'<a href="([^"]*[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})"[^>]*class="[^"]*card',
            page_html,
        ):
            link = m.group(1)
            guid = link.rsplit("/", 1)[-1]
            oid = "pub-" + guid[:12]
            if oid in seen:
                continue
            start = m.end()
            end = page_html.find("</a>", start)
            card = page_html[start:end if end != -1 else start + 5000]
            t = re.search(r'<h2 class="card-title">([^<]+)</h2>', card)
            if not t:
                continue
            title = html.unescape(t.group(1)).strip()
            if is_french_title(title):
                continue
            o = re.search(r'<div class="card-text"><i[^>]*></i>([^<]+)</div>', card)
            org = html.unescape(o.group(1)).strip() if o else "الإدارة العمومية"
            p = re.search(r"(\d+)\s*منصب", card)
            dl = re.search(r"آخر أجل[^:<]*:\s*([0-9]{1,2}\s+[^<\s]{2,20}\s+[0-9]{4})", card)
            dc = re.search(r"تاريخ إجراء المباراة\s*:\s*([0-9]{1,2}\s+[^<\s]{2,20}\s+[0-9]{4})", card)
            deadline = parse_ar_date(dl.group(1)) if dl else None
            concours_date = parse_ar_date(dc.group(1)) if dc else None
            seen.add(oid)
            desc = f"الجهة: {org}\n"
            if p:
                desc += f"عدد المناصب: {p.group(1)}\n"
            if deadline:
                desc += f"آخر أجل لإيداع ملفات الترشيح: {deadline}\n"
            if concours_date:
                desc += f"تاريخ إجراء المباراة: {concours_date}\n"
            desc += "\nفرصة من التوظيف العمومي منشورة على بوابة التوظيف العمومي emploi-public.ma. اضغط على زر التقديم للاطلاع على التفاصيل الكاملة وشروط المشاركة."
            out.append({
                "id": oid,
                "title": title,
                "organization": org,
                "type": detect_public_type(title),
                "sector": "عمومي",
                "location": "المغرب",
                "level": "",
                "deadline": deadline,
                "description": desc,
                "source_url": "https://www.emploi-public.ma" + link,
                "posted_date": today,
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

EUROPE_SOURCES = {
    "anapec": "https://www.anapec.org/",
    "jobbank_rss": "https://www.jobbank.gc.ca/jobsearch/rss?searchstring=&locationstring=Canada",
}

def make_europe_item(oid, title, url, today, country_text="", org=""):
    country_name, flag = detect_country(country_text + " " + title)
    if not country_name:
        country_name, flag = "أوروبا", "🌍"
    return {
        "id": "eur-" + oid[:16],
        "title": title.strip(),
        "organization": org or "عروض العمل في أوروبا",
        "type": "خارج المغرب",
        "sector": "",
        "location": f"{flag} {country_name}",
        "level": "",
        "deadline": None,
        "description": title.strip() + f"\n\n📍 {flag} {country_name}\n\nفرصة عمل منشورة على بوابة رسمية. اضغط على زر التقديم للاطلاع على التفاصيل والشروط.",
        "source_url": url,
        "posted_date": today,
        "manual": False,
    }

def fetch_mieps(today, seen):
    """MIEPEEC عبر r.jina.ai — بروكسي مجاني كيتجاوز الحجب الجغرافي"""
    KEYWORDS = ["gecco", "saisonnier", "espagne", "portugal", "international",
                "العقود الموسمية", "إسبانيا", "البرتغال", "التشغيل بالخارج", "wafira"]
    candidates = [
        "https://r.jina.ai/https://www.miepeec.gov.ma/fr/",
        "https://r.jina.ai/https://www.miepeec.gov.ma/",
    ]
    out = []
    for url in candidates:
        try:
            page = fetch(url)
        except Exception as e:
            print(f"MIEPS: تعذر جلب {url}: {e}")
            continue
        found_here = 0
        for m in re.finditer(r'\[([^\]]{10,200})\]\((https?://[^)]+)\)', page):
            title, href = clean_html(m.group(1)), m.group(2)
            if "r.jina.ai" in href or "miepeec.gov.ma" not in href:
                continue
            tl = title.lower()
            if not any(k in tl for k in KEYWORDS):
                continue
            if not title or len(title) < 10:
                continue
            h = hashlib.md5((href + title).encode()).hexdigest()
            if "eur-" + h[:16] in seen:
                continue
            out.append(make_europe_item(h, title, href, today,
                                        country_text=title,
                                        org="وزارة الإدماج الاقتصادي - MIEPEEC"))
            found_here += 1
        if found_here:
            print(f"MIEPS: جلب {found_here} عبر البروكسي")
            break
    return out

def fetch_europe_anapec(today, seen):
    out = []
    candidates = [
        "https://www.anapec.org/",
        "https://www.anapec.org/cms/",
    ]
    for url in candidates:
        try:
            page = fetch(url)
        except Exception as e:
            print(f"ANAPEC: تعذر جلب {url}: {e}")
            continue
        for m in re.finditer(r'href="([^"]*(?:offre|recrutement|emploi|international)[^"]*)"[^>]*>([^<]{8,120})<', page, re.I):
            href, title = m.group(1), clean_html(m.group(2))
            if not title or len(title) < 8:
                continue
            h = hashlib.md5((href + title).encode()).hexdigest()
            if "eur-" + h[:16] in seen:
                continue
            link = href if href.startswith("http") else "https://www.anapec.org" + (href if href.startswith("/") else "/" + href)
            out.append(make_europe_item(h, title, link, today, country_text=title, org="ANAPEC"))
        if out:
            break
    return out

def fetch_europe_jobbank(today, seen):
    out = []
    try:
        rss = fetch(EUROPE_SOURCES["jobbank_rss"])
    except Exception as e:
        print(f"JobBank: تعذر الجلب: {e}")
        return out
    for m in re.finditer(r"<item>(.*?)</item>", rss, re.S):
        item = m.group(1)
        t = re.search(r"<title>(?:<!\[CDATA\[)?(.*?)(?:\]\])?</title>", item, re.S)
        l = re.search(r"<link>(.*?)</link>", item, re.S)
        if not t or not l:
            continue
        title = clean_html(t.group(1))
        link = l.group(1).strip()
        if not title or len(title) < 5:
            continue
        h = hashlib.md5(link.encode()).hexdigest()
        if "eur-" + h[:16] in seen:
            continue
        out.append(make_europe_item(h, title, link, today, country_text="canada", org="Job Bank Canada"))
    return out

def fetch_europe_manual(today, seen):
    if not os.path.exists(MANUAL_EUROPE_FILE):
        return []
    try:
        with open(MANUAL_EUROPE_FILE, encoding="utf-8") as f:
            items = json.load(f)
    except Exception as e:
        print(f"ملف europe_manual.json غير صالح: {e}")
        return []
    out = []
    for it in items:
        title = (it.get("title") or "").strip()
        url = (it.get("url") or "").strip()
        if not title or not url:
            continue
        h = hashlib.md5(url.encode()).hexdigest()
        if "eur-" + h[:16] in seen:
            continue
        o = make_europe_item(h, title, url, today,
                             country_text=it.get("country", ""),
                             org=it.get("org", ""))
        o["manual"] = True
        out.append(o)
    return out

def fetch_manual(today, seen):
    """عروض يدوية عامة من data/manual.json — أي نوع (منح، تكوينات...)"""
    MANUAL_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "manual.json")
    if not os.path.exists(MANUAL_FILE):
        return []
    try:
        with open(MANUAL_FILE, encoding="utf-8") as f:
            items = json.load(f)
    except Exception as e:
        print(f"ملف manual.json غير صالح: {e}")
        return []
    out = []
    for it in items:
        title = (it.get("title") or "").strip()
        url = (it.get("url") or "").strip()
        if not title or not url:
            continue
        h = hashlib.md5(url.encode()).hexdigest()
        oid = "man-" + h[:16]
        if oid in seen:
            continue
        out.append({
            "id": oid,
            "title": title,
            "organization": it.get("org", "فرصة منشورة يدوياً"),
            "type": it.get("type", "وظيفة"),
            "sector": it.get("sector", ""),
            "location": it.get("location", "المغرب"),
            "level": it.get("level", ""),
            "deadline": it.get("deadline", None),
            "description": it.get("description", title),
            "source_url": url,
            "posted_date": today,
            "manual": True,
        })
    return out

def clean_and_dedupe(opportunities):
    opportunities = [o for o in opportunities if not str(o.get("id", "")).startswith("sample")]
    cutoff = (datetime.date.today() - datetime.timedelta(days=PRIVATE_MAX_AGE_DAYS)).isoformat()
    opportunities = [o for o in opportunities
                     if not (str(o.get("id", "")).startswith(("pri-", "eur-"))
                             and not o.get("manual")
                             and (o.get("posted_date", "") or "") < cutoff)]
    for o in opportunities:
        o["source_url"] = fix_ma_url(o.get("source_url", ""))
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
    existing = []
    if os.path.exists(OUT_FILE):
        with open(OUT_FILE, encoding="utf-8") as f:
            existing = json.load(f).get("opportunities", [])
    existing = [o for o in existing
                if not (str(o.get("id", "")).startswith("pub-") and is_french_title(o.get("title", "")))]
    seen = {str(o["id"]) for o in existing}
    opportunities = list(existing)
    for source in (fetch_public, fetch_private, fetch_mieps,
                   fetch_europe_anapec, fetch_europe_jobbank, fetch_europe_manual, fetch_manual):
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
