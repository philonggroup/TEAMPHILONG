/* ════════════════════════════════════════════════════════════════════
   THANH CHUNG — KỲ SỐ LIỆU + BÀN CHI NHÁNH, hiện trên cùng mọi màn
   Tracy chốt 21/11/2026: thanh luôn hiển thị ở bước 1 → bước 9 để
   đảm bảo mọi màn đang xem CÙNG MỘT kỳ và CÙNG MỘT chi nhánh.

   Cách làm: thanh không tự tính số. Nó giữ một trạng thái duy nhất
   rồi bấm hộ đúng các nút sẵn có của từng bước (bước 4 vinhdanh.js,
   bước 5 thanh kỳ + bàn chi nhánh, bước 6 lọc chi nhánh). Nhờ vậy
   không có đường tính số thứ hai nào để lệch nhau.
   Màn nào chưa có số theo kỳ thì thanh ghi rõ, không để nhầm.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAN = ['GB1CheckIn', 'GB2ViecCu', 'Main', 'GB3BinhDuong', 'GB3BinhPhuoc',
             'GB3ChiNhanh3', 'GB4VinhDanh', 'GB5HoTro', 'GB6ChotViec',
             'GB7ThongDiep', 'GB8ChamDiem', 'GB9Wifle'];
  /* màn có số đổi theo kỳ ngày */
  var CO_KY = { GB3BinhDuong: 1, GB3BinhPhuoc: 1, GB3ChiNhanh3: 1, GB5HoTro: 1 };
  /* màn đổi được theo chi nhánh */
  var CO_CN = { Main: 1, GB3BinhDuong: 1, GB3BinhPhuoc: 1, GB3ChiNhanh3: 1,
                GB4VinhDanh: 1, GB5HoTro: 1, GB6ChotViec: 1 };
  var MAN_CN = { CN1: 'GB3BinhDuong', CN2: 'GB3BinhPhuoc', CN3: 'GB3ChiNhanh3' };

  var KY = [['thang', 'Cả tháng'], ['homnay', 'Hôm nay'], ['homqua', 'Hôm qua'],
            ['bay', '7 ngày'], ['tuan', 'Tuần này'], ['tuchon', 'Tự chọn']];
  var CN = [['TAT', 'TẤT CẢ'], ['CN1', 'PHI LONG 1'], ['CN2', 'PHI LONG 2'], ['CN3', 'PHI LONG 3']];

  window.PLG_LOC = window.PLG_LOC || { ky: 'thang', cn: 'TAT' };
  try {
    var c = localStorage.getItem('plg.loc.cn'), k = localStorage.getItem('plg.loc.ky');
    if (c) PLG_LOC.cn = c;
    if (k) PLG_LOC.ky = k;
  } catch (e) { }

  function $$(s, g) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function luu() {
    try {
      localStorage.setItem('plg.loc.cn', PLG_LOC.cn);
      localStorage.setItem('plg.loc.ky', PLG_LOC.ky);
    } catch (e) { }
  }

  /* ---------- bấm hộ nút thật của từng bước ---------- */
  function apKy(ma) {
    var b = document.querySelector('[data-b5-ky="' + ma + '"]');
    if (b) b.click();                    /* bước 5 tự lo prompt khi "tuchon" */
  }
  function apCN(ma) {
    /* bước 5 · nhận theo TÊN hiển thị, không theo thứ tự thẻ */
    var ten = (CN.filter(function (x) { return x[0] === ma; })[0] || [])[1] || '';
    var n5 = $$('[data-b5-nut]').filter(function (n) {
      var t = (n.textContent || '').trim();
      return ma === 'TAT' ? /^TẤT CẢ$/i.test(t) : t === ten;
    })[0];
    if (n5) n5.click();
    /* bước 6 */
    var n6 = document.querySelector('[data-b6cn="' + ma + '"]');
    if (n6) n6.click();
    /* bước 4 · vinh danh */
    var n4 = $$('.vd-nut-cn').filter(function (n) {
      return n.getAttribute('data-cn') === (ma === 'TAT' ? '' : ma);
    })[0];
    if (!n4 && ma === 'TAT') n4 = $$('.vd-nut-cn').filter(function (n) {
      return /^TẤT CẢ|^CẢ 3|^3 CN/i.test((n.textContent || '').trim());
    })[0];
    if (n4) n4.click();
  }

  /* ---------- vẽ thanh ---------- */
  function cotCua(manId) {
    var sec = document.getElementById('sc-' + manId);
    if (!sec) return null;
    var kh = sec.querySelector('.pl-frame > div');
    var hang = kh && kh.firstElementChild;
    return (hang && hang.children[1]) || null;
  }

  function nut(loai, ma, chu, bat, mo) {
    return '<button type="button" data-tc="' + loai + '" data-ma="' + ma + '" '
      + 'title="' + (mo ? 'Áp cho cả trang — màn này đổi số theo lựa chọn'
                        : 'Áp cho cả trang — màn đang xem không có số đổi theo lựa chọn này')
      + '" style="cursor:pointer;border:1px solid '
      + (bat ? '#2F75B5' : '#D9E2EC') + ';background:' + (bat ? '#2F75B5' : '#FFFFFF')
      + ';color:' + (bat ? '#FFFFFF' : (mo ? '#5F6B7A' : '#AEBACA'))
      + ';font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:999px;font-family:inherit;white-space:nowrap">'
      + chu + '</button>';
  }

  function veMot(manId) {
    var cot = cotCua(manId);
    if (!cot) return;
    var t = cot.querySelector('[data-tc-thanh]');
    if (!t) {
      t = document.createElement('div');
      t.setAttribute('data-tc-thanh', manId);
      cot.insertBefore(t, cot.firstElementChild);
    }
    var moKy = !!CO_KY[manId], moCN = !!CO_CN[manId];
    var khoang = '';
    try {
      if (window.b5KhoangNgay) {
        khoang = b5KhoangNgay().ten
          .replace(/^cả tháng\s*/i, 'T').replace(/\s*·\s*/g, ': ').replace(/\s*→\s*/, '→');
      }
    } catch (e) { }

    t.setAttribute('style', 'flex-shrink:0;display:flex;align-items:center;gap:5px;flex-wrap:nowrap;'
      + 'overflow-x:auto;background:#FFFFFF;border:1px solid #D9E2EC;border-radius:8px;padding:3px 9px');
    t.innerHTML =
      '<span title="' + (moKy ? 'Chọn kỳ — số của màn này tính lại theo kỳ'
                                  : 'Màn này không có số đổi theo kỳ, các nút kỳ để mờ')
        + '" style="font-size:10px;font-weight:800;letter-spacing:.3px;white-space:nowrap;color:'
        + (moKy ? '#5F6B7A' : '#AEBACA') + '">KỲ SỐ LIỆU' + (moKy ? '' : ' ·') + '</span>'
      + KY.map(function (x) { return nut('ky', x[0], x[1], PLG_LOC.ky === x[0], moKy); }).join('')
      + (khoang ? '<span style="font-size:10.5px;color:#2F75B5;font-weight:700;white-space:nowrap">· ' + khoang + '</span>' : '')
      + '<span style="width:1px;height:18px;background:#D9E2EC;margin:0 3px"></span>'
      + '<span style="font-size:10px;color:#5F6B7A;font-weight:800;letter-spacing:.3px;white-space:nowrap">BÀN CHI NHÁNH</span>'
      + CN.map(function (x) { return nut('cn', x[0], x[1], PLG_LOC.cn === x[0], moCN); }).join('')
      + '';
  }

  function veTatCa() { MAN.forEach(veMot); }

  /* ---------- ẩn các hàng nút cũ, đã gom lên thanh chung ---------- */
  function anHangCu() {
    ['b5-ky', 'b5-nut', 'b6-cn'].forEach(function (id) {
      var e = document.getElementById(id);
      if (e) e.style.display = 'none';          /* JS vẫn click được khi display:none */
    });
    $$('.vd-nut-cn').forEach(function (n) {
      var cha = n.parentNode;
      if (cha && cha.getAttribute('data-tc-an') !== '1'
          && cha.querySelectorAll('.vd-nut-cn').length === cha.children.length) {
        cha.setAttribute('data-tc-an', '1');
        cha.style.display = 'none';
      }
    });
  }

  /* ---------- bắt bấm ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-tc]');
    if (!b) return;
    var loai = b.getAttribute('data-tc'), ma = b.getAttribute('data-ma');
    var man = (b.closest('[data-tc-thanh]') || {}).getAttribute
            ? b.closest('[data-tc-thanh]').getAttribute('data-tc-thanh') : '';

    if (loai === 'ky') {
      PLG_LOC.ky = ma; luu(); apKy(ma); veTatCa();
      return;
    }
    if (loai === 'cn') {
      PLG_LOC.cn = ma; luu(); apCN(ma); veTatCa();
      /* đứng ở màn toàn cảnh mà chọn 1 chi nhánh thì mở luôn màn giải trình */
      if (man === 'Main' && MAN_CN[ma]) location.hash = '#' + MAN_CN[ma];
    }
  }, true);

  /* ---------- khởi động + giữ thanh sau mỗi lần số live vẽ lại ---------- */
  function chay() { veTatCa(); anHangCu(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setTimeout(function () { chay(); if (PLG_LOC.cn !== 'TAT') apCN(PLG_LOC.cn); }, 4000);
  setInterval(chay, 3000);
})();
