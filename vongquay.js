/* ════════════════════════════════════════════════════════════════════
   BƯỚC 9 · WIFLE — VÒNG QUAY NGẪU NHIÊN CHỌN NGƯỜI NÓI
   Tracy chốt 21/11/2026: bỏ thứ tự nói cố định, quay ngẫu nhiên để
   tạo bất ngờ; các ô tên nhập text linh hoạt.

   Danh sách tên lấy live từ Bước 1 Check-in khi đọc được, còn lại
   giữ vai trò mặc định. Mỗi ô tên bấm vào gõ thẳng được.
   Người đã quay trúng thì mờ đi và không trúng lại, cho tới khi
   bấm "Đặt lại". Danh sách và lượt đã nói lưu trên máy đang họp.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var MAC_DINH = ['Chị Hà · Điều phối', 'QL PHI LONG 1', 'QL PHI LONG 2',
                  'QL PHI LONG 3', 'CSKH trung tâm', 'Kế toán', 'Anh Đại'];
  var MAU = ['#2F75B5', '#17365D'];
  var ds = null, daNoi = {}, dangQuay = false, goc = 0;

  function el(id) { return document.getElementById(id); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function lay(k, md) { try { var v = localStorage.getItem('plg.b9.' + k); return v === null ? md : v; } catch (e) { return md; } }
  function ghi(k, v) { try { localStorage.setItem('plg.b9.' + k, v); } catch (e) { } }

  /* ---------- danh sách tên ---------- */
  function tenLive() {
    var ra = MAC_DINH.slice();
    var b1 = document.getElementById('sc-GB1CheckIn');
    if (!b1) return ra;
    for (var i = 0; i < 3; i++) {
      var o = b1.querySelector('[data-k="gb1.ql.' + i + '"]');
      var t = o ? gon(o.textContent) : '';
      if (t && t !== '—') ra[i + 1] = t;
    }
    var c = b1.querySelector('[data-k="gb1.cskh.ten"]');
    var tc = c ? gon(c.textContent) : '';
    if (tc && tc !== '—') ra[4] = tc;
    return ra;
  }

  function napDS() {
    var luu = lay('ds', '');
    if (luu) {
      try {
        var j = JSON.parse(luu);
        if (j && j.length) return j;
      } catch (e) { }
    }
    return tenLive();
  }
  function luuDS() { ghi('ds', JSON.stringify(ds)); }

  function napDaNoi() {
    try { return JSON.parse(lay('danoi', '{}')) || {}; } catch (e) { return {}; }
  }
  function luuDaNoi() { ghi('danoi', JSON.stringify(daNoi)); }

  /* ---------- vẽ ---------- */
  function veDia() {
    var d = el('b9-dia');
    if (!d || !ds.length) return;
    var b = 360 / ds.length, g = [], v = 0;
    for (var i = 0; i < ds.length; i++) {
      g.push(MAU[i % 2] + ' ' + v.toFixed(2) + 'deg ' + (v + b).toFixed(2) + 'deg');
      v += b;
    }
    d.style.background = 'conic-gradient(' + g.join(',') + ')';
  }

  function veDS() {
    var h = el('b9-ds');
    if (!h) return;
    h.innerHTML = '';
    ds.forEach(function (t, i) {
      var xong = !!daNoi[i];
      var sp = document.createElement('span');
      sp.setAttribute('data-b9i', String(i));
      sp.setAttribute('contenteditable', 'true');
      sp.setAttribute('spellcheck', 'false');
      sp.setAttribute('title', 'Bấm để sửa tên — tự lưu trên máy này');
      sp.setAttribute('style', 'padding:5px 11px;border-radius:16px;cursor:text;'
        + 'font-size:13px;font-weight:700;outline:none;'
        + (xong ? 'background:rgba(255,255,255,0.10);color:#8FA6C1;text-decoration:line-through'
                : 'background:#FFFFFF;color:#17365D'));
      sp.textContent = t;
      h.appendChild(sp);
    });
    var con = ds.length - Object.keys(daNoi).length;
    var c = el('b9-conlai');
    if (c) c.textContent = con > 0 ? ('còn ' + con + '/' + ds.length + ' người') : 'cả phòng đã nói xong';
    var n = el('b9-nut');
    if (n) {
      n.disabled = (con <= 0) || dangQuay;
      n.style.opacity = n.disabled ? '0.5' : '1';
      n.style.cursor = n.disabled ? 'default' : 'pointer';
    }
  }

  /* ---------- quay ---------- */
  function quay() {
    if (dangQuay || !ds.length) return;
    var conLai = [];
    ds.forEach(function (t, i) { if (!daNoi[i]) conLai.push(i); });
    if (!conLai.length) return;

    dangQuay = true;
    veDS();
    var trung = conLai[Math.floor(Math.random() * conLai.length)];
    var b = 360 / ds.length;
    /* kim ở đỉnh (0deg): đưa tâm ô trúng lên đỉnh, cộng vài vòng cho bất ngờ */
    var tam = trung * b + b / 2;
    var them = 360 * (4 + Math.floor(Math.random() * 3)) + (360 - tam);
    goc += them;

    var d = el('b9-dia');
    if (d) d.style.transform = 'rotate(' + goc + 'deg)';

    var giua = el('b9-giua');
    if (giua) giua.innerHTML = '…';
    var tr = el('b9-trung');
    if (tr) { tr.textContent = 'đang quay…'; tr.style.color = '#B9CCE3'; }

    setTimeout(function () {
      dangQuay = false;
      daNoi[trung] = 1; luuDaNoi();
      if (tr) { tr.textContent = '🎤 ' + ds[trung] + ' — mời nói 30 giây'; tr.style.color = '#F2B705'; }
      if (giua) giua.innerHTML = 'ĐẾN<br>LƯỢT';
      veDS();
    }, 3500);
  }

  function datLai() {
    daNoi = {}; luuDaNoi();
    var tr = el('b9-trung');
    if (tr) { tr.textContent = 'Bấm QUAY để chọn người nói'; tr.style.color = '#F2B705'; }
    var giua = el('b9-giua');
    if (giua) giua.innerHTML = 'QUAY<br>CHỌN TÊN';
    veDS();
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener('click', function (e) {
    if (!e.target) return;
    if (e.target.id === 'b9-nut') { quay(); return; }
    if (e.target.id === 'b9-lai') { datLai(); return; }
  }, true);

  document.addEventListener('blur', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute || t.getAttribute('data-b9i') === null) return;
    var i = parseInt(t.getAttribute('data-b9i'), 10);
    var v = gon(t.textContent);
    if (!v) { v = ds[i]; t.textContent = v; }
    ds[i] = v; luuDS();
  }, true);

  document.addEventListener('keydown', function (e) {
    var t = e.target;
    if (t && t.getAttribute && t.getAttribute('data-b9i') !== null && e.key === 'Enter') {
      e.preventDefault(); t.blur();
    }
  }, true);

  /* ---------- khởi động ---------- */
  function chay() {
    if (!el('b9-ds')) return;
    if (ds === null) { ds = napDS(); daNoi = napDaNoi(); }
    veDia();
    if (!el('b9-ds').children.length) veDS();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  /* tên live của Bước 1 về muộn: cập nhật một lần nếu người dùng chưa tự sửa */
  setTimeout(function () {
    if (!lay('ds', '')) { ds = tenLive(); veDia(); veDS(); }
  }, 6000);
  setInterval(chay, 2500);
})();
