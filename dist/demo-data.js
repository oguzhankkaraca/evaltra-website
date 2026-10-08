// Bounded workbook states, not a formula parser. Native and Excel evidence stays in ignored artifacts.
const c = (value, formula = '', format = '') => ({value, formula, format});
const money = (value, formula = '') => c(value, formula, 'money');
const blank = () => c('');
export const salesRecords = [
  ['North','Platform',12400], ['South','Platform',8600],
  ['East','Services',5400], ['West','Platform',18200],
  ['North','Services',6700], ['South','Services',4200],
  ['East','Platform',11300], ['West','Services',7800],
  ['North','Platform',9100], ['South','Platform',6500],
  ['East','Services',3900], ['West','Platform',14700]
];
function estimateState(expanded) {
  const quantities = expanded ? [56,160,72] : [40,120,56];
  const totals = expanded ? [5320,5120,4680] : [3800,3840,3640];
  const subtotal = expanded ? 15120 : 11280;
  const contingency = expanded ? 1512 : 1128;
  const total = expanded ? 16632 : 12408;
  return {
    label: expanded ? 'Expanded scope' : 'Base scope',
    caption: expanded ? 'More design time, materials and installation. The same model carries the new scope through to the total.' : 'Quantities and rates flow from Inputs into Estimate, then into a concise project Summary.',
    sheets: [
      {name:'Inputs', active:'B6', rows:[
        [c('PROJECT INPUTS')], [c('Project'),c('Studio renovation')],
        [c('Contingency'),c(.1,'','percent')], [],
        [c('Item'),c('Quantity'),c('Unit rate'),c('Unit')],
        [c('Design'),c(quantities[0]),money(95),c('hours')],
        [c('Materials'),c(quantities[1]),money(32),c('units')],
        [c('Installation'),c(quantities[2]),money(65),c('hours')]
      ]},
      {name:'Estimate', active:'D9', rows:[
        [c('COST ESTIMATE')], [c('Item'),c('Quantity'),c('Rate'),c('Amount')],
        ...['Design','Materials','Installation'].map((label,i)=>[
          c(label,'=Inputs!A'+(i+6)),c(quantities[i],'=Inputs!B'+(i+6)),money([95,32,65][i],'=Inputs!C'+(i+6)),money(totals[i],'=B'+(i+3)+'*C'+(i+3))
        ]), [],
        [c('Subtotal'),blank(),blank(),money(subtotal,'=SUM(D3:D5)')],
        [c('Contingency'),blank(),blank(),money(contingency,'=D7*Inputs!B3')],
        [c('Project total'),blank(),blank(),money(total,'=SUM(D7:D8)')]
      ]},
      {name:'Summary', active:'B5', rows:[
        [c('PROJECT SUMMARY')], [c('Project'),c('Studio renovation','=Inputs!B2')],
        [c('Base estimate'),money(subtotal,'=Estimate!D7')],
        [c('Contingency'),money(contingency,'=Estimate!D8')],
        [c('Project total'),money(total,'=Estimate!D9')], [],
        [c('Scope'),c(expanded?'Expanded scope':'Base scope')]
      ]}
    ],
    highlights:[['Base estimate',subtotal],['Contingency',contingency],['Project total',total]]
  };
}
function salesState(region, minimum, label, matching, total, average) {
  return {
    label,
    caption: 'The Orders sheet feeds a summary with SUMIFS, COUNTIFS and a FILTER result that expands into matching rows.',
    sheets:[
      {name:'Orders',active:'C2',rows:[
        [c('Region'),c('Product'),c('Revenue')],
        ...salesRecords.map(([r,p,v])=>[c(r),c(p),money(v)])
      ]},
      {name:'Summary',active:'B5',rows:[
        [c('SALES ANALYSIS')], [c('Region'),c(region)], [c('Minimum order'),money(minimum)], [],
        [c('Matching revenue'),money(total,'=SUMIFS(Orders!C2:C13,Orders!A2:A13,B2,Orders!C2:C13,">="&B3)')],
        [c('Matching orders'),c(matching.length,'=COUNTIFS(Orders!A2:A13,B2,Orders!C2:C13,">="&B3)')],
        [c('Average order'),money(average,'=IFERROR(B5/B6,0)')], [],
        [c('Region'),c('Product'),c('Revenue')],
        ...(matching.length?matching:[['No matches','','']]).map(([r,p,v],i)=>[
          c(r,i===0?'=FILTER(Orders!A2:C13,(Orders!A2:A13=B2)*(Orders!C2:C13>=B3),"No matches")':''),c(p),typeof v==='number'?money(v):c(v)
        ])
      ]}
    ],
    highlights:[['Matching revenue',total],['Matching orders',matching.length,'number'],['Average order',average]]
  };
}
export const workbooks = {
  estimate:{
    title:'Project estimate',file:'Project estimate.xlsx',defaultSheet:'Estimate',
    description:'Three connected sheets. One project total.',
    snapshots:[estimateState(false),estimateState(true)]
  },
  sales:{
    title:'Sales analysis',file:'Sales analysis.xlsx',defaultSheet:'Summary',
    description:'A table of orders becomes an answer.',
    snapshots:[
      salesState('North',5000,'North',salesRecords.filter(r=>r[0]==='North'),28200,9400),
      salesState('South',5000,'South',salesRecords.filter(r=>r[0]==='South'&&r[2]>=5000),15100,7550),
      salesState('East',100000,'No matches',[],0,0)
    ]
  }
};
export function getWorkbookState(kind, index=0) {
  const workbook = workbooks[kind];
  if (!workbook || !Number.isInteger(index) || !workbook.snapshots[index]) throw new Error('Unknown workbook scenario.');
  return workbook.snapshots[index];
}
export function formatCell(cell) {
  if (cell.value === '') return '';
  if (cell.format === 'money') return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(cell.value);
  if (cell.format === 'percent') return new Intl.NumberFormat('en-US',{style:'percent',maximumFractionDigits:0}).format(cell.value);
  return String(cell.value);
}
