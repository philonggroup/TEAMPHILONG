/* ════════════════════════════════════════════════════════════════════
   GÕ TRỰC TIẾP KHI HỌP — 3 màn Bước 3 · Giải trình chi nhánh
   Tracy chốt 21/11/2026: khi họp phải nhập text thẳng trên màn.
   Các ô: chỉ số lên tiếng · Vì sao 1-2-3 · Nguyên nhân lõi ·
          Hành động tuần (Ai / Làm gì / Hạn / Đo bằng).
   Nội dung LƯU TRÊN MÁY ĐANG HỌP (localStorage), chưa đẩy về
   file PHI LONG_GROUP — muốn đẩy về sổ thì bổ sung Code.gs sau.
   Không đụng tới ô số live của Apps Script.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAN = ['GB3BinhDuong', 'GB3BinhPhuoc', 'GB3ChiNhanh3'];
  var NHAN_DOI = ['Vì sao 1', 'Vì sao 2', 'Vì sao 3', 'Ai', 'Làm gì', 'Hạn', 'Đo bằng'];
  var VIEN = '1px dashed #C3D3E3';

  function khoa(manId, ten) { return 'plg.giaitrinh.' + manId + '.' + ten; }

  function gonText(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

  function moKhoa(el, manId, ten) {
    if (!el || el.getAttribute('data-go') === '1') return;
    el.setAttribute('data-go', '1');
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    el.setAttribute('title', 'Bấm để gõ trực tiếp khi họp — tự lưu trên máy này');
    el.style.outline = 'none';
    el.style.borderBottom = VIEN;
    el.style.minWidth = '28px';
    el.style.cursor = 'text';
    var cu = null;
    try { cu = localStorage.getItem(khoa(manId, ten)); } catch (e) { }
    if (cu !== null && cu !== '') el.textContent = cu;
    el.addEventListener('focus', function () { el.style.background = '#FFF9DB'; });
    el.addEventListener('blur', function () {
      el.style.background = 'transparent';
      try { localStorage.setItem(khoa(manId, ten), gonText(el.textContent)); } catch (e) { }
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
    });
  }

  function lamMan(manId) {
    var sec = document.getElementById('sc-' + manId);
    if (!sec) return;

    /* 1. Cặp <span>nhãn</span><span>nội dung</span> */
    Array.prototype.slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      var sp = Array.prototype.slice.call(d.children).filter(function (c) { return c.tagName === 'SPAN'; });
      if (sp.length < 2) return;
      for (var i = 0; i < sp.length - 1; i++) {
        var nhan = gonText(sp[i].textContent);
        if (NHAN_DOI.indexOf(nhan) < 0) continue;
        if (sp[i + 1].querySelector('[data-k]')) continue;
        moKhoa(sp[i + 1], manId, nhan);
        i++;
      }
    });

    /* 2. Nguyên nhân lõi — div ngay sau nhãn */
    Array.prototype.slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      if (gonText(d.textContent).toUpperCase() !== 'NGUYÊN NHÂN LÕI') return;
      var ke = d.nextElementSibling;
      if (ke && !ke.querySelector('[data-k]')) moKhoa(ke, manId, 'Nguyên nhân lõi');
    });

    /* 3. Tên chỉ số lên tiếng — thẻ <b> trong khối "CHỈ SỐ LÊN TIẾNG" */
    Array.prototype.slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      if (gonText(d.textContent).toUpperCase().indexOf('CHỈ SỐ LÊN TIẾNG') !== 0) return;
      var ke = d.nextElementSibling;
      if (!ke) return;
      Array.prototype.slice.call(ke.querySelectorAll('b')).forEach(function (b, n) {
        if (b.querySelector('[data-k]')) return;
        moKhoa(b, manId, 'Chỉ số lên tiếng ' + (n + 1));
      });
    });

    /* 4. Đổi dòng chú thích cuối khối cho đúng việc đang làm */
    Array.prototype.slice.call(sec.querySelectorAll('div')).forEach(function (d) {
      if (d.children.length) return;
      if (gonText(d.textContent).indexOf('ví dụ minh họa') < 0) return;
      d.textContent = 'Bấm vào ô gạch chân để gõ trực tiếp khi họp · nội dung tự lưu trên máy này, chưa đẩy về file PHI LONG_GROUP.';
    });
  }

  function chay() { MAN.forEach(lamMan); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  /* chạy lại sau mỗi lần số live vẽ lại bảng */
  setInterval(chay, 4000);
})();
