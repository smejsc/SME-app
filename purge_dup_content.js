/* ============================================================
   SEAHORSE v3.04.34 — XÓA VĨNH VIỄN 12 PHIẾU TRÙNG (theo NỘI DUNG)
   Dùng purgeContent → chặn theo khóa inv|val|date|ccy|desc → lan MỌI máy
   qua cloud (purgedContent ∈ SHARED_FIELDS). Bản trùng KHÔNG sống lại
   dù máy NV có ID khác. CHẠY TRÊN MÁY ADMIN (Cuong) rồi BẮT BUỘC SYNC.
   2 BƯỚC: lần 1 xem → window.__PC_STEP=2 → dán lại (purge).
   YÊU CẦU app ≥ v3.04.34 (có hàm purgeContent).
   ============================================================ */
(function(){
  if(typeof purgeContent!=='function' || typeof _contentKey!=='function'){
    console.error('✗ App chưa phải v3.04.34 (thiếu purgeContent). Hãy deploy bản mới + hard-refresh ×2 trước.');
    return;
  }
  const dupInvs=['CSS5501730','CSS5501729','189','9116139','AFALINA04052026','CSS5501748','9115551','9118979','9119019','KATRAN09052026','392','142-2026'];
  const normInv=s=>String(s||'').split('/')[0].trim().toUpperCase();
  const hasKatran=r=>/katran/i.test((r.desc||'')+(r._descVi||''));
  const hasMV=r=>/\bMV\b|afalina|katran|china port|dong xuyen|vung tau/i.test((r.desc||'')+(r._descVi||''));
  const hasVN=r=>/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(r.desc||'');

  // gom các cặp
  const groups={};
  ['payables','opTransactions'].forEach(store=>{
    (S[store]||[]).forEach(r=>{
      if(dupInvs.includes(normInv(r.invoiceNo))){
        const k=normInv(r.invoiceNo)+'|'+Math.round(+r.amountGross||+r.amount||0)+'|'+(r.ccy||r.currency);
        (groups[k]=groups[k]||[]).push({store,r});
      }
    });
  });

  // tiêu chí GIỮ: ưu tiên bản có tên tàu (MV/China/Dong Xuyen); nếu hòa, giữ bản tiếng Việt gốc;
  //   nếu vẫn hòa, giữ bản đầu. Các bản còn lại → purge.
  function pickKeep(items){
    let s=items.slice().sort((a,b)=>{
      const sa=(hasMV(a.r)?2:0)+(hasVN(a.r)?1:0);
      const sb=(hasMV(b.r)?2:0)+(hasVN(b.r)?1:0);
      return sb-sa;
    });
    return {keep:s[0], dels:s.slice(1)};
  }

  const STEP=(window.__PC_STEP||1);
  console.log('%c=== PURGE TRÙNG THEO NỘI DUNG — BƯỚC '+STEP+(STEP===1?' (XEM)':' (THỰC HIỆN)')+' ===','font-weight:bold;font-size:14px;color:'+(STEP===1?'#06c':'#c00'));

  let plan=[];
  Object.entries(groups).forEach(([k,items])=>{
    if(items.length<2){
      console.log('  • '+k+' : chỉ 1 bản (đã sạch) — bỏ qua');
      return;
    }
    const {keep,dels}=pickKeep(items);
    console.log('%c'+k+' ('+items.length+' bản)','font-weight:bold');
    console.log('   GIỮ  ['+keep.store+'] '+keep.r.id+' | '+(keep.r.desc||'').slice(0,42));
    dels.forEach(d=>{ console.log('   XÓA  ['+d.store+'] '+d.r.id+' | '+(d.r.desc||'').slice(0,42)); plan.push(d); });
  });

  console.log('%c--- Tổng cần purge: '+plan.length+' bản ---','font-weight:bold');

  if(STEP===1){
    window.__PC_PLAN=plan.map(d=>({store:d.store,id:d.r.id,key:_contentKey(d.r),desc:(d.r.desc||'').slice(0,40)}));
    console.log('%c→ Ghi nhớ '+window.__PC_PLAN.length+' bản. Nếu ĐÚNG (giữ bản tên tàu, xóa bản còn lại):','color:#06c;font-weight:bold');
    console.log('%c   gõ window.__PC_STEP=2; rồi dán lại script để PURGE.','background:#fee;padding:2px 6px;font-family:monospace');
    return;
  }

  // STEP 2 — purge theo nội dung + dọn + tombstone
  const items=window.__PC_PLAN||[];
  if(!items.length){ console.error('Chưa có kế hoạch. Chạy BƯỚC 1.'); return; }
  // rescue
  try{
    const snap=items.map(x=>{const a=x.store==='payables'?S.payables:S.opTransactions; const r=a.find(z=>z.id===x.id); return r?JSON.parse(JSON.stringify(r)):null;}).filter(Boolean);
    localStorage.setItem('seahorse_rescue_purgeContent', JSON.stringify({at:new Date().toISOString(),records:snap}));
    console.log('💾 Rescue copy '+snap.length+' bản (seahorse_rescue_purgeContent).');
  }catch(e){console.warn('rescue lỗi',e);}

  let reg=0;
  items.forEach(x=>{
    const a=x.store==='payables'?S.payables:S.opTransactions;
    const r=a.find(z=>z.id===x.id);
    if(r){ if(purgeContent(r, x.store)) reg++; }
  });
  const removed=enforcePurgedContent();
  try{ saveState(); }catch(e){console.warn('saveState lỗi',e);}
  console.log('%c✓ Đăng ký purge '+reg+' khóa nội dung · dọn '+removed+' bản ghi.','color:green;font-weight:bold;font-size:14px');
  console.log('purgedContent hiện tại:', (S.purgedContent||[]).length);
  console.log('%c⚠ BẮT BUỘC BẤM SYNC NGAY — đẩy purgedContent lên cloud để LAN sang máy NV. Máy NV chỉ cần Sync là tự sạch.','color:#c00;font-weight:bold;font-size:13px');
})();
