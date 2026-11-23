'use strict';

const excelScopeSheet = 'Phạm vi';
const excelSections = [
  ['kpis','KPI'],['goals','Mục tiêu'],['tasks','Hành động'],
  ['issues','Vấn đề IDS'],['good','Tin tốt'],['news','Phản hồi'],['awards','Vinh danh'],
];
const excelId = {name:'id',title:'Mã dòng'};
let stagedExcel = null;

function excelPage() {
  return pageTitle('Nhập / Xuất Excel',period().label+' · '+label(branchSelect.value))+
    '<div class="column excel-panels">'+
    panel('Xuất dữ liệu .xlsx','KPI, mục tiêu, hành động, vấn đề IDS, tin tốt, phản hồi, vinh danh và biên bản đã chốt.','',
      '<div class="excel-controls"><button class="button primary" data-action="excel-export">'+icon('download')+'Xuất dữ liệu</button>'+
      '<button class="button secondary" data-action="excel-template">Tải mẫu trống</button></div>')+
    panel('Nhập dữ liệu .xlsx','Dùng tệp đã xuất hoặc mẫu từ CARDIY. Giữ nguyên tên trang tính, tiêu đề cột và mã dòng.','',
      '<div class="excel-controls"><label for="excel-file">Chọn tệp Excel</label><input id="excel-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">'+
      '<div id="excel-status" role="status"></div><button class="button primary" data-action="excel-apply" disabled>Áp dụng dữ liệu</button>'+
      '<p>Dòng có mã sẽ cập nhật bản ghi tương ứng. Dòng để trống mã sẽ được thêm mới. Các dòng vắng mặt trong tệp vẫn được giữ. Trang Biên bản chỉ dùng để xem hoặc lưu trữ.</p></div>')+
    '</div>';
}

