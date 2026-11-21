/* ════════════════════════════════════════════════════════════════════
   GÕ TRỰC TIẾP KHI HỌP — 3 màn Bước 3 · Giải trình chi nhánh
   Tracy chốt 21/11/2026: khung giải trình CHUẨN GIỐNG NHAU cho cả
   PHI LONG 1 · 2 · 3, nhập text linh hoạt ngay tại màn khi họp.
   Mỗi ô gõ mang data-gt="<tên ô>" và data-goi="<chữ gợi ý>".
   Nội dung LƯU TRÊN MÁY ĐANG HỌP (localStorage), chưa đẩy về
   file PHI LONG_GROUP. Không đụng tới ô số live của Apps Script.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAN = ['GB3BinhDuong', 'GB3BinhPhuoc', 'GB3ChiNhanh3', 'GB5HoTro', 'GB6ChotViec',
             'GB7ThongDiep', 'GB8ChamDiem', 'GB9Wifle'];
  var VIEN = '1px dashed #C3D3E3';

  /* chữ gợi ý cho ô trống */
  if (!document.getElementById('gt-css')) {
    var st = document.createElement('style');
    st.id = 'gt-css';
    st.textContent =
      '[data-gt]{outline:none;cursor:text;min-width:30px;border-bottom:' + VIEN + '}' +
      '[data-gt]:focus{background:#FFF9DB}' +
      '[data-gt]:empty:before{content:attr(data-goi);color:#9AA7B5;font-weight:400;font-style:italic}';
    document.head.appendChild(st);
  }

  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function khoa(manId, ten) { return 'plg.giaitrinh.' + manId + '.' + ten; }

  function lamMan(manId) {
    var sec = document.getElementById('sc-' + manId);
    if (!sec) return;
    Array.prototype.slice.call(sec.querySelectorAll('[data-gt]')).forEach(function (el) {
      if (el.getAttribute('data-san') === '1') return;
      el.setAttribute('data-san', '1');
      var ten = el.getAttribute('data-gt');
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.setAttribute('title', 'Bấm để gõ trực tiếp khi họp — tự lưu trên máy này');
      var cu = null;
      try { cu = localStorage.getItem(khoa(manId, ten)); } catch (e) { }
      if (cu) el.textContent = cu;
      el.addEventListener('blur', function () {
        var v = gon(el.textContent);
        el.textContent = v;                     /* bỏ thẻ dán vào, giữ text thuần */
        try { localStorage.setItem(khoa(manId, ten), v); } catch (e) { }
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, gon(t));
      });
    });
  }

  /* nút xoá nội dung gõ tay của màn đang xem — để dọn số/chữ gõ thử */
  function themNutXoa(manId) {
    var sec = document.getElementById('sc-' + manId);
    if (!sec || sec.querySelector('[data-gt-xoa]')) return;
    var chu = null;
    Array.prototype.slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      if (!d.children.length && gon(d.textContent).indexOf('Bấm vào ô gạch chân') === 0) chu = d;
    });
    if (!chu) return;
    var a = document.createElement('a');
    a.setAttribute('data-gt-xoa', '1');
    a.href = 'javascript:void 0';
    a.textContent = ' · Xoá nội dung gõ tay của màn này';
    a.style.color = '#9B1C1C';
    a.style.textDecoration = 'none';
    a.addEventListener('click', function (e) {
      e.preventDefault();
      Array.prototype.slice.call(sec.querySelectorAll('[data-gt]')).forEach(function (el) {
        el.textContent = '';
        try { localStorage.removeItem(khoa(manId, el.getAttribute('data-gt'))); } catch (x) { }
      });
    });
    chu.appendChild(a);
  }

  function chay() { MAN.forEach(function (m) { lamMan(m); themNutXoa(m); }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setInterval(chay, 4000);   /* số live vẽ lại bảng thì gắn lại */
})();

