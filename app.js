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

  if (!list || list.length === 0) {
    container.innerHTML = `
      <p style="text-align:center;">
        ما لقيناش فرص بهاد البحث 😕
      </p>
    `;
    return;
  }

  container.innerHTML = list.map(opportunity => {

    const postsText =
      opportunity.posts
        ? `👥 ${opportunity.posts} منصب`
        : "👥 عدد المناصب غير محدد";

    const deadlineText =
      opportunity.deadline
        ? `📅 آخر أجل: ${opportunity.deadline}`
        : "📅 آخر أجل: غير محدد";

    return `
      <div class="card">

        <span class="tag">
          ${opportunity.category || "فرصة"}
        </span>

        <h3>
          ${opportunity.title || "فرصة عمل"}
        </h3>

        <p>
          ${opportunity.description || "فرصة متاحة بالمغرب"}
        </p>

        <div class="meta">

          <span>
            📍 ${opportunity.location || "المغرب"}
          </span>

          <span>
            ${postsText}
          </span>

          <span>
            ${deadlineText}
          </span>

        </div>

        <button
          type="button"
          onclick="openOpportunityById(${opportunity.id})"
          class="details-btn">
          👁️ شوف التفاصيل
        </button>

      </div>
    `;

  }).join("");

  const countElement =
    document.getElementById("opportunityCount");

  if (countElement) {
    countElement.textContent = list.length;
  }
}


function searchOpportunities() {

  const inputElement =
    document.getElementById("searchInput");

  if (!inputElement) return;

  const input =
    inputElement.value.trim().toLowerCase();

  if (!input) {
    alert("كتب شنو كتقلب عليه أولاً 🔎");
    return;
  }

  const results = opportunities.filter(opportunity => {

    const text = `
      ${opportunity.title || ""}
      ${opportunity.category || ""}
      ${opportunity.location || ""}
      ${opportunity.description || ""}
    `.toLowerCase();

    return text.includes(input);
  });

  displayOpportunities(results);

  const container =
    document.getElementById("opportunities");

  if (container) {
    container.scrollIntoView({
      behavior: "smooth"
    });
  }

  if (results.length === 0) {
    alert("ما لقيناش فرصة بهاد البحث 😕");
  }
}


function filterCategory(category) {

  const inputElement =
    document.getElementById("searchInput");

  if (inputElement) {
    inputElement.value = category;
  }

  const searchCategory =
    category
      .toLowerCase()
      .replace("وظائف", "وظيفة");

  const results =
    opportunities.filter(opportunity => {

      const opportunityCategory =
        (opportunity.category || "")
          .toLowerCase();

      return opportunityCategory.includes(
        searchCategory
      );
    });

  displayOpportunities(results);

  const container =
    document.getElementById("opportunities");

  if (container) {
    container.scrollIntoView({
      behavior: "smooth"
    });
  }

  if (results.length === 0) {
    alert("ما كايناش فرص فهاد التصنيف دابا.");
  }
}


function openOpportunityById(id) {

  const opportunity =
    opportunities.find(
      item => Number(item.id) === Number(id)
    );

  if (!opportunity) {
    alert("تعذر العثور على تفاصيل الفرصة.");
    return;
  }


  openOpportunity(
    opportunity.title || "تفاصيل الفرصة",
    opportunity.category || "فرصة",
    opportunity.location || "المغرب",
    opportunity.description || "لا يوجد وصف متوفر حاليا.",
    "مفتوحة"
  );


  const source =
    document.getElementById("modalSource");

  if (source) {
    source.textContent =
      opportunity.source || "غير محدد";
  }


  const publishDate =
    document.getElementById("modalPublishDate");

  if (publishDate) {
    publishDate.textContent =
      opportunity.publishDate || "غير محدد";
  }


  const deadline =
    document.getElementById("modalDeadline");

  if (deadline) {
    deadline.textContent =
      opportunity.deadline || "غير محدد";
  }


  const posts =
    document.getElementById("modalPosts");

  if (posts) {
    posts.textContent =
      opportunity.posts
        ? opportunity.posts + " منصب"
        : "غير محدد";
  }


  const applyButton =
    document.getElementById("applyButton");

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

  }

}


function loginMessage() {

  alert(
    "تسجيل الدخول غادي نفعّلوه فمرحلة الحسابات 👤"
  );

}


loadOpportunities(); 
