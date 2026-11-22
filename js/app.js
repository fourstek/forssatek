/* فرصتك - منطق الصفحة الرئيسية */
const grid = document.getElementById('opps-grid');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const sectorFilter = document.getElementById('sector-filter');

const TYPE_IMAGES = {
  'وظيفة': 'images/cat-jobs-neutral.svg',
  'مباراة': 'images/cat-concours.jpg',
  'منحة': 'images/cat-bourses.jpg',
  'تكوين': 'images/cat-formations.jpg',
  'خارج المغرب': 'images/europe.jpg'
};

let allOpps = [];
let newOnly = false;

fetch('data/opportunities.json')
  .then(r => {
    if (!r.ok) throw new Error('تعذر تحميل البيانات');
    return r.json();
  })
  .then(data => {
    allOpps = (data.opportunities || []).filter(o => !isClosed(o.deadline));
    const typeCounts = {};
    allOpps.forEach(o => { typeCounts[o.type] = (typeCounts[o.type] || 0) + 1; });
    document.querySelectorAll('#type-filter option').forEach(opt => {
      if (opt.value && !typeCounts[opt.value]) opt.remove();
    });
    updateStats(data);
    render(allOpps);
  })
  .catch(() => { statusEl.textContent = 'حدث خطأ أثناء تحميل الفرص. حاول لاحقاً.'; });

searchInput.addEventListener('input', applyFilters);
typeFilter.addEventListener('change', () => { newOnly = false; applyFilters(); });
sectorFilter.addEventListener('change', () => { newOnly = false; applyFilters(); });

document.querySelectorAll('.pill[data-type], .cat-card[data-type]').forEach(el => {
  el.addEventListener('click', () => {
    const t = el.dataset.type;
    if (t === 'جديد') {
      newOnly = true;
      typeFilter.value = '';
    } else {
      newOnly = false;
      typeFilter.value = t;
    }
    applyFilters();
    document.getElementById('opportunities').scrollIntoView({ behavior: 'smooth' });
  });
});

function resetFilters() {
  searchInput.value = '';
  typeFilter.value = '';
  sectorFilter.value = '';
  newOnly = false;
  applyFilters();
}

function applyFilters() {
  const q = searchInput.value.trim();
  const t = typeFilter.value;
  const s = sectorFilter.value;
  const filtered = allOpps.filter(o => {
    const matchQ = !q || o.title.includes(q) || o.organization.includes(q) || (o.location || '').includes(q);
    const matchT = !t || o.type === t;
    const matchS = !s || o.sector === s;
    const matchNew = !newOnly || isNew(o.posted_date);
    return matchQ && matchT && matchS && matchNew;
  });
  render(filtered);
}

function isClosed(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

function countdownText(deadline) {
  if (!deadline) re
