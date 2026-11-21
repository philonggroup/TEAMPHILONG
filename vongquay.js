/* ════════════════════════════════════════════════════════════════════
   VÒNG QUAY NGẪU NHIÊN CHỌN TÊN — dùng ở Bước 1 Check-in và Bước 9 WIFLE
   Tracy chốt 21/11/2026: thứ tự nói chọn bằng vòng quay để tạo bất ngờ;
   mỗi dòng thành viên nhập text linh hoạt, thêm bớt được.

   MỘT danh sách thành viên dùng chung cho cả hai màn — sửa tên ở màn
   nào thì màn kia đổi theo, không phải gõ hai lần.
   Lượt đã quay đếm RIÊNG từng màn, vì check-in và WIFLE là hai vòng
   nói khác nhau trong cùng buổi họp.
   Tên quản lý chi nhánh và CSKH lấy live từ Bước 1 khi đọc được.
   Danh sách và lượt lưu trên máy đang họp.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAC_DINH = [
    { vai: 'Điều phối · làm mẫu', ten: 'Chị Hà' },
    { vai: 'Đại diện CN1',        ten: '' },
    { vai: 'Đại diện CN2',        ten: '' },
    { vai: 'Đại diện CN3',        ten: '' },
    { vai: 'CSKH trung tâm',      ten: '' },
    { vai: 'Kế toán',             ten: '' },
    { vai: 'Nói sau cùng',        ten: 'Anh Đại' }
  ];
  var MAU = ['#2F75B5', '#17365D', '#3E8FD0', '#1D4E82', '#4FA3DD', '#15304F', '#2F75B5'];
  var XAM = '#4A5663';

  var ds = null;          /* danh sách dùng chung cả hai màn */
  var trangThai = {};     /* theo từng khối: { daNoi, goc, dangQuay } */

  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function thoat(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lay(k, md) { try { var v = localStorage.getItem('plg.vq.' + k); return v === null ? md : v; } catch (e) { return md; } }
  function ghi(k, v) { try { localStorage.setItem('plg.vq.' + k, v); } catch (e) { } }
  function nhan(x) { return gon(x.ten) || gon(x.vai) || '—'; }
  function khoi() { return Array.prototype.slice.call(document.querySelectorAll('[data-vq]')); }
  function tt(ma) {
    if (!trangThai[ma]) {
      var d = {};
      try { d = JSON.parse(lay('danoi.' + ma, '{}')) || {}; } catch (e) { }
      trangThai[ma] = { daNoi: d, goc: 0, dangQuay: false };
    }
    return trangThai[ma];
  }

  /* ---------- danh sách dùng chung ---------- */
  function napDS() {
    var luu = lay('ds', '');
    if (luu) { try { var j = JSON.parse(luu); if (j && j.length) return j; } catch (e) { } }
    var ra = MAC_DINH.map(function (x) { return { vai: x.vai, ten: x.ten }; });
    var b1 = document.getElementById('sc-GB1CheckIn');
    if (b1) {
      for (var i = 0; i < 3; i++) {
        var o = b1.querySelector('[data-k="gb1.ql.' + i + '"]');
        var t = o ? gon(o.textContent) : '';
        if (t && t !== '—') ra[i + 1].ten = t;
      }
      var c = b1.querySelector('[data-k="gb1.cskh.ten"]');
      var tc = c ? gon(c.textContent) : '';
      if (tc && tc !== '—') ra[4].ten = tc;
    }
    return ra;
  }
  function luuDS() { ghi('ds', JSON.stringify(ds)); }

  /* ---------- vẽ vòng quay ---------- */
  function cung(r, d) {
    var rad = (d - 90) * Math.PI / 180;
    return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)];
  }
  function veSVG(k, ma) {
    var sv = k.querySelector('[data-vq-svg]');
    if (!sv || !ds.length) return;
    var daNoi = tt(ma).daNoi;
    var n = ds.length, b = 360 / n, h = '';
    for (var i = 0; i < n; i++) {
      var a = cung(96, i * b), c = cung(96, i * b + b);
      var lon = b > 180 ? 1 : 0;
      h += '<path d="M100,100 L' + a[0].toFixed(2) + ',' + a[1].toFixed(2)
         + ' A96,96 0 ' + lon + ',1 ' + c[0].toFixed(2) + ',' + c[1].toFixed(2) + ' Z" fill="'
         + (daNoi[i] ? XAM : MAU[i % MAU.length]) + '" stroke="#FFFFFF" stroke-width="1.5"/>';
      var t = nhan(ds[i]);
      if (t.length > 16) t = t.slice(0, 15) + '…';
      var co = n > 9 ? 8 : (n > 7 ? 9 : 10.5);
      h += '<text x="100" y="100" fill="' + (daNoi[i] ? '#9AA7B5' : '#FFFFFF') + '" font-size="' + co
         + '" font-weight="700" font-family="Be Vietnam Pro, Arial, sans-serif" text-anchor="end" '
         + 'dominant-baseline="middle" transform="rotate(' + (i * b + b / 2 - 90).toFixed(2)
         + ' 100 100) translate(92 0)"' + (daNoi[i] ? ' text-decoration="line-through"' : '')
         + '>' + thoat(t) + '</text>';
    }
    h += '<circle cx="100" cy="100" r="96" fill="none" stroke="#F2B705" stroke-width="4"/>';
    sv.innerHTML = h;
  }

  /* ---------- vẽ danh sách ---------- */
  function veDS(k, ma) {
    var h = k.querySelector('[data-vq-ds]');
    if (!h) return;
    var ac = document.activeElement;
    if (ac && ac.getAttribute && (ac.getAttribute('data-vqten') !== null
        || ac.getAttribute('data-vqvai') !== null) && h.contains(ac)) return;  /* đang gõ */
    var sang = k.getAttribute('data-nen') === 'sang';
    var daNoi = tt(ma).daNoi;
    h.innerHTML = '';
    ds.forEach(function (x, i) {
      var xong = !!daNoi[i];
      var d = document.createElement('div');
      d.setAttribute('style', 'display:flex;align-items:center;gap:6px;font-size:'
        + (sang ? '12px' : '13px') + ';' + (xong ? 'opacity:.5' : ''));
      d.innerHTML =
        '<span style="width:18px;height:18px;border-radius:9px;flex-shrink:0;background:'
          + (xong ? XAM : MAU[i % MAU.length]) + ';color:#FFF;font-size:10px;font-weight:800;'
          + 'display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span>'
        + '<span contenteditable="true" spellcheck="false" data-vqvai="' + i + '" '
          + 'style="color:' + (sang ? '#5F6B7A' : '#B9CCE3') + ';font-weight:700;min-width:74px;'
          + 'cursor:text;outline:none">' + thoat(x.vai) + '</span>'
        + '<span style="color:' + (sang ? '#AEBACA' : '#5F7A96') + '">:</span>'
        + '<span contenteditable="true" spellcheck="false" data-vqten="' + i + '" data-goi="nhập tên" '
          + 'style="flex:1;min-width:52px;color:' + (sang ? '#17365D' : '#FFFFFF') + ';font-weight:800;'
          + 'cursor:text;outline:none;border-bottom:1px dashed '
          + (sang ? '#C3D3E3' : 'rgba(255,255,255,.3)') + (xong ? ';text-decoration:line-through' : '')
          + '">' + thoat(x.ten) + '</span>'
        + '<button type="button" data-vqxoa="' + i + '" title="Bỏ người này khỏi vòng quay" '
          + 'style="width:18px;height:18px;flex-shrink:0;border:0;background:transparent;color:'
          + (sang ? '#AEBACA' : '#8FA6C1') + ';font-size:12px;font-weight:800;cursor:pointer">✕</button>';
      h.appendChild(d);
    });
    if (!document.getElementById('vq-css')) {
      var st = document.createElement('style');
      st.id = 'vq-css';
      st.textContent = '[data-vqten]:empty:before{content:attr(data-goi);color:#8FA6C1;'
                     + 'font-weight:400;font-style:italic}';
      document.head.appendChild(st);
    }
    var con = ds.length - Object.keys(daNoi).length;
    var c = k.querySelector('[data-vq-conlai]');
    if (c) c.textContent = con > 0 ? ('còn ' + con + '/' + ds.length) : 'đã nói xong cả phòng';
    var n = k.querySelector('[data-vq-nut]');
    if (n) {
      n.disabled = (con <= 0) || tt(ma).dangQuay;
      n.style.opacity = n.disabled ? '0.45' : '1';
      n.style.cursor = n.disabled ? 'default' : 'pointer';
    }
  }

  function veMot(k) { var ma = k.getAttribute('data-vq'); veSVG(k, ma); veDS(k, ma); }
  function ve() { khoi().forEach(veMot); }

  /* ---------- quay ---------- */
  function quay(k) {
    var ma = k.getAttribute('data-vq'), s = tt(ma);
    if (s.dangQuay || !ds.length) return;
    var con = [];
    ds.forEach(function (x, i) { if (!s.daNoi[i]) con.push(i); });
    if (!con.length) return;

    s.dangQuay = true;
    veDS(k, ma);
    var trung = con[Math.floor(Math.random() * con.length)];
    var b = 360 / ds.length, tam = trung * b + b / 2;
    s.goc += 360 * (5 + Math.floor(Math.random() * 3)) + ((360 - (s.goc % 360) - tam) % 360);

    var sv = k.querySelector('[data-vq-svg]');
    if (sv) sv.style.transform = 'rotate(' + s.goc + 'deg)';
    var tr = k.querySelector('[data-vq-trung]');
    var sang = k.getAttribute('data-nen') === 'sang';
    if (tr) { tr.textContent = 'đang quay…'; tr.style.color = sang ? '#5F6B7A' : '#B9CCE3'; }

    setTimeout(function () {
      s.dangQuay = false;
      s.daNoi[trung] = 1;
      ghi('danoi.' + ma, JSON.stringify(s.daNoi));
      if (tr) {
        tr.textContent = '🎤 ' + nhan(ds[trung]) + ' — mời nói 30 giây';
        tr.style.color = sang ? '#17365D' : '#F2B705';
      }
      veMot(k);
    }, 4100);
  }

  function datLai(k) {
    var ma = k.getAttribute('data-vq');
    tt(ma).daNoi = {};
    ghi('danoi.' + ma, '{}');
    var tr = k.querySelector('[data-vq-trung]');
    var sang = k.getAttribute('data-nen') === 'sang';
    if (tr) {
      tr.textContent = 'Bấm QUAY để chọn người nói';
      tr.style.color = sang ? '#17365D' : '#F2B705';
    }
    veMot(k);
  }

  /* ---------- sự kiện ---------- */
  function khoiCua(e) { return e && e.closest ? e.closest('[data-vq]') : null; }

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var k = khoiCua(t);
    if (!k) return;
    if (t.getAttribute('data-vq-nut') !== null) { quay(k); return; }
    if (t.getAttribute('data-vq-lai') !== null) { datLai(k); return; }
    if (t.getAttribute('data-vq-them') !== null) {
      ds.push({ vai: 'Thành viên ' + (ds.length + 1), ten: '' });
      luuDS(); ve();
      return;
    }
    var x = t.getAttribute('data-vqxoa');
    if (x !== null && x !== undefined) {
      var i = parseInt(x, 10);
      if (ds.length <= 2) return;
      ds.splice(i, 1);
      Object.keys(trangThai).forEach(function (ma) {
        var cu = trangThai[ma].daNoi, m = {};
        Object.keys(cu).forEach(function (kk) {
          var j = parseInt(kk, 10);
          if (j < i) m[j] = 1; else if (j > i) m[j - 1] = 1;
        });
        trangThai[ma].daNoi = m;
        ghi('danoi.' + ma, JSON.stringify(m));
      });
      luuDS(); ve();
    }
  }, true);

  document.addEventListener('blur', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var iT = t.getAttribute('data-vqten'), iV = t.getAttribute('data-vqvai');
    if (iT !== null && iT !== undefined) { ds[parseInt(iT, 10)].ten = gon(t.textContent); luuDS(); ve(); return; }
    if (iV !== null && iV !== undefined) {
      var i = parseInt(iV, 10), v = gon(t.textContent);
      ds[i].vai = v || ('Thành viên ' + (i + 1));
      luuDS(); ve();
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if ((t.getAttribute('data-vqten') !== null || t.getAttribute('data-vqvai') !== null)
        && e.key === 'Enter') { e.preventDefault(); t.blur(); }
  }, true);

  /* ---------- khởi động ---------- */
  function chay() {
    var ks = khoi();
    if (!ks.length) return;
    if (ds === null) { ds = napDS(); ve(); return; }
    ks.forEach(function (k) {
      var h = k.querySelector('[data-vq-ds]'), sv = k.querySelector('[data-vq-svg]');
      if ((h && !h.children.length) || (sv && !sv.children.length)) veMot(k);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  setTimeout(function () { if (!lay('ds', '')) { ds = napDS(); ve(); } }, 6000);
  setInterval(chay, 2500);
})();
