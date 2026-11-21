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
var DONG_CAN = [4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
/* dòng 14 = Tỷ lệ chuyển đổi (hoàn tất ÷ vào xưởng) — nhóm II · DẪN DẮT */

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
      case 'luu_bien_ban':  return ra_(luuBienBan_(p));
      case 'kh90':          return ra_(kh90_());
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
    kh90: kh90An_(),
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


/* =====================================================================
   BƯỚC 5 · CẦN HỖ TRỢ — đọc KẾT QUẢ KẾ HOẠCH 90 NGÀY QUÝ 4 của 3 chi nhánh
   Nguồn: tab "Kế hoạch 90 ngày quý 4 " trong chính workbook hệ thống chuẩn
   của từng chi nhánh. Đọc nguyên văn, KHÔNG tự tính thay sheet, KHÔNG gõ số.
   Cột: B nhóm · C tên nhóm · D mô tả · E mục tiêu Q4 · H P-I-C
        I..U = W1..W13 · V chỉ số dẫn dắt · W KẾT QUẢ Q4 · X tự đánh giá
   Dòng mục tiêu: 5,6,7 (TIỀN) · 8,9 (HỆ THỐNG) · 10,11 (ĐỘI NGŨ) · 12,13 (CÁ NHÂN)
   ===================================================================== */
var MAU_TEN_TAB_KH90 = [
  'Kế hoạch 90 ngày quý 4 ',
  'Kế hoạch 90 ngày quý 4',
  'Kế hoạch 90 ngày Quý 4',
  'KẾ HOẠCH 90 DAY -  Quý 4'
];
var KH90_DONG = [5, 6, 7, 8, 9, 10, 11, 12, 13];
var KH90_NHAN_TUAN = ['1/10–4/10', '5/10–11/10', '12/10–18/10', '19/10–25/10', '26/10–1/11',
                      '2/11–8/11', '9/11–15/11', '16/11–22/11', '23/11–29/11', '30/11–6/12',
                      '7/12–13/12', '14/12–20/12', '21/12–31/12'];
/* Dòng nào cầm cờ cho từng nhóm trên dải 4 nhóm của Bước 5.
   muc_0 = true nghĩa là chỉ số này càng về 0 càng tốt (dòng cảnh báo số liệu). */
var KH90_CO_NHOM = [
  { nhom: 'I',   dong: 6,  kieu: 'pct' },
  { nhom: 'II',  dong: 8,  kieu: 'so', muc_0: true },
  { nhom: 'III', dong: 10, kieu: 'so' },
  { nhom: 'IV',  dong: 12, kieu: 'so' }
];

function moTabKH90_(ss) {
  for (var i = 0; i < MAU_TEN_TAB_KH90.length; i++) {
    var sh = ss.getSheetByName(MAU_TEN_TAB_KH90[i]);
    if (sh) return sh;
  }
  var ds = ss.getSheets();
  for (var j = 0; j < ds.length; j++) {
    var t = ds[j].getName().toUpperCase().replace(/\s+/g, ' ').trim();
    if (t.indexOf('90 NG') >= 0 && (t.indexOf('QUÝ 4') >= 0 || t.indexOf('Q4') >= 0 || t.indexOf('DAY') >= 0)) return ds[j];
  }
  return null;
}

/* Tuần của quý 4: W1 = 1–4/10, từ W2 mỗi tuần 7 ngày tính từ 5/10 (đúng tiêu đề tab) */
function tuanQuy4_(d) {
  var moc = new Date(2026, 9, 5);
  var ngay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (ngay.getTime() < moc.getTime()) return 1;
  var n = 2 + Math.floor((ngay.getTime() - moc.getTime()) / 86400000 / 7);
  return Math.max(1, Math.min(13, n));
}

/* Tách các cặp "nhãn: số" trong ô KẾT QUẢ Q4 để trang vẽ được, vẫn giữ nguyên văn */
function capSoKH90_(s) {
  var ra = [];
  String(s || '').split('·').forEach(function (m) {
    var i = m.indexOf(':');
    if (i < 0) return;
    var nhan = m.slice(0, i).replace(/\s+/g, ' ').trim();
    var chu = m.slice(i + 1).replace(/\s+/g, ' ').trim();
    if (!nhan || !chu) return;
    var sach = chu.replace(/\s/g, '');
    var so = null, dvi = '';
    if (/^[\d.,]+$/.test(sach)) {
      so = so_(sach);
    } else if (!/[%=]/.test(chu)) {
      var m2 = chu.match(/^([\d.,]+)\s*(.*)$/);
      if (m2) { so = so_(m2[1]); dvi = String(m2[2] || '').trim(); }
    }
    ra.push({ nhan: nhan, chu: chu, so: so, dvi: dvi });
  });
  return ra;
}

function dongDauTien_(s) { return String(s || '').split('\n')[0].replace(/\s+/g, ' ').trim(); }
function gopDong_(s) { return String(s || '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim(); }

function kh90_() {
  var nay = new Date(Utilities.formatDate(new Date(), MUI_GIO, 'yyyy/MM/dd'));
  var tuan = tuanQuy4_(nay);
  var dauQuy = new Date(2026, 9, 1), cuoiQuy = new Date(2026, 11, 31);
  var tongNgay = Math.round((cuoiQuy.getTime() - dauQuy.getTime()) / 86400000) + 1;   // 92
  var daQua = Math.round((nay.getTime() - dauQuy.getTime()) / 86400000) + 1;
  daQua = Math.max(1, Math.min(tongNgay, daQua));

  var ra = {
    ok: true,
    tuan: tuan,
    nhan_tuan: 'W' + tuan + ' · ' + KH90_NHAN_TUAN[tuan - 1],
    nhan_tuan_toi: tuan < 13 ? ('W' + (tuan + 1) + ' · ' + KH90_NHAN_TUAN[tuan]) : '',
    ngay_da_qua: daQua,
    tong_ngay: tongNgay,
    tien_do_quy: Math.round(daQua / tongNgay * 1000) / 10,
    co_nhom: KH90_CO_NHOM,
    chinhanh: [],
    canh_bao: []
  };

  CHI_NHANH.forEach(function (cn) {
    var o = { ma: cn.ma, tab: '', dong: [] };
    try {
      var ss = SpreadsheetApp.openById(cn.file);
      var sh = moTabKH90_(ss);
      if (!sh) {
        ra.canh_bao.push(cn.ma + ': không tìm thấy tab Kế hoạch 90 ngày quý 4');
        ra.chinhanh.push(o); return;
      }
      o.tab = sh.getName();
      var soDong = Math.max(13, Math.min(14, sh.getLastRow()));
      var v = sh.getRange(1, 1, soDong, 24).getDisplayValues();
      var nhomMa = '', nhomTen = '';
      KH90_DONG.forEach(function (r) {
        var h = v[r - 1];
        if (!h) return;
        if (String(h[1] || '').trim()) { nhomMa = String(h[1]).trim(); nhomTen = dongDauTien_(h[2]); }
        var ketQua = gopDong_(h[22]);
        var loi = /^#/.test(ketQua);
        var chuaDo = !ketQua || loi || /^nhập tay/i.test(ketQua);
        var cap = loi ? [] : capSoKH90_(ketQua);
        var mPct = ketQua.match(/(\d+(?:[.,]\d+)?)\s*%\s*KPI/i);
        var soKhong = 0;
        cap.forEach(function (c) { if (c.so === 0) soKhong++; });
        o.dong.push({
          dong: r,
          nhom: nhomMa,
          nhom_ten: nhomTen,
          ten: gopDong_(h[3]),
          muc_tieu: gopDong_(h[4]),
          pic: gopDong_(h[7]),
          viec_tuan_nay: gopDong_(h[7 + tuan]),
          viec_tuan_toi: tuan < 13 ? gopDong_(h[8 + tuan]) : '',
          chi_so: gopDong_(h[21]),
          ket_qua: ketQua,
          tu_danh_gia: gopDong_(h[23]),
          cap: cap,
          pct_kpi: mPct ? Number(String(mPct[1]).replace(',', '.')) : null,
          chua_do: chuaDo,
          loi_o: loi,
          so_khong: soKhong
        });
      });
    } catch (err) {
      ra.canh_bao.push(cn.ma + ' (KH 90 ngày): ' + (err.message || err));
    }
    ra.chinhanh.push(o);
  });
  return ra;
}

/* Bọc kh90_() để lỗi đọc kế hoạch 90 ngày không làm sập cả gói toàn cảnh */
function kh90An_() {
  try { return kh90_(); }
  catch (err) { return { ok: false, loi: String(err && err.message || err), chinhanh: [], canh_bao: [] }; }
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
  /* Khoảng cũ [nay-14, nay+1] loại mất việc của chính tuần này:
     bảng CONG_VIEC đặt hạn cuối tuần nên hạn luôn nằm sau nay+1.
     Nay lấy rộng [nay-30, nay+21] và giữ cả việc chưa có hạn,
     đúng tinh thần view _CV_CHUA_LAM của app. */
  var tu = new Date(nay.getTime() - 30 * 864e5), den = new Date(nay.getTime() + 21 * 864e5);
  var ra = [];
  for (var i = 1; i < v.length && ra.length < 30; i++) {
    var d = ngay_(v[i][iHan]);
    if (d && (d < tu || d > den)) continue;
    if (!String(v[i][iTen] || '').trim()) continue;
    ra.push({
      ai: String(v[i][iNguoi] || v[i][iPB] || '').trim(),
      viec: String(v[i][iTen] || '').trim(),
      chi_so: String(v[i][iCS] || '').trim(),
      han: d ? Utilities.formatDate(d, MUI_GIO, 'dd/MM') : '',
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

/* ════════════════════════════════════════════════════════════════════
   LƯU BIÊN BẢN BƯỚC 6 — một lần bấm ghi cả ba nơi
   Tracy chốt 21/11/2026: việc chốt ở bước 6 thay thế danh sách công
   việc trên app cho tuần mới; sau một tuần kết quả trả về mục
   "Việc tuần trước".

     1. HOP_CAM_KET — biên bản cam kết của phiên họp
     2. CONG_VIEC   — danh sách việc tuần mới cho app PHI LONG GROUP
     3. HOP_PHIEN   — đóng phiên: trạng thái, số cam kết, điểm họp

   Nhận tham số POST: tuan, chi_nhanh, diem_hop, thong_diep, viec
   trong đó viec là chuỗi JSON [{lam, ai, han, do, cam_ket, chi_nhanh}]
   Ghi một lần cho mỗi việc, có cờ chống ghi trùng theo phiên.
   ════════════════════════════════════════════════════════════════════ */
function luuBienBan_(p) {
  var ds;
  try { ds = JSON.parse(p.viec || '[]'); } catch (e) { return { ok: false, loi: 'viec không phải JSON' }; }
  if (!ds.length) return { ok: false, loi: 'Không có việc nào để lưu' };

  var ss = SpreadsheetApp.openById(FILE_RA);
  var nay = Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM/yyyy');
  var tuan = p.tuan || '';
  var dem = { cam_ket: 0, cong_viec: 0, bo_qua: 0 };

  /* ---- 1. HOP_CAM_KET ---- */
  var shCK = ss.getSheetByName('HOP_CAM_KET');
  var hCK = shCK.getRange(1, 1, 1, shCK.getLastColumn()).getValues()[0];
  var cCK = {}; hCK.forEach(function (x, i) { cCK[String(x).trim()] = i; });
  /* đọc id đã có để không ghi trùng khi bấm hai lần */
  var daCo = {};
  if (shCK.getLastRow() > 1) {
    shCK.getRange(2, cCK['id'] + 1, shCK.getLastRow() - 1, 1).getValues()
      .forEach(function (r) { daCo[String(r[0]).trim()] = 1; });
  }

  /* ---- 2. CONG_VIEC ---- */
  var shCV = ss.getSheetByName('CONG_VIEC');
  var hCV = shCV.getRange(1, 1, 1, shCV.getLastColumn()).getValues()[0];
  var cCV = {}; hCV.forEach(function (x, i) { cCV[String(x).trim()] = i; });
  var daCoCV = {};
  if (shCV.getLastRow() > 1) {
    shCV.getRange(2, cCV['id'] + 1, shCV.getLastRow() - 1, 1).getValues()
      .forEach(function (r) { daCoCV[String(r[0]).trim()] = 1; });
  }

  ds.forEach(function (v, i) {
    var cn = v.chi_nhanh || p.chi_nhanh || 'CHUNG';
    var stt = ('0' + (i + 1)).slice(-2);
    var idCK = 'CK-' + tuan + '-' + cn + '-' + stt;
    var idCV = 'GB-' + tuan + '-' + cn + '-' + stt;

    if (daCo[idCK] || daCoCV[idCV]) { dem.bo_qua++; return; }

    /* biên bản */
    var hang = new Array(hCK.length).fill('');
    function d1(t, g) { if (cCK[t] !== undefined) hang[cCK[t]] = g; }
    d1('id', idCK);
    d1('phien_id', 'HP-' + tuan + '-' + cn);
    d1('tuan_quy', tuan); d1('chi_nhanh', cn);
    d1('ho_va_ten', v.ai || '');
    d1('noi_dung_cam_ket', v.lam || '');
    d1('chi_so_dan_dat', v.do || '');
    d1('han_hoan_thanh', v.han || '');
    d1('trang_thai', v.cam_ket === 'huy' ? 'Đã huỷ'
                   : (v.cam_ket ? 'Cam kết' : 'Chưa cam kết'));
    d1('ngay_tao', nay); d1('nguoi_tao', 'giaoban.html');
    shCK.appendRow(hang);
    dem.cam_ket++;

    /* việc tuần mới cho app — bỏ qua việc đã huỷ */
    if (v.cam_ket === 'huy') return;
    var hv = new Array(hCV.length).fill('');
    function d2(t, g) { if (cCV[t] !== undefined) hv[cCV[t]] = g; }
    d2('id', idCV);
    d2('loai_cong_viec', 'Giao ban tuần ' + tuan);
    d2('ten_cong_viec', (cn !== 'CHUNG' ? (cn + ' · ') : '') + (v.lam || ''));
    d2('ten_khach_hang', v.do || '');          /* cột này đang dùng cho chỉ số dẫn dắt */
    d2('mo_ta_cong_viec', 'Chốt tại giao ban ' + nay
       + (v.cam_ket ? ' · người nhận đã nói Cam kết' : ' · chưa có cam kết'));
    d2('deadline', v.han || '');
    d2('ho_va_ten', v.ai || '');
    d2('trang_thai', '1.Chờ thực hiện');
    d2('ngay_tao', nay);
    d2('nguoi_tao', 'giaoban.html');
    shCV.appendRow(hv);
    dem.cong_viec++;
  });

  /* ---- 3. HOP_PHIEN ---- */
  var shHP = ss.getSheetByName('HOP_PHIEN');
  var cnDs = {};
  ds.forEach(function (v) { cnDs[v.chi_nhanh || p.chi_nhanh || 'CHUNG'] = 1; });
  Object.keys(cnDs).forEach(function (cn) {
    var t = timPhien_(shHP, tuan, cn);
    if (!t.dong) return;
    function dat(ten, gt) {
      if (t.cot[ten] !== undefined && gt !== '' && gt !== undefined) {
        shHP.getRange(t.dong, t.cot[ten] + 1).setValue(gt);
      }
    }
    dat('trang_thai', 'Đã họp');
    dat('ngay_hop', nay);
    dat('so_cam_ket', ds.filter(function (v) {
      return (v.chi_nhanh || p.chi_nhanh) === cn && v.cam_ket && v.cam_ket !== 'huy';
    }).length);
    dat('diem_hop', p.diem_hop || '');
    dat('thong_diep_tuan', p.thong_diep || '');
  });

  return { ok: true, ghi: dem, luc: Utilities.formatDate(new Date(), MUI_GIO, 'HH:mm dd/MM/yyyy') };
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
