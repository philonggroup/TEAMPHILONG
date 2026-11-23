'use strict';
/* ===================================================================
   GIAO BAN 9 BƯỚC cho mục "Họp chung 3 chi nhánh".
   Điều hướng kiểu 1 app: 1 mục ở thanh bên + menu xổ xuống 18 màn
   (3 nhóm, đúng như trang giao ban) + nút đi từng bước Trước / Sau.
   Bộ màn lấy đúng từ trang giao ban chính thức (giaoban.html) — MỘT nguồn
   số duy nhất, không nhân bản dữ liệu để tránh lệch số giữa hai nơi.
   =================================================================== */
(function () {
  var TRANG = '../../giaoban.html';
  var HOP_CHUNG = 'Họp chung 3 chi nhánh';
  var MAN_DAU = 'GB1CheckIn';

  var NHOM = [
    ['9 bước giao ban', [
      ['GB1CheckIn',   'Bước 1 · Check-in'],
      ['GB2ViecCu',    'Bước 2 · Việc tuần trước'],
      ['Main',         'Bước 3 · Toàn cảnh (bấm Chi tiết từng chi nhánh)'],
      ['GB3BinhDuong', 'Bước 3 · Chi tiết PHI LONG 1'],
      ['GB3BinhPhuoc', 'Bước 3 · Chi tiết PHI LONG 2'],
      ['GB3ChiNhanh3', 'Bước 3 · Chi tiết PHI LONG 3'],
      ['GB4VinhDanh',  'Bước 4 · Vinh danh'],
      ['GB5HoTro',     'Bước 5 · Cần hỗ trợ'],
      ['GB6ChotViec',  'Bước 6 · Chốt việc tuần'],
      ['GB7ThongDiep', 'Bước 7 · Thông điệp tuần'],
      ['GB8ChamDiem',  'Bước 8 · Chấm điểm họp'],
      ['GB9Wifle',     'Bước 9 · WIFLE (What I Feel Like Expressing)'],
    ]],
    ['Các tab khác', [
      ['TabChiNhanh',  'Tab Chi nhánh · phân tích sâu'],
      ['TabKhachHang', 'Tab Khách hàng · CSKH'],
      ['TabTongKet',   'Tab Tổng kết tháng'],
    ]],
    ['Màn điện thoại nhân sự', [
      ['DTQuanLy',  'Điện thoại · Quản lý chi nhánh'],
      ['DTTuVan',   'Điện thoại · Tư vấn dịch vụ'],
      ['DTKyThuat', 'Điện thoại · Kỹ thuật viên'],
    ]],
  ];

  /* Thứ tự đi từng bước — khớp PL_THU_TU của giaoban.html */
  var THU_TU = [];
  var TEN = {};
  NHOM.forEach(function (nhom) {
    nhom[1].forEach(function (muc) { THU_TU.push(muc[0]); TEN[muc[0]] = muc[1]; });
  });

  function bieuTuong(ten) {
    return typeof window.icon === 'function' ? window.icon(ten) : '';
  }
  function thoat(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function oChon() { return document.querySelector('#branch'); }
  function dangHopChung() {
    var o = oChon();
    return !!o && o.value === HOP_CHUNG;
  }
  function noiDung() { return document.querySelector('#content'); }
  function ghiChuLuu() { return document.querySelector('#storage'); }

  /* Menu xổ xuống 18 màn, 3 nhóm — giống hệt trang giao ban */
  function menuXo(lop) {
    return '<select class="' + lop + '" data-gb-select aria-label="Chọn màn giao ban">' +
      NHOM.map(function (nhom) {
        return '<optgroup label="' + thoat(nhom[0]) + '">' +
          nhom[1].map(function (muc) {
            return '<option value="' + muc[0] + '">' + thoat(muc[1]) + '</option>';
          }).join('') + '</optgroup>';
      }).join('') + '</select>';
  }

  /* ---------- Màn giao ban mở NGAY TRONG vùng làm việc ---------- */
  var khungXem, khung, maDangMo = '';

  function dungKhungXem() {
    if (khungXem) return khungXem;
    var cho = document.querySelector('#workspace');
    if (!cho) return null;
    khungXem = document.createElement('section');
    khungXem.id = 'gb-view';
    khungXem.hidden = true;
    khungXem.innerHTML =
      '<div class="gb-bar">' +
        '<div class="gb-bar-nav">' +
          '<button class="button secondary" type="button" data-gb-step="-1" aria-label="Bước trước">←</button>' +
          menuXo('gb-select') +
          '<button class="button secondary" type="button" data-gb-step="1" aria-label="Bước sau">→</button>' +
        '</div>' +
        '<div class="gb-bar-actions">' +
          '<span class="gb-live">● Số liệu live</span>' +
          '<button class="button secondary" type="button" data-gb-full>⛶ Toàn màn hình</button>' +
          '<button class="button secondary" type="button" data-gb-back>Về app</button>' +
        '</div>' +
      '</div>' +
      '<iframe id="gb-frame" title="Màn giao ban"></iframe>';
    var sau = noiDung();
    if (sau) sau.insertAdjacentElement('afterend', khungXem);
    else cho.appendChild(khungXem);
    khung = khungXem.querySelector('#gb-frame');
    /* Giu app trong MOT link duy nhat: moi link trong man nhung deu mo tai cho */
    khung.addEventListener('load', giuMotTab);
    return khungXem;
  }

  /* Man nhung cung origin -> go target="_blank" / "_top" de khong bat tab moi
     va khong pha khung. Boc try/catch phong truong hop trinh duyet chan. */
  function giuMotTab() {
    try {
      var tl = khung.contentDocument;
      if (!tl) return;
      tl.querySelectorAll('a[target]').forEach(function (a) {
        var t = a.getAttribute('target');
        if (t === '_blank' || t === '_top' || t === '_parent') a.removeAttribute('target');
      });
    } catch (e) { /* khac origin thi bo qua */ }
  }

  /* ---------- Toàn màn hình ----------
     Safari trên iPhone KHÔNG hỗ trợ requestFullscreen cho thẻ thường, nên
     phải có đường lui: lớp .gb-rong ẩn thanh bên + 2 thanh menu và cho khung
     phủ kín màn. giaoban.html tự tính lại tỉ lệ theo sự kiện resize. */
  function dangFull() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement) ||
      document.body.classList.contains('gb-rong');
  }
  function capNhatNutFull() {
    var nut = khungXem && khungXem.querySelector('[data-gb-full]');
    if (nut) nut.textContent = dangFull() ? '⤡ Thu nhỏ' : '⛶ Toàn màn hình';
  }
  function duPhongRong() {
    document.body.classList.add('gb-rong');
    capNhatNutFull();
    /* Báo cho trang nhúng tính lại tỉ lệ ngay, không đợi người dùng xoay máy */
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }
  function batFull() {
    if (!khungXem) return;
    var xin = khungXem.requestFullscreen || khungXem.webkitRequestFullscreen;
    if (!xin) { duPhongRong(); return; }
    try {
      var kq = xin.call(khungXem);
      if (kq && kq.then) kq.then(capNhatNutFull, duPhongRong);
      else capNhatNutFull();
    } catch (e) { duPhongRong(); }
  }
  function tatFull() {
    var thoat = document.exitFullscreen || document.webkitExitFullscreen;
    if ((document.fullscreenElement || document.webkitFullscreenElement) && thoat) {
      try { thoat.call(document); } catch (e) { /* bỏ qua */ }
    }
    document.body.classList.remove('gb-rong');
    capNhatNutFull();
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }

  function moMan(ma) {
    if (!TEN[ma] || !dungKhungXem()) return;
    var dia = TRANG + '#' + ma;
    maDangMo = ma;
    khung.src = dia;
    khungXem.hidden = false;
    if (noiDung()) noiDung().hidden = true;
    if (ghiChuLuu()) ghiChuLuu().hidden = true;
    dongBoChon();
    window.scrollTo(0, 0);
  }

  function veApp() {
    tatFull();
    maDangMo = '';
    if (khungXem) { khungXem.hidden = true; if (khung) khung.removeAttribute('src'); }
    if (noiDung()) noiDung().hidden = false;
    if (ghiChuLuu()) ghiChuLuu().hidden = false;
    dongBoChon();
  }

  function buocKe(huong) {
    var i = THU_TU.indexOf(maDangMo || MAN_DAU) + Number(huong);
    if (i < 0) i = 0;
    if (i > THU_TU.length - 1) i = THU_TU.length - 1;
    moMan(THU_TU[i]);
  }

  /* Mọi menu xổ và nút thanh bên luôn chỉ đúng màn đang mở */
  function dongBoChon() {
    var dang = maDangMo || MAN_DAU;
    document.querySelectorAll('[data-gb-select]').forEach(function (o) { o.value = dang; });
    document.querySelectorAll('[data-gb-open]').forEach(function (nut) {
      if (maDangMo) nut.setAttribute('aria-current', 'page');
      else nut.removeAttribute('aria-current');
    });
    var truoc = document.querySelector('[data-gb-step="-1"]');
    var sau = document.querySelector('[data-gb-step="1"]');
    if (truoc) truoc.disabled = THU_TU.indexOf(dang) <= 0;
    if (sau) sau.disabled = THU_TU.indexOf(dang) >= THU_TU.length - 1;
  }

  /* ---------- Thanh bên: GỌN còn 1 mục, không đổ 18 dòng ---------- */
  function chenNav() {
    var nav = document.querySelector('#nav');
    if (!nav || !dangHopChung() || nav.querySelector('[data-gb-open]')) return;
    var hop = document.createElement('div');
    hop.className = 'gb-group';
    hop.innerHTML = '<p class="gb-nav-label">Họp chung 3 chi nhánh</p>' +
      '<button type="button" class="nav-item" data-gb-open>' +
      bieuTuong('calendar') + 'Giao ban 9 bước</button>';
    nav.appendChild(hop);
    dongBoChon();
  }

  /* ---------- Thẻ trên Tổng quan: chọn bước ngay tại đây ---------- */
  function chenThe() {
    var nd = noiDung();
    if (!nd || !dangHopChung() || nd.querySelector('[data-gb-card]')) return;
    var hero = nd.querySelector('.hero');
    if (!hero) return;
    var the = document.createElement('section');
    the.className = 'gb-card';
    the.setAttribute('data-gb-card', '');
    the.innerHTML =
      '<div class="gb-card-text"><p class="eyebrow">CHUẨN HỌP CHUNG 3 CHI NHÁNH</p>' +
      '<h2>Giao ban 9 bước · 60 phút</h2>' +
      '<p>Số liệu live từ 3 workbook hệ thống chuẩn. Chọn bước rồi bấm Vào bước, ' +
      'hoặc dùng nút ← → để đi từng bước.</p></div>' +
      '<div class="gb-card-pick">' + menuXo('gb-select') +
      '<button class="button yellow" type="button" data-gb-open>' +
      bieuTuong('play') + 'Vào bước</button></div>';
    hero.insertAdjacentElement('afterend', the);
    dongBoChon();
  }

  function dongBo() { chenNav(); chenThe(); }

  function theoDoi(id) {
    var nut = document.querySelector(id);
    if (nut) new MutationObserver(dongBo).observe(nut, { childList: true });
  }

  function khoiDong() {
    dungKhungXem();
    theoDoi('#nav');
    theoDoi('#content');
    var o = oChon();
    if (o) o.addEventListener('change', function () { veApp(); dongBo(); });

    document.addEventListener('change', function (e) {
      var chon = e.target.closest('[data-gb-select]');
      if (!chon) return;
      /* Menu trong thẻ Tổng quan: chỉ chọn, bấm Vào bước mới mở.
         Menu trên thanh màn giao ban: chọn là nhảy luôn cho nhanh. */
      if (khungXem && khungXem.contains(chon)) moMan(chon.value);
      else document.querySelectorAll('[data-gb-select]').forEach(function (k) { k.value = chon.value; });
    });

    document.addEventListener('click', function (e) {
      var buoc = e.target.closest('[data-gb-step]');
      if (buoc) { e.preventDefault(); buocKe(buoc.dataset.gbStep); return; }
      var mo = e.target.closest('[data-gb-open]');
      if (mo) {
        e.preventDefault();
        var chon = document.querySelector('[data-gb-card] [data-gb-select]');
        moMan((chon && chon.value) || maDangMo || MAN_DAU);
        return;
      }
      if (e.target.closest('[data-gb-full]')) {
        e.preventDefault();
        if (dangFull()) tatFull(); else batFull();
        return;
      }
      if (e.target.closest('[data-gb-back]')) { e.preventDefault(); veApp(); return; }
      if (e.target.closest('[data-view],[data-action]')) veApp();
    });

    document.addEventListener('fullscreenchange', capNhatNutFull);
    document.addEventListener('webkitfullscreenchange', capNhatNutFull);
    /* Esc thoát chế độ phủ kín của đường lui (chế độ thật thì trình duyệt lo) */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('gb-rong')) tatFull();
    });

    dongBo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiDong);
  } else {
    khoiDong();
  }
})();
