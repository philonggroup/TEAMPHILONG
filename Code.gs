/*******************************************************************
 * PHI LONG AUTO — API giao ban tuần (Google Apps Script Web App)
 * Nguồn VÀO : 3 workbook hệ thống chuẩn CN1 / CN2 / CN3
 * Nguồn RA  : file PHI LONG_GROUP (HOP_PHIEN, HOP_CAM_KET, HOP_CHUAN_BI)
 * Dùng cho  : giaoban.html trên philonggroup.github.io/TEAMPHILONG
 *
 * CÀI 1 LẦN:
 *   1. Mở file PHI LONG_GROUP → Tiện ích mở rộng → Apps Script
 *   2. Dán toàn bộ file này vào, Lưu
 *   3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web
 *        Thực thi với tư cách: Tôi
 *        Ai có quyền truy cập: Bất kỳ ai
 *   4. Copy URL .../exec → dán vào CAU_HINH.API trong giaoban.html
 *******************************************************************/

var KHOA = 'PHILONG2026';          // phải khớp CAU_HINH.KHOA trong giaoban.html
var MUI_GIO = 'Asia/Ho_Chi_Minh';

var FILE_RA = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';   // PHI LONG_GROUP

var CHI_NHANH = [
  { ma: 'CN1', file: '1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc' },
  { ma: 'CN2', file: '1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k' },
  { ma: 'CN3', file: '1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc' }
];

/* Tên tab KPI ngày. Mỗi tháng Google Sheet đổi đuôi T11 → T12 …
   Script thử lần lượt các mẫu dưới đây nên KHÔNG phải sửa code khi sang tháng mới. */
var MAU_TEN_TAB = [
  ' BÁO CÁO KPI NGÀY T{T}',
  'BÁO CÁO KPI NGÀY T{T}',
  ' BÁO CÁO  KPI NGÀY T{T}',
  'KPI NGÀY T{T}'
];

/* Các dòng cần lấy trong tab KPI ngày (dòng 1 = tiêu đề file) */
var DONG_CAN = [4, 5, 6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23];

/* Cột: F=6 KPI tuần 1, G=7 thực đạt T1, H=8 %T1 … mỗi tuần 3 cột */
function cotTuan_(n) { return { kpi: 6 + (n - 1) * 3, thuc: 7 + (n - 1) * 3 }; }

/* ------------------------------------------------------------------ */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.khoa !== KHOA) return ra_({ ok: false, loi: 'Sai khoá truy cập' });
    switch (p.viec) {
      case 'toancanh':      return ra_(toanCanh_(p));
      case 'luu_diem':      return ra_(luuDiem_(p));
      case 'luu_thong_diep':return ra_(luuThongDiep_(p));
      case 'them_cam_ket':  return ra_(themCamKet_(p));
      case 'kiem_tra':      return ra_(kiemTra_());
      default:              return ra_({ ok: false, loi: 'Không rõ tham số viec=' + p.viec });
    }
  } catch (err) {
    return ra_({ ok: false, loi: String(err && err.message || err) });
  }
}
function doPost(e) { return doGet(e); }

function ra_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Tuần trong tháng: T1 = 01–07, T2 = 08–14, T3 = 15–21, T4 = 22–28, T5 = 29–hết ---------- */
function soTuan_(d) { return Math.min(5, Math.floor((d.getDate() - 1) / 7) + 1); }
function nhanTuan_(n, thang, nam) {
  var dau = (n - 1) * 7 + 1;
  var cuoi = Math.min(n * 7, new Date(nam, thang, 0).getDate());
  return 'T' + n + ' · ' + hai_(dau) + '–' + hai_(cuoi) + '/' + hai_(thang);
}
function hai_(n) { return (n < 10 ? '0' : '') + n; }

