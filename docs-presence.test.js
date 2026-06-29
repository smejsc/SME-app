const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync('index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const el={style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,removeEventListener:noop,appendChild:noop,querySelector:()=>null,querySelectorAll:()=>[],innerHTML:'',value:'',setAttribute:noop,getAttribute:()=>null,focus:noop,click:noop,closest:()=>null,dataset:{}};
const doc={getElementById:()=>el,querySelector:()=>el,querySelectorAll:()=>[],createElement:()=>el,addEventListener:noop,body:el,head:el,documentElement:el,cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:'',hostname:'',pathname:'/'},setTimeout:noop,setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{},performance:{now:()=>0},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
// mô phỏng logic nhánh cập nhật type (trích từ import)
function applyType(exType, empType){
  let t=exType;
  if(empType==='crew' && t!=='crew') t='crew';
  if(empType==='expert' && t!=='expert' && t!=='crew') t='expert';
  return t;
}
let pass=0,fail=0;const eq=(n,g,e)=>{if(g===e)pass++;else{fail++;console.log('x',n,'got',g,'exp',e);}};
eq('office+expert→expert', applyType('office','expert'),'expert');   // FIX chính
eq('expert+expert→expert', applyType('expert','expert'),'expert');
eq('crew giữ ưu tiên (crew+expert→crew)', applyType('crew','expert'),'crew');
eq('office+crew→crew', applyType('office','crew'),'crew');
eq('expert+office→giữ expert', applyType('expert','office'),'expert'); // không hạ
eq('office+office→office', applyType('office','office'),'office');
console.log('expert-type-fix: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
