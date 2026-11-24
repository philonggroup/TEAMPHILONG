'use strict';
/* ════════════════════════════════════════════════════════════════════
   CỔNG ĐĂNG NHẬP THEO BÀN
   Tracy chốt 24/11/2026: mỗi bàn một mật khẩu, nhập đúng mật khẩu nào
   thì vào thẳng bàn đó.
     Tất cả 3 chi nhánh · PHI LONG 1 · PHI LONG 2 · PHI LONG 3

   NÓI RÕ MỘT LẦN: đây là CỬA, KHÔNG PHẢI KÉT.
   Trang này là trang tĩnh trên GitHub Pages, mọi thứ chạy trên máy
   người xem. Mã nguồn để băm SHA-256 kèm chuỗi muối nên xem mã không
   thấy mật khẩu, nhưng người biết việc vẫn qua được. Nó chặn người
   vô tình mở link, không chặn được người cố tình.
   Muốn chặn thật thì phải kiểm mật khẩu ở phía máy chủ (cầu nối Apps
   Script) — khi nào Tracy chốt thì đổi, mã đã chừa sẵn chỗ.
   ════════════════════════════════════════════════════════════════════ */
{
  const MUOI = 'CARDIY-HOPNHANH-2026';
  const KHOA = 'cardiy_dang_nhap';
  /* Băm SHA-256 của (muối + mật khẩu) — không để mật khẩu trần trong mã. */
  const CUA = [
    {bam:'1c71bf30eb7c296dbebd4c110ba12290009fdc4873e0149b2947e7fb1942ed0b', ban:-1, ten:'Tất cả 3 chi nhánh'},
    {bam:'8d609fb2fe37e41de9bda0c50912afdd657b310f4fa300de6f076a46a5904821', ban:0,  ten:'PHI LONG 1'},
    {bam:'ba91940646ca144e20aea19c3d711ee1c58d33337a51e2b4a34e3b3e30a26ef6', ban:1,  ten:'PHI LONG 2'},
    {bam:'851aca15941e06b2a3b083215cf32eb8b423bf7316fd674978870480e9aec36b', ban:2,  ten:'PHI LONG 3'},
  ];

  async function bam(mk) {
    const d = new TextEncoder().encode(MUOI + mk);
    const h = await window.crypto.subtle.digest('SHA-256', d);
    return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2,'0')).join('');
  }
  function daVao() {
    try {
      const v = JSON.parse(window.localStorage.getItem(KHOA) || 'null');
      return v && CUA.some(c => c.ten === v.ten) ? v : null;
    } catch (e) { return null; }
  }
  function ghiVao(c) {
    try { window.localStorage.setItem(KHOA, JSON.stringify({ten: c.ten, ban: c.ban, luc: Date.now()})); } catch (e) {}
  }

  let man = null;
  function dungMan() {
    man = document.createElement('div');
    man.id = 'cua-dang-nhap';
    man.innerHTML =
      '<form class="cua-hop" autocomplete="off">' +
      '<img class="cua-logo" src="./app-192.png" alt="" width="64" height="64">' +
      '<h1>CARDIY · Họp nhanh</h1>' +
      '<p class="cua-phu">Nhập mật khẩu của bàn họp để vào</p>' +
      '<label class="cua-o"><span>Mật khẩu</span>' +
      '<input type="password" name="mk" required autocomplete="current-password" ' +
      'placeholder="Mật khẩu bàn họp" autofocus></label>' +
      '<p class="cua-bao" role="status"></p>' +
      '<button type="submit" class="button yellow cua-nut">Vào họp</button>' +
      '<p class="cua-chan">Mỗi chi nhánh một mật khẩu riêng · hỏi Quản lý chi nhánh nếu chưa có</p>' +
      '</form>';
    document.body.appendChild(man);
    man.querySelector('form').addEventListener('submit', vao);
  }
  async function vao(event) {
    event.preventDefault();
    const f = event.target;
    const o = f.querySelector('.cua-bao');
    const mk = String(f.elements.mk.value || '');
    if (!mk) return;
    o.textContent = 'Đang kiểm…';
    let h = '';
    try { h = await bam(mk); } catch (e) { o.textContent = 'Trình duyệt này không kiểm được mật khẩu.'; return; }
    const c = CUA.find(x => x.bam === h);
    if (!c) { o.textContent = 'Mật khẩu chưa đúng. Thử lại hoặc hỏi Quản lý chi nhánh.'; f.elements.mk.select(); return; }
    ghiVao(c);
    moCua(c);
  }
  function moCua(c) {
    if (man) { man.remove(); man = null; }
    document.body.classList.remove('dang-khoa');
    /* Vào đúng bàn của mật khẩu vừa nhập. -1 là xem cả 3 chi nhánh. */
    const i = c.ban < 0 ? jointIndex : c.ban;
    if (state.branch !== i) {
      state.branch = i;
      branchSelect.selectedIndex = i;
      save();
    }
    render();
    if (typeof message === 'function') message('Đã vào bàn ' + c.ten);
  }
  function thoat() {
    try { window.localStorage.removeItem(KHOA); } catch (e) {}
    window.location.reload();
  }

  const cu = daVao();
  if (cu) {
    const c = CUA.find(x => x.ten === cu.ten);
    const i = c && c.ban < 0 ? jointIndex : (c ? c.ban : null);
    if (i !== null && state.branch !== i) { state.branch = i; branchSelect.selectedIndex = i; save(); render(); }
  } else {
    document.body.classList.add('dang-khoa');
    dungMan();
  }
  window.CARDIY_CUA = {thoat: thoat, dangVao: () => (daVao() || {}).ten || ''};
}
