'use strict';

{
  const button = document.querySelector('#install-app');
  const help = document.querySelector('#install-help');
  const standalone = window.matchMedia('(display-mode: standalone)');
  let installPrompt;

  function updateInstallButton() {
    button.hidden = standalone.matches || navigator.standalone === true;
  }

  button.addEventListener('click',async()=>{
    if (!installPrompt) {
      help.showModal();
      return;
    }
    const prompt = installPrompt;
    installPrompt = undefined;
    try {
      await prompt.prompt();
      const {outcome} = await prompt.userChoice;
      if (outcome==='accepted') button.hidden = true;
    } catch {
      help.showModal();
    }
  });
  help.addEventListener('close',()=>button.focus());
  standalone.addEventListener('change',updateInstallButton);
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    installPrompt = event;
    updateInstallButton();
  });
  window.addEventListener('appinstalled',()=>{
    installPrompt = undefined;
    button.hidden = true;
  });
  updateInstallButton();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(error=>{
      console.warn('Không đăng ký được bộ nhớ đệm CARDIY.',error);
    });
    /* Có bản mới thì mời tải lại — KHÔNG tự tải, vì đang họp mà trang
       nhảy lại từ đầu thì mất chỗ đang xem. Người dùng bấm mới tải. */
    let daBao = false;
    navigator.serviceWorker.addEventListener('message',event=>{
      if (!event.data || event.data.cardiy !== 'ban-moi' || daBao) return;
      daBao = true;
      const thanh = document.createElement('div');
      thanh.id = 'ban-moi';
      thanh.innerHTML = '<span>Đã có bản mới của app.</span>' +
        '<button type="button" class="button yellow">Tải lại ngay</button>' +
        '<button type="button" class="button secondary" data-bo>Để sau</button>';
      document.body.appendChild(thanh);
      thanh.querySelector('.yellow').addEventListener('click',()=>window.location.reload());
      thanh.querySelector('[data-bo]').addEventListener('click',()=>thanh.remove());
    });
  }
}
