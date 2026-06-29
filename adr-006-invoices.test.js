const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const el={style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,removeEventListener:noop,appendChild:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,click:noop,closest:()=>null,dataset:{}};
const doc={getElementById:()=>el,querySelector:()=>el,querySelectorAll:()=>[],createElement:()=>el,addEventListener:noop,body:el,head:el,documentElement:el,cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:'',hostname:'',pathname:'/'},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{},performance:{now:()=>0},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
vm.runInContext(`
  CURRENT_ROLE='admin'; CURRENT_USER={id:'a',name:'admin'}; S=S||{};
  S.projects=[{id:'PRJ_OM',code:'O&M-QN',name:'Dự án O&M Quảng Ngãi',isOM:true}];
  S.cashFunds=[{id:'F1',name:'VPCT-QN',fundType:'PROJECT',projectId:'PRJ_OM',ccy:'VND',balance:0}];
  S.cashTxns=[]; S.payables=S.payables||[]; S.expenseTypes=[{code:'TIEPKHACH',label:'Tiếp khách'}];
  confirm=function(){return true;};
  closeModal=function(){}; renderAll=function(){}; viewCashLedger=function(){}; toast=function(){};
  window._cashImportData={fundId:'F1',
    cash:{rows:[{date:'2026-02-02',desc:'Tiếp khách A',invoiceNo:'',amount:5000000,note:'',expType:'TIEPKHACH',_grp:'cash',_idx:0}]},
    inv:{rows:[]}, car:{rows:[]}, totalSheet:{}, fileName:'x.xlsx', fileB64:''};
`, ctx);
let err=null;
try{ vm.runInContext("cashImportWrite();", ctx); }catch(e){ err=e; }
const pays=vm.runInContext("AccountingService.payables()",ctx);
console.log('payable tạo:', pays.length);
if(pays.length){
  const p=pays[0];
  console.log('projectId =', p.projectId, p.projectId==='PRJ_OM'?'✓ gắn dự án O&M':'✗ SAI');
  console.log('vesselId =', JSON.stringify(p.vesselId), '(phải rỗng)');
  console.log('segment =', p.segment);
  console.log('amount =', p.amount);
}
if(err){ console.log('THREW:', err.message); console.log(err.stack.split('\n').slice(0,4).join('\n')); }
process.exit((pays.length===1 && pays[0].projectId==='PRJ_OM' && !pays[0].vesselId)?0:1);
