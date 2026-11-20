/* ===================================================================
   PHI LONG AUTO — BƯỚC 4 · VINH DANH "ĐUA KẾT QUẢ CHUẨN"
   Nguồn số: 3 tab "APP CNx KPI KỸ THUẬT VIÊN SALE -T11" của 3 file chi nhánh
             (đúng nguồn duy nhất của trang đường đua duaxe.html)
   Vạch chuẩn: KINH DOANH  = Lốp 350tr + Ngoài lốp 100tr (tổng 450tr/tháng)
               KỸ THUẬT VIÊN = công dịch vụ (DVL+DVNL) 20tr/tháng  (Level 3)
               CHI NHÁNH   = chi nhánh đang dẫn đầu (như đường đua)
   Cúp vàng / bạc / đồng CHỈ trao cho người ĐÃ ĐẠT CHUẨN.
   Trang này chỉ ĐỌC file, không ghi gì vào file.
   =================================================================== */
(function () {
'use strict';

var NGUON = {
  CN1: { id:'1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc', gid:'2029309149' },
  CN2: { id:'1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k', gid:'90141774'   },
  CN3: { id:'1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc', gid:'288637199'  }
};
var TEN_CN  = { CN1:'PHI LONG 1', CN2:'PHI LONG 2', CN3:'PHI LONG 3' };
var MAU_CN  = { CN1:'#2F75B5',   CN2:'#E8743B',    CN3:'#1E9E6A'    };
var CHUAN   = { lop:350, bdsc:100, kd:450, ktDv:20 };
var HUY     = ['🥇','🥈','🥉'];
var LUU     = 'philong-giaoban-vinhdanh-t11';
var MAU_XE  = ['#E8743B','#2F75B5','#1E9E6A','#8B5CF6','#D9376E','#0F8FA8'];

/* ---------- đọc CSV ---------- */
function tachCsv(t){
  var rows = [], cur = [], f = '', q = false;
  for (var i = 0; i < t.length; i++) {
    var c = t[i];
    if (q) { if (c === '"') { if (t[i+1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { cur.push(f); f = ''; }
    else if (c === '\n') { cur.push(f); f = ''; rows.push(cur); cur = []; }
    else if (c !== '\r') f += c;
  }
  if (f.length || cur.length) { cur.push(f); rows.push(cur); }
  return rows;
}
function soVN(s){
  s = (s || '').replace(/[\s.]/g, '').replace(',', '.');
  return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : null;
}
function chuanTen(s){ return (s || '').replace(/_/g,' ').replace(/\s+/g,' ').trim().toUpperCase(); }

/* nhãn dòng trong tab KPI → trường · hệ số (1e6 = quy ra triệu) */
var NHAN = [
  [/^Lốp Xe/i,'lop',1e6], [/Ngoài Lốp/i,'bdsc',1e6], [/Lưu Động/i,'ld',1e6],
  [/Tổng Doanh Thu/i,'tong',1e6], [/^DVL$/i,'dvl',1e6], [/^DVNL$/i,'dvnl',1e6]
];
var BO_QUA = /Tổng Lượt|Kiểm\s*Tra Xe|cuộc gọi|Tra HD|Chấm\s*KPI|Mã nhân viên|Tổng cộng|^TUẦN|^Ghi/i;

/* đọc 1 tab KPI — CHỈ cộng ngang các cột ngày, không lấy cột tổng tuần/tháng
   (giữ đúng cách đọc của trang đường đua để 2 trang không lệch số) */
function gomTab(csv, cn){
  var rows = tachCsv(csv), cot = [], ngayLbl = [], vai = null, ten = null, ra = {}, coSo = {};
  var coKT = false, dongKD = -1;
  rows.forEach(function (r0, i) {
    var a = (r0[0] || '').replace(/\s+/g,' ').trim();
    if (/KỸ THUẬT/i.test(a)) coKT = true;
    if (dongKD < 0 && /KINH DOANH/i.test(a)) dongKD = i;
  });
  if (!coKT && dongKD > 0) vai = 'kt';
  rows.forEach(function (r0) {
    var r = r0.map(function (x) { return (x || '').replace(/\s+/g,' ').trim(); });
    var ngay = [];
    r.forEach(function (c, i) { if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(c)) ngay.push(i); });
    if (ngay.length >= 3) { cot = ngay; ngayLbl = ngay.map(function (i) { return r[i]; }); return; }
    if (/KỸ THUẬT/i.test(r[0])) vai = 'kt';
    else if (/KINH DOANH/i.test(r[0])) vai = 'kd';
    for (var i = 0; i <= 2; i++) {
      var c = r[i];
      if (c && (c.match(/\d/g) || []).length <= 2 && c.indexOf('%') < 0 &&
          c.replace(/[^A-Za-zÀ-ỹ]/g,'').length >= 4 && !BO_QUA.test(c) &&
          !/KỸ THUẬT|KINH DOANH/i.test(c) &&
          !NHAN.some(function (n) { return n[0].test(c); })) { ten = chuanTen(c); break; }
    }
    var li = -1, truong = null, hs = 1;
    r.forEach(function (c, i) {
      if (li >= 0 || !c) return;
      NHAN.forEach(function (n) { if (li < 0 && n[0].test(c)) { li = i; truong = n[1]; hs = n[2]; } });
    });
    if (li < 0 || !ten || !vai || !cot.length) return;
    var k = ten + '|' + vai;
    var p = ra[k] = ra[k] || { ten:ten, cn:cn, vai:vai, lop:0, bdsc:0, ld:0, tong:0, dvl:0, dvnl:0 };
    cot.forEach(function (i, k2) {
      if (i <= li) return;
      var v = soVN(r[i]);
      if (v === null) return;
      p[truong] += v / hs;
      if (v > 0) coSo[k2] = 1;
    });
  });
  return { cn:cn, nguoi:ra, ngayCo:Object.keys(coSo).length, ngayLbl:ngayLbl, luc:Date.now() };
}

/* ---------- lấy số ---------- */
function duongCsv(n){
  var t = Date.now();
  return [
    'https://docs.google.com/spreadsheets/d/' + n.id + '/gviz/tq?tqx=out:csv&gid=' + n.gid + '&_=' + t,
    'https://docs.google.com/spreadsheets/d/' + n.id + '/export?format=csv&gid=' + n.gid + '&_=' + (t+1),
    'https://docs.google.com/spreadsheets/u/0/d/' + n.id + '/gviz/tq?tqx=out:csv&gid=' + n.gid + '&_=' + (t+2)
  ];
}
function luuTab(g){
  try { var o = JSON.parse(localStorage.getItem(LUU) || '{}'); o[g.cn] = g;
        localStorage.setItem(LUU, JSON.stringify(o)); } catch (e) {}
}
function layLuu(cn){
  try { var o = JSON.parse(localStorage.getItem(LUU) || '{}'); return o[cn] || null; } catch (e) { return null; }
}
function docMotCn(cn){
  var ds = duongCsv(NGUON[cn]), i = 0, loi = 'không đọc được';
  function thu(){
    if (i >= ds.length) return Promise.reject(new Error(loi));
    return fetch(ds[i++], { cache:'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      if (/<html|DOCTYPE/i.test(t.slice(0,200))) throw new Error('chưa mở quyền xem file');
      var g = gomTab(t, cn);
      if (!g.ngayLbl.length) throw new Error('không thấy dòng ngày trong tab');
      return g;
    }).catch(function (e) { loi = e.message || String(e); return thu(); });
  }
  return thu();
}

/* ---------- gom 3 chi nhánh ---------- */
var TT = { CN1:{}, CN2:{}, CN3:{} }, LAN_CUOI = 0, DU = null;

function dung(ds){
  var kd = [], kt = [], cn = { CN1:0, CN2:0, CN3:0 }, ngayCo = {}, canh = [];
  ds.forEach(function (g) {
    if (!g) return;
    ngayCo[g.cn] = g.ngayCo;
    Object.keys(g.nguoi).forEach(function (k) {
      var p = g.nguoi[k];
      if (p.vai === 'kd') {
        var cong = p.lop + p.bdsc, tong = Math.max(cong, p.tong);
        if (tong <= 0) return;
        var chuaTach = cong < 1 && p.tong > 0;
        if (chuaTach && canh.indexOf(p.cn) < 0) canh.push(p.cn);
        kd.push({ ten:p.ten, cn:p.cn, lop:p.lop, bdsc:p.bdsc, tong:tong, chuaTach:chuaTach });
        cn[p.cn] = (cn[p.cn] || 0) + tong;
      } else {
        var dv = p.dvl + p.dvnl;
        if (dv <= 0 && p.tong <= 0 && p.ld <= 0) return;
        kt.push({ ten:p.ten, cn:p.cn, dv:dv, ld:p.ld, tong:Math.max(p.tong, dv) });
      }
    });
  });
  kd.sort(function (a,b) { return b.tong - a.tong; });
  kt.sort(function (a,b) { return b.dv - a.dv; });
  return { kd:kd, kt:kt, cn:cn, ngayCo:ngayCo, canh:canh };
}

/* ---------- vẽ ---------- */
function tr(v){ return Math.round(v || 0).toLocaleString('vi-VN'); }
function xe(mau){
  return '<svg viewBox="0 0 64 30" width="42" height="20" aria-hidden="true">' +
    '<path d="M3 22h58l-3-7-11-2-7-7H24l-5 7-13 2z" fill="' + mau + '"/>' +
    '<path d="M24 8h13l5 5H21z" fill="#FFFFFF" opacity=".75"/>' +
    '<circle cx="17" cy="24" r="5" fill="#1F2933"/><circle cx="17" cy="24" r="2" fill="#E3EBF5"/>' +
    '<circle cx="48" cy="24" r="5" fill="#1F2933"/><circle cx="48" cy="24" r="2" fill="#E3EBF5"/></svg>';
}
function lan(o){
  /* o: {huy, ten, phu, mau, giaTri, chuan, nhan, dat, ghi} */
  var pctThat = o.pct != null ? Math.round(o.pct)
              : (o.chuan > 0 ? Math.round(o.giaTri / o.chuan * 100) : 0);
  var pct = Math.max(0, Math.min(pctThat, 100));
  return '' +
  '<div style="display:flex;align-items:center;gap:10px;height:44px">' +
    '<div style="width:26px;text-align:center;font-size:20px;line-height:1">' + (o.huy || '') + '</div>' +
    '<div style="width:186px;min-width:186px">' +
      '<div style="font-size:14px;font-weight:800;color:#17365D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + o.ten + '</div>' +
      '<div style="font-size:11px;color:#5F6B7A">' + o.phu + '</div>' +
    '</div>' +
    '<div style="flex:1;min-width:0;position:relative;height:30px;background:#E9EFF6;border-radius:15px;overflow:hidden">' +
      '<div style="position:absolute;inset:0 0 0 0;width:' + pct + '%;background:linear-gradient(90deg,' + o.mau + '33,' + o.mau + 'cc);border-radius:15px"></div>' +
      '<div style="position:absolute;top:0;bottom:0;right:0;width:7px;background:repeating-linear-gradient(45deg,#17365D 0 4px,#FFFFFF 4px 8px)"></div>' +
      '<div style="position:absolute;top:4px;left:' + pct + '%;transform:translateX(-100%)">' + xe(o.mau) + '</div>' +
    '</div>' +
    '<div style="width:104px;text-align:right">' +
      '<div style="font-size:18px;font-weight:800;color:#17365D;line-height:1.1">' + tr(o.giaTri) + '<span style="font-size:12px"> tr</span></div>' +
      '<div style="font-size:11px;font-weight:700;color:' + (o.dat ? '#1E6B3A' : '#B4600A') + '">' + (o.nhan || (pctThat + '% chuẩn')) + '</div>' +
    '</div>' +
  '</div>';
}
function khoi(tieu, phu, noi){
  return '<div style="background:#FFFFFF;border:1px solid #D9E2EC;border-radius:10px;padding:8px 14px 6px">' +
    '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:2px">' +
      '<div style="font-size:12px;font-weight:800;color:#2F75B5;letter-spacing:.6px">' + tieu + '</div>' +
      '<div style="font-size:11px;color:#5F6B7A">' + phu + '</div>' +
    '</div>' + noi + '</div>';
}
function chip(t, mau, nen){
  return '<span style="padding:2px 8px;border-radius:4px;background:' + nen + ';color:' + mau +
         ';font-size:11px;font-weight:700">' + t + '</span>';
}

function ve(){
  var w = document.getElementById('vd-than'); if (!w) return;
  var d = DU;
  if (!d) { w.innerHTML = '<div style="padding:28px;text-align:center;color:#5F6B7A;font-size:14px">Đang đọc file KPI của 3 chi nhánh…</div>'; veDau(); return; }

  /* 1 · chi nhánh — vạch đích là chi nhánh dẫn đầu */
  var dsCn = ['CN1','CN2','CN3'].map(function (c) { return { cn:c, v:d.cn[c] || 0 }; })
                                .sort(function (a,b) { return b.v - a.v; });
  var dan = dsCn[0].v || 1;
  var h1 = dsCn.map(function (r, i) {
    return lan({ huy:i === 0 ? '🏁' : '', ten:TEN_CN[r.cn], phu:'Doanh thu kinh doanh tháng',
                 mau:MAU_CN[r.cn], giaTri:r.v, chuan:dan, dat:i === 0,
                 nhan:i === 0 ? 'DẪN ĐẦU' : '-' + tr(dan - r.v) + 'tr so với dẫn đầu' });
  }).join('');

  /* 2 · kinh doanh — vạch chuẩn 450tr (lốp 350 + ngoài lốp 100) */
  var kd3 = d.kd.slice(0, 3), soCup = 0;
  var h2 = kd3.map(function (r, i) {
    /* chuẩn kinh doanh có 2 chân: lốp 350tr VÀ ngoài lốp 100tr.
       Chi nhánh chưa tách 2 dòng tiền trong file thì tạm xét trên tổng 450tr. */
    var pct = r.chuaTach ? r.tong / CHUAN.kd
                         : Math.min(r.lop / CHUAN.lop, r.bdsc / CHUAN.bdsc);
    var dat = pct >= 1;
    var huy = dat ? HUY[soCup++] : '';
    var thieu = [];
    if (r.chuaTach) { if (!dat) thieu.push('còn ' + tr(CHUAN.kd - r.tong) + 'tr tới 450tr'); }
    else {
      if (r.lop  < CHUAN.lop)  thieu.push('lốp còn ' + tr(CHUAN.lop - r.lop) + 'tr');
      if (r.bdsc < CHUAN.bdsc) thieu.push('ngoài lốp còn ' + tr(CHUAN.bdsc - r.bdsc) + 'tr');
    }
    var nhan = dat ? 'QUA VẠCH CHUẨN' : thieu.join(' · ');
    return lan({ huy:huy, ten:r.ten, phu:TEN_CN[r.cn] + (r.chuaTach ? ' · file chưa tách lốp / ngoài lốp'
                 : ' · lốp ' + tr(r.lop) + 'tr · ngoài lốp ' + tr(r.bdsc) + 'tr'),
                 mau:MAU_XE[i], giaTri:r.tong, chuan:CHUAN.kd, pct:pct * 100, dat:dat, nhan:nhan });
  }).join('');

  /* 3 · kỹ thuật viên — vạch chuẩn công dịch vụ 20tr */
  var kt3 = d.kt.slice(0, 3), soCupKt = 0;
  var h3 = kt3.map(function (r, i) {
    var dat = r.dv >= CHUAN.ktDv;
    var huy = dat ? HUY[soCupKt++] : '';
    var nhan = dat ? 'QUA VẠCH CHUẨN · ' + Math.round(r.dv / CHUAN.ktDv * 100) + '%'
                   : 'công DV còn ' + tr(Math.max(0, CHUAN.ktDv - r.dv)) + 'tr tới chuẩn';
    return lan({ huy:huy, ten:r.ten, phu:TEN_CN[r.cn] + ' · lưu động ' + tr(r.ld) + 'tr',
                 mau:MAU_XE[(i + 3) % MAU_XE.length], giaTri:r.dv, chuan:CHUAN.ktDv, dat:dat, nhan:nhan });
  }).join('');

  var themKd = Math.max(0, d.kd.length - 3), themKt = Math.max(0, d.kt.length - 3);
  w.innerHTML =
    khoi('🏁 ĐƯỜNG ĐUA CHI NHÁNH', 'Vạch đích = chi nhánh đang dẫn đầu', h1) +
    khoi('🏆 VINH DANH KINH DOANH · TOP 3', 'Vạch chuẩn tháng: lốp 350tr + ngoài lốp 100tr = 450tr' +
         (themKd ? ' · còn ' + themKd + ' người đang chạy' : ''), h2) +
    khoi('🔧 VINH DANH KỸ THUẬT VIÊN · TOP 3', 'Vạch chuẩn tháng: công dịch vụ (DVL + DVNL) 20tr' +
         (themKt ? ' · còn ' + themKt + ' người đang chạy' : ''), h3);
  veDau();
}

function veDau(){
  var el = document.getElementById('vd-nguon'); if (!el) return;
  var ds = ['CN1','CN2','CN3'].map(function (c) {
    var t = TT[c] || {};
    if (t.ok === true)  return '<b style="color:#1E6B3A">' + c + ' ✓</b>';
    if (t.ok === false) return '<b style="color:#C0392B" title="' + (t.loi || '') + '">' + c + ' ✗</b>';
    return '<span style="opacity:.6">' + c + ' ·</span>';
  }).join(' ');
  var gio = LAN_CUOI ? new Date(LAN_CUOI).toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' }) : '—';
  var canh = (DU && DU.canh && DU.canh.length)
    ? ' ' + chip('⚠ ' + DU.canh.join(', ') + ' chưa tách tiền lốp / ngoài lốp trong file', '#6B4500', '#FFF2CC') : '';
  el.innerHTML = 'NGUỒN: 3 FILE KPI CHI NHÁNH · ' + ds + ' · đọc lúc ' + gio + canh;
}

function keo(){
  var ds = ['CN1','CN2','CN3'];
  Promise.all(ds.map(function (cn) {
    return docMotCn(cn).then(function (g) {
      TT[cn] = { ok:true, loi:null }; luuTab(g); return g;
    }).catch(function (e) {
      TT[cn] = { ok:false, loi:e.message || String(e) };
      return layLuu(cn);
    });
  })).then(function (kq) {
    if (kq.some(function (g) { return !!g; })) { DU = dung(kq); LAN_CUOI = Date.now(); }
    ve();
    setTimeout(keo, 5 * 60 * 1000);
  });
}

function khoiDong(){
  if (!document.getElementById('vd-than')) return;
  ve();
  keo();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
else khoiDong();
})();
