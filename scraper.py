import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

BASE_URL = "https://www.emploi-public.ma"
LIST_URL = BASE_URL + "/fr/concours-liste"

HEADERS = {
"User-Agent": "Mozilla/5.0"
}

def clean(text):
return re.sub(r"\s+", " ", text).strip()

def translate_title(title):
translations = {
"Concours de recrutement": "مباراة توظيف",
"Concours": "مباراة",
"Recrutement": "توظيف",
"Ingénieur d'Etat": "مهندس دولة",
"Ingénieur": "مهندس",
"Technicien de 3ème grade": "تقني من الدرجة الثالثة",
"Technicien de 2ème grade": "تقني من الدرجة الثانية",
"Technicien": "تقني",
"Administrateur": "متصرف",
"Inspecteur de police": "مفتش شرطة",
"Officier de police": "ضابط شرطة",
"Officier de paix": "ضابط أمن",
"Commissaire de police": "مفوض شرطة",
"Commissaire de police principal": "مفوض شرطة رئيسي",
"Gardien de la paix": "حارس أمن",
"Ministère": "وزارة",
"Province": "إقليم",
"Préfecture": "عمالة",
"Commune": "جماعة",
"Echelle": "السلم",
"Grade": "الدرجة",
"Poste": "منصب",
"Postes": "مناصب"
}

result = title

for french, arabic in sorted(
    translations.items(),
    key=lambda item: len(item[0]),
    reverse=True
):
    result = re.sub(
        re.escape(french),
        arabic,
        result,
        flags=re.IGNORECASE
    )

return result

def get_soup(url):
response = requests.get(
url,
headers=HEADERS,
timeout=30
)

response.raise_for_status()

return BeautifulSoup(
    response.text,
    "html.parser"
)

def get_links():
soup = get_soup(LIST_URL)

links = []

for link in soup.find_all("a", href=True):
    href = link["href"]

    if "/fr/concours/details/" in href:
        full_url = urljoin(BASE_URL, href)

        if full_url not in links:
            links.append(full_url)

return links

def get_details(url):
soup = get_soup(url)

text = clean(
    soup.get_text(" ", strip=True)
)

title = ""

h1 = soup.find("h1")

if h1:
    title = clean(
        h1.get_text(" ", strip=True)
    )

if not title:
    title = "مباراة توظيف"

arabic_title = translate_title(title)

deadline = "غير محدد"

match = re.search(
    r"Limite de dépôt\s*:\s*"
    r"(\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+\d{4})",
    text,
    re.IGNORECASE
)

if match:
    deadline = match.group(1)

publish_date = ""

match = re.search(
    r"Date de publication\s*:\s*"
    r"(\d{1,2}\s+[A-Za-zÀ-ÿ]+\s+\d{4})",
    text,
    re.IGNORECASE
)

if match:
    publish_date = match.group(1)

posts = None

match = re.search(
    r"(\d+)\s+postes?",
    text,
    re.IGNORECASE
)

if match:
    posts = int(match.group(1))

description = "فرصة توظيف عمومية"

if posts:
    description += f" - {posts} منصب"

return {
    "title": arabic_title,
    "originalTitle": title,
    "category": "مباريات",
    "location": "المغرب",
    "description": description,
    "deadline": deadline,
    "publishDate": publish_date,
    "source": "emploi-public.ma",
    "applyUrl": url,
    "sourceUrl": url,
    "posts": posts
}

def main():
print("بدينا تحميل فرص emploi-public.ma ...")

links = get_links()

print(f"لقينا {len(links)} رابط.")

opportunities = []

for number, url in enumerate(links, start=1):
    try:
        print(f"معالجة الفرصة {number}/{len(links)}")

        opportunity = get_details(url)

        opportunities.append(opportunity)

    except Exception as error:
        print("خطأ:", error)

unique = {}

for opportunity in opportunities:
    unique[opportunity["sourceUrl"]] = opportunity

opportunities = list(unique.values())

for number, opportunity in enumerate(
    opportunities,
    start=1
):
    opportunity["id"] = number

with open(
    "opportunities.json",
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        opportunities,
        file,
        ensure_ascii=False,
        indent=2
    )

print(
    f"تم حفظ {len(opportunities)} فرصة."
)

if name == "main":
main() 
