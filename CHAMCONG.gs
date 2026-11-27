/*******************************************************************
 * XUẤT BẢNG CHẤM CÔNG — API cho trang chamcong.html
 * Nguồn : file PHI LONG_GROUP (CHAM_CONG · NHAN_VIEN · NGHI_PHEP)
 * Dùng cho : philonggroup.github.io/TEAMPHILONG/chamcong.html
 *
 * CHỈ ĐỌC — hàm trong file này KHÔNG ghi, KHÔNG sửa, KHÔNG xoá ô nào.
 *
 * CÁCH GẮN (làm 1 lần):
 *   1. Mở file PHI LONG_GROUP → Tiện ích mở rộng → Apps Script
 *      (dự án "HỌP 4 NGUYÊN TẮC THỰC THI")
 *   2. Thêm tệp mới tên CHAMCONG.gs → dán toàn bộ file này → Lưu
 *   3. Mở tệp CV_TRANG_THAI.gs, trong hàm dinhTuyenThem_ thêm 1 dòng:
 *        if (p.viec === 'chamcong') return chamCong_(p);
 *   4. Triển khai → Quản lý triển khai → biểu tượng bút chì →
 *      Phiên bản: Phiên bản mới → Triển khai.  URL .../exec GIỮ NGUYÊN.
 *
 * Gọi thử trên trình duyệt:
 *   .../exec?khoa=PHILONG2026&viec=chamcong&thang=11&nam=2026&cn=CN3
 *
 * QUY TẮC GỘP CÔNG (Tracy chốt 19/11/2026: 1 ngày = 1 dòng/người)
 *   Dữ liệu thô hiện còn nhiều dòng cho cùng 1 người/1 ngày (lượt chấm ra
 *   tạo dòng mới). API gom tất cả lượt chấm trong ngày của một người:
 *      giờ vào = lượt sớm nhất · giờ ra = lượt muộn nhất
 *   nên bảng xuất ra luôn đúng 1 dòng/ngày dù dữ liệu thô còn trùng.
 *   Cột gio_ra của bảng thô KHÔNG được tin tuyệt đối: nhiều dòng bị ghi
 *   đúng 17:30 (mốc hết ca CA3) kể cả khi người ta chấm ra giờ khác, nên
 *   chỉ dùng gio_ra khi nó muộn hơn mọi lượt chấm khác trong ngày.
 *
 * DẤU + : lượt ra từ 17:45 trở đi (hết ca 17:30 + ân hạn 15 phút) — Tracy
 *   chốt 24/11/2026 dấu + CHỈ ghi nhận, KHÔNG nối vào lương.
 *******************************************************************/

var CC_FILE = (typeof FILE_RA !== 'undefined') ? FILE_RA
            : '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';
var CC_TZ = (typeof MUI_GIO !== 'undefined') ? MUI_GIO : 'Asia/Ho_Chi_Minh';

var CC_VAO_CA   = 7 * 60;          // 07:00 — mốc vào ca CA3
var CC_AN_HAN   = 5;               // ân hạn 5 phút (quy tắc Quỹ kết nối)
var CC_HET_CA   = 17 * 60 + 30;    // 17:30 — mốc hết ca
var CC_AN_HAN_R = 15;              // ân hạn 15 phút cho dấu +
var CC_GIO_CHUAN = 8;              // giờ công chuẩn / ngày

