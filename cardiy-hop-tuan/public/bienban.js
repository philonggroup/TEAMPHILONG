'use strict';
/* ════════════════════════════════════════════════════════════════════
   B7 · KÝ NHẬN THÀNH VIÊN + XUẤT BIÊN BẢN HỌP
   Tracy chốt 24/11/2026:
     · Khối ký nhận ẨN danh sách tên — chỉ hiện "n / m đã ký" cho gọn,
       muốn chọn ai tham gia thì mở hộp riêng. Không để 29 dòng tên
       nằm giữa màn làm rối bố cục.
     · Thành viên chi nhánh nào chỉ thấy chi nhánh đó — danh sách lọc
       theo đúng bàn đang chọn, giống mọi khối số khác.
     · Biên bản gồm BẢN TỔNG HỢP (mục tiêu · hành động mới cần xác
       nhận · chỉ số dẫn dắt · nhân sự phụ trách), rồi 1. Vấn đề cần
       giải quyết và 2. Danh sách hành động kèm người thực hiện.
   File xuất là trang in — bấm in rồi lưu PDF là gửi sếp được ngay.
   ════════════════════════════════════════════════════════════════════ */
{
  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const luc = d => new Intl.DateTimeFormat('vi-VN',
    {timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'})
    .format(d);
  const esc = v => label(v);

  const nhanSu = () => (window.CARDIY_NHAN_SU && window.CARDIY_NHAN_SU.dangDung()) || [];
  function kho() {
    const d = data();
    if (!Array.isArray(d.kyNhan)) d.kyNhan = [];
    return d.kyNhan;
  }
  const daKy = ma => kho().some(x => x.ma === ma);
  const nhanKy = () => (window.CARDIY_KY ? window.CARDIY_KY.khoang().nhan : '');

  /* ---------- khối gọn ở B7 ---------- */
  function oKyNhan() {
    const ds = nhanSu();
    const n = kho().length;
    const nut = '<div class="session-actions">' +
      '<button class="button secondary" type="button" data-action="ky-chon-nguoi">Chọn thành viên tham gia</button>' +
      '<button class="button yellow" type="button" data-action="xuat-bien-ban">Xuất biên bản họp</button></div>';
    const than = ds.length
      ? '<div class="kn-tom"><strong>' + n + ' / ' + ds.length + '</strong> đã ký nhận · ' +
        esc(branchSelect.value) + (n ? '' : ' · chưa ai xác nhận') + '</div>'
      : '<div class="list"><p class="empty">Chưa đọc được danh sách nhân sự của bàn này.</p></div>';
    return panel('Ký nhận thành viên tham gia',
      'Thành viên xác nhận đã nắm rõ công việc được giao', nut, than);
  }
  const gocContentFor = window.contentFor;
  window.contentFor = function(key) {
    const html = gocContentFor(key);
    return key === 'close' ? html + oKyNhan() : html;
  };

  /* ---------- hộp chọn thành viên tham gia ---------- */
  let hop = null;
  function veHop() {
    const ds = nhanSu();
    const o = hop.querySelector('.kn-ds');
    o.innerHTML = ds.length
      ? ds.map(x => '<label class="kn-dong"><input type="checkbox" data-ma="' + esc(x.ma) + '"' +
          (daKy(x.ma) ? ' checked' : '') + '><span><strong>' + esc(x.ten) + '</strong>' +
          '<small>' + esc([x.viTri, x.ban].filter(Boolean).join(' · ')) + '</small></span></label>').join('')
      : '<p class="empty">Chưa đọc được danh sách nhân sự.</p>';
    hop.querySelector('.kn-dem').textContent = kho().length + ' / ' + ds.length + ' đã ký';
  }
  function moHop() {
    if (!hop) {
      hop = document.createElement('dialog');
      hop.className = 'viec-day-hop kn-hop';
      hop.innerHTML = '<form method="dialog"><h2>Thành viên tham gia họp</h2>' +
        '<p class="kn-phu">Tích tên người có mặt · <span class="kn-dem"></span></p>' +
        '<div class="kn-ds"></div>' +
        '<div class="viec-day-nut"><button type="button" class="button secondary" data-het>Tích cả bàn</button>' +
        '<button type="submit" class="button yellow">Xong</button></div></form>';
      document.body.appendChild(hop);
      hop.addEventListener('change', event => {
        const i = event.target.closest('[data-ma]');
        if (!i) return;
        const ma = i.dataset.ma;
        const n = nhanSu().find(x => x.ma === ma);
        const ds = kho();
        const j = ds.findIndex(x => x.ma === ma);
        if (i.checked && j < 0) ds.push({ma: ma, ten: n ? n.ten : ma, viTri: n ? n.viTri : '', luc: luc(new Date())});
        else if (!i.checked && j > -1) ds.splice(j, 1);
        save();
        hop.querySelector('.kn-dem').textContent = kho().length + ' / ' + nhanSu().length + ' đã ký';
      });
      hop.querySelector('[data-het]').addEventListener('click', () => {
        const ds = kho();
        nhanSu().forEach(n => { if (!ds.some(x => x.ma === n.ma))
          ds.push({ma: n.ma, ten: n.ten, viTri: n.viTri, luc: luc(new Date())}); });
        save();
        veHop();
      });
      hop.querySelector('form').addEventListener('submit', () => { window.setTimeout(render, 0); });
    }
    veHop();
    hop.showModal();
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-action="ky-chon-nguoi"]')) { moHop(); return; }
    if (event.target.closest('[data-action="xuat-bien-ban"]')) xuat();
  });

  /* ---------- trang biên bản ---------- */
  function bang(dau, dong) {
    if (!dong) return '<p class="trong">Không có nội dung.</p>';
    return '<table><thead><tr>' + dau.map(x => '<th>' + esc(x) + '</th>').join('') +
      '</tr></thead><tbody>' + dong + '</tbody></table>';
  }
  const o = v => '<td>' + esc(v == null ? '' : v) + '</td>';
  function trang() {
    const d = data();
    const ky = kho();
    const tenBan = branchSelect.value;
    const chuaXong = (d.tasks || []).filter(t => !t.done);

    /* Bản tổng hợp — 4 khối Tracy chốt */
    const mucTieu = bang(['Mục tiêu','Người phụ trách','Trạng thái'],
      (d.goals || []).map(x => '<tr>' + o(x.title) + o(x.owner) + o(x.status) + '</tr>').join(''));
    const hanhDongMoi = bang(['Hành động mới cần xác nhận','Người phụ trách','Chi nhánh','Hạn hoàn thành'],
      chuaXong.map(x => '<tr>' + o(x.title) + o(x.owner) + o(x.branch) + o(x.date) + '</tr>').join(''));
    const chiSo = bang(['Chỉ số dẫn dắt','Nhân sự phụ trách','Chỉ tiêu','Thực tế','Kết quả'],
      (d.kpis || []).map(x => '<tr>' + o(x.title) + o(x.owner) + o(showNumber(x.target, x.unit)) +
        o(showNumber(x.actual, x.unit)) + o(x.actual >= x.target ? 'Đạt' : 'Chưa đạt') + '</tr>').join(''));

    const vanDe = bang(['Vấn đề cần giải quyết','Mức ưu tiên','Hành động đã chốt','Người phụ trách','Trạng thái'],
      (d.issues || []).map(x => '<tr>' + o(x.title) + o(x.priority) + o(x.solution || 'Chưa chốt') +
        o(x.owner) + o(x.solved ? 'Đã giải quyết' : 'Đang xử lý') + '</tr>').join(''));
    const hanhDong = bang(['Danh sách hành động','Người thực hiện','Chi nhánh','Hạn hoàn thành','Trạng thái'],
      (d.tasks || []).map(x => '<tr>' + o(x.title) + o(x.owner) + o(x.branch) + o(x.date) +
        o(x.done ? 'Hoàn thành' : 'Đang làm') + '</tr>').join(''));

    const bangKy = ky.length
      ? bang(['#','Họ và tên','Vị trí','Thời điểm xác nhận','Chữ ký'],
          ky.map((x,i) => '<tr>' + o(i+1) + o(x.ten) + o(x.viTri) + o(x.luc) + '<td class="ovuong"></td></tr>').join(''))
      : '<p class="trong">Chưa có thành viên nào ký nhận.</p>';

    return '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">' +
      '<title>Biên bản họp · ' + esc(tenBan) + '</title><style>' +
      '*{box-sizing:border-box}body{margin:0;padding:26px 30px;font:13px/1.55 "Times New Roman",Times,serif;color:#111}' +
      'h1{font-size:19px;text-align:center;margin:0 0 3px;text-transform:uppercase}' +
      '.phu{text-align:center;font-size:12.5px;color:#444;margin:0 0 16px}' +
      'h2{font-size:13.5px;margin:16px 0 5px;text-transform:uppercase;border-bottom:1px solid #888;padding-bottom:3px}' +
      'h3{font-size:12.5px;margin:12px 0 4px}' +
      'table{width:100%;border-collapse:collapse;margin:4px 0 2px;font-size:12px}' +
      'th,td{border:1px solid #666;padding:4px 6px;text-align:left;vertical-align:top}' +
      'th{background:#eee}.trong{font-style:italic;color:#666;margin:4px 0}' +
      '.ovuong{height:34px;min-width:110px}' +
      '.tt td{border:0;padding:2px 0}.tt td:first-child{width:148px;font-weight:bold}' +
      '.chuky{display:flex;justify-content:space-between;margin-top:30px;text-align:center;font-size:12.5px}' +
      '.chuky div{width:45%}.chuky p{margin:0}.chuky .ten{margin-top:58px;font-weight:bold}' +
      '@media print{body{padding:0}@page{margin:15mm}}' +
      '</style></head><body>' +
      '<h1>Biên bản họp</h1><p class="phu">CARDIY · Họp nhanh — ' + esc(tenBan) + '</p>' +
      '<table class="tt"><tr><td>Kỳ họp</td><td>' + esc(nhanKy()) + '</td></tr>' +
      '<tr><td>Ngày lập</td><td>' + esc(luc(new Date())) + '</td></tr>' +
      (d.rating ? '<tr><td>Điểm buổi họp</td><td>' + esc(d.rating) + ' / 10</td></tr>' : '') +
      '<tr><td>Thành viên ký nhận</td><td>' + ky.length + '</td></tr></table>' +
      '<h2>Bản tổng hợp</h2>' +
      '<h3>1. Mục tiêu</h3>' + mucTieu +
      '<h3>2. Hành động mới cần xác nhận</h3>' + hanhDongMoi +
      '<h3>3. Chỉ số dẫn dắt · nhân sự phụ trách</h3>' + chiSo +
      '<h2>1. Vấn đề cần giải quyết</h2>' + vanDe +
      '<h2>2. Danh sách hành động · người thực hiện</h2>' + hanhDong +
      (d.notes ? '<h2>Kết luận và thông điệp</h2><p>' + esc(d.notes).replace(/\n/g,'<br>') + '</p>' : '') +
      '<h2>Ký nhận của thành viên tham gia</h2>' +
      '<p style="margin:2px 0 0">Các thành viên dưới đây xác nhận đã nắm rõ công việc được giao.</p>' +
      bangKy +
      '<div class="chuky"><div><p>Người điều phối</p><p class="ten">&nbsp;</p></div>' +
      '<div><p>Quản lý chi nhánh</p><p class="ten">&nbsp;</p></div></div></body></html>';
  }
  function xuat() {
    const html = trang();
    const w = window.open('', '_blank');
    if (w && w.document) {
      w.document.open(); w.document.write(html); w.document.close(); w.focus();
      window.setTimeout(() => { try { w.print(); } catch (e) {} }, 500);
      return;
    }
    const b = new Blob([html], {type: 'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'bien-ban-hop-' + gon(branchSelect.value).replace(/[^A-Za-z0-9]+/g,'-') + '.html';
    document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (typeof message === 'function') message('Trình duyệt chặn cửa sổ mới — đã tải file biên bản về máy.');
  }

  window.CARDIY_BIEN_BAN = {xuat: xuat, kyNhan: () => kho().slice(), trang: trang};
}
