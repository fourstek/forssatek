/* فرصتك - السيرة الذاتية + رسالة التحفيز الذكية */
const $ = id => document.getElementById(id);
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

/* ============ التبويبات ============ */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  });
});

/* ============ حفظ واسترجاع ============ */
const FIELDS = ['f-name','f-title','f-email','f-phone','f-city','f-link','f-summary',
                'l-company','l-position','l-points','l-output'];
function saveDraft() {
  const d = {};
  FIELDS.forEach(f => d[f] = $(f).value);
  localStorage.setItem('cv-draft', JSON.stringify(d));
}
function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem('cv-draft') || '{}');
    FIELDS.forEach(f => { if (d[f]) $(f).value = d[f]; });
  } catch (e) {}
}

/* ============ الصورة الشخصية ============ */
$('f-photo').addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    localStorage.setItem('cv-photo', ev.target.result);
    showPhoto(ev.target.result);
  };
  reader.readAsDataURL(file);
});
function showPhoto(src) {
  $('photo-preview').src = src;
  $('p-photo').src = src;
  $('p-photo').hidden = false;
}
const savedPhoto = localStorage.getItem('cv-photo');
if (savedPhoto) showPhoto(savedPhoto);

/* ============ المعاينة الحية ============ */
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

function refresh() {
  $('p-name').textContent = $('f-name').value || 'اسمك الكامل';
  $('p-title').textContent = $('f-title').value || 'المسمى الوظيفي';
  const parts = [$('f-phone').value, $('f-email').value, $('f-city').value, $('f-link').value].filter(Boolean);
  $('p-contact').textContent = parts.join('  •  ');

  const summary = $('f-summary').value.trim();
  $('sec-summary').style.display = summary ? '' : 'none';
  $('p-summary').textContent = summary;

  const exps = [...document.querySelectorAll('#exp-list .dyn-item')].map(el => ({
    role: el.querySelector('.exp-role').value,
    org: el.querySelector('.exp-org').value,
    from: el.querySelector('.exp-from').value,
    to: el.querySelector('.exp-to').value,
    desc: el.querySelector('.exp-desc').value,
  })).filter(e => e.role || e.org);
  $('sec-exp').style.display = exps.length ? '' : 'none';
  $('p-exp').innerHTML = exps.map(e => `
    <div class="cv-item">
      <strong>${esc(e.role)}</strong> - ${esc(e.org)}
      <div class="when">${esc(e.from)} ${e.to ? '← ' + esc(e.to) : ''}</div>
      <p>${esc(e.desc)}</p>
    </div>`).join('');

  const edus = [...document.querySelectorAll('#edu-list .dyn-item')].map(el => ({
    degree: el.querySelector('.edu-degree').value,
    school: el.querySelector('.edu-school').value,
    from: el.querySelector('.edu-from').value,
    to: el.querySelector('.edu-to').value,
  })).filter(e => e.degree || e.school);
  $('sec-edu').style.display = edus.length ? '' : 'none';
  $('p-edu').innerHTML = edus.map(e => `
    <div class="cv-item">
      <strong>${esc(e.degree)}</strong> - ${esc(e.school)}
      <div class="when">${esc(e.from)} ${e.to ? '← ' + esc(e.to) : ''}</div>
    </div>`).join('');

  const skills = [...document.querySelectorAll('#skill-list .skill')].map(i => i.value.trim()).filter(Boolean);
  $('sec-skills').style.display = skills.length ? '' : 'none';
  $('p-skills').innerHTML = skills.map(s => `<li>${esc(s)}</li>`).join('');

  const langs = [...document.querySelectorAll('#lang-list .lang')].map(i => i.value.trim()).filter(Boolean);
  $('sec-langs').style.display = langs.length ? '' : 'none';
  $('p-langs').innerHTML = langs.map(s => `<li>${esc(s)}</li>`).join('');

  // معاينة الرسالة
  $('lp-name').textContent = $('f-name').value || '—';
  $('lp-contact').textContent = [$('f-phone').value, $('f-email').value].filter(Boolean).join(' • ');
  const lettre = $('l-output').value.trim();
  $('lp-body').innerHTML = lettre
    ? esc(lettre).replace(/\n/g, '<br>')
    : '<p class="lettre-placeholder">الرسالة ستظهر هنا معاينةً حية أثناء الكتابة أو بعد التوليد...</p>';

  saveDraft();
}

/* ============ الإضافة والحذف ============ */
const TEMPLATES = {
  exp: `<div class="dyn-item">
    <input class="exp-role" placeholder="المنصب">
    <input class="exp-org" placeholder="الشركة">
    <div class="grid2">
      <input class="exp-from" placeholder="من (2023)">
      <input class="exp-to" placeholder="إلى (2026 أو حتى الآن)">
    </div>
    <textarea class="exp-desc" rows="2" placeholder="أهم المهام والإنجازات"></textarea>
    <button class="btn-del">حذف</button>
  </div>`,
  edu: `<div class="dyn-item">
    <input class="edu-degree" placeholder="الشهادة">
    <input class="edu-school" placeholder="المؤسسة">
    <div class="grid2">
      <input class="edu-from" placeholder="من">
      <input class="edu-to" placeholder="إلى">
    </div>
    <button class="btn-del">حذف</button>
  </div>`,
  skill: `<input class="skill" placeholder="مهارة">`,
  lang: `<input class="lang" placeholder="مثال: الفرنسية - جيد جداً">`,
};
document.querySelectorAll('.btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    $(btn.dataset.add + '-list').insertAdjacentHTML('beforeend', TEMPLATES[btn.dataset.add]);
    bindInputs();
  });
});
document.addEventListener('click', e => {
  if (e.target.classList.contains('btn-del')) {
    e.target.closest('.dyn-item').remove();
    refresh();
  }
});

