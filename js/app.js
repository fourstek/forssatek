/* فرصتك - منطق الصفحة الرئيسية */
const grid = document.getElementById('opps-grid');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('search-input');
const typeFilter = document.getElementById('type-filter');
const sectorFilter = document.getElementById('sector-filter');

let allOpps = [];

/* تحميل البيانات */
fetch('data/opportunities.json')
  .then(r => {
    if (!r.ok) throw new Error('تعذر تحميل البيانات');
    return r.json();
  })
  .then(data => {
    allOpps = (data.opportunities || []).filter(o => !isClosed(o.deadline));
    updateStats(data);
    render(allOpps);
  })
  .catch(() => { statusEl.textContent = 'حدث خطأ أثناء تحميل الفرص. حاول لاحقاً.'; });

/* البحث والتصفية */
searchInput.addEventListener('input', applyFilters);
typeFilter.addEventListener('change', applyFilters);
sectorFilter.addEventListener('change', applyFilters);

function applyFilters() {
  const q = searchInput.value.trim();
  const t = typeFilter.value;
  const s = sectorFilter.value;
  const filtered = allOpps.filter(o => {
    const matchQ = !q || o.title.includes(q) || o.organization.includes(q) || (o.location || '').includes(q);
    const matchT = !t || o.type === t;
    const matchS = !s || o.sector === s;
    return matchQ && matchT && matchS;
  });
  render(filtered);
}

/* هل الأجل منقضي؟ */
function isClosed(deadline) {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

/* عداد الأجل */
function countdownText(deadline) {
  if (!deadline) return { text: 'بدون أجل محدد', cls: '' };
  const diff = new Date(deadline) - new Date();
  const days = Math.ceil(diff / 86400000);
  if (days <= 0) return { text: 'انتهى الأجل', cls: 'closed' };
  if (days === 1) return { text: '⏳ يتبقى يوم واحد فقط!', cls: 'closed' };
  if (days <= 7) return { text: `⏳ يتبقى ${days} أيام`, cls: 'closed' };
  return { text: `📅 الأجل: ${days} يوماً`, cls: '' };
}

/* هل الفرصة جديدة؟ (خلال 3 أيام) */
function isNew(posted) {
  if (!posted) return false;
  return (new Date() - new Date(posted)) / 86400000 <= 3;
}

/* عرض البطاقات */
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
    return `
    <article class="opp-card">
      <div class="badges">
        <span class="badge">${o.type}</span>
        ${o.sector ? `<span class="badge sector">${o.sector === 'خاص' ? '💼 خاص' : '🏛️ عمومي'}</span>` : ''}
        ${isNew(o.posted_date) ? '<span class="badge new">جديد</span>' : ''}
        ${urgent ? '<span class="badge urgent">يُغلق قريباً</span>' : ''}
      </div>
      <h3>${o.title}</h3>
      <p class="org">${o.organization}</p>
      <div class="meta">
        <span>📍 ${o.location || 'المغرب'}</span>
        ${o.level ? `<span>🎓 ${o.level}</span>` : ''}
      </div>
      <div class="countdown ${cd.cls}">${cd.text}</div>
      <a class="btn" href="detail.html?id=${o.id}">عرض التفاصيل</a>
    </article>`;
  }).join('');
}

/* الإحصائيات */
function updateStats(data) {
  document.getElementById('stat-total').textContent = allOpps.length;
  const week = allOpps.filter(o => isNew(o.posted_date)).length;
  document.getElementById('stat-new').textContent = week;
  document.getElementById('stat-update').textContent = data.last_update || '—';
}
