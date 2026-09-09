function searchOpportunities() {
  const input = document
    .getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

  const cards = document.querySelectorAll("#opportunities .card");

  if (!input) {
    alert("كتب شنو كتقلب عليه أولاً 🔎");
    return;
  }

  let found = 0;

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();

    if (text.includes(input)) {
      card.style.display = "block";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  document.getElementById("opportunities").scrollIntoView({
    behavior: "smooth"
  });

  if (found === 0) {
    alert("ما لقيناش فرصة بهاد البحث 😕");
  }
}

function filterCategory(category) {
  const cards = document.querySelectorAll("#opportunities .card");
  let found = 0;

  document.getElementById("searchInput").value = category;

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();

    if (text.includes(category.toLowerCase())) {
      card.style.display = "block";
      found++;
    } else {
      card.style.display = "none";
    }
  });

  document.getElementById("opportunities").scrollIntoView({
    behavior: "smooth"
  });

  if (found === 0) {
    alert("ما كايناش فرص فهاد التصنيف دابا.");
  }
}

function loginMessage() {
  alert("تسجيل الدخول غادي نفعّلوه فمرحلة الحسابات 👤");
} 
