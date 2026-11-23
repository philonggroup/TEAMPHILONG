'use strict';

const swotDrafts = new WeakMap();
const swotSections = [
  ['strength','Điểm mạnh','Điều gì giúp doanh nghiệp thành công?'],
  ['weakness','Điểm yếu','Hạn chế nào đang ảnh hưởng đến doanh nghiệp?'],
  ['opportunity','Cơ hội','Yếu tố nào có thể giúp doanh nghiệp tăng trưởng?'],
  ['threat','Thách thức','Doanh nghiệp đang đối mặt với trở ngại nào?'],
];
function swotPage() {
  const values=swotDrafts.get(state.joint) ?? state.joint.swot ?? {};
  const cards=swotSections.map(([key,title,prompt])=>{
    const rows=Array.from({length:3},(_,i)=>{
      const name=key+(i+1);
      return '<li><input name="'+name+'Name" maxlength="180" aria-label="Tên '+title+' '+(i+1)+
        '" placeholder="Tên '+title.toLowerCase()+'" value="'+label(values[name+'Name'])+'">'+
        '<textarea name="'+name+'Detail" maxlength="2000" rows="2" aria-label="Mô tả '+title+' '+(i+1)+
        '" placeholder="'+prompt+'">'+label(values[name+'Detail'])+'</textarea></li>';
    }).join('');
    return '<section class="panel swot-card"><h2>'+title+'</h2><ol>'+rows+'</ol></section>';
  }).join('');
  return strategyTabs('swot')+pageTitle('SWOT','Phi Long Group',strategyExcelControls('swot'))+
    '<form id="swot-form"><div class="swot-grid">'+cards+'</div>'+
    '<div class="annual-footer"><button type="submit" class="button primary">Lưu SWOT</button>'+
    '<p id="swot-status" role="status"></p></div></form>';
}
document.addEventListener('input',event=>{
  if (event.target.form?.id==='swot-form') {
    swotDrafts.set(state.joint,Object.fromEntries(new FormData(event.target.form)));
    document.querySelector('#swot-status').textContent='';
  }
});
document.addEventListener('submit',event=>{
  const form=event.target;
  if (form.id!=='swot-form') return;
  event.preventDefault();
  const previous=state.joint.swot;
  const values=[...new FormData(form)].map(([key,value])=>[key,value.trim()]).filter(([,value])=>value!=='');
  if (values.length) state.joint.swot=Object.fromEntries(values);
  else delete state.joint.swot;
  const status=form.querySelector('#swot-status');
  if (!save()) {
    state.joint.swot=previous;
    status.textContent='Chưa lưu được SWOT. Nội dung vẫn còn trên màn hình.';
    return;
  }
  swotDrafts.delete(state.joint);
  status.textContent=window.cardiyUsesSheets?.()
    ? 'Đã lưu bản soạn. Chọn Google Sheets → Lưu lên Google Sheets để chia sẻ.'
    : 'Đã lưu SWOT trên trình duyệt này.';
});
