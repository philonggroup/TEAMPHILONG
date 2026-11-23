'use strict';

const awardCategories = [
  'Chi nhánh đạt KPI doanh thu',
  'Kinh doanh · Doanh thu lốp',
  'Kinh doanh · Bảo dưỡng và sửa chữa',
  'KTV · Doanh thu DVL',
  'KTV · Doanh thu DVNL',
  'Chỉ tiêu khác',
];
const awardUnits = ['triệu đ','đơn','xe','lượt','lốp','phiếu','khách','%'];
const ratio = item=>item.actual/item.target;
const awardResult = item=>showNumber(item.actual,item.unit)+' / '+showNumber(item.target,item.unit)+' · '+fmt.format(ratio(item)*100)+'%';
function validAwardPhoto(photo) {
  return typeof photo==='string' && photo.length<=12000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo);
}
function awardPortrait(photo) {
  return '<div class="award-portrait">'+(validAwardPhoto(photo)
    ? '<img alt="" src="'+photo+'" width="256" height="320">'
    : '<span class="award-icon" aria-hidden="true">'+icon('spark')+'</span>')+'</div>';
}
async function prepareAwardPhoto(file) {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>12*1024*1024) {
    throw new Error('Chọn ảnh JPG, PNG hoặc WebP tối đa 12 MB.');
  }
  const url=URL.createObjectURL(file);
  try {
    const image=new Image();
    image.src=url;
    await image.decode();
    const canvas=document.createElement('canvas');
    const context=canvas.getContext('2d',{alpha:false});
    const width=Math.min(image.naturalWidth,image.naturalHeight*4/5);
    const height=width*5/4;
    const left=(image.naturalWidth-width)/2;
    const top=(image.naturalHeight-height)/2;
    for (const size of [256,192,128,96]) {
      canvas.width=size;
      canvas.height=size*5/4;
      context.fillStyle='#ffffff';
      context.fillRect(0,0,canvas.width,canvas.height);
      context.drawImage(image,left,top,width,height,0,0,canvas.width,canvas.height);
      const photo=canvas.toDataURL('image/jpeg',0.72);
      if (validAwardPhoto(photo)) return photo;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
  throw new Error('Không thể thu gọn ảnh.');
}
function awardPhotoEditor(context,item) {
  context.photo=validAwardPhoto(item.photo)?item.photo:'';
  const field=document.createElement('div');
  field.className='award-photo-editor';
  field.innerHTML='<div class="award-photo-preview" aria-hidden="true"></div><div>'+
    '<label for="award-photo">Ảnh nhân sự (không bắt buộc)</label>'+
    '<input id="award-photo" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="award-photo-help">'+
    '<small id="award-photo-help">JPG, PNG hoặc WebP · tối đa 12 MB</small>'+
    '<button type="button" class="button secondary" hidden>Bỏ ảnh</button>'+
    '<p role="status"></p></div>';
  const input=field.querySelector('input');
  const status=field.querySelector('[role="status"]');
  const remove=field.querySelector('button');
  const refresh=()=>{
    field.querySelector('.award-photo-preview').innerHTML=awardPortrait(context.photo);
    remove.hidden=!context.photo;
  };
  refresh();
  input.onchange=async ()=>{
    const file=input.files[0];
    if (!file) return;
    context.photoPending=true;
    status.textContent='Đang xử lý ảnh…';
    try {
      const photo=await prepareAwardPhoto(file);
      if (input.files[0]!==file || !field.isConnected) return;
      context.photo=photo;
      refresh();
      status.textContent='Ảnh đã sẵn sàng.';
    } catch {
      if (input.files[0]!==file || !field.isConnected) return;
      status.textContent='Không mở được ảnh. Chọn ảnh JPG, PNG hoặc WebP tối đa 12 MB.';
    } finally {
      if (input.files[0]===file) {
        context.photoPending=false;
        input.value='';
      }
    }
  };
  remove.onclick=()=>{
    input.value='';
    context.photoPending=false;
    context.photo='';
    refresh();
    status.textContent='Đã bỏ ảnh.';
  };
  return field;
}
function awardError(item) {
  if (!(Number(item.target)>0)) return {field:'target',message:'Chỉ tiêu phải lớn hơn 0.'};
  if (!(Number(item.actual)>=Number(item.target))) return {field:'actual',message:'Kết quả phải đạt chỉ tiêu mới được vinh danh.'};
  if (item.unit==='%' && Math.max(Number(item.actual),Number(item.target))>100) {
    return {field:'actual',message:'Chỉ số phần trăm phải từ 0 đến 100%.'};
  }
  return null;
}
function awardDate() {
  const current=data().session;
  return current && !current.endedAt ? current.date : today();
}
function awardRecords(day, all=false) {
  const group=periodData();
  const current=data();
  const scopes=isJoint()
    ? [[group.joint,''],...group.branches.map((branch,index)=>[branch,branchNames[index]])]
    : [[current,branchSelect.value],[group.joint,'']];
  return scopes.flatMap(([dataset,branch])=>(dataset.awards??[])
    .filter(item=>(isJoint()||branch||item.branch===branchSelect.value) && (all||periodDate(item.date)===periodDate(day)))
    .map(item=>({item:{...item,branch:item.branch||branch},editable:dataset===current})));
}
function awardCandidates() {
  const headline=['doanh thu','doanh thu '+periodName(),'tổng doanh thu','tổng doanh thu '+periodName()];
  return periodData().branches.flatMap((branch,index)=>{
    if (!isJoint() && index!==state.branch) return [];
    const revenue=branch.kpis.find(kpi=>kpi.unit==='triệu đ' && headline.includes(kpi.title.trim().toLocaleLowerCase('vi-VN')));
    if (!revenue || awardError(revenue)) return [];
    return [{index,revenue}];
  }).sort((a,b)=>ratio(b.revenue)-ratio(a.revenue));
}
function recognizedCandidate(index,day) {
  const branch=branchNames[index];
  return awardRecords(day).some(({item})=>item.category===awardCategories[0] && item.title===branch && item.branch===branch);
}
function awardLines(day) {
  return awardRecords(day).map(({item:{photo,...item}})=>item);
}
function awardsPage() {
  const day=awardDate();
  const online=window.cardiyUsesSheets?.()===true;
  const existing=awardRecords(day,true).sort((a,b)=>b.item.date.localeCompare(a.item.date)||ratio(b.item)-ratio(a.item));
  const currentPeriod=periodDate(day);
  const candidates=awardCandidates();
  const next=candidates.map(({index,revenue})=>{
    const exists=recognizedCandidate(index,day);
    const button=exists?pill('Đã vinh danh','good'):online
      ? '<button class="button secondary" data-action="nominate-award" data-key="'+index+'">Ghi vinh danh</button>'
      : '';
    return '<div class="row"><div class="row-text"><strong>'+label(branchNames[index])+'</strong>'+
      '<small>'+label(revenue.title)+' · '+awardResult(revenue)+'</small></div>'+button+'</div>';
  }).join('');
  const cards=existing.map(({item,editable},index)=>
    '<article class="award-card">'+awardPortrait(item.photo)+'<div class="award-detail">'+
    '<p class="award-category">'+label(item.category)+'</p><h3>'+label(item.title)+'</h3>'+
    '<p class="award-meta">'+label(item.branch)+' · '+dateText(item.date)+'</p>'+
    '<p class="award-result">'+awardResult(item)+'</p>'+
    (item.reason?'<p class="award-reason">'+label(item.reason)+'</p>':'')+
    '<div class="session-actions">'+
    '<button class="button secondary" data-action="celebrate-award" data-key="'+index+'">Chúc mừng</button>'+
    (editable?editButton('awards',item.id):'')+'</div></div></article>').join('');
  const guidance=online?'KPI doanh thu của kỳ đang mở trong Google Sheets.':'KPI đang xem trên máy có thể gồm dữ liệu mẫu. Mở Google Sheets để ghi nhận từ KPI nguồn chuẩn.';
  return pageTitle('Vinh danh',currentPeriod+' · '+label(branchSelect.value),addButton('awards','Thêm vinh danh'))+
    '<div class="column">'+panel('Chi nhánh đạt chỉ tiêu doanh thu',guidance,'',
      '<div class="list">'+(next||'<p class="empty">Chưa có KPI doanh thu đạt chỉ tiêu trong kỳ này.</p>')+'</div>')+
    panel('Bảng Vinh danh','Kết quả từ 100% chỉ tiêu trở lên. Khi chúc mừng, mời người được vinh danh chia sẻ ngắn.','',
      cards?'<div class="award-grid">'+cards+'</div>':'<div class="list"><p class="empty">Chưa có ghi nhận vinh danh trong phạm vi này.</p></div>')+'</div>';
}
function nominateAward(index) {
  if (window.cardiyUsesSheets?.()!==true || recognizedCandidate(index,awardDate())) return;
  const candidate=awardCandidates().find(entry=>entry.index===index);
  if (!candidate) return;
  const {revenue}=candidate;
  openEditor('awards',null,{title:branchNames[index],branch:branchNames[index],category:awardCategories[0],
    date:awardDate(),actual:revenue.actual,target:revenue.target,unit:revenue.unit,reason:'Đạt KPI '+revenue.title.toLocaleLowerCase('vi-VN')+'.'});
}
function celebrateAward(index) {
  const selected=awardRecords(awardDate(),true).sort((a,b)=>b.item.date.localeCompare(a.item.date)||ratio(b.item)-ratio(a.item))[index]?.item;
  if (!selected) return;
  const dialog=document.querySelector('#award-celebration');
  dialog.querySelector('#award-portrait').innerHTML=awardPortrait(selected.photo);
  dialog.querySelector('#award-heading').textContent='Chúc mừng '+selected.title+'!';
  dialog.querySelector('#award-criterion').textContent=selected.category;
  dialog.querySelector('#award-result').textContent=awardResult(selected);
  dialog.showModal();
  dialog.querySelector('button').focus();
}
