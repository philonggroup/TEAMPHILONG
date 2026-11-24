'use strict';
/* ════════════════════════════════════════════════════════════════════
   CHỈ SỐ DẪN DẮT — ĐỌC LIVE CHO "SO SÁNH KPI 3 CHI NHÁNH"
   Tracy chốt 24/11/2026: bảng so sánh KPI 3 chi nhánh phải là bộ 8 chỉ
   số dẫn dắt chuẩn, thực tế / chỉ tiêu theo từng chi nhánh — không
   dùng số mẫu nữa.

   Nguồn : 3 tab "CHỈ SỐ DẪN DẮT CN1 / CN2 / CN3 -THÁNG {tháng}" trong
           Sheet "CARDIY Họp nhanh — Nguồn dữ liệu chuẩn".
           Đọc thẳng CSV nên không phụ thuộc Apps Script.
   Kỳ áp : chỉ kỳ TUẦN. Tuần trong tháng: T1 01–07 · T2 08–14 ·
           T3 15–21 · T4 22–28 · T5 29–hết, đúng quy ước của cầu nối.
   Cột   : KPI tuần n = cột 6+(n-1)*3, thực đạt = cột 7+(n-1)*3.
   ════════════════════════════════════════════════════════════════════ */
{
  const FILE = '1Y5G05cBs7kWehsLzqJf5xttSv3hw3kICDoaLc4kFxcU';
  const TAB = [
    {ma:'CN1', gid:'1942300199'},
    {ma:'CN2', gid:'975882268'},
    {ma:'CN3', gid:'1114642134'},
  ];
  /* Bộ 8 chỉ số dẫn dắt Tracy chốt, kèm đơn vị hiển thị.
     Tên phải khớp cột CHỈ SỐ trong tab (so sánh sau khi gọn khoảng trắng). */
  const CHI_SO = [
    {ten:'DT trung bình / lượt hoàn tất', dv:'đ'},
    {ten:'Khách được kiểm tra ATX', dv:'khách'},
    {ten:'Báo Giá Lên Trong ngày', dv:'báo giá'},
    {ten:'Cuộc gọi chăm sóc khách / Cuộc gọi nhận', dv:'cuộc'},
    {ten:'Lượt xe đặt lịch', dv:'lượt'},
    {ten:'Cân chỉnh thước lái', dv:'lượt'},
    {ten:'Google Maps /Zalo OA: ảnh thật, xin đánh giá sau mỗi lượt', dv:'lượt'},
    {ten:'Video ngắn kiểm tra lốp, gầm xe thật đăng TikTok, Facebook mỗi ngày', dv:'video'},
  ];
  /* Nhóm I · DOANH THU — chỉ số KẾT QUẢ. Dò theo đầu tên vì tỷ trọng %
     mỗi chi nhánh một khác (CN1 62/8/30, CN2 72/10/18). */
  const KET_QUA = [
    {dau:'DOANH THU MỤC TIÊU', ten:'Doanh thu mục tiêu', dv:'đ'},
    {dau:'— DT lốp',           ten:'— DT lốp',            dv:'đ'},
    {dau:'— DT dịch vụ',       ten:'— DT dịch vụ DVL+DVNL+LĐ', dv:'đ'},
    {dau:'· DV lốp',           ten:'· DV lốp',            dv:'đ'},
    {dau:'· DV sửa chữa',      ten:'· DV sửa chữa',       dv:'đ'},
    {dau:'— DT BD-SC-PK',      ten:'— DT BD-SC-PK / NTP', dv:'đ'},
  ];
  /* Kỳ QUÝ và 6 THÁNG: file CARDIY không có số thực đạt của quý (chỉ có
     tab tháng 11), nên lấy từ cặp tab sẵn có trong 3 workbook chi nhánh:
     TỔNG HỢP 6T (thực đạt) + CHỈ TIÊU 6T (chỉ tiêu). Không tab nào phải
     nhập tay, không cộng tay — chỉ đọc đúng cột QUÝ 4 / 6 THÁNG.
     Chỉ lấy những dòng CÓ ĐỦ CẶP chỉ tiêu ↔ thực đạt, không tự suy. */
  const FILE_CN = [
    {ma:'CN1', id:'1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc'},
    {ma:'CN2', id:'1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k'},
    {ma:'CN3', id:'1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc'},
  ];
  const COT_QUY = {th: {quarter: 9, year: 10}, ct: {quarter: 10, year: 11}};
  /* th = dòng trong TỔNG HỢP 6T · ct = dòng trong CHỈ TIÊU 6T */
  const CAP_QUY = [
    {ten:'Doanh thu',              dv:'đ', thuc:'DOANH THU CHUẨN',        chiTieuTh:'KPI doanh thu'},
    {ten:'DT trung bình / lượt',   dv:'đ', thuc:'DT trung bình / lượt',   chiTieuTh:'DT trung bình / lượt CẦN'},
    {ten:'Lượt xe hoàn tất',       dv:'lượt', thuc:'Lượt xe hoàn tất',    chiTieuCt:'Lượt xe hoàn tất / tháng'},
    {ten:'Lốp thật bán ra',        dv:'lốp', thuc:'Lốp thật bán ra',      chiTieuCt:'Lốp thật / tháng'},
    {ten:'Tỷ trọng DT lốp',        dv:'%', thuc:'Tỷ trọng DT lốp',        chiTieuCt:'Tỷ trọng DT lốp'},
    {ten:'Tỷ trọng DT dịch vụ',    dv:'%', thuc:'Tỷ trọng DT dịch vụ',    chiTieuCt:'Tỷ trọng DT dịch vụ'},
  ];
  const LAM_MOI = 300000;        /* chỉ số đổi chậm hơn việc — 5 phút một lần */

  let bang = null;               /* kỳ TUẦN  — {CN1:[…]} */
  let bangThang = null;          /* kỳ THÁNG — {CN1:[…]} */
  let ketQua = null;             /* kỳ TUẦN  — nhóm doanh thu */
  let ketQuaThang = null;        /* kỳ THÁNG — nhóm doanh thu */
  let bangQuy = null;            /* {quarter:{CN1:[…]}, year:{CN1:[…]}} */
  let loi = '';
  let docLuc = null;
  let canhBao = [];
  let dangDoc = false;

  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const khoa = v => gon(v).toUpperCase().replace(/\s+/g,'');

  /* "2.870.000" → 2870000 · "114,3%" → 114.3 · "" → null */
  function so(v) {
    const t = gon(v).replace(/%/g,'');
    if (!t) return null;
    const n = Number(t.replace(/\./g,'').replace(',','.'));
    return Number.isFinite(n) ? n : null;
  }
  /* T1 01–07 · T2 08–14 · T3 15–21 · T4 22–28 · T5 29–hết */
  function soTuan() {
    const ngay = Number(today().slice(8,10));
    return Math.min(5, Math.floor((ngay - 1) / 7) + 1);
  }
  const cotTuan = n => ({kpi: 5 + (n-1)*3, thuc: 6 + (n-1)*3});   /* 0-based */
  /* Cột tháng: sau 5 tuần × 3 cột là KPI THÁNG (20) · % ĐẠT THÁNG (21) ·
     THỰC ĐẠT THÁNG (22). Phải đếm theo vị trí vì gviz KHÔNG trả nhãn tiêu
     đề của 3 tab này (dòng 3 về rỗng), chỉ trả số.
     Kiểm chứng trước khi dùng: cột 21 phải là ô phần trăm. */
  const COT_THANG = {kpi: 20, thuc: 22, ty: 21};
  function cotThang(v) {
    const co = v.some(h => h.length > COT_THANG.thuc && /%/.test(String(h[COT_THANG.ty] || '')));
    return co ? {kpi: COT_THANG.kpi, thuc: COT_THANG.thuc} : null;
  }

  function tachCsv(text) {
    const ra = [];
    let dong = [], o = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i+1] === '"') { o += '"'; i++; } else q = false; } else o += c; }
      else if (c === '"') q = true;
      else if (c === ',') { dong.push(o); o = ''; }
      else if (c === '\n') { dong.push(o); ra.push(dong); dong = []; o = ''; }
      else if (c !== '\r') o += c;
    }
    if (o.length || dong.length) { dong.push(o); ra.push(dong); }
    return ra;
  }

  async function docTen(fileId, ten) {
    const t = Date.now();
    const url = 'https://docs.google.com/spreadsheets/d/' + fileId +
      '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(ten) + '&_=' + t;
    const r = await fetch(url,{cache:'no-store'});
    if (!r.ok) throw new Error('HTTP ' + r.status + ' khi đọc tab ' + ten);
    const text = await r.text();
    if (/^\s*(<html|<!DOCTYPE)/i.test(text)) throw new Error('chưa mở quyền xem file chi nhánh');
    return tachCsv(text);
  }
  /* Dò dòng theo đầu tên trong cột B */
  const timDong = (v, dau) => v.find(h => khoa(h[1]).indexOf(khoa(dau)) === 0);

  async function docQuy(ky) {
    const ra = {};
    for (const f of FILE_CN) {
      const th = await docTen(f.id, 'TỔNG HỢP 6T');
      const ct = await docTen(f.id, 'CHỈ TIÊU 6T');
      const cTh = COT_QUY.th[ky], cCt = COT_QUY.ct[ky];
      ra[f.ma] = CAP_QUY.map(k => {
        const dThuc = timDong(th, k.thuc);
        const dCt = k.chiTieuTh ? timDong(th, k.chiTieuTh) : timDong(ct, k.chiTieuCt);
        if (!dThuc || !dCt) { canhBao.push(f.ma + ' · quý: thiếu dòng "' + k.ten + '"'); return null; }
        const target = so(dCt[k.chiTieuTh ? cTh : cCt]);
        const actual = so(dThuc[cTh]);
        if (target === null && actual === null) return null;
        return {title: k.ten, unit: k.dv, owner: '', target: target ?? 0, actual: actual ?? 0};
      }).filter(Boolean);
    }
    return ra;
  }

  async function docTab(gid) {
    const t = Date.now();
    const goc = 'https://docs.google.com/spreadsheets/d/' + FILE + '/';
    const duong = [
      goc + 'gviz/tq?tqx=out:csv&gid=' + gid + '&_=' + t,
      goc + 'export?format=csv&gid=' + gid + '&_=' + (t+1),
    ];
    let cuoi = '';
    for (const url of duong) {
      try {
        const r = await fetch(url,{cache:'no-store'});
        if (!r.ok) { cuoi = 'HTTP ' + r.status; continue; }
        const text = await r.text();
        if (/^\s*(<html|<!DOCTYPE)/i.test(text)) { cuoi = 'file chưa mở quyền xem bằng link'; continue; }
        return tachCsv(text);
      } catch (e) { cuoi = String(e.message || e); }
    }
    throw new Error(cuoi || 'không gọi được Google Sheets');
  }

  function rutChiSo(v, ma, cot) {
    /* Dòng 1 ghi "… THÁNG 11/2026 …" — lệch tháng là số đã cũ, phải báo. */
    const tieuDe = gon((v[0] || []).join(' '));
    const thang = Number(today().slice(5,7));
    if (tieuDe && !new RegExp('THÁNG\\s*0?' + thang + '\\b','i').test(tieuDe)) {
      canhBao.push(ma + ': tab đang là "' + (tieuDe.match(/THÁNG[^·]*/i) || [''])[0].trim() +
        '" trong khi nay là tháng ' + thang);
    }
    const {kpi, thuc} = cot;
    const quanLy = gon((tieuDe.split('—')[0] || '').replace(/QLCH|QLCN/i,''));
    const ds = [];
    for (const cs of CHI_SO) {
      const dong = v.find(h => khoa(h[1]) === khoa(cs.ten));
      if (!dong) { canhBao.push(ma + ': không thấy chỉ số "' + cs.ten + '"'); continue; }
      ds.push({
        title: cs.ten,
        unit: cs.dv,
        owner: quanLy,
        target: so(dong[kpi]) ?? 0,
        actual: so(dong[thuc]) ?? 0,
      });
    }
    return ds;
  }

  /* Nhóm I · DOANH THU của một chi nhánh */
  function rutKetQua(v, cot) {
    const {kpi, thuc} = cot;
    return KET_QUA.map(k => {
      const dong = v.find(h => khoa(h[1]).indexOf(khoa(k.dau)) === 0);
      if (!dong) return null;
      const nhan = gon(dong[1]);
      const ty = (nhan.match(/\(([^)]*%)\)/) || ['',''])[1];
      return {title: k.ten, unit: k.dv, ty: ty,
        target: so(dong[kpi]) ?? 0, actual: so(dong[thuc]) ?? 0};
    }).filter(Boolean);
  }

  async function doc() {
    if (dangDoc) return;
    dangDoc = true;
    canhBao = [];
    try {
      const ra = {}, rb = {}, rc = {}, rd = {};
      const cTuan = cotTuan(soTuan());
      for (const t of TAB) {
        const v = await docTab(t.gid);
        ra[t.ma] = rutChiSo(v, t.ma, cTuan);
        rb[t.ma] = rutKetQua(v, cTuan);
        const cThang = cotThang(v);
        if (cThang) {
          rc[t.ma] = rutChiSo(v, t.ma, cThang);
          rd[t.ma] = rutKetQua(v, cThang);
        } else canhBao.push(t.ma + ': không thấy cột KPI THÁNG / THỰC ĐẠT THÁNG');
      }
      bang = ra;
      ketQua = rb;
      try {
        bangQuy = {quarter: await docQuy('quarter'), year: await docQuy('year')};
      } catch (e) {
        bangQuy = null;
        canhBao.push('Quý / 6 tháng: ' + (e.message || e));
      }
      bangThang = Object.keys(rc).length === TAB.length ? rc : null;
      ketQuaThang = Object.keys(rd).length === TAB.length ? rd : null;
      loi = '';
      docLuc = new Date();
    } catch (e) {
      bang = null; ketQua = null; bangThang = null; ketQuaThang = null; bangQuy = null;
      loi = String(e.message || e);
    } finally {
      dangDoc = false;
    }
  }

  /* ---------- nối vào state: chỉ kỳ tuần ---------- */
  const nguonKy = () => state.period === 'month' ? bangThang
    : state.period === 'week' ? bang
    : (bangQuy ? bangQuy[state.period] : null);
  const ketQuaKy = () => state.period === 'month' ? ketQuaThang
    : state.period === 'week' ? ketQua : null;
  const coLive = () => !!nguonKy();
  function nhapVaoApp() {
    const nguon = nguonKy();
    if (!nguon) return;
    const kho = state.period === 'week' ? state.branches : state.periods[state.period].branches;
    for (let i = 0; i < TAB.length; i++) {
      const khung = kho[i];
      const ds = nguon[TAB[i].ma];
      if (!khung || !ds || !ds.length) continue;
      /* Giữ id cũ theo tên chỉ số để nút "Tạo vấn đề" và bản ghi không đứt. */
      const cu = new Map((khung.kpis || []).map(k => [k.title, k.id]));
      khung.kpis = ds.map(k => ({id: cu.get(k.title) || uid(), nguon:'chiso', ...k}));
    }
  }

  /* ---------- thanh trạng thái trên bảng so sánh ---------- */
  const gocComparison = window.comparisonPanel;
  const gocKpiPanel = window.kpiPanel;
  function nhanKy() {
    if (state.period === 'month') return 'tháng ' + Number(today().slice(5,7));
    if (state.period === 'quarter') return 'quý 4 · từ TỔNG HỢP 6T của 3 chi nhánh';
    if (state.period === 'year') return '6 tháng cuối năm · từ TỔNG HỢP 6T của 3 chi nhánh';
    return 'tuần ' + soTuan() + ' tháng ' + Number(today().slice(5,7));
  }
  function thanhChiSo() {
    if (loi) return '<p class="sheet-error"><strong>CHƯA ĐỌC ĐƯỢC CHỈ SỐ LIVE</strong> · ' + label(loi) +
      ' · đang hiện bản đã soạn. <button class="button secondary" type="button" data-action="chiso-live">Đọc lại</button></p>';
    if (!bang) return '<p class="empty">Đang đọc live 3 tab chỉ số dẫn dắt…</p>';
    if (!coLive()) return '<p class="sheet-error"><strong>KỲ NÀY CHƯA NỐI NGUỒN</strong> · ' +
      'số đang hiện là bản soạn trên máy, KHÔNG dùng để chốt. Nguồn chuẩn hiện chỉ có kỳ tuần và kỳ tháng.</p>';
    const gio = new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(docLuc);
    const canh = canhBao.length
      ? '<span class="pill miss">⚠ ' + canhBao.length + ' cảnh báo nguồn</span> <small>' + label(canhBao.join(' · ')) + '</small>'
      : '';
    return '<p class="viec-live"><span class="pill good">LIVE</span> Chỉ số dẫn dắt · ' + nhanKy() +
      ' · đọc lúc ' + gio + ' · <strong>' + CHI_SO.length +
      '</strong> chỉ số × 3 chi nhánh · <button class="button secondary" type="button" data-action="chiso-live">Đọc lại</button> ' + canh + '</p>';
  }
  /* Bảng CHỈ SỐ KẾT QUẢ — nhóm doanh thu, tách riêng khỏi chỉ số dẫn dắt. */
  function bangKetQua() {
    const kq = ketQuaKy();
    if (!kq) return '';
    const cot = isJoint() ? [0,1,2] : [state.branch];
    if (!cot.length || cot.some(i => !kq[TAB[i].ma])) return '';
    const dau = cot.map(i => '<th scope="col">' + label(branchNames[i]) + '</th>').join('');
    const dong = KET_QUA.map((k,j) => {
      const o = cot.map(i => {
        const x = (kq[TAB[i].ma] || [])[j];
        if (!x) return '<td><span class="missing">Chưa có</span></td>';
        const dat = x.actual >= x.target && x.target > 0;
        return '<td class="num"><strong>' + showNumber(x.actual,x.unit) + '</strong> / ' +
          showNumber(x.target,x.unit) + '<br>' + (x.target > 0 ? pill(dat?'Đạt':'Chưa đạt',dat?'good':'miss') : '') +
          (x.ty ? '<small class="kq-ty">' + label(x.ty) + '</small>' : '') + '</td>';
      }).join('');
      const x0 = (kq[TAB[cot[0]].ma] || [])[j];
      return '<tr><th scope="row">' + label(x0 ? x0.title : KET_QUA[j].ten) + '</th>' + o + '</tr>';
    }).join('');
    return panel('Chỉ số kết quả','Doanh thu ' + nhanKy() + ' · thực tế / chỉ tiêu theo từng chi nhánh','',
      thanhChiSo() + '<div class="table-wrap comparison" tabindex="0" aria-label="Chỉ số kết quả">' +
      '<table><thead><tr><th scope="col">Chỉ số</th>' + dau + '</tr></thead><tbody>' + dong + '</tbody></table></div>');
  }

  function chen(html) {
    return html.replace('<div class="table-wrap', thanhChiSo() + '<div class="table-wrap')
               .replace('<div class="list"><p class="empty">', thanhChiSo() + '<div class="list"><p class="empty">');
  }
  window.comparisonPanel = function() {
    const html = gocComparison();
    return (bang || loi) ? bangKetQua() + chen(html) : html;
  };
  window.kpiPanel = function(compact) {
    const html = gocKpiPanel(compact);
    return (!compact && !isJoint() && (bang || loi)) ? bangKetQua() + chen(html) : html;
  };

  async function lamMoi(hienThi) {
    await doc();
    nhapVaoApp();
    save();
    if (hienThi !== false) render();
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-action="chiso-live"]')) return;
    loi = '';
    lamMoi();
  });
  /* Đổi kỳ thì nạp lại số của đúng kỳ đó, không để kỳ này mượn số kỳ kia. */
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-action="period"]')) return;
    window.setTimeout(() => { nhapVaoApp(); save(); render(); }, 0);
  });
  window.setInterval(() => {
    if (document.hidden) return;
    if (!['kpis','overview','meeting'].includes(view)) return;
    lamMoi();
  }, LAM_MOI);

  window.CARDIY_CHI_SO = {doc: () => lamMoi(), bang: () => bang, bangThang: () => bangThang,
    loi: () => loi, canhBao: () => canhBao, tuan: soTuan, coLive: coLive};
  lamMoi();
}
