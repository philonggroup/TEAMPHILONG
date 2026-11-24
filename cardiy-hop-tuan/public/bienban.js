'use strict';
/* ════════════════════════════════════════════════════════════════════
   BIÊN BẢN HỌP + KÝ NHẬN THÀNH VIÊN  (bước B7 · Kết luận)
   Tracy chốt 24/11/2026: B7 phải có nút xuất biên bản họp, kèm ký nhận
   thành viên tham gia.

   Ký nhận lưu trong chính ngăn dữ liệu của bàn + kỳ đang họp, nên mỗi
   buổi một danh sách riêng, không lẫn sang buổi khác.
   Biên bản gom đủ 7 bước, in ra hoặc lưu PDF bằng hộp in của trình duyệt
   — không gửi đi đâu, không mở tab mới.
   ════════════════════════════════════════════════════════════════════ */
{
  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const gio = () => new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',
    hour:'2-digit',minute:'2-digit'}).format(new Date());

  function kho() {
    const d = data();
    if (!Array.isArray(d.kyNhan)) d.kyNhan = [];
    return d;
  }
  const daKy = ten => kho().kyNhan.some(x => gon(x.ten).toLowerCase() === gon(ten).toLowerCase());
  function doiKy(ten, ban) {
    const d = kho();
    const i = d.kyNhan.findIndex(x => gon(x.ten).toLowerCase() === gon(ten).toLowerCase());
    if (i > -1) d.kyNhan.splice(i,1);
    else d.kyNhan.push({ten: gon(ten), ban: gon(ban), luc: gio(), ngay: today()});
    save();
    render();
  }
  /* Danh sách nhân sự của bàn đang họp; chưa đọc được thì cho gõ tay. */
  function dsNhanSu() {
    const api = window.CARDIY_NHAN_SU;
    const ds = (api && api.dangDung && api.dangDung()) || [];
    return ds;
  }

  function panelKyNhan() {
    const d = kho();
    const ds = dsNhanSu();
    const dong = ds.length
      ? ds.map(n => {
          const co = daKy(n.ten);
          return '<div class="row"><input type="checkbox" data-action="ky-nhan" data-ten="' + label(n.ten) +
            '" data-ban="' + label(n.ban || '') + '"' + (co ? ' checked' : '') +
            ' aria-label="Ký nhận ' + label(n.ten) + '">' +
            '<div class="row-text"><strong>' + label(n.ten) + '</strong><small>' + label(n.ban || '') + '</small></div>' +
            (co ? pill('Đã ký ' + label((d.kyNhan.find(x => gon(x.ten).toLowerCase() === gon(n.ten).toLowerCase()) || {}).luc || ''), 'good') : '') +
            '</div>';
        }).join('')
      : '<p class="empty">Chưa đọc được danh sách nhân sự — vẫn xuất được biên bản, phần ký để trống cho ký tay.</p>';
    const nut = '<div class="session-actions">' +
      '<button class="button yellow" type="button" data-action="bb-xuat">Xuất biên bản họp</button></div>';
    return panel('Ký nhận thành viên tham gia',
      d.kyNhan.length + ' / ' + (ds.length || '—') + ' đã ký nhận · ' + label(branchSelect.value),
      nut, '<div class="list">' + dong + '</div>');
  }

  /* ---------- dựng biên bản ---------- */
  const o = (t,n) => n ? '<section><h3>' + t + '</h3>' + n + '</section>' : '';
  const ul = (ds,f) => ds && ds.length ? '<ul>' + ds.map(f).join('') + '</ul>' : '';
  function bang(dau, dong) {
    if (!dong) return '';
    return '<table><thead><tr>' + dau.map(x => '<th>' + x + '</th>').join('') + '</tr></thead><tbody>' + dong + '</tbody></table>';
  }
  function noiDung() {
    const d = kho();
    const s = d.session || {};
    const ky = window.CARDIY_KY ? window.CARDIY_KY.khoang().nhan : periodDate(today());
    const ngay = dateText(s.date || today());
    const tin = ul(d.good, x => '<li>' + label(x.title) + (x.owner ? ' <em>— ' + label(x.owner) + '</em>' : '') + '</li>');
    const chiSo = bang(['Chỉ số','Phụ trách','Chỉ tiêu','Thực tế','Trạng thái'],
      (d.kpis || []).map(k => '<tr><td>' + label(k.title) + '</td><td>' + label(k.owner) + '</td><td class="s">' +
        showNumber(k.target,k.unit) + '</td><td class="s">' + showNumber(k.actual,k.unit) + '</td><td>' +
        (k.actual >= k.target ? 'Đạt' : 'Chưa đạt') + '</td></tr>').join(''));
    const mucTieu = ul(d.goals, x => '<li>' + label(x.title) + ' <em>— ' + label(x.owner) + ' · ' + label(x.status) + '</em></li>');
    const phanHoi = ul(d.news, x => '<li>' + label(x.title) + ' <em>— ' + label(x.sentiment) + ' · ' + label(x.source) + '</em></li>');
    const vanDe = (d.issues || []).map(v => '<li><strong>' + label(v.title) + '</strong>' +
      (v.owner ? ' <em>— ' + label(v.owner) + '</em>' : '') +
      (v.cause ? '<div>Nguyên nhân: ' + label(v.cause) + '</div>' : '') +
      (v.discussion ? '<div>Thảo luận: ' + label(v.discussion) + '</div>' : '') +
      (v.solution ? '<div><strong>Hành động đã chốt:</strong> ' + label(v.solution) + '</div>' : '') +
      '</li>').join('');
    const hanhDong = bang(['Việc','Người phụ trách','Chi nhánh','Hạn','Trạng thái'],
      (d.tasks || []).map(t => '<tr><td>' + label(t.title) + '</td><td>' + label(t.owner) + '</td><td>' +
        label(t.branch || '') + '</td><td>' + label(t.date ? dateText(t.date) : '') + '</td><td>' +
        label(taskStatus(t)) + '</td></tr>').join(''));
    const ds = dsNhanSu();
    const ten = ds.length ? ds.map(n => n.ten) : (d.kyNhan || []).map(x => x.ten);
    const kyBang = bang(['Họ và tên','Bộ phận','Xác nhận trên app','Ký tên'],
      ten.map(t => {
        const n = ds.find(x => x.ten === t) || {};
        const k = (d.kyNhan || []).find(x => gon(x.ten).toLowerCase() === gon(t).toLowerCase());
        return '<tr><td>' + label(t) + '</td><td>' + label(n.ban || (k && k.ban) || '') + '</td><td>' +
          (k ? 'Đã xác nhận ' + label(k.luc) : '') + '</td><td class="ky"></td></tr>';
      }).join(''));
    return '<article id="bb-giay">' +
      '<header><p class="bb-ct">CÔNG TY TNHH TM DỊCH VỤ Ô TÔ PHI LONG</p>' +
      '<h1>BIÊN BẢN HỌP</h1>' +
      '<p class="bb-meta">' + label(branchSelect.value) + ' · ' + label(ky) + ' · ' + label(ngay) + '</p></header>' +
      o('1. Tin tốt', tin) +
      o('2. Chỉ số', chiSo) +
      o('3. ' + label(period().goal), mucTieu) +
      o('4. Phản hồi', phanHoi) +
      o('5. Vấn đề và hành động đã chốt (IDS)', vanDe ? '<ul class="bb-vd">' + vanDe + '</ul>' : '') +
      o('6. Danh sách hành động', hanhDong) +
      o('7. Kết luận', (d.notes ? '<p>' + label(d.notes).replace(/\n/g,'<br>') + '</p>' : '') +
        (d.rating ? '<p>Điểm buổi họp: <strong>' + d.rating + ' / 10</strong></p>' : '')) +
      o('Ký nhận thành viên tham gia', kyBang) +
      '<footer><div class="bb-ky"><p>Người điều phối</p><div class="bb-cho"></div></div>' +
      '<div class="bb-ky"><p>Quản lý chi nhánh</p><div class="bb-cho"></div></div></footer>' +
      '</article>';
  }

  let hop = null;
  function xuat() {
    if (!hop) {
      hop = document.createElement('dialog');
      hop.id = 'bb-hop';
      hop.innerHTML = '<div class="bb-thanh">' +
        '<button type="button" class="button secondary" data-bb-dong>Đóng</button>' +
        '<button type="button" class="button yellow" data-bb-in>In · Lưu PDF</button></div>' +
        '<div class="bb-noi"></div>';
      document.body.appendChild(hop);
      hop.querySelector('[data-bb-dong]').addEventListener('click', () => hop.close());
      hop.querySelector('[data-bb-in]').addEventListener('click', () => window.print());
    }
    hop.querySelector('.bb-noi').innerHTML = noiDung();
    hop.showModal();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-action="bb-xuat"]')) { xuat(); return; }
  });
  document.addEventListener('change', event => {
    const b = event.target.closest('[data-action="ky-nhan"]');
    if (!b) return;
    doiKy(b.dataset.ten, b.dataset.ban);
  });

  const goc = window.contentFor;
  window.contentFor = function(key) {
    const html = goc(key);
    return key === 'close' ? html + panelKyNhan() : html;
  };
  window.CARDIY_BIEN_BAN = {xuat: xuat, kyNhan: () => kho().kyNhan.slice()};
}
