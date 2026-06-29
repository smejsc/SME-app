/* v3.09.49 CRITICAL RUNTIME AUDIT — hồi quy: modal-clear, verify-readback, save persist. */
const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(__dirname+'/../index.html','utf8').match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];
const noop=()=>{};
// DOM mock với modal-body/foot/title thật (theo dõi innerHTML)
function mkEl(){return {_h:'',_id:'',style:{},classList:{_s:new Set(),add(x){this._s.add(x)},remove(x){this._s.delete(x)},toggle:noop,contains(x){return this._s.has(x)}},addEventListener:noop,removeEventListener:noop,appendChild:noop,insertBefore:noop,querySelector:()=>null,querySelectorAll:()=>[],setAttribute:noop,getAttribute:()=>null,focus:noop,click:noop,closest:()=>null,dataset:{},get innerHTML(){return this._h},set innerHTML(v){this._h=v},get textContent(){return this._tc||''},set textContent(v){this._tc=v},value:'',checked:false};}
const els={};
['modal','modal-body','modal-foot','modal-title'].forEach(id=>{els[id]=mkEl();els[id]._id=id;});
const doc={getElementById:(id)=>els[id]||mkEl(),querySelector:()=>mkEl(),querySelectorAll:()=>[],createElement:()=>mkEl(),addEventListener:noop,body:mkEl(),head:mkEl(),documentElement:mkEl(),cookie:''};
let LS={};
const ctx={console,document:doc,localStorage:{getItem:(k)=>LS[k]!==undefined?LS[k]:null,setItem:(k,v)=>{LS[k]=String(v)},removeItem:(k)=>{delete LS[k]}},navigator:{userAgent:'n'},location:{href:'',hostname:'',pathname:'/'},setTimeout:(f)=>{try{f&&f()}catch(e){}},setInterval:noop,clearTimeout:noop,fetch:()=>Promise.resolve({ok:true,json:()=>Promise.resolve({})}),alert:noop,confirm:()=>true,prompt:()=>'',crypto:{getRandomValues:a=>a},URLSearchParams,TextEncoder,TextDecoder,Intl,matchMedia:()=>({matches:false,addListener:noop,addEventListener:noop}),IntersectionObserver:function(){return{observe:noop,disconnect:noop}},MutationObserver:function(){return{observe:noop,disconnect:noop}},ResizeObserver:function(){return{observe:noop,disconnect:noop}},getComputedStyle:()=>({getPropertyValue:()=>''}),history:{},performance:{now:()=>Date.now()},addEventListener:noop,removeEventListener:noop};
ctx.window=ctx;ctx.self=ctx;ctx.globalThis=ctx;vm.createContext(ctx);
vm.runInContext(code,ctx,{filename:'i',timeout:8000});
vm.runInContext("toast=function(m){globalThis.__toast=m;}; applyModalWideMode=function(){}; upgradeNumericInputs=function(){}; checkForUpdate=function(){};", ctx);
let pass=0,fail=0;const ok=(n,c)=>{if(c)pass++;else{fail++;console.log('  x',n);}};

// 1. openModal ghi nội dung, closeModal XÓA sạch (chống id-ma)
vm.runInContext("openModal('T','<input id=\"x-test\" value=\"1\">','<button>ok</button>');", ctx);
ok('openModal ghi body', els['modal-body']._h.includes('x-test'));
ok('openModal hiện modal', els['modal'].classList.contains('show'));
vm.runInContext("closeModal();", ctx);
ok('closeModal XÓA body (hết id-ma)', els['modal-body']._h==='');
ok('closeModal XÓA foot', els['modal-foot']._h==='');
ok('closeModal ẩn modal', !els['modal'].classList.contains('show'));

// 2. openModal lần 2 không còn dấu vết form cũ
vm.runInContext("openModal('A','<input id=\"form-a\">',''); ", ctx);
vm.runInContext("openModal('B','<input id=\"form-b\">',''); ", ctx);
ok('mở form B không còn id form A', !els['modal-body']._h.includes('form-a') && els['modal-body']._h.includes('form-b'));

// 3. verify-readback: ghi OK thì _lastSaveVerifiedAt cập nhật
LS={}; 
vm.runInContext(`
  CRYPTO_KEY={k:1}; _storeKeyForUser=function(){return 'seahorse_test';};
  encryptJSON=async function(s){return {ct:'x'.repeat(50)};};
  _stateLooksEmpty=function(){return false;};
  scheduleAutoSync=function(){};
  S={a:1};
`, ctx);
const p=vm.runInContext("saveStateEncrypted()", ctx);
ok('saveStateEncrypted trả promise', p && typeof p.then==='function');

console.log('runtime-audit: '+pass+' pass, '+fail+' fail');
module.exports={pass,fail};
// async verify check
p.then(()=>{
  const verified = vm.runInContext("window._lastSaveVerifiedAt>0", ctx);
  if(!verified){ console.log('  x verify-readback không set mốc'); process.exit(1); }
  console.log('  ✓ verify-readback set mốc thành công');
  process.exit(fail?1:0);
}).catch(e=>{ console.log('  x saveStateEncrypted throw:',e.message); process.exit(1); });
