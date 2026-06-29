/* ADR-006 — test logic thuần hóa đơn nhiều đợt + clear flag + contract model.
   Chạy: node tests/adr-006-invoices.test.js  (load index.html trong vm sandbox). */
const fs=require('fs'), vm=require('vm'), path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const code=html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const mkEl=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},appendChild:noop,insertBefore:noop,setAttribute:noop,getAttribute:()=>null,addEventListener:noop,removeEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],remove:noop,value:'',textContent:'',innerHTML:'',dataset:{},focus:noop,click:noop,closest:()=>null,getContext:()=>({}),options:[]});
const doc={getElementById:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener:noop,body:mkEl(),head:mkEl(),documentElement:mkEl(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'node',serviceWorker:{register:()=>Promise.resolve()}},location:{href:'',hostname:'',pathname:'/',reload:noop},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a,randomUUID:()=>'x'},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop,unobserve:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{pushState:noop,replaceState:noop,back:noop},performance:{now:()=>0},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'index.html',timeout:8000});

let pass=0,fail=0;
function eq(name,got,exp){ if(JSON.stringify(got)===JSON.stringify(exp)){pass++;} else {fail++;console.log('✗',name,'got',JSON.stringify(got),'exp',JSON.stringify(exp));} }

// invoices totals
const r={invoices:[{amountNet:50,vatAmount:5,vatPercent:10,amountGross:55},{amountNet:50,vatAmount:5,vatPercent:10,amountGross:55}]};
eq('netTotal',ctx.acInvoicesNetTotal(r),100);
eq('vatTotal',ctx.acInvoicesVatTotal(r),10);
eq('grossTotal',ctx.acInvoicesGrossTotal(r),110);
eq('empty net',ctx.acInvoicesNetTotal({}),0);

// 1.a clear flag
eq('clear full',ctx.acProvisionalShouldClear({_isProvisional:true,_contractValue:100,invoices:[{amountNet:50},{amountNet:50}]}),true);
eq('clear over',ctx.acProvisionalShouldClear({_isProvisional:true,_contractValue:100,invoices:[{amountNet:60},{amountNet:50}]}),true);
eq('no clear partial',ctx.acProvisionalShouldClear({_isProvisional:true,_contractValue:100,invoices:[{amountNet:50}]}),false);
eq('no clear empty',ctx.acProvisionalShouldClear({_isProvisional:true,_contractValue:100,invoices:[]}),false);
eq('legacy invoiceNo',ctx.acProvisionalShouldClear({_isProvisional:true,invoiceNo:'HD-1'}),true);
eq('not provisional',ctx.acProvisionalShouldClear({_isProvisional:false,invoiceNo:'HD-1'}),false);

// validate invoice
eq('valid ok',ctx.acValidateContractInvoice('HD-9','2026-06-29',50).ok,true);
eq('valid no inv',ctx.acValidateContractInvoice('','2026-06-29',50).ok,false);
eq('valid no date',ctx.acValidateContractInvoice('HD-9','',50).ok,false);
eq('valid bad net',ctx.acValidateContractInvoice('HD-9','2026-06-29',0).ok,false);

// contractProgress: diff only when settled
const cp1=ctx.contractProgress({_contractAdvance:true,_contractValue:100,payments:[{amount:30}],invoices:[{amountNet:40}]});
eq('progress value',cp1.value,100);
eq('progress paid',cp1.paid,30);
eq('progress invTotal',cp1.invTotal,40);
eq('progress diff unsettled=0',cp1.diff,0);
const cp2=ctx.contractProgress({_contractAdvance:true,_contractValue:100,_settled:true,_settledValue:120,payments:[],invoices:[]});
eq('progress diff settled',cp2.diff,20);

console.log(`\nADR-006: ${pass} pass, ${fail} fail`);
process.exit(fail?1:0);
