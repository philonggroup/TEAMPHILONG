'use strict';

const steps = [
  {key:'good',title:'Tin tốt',icon:'spark',detail:'Chia sẻ điểm tích cực của đội ngũ trong kỳ.'},
  {key:'kpis',title:'Chỉ số tuần',icon:'chart',detail:'Đối chiếu kết quả thực tế với chỉ tiêu của chi nhánh.'},
  {key:'goals',title:'Mục tiêu 90 ngày',icon:'target',detail:'Cập nhật tiến độ và ghi nhận các mục tiêu đang chậm.'},
  {key:'news',title:'Phản hồi',icon:'news',detail:'Ghi nhận phản hồi từ khách hàng, đối tác và đội ngũ.'},
  {key:'tasks',title:'Danh sách hành động',icon:'tasks',detail:'Rà soát cam kết, người phụ trách và hạn hoàn thành.'},
  {key:'issues',title:'Vấn đề cần giải quyết',icon:'issue',detail:'Xác định nguyên nhân, thảo luận và chốt hành động (IDS).'},
  {key:'close',title:'Kết luận',icon:'flag',detail:'Chốt biên bản và chấm điểm buổi họp.'},
];

const periods = {
  week:{label:'Tuần',goal:'Mục tiêu 90 ngày',minutes:[2,4,3,2,4,12,3]},
  month:{label:'Tháng',goal:'Mục tiêu tháng',minutes:[3,7,5,3,5,17,5]},
  quarter:{label:'Quý',goal:'Mục tiêu quý',minutes:[4,10,8,4,6,22,6]},
  year:{label:'Năm',goal:'Mục tiêu năm',minutes:[5,15,15,5,10,30,10]},
};
const l10Minutes = [5,5,5,5,5,60,5];
const storeKey = 'cardiy-l10-v1';
const branchSelect = document.querySelector('#branch');
const branchNames = Array.from(branchSelect.options).slice(0,-1).map(option=>option.value);
const jointIndex = branchNames.length;
const jointName = branchSelect.options[jointIndex].value;
const workspace = document.querySelector('#content');
const editor = document.querySelector('#editor');
const form = document.querySelector('#edit-form');
const toast = document.querySelector('#toast');
const localDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'});
const fmt = new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
const today = () => localDate.format(new Date());
const dateText = value => value ? value.split('-').reverse().join('/') : 'Chưa đặt hạn';
const uid = () => crypto.randomUUID();
const record = data => ({id:uid(),...data});
const label = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const get = (key,id) => data()[key].find(item => item.id === id);
const stepByKey = key => steps.find(step => step.key === key);
const period = () => periods[state.period];
const periodName = () => period().label.toLocaleLowerCase('vi-VN');
function weeklyPreset() {
  const session = data().session;
  return session && !session.endedAt ? session.weeklyPreset ?? 'quick' : state.weeklyPreset;
}
function agendaMinutes() {
  return state.period==='week' && weeklyPreset()==='standard' ? l10Minutes : period().minutes;
}
const duration = key => agendaMinutes()[steps.findIndex(step=>step.key===key)];
const meetingMinutes = () => agendaMinutes().reduce((total,minutes)=>total+minutes,0);
const kpiTitle = () => 'Chỉ số '+periodName();
function stepTitle(key, kind=state.period) {
  if (key==='kpis') return 'Chỉ số '+periods[kind].label.toLocaleLowerCase('vi-VN');
  if (key==='goals') return periods[kind].goal;
  return stepByKey(key).title;
}
function periodDate(date, kind=state.period) {
  const [year,month,day] = date.split('-').map(Number);
  if (kind==='year') return 'Năm '+year;
  if (kind==='quarter') return 'Quý '+Math.ceil(month/3)+'/'+year;
  if (kind==='month') return 'Tháng '+month+'/'+year;

  const thursday = new Date(Date.UTC(year,month-1,day));
  thursday.setUTCDate(thursday.getUTCDate()+4-(thursday.getUTCDay()||7));
  const weekYear = thursday.getUTCFullYear();
  const week = Math.ceil(((thursday-Date.UTC(weekYear,0,1))/86400000+1)/7);
  return 'Tuần '+week+'/'+weekYear;
}
function blankMeetingData() {
  return {kpis:[],goals:[],good:[],news:[],tasks:[],issues:[],notes:'',rating:0,session:null,history:[]};
}
const showNumber = (value,unit) => fmt.format(value) + (unit === '%' ? '%' : unit ? ' ' + unit : '');
const addButton = (key,title) => '<button class="button secondary" data-action="add" data-key="'+key+'">'+icon('plus')+title+'</button>';
const editButton = (key,id) => '<button class="icon-button" data-action="edit" data-key="'+key+'" data-id="'+id+'" aria-label="Chỉnh sửa">'+icon('edit')+'</button>';
const pill = (text,kind) => '<span class="pill '+kind+'">'+text+'</span>';