function moTab_(ss, thang) {
  for (var i = 0; i < MAU_TEN_TAB.length; i++) {
    var ten = MAU_TEN_TAB[i].replace('{T}', String(thang));
    var sh = ss.getSheetByName(ten);
    if (sh) return sh;
  }
  // thử dò theo tên gần đúng
  var ds = ss.getSheets();
  for (var j = 0; j < ds.length; j++) {
    var t = ds[j].getName().toUpperCase().replace(/\s+/g, ' ').trim();
    if (t.indexOf('BÁO CÁO KPI NGÀY T' + thang) >= 0) return ds[j];
  }
  return null;
}

/* ---------- Đọc toàn cảnh ---------- */
function toanCanh_(p) {
  var nay = new Date();
  var thang = p.thang ? Number(p.thang) : Number(Utilities.formatDate(nay, MUI_GIO, 'M'));
  var nam = Number(Utilities.formatDate(nay, MUI_GIO, 'yyyy'));
  var tuan = p.tuan ? Number(p.tuan) : soTuan_(new Date(Utilities.formatDate(nay, MUI_GIO, 'yyyy/MM/dd')));

  var dsCN = [], canhBao = [];
  CHI_NHANH.forEach(function (cn) {
    var o = { ma: cn.ma, dong: {} };
    try {
      var ss = SpreadsheetApp.openById(cn.file);
      var sh = moTab_(ss, thang);
      if (!sh) { canhBao.push(cn.ma + ': không tìm thấy tab KPI ngày tháng ' + thang); dsCN.push(o); return; }
      o.tab = sh.getName();
      var vung = sh.getRange(1, 1, Math.min(31, sh.getLastRow()), Math.min(24, sh.getLastColumn())).getValues();
      var c = cotTuan_(tuan);
      DONG_CAN.forEach(function (r) {
        var hang = vung[r - 1];
        if (!hang) return;
        var kpi = so_(hang[c.kpi - 1]);
        var thuc = so_(hang[c.thuc - 1]);
        o.dong[String(r)] = {
          ten: String(hang[1] || '').trim(),
          kpi: kpi, thuc: thuc,
          pct: (kpi ? Math.round(thuc / kpi * 1000) / 10 : null)
        };
      });
      // 4 tuần gần nhất cho biểu đồ (dòng 4 = doanh thu)
      o.tuan = [];
      for (var t = 1; t <= 5; t++) {
        var ct = cotTuan_(t);
        var k = so_(vung[3][ct.kpi - 1]), th = so_(vung[3][ct.thuc - 1]);
        o.tuan.push({ n: t, kpi: k, thuc: th });
      }
    } catch (err) {
      canhBao.push(cn.ma + ': ' + (err.message || err));
    }
    dsCN.push(o);
  });

  // 4 tuần gần nhất, cộng 3 chi nhánh
  var tuan4 = [];
  var batDau = Math.max(1, tuan - 3);
  for (var t = batDau; t <= Math.max(tuan, batDau + 3) && tuan4.length < 4; t++) {
    var k = 0, th = 0;
    dsCN.forEach(function (cn) {
      if (!cn.tuan) return;
      var x = cn.tuan[t - 1];
      if (x) { k += x.kpi || 0; th += x.thuc || 0; }
    });
    tuan4.push({ nhan: 'T' + t, pct: k ? Math.round(th / k * 100) : null });
  }

  return {
    ok: true,
    capnhat: Utilities.formatDate(nay, MUI_GIO, 'HH:mm dd/MM/yyyy'),
    thang: thang, nam: nam,
    tuan: { so: tuan, ma: 'T' + tuan + '/' + thang, nhan: nhanTuan_(tuan, thang, nam) },
    chinhanh: dsCN,
    tuan4: tuan4,
    viec_tuan_truoc: viecTuanTruoc_(),
    cam_ket: camKet_('T' + tuan + '/' + thang),
    chuan_bi: chuanBi_(),
    canh_bao: canhBao
  };
}

function so_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  if (typeof v === 'number') return v;
  var s = String(v).replace(/[^\d,.\-]/g, '').replace(/\./g, '').replace(',', '.');
  var n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