/* ════════════════════════════════════════════════════════════════════
   SỬA TEXT LINH HOẠT TRÊN Ô SỐ LIVE (data-sua)
   Tracy chốt 21/11/2026: màn Bước 5 Cần hỗ trợ lấy số thật từ KH 90
   ngày, nhưng câu hỏi cần hỗ trợ phải sửa được ngay tại họp.
   Ô nào đã gõ tay thì dat() trong giaoban.html không ghi đè nữa
   (cờ data-go-tay="1"). Bấm nút ↺ để trả về số live.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function khoa(el) { return 'plg.sua.' + (el.getAttribute('data-k') || el.getAttribute('data-sua')); }

  function gan() {
    Array.prototype.slice.call(document.querySelectorAll('[data-sua]')).forEach(function (el) {
      if (el.getAttribute('data-san-sua') === '1') return;
      el.setAttribute('data-san-sua', '1');
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.setAttribute('title', el.getAttribute('data-sua') + ' — bấm để sửa khi họp');
      el.style.outline = 'none';
      el.style.cursor = 'text';
      el.style.borderBottom = '1px dashed #C3D3E3';

      var cu = null;
      try { cu = localStorage.getItem(khoa(el)); } catch (e) { }
      if (cu) { el.textContent = cu; el.setAttribute('data-go-tay', '1'); }

      el.addEventListener('focus', function () { el.style.background = '#FFF9DB'; });
      el.addEventListener('blur', function () {
        el.style.background = 'transparent';
        var v = gon(el.textContent);
        el.textContent = v;
        try {
          if (v) { localStorage.setItem(khoa(el), v); el.setAttribute('data-go-tay', '1'); }
          else { localStorage.removeItem(khoa(el)); el.removeAttribute('data-go-tay'); }
        } catch (e) { }
      });
      el.addEventListener('paste', function (e) {
        e.preventDefault();
        var t = (e.clipboardData || window.clipboardData).getData('text');
        document.execCommand('insertText', false, gon(t));
      });

      /* nút trả về số live */
      if (el.parentNode && !el.parentNode.querySelector('[data-sua-reset]')) {
        var a = document.createElement('a');
        a.setAttribute('data-sua-reset', '1');
        a.href = 'javascript:void 0';
        a.textContent = ' ↺';
        a.title = 'Trả về số live';
        a.style.cssText = 'color:#9AA7B5;text-decoration:none;font-size:12px;font-weight:400';
        a.addEventListener('click', function (e) {
          e.preventDefault();
          try { localStorage.removeItem(khoa(el)); } catch (x) { }
          el.removeAttribute('data-go-tay');
          el.textContent = 'đang đọc lại số live…';
        });
        el.parentNode.appendChild(a);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gan);
  else gan();
  setInterval(gan, 4000);
})();

