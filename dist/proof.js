const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exampleValues = {sumif: {B4:1, B5:0, C4:7, C5:7, A4:7}, if: {A1:0, C1:43, B1:42}};
const examples = {
  sumif: {output:'A4',formula:'=SUMIF(B4:B5,1,C4:C5)',rows:[['B4','1','Included row'],['B5','0','Excluded row'],['C4','7','Included amount'],['C5','=A4','Reference back to the total'],['A4','=SUMIF(B4:B5,1,C4:C5)','SUMIF result']],explanation:'SUMIF selects C4 = 7. The excluded row contains a reference back to the result, but it is never needed for this calculation.'},
  if: {output:'B1',formula:'=IF(A1,B1,42)',rows:[['A1','0','Condition is false'],['C1','=B1+1','Result plus one'],['B1','=IF(A1,B1,42)','IF result']],explanation:'The condition is false. IF returns 42 without following the self-reference in its unused branch.'}
};
let scenario='sumif', sequence=0, controller, reference, started=false;
function showRows(cells={}) {
  const example=examples[scenario];
  $('#formula-address').textContent=example.output;
  $('#formula-expression').textContent=example.formula;
  $('#comparison-explanation').textContent=example.explanation;
  $('#comparison-rows').innerHTML=example.rows.map(([address,formula,description])=>{
    const live=cells[address] ?? '—';
    const recorded=reference?.cases[scenario].cells[address];
    return `<tr${address===example.output?' class="result-row"':''}><th scope="row"><span class="grid-cell-address">${address}</span><code>${escape(formula)}</code><small>${description}</small></th><td class="evaltra-column" data-example-cell="${address}">${escape(live)}</td><td data-excel-cell="${address}">${escape(recorded?.excel ?? '—')}</td><td class="${recorded?.other==='#CYCLE!'?'grid-cycle':''}" data-other-cell="${address}">${escape(recorded?.other ?? '—')}</td></tr>`;
  }).join('');
  document.querySelectorAll('[data-scenario]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.scenario===scenario)));
}
async function run() {
  started=true;
  const id=++sequence, selected=scenario;
  controller?.abort();controller=new AbortController();
  showRows();
  $('#proof-results').setAttribute('aria-busy','true');
  $('#proof-status').textContent='LOADING EXAMPLE';
  $('#proof-match').textContent='Loading recorded references…';
  $('#proof-error').hidden=true;$('#proof-run').disabled=true;
  $('#proof-raw').textContent='Loading example data…';
  try {
    const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(22000)]);
    const response = reference ? null : await fetch('./grid-reference.json', {signal});
    if (response && !response.ok) throw new Error('The recorded reference file could not be loaded.');
    reference = response ? await response.json() : reference;
    if(id!==sequence)return;
    showRows(exampleValues[selected]);
    $('#proof-status').textContent='PREPARED EXAMPLE';
    $('#proof-match').textContent='Same formulas. Same inputs.';
    $('#reference-method').textContent=`Excel ${reference.excel.version}, build ${reference.excel.build}; iterative calculation disabled. Reference recorded ${reference.excel.capturedAt.slice(0,10)}. Evaltra outputs on this page are prepared examples. These small fixtures do not establish full workbook compatibility.`;
    $('#proof-raw').textContent=JSON.stringify({mode:'Static illustration; no engine or API call',exampleOutputs:exampleValues[selected],reference},null,2);
  } catch(error) {
    if(id!==sequence)return;
    showRows();$('#proof-status').textContent='REFERENCE UNAVAILABLE';
    $('#proof-match').textContent='Example data unavailable';
    $('#proof-error').hidden=false;
    $('#proof-error').textContent=error.name==='TimeoutError'?'The reference file could not be loaded. Replay the example to retry.':error.message;
  } finally {
    if(id===sequence){$('#proof-results').setAttribute('aria-busy','false');$('#proof-run').disabled=false;}
  }
}
document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>{scenario=button.dataset.scenario;run();}));
$('#proof-run').addEventListener('click',run);
document.querySelectorAll('[data-open-proof]').forEach(link=>link.addEventListener('click',()=>{if(!started)run();}));
showRows();
const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();if(!started)run();}},{rootMargin:'100px'});
observer.observe($('#runtime-demo'));
