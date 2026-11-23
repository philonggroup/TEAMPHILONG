/* ===================================================================
   PHI LONG AUTO — Trang giao ban tuần (9 bước / 60 phút)
   Chuẩn 100% theo canvas demo "Phi Long – Dashboard giao ban (demo)".
   Nguồn VÀO  : 3 workbook hệ thống chuẩn CN1/CN2/CN3 (tab " BÁO CÁO KPI NGÀY T<thang>")
   Nguồn RA   : file PHI LONG_GROUP (tab HOP_PHIEN / HANH_DONG / HOP_CHUAN_BI / HOP_CO_HOI)
   Cầu nối    : 1 Apps Script Web App (Code.gs đi kèm) — dán URL vào CAU_HINH.API bên dưới.
   =================================================================== */
'use strict';

/* ---------- 1. CẤU HÌNH — CHỈ SỬA Ở ĐÂY ---------- */
var CAU_HINH = {
  // Dán URL Web App của Apps Script sau khi Deploy (…/exec). Để trống = chạy số minh hoạ.
  API: '',
  // Khoá đơn giản, phải khớp biến KHOA trong Code.gs
  KHOA: 'PHILONG2026',
  // Tên hiển thị của 3 chi nhánh trên màn Toàn cảnh (thứ tự = CN1, CN2, CN3)
  TEN_CN: { CN1: 'CN1 Phi Long', CN2: 'CN2 Phi Long', CN3: 'CN3 Phi Long' },
  // Màn chi tiết nào ứng với chi nhánh nào
  MAN_CHI_TIET: { GB3BinhDuong: 'CN1', GB3BinhPhuoc: 'CN2', GB3ChiNhanh3: 'CN3' },
  // Thang màu Tracy đã chốt: ĐỈNH >107% · ĐẠT 100–107% · ĐƯỢC >90–100% · ĐUỐI ≤90%
  THANG: [
    { tu: 107.0001, nhan: 'ĐỈNH', bg: '#4B2E83', fg: '#FFFFFF', bar: '#4B2E83' },
    { tu: 100,      nhan: 'ĐẠT',  bg: '#DCEAF7', fg: '#1F5F99', bar: '#2F75B5' },
    { tu: 90.0001,  nhan: 'ĐƯỢC', bg: '#FFE08A', fg: '#6B4500', bar: '#FFE08A' },
    { tu: -1e9,     nhan: 'ĐUỐI', bg: '#B42318', fg: '#FFFFFF', bar: '#B42318' }
  ],
  // Làm mới dữ liệu live mỗi N giây (0 = không tự làm mới)
  TU_LAM_MOI: 180
};

/* ---------- 2. 13 dòng chỉ số của màn chi tiết, map sang dòng tab KPI ngày ----------
   dong = số dòng trong tab " BÁO CÁO KPI NGÀY T<thang>" (dòng 1 là tiêu đề).
   null = chỉ số chưa có nguồn trong tab đó -> hiện "chưa nối nguồn", KHÔNG lấy số demo. */
var MAP_CHI_TIET = [
  { ten: 'Doanh thu (tr)',            dong: 4,    dvi: 'tr' },
  { ten: 'Lãi gộp (tr)',              dong: null, dvi: 'tr' },
  { ten: 'Lượt xe hoàn tất',          dong: 13,   dvi: '' },
  { ten: 'DT TB / lượt hoàn tất (tr)',dong: 11,   dvi: 'tr' },
  { ten: 'DT lốp (tr)',               dong: 5,    dvi: 'tr' },
  { ten: 'DT BD-SC-PK / NTP (tr)',    dong: 9,    dvi: 'tr' },
  { ten: 'DT dịch vụ (tr)',           dong: 6,    dvi: 'tr' },
  { ten: 'Tổng số lốp bán ra',        dong: 23,   dvi: '' },
  { ten: 'Khách được kiểm tra ATX',   dong: 15,   dvi: '' },
  { ten: 'Báo giá lên trong ngày',    dong: 16,   dvi: '' },
  { ten: 'Cuộc gọi chăm sóc / nhận',  dong: 17,   dvi: '' },
  { ten: 'Lượt xe đặt lịch',          dong: 18,   dvi: '' },
  { ten: 'Cân chỉnh thước lái',       dong: 19,   dvi: '' }
];