/* ---------- Bước 2 · việc tuần trước, lấy từ bảng CONG_VIEC ---------- */
function viecTuanTruoc_() {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('CONG_VIEC');
  if (!sh) return [];
  var v = sh.getDataRange().getValues();
  var h = v[0].map(function (x) { return String(x).trim(); });
  var iHan = h.indexOf('deadline'), iTen = h.indexOf('ten_cong_viec'),
      iNguoi = h.indexOf('ho_va_ten'), iTT = h.indexOf('trang_thai'),
      iCS = h.indexOf('ten_khach_hang'), iPB = h.indexOf('phong_ban');
  var nay = new Date();
  var tu = new Date(nay.getTime() - 14 * 864e5), den = new Date(nay.getTime() + 1 * 864e5);
  var ra = [];
  for (var i = 1; i < v.length && ra.length < 12; i++) {
    var d = ngay_(v[i][iHan]);
    if (!d || d < tu || d > den) continue;
    if (!String(v[i][iTen] || '').trim()) continue;
    ra.push({
      ai: String(v[i][iNguoi] || v[i][iPB] || '').trim(),
      viec: String(v[i][iTen] || '').trim(),
      chi_so: String(v[i][iCS] || '').trim(),
      han: Utilities.formatDate(d, MUI_GIO, 'dd/MM'),
      trang_thai: String(v[i][iTT] || '').replace(/^\d+\./, '').trim()
    });
  }
  return ra;
}

function ngay_(v) {
  if (v instanceof Date) return v;
  var s = String(v || '').trim();
  var m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return null;
}

/* ---------- Bước 6 · cam kết tuần ---------- */
function camKet_(maTuan) {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('HOP_CAM_KET');
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v[0];
  var c = {}; h.forEach(function (x, i) { c[String(x).trim()] = i; });
  var ra = [];
  for (var i = 1; i < v.length; i++) {
    if (!String(v[i][c['noi_dung_cam_ket']] || '').trim()) continue;
    ra.push({
      chi_nhanh: v[i][c['chi_nhanh']],
      ho_va_ten: v[i][c['ho_va_ten']],
      ma_nv: v[i][c['ma_nv']],
      noi_dung: v[i][c['noi_dung_cam_ket']],
      chi_so: v[i][c['chi_so_dan_dat']],
      han: dinhDangNgay_(v[i][c['han_hoan_thanh']]),
      trang_thai: v[i][c['trang_thai']] || 'Cam kết'
    });
  }
  return ra.slice(-12);
}
function dinhDangNgay_(v) {
  var d = ngay_(v);
  return d ? Utilities.formatDate(d, MUI_GIO, 'dd/MM') : String(v || '');
}

/* ---------- Việc chuẩn bị / xử lý sau họp ---------- */
function chuanBi_() {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('HOP_CHUAN_BI');
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v[0];
  var c = {}; h.forEach(function (x, i) { c[String(x).trim()] = i; });
  var ra = [];
  for (var i = 1; i < v.length; i++) {
    var tt = String(v[i][c['trang_thai']] || '');
    if (/xong|hoàn thành/i.test(tt)) continue;
    if (String(v[i][c['hien_thi']]).toUpperCase() === 'FALSE') continue;
    if (!String(v[i][c['noi_dung']] || '').trim()) continue;
    ra.push({
      noi_dung: v[i][c['noi_dung']],
      nguoi: v[i][c['nguoi_phu_trach']],
      han: dinhDangNgay_(v[i][c['han']]),
      chi_nhanh: v[i][c['chi_nhanh']]
    });
  }
  return ra;
}

/* ---------- Ghi về PHI LONG_GROUP ---------- */
function timPhien_(sh, tuan, chiNhanh) {
  var v = sh.getDataRange().getValues(), h = v[0];
  var c = {}; h.forEach(function (x, i) { c[String(x).trim()] = i; });
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][c['tuan_quy']]).trim() === String(tuan).trim() &&
        String(v[i][c['chi_nhanh']]).trim() === String(chiNhanh).trim()) {
      return { dong: i + 1, cot: c };
    }
  }
  return { dong: 0, cot: c };
}

