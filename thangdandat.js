/* ════════════════════════════════════════════════════════════════════
   CỘT "LUỸ KẾ THÁNG" cho 3 màn Bước 3 · giải trình chi nhánh
   Nguồn: tab "BÁO CÁO KPI NGÀY T11" của 3 file chi nhánh — ĐỌC THẲNG
   bằng CSV, đúng cách trang đường đua duaxe.html đang đọc.
   Cột lấy: KPI THÁNG (khoá từ dòng DOANH THU MỤC TIÊU) và THỰC ĐẠT THÁNG.
   Không đụng tới số tuần của Apps Script.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var FILE = {
    GB3BinhDuong: { id: '1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc', gid: '489409049'  },
    GB3BinhPhuoc: { id: '1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k', gid: '1426227108' },
    GB3ChiNhanh3: { id: '1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc', gid: '247752852'  }
  };
  /* 14 dòng của bảng chi tiết — ĐÚNG THỨ TỰ MAP_CHI_TIET trong giaoban.html.
     Chuẩn tab: I · DOANH THU (5 dòng) + II · DẪN DẮT (9 dòng).
     null = tab không có chỉ số này. */
  var DO = [
    /* I · DOANH THU */
    /DOANH\s*THU\s*M[ỤU]C\s*TIÊU/i,
    /DT l[ốo]p/i,
    /DT d[ịi]ch v[ụu]/i,
    /BD\s*-\s*SC\s*-\s*PK|NTP/i,
    null,                               /* Lãi gộp — tab chưa có */
    /* II · DẪN DẮT */
    /DT trung b[ìi]nh/i,
    /Lượt xe vào xưởng/i,
    /Lượt xe hoàn tất/i,
    /Tỷ lệ chuyển đổi/i,
    /kiểm tra ATX/i,
    /Báo\s*Gi[áa]/i,
    /Cuộc gọi/i,
    /đặt lịch/i,
    /thước lái/i
  ];
  var NGAY_THANG = 30;

  function so(v) {
    v = (v || '').replace(/[^0-9,.\-]/g, '');
    if (!v) return null;
    v = v.replace(/\./g, '').replace(/,/g, '.');
    var x = parseFloat(v);
    return isNaN(x) ? null : x;
  }
  function csv(t) {
    var R = [], c = [], f = '', q = false, i, ch;
    for (i = 0; i < t.length; i++) { ch = t[i];
      if (q) { if (ch === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { c.push(f); f = ''; }
      else if (ch === '\n') { c.push(f); R.push(c); c = []; f = ''; }
      else if (ch !== '\r') f += ch; }
    c.push(f); R.push(c); return R;
  }
  function docTab(R) {
    var ngay = null, i, j, k, r, last, key;
    for (i = 0; i < R.length && ngay === null; i++) { r = R[i];
      for (j = 0; j < r.length; j++) {
        if (/CH[ỌO]N\s*NG[ÀA]Y/i.test(r[j] || '')) {
          for (k = j + 1; k < r.length; k++) {
            var m = (r[k] || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (m) { ngay = parseInt(m[1], 10); break; }
          }
          break;
        }
      }
    }
    /* khoá cột KPI THÁNG một lần từ dòng DOANH THU MỤC TIÊU (giống duaxe.html) */
    var cot = -1;
    for (i = 0; i < R.length && cot < 0; i++) { r = R[i];
      if (!/DOANH\s*THU\s*M[ỤU]C\s*TIÊU/i.test((r[0] || '') + ' ' + (r[1] || ''))) continue;
      last = -1;
      for (k = 0; k < r.length; k++) { if (/%/.test(r[k] || '')) last = k; }
      if (last > 0) cot = last - 1;
    }
    if (cot < 0) cot = 20;
    var ra = {};
    for (i = 0; i < R.length; i++) { r = R[i];
      key = (r[0] || '') + ' ' + (r[1] || '');
      for (j = 0; j < DO.length; j++) {
        if (!DO[j] || ra[j] !== undefined) continue;
        if (!DO[j].test(key)) continue;
        ra[j] = { kpi: so(r[cot]), dat: so(r[cot + 2]) };
      }
    }
    return { ngay: ngay, chi: ra };
  }
  /* chia sẻ số luỹ kế tháng cho màn Bước 5 dùng chung một nguồn */
  var MA_CN = { GB3BinhDuong: 'CN1', GB3BinhPhuoc: 'CN2', GB3ChiNhanh3: 'CN3' };

  function veMan(manId, kq) {
    try {
      window.PLG_THANG = window.PLG_THANG || {};
      if (MA_CN[manId]) window.PLG_THANG[MA_CN[manId]] = kq;
    } catch (e) { }
    var sec = document.getElementById('sc-' + manId);
    if (!sec) return;
    var nhip = kq.ngay ? (kq.ngay / NGAY_THANG * 100) : 0;
    for (var i = 0; i < DO.length; i++) {
      var el = sec.querySelector('[data-k="ct.r' + i + '.thang"]');
      if (!el) continue;
      var d = kq.chi[i];
      if (!d || !d.kpi || d.dat === null) {
        el.textContent = '—'; el.style.color = '#9AA7B5';
        el.title = 'Tháng 11: tab không có chỉ số này';
        continue;
      }
      var p = d.dat / d.kpi * 100;
      el.textContent = Math.round(p) + '%';
      el.style.color = (nhip <= 0) ? '#2F75B5'
        : (p >= nhip ? '#1E6B3A' : (p >= nhip * 0.8 ? '#6B4500' : '#B42318'));
      el.title = 'Luỹ kế tháng 11: '
        + Math.round(d.dat).toLocaleString('vi-VN') + ' / ' + Math.round(d.kpi).toLocaleString('vi-VN')
        + ' · số tới ngày ' + kq.ngay + '/11 · nhịp đúng ' + Math.round(nhip) + '%';
    }
  }
  function loiMan(manId, msg) {
    var sec = document.getElementById('sc-' + manId);
    if (!sec) return;
    for (var i = 0; i < DO.length; i++) {
      var el = sec.querySelector('[data-k="ct.r' + i + '.thang"]');
      if (el) { el.textContent = '!'; el.style.color = '#B42318'; el.title = 'Không đọc được số tháng: ' + msg; }
    }
  }

  /* Chặn số minh hoạ: khi Apps Script (số tuần) chưa trả, bảng vẫn còn tên + số demo.
     Nếu tên dòng chưa khớp MAP_CHI_TIET nghĩa là apChiTiet chưa chạy -> dọn sạch. */
  function donDemo() {
    if (typeof MAP_CHI_TIET === 'undefined') return;
    Object.keys(FILE).forEach(function (manId) {
      var sec = document.getElementById('sc-' + manId);
      if (!sec) return;
      for (var i = 0; i < MAP_CHI_TIET.length; i++) {
        var t = sec.querySelector('[data-k="ct.r' + i + '.ten"]');
        if (!t || t.textContent === MAP_CHI_TIET[i].ten) continue;
        t.textContent = MAP_CHI_TIET[i].ten;
        var so = sec.querySelector('[data-k="ct.r' + i + '.so"]');
        var pct = sec.querySelector('[data-k="ct.r' + i + '.pct"]');
        var bd = sec.querySelector('[data-k="ct.r' + i + '.badge"]');
        if (so) so.textContent = '\u2026';
        if (pct) pct.textContent = '\u2026';
        if (bd) { bd.textContent = '\u0110ANG T\u1ea2I'; bd.style.background = '#EEF2F6'; bd.style.color = '#5F6B7A'; }
      }
    });
  }

  function tai() {
    donDemo();
    Object.keys(FILE).forEach(function (manId) {
      var n = FILE[manId];
      fetch('https://docs.google.com/spreadsheets/d/' + n.id + '/gviz/tq?tqx=out:csv&gid=' + n.gid + '&_=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function (t) {
          if (/<html|DOCTYPE/i.test(t.slice(0, 200))) throw new Error('chưa mở quyền xem');
          veMan(manId, docTab(csv(t)));
        })
        .catch(function (e) { loiMan(manId, '' + (e.message || e)); });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tai);
  else tai();
  setInterval(tai, 180000);
})();
