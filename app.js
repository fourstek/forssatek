let opportunities = [];

async function loadOpportunities() {
  try {
    const response = await fetch("opportunities.json");

    if (!response.ok) {
      throw new Error("تعذر تحميل الفرص");
    }

    opportunities = await response.json();

    displayOpportunities(opportunities);

  } catch (error) {
    console.error(error);

    const container = document.getElementById("opportunities");

    if (container) {
      container.innerHTML = `
        <p style="text-align:center;">
          وقع مشكل في تحميل الفرص 😕
        </p>
      `;
    }
  }
}

function displayOpportunities(list) {
  const container = document.getElementById("opportunities");

  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <p style="text-align:center;">
        ما لقيناش فرص بهاد البحث 😕
      </p>
    `;
    return;
  }

  container.innerHTML = list.map(opportunity => `
    <div class="card">
      <span class="tag">${opportunity.category}</span>

      <h3>${opportunity.title}</h3>

      <p>${opportunity.description}</p>

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
  `).join("");
}

function searchOpportunities() {
  const input = document
    .getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

  if (!input) {
    alert("كتب شنو كتقلب عليه أولاً 🔎");
    return;
  }

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

  document.getElementById("opportunities").scrollIntoView({
    behavior: "smooth"
  });

  if (results.length === 0) {
    alert("ما لقيناش فرصة بهاد البحث 😕");
  }
}

function filterCategory(category) {
  document.getElementById("searchInput").value = category;

  const results = opportunities.filter(opportunity =>
    opportunity.category
      .toLowerCase()
      .includes(category.toLowerCase().replace("وظائف", "وظيفة"))
  );

  displayOpportunities(results);

  document.getElementById("opportunities").scrollIntoView({
    behavior: "smooth"
  });

  if (results.length === 0) {
    alert("ما كايناش فرص فهاد التصنيف دابا.");
  }
}

function openOpportunityById(id) {
  const opportunity = opportunities.find(item => item.id === id);

  if (!opportunity) return;

  openOpportunity(
    opportunity.title,
    opportunity.category,
    opportunity.location,
    opportunity.description,
    "مفتوحة"
  );

  document.getElementById("modalSource").textContent =
    opportunity.source;

  document.getElementById("modalPublishDate").textContent =
    opportunity.publishDate;

  document.getElementById("modalDeadline").textContent =
    opportunity.deadline;

  const applyButton = document.getElementById("applyButton");

  if (applyButton) {
    applyButton.onclick = function () {
      if (opportunity.applyUrl && opportunity.applyUrl !== "#") {
        window.open(opportunity.applyUrl, "_blank");
      } else {
        alert("رابط التقديم غادي نضيفوه من بعد 🚀");
      }
    };
  }
}

function loginMessage() {
  alert("تسجيل الدخول غادي نفعّلوه فمرحلة الحسابات 👤");
}

loadOpportunities();
