# -*- coding: utf-8 -*-
import json, io, sys

screens = json.load(open('screens.json', encoding='utf-8'))
app = open('app.js', encoding='utf-8').read()

BUOC = ['GB1CheckIn','GB2ViecCu','Main','GB3BinhDuong','GB3BinhPhuoc','GB3ChiNhanh3',
        'GB4VinhDanh','GB5HoTro','GB6ChotViec','GB7ThongDiep','GB8ChamDiem','GB9Wifle']
TABS  = ['TabChiNhanh','TabKhachHang','TabTongKet']
DT    = ['DTQuanLy','DTTuVan','DTKyThuat']

byid = {s['id']: s for s in screens}
thutu = BUOC + TABS + DT

opts = []
for g, ten in [(BUOC,'9 bước giao ban'), (TABS,'Các tab khác'), (DT,'Màn điện thoại nhân sự')]:
    opts.append('<optgroup label="%s">' % ten)
    for i in g:
        opts.append('<option value="%s">%s</option>' % (i, byid[i]['title']))
    opts.append('</optgroup>')
opts = ''.join(opts)

HEAD = '''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Giao ban tuần · Phi Long Auto</title>
<meta name="description" content="Trang giao ban tuần 9 bước / 60 phút của Phi Long Auto. Số liệu đọc live từ 3 workbook hệ thống chuẩn CN1/CN2/CN3, kết quả họp ghi về file PHI LONG_GROUP.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  :root { --pl-xanh-dam:#17365D; --pl-xanh:#2F75B5; --pl-nen:#F4F7FA; --pl-vang:#F2B705; }
  * { -webkit-text-size-adjust: 100%; }
  html, body { margin: 0; padding: 0; background: #0E2340; }
  body { font-family: 'Be Vietnam Pro', Arial, Helvetica, sans-serif; }

  /* Thanh điều hướng của trang web (nằm NGOÀI khung demo, ẩn được) */
  .pl-bar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 10px;
            padding: 6px 10px; background: #0E2340; color: #fff; font-size: 13px; min-height: 36px;
            box-sizing: border-box; flex-wrap: wrap; }
  .pl-bar b { font-weight: 800; letter-spacing: .5px; white-space: nowrap; }
  .pl-bar select { font: inherit; font-size: 13px; padding: 5px 8px; border-radius: 6px;
                   border: 1px solid #2F75B5; background: #17365D; color: #fff; max-width: 60vw; }
  .pl-bar button { font: inherit; font-size: 12px; font-weight: 700; min-height: 30px; padding: 0 10px;
                   border-radius: 6px; border: 1px solid #2F75B5; background: #17365D; color: #fff; cursor: pointer; }
  .pl-bar button:hover { background: #2F75B5; }
  .pl-bar .pl-ghi { color: #B9CCE3; font-size: 12px; }
  body.pl-an-thanh .pl-bar { display: none; }
  .pl-hien-lai { position: fixed; left: 8px; bottom: 8px; z-index: 60; display: none;
                 font: 700 12px 'Be Vietnam Pro', Arial, sans-serif; min-height: 32px; padding: 0 10px;
                 border-radius: 6px; border: 1px solid #2F75B5; background: #17365D; color: #fff; cursor: pointer; }
  body.pl-an-thanh .pl-hien-lai { display: block; }

  /* Khung màn demo: giữ nguyên kích thước thật rồi thu theo bề rộng thiết bị */
  .pl-screen { display: none; margin: 0 auto; overflow: hidden; }
  .pl-screen.pl-on { display: block; }
  .pl-frame { transform-origin: top left; }
  .pl-dt-hang { display: flex; gap: 30px; }

  @media print {
    .pl-bar, .pl-hien-lai { display: none !important; }
    .pl-screen { display: block !important; page-break-after: always; }
  }
</style>
</head>
<body>
<div class="pl-bar">
  <b>PHI LONG AUTO · GIAO BAN TUẦN</b>
  <select id="pl-chon" aria-label="Chọn màn hình">''' + opts + '''</select>
  <button type="button" id="pl-truoc">← Bước trước</button>
  <button type="button" id="pl-sau">Bước sau →</button>
  <button type="button" id="pl-moi">⟳ Làm mới số</button>
  <button type="button" id="pl-an">Ẩn thanh</button>
  <span class="pl-ghi" id="pl-trangthai"></span>
</div>
<button type="button" class="pl-hien-lai" id="pl-hien">Hiện thanh điều hướng</button>
'''

