'use strict';

const strategySheets = {vision:['Tầm nhìn','vision-form'],annual:['Kế hoạch năm','annual-form'],swot:['SWOT','swot-form']};
const strategyHeader = ['Mã trường','Nội dung','Giá trị'];

function strategyExcelControls(key) {
  return '<div class="strategy-excel"><button type="button" class="button secondary" data-strategy-export="'+key+'">Xuất Excel</button>'+
    '<label class="button secondary">Nhập Excel<input class="sr" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" data-strategy-import="'+key+'"></label>'+
    '<p role="status" data-strategy-status="'+key+'"></p></div>';
}
function strategyFields(form) {
  return new Map([...form.elements].filter(input=>input.name).map(input=>[input.name,input]));
}
function strategyFieldTitle(input) {
  const context=input.closest('fieldset')?.querySelector('legend')?.textContent ??
    input.closest('.annual-card')?.querySelector('h2')?.textContent;
  const name=input.getAttribute('aria-label') ?? input.labels?.[0]?.textContent ?? input.name;
  return [context,name.trim()].filter(Boolean).join(' · ');
}
function strategyExcelRows(fields) {
  return [strategyHeader,...[...fields].map(([key,input])=>[key,strategyFieldTitle(input),
    input.type==='number'&&input.value!==''?Number(input.value):input.value])];
}
function readStrategyRows(rows,fields) {
  const header=rows?.[0]?.values??[];
  if (!strategyHeader.every((heading,index)=>header[index]===heading)) {
    throw new Error('Tải tệp mẫu bằng nút Xuất Excel và giữ nguyên tên cột.');
  }
  const edits=new Map();
  const seen=new Set();
  for (const {number,values} of rows.slice(1)) {
    const [rawKey,,raw]=values;
    const key=String(rawKey??'').trim();
    const value=String(raw??'').trim();
    if (!key && !value) continue;
    const input=fields.get(key);
    if (!input || seen.has(key)) throw new Error('Dòng '+number+' có mã sai hoặc trùng. Với Kế hoạch năm, chọn đúng năm và quý.');
    seen.add(key);
    if (!value) continue;
    if (input.type==='number') {
      const amount=Number(value);
      if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(amount) || amount<Number(input.min) || amount>Number(input.max)) {
        throw new Error('Dòng '+number+' cần số nguyên trong giới hạn của ô nhập.');
      }
    } else if (value.length>input.maxLength) throw new Error('Dòng '+number+' vượt '+input.maxLength+' ký tự.');
    edits.set(input,value);
  }
  if (!edits.size) throw new Error('Tệp chưa có giá trị để nhập.');
  return edits;
}
document.addEventListener('click',async event=>{
  const button=event.target.closest('button[data-strategy-export]');
  if (!button || button.disabled) return;
  const [title,formId]=strategySheets[button.dataset.strategyExport];
  const fields=strategyFields(document.getElementById(formId));
  button.disabled=true;
  try {
    const blob=await CardiyExcel.write([{name:title,rows:strategyExcelRows(fields)}]);
    const href=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=href;
    link.download='CARDIY-'+title.replaceAll(' ','-')+'-'+today()+'.xlsx';
    link.click();
    setTimeout(()=>URL.revokeObjectURL(href),3000);
  } catch { message('Không xuất được Excel.'); }
  finally { button.disabled=false; }
});
document.addEventListener('change',async event=>{
  const input=event.target;
  const key=input.dataset.strategyImport;
  if (!key || !input.files[0]) return;
  const file=input.files[0];
  const [title,formId]=strategySheets[key];
  const form=document.getElementById(formId);
  const fields=strategyFields(form);
  const status=document.querySelector('[data-strategy-status="'+key+'"]');
  status.textContent='Đang kiểm tra Excel…';
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error('Chọn tệp Excel .xlsx.');
    const {sheets}=await CardiyExcel.read(file,[title]);
    if (!form.isConnected || input.files[0]!==file) return;
    const edits=readStrategyRows(sheets.get(title),fields);
    for (const [target,value] of edits) target.value=value;
    edits.keys().next().value.dispatchEvent(new Event('input',{bubbles:true}));
    status.textContent='Đã nạp '+edits.size+' ô. Kiểm tra và bấm Lưu trên trang.';
  } catch(error) {
    if (input.isConnected && input.files[0]===file) status.textContent=error.message||'Không đọc được tệp Excel.';
  } finally {
    if (input.files[0]===file) input.value='';
  }
});
