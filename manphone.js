/* ════════════════════════════════════════════════════════════════════
   3 MÀN ĐIỆN THOẠI NHÂN SỰ + TAB KHÁCH HÀNG — thay số minh hoạ
   Tracy chốt 21/11/2026: mọi màn còn badge "SỐ MINH HỌA" phải có
   logic chuẩn và dữ liệu chuẩn từ 3 workbook chi nhánh.

   Nguồn:
     · window.PLG_NHANSU — số theo từng người, đọc từ tab
       "APP CN{n} KPI KỸ THUẬT VIÊN SALE -T11" (vinhdanh.js),
       cùng nguồn với Bước 4 Vinh danh
     · window.PLG_THANG  — chỉ số chi nhánh theo ngày, cùng nguồn
       với Bước 3, 5, 7 và 2 tab phân tích
   Mỗi màn điện thoại có nút chọn người, vì một màn chỉ hiện số của
   một người. Ô nào file chưa có số thì ghi rõ, không lấp số mẫu.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var TEN_CN = { CN1: 'PHI LONG 1', CN2: 'PHI LONG 2', CN3: 'PHI LONG 3' };
  var K = { DT: 0, LOP: 1, DV: 2, BDSC: 3, TB: 5, VAO: 6, XONG: 7,
            CHOT: 8, ATX: 9, BG: 10, GOI: 11, LICH: 12 };
  var chon = { DTQuanLy: null, DTTuVan: null, DTKyThuat: null };

  function $$(s, g) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function tr(v) { return Math.round((v || 0) / 1e6).toLocaleString('vi-VN'); }
  function nhanTrong(sec, chu) {
    return $$('div,span,b', sec).filter(function (e) {
      return e.children.length === 0 && gon(e.textContent) === chu;
    })[0] || null;
  }
  function hang(p) {
    if (p === null || p === undefined || isNaN(p)) return { chu: 'CHƯA ĐO', nen: '#EEF2F6', mau: '#5F6B7A' };
    if (p < 70)  return { chu: 'ĐUỐI', nen: '#FBE4E2', mau: '#B42318' };
    if (p < 90)  return { chu: 'ĐƯỢC', nen: '#FFF2CC', mau: '#B4600A' };
    if (p <= 100) return { chu: 'ĐẠT', nen: '#E7F5EC', mau: '#1E6B3A' };
    return { chu: 'ĐỈNH', nen: '#EDE4FB', mau: '#6D28D9' };
  }
  function thang(ma) { return (window.PLG_THANG && window.PLG_THANG[ma]) || null; }
  function soCN(ma, k) {
    var t = thang(ma), d = t && t.chi ? t.chi[k] : null;
    if (!d || !d.kpi) return null;
    return { kpi: d.kpi, dat: (d.dat === null || d.dat === undefined) ? null : d.dat };
  }

  /* ---------- hàng nút chọn người ---------- */
  function veNutNguoi(man, ds, nhanPhu) {
    var sec = document.getElementById('sc-' + man);
    if (!sec) return null;
    var hopNut = sec.querySelector('[data-mp-nut]');
    if (!hopNut) {
      /* đặt ngay dưới dòng "Đăng nhập: ..." */
      var o = $$('div,span', sec).filter(function (e) {
        return e.children.length === 0 && /^Đăng nhập:/.test(gon(e.textContent));
      })[0];
      if (!o) return null;
      hopNut = document.createElement('div');
      hopNut.setAttribute('data-mp-nut', '1');
      hopNut.setAttribute('style', 'display:flex;gap:4px;flex-wrap:wrap;margin-top:5px');
      (o.parentNode || o).appendChild(hopNut);
    }
    if (!ds.length) {
      hopNut.innerHTML = '<span style="font-size:11px;color:#B42318;font-weight:700">'
        + 'chưa đọc được danh sách nhân sự từ file</span>';
      return null;
    }
    if (chon[man] === null || !ds.some(function (p) { return p.ten === chon[man]; })) {
      chon[man] = ds[0].ten;
    }
    hopNut.innerHTML = ds.slice(0, 12).map(function (p) {
      var la = p.ten === chon[man];
      return '<button type="button" data-mp="' + man + '" data-ten="' + gon(p.ten).replace(/"/g, '') + '" '
        + 'style="cursor:pointer;border:1px solid ' + (la ? '#2F75B5' : '#D9E2EC') + ';background:'
        + (la ? '#2F75B5' : '#FFFFFF') + ';color:' + (la ? '#FFFFFF' : '#5F6B7A')
        + ';font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px;font-family:inherit">'
        + gon(p.ten) + '</button>';
    }).join('');
    var ai = ds.filter(function (p) { return p.ten === chon[man]; })[0] || ds[0];
    /* dòng "Tên · chi nhánh" ngay dưới Đăng nhập */
    if (nhanPhu) {
      var e = nhanTrong(sec, nhanPhu);
      if (e) e.textContent = gon(ai.ten) + ' · ' + (TEN_CN[ai.cn] || ai.cn || '');
    }
    return ai;
  }

  /* ---------- đổ một thẻ "nhãn / x/y / % badge" ---------- */
  function doThe(sec, nhan, dat, kpi, dvi) {
    var o = nhanTrong(sec, nhan);
    if (!o) return;
    var hs = o.nextElementSibling;
    if (!hs || !hs.children.length) return;
    var p = (kpi && dat !== null && dat !== undefined) ? (dat / kpi * 100) : null;
    hs.children[0].textContent = (dat === null || dat === undefined) ? '—'
      : (dvi === 'tr' ? tr(dat) : Math.round(dat)) + (kpi ? ('/' + (dvi === 'tr' ? tr(kpi) : Math.round(kpi))) : '');
    var h = hang(p);
    /* màn điện thoại xếp: [số] [%] [badge] — badge là ô thứ ba, không phải
       span nằm trong ô phần trăm như ở các tab */
    var oP = hs.children[1], oB = hs.children[2] || (oP ? oP.querySelector('span') : null);
    if (oP) oP.textContent = (p === null ? '—' : Math.round(p) + '%');
    if (oB && oB !== oP) {
      oB.textContent = h.chu;
      oB.style.background = h.nen;
      oB.style.color = h.mau;
    }
  }

  /* ---------- màn QUẢN LÝ CHI NHÁNH ---------- */
  function veQuanLy() {
    var sec = document.getElementById('sc-DTQuanLy');
    if (!sec || !window.PLG_THANG) return;
    /* màn này là của chi nhánh, không phải của một người — dùng nút chọn chi nhánh */
    var hopNut = sec.querySelector('[data-mp-nut]');
    if (!hopNut) {
      var o = $$('div,span', sec).filter(function (e) {
        return e.children.length === 0 && /^Đăng nhập:/.test(gon(e.textContent));
      })[0];
      if (!o) return;
      hopNut = document.createElement('div');
      hopNut.setAttribute('data-mp-nut', '1');
      hopNut.setAttribute('style', 'display:flex;gap:4px;margin-top:5px');
      (o.parentNode || o).appendChild(hopNut);
    }
    if (chon.DTQuanLy === null) chon.DTQuanLy = 'CN3';
    hopNut.innerHTML = ['CN1', 'CN2', 'CN3'].map(function (ma) {
      var la = ma === chon.DTQuanLy;
      return '<button type="button" data-mp="DTQuanLy" data-ten="' + ma + '" '
        + 'style="cursor:pointer;border:1px solid ' + (la ? '#2F75B5' : '#D9E2EC') + ';background:'
        + (la ? '#2F75B5' : '#FFFFFF') + ';color:' + (la ? '#FFFFFF' : '#5F6B7A')
        + ';font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;font-family:inherit">'
        + TEN_CN[ma] + '</button>';
    }).join('');

    var ma = chon.DTQuanLy;
    /* tên chi nhánh trên đầu màn */
    ['PHI LONG 1', 'PHI LONG 2', 'PHI LONG 3'].forEach(function (t) {
      var e = nhanTrong(sec, t);
      if (e && e.parentNode && /Đăng nhập/.test(gon(e.parentNode.textContent))) e.textContent = TEN_CN[ma];
    });

    var dt = soCN(ma, K.DT), vao = soCN(ma, K.VAO), atx = soCN(ma, K.ATX), lich = soCN(ma, K.LICH);
    /* thẻ "hôm nay" — file chỉ có luỹ kế tháng nên ghi rõ là tháng */
    doThe(sec, 'Doanh thu (tr)',            dt ? dt.dat : null,  dt ? dt.kpi : null,  'tr');
    doThe(sec, 'Xe vào xưởng',              vao ? vao.dat : null, vao ? vao.kpi : null, '');
    doThe(sec, 'Phiếu kiểm tra an toàn',    atx ? atx.dat : null, atx ? atx.kpi : null, '');
    doThe(sec, 'Hẹn ngày mai',              lich ? lich.dat : null, lich ? lich.kpi : null, '');
    var tieu = $$('div,span', sec).filter(function (e) {
      return e.children.length === 0 && /^HÔM NAY/.test(gon(e.textContent));
    })[0];
    if (tieu) tieu.textContent = 'LUỸ KẾ THÁNG · ' + TEN_CN[ma];

    /* 5 trụ cột tuần */
    [['Kết quả · doanh thu', K.DT], ['Dịch vụ · bảo dưỡng', K.BDSC],
     ['Kiểm tra · phiếu an toàn', K.ATX], ['Báo giá · tỷ lệ chốt', K.CHOT],
     ['Khách hàng · hẹn trước', K.LICH]].forEach(function (x) {
      var o = nhanTrong(sec, x[0]);
      if (!o) return;
      var d = soCN(ma, x[1]);
      var p = (d && d.kpi && d.dat !== null) ? d.dat / d.kpi * 100 : null;
      var h = hang(p);
      var hs = o.nextElementSibling;
      if (hs) {
        if (hs.children.length) {
          hs.children[0].textContent = (p === null) ? '—' : (Math.round(p) + '%');
          var b = hs.children[1];
          if (b) { b.textContent = h.chu; b.style.background = h.nen; b.style.color = h.mau; }
        } else {
          hs.textContent = (p === null) ? '—' : (Math.round(p) + '%');
        }
      }
    });

    /* đội ngũ hôm nay — người của chi nhánh đang chọn */
    var ns = window.PLG_NHANSU;
    if (ns) {
      var ds = (ns.kd || []).concat(ns.kt || []).filter(function (p) { return p.cn === ma; });
      var o = $$('div,span', sec).filter(function (e) {
        return e.children.length === 0 && /^ĐỘI NGŨ/.test(gon(e.textContent));
      })[0];
      if (o && o.parentNode) {
        var cha = o.parentNode;
        while (o.nextElementSibling) cha.removeChild(o.nextElementSibling);
        if (!ds.length) {
          var d0 = document.createElement('div');
          d0.setAttribute('style', 'font-size:11px;color:#5F6B7A;padding:5px 0');
          d0.textContent = 'chi nhánh này chưa có ai nhập số trong file KPI';
          cha.appendChild(d0);
        }
        ds.slice(0, 6).forEach(function (p) {
          var d = document.createElement('div');
          d.setAttribute('style', 'display:flex;gap:6px;font-size:11.5px;padding:4px 0;border-top:1px solid #EEF2F6');
          d.innerHTML = '<b style="min-width:0;flex:1">' + gon(p.ten) + '</b>'
            + '<span style="color:#5F6B7A">' + (p.luot ? (p.luot + ' lượt · ') : '')
            + (p.pkt ? (p.pkt + ' phiếu · ') : '') + tr(p.tong) + ' tr</span>';
          cha.appendChild(d);
        });
      }
    }
  }

  /* ---------- màn TƯ VẤN DỊCH VỤ ---------- */
  function veTuVan() {
    var sec = document.getElementById('sc-DTTuVan');
    if (!sec) return;
    var ns = window.PLG_NHANSU;
    var ds = ns ? (ns.kd || []) : [];
    var ai = veNutNguoi('DTTuVan', ds, null);
    if (!ai) return;
    /* dòng tên dưới "Đăng nhập: Tư vấn dịch vụ" */
    var e = $$('div,span', sec).filter(function (x) {
      return x.children.length === 0 && /·\s*PHI LONG|·\s*CN\d/.test(gon(x.textContent));
    })[0];
    if (e) e.textContent = gon(ai.ten) + ' · ' + (TEN_CN[ai.cn] || ai.cn);

    doThe(sec, 'Báo giá đã chốt', null, null, '');     /* file không có báo giá theo người */
    var o = nhanTrong(sec, 'Báo giá đã chốt');
    if (o && o.nextElementSibling && o.nextElementSibling.children.length) {
      o.nextElementSibling.children[0].textContent = 'chưa có';
      var b2 = o.nextElementSibling.children[1];
      if (b2) b2.textContent = 'file chưa có dòng báo giá theo người';
      o.nextElementSibling.children[0].style.fontSize = '13px';
      if (b2) { b2.style.fontSize = '10px'; b2.style.color = '#B4600A'; }
    }
    doThe(sec, 'Hẹn ngày mai', ai.luot || null, null, '');

    /* dòng tóm tắt tuần */
    var t = $$('div,span', sec).filter(function (x) {
      return x.children.length === 0 && /Tuần này chốt/.test(gon(x.textContent));
    })[0];
    if (t) {
      t.textContent = 'Tháng này: doanh thu lốp ' + tr(ai.lop) + ' tr · BD+SC ' + tr(ai.bdsc)
                    + ' tr · tổng ' + tr(ai.tong) + ' tr'
                    + (ai.luot ? (' · ' + ai.luot + ' lượt xe') : ' · chưa nhập lượt xe');
    }
  }

  /* ---------- màn KỸ THUẬT VIÊN ---------- */
  function veKyThuat() {
    var sec = document.getElementById('sc-DTKyThuat');
    if (!sec) return;
    var ns = window.PLG_NHANSU;
    var ds = ns ? (ns.kt || []) : [];
    var ai = veNutNguoi('DTKyThuat', ds, null);
    if (!ai) return;
    var e = $$('div,span', sec).filter(function (x) {
      return x.children.length === 0 && /·\s*PHI LONG|·\s*CN\d/.test(gon(x.textContent));
    })[0];
    if (e) e.textContent = gon(ai.ten) + ' · ' + (TEN_CN[ai.cn] || ai.cn);

    doThe(sec, 'Xe hoàn tất', ai.luot === null || ai.luot === undefined ? null : ai.luot, null, '');
    /* KPI phiếu kiểm tra: 2 phiếu/ngày × số ngày đi làm, không tính Chủ nhật */
    var n = new Date(), nam = n.getFullYear(), th = n.getMonth();
    var het = new Date(nam, th + 1, 0).getDate(), lam = 0;
    for (var i = 1; i <= Math.min(het, n.getDate()); i++) {
      if (new Date(nam, th, i).getDay() !== 0) lam++;
    }
    doThe(sec, 'Phiếu kiểm tra an toàn', ai.pkt || 0, lam * 2, '');

    var t = $$('div,span', sec).filter(function (x) {
      return x.children.length === 0 && /Tuần này .* xe/.test(gon(x.textContent));
    })[0];
    if (t) {
      t.textContent = 'Tháng này: DVL ' + tr(ai.dvl) + ' tr · DVNL ' + tr(ai.dvnl)
                    + ' tr · ' + (ai.pkt || 0) + ' phiếu kiểm tra'
                    + (ai.luot ? (' · ' + ai.luot + ' lượt xe') : ' · chưa nhập lượt xe');
    }
  }

  /* ---------- TAB KHÁCH HÀNG ---------- */
  function veKhachHang() {
    var sec = document.getElementById('sc-TabKhachHang');
    if (!sec || !window.PLG_THANG) return;
    function the(nhan, chu, phu, mau) {
      var o = nhanTrong(sec, nhan);
      if (!o) return;
      var hs = o.nextElementSibling;
      if (hs) {
        hs.textContent = chu;
        if (mau) hs.style.color = mau;
        var p = hs.nextElementSibling;
        if (p && phu !== undefined) p.textContent = phu;
      }
    }
    /* cuộc gọi chăm sóc — có trong tab KPI ngày */
    var goi = ['CN1', 'CN2', 'CN3'].map(function (m) { return soCN(m, K.GOI); });
    var dat = 0, kpi = 0, co = 0;
    goi.forEach(function (d) { if (d) { co++; kpi += d.kpi; if (d.dat !== null) dat += d.dat; } });
    if (co) {
      var p = kpi ? Math.round(dat / kpi * 100) : null;
      the('Gọi chăm sóc sau DV', (p === null ? '—' : p + '%'),
          Math.round(dat) + '/' + Math.round(kpi) + ' cuộc gọi trong tháng', hang(p).mau);
    }
    /* điểm Google — chỉ hiện khi API Google đã nối, không để số minh hoạ */
    var gg = window.PL_GG && window.PL_GG.cn ? window.PL_GG.cn : null;
    if (gg) {
      var s = 0, n = 0, dong = [];
      gg.forEach(function (g) {
        if (g.sao === null || g.sao === undefined) return;
        s += g.sao; n++;
        dong.push((TEN_CN[g.ma] || g.ma) + ' ' + String(g.sao).replace('.', ','));
      });
      if (n) the('Điểm Google TB', (Math.round(s / n * 10) / 10).toString().replace('.', ',') + '★',
                 dong.join(' · '));
    } else {
      the('Điểm Google TB', 'chưa nối', 'nguồn Google Places chưa cấu hình');
      the('Đánh giá mới tuần', '—', 'chưa nối nguồn Google');
    }
    /* khen và khiếu nại: do chi nhánh tự nhập ở Bước 3, không có nguồn số */
    the('Lời khen', '—', 'chi nhánh tự nhập ở bước 3');
    the('Khiếu nại', '—', 'chi nhánh tự nhập ở bước 3');
    the('Khách quay lại 90 ngày', '—', 'file chưa có chỉ số này');
  }

  /* ---------- badge ---------- */
  function veBadge() {
    [['DTQuanLy', !!window.PLG_THANG], ['DTTuVan', !!window.PLG_NHANSU],
     ['DTKyThuat', !!window.PLG_NHANSU], ['TabKhachHang', !!window.PLG_THANG]].forEach(function (x) {
      if (!x[1]) return;
      var sec = document.getElementById('sc-' + x[0]);
      if (!sec) return;
      var b = sec.querySelector('.pl-badge-nguon');
      if (b && /MINH HỌA|ĐANG TẢI/.test(b.textContent || '')) {
        b.textContent = 'SỐ LIVE';
        b.style.background = '#E7F5EC';
        b.style.color = '#1E6B3A';
      }
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var man = t.getAttribute('data-mp');
    if (!man) return;
    chon[man] = t.getAttribute('data-ten');
    chay();
  }, true);

  function chay() {
    try { veQuanLy(); } catch (e) { }
    try { veTuVan(); } catch (e) { }
    try { veKyThuat(); } catch (e) { }
    try { veKhachHang(); } catch (e) { }
    try { veBadge(); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setInterval(chay, 3000);
})();
