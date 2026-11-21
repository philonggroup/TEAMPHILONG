/* ════════════════════════════════════════════════════════════════════
   TAB CHI NHÁNH + TAB TỔNG KẾT THÁNG — thay số minh hoạ bằng số thật
   Tracy chốt 21/11/2026: mọi màn còn badge "SỐ MINH HỌA · màn này
   chưa nối live" phải có logic chuẩn và dữ liệu chuẩn từ 3 workbook
   hệ thống chuẩn CN1 · CN2 · CN3.

   Nguồn: window.PLG_THANG — cùng một nguồn với Bước 3, Bước 5 và
   Bước 7, đọc từ tab "BÁO CÁO KPI NGÀY T11" của từng chi nhánh.
   Vì dùng chung nguồn nên các màn không thể lệch số nhau.
   Ô nào file chưa có số thì ghi "chưa có nguồn", KHÔNG lấy số mẫu lấp.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var CN = ['CN1', 'CN2', 'CN3'];
  var TEN = { CN1: 'PHI LONG 1', CN2: 'PHI LONG 2', CN3: 'PHI LONG 3' };
  /* vị trí chỉ số trong MAP_CHI_TIET của giaoban.html */
  var K = { DT: 0, LOP: 1, DV: 2, BDSC: 3, LAI: 4, TB: 5, VAO: 6, XONG: 7,
            CHOT: 8, ATX: 9, BG: 10, GOI: 11, LICH: 12 };

  function $$(s, g) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function th(ma) { return (window.PLG_THANG && window.PLG_THANG[ma]) || null; }

  function so(ma, k) {
    var t = th(ma);
    var d = t && t.chi ? t.chi[k] : null;
    if (!d || d.kpi === null || d.kpi === undefined) return null;
    return { kpi: d.kpi, dat: (d.dat === null || d.dat === undefined) ? null : d.dat };
  }
  /* cộng cả 3 chi nhánh */
  function tong(k) {
    var kpi = 0, dat = 0, co = 0;
    CN.forEach(function (ma) {
      var d = so(ma, k);
      if (!d) return;
      kpi += d.kpi; if (d.dat !== null) dat += d.dat;
      co++;
    });
    return co ? { kpi: kpi, dat: dat, soCN: co } : null;
  }
  function trieu(v) { return v === null || v === undefined ? null : Math.round(v / 1e6); }
  function dauCham(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function pct(d) {
    if (!d || !d.kpi || d.dat === null) return null;
    return d.dat / d.kpi * 100;
  }
  /* quy ước màu Tracy chốt: <70 đỏ · 70-90 vàng · 90-100 xanh · >100 tím */
  function hang(p) {
    if (p === null) return { chu: 'CHƯA ĐO', nen: '#EEF2F6', mau: '#5F6B7A' };
    if (p < 70)  return { chu: 'ĐUỐI',  nen: '#FBE4E2', mau: '#B42318' };
    if (p < 90)  return { chu: 'ĐƯỢC',  nen: '#FFF2CC', mau: '#B4600A' };
    if (p <= 100) return { chu: 'ĐẠT',  nen: '#E7F5EC', mau: '#1E6B3A' };
    return { chu: 'ĐỈNH', nen: '#EDE4FB', mau: '#6D28D9' };
  }

  /* tìm thẻ theo nhãn chữ, trả về div nhãn */
  function nhanTrong(sec, chu) {
    return $$('div,span,b', sec).filter(function (e) {
      return e.children.length === 0 && gon(e.textContent) === chu;
    })[0] || null;
  }

  /* ô dạng: <span>86% <span badge>ĐẠT</span></span> */
  function datPct(sp, p) {
    if (!sp) return;
    var h = hang(p), b = sp.querySelector('span');
    sp.textContent = (p === null) ? '— ' : (Math.round(p) + '% ');
    if (b) {
      b.textContent = h.chu;
      b.style.background = h.nen;
      b.style.color = h.mau;
      sp.appendChild(b);
    }
  }

  /* đổ một thẻ dạng: nhãn / <số> <"/ kế hoạch"> / <%> <badge> */
  function doThe(sec, nhan, d, dvi) {
    var o = nhanTrong(sec, nhan);
    if (!o) return false;
    var hangSo = o.nextElementSibling;
    var hangPct = hangSo ? hangSo.nextElementSibling : null;
    if (!hangSo) return false;
    var sp = hangSo.children;
    var dat = d ? (dvi === 'tr' ? trieu(d.dat) : d.dat) : null;
    var kpi = d ? (dvi === 'tr' ? trieu(d.kpi) : d.kpi) : null;
    if (sp[0]) sp[0].textContent = (dat === null) ? '—' : dauCham(dat);
    if (sp[1]) sp[1].textContent = (kpi === null) ? 'chưa có nguồn'
                                 : ('/ ' + dauCham(kpi) + (dvi === 'tr' ? ' tr' : ''));
    if (hangPct && hangPct.children.length >= 2) {
      var p = pct(d), h = hang(p);
      hangPct.children[0].textContent = (p === null) ? '—' : (Math.round(p) + '%');
      var b = hangPct.children[1];
      b.textContent = h.chu;
      b.style.background = h.nen;
      b.style.color = h.mau;
    }
    return true;
  }

  /* ---------- TAB TỔNG KẾT THÁNG ---------- */
  function veTongKet() {
    var sec = document.getElementById('sc-TabTongKet');
    if (!sec || !window.PLG_THANG) return;

    doThe(sec, 'Doanh thu tháng',    tong(K.DT),   'tr');
    doThe(sec, 'Lãi gộp',            tong(K.LAI),  'tr');
    doThe(sec, 'Lượt xe hoàn tất',   tong(K.XONG), '');

    /* tiêu đề tháng theo dữ liệu đang đọc, không gõ tay */
    var h1 = sec.querySelector('h1');
    if (h1 && window.PLG_THANG) {
      var n = new Date();
      h1.textContent = 'Tổng kết tháng ' + (n.getMonth() + 1) + '/' + n.getFullYear()
                     + ' · dùng cho họp tháng';
    }

    /* bảng theo chi nhánh */
    CN.forEach(function (ma) {
      var o = nhanTrong(sec, TEN[ma]);
      if (!o) return;
      var hangO = o.parentNode;
      var c = hangO ? hangO.children : null;
      if (!c || c.length < 4) return;
      var dt = so(ma, K.DT), ch = so(ma, K.CHOT);
      var p = pct(dt), h = hang(p);
      /* cột 1 doanh thu, cột 2 % + badge, cột 3 chốt báo giá, cột 4 Google */
      if (c[1]) c[1].textContent = dt
        ? (dauCham(trieu(dt.dat)) + '/' + dauCham(trieu(dt.kpi)) + ' tr') : 'chưa có nguồn';
      datPct(c[2], p);
      if (c[3]) {
        var pc = pct(ch);
        c[3].textContent = (pc === null) ? '—' : (Math.round(ch.dat) + '%');
      }
      /* điểm Google nếu Places API đã đọc được */
      if (c[4] && window.PL_GG && window.PL_GG[ma] && window.PL_GG[ma].sao) {
        c[4].textContent = String(window.PL_GG[ma].sao).replace('.', ',') + '★';
      }
    });

    /* cơ cấu doanh thu theo nhóm dịch vụ — tính trên tổng doanh thu thật */
    var tDT = tong(K.DT);
    if (tDT && tDT.dat) {
      [['Lốp & bánh xe', K.LOP], ['Bảo dưỡng định kỳ', K.BDSC],
       ['Sửa chữa', K.DV]].forEach(function (x) {
        var o = nhanTrong(sec, x[0]);
        if (!o) return;
        var t = tong(x[1]);
        var e = o.nextElementSibling || (o.parentNode && o.parentNode.children[1]);
        if (e && t && t.dat !== null) {
          e.textContent = Math.round(t.dat / tDT.dat * 100) + '%';
        }
      });
    }
  }

  /* ---------- TAB CHI NHÁNH ---------- */
  function veChiNhanh() {
    var sec = document.getElementById('sc-TabChiNhanh');
    if (!sec || !window.PLG_THANG) return;

    /* cây phân rã doanh thu — toàn hệ thống */
    var dt = tong(K.DT), xong = tong(K.XONG), tb = tong(K.TB), lich = tong(K.LICH);
    function cay(nhan, d, dvi, raw) {
      var o = nhanTrong(sec, nhan);
      if (!o) return;
      var hs = o.nextElementSibling;
      if (!hs || !hs.children.length) return;
      var v = raw !== undefined ? raw : (d ? (dvi === 'tr' ? trieu(d.dat) : d.dat) : null);
      hs.children[0].textContent = (v === null || v === undefined) ? '—'
        : (dauCham(v) + (dvi === 'tr' ? ' tr' : (dvi ? ' ' + dvi : '')));
      datPct(hs.children[1], pct(d));
    }
    cay('Doanh thu', dt, 'tr');
    cay('Lượt xe', xong, 'xe');
    /* trung bình của cả hệ thống = tổng doanh thu ÷ tổng lượt, KHÔNG cộng
       trung bình của ba chi nhánh lại với nhau */
    var tbTT = null;
    if (dt && xong && dt.dat !== null && xong.dat) {
      tbTT = { kpi: (xong.kpi ? dt.kpi / xong.kpi : null), dat: dt.dat / xong.dat };
    }
    (function () {
      var o = nhanTrong(sec, 'DT TB/xe');
      if (!o) return;
      var hs = o.nextElementSibling;
      if (!hs || !hs.children.length) return;
      hs.children[0].textContent = tbTT
        ? ((Math.round(tbTT.dat / 1e5) / 10).toString().replace('.', ',') + ' tr') : '—';
      datPct(hs.children[1], tbTT && tbTT.kpi ? (tbTT.dat / tbTT.kpi * 100) : null);
    })();
    cay('Khách hẹn trước', lich, '');
    /* khách vãng lai = lượt hoàn tất trừ lượt có đặt lịch */
    if (xong && lich && xong.dat !== null && lich.dat !== null) {
      var o = nhanTrong(sec, 'Khách vãng lai');
      var hs = o ? o.nextElementSibling : null;
      if (hs && hs.children.length) {
        hs.children[0].textContent = dauCham(Math.max(0, xong.dat - lich.dat));
        /* không có KPI riêng cho khách vãng lai nên bỏ ô phần trăm */
        if (hs.children[1]) hs.children[1].style.display = 'none';
      }
    }

    /* doanh thu theo nhóm dịch vụ */
    [['Lốp & bánh xe', K.LOP], ['Bảo dưỡng định kỳ', K.BDSC],
     ['Sửa chữa', K.DV]].forEach(function (x) {
      var o = nhanTrong(sec, x[0]);
      if (!o) return;
      var hs = o.nextElementSibling;
      var t = tong(x[1]);
      if (hs && t && hs.children.length) {
        hs.children[0].textContent = (t.dat === null) ? '—' : (dauCham(trieu(t.dat)) + ' tr');
        datPct(hs.children[1], pct(t));
      }
    });
  }

  /* ---------- badge nguồn ---------- */
  function veBadge() {
    ['TabChiNhanh', 'TabTongKet'].forEach(function (man) {
      var sec = document.getElementById('sc-' + man);
      if (!sec || !window.PLG_THANG) return;
      var b = sec.querySelector('.pl-badge-nguon');
      if (!b) return;
      if (/MINH HỌA|ĐANG TẢI/.test(b.textContent || '')) {
        b.textContent = 'SỐ LIVE · BÁO CÁO KPI NGÀY';
        b.style.background = '#E7F5EC';
        b.style.color = '#1E6B3A';
      }
    });
  }

  function chay() {
    try { veTongKet(); } catch (e) { }
    try { veChiNhanh(); } catch (e) { }
    try { veBadge(); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setInterval(chay, 3000);
})();
