/* فرصتك - صفحة التفاصيل */
const container = document.getElementById('detail');
const id = new URLSearchParams(location.search).get('id');

fetch('data/opportunities.json')
  .then(r => r.json())
  .then(data => {
    const opp = (data.opportunities || []).find(o => String(o.id) === String(id));
    if (!opp) {
      container.innerHTML = `
        <div class="not-found">
          <h2>عذراً، هذه الفرصة غير موجودة أو انتهى أجلها</h2>
          <p style="margin:15px 0 25px;color:var(--muted)">يمكنك تصفح الفرص المتاحة حالياً</p>
          <a class="btn-apply" href="index.html">العودة إلى الفرص</a>
        </div>`;
      return;
    }
    document.title = opp.title + ' | فرصتك';
    const cd = opp.deadline
      ? `يتبقى ${Math.max(0, Math.ceil((new Date(opp.deadline) - new Date()) / 86400000))} يوماً`
      : 'بدون أجل محدد';
    container.innerHTML = `
      <article class="detail-card">
        <span class="badge">${opp.type}</span>
        <h1>${opp.title}</h1>
        <p class="org">${opp.organization}</p>
        <table class="info-table">
          <tr><td>الجهة</td><td>${opp.organization}</td></tr>
          <tr><td>المكان</td><td>${opp.location || 'المغرب'}</td></tr>
          <tr><td>نوع الفرصة</td><td>${opp.type}</td></tr>
          ${opp.sector ? `<tr><td>القطاع</td><td>${opp.sector === 'خاص' ? 'قطاع خاص' : 'قطاع عمومي'}</td></tr>` : ''}
          ${opp.level ? `<tr><td>المستوى المطلوب</td><td>${opp.level}</td></tr>` : ''}
          ${opp.deadline ? `<tr><td>آخر أجل</td><td>${opp.deadline}</td></tr>` : ''}
          <tr><td>الحالة</td><td>${cd}</td></tr>
        </table>
        <div class="detail-desc">${opp.description || 'لم تتوفر تفاصيل إضافية بعد. اضغط على زر التقديم للمزيد من المعلومات من المصدر الرسمي.'}</div>
        <div class="actions">
          <a class="btn-apply" href="${opp.source_url}" target="_blank" rel="noopener">التقديم من المصدر الرسمي ↗</a>
          <a class="btn-back" href="index.html">← العودة إلى الفرص</a>
        </div>
      </article>`;
  })
  .catch(() => { container.innerHTML = '<div class="not-found"><h2>حدث خطأ أثناء التحميل</h2></div>'; });
