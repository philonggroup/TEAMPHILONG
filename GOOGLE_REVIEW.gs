/* ===================================================================
   PHI LONG AUTO — GOOGLE_REVIEW.gs
   Nối nguồn Google Maps cho trang giao ban (giaoban.html)

   TRẢ VỀ ĐƯỢC (Google cho phép):
     - điểm sao hiện tại
     - tổng số đánh giá
     - số đánh giá MỚI trong 7 ngày (tự tính bằng cách so với ảnh chụp tuần trước)
     - sao tăng/giảm so với tuần trước
     - số đánh giá mới từ 3 sao trở xuống  -> cờ báo động khiếu nại

   KHÔNG trả về được:
     - danh sách từng lời khen / khiếu nại và trạng thái đã trả lời hay chưa.
       Muốn vậy phải dùng Google Business Profile API: không mở công khai,
       phải xin quyền và Google xét trong 14 ngày.
     - Place Details chỉ trả tối đa 5 đánh giá gần nhất. Tuần nào có hơn
       5 đánh giá mới thì cờ "3 sao trở xuống" chỉ soi được 5 cái gần nhất
       -> dùng làm BÁO ĐỘNG, không dùng làm số đếm chính thức.

   ĐẶT Ở DỰ ÁN APPS SCRIPT RIÊNG. Không dán chung Code.gs của trang giao ban
   (hai doGet trong một dự án sẽ đè nhau).

   CÀI 6 BƯỚC
     1. script.google.com -> New project -> dán toàn bộ file này.
     2. Chạy 1 lần hàm  caiKhoaAPI('AIza...')  để lưu khoá Places API.
        (Google Cloud: bật Places API (New), tạo API key, giới hạn key theo
         đúng API này + đặt hạn mức để không bao giờ phát sinh tiền.)
     3. Gắn hồ sơ Google cho từng chi nhánh — chỉ cần LINK, chạy 3 lần:
          ganLink('CN1', 'https://maps.app.goo.gl/...')
          ganLink('CN2', '...')      ganLink('CN3', '...')
        Mỗi lần chạy, Execution log in ra tên - địa chỉ - số sao của hồ sơ
        vừa gắn: ĐỌC ĐỐI CHIẾU, sai chi nhánh thì chạy lại với link đúng.
        (Cách cũ vẫn dùng được: điền placeId hoặc tim vào DS_CN bên dưới.)
     4. Chạy  xemCauHinh()  -> xem đã đủ khoá + đủ 3 hồ sơ chưa.
     5. Chạy 1 lần hàm  taoTrigger()  -> chụp ảnh số liệu mỗi ngày 6:00.
        7 ngày đầu chưa có mốc cũ nên trang ghi "chưa đủ mốc 7 ngày"; từ
        ngày thứ 8 mới có số "đánh giá mới trong tuần". Đây là đúng, không
        phải lỗi: Google không cho đọc lịch sử, phải tự chụp mới so được.
     6. Deploy -> New deployment -> Web app
          Execute as: Me   |   Who has access: Anyone
        Copy URL .../exec  -> dán vào CAU_HINH.API_GOOGLE trong giaoban.html.

   KIỂM CHỨNG: chạy hàm  thuNgay()  rồi xem Execution log.

   LƯU Ý TIỀN: field "reviews" nằm ở gói đắt hơn (Enterprise) so với
   rating / userRatingCount. Cách chạy ở đây là 3 chi nhánh × tối đa
   ~5 lần/ngày ≈ 450 lượt/tháng, nằm trong mức miễn phí, nhưng vẫn nên
   đặt hạn mức cho API key trong Google Cloud.
   =================================================================== */

/* ---------- 1. CẤU HÌNH — CHỈ SỬA Ở ĐÂY ---------- */

var KHOA = 'PHILONG2026';   // phải khớp CAU_HINH.KHOA trong giaoban.html

