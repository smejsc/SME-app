/* ============================================================
   SEAHORSE v3.04.35 — LAN "BẢN SẠCH" TỪ MÁY ADMIN SANG MÁY NV
   Nguyên tắc AN TOÀN TUYỆT ĐỐI: máy admin đã sạch (mỗi cặp giữ 1 bản
   = bản ĐÚNG). Script lấy khóa nội dung của bản admin ĐANG GIỮ làm
   "chân lý", rồi với các số HĐ trùng, CHẶN mọi biến thể desc KHÁC
   (chính là bản dư trên máy NV). KHÔNG tự đoán — KHÔNG chặn bản đang giữ.
   Chạy TRÊN MÁY ADMIN → SYNC. Máy NV: hard-refresh ×2 + Sync → tự sạch.
   2 BƯỚC: lần 1 xem → window.__SP_STEP=2 → dán lại (ghi + sync).
   ============================================================ */
(function(){
  if(typeof _contentKey!=='function' || typeof _purgedContent!=='function'){
    console.error('✗ App chưa v3.04.35. Deploy + hard-refresh ×2 trước.'); return;
  }
  // Danh sách số HĐ TỪNG bị trùng (chỉ xét các inv này cho an toàn).
  const DUP_INVS=['CSS5501730','CSS5501729','189','9116139','AFALINA04052026','CSS5501748','9115551','9118979','9119019','KATRAN09052026','392','142-2026'];
  const normInv=s=>String(s||'').split('/')[0].trim().toUpperCase();

  // 1) Khóa của bản admin ĐANG GIỮ, theo từng inv (chân lý)
  const keptByInv={};   // inv -> Set(contentKey đang giữ)
  const keptDesc={};    // inv -> [desc đang giữ]
  ['payables','opTransactions'].forEach(f=>{
    (S[f]||[]).forEach(r=>{
      const iv=normInv(r.invoiceNo);
      if(DUP_INVS.includes(iv)){
        (keptByInv[iv]=keptByInv[iv]||new Set()).add(_contentKey(r));
        (keptDesc[iv]=keptDesc[iv]||[]).push((r.desc||'').slice(0,45));
      }
    });
  });

  const STEP=(window.__SP_STEP||1);
  console.log('%c=== LAN BẢN SẠCH — BƯỚC '+STEP+(STEP===1?' (XEM)':' (GHI+SYNC)')+' ===','font-weight:bold;font-size:14px;color:'+(STEP===1?'#06c':'#c00'));
  console.log('Bản admin ĐANG GIỮ cho từng số HĐ trùng:');
  DUP_INVS.forEach(iv=>{
    const n=(keptByInv[iv]?keptByInv[iv].size:0);
    console.log('   inv='+iv+' : giữ '+n+' bản', (keptDesc[iv]||[]).map(d=>'\n        • '+d).join(''));
  });

  if(STEP===1){
    // chuẩn bị: lưu chân lý để bước 2 dùng
    window.__SP_KEPT = {};
    Object.keys(keptByInv).forEach(iv=>{ window.__SP_KEPT[iv]=[...keptByInv[iv]]; });
    console.log('%c→ Kiểm: mỗi inv nên GIỮ 1 bản (bản đúng). Nếu OK: gõ window.__SP_STEP=2; rồi dán lại.','background:#fee;padding:2px 6px;font-family:monospace');
    console.log('%c   (Bước 2 sẽ KHÔNG xóa gì trên máy admin — chỉ ghi "luật chặn biến thể khác" để máy NV Sync về tự dọn.)','color:#666');
    return;
  }

  // STEP 2 — ghi purgedContent cho các khóa KHÁC bản đang giữ.
  // Cơ chế: tạo "luật chặn theo inv" — máy NV khi enforcePurgedContent sẽ tự so:
  //   bản nào CÙNG inv trùng nhưng khóa KHÁC bản giữ admin → xóa. Ta hiện thực bằng cách
  //   ghi vào purgedContent một bản ghi đặc biệt {invRule:inv, keepKeys:[...]}.
  const kept=window.__SP_KEPT||{};
  const list=_purgedContent();
  let added=0;
  Object.keys(kept).forEach(iv=>{
    const ruleKey='INVRULE|'+iv;
    const existing=list.find(p=>p.key===ruleKey);
    if(existing){ existing.keepKeys=kept[iv]; existing.at=new Date().toISOString(); }
    else { list.push({key:ruleKey, invRule:iv, keepKeys:kept[iv], field:'', at:new Date().toISOString(), note:'Giữ bản đúng cho HĐ '+iv}); added++; }
  });
  const removed=(typeof enforcePurgedContent==='function')?enforcePurgedContent():0;
  try{ saveState(); }catch(e){}
  console.log('%c✓ Đã ghi '+added+' luật chặn (INVRULE) cho '+Object.keys(kept).length+' số HĐ · dọn '+removed+' bản.','color:green;font-weight:bold;font-size:14px');
  console.log('purgedContent:', (S.purgedContent||[]).length);
  console.log('%c⚠ BẤM SYNC NGAY. Máy NV: hard-refresh ×2 + Sync → tự xóa bản dư (giữ đúng bản admin).','color:#c00;font-weight:bold;font-size:13px');
})();
