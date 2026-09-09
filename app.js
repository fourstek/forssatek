function searchOpportunities() {
  const input = document.getElementById("searchInput").value.trim();

  if (!input) {
    alert("كتب شنو كتقلب عليه أولاً 🔎");
    return;
  }

  alert("غادي نقلبو على: " + input);
}

function filterCategory(category) {
  document.getElementById("searchInput").value = category;

  document.getElementById("opportunities").scrollIntoView({
    behavior: "smooth"
  });
}

function loginMessage() {
  alert("تسجيل الدخول غادي نفعّلوه فمرحلة الحسابات 👤");
}