/* ================= ĐẦU VÀO CHÍNH ================= */
function chamCong_(p) {
  var nam   = parseInt(p.nam, 10)   || new Date().getFullYear();
  var thang = parseInt(p.thang, 10) || (new Date().getMonth() + 1);
  var cnLoc = String(p.cn || 'ALL').toUpperCase();

  var ss = SpreadsheetApp.openById(CC_FILE);
  var ns = ccNhanSu_(ss);                       // danh sách nhân sự
  var kq = ccDocChamCong_(ss, thang, nam);      // { ngay:{ma:{d:{...}}}, loi:[] }
  var np = ccDocNghiPhep_(ss, thang, nam);      // { ma: { d: 'P'|'KL'|'L' } }

  var dsMa = {};
  Object.keys(kq.ngay).forEach(function (m) { dsMa[m] = 1; });
  ns.forEach(function (x) { dsMa[x.ma] = 1; });

  var nhan_su = [];
  ns.forEach(function (x) {
    if (cnLoc !== 'ALL' && x.cn !== cnLoc) return;
    nhan_su.push(x);
  });
  /* Người có chấm công nhưng không còn trong NHAN_VIEN: vẫn trả về để không mất công */
  Object.keys(kq.ngay).forEach(function (ma) {
    var co = false;
    ns.forEach(function (x) { if (x.ma === ma) co = true; });
    if (!co) {
      var cn = ccDoanCN_(kq.cnTheoMa[ma] || '');
      if (cnLoc === 'ALL' || cn === cnLoc) {
        nhan_su.push({ ma: ma, ten: kq.tenTheoMa[ma] || ma, bo_phan: kq.cnTheoMa[ma] || '',
                       vi_tri: '', cn: cn, ngoai_ds: true });
      }
    }
  });

  var ngay = {}, nghi = {}, tomTat = {};
  nhan_su.forEach(function (x) {
    ngay[x.ma] = kq.ngay[x.ma] || {};
    nghi[x.ma] = np[x.ma] || {};
    tomTat[x.ma] = ccTomTat_(ngay[x.ma], nghi[x.ma]);
  });

  return {
    ok: true,
    thang: thang, nam: nam, cn: cnLoc,
    so_ngay: new Date(nam, thang, 0).getDate(),
    ngay_chay: Utilities.formatDate(new Date(), CC_TZ, 'dd/MM/yyyy HH:mm'),
    cau_hinh: { vao_ca: '07:00', het_ca: '17:30', an_han_vao: CC_AN_HAN,
                an_han_ra: CC_AN_HAN_R, gio_chuan: CC_GIO_CHUAN, cong_chuan_thang: 26 },
    nhan_su: nhan_su,
    ngay: ngay,
    nghi: nghi,
    tom_tat: tomTat,
    loi_du_lieu: kq.loi
  };
}

/* ================= NHÂN SỰ ================= */
function ccNhanSu_(ss) {
  var sh = ss.getSheetByName('NHAN_VIEN');
  if (!sh) return [];
  var v = sh.getDataRange().getValues();
  var c = ccCot_(v[0]);
  var ra = [];
  for (var i = 1; i < v.length; i++) {
    var ma = String(v[i][c['id']] || '').trim();
    if (!ma) continue;
    var ten = String(v[i][c['ho_va_ten']] || '').trim();
    if (/mã trùng|đã gộp/i.test(ten)) continue;          // NV033 — mã trùng, đã gộp
    var bp = String(v[i][c['phong_ban']] || '').trim();
    ra.push({
      ma: ma, ten: ten, bo_phan: bp,
      vi_tri: c['vi_tri'] !== undefined ? String(v[i][c['vi_tri']] || '').trim() : '',
      cn: ccDoanCN_(bp)
    });
  }
  return ra;
}

function ccDoanCN_(s) {
  var t = String(s || '').toUpperCase();
  if (t.indexOf('CN1') >= 0) return 'CN1';
  if (t.indexOf('CN2') >= 0) return 'CN2';
  if (t.indexOf('CN3') >= 0) return 'CN3';
  if (t.indexOf('CN5') >= 0) return 'CN5';
  return 'BGĐ';
}

function ccCot_(hang) {
  var c = {};
  hang.forEach(function (x, i) { c[String(x).trim()] = i; });
  return c;
}

