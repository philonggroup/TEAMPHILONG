/* ════════════════════════════════════════════════════════════════════
   VÒNG QUAY NGẪU NHIÊN CHỌN TÊN — Bước 1 Check-in và Bước 9 WIFLE
   Tracy chốt 21/11/2026:
     · vòng tròn nằm phía trên, kết quả theo thứ tự nằm dưới
     · chữ trên múi không được mất, không bị che
     · mỗi dòng thành viên nhập text, thêm bớt được

   MỘT danh sách thành viên dùng chung cho cả hai màn — sửa ở màn nào
   thì màn kia đổi theo. Lượt quay và thứ tự trúng đếm RIÊNG từng màn,
   vì check-in và WIFLE là hai vòng nói khác nhau.
   Cỡ chữ trên múi tự co theo tên dài nhất nên không cắt chữ.
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
  var MAU = ['#2F75B5', '#17365D', '#3E8FD0', '#1D4E82', '#4FA3DD', '#15304F', '#2A6AA6'];
  var XAM = '#5A6775';

  var ds = null, tt = {};

  function gon(t) { return (t || '').replace(/\s+/g, ' ').trim(); }
  function thoat(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function lay(k, md) { try { var v = localStorage.getItem('plg.vq.' + k); return v === null ? md : v; } catch (e) { return md; } }
  function ghi(k, v) { try { localStorage.setItem('plg.vq.' + k, v); } catch (e) { } }
  function nhan(x) { return gon(x.ten) || gon(x.vai) || '—'; }
  function khoi() { return Array.prototype.slice.call(document.querySelectorAll('[data-vq]')); }

  function st(ma) {
    if (!tt[ma]) {
      var tu = [];
      try { tu = JSON.parse(lay('thutu.' + ma, '[]')) || []; } catch (e) { }
      tt[ma] = { thuTu: tu, goc: 0, dangQuay: false };
    }
    return tt[ma];
  }
  function daTrung(ma, i) { return st(ma).thuTu.indexOf(i) >= 0; }

  /* ---------- danh sách dùng chung ---------- */
  function napDS() {
    var luu = lay('ds', '');
    if (luu) { try { var j = JSON.parse(luu); if (j && j.length) return j; } catch (e) { } }
    var ra = MAC_DINH.map(function (x) { return { vai: x.vai, ten: x.ten }; });
    /* ô live ghi "Phạm Thành Luận · PHI LONG 1" — vai trò đã nêu chi nhánh
       nên chỉ lấy phần tên cho vừa múi */
    function chiTen(t) { return gon(String(t || '').split('·')[0]); }
    var b1 = document.getElementById('sc-GB1CheckIn');
    if (b1) {
      for (var i = 0; i < 3; i++) {
        var o = b1.querySelector('[data-k="gb1.ql.' + i + '"]');
        var t = o ? chiTen(o.textContent) : '';
        if (t && t !== '—') ra[i + 1].ten = t;
      }
      var c = b1.querySelector('[data-k="gb1.cskh.ten"]');
      var tc = c ? chiTen(c.textContent) : '';
      if (tc && tc !== '—') ra[4].ten = tc;
    }
    return ra;
  }
  function luuDS() { ghi('ds', JSON.stringify(ds)); }

  /* ---------- khung của một khối ---------- */
  function dungKhung(k) {
    if (k.getAttribute('data-xong') === '1') return;
    k.setAttribute('data-xong', '1');
    var sang = k.getAttribute('data-nen') === 'sang';
    var co = parseInt(k.getAttribute('data-co'), 10) || 170;
    var chuTieu = sang ? '#5F6B7A' : '#B9CCE3';
    var chuChinh = sang ? '#17365D' : '#FFFFFF';
    /* màn rộng thì vòng nằm bên trái cho đỡ cao, màn hẹp thì vòng nằm trên */
    var ngang = k.getAttribute('data-huong') === 'ngang';
    k.setAttribute('style', ngang
      ? 'display:flex;flex-direction:row;align-items:flex-start;gap:14px'
      : 'display:flex;flex-direction:column;align-items:center;gap:7px');
    var moCot = ngang
      ? '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">' : '';
    var dongCot = ngang ? '</div>' : '';
    k.innerHTML =
      /* 1 · vòng tròn */
      '<div style="position:relative;width:' + co + 'px;height:' + co + 'px;flex-shrink:0">'
      + '<svg data-vq-svg viewBox="0 0 200 200" width="' + co + '" height="' + co + '" '
      + 'style="transition:transform 4s cubic-bezier(.15,.7,.12,1);display:block"></svg>'
      + '<div style="position:absolute;top:-3px;left:50%;transform:translateX(-50%);width:0;height:0;'
      + 'border-left:9px solid transparent;border-right:9px solid transparent;border-top:18px solid #F2B705;'
      + 'filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));z-index:3"></div>'
      + '<button type="button" data-vq-nut style="position:absolute;top:50%;left:50%;'
      + 'transform:translate(-50%,-50%);width:' + Math.round(co * 0.3) + 'px;height:' + Math.round(co * 0.3) + 'px;'
      + 'border-radius:50%;border:3px solid #FFFFFF;background:#F2B705;color:#17365D;'
      + 'font-family:\'Be Vietnam Pro\',Arial,sans-serif;font-size:' + (co > 170 ? 13 : 11) + 'px;'
      + 'font-weight:800;cursor:pointer;z-index:2;box-shadow:0 3px 9px rgba(0,0,0,.3)">QUAY</button></div>'
      + moCot
      /* 2 · tên vừa trúng */
      + '<div data-vq-trung style="font-size:' + (co > 170 ? 21 : 15) + 'px;font-weight:800;'
      + 'color:' + (sang ? '#17365D' : '#F2B705') + ';line-height:1.2;text-align:center;min-height:22px">'
      + 'Bấm QUAY để chọn người nói</div>'
      /* 3 · kết quả theo thứ tự */
      + '<div style="width:100%;display:flex;align-items:baseline;gap:7px;flex-wrap:wrap">'
      + '<span style="font-size:10.5px;font-weight:800;letter-spacing:.4px;color:' + chuTieu + '">KẾT QUẢ THEO THỨ TỰ</span>'
      + '<span data-vq-conlai style="font-size:11px;font-weight:800;color:#F2B705"></span>'
      + '<button type="button" data-vq-lai style="margin-left:auto;min-height:23px;padding:0 10px;'
      + 'border-radius:6px;border:1px solid ' + (sang ? '#D9E2EC' : 'rgba(255,255,255,.35)') + ';'
      + 'background:transparent;color:' + chuChinh + ';font-family:\'Be Vietnam Pro\',Arial,sans-serif;'
      + 'font-size:11px;font-weight:700;cursor:pointer">Đặt lại</button></div>'
      + '<div data-vq-kq style="width:100%;display:flex;flex-wrap:wrap;gap:4px;min-height:22px"></div>'
      /* 4 · danh sách thành viên nhập text */
      + '<div data-vq-ds style="width:100%;display:flex;flex-direction:column;gap:2px;'
      + 'max-height:' + (co > 170 ? 104 : 96) + 'px;overflow:auto"></div>'
      + '<button type="button" data-vq-them style="align-self:flex-start;min-height:25px;padding:0 11px;'
      + 'border-radius:6px;border:1px dashed ' + (sang ? '#B9CCE3' : 'rgba(255,255,255,.45)') + ';'
      + 'background:transparent;color:' + (sang ? '#2F75B5' : '#F2B705') + ';'
      + 'font-family:\'Be Vietnam Pro\',Arial,sans-serif;font-size:11px;font-weight:800;cursor:pointer">'
      + '+ THÊM THÀNH VIÊN</button>';
  }

  /* ---------- vẽ vòng quay ---------- */
  function cung(r, d) {
    var rad = (d - 90) * Math.PI / 180;
    return [100 + r * Math.cos(rad), 100 + r * Math.sin(rad)];
  }
  /* cỡ chữ tự co theo tên dài nhất, để KHÔNG phải cắt chữ */
  function coChu(n) {
    var dai = 0;
    ds.forEach(function (x) { dai = Math.max(dai, nhan(x).length); });
    var rong = 80;                       /* chiều dài khả dụng trên bán kính */
    var theoDai = rong / (dai * 0.56);   /* bề ngang trung bình một ký tự */
    var theoMui = (2 * Math.PI * 70 / n) * 0.74;   /* không chạm múi bên cạnh */
    return Math.max(5.5, Math.min(12, theoDai, theoMui));
  }
  function veSVG(k, ma) {
    var sv = k.querySelector('[data-vq-svg]');
    if (!sv || !ds.length) return;
    var n = ds.length, b = 360 / n, h = '', co = coChu(n);
    for (var i = 0; i < n; i++) {
      var a = cung(96, i * b), c = cung(96, i * b + b);
      var xong = daTrung(ma, i);
      h += '<path d="M100,100 L' + a[0].toFixed(2) + ',' + a[1].toFixed(2)
         + ' A96,96 0 ' + (b > 180 ? 1 : 0) + ',1 ' + c[0].toFixed(2) + ',' + c[1].toFixed(2) + ' Z" fill="'
         + (xong ? XAM : MAU[i % MAU.length]) + '" stroke="#FFFFFF" stroke-width="1.5"/>';
      h += '<text x="100" y="100" fill="' + (xong ? '#AAB4C0' : '#FFFFFF') + '" font-size="' + co.toFixed(1)
         + '" font-weight="700" font-family="Be Vietnam Pro, Arial, sans-serif" text-anchor="end" '
         + 'dominant-baseline="middle" transform="rotate(' + (i * b + b / 2 - 90).toFixed(2)
         + ' 100 100) translate(91 0)"' + (xong ? ' text-decoration="line-through"' : '')
         + '>' + thoat(nhan(ds[i])) + '</text>';
    }
    h += '<circle cx="100" cy="100" r="96" fill="none" stroke="#F2B705" stroke-width="4"/>';
    sv.innerHTML = h;
  }

  /* ---------- vẽ kết quả theo thứ tự ---------- */
  function veKQ(k, ma) {
    var h = k.querySelector('[data-vq-kq]');
    if (!h) return;
    var sang = k.getAttribute('data-nen') === 'sang';
    var tu = st(ma).thuTu;
    if (!tu.length) {
      h.innerHTML = '<span style="font-size:11.5px;font-style:italic;color:'
        + (sang ? '#8FA6C1' : '#7F93A8') + '">chưa quay lượt nào</span>';
      return;
    }
    h.innerHTML = tu.map(function (i, v) {
      return '<span style="padding:3px 9px;border-radius:13px;background:'
        + (sang ? '#EAF2F8' : 'rgba(255,255,255,.14)') + ';color:' + (sang ? '#17365D' : '#FFFFFF')
        + ';font-size:12px;font-weight:800;white-space:nowrap">' + (v + 1) + '. '
        + thoat(ds[i] ? nhan(ds[i]) : '—') + '</span>';
    }).join('');
  }

  /* ---------- vẽ danh sách thành viên ---------- */
  function veDS(k, ma) {
    var h = k.querySelector('[data-vq-ds]');
    if (!h) return;
    var ac = document.activeElement;
    if (ac && ac.getAttribute && h.contains(ac)
        && (ac.getAttribute('data-vqten') !== null || ac.getAttribute('data-vqvai') !== null)) return;
    var sang = k.getAttribute('data-nen') === 'sang';
    h.innerHTML = '';
    ds.forEach(function (x, i) {
      var xong = daTrung(ma, i);
      var d = document.createElement('div');
      d.setAttribute('style', 'display:flex;align-items:center;gap:6px;font-size:12.5px;'
        + (xong ? 'opacity:.55' : ''));
      d.innerHTML =
        '<span style="width:18px;height:18px;border-radius:9px;flex-shrink:0;background:'
          + (xong ? XAM : MAU[i % MAU.length]) + ';color:#FFF;font-size:10px;font-weight:800;'
          + 'display:flex;align-items:center;justify-content:center">' + (i + 1) + '</span>'
        + '<span contenteditable="true" spellcheck="false" data-vqvai="' + i + '" '
          + 'style="color:' + (sang ? '#5F6B7A' : '#B9CCE3') + ';font-weight:700;min-width:72px;'
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
      var s2 = document.createElement('style');
      s2.id = 'vq-css';
      s2.textContent = '[data-vqten]:empty:before{content:attr(data-goi);color:#8FA6C1;'
                     + 'font-weight:400;font-style:italic}';
      document.head.appendChild(s2);
    }
    var con = ds.length - st(ma).thuTu.length;
    var c = k.querySelector('[data-vq-conlai]');
    if (c) c.textContent = con > 0 ? ('còn ' + con + '/' + ds.length) : 'đã nói xong cả phòng';
    var n = k.querySelector('[data-vq-nut]');
    if (n) {
      n.disabled = (con <= 0) || st(ma).dangQuay;
      n.style.opacity = n.disabled ? '0.45' : '1';
      n.style.cursor = n.disabled ? 'default' : 'pointer';
    }
  }

  function veMot(k) {
    dungKhung(k);
    var ma = k.getAttribute('data-vq');
    veSVG(k, ma); veKQ(k, ma); veDS(k, ma);
  }
  function ve() { khoi().forEach(veMot); }

  /* ---------- quay ---------- */
  function quay(k) {
    var ma = k.getAttribute('data-vq'), s = st(ma);
    if (s.dangQuay || !ds.length) return;
    var con = [];
    ds.forEach(function (x, i) { if (!daTrung(ma, i)) con.push(i); });
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
      s.thuTu.push(trung);
      ghi('thutu.' + ma, JSON.stringify(s.thuTu));
      if (tr) {
        tr.textContent = s.thuTu.length + '. 🎤 ' + nhan(ds[trung]);
        tr.style.color = sang ? '#17365D' : '#F2B705';
      }
      veMot(k);
    }, 4100);
  }

  function datLai(k) {
    var ma = k.getAttribute('data-vq');
    st(ma).thuTu = [];
    ghi('thutu.' + ma, '[]');
    var tr = k.querySelector('[data-vq-trung]');
    var sang = k.getAttribute('data-nen') === 'sang';
    if (tr) {
      tr.textContent = 'Bấm QUAY để chọn người nói';
      tr.style.color = sang ? '#17365D' : '#F2B705';
    }
    veMot(k);
  }

  /* ---------- sự kiện ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    var k = t.closest ? t.closest('[data-vq]') : null;
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
      Object.keys(tt).forEach(function (ma) {
        tt[ma].thuTu = tt[ma].thuTu.filter(function (j) { return j !== i; })
                                   .map(function (j) { return j > i ? j - 1 : j; });
        ghi('thutu.' + ma, JSON.stringify(tt[ma].thuTu));
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
      var sv = k.querySelector('[data-vq-svg]');
      if (!sv || !sv.children.length) veMot(k);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', chay);
  else chay();
  /* tên live của Bước 1 về muộn: nạp lại khi người dùng chưa tự sửa */
  [4000, 8000, 14000].forEach(function (ms) {
    setTimeout(function () { if (!lay('ds', '')) { ds = napDS(); ve(); } }, ms);
  });
  setInterval(chay, 2500);
})();