parts = [HEAD]
for sid in thutu:
    s = byid[sid]
    parts.append(
        '\n<section class="pl-screen" id="sc-%s" data-w="%d" data-h="%d" data-total="%d" data-title="%s">'
        '<div class="pl-frame">%s</div></section>\n' % (
            s['id'], s['w'], s['h'], s['total'],
            s['title'].replace('"', '&quot;'), s['html'])
    )

TAIL = '''
<script>
/* Danh sách thứ tự 9 bước để nút "Bước trước / Bước sau" đi đúng nhịp họp */
var PL_THU_TU = ''' + json.dumps(BUOC + TABS + DT, ensure_ascii=False) + ''';
</script>
<script>
''' + app + '''
/* ---------- 9. Thanh điều hướng của trang (ngoài khung demo) ---------- */
(function () {
  function hienTai() { var s = document.querySelector('.pl-screen.pl-on'); return s ? s.id.replace('sc-', '') : PL_THU_TU[0]; }
  function di(buoc) {
    var i = PL_THU_TU.indexOf(hienTai());
    var j = Math.max(0, Math.min(PL_THU_TU.length - 1, (i < 0 ? 0 : i) + buoc));
    location.hash = '#' + PL_THU_TU[j];
  }
  function dongBoChon() {
    var sel = document.getElementById('pl-chon');
    if (sel) sel.value = hienTai();
  }
  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('pl-chon');
    sel.addEventListener('change', function () { location.hash = '#' + sel.value; });
    document.getElementById('pl-truoc').addEventListener('click', function () { di(-1); });
    document.getElementById('pl-sau').addEventListener('click', function () { di(1); });
    document.getElementById('pl-moi').addEventListener('click', function () {
      var t = document.getElementById('pl-trangthai');
      t.textContent = 'đang tải số…';
      if (typeof PL !== 'undefined') PL.napLai();
      setTimeout(function () {
        var d = (typeof PL !== 'undefined') ? PL.duLieu() : null;
        t.textContent = d ? ('số live ' + (d.capnhat || '')) : 'chưa nối live — đang dùng số minh hoạ';
      }, 1200);
    });
    var an = document.getElementById('pl-an'), hien = document.getElementById('pl-hien');
    function dat(v) {
      document.body.classList.toggle('pl-an-thanh', v);
      try { localStorage.setItem('pl-an-thanh', v ? '1' : '0'); } catch (e) {}
      canChinhTiLe();
    }
    an.addEventListener('click', function () { dat(true); });
    hien.addEventListener('click', function () { dat(false); });
    try { if (localStorage.getItem('pl-an-thanh') === '1') dat(true); } catch (e) {}
    dongBoChon();
    window.addEventListener('hashchange', dongBoChon);
    var t = document.getElementById('pl-trangthai');
    t.textContent = PL.cauHinh.API ? 'đang tải số live…' : 'chưa nối live — đang dùng số minh hoạ';
    /* Phím tắt: ← → đổi bước, Space tạm dừng đồng hồ */
    document.addEventListener('keydown', function (e) {
      var o = (e.target.tagName || '').toLowerCase();
      if (o === 'input' || o === 'textarea' || o === 'select') return;
      if (e.key === 'ArrowLeft') { di(-1); }
      else if (e.key === 'ArrowRight') { di(1); }
      else if (e.key === ' ') {
        var b = document.querySelector('.pl-screen.pl-on .pl-ttoggle');
        if (b) { b.click(); e.preventDefault(); }
      }
    });
  });
})();
</script>
</body>
</html>
'''
parts.append(TAIL)

html = ''.join(parts)
open('giaoban.html', 'w', encoding='utf-8').write(html)
print('giaoban.html: %d KB, %d man' % (len(html.encode('utf-8')) // 1024, len(thutu)))
