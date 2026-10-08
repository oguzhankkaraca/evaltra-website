import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {workbooks,getWorkbookState} from '../dist/demo-data.js';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const html=await readFile(path.join(root,'index.html'),'utf8');
const value=(kind,index,sheetName,address)=>{
 const match=address.match(/^([A-D])(\d+)$/),sheet=getWorkbookState(kind,index).sheets.find(s=>s.name===sheetName);
 return sheet.rows[Number(match[2])-1][match[1].charCodeAt(0)-65];
};
// Expected results independently captured in Excel and native Evaltra, 2026-10-07.
// Compare all public formula outputs and FILTER spill contents, not only totals.
const expectedEstimate=[
 {quantities:[40,120,56],amounts:[3800,3840,3640],subtotal:11280,contingency:1128,total:12408},
 {quantities:[56,160,72],amounts:[5320,5120,4680],subtotal:15120,contingency:1512,total:16632}
];
for(const [index,expected] of expectedEstimate.entries()){
 for(let row=3;row<=5;row++){
  assert.equal(value('estimate',index,'Estimate','A'+row).value,['Design','Materials','Installation'][row-3]);
  assert.equal(value('estimate',index,'Estimate','B'+row).value,expected.quantities[row-3]);
  assert.equal(value('estimate',index,'Estimate','C'+row).value,[95,32,65][row-3]);
  assert.equal(value('estimate',index,'Estimate','D'+row).value,expected.amounts[row-3]);
 }
 for(const [address,expectedValue] of Object.entries({D7:expected.subtotal,D8:expected.contingency,D9:expected.total}))assert.equal(value('estimate',index,'Estimate',address).value,expectedValue);
 assert.equal(value('estimate',index,'Summary','B2').value,'Studio renovation');
 assert.equal(value('estimate',index,'Summary','B3').value,expected.subtotal);
 assert.equal(value('estimate',index,'Summary','B4').value,expected.contingency);
 assert.equal(value('estimate',index,'Summary','B5').value,expected.total);
}
const expectedSales=[
 {total:28200,count:3,average:9400,rows:[['North','Platform',12400],['North','Services',6700],['North','Platform',9100]]},
 {total:15100,count:2,average:7550,rows:[['South','Platform',8600],['South','Platform',6500]]},
 {total:0,count:0,average:0,rows:[['No matches','','']]}
];
for(const [index,expected] of expectedSales.entries()){
 for(const [address,expectedValue] of Object.entries({B5:expected.total,B6:expected.count,B7:expected.average}))assert.equal(value('sales',index,'Summary',address).value,expectedValue);
 assert.deepEqual(getWorkbookState('sales',index).sheets.find(s=>s.name==='Summary').rows.slice(9).map(row=>row.map(cell=>cell.value)),expected.rows);
 assert(value('sales',index,'Summary','A10').formula.startsWith('=FILTER('));
}
assert.throws(()=>getWorkbookState('unknown'));
assert.throws(()=>getWorkbookState('sales',99));
assert.throws(()=>getWorkbookState('estimate',-1));
assert.equal(Object.keys(workbooks).length,2);
assert(!/<input|contenteditable/i.test(html),'Workbook walkthroughs must not pretend to be arbitrary formula editors');
assert(!/href="\/(?!\/)|src="\//.test(html),'Assets must work under the GitHub Pages subpath');
assert(html.indexOf('id="runtime-graph"')<html.indexOf('id="playground"'),'Dependency explanation must come before workbook examples');
assert(html.includes('id="dependency-demo"'));
assert(html.includes('<h3>WASM</h3>')&&html.includes('<h3>Rust</h3>')&&html.includes('<h3>Python</h3>'));
assert(!/HTTP today|native Python library is planned|No API connection|static preview|prepared output|HyperFormula/i.test(html));
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
assert.equal(ids.length,new Set(ids).size,'Duplicate element IDs');
for(const [,target] of html.matchAll(/(?:href|src)="([^"#]+|#[^"]+)"/g)){
 if(target.startsWith('#'))assert(target==='#'||ids.includes(target.slice(1)),'Missing anchor: '+target);
 else if(target.startsWith('./'))assert((await stat(path.join(root,target))).isFile(),'Missing asset: '+target);
}
const allowed=new Set(['index.html','app.js','proof.js','proof.css','demo-data.js','styles.css','headless.css','favicon.svg','grid-reference.json','.nojekyll']);
for(const file of await readdir(root)){
 assert(allowed.has(file),'Unexpected public file: '+file);
 if(!file.endsWith('.js'))continue;
 const source=await readFile(path.join(root,file),'utf8');
 assert(!/fetch\([^)]*\/api|WebAssembly|new Worker|EVALTRA_SERVICE_TOKEN|eval\s*\(|new Function/.test(source),'Unexpected runtime/API dependency in '+file);
}
const reference=JSON.parse(await readFile(path.join(root,'grid-reference.json'),'utf8'));
assert.equal(reference.cases.sumif.cells.A4.excel,7);
assert.equal(reference.cases.sumif.cells.C5.excel,7);
assert.equal(reference.cases.if.cells.B1.excel,42);
assert.equal(reference.cases.if.cells.C1.excel,43);
assert.equal(reference.cases.if.cells.B1.other,'#CYCLE!');
assert.equal(reference.cases.sumif.cells.A4.other,'#CYCLE!');
console.log('PASS: workbook formula/spill snapshots, unsupported-scenario boundaries, content, public-file allowlist, relative assets and section links.');
console.log('Full engine / Excel Template 1+2 / browser Worker compatibility: NOT RUN (website-only revision).');
