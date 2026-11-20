/* Duong dua 3 chi nhanh tren man Toan canh (sc-Main) cua giaoban.html
   Giao dien 100% theo mau duaxe.html: lan xe, xe SVG, vach tram, vach dich vang.
   Doc so live san co o window.DU_LIEU - khong dong vao logic so cua trang giao ban. */
(function () {
  var MAU = { CN1: '#2ea8ff', CN2: '#ff3d9a', CN3: '#ffd12e' };
  var CSS = ''
    + '#dua-cn{border:1px solid #1e2b52;border-radius:14px;background:#0e1630;padding:11px 14px 12px;font-family:"Be Vietnam Pro",Arial,sans-serif}'
    + '#dua-cn .dua-dau{display:flex;flex-wrap:wrap;gap:10px;align-items:baseline;justify-content:space-between;margin-bottom:8px}'
    + '#dua-cn .dua-dau h3{margin:0;color:#eaf0ff;font-size:14px;font-weight:800;letter-spacing:.04em}'
    + '#dua-cn .dua-ghi{margin:0;font-size:11px;color:#8ea0c8}'
    + '#dua-cn .lan{display:grid;grid-template-columns:minmax(150px,210px) 1fr 112px;gap:10px;align-items:center;padding:4px 0}'
    + '#dua-cn .lan+.lan{border-top:1px solid rgba(255,255,255,.055)}'
    + '#dua-cn .lan-ten{display:flex;align-items:center;gap:6px;min-width:0;font-size:12.5px;font-weight:700;line-height:1.25;color:#eaf0ff}'
    + '#dua-cn .lan-ten .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '#dua-cn .lan-hang{font-size:11px;min-width:19px;height:19px;border-radius:5px;display:grid;place-items:center;background:#11203f;color:#8ea0c8;flex:none;font-weight:800}'
    + '#dua-cn .lan-hang.v1{background:#ffc62e;color:#2a1c00}'
    + '#dua-cn .lan-hang.v2{background:#c7d2e4;color:#1b2436}'
    + '#dua-cn .lan-hang.v3{background:#d98b4a;color:#2a1200}'
    + '#dua-cn .dot{width:9px;height:9px;border-radius:50%;flex:none;display:inline-block}'
    + '#dua-cn .lan-muc{font-size:9.5px;letter-spacing:.04em;border-radius:4px;padding:1px 5px;flex:none;font-weight:800}'
    + '#dua-cn .lan-d{position:relative;height:38px;border-radius:7px;overflow:hidden;background:linear-gradient(180deg,#2b3550,#1b2440);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}'
    + '#dua-cn .lan-d::before{content:"";position:absolute;left:0;right:0;top:50%;height:2px;transform:translateY(-50%);background:repeating-linear-gradient(90deg,rgba(255,255,255,.5) 0 10px,transparent 10px 22px)}'
    + '#dua-cn .lan-fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(25,227,255,.10),rgba(255,138,31,.34))}'
    + '#dua-cn .lan-moc{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,255,255,.55)}'
    + '#dua-cn .lan-moc.dich{width:0;border-left:3px dashed #ffc62e;transform:translateX(-3px)}'
    + '#dua-cn .lan-xe{position:absolute;top:50%;display:flex;align-items:center;gap:4px;transition:left .5s ease;line-height:0;white-space:nowrap}'
    + '#dua-cn .lan-xe svg{display:block;filter:drop-shadow(0 3px 5px rgba(0,0,0,.55))}'
    + '#dua-cn .xe-so{font-weight:800;font-size:12px;line-height:1;min-width:19px;height:19px;padding:0 3px;display:grid;place-items:center;border-radius:5px;background:#f2f6ff;color:#0b111f;flex:none;box-shadow:0 2px 5px rgba(0,0,0,.5);border:1.5px solid rgba(8,14,30,.6)}'
    + '#dua-cn .lan-so{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}'
    + '#dua-cn .lan-so b{font-size:14px;display:block;color:#eaf0ff}'
    + '#dua-cn .lan-so span{font-size:10.5px;color:#8ea0c8}'
    + '#dua-cn .dua-thang{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:10.5px;color:#8ea0c8}'
    + '#dua-cn .dua-thang i{font-style:normal}';

  function cssMotLan() {
    if (document.getElementById('dua-cn-css')) return;
    var st = document.createElement('style');
    st.id = 'dua-cn-css';
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* xe nhin ngang - lay nguyen tu duaxe.html */
  function xeNgang(mau, w, id, so) {
    var h = Math.round(w * 0.47);
    return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 120 56" aria-hidden="true">'
      + '<defs><linearGradient id="nx' + id + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="#ffffff" stop-opacity=".62"/>'
      + '<stop offset=".32" stop-color="' + mau + '"/>'
      + '<stop offset="1" stop-color="#000000" stop-opacity=".46"/></linearGradient></defs>'
      + '<ellipse cx="62" cy="49" rx="50" ry="4.6" fill="rgba(0,0,0,.4)"/>'
      + '<path d="M4 33 q-5 -5 0 -10 q9 3 14 5 q-5 2 -14 5 Z" fill="#8bebff" opacity=".8"/>'
      + '<path d="M12 21 h17 v3.4 h-17 Z" fill="' + mau + '"/><path d="M20 24 v6 h3 v-6 Z" fill="#141a28"/>'
      + '<path d="M15 36 L21 23 Q30 14 48 13 L72 13 Q92 15 104 26 L112 30 Q118 32 116 38 L114 41 L17 41 Q11 40 15 36 Z" fill="url(#nx' + id + ')"/>'
      + '<path d="M31 24 Q37 17 49 16 L66 16 Q80 18 90 26 Z" fill="#0a1222" opacity=".88"/>'
      + '<path d="M34 23 Q39 18 49 17.4 L61 17.4 L67 23 Z" fill="#bfe4ff" opacity=".32"/>'
      + '<rect x="105" y="29" width="9" height="4" rx="2" fill="#ffe9a8"/>'
      + '<rect x="16" y="30" width="7" height="4" rx="2" fill="#ff2742"/>'
      + '<circle cx="38" cy="41" r="8.6" fill="#10151f"/><circle cx="38" cy="41" r="3.4" fill="#2c3648"/>'
      + '<circle cx="90" cy="41" r="8.6" fill="#10151f"/><circle cx="90" cy="41" r="3.4" fill="#2c3648"/>'
      + (so ? '<circle cx="62" cy="32" r="9.6" fill="#f7faff" stroke="#0b111f" stroke-width="1.6"/>'
            + '<text x="62" y="36.4" text-anchor="middle" font-family="Oswald,sans-serif" font-weight="700" font-size="'
            + (String(so).length > 1 ? 11 : 14) + '" fill="#0b111f">' + so + '</text>' : '')
      + '</svg>';
  }

  function timMoc(s) {
    var ds = s.getElementsByTagName('div');
    for (var i = 0; i < ds.length; i++) {
      if (ds[i].querySelector('div')) continue;
      if (ds[i].innerHTML.indexOf('NHẬN XÉT') >= 0) return ds[i];
    }
    return null;
  }

  function hop(s) {
    var b = document.getElementById('dua-cn');
    if (b) return b;
    var moc = timMoc(s);
    if (!moc || !moc.parentNode || !moc.parentNode.parentNode) return null;
    var khoi = moc.parentNode;
    b = document.createElement('div');
    b.id = 'dua-cn';
    khoi.parentNode.insertBefore(b, khoi);
    return b;
  }

  function noi(s) {
    var f = s.querySelector('.pl-frame');
    var inner = f ? f.firstElementChild : null;
    if (!inner) return;
    var cao = 950;
    var col = inner.firstElementChild;
    inner.style.height = cao + 'px';
    if (col) col.style.height = cao + 'px';
    if (String(cao) !== s.getAttribute('data-h')) {
      s.setAttribute('data-h', String(cao));
      window.dispatchEvent(new Event('resize'));
    }
  }

  function soVN(n) { return (Math.round(n) || 0).toLocaleString('vi-VN'); }

  function ve() {
    var j = window.DU_LIEU;
    if (!j || !j.chinhanh) return;
    var s = document.getElementById('sc-Main');
    if (!s) return;
    var b = hop(s);
    if (!b) return;
    cssMotLan();

    var ds = [];
    for (var i = 0; i < j.chinhanh.length; i++) {
      var c = j.chinhanh[i];
      var d = c.dong ? c.dong['4'] : null;
      if (!d) continue;
      var p = (d.pct === null || d.pct === undefined || isNaN(d.pct)) ? 0 : d.pct;
      ds.push({
        ma: c.ma,
        ten: (window.CAU_HINH && CAU_HINH.TEN_CN && CAU_HINH.TEN_CN[c.ma]) || c.ma,
        pct: p,
        thuc: (d.thuc || 0) / 1e6,
        kpi: (d.kpi || 0) / 1e6,
        mau: MAU[c.ma] || '#19e3ff'
      });
    }
    if (!ds.length) return;

    var xep = ds.slice().sort(function (a, b2) { return b2.pct - a.pct; });
    var hang = {};
    xep.forEach(function (r, k) { hang[r.ma] = k + 1; });
    var dinh = Math.max(100, xep[0].pct);   /* vach dich = 100% ke hoach; ai vuot thi duong dai them */

    var h = ['<div class="dua-dau"><h3>🏁 ĐƯỜNG ĐUA TUẦN · DOANH THU 3 CHI NHÁNH</h3>'
      + '<p class="dua-ghi">Vạch vàng nét đứt = 100% kế hoạch tuần · vạch trắng = mốc 50% và 90%</p></div>'];

    ds.forEach(function (r, i) {
      var pc = Math.max(0, Math.min(100, r.pct / dinh * 100));
      var hg = hang[r.ma];
      var m = window.mucTheoPct ? mucTheoPct(r.pct) : { nhan: '', bg: '#11203f', fg: '#eaf0ff' };
      var moci = '';
      [50, 90, 100].forEach(function (mv, k) {
        var x = mv / dinh * 100;
        if (x > 100.01) return;
        moci += '<i class="lan-moc' + (k === 2 ? ' dich' : '') + '" style="left:' + x + '%" title="Mốc ' + mv + '%"></i>';
      });
      h.push('<div class="lan">'
        + '<div class="lan-ten"><b class="lan-hang' + (hg <= 3 ? ' v' + hg : '') + '">' + hg + '</b>'
        + '<i class="dot" style="background:' + r.mau + '"></i>'
        + '<span class="nm">' + (hg === 1 ? '👑 ' : '') + r.ten + '</span>'
        + '<span class="lan-muc" style="background:' + m.bg + ';color:' + m.fg + '">' + (m.nhan || '') + '</span></div>'
        + '<div class="lan-d"><div class="lan-fill" style="width:' + pc + '%"></div>' + moci
        + '<div class="lan-xe" style="left:' + pc + '%;transform:translate(-' + pc + '%,-50%)">'
        + '<span class="xe-so" style="background:' + r.mau + ';color:#0b111f">' + (i + 1) + '</span>'
        + xeNgang(r.mau, 58, 'cn' + i, i + 1) + '</div></div>'
        + '<div class="lan-so"><b>' + soVN(r.thuc) + ' tr</b><span>' + Math.round(r.pct) + '% · KH ' + soVN(r.kpi) + ' tr</span></div>'
        + '</div>');
    });

    h.push('<div class="dua-thang"><i>Số trên xe = thứ tự chi nhánh</i><i>👑 = đang dẫn đầu</i>'
      + '<i>│ số trên làn là doanh thu thật tuần này</i></div>');

    b.innerHTML = h.join('');
    noi(s);
  }

  setInterval(ve, 2000);
  ve();
})();