/* ================= CHẤM CÔNG — GỘP 1 NGÀY 1 DÒNG ================= */
function ccDocChamCong_(ss, thang, nam) {
  var sh = ss.getSheetByName('CHAM_CONG');
  var ra = { ngay: {}, loi: [], tenTheoMa: {}, cnTheoMa: {} };
  if (!sh) { ra.loi.push({ loai: 'thieu_bang', mo_ta: 'Không thấy bảng CHAM_CONG' }); return ra; }

  var v = sh.getDataRange().getValues();
  if (v.length < 2) return ra;
  var c = ccCot_(v[0]);
  var gom = {};   // ma -> ngayTrongThang -> { luot:[phut], nguon:{}, soDong:n, ghiChu:[] }

  for (var i = 1; i < v.length; i++) {
    var d = ccNgay_(v[i][c['ngay']]);
    if (!d) d = ccNgay_(v[i][c['gio_vao']]);
    if (!d) continue;
    if (d.getMonth() + 1 !== thang || d.getFullYear() !== nam) continue;

    var ma = String(v[i][c['nhan_vien_id']] || '').trim();
    var ten = String(v[i][c['ho_va_ten']] || '').trim();
    var gc = String(v[i][c['ghi_chu']] || '').trim();

    if (!ma) {
      ra.loi.push({ loai: 'thieu_ma_nv', dong: i + 1, ngay: ccDdMm_(d),
                    id: String(v[i][c['id']] || ''),
                    mo_ta: 'Dòng chấm công không có mã nhân viên — không tính được cho ai' });
      continue;
    }
    /* Dòng đã bị đánh dấu là dòng trùng / dòng lỗi trong lần vá trước: bỏ qua lượt,
       nhưng vẫn ghi nhận để báo cáo. */
    var boQua = /DÒNG TRÙNG|DÒNG LỖI|KHÔNG TÍNH CÔNG/i.test(gc);

    if (ten) ra.tenTheoMa[ma] = ten;
    var bp = String(v[i][c['phong_ban']] || '').trim();
    if (bp) ra.cnTheoMa[ma] = bp;

    var k = d.getDate();
    if (!gom[ma]) gom[ma] = {};
    if (!gom[ma][k]) gom[ma][k] = { luot: [], nguon: {}, soDong: 0, boQua: 0, ghiChu: [], ca: '' };
    var o = gom[ma][k];
    o.soDong++;
    if (boQua) { o.boQua++; if (gc) o.ghiChu.push(gc); continue; }

    var ca = String(v[i][c['ca_lam_viec']] || '').trim();
    if (ca) o.ca = ca;
    var ng = String(v[i][c['nguon_cham']] || '').trim();
    if (ng) o.nguon[ng] = 1;
    if (gc) o.ghiChu.push(gc);

    var tv = ccPhut_(v[i][c['gio_vao']], d);
    var tr = ccPhut_(v[i][c['gio_ra']], d);
    if (tv !== null) o.luot.push(tv);
    /* gio_ra chỉ nhận khi muộn hơn gio_vao của chính dòng đó (tránh ô bị ghi 17:30 lùi) */
    if (tr !== null && (tv === null || tr > tv)) o.luot.push(tr);
  }

  /* Dựng kết quả 1 ngày = 1 dòng */
  Object.keys(gom).forEach(function (ma) {
    ra.ngay[ma] = {};
    Object.keys(gom[ma]).forEach(function (k) {
      var o = gom[ma][k];
      o.luot.sort(function (a, b) { return a - b; });
      var vao = o.luot.length ? o.luot[0] : null;
      var raa = o.luot.length > 1 ? o.luot[o.luot.length - 1] : null;
      var cb = [];
      var gio = 0, cong = 0, dauCong = 0;

      if (vao === null) {
        cb.push('khong_co_luot');
      } else {
        if (vao > CC_VAO_CA + CC_AN_HAN) cb.push('tre');
        if (raa === null) { cb.push('thieu_ra'); }
        else {
          gio = Math.round((raa - vao) / 6) / 10;        // 1 chữ số thập phân
          cong = 1;
          if (gio < CC_GIO_CHUAN) cb.push('duoi_8h');
          if (raa >= CC_HET_CA + CC_AN_HAN_R) dauCong = 1;
        }
      }
      if (o.soDong > 2) cb.push('nhieu_dong');
      if (o.boQua) cb.push('co_dong_trung');

      ra.ngay[ma][k] = {
        vao: vao === null ? '' : ccHhMm_(vao),
        ra:  raa === null ? '' : ccHhMm_(raa),
        gio: gio,
        cong: cong,
        dau_cong: dauCong,
        so_luot: o.luot.length,
        so_dong: o.soDong,
        ca: o.ca,
        nguon: Object.keys(o.nguon).join(','),
        canh_bao: cb,
        ghi_chu: o.ghiChu.join(' | ')
      };

      if (cb.indexOf('thieu_ra') >= 0) {
        ra.loi.push({ loai: 'thieu_gio_ra', ma: ma, ngay: k + '/' + thang,
                      mo_ta: 'Có giờ vào ' + ccHhMm_(vao) + ' nhưng không có lượt chấm ra' });
      }
      if (o.soDong > 2) {
        ra.loi.push({ loai: 'nhieu_dong', ma: ma, ngay: k + '/' + thang,
                      mo_ta: o.soDong + ' dòng chấm công trong cùng 1 ngày (chuẩn: 1 dòng)' });
      }
    });
  });
  return ra;
}

