/* فرصتك - منطق الصفحة الرئيسية */
const grid = document.getElementById('opps-grid');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const sectorFilter = document.getElementById('sector-filter');

const TYPE_IMAGES = {
  'وظيفة': 'images/cat-jobs.jpg',
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
  if (!deadline) return { text: 'بدون أجل محدد', cls: '' };
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return { text: 'انتهى الأجل', cls: 'closed' };
  if (days === 1) return { text: '⏳ يتبقى يوم واحد فقط!', cls: 'closed' };
  if (days <= 7) return { text: '⏳ يتبقى ' + days + ' أيام', cls: 'closed' };
  return { text: '📅 الأجل: ' + days + ' يوماً', cls: '' };
}

function isNew(posted) {
  if (!posted) return false;
  return (new Date() - new Date(posted)) / 86400000 <= 3;
}

function render(list) {
  if (!list.length) {
    grid.innerHTML = '';
    statusEl.textContent = 'لا توجد فرص مطابقة حالياً.';
    return;
  }
  statusEl.textContent = '';
  grid.innerHTML = list.map(o => {
    const cd = countdownText(o.deadline);
    const urgent = o.deadline && new Date(o.deadline) - new Date() <= 7 * 86400000;
    const img = TYPE_IMAGES[o.type] || 'images/cat-new.jpg';
    const europe = o.type === 'خارج المغرب';
    return `
    <article class="opp-card">
      <div class="opp-img" style="background-image:url('${img}')">
        <span class="badge-type">${o.type}</span>
      </div>
      <div class="opp-body">
        <div class="badges">
          ${isNew(o.posted_date) ? '<span class="badge new">جديد</span>' : ''}
          ${urgent ? '<span class="badge urgent">يُغلق قريباً</span>' : ''}
          ${europe ? '<span class="badge europe">🌍 أوروبا</span>' : ''}
        </div>
        <h3>${o.title}</h3>
        <p class="org">${o.organization}</p>
        <div class="meta">
          <span>📍 ${o.location || 'المغرب'}</span>
          ${o.level ? '<span>🎓 ' + o.level + '</span>' : ''}
        </div>
        <div class="countdown ${cd.cls}">${cd.text}</div>
        <a class="btn" href="detail.html?id=${o.id}">عرض التفاصيل</a>
      </div>
    </article>`;
  }).join('');
}

function updateStats(data) {
  document.getElementById('stat-total').textContent = allOpps.length;
  const week = allOpps.filter(o => isNew(o.posted_date)).length;
  document.getElementById('stat-new').textContent = week;
}
