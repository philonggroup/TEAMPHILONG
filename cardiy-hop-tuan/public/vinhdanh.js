'use strict';
/* ════════════════════════════════════════════════════════════════════
   VINH DANH — ĐỌC LIVE 6 GIẢI TỪ KPI
   Tracy chốt 24/11/2026: màn Vinh danh lấy kết quả từ KPI 3 chi nhánh,
   6 giải, theo TUẦN / THÁNG / QUÝ, theo từng chi nhánh VÀ hệ thống.
   "Cúp chỉ trao cho người ĐÃ QUA VẠCH CHUẨN."

   Nguồn số : tab KPI_LOG trong file PHI LONG_GROUP — chính là 3 tab
              KPI CN1 / CN2 / CN3 đã tãi về dạng từng dòng một ngày,
              kèm ngày thật và mã nhân viên. File tự kiểm và báo
              "✅ KHỚP" với cả 3 tab, nên số y hệt, chỉ khác cách xếp.
              Đọc thẳng 3 tab kia thì mỗi tab một kiểu cột (CN1 bắt đầu
              dòng 4, CN2 dòng 5, CN3 không ghi nhóm) và không có ngày
              thật nên không cắt được theo quý.
   Vạch chuẩn: tab KPI_DINH_MUC, khoá CHI NHÁNH | NHÓM | CHỈ TIÊU.
              Tuần = định mức ngày × 6. (Chính bảng định mức cho thấy
              26 ngày công/tháng: 20.000.000 ÷ 769.231 = 26, 208 ÷ 8 = 26,
              52 ÷ 2 = 26 → 26 ÷ 4,333 tuần ≈ 6 ngày/tuần.)
              Tháng = định mức tháng · Quý = ×3 · 6 tháng = ×6.
   ════════════════════════════════════════════════════════════════════ */
{
  const FILE = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';
  const GID_LOG = '1051521304';      /* KPI_LOG      */
  const GID_DM  = '2050987137';      /* KPI_DINH_MUC */
  const NGAY_TUAN = 6;               /* 26 ngày công / 4,333 tuần */
  const LAM_MOI = 300000;

  /* 6 giải Tracy chốt. nhom chỉ để gom thẻ cho dễ nhìn. */
  const GIAI = [
    {ma:'lop',   khoi:'KINH DOANH', ct:'Lốp Xe',             dv:'đ',
     ten:'Tăng tốc về đích · Bứt phá doanh số lốp'},
    {ma:'ngoai', khoi:'KINH DOANH', ct:'SP Ngoài Lốp',       dv:'đ',
     ten:'Top 1 · Bảo dưỡng + Sửa chữa + Phụ kiện'},
    {ma:'dvl',   khoi:'KỸ THUẬT VIÊN', ct:'DVL',             dv:'đ',
     ten:'Vinh danh KTV · Doanh thu DVL'},
    {ma:'dvnl',  khoi:'KỸ THUẬT VIÊN', ct:'DVNL',            dv:'đ',
     ten:'Vinh danh KTV · Doanh thu DVNL'},
    {ma:'phieu', khoi:'KỸ THUẬT VIÊN', ct:'Phiếu Kiểm Tra Xe.', dv:'phiếu',
     ten:'Bứt tốc mạnh nhất · Phiếu kiểm tra an toàn'},
    {ma:'luot',  khoi:'KỸ THUẬT VIÊN', ct:'Tổng Lượt xe',    dv:'lượt',
     ten:'Top 1 · Tổng lượt xe phục vụ'},
  ];
  const CN = ['CN1','CN2','CN3'];

  let dong = null;        /* [{ngay,cn,nhom,ten,ct,gt}] */
  let chuan = null;       /* Map 'CN|NHÓM|CHỈ TIÊU' → {ngay,thang} */
  let thangCo = [];       /* các tháng nguồn thật sự có số */
  let loi = '';
  let docLuc = null;
  let dangDoc = false;

  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const khoa = v => gon(v).toUpperCase();
  function so(v) {
    const t = gon(v).replace(/%/g,'');
    if (!t) return null;
    const n = Number(t.replace(/\./g,'').replace(',','.'));
    return Number.isFinite(n) ? n : null;
  }
  /* "01/11/2026" → "2026-11-01". Nguồn ghi ngày/tháng/năm. */
  function ngayIso(v) {
    const m = gon(v).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return '';
    return m[3] + '-' + m[2].padStart(2,'0') + '-' + m[1].padStart(2,'0');
  }
  function tien(gt, dv) {
    if (gt === null || gt === undefined) return '—';
    if (dv !== 'đ') return showNumber(gt, dv);
    return gt >= 1000000 ? showNumber(gt/1000000,'tr') : showNumber(gt,'đ');
  }

  function tachCsv(text) {
    const ra = [];
    let d = [], o = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i+1] === '"') { o += '"'; i++; } else q = false; } else o += c; }
      else if (c === '"') q = true;
      else if (c === ',') { d.push(o); o = ''; }
      else if (c === '\n') { d.push(o); ra.push(d); d = []; o = ''; }
      else if (c !== '\r') o += c;
    }
    if (o.length || d.length) { d.push(o); ra.push(d); }
    return ra;
  }
  async function docCsv(gid, chon) {
    const url = 'https://docs.google.com/spreadsheets/d/' + FILE + '/gviz/tq?tqx=out:csv&gid=' + gid +
      '&tq=' + encodeURIComponent(chon) + '&_=' + Date.now();
    const r = await fetch(url,{cache:'no-store'});
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    if (/^\s*(<html|<!DOCTYPE)/i.test(text)) throw new Error('file chưa mở quyền xem bằng link');
    return tachCsv(text);
  }

  async function doc() {
    if (dangDoc) return;
    dangDoc = true;
    try {
      /* KPI_LOG: B ngay · C chi_nhanh · D nhom · E ten_kpi · F chi_tieu · G gia_tri */
      const v = await docCsv(GID_LOG, 'select B,C,D,E,F,G');
      const ds = [];
      const thang = new Set();
      for (const h of v) {
        const iso = ngayIso(h[0]);
        if (!iso) continue;                       /* bỏ dòng tiêu đề */
        const gt = so(h[5]);
        if (!gt) continue;                        /* 0 và rỗng không ảnh hưởng xếp hạng */
        ds.push({ngay: iso, cn: gon(h[1]), nhom: gon(h[2]), ten: gon(h[3]), ct: gon(h[4]), gt});
        thang.add(iso.slice(0,7));
      }
      dong = ds;
      thangCo = [...thang].sort();
      /* KPI_DINH_MUC: B chi_nhanh · C nhom · D chi_tieu · E ngày · F tháng.
         gviz nuốt 2 dòng đầu vào tiêu đề nên lọc theo chính cột chi nhánh. */
      const w = await docCsv(GID_DM, 'select B,C,D,E,F');
      const m = new Map();
      for (const h of w) {
        if (!/^CN\d$/.test(gon(h[0]))) continue;
        m.set(khoa(h[0]) + '|' + khoa(h[1]) + '|' + khoa(h[2]), {ngay: so(h[3]), thang: so(h[4])});
      }
      chuan = m;
      loi = '';
      docLuc = new Date();
    } catch (e) {
      dong = null; chuan = null;
      loi = String(e.message || e);
    } finally {
      dangDoc = false;
    }
  }

  /* ---------- kỳ đang xem ---------- */
  /* Tuần trong tháng: T1 01–07 · T2 08–14 · T3 15–21 · T4 22–28 · T5 29–hết */
  function ky() {
    const nay = today();
    const nam = nay.slice(0,4), thang = nay.slice(5,7);
    const p = state.period;
    if (p === 'week') {
      const n = Math.min(5, Math.floor((Number(nay.slice(8,10)) - 1) / 7) + 1);
      const tu = String(1 + (n-1)*7).padStart(2,'0');
      const den = n === 5 ? '31' : String(n*7).padStart(2,'0');
      return {tu: nam+'-'+thang+'-'+tu, den: nam+'-'+thang+'-'+den,
        nhan: 'tuần ' + n + ' tháng ' + Number(thang), heSo: NGAY_TUAN, theoNgay: true};
    }
    if (p === 'month') {
      return {tu: nam+'-'+thang+'-01', den: nam+'-'+thang+'-31',
        nhan: 'tháng ' + Number(thang), heSo: 1, theoNgay: false};
    }
    if (p === 'quarter') {
      const q = Math.floor((Number(thang)-1)/3);
      const t1 = String(q*3+1).padStart(2,'0'), t3 = String(q*3+3).padStart(2,'0');
      return {tu: nam+'-'+t1+'-01', den: nam+'-'+t3+'-31',
        nhan: 'quý ' + (q+1), heSo: 3, theoNgay: false};
    }
    return {tu: nam+'-07-01', den: nam+'-12-31', nhan: '6 tháng cuối năm', heSo: 6, theoNgay: false};
  }
  /* Vạch chuẩn của một người cho một giải trong kỳ đang xem */
  function vach(g, cn, nhom, k) {
    const c = chuan.get(khoa(cn) + '|' + khoa(nhom) + '|' + khoa(g.ct));
    if (!c) return null;
    const goc = k.theoNgay ? c.ngay : c.thang;
    return goc ? goc * k.heSo : null;
  }
  /* Top 1 của một giải trong một phạm vi (một chi nhánh, hoặc cả hệ thống) */
  function top1(g, k, cn) {
    const cong = new Map();
    for (const d of dong) {
      if (d.ngay < k.tu || d.ngay > k.den) continue;
      if (khoa(d.ct) !== khoa(g.ct)) continue;
      if (cn && d.cn !== cn) continue;
      const kh = d.cn + '|' + d.ten;
      const o = cong.get(kh) || {ten: d.ten, cn: d.cn, nhom: d.nhom, gt: 0};
      o.gt += d.gt;
      cong.set(kh, o);
    }
    const ds = [...cong.values()].sort((a,b) => b.gt - a.gt);
    if (!ds.length) return null;
    const x = ds[0];
    x.vach = vach(g, x.cn, x.nhom, k);
    x.qua = x.vach !== null && x.gt >= x.vach;
    x.nhi = ds[1] || null;
    return x;
  }

  /* ---------- vẽ ---------- */
  function theNguoi(g, x, ten, he) {
    const lop = 'vd-o' + (he ? ' vd-he' : '');
    if (!x) return '<div class="' + lop + ' vd-trong"><span class="vd-pham">' + label(ten) + '</span>' +
      '<p class="vd-khong">Chưa có số trong kỳ này</p></div>';
    const tyLe = x.vach ? Math.round(x.gt / x.vach * 100) : null;
    const thieu = x.vach && !x.qua ? tien(x.vach - x.gt, g.dv) : '';
    const nut = x.qua
      ? '<button type="button" class="vd-ten vd-thang" data-action="vd-chuc" data-giai="' + g.ma +
        '" data-ten="' + label(x.ten) + '" data-cn="' + label(x.cn) + '" data-gt="' + x.gt +
        '" data-vach="' + x.vach + '">🏆 ' + label(x.ten) + '</button>'
      : '<span class="vd-ten vd-chua">' + label(x.ten) + '</span>';
    const trangThai = x.vach === null
      ? '<span class="pill warn">chưa đặt vạch chuẩn</span><small>Không trao cúp cho tới khi KPI_DINH_MUC có dòng này.</small>'
      : x.qua
        ? '<span class="pill good">Đã qua vạch chuẩn</span>'
        : '<span class="pill miss">Chưa qua vạch chuẩn</span><small>còn thiếu ' + thieu + '</small>';
    return '<div class="' + lop + (x.qua ? ' vd-co-cup' : '') + '">' +
      '<span class="vd-pham">' + label(ten) + '</span>' + nut +
      '<p class="vd-so"><strong>' + tien(x.gt, g.dv) + '</strong>' +
      (x.vach !== null ? ' / ' + tien(x.vach, g.dv) + (tyLe !== null ? ' · ' + tyLe + '%' : '') : '') + '</p>' +
      '<p class="vd-tt">' + trangThai + '</p>' +
      (x.nhi ? '<p class="vd-nhi">Kế sau: ' + label(x.nhi.ten) + ' · ' + tien(x.nhi.gt, g.dv) + '</p>' : '') +
      '</div>';
  }
  function theGiai(g, k) {
    const pham = isJoint() ? CN : [CN[state.branch]];
    const o = pham.map((cn,i) => theNguoi(g, top1(g, k, cn),
      isJoint() ? branchNames[CN.indexOf(cn)] : branchNames[state.branch])).join('');
    /* Thẻ HỆ THỐNG hiện ở CẢ hai chế độ: xem riêng một bàn vẫn phải thấy
       người đang dẫn đầu toàn hệ thống, đó là mức để so. */
    const he = theNguoi(g, top1(g, k, null), 'HỆ THỐNG', true);
    return '<section class="vd-giai"><h3>' + label(g.ten) + '</h3>' +
      '<p class="vd-khoi">' + label(g.khoi) + ' · ' + label(k.nhan) + '</p>' +
      '<div class="vd-hang">' + o + he + '</div></section>';
  }
  function thanh(k) {
    if (loi) return '<p class="sheet-error"><strong>CHƯA ĐỌC ĐƯỢC KPI</strong> · ' + label(loi) +
      ' <button class="button secondary" type="button" data-action="vd-live">Đọc lại</button></p>';
    if (!dong) return '<p class="empty">Đang đọc KPI 3 chi nhánh…</p>';
    const gio = new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(docLuc);
    const trong = !dong.some(d => d.ngay >= k.tu && d.ngay <= k.den);
    const thieuThang = !k.theoNgay && k.heSo > 1 && thangCo.length < k.heSo
      ? '<p class="vd-canh">Nguồn KPI mới có ' + thangCo.length + ' tháng (' + label(thangCo.join(', ')) +
        '), nhưng kỳ này cần ' + k.heSo + ' tháng. Số đang hiện là phần đã có — <strong>chưa đủ để chốt giải kỳ này</strong>.</p>'
      : '';
    const rong = trong ? '<p class="vd-canh">Kỳ này chưa có dòng KPI nào. Chưa tới kỳ, hoặc chi nhánh chưa nhập số.</p>' : '';
    return '<p class="viec-live"><span class="pill good">LIVE</span> KPI 3 chi nhánh · ' + label(k.nhan) +
      ' · đọc lúc ' + gio + ' · <strong>' + dong.length + '</strong> dòng nguồn · ' +
      '<button class="button secondary" type="button" data-action="vd-live">Đọc lại</button></p>' + thieuThang + rong;
  }
  function bangVang() {
    const k = ky();
    const than = thanh(k);
    if (!dong || !chuan) {
      return panel('Bảng vàng · 6 giải từ KPI', 'Cúp chỉ trao cho người đã qua vạch chuẩn', '', than);
    }
    const kd = GIAI.filter(g => g.khoi === 'KINH DOANH').map(g => theGiai(g,k)).join('');
    const kt = GIAI.filter(g => g.khoi === 'KỸ THUẬT VIÊN').map(g => theGiai(g,k)).join('');
    const luat = '<p class="vd-luat"><strong>Luật trao cúp</strong> · Cúp chỉ trao cho người ĐÃ QUA VẠCH CHUẨN. ' +
      'Bấm vào tên người được vinh danh để chúc mừng — mỗi người nói 30 giây. ' +
      'Vạch chuẩn lấy từ KPI_DINH_MUC: tuần = định mức ngày × ' + NGAY_TUAN +
      ' · tháng = định mức tháng · quý = ×3.</p>';
    return panel('Bảng vàng · 6 giải từ KPI', 'Theo ' + label(k.nhan) + ' · từng chi nhánh và toàn hệ thống', '',
      '<div class="vd-than">' + than + luat + kd + kt + '</div>');
  }

  /* ---------- chúc mừng 30 giây ---------- */
  let demNguoc = null;
  function chucMung(b) {
    const hop = document.querySelector('#award-celebration');
    if (!hop) return;
    const g = GIAI.find(x => x.ma === b.dataset.giai);
    const gt = Number(b.dataset.gt), v = Number(b.dataset.vach);
    hop.querySelector('#award-portrait').innerHTML =
      '<div class="award-portrait"><span class="award-icon" aria-hidden="true">🏆</span></div>';
    hop.querySelector('#award-criterion').textContent = (g ? g.ten : '') + ' · ' + b.dataset.cn;
    hop.querySelector('#award-heading').textContent = 'Chúc mừng ' + b.dataset.ten + '!';
    const o = hop.querySelector('#award-result');
    o.innerHTML = '<span>' + tien(gt, g ? g.dv : '') + ' / vạch chuẩn ' + tien(v, g ? g.dv : '') + '</span>' +
      '<span class="vd-dem">Mời chia sẻ 30 giây — <strong>30</strong></span>';
    hop.showModal();
    hop.querySelector('button').focus();
    window.clearInterval(demNguoc);
    let con = 30;
    const oDem = o.querySelector('.vd-dem strong');
    demNguoc = window.setInterval(() => {
      con -= 1;
      if (oDem) oDem.textContent = String(Math.max(0,con));
      if (con <= 0) window.clearInterval(demNguoc);
    }, 1000);
    hop.addEventListener('close', () => window.clearInterval(demNguoc), {once:true});
  }

  /* ---------- nối vào màn Vinh danh ---------- */
  const goc = window.awardsPage;
  window.awardsPage = function() {
    const html = goc();
    /* Chèn ngay sau tiêu đề trang, trước các bảng vinh danh ghi tay. */
    return html.replace('<div class="column">', '<div class="column">' + bangVang());
  };

  async function lamMoi() {
    await doc();
    if (typeof view !== 'undefined' && view === 'awards') render();
  }
  document.addEventListener('click', event => {
    const b = event.target.closest('[data-action="vd-chuc"]');
    if (b) { chucMung(b); return; }
    if (event.target.closest('[data-action="vd-live"]')) { loi = ''; lamMoi(); }
  });
  window.setInterval(() => {
    if (document.hidden) return;
    if (typeof view === 'undefined' || view !== 'awards') return;
    lamMoi();
  }, LAM_MOI);

  window.CARDIY_VINH_DANH = {doc: lamMoi, dong: () => dong, chuan: () => chuan,
    thangCo: () => thangCo, loi: () => loi, giai: () => GIAI, top1: (ma,cn) => {
      const g = GIAI.find(x => x.ma === ma);
      return g ? top1(g, ky(), cn || null) : null;
    }};
  lamMoi();
}
