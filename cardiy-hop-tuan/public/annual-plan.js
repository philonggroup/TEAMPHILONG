'use strict';

const annualDrafts = new WeakMap();
const annualPeriod = {year:0,quarter:0};
const annualMetrics = [['leads','Số khách hàng tiềm năng'],['opportunities','Số khách hàng cơ hội'],['customers','Số khách hàng mới']];

function strategyTabs(selected) {
  return '<nav class="strategy-tabs" aria-label="Hoạch định chiến lược">'+
    [['vision','Tầm nhìn'],['annual','Kế hoạch năm'],['swot','SWOT']].map(([key,title])=>
      '<button type="button" class="button '+(selected===key?'primary':'secondary')+'" data-view="'+key+'"'+
        (selected===key?' aria-current="page"':'')+'>'+title+'</button>').join('')+'</nav>';
}
function annualPlanPage() {
  const [currentYear,month] = today().split('-').map(Number);
  annualPeriod.year ||= currentYear;
  annualPeriod.quarter ||= Math.ceil(month/3);
  const {year,quarter} = annualPeriod;
  const saved = state.joint.annualPlans ?? {};
  const drafts = annualDrafts.get(state.joint) ?? {};
  const options = (values,selected,display) => values.map(value=>'<option value="'+value+'"'+
      (value===selected?' selected':'')+'>'+display(value)+'</option>').join('');
  const years = Array.from({length:101},(_,i)=>2000+i);
  const selector = '<div class="annual-period"><label>Năm<select id="annual-year">'+options(years,year,String)+
    '</select></label><label>Quý<select id="annual-quarter">'+options([1,2,3,4],quarter,value=>'Q'+value)+
    '</select></label></div>';
  const card = (title,date,body) => '<section class="panel annual-card"><header><h2>'+title+'</h2><small>'+date+
    '</small></header><div class="annual-body">'+body+'</div></section>';
  const fields = (key,goalTitle) => {
    const value = name => label((drafts[key] ?? saved[key])?.[name] ?? '');
    const metric = (name,title,negative=false) => '<div class="annual-line">'+
      '<input type="text" aria-label="Tên '+title+'" data-plan-field name="'+key+':'+name+'Name" value="'+value(name+'Name')+
      '" placeholder="'+title+'" maxlength="180">'+
      '<input type="number" aria-label="Mục tiêu '+title+' (đồng)" data-plan-field name="'+key+':'+name+'Value" value="'+value(name+'Value')+
      '" inputmode="numeric" step="1" min="'+(negative?'-999999999999999':'0')+'" max="999999999999999" placeholder="₫"></div>';
    const total = (name,title) => '<div class="annual-total"><span>'+title+'</span><output data-plan-total="'+key+':'+name+'">—</output></div>';
    const counts = annualMetrics.map(([name,title])=>'<label class="annual-line"><span>'+title+'</span>'+
      '<input type="number" data-plan-field name="'+key+':'+name+'" value="'+value(name)+
      '" inputmode="numeric" step="1" min="0" max="999999999"></label>').join('');
    return '<div class="annual-block"><h3>Doanh thu</h3>'+
      [1,2,3].map(i=>metric('revenue'+i,'chỉ số doanh thu '+i)).join('')+total('revenue','Tổng doanh thu')+'</div>'+
      '<div class="annual-block"><h3>Lợi nhuận</h3>'+metric('profit','chỉ số lợi nhuận',true)+total('profit','Tổng lợi nhuận')+'</div>'+
      '<div class="annual-block"><h3>Chỉ số đo lường</h3>'+counts+'</div>'+
      '<label class="annual-goal"><strong>'+goalTitle+'</strong><textarea data-plan-field name="'+key+':goals" rows="4" maxlength="2000">'+
      value('goals')+'</textarea></label>';
  };
  const quarterKey = year+'-Q'+quarter;
  const issueKey = year+'-issues';
  const longIssues = label((drafts[issueKey] ?? saved[issueKey])?.items ?? '');
  return strategyTabs('annual')+pageTitle('Kế hoạch năm','Phi Long Group','<div class="annual-tools">'+selector+strategyExcelControls('annual')+'</div>')+
    '<form id="annual-form"><div class="annual-board">'+card('Mục tiêu năm '+year,String(year),fields(String(year),'Mục tiêu năm'))+
    card('Kế hoạch 90 ngày','Q'+quarter+' '+year,fields(quarterKey,'Mục tiêu quý'))+
    card('Vấn đề dài hạn',String(year),'<label class="annual-goal"><span>Mỗi dòng một vấn đề</span>'+
      '<textarea data-plan-field name="'+issueKey+':items" rows="4" maxlength="2000">'+longIssues+'</textarea></label>')+
    '</div><div class="annual-footer"><button class="button primary" type="submit">Lưu kế hoạch</button><p id="annual-status" role="status"></p></div></form>';
}
function annualValues(form) {
  const groups = {};
  for (const [key,value] of new FormData(form)) {
    const [group,field] = key.split(':');
    (groups[group] ??= {})[field] = value;
  }
  return groups;
}
function updateAnnualTotals(form) {
  for (const total of form.querySelectorAll('[data-plan-total]')) {
    const [key,metric] = total.dataset.planTotal.split(':');
    const names = metric==='revenue' ? ['revenue1Value','revenue2Value','revenue3Value'] : ['profitValue'];
    const values = names.map(name=>form.elements.namedItem(key+':'+name).value).filter(value=>value!=='').map(Number);
    total.textContent = values.length ? visionMoneyFormat.format(values.reduce((sum,value)=>sum+value,0))+' ₫' : '—';
  }
}
document.addEventListener('change',event=>{
  const selector = event.target;
  if (selector.id!=='annual-year' && selector.id!=='annual-quarter') return;
  annualPeriod[selector.id==='annual-year'?'year':'quarter'] = Number(selector.value);
  render();
  document.getElementById(selector.id)?.focus();
});
document.addEventListener('input',event=>{
  if (!event.target.hasAttribute('data-plan-field')) return;
  const form = event.target.form;
  annualDrafts.set(state.joint,{...annualDrafts.get(state.joint),...annualValues(form)});
  updateAnnualTotals(form);
  form.querySelector('#annual-status').textContent='';
});
document.addEventListener('submit',event=>{
  const form = event.target;
  if (form.id!=='annual-form') return;
  event.preventDefault();
  const groups = annualValues(form);
  const previous = state.joint.annualPlans;
  const next = {...previous};
  for (const [key,fields] of Object.entries(groups)) {
    const values = Object.entries(fields).map(([field,value])=>[field,value.trim()]).filter(([,value])=>value!=='');
    if (values.length) next[key]=Object.fromEntries(values);
    else delete next[key];
  }
  if (Object.keys(next).length) state.joint.annualPlans=next;
  else delete state.joint.annualPlans;
  const status=form.querySelector('#annual-status');
  if (!save()) {
    state.joint.annualPlans=previous;
    status.textContent='Chưa lưu được kế hoạch. Nội dung vẫn còn trên màn hình.';
    return;
  }
  const drafts=annualDrafts.get(state.joint) ?? {};
  for (const key of Object.keys(groups)) delete drafts[key];
  status.textContent=window.cardiyUsesSheets?.()
    ? 'Đã lưu bản soạn. Chọn Google Sheets → Lưu lên Google Sheets để chia sẻ.'
    : 'Đã lưu kế hoạch trên trình duyệt này.';
});