/* ================= NGHỈ PHÉP ================= */
function ccDocNghiPhep_(ss, thang, nam) {
  var sh = ss.getSheetByName('NGHI_PHEP');
  var ra = {};
  if (!sh) return ra;
  var v = sh.getDataRange().getValues();
  if (v.length < 2) return ra;
  var c = ccCot_(v[0]);
  for (var i = 1; i < v.length; i++) {
    var ma = String(v[i][c['nhan_vien_id']] || '').trim();
    if (!ma) continue;
    var tt = String(v[i][c['trang_thai']] || '').trim().toLowerCase();
    if (tt && /từ chối|khong duyet|không duyệt|huỷ|huy/.test(tt)) continue;
    var d1 = ccNgay_(v[i][c['ngay_yeu_cau']]);
    var d2 = ccNgay_(v[i][c['toi_ngay']]) || d1;
    if (!d1) continue;
    var loai = String(v[i][c['loai_nghi']] || '').trim();
    var ma_loai = /lễ|le/i.test(loai) ? 'L' : (/không lương|khong luong|kl/i.test(loai) ? 'KL' : 'P');
    var t = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
    var het = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
    var dem = 0;
    while (t <= het && dem < 400) {
      if (t.getMonth() + 1 === thang && t.getFullYear() === nam) {
        if (!ra[ma]) ra[ma] = {};
        ra[ma][t.getDate()] = ma_loai;
      }
      t = new Date(t.getTime() + 86400000);
      dem++;
    }
  }
  return ra;
}

/* ================= TÓM TẮT THÁNG ================= */
function ccTomTat_(ngay, nghi) {
  var t = { cong: 0, gio: 0, dau_cong: 0, tre: 0, thieu_ra: 0, duoi_8h: 0,
            nghi_p: 0, nghi_kl: 0, nghi_le: 0, ngay_co_cham: 0 };
  Object.keys(ngay || {}).forEach(function (k) {
    var o = ngay[k];
    t.ngay_co_cham++;
    t.cong += o.cong;
    t.gio += o.gio;
    t.dau_cong += o.dau_cong;
    if (o.canh_bao.indexOf('tre') >= 0) t.tre++;
    if (o.canh_bao.indexOf('thieu_ra') >= 0) t.thieu_ra++;
    if (o.canh_bao.indexOf('duoi_8h') >= 0) t.duoi_8h++;
  });
  Object.keys(nghi || {}).forEach(function (k) {
    if (nghi[k] === 'P') t.nghi_p++;
    else if (nghi[k] === 'KL') t.nghi_kl++;
    else if (nghi[k] === 'L') t.nghi_le++;
  });
  t.gio = Math.round(t.gio * 10) / 10;
  return t;
}

/* ================= TIỆN ÍCH NGÀY / GIỜ ================= */
function ccNgay_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v.getTime()) ? null : v;
  }
  var s = String(v).trim();
  var m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);
  m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  var d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/* Trả về số phút trong ngày của một ô ngày-giờ. null nếu không có giờ. */
function ccPhut_(v, ngayGoc) {
  if (v === null || v === undefined || v === '') return null;
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return null;
    return v.getHours() * 60 + v.getMinutes();
  }
  var s = String(v).trim();
  var m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return (+m[1]) * 60 + (+m[2]);
  m = s.match(/(\d{1,2})[hH](\d{1,2})?/);
  if (m) return (+m[1]) * 60 + (m[2] ? +m[2] : 0);
  return null;
}

function ccHhMm_(p) {
  var h = Math.floor(p / 60), m = p % 60;
  return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
}
function ccDdMm_(d) {
  return Utilities.formatDate(d, CC_TZ, 'dd/MM/yyyy');
}

/* Chạy tay trong Apps Script để soi kết quả trước khi deploy */
function ccChayThu() {
  var r = chamCong_({ thang: 11, nam: 2026, cn: 'CN3' });
  Logger.log('Nhân sự: ' + r.nhan_su.length + ' · lỗi dữ liệu: ' + r.loi_du_lieu.length);
  Logger.log(JSON.stringify(r.tom_tat, null, 2));
}
