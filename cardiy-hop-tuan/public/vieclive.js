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
  /* Màn "Việc cần làm" bên app = lát cắt _CV_CHUA_LAM (việc chưa làm) */
  const APP_CHUA_LAM = APP + '#appName=PHILONGGROUP-171475980&view=_CV_CHUA_LAM';
  const MA_CN = ['CN1','CN2','CN3'];
  const LAM_MOI = 60000;      /* tự đọc lại mỗi 60s khi đang mở màn B5 */
  /* Cầu nối ghi ngược về CONG_VIEC — dùng chung Web App của giaoban.html.
     Tracy chốt 24/11/2026: nút trạng thái phải ghi thẳng về app. */
  const API  = 'https://script.google.com/macros/s/AKfycbx2b5foWxdy2lVMVyoKLFGQrCE5zK1FqM7_3ivsNzJbuPFPqowAD6w-a8fjIO4BC1Xd_w/exec';
  const KHOA = 'PHILONG2026';
  const TT_CHUAN = ['1.Chờ thực hiện','2.Đang làm','3.Hoàn thành'];
  /* Danh mục 6 Way lấy từ ngân hàng chiến lược của Phi Long; chỉ số dẫn dắt
     là bộ 8 chỉ số tập trung Tracy chốt 18/11/2026. Việc đã có trên app dùng
     nhãn nào thì nhãn đó được gộp vào trước, để không sinh nhãn lạ. */
  const WAY_MAC_DINH = ['Way 1. Khách hàng tiềm năng','Way 2. Tỷ lệ chuyển đổi',
    'Way 3. Tỷ lệ giữ chân (quay lại mua)','Way 4. Số lần mua',
    'Way 5. Giá trị bình quân / giao dịch','Way 6. Tỷ suất lợi nhuận'];
  const CHI_SO_MAC_DINH = ['Lượt xe vào xưởng','Khách được kiểm tra ATX',
    'Báo giá lên trong ngày','Cuộc gọi chăm sóc khách / Cuộc gọi nhận','Lượt xe đặt lịch',
    'Đăng bài Facebook Lốp Xe Phi Long','Google Maps - Zalo OA',
    'Video ngắn kiểm tra lốp - gầm xe đăng TikTok, Facebook'];
  const gopDanhMuc = (lay,macDinh) =>
    [...new Set([...(ds||[]).map(lay).map(gon).filter(Boolean), ...macDinh])].sort();
  const nhanTT = t => t.replace(/^\d+\./,'');
  /* Hạn mặc định: trong 3 ngày — đúng nhịp giao việc Tracy chốt 18/11/2026. */
  const hanMacDinh = () => new Date(Date.parse(today()+'T00:00:00Z')+3*86400000).toISOString().slice(0,10);
  const TOI_DA_VIEC = 5;      /* Tracy chốt: mỗi chi nhánh tối ưu 5 hành động */

  let ds = null;              /* danh sách việc live, null = chưa đọc được */
  let loi = '';
  let docLuc = null;
  let dangDoc = false;
  let hen = null;
  let dangGhi = false;

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
  function nutTrangThai(v) {
    const live = v.nguon === 'app';
    /* Việc chốt tại IDS chưa có trên app: bấm trạng thái nào thì đẩy sang app
       với đúng trạng thái đó — luồng Tracy chốt 24/11/2026. */
    const hanhDong = live ? 'viec-tt' : 'viec-day';
    const khoa = live ? label(v.sheetId) : label(v.id);
    return '<div class="tt-nut' + (live ? '' : ' tt-nut-moi') + '" role="group" aria-label="Trạng thái việc">' +
      TT_CHUAN.map(t =>
      '<button type="button" class="tt-o' + (live && v.status === nhanTT(t) ? ' chon' : '') +
      '" data-action="' + hanhDong + '" data-id="' + khoa + '" data-tt="' + label(t) +
      '" aria-pressed="' + (live && v.status === nhanTT(t)) + '">' + nhanTT(t) + '</button>').join('') +
      '</div>' + (live ? '' : '<span class="pill warn">Chưa có trên app</span>');
  }
  function dongViec(v, compact) {
    const live = v.nguon === 'app';
    const canh = live ? coCanhBao(v) : [];
    const han = nhanHan(v);
    const nguoi = [v.branch, v.owner + (v.ownerCode ? ' ('+v.ownerCode+')' : '')]
      .map(gon).filter(Boolean).join(' · ');
    /* Hạn sửa được ngay tại họp: ô ngày bấm là đổi, ghi thẳng về cột
       deadline của CONG_VIEC (ô ngày thật) — Tracy chốt 24/11/2026. */
    const oHan = (live && !compact)
      ? '<input type="date" class="han-o" data-action="viec-han" data-id="' + label(v.sheetId) +
        '" value="' + label(v.date) + '" aria-label="Hạn hoàn thành của ' + label(v.title) + '">' +
        (v.gio ? '<span class="han-gio">' + label(v.gio) + '</span>' : '')
      : label(dateText(v.date) + (v.gio ? ' ' + v.gio : ''));
    const phu = label(nguoi) + (nguoi ? ' · ' : '') + oHan;
    const doBang = live && v.chiSo ? '<small class="viec-chiso">Đo bằng · ' + label(v.chiSo) + '</small>' : '';
    const moApp = live && !compact
      ? '<a class="button secondary" href="' + APP_VIEW + '&row=' + encodeURIComponent(v.sheetId) + '" target="_blank" rel="noopener">Mở trong app</a>' : '';
    /* Dòng live KHÔNG còn ô tick: tick chỉ đổi tại chỗ rồi bị vòng đọc lại xoá.
       Thay bằng 3 nút ghi thẳng về bảng CONG_VIEC. */
    const o = live ? '' :
      '<input type="checkbox" data-action="toggle" data-id="' + v.id + '" ' + (v.done?'checked':'') +
      ' aria-label="Hoàn thành ' + label(v.title) + '">';
    const trangThai = compact
      ? pill(live ? v.status : taskStatus(v), v.done?'good':(live?v.status:taskStatus(v))==='Đang làm'?'warn':'neutral')
      : nutTrangThai(v);
    return '<div class="row' + (compact?'':' row-live') + '">' + o +
      '<div class="row-text"><strong class="' + (v.done?'done':'') + '">' +
      label(v.title) + '</strong><small>' + phu + '</small>' + doBang +
      canh.map(c => '<small class="sheet-error">⚠ ' + label(c) + '</small>').join('') + '</div>' +
      (taskLate(v) ? pill('🔥 Trễ kế hoạch','miss') : han ? pill(han,'warn') : '') + trangThai +
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
      '<a class="button secondary" href="' + APP_CHUA_LAM + '" target="_blank" rel="noopener">Mở trên app</a>';
    return panel('Việc cần làm', tasks.filter(v=>v.done).length + ' / ' + tasks.length + ' đã hoàn thành',
      '<div class="session-actions">' + nut + addButton('tasks','Thêm việc') + '</div>',
      thanhTrangThai() + '<div class="list">' + (list || '<p class="empty">App chưa giao việc nào cho bàn này.</p>') + '</div>');
  };

  /* ---------- đưa việc chốt tại IDS sang app PHI LONG GROUP ---------- */
  let hopThoai = null, viecDangDay = null;
  function dungHopThoai() {
    if (hopThoai) return hopThoai;
    hopThoai = document.createElement('dialog');
    hopThoai.className = 'viec-day-hop';
    hopThoai.innerHTML =
      '<form method="dialog"><h2>Đưa việc sang app PHI LONG GROUP</h2>' +
      '<p class="viec-day-ten"></p>' +
      '<label>Người phụ trách<select name="ai" required></select></label>' +
      '<label>Loại công việc · 6 Way<select name="way" required></select></label>' +
      '<label>Chỉ số dẫn dắt<select name="chi_so" required></select></label>' +
      '<label>Hạn hoàn thành<input type="date" name="han" required></label>' +
      '<p class="viec-day-bao"></p>' +
      '<div class="viec-day-nut"><button type="button" class="button secondary" data-huy>Hủy</button>' +
      '<button type="submit" class="button yellow">Ghi về app</button></div></form>';
    document.body.appendChild(hopThoai);
    hopThoai.querySelector('[data-huy]').addEventListener('click',()=>hopThoai.close());
    hopThoai.querySelector('form').addEventListener('submit',guiViec);
    return hopThoai;
  }
  function doOption(sel, ds2, chon) {
    sel.innerHTML = ds2.map(x =>
      '<option value="' + label(x) + '"' + (x === chon ? ' selected' : '') + '>' + label(x) + '</option>').join('');
  }
  function moHopThoai(viec, tt) {
    const hop = dungHopThoai();
    const f = hop.querySelector('form');
    const nhanSu = (window.CARDIY_NHAN_SU && window.CARDIY_NHAN_SU.dangDung()) || [];
    if (!nhanSu.length) { message('Chưa đọc được danh sách nhân sự — bấm Đọc lại từ app rồi thử lại.'); return; }
    viecDangDay = {viec, tt};
    hop.querySelector('.viec-day-ten').textContent = viec.title;
    hop.querySelector('.viec-day-bao').textContent = '';
    f.elements.ai.innerHTML = nhanSu.map(n =>
      '<option value="' + label(n.ma) + '">' + label(n.ten + ' · ' + n.ban) + '</option>').join('');
    doOption(f.elements.way, gopDanhMuc(v=>v.way, WAY_MAC_DINH), '');
    doOption(f.elements.chi_so, gopDanhMuc(v=>v.chiSo, CHI_SO_MAC_DINH), '');
    f.elements.han.value = viec.date && viec.date >= today() ? viec.date : hanMacDinh();
    hop.showModal();
  }
  async function guiViec(event) {
    event.preventDefault();
    if (!viecDangDay || dangGhi) return;
    const f = event.target;
    const bao = f.querySelector('.viec-day-bao');
    const {viec, tt} = viecDangDay;
    dangGhi = true;
    f.querySelector('[type="submit"]').disabled = true;
    bao.textContent = 'Đang ghi việc mới về app…';
    try {
      const body = new URLSearchParams({khoa:KHOA, viec:'them_cong_viec', ten:viec.title,
        ai:f.elements.ai.value, han:f.elements.han.value, way:f.elements.way.value,
        chi_so:f.elements.chi_so.value, trang_thai:tt, mo_ta:'Chốt tại Vấn đề (IDS) · ' + branchSelect.value,
        nguoi:'Họp nhanh'}).toString();
      const r = await fetch(API,{method:'POST',body:body,
        headers:{'Content-Type':'application/x-www-form-urlencoded'}});
      const j = await r.json().catch(()=>null);
      if (!j || j.ok !== true) throw new Error((j && j.loi) || 'cầu nối không trả lời đúng');
      /* Việc đã nằm trên app thì bỏ bản gõ tay, vòng đọc lại sẽ kéo về đúng dòng live. */
      const list = data().tasks;
      const i = list.findIndex(x => x.id === viec.id);
      if (i > -1) list.splice(i,1);
      dangGhi = false;
      hopThoai.close();
      await lamMoi(false);
      render();
      message('Đã ghi sang app · ' + j.id + ' · ' + j.ho_va_ten + ' · ' + nhanTT(tt));
    } catch (e) {
      dangGhi = false;
      f.querySelector('[type="submit"]').disabled = false;
      bao.textContent = 'CHƯA ghi được: ' + (e.message || e);
    }
  }
  document.addEventListener('click', event => {
    const nut = event.target.closest('[data-action="viec-day"]');
    if (!nut || dangGhi) return;
    const viec = data().tasks.find(x => x.id === nut.dataset.id);
    if (viec) moHopThoai(viec, nut.dataset.tt);
  });

  /* ---------- ô ngày: sửa hạn, ghi thẳng về CONG_VIEC ---------- */
  document.addEventListener('change', async event => {
    const o = event.target.closest('[data-action="viec-han"]');
    if (!o || dangGhi) return;
    const sid = o.dataset.id, moiHan = o.value;
    const v = (ds || []).find(x => x.sheetId === sid);
    if (!v) return;
    if (!moiHan) { o.value = v.date; message('Phải có hạn hoàn thành — không để trống.'); return; }
    if (moiHan === v.date) return;
    dangGhi = true;
    o.disabled = true;
    message('Đang ghi hạn mới về app…');
    try {
      const body = new URLSearchParams({khoa:KHOA, viec:'doi_han', id:sid,
        han:moiHan, nguoi:'Họp nhanh'}).toString();
      const r = await fetch(API,{method:'POST',body:body,
        headers:{'Content-Type':'application/x-www-form-urlencoded'}});
      const j = await r.json().catch(()=>null);
      if (!j || j.ok !== true) throw new Error((j && j.loi) || 'cầu nối không trả lời đúng');
      dangGhi = false;
      await lamMoi(false);
      render();
      message('Đã gia hạn ' + sid + ' · ' + j.truoc + ' → ' + j.han);
    } catch (e) {
      dangGhi = false;
      o.disabled = false;
      o.value = v.date;
      message('CHƯA ghi được hạn mới: ' + (e.message || e));
    }
  });

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

  /* ---------- nút trạng thái: ghi thẳng về bảng CONG_VIEC ---------- */
  document.addEventListener('click', async event => {
    const nut = event.target.closest('[data-action="viec-tt"]');
    if (!nut || dangGhi) return;
    const sid = nut.dataset.id, tt = nut.dataset.tt;
    const v = (ds || []).find(x => x.sheetId === sid);
    if (!v || v.status === nhanTT(tt)) return;
    dangGhi = true;
    nut.disabled = true;
    message('Đang ghi "' + nhanTT(tt) + '" về app…');
    try {
      const body = new URLSearchParams({khoa:KHOA, viec:'doi_trang_thai', id:sid,
        trang_thai:tt, nguoi:'Họp nhanh'}).toString();
      const r = await fetch(API,{method:'POST',body:body,
        headers:{'Content-Type':'application/x-www-form-urlencoded'}});
      const j = await r.json().catch(()=>null);
      if (!j || j.ok !== true) throw new Error((j && j.loi) || 'cầu nối không trả lời đúng');
      dangGhi = false;
      await lamMoi(false);
      render();
      message('Đã ghi về app · ' + v.sheetId + ' → ' + nhanTT(tt) + (j.luc ? ' lúc ' + j.luc : ''));
    } catch (e) {
      dangGhi = false;
      nut.disabled = false;
      message('CHƯA ghi được về app: ' + (e.message || e) + ' — Apps Script có thể chưa deploy bản mới.');
    }
  });
  function datHen() {
    window.clearInterval(hen);
    hen = window.setInterval(() => {
      if (document.hidden || dangGhi) return;
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
