/*******************************************************************
 * CARDIY | HỌP NHANH — CẦU NỐI DỮ LIỆU 2 CHIỀU
 * Google Apps Script Web App cho app tĩnh trên GitHub Pages.
 *
 * NHẬP VÀO (live, chỉ đọc):
 *   - 3 workbook hệ thống chuẩn CN1 / CN2 / CN3
 *     (thư mục Drive 19CRAx_HjWjlqr7espXFZT1-_VbwJIf2E)
 *       · tab " BÁO CÁO KPI NGÀY T{tháng}"  → chỉ số tuần + tháng
 *       · tab "CHỈ TIÊU 6T" + "TỔNG HỢP 6T" → chỉ số quý + 6 tháng
 *       · tab "Kế hoạch 90 ngày quý 4"      → mục tiêu 90 ngày
 *       · tab "Kế hoạch 6 Ways"             → mục tiêu quý
 *   - file PHI LONG_GROUP → bảng CONG_VIEC  → danh sách hành động
 *
 * XUẤT RA (ghi):
 *   - Sheet "CARDIY Họp nhanh — Nguồn dữ liệu chuẩn"
 *       · CARDIY_DATA   — trạng thái máy (JSON), để app tải lại đúng phiên
 *       · HOP_BIEN_BAN  — biên bản đọc được bằng mắt
 *       · HANH_DONG   — việc chốt tại họp
 *       · VAN_DE_IDS    — vấn đề IDS
 *       · HOP_CHAM_DIEM — điểm họp
 *
 * CÀI 1 LẦN:
 *   1. Mở Sheet "CARDIY Họp nhanh — Nguồn dữ liệu chuẩn"
 *      → Tiện ích mở rộng → Apps Script
 *   2. Dán toàn bộ file này vào, Lưu
 *   3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web
 *        Thực thi với tư cách: Tôi
 *        Ai có quyền truy cập: Bất kỳ ai
 *   4. Copy URL .../exec → dán vào API trong public/nguon.js
 *   5. Chạy thử: <URL>?khoa=PHILONG2026&viec=kiem_tra
 *******************************************************************/

var KHOA    = 'PHILONG2026';          // phải khớp public/nguon.js
var MUI_GIO = 'Asia/Ho_Chi_Minh';

/* ---------- NGUỒN VÀO ---------- */
var CHI_NHANH = [
  { ma: 'CN1', ten: 'PHI LONG 1', file: '1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc' },
  { ma: 'CN2', ten: 'PHI LONG 2', file: '1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k' },
  { ma: 'CN3', ten: 'PHI LONG 3', file: '1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc' }
];
var FILE_APP = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';   // PHI LONG_GROUP

/* ---------- NGUỒN RA ---------- */
var FILE_RA        = '1Y5G05cBs7kWehsLzqJf5xttSv3hw3kICDoaLc4kFxcU';
var TAB_TRANG_THAI = 'CARDIY_DATA';
var TAB_BIEN_BAN   = 'HOP_BIEN_BAN';
var TAB_CAM_KET    = 'HANH_DONG';
var TAB_VAN_DE     = 'VAN_DE_IDS';
var TAB_CHAM_DIEM  = 'HOP_CHAM_DIEM';

/* Tên tab lệch khoảng trắng giữa 3 file nên dò theo tên đã chuẩn hoá.
   Tháng 12 chưa có tab " BÁO CÁO KPI NGÀY T12" nên phải có đường lui "KPI NGÀY T12". */
var MAU_KPI      = [' BÁO CÁO KPI NGÀY T{T}', 'BÁO CÁO KPI NGÀY T{T}',
                    ' BÁO CÁO  KPI NGÀY T{T}', 'KPI NGÀY T{T}', 'NEW KPI NGÀY T{T}'];
var MAU_TONG_HOP = ['TỔNG HỢP 6T'];
var MAU_CHI_TIEU = ['CHỈ TIÊU 6T'];
var MAU_KH90     = ['Kế hoạch 90 ngày quý 4', 'KH 90 NGÀY Q4'];
var MAU_6WAYS    = ['Kế hoạch 6 Ways'];

var KY = ['week', 'month', 'quarter', 'year'];

/* Cặp chỉ tiêu ↔ thực đạt cho kỳ quý / 6 tháng.
   Chỉ ghép những cặp CÙNG ĐƠN VỊ TÍNH. Cặp nào lệch cơ sở (chỉ tiêu theo ngày
   còn thực đạt theo quý) thì BỎ, không tự nhân lên để tránh bịa số. */