/* 5 dòng trụ cột trên thẻ chi nhánh ở màn Toàn cảnh */
var MAP_TRU_COT = [
  { nhom: 'Kết quả',    ten: 'Doanh thu',              dong: 4 },
  { nhom: 'Dịch vụ',    ten: 'DT dịch vụ',             dong: 6 },
  { nhom: 'Kiểm tra',   ten: 'Khách kiểm tra ATX',     dong: 15 },
  { nhom: 'Báo giá',    ten: 'Báo giá lên trong ngày', dong: 16 },
  { nhom: 'Khách hàng', ten: 'Lượt xe đặt lịch',       dong: 18 }
];

/* ---------- 3. Tiện ích ---------- */
function $(sel, root) { return (root || document).querySelector(sel); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function mucTheoPct(p) {
  if (p === null || p === undefined || isNaN(p)) return { nhan: '—', bg: '#EEF2F6', fg: '#5F6B7A', bar: '#D9E2EC' };
  for (var i = 0; i < CAU_HINH.THANG.length; i++) if (p >= CAU_HINH.THANG[i].tu) return CAU_HINH.THANG[i];
  return CAU_HINH.THANG[CAU_HINH.THANG.length - 1];
}
function soVN(n, le) {
  if (n === null || n === undefined || n === '' || isNaN(n)) return '—';
  var s = Number(n).toLocaleString('vi-VN', { minimumFractionDigits: le || 0, maximumFractionDigits: le || 0 });
  return s;
}
function pctVN(p) { return (p === null || p === undefined || isNaN(p)) ? '—' : Math.round(p) + '%'; }
function trieu(n) { return (n === null || n === undefined || isNaN(n)) ? null : n / 1e6; }

/* Ghi giá trị vào node mang data-k; dat('cn.0.r1.pct', '88%') */
function dat(k, giaTri, kieu) {
  var els = $$('[data-k="' + k + '"]');
  els.forEach(function (el) {
    if (kieu === 'badge') {
      el.textContent = giaTri.nhan;
      el.style.background = giaTri.bg;
      el.style.color = giaTri.fg;
    } else if (kieu === 'html') {
      el.innerHTML = giaTri;
    } else {
      el.textContent = giaTri;
    }
  });
  return els.length;
}

/* ---------- 4. Router + tỉ lệ hiển thị ---------- */
var MAN_DAU = 'GB1CheckIn';
function moMan(id) {
  var sec = document.getElementById('sc-' + id);
  if (!sec) { id = MAN_DAU; sec = document.getElementById('sc-' + id); }
  $$('.pl-screen').forEach(function (s) { s.classList.remove('pl-on'); });
  sec.classList.add('pl-on');
  document.title = (sec.getAttribute('data-title') || 'Giao ban tuần') + ' · Phi Long Auto';
  canChinhTiLe();
  khoiDongDongHo(sec);
  window.scrollTo(0, 0);
}
function canChinhTiLe() {
  var sec = $('.pl-screen.pl-on');
  if (!sec) return;
  var w = +sec.getAttribute('data-w'), h = +sec.getAttribute('data-h');
  var frame = $('.pl-frame', sec);
  var rong = Math.max(320, window.innerWidth - 16);
  var ti = Math.min(1, rong / w);
  frame.style.transform = 'scale(' + ti + ')';
  sec.style.height = Math.ceil(h * ti) + 'px';
  sec.style.width = Math.ceil(w * ti) + 'px';
}
window.addEventListener('resize', canChinhTiLe);
window.addEventListener('hashchange', function () { moMan((location.hash || '').replace('#', '') || MAN_DAU); });

/* ---------- 5. Đồng hồ đếm ngược từng bước ---------- */
var dongHo = { tick: null, con: 0, chay: true, sec: null };
function khoiDongDongHo(sec) {
  if (dongHo.tick) { clearInterval(dongHo.tick); dongHo.tick = null; }
  var tong = +(sec.getAttribute('data-total') || 0);
  if (!tong || !$('.pl-ttext', sec)) return;
  dongHo.sec = sec; dongHo.con = tong; dongHo.chay = true;
  veDongHo();
  dongHo.tick = setInterval(function () { if (dongHo.chay) { dongHo.con--; veDongHo(); } }, 1000);
  var bt = $('.pl-ttoggle', sec), br = $('.pl-treset', sec);
  if (bt && !bt.dataset.gan) {
    bt.dataset.gan = '1';
    bt.addEventListener('click', function () { dongHo.chay = !dongHo.chay; veDongHo(); });
  }
  if (br && !br.dataset.gan) {
    br.dataset.gan = '1';
    br.addEventListener('click', function () { dongHo.con = tong; dongHo.chay = true; veDongHo(); });
  }
}
function veDongHo() {
  var sec = dongHo.sec; if (!sec) return;
  var con = dongHo.con, qua = con < 0, a = Math.abs(con);
  var mm = String(Math.floor(a / 60)).padStart(2, '0'), ss = String(a % 60).padStart(2, '0');
  var canh = !qua && con <= 60;
  var box = $('.pl-timer', sec), cap = $('.pl-tcap', sec), txt = $('.pl-ttext', sec), bt = $('.pl-ttoggle', sec);
  if (txt) txt.textContent = (qua ? '+' : '') + mm + ':' + ss;
  if (cap) cap.textContent = qua ? 'QUÁ GIỜ' : 'CÒN LẠI';
  if (box) {
    box.style.background = qua ? '#B42318' : (canh ? '#FFE08A' : '#E7F5EC');
    box.style.color = qua ? '#FFFFFF' : (canh ? '#6B4500' : '#1E6B3A');
  }
  if (bt) bt.textContent = dongHo.chay ? 'Tạm dừng' : 'Chạy tiếp';
}

/* ---------- 6. Lớp dữ liệu live ---------- */
var DU_LIEU = null;

function goiAPI(thamSo) {
  if (!CAU_HINH.API) return Promise.reject(new Error('chua-cau-hinh-api'));
  var q = Object.keys(thamSo).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(thamSo[k]);
  }).join('&');
  return fetch(CAU_HINH.API + '?khoa=' + encodeURIComponent(CAU_HINH.KHOA) + '&' + q, { method: 'GET' })
    .then(function (r) { return r.json(); })
    .then(function (j) { if (!j || j.ok !== true) throw new Error((j && j.loi) || 'api-loi'); return j; });
}

