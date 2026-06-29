const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const mk=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',textContent:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,closest:()=>null,dataset:{}});
const doc={getElementById:()=>mk(),querySelector:()=>mk(),querySelectorAll:()=>[],createElement:()=>mk(),addEventListener:noop,body:mk(),head:mk(),documentElement:mk(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:''},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addEventListener:noop}),history:{},performance:{now:()=>Date.now()},addEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
vm.runInContext("CURRENT_ROLE='admin'; CURRENT_USER={id:'a',name:'admin'}; toast=function(){}; renderAll=function(){}; logAuditEvent=function(){}; actorName=function(){return 'admin';}; saveState=function(){}; S={payables:[{id:'AP1',partner:'NCC',amount:5e6,ccy:'VND'}], deletedIds:[], _recycleBin:[]};", ctx);
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('  x',n);}};
// xóa: đưa vào recycle
vm.runInContext("_recycleRecords('payables', [S.payables[0]]); S.payables=[]; markDeleted('AP1');", ctx);
ok('payable đã xóa khỏi list', vm.runInContext("S.payables.length===0",ctx));
ok('vào thùng rác', vm.runInContext("S._recycleBin.length===1",ctx));
ok('bia mộ AP1 tồn tại', vm.runInContext("S.deletedIds.some(d=>d.id==='AP1')",ctx));
// khôi phục
const binId=vm.runInContext("S._recycleBin[0].binId", ctx);
vm.runInContext("restoreFromRecycle('"+binId+"')", ctx);
ok('khôi phục về payables', vm.runInContext("S.payables.length===1 && S.payables[0].id==='AP1'",ctx));
ok('khôi phục giữ đúng số tiền', vm.runInContext("S.payables[0].amount===5e6",ctx));
ok('gỡ bia mộ sau khôi phục', vm.runInContext("!S.deletedIds.some(d=>d.id==='AP1')",ctx));
ok('thùng rác trống sau khôi phục', vm.runInContext("S._recycleBin.length===0",ctx));
console.log('recycle-bin: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
