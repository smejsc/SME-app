/* v3.09.38 — test HR import chấm công cả công ty → gom theo tàu/VP → đổ vào kỳ lương. */
const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(__dirname+'/../index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};const mkEl=()=>({style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},appendChild:noop,insertBefore:noop,setAttribute:noop,getAttribute:()=>null,addEventListener:noop,removeEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],remove:noop,value:'',textContent:'',innerHTML:'',dataset:{},focus:noop,click:noop,closest:()=>null,getContext:()=>({}),options:[]});
const doc={getElementById:()=>mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener:noop,body:mkEl(),head:mkEl(),documentElement:mkEl(),cookie:''};
const ctx={console,document:doc,localStorage:{getItem:()=>null,setItem:noop,removeItem:noop},navigator:{userAgent:'n'},location:{href:'',hostname:'',pathname:'/'},setTimeout:f=>{try{f&&f()}catch(e){}},setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{},performance:{now:()=>0},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('x',n);}};
vm.runInContext(`
  CURRENT_ROLE='admin'; CURRENT_USER={id:'a',name:'admin'}; S=S||{};
  S.hrEmployees=[{id:'E1',smartId:'SME0010',fullName:'Tran Trong Khiem',type:'crew',linkVesselId:'V1'},{id:'E2',smartId:'SME0011',fullName:'Nguyen Ba Dung',type:'crew',linkVesselId:'V1'},{id:'E3',smartId:'SME0003',fullName:'Bui The Phong',type:'office'}];
  S.vessels=[{id:'V1',name:'M/V Geo Mariner'}]; S.opVessels=[]; S.crewTimesheets=[];
  S.payrollPeriods=[{id:'P1',period:'2026-06',profile:'crew',status:'draft',rows:[{empId:'E1',inputs:{},result:{}},{empId:'E2',inputs:{},result:{}}]},{id:'P2',period:'2026-06',profile:'office',status:'draft',rows:[{empId:'E3',inputs:{},result:{}}]}];
  openModal=function(){}; toast=function(){};
  document.getElementById=function(id){ if(id==='hrts-imp-period') return {value:'2026-06'}; return {style:{},classList:{add(){},remove(){}},innerHTML:'',value:'',click(){}}; };
`, ctx);
ctx.window._hrTsImportDetail=[
  {emp:{id:'E1',smartId:'SME0010',fullName:'Tran Trong Khiem'},vessel:{id:'V1',name:'M/V Geo Mariner'},workDays:26,otHours:10,note:'',kind:'crew'},
  {emp:{id:'E2',smartId:'SME0011',fullName:'Nguyen Ba Dung'},vessel:{id:'V1',name:'M/V Geo Mariner'},workDays:24,otHours:5,note:'',kind:'crew'},
  {emp:{id:'E3',smartId:'SME0003',fullName:'Bui The Phong'},vessel:null,isOffice:true,workDays:22,otHours:0,note:'',kind:'office'}
];
ctx.hrTimesheetImportApply();
const ts=vm.runInContext("HRService.timesheets()",ctx);
ok('tao 2 bang timesheet', ts.length===2);
ok('co bang tau V1', ts.some(t=>t.vesselId==='V1'));
ok('co bang van phong (vesselId rong)', ts.some(t=>t.vesselId===''));
ok('moi bang status approved', ts.every(t=>t.status==='approved'));
ok('bang tau co 2 NV', (ts.find(t=>t.vesselId==='V1').rows||[]).length===2);
const p=vm.runInContext("S.payrollPeriods",ctx);
const e1=p[0].rows.find(r=>r.empId==='E1');
ok('crew E1 do cong vao G', e1.inputs.G===26);
ok('crew E1 do OT vao M', e1.inputs.M===10);
const e3=p[1].rows.find(r=>r.empId==='E3');
ok('office E3 do cong vao M', e3.inputs.M===22);
ok('co tinh lai (result object)', !!e1.result);
// _htsNum
ok('_htsNum 26', ctx._htsNum('26')===26);
ok('_htsNum "1,5"', ctx._htsNum('1,5')===1.5);
ok('_htsNum rac', ctx._htsNum('abc')===0);
console.log('\nHR-timesheet-import: '+pass+' pass, '+fail+' fail');
process.exit(fail?1:0);
