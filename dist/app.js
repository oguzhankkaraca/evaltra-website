import './proof.js';
import { calculateDemo } from './demo-data.js';
const $ = selector => document.querySelector(selector);
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const compact = n => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
const format = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(n);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
let selected = 'revenue';
let currentRequest;
let sequence = 0;
const cache = new Map();
const defaults = { revenue: { customers: 1200, price: 49, growth: 8, costs: 18000 }, sales: { region: 'North', minimum: 5000 }, formula: { a: 120, b: 45, c: 10, formula: '=SUM(A1:C1)' } };
const names = { revenue: 'REVENUE OVERVIEW', sales: 'SALES OVERVIEW', formula: 'FORMULA RESULT' };

function metric(label, value) { return `<div><span>${escape(label)}</span><strong>${escape(value)}</strong></div>`; }
function table(headers, rows) { return `<table><thead><tr>${headers.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(v => `<td>${escape(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
function chart(labels, values) {
  const max = Math.max(...values, 1);
  $('#chart').className = 'chart';
  $('#chart').innerHTML = values.map((v, i) => `<div class="bar-group"><span class="bar-value">$${compact(v)}</span><div class="bar" style="height:${Math.max(v / max * 80, 1)}%" role="img" aria-label="${escape(labels[i])}: ${money(v)}"></div><span class="bar-label">${escape(labels[i])}</span></div>`).join('');
}

function render(kind, data) {
  $('#error-message').hidden = true;
  $('#output-title').textContent = names[kind];
  if (kind === 'revenue') {
    $('#metrics').innerHTML = metric('6-month revenue', money(data.revenue)) + metric('6-month profit', money(data.profit));
    chart(data.rows.map(r => r.month), data.rows.map(r => r.revenue));
    $('#chart').setAttribute('aria-label', 'Illustrative monthly revenue from January to June');
    $('#results-table').innerHTML = table(['Month', 'Customers', 'Revenue', 'Profit'], data.rows.map(r => [r.month, format(r.customers), money(r.revenue), money(r.profit)]));
  } else if (kind === 'sales') {
    $('#metrics').innerHTML = metric('Matching sales', money(data.total)) + metric('Orders matched', format(data.rows.length));
    chart(data.regions, data.totals);
    $('#chart').setAttribute('aria-label', 'Sample total sales by region, all orders');
    $('#results-table').innerHTML = table(['Region', 'Product', 'Matching sale'], data.rows.map(([region, product, amount]) => [region, product, money(amount)])) + `<p class="table-note">Chart: all sample orders by region. Table: your filtered results.${!data.rows.length ? ' No orders match these filters.' : ''}</p>`;
  } else {
    $('#metrics').innerHTML = metric('Result type', data.type) + metric('Execution', 'Sample demo');
    $('#chart').className = 'chart formula-panel-chart';
    $('#chart').setAttribute('aria-label', 'Example formula result');
    $('#chart').innerHTML = `<div class="formula-result"><small>${escape(data.input.formula)}</small><span class="${data.type === 'error' ? 'formula-error' : ''}">${escape(data.type === 'number' ? format(data.value) : data.value)}</span></div>`;
    $('#results-table').innerHTML = table(['Input cell', 'Value'], ['a', 'b', 'c'].map((key, i) => [['A1', 'B1', 'C1'][i], format(data.input[key])]));
  }
  $('#calculation-status').textContent = 'Illustrative result · runs in your browser';
  currentRequest = {example: kind, inputs: data.input};
  $('#request-code').textContent = JSON.stringify(currentRequest, null, 2);
  $('#request-toggle').disabled = false;
}

function clearResults(message = 'Choose an example…') {
  $('#metrics').innerHTML = metric('Result', '—') + metric('Execution', '—');
  $('#chart').className = 'chart';
  $('#chart').innerHTML = `<span class="empty-state">${escape(message)}</span>`;
  $('#results-table').innerHTML = '';
  $('#request-code').hidden = true;
  $('#request-code').textContent = '';
  $('#request-toggle').setAttribute('aria-expanded', 'false');
  $('#request-toggle').disabled = true;
  currentRequest = undefined;
}

function connection(ok, message) {
  $('#api-status').textContent = message || (ok ? 'Sample demo' : 'Check inputs');
  $('#api-status').className = `connection ${ok ? 'connected' : 'disconnected'}`;
}

async function run(kind) {
  const form = $(`#${kind}-form`);
  if (!form.reportValidity()) return;
  const input = Object.fromEntries(new FormData(form));
  for (const key of Object.keys(input)) if (!['region', 'formula'].includes(key)) input[key] = Number(input[key]);
  const id = ++sequence;
  clearResults('Updating example…');
  $('#error-message').hidden = true;
  $('.demo-output').setAttribute('aria-busy', 'true');
  $('#calculation-status').textContent = 'Updating sample inputs…';
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  try {
    const data = calculateDemo(kind, input);
    if (id !== sequence || kind !== selected) return;
    render(kind, data); cache.set(kind, { data, input }); connection(true);
  } catch (error) {
    if (id !== sequence || kind !== selected) return;
    clearResults('No current result');
    $('#error-message').hidden = false;
    $('#error-message').textContent = error.message;
    $('#calculation-status').textContent = 'Calculation not completed. Update the inputs or retry.';
    if (!error.httpStatus || error.httpStatus >= 500) {
      connection(false);
    }
  } finally {
    button.disabled = false;
    if (id === sequence) $('.demo-output').setAttribute('aria-busy', 'false');
  }
}

function selectDemo(kind) {
  selected = kind; sequence++;
  document.querySelectorAll('[data-demo]').forEach(button => { const on = button.dataset.demo === kind; button.setAttribute('aria-selected', String(on)); button.tabIndex = on ? 0 : -1; });
  for (const name of Object.keys(defaults)) $(`#demo-${name}`).hidden = name !== kind;
  $('#output-title').textContent = names[kind];
  if (cache.has(kind)) { render(kind, cache.get(kind).data); $('.demo-output').setAttribute('aria-busy', 'false'); }
  else run(kind);
}

document.querySelectorAll('[data-demo]').forEach(button => button.addEventListener('click', () => selectDemo(button.dataset.demo)));
$('[role=tablist]').addEventListener('keydown', event => {
  const tabs = [...document.querySelectorAll('[data-demo]')];
  const i = tabs.indexOf(document.activeElement);
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[next].focus(); selectDemo(tabs[next].dataset.demo);
});

for (const kind of Object.keys(defaults)) {
  const form = $(`#${kind}-form`);
  form.addEventListener('submit', event => { event.preventDefault(); run(kind); });
  form.addEventListener('input', () => { cache.delete(kind); sequence++; if (kind === selected) { clearResults('Inputs changed. Run to recalculate.'); $('#calculation-status').textContent = 'Inputs changed · result needs recalculation'; $('.demo-output').setAttribute('aria-busy', 'false'); } });
}
document.querySelectorAll('[data-formula]').forEach(button => button.addEventListener('click', () => { $('#formula').value = button.dataset.formula; run('formula'); }));
$('#reset').addEventListener('click', () => { $(`#${selected}-form`).reset(); run(selected); });
$('#request-toggle').addEventListener('click', () => { const open = $('#request-code').hidden; $('#request-code').hidden = !open; $('#request-toggle').setAttribute('aria-expanded', String(open)); });
$('#copy-code').addEventListener('click', async () => { try { await navigator.clipboard.writeText($('#integration-code').textContent); $('#copy-code').textContent = 'Copied ✓'; } catch { $('#copy-code').textContent = 'Select the code to copy'; } });
run('revenue');

// Illustrative integration paths. These labels do not simulate an agent run.
const workflowStories = {
  agent: ['An agent requests a scenario','Model inputs from a tool call','Calculated values return to the agent','Typed results with calculation diagnostics','YOUR TOOL → HTTP API → RESULTS','✳'],
  etl: ['Fresh data arrives in your pipeline','Prepare the inputs in your existing data job','Calculated results continue downstream','Write to the next table, report or job step','PREPARE → CALCULATE → CONTINUE','≋'],
  app: ['A user changes an assumption','Inputs from your planning or pricing interface','Your application shows the new outcome','Embed the browser SDK or call your backend','USER INPUT → CALCULATE → UPDATE UI','⌘']
};
document.querySelectorAll('[data-workflow]').forEach(button => button.addEventListener('click', () => {
  const story=workflowStories[button.dataset.workflow];
  ['#workflow-input','#workflow-input-note','#workflow-output','#workflow-output-note','#workflow-channel','#workflow-symbol'].forEach((selector,index)=>$(selector).textContent=story[index]);
  document.querySelectorAll('[data-workflow]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
}));
document.querySelectorAll('[data-example-link]').forEach(link => link.addEventListener('click',()=>selectDemo(link.dataset.exampleLink)));
document.querySelectorAll('a[href="#workflow-details"],a[href="#server-details"],a[href="#compatibility"]').forEach(link=>link.addEventListener('click',()=>$(link.getAttribute('href')).open=true));
