/* ════════════════════════════════════════════════════════════════════
   GÕ TRỰC TIẾP KHI HỌP — 3 màn Bước 3 · Giải trình chi nhánh
   Tracy chốt 21/11/2026: khung giải trình CHUẨN GIỐNG NHAU cho cả
   PHI LONG 1 · 2 · 3, nhập text linh hoạt ngay tại màn khi họp.
   Mỗi ô gõ mang data-gt="<tên ô>" và data-goi="<chữ gợi ý>".
   Nội dung LƯU TRÊN MÁY ĐANG HỌP (localStorage), chưa đẩy về
   file PHI LONG_GROUP. Không đụng tới ô số live của Apps Script.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAN = ['GB3BinhDuong', 'GB3BinhPhuoc', 'GB3ChiNhanh3', 'GB5HoTro'];
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