/* Mỗi chi nhánh điền 1 trong 2:
     placeId : chính xác nhất, không bao giờ dò sai  (ưu tiên)
     tim     : "tên + địa chỉ" để script tự dò ra placeId rồi nhớ luôn
   link      : link hồ sơ Google để bấm "Mở Google" tại họp (để trống thì
               script tự lấy googleMapsUri của Google).                     */
/* Chuỗi "tim" dưới đây điền theo 3 địa chỉ chi nhánh trên philongauto.com.
   TRACY XÁC NHẬN THỨ TỰ trước khi tin số: chi nhánh 01 / 02 / 03 trên web có
   đúng là PHI LONG 1 / 2 / 3 trong hệ thống báo cáo không. Chạy xemCauHinh()
   rồi đọc log tên - địa chỉ - số sao để đối chiếu, sai thì chạy
   ganLink('CN?', 'link Google đúng') là ghi đè lại.                        */
var DS_CN = [
  { ma: 'CN1', ten: 'PHI LONG 1', placeId: '',
    tim: 'Lốp xe Phi Long 561 Phú Riềng Đỏ, Phường Tân Bình, TP Đồng Xoài, Bình Phước', link: '' },
  { ma: 'CN2', ten: 'PHI LONG 2', placeId: '',
    tim: 'Lốp xe Phi Long 310 Quốc lộ 14, Phường Tân Đồng, TP Đồng Xoài, Bình Phước', link: '' },
  { ma: 'CN3', ten: 'PHI LONG 3', placeId: '',
    tim: 'Michelin Car Service Phi Long 1692 Mỹ Phước Tân Vạn, Phường Hiệp Thành, TP Thủ Dầu Một',
    link: 'https://maps.app.goo.gl/gsfkMsZrszv9CRdx5' }
];

var CACHE_PHUT = 360;   // gọi Places API nhiều nhất 1 lần / 6 giờ (giữ trong hạn miễn phí)
var NGUONG_XAU = 3;     // đánh giá <= 3 sao coi là tín hiệu khiếu nại

/* ---------- 2. Khoá API ---------- */

function caiKhoaAPI(khoa) {
  if (!khoa) throw new Error('Truyền khoá vào: caiKhoaAPI("AIza...")');
  PropertiesService.getScriptProperties().setProperty('PLACES_API_KEY', String(khoa).trim());
  Logger.log('Đã lưu khoá Places API.');
}

function layKhoaAPI_() {
  var k = PropertiesService.getScriptProperties().getProperty('PLACES_API_KEY');
  if (!k) throw new Error('Chưa có khoá. Chạy caiKhoaAPI("AIza...") một lần.');
  return k;
}

/* ---------- 2b. Gắn chi nhánh vào hồ sơ Google chỉ bằng 1 LINK ----------
   Có link Google của chi nhánh là xong, không cần tự đi tìm placeId.
   Chạy 1 lần cho mỗi chi nhánh, dán link lấy từ nút Chia sẻ trên Google Maps:

       ganLink('CN1', 'https://maps.app.goo.gl/xxxxxxxx')

   Script tự mở link, dò ra placeId, lưu lại, rồi IN RA LOG tên - địa chỉ -
   số sao của hồ sơ vừa gắn. ĐỌC LOG ĐỐI CHIẾU: đúng chi nhánh mới dùng,
   sai thì chạy lại ganLink với link khác.                                  */