/* ════════════════════════════════════════════════════════════════════
   Ô TICK CHỌN CHIẾN LƯỢC — Bước 5
   Tracy chốt 21/11/2026: mỗi dòng chiến lược có ô tick. Tick rồi thì
   dòng đó sáng xanh và gắn nhãn "→ bước 6" — việc tự làm được thì đưa
   thẳng vào bước 6, không cần cả phòng bàn. Trạng thái lưu trên máy.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  function khoa(el) { return 'plg.tick.' + el.getAttribute('data-tick'); }

  function ve(el, chon) {
    var dong = el.parentNode;
    el.textContent = chon ? '☑' : '☐';
    el.style.color = chon ? '#1E6B3A' : '#9AA7B5';
    if (dong) {
      dong.style.background = chon ? '#E7F5EC' : 'transparent';
      dong.style.paddingLeft = chon ? '5px' : '0';
      var nhan = dong.querySelector('[data-tick-nhan]');
      if (chon && !nhan) {
        var s = document.createElement('span');
        s.setAttribute('data-tick-nhan', '1');
        s.textContent = '→ bước 6';
        s.style.cssText = 'color:#1E6B3A;font-weight:700;font-size:10px;white-space:nowrap;' +
                          'align-self:center;padding-right:4px';
        dong.appendChild(s);
      } else if (!chon && nhan) { nhan.parentNode.removeChild(nhan); }
    }
  }

  function gan() {
    Array.prototype.slice.call(document.querySelectorAll('[data-tick]')).forEach(function (el) {
      if (el.getAttribute('data-san-tick') === '1') return;
      el.setAttribute('data-san-tick', '1');
      var chon = false;
      try { chon = localStorage.getItem(khoa(el)) === '1'; } catch (e) { }
      ve(el, chon);
      el.addEventListener('click', function () {
        var moi = el.textContent.trim() !== '☑';
        ve(el, moi);
        try {
          if (moi) localStorage.setItem(khoa(el), '1');
          else localStorage.removeItem(khoa(el));
        } catch (e) { }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', gan);
  else gan();
  setInterval(gan, 4000);
})();

/* ════════════════════════════════════════════════════════════════════
   NÚT CHỌN CHI NHÁNH — Bước 5 · Cần hỗ trợ
   Tracy chốt 21/11/2026: khi họp bấm tên một chi nhánh thì thẻ đó
   chiếm full màn để cả phòng cùng nhìn và thảo luận; bấm TẤT CẢ thì
   trở lại 3 thẻ cạnh nhau.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var CHON = null;   /* null = tất cả */

  function cacThe() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-b5]'));
  }
  function tenThe(i) {
    var el = document.querySelector('[data-k="ht.c' + i + '.cn"]');
    var t = el ? (el.textContent || '').trim() : '';
    return (t && t !== '—') ? t : 'Thẻ ' + (i + 1);
  }

  /* cỡ chữ: [thường, khi chiếm full màn] */
  function co(the, full) {
    function dat(sel, nho, to, them) {
      Array.prototype.slice.call(the.querySelectorAll(sel)).forEach(function (e) {
        e.style.fontSize = full ? to : nho;
        if (them) them(e, full);
      });
    }
    dat('[data-k^="ht.c"][data-k$=".cn"]',   '17px', '30px');
    dat('[data-gt^="B5 câu hỏi"]',           '15px', '26px', function (e, f) {
      e.style.minHeight = f ? '42px' : '42px';
    });
    dat('[data-gt^="B5 loại việc"]',         '11px', '16px');
    dat('[data-k$=".chiso"]',                '13px', '24px');
    dat('[data-gt^="B5 đã thử"]',            '13px', '20px');
    dat('[data-k$=".chuaxong"]', '11.5px', '18px', function (e, f) {
      e.style.maxHeight = f ? '92px' : '132px';
      e.style.lineHeight = f ? '1.75' : '1.45';
    });
    dat('.b5-dong',                          '12px', '20px', function (e, f) {
      e.style.padding = f ? '5px 0' : '2px 0';
    });
    dat('[data-tick]',                       '14px', '24px');
    dat('[data-gt^="B5 phiếu"]',             '12px', '17px');
    dat('[data-gt^="B5 kết luận"]',          '12px', '17px', function (e, f) {
      e.style.padding = f ? '8px 20px' : '5px 13px';
    });
    /* nhãn Chỉ số / Đã thử và tiêu đề khối */
    Array.prototype.slice.call(the.querySelectorAll('span,div')).forEach(function (e) {
      var t = (e.textContent || '').trim();
      if (t === 'Chỉ số' || t === 'Đã thử') { e.style.fontSize = full ? '17px' : '12px';
        e.style.minWidth = full ? '74px' : '52px'; }
      if (/^(VIỆC TUẦN TRƯỚC CHƯA XONG|CHỌN 1–3 CHIẾN LƯỢC)$/.test(t)) {
        e.style.fontSize = full ? '15px' : '11px';
      }
    });
  }

  function apDung() {
    cacThe().forEach(function (the) {
      var i = parseInt(the.getAttribute('data-b5'), 10);
      var hien = (CHON === null || CHON === i);
      the.style.display = hien ? 'flex' : 'none';
      var full = (CHON === i);
      the.style.gap = full ? '9px' : '9px';
      the.style.padding = full ? '14px 26px' : '12px 15px';
      the.style.overflow = full ? 'auto' : '';   /* không bao giờ cắt mất nội dung */
      co(the, full);
    });
    /* đang bàn 1 chi nhánh thì giấu khối NHỊP 7 PHÚT để lấy chỗ cho nội dung */
    var man = document.getElementById('sc-GB5HoTro');
    if (man) Array.prototype.slice.call(man.querySelectorAll('div')).forEach(function (e) {
      var d = e.firstElementChild;
      if (!d || (d.textContent || '').trim() !== 'NHỊP 7 PHÚT CHO MỖI VIỆC') return;
      e.style.display = (CHON === null) ? '' : 'none';
    });
    Array.prototype.slice.call(document.querySelectorAll('[data-b5-nut]')).forEach(function (n) {
      var v = n.getAttribute('data-b5-nut');
      var la = (v === '' && CHON === null) || (v !== '' && CHON === parseInt(v, 10));
      n.style.background = la ? '#2F75B5' : '#FFFFFF';
      n.style.color = la ? '#FFFFFF' : '#5F6B7A';
      n.style.borderColor = la ? '#2F75B5' : '#D9E2EC';
    });
  }

  function dungNut() {
    var hop = document.getElementById('b5-nut');
    if (!hop || !cacThe().length) return;
    var can = [['', 'TẤT CẢ'], ['0', tenThe(0)], ['1', tenThe(1)], ['2', tenThe(2)]];
    var cu = Array.prototype.slice.call(hop.querySelectorAll('[data-b5-nut]'));
    if (cu.length === 4) {                       /* chỉ cập nhật nhãn khi tên live đổi */
      cu.forEach(function (n, k) { if (n.textContent !== can[k][1]) n.textContent = can[k][1]; });
      return;
    }
    cu.forEach(function (n) { n.parentNode.removeChild(n); });
    can.forEach(function (x) {
      var b = document.createElement('button');
      b.setAttribute('data-b5-nut', x[0]);
      b.type = 'button';
      b.textContent = x[1];
      b.style.cssText = 'cursor:pointer;border:1px solid #D9E2EC;background:#FFFFFF;color:#5F6B7A;' +
        'font-size:11px;font-weight:700;padding:3px 12px;border-radius:999px;font-family:inherit';
      b.addEventListener('click', function () {
        CHON = (x[0] === '') ? null : parseInt(x[0], 10);
        apDung();
      });
      hop.appendChild(b);
    });
    apDung();
  }

  function chay() { dungNut(); apDung(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setInterval(chay, 3000);
})();
