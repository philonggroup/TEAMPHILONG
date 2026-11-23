'use strict';

{
  const dialog=document.querySelector('#cn1-meeting');
  const status=document.querySelector('#cn1-status');
  const signIn=document.querySelector('#cn1-signin');
  const content=document.querySelector('#cn1-content');
  const refresh=document.querySelector('#cn1-refresh');
  const periodSelect=document.querySelector('#cn1-period');
  const start=document.querySelector('#cn1-start');
  const connect=document.querySelector('#cn1-sheet');
  const source='https://docs.google.com/spreadsheets/d/1Y5G05cBs7kWehsLzqJf5xttSv3hw3kICDoaLc4kFxcU/edit#gid=';
  const sourceLink=(id,title)=>'<a class="cn1-source" href="'+source+id+'" target="_blank" rel="noopener noreferrer">'+title+'</a>';
  const format=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2});
  const number=(value,unit)=>value===null?'Chưa có số':format.format(unit==='%'?value*100:value)+(unit==='%'?'%':' '+unit);
  const shortDate=day=>day+'/11/2026';
  let report=null;
  let drafts=[];
  let loading=false;

  function draftButton(kind,title,detail='',owner='',date='') {
    const index=drafts.push({kind,title,detail,owner,date})-1;
    return '<button class="button secondary" type="button" data-cn1-draft="'+index+'">'+(kind==='issues'?'Đưa vào IDS':'Soạn hành động')+'</button>';
  }
  function section(title,links,body) {
    return '<section class="cn1-section"><header><h3>'+title+'</h3>'+links+'</header>'+body+'</section>';
  }
  function render() {
    if (!report) return;
    const index=periodSelect.selectedIndex;
    const period=report.periods[index];
    drafts=[];
    const revenue=report.metrics[0].totals[0].actual;
    const dated=report.latest?dateText(report.latest):'chưa có';
    status.textContent='Ngày cuối có doanh thu '+dated+' · '+period.days+' / '+(period.end-period.start+1)+' ngày có số trong kỳ xem.';
    const summary='<div class="cn1-summary"><article><small>Doanh thu tháng đã ghi</small><strong>'+number(revenue,'đ')+'</strong></article>'+
      '<article><small>Mục tiêu tháng · Chỉ tiêu 6T</small><strong>'+number(report.monthlyTarget,'đ')+'</strong></article>'+
      '<article><small>Cần đạt mỗi ngày còn lại</small><strong>'+number(report.neededDaily,'đ')+'</strong></article></div>';
    const audit=report.audits.map(item=>'<article class="cn1-card cn1-warning"><h4>'+label(item.title)+'</h4><p>'+
      label(item.detail)+'</p>'+draftButton('issues',item.title,item.detail)+'</article>').join('');
    const metrics=report.metrics.map(metric=>{
      const {actual,target,recorded}=metric.totals[index];
      const known=period.days>0 && actual!==null && (recorded || actual!==0);
      const hit=known && target>0 ? actual/target:null;
      const check=known && metric.ref===14 && actual>1;
      const incomplete=index>0 && period.days<period.end-period.start+1;
      const badge=check?pill('Cần đối chiếu','warn'):hit===null?pill('Chưa đủ số','neutral'):
        pill(format.format(hit*100)+'% '+(incomplete?'tiến độ':'chỉ tiêu'),hit>=1?'good':incomplete?'neutral':'warn');
      const detail=label(period.label)+' · '+number(known?actual:null,metric.unit)+' / '+number(target,metric.unit);
      return '<article class="cn1-card"><h4>'+label(metric.title)+'</h4><p>'+detail+' '+badge+'</p>'+
        (metric.owner?'<small>Phụ trách '+label(metric.owner)+'</small>':'')+
        (metric.way.length?'<small>Liên quan '+metric.way.map(way=>'Way '+way).join(' · ')+'</small>':'')+
        (hit!==null && hit<1 && !incomplete ?draftButton('issues','Rà soát '+metric.title,period.label+' · '+number(actual,metric.unit)+' / '+number(target,metric.unit)):'')+'</article>';
    });
    const strategies=report.strategies.map(item=>'<details class="cn1-card"><summary>'+label(item.title)+'</summary>'+
      '<p>Mục tiêu Q4 '+number(item.target,item.unit)+'</p><p>'+label(item.strategy)+'</p></details>');
    const milestones=report.goals.flatMap(goal=>goal.milestones.filter(item=>item.day>=period.start && item.day<=period.end)
      .map(item=>({...item,goal:goal.title,owner:item.owner||goal.owner}))).sort((a,b)=>a.day-b.day);
    const plan=milestones.map(item=>'<article class="cn1-card"><small>'+shortDate(item.day)+' · '+label(item.goal)+'</small>'+
      '<h4>'+label(item.action)+'</h4><p>'+label(item.owner)+'</p>'+
      draftButton('tasks',item.action,'',item.owner,'2026-11-'+String(item.day).padStart(2,'0'))+'</article>');
    const work=report.work.map(item=>'<article class="cn1-card"><small>'+label([item.id,item.way?'Way '+item.way:''].filter(Boolean).join(' · '))+'</small>'+
      '<h4>'+label(item.title)+'</h4><p>'+label([item.owner,item.deadline,item.status].filter(Boolean).join(' · '))+'</p>'+
      item.issues.map(issue=>'<p class="cn1-warning-text">'+label(issue)+'</p>').join('')+'</article>');
    content.innerHTML=summary+section('1. Kiểm tra số trước khi họp',sourceLink(1942300199,'Báo cáo T11')+' '+sourceLink(1559645668,'Chỉ tiêu 6T'),
      audit||'<p>Chưa thấy chênh lệch trong các mục đối soát tự động.</p>')+
      section('2. Rà soát chỉ số dẫn dắt','', '<div class="cn1-grid">'+metrics.join('')+'</div>')+
      section('3. Đối chiếu chiến lược và mốc 90 ngày',sourceLink(1930301742,'Kế hoạch 6 Ways')+' '+sourceLink(1837646069,'Kế hoạch 90 ngày'),
        '<div class="cn1-grid">'+strategies.join('')+'</div><h4>Mốc theo kỳ xem</h4>'+(plan.join('')||'<p>Chưa có mốc trong khoảng ngày này.</p>'))+
      section('4. Rà soát việc CN1 đã giao','<a class="cn1-source" href="https://docs.google.com/spreadsheets/d/1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI/edit#gid=157455132" target="_blank" rel="noopener noreferrer">Công việc</a>',
        '<div><button class="button secondary" type="button" data-task-preview="CN1">Cập nhật công việc trên Sheet</button></div>'+
        (work.join('')||'<p>Chưa có việc CN1.</p>'));
  }
  async function load() {
    if (loading) return;
    loading=true;
    refresh.disabled=true;
    start.hidden=true;
    connect.hidden=true;
    signIn.hidden=true;
    report=null;
    content.replaceChildren();
    document.querySelector('#cn1-period-control').hidden=true;
    status.textContent='Đang đọc các tab CN1…';
    try {
      if (!window.CARDIY_LEGACY_API) throw new Error("Bảng này chạy trên worker cũ, GitHub Pages không chạy worker. Số liệu đã chuyển sang nguồn chuẩn live: bấm nút \"Nguồn chuẩn\" trên thanh trên, rồi chọn \"Đọc số liệu live từ nguồn\".");
      const response=await fetch('/api/cardiy-cn1-meeting',{cache:'no-store',credentials:'same-origin'});
      const result=await response.json();
      if(!response.ok) {
        signIn.hidden=!['signin','connect'].includes(result.kind);
        signIn.textContent=result.kind==='connect'?'Kết nối Google Drive':'Đăng nhập ChatGPT';
        status.textContent=result.message;
        return;
      }
      report=result;
      periodSelect.innerHTML=report.periods.map(period=>'<option>'+label(period.label)+'</option>').join('');
      document.querySelector('#cn1-period-control').hidden=false;
      connect.hidden=window.cardiyUsesSheets?.()===true;
      start.hidden=false;
      render();
    } catch {
      status.textContent='Không tải được bảng họp CN1. Kiểm tra kết nối rồi thử lại.';
    } finally {
      loading=false;
      refresh.disabled=false;
    }
  }
  function goToMeeting(view) {
    state.period=periodSelect.selectedIndex===0?'month':'week';
    switchBranch(branchNames.findIndex(name=>name.indexOf('CN1')>-1),view);
  }
  function open() {
    if (!dialog.open) dialog.showModal();
    load();
  }
  document.addEventListener('click',event=>{
    if(event.target.closest('[data-cn1-meeting]')) open();
  });
  content.addEventListener('click',event=>{
    const button=event.target.closest('[data-cn1-draft]');
    if(!button) return;
    if(window.cardiyUsesSheets?.()!==true) {
      status.textContent='Mở dữ liệu Google Sheets trước khi soạn IDS hoặc hành động.';
      connect.hidden=false;
      connect.focus();
      return;
    }
    const {kind,title,detail,owner,date}=drafts[Number(button.dataset.cn1Draft)];
    const entryTitle=('CN1 T11 · '+title).slice(0,180);
    dialog.close();
    goToMeeting(kind);
    const existing=data()[kind].find(item=>item.title===entryTitle && (kind!=='tasks'||item.date===date));
    openEditor(kind,existing?.id??null,kind==='issues'?{title:entryTitle,discussion:detail}:{title:entryTitle,owner:owner.slice(0,180),date});
  });
  connect.addEventListener('click',()=>{
    dialog.close();
    document.querySelector('#open-sheet').click();
  });
  start.addEventListener('click',()=>{
    if(window.cardiyUsesSheets?.()!==true) {
      status.textContent='Mở dữ liệu Google Sheets trước khi vào buổi họp để biên bản lưu đúng nguồn.';
      connect.hidden=false;
      connect.focus();
      return;
    }
    dialog.close();
    goToMeeting('meeting');
  });
  refresh.addEventListener('click',load);
  periodSelect.addEventListener('change',render);
  if(new URLSearchParams(location.search).get('cn1')==='1') open();
}