var CAP_QUY = [
  { ten: 'Doanh thu',                   chiTieu: 'DOANH THU MỤC TIÊU (THEO C3)',                   thuc: 'DOANH THU CHUẨN',                          dv: 'triệu đ', chia: 1000000 },
  { ten: 'Lượt xe hoàn tất',            chiTieu: 'LƯỢT XE HOÀN TẤT / THÁNG',                       thuc: 'LƯỢT XE HOÀN TẤT',                         dv: 'lượt',    chia: 1 },
  { ten: 'DT trung bình / lượt',        chiTieu: 'DT TRUNG BÌNH / LƯỢT CẦN (DẪN DẮT)',             thuc: 'DT TRUNG BÌNH / LƯỢT',                     dv: 'triệu đ', chia: 1000000 },
  { ten: 'Lốp bán ra',                  chiTieu: 'LỐP THẬT / THÁNG (DT LỐP ÷ GIÁ TB Ô C19)',       thuc: 'LỐP THẬT BÁN RA',                          dv: 'lốp',     chia: 1 },
  { ten: 'Tỷ trọng DT lốp',             chiTieu: 'TỶ TRỌNG DT LỐP',                                thuc: 'TỶ TRỌNG DT LỐP',                          dv: '%',       chia: 1, phanTram: true },
  { ten: 'Tỷ trọng DT dịch vụ',         chiTieu: 'TỶ TRỌNG DT DỊCH VỤ (DVL+DVNL+LĐ)',              thuc: 'TỶ TRỌNG DT DỊCH VỤ (DVL+DVNL+LĐ)',        dv: '%',       chia: 1, phanTram: true },
  { ten: 'Tỷ lệ khách quay lại',        chiTieu: 'TỶ LỆ KHÁCH THÁNG TRƯỚC QUAY LẠI (GIỮ CHÂN)',    thuc: 'TỶ LỆ KHÁCH THÁNG TRƯỚC QUAY LẠI',         dv: '%',       chia: 1, phanTram: true }
];

/* ================================================================
   ĐIỀU PHỐI
   ================================================================ */
function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.khoa !== KHOA) return ra_({ ok: false, loi: 'Sai khoá truy cập' });
    switch (p.viec) {
      case 'nguon':     return ra_(docNguon_(p));
      case 'kiem_tra':  return ra_(kiemTra_());
      default:          return ra_({ ok: false, loi: 'Không rõ tham số viec=' + p.viec });
    }
  } catch (err) {
    return ra_({ ok: false, loi: String((err && err.message) || err) });
  }
}

/* POST gửi dạng text/plain để trình duyệt KHÔNG bật preflight CORS
   (Apps Script không trả lời OPTIONS). Nội dung vẫn là JSON. */
function doPost(e) {
  try {
    var than = {};
    if (e && e.postData && e.postData.contents) than = JSON.parse(e.postData.contents);
    var khoa = than.khoa || ((e && e.parameter && e.parameter.khoa) || '');
    if (khoa !== KHOA) return ra_({ ok: false, loi: 'Sai khoá truy cập' });
    return ra_(ghiNguon_(than));
  } catch (err) {
    return ra_({ ok: false, loi: String((err && err.message) || err) });
  }
}

function ra_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================================================================
   TIỆN ÍCH
   ================================================================ */
function chuan_(s) {
  return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toUpperCase();
}
function moTab_(ss, mau, thang) {
  var ds = ss.getSheets(), i, j, ten;
  for (j = 0; j < mau.length; j++) {
    ten = chuan_(String(mau[j]).replace('{T}', String(thang)));
    for (i = 0; i < ds.length; i++) if (chuan_(ds[i].getName()) === ten) return ds[i];
  }
  return null;
}
function so_(v) {
  if (v === '' || v === null || v === undefined || v === '-') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  var s = String(v).replace(/[^0-9,.\-]/g, '');
  if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.indexOf(',') > -1) s = s.replace(',', '.');
  var n = parseFloat(s);
  return isFinite(n) ? n : 0;
}
function lamTron_(n) { return Math.round(n * 100) / 100; }
function maMoi_() { return Utilities.getUuid(); }
function gioVN_(d) {
  return Utilities.formatDate(d || new Date(), MUI_GIO, "yyyy-MM-dd'T'HH:mm:ss");
}
function ngayVN_(d) {
  return Utilities.formatDate(d || new Date(), MUI_GIO, 'yyyy-MM-dd');
}
/* Tuần trong tháng: T1 = 01–07, T2 = 08–14, T3 = 15–21, T4 = 22–28, T5 = 29–hết */
function soTuan_(d) { return Math.min(5, Math.floor((d.getDate() - 1) / 7) + 1); }

function timCot_(hang, ten) {
  var i, muc = chuan_(ten);
  for (i = 0; i < hang.length; i++) if (chuan_(hang[i]) === muc) return i;
  return -1;
}
function timCotChua_(hang, ten) {
  var i, muc = chuan_(ten);
  for (i = 0; i < hang.length; i++) if (chuan_(hang[i]).indexOf(muc) === 0) return i;
  return -1;
}
function timDong_(bang, cot, ten) {
  var i, muc = chuan_(ten);
  for (i = 0; i < bang.length; i++) if (chuan_(bang[i][cot]) === muc) return i;
  return -1;
}

