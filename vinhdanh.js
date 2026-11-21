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
/* tab BÁO CÁO KPI NGÀY T11 — nguồn % hoàn thành KPI doanh thu của chi nhánh */
var NGUON_KPI = {
  CN1: { id:'1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc', gid:'489409049'  },
  CN2: { id:'1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k', gid:'1426227108' },
  CN3: { id:'1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc', gid:'247752852'  }
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
  [/Tổng Doanh Thu/i,'tong',1e6], [/^DVL$/i,'dvl',1e6], [/^DVNL$/i,'dvnl',1e6],
  [/Phiếu\s*Kiểm\s*Tra\s*Xe/i,'pkt',1], [/Tổng Lượt xe/i,'luot',1]
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
    var p = ra[k] = ra[k] || { ten:ten, cn:cn, vai:vai, lop:0, bdsc:0, ld:0, tong:0, dvl:0, dvnl:0, pkt:0, luot:0 };
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
var TT = { CN1:{}, CN2:{}, CN3:{} }, LAN_CUOI = 0, DU = null, KPI_CN = null;

/* đọc dòng DOANH THU MỤC TIÊU của tab KPI ngày: KPI tháng · % đạt · thực đạt
   (dò cột giống trang đường đua để 2 trang không lệch số) */
function docKpiCn(cn){
  var n = NGUON_KPI[cn], ds = duongCsv(n), i = 0, loi = '';
  function thu(){
    if (i >= ds.length) return Promise.resolve(null);
    return fetch(ds[i++], { cache:'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      var R = tachCsv(t), cot = -1, k;
      for (var j = 0; j < R.length && cot < 0; j++) {
        var r = R[j];
        if (!/DOANH\s*THU\s*M[ỤU]C\s*TIÊU/i.test((r[0] || '') + ' ' + (r[1] || ''))) continue;
        var last = -1;
        for (k = 0; k < r.length; k++) { if (/%/.test(r[k] || '')) last = k; }
        if (last > 0) cot = last - 1;
        if (cot >= 0) return { cn:cn, kpi:soVN(r[cot]) || 0, dat:soVN(r[cot + 2]) || 0 };
      }
      return null;
    }).catch(function (e) { loi = e.message || String(e); return thu(); });
  }
  return thu();
}

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
        kd.push({ ten:p.ten, cn:p.cn, lop:p.lop, bdsc:p.bdsc, tong:tong, chuaTach:chuaTach, pkt:p.pkt, luot:p.luot });
        cn[p.cn] = (cn[p.cn] || 0) + tong;
      } else {
        var dv = p.dvl + p.dvnl;
        if (dv <= 0 && p.tong <= 0 && p.ld <= 0) return;
        kt.push({ ten:p.ten, cn:p.cn, dv:dv, dvl:p.dvl, dvnl:p.dvnl, ld:p.ld,
                  tong:Math.max(p.tong, dv), pkt:p.pkt, luot:p.luot });
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
  return '<svg viewBox="0 0 64 30" width="80" height="37" aria-hidden="true">' +
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
  o.so = tr(o.giaTri) + ' ' + (o.dvi || 'tr');
  return '' +
  '<div class="vd-lan" data-vd-ten="' + (o.ten || '').replace(/"/g, '') + '"' +
       ' data-vd-huy="' + (o.huy || '') + '" data-vd-so="' + (o.so || '') + '"' +
       ' data-vd-dat="' + (o.dat ? '1' : '') + '"' +
       ' data-vd-phu="' + (o.phu || '').replace(/"/g, '') + '"' +
       ' style="display:flex;align-items:center;gap:10px;height:60px;cursor:pointer;border-radius:8px"' +
       ' title="Bấm để chúc mừng">' +
    '<div style="width:30px;text-align:center;font-size:26px;line-height:1">' + (o.huy || '') + '</div>' +
    '<div style="width:214px;min-width:214px">' +
      '<div style="font-size:17px;font-weight:800;color:#17365D;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + o.ten + '</div>' +
      '<div style="font-size:11px;color:#5F6B7A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + o.phu + '</div>' +
    '</div>' +
    '<div style="flex:1;min-width:0;position:relative;height:46px;background:#E9EFF6;border-radius:23px;overflow:hidden">' +
      '<div style="position:absolute;inset:0 0 0 0;width:' + pct + '%;background:linear-gradient(90deg,' + o.mau + '33,' + o.mau + 'cc);border-radius:23px"></div>' +
      '<div style="position:absolute;top:0;bottom:0;right:0;width:7px;background:repeating-linear-gradient(45deg,#17365D 0 4px,#FFFFFF 4px 8px)"></div>' +
      '<div style="position:absolute;top:4px;left:' + pct + '%;transform:translateX(-100%);text-align:center">' +
        (o.huy ? '<div style="position:absolute;top:-7px;left:50%;transform:translateX(-50%);' +
                 'font-size:20px;line-height:1;text-shadow:0 1px 2px rgba(255,255,255,.9)">' + o.huy + '</div>' : '') +
        xe(o.mau) + '</div>' +
    '</div>' +
    '<div style="width:118px;min-width:118px;text-align:right">' +
      '<div style="font-size:26px;font-weight:800;color:#17365D;line-height:1.1">' + tr(o.giaTri) + '<span style="font-size:12px"> ' + (o.dvi || 'tr') + '</span></div>' +
      '<div style="font-size:11px;font-weight:700;line-height:1.25;color:' + (o.dat ? '#1E6B3A' : '#B4600A') + '">' + (o.nhan || (pctThat + '% chuẩn')) + '</div>' +
    '</div>' +
  '</div>';
}
function khoi(tieu, phu, noi){
  return '<div style="background:#FFFFFF;border:1px solid #D9E2EC;border-radius:10px;padding:4px 12px 3px">' +
    '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:2px">' +
      '<div style="font-size:12px;font-weight:800;color:#2F75B5;letter-spacing:.6px">' + tieu + '</div>' +
      '<div style="font-size:11px;color:#5F6B7A">' + phu + '</div>' +
    '</div>' + noi + '</div>';
}
function chip(t, mau, nen){
  return '<span style="padding:2px 8px;border-radius:4px;background:' + nen + ';color:' + mau +
         ';font-size:11px;font-weight:700">' + t + '</span>';
}


/* ═══════ ⚡ BỨT TỐC & VINH DANH — 5 chỉ số, cùng nguồn đường đua ═══════
   Tracy chốt 21/11/2026: đưa mẫu này lên màn Bước 4. */
function dinhNhat(ds, f){
  var x = ds.filter(function (r) { return (r[f] || 0) > 0; })
            .sort(function (a, b) { return (b[f] || 0) - (a[f] || 0); })[0];
  return x || null;
}
function ngan_(t){ return (t || '').trim().split(' ').slice(-2).join(' '); }
function oVinh(ico, nhan, ten, so, phu){
  return '' +
  '<div style="flex:1;min-width:0;background:#FFFFFF;border:1px solid #D9E2EC;border-radius:10px;' +
         'padding:6px 9px;display:flex;flex-direction:column;gap:1px">' +
    '<div style="font-size:11px;font-weight:700;color:#5F6B7A;letter-spacing:.3px">' + ico + ' ' + nhan + '</div>' +
    '<div style="font-size:14px;font-weight:800;color:#17365D;white-space:nowrap;overflow:hidden;' +
           'text-overflow:ellipsis">' + (ten || '—') + '</div>' +
    '<div style="font-size:13px;font-weight:800;color:#2F75B5">' + (so || '—') + '</div>' +
    (phu ? '<div style="font-size:10px;color:#9AA7B5">' + phu + '</div>' : '') +
  '</div>';
}
/* 2 chỉ số KTV gọn trong phụ đề khối — không chiếm thêm dòng */
/* dải trên cùng: 🔥 BỨT TỐC (% vượt chuẩn cao nhất) + 🏆 CÚP VÀNG các hạng mục */
function oTren(ico, nhan, noi, vien, nen){
  return '<div style="flex:1;min-width:0;background:' + nen + ';border:2px solid ' + vien + ';' +
         'border-radius:12px;padding:7px 13px;display:flex;align-items:center;gap:11px">' +
    '<div style="font-size:30px;line-height:1">' + ico + '</div>' +
    '<div style="min-width:0;flex:1">' +
      '<div style="font-size:11px;font-weight:800;color:#5F6B7A;letter-spacing:.5px">' + nhan + '</div>' +
      '<div style="font-size:14px;font-weight:800;color:#17365D;line-height:1.3">' + noi + '</div>' +
    '</div></div>';
}
function daiTren(d){
  var hang = [
    { ds:d.kd, f:'lop',  chuan:CHUAN.lop,      ten:'lốp' },
    { ds:d.kd, f:'bdsc', chuan:CHUAN.bdsc,     ten:'BD + SC' },
    { ds:d.kt, f:'dvl',  chuan:CHUAN.ktDv / 2, ten:'DVL' },
    { ds:d.kt, f:'dvnl', chuan:CHUAN.ktDv / 2, ten:'DVNL' }
  ];
  var cup = [], nhanh = null, caoNhat = 0;
  hang.forEach(function (h) {
    var top = h.ds.filter(function (r) { return (r[f0(h)] || 0) > 0 && !r.chuaTach; })
                  .sort(function (a, b) { return b[f0(h)] - a[f0(h)]; })[0];
    if (!top) return;
    var pct = top[f0(h)] / h.chuan * 100;
    if (pct >= 100) cup.push('<b style="color:#17365D">' + ngan_(top.ten) + '</b> ' +
                             '<span style="color:#9AA7B5">(' + h.ten + ')</span>');
    if (pct > caoNhat) { caoNhat = pct; nhanh = { r:top, h:h, pct:pct }; }
  });
  function f0(h){ return h.f; }
  var butToc = nhanh
    ? '<b>' + ngan_(nhanh.r.ten) + '</b> · ' + nhanh.h.ten + ' ' + Math.round(nhanh.pct) + '% vạch chuẩn'
    : 'chưa có ai vượt chuẩn';
  var cupTxt = cup.length ? cup.join(' · ') : 'chưa có ai qua vạch chuẩn';
  return '<div style="display:flex;gap:9px;align-items:stretch">' +
    oTren('🔥', 'BỨT TỐC MẠNH NHẤT', butToc, '#E8743B', 'linear-gradient(135deg,#FFF1E8,#FFE3D1)') +
    oTren('🏆', 'ĐANG GIỮ CÚP VÀNG', cupTxt, '#F2B705', 'linear-gradient(135deg,#FFF8E1,#FFEFBF)') +
  '</div>';
}

function phuKtv(d){
  var kt = d.kt;
  var pkt = dinhNhat(kt, 'pkt'), luot = dinhNhat(kt, 'luot');
  function co(f){ return kt.filter(function (r) { return (r[f] || 0) > 0; }).length + '/' + kt.length; }
  var p = [];
  if (pkt)  p.push('🔧 nhiều phiếu kiểm tra xe nhất: <b style="color:#17365D">' + ngan_(pkt.ten) +
                   ' ' + Math.round(pkt.pkt) + '</b> <span style="color:#9AA7B5">(' + co('pkt') + ' có nhập)</span>');
  if (luot) p.push('🚗 tiếp nhận nhiều lượt xe nhất: <b style="color:#17365D">' + ngan_(luot.ten) +
                   ' ' + Math.round(luot.luot) + '</b> <span style="color:#9AA7B5">(' + co('luot') + ' có nhập)</span>');
  return p.length ? '<br>' + p.join(' · ') : '';
}

function daiVinhDanh(d){
  var kd = d.kd, kt = d.kt;
  /* bdsc nay co khoi vinh danh rieng, khong lap lai o dai duoi */
  var pkt  = dinhNhat(kt, 'pkt'),  luot = dinhNhat(kt, 'luot');
  var dau  = kd[0] || null;                       /* kinh doanh tổng doanh thu cao nhất */
  function phu_(ds, f){
    var co = ds.filter(function (r) { return (r[f] || 0) > 0; }).length;
    return co + '/' + ds.length + ' người có nhập';
  }
  return '' +
  '<div style="display:flex;gap:8px;align-items:stretch">' +
    oVinh('🏆', 'Doanh thu kinh doanh cao nhất', dau ? ngan_(dau.ten) : null,
          dau ? tr(dau.tong) + ' tr' : null, dau ? TEN_CN[dau.cn] : '') +
    oVinh('🔧', 'KTV nhiều phiếu kiểm tra xe nhất', pkt ? ngan_(pkt.ten) : null,
          pkt ? Math.round(pkt.pkt) + ' phiếu' : null, phu_(kt, 'pkt')) +
    oVinh('🚗', 'KTV tiếp nhận nhiều lượt xe nhất', luot ? ngan_(luot.ten) : null,
          luot ? Math.round(luot.luot) + ' lượt' : null, phu_(kt, 'luot')) +
  '</div>';
}


/* ═══════ 🐉 CHÚC MỪNG — bấm vào người được vinh danh ═══════ */
/* icon cảm xúc Phi Long theo thành tích — bộ stickers/ trong repo */
function iconCamXuc(huy, dat){
  if (huy === '🥇') return { anh:'PL_33_cup_vang.png',   loi:'CÚP VÀNG — SỐ MỘT HỆ THỐNG' };
  if (huy === '🥈') return { anh:'PL_14_an_mung.png',    loi:'CÚP BẠC — ĂN MỪNG NÀO' };
  if (huy === '🥉') return { anh:'PL_14_an_mung.png',    loi:'CÚP ĐỒNG — ĂN MỪNG NÀO' };
  if (huy === '🏁') return { anh:'PL_30_quyet_thang.png',loi:'ĐANG DẪN ĐẦU ĐƯỜNG ĐUA' };
  if (dat)          return { anh:'PL_23_dat_chuan.png',  loi:'ĐÃ QUA VẠCH CHUẨN' };
  return { anh:'PL_30_quyet_thang.png', loi:'CÒN CHẠY — TUẦN SAU VỀ ĐÍCH' };
}
function moChucMung(ten, huy, so, phu, dat){
  var cu = document.getElementById('vd-chucmung');
  if (cu) cu.parentNode.removeChild(cu);
  var ov = document.createElement('div');
  ov.id = 'vd-chucmung';
  ov.setAttribute('style',
    'position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;' +
    'background:rgba(10,24,45,.82);backdrop-filter:blur(2px);cursor:pointer');
  var ic = iconCamXuc(huy, dat === '1' || dat === true);
  ov.innerHTML =
    '<div style="position:relative;max-width:620px;padding:24px 34px;border-radius:18px;text-align:center;' +
           'background:linear-gradient(160deg,#FFFFFF,#F2F7FD);border:3px solid #F2B705;' +
           'box-shadow:0 18px 50px rgba(0,0,0,.35);animation:vdZoom .28s ease-out">' +
      '<img src="stickers/' + ic.anh + '" alt="" style="width:132px;height:132px;object-fit:contain;' +
             'filter:drop-shadow(0 6px 14px rgba(0,0,0,.25));animation:vdNhun 1.1s ease-in-out infinite">' +
      '<div style="margin-top:4px;font-size:13px;font-weight:800;color:#B4600A;letter-spacing:2px">' +
        'CHÚC MỪNG' + (huy ? ' ' + huy : '') + '</div>' +
      '<div style="font-size:12px;font-weight:700;color:#1E6B3A;letter-spacing:1px">' + ic.loi + '</div>' +
      '<div style="margin-top:4px;font-size:40px;font-weight:900;color:#17365D;line-height:1.1">' + ten + '</div>' +
      (phu ? '<div style="margin-top:4px;font-size:14px;color:#5F6B7A">' + phu + '</div>' : '') +
      (so  ? '<div style="margin-top:10px;display:inline-block;padding:6px 20px;border-radius:999px;' +
             'background:#F2B705;color:#17365D;font-size:24px;font-weight:900">' + so + '</div>' : '') +
      '<div style="margin-top:14px;font-size:12px;color:#9AA7B5">Bấm bất kỳ đâu để đóng · ' +
        'mời nói 30 giây: tôi đã làm khác gì</div>' +
    '</div>';
  ov.addEventListener('click', function () {
    if (ov.parentNode) ov.parentNode.removeChild(ov);
  });
  var sec = document.getElementById('sc-GB4VinhDanh');
  var khung = (sec && sec.querySelector('.pl-frame')) || sec || document.body;
  khung.style.position = khung.style.position || 'relative';
  khung.appendChild(ov);
}

function ganChucMung(){
  if (document.getElementById('vd-css-zoom')) return;
  var st = document.createElement('style');
  st.id = 'vd-css-zoom';
  st.textContent = '@keyframes vdZoom{from{transform:scale(.72);opacity:0}to{transform:scale(1);opacity:1}}' +
                   '@keyframes vdNhun{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}' +
                   '.vd-lan:hover{background:#F4F9FF;box-shadow:inset 0 0 0 1px #C3D3E3}';
  document.head.appendChild(st);
  document.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('.vd-lan');
    if (!l) return;
    moChucMung(l.getAttribute('data-vd-ten'), l.getAttribute('data-vd-huy'),
               l.getAttribute('data-vd-so'), l.getAttribute('data-vd-phu'),
               l.getAttribute('data-vd-dat'));
  });
}

