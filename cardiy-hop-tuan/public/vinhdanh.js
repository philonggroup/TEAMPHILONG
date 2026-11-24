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
  const GID_BAC = '152476500';       /* KPI_BAC_THANG — thang bac + màu */
  /* Cầu nối Apps Script — cùng một bản triển khai với màn Danh sách
     hành động, nên sửa một chỗ là cả app theo. */
  const API  = 'https://script.google.com/macros/s/AKfycbx2b5foWxdy2lVMVyoKLFGQrCE5zK1FqM7_3ivsNzJbuPFPqowAD6w-a8fjIO4BC1Xd_w/exec';
  const KHOA = 'PHILONG2026';
  const NGAY_TUAN = 6;               /* 26 ngày công / 4,333 tuần */
  const LAM_MOI = 300000;

  /* 6 giải Tracy chốt. nhom chỉ để gom thẻ cho dễ nhìn. */
  const GIAI = [
    {ma:'lop',   khoi:'KINH DOANH', ct:'Lốp Xe',             dv:'đ', hm:'Lốp Xe',
     ten:'Tăng tốc về đích · Bứt phá doanh số lốp'},
    {ma:'ngoai', khoi:'KINH DOANH', ct:'SP Ngoài Lốp',       dv:'đ', hm:'SP Ngoài Lốp',
     ten:'Top 1 · Bảo dưỡng + Sửa chữa + Phụ kiện'},
    /* Tracy chốt 24/11/2026: DVL và DVNL dùng CHUNG thang 10 tr / 20 tr
       của hạng mục "Doanh Thu Trực Tiếp" trong KPI_BAC_THANG — vẫn là hai
       giải riêng, chỉ chung một cái thước.
       Lưu ý khi đọc: thước này vốn đặt cho DVL+DVNL CỘNG LẠI, nên đo
       từng dòng riêng thì con số nằm thấp hơn trên thang. */
    {ma:'dvl',   khoi:'KỸ THUẬT VIÊN', ct:'DVL',             dv:'đ', hm:'Doanh Thu Trực Tiếp',
     ten:'Vinh danh KTV · Doanh thu DVL'},
    {ma:'dvnl',  khoi:'KỸ THUẬT VIÊN', ct:'DVNL',            dv:'đ', hm:'Doanh Thu Trực Tiếp',
     ten:'Vinh danh KTV · Doanh thu DVNL'},
    /* Tracy chốt 24/11/2026: hai giải này KHÔNG chấm theo mức, cũng không
       chấm riêng từng bàn — xét TOÀN HỆ THỐNG và mỗi mục vinh danh ĐÚNG
       MỘT nhân sự. Một chuỗi, một người mạnh nhất, không chia bục. */
    {ma:'phieu', khoi:'KỸ THUẬT VIÊN', ct:'Phiếu Kiểm Tra Xe.', dv:'phiếu', hang: 1,
     ten:'Bứt tốc mạnh nhất · Phiếu kiểm tra an toàn'},
    {ma:'luot',  khoi:'KỸ THUẬT VIÊN', ct:'Tổng Lượt xe',    dv:'lượt', hang: 1,
     ten:'Bứt tốc mạnh nhất · Tổng lượt xe phục vụ'},
  ];
  const CN = ['CN1','CN2','CN3'];

  let dong = null;        /* [{ngay,cn,nhom,ten,ct,gt}] */
  let chuan = null;       /* Map 'CN|NHÓM|CHỈ TIÊU' → {ngay,thang} */
  let bacThang = null;    /* Map 'NHÓM|HẠNG MỤC' → {m1,m2,m3} */
  /* Tên và màu của từng mức — đọc từ nguồn, đây chỉ là bản dự phòng khi
     tab chưa về kịp. Màu lấy đúng cột mau_hex của KPI_BAC_THANG. */
  let tenBac = {1:'MỨC 1', 2:'MỨC 2', 3:'MỨC 3 · LŨY TIẾN'};
  let mauBac = {1:'#FECB00', 2:'#0C6FD4', 3:'#1B9D6F'};
  let thangCo = [];       /* các tháng nguồn thật sự có số */
  let loi = '';
  let canhBao = [];
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
    canhBao = [];
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
      /* KPI_BAC_THANG: E nhom · G hang_muc · I muc_1 · J muc_2 · K muc_3 ·
         L bac · M ten_bac · P mau_hex. Thang bậc giống nhau cho mọi người
         cùng (nhóm | hạng mục) — đã kiểm 56/56 dòng — nên chỉ cần một bộ
         mốc, không phải dò theo từng tên. */
      try {
        const b = await docCsv(GID_BAC, 'select E,G,I,J,K,L,M,P');
        const mb = new Map();
        for (const h of b) {
          const nhom = gon(h[0]), hm = gon(h[1]);
          const bac = so(h[5]);
          if (bac && gon(h[6])) { tenBac[bac] = gon(h[6]); if (gon(h[7])) mauBac[bac] = gon(h[7]); }
          if (!nhom || !hm) continue;
          const m1 = so(h[2]), m2 = so(h[3]);
          if (!m1) continue;
          mb.set(khoa(nhom) + '|' + khoa(hm), {m1: m1, m2: m2 || m1 * 2, m3: so(h[4]) || m2 || m1 * 2});
        }
        bacThang = mb.size ? mb : null;
        if (!bacThang) canhBao.push('KPI_BAC_THANG: không đọc được mốc nào');
      } catch (e) {
        bacThang = null;
        canhBao.push('KPI_BAC_THANG: ' + (e.message || e));
      }
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
  /* Kỳ lấy từ thanh chọn chung (kychon.js) — một chỗ duy nhất quyết
     định mọi khối số, không mỗi màn một kiểu tính. */
  function ky() {
    const k = window.CARDIY_KY ? window.CARDIY_KY.khoang() : null;
    if (k) return {tu: k.tu, den: k.den, nhan: k.nhan, ngayCong: k.ngayCong, theoNgay: k.theoNgay};
    const nay = today();
    return {tu: nay.slice(0,8) + '01', den: nay.slice(0,8) + '31',
      nhan: 'tháng ' + Number(nay.slice(5,7)), ngayCong: 26, theoNgay: false};
  }
  /* Kỳ chưa đi hết thì vạch chuẩn phải co theo.
     Họp tuần vào thứ ba mà bắt đủ chỉ tiêu cả tuần thì không ai qua nổi —
     bảng vàng trống mãi, giải thành vô nghĩa. Nên vạch chuẩn = vạch trọn
     kỳ × phần kỳ đã trôi qua. Cùng một thước cho mọi người, nói ra được
     trước mặt cả ba bàn. */
  const NGAY_THANG = [31,28,31,30,31,30,31,31,30,31,30,31];
  function ngayCuoi(nam, thang) {
    const n = NGAY_THANG[thang-1];
    return thang === 2 && (nam % 4 === 0 && (nam % 100 !== 0 || nam % 400 === 0)) ? 29 : n;
  }
  const soNgay = d => Date.UTC(+d.slice(0,4), +d.slice(5,7)-1, +d.slice(8,10)) / 86400000;
  /* '2026-11-31' không có thật — kéo về ngày cuối tháng. */
  function thatNgay(d) {
    const nam = +d.slice(0,4), thang = +d.slice(5,7);
    const cuoi = ngayCuoi(nam, thang);
    return +d.slice(8,10) > cuoi ? d.slice(0,8) + String(cuoi) : d;
  }
  function tienDo(k) {
    const den = thatNgay(k.den), nay = today();
    const tong = soNgay(den) - soNgay(k.tu) + 1;
    if (nay >= den) return {ty: 1, nhan: 'trọn kỳ', tong, qua: tong};
    const qua = Math.min(tong, Math.max(1, soNgay(nay) - soNgay(k.tu) + 1));
    return {ty: qua / tong, nhan: qua + '/' + tong + ' ngày', tong, qua};
  }
  /* Tracy chốt 24/11/2026: BỎ VẠCH CHUẨN đạt/không đạt, thay bằng MỨC.
     Mốc lấy từ KPI_BAC_THANG — cùng thang bậc với bảng hoa hồng
     BAC_HOA_HONG, nên mức trên bảng vàng và mức tính tiền là MỘT.
       Mức 1: từ 0 tới mốc 1   · Mức 2: qua mốc 1  · Mức 3: qua mốc 2, lũy tiến
     Mốc là của THÁNG. Kỳ khác thì quy đổi theo 26 ngày công/tháng:
     tuần = ×6/26 · quý = ×3 · 6 tháng = ×6. KHÔNG nhân theo phần kỳ đã
     trôi qua: mức là bậc leo được tính dồn, y như cách tính hoa hồng. */
  function heSoMoc(k) {
    return (k.ngayCong || 26) / 26;      /* mốc THÁNG quy theo 26 ngày công */
  }
  function mucDat(g, gt, k) {
    if (!g.hm || !bacThang) return null;
    const t = bacThang.get(khoa(g.khoi) + '|' + khoa(g.hm));
    if (!t) return null;
    const he = heSoMoc(k);
    const m1 = t.m1 * he, m2 = t.m2 * he;
    const bac = gt >= m2 ? 3 : (gt >= m1 ? 2 : 1);
    const day = bac === 1 ? m1 : (bac === 2 ? m2 : null);
    const san = bac === 2 ? m1 : 0;
    return {
      bac: bac, ten: tenBac[bac] || ('MỨC ' + bac), mau: mauBac[bac] || '#5F6B7A',
      m1: m1, m2: m2, tran: day,
      tien: day ? Math.min(1, Math.max(0, (gt - san) / (day - san))) : 1,
      thieu: day ? Math.max(0, day - gt) : 0,
    };
  }
  /* Top 1 của một giải trong một phạm vi (một chi nhánh, hoặc cả hệ thống) */
  function xepHang(g, k, cn) {
    const cong = new Map();
    for (const d of dong) {
      if (d.ngay < k.tu || d.ngay > k.den) continue;
      if (khoa(d.ct) !== khoa(g.ct)) continue;
      /* Giải của khối nào chỉ xét người khối đó. Bỏ dòng này thì người
         KINH DOANH đứng đầu "Phiếu kiểm tra" sẽ nhận giải mang tên Kỹ
         thuật viên — đúng số nhưng sai người. */
      if (khoa(d.nhom) !== khoa(g.khoi)) continue;
      if (cn && d.cn !== cn) continue;
      const kh = d.cn + '|' + d.ten;
      const o = cong.get(kh) || {ten: d.ten, cn: d.cn, nhom: d.nhom, gt: 0};
      o.gt += d.gt;
      cong.set(kh, o);
    }
    return [...cong.values()].filter(x => x.gt > 0).sort((a,b) => b.gt - a.gt);
  }
  function top1(g, k, cn) {
    const ds = xepHang(g, k, cn);
    if (!ds.length) return null;
    const x = ds[0];
    x.muc = mucDat(g, x.gt, k);
    x.nhi = ds[1] || null;
    return x;
  }

  /* ---------- vẽ ---------- */
  /* Tracy chốt 24/11/2026: CHỈ HIỆN nhân sự ĐỦ ĐIỀU KIỆN. Chưa ai qua
     vạch chuẩn thì ô đó ẩn hẳn — không bêu tên người chưa đạt lên màn
     họp, cũng không để ai tưởng mình sắp có cúp. Lý do không chấm được
     (thiếu vạch chuẩn / chưa có số) gom xuống một dòng cuối bảng. */
  /* Tracy chốt 24/11/2026: thẻ vinh danh CHỈ 3 mục — tên · doanh số · mức
     đạt. Bỏ mốc, bỏ phần trăm tới bậc sau, bỏ dòng "kế sau": lúc xướng
     tên trước cả ba bàn, thêm chữ nào là loãng chữ đó. */
  function theNguoi(g, x, ten, he) {
    if (!x || !(x.gt > 0)) return '';          /* không có số thì ẩn */
    const m = x.muc;
    const lop = 'vd-o vd-co-cup' + (he ? ' vd-he' : '') + (m ? ' vd-muc' + m.bac : '');
    return '<div class="' + lop + '">' +
      '<span class="vd-pham">' + label(ten) + '</span>' +
      '<button type="button" class="vd-ten vd-thang" data-action="vd-chuc" data-giai="' + g.ma +
      '" data-ten="' + label(x.ten) + '" data-cn="' + label(x.cn) + '" data-gt="' + x.gt +
      '" data-bac="' + label(m ? m.ten : '') + '">🏆 ' + label(x.ten) + '</button>' +
      '<p class="vd-so"><strong>' + tien(x.gt, g.dv) + '</strong></p>' +
      '<p class="vd-tt">' + (m
        ? '<span class="vd-bac" style="background:' + label(m.mau) + '">' + label(m.ten) + '</span>'
        : '<span class="pill neutral">chưa đặt mức</span>') + nutSao(g, x, m) + '</p>' +
      '</div>';
  }
  /* Vì sao một ô trống — để báo xuống dòng cuối, không hiện trên thẻ giải. */
  function viSao(g, x, nhan) {
    if (!x || !(x.gt > 0)) return nhan + ': chưa có số trong kỳ';
    if (!x.muc) return nhan + ': "' + g.ct + '" chưa có thang mức trong KPI_BAC_THANG';
    return '';
  }
  /* Bục 3 bậc cho giải xếp hạng toàn hệ thống */
  const HANG = [
    {huy:'🥇', ten:'HẠNG 1', mau:'#D4A017'},
    {huy:'🥈', ten:'HẠNG 2', mau:'#8C9BAB'},
    {huy:'🥉', ten:'HẠNG 3', mau:'#B06A2C'},
  ];
  function theBuc(g, x, i) {
    const h = HANG[i];
    /* Mỗi mục một người thì không gọi là hạng — gọi thẳng HỆ THỐNG. */
    const mot = g.hang === 1;
    const noi = isJoint() ? 'TOÀN HỆ THỐNG' : label(branchNames[state.branch]);
    return '<div class="vd-o vd-co-cup vd-buc vd-buc' + (i+1) + (mot ? ' vd-he' : '') + '">' +
      '<span class="vd-pham">' + (mot ? '🏆 ' + noi : h.huy + ' ' + label(h.ten) + ' · ' + noi) + '</span>' +
      '<button type="button" class="vd-ten vd-thang" data-action="vd-chuc" data-giai="' + g.ma +
      '" data-ten="' + label(x.ten) + '" data-cn="' + label(x.cn) + '" data-gt="' + x.gt +
      '" data-bac="' + label(mot ? noi : h.ten) + '">' +
      (mot ? '🏆' : h.huy) + ' ' + label(x.ten) + '</button>' +
      '<p class="vd-so"><strong>' + tien(x.gt, g.dv) + '</strong></p>' +
      '<p class="vd-tt"><span class="vd-bac" style="background:' + h.mau + '">' +
      label(mot ? (isJoint() ? 'CAO NHẤT HỆ THỐNG' : 'CAO NHẤT BÀN NÀY') : h.ten) + '</span>' +
      nutSao(g, x, null) + '<small>' + label(x.cn) + '</small></p></div>';
  }
  function theGiaiHang(g, k, sot) {
    /* Tracy chốt 24/11/2026: chọn mục nào thì hiện đúng mục đó. Chọn một
       bàn thì xét trong bàn đó; chọn Hệ thống mới xét cả chuỗi. */
    const pv = isJoint() ? null : CN[state.branch];
    const ds = xepHang(g, k, pv).slice(0, g.hang);
    if (!ds.length) { sot.push(g.ten + ' · ' + (pv || 'toàn hệ thống') + ': chưa có số trong kỳ'); return ''; }
    if (ds.length < g.hang) sot.push(g.ten + ': mới có ' + ds.length + ' người có số, chưa đủ ' + g.hang + ' hạng');
    const noi = pv ? label(branchNames[CN.indexOf(pv)]) : 'toàn hệ thống';
    const mo = (g.hang === 1 ? 'người cao nhất ' : g.hang + ' người cao nhất ') + noi;
    return '<section class="vd-giai"><h3>' + label(g.ten) + '</h3>' +
      '<p class="vd-khoi">' + label(g.khoi) + ' · ' + mo + ' · ' + label(k.nhan) + '</p>' +
      '<div class="vd-hang">' + ds.map((x,i) => theBuc(g,x,i)).join('') + '</div></section>';
  }
  /* Tracy chốt 24/11/2026: Hệ thống CHỈ HIỆN ĐÚNG NGƯỜI ĐẠT — mỗi giải
     một người duy nhất, là người cao nhất trong phạm vi đang chọn.
     Trước đó mỗi giải bày 4 ô (3 bàn + hệ thống) nên người dẫn đầu hệ
     thống bị in hai lần, lúc xướng tên dễ nhầm là hai giải khác nhau. */
  function theGiai(g, k, sot) {
    if (g.hang) return theGiaiHang(g, k, sot);
    const pv = isJoint() ? null : CN[state.branch];
    const nhan = isJoint() ? 'HỆ THỐNG' : branchNames[state.branch];
    const x = top1(g, k, pv);
    const ly = viSao(g, x, nhan);
    if (ly) sot.push(g.ten + ' · ' + ly);
    const o = theNguoi(g, x, nhan, isJoint());
    if (!o) return '';
    return '<section class="vd-giai"><h3>' + label(g.ten) + '</h3>' +
      '<p class="vd-khoi">' + label(g.khoi) + ' · người cao nhất ' +
      (isJoint() ? 'toàn hệ thống' : label(branchNames[state.branch])) + ' · ' + label(k.nhan) + '</p>' +
      '<div class="vd-hang">' + o + '</div></section>';
  }
  function thanh(k) {
    if (loi) return '<p class="sheet-error"><strong>CHƯA ĐỌC ĐƯỢC KPI</strong> · ' + label(loi) +
      ' <button class="button secondary" type="button" data-action="vd-live">Đọc lại</button></p>';
    if (!dong) return '<p class="empty">Đang đọc KPI 3 chi nhánh…</p>';
    const gio = new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(docLuc);
    const trong = !dong.some(d => d.ngay >= k.tu && d.ngay <= k.den);
    /* Kỳ dài hơn phần nguồn đang có thì phải nói rõ, đừng để ai tưởng đủ. */
    const canThang = Math.round((k.ngayCong || 26) / 26);
    const thieuThang = canThang > 1 && thangCo.length < canThang
      ? '<p class="vd-canh">Nguồn KPI mới có ' + thangCo.length + ' tháng (' + label(thangCo.join(', ')) +
        '), nhưng kỳ này cần ' + canThang + ' tháng. Số đang hiện là phần đã có — <strong>chưa đủ để chốt giải kỳ này</strong>.</p>'
      : '';
    const rong = trong ? '<p class="vd-canh">Kỳ này chưa có dòng KPI nào. Chưa tới kỳ, hoặc chi nhánh chưa nhập số.</p>' : '';
    return '<p class="viec-live"><span class="pill good">LIVE</span> KPI 3 chi nhánh · ' + label(k.nhan) +
      ' · đọc lúc ' + gio + ' · <strong>' + dong.length + '</strong> dòng nguồn · ' +
      '<button class="button secondary" type="button" data-action="vd-live">Đọc lại</button></p>' + thieuThang + rong;
  }
  /* Tracy chốt 24/11/2026: màn Vinh danh phải có nút chọn chi nhánh và
     hệ thống ngay tại chỗ, dùng lại đúng nút của app nên chọn ở đây thì
     cả app đổi theo, không lệch bàn. */
  function nutChiNhanh() {
    const ngan = ten => String(ten).split(' · ')[0];
    const nut = [['Hệ thống', jointIndex], ...branchNames.map((ten,i) => [ngan(ten), i])]
      .map(([ten,i]) => '<button type="button" class="cn-o' + (state.branch === i ? ' chon' : '') +
        '" aria-pressed="' + (state.branch === i) + '" data-vd-chon ' +
        (i === jointIndex ? 'data-action="open-joint"' : 'data-action="open-branch" data-id="' + i + '"') +
        '>' + label(ten) + '</button>').join('');
    return '<div class="vd-chon"><span>Trao giải cho</span>' +
      '<div class="cn-nut" role="group" aria-label="Chọn chi nhánh trao giải">' + nut + '</div></div>';
  }
  function bangVang() {
    const k = ky();
    const than = thanh(k);
    if (!dong || !chuan) {
      return panel('Bảng vàng · 6 giải từ KPI', 'Mức đạt được theo thang bậc hoa hồng', '', than);
    }
    const sot = [];
    const kd = GIAI.filter(g => g.khoi === 'KINH DOANH').map(g => theGiai(g,k,sot)).join('');
    const kt = GIAI.filter(g => g.khoi === 'KỸ THUẬT VIÊN').map(g => theGiai(g,k,sot)).join('');
    const trong = !kd && !kt
      ? '<p class="vd-canh"><strong>Kỳ này chưa có số nào.</strong> Chưa tới kỳ, hoặc chi nhánh chưa nhập.</p>' : '';
    const chuaCham = sot.length
      ? '<details class="vd-sot"><summary>' + sot.length + ' ô chưa chấm được — xem lý do</summary><ul>' +
        sot.map(x => '<li>' + label(x) + '</li>').join('') + '</ul></details>' : '';
    /* Tracy chốt 24/11/2026: ẨN khối "Luật trao cúp". Luật không đổi —
       mốc lấy từ KPI_BAC_THANG, là mốc THÁNG; bấm tên để chúc mừng 30
       giây — chỉ bỏ khỏi màn cho gọn lúc họp. Bật lại thì sửa một dòng. */
    const luat = '';
    return panel('Bảng vàng · 6 giải từ KPI', 'Theo ' + label(k.nhan) + ' · từng chi nhánh và toàn hệ thống', '',
      '<div class="vd-than">' + than + nutChiNhanh() + luat + trong + kd + kt + chuaCham + '</div>');
  }

  /* ──────────────────────────────────────────────────────────────────
     NÚT NGÔI SAO · QLCN DUYỆT VINH DANH
     Tracy chốt 24/11/2026: ngay cạnh huy hiệu MỨC có nút sao. QLCN bấm
     sao để duyệt, bổ sung thông tin còn thiếu rồi lưu. Ghi về 2 bảng của
     PHI LONG_GROUP: HOP_VINH_DANH (sổ) và THONG_BAO (để hiện trên app,
     màn TOAN_BO_TB). Chỉ THÊM dòng, không sửa không xoá dòng nào.
     ────────────────────────────────────────────────────────────────── */
  const daDuyet = new Set();        /* khoá giải|tên — tránh bấm hai lần một phiên */
  const khoaSao = (g, x) => g.ma + '|' + x.cn + '|' + x.ten;
  function nutSao(g, x, m) {
    const k = khoaSao(g, x);
    if (daDuyet.has(k)) return '<span class="vd-sao vd-sao-xong" title="Đã duyệt vinh danh">★ QLCN ĐÃ DUYỆT</span>';
    return '<button type="button" class="vd-sao" data-action="vd-sao"' +
      ' data-giai="' + g.ma + '" data-ten="' + label(x.ten) + '" data-cn="' + label(x.cn) + '"' +
      ' data-gt="' + x.gt + '" data-muc="' + label(m ? m.ten : '') + '"' +
      ' title="QLCN duyệt vinh danh">★ QLCN DUYỆT</button>';
  }

  let hopSao = null, saoDang = null, dangGhiSao = false, anhDang = '';
  /* Ảnh đã duyệt trong phiên — để hộp chúc mừng hiện đúng mặt người. */
  const anhNguoi = new Map();
  function dungHopSao() {
    if (hopSao) return hopSao;
    hopSao = document.createElement('dialog');
    hopSao.className = 'viec-day-hop vd-hop-sao';
    hopSao.innerHTML =
      '<form method="dialog"><h2>★ QLCN duyệt vinh danh</h2>' +
      '<p class="vd-sao-ten"></p>' +
      '<label>Người duyệt · QLCN<input name="ai" list="ds-nhan-su" required placeholder="Gõ tên để tìm"></label>' +
      '<label>Ghi nhận thành tích · thông tin còn thiếu' +
      '<textarea name="ghi" rows="3" placeholder="Ví dụ: giữ nhịp 3 tuần liền, kèm 2 bạn mới…"></textarea></label>' +
      '<label>Ảnh nhân sự · hiện kèm thông báo trên app' +
      '<input type="file" name="anh" accept="image/jpeg,image/png,image/webp"></label>' +
      '<div class="vd-sao-anh"></div>' +
      '<p class="vd-sao-bao"></p>' +
      '<div class="viec-day-nut"><button type="button" class="button secondary" data-huy>Hủy</button>' +
      '<button type="submit" class="button yellow">Lưu &amp; báo lên app</button></div></form>';
    document.body.appendChild(hopSao);
    hopSao.querySelector('[data-huy]').addEventListener('click', () => hopSao.close());
    hopSao.querySelector('form').addEventListener('submit', guiSao);
    /* Thu nhỏ ảnh ngay trên máy trước khi gửi — dùng lại đúng bộ nén của
       màn Vinh danh sẵn có, ra JPEG nhỏ nên cầu nối không bị quá tải. */
    hopSao.querySelector('[name="anh"]').addEventListener('change', async event => {
      const o = hopSao.querySelector('.vd-sao-anh');
      const f = event.target.files && event.target.files[0];
      anhDang = '';
      if (!f) { o.innerHTML = ''; return; }
      o.textContent = 'Đang thu nhỏ ảnh…';
      try {
        anhDang = await prepareAwardPhoto(f);
        o.innerHTML = '<img alt="Ảnh nhân sự được vinh danh" src="' + anhDang + '">';
      } catch (e) {
        o.textContent = 'Không dùng được ảnh này: ' + (e.message || e);
      }
    });
    return hopSao;
  }
  function moHopSao(b) {
    const g = GIAI.find(x => x.ma === b.dataset.giai);
    if (!g) return;
    const k = ky();
    saoDang = {g: g, ten: b.dataset.ten, cn: b.dataset.cn,
      gt: Number(b.dataset.gt), muc: b.dataset.muc || '', ky: k.nhan};
    const hop = dungHopSao();
    hop.querySelector('.vd-sao-ten').textContent =
      saoDang.ten + ' · ' + saoDang.cn + ' — ' + g.ten + ' · ' + tien(saoDang.gt, g.dv) +
      (saoDang.muc ? ' · ' + saoDang.muc : '') + ' · ' + k.nhan;
    hop.querySelector('.vd-sao-bao').textContent = '';
    const f0 = hop.querySelector('form');
    f0.elements.ghi.value = '';
    f0.elements.anh.value = '';
    anhDang = '';
    hop.querySelector('.vd-sao-anh').innerHTML = '';
    hop.showModal();
  }
  async function guiSao(event) {
    event.preventDefault();
    if (!saoDang || dangGhiSao) return;
    const f = event.target;
    const bao = f.querySelector('.vd-sao-bao');
    const ai = gon(f.elements.ai.value);
    if (!ai) { bao.textContent = 'Chưa chọn người duyệt.'; return; }
    dangGhiSao = true;
    f.querySelector('[type="submit"]').disabled = true;
    bao.textContent = 'Đang ghi về app…';
    try {
      const d = saoDang;
      const body = new URLSearchParams({khoa: KHOA, viec: 'vinh_danh',
        ten: d.ten, cn: d.cn, hang_muc: d.g.ten, ket_qua: tien(d.gt, d.g.dv),
        don_vi: d.g.dv, muc: d.muc, ky: d.ky, ghi_nhan: gon(f.elements.ghi.value), ai: ai,
        anh_b64: anhDang || ''}).toString();
      const r = await fetch(API, {method: 'POST', body: body,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
      const j = await r.json().catch(() => null);
      if (!j || j.ok !== true) throw new Error((j && j.loi) || 'cầu nối không trả lời đúng');
      daDuyet.add(d.g.ma + '|' + d.cn + '|' + d.ten);
      if (anhDang) anhNguoi.set(khoa(d.ten), anhDang);
      dangGhiSao = false;
      hopSao.close();
      render();
      message('Đã vinh danh ' + d.ten + ' · ' + j.id +
        (anhDang ? ' · kèm ảnh' : ' · chưa có ảnh') + ' · đã báo lên màn Thông báo của app');
    } catch (e) {
      dangGhiSao = false;
      f.querySelector('[type="submit"]').disabled = false;
      bao.textContent = 'CHƯA ghi được: ' + (e.message || e);
    }
  }

  /* ---------- chúc mừng 30 giây ---------- */
  let demNguoc = null;
  function chucMung(b) {
    const hop = document.querySelector('#award-celebration');
    if (!hop) return;
    const g = GIAI.find(x => x.ma === b.dataset.giai);
    const gt = Number(b.dataset.gt), bac = b.dataset.bac || '';
    const anh = anhNguoi.get(khoa(b.dataset.ten));
    hop.querySelector('#award-portrait').innerHTML = '<div class="award-portrait">' +
      (anh ? '<img alt="" src="' + anh + '" width="256" height="320">'
           : '<span class="award-icon" aria-hidden="true">🏆</span>') + '</div>';
    hop.querySelector('#award-criterion').textContent = (g ? g.ten : '') + ' · ' + b.dataset.cn;
    hop.querySelector('#award-heading').textContent = 'Chúc mừng ' + b.dataset.ten + '!';
    const o = hop.querySelector('#award-result');
    o.innerHTML = '<span>' + tien(gt, g ? g.dv : '') + (bac ? ' · ' + label(bac) : '') + '</span>' +
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
    const sao = event.target.closest('[data-action="vd-sao"]');
    if (sao) { moHopSao(sao); return; }
    if (event.target.closest('[data-action="vd-live"]')) { loi = ''; lamMoi(); return; }
    /* Nút chọn chi nhánh của app luôn nhảy về Tổng quan. Chọn bàn ngay
       trên màn Vinh danh thì phải ở lại Vinh danh, không bị hất ra. */
    if (event.target.closest('[data-vd-chon]')) {
      window.setTimeout(() => { if (typeof changeView === 'function') changeView('awards'); }, 0);
    }
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
