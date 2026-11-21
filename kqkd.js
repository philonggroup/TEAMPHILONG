/* ════════════════════════════════════════════════════════════════════
   TAB CHI NHÁNH ← sheet "KQKD T<m>"
   TAB TỔNG KẾT  ← sheet "ĐÁNH GIÁ 6 THÁNG"
   Tracy chốt 21/11/2026: đưa hai sheet này lên dashboard, dùng cho
   họp 1-1 và họp tháng, không chiếu giao ban tuần.

   Đọc thẳng CSV của từng chi nhánh, tìm dòng THEO NHÃN chứ không theo
   số dòng cứng, nên thêm bớt dòng trong file vẫn chạy.
   Doanh thu đọc được ở đây phải khớp với nguồn KPI ngày đang dùng cho
   bước 3 · 5 · 7; lệch quá 2% thì ghi cảnh báo ngay trên màn.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var FILE = {
    CN1: { id: '1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc', kqkd: '2033282698', dg6: '2095848811' },
    CN2: { id: '1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k', kqkd: '839530373',  dg6: '299905825'  },
    CN3: { id: '1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc', kqkd: '693579054',  dg6: '1349929061' }
  };
  var TEN_CN = { CN1: 'PHI LONG 1', CN2: 'PHI LONG 2', CN3: 'PHI LONG 3' };
  var DU = { kqkd: {}, dg6: {} };

  function $$(s, g) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function bo(t) { return gon(t).toLowerCase().replace(/[^0-9a-zà-ỹ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }

  /* ---------- CSV ---------- */
  function csv(t) {
    var r = [], h = [], o = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (q) {
        if (c === '"') { if (t[i + 1] === '"') { o += '"'; i++; } else q = false; }
        else o += c;
      } else if (c === '"') q = true;
      else if (c === ',') { h.push(o); o = ''; }
      else if (c === '\n') { h.push(o); r.push(h); h = []; o = ''; }
      else if (c !== '\r') o += c;
    }
    if (o.length || h.length) { h.push(o); r.push(h); }
    return r;
  }
  /* "516.491.510" · "45,0%" · "-53,8%" → số */
  function num(x) {
    var s = gon(x);
    if (!s || s === '-' || s === '—') return null;
    var pt = /%/.test(s);
    s = s.replace(/[^\d,.\-]/g, '');
    if (s.indexOf(',') >= 0 && s.indexOf('.') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    else if (s.indexOf(',') >= 0) s = s.replace(',', '.');
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, '');
    else if (/\.\d{3}$/.test(s)) s = s.replace(/\./g, '');
    var v = parseFloat(s);
    if (isNaN(v)) return null;
    return pt ? v : v;
  }
  /* tìm dòng theo nhãn ở bất kỳ cột nào, trả cả dòng */
  function dong(ds, nhan) {
    var k = bo(nhan);
    for (var i = 0; i < ds.length; i++) {
      for (var j = 0; j < Math.min(ds[i].length, 4); j++) {
        if (bo(ds[i][j]).indexOf(k) === 0) return { d: ds[i], cot: j };
      }
    }
    return null;
  }
  /* giá trị đầu tiên SAU ô chứa nhãn — nếu bắt đầu từ cột 1 thì
     "Cùng kỳ 2025 (cả tháng)" sẽ trả về 2025 thay vì số tiền */
  function giaTri(ds, nhan) {
    var t = dong(ds, nhan);
    if (!t) return null;
    for (var j = t.cot + 1; j < t.d.length; j++) {
      var v = num(t.d[j]);
      if (v !== null) return v;
    }
    return null;
  }

  /* ---------- đọc KQKD T<m> ---------- */
  function docKQKD(ds) {
    var r = {
      dt: giaTri(ds, 'Doanh thu thực tế trong kỳ'),
      kpi: giaTri(ds, 'KPI kỳ'),
      ngay: giaTri(ds, 'Số ngày trong kỳ'),
      cungKy: giaTri(ds, 'Cùng kỳ 2025'),
      tang: giaTri(ds, 'Tăng trưởng so cùng kỳ'),
      loai: []
    };
    /* bảng II. DOANH THU THEO LOẠI — các mã viết hoa ở cột 1 */
    var bat = false;
    ds.forEach(function (d) {
      var c1 = gon(d[1]), c2 = gon(d[2]);
      if (/^II\./.test(c1) || /doanh thu theo loại/i.test(c1)) { bat = true; return; }
      if (bat && /^III\./.test(c1)) { bat = false; return; }
      if (!bat) return;
      if (!/^[A-ZĐ]{2,5}$/.test(c1)) return;          /* LX · DVL · DVNL · BD · SC */
      var tien = num(d[3]);
      if (tien === null) return;
      r.loai.push({ ma: c1, ten: c2 || c1, tien: tien, ty: num(d[5]) });
    });
    return r;
  }

  /* ---------- đọc ĐÁNH GIÁ 6 THÁNG ---------- */
  function docDG6(ds) {
    function hang(nhan) {
      var t = dong(ds, nhan);
      if (!t) return null;
      /* 12 cột T1..T12 nằm ngay sau ô nhãn */
      var ra = [];
      for (var j = t.cot + 1; j < t.cot + 13 && j < t.d.length; j++) ra.push(num(t.d[j]));
      return ra;
    }
    return {
      kpi: hang('KPI NĂM 2026'),
      lam: hang('THỰC HIỆN'),
      cu: hang('Cùng kỳ 2025'),
      conPhaiDat: giaTri(ds, 'CÒN PHẢI ĐẠT trong Q4'),
      ngayConLai: giaTri(ds, 'Số ngày Q4 còn lại'),
      dtNgayCan: giaTri(ds, 'DT/ngày CẦN')
    };
  }

  /* ---------- nạp ---------- */
  function tai() {
    Object.keys(FILE).forEach(function (ma) {
      var n = FILE[ma];
      [['kqkd', n.kqkd], ['dg6', n.dg6]].forEach(function (x) {
        fetch('https://docs.google.com/spreadsheets/d/' + n.id + '/gviz/tq?tqx=out:csv&gid='
              + x[1] + '&_=' + Date.now(), { cache: 'no-store' })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
          .then(function (t) {
            if (/<html|DOCTYPE/i.test(t.slice(0, 200))) throw new Error('chưa mở quyền xem');
            var ds = csv(t);
            DU[x[0]][ma] = (x[0] === 'kqkd') ? docKQKD(ds) : docDG6(ds);
            window.PLG_KQKD = DU;
            ve();
          })
          .catch(function (e) { DU[x[0]][ma] = { loi: '' + (e.message || e) }; });
      });
    });
  }

  /* ---------- vẽ ---------- */
  function trieu(v) { return v === null || v === undefined ? null : Math.round(v / 1e6); }
  function cham(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  function hang2(p) {
    if (p === null) return { chu: 'CHƯA ĐO', nen: '#EEF2F6', mau: '#5F6B7A' };
    if (p < 70)  return { chu: 'ĐUỐI', nen: '#FBE4E2', mau: '#B42318' };
    if (p < 90)  return { chu: 'ĐƯỢC', nen: '#FFF2CC', mau: '#B4600A' };
    if (p <= 100) return { chu: 'ĐẠT', nen: '#E7F5EC', mau: '#1E6B3A' };
    return { chu: 'ĐỈNH', nen: '#EDE4FB', mau: '#6D28D9' };
  }
  function nhanTrong(sec, chu) {
    return $$('div,span,b', sec).filter(function (e) {
      return e.children.length === 0 && gon(e.textContent) === chu;
    })[0] || null;
  }
  function datPct(sp, p) {
    if (!sp) return;
    var h = hang2(p), b = sp.querySelector('span');
    sp.textContent = (p === null) ? '— ' : (Math.round(p) + '% ');
    if (b) { b.textContent = h.chu; b.style.background = h.nen; b.style.color = h.mau; sp.appendChild(b); }
  }

  /* tổng 3 chi nhánh của KQKD */
  function tongKQ() {
    var dt = 0, kpi = 0, cu = 0, co = 0, loai = {};
    Object.keys(FILE).forEach(function (ma) {
      var k = DU.kqkd[ma];
      if (!k || k.loi || k.dt === null) return;
      co++; dt += k.dt; if (k.kpi) kpi += k.kpi; if (k.cungKy) cu += k.cungKy;
      (k.loai || []).forEach(function (l) {
        if (!loai[l.ma]) loai[l.ma] = { ten: l.ten, tien: 0 };
        loai[l.ma].tien += l.tien;
      });
    });
    return co ? { dt: dt, kpi: kpi, cu: cu, soCN: co, loai: loai } : null;
  }

  function veChiNhanh() {
    var sec = document.getElementById('sc-TabChiNhanh');
    var t = tongKQ();
    if (!sec || !t) return;
    /* cơ cấu doanh thu theo đúng nhóm trong file KQKD */
    var o = nhanTrong(sec, 'Doanh thu theo nhóm dịch vụ');
    if (o && o.parentNode) {
      var cha = o.parentNode;
      if (cha.getAttribute('data-kq') !== '1') {
        cha.setAttribute('data-kq', '1');
        while (o.nextElementSibling) cha.removeChild(o.nextElementSibling);
        Object.keys(t.loai).forEach(function (ma) {
          var l = t.loai[ma];
          var d = document.createElement('div');
          d.setAttribute('style', 'display:flex;justify-content:space-between;gap:8px;'
            + 'font-size:12px;padding:5px 0;border-top:1px solid #EEF2F6');
          d.innerHTML = '<span style="color:#5F6B7A">' + l.ten + '</span>'
            + '<b style="color:#17365D">' + cham(trieu(l.tien)) + ' tr · '
            + Math.round(l.tien / t.dt * 100) + '%</b>';
          cha.appendChild(d);
        });
      }
    }
    /* dòng so cùng kỳ 2025 — thông tin KQKD có mà KPI ngày không có */
    var h1 = sec.querySelector('h1');
    if (h1 && t.cu) {
      var tg = Math.round((t.dt - t.cu) / t.cu * 100);
      h1.textContent = 'Phân tích chi nhánh · nguồn KQKD tháng · so cùng kỳ 2025: '
        + (tg >= 0 ? '+' : '') + tg + '%';
    }
  }

  function veTongKet() {
    var sec = document.getElementById('sc-TabTongKet');
    if (!sec) return;
    /* dải 6 tháng: lấy T7..T12 của cả 3 chi nhánh cộng lại */
    var kpi = [], lam = [];
    for (var i = 6; i < 12; i++) {
      var a = 0, b = 0, co = 0;
      Object.keys(FILE).forEach(function (ma) {
        var d = DU.dg6[ma];
        if (!d || d.loi || !d.kpi || !d.lam) return;
        if (d.kpi[i] !== null && d.kpi[i] !== undefined) { a += d.kpi[i]; co++; }
        if (d.lam[i] !== null && d.lam[i] !== undefined) b += d.lam[i];
      });
      kpi.push(co ? a : null); lam.push(co ? b : null);
    }
    var o = nhanTrong(sec, 'Doanh thu 6 tháng (% KH)');
    if (o && o.parentNode) {
      var cha = o.parentNode;
      var cot = $$('div', cha).filter(function (e) {
        return /^T\d{1,2}$/.test(gon(e.textContent));
      });
      /* cột tháng trong mẫu là T5..T10 — đổi thành T7..T12 theo file */
      cot.forEach(function (e, k) {
        if (k > 5) return;
        e.textContent = 'T' + (k + 7);
        var pct = (kpi[k] && lam[k] !== null) ? Math.round(lam[k] / kpi[k] * 100) : null;
        var tren = e.previousElementSibling;
        if (tren) {
          tren.textContent = (pct === null) ? '—' : (pct + '%');
          tren.style.color = hang2(pct).mau;
        }
      });
    }
    /* thêm dòng Q4 còn phải đạt — số CEO cần nhất */
    var con = 0, ngay = null, canNgay = 0, coQ4 = 0;
    Object.keys(FILE).forEach(function (ma) {
      var d = DU.dg6[ma];
      if (!d || d.loi || d.conPhaiDat === null) return;
      coQ4++; con += d.conPhaiDat;
      if (d.dtNgayCan) canNgay += d.dtNgayCan;
      if (ngay === null && d.ngayConLai) ngay = d.ngayConLai;
    });
    if (coQ4) {
      var e = document.getElementById('tk-q4');
      if (!e) {
        var h1 = sec.querySelector('h1');
        if (h1 && h1.parentNode) {
          e = document.createElement('div');
          e.id = 'tk-q4';
          e.setAttribute('style', 'font-size:12px;color:#B42318;font-weight:700;margin-top:2px');
          h1.parentNode.insertBefore(e, h1.nextSibling);
        }
      }
      if (e) {
        e.textContent = 'Q4 còn phải đạt ' + cham(trieu(con)) + ' tr'
          + (ngay ? (' trong ' + Math.round(ngay) + ' ngày còn lại') : '')
          + (canNgay ? (' · cần ' + cham(trieu(canNgay)) + ' tr/ngày') : '')
          + ' · nguồn ĐÁNH GIÁ 6 THÁNG';
      }
    }
  }

  /* ---------- tra soát chéo với nguồn KPI ngày ---------- */
  function traSoat() {
    var t = tongKQ();
    if (!t || !window.PLG_THANG) return;
    var dtNgay = 0, co = 0;
    ['CN1', 'CN2', 'CN3'].forEach(function (ma) {
      var th = window.PLG_THANG[ma];
      var d = th && th.chi ? th.chi[0] : null;
      if (d && d.dat) { dtNgay += d.dat; co++; }
    });
    if (!co || !dtNgay) return;
    var lech = Math.abs(t.dt - dtNgay) / dtNgay * 100;
    var sec = document.getElementById('sc-TabChiNhanh');
    if (!sec) return;
    var e = document.getElementById('tk-lech');
    if (!e) {
      var h1 = sec.querySelector('h1');
      if (!h1 || !h1.parentNode) return;
      e = document.createElement('div');
      e.id = 'tk-lech';
      e.setAttribute('style', 'font-size:11px;font-weight:700;margin-top:2px');
      h1.parentNode.insertBefore(e, h1.nextSibling);
    }
    if (lech > 2) {
      e.textContent = '⚠ KQKD ' + cham(trieu(t.dt)) + ' tr vs KPI ngày ' + cham(trieu(dtNgay))
        + ' tr — lệch ' + lech.toFixed(1) + '%, cần đối chiếu lại file';
      e.style.color = '#B42318';
    } else {
      e.textContent = '✓ KQKD khớp nguồn KPI ngày (' + cham(trieu(t.dt)) + ' tr)';
      e.style.color = '#1E6B3A';
    }
  }

  function ve() {
    try { veChiNhanh(); } catch (e) { }
    try { veTongKet(); } catch (e) { }
    try { traSoat(); } catch (e) { }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tai);
  else tai();
  setInterval(ve, 3000);
  setInterval(tai, 300000);
})();