function napLive() {
  if (!CAU_HINH.API) { datBadge('demo'); return; }
  datBadge('dang-tai');
  goiAPI({ viec: 'toancanh' }).then(function (j) {
    DU_LIEU = j;
    apToanCanh(j);
    apChiTiet(j);
    apViecTuanTruoc(j);
    apChotViec(j);
    apSidebar(j);
    datBadge('live', j.capnhat);
  }).catch(function (e) {
    datBadge('loi', String(e.message || e));
  });
}

/* Những màn đã nối số live. Màn ngoài danh sách luôn giữ nhãn SỐ MINH HOẠ
   để không ai nhầm số mẫu là số thật. */
var MAN_LIVE = ['Main', 'GB2ViecCu', 'GB3BinhDuong', 'GB3BinhPhuoc', 'GB3ChiNhanh3', 'GB6ChotViec'];

function datBadge(trangThai, phu) {
  $$('.pl-badge-nguon').forEach(function (el) {
    var sec = el.closest('.pl-screen');
    var manId = sec ? sec.id.replace('sc-', '') : '';
    if (trangThai === 'live' && MAN_LIVE.indexOf(manId) < 0) {
      el.textContent = 'SỐ MINH HỌA · màn này chưa nối live';
      el.style.background = '#FFF2CC'; el.style.color = '#6B4500';
      return;
    }
    if (trangThai === 'live') {
      el.textContent = 'SỐ LIỆU LIVE' + (phu ? ' · ' + phu : '');
      el.style.background = '#E7F5EC'; el.style.color = '#1E6B3A';
    } else if (trangThai === 'dang-tai') {
      el.textContent = 'ĐANG TẢI SỐ…';
      el.style.background = '#EAF2F8'; el.style.color = '#17365D';
    } else if (trangThai === 'loi') {
      el.textContent = 'SỐ MINH HỌA · CHƯA ĐỌC ĐƯỢC LIVE';
      el.style.background = '#FDE2E2'; el.style.color = '#9B1C1C';
      el.title = phu || '';
    } else {
      el.textContent = 'SỐ MINH HỌA';
      el.style.background = '#FFF2CC'; el.style.color = '#6B4500';
    }
  });
}

