/* v3.09.48 — hạn mức tín dụng: lưu được + id form KHÔNG trùng form quỹ tiền mặt. */
const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(__dirname+'/../index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
const store={'cfac-bank':{value:'Vietcombank'},'cfac-year':{value:'2026'},'cfac-limit':{value:'100000000000'},'cfac-ccy':{value:'VND'},'cfac-contract':{value:'HD-2026-01'},'cfac-start':{value:'2026-01-01'},'cfac-expiry':{value:'2026-12-31'},'cfac-active':{checked:true},'cfac-collateral':{value:'Thế chấp'},'cfac-note':{value:'note'},'cfac-err':{textContent:''}};
const mk=(o)=>Object.assign({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,appendChild:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',value:'',textContent:'',checked:false,focus:noop,click:noop,closest:()=>null,dataset:{},setAttribute:noop,getAttribute:()=>null},o||{});
const doc={getElementById:(id)=>store[id]?mk(store[id]):mk(),querySelector:()=>mk(),querySelectorAll:()=>[],createElement:()=>mk(),addEventListener:noop,body:mk(),head:mk(),documentElement:mk(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:'',hostname:'',pathname:'/'},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{},performance:{now:()=>0},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
vm.runInContext("S=S||{}; S.creditFacilities=[]; CURRENT_ROLE='admin'; CURRENT_USER={id:'a',name:'admin'}; closeModal=function(){}; toast=function(){}; renderAll=function(){}; saveState=function(){globalThis.__saved=true;};", ctx);
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('x',n);}};
let err=null; try{ vm.runInContext("saveCreditFacility('');", ctx); }catch(e){ err=e; }
ok('không throw', !err);
const facs=vm.runInContext("S.creditFacilities", ctx);
ok('lưu 1 hạn mức', facs.length===1);
ok('limit đúng', facs[0] && facs[0].limit===100000000000);
ok('bank đúng', facs[0] && facs[0].bankName==='Vietcombank');
ok('year đúng', facs[0] && facs[0].year===2026);
ok('saveState gọi', ctx.__saved===true);
// id form hạn mức KHÔNG trùng form quỹ tiền mặt
const src=code;
const facRegion=src.split('function openCreditFacilityForm')[1].split('function deleteCreditFacility')[0];
ok('form hạn mức KHÔNG dùng id cf-ccy', !/["']cf-ccy["']/.test(facRegion));
ok('form hạn mức dùng cfac-ccy', /["']cfac-ccy["']/.test(facRegion));
console.log('\ncredit-facility-save: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
