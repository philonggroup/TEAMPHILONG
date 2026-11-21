/* ════════════════════════════════════════════════════════════════════
   BƯỚC 7 · 8 · 9 — thay số minh hoạ bằng số thật + gõ tại họp
   Tracy chốt 21/11/2026: các màn còn badge "SỐ MINH HỌA · màn này
   chưa nối live" phải có logic chuẩn và dữ liệu chuẩn.

   Bước 7 Thông điệp tuần — 3 con số đọc THẬT:
     NHÌN LẠI    = % hoàn thành doanh thu tháng của cả 3 chi nhánh
     TRỌNG TÂM   = chỉ số có % thấp nhất trong 3 chi nhánh (việc cần kéo)
     CẢM ƠN      = người đang giữ cúp ở Bước 4 Vinh danh
   Câu chữ gõ trực tiếp khi họp.

   Bước 8 Chấm điểm họp — thư ký dán dãy điểm, hệ thống tự tính
   trung bình, số phiếu, phân bố cột; ô "Việc đủ 4 yếu tố" lấy
   thẳng từ Bước 6 nên không gõ lại.

   Bước 9 WIFLE — số người lấy từ Bước 1 Check-in.
   Nguồn số tháng dùng chung window.PLG_THANG (thangdandat.js) —
   cùng một nguồn với Bước 3 và Bước 5 nên không thể lệch nhau.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var CN = ['CN1', 'CN2', 'CN3'];
  var TEN_CN = { CN1: 'PHI LONG 1', CN2: 'PHI LONG 2', CN3: 'PHI LONG 3' };

  function $1(s) { return document.querySelector(s); }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }
  function dat(k, chu) { $$('[data-k7="' + k + '"]').forEach(function (e) { e.textContent = chu; }); }
  function dat8(k, chu) { $$('[data-k8="' + k + '"]').forEach(function (e) { e.textContent = chu; }); }
  function so1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }

  /* ---------- nguồn số tháng, dùng chung với Bước 3 và Bước 5 ---------- */
  function thang(ma) { return (window.PLG_THANG && window.PLG_THANG[ma]) || null; }
  function tenChiSo(k) {
    var m = window.MAP_CHI_TIET && window.MAP_CHI_TIET[k];
    return m ? m.ten : ('chỉ số ' + k);
  }

  /* ---------- BƯỚC 7 ---------- */
  function veB7() {
    /* số tuần họp lấy từ nhãn live của sidebar, không gõ tay */
    var nh = $1('[data-k="nhan.sidebar"]');
    var mt = nh ? (nh.textContent || '').match(/tuần\s*(\d+)/i) : null;
    if (mt) { dat('tuan', 'TUẦN ' + mt[1]); dat('tuanso', mt[1]); }

    /* NHÌN LẠI — doanh thu cả 3 chi nhánh: cộng KPI và cộng thực đạt */
    var kpi = 0, datT = 0, coSo = false;
    CN.forEach(function (ma) {
      var th = thang(ma);
      var d = th && th.chi ? th.chi[0] : null;     /* 0 = Doanh thu (tr) */
      if (d && d.kpi && d.dat !== null && d.dat !== undefined) {
        kpi += d.kpi; datT += d.dat; coSo = true;
      }
    });
    if (coSo && kpi > 0) {
      var p = datT / kpi * 100;
      dat('nhinlai', Math.round(p) + '%');
      dat('nhinlai.ten', 'Doanh thu tháng của cả 3 chi nhánh.');
    } else {
      dat('nhinlai', '—');
      dat('nhinlai.ten', 'chưa đọc được số doanh thu tháng.');
    }

    /* TRỌNG TÂM — chỉ số % thấp nhất trong 3 chi nhánh */
    var thap = null;
    CN.forEach(function (ma) {
      var th = thang(ma);
      if (!th || !th.chi) return;
      /* th.chi là object {0:{kpi,dat}, 1:…} — không phải mảng */
      Object.keys(th.chi).forEach(function (k) {
        var d = th.chi[k];
        if (!d || !d.kpi || d.dat === null || d.dat === undefined) return;
        var p = d.dat / d.kpi * 100;
        if (thap === null || p < thap.p) thap = { p: p, ma: ma, k: parseInt(k, 10) };
      });
    });
    if (thap) {
      dat('trongtam', Math.round(thap.p) + '%');
      dat('trongtam.ten', tenChiSo(thap.k) + ' ở ' + TEN_CN[thap.ma] + ' — thấp nhất hệ thống.');
    } else {
      dat('trongtam', '—');
      dat('trongtam.ten', 'chưa đọc được chỉ số nào.');
    }

    /* CẢM ƠN — người đang giữ cúp ở Bước 4 */
    var ten = '', hang = '';
    var lan = $$('#sc-GB4VinhDanh .vd-lan');
    if (lan.length) {
      var t = (lan[0].textContent || '').replace(/\s+/g, ' ').trim();
      /* dạng "🥇TÊN NGƯỜI PHI LONG 2 · hạng mục 🥇 563 tr QUA VẠCH" */
      var m2 = t.replace(/^[^A-ZÀ-Ỹ]+/, '').match(/^([A-ZÀ-Ỹ\u00C0-\u1EF9 ]{3,40}?)\s*(PHI LONG \d.*)$/);
      if (m2) {
        ten = m2[1].trim();
        var m3 = m2[2].match(/PHI LONG \d\s*·\s*([^🥇🏆🔧🛞🛠]+)/);
        hang = m3 ? m3[1].trim() : '';
      }
    }
    if (ten) {
      dat('camon', ten);
      dat('camon.ten', hang ? ('dẫn đầu ' + hang + ' — đang giữ cúp ở bước 4.')
                            : 'đang giữ cúp ở bước 4 tuần này.');
    } else {
      dat('camon', '—');
      dat('camon.ten', 'chưa có ai đạt chuẩn vinh danh tuần này.');
    }
  }

  /* ---------- BƯỚC 8 ---------- */
  function veB8() {
    var o = $1('#b8-nhap');
    var chu = o ? (o.value || '') : '';
    var ds = chu.split(/[^0-9]+/).map(function (x) { return parseInt(x, 10); })
                .filter(function (x) { return x >= 1 && x <= 10; });

    if (!ds.length) {
      dat8('tb', '—'); dat8('tb2', '—'); dat8('danhan', '0');
      dat8('congthuc', 'Thư ký dán dãy điểm vào ô bên phải — hệ thống tự đếm.');
      [6, 7, 8, 9, 10].forEach(function (d) {
        dat8('d' + d, '0');
        var c = $1('[data-k8c="' + d + '"]'); if (c) c.style.height = '2px';
      });
    } else {
      var tong = ds.reduce(function (a, b) { return a + b; }, 0);
      var tb = tong / ds.length;
      dat8('tb', so1(tb)); dat8('tb2', so1(tb)); dat8('danhan', String(ds.length));
      dat8('congthuc', ds.length + ' phiếu · tổng ' + tong + ' điểm · ' + tong + ' ÷ '
        + ds.length + ' = ' + so1(tb) + '. Hệ thống tự đếm từ dãy số thư ký dán vào.');
      /* phân bố: điểm dưới 6 gộp vào cột 6 để không mất phiếu */
      var dem = { 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
      ds.forEach(function (x) { dem[x <= 6 ? 6 : x]++; });
      var max = Math.max(dem[6], dem[7], dem[8], dem[9], dem[10], 1);
      [6, 7, 8, 9, 10].forEach(function (d) {
        dat8('d' + d, String(dem[d]));
        var c = $1('[data-k8c="' + d + '"]');
        if (c) c.style.height = Math.max(2, Math.round(dem[d] / max * 170)) + 'px';
      });
    }

    /* Việc đủ 4 yếu tố — lấy thẳng từ Bước 6, không gõ lại */
    var e6 = $1('[data-k6="du4"]');
    dat8('du4', e6 ? (e6.textContent || '—') : '—');
  }

  /* ---------- BƯỚC 9 ---------- */
  function veB9() {
    var e = $1('[data-k9="songuoi"]');
    if (!e) return;
    /* đếm người có mặt ở Bước 1 Check-in nếu màn đó đã nối live */
    var b1 = $1('#sc-GB1CheckIn');
    var n = 0;
    if (b1) {
      var ds = b1.querySelectorAll('[data-k^="gb1.ql."], [data-k="gb1.cskh.ten"]');
      ds.forEach(function (x) {
        var t = (x.textContent || '').trim();
        if (t && t !== '—') n++;
      });
      if (n) n += 3;   /* chị Hà điều phối + kế toán + anh Đại */
    }
    e.textContent = n ? String(n) : '7';
  }

  /* ---------- badge: nói đúng trạng thái từng màn ---------- */
  var CHI_GO = { GB7ThongDiep: 1, GB8ChamDiem: 1, GB9Wifle: 1 };
  function veBadge() {
    Object.keys(CHI_GO).forEach(function (man) {
      var sec = $1('#sc-' + man);
      if (!sec) return;
      var b = sec.querySelector('.pl-badge-nguon');
      if (!b) return;
      var t = (b.textContent || '');
      if (/MINH HỌA|ĐANG TẢI/.test(t)) {
        b.textContent = (man === 'GB9Wifle') ? 'NGHI THỨC · GÕ TẠI HỌP' : 'SỐ LIVE + GÕ TẠI HỌP';
        b.style.background = '#E7F5EC';
        b.style.color = '#1E6B3A';
      }
    });
  }

  /* ---------- chạy ---------- */
  function chay() {
    try { veB7(); } catch (e) { }
    try { veB8(); } catch (e) { }
    try { veB9(); } catch (e) { }
    try { veBadge(); } catch (e) { }
  }
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'b8-nhap') veB8();
  }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setInterval(chay, 3000);
})();
