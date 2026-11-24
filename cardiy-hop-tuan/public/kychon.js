'use strict';
/* ════════════════════════════════════════════════════════════════════
   THANH CHỌN KỲ + BÀN — MỘT CHỖ DUY NHẤT
   Tracy chốt 24/11/2026: thay bộ Tuần · Tháng · Quý · Năm bằng
   Hôm nay · Hôm qua · 7 ngày gần nhất · Tuần này · Tự chọn ·
   Tháng · Quý · Năm, đặt chung một thanh với nút chọn chi nhánh.
   Chọn một lần, mọi khối số trên app theo đúng kỳ đó.

   Kho dữ liệu của app vẫn giữ 4 ngăn cũ (tuần/tháng/quý/năm) cho phần
   người dùng tự nhập — vấn đề, việc, cam kết. Các mốc theo NGÀY đều
   dùng chung ngăn "tuần", nên đổi qua lại không mất nội dung đã gõ.
   ════════════════════════════════════════════════════════════════════ */
{
  const KHOA_KY = 'cardiy_ky_chon';
  /* ngayCong: quy ra ngày công để so với định mức. 26 ngày công/tháng. */
  const KY = [
    {ma:'homnay',  ten:'Hôm nay',          kho:'week',    ngayCong:1},
    {ma:'homqua',  ten:'Hôm qua',          kho:'week',    ngayCong:1},
    {ma:'bay',     ten:'7 ngày gần nhất',  kho:'week',    ngayCong:6},
    {ma:'tuannay', ten:'Tuần này',         kho:'week',    ngayCong:6},
    {ma:'tuchon',  ten:'Tự chọn',          kho:'week',    ngayCong:6},
    {ma:'thang',   ten:'Tháng',            kho:'month',   ngayCong:26},
    {ma:'quy',     ten:'Quý',              kho:'quarter', ngayCong:78},
    {ma:'nam',     ten:'Năm',              kho:'year',    ngayCong:156},
  ];
  const ngan = ten => String(ten).split(' · ')[0];
  const hai = n => String(n).padStart(2,'0');
  const iso = d => d.getUTCFullYear() + '-' + hai(d.getUTCMonth()+1) + '-' + hai(d.getUTCDate());
  const tuIso = s => new Date(Date.UTC(+s.slice(0,4), +s.slice(5,7)-1, +s.slice(8,10)));
  const congNgay = (s, n) => { const d = tuIso(s); d.setUTCDate(d.getUTCDate()+n); return iso(d); };
  const cuoiThang = (nam, thang) => new Date(Date.UTC(nam, thang, 0)).getUTCDate();

  let chon = {ma: 'thang', tu: '', den: ''};
  try {
    const v = JSON.parse(window.localStorage.getItem(KHOA_KY) || 'null');
    if (v && KY.some(k => k.ma === v.ma)) chon = v;
  } catch (e) {}

  function ghi() {
    try { window.localStorage.setItem(KHOA_KY, JSON.stringify(chon)); } catch (e) {}
  }
  /* Khoảng ngày thật của kỳ đang chọn */
  function khoang() {
    const nay = today();
    const nam = +nay.slice(0,4), thang = +nay.slice(5,7);
    const k = KY.find(x => x.ma === chon.ma) || KY[5];
    let tu = nay, den = nay, nhan = k.ten, ngayCong = k.ngayCong;
    if (k.ma === 'homnay') { nhan = 'hôm nay ' + nay.slice(8,10) + '/' + hai(thang); }
    else if (k.ma === 'homqua') { tu = den = congNgay(nay,-1); nhan = 'hôm qua ' + tu.slice(8,10) + '/' + tu.slice(5,7); }
    else if (k.ma === 'bay') { tu = congNgay(nay,-6); nhan = '7 ngày gần nhất'; }
    else if (k.ma === 'tuannay') {
      const d = tuIso(nay); const th = (d.getUTCDay() + 6) % 7;      /* thứ hai = 0 */
      tu = congNgay(nay, -th); den = congNgay(tu, 6);
      nhan = 'tuần này ' + tu.slice(8,10) + '/' + tu.slice(5,7) + ' → ' + den.slice(8,10) + '/' + den.slice(5,7);
    } else if (k.ma === 'tuchon') {
      tu = chon.tu || nay; den = chon.den || nay;
      if (den < tu) { const t = tu; tu = den; den = t; }
      const so = Math.round((tuIso(den) - tuIso(tu)) / 86400000) + 1;
      ngayCong = Math.max(1, Math.round(so * 6 / 7));
      nhan = tu.slice(8,10) + '/' + tu.slice(5,7) + ' → ' + den.slice(8,10) + '/' + den.slice(5,7);
    } else if (k.ma === 'thang') {
      tu = nay.slice(0,8) + '01'; den = nay.slice(0,8) + hai(cuoiThang(nam,thang));
      nhan = 'tháng ' + thang;
    } else if (k.ma === 'quy') {
      const q = Math.floor((thang-1)/3);
      tu = nam + '-' + hai(q*3+1) + '-01';
      den = nam + '-' + hai(q*3+3) + '-' + hai(cuoiThang(nam, q*3+3));
      nhan = 'quý ' + (q+1);
    } else {
      tu = nam + '-07-01'; den = nam + '-12-31'; nhan = '6 tháng cuối năm';
    }
    return {ma: k.ma, tu: tu, den: den, nhan: nhan, kho: k.kho,
      ngayCong: ngayCong, theoNgay: k.ngayCong < 26};
  }

  /* ---------- thanh chọn ---------- */
  const gocPeriodNav = window.periodNav;
  window.periodNav = function() {
    const k = khoang();
    const nutKy = KY.map(x =>
      '<button type="button" class="ky-o' + (x.ma === chon.ma ? ' chon' : '') +
      '" aria-pressed="' + (x.ma === chon.ma) + '" data-action="ky-chon" data-ky="' + x.ma + '">' +
      label(x.ten) + '</button>').join('');
    const nutCN = [['Tất cả', jointIndex], ...branchNames.map((t,i) => [ngan(t), i])]
      .map(([t,i]) => '<button type="button" class="cn-o' + (state.branch === i ? ' chon' : '') +
        '" aria-pressed="' + (state.branch === i) + '" ' +
        (i === jointIndex ? 'data-action="open-joint"' : 'data-action="open-branch" data-id="' + i + '"') +
        '>' + label(t) + '</button>').join('');
    return '<div class="ky-thanh">' +
      '<div class="ky-dong"><span class="ky-nhan">Số liệu</span>' +
      '<div class="ky-nut" role="group" aria-label="Chọn kỳ số liệu">' + nutKy + '</div>' +
      '<span class="ky-hien">· ' + label(k.nhan) + '</span></div>' +
      '<div class="ky-dong"><span class="ky-nhan">Chi nhánh</span>' +
      '<div class="cn-nut" role="group" aria-label="Chọn chi nhánh">' + nutCN + '</div></div></div>';
  };

  /* ---------- hộp Tự chọn ---------- */
  let hopTu = null;
  function moHopTu() {
    if (!hopTu) {
      hopTu = document.createElement('dialog');
      hopTu.className = 'viec-day-hop ky-hop';
      hopTu.innerHTML = '<form method="dialog"><h2>Tự chọn khoảng ngày</h2>' +
        '<label>Từ ngày<input type="date" name="tu" required></label>' +
        '<label>Đến ngày<input type="date" name="den" required></label>' +
        '<div class="viec-day-nut"><button type="button" class="button secondary" data-huy>Hủy</button>' +
        '<button type="submit" class="button yellow">Xem</button></div></form>';
      document.body.appendChild(hopTu);
      hopTu.querySelector('[data-huy]').addEventListener('click', () => hopTu.close());
      hopTu.querySelector('form').addEventListener('submit', event => {
        event.preventDefault();
        const f = event.target;
        chon = {ma: 'tuchon', tu: f.elements.tu.value, den: f.elements.den.value};
        ghi();
        apDung();
        hopTu.close();
      });
    }
    const f = hopTu.querySelector('form');
    const k = khoang();
    f.elements.tu.value = chon.tu || k.tu;
    f.elements.den.value = chon.den || k.den;
    hopTu.showModal();
  }

  function apDung() {
    const k = khoang();
    state.period = k.kho;          /* ngăn dữ liệu của app, không phải kỳ hiển thị */
    previewStep = 'good';
    save();
    render();
  }

  document.addEventListener('click', event => {
    const b = event.target.closest('[data-action="ky-chon"]');
    if (!b) return;
    const ma = b.dataset.ky;
    if (ma === 'tuchon') { moHopTu(); return; }
    chon = {ma: ma, tu: '', den: ''};
    ghi();
    apDung();
  });

  window.CARDIY_KY = {khoang: khoang, ma: () => chon.ma, danhSach: () => KY.slice(),
    goc: gocPeriodNav};
  /* Đồng bộ ngăn dữ liệu ngay khi nạp, để kỳ đang chọn và kho khớp nhau. */
  const k0 = khoang();
  if (state.period !== k0.kho) { state.period = k0.kho; save(); }
}
