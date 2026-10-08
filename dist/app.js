import './proof.js';
import {workbooks,getWorkbookState,formatCell} from './demo-data.js';
const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const letters = ['A','B','C','D'];
let kind='estimate', snapshotIndex=0, sheetName='Estimate', selected='D9';
const current=()=>getWorkbookState(kind,snapshotIndex);
const sheet=()=>current().sheets.find(item=>item.name===sheetName);
const address=(row,col)=>letters[col]+(row+1);

function announce(message){$('#model-announcement').textContent=message;}
function makeChoices(){
  const book=workbooks[kind];
  $('#model-scenarios').innerHTML=book.snapshots.map((state,index)=>'<button data-snapshot="'+index+'" aria-pressed="'+(index===snapshotIndex)+'">'+escape(state.label)+'</button>').join('');
  $('#model-sheets').innerHTML=current().sheets.map(item=>'<button data-sheet="'+item.name+'" aria-pressed="'+(item.name===sheetName)+'">'+item.name+'</button>').join('');
}
function renderTable(){
  const active=sheet(),rows=Math.max(11,active.rows.length);
  $('#model-table').innerHTML='<caption class="sr-only">'+escape(workbooks[kind].title+' — '+sheetName)+'</caption><colgroup><col><col><col><col><col></colgroup><thead><tr><th aria-label="Row"></th>'+letters.map(letter=>'<th scope="col">'+letter+'</th>').join('')+'</tr></thead><tbody>'+
    Array.from({length:rows},(_,ri)=>{
      const row=active.rows[ri]||[];
      const heading=ri===0||(row.length>=3&&row.every(cell=>typeof cell.value==='string'&&cell.value!==''&&!cell.formula));
      const total=['Project total','Matching revenue'].includes(row[0]?.value);
      return '<tr class="'+(heading?'sheet-heading':total?'sheet-total':'')+'"><th scope="row">'+(ri+1)+'</th>'+letters.map((letter,ci)=>{
        const cell=row[ci]||{value:'',formula:''},label=address(ri,ci),display=formatCell(cell);
        return '<td><button class="cell-button '+(typeof cell.value==='number'?'numeric ':'')+(cell.formula?'formula-cell':'')+'" data-cell="'+label+'" data-row="'+ri+'" data-col="'+ci+'" tabindex="'+(label===selected?0:-1)+'" data-selected="'+(label===selected)+'" aria-label="'+escape(sheetName+' '+label+', '+(display||'empty')+(cell.formula?', formula '+cell.formula:''))+'">'+escape(display||'\u00a0')+'</button></td>';
      }).join('')+'</tr>';
    }).join('')+'</tbody>';
  selectCell(selected);
}
function selectCell(label,focus=false){
  const target=$('#model-table').querySelector('[data-cell="'+label+'"]');
  if(!target)return;
  selected=label;
  $('#model-table').querySelectorAll('[data-cell]').forEach(cell=>{
    cell.dataset.selected=String(cell.dataset.cell===label);
    cell.tabIndex=cell.dataset.cell===label?0:-1;
    cell.removeAttribute('data-referenced');
  });
  const cell=sheet().rows[Number(target.dataset.row)]?.[Number(target.dataset.col)]||{value:'',formula:''};
  $('#model-address').textContent=label;
  $('#model-formula').textContent=cell.formula||String(cell.value)||'Empty cell';
  $('#model-cell-kind').textContent=cell.formula?'Formula':cell.value===''?'Empty':'Value';
  $('#selection-note').textContent=sheetName+'!'+label+(cell.formula?' · Formula':' · Value');
  if(cell.formula){
    const refs=[...cell.formula.matchAll(/(?:([A-Za-z]+)!)?([A-D])(\d+)(?::([A-D])(\d+))?/g)];
    for(const ref of refs){
      if(ref[1]&&ref[1]!==sheetName)continue;
      const startCol=letters.indexOf(ref[2]),endCol=letters.indexOf(ref[4]||ref[2]);
      for(let row=Number(ref[3]);row<=Number(ref[5]||ref[3]);row++)for(let col=startCol;col<=endCol;col++){
        const reference=$('#model-table').querySelector('[data-cell="'+letters[col]+row+'"]');
        if(reference&&reference!==target)reference.dataset.referenced='true';
      }
    }
  }
  if(focus)target.focus({preventScroll:true});
}
function renderModel(){
  const state=current(),book=workbooks[kind];
  $('#model-title').textContent=book.description;
  $('#workbook-filename').textContent=book.file;
  $('#model-caption').textContent=state.caption;
  $('#model-view').setAttribute('aria-labelledby','tab-'+kind);
  document.querySelectorAll('[data-workbook]').forEach(button=>{
    const on=button.dataset.workbook===kind;
    button.setAttribute('aria-selected',String(on));button.tabIndex=on?0:-1;
  });
  document.querySelectorAll('[data-snapshot]').forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.snapshot)===snapshotIndex)));
  document.querySelectorAll('[data-sheet]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.sheet===sheetName)));
  $('#model-metrics').innerHTML=state.highlights.map(([label,value,type])=>'<div><span>'+escape(label)+'</span><strong>'+escape(formatCell({value,format:type==='number'?'':'money'}))+'</strong></div>').join('');
  renderTable();
}
function selectWorkbook(next){
  kind=next;snapshotIndex=0;sheetName=workbooks[kind].defaultSheet;selected=sheet().active;
  makeChoices();renderModel();announce(workbooks[kind].title+'. '+current().label+'. '+sheetName+' sheet.');
}
document.querySelectorAll('[data-workbook]').forEach(button=>button.addEventListener('click',()=>selectWorkbook(button.dataset.workbook)));
$('.model-choices').addEventListener('keydown',event=>{
  const tabs=[...document.querySelectorAll('[data-workbook]')],index=tabs.indexOf(document.activeElement);
  if(index<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  selectWorkbook(tabs[next].dataset.workbook);tabs[next].focus();
});
$('#model-scenarios').addEventListener('click',event=>{
  const button=event.target.closest('[data-snapshot]');if(!button)return;
  snapshotIndex=Number(button.dataset.snapshot);renderModel();announce(current().label+'. '+current().caption);
});
$('#model-sheets').addEventListener('click',event=>{
  const button=event.target.closest('[data-sheet]');if(!button)return;
  sheetName=button.dataset.sheet;selected=sheet().active;renderModel();announce(sheetName+' sheet. Select a cell to inspect its formula.');
});
$('#model-table').addEventListener('click',event=>{
  const button=event.target.closest('[data-cell]');if(!button)return;
  selectCell(button.dataset.cell);announce(sheetName+' '+selected+': '+$('#model-formula').textContent);
});
$('#model-table').addEventListener('keydown',event=>{
  const button=event.target.closest('[data-cell]');if(!button)return;
  const moves={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]};
  if(!moves[event.key]&&!['Home','End'].includes(event.key))return;
  event.preventDefault();
  const row=Number(button.dataset.row),col=Number(button.dataset.col),rowCount=Math.max(11,sheet().rows.length);
  const nextRow=Math.max(0,Math.min(rowCount-1,row+(moves[event.key]?.[0]||0)));
  const nextCol=event.key==='Home'?0:event.key==='End'?3:Math.max(0,Math.min(3,col+(moves[event.key]?.[1]||0)));
  selectCell(address(nextRow,nextCol),true);
});
$('#model-reset').addEventListener('click',()=>{snapshotIndex=0;sheetName=workbooks[kind].defaultSheet;selected=sheet().active;renderModel();announce('View reset. '+workbooks[kind].title+'. Base scenario.');});
document.querySelectorAll('[data-open-details]').forEach(link=>link.addEventListener('click',()=>$(link.getAttribute('href')).open=true));
makeChoices();renderModel();
