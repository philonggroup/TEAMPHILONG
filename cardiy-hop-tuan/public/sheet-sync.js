'use strict';

{
  const dialog=document.querySelector('#sheet-dialog');
  const open=document.querySelector('#open-sheet');
  const buttonLabel=document.querySelector('#sheet-button-label');
  const connect=document.querySelector('#load-sheet');
  const publish=document.querySelector('#save-sheet');
  const leave=document.querySelector('#leave-sheet');
  const signIn=document.querySelector('#sheet-sign-in');
  const status=document.querySelector('#sheet-status');
  const footer=document.querySelector('#storage');
  const localLabel=footer.textContent;
  const periodsToSync=['week','month','quarter','year'];
  const zone='Asia/Ho_Chi_Minh';
  let localState=null;
  let baseline='';
  let version='root';
  let savedAt=null;
  let pending=null;
  let busy=false;
  let conflict=false;

  function snapshot() {
    return Object.fromEntries(periodsToSync.map(kind=>{
      const group=kind==='week'?state:state.periods[kind];
      return [kind,{branches:group.branches,joint:group.joint}];
    }));
  }
  const payload=()=>JSON.stringify(snapshot());
  const dirty=()=>localState!==null && baseline!==payload();
  function tell(text,error=false) {
    status.textContent=text;
    status.classList.toggle('sheet-error',error);
  }
  function updateControls() {
    const online=localState!==null;
    const changed=dirty();
    connect.disabled=busy;
    publish.hidden=!online;
    publish.disabled=busy||(!changed&&!pending)||conflict;
    leave.hidden=!online;
    leave.disabled=busy;
    connect.textContent=online?'Tải phiên bản từ Sheet':'Mở dữ liệu Google Sheets';
    buttonLabel.textContent=online?(changed?'Google Sheets · Chưa lưu':'Google Sheets · Đã kết nối'):'Google Sheets';
    footer.textContent=online?(changed?'Nguồn chuẩn Google Sheets · Bản soạn chưa lưu':'Nguồn chuẩn Google Sheets · Phiên bản đã tải'):localLabel;
  }
  function explainSuccess() {
    const time=savedAt ? new Intl.DateTimeFormat('vi-VN',{timeZone:zone,dateStyle:'short',timeStyle:'short'}).format(new Date(savedAt)) : '';
    tell(time?'Phiên bản đang mở đã được lưu lên Sheet lúc '+time+'.':'Sheet đang trống. Nhập số liệu thật hoặc dùng Nhập / Xuất Excel để bắt đầu.');
  }
  async function remote(body) {
    const options={cache:'no-store',credentials:'same-origin'};
    if (body) Object.assign(options,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const response=await fetch('/api/cardiy-sheet',options);
    const result=await response.json().catch(()=>({message:'Trang chưa nhận được phản hồi từ nguồn dữ liệu.'}));
    if (!response.ok) throw Object.assign(new Error(result.message),{kind:result.kind,status:response.status});
    return result;
  }
  function fault(error) {
    signIn.hidden=!['signin','connect'].includes(error.kind);
    signIn.textContent=error.kind==='connect'?'Đăng nhập / Kết nối Google Drive':'Đăng nhập ChatGPT';
    if (error.kind==='conflict') conflict=true;
    tell(error.message||'Không kết nối được Google Sheets. Bản soạn vẫn ở trên màn hình.',true);
  }
  function useSnapshot(source) {
    const settings={branch:state.branch,period:state.period,weeklyPreset:state.weeklyPreset};
    const groups=source??Object.fromEntries(periodsToSync.map(kind=>[kind,{
      branches:branchNames.map(blankMeetingData),joint:blankMeetingData(),
    }]));
    if (!localState) localState=state;
    state={...settings,...groups.week,periods:{month:groups.month,quarter:groups.quarter,year:groups.year}};
    baseline=payload();
    pending=null;
    conflict=false;
    branchSelect.selectedIndex=state.branch;
    changeView('overview');
  }

  window.cardiyUsesSheets=()=>localState!==null;
  window.persistCardiyCloudDraft=()=>{
    if (!localState) return false;
    updateControls();
    return true;
  };
  window.addEventListener('beforeunload',event=>{
    if (dirty()) { event.preventDefault(); event.returnValue=''; }
  });
  open.addEventListener('click',()=>{
    dialog.showModal();
    if (localState && !dirty()) explainSuccess();
    updateControls();
  });
  document.querySelector('#close-sheet').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>open.focus());
  connect.addEventListener('click',async()=>{
    if (dirty() && !window.confirm('Tải phiên bản mới từ Sheet và bỏ bản soạn chưa lưu đang mở?')) return;
    busy=true;
    updateControls();
    signIn.hidden=true;
    tell('Đang đọc Google Sheets…');
    try {
      const result=await remote();
      version=result.version;
      savedAt=result.savedAt;
      useSnapshot(result.data);
      explainSuccess();
    } catch(error) { fault(error); }
    finally { busy=false; updateControls(); }
  });
  publish.addEventListener('click',async()=>{
    const content=payload();
    if (!pending || pending.payload!==content) pending={id:crypto.randomUUID(),base:version,payload:content};
    const attempt=pending;
    busy=true;
    updateControls();
    signIn.hidden=true;
    tell('Đang lưu phiên bản lên Google Sheets…');
    try {
      const result=await remote({id:attempt.id,base:attempt.base,data:JSON.parse(attempt.payload)});
      version=result.version;
      savedAt=result.savedAt;
      baseline=attempt.payload;
      pending=null;
      explainSuccess();
    } catch(error) { fault(error); }
    finally { busy=false; updateControls(); }
  });
  leave.addEventListener('click',()=>{
    if (dirty() && !window.confirm('Quay về dữ liệu trên máy và bỏ bản soạn Google Sheets chưa lưu?')) return;
    state=localState;
    localState=null;
    baseline='';
    pending=null;
    savedAt=null;
    conflict=false;
    branchSelect.selectedIndex=state.branch;
    tell('');
    signIn.hidden=true;
    updateControls();
    changeView('overview');
    dialog.close();
  });
  if (new URLSearchParams(window.location.search).get('sheet')==='1') {
    const url=new URL(window.location.href);
    url.searchParams.delete('sheet');
    window.history.replaceState(null,'',url);
    dialog.showModal();
  }
}
