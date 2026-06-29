const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const mk=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',textContent:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,closest:()=>null,dataset:{}});
const doc={getElementById:()=>mk(),querySelector:()=>mk(),querySelectorAll:()=>[],createElement:()=>mk(),addEventListener:noop,body:mk(),head:mk(),documentElement:mk(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:''},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addEventListener:noop}),history:{},performance:{now:()=>0},addEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('  x',n);}};
// user NV chỉ có tab hrm, nhưng State có creditFacilities + materials + payrollConfig (của người khác)
vm.runInContext("CURRENT_ROLE='user'; CURRENT_USER={id:'nv',name:'NV',tabs:['hrm']};", ctx);
const raw={creditFacilities:[{id:'CF-1',limit:1e11}], materials:[{id:'M1'}], payrollConfig:{x:1}, hrEmployees:[{id:'E1'}]};
const out=vm.runInContext('filterStateForUser('+JSON.stringify(raw)+')', ctx);
ok('NV GIỮ creditFacilities (không mất dù không có tab banking)', out.creditFacilities && out.creditFacilities.length===1);
ok('NV GIỮ materials', out.materials && out.materials.length===1);
ok('NV GIỮ payrollConfig', out.payrollConfig && out.payrollConfig.x===1);
ok('NV GIỮ hrEmployees', out.hrEmployees && out.hrEmployees.length===1);
ok('filterStateForUser trả NGUYÊN object (không tạo bản cụt)', out===JSON.parse(JSON.stringify(raw)) || JSON.stringify(out)===JSON.stringify(raw));
console.log('rbac-no-dataloss: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
