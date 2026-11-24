'use strict';
/* ════════════════════════════════════════════════════════════════════
   B5 · DANH SÁCH HÀNH ĐỘNG — ĐỌC LIVE TỪ APP PHI LONG GROUP
   Tracy chốt 24/11/2026: màn B5 phải tự live kết quả từ màn giao việc
   _CONG_VIEC của app PHI LONG GROUP, không dùng dữ liệu mẫu nữa.

   Nguồn : bảng CONG_VIEC trong file PHI LONG_GROUP (app ghi vào).
           Đọc thẳng CSV như hotro.js / viectuan.js nên KHÔNG phụ thuộc
           Apps Script, không cần deploy lại CARDIY_HOP_NHANH.gs.
   Kỳ áp : chỉ kỳ TUẦN (đúng quy ước của CARDIY_HOP_NHANH.gs). Tháng /
           quý / năm giữ bản đã soạn.
   Rà soát: mỗi dòng kiểm đủ 4 yếu tố đã chốt — ai · làm gì · hạn ·
           đo bằng gì — thiếu cái nào thì gắn cờ ngay trên màn họp.
   ════════════════════════════════════════════════════════════════════ */
{
  const FILE = '1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI';   /* PHI LONG_GROUP */
  const GID  = '157455132';                                      /* CONG_VIEC */
  const APP  = 'https://www.appsheet.com/start/866c1f09-779a-48ca-9b1c-094d9c81fef8';
  const APP_VIEW = APP + '#appName=PHILONGGROUP-171475980&view=_CONG_VIEC';
  const MA_CN = ['CN1','CN2','CN3'];
  const LAM_MOI = 60000;      /* tự đọc lại mỗi 60s khi đang mở màn B5 */
  const TOI_DA_VIEC = 5;      /* Tracy chốt: mỗi chi nhánh tối ưu 5 hành động */

  let ds = null;              /* danh sách việc live, null = chưa đọc được */
  let loi = '';
  let docLuc = null;
  let dangDoc = false;
  let hen = null;

  /* ---------- đọc CSV ---------- */
  function tachCsv(text) {
    const bang = [], hang = [];
    let o = '', q = false, dong = hang;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i+1] === '"') { o += '"'; i++; } else q = false; } else o += c; }
      else if (c === '"') q = true;
      else if (c === ',') { dong.push(o); o = ''; }
      else if (c === '\n') { dong.push(o); bang.push(dong); dong = []; o = ''; }
      else if (c !== '\r') o += c;
    }
    if (o.length || dong.length) { dong.push(o); bang.push(dong); }
    return bang;
  }
  const gon = v => String(v ?? '').replace(/\s+/g,' ').trim();
  const hoa = v => gon(v).toUpperCase();

  /* Cột deadline / ngay_tao của app là CHỮ dạng dd/mm/yyyy [hh:mm:ss] — đã kiểm
     trên chính CSV live nên không phải đoán theo locale. */
  function tachNgay(raw) {
    const t = gon(raw);
    if (!t) return {ngay:'', gio:''};
    let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (m) return {
      ngay: m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'),
      gio: m[4] ? m[4].padStart(2,'0')+':'+m[5] : ''
    };
    m = t.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{1,2}):(\d{2}))?/);
    if (m) return {ngay: m[1]+'-'+m[2]+'-'+m[3], gio: m[4] ? m[4].padStart(2,'0')+':'+m[5] : ''};
    return {ngay:'', gio:''};
  }
  function maCuaDong(phongBan, ten) {
    const t = hoa(phongBan) + ' ' + hoa(ten);
    return MA_CN.find(ma => t.includes(ma)) || '';
  }
  const nhanCN = ma => {
    const i = MA_CN.indexOf(ma);
    return i < 0 ? '' : branchNames[i];
  };

  async function layCsv() {
    const t = Date.now();
    const goc = 'https://docs.google.com/spreadsheets/d/' + FILE + '/';
    const duong = [
      goc + 'gviz/tq?tqx=out:csv&gid=' + GID + '&_=' + t,
      goc + 'export?format=csv&gid=' + GID + '&_=' + (t+1),
      'https://docs.google.com/spreadsheets/u/0/d/' + FILE + '/gviz/tq?tqx=out:csv&gid=' + GID + '&_=' + (t+2),
    ];
    let cuoi = '';
    for (const url of duong) {
      try {
        const r = await fetch(url,{cache:'no-store'});
        if (!r.ok) { cuoi = 'HTTP ' + r.status; continue; }
        const text = await r.text();
        if (/^\s*(<html|<!DOCTYPE)/i.test(text)) { cuoi = 'file chưa mở quyền xem bằng link'; continue; }
        return text;
      } catch (e) { cuoi = String(e.message || e); }
    }
    throw new Error(cuoi || 'không gọi được Google Sheets');
  }

  async function doc() {
    if (dangDoc) return;
    dangDoc = true;
    try {
      const bang = tachCsv(await layCsv());
      if (bang.length < 2) throw new Error('bảng CONG_VIEC trống');
      const de = bang[0].map(hoa);
      const cot = ten => de.indexOf(hoa(ten));
      const cId = cot('id'), cTen = cot('ten_cong_viec'), cDo = cot('ten_khach_hang'),
            cHan = cot('deadline'), cXong = cot('ngay_hoan_thanh'), cAi = cot('ho_va_ten'),
            cMa = cot('nguoi_phu_trach'), cBan = cot('phong_ban'), cTT = cot('trang_thai'),
            cWay = cot('loai_cong_viec'), cTao = cot('ngay_tao');
      if (cTen < 0 || cTT < 0) throw new Error('bảng CONG_VIEC thiếu cột ten_cong_viec / trang_thai');

      const ra = [];
      for (let i = 1; i < bang.length; i++) {
        const d = bang[i];
        const ten = gon(d[cTen]);
        if (!ten) continue;
        const tt = gon(d[cTT]);
        const xong = tt.startsWith('3.') || hoa(tt).includes('HOÀN THÀNH');
        const dangLam = tt.startsWith('2.') || hoa(tt).includes('ĐANG LÀM');
        const han = tachNgay(cHan > -1 ? d[cHan] : '');
        const ma = maCuaDong(cBan > -1 ? d[cBan] : '', ten);
        const sid = gon(cId > -1 ? d[cId] : '') || ('r' + i);
        ra.push({
          id: 'app:' + sid,
          sheetId: sid,
          nguon: 'app',
          title: ten,
          owner: gon(cAi > -1 ? d[cAi] : ''),
          ownerCode: gon(cMa > -1 ? d[cMa] : ''),
          dept: gon(cBan > -1 ? d[cBan] : ''),
          chiSo: gon(cDo > -1 ? d[cDo] : ''),
          way: gon(cWay > -1 ? d[cWay] : ''),
          date: han.ngay,
          gio: han.gio,
          doneAt: tachNgay(cXong > -1 ? d[cXong] : '').ngay,
          createdAt: tachNgay(cTao > -1 ? d[cTao] : '').ngay,
          ma: ma,
          branch: nhanCN(ma),
          status: xong ? 'Hoàn thành' : dangLam ? 'Đang làm' : 'Chờ thực hiện',
          done: xong,
        });
      }
      ds = ra;
      loi = '';
      docLuc = new Date();
    } catch (e) {
      ds = null;
      loi = String(e.message || e);
    } finally {
      dangDoc = false;
    }
  }

  /* ---------- rà soát 4 yếu tố: ai · làm gì · hạn · đo bằng gì ---------- */
  function coCanhBao(v) {
    const c = [];
    if (!v.owner) c.push('Thiếu người phụ trách');
    if (!v.date) c.push('Thiếu hạn hoàn thành');
    if (!v.chiSo) c.push('Thiếu chỉ số đo');
    if (!v.ma) c.push('Không rõ chi nhánh');
    if (v.done && !v.doneAt) c.push('Hoàn thành nhưng trống ngày hoàn thành');
    return c;
  }
  const homNay = () => today();
  function nhanHan(v) {
    if (v.done || !v.date) return '';
    const t = homNay();
    if (v.date < t) return '';                 /* app.js đã gắn 🔥 Trễ kế hoạch */
    if (v.date === t) return 'Đáo hạn hôm nay';
    const mai = new Date(Date.parse(t + 'T00:00:00Z') + 86400000).toISOString().slice(0,10);
    if (v.date === mai) return 'Đáo hạn ngày mai';
    return '';
  }

  /* ---------- nối vào state: chỉ kỳ tuần ---------- */
  function nhapVaoApp() {
    if (!ds) return;
    const giuTay = khung => (khung.tasks || []).filter(v => v.nguon !== 'app');
    for (let i = 0; i < branchNames.length; i++) {
      const khung = state.branches[i];
      if (!khung) continue;
      khung.tasks = ds.filter(v => v.ma === MA_CN[i]).concat(giuTay(khung));
    }
    state.joint.tasks = ds.slice().concat(giuTay(state.joint));
  }

  /* ---------- thẻ Việc cần làm: thay hẳn bản gốc ---------- */
  const gocPanel = window.tasksPanel;
  function thanhTrangThai() {
    if (loi) return '<p class="sheet-error"><strong>CHƯA ĐỌC ĐƯỢC LIVE</strong> · ' + label(loi) +
      ' · đang hiện bản đã soạn trên máy. <button class="button secondary" type="button" data-action="viec-live">Đọc lại</button></p>';
    if (!ds) return '<p class="empty">Đang đọc live bảng CONG_VIEC của app PHI LONG GROUP…</p>';
    const tt = new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit'}).format(docLuc);
    const hien = data().tasks.filter(v => v.nguon === 'app');
    const chuaXong = hien.filter(v => !v.done).length;
    const tre = hien.filter(v => taskLate(v)).length;
    const thieu = hien.filter(v => coCanhBao(v).length).length;
    const qua = !isJoint() && hien.length > TOI_DA_VIEC
      ? ' · <span class="pill warn">Giao ' + hien.length + ' việc, vượt mức tối ưu ' + TOI_DA_VIEC + '</span>' : '';
    return '<p class="viec-live"><span class="pill good">LIVE</span> App PHI LONG GROUP · CONG_VIEC · đọc lúc ' + tt +
      ' · <strong>' + hien.length + '</strong> việc · <strong>' + chuaXong + '</strong> chưa xong · ' +
      '<strong>' + tre + '</strong> trễ hạn · <strong>' + thieu + '</strong> dòng thiếu yếu tố' + qua + '</p>';
  }
  function dongViec(v, compact) {
    const live = v.nguon === 'app';
    const canh = live ? coCanhBao(v) : [];
    const han = nhanHan(v);
    const phu = [v.branch, v.owner + (v.ownerCode ? ' ('+v.ownerCode+')' : ''), dateText(v.date) + (v.gio ? ' ' + v.gio : '')]
      .map(gon).filter(Boolean).join(' · ');
    const doBang = live && v.chiSo ? '<small class="viec-chiso">Đo bằng · ' + label(v.chiSo) + '</small>' : '';
    const lech = live && v.done !== (v.status === 'Hoàn thành') ? pill('Chưa ghi về app','warn') : '';
    const moApp = live && !compact
      ? '<a class="button secondary" href="' + APP_VIEW + '&row=' + encodeURIComponent(v.sheetId) + '" target="_blank" rel="noopener">Mở trong app</a>' : '';
    return '<div class="row"><input type="checkbox" data-action="toggle" data-id="' + v.id + '" ' + (v.done?'checked':'') +
      ' aria-label="Hoàn thành ' + label(v.title) + '"><div class="row-text"><strong class="' + (v.done?'done':'') + '">' +
      label(v.title) + '</strong><small>' + label(phu) + '</small>' + doBang +
      canh.map(c => '<small class="sheet-error">⚠ ' + label(c) + '</small>').join('') + '</div>' +
      (taskLate(v) ? pill('🔥 Trễ kế hoạch','miss') : han ? pill(han,'warn') : '') + lech +
      pill(taskStatus(v), v.done?'good':taskStatus(v)==='Đang làm'?'warn':'neutral') +
      (live ? '' : editButton('tasks',v.id)) + moApp +
      (!compact && !v.done && !live ? workflowButton('renew',v.id,'Gia hạn') : '') + '</div>';
  }
  window.tasksPanel = function(compact) {
    /* Live chỉ áp kỳ TUẦN — tháng / quý / năm giữ bản đã soạn. */
    if (state.period !== 'week') return gocPanel(compact);
    if (!ds && !loi) return gocPanel(compact);
    const tasks = data().tasks;
    const list = (compact ? tasks.slice(0,3) : tasks).map(v => dongViec(v,compact)).join('');
    const nut = compact ? '' :
      '<button class="button secondary" type="button" data-action="viec-live">Đọc lại từ app</button>' +
      '<a class="button secondary" href="' + APP_VIEW + '" target="_blank" rel="noopener">Mở app giao việc</a>';
    return panel('Việc cần làm', tasks.filter(v=>v.done).length + ' / ' + tasks.length + ' đã hoàn thành',
      '<div class="session-actions">' + nut + addButton('tasks','Thêm việc') + '</div>',
      thanhTrangThai() + '<div class="list">' + (list || '<p class="empty">App chưa giao việc nào cho bàn này.</p>') + '</div>');
  };

  /* ---------- vòng đọc lại ---------- */
  async function lamMoi(hienThi) {
    await doc();
    nhapVaoApp();
    save();
    if (hienThi !== false) render();
  }
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-action="viec-live"]')) return;
    loi = '';
    lamMoi();
  });
  function datHen() {
    window.clearInterval(hen);
    hen = window.setInterval(() => {
      if (document.hidden) return;
      if (!['tasks','overview','meeting'].includes(view)) return;
      lamMoi();
    }, LAM_MOI);
  }
  window.CARDIY_VIEC_LIVE = {
    doc: () => lamMoi(),
    danhSach: () => ds,
    loi: () => loi,
    docLuc: () => docLuc,
  };
  lamMoi();
  datHen();
}
