'use strict';
/* ===================================================================
   LỚP DỮ LIỆU 2 CHIỀU

   NHẬP VÀO : đọc live từ 3 workbook hệ thống chuẩn CN1 / CN2 / CN3
              (chỉ số tuần · tháng · quý · 6 tháng, mục tiêu 90 ngày,
               mục tiêu 6 Ways) + bảng CONG_VIEC của PHI LONG_GROUP.
   XUẤT RA  : ghi kết quả họp xuống Sheet "CARDIY Họp nhanh —
              Nguồn dữ liệu chuẩn" (CARDIY_DATA, HOP_BIEN_BAN,
              HOP_CAM_KET, HOP_VAN_DE, HOP_CHAM_DIEM).

   Cầu nối là Apps Script Web App — xem CARDIY_HOP_NHANH.gs.
   Bản cũ gọi /api/cardiy-sheet do worker/ phục vụ; GitHub Pages không
   chạy worker nên đường đó đã chết, thay hẳn bằng cầu nối này.
   =================================================================== */

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
  const cfg=window.CARDIY_NGUON||{};
  let localState=null;
  let baseline='';
  let version='root';
  let savedAt=null;
  let pending=null;
  let busy=false;
  let conflict=false;
  let warnings=[];

  if (signIn) signIn.hidden=true;   /* không còn đăng nhập ChatGPT */

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
    connect.disabled=busy||!cfg.API;
    publish.hidden=!online;
    publish.disabled=busy||(!changed&&!pending)||conflict||!cfg.API;
    leave.hidden=!online;
    leave.disabled=busy;
    connect.textContent=online?'Tải số liệu mới từ nguồn':'Đọc số liệu live từ nguồn';
    buttonLabel.textContent=online?(changed?'Nguồn chuẩn · Chưa lưu':'Nguồn chuẩn · Đã kết nối'):'Nguồn chuẩn';
    footer.textContent=online?(changed?'Nguồn chuẩn live · Bản soạn chưa lưu':'Nguồn chuẩn live · Số liệu vừa đọc'):localLabel;
  }
  function explainSuccess() {
    const time=savedAt
      ? new Intl.DateTimeFormat('vi-VN',{timeZone:zone,dateStyle:'short',timeStyle:'short'}).format(new Date(savedAt))
      : '';
    const canhBao=warnings.length?' · ⚠ '+warnings.length+' cảnh báo nguồn: '+warnings.join(' | '):'';
    tell((time
      ? 'Chỉ số đọc live từ 3 workbook chuẩn. Kết quả họp đã lưu lúc '+time+'.'
      : 'Chỉ số đọc live từ 3 workbook chuẩn. Chưa có kết quả họp nào được lưu.')+canhBao,
      warnings.length>0);
  }

  function diaChi(viec) {
    const url=new URL(cfg.API);
    url.searchParams.set('khoa',cfg.KHOA||'');
    url.searchParams.set('viec',viec);
    return url.toString();
  }
  async function doc() {
    const response=await fetch(diaChi('nguon'),{cache:'no-store',redirect:'follow'});
    const result=await response.json().catch(()=>({ok:false,loi:'Cầu nối không trả về JSON.'}));
    if (!response.ok||!result.ok) throw Object.assign(new Error(result.loi||'Không đọc được nguồn.'),{kind:result.kind});
    return result;
  }
  async function ghi(body) {
    /* text/plain để trình duyệt không bật preflight CORS — Apps Script
       không trả lời OPTIONS. Nội dung gửi đi vẫn là JSON. */
    const response=await fetch(cfg.API,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      redirect:'follow',
      body:JSON.stringify({khoa:cfg.KHOA,...body}),
    });
    const result=await response.json().catch(()=>({ok:false,loi:'Cầu nối không trả về JSON.'}));
    if (!response.ok||!result.ok) throw Object.assign(new Error(result.loi||'Không lưu được.'),{kind:result.kind});
    return result;
  }
  function fault(error) {
    if (error.kind==='conflict') conflict=true;
    tell(error.message||'Không kết nối được nguồn chuẩn. Bản soạn vẫn ở trên màn hình.',true);
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
    if (!cfg.API) tell('Chưa cấu hình cầu nối. Dán URL .../exec của Apps Script vào public/nguon.js.',true);
    else if (localState && !dirty()) explainSuccess();
    updateControls();
  });
  document.querySelector('#close-sheet').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>open.focus());

  connect.addEventListener('click',async()=>{
    if (dirty() && !window.confirm('Đọc lại số liệu live và bỏ bản soạn chưa lưu đang mở?')) return;
    busy=true;
    updateControls();
    tell('Đang đọc live từ 3 workbook hệ thống chuẩn…');
    try {
      const result=await doc();
      version=result.version;
      savedAt=result.savedAt;
      warnings=(result.meta&&result.meta.canhBao)||[];
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
    tell('Đang ghi kết quả họp xuống Sheet nguồn chuẩn…');
    try {
      const result=await ghi({id:attempt.id,base:attempt.base,data:JSON.parse(attempt.payload)});
      version=result.version;
      savedAt=result.savedAt;
      baseline=attempt.payload;
      pending=null;
      explainSuccess();
    } catch(error) { fault(error); }
    finally { busy=false; updateControls(); }
  });

  leave.addEventListener('click',()=>{
    if (dirty() && !window.confirm('Quay về dữ liệu trên máy và bỏ bản soạn chưa lưu?')) return;
    state=localState;
    localState=null;
    baseline='';
    pending=null;
    savedAt=null;
    conflict=false;
    warnings=[];
    branchSelect.selectedIndex=state.branch;
    tell('');
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
