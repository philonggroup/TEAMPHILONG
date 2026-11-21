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
  var COT = 'display:grid;grid-template-columns:minmax(0,2fr) 170px 64px minmax(0,1.2fr) 124px;gap:10px';
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
    return 'ck.' + gon(v.lam).slice(0, 60).replace(/[^0-9A-Za-zÀ-ỹ]+/g, '_');
  }

  function xongRoi(tt) { return /hoàn thành|xong|đã xong/i.test(tt || ''); }

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
      if (t.getAttribute('data-chon') !== '1') return;
      var d = t.parentNode, chu = gon(d ? d.textContent : '');
      chu = chu.replace(/^[☑☐]\s*/, '').replace(/→\s*bước\s*6\s*$/i, '');
      if (!chu) return;
      ra.push({ lam: chu, ai: '', han: '', do: '', tt: 'Chốt tại họp', cn: cnDang === 'TAT' ? 'KHAC' : cnDang, nguon: 'Bước 5' });
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

  function ve() {
    var than = el('b6-than'), trong = el('b6-trong');
    if (!than) return;
    var tat = DS.concat(docTick(), docThem());
    var ds = tat.filter(function (v) { return cnDang === 'TAT' || v.cn === cnDang; });

    than.innerHTML = '';
    var sDu = 0, sCk = 0, sCan = 0, sTon = 0;

    ds.forEach(function (v, i) {
      if (du4(v)) sDu++;
      if (!xongRoi(v.tt)) sTon++;
      var daCk = lay(khoaViec(v), '') === '1';
      if (!xongRoi(v.tt)) { sCan++; if (daCk) sCk++; }

      var nhan, mauN;
      if (xongRoi(v.tt)) { nhan = 'Đã xong'; mauN = 'background:#EEF2F6;color:#5F6B7A'; }
      else if (daCk) { nhan = 'Cam kết'; mauN = 'background:#E7F5EC;color:#1E6B3A'; }
      else { nhan = 'Chờ xác nhận'; mauN = 'background:#FFF2CC;color:#6B4500'; }

      var h = document.createElement('div');
      h.setAttribute('style', COT + ';font-size:15px;padding:10px 0;border-bottom:1px solid #F1F5F9;align-items:center');
      var sua = v.nguon === 'gõ tại họp' ? v.ix : null;
      h.innerHTML =
        '<div style="font-weight:600' + (gon(v.lam) ? '' : ';background:#FFF2CC;color:#6B4500;font-style:italic') + '"'
          + (sua !== null ? ' contenteditable="true" spellcheck="false" data-t="lam" data-i="' + sua + '"' : '') + '>'
          + (gon(v.lam) ? thoat(v.lam) : 'gõ việc cần làm') + '</div>'
        + (sua !== null
            ? oThieu(v.ai, 'gõ người nhận', 'x').replace('data-sua="x"', 'data-t="ai" data-i="' + sua + '"')
            : oThieu(v.ai, 'thiếu AI — thư ký hỏi lại', null))
        + (sua !== null
            ? oThieu(v.han, 'hạn', 'x').replace('data-sua="x"', 'data-t="han" data-i="' + sua + '"')
            : oThieu(v.han, 'thiếu HẠN', null))
        + (sua !== null
            ? oThieu(v.do, 'gõ cách đo', 'x').replace('data-sua="x"', 'data-t="do" data-i="' + sua + '"')
            : oThieu(v.do, 'thiếu CÁCH ĐO', null))
        + '<div style="text-align:center">'
          + '<button type="button" data-ck="' + thoat(khoaViec(v)) + '" '
          + (xongRoi(v.tt) ? 'disabled ' : '')
          + 'style="min-height:34px;padding:0 10px;border-radius:5px;border:0;font-family:\'Be Vietnam Pro\',Arial,sans-serif;'
          + 'font-size:13px;font-weight:800;white-space:nowrap;' + mauN
          + (xongRoi(v.tt) ? '' : ';cursor:pointer') + '">' + nhan + '</button></div>';
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

    datDem(sDu, ds.length, sCk, sCan, sTon);
  }

  function datDem(du, tong, ck, can, ton) {
    function d(k, chu, mau) {
      var e = document.querySelector('[data-k6="' + k + '"]');
      if (!e) return;
      e.textContent = chu;
      if (mau) e.style.color = mau;
    }
    d('du4', du + '/' + tong, du === tong && tong ? '#1E6B3A' : '#B42318');
    d('ck', ck + '/' + can, (can && ck === can) ? '#1E6B3A' : '#B4600A');
    d('ton', String(ton), ton ? '#B42318' : '#1E6B3A');
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

    var c = e.target.closest ? e.target.closest('[data-ck]') : null;
    if (c && !c.disabled) {
      var k = c.getAttribute('data-ck');
      ghi(k, lay(k, '') === '1' ? '0' : '1');
      ve();
      return;
    }

    if (e.target.id === 'b6-ghi') {
      var n = new Date();
      var gio = (n.getHours() < 10 ? '0' : '') + n.getHours() + ':' + (n.getMinutes() < 10 ? '0' : '') + n.getMinutes();
      ghi('dash.' + n.toDateString(), gio);
      ve();
    }
  }, true);

  document.addEventListener('blur', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var truong = t.getAttribute('data-t'), i = t.getAttribute('data-i');
    if (!truong || i === null) return;
    var v = gon(t.textContent);
    if (/^(\+ chốt thêm việc tại họp|ai|hạn|đo bằng gì|gõ việc cần làm|gõ người nhận|gõ cách đo)$/.test(v)) v = '';
    luuThem(parseInt(i, 10), truong, v);
    if (cnDang !== 'TAT') ghi('them.' + i + '.cn', cnDang);
    ve();
  }, true);

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
