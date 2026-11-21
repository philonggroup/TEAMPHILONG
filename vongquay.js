/* ════════════════════════════════════════════════════════════════════
   BƯỚC 9 · WIFLE — VÒNG QUAY NGẪU NHIÊN CHỌN TÊN
   Tracy chốt 21/11/2026: thứ tự nói chọn bằng vòng quay để tạo bất
   ngờ; mỗi dòng thành viên nhập text linh hoạt, thêm bớt được.

   Vòng quay vẽ bằng SVG: mỗi người một múi màu, tên in thẳng trên
   múi. Kim vàng ở đỉnh. Người đã trúng thì múi xám lại và không
   trúng nữa cho tới khi bấm "Đặt lại".
   Danh sách và lượt đã nói lưu trên máy đang họp.
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

  var ds = null, daNoi = {}, dangQuay = false, goc = 0;

  function el(id) { return document.getElementById(id); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function thoat(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lay(k, md) { try { var v = localStorage.getItem('plg.b9.' + k); return v === null ? md : v; } catch (e) { return md; } }
  function ghi(k, v) { try { localStorage.setItem('plg.b9.' + k, v); } catch (e) { } }

  /* nhãn hiện trên vòng quay: có tên thì lấy tên, chưa gõ thì lấy vai trò */
  function nhan(x) { return gon(x.ten) || gon(x.vai) || '—'; }

  /* ---------- danh sách ---------- */
  function napDS() {
    var luu = lay('ds2', '');
    if (luu) { try { var j = JSON.parse(luu); if (j && j.length) return j; } catch (e) { } }
    var ra = MAC_DINH.map(function (x) { return { vai: x.vai, ten: x.ten }; });
    /* tên quản lý chi nhánh lấy live từ Bước 1 Check-in nếu đọc được */
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
  function luuDS() { ghi('ds2', JSON.stringify(ds)); }
  function napDaNoi() { try { return JSON.parse(lay('danoi2', '{}')) || {}; } catch (e) { return {}; } }
  function luuDaNoi() { ghi('danoi2', JSON.stringify(daNoi)); }

  /* ---------- vẽ vòng quay ---------- */
  function cung(cx, cy, r, d) {
    var rad = (d - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }
  function veSVG() {
    var sv = el('b9-svg');
    if (!sv || !ds.length) return;
    var n = ds.length, b = 360 / n, h = '';
    for (var i = 0; i < n; i++) {
      var d1 = i * b, d2 = d1 + b;
      var a = cung(100, 100, 96, d1), c = cung(100, 100, 96, d2);
      var lon = b > 180 ? 1 : 0;
      var mau = daNoi[i] ? XAM : MAU[i % MAU.length];
      h += '<path d="M100,100 L' + a[0].toFixed(2) + ',' + a[1].toFixed(2)
         + ' A96,96 0 ' + lon + ',1 ' + c[0].toFixed(2) + ',' + c[1].toFixed(2) + ' Z" '
         + 'fill="' + mau + '" stroke="#FFFFFF" stroke-width="1.5"/>';
      /* tên in dọc theo bán kính của múi */
      var giua = d1 + b / 2;
      var t = nhan(ds[i]);
      if (t.length > 16) t = t.slice(0, 15) + '…';
      var co = n > 9 ? 8 : (n > 7 ? 9 : 10.5);
      h += '<text x="100" y="100" fill="' + (daNoi[i] ? '#9AA7B5' : '#FFFFFF') + '" font-size="' + co + '" '
         + 'font-weight="700" font-family="Be Vietnam Pro, Arial, sans-serif" '
         + 'text-anchor="end" dominant-baseline="middle" '
         + 'transform="rotate(' + (giua - 90).toFixed(2) + ' 100 100) translate(92 0)"'
         + (daNoi[i] ? ' text-decoration="line-through"' : '') + '>' + thoat(t) + '</text>';
    }
    h += '<circle cx="100" cy="100" r="96" fill="none" stroke="#F2B705" stroke-width="4"/>';
    sv.innerHTML = h;
  }

  /* ---------- vẽ danh sách ---------- */
  function veDS() {
    var h = el('b9-ds');
    if (!h) return;
    var tieu = document.activeElement && document.activeElement.getAttribute
             ? document.activeElement.getAttribute('data-b9ten') : null;
    if (tieu !== null && tieu !== undefined) return;   /* đang gõ thì không vẽ lại */
    h.innerHTML = '';
    ds.forEach(function (x, i) {
      var xong = !!daNoi[i];
      var d = document.createElement('div');
      d.setAttribute('style', 'display:flex;align-items:center;gap:7px;font-size:13px;'
        + (xong ? 'opacity:.5' : ''));
      d.innerHTML =
        '<span style="width:19px;height:19px;border-radius:10px;flex-shrink:0;background:'
          + (xong ? XAM : MAU[i % MAU.length]) + ';color:#FFF;font-size:10px;font-weight:800;'
          + 'display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span>'
        + '<span contenteditable="true" spellcheck="false" data-b9vai="' + i + '" '
          + 'style="color:#B9CCE3;font-weight:700;min-width:84px;cursor:text;outline:none">'
          + thoat(x.vai) + '</span>'
        + '<span style="color:#5F7A96">:</span>'
        + '<span contenteditable="true" spellcheck="false" data-b9ten="' + i + '" '
          + 'data-goi="nhập tên" style="flex:1;min-width:60px;color:#FFFFFF;font-weight:800;'
          + 'cursor:text;outline:none;border-bottom:1px dashed rgba(255,255,255,.3)'
          + (xong ? ';text-decoration:line-through' : '') + '">' + thoat(x.ten) + '</span>'
        + '<button type="button" data-b9xoa="' + i + '" title="Bỏ người này khỏi vòng quay" '
          + 'style="width:20px;height:20px;flex-shrink:0;border-radius:5px;border:0;background:transparent;'
          + 'color:#8FA6C1;font-size:13px;font-weight:800;cursor:pointer">✕</button>';
      h.appendChild(d);
    });
    /* chữ gợi ý cho ô tên trống */
    if (!document.getElementById('b9-css')) {
      var st = document.createElement('style');
      st.id = 'b9-css';
      st.textContent = '[data-b9ten]:empty:before{content:attr(data-goi);color:#7F93A8;'
                     + 'font-weight:400;font-style:italic}';
      document.head.appendChild(st);
    }
    var con = ds.length - Object.keys(daNoi).length;
    var c = el('b9-conlai');
    if (c) c.textContent = con > 0 ? ('còn ' + con + '/' + ds.length) : 'đã nói xong cả phòng';
    var n = el('b9-nut');
    if (n) {
      n.disabled = (con <= 0) || dangQuay;
      n.style.opacity = n.disabled ? '0.45' : '1';
      n.style.cursor = n.disabled ? 'default' : 'pointer';
    }
  }

  function ve() { veSVG(); veDS(); }

  /* ---------- quay ---------- */
  function quay() {
    if (dangQuay || !ds.length) return;
    var con = [];
    ds.forEach(function (x, i) { if (!daNoi[i]) con.push(i); });
    if (!con.length) return;

    dangQuay = true;
    veDS();
    var trung = con[Math.floor(Math.random() * con.length)];
    var b = 360 / ds.length;
    var tam = trung * b + b / 2;                       /* tâm múi trúng */
    goc += 360 * (5 + Math.floor(Math.random() * 3)) + ((360 - (goc % 360) - tam) % 360);

    var sv = el('b9-svg');
    if (sv) sv.style.transform = 'rotate(' + goc + 'deg)';
    var tr = el('b9-trung');
    if (tr) { tr.textContent = 'đang quay…'; tr.style.color = '#B9CCE3'; }

    setTimeout(function () {
      dangQuay = false;
      daNoi[trung] = 1; luuDaNoi();
      if (tr) {
        tr.textContent = '🎤 ' + nhan(ds[trung]) + ' — mời nói 30 giây';
        tr.style.color = '#F2B705';
      }
      ve();
    }, 4100);
  }

  function datLai() {
    daNoi = {}; luuDaNoi();
    var tr = el('b9-trung');
    if (tr) { tr.textContent = 'Bấm QUAY để chọn người nói'; tr.style.color = '#F2B705'; }
    ve();
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'b9-nut') { quay(); return; }
    if (t.id === 'b9-lai') { datLai(); return; }
    if (t.id === 'b9-them') {
      ds.push({ vai: 'Thành viên ' + (ds.length + 1), ten: '' });
      luuDS(); ve();
      return;
    }
    var x = t.getAttribute && t.getAttribute('data-b9xoa');
    if (x !== null && x !== undefined) {
      var i = parseInt(x, 10);
      if (ds.length <= 2) return;                      /* giữ tối thiểu 2 người */
      ds.splice(i, 1);
      var m = {};
      Object.keys(daNoi).forEach(function (k) {
        var j = parseInt(k, 10);
        if (j < i) m[j] = 1; else if (j > i) m[j - 1] = 1;
      });
      daNoi = m; luuDS(); luuDaNoi(); ve();
    }
  }, true);

  document.addEventListener('blur', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var iT = t.getAttribute('data-b9ten'), iV = t.getAttribute('data-b9vai');
    if (iT !== null && iT !== undefined) {
      ds[parseInt(iT, 10)].ten = gon(t.textContent); luuDS(); ve(); return;
    }
    if (iV !== null && iV !== undefined) {
      var v = gon(t.textContent);
      ds[parseInt(iV, 10)].vai = v || ('Thành viên ' + (parseInt(iV, 10) + 1));
      luuDS(); ve();
    }
  }, true);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if ((t.getAttribute('data-b9ten') !== null || t.getAttribute('data-b9vai') !== null)
        && e.key === 'Enter') { e.preventDefault(); t.blur(); }
  }, true);

  /* ---------- khởi động ---------- */
  function chay() {
    if (!el('b9-ds')) return;
    if (ds === null) { ds = napDS(); daNoi = napDaNoi(); ve(); return; }
    if (!el('b9-ds').children.length || !el('b9-svg').children.length) ve();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  /* tên live của Bước 1 về muộn: nạp lại một lần nếu người dùng chưa tự sửa */
  setTimeout(function () { if (!lay('ds2', '')) { ds = napDS(); ve(); } }, 6000);
  setInterval(chay, 2500);
})();
