/* v3.09.51 — RBAC KHÔNG ĐƯỢC LÀM MẤT DỮ LIỆU. Unit test bắt buộc.
   1. filterStateForUser KHÔNG cắt field nào (bảo toàn tuyệt đối).
   2. Cảnh báo nếu có field nghiệp vụ mới chưa map quyền (không âm thầm bỏ). */
const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(__dirname+'/../index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const mk=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',textContent:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,closest:()=>null,dataset:{}});
const doc={getElementById:()=>mk(),querySelector:()=>mk(),querySelectorAll:()=>[],createElement:()=>mk(),addEventListener:noop,body:mk(),head:mk(),documentElement:mk(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:''},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addEventListener:noop}),history:{},performance:{now:()=>0},addEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('  x',n);}};

// 1. Với MỌI role, filterStateForUser KHÔNG được làm mất field nào
const roles=[['admin',[]],['user',['hrm']],['user',['banking']],['user',['inventory']],['user',['salary_fund']],['user',[]]];
const sample={creditFacilities:[{id:'CF'}],materials:[{id:'M'}],payrollConfig:{a:1},positions:[{id:'P'}],hrEmployees:[{id:'E'}],loanAutoCollect:[{id:'L'}],stockDocs:[{id:'S'}],receivables:[{id:'R'}]};
roles.forEach(([role,tabs])=>{
  vm.runInContext(`CURRENT_ROLE='${role}'; CURRENT_USER={id:'u',tabs:${JSON.stringify(tabs)}};`, ctx);
  const out=vm.runInContext('filterStateForUser('+JSON.stringify(sample)+')', ctx);
  const lost=Object.keys(sample).filter(k=>JSON.stringify(out[k])!==JSON.stringify(sample[k]));
  ok(`[${role}/${tabs.join(',')||'no-tab'}] KHÔNG mất field`, lost.length===0);
});

// 2. Unit test bắt buộc: KHÔNG còn field nghiệp vụ nào chưa map quyền
vm.runInContext("CURRENT_ROLE='admin';", ctx);
const unmapped=vm.runInContext('_auditUnmappedFields()', ctx);
ok('Không còn field nghiệp vụ chưa map quyền: '+JSON.stringify(unmapped), unmapped.length===0);
if(unmapped.length>0) console.log('    ⚠ FIELD CHƯA MAP (phải thêm vào TAB_TO_FIELDS hoặc admin-only):', unmapped);

console.log('rbac-data-integrity: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
