import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from datetime import datetime

BASE_URL = "https://www.emploi-public.ma"
LIST_URL = BASE_URL + "/fr/concours-liste"

HEADERS = {
    "User-Agent": "Mozilla/5.0"
}


def clean(text):
    return re.sub(r"\s+", " ", text).strip()


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

            full_url = urljoin(
                BASE_URL,
                href
            )

            if full_url not in links:
                links.append(full_url)

    return links


def get_details(url):

    soup = get_soup(url)

    text = clean(
        soup.get_text(" ", strip=True)
    )

    title = ""

    if soup.find("h1"):
        title = clean(
            soup.find("h1").get_text()
        )

    if not title:
        title = "فرصة عمل"


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


    return {
        "title": title,
        "category": "عمومي",
        "location": "المغرب",
        "description": (
            f"فرصة توظيف عمومية"
            + (
                f" - {posts} منصب"
                if posts
                else ""
            )
        ),
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

    print(
        f"لقينا {len(links)} رابط."
    )

    opportunities = []

    for number, url in enumerate(
        links,
        start=1
    ):

        try:

            print(
                f"{number}/{len(links)}"
            )

            opportunity = get_details(url)

            opportunities.append(
                opportunity
            )

        except Exception as error:

            print(
                "خطأ:",
                error
            )


    # حذف التكرار
    unique = {}

    for opportunity in opportunities:

        unique[
            opportunity["sourceUrl"]
        ] = opportunity


    opportunities = list(
        unique.values()
    )


    # ترتيب الفرص حسب آخر أجل
    opportunities.sort(
        key=lambda x: x["deadline"]
    )


    # إضافة ID
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


if __name__ == "__main__":
    main()

