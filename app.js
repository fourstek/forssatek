let opportunities = [];

async function loadOpportunities() { try { const response = await fetch("opportunities.json");

if (!response.ok) {
  throw new Error("تعذر تحميل الفرص");
}

opportunities = await response.json();

displayOpportunities(opportunities);
} catch (error) { console.error(error);

const container = document.getElementById("opportunities");

if (container) {
  container.innerHTML = `
    <p style="text-align:center;">
      وقع مشكل في تحميل الفرص 😕
    </p>
  `;
}
} }

/* تحويل بعض الكلمات الفرنسية للعربية */ function translateText(text) { if (!text) return "";

const translations = { "concours de recrutement": "مباراة توظيف", "concours": "مباراة", "recrutement": "توظيف", "ingénieur": "مهندس", "technicien": "تقني", "inspecteur": "مفتش", "officier": "ضابط", "commissaire": "مفوض شرطة", "gardien de la paix": "حارس أمن", "administration": "الإدارة", "province": "إقليم", "ministère": "وزارة", "fonction publique": "الوظيفة العمومية" };

let result = text;

Object.keys(translations).forEach(word => { const regex = new RegExp(word, "gi"); result = result.replace(regex, translations[word]); });

return result; }

function displayOpportunities(list) { const container = document.getElementById("opportunities");

if (!container) return;

if (list.length === 0) { container.innerHTML = <p style="text-align:center;"> ما لقيناش فرص بهاد البحث 😕 </p>; return; }

container.innerHTML = list.map(opportunity => {

const title = translateText(opportunity.title);
const description = translateText(opportunity.description);
const category = translateText(opportunity.category);

return `
  <div class="card">

    <span class="tag">${category}</span>

    <h3>${title}</h3>

    <p>${description}</p>

    <div class="meta">
      <span>📍 ${opportunity.location}</span>
      <span>📅 آخر أجل: ${opportunity.deadline}</span>
    </div>

    <button
      onclick="openOpportunityById(${opportunity.id})"
      class="details-btn">
      👁️ شوف التفاصيل
    </button>

  </div>
`;
}).join(""); }

function searchOpportunities() { const input = document .getElementById("searchInput") .value .trim() .toLowerCase();

if (!input) { alert("كتب شنو كتقلب عليه أولاً 🔎"); return; }

const results = opportunities.filter(opportunity => {

const text = `
  ${opportunity.title}
  ${opportunity.category}
  ${opportunity.location}
  ${opportunity.description}
`.toLowerCase();

return text.includes(input);
});

displayOpportunities(results);

document.getElementById("opportunities").scrollIntoView({ behavior: "smooth" });

if (results.length === 0) { alert("ما لقيناش فرصة بهاد البحث 😕"); } }

function filterCategory(category) {

document.getElementById("searchInput").value = category;

const results = opportunities.filter(opportunity => opportunity.category .toLowerCase() .includes( category .toLowerCase() .replace("وظائف", "وظيفة") ) );

displayOpportunities(results);

document.getElementById("opportunities").scrollIntoView({ behavior: "smooth" });

if (results.length === 0) { alert("ما كايناش فرص فهاد التصنيف دابا."); } }

function openOpportunityById(id) {

const opportunity = opportunities.find( item => item.id === id );

if (!opportunity) return;

openOpportunity( translateText(opportunity.title), translateText(opportunity.category), opportunity.location, translateText(opportunity.description), "مفتوحة" );

document.getElementById("modalSource").textContent = opportunity.source;

document.getElementById("modalPublishDate").textContent = opportunity.publishDate;

document.getElementById("modalDeadline").textContent = opportunity.deadline;

const applyButton = document.getElementById("applyButton");

if (applyButton) {

applyButton.onclick = function () {

  if (
    opportunity.applyUrl &&
    opportunity.applyUrl !== "#"
  ) {

    window.open(
      opportunity.applyUrl,
      "_blank"
    );

  } else {

    alert(
      "رابط التقديم غادي نضيفوه من بعد 🚀"
    );

  }

};
} }

function loginMessage() { alert( "تسجيل الدخول غادي نفعّلوه فمرحلة الحسابات 👤" ); }

loadOpportunities();
