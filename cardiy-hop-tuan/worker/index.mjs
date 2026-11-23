const connectorId = 'connector_5f3c8c41a1e54ad7a76272c89e2554fa';
const sheetTitle = 'CARDIY_DATA';
const maxRow = 1000;
const chunkLength = 30000;
const maxChunks = 10;
const empty = 'root';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const shaPattern = /^[0-9a-f]{64}$/;
const periodKeys = ['week','month','quarter','year'];
const stepKeys = ['good','kpis','goals','news','tasks','issues','close'];
const headers = ['Mã phiên bản','Phiên bản trước','Lưu lúc (UTC)','Băm SHA-256','Số phần'];

class StorageError extends Error {
  constructor(status,message,kind='error') {
    super(message);
    this.status = status;
    this.kind = kind;
  }
}
const json = (value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
const isObject = value=>value!==null && typeof value==='object' && !Array.isArray(value);
const date = value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const validStepList = value=>Array.isArray(value) && value.every(step=>stepKeys.includes(step));
const validIds = value=>Array.isArray(value) && value.every(id=>typeof id==='string' && uuid.test(id));
const text = value=>typeof value==='string';
const finite = value=>typeof value==='number' && Number.isFinite(value);
const units = ['xe','lượt','%','triệu đ','khách','lốp','phiếu','đơn'];
function kpi(item) {
  return isObject(item) && text(item.title) && text(item.owner) && units.includes(item.unit) &&
    [item.actual,item.target].every(value=>finite(value) && value>=0 && value<=(item.unit==='%'?100:999999999));
}
function recordList(items,key) {
  const seen=new Set();
  return Array.isArray(items) && items.every(item=>{
    if (!isObject(item) || typeof item.id!=='string' || !uuid.test(item.id) || seen.has(item.id) || !text(item.title)) return false;
    seen.add(item.id);
    if (key==='kpis') return kpi(item);
    if (key==='awards') return date(item.date) && text(item.category) && text(item.branch) && text(item.reason) &&
      (item.photo===undefined || (text(item.photo) && item.photo.length<=12000 &&
        /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(item.photo))) &&
      kpi({...item,owner:''}) && item.target>0 && item.actual>=item.target;
    if (key==='tasks') return text(item.owner) && typeof item.done==='boolean' && (item.date==='' || date(item.date));
    if (key==='issues') return ['Cao','Vừa','Thấp'].includes(item.priority) && typeof item.solved==='boolean';
    if (key==='goals') return text(item.owner) && ['Đúng tiến độ','Cần xử lý','Hoàn thành'].includes(item.status);
    return true;
  });
}
function validRecords(value) {
  return ['kpis','goals','good','news','tasks','issues'].every(key=>recordList(value[key],key)) &&
    (value.awards===undefined || recordList(value.awards,'awards'));
}
const rating = value=>Number.isInteger(value) && value>=0 && value<=10;
function validSession(value) {
  return value===null || (isObject(value) && typeof value.id==='string' && uuid.test(value.id) && date(value.date) &&
    stepKeys.includes(value.step) && validStepList(value.done) && finite(value.elapsed) &&
    [value.tick,value.endedAt].every(item=>item===null || finite(item)) &&
    [value.taskBaseline,value.acknowledged].every(item=>item===undefined || validIds(item)) &&
    (value.weeklyPreset==null || ['quick','standard'].includes(value.weeklyPreset)));
}
function validReport(value) {
  return isObject(value) && typeof value.id==='string' && uuid.test(value.id) && validRecords(value) && date(value.date) &&
    text(value.branch) && text(value.notes) && rating(value.rating) && validStepList(value.done) &&
    (value.period==null || periodKeys.includes(value.period)) &&
    (value.acknowledged===undefined || validIds(value.acknowledged)) &&
    (value.comparison==null || (Array.isArray(value.comparison) && value.comparison.every(row=>
      isObject(row) && text(row.title) && Array.isArray(row.values) && row.values.length===3 &&
      row.values.every(item=>item===null || kpi(item)))));
}
function validAnnualPlans(plans) {
  return isObject(plans) && Object.keys(plans).length<=606 &&
    Object.entries(plans).every(([period,fields])=>/^(?:20\d{2}|2100)(?:-Q[1-4]|-issues)?$/.test(period) &&
      isObject(fields) && Object.keys(fields).length<=12 &&
      Object.values(fields).every(value=>text(value) && value.length<=2000));
}
function validDataset(value) {
  return isObject(value) && validRecords(value) && text(value.notes) && rating(value.rating) &&
    validSession(value.session) && Array.isArray(value.history) && value.history.every(validReport) &&
    (value.vision===undefined || (isObject(value.vision) && Object.keys(value.vision).length<=40 &&
      Object.values(value.vision).every(field=>text(field) && field.length<=2000))) &&
    (value.annualPlans===undefined || validAnnualPlans(value.annualPlans)) &&
    (value.swot===undefined || (isObject(value.swot) && Object.entries(value.swot).every(([field,content])=>
      /^(strength|weakness|opportunity|threat)[1-3](Name|Detail)$/.test(field) &&
      text(content) && content.length<=(field.endsWith('Name')?180:2000))));
}
function validSnapshot(value) {
  return isObject(value) && periodKeys.every(period=>{
    const group=value[period];
    return isObject(group) && validDataset(group.joint) && Array.isArray(group.branches) &&
      group.branches.length===3 && group.branches.every(validDataset);
  });
}
async function digest(value) {
  const hash = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(hash)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

function actionFor(context,expected,fields) {
  const tools = context?.connectors?.find(item=>item.connectorId===connectorId && item.policy==='enabled')?.tools;
  if (Array.isArray(tools)) {
    const match=tools.find(tool=>{
      const name=tool.actionName?.split(/[./]/).at(-1)?.replace(/^_/,'');
      return name===expected && fields.every(key=>Object.hasOwn(tool.inputSchema?.properties??{},key));
    });
    if (match) return match.actionName;
  }
  throw new StorageError(403,'Cần cấp kết nối Google Drive cho CARDIY bằng tài khoản Google có quyền với Sheet.','connect');
}
async function call(binding,action,args) {
  let response;
  try { response=await binding.invoke(connectorId,action,args); }
  catch { throw new StorageError(503,'Google Sheets chưa xác nhận kết quả. Hãy kiểm tra lại trước khi thử lần nữa.','uncertain'); }
  if (response.status!=='success') {
    if (['reauthentication_required','connector_access_disabled','tool_not_allowed'].includes(response.status)) {
      throw new StorageError(403,'Cần cấp kết nối Google Drive và quyền phù hợp trên Sheet.','connect');
    }
    throw new StorageError(502,'Google Sheets không xác nhận thao tác. Kiểm tra kết nối hoặc quyền trên Sheet.','uncertain');
  }
  const result=response.result?.structuredContent;
  if (isObject(result)) return result;
  const content=response.result?.content;
  for (const item of content??[]) {
    if (item.type!=='text') continue;
    try { const parsed=JSON.parse(item.text); if (isObject(parsed)) return parsed; } catch {}
  }
  return {};
}
async function sheet(binding,allowWrite) {
  if (!binding) throw new StorageError(503,'Kết nối Google Drive của app chưa sẵn sàng.','connect');
  const context=await binding.getContext?.();
  const readAction=actionFor(context,'get_spreadsheet_range',['spreadsheet_id','sheet_name','range']);
  const writeAction=allowWrite?actionFor(context,'batch_update_spreadsheet',['spreadsheet_id','requests']):null;
  return {
    async rows(range) {
      const result=await call(binding,readAction,{spreadsheet_id:sheetConfig.id,sheet_name:sheetTitle,range,value_render_option:'UNFORMATTED_VALUE'});
      if (result.majorDimension!=='ROWS' || (result.values!==undefined && !Array.isArray(result.values))) {
        throw new StorageError(502,'Không đọc được dữ liệu theo cấu trúc CARDIY.');
      }
      return result.values??[];
    },
    async append(values) {
      const cells=values.map(value=>({userEnteredValue:typeof value==='number'?{numberValue:value}:{stringValue:value}}));
      await call(binding,writeAction,{spreadsheet_id:sheetConfig.id,requests:[
        {appendCells:{sheetId:sheetConfig.tab,rows:[{values:cells}],fields:'userEnteredValue'}},
      ]});
    },
  };
}
async function revisions(source) {
  const rows=await source.rows('A1:E'+maxRow);
  if (!headers.every((heading,i)=>rows[0]?.[i]===heading)) {
    throw new StorageError(409,'Tiêu đề cột của Sheet đã thay đổi. Cần khôi phục cấu trúc trước khi đồng bộ.','structure');
  }
  let current=empty;
  let head=null;
  const committed=new Map();
  for (let i=1;i<rows.length;i++) {
    const row=rows[i];
    if (!row?.length) continue;
    const [id,parent,at,hash,count]=row;
    if (!uuid.test(id??'') || !(parent===empty||uuid.test(parent??'')) || !text(at) ||
        !shaPattern.test(hash??'') || !Number.isInteger(count) || count<1 || count>maxChunks) {
      throw new StorageError(409,'Phát hiện dòng sai cấu trúc ở hàng '+(i+1)+' của Sheet.','structure');
    }
    if (parent!==current || committed.has(id)) continue;
    head={id,at,hash,count,row:i+1};
    committed.set(id,head);
    current=id;
  }
  return {current,head,committed,full:rows.length>=maxRow};
}
async function currentSnapshot(source,head) {
  if (!head) return null;
  const payload=(await source.rows('F'+head.row+':O'+head.row))[0]?.slice(0,head.count).join('')??'';
  if (await digest(payload)!==head.hash) throw new StorageError(409,'Dữ liệu trong Sheet đã bị thay đổi ngoài CARDIY.','structure');
  let snapshot;
  try { snapshot=JSON.parse(payload); }
  catch { throw new StorageError(409,'Phiên bản trong Sheet không đọc được.','structure'); }
  if (!validSnapshot(snapshot)) throw new StorageError(409,'Phiên bản trong Sheet không đúng dữ liệu CARDIY.','structure');
  return snapshot;
}
async function requestData(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new StorageError(415,'Yêu cầu không đúng định dạng.');
  const stream=request.body?.getReader();
  if (!stream) throw new StorageError(400,'Thiếu dữ liệu.');
  const decoder=new TextDecoder();
  let data='', size=0;
  for (;;) {
    const {value,done}=await stream.read();
    if (done) break;
    size+=value.byteLength;
    if (size>1_100_000) {
      await stream.cancel();
      throw new StorageError(413,'Bản dữ liệu vượt dung lượng một phiên bản.');
    }
    data+=decoder.decode(value,{stream:true});
  }
  try { return JSON.parse(data+decoder.decode()); }
  catch { throw new StorageError(400,'Dữ liệu không phải JSON hợp lệ.'); }
}
async function storage(request,ctx) {
  if (!request.headers.get('oai-authenticated-user-id')) {
    return json({kind:'signin',message:'Đăng nhập ChatGPT để truy cập nguồn dữ liệu chuẩn.'},401);
  }
  const save=request.method==='POST';
  if (!save && request.method!=='GET') return json({message:'Phương thức không được hỗ trợ.'},405);
  if (save && request.headers.get('Origin')!==new URL(request.url).origin) return json({message:'Yêu cầu khác trang bị từ chối.'},403);
  try {
    const source=await sheet(ctx?.props?.CONNECTORS,save);
    const before=await revisions(source);
    if (!save) {
      return json({version:before.current,savedAt:before.head?.at??null,data:await currentSnapshot(source,before.head)});
    }
    await currentSnapshot(source,before.head);
    const body=await requestData(request);
    if (!isObject(body) || !uuid.test(body.id??'') || !(body.base===empty||uuid.test(body.base??'')) || !validSnapshot(body.data)) {
      throw new StorageError(400,'Dữ liệu không đúng cấu trúc CARDIY. Kiểm tra lại kỳ, ngày, chỉ số và trạng thái.');
    }
    const payload=JSON.stringify(body.data);
    if (payload.length>chunkLength*maxChunks) throw new StorageError(413,'Dữ liệu vượt dung lượng một phiên bản.');
    const hash=await digest(payload);
    const previous=before.committed.get(body.id);
    if (previous && previous.hash===hash && before.current===body.id) return json({version:body.id,savedAt:previous.at});
    if (body.base!==before.current || previous) throw new StorageError(409,'Sheet đã có phiên bản mới. Bản soạn vẫn được giữ trên màn hình.','conflict');
    if (before.full) throw new StorageError(409,'Sheet đã đạt giới hạn số phiên bản.','full');
    const at=new Date().toISOString();
    const chunks=[];
    for (let offset=0;offset<payload.length;) {
      let end=Math.min(offset+chunkLength,payload.length);
      if (/[\uD800-\uDBFF]/.test(payload[end-1]) && end<payload.length) end--;
      chunks.push(payload.slice(offset,end));
      offset=end;
    }
    if (chunks.length>maxChunks) throw new StorageError(413,'Dữ liệu vượt dung lượng một phiên bản.');
    await source.append([body.id,body.base,at,hash,chunks.length,...chunks]);
    const after=await revisions(source);
    if (!after.committed.has(body.id)) throw new StorageError(409,'Một phiên bản khác đã được ghi trước. Bản soạn vẫn được giữ trên màn hình.','conflict');
    return json({version:body.id,savedAt:at});
  } catch(error) {
    if (error instanceof StorageError) return json({kind:error.kind,message:error.message},error.status);
    return json({kind:'error',message:'Chưa xác nhận được thao tác trên Google Sheets.'},502);
  }
}
const workRowLimit=1033;
const taskPreviewRange = "CONG_VIEC!A1:O"+workRowLimit;
const taskColumns = new Map([[0,'id'],[1,'loai_cong_viec'],[2,'ten_cong_viec'],[5,'deadline'],[6,'ngay_hoan_thanh'],
  [7,'nguoi_phu_trach'],[8,'ho_va_ten'],[9,'phong_ban'],[14,'trang_thai']]);
const taskStatus = new Map([['1.Chờ thực hiện','Chờ thực hiện'],['2.Đang làm','Đang làm'],['3.Hoàn thành','Hoàn thành']]);

function validTaskDeadline(value) {
  const match=value.match(/^(\d{2})\/(\d{2})\/(\d{4})(?: ([0-2]\d):([0-5]\d):([0-5]\d))?$/);
  if (!match || Number(match[4])>23) return false;
  const [,day,month,year]=match;
  const iso=year+'-'+month+'-'+day;
  const parsed=new Date(iso+'T00:00:00Z');
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().slice(0,10)===iso;
}
function taskPreviewRows(values) {
  if (!Array.isArray(values) || [...taskColumns].some(([index,heading])=>values[0]?.[index]!==heading)) {
    throw new StorageError(409,'Cột của tab CONG_VIEC đã thay đổi. Kiểm tra cấu trúc trước khi sử dụng.','structure');
  }
  const entries=values.slice(1).flatMap((row,index)=>{
    if (!Array.isArray(row) || !row.some(value=>String(value??'').trim())) return [];
    const column=index=>String(row[index]??'').trim();
    const id=column(0);
    const title=column(2);
    const deadline=column(5);
    const completedAt=column(6);
    const ownerCode=column(7);
    const owner=column(8);
    const branch=column(9).match(/\bCN[123]\b/i)?.[0].toUpperCase()??'';
    const status=taskStatus.get(column(14))??'';
    const issues=[];
    if (!id || !title || !ownerCode || !owner || !branch || !status) issues.push('Thiếu mã, tên việc, người phụ trách, chi nhánh hoặc trạng thái hợp lệ.');
    if (!validTaskDeadline(deadline)) issues.push('Thiếu hoặc sai định dạng hạn hoàn thành.');
    if ((status==='Hoàn thành' || completedAt) && (!validTaskDeadline(completedAt) || status!=='Hoàn thành')) {
      issues.push('Đối chiếu trạng thái với ngày hoàn thành.');
    }
    return [{row:index+2,id,title,deadline,completedAt,ownerCode,owner,department:column(9),branch,status,issues}];
  });
  const counts=new Map();
  for (const {id} of entries) if (id) counts.set(id,(counts.get(id)??0)+1);
  for (const entry of entries) if (counts.get(entry.id)>1) entry.issues.push('Trùng mã công việc.');
  return entries;
}
const workTab = sheetConfig.workTab;
const statusCode = Object.fromEntries([...taskStatus].map(([code,status])=>[status,code]));
const workFingerprint = task=>digest(JSON.stringify([task.id,task.title,task.deadline,task.completedAt,task.ownerCode,task.branch,task.status]));
function workDate(value) {
  if (typeof value!=='string') return null;
  const match=value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const [,year,month,day,hour,minute,second='00']=match;
  const display=day+'/'+month+'/'+year+' '+hour+':'+minute+':'+second;
  if (!validTaskDeadline(display)) return null;
  return {display,serial:(Date.parse(year+'-'+month+'-'+day+'T'+hour+':'+minute+':'+second+'Z')-Date.UTC(1899,11,30))/86400000};
}
function sourceWorkDateMatches(raw,formatted) {
  if (typeof raw!=='number') return String(raw??'').trim()===formatted;
  const iso=new Date(Date.UTC(1899,11,30)+Math.round(raw*86400)*1000).toISOString();
  return iso.slice(8,10)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4)+' '+iso.slice(11,19)===formatted;
}
const workDateFormat={type:'DATE_TIME',pattern:'dd/MM/yyyy HH:mm:ss'};
function workOwners(tasks) {
  const candidates=new Map();
  const ambiguous=new Set();
  for (const {branch,ownerCode,owner,department} of tasks) {
    if (!branch || !ownerCode || !owner) continue;
    const key=branch+':'+ownerCode;
    const previous=candidates.get(key);
    if (previous && (previous.owner!==owner || previous.department!==department)) ambiguous.add(key);
    candidates.set(key,{key,branch,ownerCode,owner,department});
  }
  return [...candidates.values()].filter(item=>!ambiguous.has(item.key));
}
async function createWork(update,read,write) {
  const title=typeof update.title==='string'?update.title.trim():'';
  const deadline=workDate(update.deadline);
  if (!title || title.length>300 || !deadline || !uuid.test(update.requestId??'') || !text(update.ownerKey)) {
    throw new StorageError(400,'Cần tên việc, người phụ trách và hạn hoàn thành hợp lệ.');
  }
  const id='CARDIY-'+update.requestId;
  const range="CONG_VIEC!A1:Z"+workRowLimit;
  const {values}=await read(range);
  const tasks=taskPreviewRows(values);
  const owner=workOwners(tasks).find(candidate=>candidate.key===update.ownerKey);
  if (!owner) throw new StorageError(409,'Thông tin người phụ trách đã đổi. Tải lại và chọn lại người phụ trách.','conflict');
  const matches=rows=>rows.filter(task=>task.id===id);
  const confirm=async rows=>{
    const found=matches(rows);
    const task=found[0];
    if (found.length!==1 || task.title!==title || task.deadline!==deadline.display ||
        task.ownerCode!==owner.ownerCode || task.branch!==owner.branch || task.issues.length) {
      throw new StorageError(409,'Chưa xác nhận được dòng mới. Tải lại Sheet để kiểm tra mã '+id+'.','conflict');
    }
    return json({task:{...task,revision:await workFingerprint(task)}});
  };
  if (matches(tasks).length) return confirm(tasks);
  if (values.length>=workRowLimit) throw new StorageError(409,'Vùng công việc đã đầy. Cần mở rộng nguồn trước khi thêm việc.','full');

  const valuesToWrite=Array.from({length:15},()=>({}));
  for (const [column,value] of [[0,id],[1,'Họp tuần'],[2,title],[7,owner.ownerCode],
    [8,owner.owner],[9,owner.department],[14,statusCode['Chờ thực hiện']]]) {
    valuesToWrite[column]={userEnteredValue:{stringValue:value}};
  }
  valuesToWrite[5]={userEnteredValue:{numberValue:deadline.serial},userEnteredFormat:{numberFormat:workDateFormat}};
  await write([{appendCells:{sheetId:workTab,rows:[{values:valuesToWrite}],fields:'userEnteredValue,userEnteredFormat.numberFormat'}}]);
  return confirm(taskPreviewRows((await read(taskPreviewRange)).values));
}
async function taskPreview(request,ctx) {
  const write=request.method==='POST';
  if (!write && request.method!=='GET') return json({message:'Phương thức không được hỗ trợ.'},405);
  if (!request.headers.get('oai-authenticated-user-id')) {
    return json({kind:'signin',message:'Đăng nhập ChatGPT để mở công việc từ Sheet.'},401);
  }
  if (write && request.headers.get('Origin')!==new URL(request.url).origin) return json({message:'Yêu cầu khác trang bị từ chối.'},403);
  try {
    const binding=ctx?.props?.CONNECTORS;
    if (!binding) throw new StorageError(503,'Kết nối Google Drive của app chưa sẵn sàng.','connect');
    const context=await binding.getContext?.();
    const action=actionFor(context,'get_spreadsheet_range',['spreadsheet_id','sheet_name','range']);
    const read=(range,format='FORMATTED_VALUE')=>call(binding,action,{
      spreadsheet_id:sheetConfig.id,sheet_name:null,range,value_render_option:format,
    });
    const readTasks=async()=>taskPreviewRows((await read(taskPreviewRange)).values);
    const writeTasks=requests=>call(binding,actionFor(context,'batch_update_spreadsheet',['spreadsheet_id','requests']),{
      spreadsheet_id:sheetConfig.id,requests,
    });
    if (!write) {
      const tasks=await Promise.all((await readTasks()).map(async task=>({...task,revision:await workFingerprint(task)})));
      return json({tasks,owners:workOwners(tasks)});
    }
    const update=await requestData(request);
    if (update?.operation==='create') return await createWork(update,read,writeTasks);
    const title=typeof update?.title==='string'?update.title.trim():'';
    const due=workDate(update?.deadline);
    const completion=workDate(update?.completedAt);
    if (!title || title.length>300 || !due || !Object.hasOwn(statusCode,update?.status) ||
        (update.status==='Hoàn thành' ? !completion : update.completedAt!=='') ||
        !text(update.id) || !shaPattern.test(update.revision??'')) {
      throw new StorageError(400,'Cần tên việc, hạn hợp lệ và ngày hoàn thành phù hợp với trạng thái.');
    }
    const matched=(await readTasks()).filter(task=>task.id===update.id);
    if (matched.length!==1 || await workFingerprint(matched[0])!==update.revision) {
      throw new StorageError(409,'Dòng nguồn đã đổi hoặc trùng mã. Tải lại Sheet trước khi lưu.','conflict');
    }
    const task=matched[0];
    const rowRange="CONG_VIEC!A"+task.row+':O'+task.row;
    const current=(await read(rowRange,'FORMULA')).values?.[0];
    const desired=[
      {column:2,next:title,previous:task.title,value:{stringValue:title}},
      {column:5,next:due.display,previous:task.deadline,value:{numberValue:due.serial}},
      {column:6,next:completion?.display??'',previous:task.completedAt,value:completion?{numberValue:completion.serial}:null,dateFormat:true},
      {column:14,next:update.status,previous:task.status,value:{stringValue:statusCode[update.status]}},
    ].filter(item=>item.previous!==item.next);
    if (String(current?.[0]??'').trim()!==update.id ||
        String(current?.[2]??'').trim()!==task.title || String(current?.[7]??'').trim()!==task.ownerCode ||
        (taskStatus.get(String(current?.[14]??'').trim())??'')!==task.status ||
        !sourceWorkDateMatches(current?.[5],task.deadline) || !sourceWorkDateMatches(current?.[6],task.completedAt) ||
        desired.some(({column})=>String(current?.[column]??'').startsWith('='))) {
      throw new StorageError(409,'Mã dòng đã đổi hoặc ô cần sửa chứa công thức. Kiểm tra trong Sheet.','conflict');
    }
    if (desired.length) {
      const requests=desired.map(({column,value,dateFormat})=>{
        const cell=value?{userEnteredValue:value}:{};
        if (dateFormat && value) cell.userEnteredFormat={numberFormat:workDateFormat};
        return {updateCells:{start:{sheetId:workTab,rowIndex:task.row-1,columnIndex:column},
          rows:[{values:[cell]}],fields:cell.userEnteredFormat?'userEnteredValue,userEnteredFormat.numberFormat':'userEnteredValue'}};
      });
      await writeTasks(requests);
    }
    const saved=(await readTasks()).filter(item=>item.id===update.id);
    if (saved.length!==1 || saved[0].title!==title || saved[0].deadline!==due.display ||
        saved[0].completedAt!==(completion?.display??'') || saved[0].status!==update.status) {
      throw new StorageError(409,'Chưa xác nhận được giá trị sau khi ghi. Tải lại từ Sheet trước khi thử lại.','conflict');
    }
    return json({task:{...saved[0],revision:await workFingerprint(saved[0])}});
  } catch (error) {
    if (error instanceof StorageError) return json({kind:error.kind,message:error.message},error.status);
    return json({kind:'error',message:'Chưa xác nhận được thao tác với Google Sheets.'},502);
  }
}
export default {
  fetch(request,env,ctx) {
    const url=new URL(request.url);
    if (url.pathname==='/api/cardiy-cn1-meeting') return cn1Meeting(request,ctx);
    if (url.pathname==='/api/cardiy-task-preview') return taskPreview(request,ctx);
    if (url.pathname==='/api/cardiy-sheet') return storage(request,ctx);
    const asset=assets[url.pathname==='/'?'/index.html':url.pathname];
    if (!asset) return new Response('Không tìm thấy trang',{status:404});
    if (!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405});
    const headers={'Content-Type':asset[0],'Cache-Control':'no-cache'};
    const bytes=request.method==='HEAD'?null:Uint8Array.from(atob(asset[1]),character=>character.charCodeAt(0));
    return new Response(bytes,{headers});
  },
};