function ve(){
  var w = document.getElementById('vd-than'); if (!w) return;
  var d = DU;
  if (!d) { w.innerHTML = '<div style="padding:28px;text-align:center;color:#5F6B7A;font-size:14px">Đang đọc file KPI của 3 chi nhánh…</div>'; veDau(); return; }

  /* 1 · chi nhánh — vạch đích = 100% KPI doanh thu tháng của chính chi nhánh */
  var h1 = ['CN1','CN2','CN3'].map(function (c) {
    var k = (KPI_CN && KPI_CN[c]) || null;
    return { cn:c, kpi:k ? k.kpi : 0, dat:k ? k.dat : (d.cn[c] || 0) * 1e6 };
  }).map(function (r) {
    r.pct = r.kpi > 0 ? r.dat / r.kpi * 100 : 0;
    return r;
  }).sort(function (a, b) { return b.pct - a.pct; })
  .map(function (r, i) {
    var dat = r.pct >= 100;
    var nhan = r.kpi > 0
      ? (dat ? 'ĐẠT KPI · ' + Math.round(r.pct) + '%'
             : 'còn ' + tr((r.kpi - r.dat) / 1e6) + 'tr tới KPI')
      : 'chưa có KPI trong file';
    return lan({ huy:i === 0 && r.kpi > 0 ? '🏁' : '', ten:TEN_CN[r.cn],
                 phu:'Doanh thu tháng · KPI ' + tr(r.kpi / 1e6) + 'tr',
                 mau:MAU_CN[r.cn], giaTri:r.dat / 1e6, chuan:r.kpi / 1e6,
                 pct:r.pct, dat:dat, nhan:nhan });
  }).join('');

  /* 2 · kinh doanh — 2 hạng mục riêng: LỐP (chuẩn 350tr) và BD+SC (chuẩn 100tr) */
  function topHang(f, chuan, nhanDv){
    var ds = d.kd.filter(function (r) { return !r.chuaTach && (r[f] || 0) > 0; })
                                  .sort(function (a, b) { return (b[f] || 0) - (a[f] || 0); }).slice(0, 1);
    return ds.map(function (r, i) {
      var dat = r[f] >= chuan;
      var nhan = dat ? 'QUA VẠCH CHUẨN · ' + Math.round(r[f] / chuan * 100) + '%'
                     : 'còn ' + tr(chuan - r[f]) + 'tr tới chuẩn';
      return lan({ huy:dat ? '🥇' : '', ten:r.ten, phu:TEN_CN[r.cn] + ' · ' + nhanDv,
                   mau:MAU_XE[0], giaTri:r[f], chuan:chuan, dat:dat, nhan:nhan });
    }).join('') || '<div style="padding:6px 0;font-size:12px;color:#9AA7B5">' +
                   'Chưa chi nhánh nào tách dòng tiền này trong file.</div>';
  }
  var h2a = topHang('lop',  CHUAN.lop,  'doanh thu lốp tháng');
  var h2b = topHang('bdsc', CHUAN.bdsc, 'bảo dưỡng + sửa chữa tháng');
  var chuaTach = d.kd.filter(function (r) { return r.chuaTach; }).length;

  /* 3 · kỹ thuật viên — 2 hạng mục riêng: DVL và DVNL */
  function topKt(f, nhanDv){
    var ds = kt0.filter(function (r) { return (r[f] || 0) > 0; })
                                .sort(function (a, b) { return (b[f] || 0) - (a[f] || 0); }).slice(0, 1);
    var chuan = CHUAN.ktDv / 2;
    return ds.map(function (r, i) {
      var dat = r[f] >= chuan;
      var nhan = dat ? 'QUA VẠCH CHUẨN · ' + Math.round(r[f] / chuan * 100) + '%'
                     : 'còn ' + tr(chuan - r[f]) + 'tr tới chuẩn';
      return lan({ huy:dat ? '🥇' : '', ten:r.ten, phu:TEN_CN[r.cn] + ' · ' + nhanDv,
                   mau:MAU_XE[2], giaTri:r[f], chuan:chuan, dat:dat, nhan:nhan });
    }).join('') || '<div style="padding:6px 0;font-size:12px;color:#9AA7B5">Chưa có số.</div>';
  }
  var kt0 = d.kt;
  var h3a = topKt('dvl',  'công dịch vụ lốp tháng');
  var h3b = topKt('dvnl', 'công dịch vụ ngoài lốp tháng');

  var themKt = Math.max(0, d.kt.length - 3);
  w.innerHTML =
    daiTren(d) +
    khoi('🏆 VINH DANH KINH DOANH · 🛞 DOANH THU LỐP · TOP 1', 'Vạch chuẩn tháng 350tr' + (chuaTach ? ' · ' + chuaTach + ' người chưa tách dòng tiền trong file' : ''), h2a) +
    khoi('🏆 VINH DANH KINH DOANH · 🛠 BẢO DƯỠNG + SỬA CHỮA · TOP 1', 'Vạch chuẩn tháng 100tr', h2b) +
    khoi('🔧 VINH DANH KTV · DOANH THU DVL · TOP 1', 'Vạch chuẩn tháng 10tr', h3a) +
    khoi('🔧 VINH DANH KTV · DOANH THU DVNL · TOP 1', 'Vạch chuẩn tháng 10tr' + phuKtv(d), h3b);
  veDau();
  ganChucMung();
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
  veHuyHieu();
}