/* --- 6a. Màn Toàn cảnh --- */
function apToanCanh(j) {
  var dsCN = j.chinhanh || [];
  // 4 thẻ đầu
  var tongDT = { thuc: 0, kpi: 0 }, tongATX = { thuc: 0, kpi: 0 }, tongDL = { thuc: 0, kpi: 0 };
  dsCN.forEach(function (cn) {
    var d = layDong(cn, 4), a = layDong(cn, 15), l = layDong(cn, 18);
    if (d) { tongDT.thuc += d.thuc || 0; tongDT.kpi += d.kpi || 0; }
    if (a) { tongATX.thuc += a.thuc || 0; tongATX.kpi += a.kpi || 0; }
    if (l) { tongDL.thuc += l.thuc || 0; tongDL.kpi += l.kpi || 0; }
  });
  theTong('dt', 'Doanh thu toàn công ty', trieu(tongDT.thuc), trieu(tongDT.kpi), 'tr', 0);
  theTong('atx', 'Khách kiểm tra ATX · dẫn dắt', tongATX.thuc, tongATX.kpi, 'khách', 0);
  theTong('datlich', 'Lượt xe đặt lịch · dẫn dắt', tongDL.thuc, tongDL.kpi, 'lượt', 0);
  // Lãi gộp: tab KPI ngày không có chỉ số này -> nói thẳng là chưa nối nguồn
  dat('tong.laigop.label', 'Lãi gộp · chưa nối nguồn');
  dat('tong.laigop.val', '—'); dat('tong.laigop.unit', '');
  dat('tong.laigop.pct', '—'); dat('tong.laigop.badge', mucTheoPct(null), 'badge');

  // Biểu đồ 4 tuần gần nhất (doanh thu toàn hệ thống)
  var tuan = j.tuan4 || [];
  for (var i = 0; i < 4; i++) {
    var t = tuan[i];
    if (!t) {
      dat('chart.' + i + '.pct', '—'); dat('chart.' + i + '.nhan', '—');
      $$('[data-k="chart.' + i + '.bar"]').forEach(function (b) { b.style.background = '#EEF2F6'; b.style.height = '3px'; });
      continue;
    }
    var m = mucTheoPct(t.pct);
    dat('chart.' + i + '.pct', pctVN(t.pct));
    dat('chart.' + i + '.nhan', t.nhan);
    $$('[data-k="chart.' + i + '.bar"]').forEach(function (b) {
      b.style.background = m.bar;
      b.style.height = Math.max(3, Math.min(42, Math.round((t.pct || 0) * 0.32))) + 'px';
    });
  }

  // 3 thẻ chi nhánh
  dsCN.forEach(function (cn, i) {
    var yeu = [];
    dat('cn.' + i + '.ten', CAU_HINH.TEN_CN[cn.ma] || cn.ma);
    MAP_TRU_COT.forEach(function (tc, j2) {
      var d = layDong(cn, tc.dong);
      var p = d ? d.pct : null;
      var m = mucTheoPct(p);
      dat('cn.' + i + '.r' + j2 + '.nhom', tc.nhom);
      dat('cn.' + i + '.r' + j2 + '.ten', tc.ten);
      dat('cn.' + i + '.r' + j2 + '.pct', pctVN(p));
      dat('cn.' + i + '.r' + j2 + '.badge', m, 'badge');
      if (p !== null && p < 100) yeu.push({ ten: tc.ten, pct: p });
    });
    var pctDT = (layDong(cn, 4) || {}).pct;
    dat('cn.' + i + '.muc', mucTheoPct(pctDT), 'badge');
    yeu.sort(function (a, b) { return a.pct - b.pct; });
    dat('cn.' + i + '.docnhanh', yeu.length
      ? 'Đọc nhanh: yếu nhất ' + yeu[0].ten + ' ' + pctVN(yeu[0].pct)
      : 'Đọc nhanh: cả 5 trụ cột từ Đạt trở lên');
    dat('cn.' + i + '.google', 'Google · chưa nối nguồn', 'html');
    dat('cn.' + i + '.canhbao', yeu.length ? yeu.length + ' chỉ số dưới 100%' : 'Xanh im lặng');
    $$('[data-k="cn.' + i + '.canhbao"]').forEach(function (el) {
      el.style.color = yeu.length ? '#9B1C1C' : '#1E6B3A';
    });
  });

  // Nhãn tuần thật thay cho "tuần 47" của bản demo
  if (j.tuan) {
    dat('nhan.tieude', 'Toàn cảnh ' + (j.tuan.nhan || ('tuần ' + j.tuan.so)));
    dat('nhan.khoangngay', 'Tháng ' + j.thang + '/' + j.nam + ' · ' + (j.tuan.nhan || ''));
    dat('nhan.sidebar', 'Giao ban ' + (j.tuan.nhan || '') + ' · 60 phút', 'html');
    dat('nhan.ngayhop', j.capnhat ? ('Số cập nhật ' + j.capnhat) : '');
  }

  // Dòng CSKH: dùng chỉ số thật "Cuộc gọi chăm sóc khách / cuộc gọi nhận" (dòng 17)
  var goiThuc = 0, goiKpi = 0;
  dsCN.forEach(function (cn) { var g = layDong(cn, 17); if (g) { goiThuc += g.thuc || 0; goiKpi += g.kpi || 0; } });
  dat('cskh.dong', '<b style="color: #17365D">CSKH toàn hệ thống:</b> ' + soVN(goiThuc) + '/' + soVN(goiKpi) +
      ' cuộc gọi chăm sóc khách trong tuần · lời khen và khiếu nại Google chưa nối nguồn', 'html');

  // Nhận xét điều phối: sinh từ số thật
  var nx = sinhNhanXet(dsCN, tongDT);
  for (var k = 0; k < 3; k++) dat('nhanxet.' + k, nx[k] || '', 'html');
}

