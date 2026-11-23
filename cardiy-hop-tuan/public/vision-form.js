'use strict';

const visionDrafts = new WeakMap();
const visionAmounts = {revenue:3,profit:1};
const visionMoneyFormat = new Intl.NumberFormat('vi-VN');

function visionForm() {
  const entry = visionDrafts.get(state.joint) ?? state.joint.vision ?? {};
  const field = (name,title,type='text') => {
    const value = label(entry[name] ?? '');
    const input = type==='long' ? '<textarea name="'+name+'" rows="3" maxlength="2000">'+value+'</textarea>'
      : '<input name="'+name+'" value="'+value+'" '+(type==='number'
        ? 'type="number" inputmode="numeric" step="1" min="'+(name.startsWith('profit')?'-999999999999999':'0')+'" max="999999999999999"'
        : 'type="text" maxlength="180"')+'>';
    return '<label>'+title+input+'</label>';
  };
  const section = (title,body) => '<section class="vision-group"><h3>'+title+'</h3>'+body+'</section>';
  const records = (count,render) => Array.from({length:count},(_,i)=>render(i+1)).join('');
  const measure = (group,title) => '<div class="vision-measure"><h4>'+title+'</h4>'+
    records(visionAmounts[group],i=>'<fieldset class="vision-metric"><legend>'+title+' '+i+'</legend>'+
      field(group+'Name'+i,'Chỉ số '+title.toLocaleLowerCase('vi-VN'))+
      field(group+'Target'+i,'Mục tiêu (₫)','number')+field(group+'Actual'+i,'Thực tế (₫)','number')+'</fieldset>')+
    '<p class="vision-total">Tổng '+title.toLocaleLowerCase('vi-VN')+
      ' · Mục tiêu <output data-vision-total="'+group+'Target">—</output> · Thực tế <output data-vision-total="'+group+'Actual">—</output></p></div>';
  return '<form id="vision-form" class="vision-form">'+
    section('Giá trị cốt lõi','<div class="vision-values">'+records(5,i=>'<fieldset><legend>Giá trị '+i+'</legend>'+
      field('valueName'+i,'Tên giá trị cốt lõi')+field('valueDetail'+i,'Mô tả giá trị cốt lõi','long')+'</fieldset>')+'</div>')+
    section('Giá trị doanh nghiệp','<div class="vision-fields">'+
      field('purpose','Mục tiêu / Nguyên nhân / Đam mê','long')+
      field('niche','Thị trường ngách của chúng ta','long')+field('tenYear','Mục tiêu 10 năm','long')+'</div>')+
    section('Chiến lược thị trường','<div class="vision-fields">'+field('market','Thị trường mục tiêu','long')+
      '<fieldset><legend>3 điểm độc quyền</legend>'+records(3,i=>field('unique'+i,'Điểm độc quyền '+i))+'</fieldset>'+
      field('process','Quy trình được chứng minh','long')+field('promise','Cam kết','long')+'</div>')+
    section('Mục tiêu 3 năm 2026–2028',measure('revenue','Doanh thu')+measure('profit','Lợi nhuận')+
      field('measurement','Chỉ số đo lường','long')+
      '<fieldset class="vision-outlook"><legend>Chúng ta sẽ trông như thế nào?</legend>'+
      records(3,i=>field('outlook'+i,'Mô tả mong đợi '+i,'long'))+'</fieldset>')+
    '<div class="vision-save"><button class="button primary" type="submit">Lưu tầm nhìn</button>'+
    '<p id="vision-status" role="status"></p></div></form>';
}
function updateVisionTotals(form) {
  for (const total of form.querySelectorAll('[data-vision-total]')) {
    const key = total.dataset.visionTotal;
    const count = key.startsWith('revenue') ? visionAmounts.revenue : visionAmounts.profit;
    const values = Array.from({length:count},(_,i)=>form.elements.namedItem(key+(i+1)).value)
      .filter(value=>value!=='').map(Number);
    total.textContent = values.length ? visionMoneyFormat.format(values.reduce((sum,value)=>sum+value,0))+' ₫' : '—';
  }
}
document.addEventListener('input',event=>{
  const form = event.target.closest('#vision-form');
  if (!form) return;
  visionDrafts.set(state.joint,Object.fromEntries(new FormData(form)));
  form.querySelector('#vision-status').textContent='';
  updateVisionTotals(form);
});
document.addEventListener('submit',event=>{
  const form = event.target;
  if (form.id!=='vision-form') return;
  event.preventDefault();
  const draft = Object.fromEntries([...new FormData(form)].flatMap(([name,value])=>{
    const trimmed=value.trim();
    return trimmed ? [[name,trimmed]] : [];
  }));
  const previous = state.joint.vision;
  state.joint.vision = draft;
  const status = form.querySelector('#vision-status');
  if (!save()) {
    state.joint.vision = previous;
    status.textContent='Chưa lưu được. Nội dung đang nhập vẫn ở trên màn hình.';
    return;
  }
  visionDrafts.delete(state.joint);
  status.textContent = window.cardiyUsesSheets?.()
    ? 'Đã lưu bản soạn. Chọn Google Sheets → Lưu lên Google Sheets để chia sẻ.'
    : 'Đã lưu tầm nhìn trên trình duyệt này.';
});
