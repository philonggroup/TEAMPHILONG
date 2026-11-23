const cn1Sources = {
  score: "'CHỈ SỐ DẪN DẮT CN1 -THÁNG 11 '!A1:BG46",
  targets: "'CN1  CHỈ TIÊU 6T'!B3:K22",
  ways: "'CN1 của Kế hoạch 6 Ways'!A5:O18",
  plan: "'CN1 Kế hoạch 90 ngày quý 4 '!D3:U13",
  tasks: taskPreviewRange,
};
const vnDay=serial=>Number.isInteger(serial)
  ? new Date(Date.UTC(1899,11,30)+serial*86400000).toISOString().slice(0,10) : '';
const cellText=value=>String(value??'').trim();
const cellNumber=value=>typeof value==='number' && Number.isFinite(value)?value:null;

function cn1MeetingData(sources) {
  const {score,targets,ways,plan,tasks}=sources;
  if (!cellText(score?.[0]?.[0]).includes('11/2026') || score?.[2]?.[1]!=='CHỈ SỐ' ||
      score[2][20]!=='KPI THÁNG 11' || score[2][22]!=='THỰC ĐẠT THÁNG' ||
      targets?.[1]?.[6]!=='T11' || ways?.[0]?.[0]!=='Chỉ số 6 Ways' ||
      cellText(plan?.[0]?.[1]).replace(/\s/g,'')!=='MỤCTIÊUQUÝ4' || !/^W13\b/.test(plan[0][17]??'')) {
    throw new StorageError(409,'Bố cục hoặc kỳ của một tab CN1 đã thay đổi. Cần đối chiếu nguồn trước khi họp.','structure');
  }
  const periods=[{label:'Lũy kế tháng 11',start:1,end:30},...[1,8,15,22,29].map((start,i)=>({
    label:cellText(score[1][5+i*3]),start,end:Math.min(start+6,30),
  }))].map(period=>({...period,days:score[3].slice(22+period.start,23+period.end).filter(value=>cellNumber(value)!==null).length}));
  const metrics=[
    [4,'đ',[]], [5,'đ',[5]], [6,'đ',[5]], [9,'đ',[5]],
    [11,'đ',[5]], [12,'lượt',[1]], [13,'lượt',[2]], [14,'%', [2]],
    [15,'phiếu',[2,3]], [16,'báo giá',[2,5]], [17,'cuộc',[3]], [18,'lượt',[3,4]],
    [19,'lượt',[5]], [20,'bài',[1]], [21,'lượt',[1,3]], [22,'video',[1]], [23,'lốp',[5]],
  ].map(([ref,unit,way])=>{
    const row=score[ref-1];
    if (!cellText(row?.[1])) throw new StorageError(409,'Thiếu chỉ số CN1 tại dòng '+ref+'.','structure');
    const totals=periods.map(({start,end},i)=>{
      const targetColumn=i===0?20:5+(i-1)*3;
      return {target:cellNumber(row[targetColumn]),actual:cellNumber(row[targetColumn+(i===0?2:1)]),
        recorded:row.slice(22+start,23+end).some(value=>cellNumber(value)!==null)};
    });
    return {ref,title:cellText(row[1]),owner:cellText(row[58]),unit,way,totals};
  });
  const monthlyTarget=cellNumber(targets[2]?.[6]);
  const latestDay=score[3].slice(23,53).findLastIndex(value=>cellNumber(value)!==null);
  const strategies=ways.slice(1).flatMap(row=>{
    const match=cellText(row[0]).match(/^Way\s+([1-6])\./i);
    return match?[{way:Number(match[1]), title:row[0],unit:cellText(row[1]),target:cellNumber(row[5]),strategy:cellText(row[8])}]:[];
  });
  if(strategies.length!==6) throw new StorageError(409,'Bảng 6 Ways chưa đủ sáu chỉ số.','structure');
  const goals=plan.slice(2).flatMap(row=>{
    const title=cellText(row[0]);
    if (!title) return [];
    const milestones=row.slice(5).flatMap(value=>cellText(value)
      .split(/\n(?=\d{2}\/\d{2}\/2026)/)
      .flatMap(entry=>{
        const match=entry.match(/^(\d{2})\/11\/2026\s*[·–-]?\s*([\s\S]+)/);
        if(!match || +match[1]<1 || +match[1]>30) return [];
        const [action,owner='']=match[2].split('👤');
        return [{day:Number(match[1]),action:action.trim(),owner:owner.trim()}];
      }));
    return [{title,target:cellText(row[1]),owner:cellText(row[4]),milestones}];
  });
  const work=taskPreviewRows(tasks).filter(task=>task.branch==='CN1').map(task=>{
    const source=tasks[task.row-1];
    return {...task,way:Number(cellText(source[1]).match(/^Way\s+([1-6])\./i)?.[1]??0)};
  });
  const revenueGap=cellNumber(score[9]?.[22]);
  const audits=[];
  if(revenueGap===null || revenueGap!==0) audits.push({title:'Đối soát chênh lệch cơ cấu doanh thu tháng 11',
    detail:revenueGap===null?'Chưa có số đối soát tại ô W10.':'Doanh thu lốp + dịch vụ + NTP trừ tổng doanh thu = '+revenueGap.toLocaleString('vi-VN')+' đ (ô W10).'});
  const turnover=metrics.find(metric=>metric.ref===14).totals[0].actual;
  if(turnover>1) audits.push({title:'Kiểm tra tỷ lệ hoàn tất vượt 100%',
    detail:'Sheet ghi '+(turnover*100).toLocaleString('vi-VN')+'%. Cần kiểm tra lượt vào và hoàn tất có cùng tập xe hay có xe chuyển kỳ.'});
  if(monthlyTarget===null || monthlyTarget!==metrics[0].totals[0].target) {
    audits.push({title:'Đối chiếu mục tiêu doanh thu tháng',detail:'Kiểm tra mức doanh thu tháng giữa báo cáo và nguồn Chỉ tiêu 6T.'});
  }
  return {periods,latest:latestDay<0?'':vnDay(score[2][23+latestDay]),monthlyTarget,
    metrics,strategies,goals,work,audits,neededDaily:cellNumber(score[3]?.[56])};
}
async function cn1Meeting(request,ctx) {
  if (request.method!=='GET') return json({message:'Bảng chuẩn bị họp chỉ đọc dữ liệu.'},405);
  if (!request.headers.get('oai-authenticated-user-id')) {
    return json({kind:'signin',message:'Đăng nhập ChatGPT để mở buổi họp CN1 từ Google Sheets.'},401);
  }
  try {
    const binding=ctx?.props?.CONNECTORS;
    if (!binding) throw new StorageError(503,'Kết nối Google Drive của app chưa sẵn sàng.','connect');
    const action=actionFor(await binding.getContext?.(),'get_spreadsheet_range',['spreadsheet_id','sheet_name','range']);
    const entries=await Promise.all(Object.entries(cn1Sources).map(async ([key,range])=>{
      const result=await call(binding,action,{spreadsheet_id:key==='tasks'?sheetConfig.id:sheetConfig.referenceId,sheet_name:null,range,
        value_render_option:key==='tasks'?'FORMATTED_VALUE':'UNFORMATTED_VALUE'});
      return [key,result.values];
    }));
    return json(cn1MeetingData(Object.fromEntries(entries)));
  } catch(error) {
    if (error instanceof StorageError) return json({kind:error.kind,message:error.message},error.status);
    return json({kind:'error',message:'Chưa đọc được đầy đủ các tab CN1. Vui lòng thử lại trước khi họp.'},502);
  }
}
