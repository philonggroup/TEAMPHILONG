'use strict';

{
  const dialog = document.querySelector('#auto-assistant');
  const trigger = document.querySelector('#open-assistant');
  const question = document.querySelector('#assistant-question');
  const status = document.querySelector('#assistant-status');
  const copy = document.querySelector('#copy-assistant');
  const questions = {
    reception:'Cố vấn dịch vụ nên hỏi gì khi tiếp nhận xe có tiếng kêu bất thường để bàn giao đủ thông tin cho kỹ thuật viên?',
    service:'Tôi cần hỏi khách và kiểm tra thông tin nào trước khi tư vấn lốp hoặc gói bảo dưỡng phù hợp?',
    handover:'Kỹ thuật viên nên ghi gì khi bàn giao phát hiện trong lúc kiểm tra xe cho cố vấn dịch vụ?',
    customer:'Soạn giúp tôi lời trao đổi khi xe của khách cần thêm thời gian kiểm tra, gồm thời điểm cập nhật tiếp theo.',
  };

  function update() {
    copy.disabled = !question.value.trim();
    status.textContent = '';
  }

  trigger.addEventListener('click',()=>{
    dialog.showModal();
    question.focus();
  });
  document.querySelector('#close-assistant').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>trigger.focus());
  question.addEventListener('input',update);
  dialog.addEventListener('click',event=>{
    const item = event.target.closest('[data-question]');
    if (!item) return;
    question.value = questions[item.dataset.question];
    update();
    question.focus();
  });
  copy.addEventListener('click',async ()=>{
    const value = question.value.trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      status.textContent = 'Đã sao chép. Mở ChatGPT rồi dán câu hỏi.';
    } catch {
      question.focus();
      question.select();
      status.textContent = 'Dùng Ctrl+C hoặc ⌘C để sao chép phần đã chọn.';
    }
  });
}
