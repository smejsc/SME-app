/* v3.09.53 — Gate: 10 tài liệu chuẩn phải tồn tại trong /docs và không rỗng. */
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','docs');
const required=['ARCHITECTURE.md','RC1_BASELINE.md','CODING_STANDARD.md','SECURITY_STANDARD.md','BUSINESS_RULES.md','DEVELOPMENT_WORKFLOW.md','RBAC_STANDARD.md','DATA_PROTECTION_STANDARD.md','EMAIL_STANDARD.md','AUDIT_STANDARD.md','RELEASE_CHECKLIST.md'];
let pass=0,fail=0;
required.forEach(f=>{
  const p=path.join(dir,f);
  try{
    const c=fs.readFileSync(p,'utf8');
    if(c.trim().length>200){ pass++; } else { fail++; console.log('  ✗ rỗng/ngắn:',f); }
  }catch(e){ fail++; console.log('  ✗ THIẾU:',f); }
});
// workflow phải có 2 checklist bắt buộc
try{
  const wf=fs.readFileSync(path.join(dir,'DEVELOPMENT_WORKFLOW.md'),'utf8');
  if(/CHECKLIST ĐẦU PHIÊN/.test(wf)) pass++; else { fail++; console.log('  ✗ thiếu checklist đầu phiên'); }
  if(/CẬP NHẬT TÀI LIỆU/.test(wf)) pass++; else { fail++; console.log('  ✗ thiếu checklist cập nhật docs'); }
}catch(e){ fail++; }
console.log('docs-presence: '+pass+' pass, '+fail+' fail');
if(fail>0){ console.log('🚫 Thiếu tài liệu chuẩn — bổ sung trước khi release.'); process.exit(1); }
