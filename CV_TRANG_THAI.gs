/*******************************************************************
 * CONG_VIEC · ĐỔI TRẠNG THÁI TỪ MÀN B5 "DANH SÁCH HÀNH ĐỘNG"
 * App CARDIY | Họp nhanh — philonggroup.github.io/TEAMPHILONG
 *
 * Tracy chốt 24/11/2026: nút tinh chỉnh trạng thái ở màn Danh sách
 * hành động phải GHI THẲNG về bảng CONG_VIEC của PHI LONG_GROUP,
 * không để sửa tại chỗ rồi bị vòng đọc lại xoá mất.
 *
 * AN TOÀN — hàm này chỉ chạm đúng 3 ô của MỘT dòng ĐÃ CÓ SẴN:
 *   trang_thai · ngay_hoan_thanh · nhat_ki
 * Không thêm dòng, không xoá dòng, không đụng bảng nào khác.
 *
 * CÁCH GẮN (1 lần):
 *   1. Thêm file này vào đúng dự án Apps Script của Code.gs
 *   2. Trong Code.gs, nhánh default của doGet đổi thành:
 *        default:  return ra_(dinhTuyenThem_(p));
 *   3. Triển khai → Quản lý triển khai → sửa bản đang chạy →
 *      Phiên bản: Phiên bản mới → Triển khai  (URL .../exec GIỮ NGUYÊN)
 *******************************************************************/

var TT_CHUAN = ['1.Chờ thực hiện', '2.Đang làm', '3.Hoàn thành'];

/* Nhánh default của Code.gs gọi vào đây. Việc lạ vẫn trả đúng lỗi cũ. */
function dinhTuyenThem_(p) {
  if (p.viec === 'doi_trang_thai') return doiTrangThaiCV_(p);
  return { ok: false, loi: 'Không rõ tham số viec=' + p.viec };
}

function doiTrangThaiCV_(p) {
  var id = String(p.id || '').trim();
  var tt = String(p.trang_thai || '').trim();
  if (!id) return { ok: false, loi: 'Thiếu id công việc' };
  if (TT_CHUAN.indexOf(tt) < 0) return { ok: false, loi: 'Trạng thái không hợp lệ: ' + tt };

  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('CONG_VIEC');
  if (!sh) return { ok: false, loi: 'Không thấy bảng CONG_VIEC trong PHI LONG_GROUP' };

  var v = sh.getDataRange().getValues();
  if (v.length < 2) return { ok: false, loi: 'Bảng CONG_VIEC trống' };
  var c = {};
  v[0].forEach(function (x, i) { c[String(x).trim()] = i; });
  if (c['id'] === undefined || c['trang_thai'] === undefined) {
    return { ok: false, loi: 'Bảng CONG_VIEC thiếu cột id / trang_thai' };
  }

  var dong = 0, i;
  for (i = 1; i < v.length; i++) {
    if (String(v[i][c['id']]).trim() === id) { dong = i + 1; break; }
  }
  if (!dong) return { ok: false, loi: 'Không thấy công việc id=' + id };

  var hang = v[dong - 1];
  var truoc = String(hang[c['trang_thai']] || '').trim();
  sh.getRange(dong, c['trang_thai'] + 1).setValue(tt);

  /* Hoàn thành thì đóng dấu ngày — đang làm lại thì gỡ dấu, tránh số liệu ma. */
  var ngayXong = '';
  if (c['ngay_hoan_thanh'] !== undefined) {
    if (tt === '3.Hoàn thành') {
      ngayXong = String(hang[c['ngay_hoan_thanh']] || '').trim();
      if (!ngayXong) {
        ngayXong = Utilities.formatDate(new Date(), MUI_GIO, 'dd/MM/yyyy HH:mm:ss');
        sh.getRange(dong, c['ngay_hoan_thanh'] + 1).setValue(ngayXong);
      }
    } else if (String(hang[c['ngay_hoan_thanh']] || '').trim()) {
      sh.getRange(dong, c['ngay_hoan_thanh'] + 1).setValue('');
    }
  }

  /* Ghi vết đúng kiểu nhật ký app đang dùng: -ddMM HHmm  Ai:  Trạng thái */
  if (c['nhat_ki'] !== undefined) {
    var ai = String(p.nguoi || '').trim() || 'Họp nhanh';
    var dau = Utilities.formatDate(new Date(), MUI_GIO, 'ddMM HHmm');
    var cu = String(hang[c['nhat_ki']] || '');
    sh.getRange(dong, c['nhat_ki'] + 1)
      .setValue('-' + dau + '  ' + ai + ':  ' + tt.replace(/^\d+\./, '') + '\n' + cu);
  }

  SpreadsheetApp.flush();
  return { ok: true, id: id, dong: dong, truoc: truoc, trang_thai: tt,
           ngay_hoan_thanh: ngayXong,
           luc: Utilities.formatDate(new Date(), MUI_GIO, 'HH:mm dd/MM/yyyy') };
}
