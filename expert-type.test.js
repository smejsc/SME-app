const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const mk=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',textContent:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,closest:()=>null,dataset:{}});
const doc={getElementById:()=>mk(),querySelector:()=>mk(),querySelectorAll:()=>[],createElement:()=>mk(),addEventListener:noop,body:mk(),head:mk(),documentElement:mk(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:''},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addEventListener:noop}),history:{},performance:{now:()=>0},addEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('  x',n);}};
const test=(role,tabs,label)=>{
  vm.runInContext(`CURRENT_ROLE='${role}'; CURRENT_USER={id:'u',name:'u',tabs:${JSON.stringify(tabs)}};`, ctx);
  const raw={creditFacilities:[{id:'CF-1',bankName:'VCB',limit:1e11}], loans:[{id:'L1'}]};
  const filtered=vm.runInContext('filterStateForUser('+JSON.stringify(raw)+')', ctx);
  return filtered.creditFacilities;
};
// admin: luôn giữ
ok('admin giữ creditFacilities', test('admin',[],'admin').length===1);
// user có tab banking: GIỜ phải giữ
ok('user tab banking giữ creditFacilities', test('user',['banking'],'banking').length===1);
// user có tab fin_accounting: giữ
ok('user tab fin_accounting giữ', test('user',['fin_accounting'],'fin').length===1);
// user có tab cashflow: giữ
ok('user tab cashflow giữ', test('user',['cashflow'],'cf').length===1);
// user KHÔNG có tab tài chính: vẫn mất (đúng — không có quyền xem)
ok('user tab hrm KHÔNG có (đúng)', test('user',['hrm'],'hrm').length===0);
console.log('credit-sync-filter: '+pass+' pass, '+fail+' fail');
globalThis.__f1=fail;

// v3.09.50 — kiểm các field nhập-liệu khác cũng được giữ qua filter cho đúng tab
const fs2=require('fs');
const src2=fs2.readFileSync(__dirname+'/../index.html','utf8');
function tabHas(tab,field){ const m=src2.match(new RegExp(tab+":\\s*\\[([^\\]]*)\\]")); return m && m[1].includes("'"+field+"'"); }
let p2=0,f2=0;const ck=(n,c)=>{if(c)p2++;else{f2++;console.log('  x',n);}};
ck('inventory có materials', tabHas('inventory','materials'));
ck('inventory có stockDocs', tabHas('inventory','stockDocs'));
ck('inventory có stockCounts', tabHas('inventory','stockCounts'));
ck('hrm có positions (PAF)', tabHas('hrm','positions'));
ck('salary_fund có payrollConfig', tabHas('salary_fund','payrollConfig'));
ck('salary_fund có payrollPeriods', tabHas('salary_fund','payrollPeriods'));
ck('banking có loanAutoCollect', tabHas('banking','loanAutoCollect'));
ck('banking có creditFacilities', tabHas('banking','creditFacilities'));
console.log('tab-fields-coverage: '+p2+' pass, '+f2+' fail');
process.exit((globalThis.__f1||0)+f2?1:0);
