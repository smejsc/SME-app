const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const mk=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',textContent:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,closest:()=>null,dataset:{}});
const doc={getElementById:()=>mk(),querySelector:()=>mk(),querySelectorAll:()=>[],createElement:()=>mk(),addEventListener:noop,body:mk(),head:mk(),documentElement:mk(),cookie:''};
let LS={};
const ctx={console,document:doc,localStorage:{getItem:(k)=>LS[k]!==undefined?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v)},removeItem:(k)=>{delete LS[k]}},navigator:{userAgent:'n'},location:{href:''},setTimeout:(f)=>{try{f&&f()}catch(e){}},setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addEventListener:noop}),history:{},performance:{now:()=>Date.now()},addEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
vm.runInContext("toast=function(){}; renderAll=function(){}; logAuditEvent=function(){}; actorName=function(){return 'tester';}; gzipCompress=null; gzipDecompress=null; _stateLooksEmpty=function(s){return !s||Object.keys(s).length===0;}; saveState=function(){globalThis.__saved=true;};", ctx);
(async()=>{
  let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('  x',n);}};
  // tạo State có dữ liệu
  vm.runInContext("S={creditFacilities:[{id:'CF-1',limit:1e11}], receivables:[{id:'R1'}]};", ctx);
  await vm.runInContext("pushLocalSnapshot('test-1')", ctx);
  let list=vm.runInContext("listLocalSnapshots()", ctx);
  ok('snapshot lưu được', list.length===1);
  ok('snapshot có nhãn', list[0].label==='test-1');
  // GIẢ LẬP MẤT DỮ LIỆU: xóa creditFacilities
  vm.runInContext("S.creditFacilities=[];", ctx);
  ok('đã mất creditFacilities', vm.runInContext("S.creditFacilities.length===0",ctx));
  // KHÔI PHỤC
  const snapId=list[0].id;
  await vm.runInContext("restoreLocalSnapshot('"+snapId+"')", ctx);
  ok('khôi phục lại creditFacilities', vm.runInContext("S.creditFacilities.length===1 && S.creditFacilities[0].limit===1e11",ctx));
  ok('khôi phục giữ receivables', vm.runInContext("S.receivables.length===1",ctx));
  // ring buffer: push >8 → giữ tối đa 8
  for(let i=0;i<12;i++){ ctx.globalThis._snapLastAt=0; await vm.runInContext("pushLocalSnapshot('r"+i+"')", ctx); }
  list=vm.runInContext("listLocalSnapshots()", ctx);
  ok('ring buffer giữ ≤8', list.length<=8);
  console.log('snapshot-rollback: '+pass+' pass, '+fail+' fail');
  process.exit(fail?1:0);
})();
