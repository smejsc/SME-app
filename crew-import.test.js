/* v3.09.34 — test luồng "đã đối chiếu chủ tàu" cho chi dự kiến khi khóa sổ.
   Mô phỏng phần thuần của signLockOwnerReport / unlock (không DOM). */
let pass=0,fail=0; const eq=(n,g,e)=>{ if(JSON.stringify(g)===JSON.stringify(e))pass++; else{fail++;console.log('✗',n,'got',JSON.stringify(g),'exp',JSON.stringify(e));} };

// lock: budget của tàu+kỳ → _ownerReconciled=true; chi thực → _locked=true
function lockPeriod(txs, vids, month, signer){
  let lockedCount=0, reconciledCount=0;
  txs.forEach(t=>{
    if(vids.includes(t.vesselId) && String(t.date).slice(0,7)===month){
      if(t._isBudget){
        if(!t._ownerReconciled){ t._ownerReconciled=true; t._ownerReconciledPeriod=month; t._ownerReconciledBy=signer; reconciledCount++; }
        return;
      }
      if(!t._locked){ t._locked=true; t._lockedPeriod=month; lockedCount++; }
    }
  });
  return {lockedCount, reconciledCount};
}
function unlockPeriod(txs, vesselId, period){
  txs.forEach(t=>{
    if(t._locked && t.vesselId===vesselId && String(t._lockedPeriod||t.date).slice(0,7)===period){ t._locked=false; }
    if(t._isBudget && t._ownerReconciled && t.vesselId===vesselId && String(t._ownerReconciledPeriod||t.date).slice(0,7)===period){ t._ownerReconciled=false; }
  });
}

const txs=[
  {id:'a',vesselId:'V1',date:'2026-06-10',_isBudget:true},   // budget → reconciled
  {id:'b',vesselId:'V1',date:'2026-06-12',_isBudget:false},  // real → locked
  {id:'c',vesselId:'V1',date:'2026-07-01',_isBudget:true},   // khác kỳ → giữ nguyên
  {id:'d',vesselId:'V2',date:'2026-06-10',_isBudget:true},   // khác tàu → giữ nguyên
];
const r=lockPeriod(txs,['V1'],'2026-06','HANG');
eq('lockedCount',r.lockedCount,1);
eq('reconciledCount',r.reconciledCount,1);
eq('a reconciled',txs[0]._ownerReconciled,true);
eq('a not locked (budget)',!!txs[0]._locked,false);
eq('b locked',txs[1]._locked,true);
eq('c untouched (other period)',!!txs[2]._ownerReconciled,false);
eq('d untouched (other vessel)',!!txs[3]._ownerReconciled,false);

// re-lock idempotent
const r2=lockPeriod(txs,['V1'],'2026-06','HANG');
eq('relock no double',r2.reconciledCount,0);

// unlock reverts
unlockPeriod(txs,'V1','2026-06');
eq('a un-reconciled',!!txs[0]._ownerReconciled,false);
eq('b un-locked',!!txs[1]._locked,false);

console.log(`\nReconcile-flow: ${pass} pass, ${fail} fail`);
process.exit(fail?1:0);
