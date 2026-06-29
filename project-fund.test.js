/* v3.09.52 — DATA PROTECTION CHECK (Mục 7): gate tự động trước release.
   Kiểm các đường có thể làm mất dữ liệu. FAIL = không được release. */
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
let pass=0,fail=0;const ok=(n,c,detail)=>{if(c)pass++;else{fail++;console.log('  ✗',n,detail?('— '+detail):'');}};

// 1. filterStateForUser KHÔNG được cắt field (phải là no-op return rawState)
const fsu=src.match(/function filterStateForUser\(rawState\)\{([\s\S]*?)\n\}/);
ok('filterStateForUser không cắt field (no-op)', fsu && /return rawState;/.test(fsu[1]) && !/ALL_DATA_FIELDS\.concat/.test(fsu[1]),
   'filterStateForUser vẫn còn logic cắt field!');

// 2. Không có S = filterStateForUser(...) tạo bản cụt rồi lưu (giờ filter no-op nên an toàn, nhưng cảnh báo nếu ai thêm filter mới gán S)
const badAssign=[...src.matchAll(/S\s*=\s*(filter|scrub|sanitize|strip)[A-Za-z]*\(/g)];
ok('Không có S = <filter cắt>(...) ngoài filterStateForUser', badAssign.every(m=>/filterStateForUser/.test(src.substr(m.index,40))),
   'có gán S = hàm lọc khác');

// 3. saveStateEncrypted phải có verify readback
ok('saveStateEncrypted có verify readback', /Verify thất bại|_readback/.test(src), 'thiếu verify sau ghi');

// 4. saveState phải có auto-snapshot
ok('saveState có auto-snapshot', /pushLocalSnapshot\(''\)/.test(src), 'thiếu auto-snapshot trước ghi');

// 5. Có guard chặn ghi state rỗng đè dữ liệu
ok('có guard chặn ghi state rỗng', /_stateLooksEmpty/.test(src) && /CHẶN.*rỗng|rỗng.*đè|từ chối ghi state rỗng/i.test(src), 'thiếu guard empty-state');

// 6. Snapshot ring buffer tồn tại
ok('có lớp snapshot rollback', /pushLocalSnapshot|restoreLocalSnapshot/.test(src), 'thiếu snapshot');

// 7. openModal/closeModal dọn DOM (chống id-ma)
ok('closeModal dọn modal-body', /closeModal[\s\S]{0,300}_b\.innerHTML=''/.test(src) || /XÓA nội dung modal khi đóng/.test(src), 'closeModal không dọn DOM');

console.log('data-protection-check: '+pass+' pass, '+fail+' fail');
if(fail>0){ console.log('\n🚫 RELEASE BỊ CHẶN — còn nguy cơ mất dữ liệu.'); process.exit(1); }
else console.log('\n✅ Data Protection Check PASS — cho phép release.');
