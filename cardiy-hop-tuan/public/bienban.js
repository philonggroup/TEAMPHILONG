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

  /* ──────────────────────────────────────────────────────────────────
     BẢN TỔNG HỢP · Mục tiêu — Hành động — Chỉ số dẫn dắt — Người phụ trách
     Tracy chốt 24/11/2026. Một bảng để nhìn cả chuỗi trong 5 giây: định
     đi đâu, ai làm gì, đo bằng gì. Chỗ nào trống thì để trống và đếm vào
     dòng cảnh báo — không tự suy ra người hay chỉ số, vì đoán sai ở đây
     là giao việc sai người.
     ────────────────────────────────────────────────────────────────── */
  const trong = v => !gon(v);
  function soLieuTongHop() {
    const d = data();
    const viec = d.tasks || [];
    const muctieu = d.goals || [];
    return {
      viec: viec, muctieu: muctieu,
      thieuNguoi: viec.filter(x => trong(x.owner)).length,
      thieuChiSo: viec.filter(x => trong(x.chiSo)).length,
      thieuHan: viec.filter(x => trong(x.date)).length,
      mtThieuNguoi: muctieu.filter(x => trong(x.owner)).length,
    };
  }
  function bangTongHop() {
    const t = soLieuTongHop();
    if (!t.viec.length && !t.muctieu.length) {
      return panel('Bản tổng hợp', 'Mục tiêu · Hành động · Chỉ số dẫn dắt · Người phụ trách', '',
        '<div class="list"><p class="empty">Kỳ này chưa có mục tiêu và hành động nào.</p></div>');
    }
    const dongMT = t.muctieu.map(x =>
      '<tr><td>' + label(x.title) + '</td><td>' + (trong(x.owner)
        ? '<span class="missing">Chưa có</span>' : label(x.owner)) +
      '</td><td>' + label(x.status || '') + '</td></tr>').join('');
    const dongHD = t.viec.map(x =>
      '<tr><td>' + label(x.title) + '</td>' +
      '<td>' + (trong(x.chiSo) ? '<span class="missing">Chưa có</span>' : label(x.chiSo)) + '</td>' +
      '<td>' + (trong(x.owner) ? '<span class="missing">Chưa có</span>' : label(x.owner)) + '</td>' +
      '<td>' + label(x.branch || '') + '</td>' +
      '<td>' + (trong(x.date) ? '<span class="missing">Chưa có</span>' : label(dateText(x.date))) + '</td>' +
      '<td>' + pill(x.done ? 'Hoàn thành' : (x.status || 'Chờ thực hiện'),
        x.done ? 'good' : x.status === 'Đang làm' ? 'warn' : 'neutral') + '</td></tr>').join('');
    const thieu = [];
    if (t.mtThieuNguoi) thieu.push(t.mtThieuNguoi + ' mục tiêu chưa có người phụ trách');
    if (t.thieuNguoi) thieu.push(t.thieuNguoi + ' hành động chưa có người');
    if (t.thieuChiSo) thieu.push(t.thieuChiSo + ' hành động chưa có chỉ số đo');
    if (t.thieuHan) thieu.push(t.thieuHan + ' hành động chưa có hạn');
    const canh = thieu.length
      ? '<p class="vd-canh"><strong>Còn thiếu:</strong> ' + label(thieu.join(' · ')) +
        '. Việc không có người hoặc không có chỉ số đo thì tuần sau không chấm được.</p>'
      : '<p class="viec-live"><span class="pill good">ĐỦ</span> Mọi mục tiêu và hành động đều có người phụ trách, chỉ số đo và hạn.</p>';
    return panel('Bản tổng hợp', 'Mục tiêu · Hành động · Chỉ số dẫn dắt · Người phụ trách — ' +
      label(branchSelect.value), '',
      canh +
      (dongMT ? '<div class="table-wrap" tabindex="0" aria-label="Mục tiêu"><table><thead><tr>' +
        '<th scope="col">Mục tiêu</th><th scope="col">Người phụ trách</th><th scope="col">Trạng thái</th>' +
        '</tr></thead><tbody>' + dongMT + '</tbody></table></div>' : '') +
      (dongHD ? '<div class="table-wrap" tabindex="0" aria-label="Hành động"><table><thead><tr>' +
        '<th scope="col">Hành động</th><th scope="col">Chỉ số dẫn dắt</th><th scope="col">Người phụ trách</th>' +
        '<th scope="col">Chi nhánh</th><th scope="col">Hạn</th><th scope="col">Trạng thái</th>' +
        '</tr></thead><tbody>' + dongHD + '</tbody></table></div>' : ''));
  }

  /* ---------- khối ký nhận ở B7 ----------
     Tracy chốt 24/11/2026: ẨN danh sách tên. Bày đủ 29 người ngay trên
     màn B7 làm vỡ bố cục, trong khi mỗi buổi chỉ vài người có mặt.
     Màn chỉ giữ một dòng đếm; ai tham gia thì mở hộp lọc mà tích. */
  function oKyNhan() {
    const ds = nhanSu();
    const ky = kho();
    const ten = ky.length
      ? '<p class="kn-ten">' + ky.map(x => label(x.ten)).join(' · ') + '</p>'
      : '<p class="kn-ten kn-trong">Chưa ai ký nhận. Bấm “Chọn thành viên tham gia” để tích người có mặt.</p>';
    const nut = '<div class="session-actions">' +
      '<button class="button secondary" type="button" data-action="ky-chon-nguoi">Chọn thành viên tham gia</button>' +
      '<button class="button secondary" type="button" data-action="in-bien-ban">In / lưu PDF</button>' +
      '<button class="button yellow" type="button" data-action="xuat-bien-ban">Xuất biên bản họp</button></div>';
    return panel('Ký nhận thành viên tham gia',
      '<strong>' + ky.length + ' / ' + (ds.length || '—') + '</strong> đã ký nhận · ' +
      label(branchSelect.value), nut, '<div class="kn-than">' + ten + '</div>');
  }

  /* ---------- hộp lọc và chọn người tham gia ---------- */
  let hopChon = null, timKiem = '';
  function veHopChon() {
    if (!hopChon) return;
    const ky = kho();
    const t = timKiem.toLowerCase();
    const ds = nhanSu().filter(n => !t ||
      (n.ten + ' ' + (n.viTri || '') + ' ' + (n.ban || '')).toLowerCase().includes(t));
    hopChon.querySelector('.kn-dem').textContent =
      ky.length + ' / ' + nhanSu().length + ' đã ký · đang hiện ' + ds.length + ' người';
    hopChon.querySelector('.kn-ds').innerHTML = ds.length
      ? ds.map(n => '<label class="kn-dong"><input type="checkbox" data-action="ky-nhan" data-ma="' +
          label(n.ma) + '"' + (ky.some(x => x.ma === n.ma) ? ' checked' : '') + '>' +
          '<span class="kn-chu"><strong>' + label(n.ten) + '</strong>' +
          '<small>' + label([n.viTri, n.ban].filter(Boolean).join(' · ')) + '</small></span></label>').join('')
      : '<p class="empty">Không thấy ai khớp “' + label(timKiem) + '”.</p>';
  }
  function moHopChon() {
    if (!nhanSu().length) {
      if (typeof message === 'function') message('Chưa đọc được danh sách nhân sự — mở lại trang rồi thử lại.');
      return;
    }
    if (!hopChon) {
      hopChon = document.createElement('dialog');
      hopChon.className = 'viec-day-hop kn-hop';
      hopChon.innerHTML = '<form method="dialog"><h2>Chọn thành viên tham gia</h2>' +
        '<p class="kn-dem"></p>' +
        '<input class="kn-tim" type="search" placeholder="Tìm theo tên, vị trí, bộ phận…" autocomplete="off">' +
        '<div class="kn-ds"></div>' +
        '<div class="viec-day-nut">' +
        '<button type="button" class="button secondary" data-ky-het>Tích hết đang hiện</button>' +
        '<button type="button" class="button secondary" data-ky-bo>Bỏ hết</button>' +
        '<button type="submit" class="button yellow">Xong</button></div></form>';
      document.body.appendChild(hopChon);
      hopChon.querySelector('.kn-tim').addEventListener('input', event => {
        timKiem = event.target.value || '';
        veHopChon();
      });
      hopChon.querySelector('[data-ky-het]').addEventListener('click', () => {
        const t = timKiem.toLowerCase();
        const ds = kho();
        nhanSu().filter(n => !t ||
          (n.ten + ' ' + (n.viTri || '') + ' ' + (n.ban || '')).toLowerCase().includes(t))
          .forEach(n => { if (!ds.some(x => x.ma === n.ma)) ds.push(moiKy(n)); });
        save(); veHopChon(); render();
      });
      hopChon.querySelector('[data-ky-bo]').addEventListener('click', () => {
        kho().length = 0; save(); veHopChon(); render();
      });
      hopChon.querySelector('form').addEventListener('submit', () => { render(); });
    }
    timKiem = '';
    hopChon.querySelector('.kn-tim').value = '';
    veHopChon();
    hopChon.showModal();
  }
  const moiKy = n => ({ma: n.ma, ten: n.ten, viTri: n.viTri, luc: gio(new Date())});

  const gocContentFor = window.contentFor;
  window.contentFor = function(key) {
    const html = gocContentFor(key);
    return key === 'close' ? html + bangTongHop() + oKyNhan() : html;
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
      ds.push(n ? moiKy(n) : {ma: ma, ten: ma, viTri: '', luc: gio(new Date())});
    } else if (!o.checked && i > -1) {
      ds.splice(i, 1);
    }
    save();
    if (hopChon && hopChon.open) { hopChon.querySelector('.kn-dem').textContent =
      kho().length + ' / ' + nhanSu().length + ' đã ký · đang hiện ' +
      hopChon.querySelectorAll('.kn-ds .kn-dong').length + ' người'; }
    else render();
  });
  document.addEventListener('click', event => {
    if (event.target.closest('[data-action="ky-chon-nguoi"]')) { moHopChon(); return; }
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
      muc('8. Bản tổng hợp · mục tiêu — hành động — chỉ số dẫn dắt — người phụ trách',
        (d.tasks || []).length
          ? '<table><thead><tr><th>Hành động</th><th>Chỉ số dẫn dắt</th><th>Người phụ trách</th>' +
            '<th>Chi nhánh</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>' +
            d.tasks.map(x => '<tr><td>' + esc(x.title) + '</td><td>' + esc(x.chiSo || '') + '</td><td>' +
              esc(x.owner || '') + '</td><td>' + esc(x.branch || '') + '</td><td>' + esc(x.date || '') +
              '</td><td>' + esc(x.done ? 'Hoàn thành' : (x.status || 'Chờ thực hiện')) + '</td></tr>').join('') +
            '</tbody></table>' : '') +
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
