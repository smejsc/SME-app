/* ============================================================
   SỬA THUẾ SUẤT VAT NHẬP SAI DẠNG TỈ LỆ (0.08→8, 0.1→10)
   ------------------------------------------------------------
   Bối cảnh: lô import Excel ghi % VAT dạng tỉ lệ (0.08 thay vì 8,
   0.1 thay vì 10). App cũ hiểu 0.08 = 0,08% → VAT nhỏ hơn 100 lần.
   Script này tìm các khoản có vatPercent trong khoảng (0,1) — dấu
   hiệu chắc chắn của lỗi tỉ lệ — rồi nhân 100 + tính lại VAT, tổng.

   CÁCH DÙNG (máy admin, Console F12):
   1) Dán toàn bộ → Enter. Lần đầu CHỈ XEM (dry-run), in danh sách.
   2) Kiểm bảng. Nếu đúng, chạy lại:  fixVatRatio(true)
   3) Sau khi sửa: bấm Sync (push) để đẩy lên cloud.
   ============================================================ */
function fixVatRatio(apply){
  apply = apply===true;
  function fixList(list, kind){
    const hits=[];
    (list||[]).forEach(r=>{
      const vp = (typeof r.vatPercent==='number') ? r.vatPercent : parseFloat(r.vatPercent);
      // dấu hiệu lỗi tỉ lệ: 0 < vp < 1  (vd 0.08, 0.1, 0.05)
      if(isFinite(vp) && vp>0 && vp<1){
        const net = +(r.amountNet!=null?r.amountNet:r.amount) || 0;
        const newPct = Math.round(vp*100*100)/100;          // 0.08→8, 0.1→10
        const newVat = Math.round(net*newPct/100*100)/100;   // VND giữ nguyên cách làm tròn cũ
        const newGross = net + newVat;
        hits.push({r, kind, id:r.id, NCC:(r.partner||'').slice(0,26), hóa_đơn:r.invoiceNo||'',
                   net, '%_cũ':vp, '%_mới':newPct,
                   VAT_cũ:+r.vatAmount||0, VAT_mới:newVat,
                   tổng_cũ:+(r.amountGross||r.amount)||0, tổng_mới:newGross});
      }
    });
    return hits;
  }
  const hits = fixList(S.payables,'AP').concat(fixList(S.receivables,'AR'));
  console.log('===== SỬA THUẾ SUẤT VAT (tỉ lệ → %) =====');
  console.log('Số khoản phát hiện lỗi tỉ lệ (0<vp<1):', hits.length, apply?' | CHẾ ĐỘ: SỬA THẬT':' | CHẾ ĐỘ: chỉ xem (dry-run)');
  if(!hits.length){ console.log('✓ Không có khoản nào dạng tỉ lệ. (Nếu đã sửa rồi thì OK.)'); return; }
  console.table(hits.map(({r,...show})=>show));
  if(!apply){
    console.log('→ Kiểm bảng trên. Nếu đúng, chạy:  fixVatRatio(true)   rồi bấm Sync.');
    return;
  }
  // ÁP DỤNG
  let n=0;
  hits.forEach(h=>{
    const r=h.r;
    const net=h.net;
    r.vatPercent = h['%_mới'];
    r.vatAmount  = h.VAT_mới;
    r.amountGross= h.tổng_mới;
    r.amount     = h.tổng_mới;   // backward-compat: amount = gross
    try{ touchRecord(r); }catch(e){ r.updatedAt=new Date().toISOString(); }
    n++;
  });
  try{ saveState(); }catch(e){ console.warn('saveState:', e&&e.message); }
  try{ renderAll(); }catch(e){}
  try{ logAuditEvent('fix_vat_ratio',{count:n, by:actorName()}); }catch(e){}
  console.log(`✅ Đã sửa ${n} khoản (×100 + tính lại VAT/tổng). HÃY BẤM SYNC (push) để đẩy lên cloud.`);
}
// chạy dry-run ngay khi dán
fixVatRatio(false);