/* huy hiệu nguồn của riêng màn Vinh danh — màn này đọc file KPI, không phải số minh hoạ.
   Script chính của trang đặt chung 1 nhãn cho mọi màn nên phải ghi đè lại định kỳ. */
function veHuyHieu(){
  var sec = document.getElementById('sc-GB4VinhDanh'); if (!sec) return;
  var b = sec.querySelector('.pl-badge-nguon'); if (!b) return;
  var ok = ['CN1','CN2','CN3'].filter(function (c) { return TT[c] && TT[c].ok; }).length;
  if (ok === 3) { b.textContent = 'SỐ LIVE · FILE KPI 3 CHI NHÁNH';
                  b.style.background = '#E7F5EC'; b.style.color = '#1E6B3A'; }
  else if (ok > 0) { b.textContent = 'SỐ LIVE · ' + ok + '/3 FILE KPI';
                  b.style.background = '#FFF2CC'; b.style.color = '#6B4500'; }
  else { b.textContent = 'CHƯA ĐỌC ĐƯỢC FILE KPI';
         b.style.background = '#FDE2E2'; b.style.color = '#9B1C1C'; }
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
    /* KPI doanh thu tháng của chi nhánh — tab BÁO CÁO KPI NGÀY T11 */
    return Promise.all(ds.map(function (cn) {
      return docKpiCn(cn).catch(function () { return null; });
    })).then(function (kpis) {
      var m = {};
      kpis.forEach(function (x) { if (x && x.kpi > 0) m[x.cn] = x; });
      if (Object.keys(m).length) { KPI_CN = m; ve(); }
    });
  }).then(function () {
    setTimeout(keo, 5 * 60 * 1000);
  });
}

function khoiDong(){
  if (!document.getElementById('vd-than')) return;
  ve();
  keo();
  setInterval(veHuyHieu, 10000);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong);
else khoiDong();
})();
