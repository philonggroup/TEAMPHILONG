/* ════════════════════════════════════════════════════════════════════
   BƯỚC 6 · CHỐT VIỆC VÀ ĐỌC BIÊN BẢN — số thật, không minh hoạ
   Tracy chốt 21/11/2026:
     · Thư ký đọc · người nhận nói "Cam kết"
     · Chưa ghi lên dashboard là chưa chốt
     · Thiếu một trong 4 yếu tố (ai · làm gì · hạn · đo bằng gì)
       thì thư ký hỏi lại ngay  → ô thiếu tô vàng, đếm không tính
   Nguồn việc: bảng CONG_VIEC của file PHI LONG_GROUP (API toancanh),
   cộng chiến lược đã tick ở Bước 5, cộng việc gõ thêm tại họp.
   Trạng thái "Cam kết", giờ ghi dashboard và việc gõ thêm lưu trên
   máy đang họp (localStorage).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var COT = 'display:grid;grid-template-columns:minmax(0,2fr) 160px 72px minmax(0,1.1fr) 178px;gap:10px';
  var CN_TEN = { TAT: 'TẤT CẢ', CN1: 'PHI LONG 1', CN2: 'PHI LONG 2', CN3: 'PHI LONG 3' };
  var cnDang = 'TAT';
  var DS = [];          /* việc đọc từ file */
  var THEM = [];        /* việc gõ thêm tại họp */

  function el(id) { return document.getElementById(id); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function thoat(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function lay(k, md) { try { var v = localStorage.getItem('plg.b6.' + k); return v === null ? md : v; } catch (e) { return md; } }
  function ghi(k, v) { try { localStorage.setItem('plg.b6.' + k, v); } catch (e) { } }

  /* khoá ổn định cho một việc, để trạng thái cam kết không trôi khi đổi thứ tự */
  function khoaViec(v) {
    var g = v.goc || v.lam;
    return 'ck.' + gon(g).slice(0, 60).replace(/[^0-9A-Za-zÀ-ỹ]+/g, '_');
  }
  /* sửa tay tại họp lưu theo khoá gốc, nên sửa xong vẫn giữ đúng dòng */
  function khoaSua(v, truong) { return 'sua.' + khoaViec(v).slice(3) + '.' + truong; }
  function apSua(v) {
    /* giữ nguyên bản đọc từ file, sửa tay chỉ phủ lên bản sao —
       xoá sửa tay thì giá trị file quay lại ngay */
    if (!v.g) v.g = { lam: v.lam, ai: v.ai, han: v.han, do: v.do };
    ['lam', 'ai', 'han', 'do'].forEach(function (t) {
      var x = lay(khoaSua(v, t), null);
      v[t] = (x === null) ? v.g[t] : x;
    });
    return v;
  }

  function xongRoi(tt) { return /hoàn thành|xong|đã xong/i.test(tt || ''); }

  /* hạn ghi dạng 20/11 hoặc 20/11/2026 — so với hôm nay để biết đã trễ chưa */
  function quaHan(han) {
    var m = gon(han).match(/^(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})(?:\s*[\/\-\.]\s*(\d{2,4}))?$/);
    if (!m) return false;
    var nay = new Date(), nam = m[3] ? parseInt(m[3], 10) : nay.getFullYear();
    if (nam < 100) nam += 2000;
    var h = new Date(nam, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    var homNay = new Date(nay.getFullYear(), nay.getMonth(), nay.getDate());
    return h < homNay;
  }
  /* trạng thái người nhận: '' chờ · 1 cam kết · hq huỷ quá hạn · hk huỷ không khả thi */
  function nhanTT(v) { return lay(khoaViec(v), ''); }

  /* ---------- 1. đọc việc từ API ---------- */
  function docFile(j) {
    var ra = [];
    (j && j.viec_tuan_truoc || []).forEach(function (v) {
      var t = gon(v.viec), ma = 'KHAC', m = t.match(/^(CN\d)\s*·\s*/);
      if (m) { ma = m[1]; t = t.slice(m[0].length); }
      ra.push({
        lam: t,
        ai: gon(v.ai),
        han: gon(v.han),
        do: gon(v.chi_so),
        tt: gon(v.trang_thai),
        cn: ma,
        nguon: 'CONG_VIEC'
      });
    });
    /* HOP_CAM_KET — việc đã chốt ở các tuần trước, nếu bảng có dòng */
    (j && j.cam_ket || []).forEach(function (v) {
      ra.push({
        lam: gon(v.noi_dung), ai: gon(v.ho_va_ten || v.ma_nv),
        han: gon(v.han), do: gon(v.chi_so), tt: gon(v.trang_thai),
        cn: gon(v.chi_nhanh) || 'KHAC', nguon: 'HOP_CAM_KET'
      });
    });
    return ra;
  }

  /* ---------- 2. chiến lược đã tick ở Bước 5 ---------- */
  function docTick() {
    var ra = [], sec = el('sc-GB5HoTro');
    if (!sec) return ra;
    Array.prototype.slice.call(sec.querySelectorAll('[data-tick]')).forEach(function (t) {
      /* bước 5 đánh dấu chọn bằng ký tự ☑ ngay trong ô tick */
      if ((t.textContent || '').indexOf('\u2611') < 0) return;
      var d = t.parentNode, chu = gon(d ? d.textContent : '');
      chu = chu.replace(/[\u2611\u2610]/g, '').replace(/→\s*bước\s*6\s*$/i, '');
      chu = gon(chu);
      if (!chu) return;
      /* chiến lược nằm trong thẻ chi nhánh nào thì thuộc chi nhánh đó */
      var ma = 'KHAC', the = d;
      while (the && the !== sec) {
        if (the.getAttribute && the.getAttribute('data-b5') !== null) {
          var i = parseInt(the.getAttribute('data-b5'), 10);
          var ocn = document.querySelector('[data-k="ht.c' + i + '.cn"]');
          var tcn = ocn ? gon(ocn.textContent) : '';
          if (/1/.test(tcn)) ma = 'CN1';
          else if (/2/.test(tcn)) ma = 'CN2';
          else if (/3/.test(tcn)) ma = 'CN3';
          break;
        }
        the = the.parentNode;
      }
      ra.push({ lam: chu, ai: '', han: '', do: '', tt: 'Chốt tại họp', cn: ma, nguon: 'Bước 5' });
    });
    return ra;
  }

  /* ---------- 3. việc gõ thêm tại họp ---------- */
  function docThem() {
    var n = parseInt(lay('them.n', '0'), 10) || 0, ra = [];
    for (var i = 0; i < n; i++) {
      var o = {
        lam: lay('them.' + i + '.lam', ''), ai: lay('them.' + i + '.ai', ''),
        han: lay('them.' + i + '.han', ''), do: lay('them.' + i + '.do', ''),
        tt: 'Chốt tại họp', cn: lay('them.' + i + '.cn', 'KHAC'), nguon: 'gõ tại họp', ix: i
      };
      if (o.lam || o.ai || o.han || o.do) ra.push(o);
    }
    return ra;
  }
  function luuThem(i, truong, giaTri) {
    ghi('them.' + i + '.' + truong, giaTri);
    var n = parseInt(lay('them.n', '0'), 10) || 0;
    if (i + 1 > n) ghi('them.n', String(i + 1));
  }

  /* ---------- 4. vẽ bảng ---------- */
  function du4(v) { return !!(gon(v.lam) && gon(v.ai) && gon(v.han) && gon(v.do)); }

  function oThieu(chu, goi, sua) {
    var thieu = !gon(chu);
    var n = 'style="' + (thieu
      ? 'background:#FFF2CC;border-bottom:1px dashed #D9A200;color:#6B4500;font-style:italic'
      : 'color:#1F2933') + (sua ? ';cursor:text' : '') + '"';
    return '<div ' + n + (sua ? ' contenteditable="true" spellcheck="false" data-sua="' + sua + '"' : '') + '>'
      + (thieu ? thoat(goi) : thoat(chu)) + '</div>';
  }

  /* so khớp nội dung việc để không đọc biên bản hai lần cùng một việc */
  function chuan(t) {
    return gon(t).toLowerCase().replace(/[^0-9a-zà-ỹ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function trungVoi(ds, v) {
    var a = chuan(v.lam);
    if (a.length < 18) return false;
    return ds.some(function (x) {
      var b = chuan(x.lam);
      if (b.length < 18) return false;
      return a === b || a.indexOf(b) >= 0 || b.indexOf(a) >= 0;
    });
  }

  function ve() {
    var than = el('b6-than'), trong = el('b6-trong');
    if (!than) return;
    /* việc từ file giữ nguyên; chiến lược Bước 5 và việc gõ thêm bị bỏ nếu đã có */
    var tat = DS.slice();
    docTick().concat(docThem()).forEach(function (v) {
      if (!trungVoi(tat, v)) tat.push(v);
    });
    /* giữ bản gốc để khoá không đổi, rồi áp các ô đã sửa tay tại họp */
    tat = tat.map(function (v) {
      if (!v.goc) v.goc = v.lam;      /* khoá dòng, không đổi khi sửa tay */
      return apSua(v);
    });
    var ds = tat.filter(function (v) { return cnDang === 'TAT' || v.cn === cnDang; });

    than.innerHTML = '';
    var sDu = 0, sCk = 0, sCan = 0, sTon = 0, sQua = 0, sHuy = 0;

    ds.forEach(function (v, i) {
      if (du4(v)) sDu++;
      if (!xongRoi(v.tt)) sTon++;
      var tt = nhanTT(v), tre = quaHan(v.han) && !xongRoi(v.tt);
      var daHuy = (tt === 'hq' || tt === 'hk');
      if (tre) sQua++;
      if (daHuy) sHuy++;
      /* mẫu số cam kết: việc còn sống — bỏ việc đã xong và việc đã huỷ */
      if (!xongRoi(v.tt) && !daHuy) { sCan++; if (tt === '1') sCk++; }

      var nhan, mauN, gach = '';
      if (xongRoi(v.tt)) { nhan = 'Đã xong'; mauN = 'background:#EEF2F6;color:#5F6B7A'; }
      else if (tt === 'hq') { nhan = 'Huỷ · quá hạn'; mauN = 'background:#F1F5F9;color:#5F6B7A'; gach = ';text-decoration:line-through'; }
      else if (tt === 'hk') { nhan = 'Huỷ · không khả thi'; mauN = 'background:#F1F5F9;color:#5F6B7A'; gach = ';text-decoration:line-through'; }
      else if (tt === '1') { nhan = 'Cam kết'; mauN = 'background:#E7F5EC;color:#1E6B3A'; }
      else { nhan = 'Chờ xác nhận'; mauN = 'background:#FFF2CC;color:#6B4500'; }

      var h = document.createElement('div');
      h.setAttribute('style', COT + ';font-size:15px;padding:10px 0;border-bottom:1px solid #F1F5F9;align-items:center');
      /* Tracy chốt: mọi ô sửa được ngay tại họp, nhất là HẠN —
         thiếu một trong 4 yếu tố thì ô đó tô vàng để thư ký hỏi lại */
      var kv = khoaViec(v).slice(3);
      function oSua(truong, giaTri, goi, themStyle) {
        var thieu = !gon(giaTri);
        return '<div contenteditable="true" spellcheck="false" data-s="' + truong + '" '
          + 'data-kv="' + thoat(kv) + '" title="bấm để sửa ngay tại họp" style="cursor:text;outline:none'
          + (themStyle || '')
          + (thieu ? ';background:#FFF2CC;border-bottom:1px dashed #D9A200;color:#6B4500;font-style:italic'
                   : ';color:#1F2933;border-bottom:1px dashed #E3E9EF') + '">'
          + (thieu ? thoat(goi) : thoat(giaTri)) + '</div>';
      }
      h.innerHTML =
        oSua('lam', v.lam, 'gõ việc cần làm', ';font-weight:600' + gach)
        + oSua('ai', v.ai, 'thiếu AI — thư ký hỏi lại')
        + oSua('han', v.han, 'thiếu HẠN',
               tre ? ';color:#B42318;font-weight:800' : '')
        + oSua('do', v.do, 'thiếu CÁCH ĐO')
        + '<div style="display:flex;gap:4px;align-items:center;justify-content:center">'
          + '<button type="button" data-ck="' + thoat(khoaViec(v)) + '" '
          + (xongRoi(v.tt) ? 'disabled ' : '')
          + 'title="' + (daHuy ? 'bấm để bỏ huỷ, quay lại Chờ xác nhận' : 'người nhận nói Cam kết thì bấm') + '" '
          + 'style="min-height:34px;padding:0 8px;border-radius:5px;border:0;font-family:\'Be Vietnam Pro\',Arial,sans-serif;'
          + 'font-size:12.5px;font-weight:800;white-space:nowrap;' + mauN
          + (xongRoi(v.tt) ? '' : ';cursor:pointer') + '">' + nhan + '</button>'
          + (xongRoi(v.tt) || daHuy ? ''
             : '<button type="button" data-huy="' + thoat(khoaViec(v)) + '" title="Huỷ việc: quá hạn hoặc không khả thi" '
               + 'style="min-height:34px;width:26px;padding:0;border-radius:5px;border:1px solid #E5C7C3;'
               + 'background:#FFF;color:#B42318;font-size:14px;font-weight:800;cursor:pointer;flex-shrink:0">✕</button>')
          + '</div>';
      than.appendChild(h);
    });

    /* một dòng trống luôn sẵn để chốt thêm việc ngay tại họp */
    var nThem = docThem().length;
    var tr = document.createElement('div');
    tr.setAttribute('style', COT + ';font-size:15px;padding:10px 0;border-top:1px dashed #C3D3E3;align-items:center');
    tr.innerHTML =
      '<div contenteditable="true" spellcheck="false" data-t="lam" data-i="' + nThem + '" '
      + 'style="color:#9AA7B5;font-style:italic;cursor:text">+ chốt thêm việc tại họp</div>'
      + '<div contenteditable="true" spellcheck="false" data-t="ai" data-i="' + nThem + '" style="color:#9AA7B5;font-style:italic;cursor:text">ai</div>'
      + '<div contenteditable="true" spellcheck="false" data-t="han" data-i="' + nThem + '" style="color:#9AA7B5;font-style:italic;cursor:text">hạn</div>'
      + '<div contenteditable="true" spellcheck="false" data-t="do" data-i="' + nThem + '" style="color:#9AA7B5;font-style:italic;cursor:text">đo bằng gì</div>'
      + '<div></div>';
    than.appendChild(tr);

    if (trong) trong.style.display = ds.length ? 'none' : 'block';
    if (trong && !ds.length) trong.textContent = 'Chi nhánh này chưa có việc nào trong bảng CONG_VIEC — gõ thêm ở dòng dưới.';

    datDem(sDu, ds.length, sCk, sCan, sTon, sQua, sHuy);
  }

  function datDem(du, tong, ck, can, ton, qua, huy) {
    function d(k, chu, mau) {
      var e = document.querySelector('[data-k6="' + k + '"]');
      if (!e) return;
      e.textContent = chu;
      if (mau) e.style.color = mau;
    }
    d('du4', du + '/' + tong, du === tong && tong ? '#1E6B3A' : '#B42318');
    d('ck', ck + '/' + can, (can && ck === can) ? '#1E6B3A' : '#B4600A');
    d('ton', String(ton), ton ? '#B42318' : '#1E6B3A');
    d('qua', qua ? String(qua) + ' việc' : 'không có', qua ? '#B42318' : '#1E6B3A');
    var oh = document.querySelector('[data-k6="huy"]');
    if (oh) {
      oh.textContent = huy ? String(huy) : '0';
      oh.style.color = huy ? '#5F6B7A' : '#1E6B3A';
    }
    var g = lay('dash.' + (new Date()).toDateString(), '');
    d('dash', g || 'chưa ghi', g ? '#1E6B3A' : '#B4600A');
  }

  /* ---------- 5. nút chi nhánh ---------- */
  function veNutCN() {
    var h = el('b6-cn');
    if (!h || h.getAttribute('data-san') === '1') return;
    h.setAttribute('data-san', '1');
    ['TAT', 'CN1', 'CN2', 'CN3'].forEach(function (ma) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-b6cn', ma);
      b.textContent = CN_TEN[ma];
      h.appendChild(b);
    });
    tomauCN();
  }
  function tomauCN() {
    Array.prototype.slice.call(document.querySelectorAll('[data-b6cn]')).forEach(function (b) {
      var on = b.getAttribute('data-b6cn') === cnDang;
      b.setAttribute('style', 'min-height:32px;padding:0 13px;border-radius:7px;border:1px solid '
        + (on ? '#17365D' : '#D9E2EC') + ';background:' + (on ? '#17365D' : '#FFFFFF')
        + ';color:' + (on ? '#FFFFFF' : '#17365D')
        + ";font-family:'Be Vietnam Pro',Arial,sans-serif;font-size:13px;font-weight:700;cursor:pointer");
    });
  }

  /* ---------- 6. bắt sự kiện ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-b6cn]') : null;
    if (b) { cnDang = b.getAttribute('data-b6cn'); tomauCN(); ve(); return; }

    var h = e.target.closest ? e.target.closest('[data-huy]') : null;
    if (h) {
      var kh = h.getAttribute('data-huy');
      var ly = prompt('Huỷ việc này vì lý do nào?\n  1 = đã quá hạn, trễ deadline\n  2 = không khả thi\n  (để trống = thôi, không huỷ)', '1');
      if (ly === '1') ghi(kh, 'hq');
      else if (ly === '2') ghi(kh, 'hk');
      ve();
      return;
    }

    var c = e.target.closest ? e.target.closest('[data-ck]') : null;
    if (c && !c.disabled) {
      var k = c.getAttribute('data-ck');
      var cu = lay(k, '');
      /* đang huỷ thì bấm vào là bỏ huỷ; còn lại bật tắt Cam kết */
      ghi(k, (cu === 'hq' || cu === 'hk') ? '' : (cu === '1' ? '' : '1'));
      ve();
      return;
    }

    if (e.target.id === 'b6-ghi') { ghiBienBan(); return; }
    if (e.target.id === 'b6-pdf') { xuatPDF(); return; }
  }, true);

  document.addEventListener('blur', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (!document.contains(t)) return;      /* bỏ qua blur giả khi vẽ lại */
    var s2 = t.getAttribute('data-s'), kv = t.getAttribute('data-kv');
    if (s2 && kv) {
      var v2 = gon(t.textContent);
      if (/^(gõ việc cần làm|thiếu AI — thư ký hỏi lại|thiếu HẠN|thiếu CÁCH ĐO)$/.test(v2)) v2 = '';
      ghi('sua.' + kv + '.' + s2, v2);
      ve();
      return;
    }
    var truong = t.getAttribute('data-t'), i = t.getAttribute('data-i');
    if (!truong || i === null) return;
    var v = gon(t.textContent);
    if (/^(\+ chốt thêm việc tại họp|ai|hạn|đo bằng gì|gõ việc cần làm|gõ người nhận|gõ cách đo)$/.test(v)) v = '';
    luuThem(parseInt(i, 10), truong, v);
    if (cnDang !== 'TAT') ghi('them.' + i + '.cn', cnDang);
    ve();
  }, true);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute('data-s') !== null && e.key === 'Enter') {
      e.preventDefault(); t.blur();
    }
  }, true);

  /* ---------- 6b. gom danh sách việc đang hiển thị ---------- */
  function dsHienTai() {
    var tat = DS.slice();
    docTick().concat(docThem()).forEach(function (v) { if (!trungVoi(tat, v)) tat.push(v); });
    tat = tat.map(function (v) { if (!v.goc) v.goc = v.lam; return apSua(v); });
    return tat.filter(function (v) { return cnDang === 'TAT' || v.cn === cnDang; });
  }
  function tuanQuy() {
    /* ưu tiên số tuần đang hiện ở Bước 7, nếu chưa có thì tính tuần ISO
       từ ngày hệ thống để không bao giờ ghi biên bản thiếu số tuần */
    var e = document.querySelector('[data-k7="tuan"]')
         || document.querySelector('[data-k="nhan.sidebar"]');
    var m = e ? (e.textContent || '').match(/tuần\s*(\d+)/i) : null;
    if (m) return 'W' + m[1];
    var n = new Date();
    var d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var dau = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return 'W' + Math.ceil(((d - dau) / 86400000 + 1) / 7);
  }

  /* ---------- 6c. ghi biên bản về file PHI LONG_GROUP ---------- */
  var API = 'https://script.google.com/macros/s/AKfycbx2b5foWxdy2lVMVyoKLFGQrCE5zK1FqM7_3ivsNzJbuPFPqowAD6w-a8fjIO4BC1Xd_w/exec';
  var KHOA = 'PHILONG2026';
  var dangGhi = false;

  function bao(chu, mau) {
    var e = el('b6-bao');
    if (!e) return;
    e.textContent = chu;
    e.style.color = mau || '#5F6B7A';
  }

  function ghiBienBan() {
    if (dangGhi) return;
    var ds = dsHienTai().filter(function (v) { return !xongRoi(v.tt); });
    if (!ds.length) { bao('Không có việc nào để ghi.', '#B42318'); return; }
    var thieu = ds.filter(function (v) { return !du4(v); });
    if (thieu.length) {
      bao('Còn ' + thieu.length + ' việc thiếu yếu tố — thư ký hỏi lại rồi ghi.', '#B42318');
      return;
    }
    var tuan = tuanQuy();
    if (!tuan) { bao('Chưa đọc được số tuần họp.', '#B42318'); return; }

    dangGhi = true;
    bao('đang ghi về file PHI LONG_GROUP…', '#2F75B5');
    var goi = ds.map(function (v) {
      var tt = nhanTT(v);
      return { lam: v.lam, ai: v.ai, han: v.han, do: v.do, chi_nhanh: v.cn,
               cam_ket: (tt === 'hq' || tt === 'hk') ? 'huy' : (tt === '1' ? 1 : 0) };
    });
    var e8 = document.querySelector('[data-k8="tb"]');
    var e7 = document.querySelector('[data-gt="B7 câu 1"]');
    var th = new URLSearchParams({
      viec: 'luu_bien_ban', khoa: KHOA, tuan: tuan,
      chi_nhanh: cnDang === 'TAT' ? '' : cnDang,
      diem_hop: e8 ? gon(e8.textContent) : '',
      thong_diep: e7 ? gon(e7.textContent) : '',
      viec_json: ''
    });
    /* gửi bằng POST vì danh sách việc có thể dài hơn giới hạn URL */
    var body = th.toString() + '&viec=' + encodeURIComponent(JSON.stringify(goi));
    fetch(API, { method: 'POST', body: body,
                 headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        dangGhi = false;
        if (!j || j.ok !== true) {
          bao('Chưa ghi được: ' + ((j && j.loi) || 'không rõ lỗi')
            + ' — có thể Apps Script chưa deploy bản mới.', '#B42318');
          return;
        }
        var n = new Date();
        var gio = (n.getHours() < 10 ? '0' : '') + n.getHours() + ':'
                + (n.getMinutes() < 10 ? '0' : '') + n.getMinutes();
        ghi('dash.' + n.toDateString(), gio);
        bao('Đã ghi ' + (j.ghi ? (j.ghi.cam_ket + ' cam kết · ' + j.ghi.cong_viec
            + ' việc sang app' + (j.ghi.bo_qua ? (' · bỏ qua ' + j.ghi.bo_qua + ' việc đã ghi trước') : ''))
            : '') + ' lúc ' + (j.luc || gio), '#1E6B3A');
        ve();
      })
      .catch(function (e) {
        dangGhi = false;
        bao('Chưa ghi được: ' + (e.message || e), '#B42318');
      });
  }

  /* ---------- 6d. xuất biên bản ra PDF ---------- */
  function xuatPDF() {
    var ds = dsHienTai();
    if (!ds.length) { bao('Không có việc nào để in.', '#B42318'); return; }
    var n = new Date();
    var ngay = n.getDate() + '/' + (n.getMonth() + 1) + '/' + n.getFullYear();
    var cn = cnDang === 'TAT' ? 'cả 3 chi nhánh' : CN_TEN[cnDang];
    var hang = ds.map(function (v, i) {
      var tt = nhanTT(v);
      var nhan = xongRoi(v.tt) ? 'Đã xong'
               : (tt === 'hq' ? 'Huỷ · quá hạn' : (tt === 'hk' ? 'Huỷ · không khả thi'
               : (tt === '1' ? 'Cam kết' : 'Chưa cam kết')));
      return '<tr><td>' + (i + 1) + '</td><td>' + thoat(v.lam) + '</td><td>' + thoat(v.ai)
           + '</td><td>' + thoat(v.han) + '</td><td>' + thoat(v.do)
           + '</td><td>' + nhan + '</td></tr>';
    }).join('');
    var sCk = ds.filter(function (v) { return nhanTT(v) === '1'; }).length;
    var w = window.open('', '_blank');
    if (!w) { bao('Trình duyệt chặn cửa sổ in — cho phép pop-up rồi bấm lại.', '#B42318'); return; }
    w.document.write('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">'
      + '<title>Bien ban giao ban ' + ngay + '</title><style>'
      + 'body{font-family:Arial,Helvetica,sans-serif;color:#1F2933;margin:26px}'
      + 'h1{font-size:19px;margin:0 0 3px}h2{font-size:13px;font-weight:400;color:#5F6B7A;margin:0 0 14px}'
      + 'table{border-collapse:collapse;width:100%;font-size:12px}'
      + 'th,td{border:1px solid #D9E2EC;padding:6px 8px;text-align:left;vertical-align:top}'
      + 'th{background:#EEF3F8;font-size:11px;letter-spacing:.3px}'
      + '.tt{font-size:11px;color:#5F6B7A;margin-top:12px;line-height:1.6}'
      + '.ky{margin-top:34px;display:flex;gap:40px;font-size:12px}'
      + '@page{size:A4;margin:14mm}</style></head><body>'
      + '<h1>BIÊN BẢN GIAO BAN TUẦN · PHI LONG AUTO</h1>'
      + '<h2>' + cn + ' · ' + ngay + ' · ' + (tuanQuy() || '—') + '</h2>'
      + '<table><thead><tr><th>#</th><th>Việc cần làm</th><th>Ai</th><th>Hạn</th>'
      + '<th>Đo bằng gì</th><th>Cam kết</th></tr></thead><tbody>' + hang + '</tbody></table>'
      + '<div class="tt">Tổng ' + ds.length + ' việc · ' + sCk + ' việc người nhận đã nói "Cam kết".<br>'
      + 'Chưa ghi lên dashboard là chưa chốt. Thiếu một trong 4 yếu tố (ai, làm gì, hạn, đo bằng gì) '
      + 'thì thư ký hỏi lại ngay.</div>'
      + '<div class="ky"><div>Thư ký ghi biên bản<br><br><br>_______________</div>'
      + '<div>Người chủ trì<br><br><br>_______________</div></div>'
      + '</body></html>');
    w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 350);
  }

  /* ---------- 7. khởi động ---------- */
  window.PLG_B6 = function (j) {
    DS = docFile(j);
    veNutCN();
    ve();
  };

  function thu() {
    veNutCN();
    if (!DS.length && window.DU_LIEU) DS = docFile(window.DU_LIEU);
    if (el('b6-than')) ve();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', thu);
  else thu();
  setInterval(function () { if (el('b6-than') && !el('b6-than').children.length) thu(); }, 1500);
})();
