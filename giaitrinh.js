/* ════════════════════════════════════════════════════════════════════
   GÕ TRỰC TIẾP KHI HỌP — 3 màn Bước 3 · Giải trình chi nhánh
   Tracy chốt 21/11/2026: khung giải trình CHUẨN GIỐNG NHAU cho cả
   PHI LONG 1 · 2 · 3, nhập text linh hoạt ngay tại màn khi họp.
   Mỗi ô gõ mang data-gt="<tên ô>" và data-goi="<chữ gợi ý>".
   Nội dung LƯU TRÊN MÁY ĐANG HỌP (localStorage), chưa đẩy về
   file PHI LONG_GROUP. Không đụng tới ô số live của Apps Script.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAN = ['GB3BinhDuong', 'GB3BinhPhuoc', 'GB3ChiNhanh3'];
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

  function chay() { MAN.forEach(lamMan); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setInterval(chay, 4000);   /* số live vẽ lại bảng thì gắn lại */
})();