/* Đơn vị suy từ tên chỉ số của tab KPI ngày (tab này không có cột đơn vị) */
function donVi_(ten) {
  var t = chuan_(ten);
  /* Thứ tự quan trọng: phải xét TỶ LỆ / TỶ TRỌNG TRƯỚC, và KHÔNG được bắt dấu '%'
     trần, vì tên chỉ số doanh thu có kèm tỷ trọng trong ngoặc — ví dụ
     "— DT lốp (62%)" là tiền đồng chứ không phải phần trăm. */
  if (t.indexOf('TỶ LỆ') > -1 || t.indexOf('TỶ TRỌNG') > -1) return '%';
  if (t.indexOf('DOANH THU') > -1 || t.indexOf('DT ') === 0 || t.indexOf('— DT') > -1 ||
      t.indexOf('· DV') > -1 || t.indexOf('CÔNG NỢ') > -1) return 'triệu đ';
  if (t.indexOf('LỐP') > -1 && t.indexOf('SỐ LƯỢNG') > -1) return 'lốp';
  if (t.indexOf('— LỐP') > -1) return 'lốp';
  if (t.indexOf('PHIẾU') > -1 || t.indexOf('ATX') > -1) return 'phiếu';
  if (t.indexOf('LƯỢT') > -1 || t.indexOf('CUỘC GỌI') > -1 || t.indexOf('CÂN CHỈNH') > -1) return 'lượt';
  if (t.indexOf('KHÁCH') > -1) return 'khách';
  if (t.indexOf('XE') > -1) return 'xe';
  return '';
}

/* ================================================================
   ĐỌC CHỈ SỐ — tab " BÁO CÁO KPI NGÀY T{tháng}"
   Dòng 3 = tiêu đề cột · dòng 4 trở đi = chỉ số, dừng ở dòng trống đầu tiên.
   Cột dò theo TÊN vì CN1 dùng "% ĐẠT NGÀY" còn CN2/CN3 dùng "ĐÈN NGÀY".
   ================================================================ */
function docChiSo_(ss, thang, kieu, tuan) {
  var sh = moTab_(ss, MAU_KPI, thang);
  if (!sh) return { loi: 'Không thấy tab KPI ngày tháng ' + thang, ds: [] };

  var bang = sh.getDataRange().getValues();
  if (bang.length < 4) return { loi: 'Tab KPI ngày rỗng', ds: [] };

  var dauDe = bang[2];
  var cNhom = 0, cTen = 1;
  var cChiTieu, cThuc;
  if (kieu === 'month') {
    cChiTieu = timCotChua_(dauDe, 'KPI THÁNG');
    cThuc    = timCot_(dauDe, 'THỰC ĐẠT THÁNG');
  } else {
    cChiTieu = timCot_(dauDe, 'KPI TUẦN ' + tuan);
    cThuc    = timCot_(dauDe, 'THỰC ĐẠT T' + tuan);
  }
  var cNguoi = timCot_(dauDe, 'NGƯỜI PHỤ TRÁCH');
  if (cChiTieu < 0 || cThuc < 0) {
    return { loi: 'Không thấy cột chỉ tiêu / thực đạt cho kỳ ' + kieu, ds: [] };
  }

  var ds = [], i, ten, nhom, ct, td, dv, he;
  for (i = 3; i < bang.length; i++) {
    ten = String(bang[i][cTen] || '').replace(/\s+/g, ' ').trim();
    nhom = chuan_(bang[i][cNhom]);
    if (!ten && !nhom) break;                       /* hết khối chỉ số */
    if (!ten) continue;
    if (nhom.indexOf('KIỂM TRA') > -1) continue;    /* dòng tự kiểm của Sheet */
    if (nhom.indexOf('LŨY KẾ') > -1 || nhom.indexOf('CÒN LẠI PHẢI ĐẠT') > -1) break;

    dv = donVi_(ten);
    he = (dv === 'triệu đ') ? 1000000 : 1;
    ct = so_(bang[i][cChiTieu]);
    td = so_(bang[i][cThuc]);
    if (dv === '%') { ct = ct * 100; td = td * 100; }
    else { ct = ct / he; td = td / he; }

    ds.push({
      title: ten,
      unit: dv,
      owner: cNguoi > -1 ? String(bang[i][cNguoi] || '').replace(/\s+/g, ' ').trim() : '',
      target: lamTron_(ct),
      actual: lamTron_(td)
    });
  }
  return { loi: '', ds: ds, tab: sh.getName() };
}

/* ================================================================
   ĐỌC CHỈ SỐ KỲ QUÝ / 6 THÁNG
   Chỉ tiêu ← "CHỈ TIÊU 6T" · Thực đạt ← "TỔNG HỢP 6T"
   ================================================================ */