/* ============ الربط مع الحقول ============ */
function bindInputs() {
  document.querySelectorAll('.cv-form input:not([type=file]), .cv-form textarea').forEach(el => {
    el.oninput = refresh;
  });
}

/* ============ الذكاء الاصطناعي ============ */
function getKey() {
  let key = localStorage.getItem('gemini-key');
  if (!key) {
    key = prompt('أدخل مفتاح Gemini API المجاني (من aistudio.google.com) - يُحفظ في متصفحك فقط:');
    if (key) { key = key.trim(); localStorage.setItem('gemini-key', key); }
  }
  return key;
}

async function askAI(promptText, statusEl, btn) {
  const key = getKey();
  if (!key) { statusEl.textContent = 'تم الإلغاء. مفتاح مجاني من aistudio.google.com'; return null; }
  btn.disabled = true;
  statusEl.textContent = '⏳ جارٍ التوليد...';
  try {
    const r = await fetch(GEMINI_URL + '?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error?.message || 'خطأ في الطلب');
    }
    const data = await r.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) throw new Error('لم يتم استلام رد');
    statusEl.textContent = '✅ تم التوليد بنجاح!';
    return text;
  } catch (e) {
    statusEl.textContent = '⚠️ ' + e.message + ' — تحقق من المفتاح أو الإنترنيت';
    return null;
  } finally {
    btn.disabled = false;
  }
}

/* --- توليد الملخص --- */
$('btn-ai-summary').addEventListener('click', async () => {
  const title = $('f-title').value;
  if (!title) { $('ai-status').textContent = '⚠️ اكتب المسمى الوظيفي أولاً'; return; }
  const exps = [...document.querySelectorAll('.exp-role')].map(i => i.value).filter(Boolean).join('، ');
  const prompt = `اكتب ملخصاً مهنياً قصيراً واحداً (جملتان إلى ثلاث جمل) بالعربية الفصحى لسيرة ذاتية. المسمى الوظيفي: ${title}. الخبرات السابقة: ${exps || 'لا شيء'}. احترافي وواقعي بدون مبالغة، بدون عناوين ولا تنسيق.`;
  const res = await askAI(prompt, $('ai-status'), $('btn-ai-summary'));
  if (res) $('f-summary').value = res.replace(/[*#]/g, '');
  refresh();
});

/* --- اقتراح المهارات --- */
$('btn-ai-skills').addEventListener('click', async () => {
  const title = $('f-title').value;
  if (!title) { $('ai-status').textContent = '⚠️ اكتب المسمى الوظيفي أولاً'; return; }
  const prompt = `اقترح 8 مهارات احترافية مطلوبة لوظيفة "${title}" في المغرب. أعد النتيجة فقط كقائمة مفصولة بفواصل، بدون أرقام ولا شرح ولا تنسيق.`;
  const res = await askAI(prompt, $('ai-status'), $('btn-ai-skills'));
  if (res) {
    const skills = res.split(/[،,]/).map(s => s.trim()).filter(s => s.length > 1).slice(0, 10);
    const list = $('skill-list');
    list.innerHTML = '';
    skills.forEach(s => list.insertAdjacentHTML('beforeend', `<input class="skill" value="${s.replace(/"/g, '')}">`));
  }
  bindInputs(); refresh();
});

/* --- توليد رسالة التحفيز (بالفرنسية) --- */
$('btn-ai-lettre').addEventListener('click', async () => {
  const company = $('l-company').value, position = $('l-position').value;
  if (!company || !position) { $('lettre-status').textContent = '⚠️ اكتب اسم الشركة والمنصب أولاً'; return; }
  const name = $('f-name').value || 'Candidat';
  const points = $('l-points').value || 'motivé et rigoureux';
  const prompt = `Écris une lettre de motivation professionnelle en français pour le poste de "${position}" chez "${company}". Candidat: ${name}. Points forts: ${points}. Structure: formule d'appel, paragraphe sur la motivation pour l'entreprise, paragraphe sur les compétences, formule de politesse. Maximum 200 mots, ton professionnel et direct, sans en-tête d'adresses.`;
  const res = await askAI(prompt, $('lettre-status'), $('btn-ai-lettre'));
  if (res) $('l-output').value = res.replace(/[*#]/g, '');
  refresh();
});

/* --- نسخ الرسالة --- */
$('btn-copy-lettre').addEventListener('click', async () => {
  const text = $('l-output').value;
  if (!text.trim()) { alert('لا يوجد نص لنسخه'); return; }
  try {
    await navigator.clipboard.writeText(text);
    $('btn-copy-lettre').textContent = '✅ تم النسخ!';
    setTimeout(() => $('btn-copy-lettre').textContent = '📋 نسخ النص', 2000);
  } catch (e) {
    $('l-output').select();
    document.execCommand('copy');
  }
});

/* ============ الطباعة والمسح ============ */
$('btn-print').addEventListener('click', () => window.print());
$('btn-print-lettre').addEventListener('click', () => window.print());
$('btn-clear').addEventListener('click', () => {
  if (confirm('هل تريد فعلاً مسح جميع البيانات؟')) {
    localStorage.removeItem('cv-draft');
    localStorage.removeItem('cv-photo');
    location.reload();
  }
});

/* ============ التشغيل ============ */
loadDraft();
bindInputs();
refresh();
