'use strict';
/* ════════════════════════════════════════════════════════════════════
   Ô "NGƯỜI CHIA SẺ / NGƯỜI PHỤ TRÁCH" — CHỌN THEO DANH SÁCH NHÂN SỰ
   Tracy chốt 24/11/2026: ô Người chia sẻ ở B1 · Tin tốt phải tìm kiếm
   được theo danh sách nhân sự, thay vì gõ tay mỗi người một kiểu.

   Nguồn : bảng NHAN_VIEN trong file PHI LONG_GROUP (đọc live, CSV).
   AN TOÀN: KHÔNG kéo cả bảng về trình duyệt — bảng NHAN_VIEN có cột
   password và cột lương. Dùng truy vấn gviz chỉ lấy đúng 5 cột:
   id · ho_va_ten · phong_ban · vi_tri · trang_thai_lam_viec.

   Áp cho mọi ô tên người trong app (name="owner"): Tin tốt, Phản hồi,
   Chỉ số, Mục tiêu, Việc cần làm. Vẫn gõ tay tự do được.
   ════════════════════════════════════════════════════════════════════ */
{
  const FILE = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';
  const GID  = '662097057';                 /* NHAN_VIEN */
  const COT  = 'select A,B,D,G,T';
  const DS_ID = 'ds-nhan-su';
  const MA_CN = ['CN1','CN2','CN3'];
  let ds = null;

  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const hoa = v => gon(v).toUpperCase();

  function tachCsv(text) {
    const bang = [];
    let dong = [], o = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i+1] === '"') { o += '"'; i++; } else q = false; } else o += c; }
      else if (c === '"') q = true;
      else if (c === ',') { dong.push(o); o = ''; }
      else if (c === '\n') { dong.push(o); bang.push(dong); dong = []; o = ''; }
      else if (c !== '\r') o += c;
    }
    if (o.length || dong.length) { dong.push(o); bang.push(dong); }
    return bang;
  }

  async function doc() {
    const url = 'https://docs.google.com/spreadsheets/d/' + FILE + '/gviz/tq?tqx=out:csv&gid='
      + GID + '&tq=' + encodeURIComponent(COT) + '&_=' + Date.now();
    try {
      const r = await fetch(url,{cache:'no-store'});
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const text = await r.text();
      if (/^\s*(<html|<!DOCTYPE)/i.test(text)) throw new Error('chưa mở quyền xem');
      const bang = tachCsv(text);
      ds = bang.slice(1).map(d => {
        const ban = gon(d[2]);
        return {
          ma: gon(d[0]),
          ten: gon(d[1]),
          ban: ban,
          viTri: gon(d[3]),
          lam: hoa(d[4]).indexOf('ĐANG LÀM') > -1,
          cn: MA_CN.find(m => hoa(ban).includes(m)) || '',
        };
      }).filter(n => n.ten && n.lam);
      ve();
    } catch (e) { ds = null; }
  }

  /* Bàn nào họp thì ưu tiên người của bàn đó; BGĐ (không gắn CN) luôn có mặt.
     Form nào có ô "Chi nhánh phụ trách" thì bám theo chi nhánh chọn trong form
     — Tracy chốt 24/11/2026: chọn người phụ trách THEO CHI NHÁNH. */
  function maDangChon() {
    const o = document.querySelector('#edit-form [name="branch"]');
    if (o) {
      const i = branchNames.indexOf(o.value);
      return i > -1 ? MA_CN[i] : '';
    }
    return isJoint() ? '' : MA_CN[state.branch];
  }
  function loc() {
    if (!ds) return [];
    const ma = maDangChon();
    return ma ? ds.filter(n => !n.cn || n.cn === ma) : ds;
  }
  function ve() {
    let dl = document.querySelector('#' + DS_ID);
    if (!dl) {
      dl = document.createElement('datalist');
      dl.id = DS_ID;
      document.body.appendChild(dl);
    }
    dl.innerHTML = loc().map(n =>
      '<option value="' + label(n.ten) + '" label="' + label([n.ban, n.viTri].filter(Boolean).join(' · ')) + '"></option>'
    ).join('');
  }

  /* Gắn danh sách vào mọi ô tên người, giữ nguyên mọi thứ khác của app. */
  const gocMarkup = window.fieldMarkup;
  window.fieldMarkup = function(field, item, key) {
    const html = gocMarkup(field, item, key);
    if (field.name !== 'owner' || field.type !== 'text' || !ds) return html;
    ve();
    const so = loc().length;
    return html.replace('<input type="text" name="owner"',
      '<input type="text" name="owner" list="' + DS_ID + '" autocomplete="off" placeholder="Gõ để tìm trong ' + so + ' nhân sự"');
  };

  /* Đổi chi nhánh ngay trong form thì danh sách gợi ý đổi theo liền. */
  document.addEventListener('change', event => {
    if (!event.target.closest('#edit-form [name="branch"]')) return;
    ve();
    const o = document.querySelector('#edit-form input[name="owner"]');
    if (o) o.placeholder = 'Gõ để tìm trong ' + loc().length + ' nhân sự';
  });

  /* Đổi BÀN HỌP trên thanh chọn cũng phải dựng lại danh sách gợi ý.
     Thiếu chỗ này thì đứng ở PHI LONG 2 mà ô "Người duyệt · QLCN" vẫn
     xổ ra đủ 29 người cả ba chi nhánh — duyệt nhầm người bàn khác. */
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-action="open-branch"],[data-action="open-joint"]')) return;
    window.setTimeout(ve, 0);
  });

  window.CARDIY_NHAN_SU = { doc: doc, danhSach: () => ds, dangDung: () => loc(), ve: ve };
  doc();
}
