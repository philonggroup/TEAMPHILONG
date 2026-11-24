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
 * Gắn vào giaoban.gs: nhánh default của doGet đổi thành
 *   default:  return ra_(dinhTuyenThem_(p));
 *
 * ĐÃ TRIỂN KHAI: dự án "HỌP 4 NGUYÊN TẮC THỰC THI" · tệp CV_TRANG_THAI.gs
 * Phiên bản 4 lúc 08:44 24/11/2026 — URL .../exec giữ nguyên.
 *******************************************************************/

var TT_CHUAN = ['1.Chờ thực hiện', '2.Đang làm', '3.Hoàn thành'];

function dinhTuyenThem_(p) {
  if (p.viec === 'doi_trang_thai') return doiTrangThaiCV_(p);
  if (p.viec === 'doi_han') return doiHanCV_(p);
  return { ok: false, loi: 'Không rõ tham số viec=' + p.viec };
}

/* Dò đúng dòng của một id trong CONG_VIEC. Trả về cả bảng để khỏi đọc 2 lần. */
function doCongViec_(id) {
  var sh = SpreadsheetApp.openById(FILE_RA).getSheetByName('CONG_VIEC');
  if (!sh) return { loi: 'Không thấy bảng CONG_VIEC trong PHI LONG_GROUP' };
  var v = sh.getDataRange().getValues();
  if (v.length < 2) return { loi: 'Bảng CONG_VIEC trống' };
  var c = {};
  v[0].forEach(function (x, i) { c[String(x).trim()] = i; });
  if (c['id'] === undefined) return { loi: 'Bảng CONG_VIEC thiếu cột id' };
  for (var i = 1; i < v.length; i++) {
    if (String(v[i][c['id']]).trim() === id) {
      return { sh: sh, c: c, dong: i + 1, hang: v[i] };
    }
  }
  return { loi: 'Không thấy công việc id=' + id };
}

/* Ghi vết đúng kiểu nhật ký app đang dùng: -ddMM HHmm  Ai:  Nội dung */
function ghiVet_(t, noi, ai) {
  if (t.c['nhat_ki'] === undefined) return;
  var dau = Utilities.formatDate(new Date(), MUI_GIO, 'ddMM HHmm');
  var cu = String(t.hang[t.c['nhat_ki']] || '');
  t.sh.getRange(t.dong, t.c['nhat_ki'] + 1)
    .setValue('-' + dau + '  ' + (ai || 'Họp nhanh') + ':  ' + noi + '\n' + cu);
}

/* ---------------------------------------------------------------
   SỬA HẠN HOÀN THÀNH
   Cột deadline của CONG_VIEC là Ô NGÀY THẬT (số sê-ri), không phải
   chữ — cột tien_do là ARRAYFORMULA lấy F:F - NOW() nên PHẢI ghi
   bằng đối tượng Date, ghi chuỗi là hỏng cả cột tiến độ.
   Giữ nguyên giờ cũ của việc; việc chưa có giờ thì mặc định 17:30.
   --------------------------------------------------------------- */
function doiHanCV_(p) {
  var id = String(p.id || '').trim();
  var han = String(p.han || '').trim();
  if (!id) return { ok: false, loi: 'Thiếu id công việc' };
  var m = han.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { ok: false, loi: 'Hạn phải dạng yyyy-mm-dd, nhận được: ' + han };

  var t = doCongViec_(id);
  if (t.loi) return { ok: false, loi: t.loi };
  if (t.c['deadline'] === undefined) return { ok: false, loi: 'Bảng CONG_VIEC thiếu cột deadline' };

  var cu = t.hang[t.c['deadline']];
  var gio = 17, phut = 30;
  if (cu instanceof Date) { gio = cu.getHours(); phut = cu.getMinutes(); }
  var g = String(p.gio || '').match(/^(\d{1,2}):(\d{2})$/);
  if (g) { gio = Number(g[1]); phut = Number(g[2]); }

  var moi = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), gio, phut, 0);
  t.sh.getRange(t.dong, t.c['deadline'] + 1).setValue(moi);

  var truoc = (cu instanceof Date) ? Utilities.formatDate(cu, MUI_GIO, 'dd/MM/yyyy HH:mm') : String(cu || '');
  var sau = Utilities.formatDate(moi, MUI_GIO, 'dd/MM/yyyy HH:mm');
  ghiVet_(t, 'Gia hạn ' + (truoc || 'chưa có') + ' -> ' + sau, p.nguoi);
  SpreadsheetApp.flush();
  return { ok: true, id: id, dong: t.dong, truoc: truoc, han: sau,
           luc: Utilities.formatDate(new Date(), MUI_GIO, 'HH:mm dd/MM/yyyy') };
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
      var daCo = hang[c['ngay_hoan_thanh']];
      if (daCo instanceof Date) ngayXong = Utilities.formatDate(daCo, MUI_GIO, 'dd/MM/yyyy HH:mm:ss');
      else ngayXong = String(daCo || '').trim();
      if (!ngayXong) {
        /* Ghi bằng Date, KHÔNG ghi chuỗi: deadline / ngay_hoan_thanh của
           CONG_VIEC là ô ngày thật, ghi chuỗi sẽ phá kiểu cột. */
        var bayGio = new Date();
        sh.getRange(dong, c['ngay_hoan_thanh'] + 1).setValue(bayGio);
        ngayXong = Utilities.formatDate(bayGio, MUI_GIO, 'dd/MM/yyyy HH:mm:ss');
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
      .setValue('-' + dau + '  ' + ai + ':  ' + tt.substring(tt.indexOf('.') + 1) + '\n' + cu);
  }

  SpreadsheetApp.flush();
  return { ok: true, id: id, dong: dong, truoc: truoc, trang_thai: tt,
           ngay_hoan_thanh: ngayXong,
           luc: Utilities.formatDate(new Date(), MUI_GIO, 'HH:mm dd/MM/yyyy') };
}
