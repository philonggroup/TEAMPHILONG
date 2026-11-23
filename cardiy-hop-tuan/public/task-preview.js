'use strict';

{
  const sheetUrl='https://docs.google.com/spreadsheets/d/1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI/edit?gid=157455132#gid=157455132';
  const path=new URL(sheetUrl).pathname.replace(/\/edit$/, '');
  const endpoint='/api/cardiy-task-preview';
  const dialog=document.querySelector('#task-preview');
  const input=document.querySelector('#task-preview-link');
  const load=document.querySelector('#task-preview-load');
  const signIn=document.querySelector('#task-preview-sign-in');
  const status=document.querySelector('#task-preview-status');
  const filter=document.querySelector('#task-preview-filter');
  const branch=document.querySelector('#task-preview-branch');
  const items=document.querySelector('#task-preview-items');
  const editor=document.querySelector('#task-sync-editor');
  const editorStatus=document.querySelector('#task-sync-status');
  const submit=editor.querySelector('[type="submit"]');
  const cancel=document.querySelector('#task-sync-cancel');
  const add=document.querySelector('#task-sync-new');
  const ownerField=document.querySelector('#task-sync-owner');
  const ownerSelect=editor.elements.ownerKey;
  const stateField=document.querySelector('#task-sync-state');
  const refreshMs=20000;
  let tasks=[];
  let owners=[];
  let connected=false;
  let editing=null;
  let busy=false;
  input.value=sheetUrl;

  function validLink(value) {
    try {
      const url=new URL(value.trim());
      const validGid=gid=>gid===null||gid==='157455132';
      return url.origin==='https://docs.google.com' && !url.username && !url.password &&
        [path,path+'/edit',path+'/'].includes(url.pathname) &&
        validGid(url.searchParams.get('gid')) && validGid(new URLSearchParams(url.hash.slice(1)).get('gid'));
    } catch { return false; }
  }
  function dateInput(value) {
    const match=value.match(/^(\d{2})\/(\d{2})\/(\d{4}) ([0-2]\d):([0-5]\d):([0-5]\d)$/);
    return match?match[3]+'-'+match[2]+'-'+match[1]+'T'+match[4]+':'+match[5]+':'+match[6]:'';
  }
  function availableOwners() {
    return owners.filter(owner=>!branch.value||owner.branch===branch.value);
  }
  function showTasks(prefix='') {
    add.hidden=!connected||availableOwners().length===0;
    add.disabled=busy||editing!==null;
    const visible=tasks.filter(task=>!branch.value || task.branch===branch.value);
    const frequencies=new Map();
    for (const task of tasks) frequencies.set(task.id,(frequencies.get(task.id)??0)+1);
    const flagged=visible.filter(task=>task.issues.length).length;
    status.textContent=prefix+visible.length+' công việc · '+flagged+' dòng cần đối chiếu.';
    items.innerHTML=visible.map(task=>'<article class="task-preview-card">'+
      '<p>'+label([task.id,'Dòng '+task.row,task.branch].filter(Boolean).join(' · '))+'</p>'+
      '<h3>'+label(task.title||'Chưa có tên công việc')+'</h3>'+
      '<p>'+label([task.owner,task.ownerCode,task.status].filter(Boolean).join(' · '))+'</p>'+
      '<p>Hạn hoàn thành · '+label(task.deadline||'Chưa có')+'</p>'+
      (task.completedAt?'<p>Ngày hoàn thành · '+label(task.completedAt)+'</p>':'')+
      task.issues.map(issue=>'<p class="sheet-error">'+label(issue)+'</p>').join('')+
      (task.id && task.revision && frequencies.get(task.id)===1
        ?'<button class="button secondary" type="button" data-task-row="'+task.row+'">Sửa trên Sheet</button>':'')+'</article>').join('');
  }
  async function remote(options) {
    const response=await fetch(endpoint,{cache:'no-store',credentials:'same-origin',...options});
    const result=await response.json();
    if (!response.ok) throw Object.assign(new Error(result.message),{kind:result.kind});
    return result;
  }
  function auth(error) {
    signIn.hidden=!['connect','signin'].includes(error.kind);
    signIn.textContent=error.kind==='connect'?'Kết nối Google Drive':'Đăng nhập ChatGPT';
  }
  function exitEditor() {
    editing=null;
    editor.hidden=true;
    items.hidden=false;
    load.disabled=busy;
    input.disabled=busy;
    add.disabled=busy;
  }
  async function loadTasks(quiet=false) {
    if (busy||editing) return;
    if (!validLink(input.value)) {
      if (quiet) return;
      connected=false;
      status.textContent='Dán link của tab CONG_VIEC thuộc Google Sheet chính thức. Link khác sẽ không được dùng để ghi.';
      add.hidden=true;
      filter.hidden=true;
      items.replaceChildren();
      return;
    }
    busy=true;
    if (!quiet) {
      input.disabled=true;
      load.disabled=true;
      add.disabled=true;
      signIn.hidden=true;
      status.textContent='Đang đọc dữ liệu mới nhất từ Google Sheets…';
    }
    try {
      const result=await remote();
      const changed=JSON.stringify([tasks,owners])!==JSON.stringify([result.tasks,result.owners]);
      tasks=result.tasks;
      owners=result.owners;
      const shouldRender=changed||!connected||!quiet;
      connected=true;
      signIn.hidden=true;
      filter.hidden=false;
      if (shouldRender) showTasks(quiet?'Sheet vừa cập nhật. ':'');
    } catch (error) {
      connected=false;
      auth(error);
      add.hidden=true;
      filter.hidden=true;
      items.replaceChildren();
      status.textContent=error.message||'Chưa đọc được dữ liệu từ Google Sheets.';
    } finally {
      busy=false;
      load.disabled=false;
      input.disabled=false;
      add.disabled=false;
    }
  }
  function completionRequired() {
    const done=!editing?.requestId && editor.elements.status.value==='Hoàn thành';
    document.querySelector('#task-sync-completion').hidden=!done;
    editor.elements.completedAt.required=done;
  }
  function showEditor(task) {
    editing=task;
    const creating=Boolean(task.requestId);
    document.querySelector('#task-sync-title').textContent=creating?'Thêm công việc vào Google Sheets':'Sửa '+task.id+' · '+task.branch;
    ownerField.hidden=!creating;
    ownerSelect.disabled=!creating;
    ownerSelect.required=creating;
    stateField.hidden=creating;
    editor.elements.status.disabled=creating;
    if (creating) ownerSelect.innerHTML='<option value="">Chọn người phụ trách</option>'+availableOwners().map(owner=>
      '<option value="'+label(owner.key)+'">'+label(owner.branch+' · '+owner.owner+' · '+owner.ownerCode)+'</option>').join('');
    editor.elements.title.value=task.title??'';
    editor.elements.deadline.value=dateInput(task.deadline??'');
    editor.elements.status.value=task.status??'Chờ thực hiện';
    editor.elements.completedAt.value=dateInput(task.completedAt??'');
    completionRequired();
    editorStatus.textContent='';
    submit.textContent=creating?'Lưu công việc mới vào Sheet':'Cập nhật vào Sheet';
    submit.disabled=false;
    load.disabled=true;
    input.disabled=true;
    add.disabled=true;
    items.hidden=true;
    editor.hidden=false;
    editor.elements.title.focus();
  }
  items.addEventListener('click',event=>{
    const button=event.target.closest('[data-task-row]');
    if (!button||busy||!connected) return;
    const task=tasks.find(task=>task.row===Number(button.dataset.taskRow));
    if (task) showEditor(task);
  });
  add.addEventListener('click',()=>{
    if (!busy && connected && !editing) showEditor({requestId:crypto.randomUUID()});
  });
  editor.elements.status.addEventListener('change',completionRequired);
  cancel.addEventListener('click',exitEditor);
  editor.addEventListener('submit',async event=>{
    event.preventDefault();
    if (!editing||busy) return;
    const values=Object.fromEntries(new FormData(editor));
    if (values.status!=='Hoàn thành') values.completedAt='';
    busy=true;
    cancel.disabled=true;
    submit.disabled=true;
    editorStatus.textContent='Đang lưu và đọc lại dòng nguồn…';
    try {
      const result=await remote({method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(editing.requestId?{...values,operation:'create',requestId:editing.requestId}:
          {...values,id:editing.id,revision:editing.revision})});
      tasks=tasks.some(task=>task.id===result.task.id)
        ?tasks.map(task=>task.id===result.task.id?result.task:task)
        :[...tasks,result.task];
      exitEditor();
      showTasks('Đã lưu và kiểm tra lại trong Sheet. ');
    } catch(error) {
      auth(error);
      editorStatus.textContent=error.message||'Chưa xác nhận được cập nhật trên Sheet.';
      if(error.kind==='conflict') editorStatus.textContent+=' Bấm Hủy sửa rồi tải lại số liệu.';
    } finally {
      busy=false;
      cancel.disabled=false;
      submit.disabled=false;
      if (!editing) {
        load.disabled=false;
        input.disabled=false;
        add.disabled=false;
      }
    }
  });
  function open() {
    if (!dialog.open) dialog.showModal();
    if(!editing) loadTasks();
  }
  document.addEventListener('click',event=>{
    const entry=event.target.closest('[data-task-preview]');
    if (!entry) return;
    branch.value=entry.dataset.taskPreview||'';
    openWithRefresh();
  });
  branch.addEventListener('change',()=>{ if (!editing && !busy) showTasks(); });
  load.addEventListener('click',()=>loadTasks());
  function refreshIfVisible() {
    if (dialog.open && connected && !document.hidden && !items.contains(document.activeElement)) loadTasks(true);
  }
  const autoRefresh=()=>window.setInterval(refreshIfVisible,refreshMs);
  let refreshTimer=null;
  dialog.addEventListener('close',()=>{
    window.clearInterval(refreshTimer);
    refreshTimer=null;
    if (!busy) exitEditor();
  });
  const openWithRefresh=()=>{
    open();
    refreshTimer??=autoRefresh();
  };
  document.addEventListener('visibilitychange',refreshIfVisible);
  if (new URLSearchParams(location.search).get('taskPreview')==='1') openWithRefresh();
}