function theTong(ma, nhan, thuc, kpi, dvi, le) {
  var p = (kpi && thuc !== null) ? (thuc / kpi * 100) : null;
  dat('tong.' + ma + '.label', nhan);
  dat('tong.' + ma + '.val', soVN(thuc, le));
  dat('tong.' + ma + '.unit', '/ ' + soVN(kpi, le) + ' ' + dvi);
  dat('tong.' + ma + '.pct', pctVN(p));
  dat('tong.' + ma + '.badge', mucTheoPct(p), 'badge');
}

function layDong(cn, soDong) {
  if (!cn || !cn.dong) return null;
  return cn.dong[String(soDong)] || null;
}

function sinhNhanXet(dsCN, tongDT) {
  var p = tongDT.kpi ? tongDT.thuc / tongDT.kpi * 100 : null;
  var sx = dsCN.map(function (cn) {
    return { ten: CAU_HINH.TEN_CN[cn.ma] || cn.ma, pct: (layDong(cn, 4) || {}).pct };
  }).filter(function (x) { return x.pct !== null && x.pct !== undefined; })
    .sort(function (a, b) { return b.pct - a.pct; });
  var out = [];
  out.push('<b>' + pctVN(p) + ' doanh thu tuần</b> trên toàn hệ thống, theo số live từ 3 workbook chi nhánh.');
  if (sx.length) out.push('<b>' + thoat_(sx[0].ten) + ' dẫn đầu</b>: doanh thu ' + pctVN(sx[0].pct) + '.');
  if (sx.length > 1) out.push('<b>Cần kéo lên: ' + thoat_(sx[sx.length - 1].ten) + ' ' + pctVN(sx[sx.length - 1].pct) + '</b> — vào màn chi tiết để nghe giải trình.');
  return out;
}