function ganLink(ma, link) {
  if (!ma || !link) throw new Error('Dùng: ganLink("CN1","https://maps.app.goo.gl/...")');
  var url = String(link).trim(), pid = '', m;

  m = /[?&!]place_id[=:]([A-Za-z0-9_\-]+)/.exec(url);
  if (m) pid = m[1];

  if (!pid && /goo\.gl\//.test(url)) {           // link rút gọn -> lấy link dài
    var r = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
    var h = r.getAllHeaders() || {};
    var loc = h['Location'] || h['location'] || '';
    if (loc) url = String(loc);
    else {
      var r2 = UrlFetchApp.fetch(url, { followRedirects: true, muteHttpExceptions: true });
      url = (r2.getContentText() || '').slice(0, 20000) + ' ' + url;
    }
    m = /[?&!]place_id[=:]([A-Za-z0-9_\-]+)/.exec(url);
    if (m) pid = m[1];
  }

  if (!pid) {                                     // còn lại: dò bằng tên trong link
    m = /\/maps\/place\/([^\/\?&"]+)/.exec(url);
    if (!m) throw new Error('Không đọc được địa điểm từ link. Mở link trên máy tính, ' +
      'copy link dài trên thanh địa chỉ (có /maps/place/...) rồi chạy lại, ' +
      'hoặc điền "tên + địa chỉ" vào DS_CN[].tim.');
    pid = doPlaceId_(decodeURIComponent(m[1].replace(/\+/g, ' ')) + ' Việt Nam');
  }

  var d = chiTietPlace_(pid);
  PropertiesService.getScriptProperties().setProperty('PID_' + ma, pid);
  Logger.log('ĐÃ GẮN ' + ma + ' → ' + ((d.displayName && d.displayName.text) || '?') +
             ' · ' + (d.rating || '—') + '★ · ' + (d.userRatingCount || 0) + ' đánh giá' +
             '\n   Google: ' + (d.googleMapsUri || '—') +
             '\n   placeId: ' + pid +
             '\nSAI CHI NHÁNH → chạy lại ganLink("' + ma + '", link đúng).');
  return pid;
}

/* In tình trạng cấu hình để đối chiếu TRƯỚC khi deploy. */
function xemCauHinh() {
  var p = PropertiesService.getScriptProperties();
  var ra = ['KHOA: ' + KHOA,
            'Khoá Places API: ' + (p.getProperty('PLACES_API_KEY') ? 'đã có' : 'CHƯA CÓ — chạy caiKhoaAPI()'),
            'Sheet lưu lịch sử: ' + (p.getProperty('SHEET_ID') || 'không dùng')];
  DS_CN.forEach(function (cn) {
    var pid = cn.placeId || p.getProperty('PID_' + cn.ma) || '';
    var ls = docLS_(cn.ma);
    ra.push(cn.ma + ' (' + cn.ten + '): ' +
            (pid ? ('placeId ' + pid) : 'CHƯA GẮN HỒ SƠ GOOGLE — chạy ganLink("' + cn.ma + '", link)') +
            ' · ' + ls.length + ' mốc lịch sử' + (ls.length ? (', mốc đầu ' + ls[0].d) : '') +
            (ls.length >= 7 ? '' : ' (chưa đủ 7 ngày để tính "đánh giá mới trong tuần")'));
  });
  Logger.log(ra.join('\n'));
}

/* ---------- 3. Gọi Google ---------- */

/* Dò placeId từ chuỗi "tên + địa chỉ". Chạy rất ít lần vì kết quả được nhớ lại. */
function doPlaceId_(q) {
  var r = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'X-Goog-Api-Key': layKhoaAPI_(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
    },
    payload: JSON.stringify({ textQuery: q, languageCode: 'vi', regionCode: 'VN' }),
    muteHttpExceptions: true
  });
  var j = JSON.parse(r.getContentText() || '{}');
  if (!j.places || !j.places.length) throw new Error('Không dò được địa điểm cho: ' + q);
  var p = j.places[0];
  Logger.log('Dò được: ' + (p.displayName && p.displayName.text) + ' — ' + p.formattedAddress + ' — ' + p.id);
  return p.id;
}

function chiTietPlace_(placeId) {
  var url = 'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId);
  var r = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'X-Goog-Api-Key': layKhoaAPI_(),
      'X-Goog-FieldMask': 'id,displayName,rating,userRatingCount,googleMapsUri,reviews'
    },
    muteHttpExceptions: true
  });
  var t = r.getContentText() || '{}';
  if (r.getResponseCode() !== 200) throw new Error('Places API ' + r.getResponseCode() + ': ' + t.slice(0, 200));
  return JSON.parse(t);
}

