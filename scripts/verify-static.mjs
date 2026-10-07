import assert from 'node:assert/strict';
import {readFile, readdir, stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {calculateDemo} from '../dist/demo-data.js';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const html = await readFile(path.join(root, 'index.html'), 'utf8');
const revenue = calculateDemo('revenue', {customers:1200, price:49, growth:8, costs:18000});
assert.deepEqual(revenue.rows.map(r => r.customers), [1200,1296,1400,1512,1633,1764]);
assert.equal(revenue.revenue, 431445);
assert.equal(revenue.profit, 323445);
assert.equal(calculateDemo('revenue',{customers:1200,price:59,growth:8,costs:18000}).revenue,519495);
assert.equal(calculateDemo('sales',{region:'North',minimum:5000}).total,28200);
assert.equal(calculateDemo('sales',{region:'East',minimum:100000}).rows.length,0);
const values = {a:120,b:45,c:10};
assert.equal(calculateDemo('formula',{...values,formula:'=SUM(A1:C1)'}).value,175);
assert.equal(calculateDemo('formula',{...values,formula:'=IF(A1>B1,"Above target","Below target")'}).value,'Above target');
assert.equal(calculateDemo('formula',{...values,formula:'=ROUND(A1/B1,2)'}).value,2.67);
assert.equal(calculateDemo('formula',{...values,formula:'=MAX(A1:C1)-MIN(A1:C1)'}).value,110);
assert.equal(calculateDemo('formula',{...values,b:0,formula:'=ROUND(A1/B1,2)'}).value,'#DIV/0!');
assert.throws(() => calculateDemo('formula',{...values,formula:'=WEBSERVICE("https://example.com")'}));
assert.throws(() => calculateDemo('revenue',{customers:NaN,price:49,growth:8,costs:18000}));
assert(!/href="\/(?!\/)|src="\//.test(html), 'Assets must work under the GitHub Pages subpath');
assert(html.includes('No API connection.') && html.includes('readonly'), 'Static mode and preset limit must be visible');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
for (const [,target] of html.matchAll(/(?:href|src)="([^"#]+|#[^"]+)"/g)) {
  if (target.startsWith('#')) assert(target === '#' || ids.has(target.slice(1)), `Missing anchor: ${target}`);
  else if (target.startsWith('./')) assert((await stat(path.join(root,target))).isFile(), `Missing asset: ${target}`);
}
const allowed = new Set(['index.html','app.js','proof.js','demo-data.js','styles.css','headless.css','favicon.svg','grid-reference.json','.nojekyll']);
for (const file of await readdir(root)) {
  assert(allowed.has(file), `Unexpected public file: ${file}`);
  if (!file.endsWith('.js')) continue;
  const source = await readFile(path.join(root,file),'utf8');
  assert(!/fetch\([^)]*\/api|WebAssembly|new Worker|EVALTRA_SERVICE_TOKEN|eval\s*\(|new Function/.test(source), `Unexpected runtime/API dependency in ${file}`);
}
const reference = JSON.parse(await readFile(path.join(root,'grid-reference.json'),'utf8'));
assert.equal(reference.cases.sumif.cells.A4.excel,7);
assert.equal(reference.cases.if.cells.B1.excel,42);
console.log('PASS: sample calculations, preset boundaries, static labels, public-file allowlist, relative assets and section links.');
console.log('Engine / Excel / Worker compatibility gates: NOT RUN (website-only static examples).');