function seed(branch) {
  const values = [[93,16,66,225,86],[74,12,71,172,67],[67,10,75,155,62]][branch];
  const scales = [[90,20,70,220,80],[75,15,70,180,65],[60,15,70,160,55]][branch];
  const metric = (title,unit,owner,i) => record({title,unit,owner,actual:values[i],target:scales[i]});
  return {
    kpis:[metric('Xe tiếp nhận','xe','Cố vấn dịch vụ',0),metric('Cân chỉnh thước lái','lượt','Tổ kỹ thuật',1),metric('Xe có phiếu kiểm tra an toàn','%','Quản lý chi nhánh',2),metric('Doanh thu tuần','triệu đ','Quản lý chi nhánh',3),metric('Khách hàng tiềm năng','khách','Sale & CSKH',4)],
    goals:[record({title:'Chuẩn hóa quy trình kiểm tra an toàn',owner:'Quản lý chi nhánh',status:'Đúng tiến độ'}),record({title:'Tăng tỷ lệ khách đặt lịch trước',owner:'Sale & CSKH',status:'Cần xử lý'})],
    good:[],news:[],
    tasks:[record({title:'Rà soát phiếu kiểm tra an toàn cuối ca',owner:'Cố vấn dịch vụ',date:'',done:false}),record({title:'Chuẩn bị kịch bản gọi sau bán',owner:'Sale & CSKH',date:'',done:true}),record({title:'Kiểm tra lịch bảo dưỡng thiết bị cân lái',owner:'Tổ kỹ thuật',date:'',done:false})],
    issues:[record({title:'Tỷ lệ lập phiếu kiểm tra an toàn theo ca',priority:'Cao',cause:'',discussion:'',solution:'',solved:false}),record({title:'Khách đặt lịch thường dồn vào giờ cao điểm',priority:'Vừa',cause:'',discussion:'',solution:'',solved:false})],
    notes:'',rating:0, session:null, history:[],
  };
}
let state;
try { state = JSON.parse(localStorage.getItem(storeKey)); } catch {}
if (!state || !Array.isArray(state.branches) || state.branches.length !== 3) state = {branch:0,branches:[0,1,2].map(seed)};
state.joint ??= blankMeetingData();
state.periods ??= {};
if (!Object.hasOwn(periods,state.period)) state.period = 'week';
if (!['standard','quick'].includes(state.weeklyPreset)) state.weeklyPreset = 'standard';
for (const kind of ['month','quarter','year']) {
  state.periods[kind] ??= {branches:branchNames.map(blankMeetingData),joint:blankMeetingData()};
}
if (![0,1,2,jointIndex].includes(state.branch)) state.branch = 0;
branchSelect.selectedIndex = state.branch;
const initialView = new URLSearchParams(location.search);
let view = ['swot','annual','vision'].find(key=>initialView.get(key)==='1') ?? 'overview';
let previewStep = 'good';
let editContext = null;
let toastTimer;
function isJoint() { return state.branch === jointIndex; }
function periodData() { return state.period==='week' ? state : state.periods[state.period]; }
function data() { return isJoint() ? periodData().joint : periodData().branches[state.branch]; }
function meetingTitle(preset=weeklyPreset()) {
  return state.period==='week' && preset==='standard' ? 'Họp tuần' : 'Họp nhanh '+periodName();
}
function weeklyPresetNav() {
  if (state.period!=='week' || !['overview','meeting'].includes(view)) return '';
  const current = weeklyPreset();
  const inProgress = data().session && !data().session.endedAt;
  const buttons = [['standard','Họp tuần · 90 phút'],['quick','Họp nhanh · 30 phút']].map(([key,title])=>
    '<button type="button" class="button secondary" data-action="weekly-preset" data-key="'+key+'" aria-pressed="'+(key===current)+'"'+(inProgress?' disabled':'')+'>'+title+'</button>').join('');
  return '<div class="weekly-preset" role="group" aria-label="Chế độ họp tuần">'+buttons+'</div>';
}
function periodNav() {
  return '<nav class="period-nav" aria-label="Mốc họp">'+Object.entries(periods).map(([key,item])=>
    '<button class="button '+(key===state.period?'primary':'secondary')+'" data-action="period" data-key="'+key+'" aria-pressed="'+(key===state.period)+'">'+item.label+'</button>').join('')+'</nav>';
}
function switchBranch(index,destination='overview') {
  state.branch = index;
  branchSelect.selectedIndex = index;
  previewStep = 'good';
  save();
  changeView(destination);
}
function save() {
  if (window.persistCardiyCloudDraft?.()) return true;
  try { localStorage.setItem(storeKey,JSON.stringify(state)); return true; }
  catch { document.querySelector('#storage').textContent = 'Trình duyệt đang chặn lưu dữ liệu. Hãy xuất dữ liệu trước khi rời trang.'; return false; }
}
save();
function message(text) {
  clearTimeout(toastTimer);
  toast.textContent = text;
  toastTimer = setTimeout(() => { toast.textContent = ''; },3000);
}
/* Cac muc Tracy chot dua len MENU NGANG - dung thu tu Tracy liet ke */
const TOP_KEYS = ['goals','vision','year-kpis','year-goals','overview'];
function nav() {
  const items = [['overview','Tổng quan','grid'],['meeting',state.period==='week'?'Họp tuần':'Họp nhanh','calendar'],['kpis',kpiTitle(),'chart'],['goals',period().goal,'target'],['awards','Vinh danh','spark'],['tasks','Danh sách hành động','tasks'],['issues','Vấn đề (IDS)','issue'],['history','Lịch sử họp','clock'],['excel','Nhập / Xuất Excel','excel']];
  items.splice(2,0,['joint',jointName,'team']);
  if (state.period==='year') items.splice(items.findIndex(item=>item[0]==='kpis'),2);
  items.unshift(['vision','Tầm nhìn','target'],['year-kpis','Chỉ số năm','chart'],['year-goals','Mục tiêu năm','target']);
  const selected=key=>key==='vision'&&['vision','annual','swot'].includes(view) ||
    key==='year-'+view&&state.period==='year' || key==='joint'&&isJoint()&&view==='overview' ||
    key===view&&!(isJoint()&&view==='overview') || key==='meeting'&&['good','news','close'].includes(view);
  const nut = ([key,title,symbol],lop)=>{
    const control=key==='joint'?'data-action="open-joint"':key.startsWith('year-')
      ?'data-action="open-year" data-key="'+key.slice(5)+'"':'data-view="'+key+'"';
    return '<button '+control+' class="'+lop+'"'+(selected(key)?' aria-current="page"':'')+'>'+icon(symbol)+title+'</button>';
  };
  const tren = TOP_KEYS.map(key=>items.find(item=>item[0]===key)).filter(Boolean);
  const ben = items.filter(item=>!TOP_KEYS.includes(item[0]));
  const thanhNgang = document.querySelector('#topnav');
  if (thanhNgang) thanhNgang.innerHTML = tren.map(item=>nut(item,'top-item')).join('');
  document.querySelector('#nav').innerHTML = ben.map(item=>nut(item,'nav-item')).join('');
  document.querySelector('#crumb').textContent = isJoint() && ['overview','meeting'].includes(view) ? jointName : items.find(item => item[0] === view)?.[1] ?? (view==='annual'?'Kế hoạch năm':view==='swot'?'SWOT':stepByKey(view)?stepTitle(view):'Họp nhanh');
}
function agenda(active) {
  return '<aside class="panel agenda-panel"><div class="panel-head agenda-title"><h2>Chương trình họp</h2><span>'+meetingMinutes()+' phút</span></div><ol class="agenda">'+steps.map(step => {
    const done = data().session?.done.includes(step.key);
    return '<li><button data-action="step" data-key="'+step.key+'" class="'+(active===step.key?'active':'')+'"'+(active===step.key?' aria-current="step"':'')+'><span class="agenda-icon">'+icon(done?'check':step.icon)+'</span><strong>'+stepTitle(step.key)+'</strong><small>'+duration(step.key)+' phút</small></button></li>';
  }).join('')+'</ol></aside>';
}
function stat(symbol,title,value,detail) {
  return '<article class="stat"><span class="stat-icon">'+icon(symbol)+'</span><div><p>'+title+'</p><strong class="num">'+value+'</strong><small>'+detail+'</small></div></article>';
}
function panel(title,subtitle,action,body) {
  return '<section class="panel"><div class="panel-head"><div><h2>'+title+'</h2>'+(subtitle?'<p>'+subtitle+'</p>':'')+'</div>'+action+'</div>'+body+'</section>';
}
/* 3 dòng cơ cấu doanh thu được đặt tên kèm tỷ trọng riêng của từng chi nhánh
   ("— DT lốp (62%)" ở CN1, "(72%)" ở CN2, "(70%)" ở CN3). Ghép theo tên đầy đủ thì
   1 chỉ số bị tách thành 3 dòng rời, mỗi dòng trống 2 ô. Bỏ "(nn%)" ở cuối tên để
   3 chi nhánh nằm chung 1 dòng so sánh. */
const baseTitle = title => String(title ?? '').replace(/\s*\(\s*\d+(?:[.,]\d+)?\s*%\s*\)\s*$/,'').trim();
function comparisonRows() {
  const groups = new Map();
  periodData().branches.forEach((branch,index)=>{
    const seen = new Map();
    branch.kpis.forEach(kpi=>{
      const base = baseTitle(kpi.title);
      const name = base.normalize().toLocaleLowerCase('vi-VN');
      const metricKey = JSON.stringify([name,kpi.unit]);
      const rank = seen.get(metricKey) ?? 0;
      seen.set(metricKey,rank+1);
      const key = JSON.stringify([metricKey,rank]);
      if (!groups.has(key)) groups.set(key,{title:base,values:Array(jointIndex).fill(null)});
      groups.get(key).values[index] = kpi;
    });
  });
  return [...groups.values()];
}
/* Nút Tạo vấn đề — hiện ở MỌI dòng chỉ số, cả Đạt lẫn Chưa đạt.
   Chỉ số Đạt vẫn có thể có vấn đề cần đưa ra IDS (đạt nhờ may, đạt nhưng hỏng chất lượng).
   nho = true: bản gọn chỉ có biểu tượng, dùng cho bảng so sánh 3 chi nhánh để không phình cột. */
