const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const el={style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,removeEventListener:noop,appendChild:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,click:noop,closest:()=>null,dataset:{}};
const doc={getElementById:()=>el,querySelector:()=>el,querySelectorAll:()=>[],createElement:()=>el,addEventListener:noop,body:el,head:el,documentElement:el,cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:'',hostname:'',pathname:'/'},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{},performance:{now:()=>0},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
vm.runInContext(`
  S=S||{};
  S.expenseTypes=[
    {code:'ADVANCE',label:'Ứng quỹ tiền mặt',isAdvance:true},
    {code:'TIEPKHACH',label:'Tiếp khách'},
    {code:'BUNKER_PO',label:'Nhiên liệu (PO)',isPO:true}
  ];
  S.opVessels=[{id:'OPV1',name:'Tàu QL hộ'}];
`, ctx);
let pass=0,fail=0;const eq=(n,g,e)=>{if(g===e)pass++;else{fail++;console.log('x',n,'got',g,'exp',e);}};
const P=(r)=>vm.runInContext('apCountsInPL('+JSON.stringify(r)+')',ctx);

console.log('=== NGUYÊN TẮC: Ứng = KHÔNG P&L · Hoàn ứng = CÓ P&L ===');
// 1. Ứng quỹ (ADVANCE) → KHÔNG vào P&L
eq('Ứng quỹ (ADVANCE) → KHÔNG P&L', P({expenseType:'ADVANCE',amount:100000000,status:'approved'}), false);
// 2. Hoàn ứng (_cashClear) → VÀO P&L
eq('Hoàn ứng (_cashClear) → CÓ P&L', P({_cashClear:true,expenseType:'TIEPKHACH',amount:5000000,status:'approved'}), true);
// 3. Hoàn ứng CHỜ duyệt → CHƯA P&L
eq('Hoàn ứng chờ duyệt → CHƯA P&L', P({_cashClear:true,_fundPending:true,expenseType:'TIEPKHACH',amount:5000000}), false);
eq('status pending_fund → CHƯA P&L', P({_cashClear:true,status:'pending_fund',expenseType:'TIEPKHACH'}), false);
// 4. Hoàn ứng cho tàu QL hộ → KHÔNG P&L (chi hộ)
eq('Hoàn ứng tàu QL hộ → KHÔNG P&L', P({_cashClear:true,expenseType:'TIEPKHACH',vesselId:'OPV1'}), false);
// 5. Hoàn ứng loại PO → KHÔNG P&L (tồn kho)
eq('Hoàn ứng loại PO → KHÔNG P&L', P({_cashClear:true,expenseType:'BUNKER_PO'}), false);
// 6. AP thường (không cash) loại Tiếp khách → CÓ P&L
eq('AP thường Tiếp khách → CÓ P&L', P({expenseType:'TIEPKHACH',amount:1000000,status:'approved'}), true);
console.log('\nPnL-cashflow: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