/* ---------- 4. Lịch sử số liệu (để tính "mới trong tuần") ---------- */

function khoaLS_(ma) { return 'LS_' + ma; }

function docLS_(ma) {
  var s = PropertiesService.getScriptProperties().getProperty(khoaLS_(ma));
  try { return s ? JSON.parse(s) : []; } catch (e) { return []; }
}

function ghiLS_(ma, ds) {
  if (ds.length > 60) ds = ds.slice(ds.length - 60);
  PropertiesService.getScriptProperties().setProperty(khoaLS_(ma), JSON.stringify(ds));
}

function ngayISO_(d) {
  return Utilities.formatDate(d || new Date(), 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
}

/* Ghi 1 ảnh chụp / ngày. Cùng ngày gọi lại thì ghi đè, không nhân dòng.
   Lần nào Google không trả về số (tong = null) thì KHÔNG ghi, để lịch sử
   không bị dính mốc rỗng làm sai số "mới trong tuần". */
function chupAnh_(ma, rating, tong) {
  var ds = docLS_(ma), hn = ngayISO_();
  if (tong === null || tong === undefined) return ds;
  if (ds.length && ds[ds.length - 1].d === hn) {
    ds[ds.length - 1] = { d: hn, r: rating, n: tong };
  } else {
    ds.push({ d: hn, r: rating, n: tong });
  }
  ghiLS_(ma, ds);
  return ds;
}

/* Ảnh chụp gần nhất mà cách hôm nay từ 7 ngày trở lên.
   Bỏ qua mốc không có số (lịch sử cũ có thể còn n = null). */
function anhTuanTruoc_(ds) {
  var moc = new Date(); moc.setDate(moc.getDate() - 7);
  var mocS = ngayISO_(moc), ketQua = null;
  for (var i = 0; i < ds.length; i++) {
    if (ds[i].n === null || ds[i].n === undefined) continue;
    if (ds[i].d <= mocS) ketQua = ds[i];
  }
  return ketQua;
}

/* ---------- 5. Tổng hợp 1 chi nhánh ---------- */

function motChiNhanh_(cn) {
  var props = PropertiesService.getScriptProperties();

  var pid = cn.placeId || props.getProperty('PID_' + cn.ma) || '';
  if (!pid) {
    if (!cn.tim) return { ma: cn.ma, ten: cn.ten, loi: 'chua-cau-hinh' };
    pid = doPlaceId_(cn.tim);
    props.setProperty('PID_' + cn.ma, pid);
  }

  var d = chiTietPlace_(pid);
  var rating = (typeof d.rating === 'number') ? d.rating : null;
  var tong = (typeof d.userRatingCount === 'number') ? d.userRatingCount : null;

  var ds = chupAnh_(cn.ma, rating, tong);
  var truoc = anhTuanTruoc_(ds);

  // Đếm đánh giá <= 3 sao xuất hiện trong 7 ngày (chỉ soi được 5 cái gần nhất)
  var xauMoi = 0, nhanXau = [], gioiHan5 = false;
  var bay = new Date(); bay.setDate(bay.getDate() - 7);
  var rv = d.reviews || [];
  if (rv.length >= 5) gioiHan5 = true;
  rv.forEach(function (r) {
    var t = r.publishTime ? new Date(r.publishTime) : null;
    if (t && t >= bay && typeof r.rating === 'number' && r.rating <= NGUONG_XAU) {
      xauMoi++;
      nhanXau.push({ sao: r.rating, ngay: ngayISO_(t) });
    }
  });

  return {
    ma: cn.ma,
    ten: cn.ten,
    placeId: pid,
    sao: rating,
    tong: tong,
    moiTuan: (truoc && typeof truoc.n === 'number' && tong !== null && tong !== undefined)
      ? (tong - truoc.n) : null,
    deltaSao: (truoc && typeof truoc.r === 'number' && rating !== null && rating !== undefined)
      ? Math.round((rating - truoc.r) * 100) / 100 : null,
    xauMoi: xauMoi,
    chiTietXau: nhanXau,
    chiSoi5: gioiHan5,
    link: cn.link || d.googleMapsUri || ''
  };
}

/* ---------- 6. Dữ liệu trả ra (có nhớ tạm 6 giờ) ---------- */

function layDuLieu_(buocMoi) {
  var cache = CacheService.getScriptCache();
  if (!buocMoi) {
    var c = cache.get('GG');
    if (c) { var o = JSON.parse(c); o.tuCache = true; return o; }
  }

  var ra = { ok: true, capnhat: Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM HH:mm'), cn: [] };
  DS_CN.forEach(function (cn) {
    try { ra.cn.push(motChiNhanh_(cn)); }
    catch (e) { ra.cn.push({ ma: cn.ma, ten: cn.ten, loi: String(e.message || e) }); }
  });

  cache.put('GG', JSON.stringify(ra), Math.min(CACHE_PHUT * 60, 21600)); // CacheService tối đa 6 giờ
  ghiSheetNeuCo_(ra);
  return ra;
}

/* Tuỳ chọn: lưu lịch sử ra Google Sheet để đối chiếu.
   Chạy caiSheet('<ID sheet>') một lần nếu muốn. Tab GOOGLE_REVIEW tự tạo. */
function caiSheet(id) {
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', String(id).trim());
}

/* Mỗi chi nhánh 1 dòng / ngày: trong ngày gọi lại thì GHI ĐÈ đúng dòng đó.
   Trang giao ban mở nhiều lần trong ngày nên nếu cứ appendRow thì tab này
   phình ra 3-4 dòng mỗi chi nhánh mỗi ngày, đối chiếu lại không đọc được. */
function ghiSheetNeuCo_(ra) {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) return;
  try {
    var ss = SpreadsheetApp.openById(id);
    var sh = ss.getSheetByName('GOOGLE_REVIEW');
    if (!sh) {
      sh = ss.insertSheet('GOOGLE_REVIEW');
      sh.appendRow(['Ngày', 'Giờ', 'Chi nhánh', 'Sao', 'Tổng đánh giá', 'Mới 7 ngày', 'Sao +/-', '<=3 sao mới', 'Place ID']);
    }
    var hn = ngayISO_();
    var n = sh.getLastRow();
    var cu = n > 1 ? sh.getRange(1, 1, n, 3).getValues() : [];
    ra.cn.forEach(function (c) {
      if (c.loi) return;
      var hang = [hn, ra.capnhat, c.ten, c.sao, c.tong, c.moiTuan, c.deltaSao, c.xauMoi, c.placeId];
      var oDong = 0;
      for (var i = cu.length - 1; i >= 1; i--) {
        var d = cu[i][0];
        var dS = (d instanceof Date) ? ngayISO_(d) : String(d).trim();
        if (dS === hn && String(cu[i][2]).trim() === String(c.ten).trim()) { oDong = i + 1; break; }
      }
      if (oDong) sh.getRange(oDong, 1, 1, hang.length).setValues([hang]);
      else sh.appendRow(hang);
    });
  } catch (e) {
    Logger.log('Không ghi được sheet: ' + e);
  }
}

/* ---------- 7. Web App ---------- */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var ra;
  if (p.khoa !== KHOA) ra = { ok: false, loi: 'sai-khoa' };
  else {
    try { ra = layDuLieu_(p.moi === '1'); }
    catch (err) { ra = { ok: false, loi: String(err.message || err) }; }
  }
  return ContentService.createTextOutput(JSON.stringify(ra))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- 8. Lịch chạy + kiểm chứng tay ---------- */

function taoTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'chupHangNgay') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('chupHangNgay').timeBased().atHour(6).everyDays(1)
    .inTimezone('Asia/Ho_Chi_Minh').create();
  Logger.log('Đã đặt lịch chụp số liệu mỗi ngày 6:00.');
}

function chupHangNgay() { layDuLieu_(true); }

function thuNgay() { Logger.log(JSON.stringify(layDuLieu_(true), null, 2)); }