function docChiSoDai_(ss, kieu) {
  var shCT = moTab_(ss, MAU_CHI_TIEU, 0);
  var shTH = moTab_(ss, MAU_TONG_HOP, 0);
  if (!shCT || !shTH) return { loi: 'Không thấy tab CHỈ TIÊU 6T / TỔNG HỢP 6T', ds: [] };

  var bCT = shCT.getDataRange().getValues();
  var bTH = shTH.getDataRange().getValues();

  var dCT = -1, dTH = -1, i;
  for (i = 0; i < Math.min(12, bCT.length); i++) if (timCot_(bCT[i], 'QUÝ 4') > -1) { dCT = i; break; }
  for (i = 0; i < Math.min(12, bTH.length); i++) if (timCot_(bTH[i], 'QUÝ 4') > -1) { dTH = i; break; }
  if (dCT < 0 || dTH < 0) return { loi: 'Không thấy dòng tiêu đề QUÝ 4', ds: [] };

  var nhan  = (kieu === 'quarter') ? 'QUÝ 4' : '6 THÁNG';
  var cCT   = timCot_(bCT[dCT], nhan);
  var cTH   = timCot_(bTH[dTH], nhan);
  var cTenCT = timCot_(bCT[dCT], 'Chỉ tiêu');
  var cTenTH = timCot_(bTH[dTH], 'Chỉ số');
  if (cCT < 0 || cTH < 0 || cTenCT < 0 || cTenTH < 0) {
    return { loi: 'Không thấy cột ' + nhan, ds: [] };
  }

  var ds = [], j, cap, iCT, iTH, ct, td;
  for (j = 0; j < CAP_QUY.length; j++) {
    cap = CAP_QUY[j];
    iCT = timDong_(bCT, cTenCT, cap.chiTieu);
    iTH = timDong_(bTH, cTenTH, cap.thuc);
    if (iCT < 0 || iTH < 0) continue;              /* thiếu nguồn thì bỏ, không bịa */
    ct = so_(bCT[iCT][cCT]);
    td = so_(bTH[iTH][cTH]);
    if (cap.phanTram) { ct = ct * 100; td = td * 100; }
    else { ct = ct / cap.chia; td = td / cap.chia; }
    ds.push({ title: cap.ten, unit: cap.dv, owner: 'Quản lý chi nhánh',
              target: lamTron_(ct), actual: lamTron_(td) });
  }
  return { loi: '', ds: ds, tab: shCT.getName() + ' + ' + shTH.getName() };
}

/* ================================================================
   ĐỌC MỤC TIÊU 90 NGÀY — tab "Kế hoạch 90 ngày quý 4"
   Dòng 3 = tiêu đề · dòng 5 trở đi = mục tiêu.
   B = nhóm số (I–IV) · C = tên nhóm · D = tên mục tiêu
   E = mục tiêu quý 4 · H = P-I-C
   ================================================================ */
function docKH90_(ss) {
  var sh = moTab_(ss, MAU_KH90, 0);
  if (!sh) return { loi: 'Không thấy tab Kế hoạch 90 ngày quý 4', ds: [] };

  var bang = sh.getDataRange().getValues();
  var de = -1, i;
  for (i = 0; i < Math.min(10, bang.length); i++) if (timCotChua_(bang[i], 'MÔ TẢ') > -1) { de = i; break; }
  if (de < 0) return { loi: 'Không thấy dòng tiêu đề MÔ TẢ', ds: [] };

  var cTen  = timCotChua_(bang[de], 'MÔ TẢ');
  var cMuc  = timCotChua_(bang[de], 'MỤC TIÊU');
  var cAi   = timCotChua_(bang[de], 'P-I-C');
  var cNhom = cTen - 1;

  var ds = [], ten, nhomHienTai = '', nhom;
  for (i = de + 1; i < bang.length; i++) {
    ten = String(bang[i][cTen] || '').replace(/\s+/g, ' ').trim();
    nhom = String(bang[i][cNhom] || '').replace(/\s+/g, ' ').trim();
    if (nhom) nhomHienTai = nhom;
    if (!ten) continue;
    if (chuan_(bang[i][cNhom - 1] || '') === 'TẢI VIỆC / TUẦN') break;
    ds.push({
      title: (nhomHienTai ? nhomHienTai + ' · ' : '') + ten,
      owner: cAi > -1 ? String(bang[i][cAi] || '').replace(/\s+/g, ' ').trim() : '',
      status: 'Đúng tiến độ',
      milestones: cMuc > -1 ? String(bang[i][cMuc] || '').replace(/\s+/g, ' ').trim() : ''
    });
  }
  return { loi: '', ds: ds, tab: sh.getName() };
}

/* ================================================================
   ĐỌC MỤC TIÊU QUÝ — tab "Kế hoạch 6 Ways"
   ================================================================ */
