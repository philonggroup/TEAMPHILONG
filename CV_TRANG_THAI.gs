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
 * Phiên bản 5 lúc 09:11 24/11/2026 — URL .../exec giữ nguyên.
 * Bản đang chạy giống hệt file này về mã; chỉ khác phần chú thích đầu file
 * (bị vỡ chữ lúc sửa trong trình soạn) — sẽ dọn ở lần deploy sau.
 *******************************************************************/

var TT_CHUAN = ['1.Chờ thực hiện', '2.Đang làm', '3.Hoàn thành'];

function dinhTuyenThem_(p) {
  if (p.viec === 'chamcong') return chamCong_(p);          /* CHAMCONG.gs — chỉ đọc */
  if (p.viec === 'doi_trang_thai') return doiTrangThaiCV_(p);
  if (p.viec === 'doi_han') return doiHanCV_(p);
  if (p.viec === 'them_cong_viec') return themCongViecCV_(p);
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

/* ---------------------------------------------------------------
   THÊM VIỆC MỚI VÀO CONG_VIEC — luồng Vấn đề (IDS) → Hành động
   Tracy chốt 24/11/2026: hành động chốt tại IDS rơi vào Danh sách
   hành động, bấm trạng thái là ghi thẳng thành việc trên app.

   Chỉ THÊM một dòng mới, không sửa dòng nào đang có.
   deadline và ngay_tao ghi bằng Date vì là ô ngày thật.
   --------------------------------------------------------------- */
function themCongViecCV_(p) {
  var ten = String(p.ten || '').replace(/\s+/g, ' ').trim();
  var maNV = String(p.ai || '').trim();
  var han = String(p.han || '').trim();
  var tt = String(p.trang_thai || '1.Chờ thực hiện').trim();
  if (!ten) return { ok: false, loi: 'Thiếu tên công việc' };
  if (!maNV) return { ok: false, loi: 'Thiếu người phụ trách' };
  if (TT_CHUAN.indexOf(tt) < 0) return { ok: false, loi: 'Trạng thái không hợp lệ: ' + tt };
  var m = han.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return { ok: false, loi: 'Hạn phải dạng yyyy-mm-dd, nhận được: ' + han };

  var ss = SpreadsheetApp.openById(FILE_RA);
  var shNV = ss.getSheetByName('NHAN_VIEN');
  if (!shNV) return { ok: false, loi: 'Không thấy bảng NHAN_VIEN' };
  var vNV = shNV.getRange(1, 1, shNV.getLastRow(), 10).getValues();
  var cNV = {};
  vNV[0].forEach(function (x, i) { cNV[String(x).trim()] = i; });
  var ai = '', ban = '', i;
  for (i = 1; i < vNV.length; i++) {
    if (String(vNV[i][cNV['id']]).trim() === maNV) {
      ai = String(vNV[i][cNV['ho_va_ten']] || '').trim();
      ban = String(vNV[i][cNV['phong_ban']] || '').replace(/\s+/g, ' ').trim();
      break;
    }
  }
  if (!ai) return { ok: false, loi: 'Không thấy nhân sự mã ' + maNV + ' trong NHAN_VIEN' };

  var sh = ss.getSheetByName('CONG_VIEC');
  if (!sh) return { ok: false, loi: 'Không thấy bảng CONG_VIEC' };
  var de = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var c = {};
  de.forEach(function (x, j) { c[String(x).trim()] = j; });
  if (c['id'] === undefined || c['ten_cong_viec'] === undefined) {
    return { ok: false, loi: 'Bảng CONG_VIEC thiếu cột id / ten_cong_viec' };
  }

  var nay = new Date();
  var id = 'CV' + Utilities.formatDate(nay, MUI_GIO, 'yyMMdd-HHmmss');
  var hang = new Array(de.length).fill('');
  function dat(ten2, gt) { if (c[ten2] !== undefined) hang[c[ten2]] = gt; }
  dat('id', id);
  dat('loai_cong_viec', String(p.way || '').trim());
  dat('ten_cong_viec', ten);
  dat('ten_khach_hang', String(p.chi_so || '').trim());
  dat('mo_ta_cong_viec', String(p.mo_ta || '').trim());
  dat('deadline', new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 17, 30, 0));
  dat('nguoi_phu_trach', maNV);
  dat('ho_va_ten', ai);
  dat('phong_ban', ban);
  dat('trang_thai', tt);
  dat('ngay_tao', nay);
  dat('nguoi_tao', String(p.nguoi || 'Họp nhanh').trim());
  dat('nhat_ki', '-' + Utilities.formatDate(nay, MUI_GIO, 'ddMM HHmm') + '  ' +
      String(p.nguoi || 'Họp nhanh').trim() + ':  Tạo từ Vấn đề (IDS)\n');
  sh.appendRow(hang);
  SpreadsheetApp.flush();
  return { ok: true, id: id, dong: sh.getLastRow(), ho_va_ten: ai, phong_ban: ban,
           trang_thai: tt, han: Utilities.formatDate(nay, MUI_GIO, 'HH:mm dd/MM/yyyy') };
}