/* --- 6b. 3 màn chi tiết chi nhánh --- */
function apChiTiet(j) {
  Object.keys(CAU_HINH.MAN_CHI_TIET).forEach(function (manId) {
    var ma = CAU_HINH.MAN_CHI_TIET[manId];
    var cn = (j.chinhanh || []).filter(function (c) { return c.ma === ma; })[0];
    var sec = document.getElementById('sc-' + manId);
    if (!sec || !cn) return;
    MAP_CHI_TIET.forEach(function (ct, i) {
      var tenEl = $('[data-k="ct.r' + i + '.ten"]', sec);
      if (!tenEl) return;
      var soEl = $('[data-k="ct.r' + i + '.so"]', sec);
      var pctEl = $('[data-k="ct.r' + i + '.pct"]', sec);
      var bdEl = $('[data-k="ct.r' + i + '.badge"]', sec);
      tenEl.textContent = ct.ten;
      if (ct.dong === null) {
        if (soEl) soEl.textContent = '—';
        if (pctEl) pctEl.textContent = '—';
        if (bdEl) { var m0 = mucTheoPct(null); bdEl.textContent = 'CHƯA NỐI'; bdEl.style.background = m0.bg; bdEl.style.color = m0.fg; }
        return;
      }
      var d = layDong(cn, ct.dong) || {};
      var thuc = d.thuc, kpi = d.kpi, p = d.pct;
      if (ct.dvi === 'tr') { thuc = trieu(thuc); kpi = trieu(kpi); }
      if (soEl) soEl.textContent = soVN(thuc, ct.dvi === 'tr' ? 0 : 0) + '/' + soVN(kpi, ct.dvi === 'tr' ? 0 : 0);
      if (pctEl) pctEl.textContent = pctVN(p);
      if (bdEl) { var m = mucTheoPct(p); bdEl.textContent = m.nhan; bdEl.style.background = m.bg; bdEl.style.color = m.fg; }
    });
    // các dòng chỉ số demo còn lại (nếu markup nhiều hơn map) -> đánh dấu rõ
    for (var i = MAP_CHI_TIET.length; i < 20; i++) {
      var el = $('[data-k="ct.r' + i + '.pct"]', sec);
      if (!el) break;
      el.textContent = '—';
      var b = $('[data-k="ct.r' + i + '.badge"]', sec);
      if (b) { b.textContent = 'CHƯA NỐI'; b.style.background = '#EEF2F6'; b.style.color = '#5F6B7A'; }
    }
  });
}

