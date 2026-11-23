'use strict';

const CardiyExcel = (() => {
  const spreadsheet = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const officeRel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const packageRel = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const workbookMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.';
  const xml = value => String(value).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\uFFFE\uFFFF]/g,'')
    .replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));

  function writeSheet(rows) {
    const data = rows.map((row,index)=>{
      const cells = row.map((value,i)=>{
        if (value===null || value===undefined || value==='') return '';
        const address = String.fromCharCode(65+i)+(index+1);
        if (typeof value==='number' && Number.isFinite(value)) return '<c r="'+address+'"><v>'+value+'</v></c>';
        return '<c r="'+address+'" t="inlineStr"><is><t xml:space="preserve">'+xml(value)+'</t></is></c>';
      }).join('');
      return '<row r="'+(index+1)+'">'+cells+'</row>';
    }).join('');
    const widths = rows[0].map((name,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+Math.max(16,Math.min(42,name.length+7))+'" customWidth="1"/>').join('');
    return declaration+'<worksheet xmlns="'+spreadsheet+'"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+widths+'</cols><sheetData>'+data+'</sheetData></worksheet>';
  }

  async function write(sheets) {
    const zip = new JSZip();
    const types = [];
    const names = [];
    const relationships = [];
    sheets.forEach(({name,rows},index)=>{
      const id = index+1;
      const path = 'worksheets/sheet'+id+'.xml';
      types.push('<Override PartName="/xl/'+path+'" ContentType="'+workbookMime+'worksheet+xml"/>');
      names.push('<sheet name="'+xml(name)+'" sheetId="'+id+'" r:id="rId'+id+'"/>');
      relationships.push('<Relationship Id="rId'+id+'" Type="'+officeRel+'/worksheet" Target="'+path+'"/>');
      zip.file('xl/'+path,writeSheet(rows));
    });
    zip.file('[Content_Types].xml',declaration+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
      '<Override PartName="/xl/workbook.xml" ContentType="'+workbookMime+'sheet.main+xml"/>'+types.join('')+'</Types>');
    zip.file('_rels/.rels',declaration+'<Relationships xmlns="'+packageRel+'"><Relationship Id="rId1" Type="'+officeRel+'/officeDocument" Target="xl/workbook.xml"/></Relationships>');
    zip.file('xl/workbook.xml',declaration+'<workbook xmlns="'+spreadsheet+'" xmlns:r="'+officeRel+'"><bookViews><workbookView/></bookViews><sheets>'+names.join('')+'</sheets></workbook>');
    zip.file('xl/_rels/workbook.xml.rels',declaration+'<Relationships xmlns="'+packageRel+'">'+relationships.join('')+'</Relationships>');
    return zip.generateAsync({type:'blob',mimeType:mime,compression:'DEFLATE'});
  }

  function elements(node,name) {
    return [...node.getElementsByTagNameNS('*',name)];
  }
  async function parse(zip,path) {
    const part = zip.file(path);
    if (!part || part._data.uncompressedSize > 8*1024*1024) throw new Error('Một trang tính bị thiếu hoặc quá lớn.');
    const source = await part.async('string');
    if (/<!DOCTYPE/i.test(source)) throw new Error('Tệp Excel chứa khai báo XML không được hỗ trợ.');
    const document = new DOMParser().parseFromString(source,'application/xml');
    if (elements(document,'parsererror').length) throw new Error('Tệp Excel có cấu trúc không hợp lệ.');
    return document;
  }
  const cellText = cell => elements(cell,'t').map(node=>node.textContent).join('');
  function readRows(document,shared) {
    const rowElements = elements(document,'row');
    if (rowElements.length>2501) throw new Error('Mỗi trang tính hỗ trợ tối đa 2.500 dòng dữ liệu.');
    return rowElements.map((row,index)=>{
      const values = [];
      for (const cell of elements(row,'c')) {
        const column = /^[A-Z]/.test(cell.getAttribute('r')??'') && /^([A-Z])\d+$/.exec(cell.getAttribute('r'));
        if (!column) continue;
        const position = column[1].charCodeAt(0)-65;
        const type = cell.getAttribute('t');
        const value = elements(cell,'v')[0]?.textContent;
        if (type==='inlineStr') values[position] = cellText(cell);
        else if (type==='s') values[position] = shared[Number(value)]??'';
        else if (type==='b') values[position] = value==='1';
        else if (type==='n' || !type) values[position] = value===undefined?'':Number(value);
        else if (type!=='e') values[position] = value??'';
      }
      return {number:Number(row.getAttribute('r'))||index+1,values};
    });
  }

  async function read(file,wanted) {
    if (file.size>5*1024*1024) throw new Error('Tệp Excel phải nhỏ hơn 5 MB.');
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const [workbook,rels] = await Promise.all([parse(zip,'xl/workbook.xml'),parse(zip,'xl/_rels/workbook.xml.rels')]);
    const date1904 = ['1','true'].includes(elements(workbook,'workbookPr')[0]?.getAttribute('date1904'));
    const targets = new Map(elements(rels,'Relationship').map(rel=>[rel.getAttribute('Id'),rel.getAttribute('Target')??'']));
    const shared = zip.file('xl/sharedStrings.xml') ? elements(await parse(zip,'xl/sharedStrings.xml'),'si').map(cellText) : [];
    const sheets = new Map();
    for (const sheet of elements(workbook,'sheet')) {
      const name = sheet.getAttribute('name');
      if (!wanted.includes(name)) continue;
      const target = targets.get(sheet.getAttributeNS(officeRel,'id')??sheet.getAttribute('r:id'));
      const path = target?.startsWith('/') ? target.slice(1) : 'xl/'+target;
      if (!/^xl\/worksheets\/[\w.-]+\.xml$/.test(path)) throw new Error('Không đọc được trang tính '+name+'.');
      const rows = readRows(await parse(zip,path),shared);
      sheets.set(name,rows);
    }
    return {sheets,date1904};
  }
  return {write,read};
})();