function excelColumns(key) {
  const columns = [excelId,...fieldsByKey[key]];
  if (isJoint() && key==='kpis') columns.splice(1,0,{name:'branch',title:'Chi nhánh',type:'select',required:true,options:branchNames});
  if (isJoint() && ['tasks','issues'].includes(key)) {
    columns.splice(1,0,{name:'branch',title:'Chi nhánh phụ trách',type:'select',options:['Tất cả chi nhánh',...branchNames]});
  }
  if (isJoint() && key==='awards') columns.splice(1,0,{name:'branch',title:'Chi nhánh',type:'select',required:true,options:branchNames});
  if (key==='tasks') columns.push({name:'done',title:'Trạng thái',type:'boolean',options:['Chưa hoàn thành','Hoàn thành']});
  if (key==='issues') {
    const index = columns.findIndex(column=>column.name==='solved');
    columns[index] = {...columns[index],type:'boolean'};
  }
  return columns;
}
function excelRecords(key) {
  return isJoint()&&key==='kpis'
    ? periodData().branches.flatMap((branch,index)=>branch.kpis.map(kpi=>({...kpi,branch:branchNames[index]})))
    : data()[key]??[];
}
function excelScope() {
  return [state.period,branchSelect.value];
}
function excelSheets(template) {
  const [kind,scope] = excelScope();
  const sheets = [{name:excelScopeSheet,rows:[
    ['Thông tin','Giá trị'],['Định dạng','CARDIY-1'],['Mốc họp',kind],['Phạm vi',scope],
    ['Cách nhập','Giữ mã dòng để cập nhật; để trống mã dòng để thêm mới.'],
    ['Chi nhánh hợp lệ',branchNames.join(' | ')],
    ['Hạn hoàn thành','Nhập ngày Excel hoặc dạng ngày/tháng/năm.'],
    ['Biên bản','Trang Biên bản dùng để xem hoặc lưu trữ.'],
  ]}];
  for (const [key,name] of excelSections) {
    const columns = excelColumns(key);
    const rows = [columns.map(column=>column.title)];
    if (!template) {
      for (const item of excelRecords(key)) {
        rows.push(columns.map(column=>column.type==='boolean'?column.options[item[column.name]?1:0]:item[column.name]??''));
      }
    }
    sheets.push({name,rows});
  }
  if (!template) {
    const reports = [['Ngày họp','Tên cuộc họp','Điểm','Phần','Nội dung biên bản']];
    for (const item of data().history) {
      const parts = reportText(item).match(/.{1,15000}/gsu)??[];
      parts.forEach((text,index)=>reports.push([item.date,reportTitle(item),item.rating||'',index+1,text]));
    }
    sheets.push({name:'Biên bản',rows:reports});
  }
  return sheets;
}
async function downloadExcel(template) {
  const scope = excelScope();
  const blob = await CardiyExcel.write(excelSheets(template));
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  const branch = scope[1].startsWith('CN')?scope[1].slice(0,3):'Hop-chung';
  link.download = ['CARDIY',template?'Mau':'Du-lieu',scope[0],branch,today()].join('-')+'.xlsx';
  link.click();
  setTimeout(()=>URL.revokeObjectURL(href),3000);
}
function excelDate(value,date1904) {
  if (typeof value==='number' && Number.isInteger(value) && value>=0 && value<2957004) {
    if (!date1904 && value===60) throw new Error('có ngày không hợp lệ');
    const base = date1904?Date.UTC(1904,0,1):Date.UTC(1899,11,value<60?31:30);
    const iso = new Date(base+value*86400000).toISOString();
    if (iso.startsWith('+')) throw new Error('có ngày không hợp lệ');
    return iso.slice(0,10);
  }
  let text = String(value).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    const [day,month,year] = text.split('/');
    text = year+'-'+month.padStart(2,'0')+'-'+day.padStart(2,'0');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error('cần ngày dạng ngày/tháng/năm');
  const date = new Date(text+'T00:00:00Z');
  if (!Number.isFinite(date.valueOf()) || date.toISOString().slice(0,10)!==text) throw new Error('có ngày không hợp lệ');
  return text;
}
function excelValue(column,raw,date1904) {
  const text = String(raw??'').trim();
  if (!text) {
    if (column.required) throw new Error('là cột bắt buộc');
    return column.type==='boolean'?false:'';
  }
  if (column.type==='number') {
    const number = Number(text.replace(',','.'));
    if (!/^(?:\d+)(?:[.,]\d+)?$/.test(text) && typeof raw!=='number' || !Number.isFinite(number) || number<0 || number>999999999) {
      throw new Error('cần số từ 0 đến 999.999.999');
    }
    return number;
  }
  if (column.type==='date') return excelDate(raw,date1904);
  if (column.type==='boolean' && typeof raw==='boolean') return raw;
  if (column.options) {
    const option = column.options.findIndex(item=>item.toLocaleLowerCase('vi-VN')===text.toLocaleLowerCase('vi-VN'));
    if (option===-1) throw new Error('cần một trong các giá trị: '+column.options.join(', '));
    return column.type==='boolean' ? option===1 : column.options[option];
  }
  if (column.name==='id' && !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(text)) throw new Error('không đúng định dạng');
  const max = column.type==='textarea'?2000:180;
  if (text.length>max) throw new Error('vượt quá '+max+' ký tự');
  return typeof raw==='string'?raw:text;
}
function parseExcelRows(rows,key,name,date1904) {
  const columns = excelColumns(key);
  const header = rows[0]?.values ?? [];
  const indexes = columns.map(column=>header.findIndex(value=>String(value??'').trim()===column.title));
  if (indexes.includes(-1)) throw new Error(name+': thiếu cột '+columns[indexes.indexOf(-1)].title+'. Hãy dùng tệp mẫu đúng phạm vi.');
  return rows.slice(1).filter(row=>indexes.some(i=>String(row.values[i]??'').trim())).map(({number,values})=>{
    const record = {};
    columns.forEach((column,i)=>{
      try { record[column.name] = excelValue(column,values[indexes[i]],date1904); }
      catch(error) { throw new Error(name+' · dòng '+number+' · '+column.title+' '+error.message+'.'); }
    });
    if (key==='kpis' && record.unit==='%' && Math.max(record.actual,record.target)>100) {
      throw new Error(name+' · dòng '+number+': chỉ số phần trăm phải từ 0 đến 100%.');
    }
    if (key==='awards') {
      const error=awardError(record);
      if (error) throw new Error(name+' · dòng '+number+': '+error.message);
      if (!isJoint()) record.branch=branchSelect.value;
    }
    return record;
  });
}
function stageExcel({sheets,date1904},scope) {
  const metadata = new Map((sheets.get(excelScopeSheet)??[]).map(row=>row.values));
  if (metadata.get('Định dạng')!=='CARDIY-1') throw new Error('Hãy sử dụng tệp Excel xuất từ CARDIY hoặc tải mẫu trống.');
  if (metadata.get('Mốc họp')!==scope[0] || metadata.get('Phạm vi')!==scope[1]) {
    throw new Error('Tệp dành cho '+(metadata.get('Phạm vi')||'phạm vi khác')+' · '+(periods[metadata.get('Mốc họp')]?.label||'mốc khác')+'. Chọn đúng mốc và chi nhánh rồi thử lại.');
  }
  const targets = new Map();
  let count = 0;
  for (const [key,name] of excelSections) {
    if (!sheets.has(name)) continue;
    const rows = parseExcelRows(sheets.get(name),key,name,date1904);
    const seen = new Set();
    for (const row of rows) {
      let dataset = data();
      if (isJoint()&&key==='kpis') {
        dataset = periodData().branches[branchNames.indexOf(row.branch)];
        if (row.id && periodData().branches.some(branch=>branch!==dataset && branch.kpis.some(item=>item.id===row.id))) {
          throw new Error(name+': không thể chuyển mã chỉ số hiện có sang chi nhánh khác.');
        }
        delete row.branch;
      }
      if (row.id && seen.has(row.id)) throw new Error(name+': mã dòng bị trùng trong tệp.');
      if (row.id) seen.add(row.id);
      if (!targets.has(dataset)) targets.set(dataset,new Map());
      const grouped = targets.get(dataset);
      if (!grouped.has(key)) grouped.set(key,[]);
      grouped.get(key).push(row);
      count++;
    }
  }
  if (!count) throw new Error('Tệp Excel chưa có dòng dữ liệu để nhập.');
  return {scope,targets,count};
}
function applyExcel(staged) {
  const replacements = [];
  for (const [dataset,groups] of staged.targets) {
    for (const [key,rows] of groups) {
      const existing = dataset[key];
      const byId = new Map((existing??[]).map(item=>[item.id,item]));
      for (const row of rows) {
        const id = row.id||uid();
        byId.set(id,{...byId.get(id),...row,id});
      }
      replacements.push({dataset,key,existing,next:[...byId.values()]});
    }
  }
  for (const change of replacements) change.dataset[change.key] = change.next;
  if (save()) return;
  for (const change of replacements) change.dataset[change.key] = change.existing;
  throw new Error('Trình duyệt không lưu được dữ liệu. Dữ liệu trước khi nhập được giữ lại.');
}
const excelStatus = () => workspace.querySelector('#excel-status');
workspace.addEventListener('change',async event=>{
  const input = event.target;
  if (input.id!=='excel-file') return;
  stagedExcel = null;
  const apply = workspace.querySelector('[data-action="excel-apply"]');
  apply.disabled = true;
  const status = excelStatus();
  const file = input.files[0];
  if (!file) { status.textContent = ''; return; }
  const scope = excelScope();
  status.textContent = 'Đang kiểm tra tệp…';
  status.dataset.error = 'false';
  try {
    if (!/\.xlsx$/i.test(file.name)) throw new Error('Chọn tệp có đuôi .xlsx.');
    const result = await CardiyExcel.read(file,[excelScopeSheet,...excelSections.map(section=>section[1])]);
    if (!input.isConnected || input.files[0]!==file) return;
    stagedExcel = stageExcel(result,scope);
    status.textContent = 'Đã kiểm tra '+stagedExcel.count+' dòng. Bấm Áp dụng dữ liệu để lưu.';
    apply.disabled = false;
  } catch(error) {
    if (!input.isConnected || input.files[0]!==file) return;
    status.textContent = error.message||'Không mở được tệp Excel.';
    status.dataset.error = 'true';
  }
});
workspace.addEventListener('click',async event=>{
  const button = event.target.closest('button[data-action^="excel-"]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action==='excel-apply') {
    if (!stagedExcel || excelScope().some((value,index)=>value!==stagedExcel.scope[index])) return;
    try {
      applyExcel(stagedExcel);
      stagedExcel = null;
      render();
      excelStatus().textContent = 'Đã nhập và lưu dữ liệu.';
    } catch(error) {
      excelStatus().textContent = error.message;
      excelStatus().dataset.error = 'true';
    }
    return;
  }
  button.disabled = true;
  try { await downloadExcel(action==='excel-template'); }
  catch { message('Không xuất được tệp Excel.'); }
  finally { button.disabled = false; }
});