function doc6Ways_(ss) {
  var sh = moTab_(ss, MAU_6WAYS, 0);
  if (!sh) return { loi: 'Không thấy tab Kế hoạch 6 Ways', ds: [] };

  var bang = sh.getDataRange().getValues();
  var de = -1, i;
  for (i = 0; i < Math.min(12, bang.length); i++) if (timCotChua_(bang[i], 'CHỈ SỐ 6 WAYS') > -1) { de = i; break; }
  if (de < 0) return { loi: 'Không thấy dòng tiêu đề Chỉ số 6 Ways', ds: [] };

  var cTen   = timCotChua_(bang[de], 'CHỈ SỐ 6 WAYS');
  var cMuc   = timCotChua_(bang[de], 'MỤC TIÊU Q4');
  var cChien = timCotChua_(bang[de], 'CHIẾN LƯỢC CHỌN');
  var cChot  = timCotChua_(bang[de], 'CHỐT');
  var cAi    = timCotChua_(bang[de], 'NGƯỜI PHỤ TRÁCH');

  var ds = [], ten, chot;
  for (i = de + 1; i < bang.length; i++) {
    ten = String(bang[i][cTen] || '').replace(/\s+/g, ' ').trim();
    if (!ten) continue;
    if (chuan_(ten).indexOf('DOANH THU') === 0 && cMuc < 0) continue;
    chot = cChot > -1 ? chuan_(bang[i][cChot]) : '';
    ds.push({
      title: ten,
      owner: cAi > -1 ? String(bang[i][cAi] || '').replace(/\s+/g, ' ').trim() : '',
      status: (chot === 'CHỐT' || chot === 'X' || chot === 'TRUE' || chot === '✔') ? 'Đúng tiến độ' : 'Cần xử lý',
      milestones: [
        cMuc > -1 ? String(bang[i][cMuc] || '').trim() : '',
        cChien > -1 ? String(bang[i][cChien] || '').trim() : ''
      ].filter(function (x) { return x; }).join(' · ')
    });
  }
  return { loi: '', ds: ds, tab: sh.getName() };
}

/* ================================================================
   ĐỌC DANH SÁCH HÀNH ĐỘNG — PHI LONG_GROUP · bảng CONG_VIEC
   "Chưa xong" = trang_thai <> "3.Hoàn thành" (chuẩn đã chốt 22/11/2026)
   ================================================================ */
function docCongViec_(maCN) {
  var sh = SpreadsheetApp.openById(FILE_APP).getSheetByName('CONG_VIEC');
  if (!sh) return { loi: 'Không thấy bảng CONG_VIEC trong PHI LONG_GROUP', ds: [] };

  var bang = sh.getDataRange().getValues();
  if (bang.length < 2) return { loi: '', ds: [] };

  var de = bang[0];
  var cTen  = timCot_(de, 'ten_cong_viec');
  var cHan  = timCot_(de, 'deadline');
  var cAi   = timCot_(de, 'ho_va_ten');
  var cBan  = timCot_(de, 'phong_ban');
  var cTT   = timCot_(de, 'trang_thai');
  if (cTen < 0) return { loi: 'Bảng CONG_VIEC không có cột ten_cong_viec', ds: [] };

  var ds = [], i, ten, ban, tt, han;
  for (i = 1; i < bang.length; i++) {
    ten = String(bang[i][cTen] || '').replace(/\s+/g, ' ').trim();
    if (!ten) continue;
    ban = chuan_(cBan > -1 ? bang[i][cBan] : '');
    if (maCN && ban.indexOf(maCN) < 0 && chuan_(ten).indexOf(maCN) < 0) continue;
    tt = String(cTT > -1 ? bang[i][cTT] : '').trim();
    han = cHan > -1 ? bang[i][cHan] : '';
    ds.push({
      title: ten,
      owner: cAi > -1 ? String(bang[i][cAi] || '').trim() : '',
      date: (han instanceof Date) ? ngayVN_(han) : String(han || '').slice(0, 10),
      done: tt.indexOf('3.') === 0 || chuan_(tt).indexOf('HOÀN THÀNH') > -1
    });
  }
  return { loi: '', ds: ds };
}

/* ================================================================
   TRẠNG THÁI ĐÃ LƯU — tab CARDIY_DATA của Sheet nguồn chuẩn
   Một ô Google Sheet chứa tối đa 50.000 ký tự nên JSON được cắt
   thành nhiều cột D, E, F… Mỗi lần lưu ghi thêm 1 dòng (giữ lịch sử).
   ================================================================ */
var CAT_O = 40000;