function luuDiem_(p) {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('HOP_PHIEN');
  var t = timPhien_(sh, p.tuan, p.chi_nhanh);
  var nay = Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM/yyyy');
  if (!t.dong) {
    sh.appendRow(['HP-' + p.tuan + '-' + p.chi_nhanh, p.tuan, p.chi_nhanh, nay, '', 'Đã họp',
                  p.diem, '', '', '', 'Ghi từ trang giao ban · ' + (p.so_phieu || '') + ' phiếu', nay, 'giaoban.html', '']);
    return { ok: true, da: 'them', diem: p.diem };
  }
  sh.getRange(t.dong, t.cot['diem_hop'] + 1).setValue(p.diem);
  sh.getRange(t.dong, t.cot['trang_thai'] + 1).setValue('Đã họp');
  if (t.cot['ghi_chu'] !== undefined) {
    sh.getRange(t.dong, t.cot['ghi_chu'] + 1)
      .setValue('Chấm ' + (p.so_phieu || '') + ' phiếu · ghi lúc ' +
                Utilities.formatDate(new Date(), MUI_GIO, 'HH:mm dd/MM'));
  }
  return { ok: true, da: 'cap_nhat', dong: t.dong, diem: p.diem };
}

function luuThongDiep_(p) {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('HOP_PHIEN');
  var t = timPhien_(sh, p.tuan, p.chi_nhanh);
  if (!t.dong) return { ok: false, loi: 'Chưa có phiên họp ' + p.tuan + ' / ' + p.chi_nhanh };
  sh.getRange(t.dong, t.cot['thong_diep_tuan'] + 1).setValue(p.noi_dung || '');
  return { ok: true, dong: t.dong };
}

function themCamKet_(p) {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('HOP_CAM_KET');
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var c = {}; h.forEach(function (x, i) { c[String(x).trim()] = i; });
  var hang = new Array(h.length).fill('');
  var nay = Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM/yyyy');
  function dat(ten, gt) { if (c[ten] !== undefined) hang[c[ten]] = gt; }
  dat('id', 'CK-' + p.tuan + '-' + p.chi_nhanh + '-' + (sh.getLastRow()));
  dat('phien_id', 'HP-' + p.tuan + '-' + p.chi_nhanh);
  dat('tuan_quy', p.tuan); dat('chi_nhanh', p.chi_nhanh);
  dat('ma_nv', p.ma_nv || ''); dat('ho_va_ten', p.ho_va_ten || '');
  dat('noi_dung_cam_ket', p.noi_dung || ''); dat('chi_so_dan_dat', p.chi_so || '');
  dat('muc_tieu_so', p.muc_tieu || ''); dat('han_hoan_thanh', p.han || '');
  dat('trang_thai', 'Cam kết'); dat('ngay_tao', nay); dat('nguoi_tao', 'giaoban.html');
  sh.appendRow(hang);
  return { ok: true, dong: sh.getLastRow() };
}

/* ---------- Tự kiểm tra: chạy trong Apps Script Editor để soi nguồn ---------- */
function kiemTra_() {
  var thang = Number(Utilities.formatDate(new Date(), MUI_GIO, 'M'));
  var ra = { ok: true, thang: thang, chi_nhanh: [] };
  CHI_NHANH.forEach(function (cn) {
    var o = { ma: cn.ma };
    try {
      var sh = moTab_(SpreadsheetApp.openById(cn.file), thang);
      o.tab = sh ? sh.getName() : null;
      o.doc_duoc = !!sh;
      if (sh) o.doanh_thu_dong4 = sh.getRange(4, 2).getValue();
    } catch (e) { o.loi = String(e.message || e); }
    ra.chi_nhanh.push(o);
  });
  ['HOP_PHIEN', 'HOP_CAM_KET', 'HOP_CHUAN_BI', 'CONG_VIEC'].forEach(function (t) {
    var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName(t);
    ra[t] = sh ? ('OK · ' + sh.getLastRow() + ' dòng') : 'KHÔNG THẤY TAB';
  });
  return ra;
}
function chayKiemTra() { Logger.log(JSON.stringify(kiemTra_(), null, 2)); }
