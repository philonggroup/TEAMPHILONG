/*******************************************************************
 * VINH DANH · QLCN DUYỆT TỪ MÀN "BẢNG VÀNG"
 * App CARDIY | Họp nhanh — philonggroup.github.io/TEAMPHILONG
 *
 * Tracy chốt 24/11/2026: ngay cạnh huy hiệu MỨC có nút NGÔI SAO.
 * QLCN bấm sao để DUYỆT vinh danh, bổ sung thông tin còn thiếu, lưu lại.
 * Kết quả hiện ở màn THÔNG BÁO của app (view TOAN_BO_TB).
 *
 * AN TOÀN — chỉ THÊM dòng mới vào 2 bảng, không sửa, không xoá:
 *   HOP_VINH_DANH  (sổ vinh danh)
 *   THONG_BAO      (để hiện trên app)
 * Không đụng bảng nào khác, không ghi đè dòng nào đang có.
 *
 * Gắn vào CV_TRANG_THAI.gs: thêm một dòng vào dinhTuyenThem_
 *   if (p.viec === 'vinh_danh') return vinhDanhGhi_(p);
 *******************************************************************/

function vinhDanhGhi_(p) {
  var ten = String(p.ten || '').trim();
  var hm  = String(p.hang_muc || '').trim();
  if (!ten) return { ok: false, loi: 'Thiếu tên người được vinh danh' };
  if (!hm)  return { ok: false, loi: 'Thiếu hạng mục' };

  var ss = SpreadsheetApp.openById(FILE_RA);
  var nay = new Date();
  var dau = Utilities.formatDate(nay, MUI_GIO, 'yyyyMMdd-HHmmss');
  var ngay = Utilities.formatDate(nay, MUI_GIO, 'dd/MM/yyyy');
  var ai = String(p.ai || 'QLCN').trim();
  var cn = String(p.cn || '').trim();
  var ky = String(p.ky || '').trim();
  var ghi = String(p.ghi_nhan || '').trim();
  var ketQua = String(p.ket_qua || '').trim();
  var muc = String(p.muc || '').trim();
  var id = 'VD-' + dau;

  /* ---------- 1. Sổ vinh danh ---------- */
  var sh = ss.getSheetByName('HOP_VINH_DANH');
  if (!sh) return { ok: false, loi: 'Không thấy bảng HOP_VINH_DANH' };
  var c = {};
  sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
    .forEach(function (x, i) { c[String(x).trim()] = i; });
  var hang = new Array(sh.getLastColumn()).fill('');
  function dat(ten2, gt) { if (c[ten2] !== undefined) hang[c[ten2]] = gt; }
  dat('id', id);
  dat('tuan_quy', ky);
  dat('chi_nhanh', cn);
  dat('ca_nhan_tap_the', 'Cá nhân');
  dat('ma_nv', String(p.ma_nv || '').trim());
  dat('ho_va_ten', ten);
  dat('hang_muc', hm);
  dat('ngay_vinh_danh', nay);
  dat('don_vi', String(p.don_vi || '').trim());
  dat('ket_qua', ketQua);
  dat('chi_tieu', String(p.chi_tieu || '').trim());
  dat('dat_pct', muc);
  dat('ghi_nhan_thanh_tich', ghi);
  dat('ngay_tao', nay);
  dat('nguoi_tao', ai);
  dat('hien_thi', 'Có');
  sh.appendRow(hang);

  /* ---------- 2. Thông báo cho toàn app ---------- */
  var tb = ss.getSheetByName('THONG_BAO');
  if (!tb) return { ok: true, id: id, canh: 'Đã lưu sổ vinh danh nhưng không thấy bảng THONG_BAO' };
  var c2 = {};
  tb.getRange(1, 1, 1, tb.getLastColumn()).getValues()[0]
    .forEach(function (x, i) { c2[String(x).trim()] = i; });
  var h2 = new Array(tb.getLastColumn()).fill('');
  function dat2(ten2, gt) { if (c2[ten2] !== undefined) h2[c2[ten2]] = gt; }
  var het = new Date(nay.getTime() + 7 * 24 * 3600 * 1000);
  var noi = '🏆 ' + ten + (cn ? ' · ' + cn : '') + '\n\n' +
    hm + (ky ? ' · ' + ky : '') + '\n' +
    'Kết quả: ' + ketQua + (muc ? ' · ' + muc : '') + '\n' +
    (ghi ? '\n' + ghi + '\n' : '') +
    '\nDuyệt bởi: ' + ai + ' · ' + ngay;
  dat2('id', 'tb_' + id);
  dat2('muc_do_uu_tien', 'Cao');
  dat2('tieu_de_chinh', '🏆 VINH DANH · ' + ten + ' · ' + hm);
  dat2('noi_dung', noi);
  dat2('phan_quyen_xem', 'Toàn bộ');
  dat2('ngay_bat_dau_hien_thi', nay);
  dat2('ngay_ket_thuc_hien_thi', het);
  dat2('file', String(p.anh || '').trim());
  dat2('ngay_tao', nay);
  dat2('nguoi_tao', ai);
  tb.appendRow(h2);

  return { ok: true, id: id, ngay: ngay };
}