/* --- 6c. Bước 2 · việc tuần trước (bảng CONG_VIEC) --- */
function apViecTuanTruoc(j) {
  var sec = document.getElementById('sc-GB2ViecCu');
  if (!sec) return;
  var ds = j.viec_tuan_truoc || [];
  var hang = $$('[data-k^="vtt.r"]', sec);
  if (hang.length < 2) return;
  var mau = hang[1];
  var cha = mau.parentNode;
  hang.slice(1).forEach(function (h) { h.parentNode.removeChild(h); });
  if (!ds.length) {
    var tr = mau.cloneNode(true);
    var sp0 = tr.querySelectorAll('span');
    if (sp0.length >= 4) {
      sp0[0].textContent = '—';
      sp0[1].textContent = 'Chưa có việc nào trong bảng CONG_VIEC cho tuần trước';
      sp0[2].textContent = '';
      sp0[3].textContent = '—'; sp0[3].style.background = '#EEF2F6'; sp0[3].style.color = '#5F6B7A';
    }
    cha.appendChild(tr);
    return;
  }
  ds.forEach(function (v) {
    var tr = mau.cloneNode(true);
    tr.removeAttribute('data-k');
    var sp = tr.querySelectorAll(':scope > span');
    if (sp.length >= 4) {
      sp[0].textContent = v.ai || '—';
      sp[1].textContent = v.viec || '—';
      sp[2].textContent = v.han || '';
      var xong = /xong|hoàn thành|3\./i.test(v.trang_thai || '') && !/chưa/i.test(v.trang_thai || '');
      sp[3].textContent = v.trang_thai || (xong ? 'Xong' : 'Chưa xong');
      sp[3].style.background = xong ? '#E7F5EC' : '#FDE2E2';
      sp[3].style.color = xong ? '#1E6B3A' : '#9B1C1C';
    }
    cha.appendChild(tr);
  });
  // 3 thẻ số đầu màn
  var xongN = ds.filter(function (v) { return /xong|hoàn thành|3\./i.test(v.trang_thai || '') && !/chưa/i.test(v.trang_thai || ''); }).length;
  var the = $$('div[style*="font-size: 30px"]', sec);
  if (the[0]) the[0].innerHTML = xongN + '/' + ds.length + ' <span style="font-size: 16px">· ' + (ds.length ? Math.round(xongN / ds.length * 100) : 0) + '%</span>';
  if (the[1]) the[1].textContent = xongN + '/' + ds.length;
  if (the[2]) the[2].textContent = 'theo CONG_VIEC';
}

/* --- 6d. Bước 6 · chốt việc tuần (HANH_DONG) --- */
function apChotViec(j) {
  var sec = document.getElementById('sc-GB6ChotViec');
  if (!sec) return;
  var ds = j.cam_ket || [];
  if (!ds.length) return;
  var hang = $$('[data-k^="ck.r"]', sec).filter(function (h) {
    return h.querySelectorAll(':scope > span').length >= 4;
  });
  if (hang.length < 2) return;
  var mau = hang[1], cha = mau.parentNode;
  hang.slice(1).forEach(function (h) { h.parentNode.removeChild(h); });
  ds.forEach(function (v) {
    var tr = mau.cloneNode(true);
    tr.removeAttribute('data-k');
    var sp = tr.querySelectorAll(':scope > span');
    if (sp.length >= 5) {
      sp[0].textContent = v.noi_dung || '';
      sp[1].textContent = v.ho_va_ten || v.ma_nv || '';
      sp[2].textContent = v.han || '';
      sp[3].textContent = v.chi_so || '';
      sp[4].textContent = v.trang_thai || 'Cam kết';
    }
    cha.appendChild(tr);
  });
}

/* --- 6e. Khối "việc xử lý sau họp" trên sidebar (HOP_CHUAN_BI) --- */
function apSidebar(j) {
  var ds = j.chuan_bi || [];
  $$('.pl-screen').forEach(function (sec) {
    // chỉ nhận đúng ô nhãn: không có phần tử con và text bắt đầu bằng nhãn đó
    var box = $$('div', sec).filter(function (d) {
      return d.children.length === 0 && /^VIỆC XỬ LÝ SAU HỌP/.test((d.textContent || '').trim());
    })[0];
    if (!box) return;
    box.textContent = 'VIỆC XỬ LÝ SAU HỌP (' + ds.length + ')';
    var cha = box.parentNode;
    // chỉ bỏ các dòng nằm NGAY SAU ô nhãn, trong cùng một khối
    while (box.nextElementSibling) cha.removeChild(box.nextElementSibling);
    ds.slice(0, 6).forEach(function (v) {
      var d = document.createElement('div');
      d.setAttribute('style', 'font-size: 12px; line-height: 1.4; padding: 5px 0; border-top: 1px solid rgba(255,255,255,0.14)');
      d.innerHTML = thoat_(v.noi_dung) + '<br><span style="color: #B9CCE3">' +
                    thoat_(v.nguoi) + ' · ' + thoat_(v.han) + '</span>';
      cha.appendChild(d);
    });
    if (!ds.length) {
      var d0 = document.createElement('div');
      d0.setAttribute('style', 'font-size: 12px; line-height: 1.4; padding: 5px 0; color: #B9CCE3; border-top: 1px solid rgba(255,255,255,0.14)');
      d0.textContent = 'Không còn việc tồn — theo tab HOP_CHUAN_BI';
      cha.appendChild(d0);
    }
  });
}