function tabRa_(ten, dauDe) {
  var ss = SpreadsheetApp.openById(FILE_RA);
  var sh = ss.getSheetByName(ten);
  if (!sh) {
    sh = ss.insertSheet(ten);
    if (dauDe && dauDe.length) {
      sh.getRange(1, 1, 1, dauDe.length).setValues([dauDe]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  }
  return sh;
}

function docTrangThai_() {
  var sh = tabRa_(TAB_TRANG_THAI, ['id', 'version', 'savedAt', 'json']);
  var n = sh.getLastRow();
  if (n < 2) return { version: 'root', savedAt: null, data: null };
  var hang = sh.getRange(n, 1, 1, Math.max(4, sh.getLastColumn())).getValues()[0];
  var tho = '';
  for (var i = 3; i < hang.length; i++) tho += String(hang[i] || '');
  var dl = null;
  try { dl = tho ? JSON.parse(tho) : null; } catch (e) { dl = null; }
  return { version: String(hang[1] || 'root'), savedAt: hang[2] ? String(hang[2]) : null, data: dl };
}

function ghiTrangThai_(id, json) {
  var sh = tabRa_(TAB_TRANG_THAI, ['id', 'version', 'savedAt', 'json']);
  var version = maMoi_();
  var luc = gioVN_();
  var manh = [], i;
  for (i = 0; i < json.length; i += CAT_O) manh.push(json.slice(i, i + CAT_O));
  if (!manh.length) manh = [''];
  var hang = [id, version, luc].concat(manh);
  var can = hang.length;
  if (sh.getMaxColumns() < can) sh.insertColumnsAfter(sh.getMaxColumns(), can - sh.getMaxColumns());
  sh.getRange(sh.getLastRow() + 1, 1, 1, can).setValues([hang]);
  return { version: version, savedAt: luc };
}

/* ---------- Trộn: số live đè lên số đã lưu, giữ dòng app tự thêm ---------- */
function tronChiSo_(live, daLuu) {
  if (!daLuu || !daLuu.length) return live;
  var theoTen = {}, i;
  for (i = 0; i < live.length; i++) theoTen[chuan_(live[i].title)] = true;
  var them = [];
  for (i = 0; i < daLuu.length; i++) {
    if (!theoTen[chuan_(daLuu[i].title)]) them.push(daLuu[i]);
  }
  return live.concat(them);
}

function khungRong_() {
  return { kpis: [], goals: [], good: [], news: [], tasks: [], issues: [],
           notes: '', rating: 0, session: null, history: [], awards: [] };
}

/* ================================================================
   doGet viec=nguon — DỮ LIỆU VÀO CHO APP
   ================================================================ */
function docNguon_(p) {
  var hnay = new Date();
  var thang = p.thang ? Number(p.thang) : (hnay.getMonth() + 1);
  var tuan  = p.tuan  ? Number(p.tuan)  : soTuan_(hnay);

  var tt = docTrangThai_();
  var luu = tt.data || {};
  var canhBao = [];
  var ketQua = {};
  var k, i, cn, ss, chiSo, mucTieu, viec, goc, khung;

  var moFile = {};
  for (i = 0; i < CHI_NHANH.length; i++) {
    try { moFile[CHI_NHANH[i].ma] = SpreadsheetApp.openById(CHI_NHANH[i].file); }
    catch (e) { moFile[CHI_NHANH[i].ma] = null; canhBao.push(CHI_NHANH[i].ten + ': không mở được workbook'); }
  }

  for (k = 0; k < KY.length; k++) {
    var kieu = KY[k];
    var nhom = { branches: [], joint: null };
    var luuKy = luu[kieu] || {};

    for (i = 0; i < CHI_NHANH.length; i++) {
      cn = CHI_NHANH[i];
      ss = moFile[cn.ma];
      goc = (luuKy.branches && luuKy.branches[i]) ? luuKy.branches[i] : khungRong_();
      khung = khungRong_();
      khung.good    = goc.good    || [];
      khung.news    = goc.news    || [];
      khung.issues  = goc.issues  || [];
      khung.awards  = goc.awards  || [];
      khung.notes   = goc.notes   || '';
      khung.rating  = goc.rating  || 0;
      khung.session = goc.session || null;
      khung.history = goc.history || [];

      if (!ss) { nhom.branches.push(khung); continue; }

      /* --- Chỉ số --- */
      chiSo = (kieu === 'quarter' || kieu === 'year')
        ? docChiSoDai_(ss, kieu)
        : docChiSo_(ss, thang, kieu, tuan);
      if (chiSo.loi) canhBao.push(cn.ten + ' · ' + kieu + ': ' + chiSo.loi);
      khung.kpis = tronChiSo_(chiSo.ds, goc.kpis);

      /* --- Mục tiêu --- */
      mucTieu = (kieu === 'quarter' || kieu === 'year') ? doc6Ways_(ss) : docKH90_(ss);
      if (mucTieu.loi) canhBao.push(cn.ten + ' · ' + kieu + ': ' + mucTieu.loi);
      khung.goals = mucTieu.ds.length ? mucTieu.ds : (goc.goals || []);

      /* --- Danh sách hành động: lấy live ở kỳ tuần, các kỳ khác giữ bản đã lưu --- */
      if (kieu === 'week') {
        viec = docCongViec_(cn.ma);
        if (viec.loi) canhBao.push(cn.ten + ': ' + viec.loi);
        khung.tasks = viec.ds.length ? viec.ds : (goc.tasks || []);
      } else {
        khung.tasks = goc.tasks || [];
      }

      nhom.branches.push(khung);
    }

    /* --- Họp chung 3 chi nhánh: cộng dồn chỉ số, gộp mục tiêu --- */
    var chung = (luuKy.joint) ? luuKy.joint : khungRong_();
    var gopKhung = khungRong_();
    gopKhung.good    = chung.good    || [];
    gopKhung.news    = chung.news    || [];
    gopKhung.issues  = chung.issues  || [];
    gopKhung.awards  = chung.awards  || [];
    gopKhung.notes   = chung.notes   || '';
    gopKhung.rating  = chung.rating  || 0;
    gopKhung.session = chung.session || null;
    gopKhung.history = chung.history || [];
    gopKhung.kpis    = congChiSo_(nhom.branches);
    gopKhung.goals   = chung.goals || [];
    gopKhung.tasks   = chung.tasks || [];
    nhom.joint = gopKhung;

    ketQua[kieu] = nhom;
  }

  return {
    ok: true,
    version: tt.version,
    savedAt: tt.savedAt,
    data: ketQua,
    meta: {
      thang: thang,
      tuan: tuan,
      ngayDoc: gioVN_(),
      chiNhanh: CHI_NHANH.map(function (c) { return c.ten; }),
      canhBao: canhBao
    }
  };
}

/* Cộng dồn chỉ số 3 chi nhánh cho màn họp chung.
   Chỉ số dạng % thì lấy bình quân, còn lại thì cộng. */
function congChiSo_(dsCN) {
  var gom = {}, thuTu = [], i, j, ds, m, ten;
  for (i = 0; i < dsCN.length; i++) {
    ds = dsCN[i].kpis || [];
    for (j = 0; j < ds.length; j++) {
      m = ds[j];
      ten = chuan_(m.title);
      if (!gom[ten]) {
        gom[ten] = { title: m.title, unit: m.unit, owner: '3 chi nhánh',
                     target: 0, actual: 0, dem: 0 };
        thuTu.push(ten);
      }
      gom[ten].target += so_(m.target);
      gom[ten].actual += so_(m.actual);
      gom[ten].dem += 1;
    }
  }
  var ra = [];
  for (i = 0; i < thuTu.length; i++) {
    m = gom[thuTu[i]];
    if (m.unit === '%' && m.dem > 0) { m.target = m.target / m.dem; m.actual = m.actual / m.dem; }
    ra.push({ title: m.title, unit: m.unit, owner: m.owner,
              target: lamTron_(m.target), actual: lamTron_(m.actual) });
  }
  return ra;
}

/* ================================================================
   doPost — DỮ LIỆU RA: app ghi kết quả họp xuống Sheet nguồn chuẩn
   Thân JSON: { khoa, id, base, data }
   base phải khớp version đang có, lệch thì trả kind=conflict.
   ================================================================ */
function ghiNguon_(than) {
  if (!than || !than.data) return { ok: false, loi: 'Thiếu dữ liệu để lưu' };

  var khoaGhi = LockService.getScriptLock();
  try { khoaGhi.waitLock(25000); }
  catch (e) { return { ok: false, loi: 'Có người đang lưu, thử lại sau vài giây' }; }

  try {
    var tt = docTrangThai_();
    if (than.base && than.base !== tt.version) {
      return { ok: false, kind: 'conflict',
               loi: 'Sheet đã có phiên bản mới hơn. Bấm "Tải phiên bản từ Sheet" rồi nhập lại.' };
    }

    var json = JSON.stringify(than.data);
    var kq = ghiTrangThai_(than.id || maMoi_(), json);

    ghiBienBan_(than.data);
    ghiCamKet_(than.data);
    ghiVanDe_(than.data);
    ghiChamDiem_(than.data);

    return { ok: true, version: kq.version, savedAt: kq.savedAt };
  } finally {
    khoaGhi.releaseLock();
  }
}

function tenBan_(i) {
  return (i < CHI_NHANH.length) ? CHI_NHANH[i].ten : 'HỌP CHUNG 3 CHI NHÁNH';
}
function duyetBan_(dl, viec) {
  var k, i, nhom;
  for (k = 0; k < KY.length; k++) {
    nhom = dl[KY[k]];
    if (!nhom) continue;
    if (nhom.branches) for (i = 0; i < nhom.branches.length; i++) viec(KY[k], i, nhom.branches[i]);
    if (nhom.joint) viec(KY[k], CHI_NHANH.length, nhom.joint);
  }
}
function nhanKy_(k) {
  return k === 'week' ? 'Tuần' : k === 'month' ? 'Tháng' : k === 'quarter' ? 'Quý' : 'Năm';
}
function dat_(sh, dauDe, hang) {
  sh.clear();
  sh.getRange(1, 1, 1, dauDe.length).setValues([dauDe]).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (hang.length) sh.getRange(2, 1, hang.length, dauDe.length).setValues(hang);
  sh.autoResizeColumns(1, Math.min(dauDe.length, 8));
}

function ghiBienBan_(dl) {
  var de = ['Kỳ', 'Chi nhánh', 'Ngày họp', 'Điểm họp', 'Tin tốt', 'Phản hồi', 'Nội dung truyền đạt', 'Cập nhật lúc'];
  var hang = [], luc = gioVN_();
  duyetBan_(dl, function (k, i, d) {
    if (!d) return;
    var co = (d.good && d.good.length) || (d.news && d.news.length) || d.notes || d.rating;
    if (!co) return;
    hang.push([
      nhanKy_(k), tenBan_(i),
      (d.session && d.session.date) ? d.session.date : ngayVN_(),
      d.rating || '',
      (d.good || []).map(function (x) { return x.title; }).join(' | '),
      (d.news || []).map(function (x) { return x.title; }).join(' | '),
      d.notes || '', luc
    ]);
  });
  dat_(tabRa_(TAB_BIEN_BAN, de), de, hang);
}

function ghiCamKet_(dl) {
  var de = ['Kỳ', 'Chi nhánh', 'Công việc', 'Người nhận', 'Hạn', 'Trạng thái', 'Cập nhật lúc'];
  var hang = [], luc = gioVN_();
  duyetBan_(dl, function (k, i, d) {
    if (!d || !d.tasks) return;
    for (var j = 0; j < d.tasks.length; j++) {
      var t = d.tasks[j];
      if (!t || !t.title) continue;
      hang.push([nhanKy_(k), tenBan_(i), t.title, t.owner || '', t.date || '',
                 t.done ? '3.Hoàn thành' : '2.Đang làm', luc]);
    }
  });
  dat_(tabRa_(TAB_CAM_KET, de), de, hang);
}

function ghiVanDe_(dl) {
  var de = ['Kỳ', 'Chi nhánh', 'Vấn đề', 'Mức ưu tiên', 'Nguyên nhân', 'Thảo luận', 'Hành động đã chốt', 'Trạng thái', 'Cập nhật lúc'];
  var hang = [], luc = gioVN_();
  duyetBan_(dl, function (k, i, d) {
    if (!d || !d.issues) return;
    for (var j = 0; j < d.issues.length; j++) {
      var v = d.issues[j];
      if (!v || !v.title) continue;
      hang.push([nhanKy_(k), tenBan_(i), v.title, v.priority || '', v.cause || '',
                 v.discussion || '', v.solution || '',
                 v.solved ? 'Đã xử lý' : 'Đang mở', luc]);
    }
  });
  dat_(tabRa_(TAB_VAN_DE, de), de, hang);
}

function ghiChamDiem_(dl) {
  var de = ['Kỳ', 'Chi nhánh', 'Ngày họp', 'Điểm', 'Mục đã rà soát', 'Cập nhật lúc'];
  var hang = [], luc = gioVN_();
  duyetBan_(dl, function (k, i, d) {
    if (!d || !d.rating) return;
    hang.push([nhanKy_(k), tenBan_(i),
               (d.session && d.session.date) ? d.session.date : ngayVN_(),
               d.rating,
               (d.session && d.session.done) ? d.session.done.join(', ') : '', luc]);
  });
  dat_(tabRa_(TAB_CHAM_DIEM, de), de, hang);
}

/* ================================================================
   viec=kiem_tra — tự soát nguồn trước khi họp
   ================================================================ */
function kiemTra_() {
  var hnay = new Date();
  var thang = hnay.getMonth() + 1;
  var tuan = soTuan_(hnay);
  var bao = [], i, cn, ss, c, m, k, v;

  for (i = 0; i < CHI_NHANH.length; i++) {
    cn = CHI_NHANH[i];
    m = { chiNhanh: cn.ten, ma: cn.ma };
    try { ss = SpreadsheetApp.openById(cn.file); }
    catch (e) { m.loi = 'Không mở được workbook'; bao.push(m); continue; }

    c = docChiSo_(ss, thang, 'week', tuan);
    m.tabKPI = c.tab || '—';
    m.soChiSoTuan = c.ds.length;
    m.loiChiSo = c.loi || '';

    v = docChiSoDai_(ss, 'quarter');
    m.soChiSoQuy = v.ds.length;
    m.loiChiSoQuy = v.loi || '';

    k = docKH90_(ss);
    m.soMucTieu90 = k.ds.length;
    m.loiMucTieu = k.loi || '';

    var w = doc6Ways_(ss);
    m.soMucTieu6Ways = w.ds.length;
    m.loiMucTieu6Ways = w.loi || '';

    var cv = docCongViec_(cn.ma);
    m.soCongViec = cv.ds.length;
    m.loiCongViec = cv.loi || '';

    m.lechTuKiem = lechTuKiem_(ss, thang);
    bao.push(m);
  }

  var tt = docTrangThai_();
  return { ok: true, thang: thang, tuan: tuan, ngayDoc: gioVN_(),
           version: tt.version, savedAt: tt.savedAt, nguon: bao };
}

/* Đọc lại đúng dòng "✔ KIỂM TRA" mà chính Sheet tự soát — phải = 0 */
function lechTuKiem_(ss, thang) {
  var sh = moTab_(ss, MAU_KPI, thang);
  if (!sh) return null;
  var bang = sh.getDataRange().getValues();
  var i, cThuc = timCot_(bang[2], 'THỰC ĐẠT THÁNG');
  for (i = 3; i < Math.min(40, bang.length); i++) {
    if (chuan_(bang[i][0]).indexOf('KIỂM TRA') > -1) {
      return cThuc > -1 ? so_(bang[i][cThuc]) : null;
    }
  }
  return null;
}