function kpiIssueButton(kpi,branchIndex,nho) {
  return '<button type="button" class="button secondary kpi-issue'+(nho?' kpi-issue-nho':'')+
    '" data-action="raise-kpi" data-key="'+branchIndex+'" data-id="'+kpi.id+
    '" title="Tạo vấn đề" aria-label="Tạo vấn đề cho '+label(kpi.title)+'">'+
    (nho?icon('issue'):'Tạo vấn đề')+'</button>';
}
function comparisonPanel(showActions=false) {
  const add = showActions ? addButton('kpis','Thêm chỉ số') : '';
  const heading = branchNames.map(name=>'<th scope="col">'+label(name)+'</th>').join('');
  const rows = comparisonRows().map(row=>{
    const cells = row.values.map((kpi,branchIndex)=>{
      if (!kpi) return '<td><span class="missing">Chưa có chỉ số</span></td>';
      const hit = kpi.actual >= kpi.target;
      const edit=showActions?'<button type="button" class="icon-button" data-action="edit-branch-kpi" data-key="'+branchIndex+
        '" data-id="'+kpi.id+'" aria-label="Chỉnh sửa '+label(kpi.title)+' · '+label(branchNames[branchIndex])+'">'+icon('edit')+'</button>':'';
      return '<td class="num"><strong>'+showNumber(kpi.actual,kpi.unit)+'</strong> / '+showNumber(kpi.target,kpi.unit)+'<br>'+pill(hit?'Đạt':'Chưa đạt',hit?'good':'miss')+edit+kpiIssueButton(kpi,branchIndex,!showActions)+'</td>';
    }).join('');
    return '<tr><th scope="row">'+label(row.title)+'</th>'+cells+'</tr>';
  }).join('');
  if (!rows) return panel('So sánh KPI 3 chi nhánh','Chỉ số '+periodName(),add,'<div class="list"><p class="empty">Chưa có KPI kỳ này.</p></div>');
  return panel('So sánh KPI 3 chi nhánh','Thực tế / chỉ tiêu theo từng chi nhánh',add,
    '<div class="table-wrap comparison" tabindex="0" aria-label="So sánh KPI 3 chi nhánh"><table><thead><tr><th scope="col">Chỉ số</th>'+heading+'</tr></thead><tbody>'+rows+'</tbody></table></div>');
}
function kpiPanel(compact) {
  if (isJoint() && compact) return comparisonPanel();
  const rows = data().kpis.map(kpi=>{
    const hit = kpi.actual>=kpi.target;
    const actions = compact?'':'<td>'+editButton('kpis',kpi.id)+kpiIssueButton(kpi,state.branch)+'</td>';
    return '<tr><td>'+label(kpi.title)+'</td><td>'+label(kpi.owner)+'</td><td class="num">'+showNumber(kpi.target,kpi.unit)+'</td><td class="num">'+showNumber(kpi.actual,kpi.unit)+'</td><td>'+pill(hit?'Đạt':'Chưa đạt',hit?'good':'miss')+'</td>'+actions+'</tr>';
  }).join('');
  const title = 'Bảng chỉ số '+periodName();
  const body = rows ? '<div class="table-wrap" tabindex="0" aria-label="'+title+'"><table><thead><tr><th scope="col">Chỉ số</th><th scope="col">Phụ trách</th><th scope="col">Chỉ tiêu</th><th scope="col">Thực tế</th><th scope="col">Trạng thái</th>'+(compact?'':'<th scope="col"><span class="sr">Chỉnh sửa</span></th>')+'</tr></thead><tbody>'+rows+'</tbody></table></div>' : '<div class="list"><p class="empty">Chưa có chỉ số cho kỳ này.</p></div>';
  return panel(title,'Theo dõi kết quả vận hành chi nhánh',compact?'<button class="button secondary" data-view="kpis">Cập nhật</button>':addButton('kpis','Thêm chỉ số'),body);
}
function tasksPanel(compact) {
  const tasks = data().tasks;
  const list = (compact ? tasks.slice(0,3) : tasks).map(task => '<div class="row"><input type="checkbox" data-action="toggle" data-id="'+task.id+'" '+(task.done?'checked':'')+' aria-label="Hoàn thành '+label(task.title)+'"><div class="row-text"><strong class="'+(task.done?'done':'')+'">'+label(task.title)+'</strong><small>'+label([task.branch,task.owner,dateText(task.date)].filter(Boolean).join(' · '))+'</small></div>'+editButton('tasks',task.id)+(!compact&&!task.done?workflowButton('renew',task.id,'Gia hạn'):'')+'</div>').join('');
  const preview=compact?'':'<button class="button secondary" type="button" data-task-preview="'+(isJoint()?'':branchSelect.value.slice(0,3))+'">Đồng bộ công việc</button>';
  return panel('Việc cần làm',tasks.filter(task=>task.done).length+' / '+tasks.length+' đã hoàn thành','<div class="session-actions">'+preview+addButton('tasks','Thêm việc')+'</div>','<div class="list">'+(list||'<p class="empty">Chưa có việc cần làm.</p>')+'</div>');
}
function rowsPanel(key,title,subtitle,addTitle,html) {
  const list = data()[key].map(html).join('');
  return panel(title,subtitle,addButton(key,addTitle),'<div class="list">'+(list||'<p class="empty">Chưa có nội dung. Bấm nút thêm để ghi nhận.</p>')+'</div>');
}
function workflowButton(action,id,title) {
  return '<button type="button" class="button secondary" data-action="'+action+'" data-id="'+id+'">'+title+'</button>';
}
function facilitatorGuide(title,key,body,note) {
  return '<section class="panel facilitator" aria-labelledby="facilitator-title">'+
    '<div class="panel-head"><div><h2 id="facilitator-title">'+title+'</h2><p>Gợi ý điều hành cuộc họp</p></div><span class="facilitator-time">'+duration(key)+' phút</span></div>'+
    '<div class="facilitator-body">'+body+(note?'<p class="facilitator-note"><strong>Lưu ý</strong> · '+note+'</p>':'')+'</div></section>';
}
function goodNewsGuide() {
  return facilitatorGuide('B1 · Tin tốt','good',
    '<p><strong>Người điều phối</strong> · Mời mỗi thành viên lần lượt chia sẻ:</p><ul><li>1 tin vui cá nhân</li><li>1 tin vui trong công việc</li></ul>',
    'Chia sẻ ngắn gọn, đủ ý. Toàn bộ phần Tin tốt không quá 5 phút.');
}
function kpiGuide() {
  const prior = periodName()+' vừa rồi';
  return facilitatorGuide('B2 · Chỉ số','kpis',
    '<h3>Người điều phối</h3><ul><li>Mời từng thành viên báo cáo nhanh chỉ số trong '+prior+'.</li><li>Với chỉ số màu đỏ, hỏi người phụ trách đang gặp vướng mắc gì.</li></ul>'+
    '<h3>Thành viên</h3><ul><li>Cập nhật chỉ số trước khi bắt đầu cuộc họp.</li><li>Báo cáo nhanh kết quả so với chỉ tiêu của '+prior+'.</li><li>Đưa chỉ số chưa đạt vào Danh sách vấn đề.</li></ul>',
    'Tập trung báo cáo chỉ số. Dành phần thảo luận sâu cho bước Giải quyết vấn đề (IDS).');
}
function goalsGuide() {
  return facilitatorGuide('B3 · Rà soát mục tiêu','goals',
    '<h3>Người điều phối</h3><p>Mời từng thành viên cập nhật nhanh tiến độ các cột mốc của từng mục tiêu.</p>'+
    '<h3>Thành viên</h3><p>Cập nhật cột mốc trước cuộc họp. Khi báo cáo, trả lời bốn câu hỏi:</p>'+
    '<ol><li>Tiến độ công việc hiện ra sao?</li><li>Công việc nào đang gây cản trở?</li><li>Đang gặp khó khăn gì?</li><li>Hướng giải quyết là gì?</li></ol><p>Đưa công việc chưa hoàn thành cần xử lý vào Danh sách vấn đề.</p>',
    'Báo cáo tiến độ ngắn gọn. Thảo luận sâu ở bước IDS.');
}
function feedbackGuide() {
  return facilitatorGuide('B4 · Phản hồi','news',
    '<h3>Người điều phối</h3><p>Mời từng thành viên chia sẻ phản hồi tích cực hoặc tiêu cực từ khách hàng hay nội bộ. Cân nhắc đưa phản hồi tiêu cực cần xử lý vào Danh sách vấn đề.</p>'+
    '<h3>Thành viên</h3><p>Chia sẻ phản hồi nhận được từ khách hàng hoặc đội ngũ.</p>',
    'Tập trung chia sẻ phản hồi. Chuyển phần thảo luận sang IDS.');
}
function actionsGuide() {
  return facilitatorGuide('B5 · Danh sách hành động','tasks',
    '<h3>Người điều phối</h3><p>Mời từng thành viên báo cáo trạng thái công việc được giao từ buổi họp trước.</p>'+
    '<h3>Thành viên</h3><ul><li>Báo cáo việc đã hoàn thành hoặc còn mở.</li><li>Đánh dấu hoàn thành cho việc đã xong.</li><li>Giữ việc chưa xong trong danh sách và gia hạn thời gian.</li></ul>','');
}
function issuesGuide() {
  return facilitatorGuide('B6 · Vấn đề cần giải quyết','issues',
    '<h3>Người điều phối</h3><p>Hỏi đội ngũ có vấn đề nào cần bổ sung. Xếp thứ tự ưu tiên và chọn ba vấn đề cấp thiết nhất.</p>'+
    '<h3>Thành viên</h3><p>Bổ sung vấn đề nếu có. Xử lý từng vấn đề theo IDS:</p>'+
    '<ol><li><strong>Identify</strong> · Xác định nguyên nhân cốt lõi.</li><li><strong>Discuss</strong> · Thảo luận phương án xử lý.</li><li><strong>Solve</strong> · Chốt phương án và tạo hành động nếu cần.</li></ol>',
    'Thực hiện IDS đúng trình tự. Hết giờ thì giữ vấn đề còn mở cho buổi sau. Còn giờ thì xếp lại thứ tự ưu tiên để xử lý tiếp.');
}
function conclusionGuide() {
  return facilitatorGuide('B7 · Kết luận','close',
    '<h3>Người điều phối</h3><ul><li>Tóm tắt các hành động mới và rà lại với từng người phụ trách.</li><li>Chốt thông điệp cần truyền đạt cho đội ngũ.</li></ul>'+
    '<h3>Thành viên</h3><ul><li>Xác nhận đã nắm rõ công việc được giao.</li><li>Chấm điểm cuộc họp.</li></ul>','');
}
function closingActions() {
  const meeting = data().session;
  const baseline = meeting?.taskBaseline;
  const tasks = baseline
    ? data().tasks.filter(task=>!baseline.includes(task.id))
    : data().tasks.filter(task=>!task.done);
  const rows = tasks.map(task=>{
    const checked = meeting?.acknowledged?.includes(task.id);
    const confirmation = meeting && !meeting.endedAt
      ? '<label class="task-ack"><input type="checkbox" data-action="ack-task" data-id="'+task.id+'" '+(checked?'checked':'')+
        ' aria-label="Đã xác nhận '+label(task.title)+'">Đã xác nhận</label>'
      : '';
    return '<div class="row"><div class="row-text"><strong>'+label(task.title)+'</strong><small>'+
      label([task.branch,task.owner,dateText(task.date)].filter(Boolean).join(' · '))+'</small></div>'+confirmation+'</div>';
  }).join('');
  return panel(baseline?'Hành động mới cần xác nhận':'Hành động cần rà soát','','',
    '<div class="list">'+(rows||'<p class="empty">Chưa có hành động cần xác nhận.</p>')+'</div>');
}
function contentFor(key) {
  switch(key) {
    case 'kpis': return kpiGuide()+(isJoint()?comparisonPanel(true):kpiPanel(false));
    case 'tasks': return actionsGuide()+tasksPanel(false);
    case 'goals':
      return goalsGuide()+rowsPanel(key,period().goal,'Rà soát tiến độ từng cam kết','Thêm mục tiêu',item=>
        '<div class="row"><div class="row-text"><strong>'+label(item.title)+'</strong><small>'+label(item.owner)+'</small>'+
        (item.milestones?'<small class="milestone">'+label(item.milestones)+'</small>':'')+'</div>'+
        pill(label(item.status),item.status==='Cần xử lý'?'warn':'good')+editButton(key,item.id)+
        (item.status==='Hoàn thành'?'':workflowButton('raise-goal',item.id,'Đưa vào Vấn đề'))+'</div>');
    case 'issues': {
      const issues = [...data().issues].sort((a,b)=>Number(a.solved)-Number(b.solved)||['Cao','Vừa','Thấp'].indexOf(a.priority)-['Cao','Vừa','Thấp'].indexOf(b.priority));
      const list = issues.map((item,index)=>'<div class="row"><div class="row-text"><strong>'+label(item.title)+'</strong><small>'+label([item.branch,item.solution||'Chưa chốt hành động'].filter(Boolean).join(' · '))+'</small></div>'+
        (!item.solved&&index<3?'<span class="priority priority-discussion">Thảo luận '+(index+1)+'</span>':'')+
        '<span class="priority">'+label(item.priority)+'</span>'+pill(item.solved?'Đã xử lý':'Đang mở',item.solved?'good':'warn')+editButton(key,item.id)+
        (item.solution?workflowButton('task-from-issue',item.id,'Tạo hành động'):'')+'</div>').join('');
      return issuesGuide()+panel('Danh sách vấn đề','Xác định · Thảo luận · Giải quyết',addButton(key,'Thêm vấn đề'),'<div class="list">'+(list||'<p class="empty">Chưa có vấn đề.</p>')+'</div>');
    }
    case 'good':
      return goodNewsGuide() + '<div><button class="button secondary" data-view="awards">'+icon('spark')+'Mở Vinh danh</button></div>' + rowsPanel(key,'Tin tốt','','Thêm tin tốt',item=>
        '<div class="row"><div class="row-text"><strong>'+label(item.title)+'</strong><small>'+label(item.owner)+'</small></div>'+editButton(key,item.id)+'</div>');
    case 'news':
      return feedbackGuide()+rowsPanel(key,'Phản hồi','','Thêm phản hồi',item=>
        '<div class="row"><div class="row-text"><strong>'+label(item.title)+'</strong><small>'+label([item.source,item.owner].filter(Boolean).join(' · '))+'</small></div>'+
        (item.sentiment?pill(label(item.sentiment),item.sentiment==='Tiêu cực'?'miss':'good'):'')+editButton(key,item.id)+
        (item.sentiment==='Tích cực'?'':workflowButton('raise',item.id,'Đưa vào IDS'))+'</div>');
    case 'close': {
      const d = data();
      const scores = Array.from({length:10},(_,i)=>'<button type="button" data-action="rate" data-id="'+(i+1)+'" class="button '+(d.rating===i+1?'primary':'secondary')+'" aria-pressed="'+(d.rating===i+1)+'">'+(i+1)+'</button>').join('');
      return conclusionGuide()+closingActions()+panel('Kết thúc buổi họp','Ghi lại nội dung cần truyền đạt và đánh giá hiệu quả.','',
        '<form id="close-form" class="notes"><label for="minutes">Biên bản và thông điệp cần truyền đạt</label><textarea id="minutes" name="minutes" placeholder="Quyết định, cam kết và nội dung cần truyền đạt…">'+label(d.notes)+'</textarea><p>Điểm buổi họp / 10</p><div class="score" aria-label="Điểm buổi họp">'+scores+'</div><div class="session-actions"><button class="button secondary" type="submit">Lưu ghi chú</button><button class="button primary" type="submit" name="finish" value="1">'+(d.session?.endedAt?'Cập nhật biên bản':'Chốt biên bản')+'</button></div>'+(d.session?.endedAt?'<p class="finished">Biên bản đã lưu trong Lịch sử họp.</p>':'')+'</form>');
    }
    default: return '';
  }
}
function branchSummary() {
  const rows = periodData().branches.map((branch,index)=>{
    const kpis = branch.kpis.filter(kpi=>kpi.actual>=kpi.target).length;
    const open = branch.issues.filter(issue=>!issue.solved).length;
    return '<div class="row"><div class="row-text"><strong>'+label(branchNames[index])+'</strong><small>'+kpis+' / '+branch.kpis.length+' KPI đạt · '+open+' vấn đề đang mở</small></div><button class="button secondary" data-action="open-branch" data-id="'+index+'">Xem chi nhánh</button></div>';
  }).join('');
  return panel('Tình hình chi nhánh','','','<div class="list">'+rows+'</div>');
}
function weeklyHandover() {
  if (!isJoint() || state.period!=='week') return '';
  const url = 'https://philonggroup.github.io/TEAMPHILONG/giaoban.html';
  const rows = [
    ['B1 · Tin tốt','1 · Check-in; mục Vinh danh tương ứng bước 4'],
    ['B2 · Chỉ số','3 · Toàn cảnh và giải trình từng chi nhánh'],
    ['B3 · Rà soát mục tiêu','3 · Phần giải trình tiến độ, lồng ghép trong báo cáo chi nhánh'],
    ['B4 · Phản hồi','4 · Vinh danh và 5 · Cần hỗ trợ, tùy nội dung phản hồi'],
    ['B5 · Danh sách hành động','2 · Việc tuần trước'],
    ['B6 · Vấn đề cần giải quyết','5 · Cần hỗ trợ'],
    ['B7 · Kết luận','6 · Chốt việc, 7 · Thông điệp và 8 · Chấm điểm'],
  ].map(([quick,formal])=>'<tr><th scope="row">'+quick+'</th><td>'+formal+'</td></tr>').join('');
  return '<section class="panel weekly-handover" aria-labelledby="handover-title"><div class="panel-head">'+
    '<div><h2 id="handover-title">Giao ban tuần Phi Long</h2><p>9 bước · 60 phút · Báo cáo chung 3 chi nhánh</p></div>'+
    '<a class="button primary" href="'+url+'">Mở giao ban tuần</a></div>'+
    '<details><summary>Đối chiếu với 7 bước họp tuần</summary>'+
    '<div class="table-wrap" tabindex="0" aria-label="Đối chiếu quy trình họp tuần"><table><thead><tr>'+
    '<th scope="col">'+meetingTitle()+' · '+meetingMinutes()+' phút</th><th scope="col">Giao ban tuần Phi Long · 60 phút</th>'+
    '</tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<p>Giao ban Phi Long có thêm bước 9 · WIFLE để chia sẻ cảm nhận cuối buổi. Hai trang sử dụng nguồn dữ liệu riêng.</p></details></section>';
}
function overview() {
  const d = data();
  const active = d.session && !d.session.endedAt;
  const getMetric = (name) => d.kpis.find(kpi=>kpi.title===name);
  const metrics = isJoint() ? jointStats() : state.period==='week' ? [
    ['money','Doanh thu tuần',getMetric('Doanh thu tuần')],['car','Xe tiếp nhận',getMetric('Xe tiếp nhận')],['safety','Kiểm tra an toàn',getMetric('Xe có phiếu kiểm tra an toàn')],
  ].filter(([, ,kpi])=>kpi).map(([symbol,title,kpi])=>stat(symbol,title,showNumber(kpi.actual,kpi.unit),'Mục tiêu '+showNumber(kpi.target,kpi.unit))).join('') : '';
  const open = d.issues.filter(item=>!item.solved).length;
  return '<section class="hero"><div><p class="eyebrow">PHÒNG ĐIỀU HÀNH · '+label(branchSelect.value)+'</p><h1>'+meetingTitle()+'</h1><div class="hero-meta"><span>'+icon('calendar')+periodDate(d.session?.date||today())+'</span><span>'+icon('clock')+meetingMinutes()+' phút</span>'+pill(active?'Đang diễn ra':d.session?.endedAt?'Đã kết thúc':'Sẵn sàng họp',active?'good':'neutral')+'</div></div><button class="button yellow" data-action="start">'+icon('play')+(active?'Tiếp tục họp':d.session?.endedAt?'Bắt đầu buổi mới':isJoint()?'Bắt đầu họp chung':'Bắt đầu cuộc họp')+'</button></section>'+
    weeklyHandover()+'<div class="stats">'+(metrics||stat('chart','KPI đạt',d.kpis.filter(kpi=>kpi.actual>=kpi.target).length+' / '+d.kpis.length,'Chỉ số '+periodName()))+stat('issue','Vấn đề đang mở',open,'Cần xử lý qua IDS')+'</div>'+(isJoint()?'<div class="wide-panel">'+comparisonPanel()+'</div>':'')+'<div class="dashboard"><div class="column">'+(isJoint()?'':kpiPanel(true))+tasksPanel(true)+(isJoint()?branchSummary():'')+'</div>'+agenda(active?d.session.step:'')+'</div>';
}
function jointStats() {
  const kpis = periodData().branches.flatMap(branch=>branch.kpis);
  const hits = kpis.filter(kpi=>kpi.actual>=kpi.target).length;
  const tasks = data().tasks;
  return stat('team','Chi nhánh',branchNames.length,'PHI LONG 1 · PHI LONG 2 · PHI LONG 3')
    +stat('chart','KPI đạt',hits+' / '+kpis.length,'Theo chỉ tiêu từng chi nhánh')
    +stat('check','Việc chung đã xong',tasks.filter(task=>task.done).length+' / '+tasks.length,'Cam kết của cuộc họp chung');
}
function reportTitle(item) {
  return !item.title || item.title==='Họp tuần L10' ? 'Họp tuần' : item.title;
}
function history() {
  const rows = [...data().history].reverse().map(item=>'<div class="row"><div class="row-text"><strong>'+label(reportTitle(item))+' · '+periodDate(item.date,item.period||'week')+' · '+dateText(item.date)+'</strong><small>'+item.done.length+' / 7 mục đã rà soát'+(item.rating?' · '+item.rating+'/10':'')+'</small></div><button class="button secondary" data-action="view-report" data-id="'+item.id+'">Xem biên bản</button><button class="button quiet" aria-label="Tải biên bản" data-action="export" data-id="'+item.id+'">'+icon('download')+'</button></div>').join('');
  return pageTitle('Lịch sử họp','Tra cứu biên bản của '+label(branchSelect.value)) + panel('Biên bản đã lưu','','','<div class="list">'+(rows||'<p class="empty">Biên bản sẽ xuất hiện sau khi chốt buổi họp.</p>')+'</div>');
}
function pageTitle(title,subtitle,actions='') {
  return '<header class="meeting-header"><div><h1>'+title+'</h1><p>'+subtitle+'</p></div>'+actions+'</header>';
}
function meeting() {
  const d = data();
  const active = d.session && !d.session.endedAt;
  const step = stepByKey(active ? d.session.step : previewStep);
  const index = steps.indexOf(step);
  const control = active?'<button class="button secondary clock" data-action="timer"></button>':'<button class="button primary" data-action="start">'+icon('play')+(d.session?.endedAt?'Bắt đầu buổi mới':'Bắt đầu cuộc họp')+'</button>';
  const next = index<steps.length-1?'<button class="button primary" data-action="next">'+(active?'Hoàn tất bước và tiếp tục':'Xem bước tiếp theo')+'</button>':'';
  return pageTitle(meetingTitle(),label(isJoint()?branchNames.map(name=>name.split(' · ')[1]).join(' · '):branchSelect.value)+' · '+periodDate(d.session?.date||today())+' · '+dateText(d.session?.date||today()),'<div class="session-actions">'+control+'</div>')+
    '<div class="dashboard"><div><div class="column"><p>'+step.detail+'</p>'+contentFor(step.key)+'</div><div class="step-footer"><button class="button secondary" data-action="prev" '+(index===0?'disabled':'')+'>Mục trước</button>'+next+'</div></div>'+agenda(step.key)+'</div>';
}
function visionPage() {
  const culture = [
    ['PLAN','Lập kế hoạch','Có mục tiêu, định hướng rõ ràng và hành động có kỷ luật.'],
    ['LOVE','Yêu thương','Làm việc bằng sự tận tâm, tôn trọng con người, kết nối đội ngũ và trao giá trị cho khách hàng.'],
    ['GROW','Phát triển','Không ngừng học hỏi, cải tiến và trở nên tốt hơn 1% mỗi ngày.'],
  ].map(([word,title,detail])=>'<article><small>'+word+'</small><h3>'+title+'</h3><p>'+detail+'</p></article>').join('');
  return strategyTabs('vision')+pageTitle('Tầm nhìn và chiến lược','Phi Long Group',strategyExcelControls('vision'))+
    '<div class="column">'+panel('Tầm nhìn doanh nghiệp','','',visionForm())+
    panel('Văn hóa Phi Long Group','PLAN • LOVE • GROW','','<div class="vision-culture">'+culture+'</div>')+
    panel('Theo dõi trong cuộc họp',label(branchSelect.value)+' · '+period().label,'',
      '<div class="vision-actions"><button class="button secondary" data-view="goals">'+icon('target')+label(period().goal)+'</button>'+
      '<button class="button secondary" data-view="kpis">'+icon('chart')+label(kpiTitle())+'</button>'+
      '<button class="button secondary" data-view="meeting">'+icon('calendar')+'Vào cuộc họp</button></div>')+'</div>';
}
function render() {
  nav();
  let page;
  if (view==='overview') page = overview();
  else if (view==='meeting') page = meeting();
  else if (view==='history') page = history();
  else if (view==='excel') page = excelPage();
  else if (view==='awards') page = awardsPage();
  else if (view==='vision') page = visionPage();
  else if (view==='annual') page = annualPlanPage();
  else if (view==='swot') page = swotPage();
  else page = pageTitle(stepTitle(view),stepByKey(view).detail,
    '<button class="button secondary" data-view="excel">'+icon('excel')+'Nhập / Xuất Excel</button>')+contentFor(view);
  workspace.innerHTML = (['annual','swot'].includes(view)?'':periodNav()+weeklyPresetNav())+page;
  if (view==='vision') updateVisionTotals(workspace.querySelector('#vision-form'));
  if (view==='annual') updateAnnualTotals(workspace.querySelector('#annual-form'));
  updateTimer();
}
function changeView(key) {
  view = key;
  render();
  window.scrollTo(0,0);
}
function newSession(step) {
  const d = data();
  d.notes = '';
  d.rating = 0;
  d.session = {id:uid(),date:today(),step,weeklyPreset:state.period==='week'?state.weeklyPreset:null,done:[],startedAt:Date.now(),taskBaseline:d.tasks.map(task=>task.id),tick:null,elapsed:0,endedAt:null};
}
function setStep(key) {
  const session = data().session;
  if (!session || session.endedAt) {
    previewStep = key;
    changeView('meeting');
    return;
  }
  if (session.step!==key) {
    session.step = key;
    session.tick = null;
    session.elapsed = 0;
  }
  save();
  changeView('meeting');
}
function updateTimer() {
  const clock = workspace.querySelector('.clock');
  const session = data().session;
  if (!clock || !session) return;
  const limit = duration(session.step)*60;
  const elapsed = session.elapsed + (session.tick ? Math.floor((Date.now()-session.tick)/1000) : 0);
  const remaining = Math.max(0,limit-elapsed);
  const time = String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
  const text = remaining===0?'Hết giờ · Đặt lại':session.tick?'Tạm dừng':'Chạy giờ';
  clock.textContent = time+' · '+text;
}
setInterval(updateTimer,250);
function toggleTimer() {
  const s = data().session;
  const max = duration(s.step)*60;
  if (s.tick) {
    s.elapsed += Math.floor((Date.now()-s.tick)/1000);
    s.tick = null;
    if (s.elapsed>=max) s.elapsed = 0;
  } else {
    s.tick = Date.now();
  }
  save();
  updateTimer();
}