/* Chống chèn mã khi đổ dữ liệu từ Sheet vào HTML */
function thoat_(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ---------- 7. Ghi kết quả họp về file PHI LONG_GROUP ---------- */
var PL = {
  /* Lưu điểm chấm buổi họp (bước 8). diemChuoi: "8 9 7 10 8 9 8" */
  luuDiemHop: function (chiNhanh, tuan, diemChuoi) {
    var ds = String(diemChuoi).split(/[^0-9,.]+/).filter(Boolean).map(Number).filter(function (x) { return x >= 0 && x <= 10; });
    if (!ds.length) return Promise.reject(new Error('Chưa có điểm nào'));
    var tb = Math.round(ds.reduce(function (a, b) { return a + b; }, 0) / ds.length * 10) / 10;
    return goiAPI({ viec: 'luu_diem', chi_nhanh: chiNhanh, tuan: tuan, diem: tb, so_phieu: ds.length })
      .then(function (r) { return { tb: tb, so: ds.length, r: r }; });
  },
  /* Lưu thông điệp tuần (bước 7) */
  luuThongDiep: function (chiNhanh, tuan, noiDung) {
    return goiAPI({ viec: 'luu_thong_diep', chi_nhanh: chiNhanh, tuan: tuan, noi_dung: noiDung });
  },
  /* Thêm 1 cam kết tuần (bước 6) */
  themCamKet: function (o) {
    return goiAPI({
      viec: 'them_cam_ket', chi_nhanh: o.chi_nhanh, tuan: o.tuan, ma_nv: o.ma_nv || '',
      ho_va_ten: o.ho_va_ten || '', noi_dung: o.noi_dung || '', chi_so: o.chi_so || '',
      muc_tieu: o.muc_tieu || '', han: o.han || ''
    });
  },
  napLai: napLive,
  duLieu: function () { return DU_LIEU; },
  cauHinh: CAU_HINH
};
window.PL = PL;

/* Gắn nút "Lưu điểm" sẵn có ở bước 8 vào hàm luuDiemHop */
function ganNutLuuDiem() {
  var sec = document.getElementById('sc-GB8ChamDiem');
  if (!sec) return;
  var nut = $$('button, span, div', sec).filter(function (e) {
    return /^\s*Lưu điểm\s*$/.test(e.textContent) && e.children.length === 0;
  })[0];
  var o = $$('input, textarea', sec)[0];
  if (!nut) return;
  nut.style.cursor = 'pointer';
  nut.addEventListener('click', function () {
    var chuoi = o ? o.value : window.prompt('Dán dãy điểm trong chat (vd: 8 9 7 10 8):', '');
    if (!chuoi) return;
    var tuan = (DU_LIEU && DU_LIEU.tuan && DU_LIEU.tuan.ma) || '';
    PL.luuDiemHop('TOAN_HE_THONG', tuan, chuoi).then(function (k) {
      alert('Đã lưu điểm họp: TB ' + k.tb + ' từ ' + k.so + ' phiếu, vào tab HOP_PHIEN của PHI LONG_GROUP.');
    }).catch(function (e) {
      alert('Chưa lưu được: ' + (e.message || e) + '\nKiểm tra CAU_HINH.API trong giaoban.html.');
    });
  });
}

/* ---------- 8. Khởi động ---------- */
document.addEventListener('DOMContentLoaded', function () {
  moMan((location.hash || '').replace('#', '') || MAN_DAU);
  ganNutLuuDiem();
  napLive();
  if (CAU_HINH.TU_LAM_MOI > 0 && CAU_HINH.API) {
    setInterval(napLive, CAU_HINH.TU_LAM_MOI * 1000);
  }
});
