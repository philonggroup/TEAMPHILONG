/* ════════════════════════════════════════════════════════════════════
   BƯỚC 5 · CẦN HỖ TRỢ — VIỆC GỬI TỪ APP PHI LONG GROUP
   Tracy chốt 22/11/2026: nhân sự GỬI việc cần hỗ trợ từ app trước
   17:00 hôm trước họp; màn Bước 5 đọc live đúng những việc đã gửi,
   không để quản lý gõ tay tại họp nữa.

   Nguồn: bảng HOP_HO_TRO trong file PHI LONG_GROUP (app ghi vào).
   Đọc thẳng CSV như bước 2 (viectuan.js) nên KHÔNG phụ thuộc Apps
   Script, không cần deploy lại Code.gs.

   Giữ nguyên cấu trúc 3 thẻ của demo chuẩn — chỉ CHÈN THÊM một khối
   "VIỆC ĐÃ GỬI QUA APP" vào mỗi thẻ và tự điền 2 ô câu hỏi / đã thử.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var FILE = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';
  var GID  = '1308540828';                 /* HOP_HO_TRO */
  var LINK_APP = 'https://www.appsheet.com/start/';   /* mở app để gửi việc */
  var TOI_DA = 3;                          /* mỗi chi nhánh tối đa 3 việc */

  var DS = null, loi = null, dangDoc = false;
  window.PLG_B5_CSV = 1;

  function $$(s, g) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function thoat(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- đọc CSV ---------- */
  function csv(t) {
    var r = [], h = [], o = '', q = false;
    for (var i = 0; i < t.length; i++) {
      var c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { o += '"'; i++; } else q = false; } else o += c; }
      else if (c === '"') q = true;
      else if (c === ',') { h.push(o); o = ''; }
      else if (c === '\n') { h.push(o); r.push(h); h = []; o = ''; }
      else if (c !== '\r') o += c;
    }
    if (o.length || h.length) { h.push(o); r.push(h); }
    return r;
  }

  function soTuan(s) {
    var m = gon(s).match(/W\s*(\d+)/i);
    return m ? +m[1] : null;
  }

  /* Kỳ họp đang xem: lấy theo tuần của Kế hoạch 90 ngày (API toancanh);
     chưa có thì lấy tuần lớn nhất đang có trong bảng. */
  function tuanDangXem(ds) {
    var k = window.DU_LIEU && window.DU_LIEU.kh90;
    if (k && k.tuan) return +k.tuan;
    var max = null;
    ds.forEach(function (v) { if (v.tuan !== null && (max === null || v.tuan > max)) max = v.tuan; });
    return max;
  }

  function doc() {
    if (dangDoc) return Promise.resolve();
    dangDoc = true;
    return fetch('https://docs.google.com/spreadsheets/d/' + FILE + '/gviz/tq?tqx=out:csv&gid='
                 + GID + '&_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) {
        if (/<html|DOCTYPE/i.test(t.slice(0, 200))) throw new Error('chưa mở quyền xem file');
        var v = csv(t);
        if (!v.length) throw new Error('bảng trống');
        var h = v[0].map(gon), c = {};
        h.forEach(function (x, i) { c[x] = i; });
        if (c['noi_dung'] === undefined || c['chi_nhanh'] === undefined) {
          throw new Error('bảng HOP_HO_TRO thiếu cột');
        }
        var ra = [];
        for (var i = 1; i < v.length; i++) {
          var noi = gon(v[i][c['noi_dung']]);
          if (!noi) continue;
          var hien = gon(v[i][c['hien_thi']]).toUpperCase();
          if (hien === 'FALSE' || hien === '0') continue;
          var tt = gon(v[i][c['trang_thai']]);
          if (/^\s*3\.|đã xử lý/i.test(tt)) continue;        /* việc đã xử lý thì rời màn họp */
          ra.push({
            id:      gon(v[i][c['id']]),
            tuan:    soTuan(v[i][c['tuan_quy']]),
            cn:      gon(v[i][c['chi_nhanh']]).toUpperCase(),
            ai:      gon(v[i][c['nguoi_gui']]),
            noi:     noi,
            chiso:   gon(v[i][c['chi_so_lien_quan']]),
            dathu:   gon(v[i][c['da_tu_thu']]),
            tu:      gon(v[i][c['can_ho_tro_tu']]),
            nguon:   gon(v[i][c['nguon']]),
            tt:      tt,
            chon:    /true|1|x/i.test(gon(v[i][c['chon_ban']])),
            ngay:    gon(v[i][c['ngay_gui']])
          });
        }
        DS = ra; loi = null;
      })
      .catch(function (e) { DS = null; loi = String(e.message || e); })
      .then(function () { dangDoc = false; });
  }

  /* ---------- mã chi nhánh của từng thẻ ---------- */
  function maCuaThe(the, i) {
    var sel = the.querySelector('[data-b5-chiso]');
    var ma = sel && sel.getAttribute('data-ma');
    if (ma) return ma.toUpperCase();
    /* dự phòng: đối chiếu tên hiển thị */
    var o = the.querySelector('[data-k^="ht.c"][data-k$=".cn"]');
    var ten = gon(o && o.textContent);
    var map = (window.CAU_HINH && window.CAU_HINH.TEN_CN) ||
              { CN1: 'PHI LONG 1', CN2: 'PHI LONG 2', CN3: 'PHI LONG 3' };
    for (var k in map) { if (gon(map[k]) === ten) return k; }
    return null;
  }

  /* ---------- điền ô gõ tại họp nếu đang trống ---------- */
  function dienNeuTrong(ten, gtri) {
    if (!gtri) return;
    $$('[data-gt="' + ten + '"]').forEach(function (el) {
      if (!gon(el.textContent)) el.textContent = gtri;
    });
  }

  /* ---------- khối hiển thị trong thẻ ---------- */
  function khoi(the) {
    var co = the.querySelector('[data-b5-hotro]');
    if (co) return co;
    var box = document.createElement('div');
    box.setAttribute('data-b5-hotro', '1');
    box.style.cssText = 'border-top:1px solid #EEF2F6;padding-top:8px';
    box.innerHTML = '<div style="font-size:11px;font-weight:700;color:#1F5F99;' +
      'letter-spacing:0.3px;margin-bottom:4px">VIỆC ĐÃ GỬI QUA APP</div>' +
      '<div data-b5-hotro-ds style="font-size:11.5px;line-height:1.45;color:#1F2933;' +
      'max-height:86px;overflow:auto">—</div>';
    /* chèn ngay dưới ô "gõ việc cần cả phòng bàn" để đọc từ trên xuống */
    var cauHoi = the.querySelector('[data-gt^="B5 câu hỏi"]');
    if (cauHoi && cauHoi.parentNode === the) the.insertBefore(box, cauHoi.nextSibling);
    else the.insertBefore(box, the.children[2] || null);
    return box;
  }

  function veThe(the, i) {
    var box = khoi(the);
    var o = box.querySelector('[data-b5-hotro-ds]');
    var ma = maCuaThe(the, i);

    if (loi) {
      o.innerHTML = '<span style="color:#9B1C1C">Chưa đọc được bảng HOP_HO_TRO · ' +
                    thoat(loi) + '</span>';
      return;
    }
    if (!DS) { o.textContent = 'đang tải việc đã gửi…'; return; }
    if (!ma) {
      o.innerHTML = '<span style="color:#9AA7B5">Chưa xác định được chi nhánh của thẻ này.</span>';
      return;
    }

    var tuan = tuanDangXem(DS);
    var ds = DS.filter(function (v) {
      return v.cn === ma && (tuan === null || v.tuan === null || v.tuan === tuan);
    });
    /* việc được chọn bàn lên trước, rồi theo thứ tự gửi */
    ds.sort(function (a, b) { return (b.chon ? 1 : 0) - (a.chon ? 1 : 0); });

    if (!ds.length) {
      o.innerHTML = '<span style="color:#B4600A">Chi nhánh chưa gửi việc nào qua app cho kỳ này.</span>' +
        '<br><span style="color:#9AA7B5">Gửi trên app PHI LONG GROUP · mục Cần hỗ trợ · trước 17:00 hôm trước họp.</span>';
      return;
    }

    var html = ds.slice(0, TOI_DA).map(function (v, n) {
      var phu = [];
      if (v.ai) phu.push(v.ai);
      if (v.chiso) phu.push(v.chiso);
      if (v.tu) phu.push('cần: ' + v.tu);
      if (v.nguon && v.nguon !== 'App') phu.push('nguồn: ' + v.nguon);
      return '<div data-b5-ht-item="' + thoat(v.id) + '" style="cursor:pointer;padding:1px 0">' +
        '<b style="color:#17365D">' + (n + 1) + '. ' + thoat(v.noi) + '</b>' +
        (v.chon ? ' <span style="color:#1F5F99;font-weight:700">· ĐƯỢC CHỌN</span>' : '') +
        (phu.length ? '<br><span style="color:#9AA7B5">' + thoat(phu.join(' · ')) + '</span>' : '') +
        (v.dathu ? '<br><span style="color:#5F6B7A">đã thử: ' + thoat(v.dathu) + '</span>' : '') +
        '</div>';
    }).join('');
    if (ds.length > TOI_DA) {
      html += '<div style="color:#9B1C1C">⚠ Chi nhánh gửi ' + ds.length +
              ' việc, luật chốt tối đa ' + TOI_DA + ' — bỏ bớt trước khi họp.</div>';
    }
    o.innerHTML = html;

    /* bấm vào một việc = đưa việc đó lên ô câu hỏi và ô đã thử của thẻ */
    $$('[data-b5-ht-item]', o).forEach(function (el) {
      el.onclick = function () {
        var v = null, id = el.getAttribute('data-b5-ht-item');
        ds.forEach(function (x) { if (x.id === id) v = x; });
        if (!v) return;
        $$('[data-gt="B5 câu hỏi ' + (i + 1) + '"]').forEach(function (t) { t.textContent = v.noi; });
        if (v.dathu) {
          $$('[data-gt="B5 đã thử ' + (i + 1) + '"]').forEach(function (t) { t.textContent = v.dathu; });
        }
      };
    });

    /* tự điền việc đầu tiên nếu thư ký chưa gõ gì */
    var dau = ds[0];
    dienNeuTrong('B5 câu hỏi ' + (i + 1), dau.noi);
    dienNeuTrong('B5 đã thử ' + (i + 1), dau.dathu);
  }

  function ve() {
    var cac = $$('#b5-hang [data-b5]');
    if (!cac.length) return;
    cac.forEach(function (the) { veThe(the, +the.getAttribute('data-b5') || 0); });

    /* nhãn đầu màn: số việc thật đã gửi, thay câu cố định "Ba việc…" */
    if (DS) {
      var tuan = tuanDangXem(DS);
      var n = DS.filter(function (v) {
        return tuan === null || v.tuan === null || v.tuan === tuan;
      }).length;
      $$('[data-k="ht.tieude"]').forEach(function (el) {
        el.textContent = n
          ? n + ' việc đã gửi qua app trước 17:00' + (tuan ? ' · W' + tuan : '')
          : 'Chưa có việc nào gửi qua app' + (tuan ? ' · W' + tuan : '');
      });
    }
  }

  /* API cho giaoban.html gọi lại sau mỗi lần nạp live */
  window.PLG_B5_HT = function () { ve(); };

  function chay() { doc().then(ve); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', chay);
  } else { chay(); }

  /* tự làm mới cùng nhịp với trang */
  var nhip = (window.CAU_HINH && window.CAU_HINH.TU_LAM_MOI) || 180;
  if (nhip > 0) setInterval(chay, nhip * 1000);
})();