const textField = (name,title,required=false) => ({name,title,required,type:'text'});
const numberField = (name,title) => ({name,title,required:true,type:'number'});
const selectField = (name,title,options) => ({name,title,type:'select',options});
const areaField = (name,title) => ({name,title,type:'textarea'});
const mainFields = [textField('title','Nội dung',true),textField('owner','Người phụ trách',true)];
const fieldsByKey = {
  good:[textField('title','Tin tốt',true),textField('owner','Người chia sẻ')],
  awards:[textField('title','Cá nhân hoặc tập thể',true),selectField('category','Hạng mục',awardCategories),
    {name:'date',title:'Ngày vinh danh',type:'date',required:true},selectField('unit','Đơn vị',awardUnits),
    numberField('actual','Kết quả'),numberField('target','Chỉ tiêu'),areaField('reason','Ghi nhận thành tích')],
  news:[textField('title','Nội dung phản hồi',true),selectField('sentiment','Tính chất',['Tích cực','Tiêu cực']),selectField('source','Nguồn phản hồi',['Khách hàng','Nội bộ']),textField('owner','Người chia sẻ hoặc nguồn cụ thể')],
  kpis:[textField('title','Tên chỉ số',true),textField('owner','Người phụ trách',true),selectField('unit','Đơn vị',['xe','lượt','%','triệu đ','khách','lốp','phiếu','đơn']),numberField('target','Chỉ tiêu'),numberField('actual','Thực tế')],
  goals:[...mainFields,selectField('status','Trạng thái',['Đúng tiến độ','Cần xử lý','Hoàn thành']),areaField('milestones','Tiến độ cột mốc')],
  tasks:[...mainFields,{name:'date',title:'Hạn hoàn thành',type:'date'}],
  issues:[textField('title','Vấn đề',true),selectField('priority','Mức ưu tiên',['Cao','Vừa','Thấp']),areaField('cause','Xác định nguyên nhân'),areaField('discussion','Ghi nhận thảo luận'),areaField('solution','Hành động đã chốt'),selectField('solved','Trạng thái',['Đang mở','Đã xử lý'])],
};
function fieldMarkup(field,item) {
  const value = field.name==='solved' ? (item.solved?'Đã xử lý':'Đang mở') : item[field.name] ?? '';
  let input;
  if (field.type==='select') input = '<select name="'+field.name+'"'+(field.placeholder?' required':'')+'>'+
    (field.placeholder?'<option value="" disabled'+(value?'':' selected')+'>'+field.placeholder+'</option>':'')+
    field.options.map(option=>'<option'+(option===value?' selected':'')+'>'+label(option)+'</option>').join('')+'</select>';
  else if (field.type==='textarea') input = '<textarea maxlength="2000" name="'+field.name+'">'+label(value)+'</textarea>';
  else {
    const attributes = field.type==='number'?' min="0" max="999999999" step="0.01"':field.type==='text'?' maxlength="180"':'';
    input = '<input type="'+field.type+'" name="'+field.name+'" value="'+label(value)+'"'+attributes+(field.required?' required':'')+'>';
  }
  return '<label>'+field.title+input+'</label>';
}
function openEditor(key,id,initial={},kpiBranch) {
  const list=kpiBranch===undefined?data()[key]:periodData().branches[kpiBranch]?.kpis;
  const item = id ? list?.find(entry=>entry.id===id) : key==='awards'?{date:awardDate(),...initial}:initial;
  if (!item) return;
  const fields = [...fieldsByKey[key]];
  if (isJoint() && ['tasks','issues'].includes(key)) {
    fields.splice(1,0,selectField('branch','Chi nhánh phụ trách',['Tất cả chi nhánh',...branchNames]));
  }
  if (isJoint() && key==='awards') fields.splice(1,0,{...selectField('branch','Chi nhánh',branchNames),required:true});
  if (isJoint() && key==='kpis' && !id) {
    fields.unshift({...selectField('branch','Chi nhánh',branchNames),required:true,placeholder:'Chọn chi nhánh'});
  }
  editContext = {key,id,fields,list};
  form.querySelector('#edit-title').textContent = (id?'Chỉnh sửa':'Thêm')+' · '+(key==='awards'?'Vinh danh':stepTitle(key))+
    (kpiBranch===undefined?'':' · '+branchNames[kpiBranch]);
  const container = form.querySelector('#fields');
  container.innerHTML = fields.map(field=>fieldMarkup(field,item)).join('');
  if (key==='awards') container.prepend(awardPhotoEditor(editContext,item));
  editor.showModal();
}
form.addEventListener('submit',event=>{
  event.preventDefault();
  const {key,id,fields,list,photo,photoPending} = editContext;
  if (photoPending) { message('Đang xử lý ảnh. Vui lòng chờ.'); return; }
  const incoming = Object.fromEntries(new FormData(form));
  let destination=list;
  if (key==='kpis' && !id && isJoint()) {
    destination=periodData().branches[branchNames.indexOf(incoming.branch)]?.kpis;
    if (!destination) { form.elements.namedItem('branch').reportValidity(); return; }
  }
  const item = id ? destination.find(entry=>entry.id===id) : record({done:false});
  if (!item) return;
  const before = id && ['awards','kpis'].includes(key) ? {...item} : null;
  for (const field of fields) {
    const value = incoming[field.name].trim();
    if (field.required && !value) {
      const input = form.elements.namedItem(field.name);
      input.setCustomValidity('Vui lòng nhập nội dung.');
      input.reportValidity();
      return;
    }
    if (field.type==='number' && incoming.unit==='%' && Number(value)>100) {
      const input = form.elements.namedItem(field.name);
      input.setCustomValidity('Tỷ lệ phải từ 0 đến 100%.');
      input.reportValidity();
      return;
    }
  }
  if (key==='awards') {
    const error=awardError(incoming);
    if (error) {
      const input=form.elements.namedItem(error.field);
      input.setCustomValidity(error.message);
      input.reportValidity();
      return;
    }
  }
  for (const field of fields) {
    const value = incoming[field.name].trim();
    if(key==='kpis' && field.name==='branch') continue;
    item[field.name] = field.type==='number'?Number(value):field.name==='solved'?value==='Đã xử lý':value;
  }
  if (key==='awards') {
    if (!isJoint()) item.branch=branchSelect.value;
    if (photo) item.photo=photo;
    else delete item.photo;
  }
  if (!id) (destination??=(data()[key]??=[])).push(item);
  if (!save() && ['awards','kpis'].includes(key)) {
    if (!id) destination.pop();
    else destination[destination.indexOf(item)]=before;
    message(key==='awards'?'Không lưu được vinh danh trên thiết bị này.':'Không lưu được chỉ số trên thiết bị này.');
    return;
  }
  editor.close();
  render();
  message('Đã lưu thay đổi.');
});
form.addEventListener('input',()=>form.querySelectorAll('input').forEach(input=>input.setCustomValidity('')));
document.querySelector('#close-editor').onclick = () => editor.close();
document.querySelector('#cancel').onclick = () => editor.close();
editor.addEventListener('close',()=>{ editContext = null; });
branchSelect.addEventListener('change',()=>switchBranch(branchSelect.selectedIndex,['excel','awards','vision','annual','swot','kpis','goals'].includes(view)?view:'overview'));
function reportText(item) {
  const kind = item.period || 'week';
  const taskLines = item.tasks.map(task=>(task.done?'[Đã xong] ':'[Đang mở] ')+[task.title,task.branch,task.owner,dateText(task.date)].filter(Boolean).join(' · ')+(item.acknowledged?.includes(task.id)?' · Đã xác nhận nhiệm vụ':''));
  const issueLines = item.issues.map(issue=>(issue.solved?'[Đã xử lý] ':'[Đang mở] ')+issue.title+(issue.branch?' · '+issue.branch:'')+(issue.cause?'\n  Nguyên nhân: '+issue.cause:'')+(issue.discussion?'\n  Thảo luận: '+issue.discussion:'')+(issue.solution?'\n  Hành động: '+issue.solution:''));
  const metricLine = kpi=>showNumber(kpi.actual,kpi.unit)+' / '+showNumber(kpi.target,kpi.unit);
  const kpiLines = item.comparison
    ? item.comparison.map(row=>row.title+' · '+row.values.map((kpi,index)=>branchNames[index]+': '+(kpi?metricLine(kpi):'Chưa có chỉ số')).join(' | '))
    : item.kpis.map(kpi=>kpi.title+' · '+metricLine(kpi));
  const goalLines = item.goals.map(goal=>goal.title+' · '+goal.owner+' · '+goal.status+(goal.milestones?'\n  Cột mốc: '+goal.milestones:''));
  const awards=(item.awards??[]).map(entry=>[entry.title,entry.branch,entry.category,awardResult(entry),entry.reason].filter(Boolean).join(' · '));
  const notesLines = entries => entries.map(entry=>[entry.title,entry.sentiment,entry.source,entry.owner].filter(Boolean).join(' · ')).join('\n');
  return ['CARDIY | BIÊN BẢN '+reportTitle(item).toLocaleUpperCase('vi-VN'),(item.comparison?branchNames.join(' | '):item.branch)+' · '+periodDate(item.date,kind)+' · '+dateText(item.date),'Điểm họp: '+(item.rating?item.rating+'/10':'Chưa chấm'),'Mục đã rà soát: '+item.done.map(key=>stepTitle(key,kind)).join(', '),'','TIN TỐT',notesLines(item.good),...(awards.length?['','VINH DANH',...awards]:[]),'',stepTitle('kpis',kind).toLocaleUpperCase('vi-VN'),...kpiLines,'',stepTitle('goals',kind).toLocaleUpperCase('vi-VN'),...goalLines,'','PHẢN HỒI',notesLines(item.news),'','DANH SÁCH HÀNH ĐỘNG',...taskLines,'','VẤN ĐỀ (IDS)',...issueLines,'','NỘI DUNG TRUYỀN ĐẠT',item.notes||'Chưa ghi nội dung.'].join('\n');
}
function findReport(id) { return data().history.find(item=>item.id===id); }
function finishMeeting() {
  const d = data();
  if (!d.session) {
    const notes = d.notes;
    const rating = d.rating;
    newSession('close');
    d.notes = notes;
    d.rating = rating;
  }
  const s = d.session;
  if (!s.done.includes('close')) s.done.push('close');
  s.endedAt ??= Date.now();
  s.tick = null;
  const snapshot = structuredClone({id:s.id,title:meetingTitle(s.weeklyPreset??'quick'),period:state.period,branch:branchSelect.value,comparison:isJoint()?comparisonRows():null,acknowledged:s.acknowledged??[],date:s.date,done:s.done,rating:d.rating,notes:d.notes,tasks:d.tasks,issues:d.issues,kpis:d.kpis,goals:d.goals,good:d.good,news:d.news,awards:awardLines(s.date)});
  const index = d.history.findIndex(item=>item.id===s.id);
  if (index===-1) d.history.push(snapshot);
  else d.history[index] = snapshot;
  save();
  changeView('history');
  message(window.persistCardiyCloudDraft?.() ? 'Đã chốt biên bản. Bấm Google Sheets để lưu bản chính.' : 'Đã lưu biên bản họp.');
}
workspace.addEventListener('submit',event=>{
  if (event.target.id!=='close-form') return;
  event.preventDefault();
  data().notes = event.target.elements.minutes.value.trim();
  if (event.submitter?.name==='finish') finishMeeting();
  else {
    save();
    message('Đã lưu ghi chú.');
  }
});
workspace.addEventListener('input',event=>{
  if (event.target.id==='minutes') {
    data().notes = event.target.value;
    save();
  }
});
workspace.addEventListener('change',event=>{
  const {action,id:taskId} = event.target.dataset;
  if (action==='ack-task') {
    const session = data().session;
    const acknowledged = new Set(session.acknowledged);
    if (event.target.checked) acknowledged.add(taskId);
    else acknowledged.delete(taskId);
    session.acknowledged = [...acknowledged];
    save();
    return;
  }
  if (action!=='toggle') return;
  get('tasks',event.target.dataset.id).done = event.target.checked;
  save();
  const id = event.target.dataset.id;
  render();
  workspace.querySelector('input[data-id="'+id+'"]')?.focus();
});
document.addEventListener('click',event=>{
  const button = event.target.closest('[data-action],[data-view]');
  if (!button || button.disabled) return;
  if (button.dataset.view) {
    event.preventDefault();
    changeView(button.dataset.view);
    return;
  }
  const {action,key,id} = button.dataset;
  const d = data();
  const session = d.session;
  switch(action) {
    case 'period':
      state.period = key;
      previewStep = 'good';
      save();
      render();
      workspace.querySelector('[data-action="period"][aria-pressed="true"]').focus();
      break;
    case 'weekly-preset':
      state.weeklyPreset = key;
      save();
      render();
      workspace.querySelector('[data-action="weekly-preset"][aria-pressed="true"]').focus();
      break;
    case 'open-year':
      state.period='year';
      previewStep='good';
      save();
      changeView(key);
      break;
    case 'open-joint': switchBranch(jointIndex);break;
    case 'open-branch': switchBranch(Number(id));break;
    case 'start':
      if (!session || session.endedAt) {
        if (session?.endedAt) {
          d.good = [];
          d.news = [];
        }
        newSession('good');
        save();
      }
      changeView('meeting');
      break;
    case 'step':
      setStep(key);
      break;
    case 'prev': case 'next': {
      const index = steps.findIndex(step=>step.key===(session && !session.endedAt ? session.step : previewStep));
      if (action==='next' && session && !session.endedAt && !session.done.includes(session.step)) session.done.push(session.step);
      setStep(steps[index+(action==='next'?1:-1)].key);
      break;
    }
    case 'timer': toggleTimer();break;
    case 'nominate-award': nominateAward(Number(key));break;
    case 'celebrate-award': celebrateAward(Number(key));break;
    case 'add': openEditor(key);break;
    case 'edit': openEditor(key,id);break;
    case 'edit-branch-kpi': openEditor('kpis',id,{},Number(key));break;
    case 'raise': openEditor('issues',null,{title:get('news',id).title});break;
    case 'raise-goal': openEditor('issues',null,{title:get('goals',id).title});break;
    case 'renew':
      openEditor('tasks',id);
      form.elements.namedItem('date').focus();
      break;
    case 'task-from-issue': {
      const issue = get('issues',id);
      openEditor('tasks',null,{title:issue.solution.slice(0,180),branch:issue.branch});
      break;
    }
    case 'raise-kpi': {
      const index = Number(key);
      const branch = periodData().branches[index];
      const kpi = branch && branch.kpis.find(item=>item.id===id);
      if (!kpi) break;
      /* Nút nay có ở cả dòng Đạt nên tiêu đề phải theo đúng trạng thái, không mặc định "chưa đạt" */
      const dat = kpi.actual >= kpi.target;
      openEditor('issues',null,{title:((dat?'Vấn đề từ chỉ số: ':'Chỉ số chưa đạt: ')+kpi.title).slice(0,180),branch:branchNames[index]});
      break;
    }
    case 'rate':
      d.rating = Number(id);
      for (const score of workspace.querySelectorAll('[data-action="rate"]')) {
        const chosen = score===button;
        score.classList.toggle('primary',chosen);
        score.classList.toggle('secondary',!chosen);
        score.setAttribute('aria-pressed',String(chosen));
      }
      save();
      break;
    case 'view-report': {
      const item = findReport(id);
      workspace.innerHTML = periodNav()+pageTitle('Biên bản họp',label(item.branch)+' · '+periodDate(item.date,item.period||'week')+' · '+dateText(item.date),'<div class="session-actions"><button class="button secondary" data-view="history">Về lịch sử</button><button class="button primary" data-action="export" data-id="'+id+'">'+icon('download')+'Tải biên bản</button></div>')+panel('Nội dung cuộc họp','','','<pre class="report">'+label(reportText(item))+'</pre>');
      window.scrollTo(0,0);
      break;
    }
    case 'export': {
      const item = findReport(id);
      const url = URL.createObjectURL(new Blob(['\ufeff',reportText(item)],{type:'text/plain;charset=utf-8'}));
      const link = document.createElement('a');
      link.href = url;
      link.download = (item.comparison?'CARDIY-Hop-chung-':'CARDIY-Hop-nhanh-')+(item.period||'week')+'-'+item.date+'.txt';
      link.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      break;
    }
    default: break;
  }
});
render();
