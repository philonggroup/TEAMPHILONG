/* ════════════════════════════════════════════════════════════════════
   BƯỚC 2 · VIỆC TUẦN TRƯỚC — 100% LIVE TỪ BẢNG CONG_VIEC CỦA APP
   Tracy chốt 22/11/2026: bước 2 phải live từ nguồn app, theo đúng
   view _CV_CHUA_LAM (việc chưa làm) của app PHI LONG GROUP.

   Đọc thẳng CSV bảng CONG_VIEC nên không phụ thuộc Apps Script.
   Trạng thái lấy nguyên văn cột trang_thai của app; "trễ" là việc
   chưa xong mà hạn đã qua, tính theo ngày hệ thống.
   Lọc chi nhánh theo thanh chung của 9 bước.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  var FILE = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';
  var GID  = '157455132';                 /* CONG_VIEC */
  var DS = null, loi = null;
  window.PLG_B2_CSV = 1;

  function $$(s, g) { return Array.prototype.slice.call((g || document).querySelectorAll(s)); }
  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }

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

  function ngay(s) {
    var m = gon(s).match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
  }
  function xong(tt) { return /hoàn thành|đã xong|^\s*3\./i.test(tt || ''); }

  function doc() {
    fetch('https://docs.google.com/spreadsheets/d/' + FILE + '/gviz/tq?tqx=out:csv&gid='
          + GID + '&_=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) {
        if (/<html|DOCTYPE/i.test(t.slice(0, 200))) throw new Error('chưa mở quyền xem file');
        var v = csv(t);
        if (!v.length) throw new Error('bảng trống');
        var h = v[0].map(gon), c = {};
        h.forEach(function (x, i) { c[x] = i; });
        var homNay = new Date();
        homNay = new Date(homNay.getFullYear(), homNay.getMonth(), homNay.getDate());
        var ra = [];
        for (var i = 1; i < v.length; i++) {
          var ten = gon(v[i][c['ten_cong_viec']]);
          if (!ten) continue;
          var tt = gon(v[i][c['trang_thai']]).replace(/^\d+\./, '').trim();
          var d = ngay(v[i][c['deadline']]);
          var m = ten.match(/^(CN[123])\s*·\s*/);
          ra.push({
            ai: gon(v[i][c['ho_va_ten']]) || gon(v[i][c['phong_ban']]) || '',
            viec: m ? ten.slice(m[0].length) : ten,
            cn: m ? m[1] : 'KHAC',
            chiSo: gon(v[i][c['ten_khach_hang']]),
            han: d ? (d.getDate() + '/' + (d.getMonth() + 1)) : '',
            ngayHan: d,
            tt: tt,
            xong: xong(tt),
            tre: !xong(tt) && d && d < homNay
          });
        }
        DS = ra; loi = null; ve();
      })
      .catch(function (e) { loi = '' + (e.message || e); ve(); });
  }

  function ve() {
    var sec = document.getElementById('sc-GB2ViecCu');
    if (!sec) return;
    var hang = $$('[data-k^="vtt.r"]', sec);
    var mau = sec.querySelector('[data-vt-mau]') || (hang.length > 1 ? hang[1] : null);
    if (!mau) return;
    if (!mau.getAttribute('data-vt-mau')) {
      mau.setAttribute('data-vt-mau', '1');
      mau.style.display = 'none';
    }
    var cha = mau.parentNode;
    $$('[data-vt-dong]', cha).forEach(function (x) { cha.removeChild(x); });
    hang.slice(1).forEach(function (x) { if (x !== mau && x.parentNode === cha) cha.removeChild(x); });

    function dong(ai, viec, han, nhan, nen, chu) {
      var tr = mau.cloneNode(true);
      tr.removeAttribute('data-k');
      tr.removeAttribute('data-vt-mau');
      tr.setAttribute('data-vt-dong', '1');
      tr.style.display = '';
      var sp = tr.querySelectorAll(':scope > span');
      if (sp.length >= 4) {
        sp[0].textContent = ai || '—';
        sp[1].textContent = viec || '—';
        sp[2].textContent = han || '';
        sp[3].textContent = nhan;
        sp[3].style.background = nen; sp[3].style.color = chu;
      }
      cha.appendChild(tr);
      return tr;
    }

    if (loi) { dong('—', 'Chưa đọc được bảng CONG_VIEC: ' + loi, '', '—', '#FBE4E2', '#B42318'); return; }
    if (DS === null) { dong('—', 'đang đọc bảng CONG_VIEC của app…', '', '…', '#EEF2F6', '#5F6B7A'); return; }

    var cn = (window.PLG_LOC && window.PLG_LOC.cn) || 'TAT';
    var ds = DS.filter(function (v) { return cn === 'TAT' || v.cn === cn; });
    if (!ds.length) {
      dong('—', 'Bảng CONG_VIEC chưa có việc nào cho chi nhánh đang chọn', '', '—', '#EEF2F6', '#5F6B7A');
    } else {
      /* việc chưa xong lên trước, trễ lên đầu — đúng tinh thần _CV_CHUA_LAM */
      ds.sort(function (a, b) {
        if (a.xong !== b.xong) return a.xong ? 1 : -1;
        if (a.tre !== b.tre) return a.tre ? -1 : 1;
        return 0;
      });
      ds.slice(0, 12).forEach(function (v) {
        var nhan = v.xong ? 'Xong' : (v.tre ? '🔥 Trễ · ' + v.tt : (v.tt || 'Chờ thực hiện'));
        var nen = v.xong ? '#E7F5EC' : (v.tre ? '#FBE4E2' : '#FFF2CC');
        var chu = v.xong ? '#1E6B3A' : (v.tre ? '#B42318' : '#6B4500');
        var tr = dong(v.ai, v.viec, v.han, nhan, nen, chu);
        var sp = tr.querySelectorAll(':scope > span');
        if (v.chiSo && sp[1]) {
          var p = document.createElement('div');
          p.style.cssText = 'font-size:11px;color:#5F6B7A;margin-top:2px';
          p.textContent = 'đo bằng: ' + v.chiSo;
          sp[1].appendChild(p);
        }
      });
    }

    /* 3 thẻ số — tính thật, kể cả khi danh sách rỗng */
    var soXong = ds.filter(function (v) { return v.xong; }).length;
    var soTre = ds.filter(function (v) { return v.tre; }).length;
    var soLam = ds.length - soXong - soTre;
    var the = $$('div[style*="font-size: 30px"]', sec);
    function nhan(e, chu) { if (e && e.previousElementSibling) e.previousElementSibling.textContent = chu; }
    if (the[0]) {
      the[0].innerHTML = soXong + '/' + ds.length + ' <span style="font-size:16px">· '
        + (ds.length ? Math.round(soXong / ds.length * 100) : 0) + '%</span>';
      nhan(the[0], 'Việc đã xong');
    }
    if (the[1]) { the[1].textContent = soLam + '/' + ds.length; nhan(the[1], 'Đang làm / chờ'); }
    if (the[2]) {
      the[2].textContent = soTre + '/' + ds.length;
      the[2].style.color = soTre ? '#B42318' : '#1E6B3A';
      nhan(the[2], '🔥 Trễ hạn');
    }

    var b = sec.querySelector('.pl-badge-nguon');
    if (b && /MINH HỌA|ĐANG TẢI/.test(b.textContent || '')) {
      b.textContent = 'SỐ LIVE · BẢNG CONG_VIEC';
      b.style.background = '#E7F5EC'; b.style.color = '#1E6B3A';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', doc);
  else doc();
  setInterval(ve, 2500);
  setInterval(doc, 120000);
})();
