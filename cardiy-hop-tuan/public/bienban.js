'use strict';
/* ════════════════════════════════════════════════════════════════════
   B7 · KÝ NHẬN THÀNH VIÊN + XUẤT BIÊN BẢN HỌP
   Tracy chốt 24/11/2026: ở bước Kết luận phải có chỗ cho thành viên
   tham gia KÝ NHẬN, và một nút XUẤT FILE biên bản để gửi sếp.
   Thành viên chi nhánh nào chỉ thấy chi nhánh đó — danh sách ký nhận
   lọc theo đúng bàn đang họp, giống mọi khối số khác của app.

   Ký nhận lưu trong chính kho dữ liệu của bàn, nên chốt biên bản xong
   vẫn còn trong Lịch sử họp. File xuất ra là trang in — bấm in rồi
   lưu PDF là gửi được ngay, không cần cài thêm gì.
   ════════════════════════════════════════════════════════════════════ */
{
  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const gio = d => new Intl.DateTimeFormat('vi-VN',
    {timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'})
    .format(d);

  function nhanSu() {
    const api = window.CARDIY_NHAN_SU;
    return (api && api.dangDung()) || [];
  }
  function kho() {
    const d = data();
    if (!Array.isArray(d.kyNhan)) d.kyNhan = [];
    return d.kyNhan;
  }
  const daKy = ma => kho().some(x => x.ma === ma);
  function nhanKy() {
    const k = window.CARDIY_KY ? window.CARDIY_KY.khoang() : null;
    return k ? k.nhan : '';
  }

  /* ---------- khối ký nhận ở B7 ---------- */
  function oKyNhan() {
    const ds = nhanSu();
    const ky = kho();
    if (!ds.length) {
      return panel('Ký nhận thành viên tham gia',
        'Chưa đọc được danh sách nhân sự', '',
        '<div class="list"><p class="empty">Chưa đọc được danh sách nhân sự của bàn này. ' +
        'Mở lại trang hoặc kiểm tra kết nối rồi thử lại.</p></div>');
    }
    const dong = ds.map(n =>
      '<label class="row kn-dong"><input type="checkbox" data-action="ky-nhan" data-ma="' + label(n.ma) + '"' +
      (daKy(n.ma) ? ' checked' : '') + '>' +
      '<div class="row-text"><strong>' + label(n.ten) + '</strong>' +
      '<small>' + label([n.viTri, n.ban].filter(Boolean).join(' · ')) + '</small></div>' +
      (daKy(n.ma)
        ? '<span class="pill good">đã ký ' + label((kho().find(x => x.ma === n.ma) || {}).luc || '') + '</span>'
        : '<span class="pill neutral">chưa ký</span>') + '</label>').join('');
    const nut = '<div class="session-actions">' +
      '<button class="button secondary" type="button" data-action="ky-het">Tích cả bàn</button>' +
      '<button class="button secondary" type="button" data-action="in-bien-ban">In để ký tay</button>' +
      '<button class="button yellow" type="button" data-action="xuat-bien-ban">Xuất biên bản gửi sếp</button></div>';
    return panel('Ký nhận thành viên tham gia',
      ky.length + ' / ' + ds.length + ' người đã xác nhận đã nắm rõ công việc được giao · ' +
      label(branchSelect.value), nut, '<div class="list">' + dong + '</div>');
  }

  const gocContentFor = window.contentFor;
  window.contentFor = function(key) {
    const html = gocContentFor(key);
    return key === 'close' ? html + oKyNhan() : html;
  };

  /* ---------- bấm ký ---------- */
  document.addEventListener('change', event => {
    const o = event.target.closest('[data-action="ky-nhan"]');
    if (!o) return;
    const ma = o.dataset.ma;
    const n = nhanSu().find(x => x.ma === ma);
    const ds = kho();
    const i = ds.findIndex(x => x.ma === ma);
    if (o.checked && i < 0) {
      ds.push({ma: ma, ten: n ? n.ten : ma, viTri: n ? n.viTri : '', luc: gio(new Date())});
    } else if (!o.checked && i > -1) {
      ds.splice(i, 1);
    }
    save();
    render();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-action="ky-het"]')) {
      const ds = kho();
      nhanSu().forEach(n => {
        if (!ds.some(x => x.ma === n.ma)) {
          ds.push({ma: n.ma, ten: n.ten, viTri: n.viTri, luc: gio(new Date())});
        }
      });
      save();
      render();
      return;
    }
    if (event.target.closest('[data-action="in-bien-ban"]')) { inRa(); return; }
    if (event.target.closest('[data-action="xuat-bien-ban"]')) xuatExcel();
  });

  /* ---------- dựng trang biên bản để in ---------- */
  const esc = v => label(v);
  function muc(ten, html) {
    return html ? '<section><h2>' + esc(ten) + '</h2>' + html + '</section>' : '';
  }
  function ds2(list, ve) {
    const r = (list || []).map(ve).join('');
    return r ? '<ul>' + r + '</ul>' : '';
  }
  function trang() {
    const d = data();
    const s = d.session || {};
    const ky = kho();
    const nguoi = nhanSu();
    const tenBan = branchSelect.value;
    const bangKy = '<table class="kn"><thead><tr><th>#</th><th>Họ và tên</th><th>Vị trí</th>' +
      '<th>Xác nhận</th><th>Chữ ký</th></tr></thead><tbody>' +
      (nguoi.length ? nguoi : ky).map((n,i) => {
        const x = ky.find(y => y.ma === (n.ma || n)) || null;
        return '<tr><td>' + (i+1) + '</td><td>' + esc(n.ten || '') + '</td><td>' + esc(n.viTri || '') + '</td>' +
          '<td>' + (x ? 'Đã xác nhận · ' + esc(x.luc) : '') + '</td><td></td></tr>';
      }).join('') + '</tbody></table>';

    return '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">' +
      '<title>Biên bản họp · ' + esc(tenBan) + '</title><style>' +
      '*{box-sizing:border-box}body{margin:0;padding:28px 32px;font:14px/1.6 "Times New Roman",Times,serif;color:#111}' +
      'h1{font-size:19px;text-align:center;margin:0 0 4px;text-transform:uppercase}' +
      '.phu{text-align:center;font-size:13px;color:#444;margin:0 0 18px}' +
      'h2{font-size:14px;margin:18px 0 6px;text-transform:uppercase;border-bottom:1px solid #999;padding-bottom:3px}' +
      'ul{margin:4px 0;padding-left:20px}li{margin:3px 0}' +
      'table{width:100%;border-collapse:collapse;margin-top:6px;font-size:13px}' +
      'th,td{border:1px solid #666;padding:5px 7px;text-align:left;vertical-align:top}' +
      'th{background:#eee}.kn td:last-child{height:40px;min-width:120px}' +
      '.thongtin td{border:0;padding:2px 0}.thongtin td:first-child{width:150px;font-weight:bold}' +
      '.chuky{display:flex;justify-content:space-between;margin-top:34px;text-align:center;font-size:13px}' +
      '.chuky div{width:45%}.chuky p{margin:0}.chuky .ten{margin-top:62px;font-weight:bold}' +
      '@media print{body{padding:0}@page{margin:16mm}}' +
      '</style></head><body>' +
      '<h1>Biên bản họp</h1>' +
      '<p class="phu">CARDIY · Họp nhanh — ' + esc(tenBan) + '</p>' +
      '<table class="thongtin"><tr><td>Kỳ họp</td><td>' + esc(nhanKy()) + '</td></tr>' +
      '<tr><td>Ngày lập</td><td>' + esc(gio(new Date())) + '</td></tr>' +
      (s.date ? '<tr><td>Ngày họp</td><td>' + esc(s.date) + '</td></tr>' : '') +
      (d.rating ? '<tr><td>Điểm buổi họp</td><td>' + esc(d.rating) + ' / 10</td></tr>' : '') +
      '<tr><td>Số người xác nhận</td><td>' + ky.length + (nguoi.length ? ' / ' + nguoi.length : '') + '</td></tr>' +
      '</table>' +
      muc('1. Tin tốt', ds2(d.good, x => '<li>' + esc(x.title) + (x.owner ? ' — ' + esc(x.owner) : '') + '</li>')) +
      muc('2. Chỉ số', ds2(d.kpis, x => '<li>' + esc(x.title) + ': ' + esc(showNumber(x.actual, x.unit)) +
        ' / ' + esc(showNumber(x.target, x.unit)) + (x.actual >= x.target ? ' — Đạt' : ' — Chưa đạt') + '</li>')) +
      muc('3. Mục tiêu', ds2(d.goals, x => '<li>' + esc(x.title) + (x.owner ? ' — ' + esc(x.owner) : '') +
        (x.status ? ' (' + esc(x.status) + ')' : '') + '</li>')) +
      muc('4. Phản hồi', ds2(d.news, x => '<li>' + esc(x.title) + (x.source ? ' — ' + esc(x.source) : '') + '</li>')) +
      muc('5. Vấn đề đã bàn', ds2(d.issues, x => '<li>' + esc(x.title) +
        (x.solution ? ' → ' + esc(x.solution) : ' → chưa chốt hành động') +
        (x.owner ? ' (' + esc(x.owner) + ')' : '') + '</li>')) +
      muc('6. Danh sách hành động', ds2(d.tasks, x => '<li>' + esc(x.title) +
        ' — ' + esc([x.owner, x.branch, x.date].filter(Boolean).join(' · ')) +
        (x.done ? ' [Hoàn thành]' : '') + '</li>')) +
      muc('7. Kết luận và thông điệp', d.notes ? '<p>' + esc(d.notes).replace(/\n/g,'<br>') + '</p>' : '') +
      '<h2>Ký nhận của thành viên tham gia</h2>' +
      '<p style="font-size:13px;margin:2px 0 0">Các thành viên dưới đây xác nhận đã nắm rõ công việc được giao.</p>' +
      bangKy +
      '<div class="chuky"><div><p>Người điều phối</p><p class="ten">&nbsp;</p></div>' +
      '<div><p>Quản lý chi nhánh</p><p class="ten">&nbsp;</p></div></div>' +
      '</body></html>';
  }
  function inRa() {
    const html = trang();
    const w = window.open('', '_blank');
    if (w && w.document) {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
      window.setTimeout(() => { try { w.print(); } catch (e) {} }, 500);
      return;
    }
    /* Trình duyệt chặn cửa sổ mới thì tải file về, mở ra in cũng được. */
    const b = new Blob([html], {type: 'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'bien-ban-hop-' + gon(branchSelect.value).replace(/[^A-Za-z0-9]+/g,'-') + '.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (typeof message === 'function') message('Trình duyệt chặn cửa sổ mới — đã tải file biên bản về máy.');
  }

  /* ---------- xuất Excel đúng mẫu CARDIY-1 + thêm trang Ký nhận ----------
     Dùng lại đúng bộ trang tính mà nút Nhập/Xuất Excel của app vẫn xuất,
     nên sếp nhận được file quen thuộc, chỉ có thêm một trang ký nhận. */
  function trangKyNhan() {
    const ky = kho();
    const nguoi = nhanSu();
    const rows = [['Mã nhân sự','Họ và tên','Vị trí','Chi nhánh','Xác nhận đã nắm rõ','Thời điểm ký']];
    const ds = nguoi.length ? nguoi : ky.map(x => ({ma: x.ma, ten: x.ten, viTri: x.viTri, ban: ''}));
    for (const n of ds) {
      const x = ky.find(y => y.ma === n.ma);
      rows.push([n.ma || '', n.ten || '', n.viTri || '', n.ban || '',
        x ? 'Đã xác nhận' : 'Chưa ký', x ? x.luc : '']);
    }
    return {name: 'Ký nhận', rows: rows};
  }
  async function xuatExcel() {
    if (typeof excelSheets !== 'function' || typeof CardiyExcel === 'undefined') {
      message('Chưa nạp được bộ xuất Excel — tải lại trang rồi thử lại.');
      return;
    }
    try {
      const sheets = excelSheets(false);
      sheets.push(trangKyNhan());
      const blob = await CardiyExcel.write(sheets);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      const ban = gon(branchSelect.value).replace(/[^A-Za-z0-9]+/g,'-');
      a.download = ['CARDIY','Bien-ban', ban, today()].join('-') + '.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 4000);
      message('Đã xuất biên bản · ' + kho().length + ' người ký nhận · ' + branchSelect.value);
    } catch (e) {
      message('Chưa xuất được biên bản: ' + (e.message || e));
    }
  }

  window.CARDIY_BIEN_BAN = {xuatExcel: xuatExcel, inRa: inRa,
    kyNhan: () => kho().slice(), trang: trang};
}
