'use strict';
/* ===================================================================
   Cầu nối GIAO BAN 9 BƯỚC cho mục "Họp chung 3 chi nhánh".
   Bộ màn chuẩn lấy đúng từ trang giao ban chính thức (giaoban.html) —
   MỘT nguồn số duy nhất, không nhân bản dữ liệu sang app này để tránh
   lệch số giữa hai nơi. Số liệu live do giaoban.html đọc từ Apps Script.
   =================================================================== */
(function () {
  var TRANG = '../../giaoban.html';
  var HOP_CHUNG = 'Họp chung 3 chi nhánh';

  var NHOM = [
    ['9 bước giao ban', [
      ['GB1CheckIn',   'Bước 1 · Check-in',                              'check'],
      ['GB2ViecCu',    'Bước 2 · Việc tuần trước',                       'tasks'],
      ['Main',         'Bước 3 · Toàn cảnh (bấm Chi tiết từng chi nhánh)','grid'],
      ['GB3BinhDuong', 'Bước 3 · Chi tiết PHI LONG 1',                   'chart'],
      ['GB3BinhPhuoc', 'Bước 3 · Chi tiết PHI LONG 2',                   'chart'],
      ['GB3ChiNhanh3', 'Bước 3 · Chi tiết PHI LONG 3',                   'chart'],
      ['GB4VinhDanh',  'Bước 4 · Vinh danh',                             'spark'],
      ['GB5HoTro',     'Bước 5 · Cần hỗ trợ',                            'issue'],
      ['GB6ChotViec',  'Bước 6 · Chốt việc tuần',                        'check'],
      ['GB7ThongDiep', 'Bước 7 · Thông điệp tuần',                       'news'],
      ['GB8ChamDiem',  'Bước 8 · Chấm điểm họp',                         'target'],
      ['GB9Wifle',     'Bước 9 · WIFLE (What I Feel Like Expressing)',   'flag'],
    ]],
    ['Các tab khác', [
      ['TabChiNhanh',  'Tab Chi nhánh · phân tích sâu', 'chart'],
      ['TabKhachHang', 'Tab Khách hàng · CSKH',         'team'],
      ['TabTongKet',   'Tab Tổng kết tháng',            'calendar'],
    ]],
    ['Màn điện thoại nhân sự', [
      ['DTQuanLy',   'Điện thoại · Quản lý chi nhánh', 'team'],
      ['DTTuVan',    'Điện thoại · Tư vấn dịch vụ',    'assistant'],
      ['DTKyThuat',  'Điện thoại · Kỹ thuật viên',     'safety'],
    ]],
  ];

  var TEN = {};
  NHOM.forEach(function (nhom) {
    nhom[1].forEach(function (muc) { TEN[muc[0]] = muc[1]; });
  });

  function bieuTuong(ten) {
    return typeof window.icon === 'function' ? window.icon(ten) : '';
  }
  function oChon() { return document.querySelector('#branch'); }
  function dangHopChung() {
    var o = oChon();
    return !!o && o.value === HOP_CHUNG;
  }

  /* ---------- Bảng màn (mở trong app, không rời PWA) ---------- */
  var bang, khung, tieuDe, moTabMoi;
  function dungBang() {
    if (bang) return bang;
    bang = document.createElement('dialog');
    bang.id = 'gb-screen';
    bang.className = 'gb-dialog';
    bang.innerHTML =
      '<div class="panel-head">' +
        '<div><h2 id="gb-title">Giao ban</h2><p>Trang giao ban chính thức · số liệu live</p></div>' +
        '<div class="gb-head-actions">' +
          '<a class="button secondary" id="gb-open" target="_blank" rel="noopener">Mở tab mới</a>' +
          '<form method="dialog"><button class="icon-button" type="submit" aria-label="Đóng màn giao ban">×</button></form>' +
        '</div>' +
      '</div>' +
      '<iframe id="gb-frame" title="Màn giao ban" loading="lazy"></iframe>';
    document.body.appendChild(bang);
    khung = bang.querySelector('#gb-frame');
    tieuDe = bang.querySelector('#gb-title');
    moTabMoi = bang.querySelector('#gb-open');
    /* Dừng tải khi đóng để không chạy ngầm tốn pin và tốn gọi API */
    bang.addEventListener('close', function () { khung.removeAttribute('src'); });
    return bang;
  }
  function moMan(ma) {
    if (!TEN[ma]) return;
    dungBang();
    var dia = TRANG + '#' + ma;
    tieuDe.textContent = TEN[ma];
    moTabMoi.href = dia;
    khung.src = dia;
    if (!bang.open) bang.showModal();
  }

  /* ---------- Chèn bộ màn chuẩn vào thanh điều hướng ---------- */
  function chenNav() {
    var nav = document.querySelector('#nav');
    if (!nav || !dangHopChung() || nav.querySelector('[data-gb-group]')) return;
    var html = NHOM.map(function (nhom) {
      return '<p class="gb-nav-label">' + nhom[0] + '</p>' +
        nhom[1].map(function (muc) {
          return '<button type="button" class="nav-item" data-gb="' + muc[0] + '">' +
            bieuTuong(muc[2]) + muc[1] + '</button>';
        }).join('');
    }).join('');
    var hop = document.createElement('div');
    hop.className = 'gb-group';
    hop.setAttribute('data-gb-group', '');
    hop.innerHTML = html;
    nav.appendChild(hop);
  }

  /* ---------- Thẻ nhắc trên Tổng quan của họp chung ---------- */
  function chenThe() {
    var noiDung = document.querySelector('#content');
    if (!noiDung || !dangHopChung() || noiDung.querySelector('[data-gb-card]')) return;
    var hero = noiDung.querySelector('.hero');
    if (!hero) return;
    var the = document.createElement('section');
    the.className = 'gb-card';
    the.setAttribute('data-gb-card', '');
    the.innerHTML =
      '<div><p class="eyebrow">CHUẨN HỌP CHUNG 3 CHI NHÁNH</p>' +
      '<h2>Giao ban 9 bước · 60 phút</h2>' +
      '<p>Họp chung chạy theo 9 bước giao ban, số liệu live từ 3 workbook hệ thống chuẩn. ' +
      'Chọn bước ở thanh bên hoặc bấm vào đây để vào Bước 1.</p></div>' +
      '<button class="button yellow" type="button" data-gb="GB1CheckIn">' +
      bieuTuong('play') + 'Vào Bước 1 · Check-in</button>';
    hero.insertAdjacentElement('afterend', the);
  }

  function dongBo() { chenNav(); chenThe(); }

  /* App vẽ lại #nav và #content bằng innerHTML mỗi lần render, nên theo dõi
     để chèn lại. Có chốt chặn trùng nên không lặp vô hạn. */
  function theoDoi(id) {
    var nut = document.querySelector(id);
    if (!nut) return;
    new MutationObserver(dongBo).observe(nut, { childList: true });
  }

  function khoiDong() {
    theoDoi('#nav');
    theoDoi('#content');
    var o = oChon();
    if (o) o.addEventListener('change', dongBo);
    document.addEventListener('click', function (e) {
      var nut = e.target.closest('[data-gb]');
      if (nut) { e.preventDefault(); moMan(nut.dataset.gb); }
    });
    dongBo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', khoiDong);
  } else {
    khoiDong();
  }
})();
