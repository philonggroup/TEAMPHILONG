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
  }
}
