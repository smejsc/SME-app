# RELEASE_CHECKLIST.md — BẮT BUỘC đọc & làm trước mỗi lần bump bản mới
> Claude PHẢI đọc file này TRƯỚC khi tăng version. Làm đúng TỪNG bước, theo thứ tự. Không bỏ bước. Không tự ý thay đổi ngoài yêu cầu của Sếp.

---

## 0. NGUYÊN TẮC VÀNG (đọc đầu tiên)
- **CHỈ làm đúng việc Sếp yêu cầu.** KHÔNG tự ý xóa/đổi thứ khác (URL, email, tính năng, dữ liệu cá nhân...) dù nghĩ là "tốt hơn / an toàn hơn". Nếu thấy nên đổi → HỎI trước, không tự quyết.
- **App nội bộ đang chạy thật:** ưu tiên số 1 là NV vẫn dùng được. Không thay đổi nào được làm NV đăng nhập lỗi / mất kết nối.
- **KHÔNG đụng** các giá trị cấu hình vận hành trừ khi Sếp yêu cầu rõ:
  - `COMPANY_SCRIPT_URL` (URL Apps Script — xóa = NV không vào được).
  - Khối `FAMILY` (lời chào con cái).
  - Email/placeholder/gợi ý (chỉ là gợi ý, không cần đụng).
- Nếu phân vân "có nên đổi cái này không" → mặc định **KHÔNG**, và hỏi Sếp.

## 1. TRƯỚC KHI SỬA
- [ ] Đọc các tài liệu chuẩn liên quan trong `/docs/` (ARCHITECTURE, RC1_BASELINE, CODING_STANDARD, DATA_PROTECTION_STANDARD, RBAC_STANDARD, BUSINESS_RULES tùy việc).
- [ ] Snapshot bản hiện tại: `cp index.html /home/claude/snapshots/index.html.<VERSION-HIỆN-TẠI>.bak` TRƯỚC khi sửa.
- [ ] Hiểu rõ yêu cầu của Sếp. Nếu mơ hồ → hỏi lại, không đoán.

## 2. KHI SỬA
- [ ] One-Commit-One-Change: mỗi lần sửa một việc rõ ràng.
- [ ] Chuỗi có `\n`/`${}`/template literal → sửa bằng script (python `.replace`), không thay tay.
- [ ] Tuân thủ RC-1: KHÔNG sửa trực tiếp Core/6 Service/RBAC/SSO/Audit/Email. Đổi nền → ADR + hỏi Sếp.
- [ ] RBAC/Filter KHÔNG được cắt field/làm mất dữ liệu. State luôn đầy đủ.

## 3. CỔNG KIỂM TRA (chạy HẾT, phải PASS — không được bỏ)
```bash
cd /home/claude/work
# a. Compile JS
python3 -c "import re;open('/tmp/b.js','w').write(re.search(r'<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)</script>', open('index.html',encoding='utf-8').read()).group(1))" && node --check /tmp/b.js
# b. Cân bằng thẻ div = 0
python3 -c "import re;h=open('index.html',encoding='utf-8').read();print('div:', len(re.findall(r'<div\b',h))-len(re.findall(r'</div>',h)))"
# c. Backtick chẵn
python3 -c "c=open('/tmp/b.js',encoding='utf-8').read();print('backtick:', 'even' if c.count(chr(96))%2==0 else 'ODD')"
# d. Load-test (chạy top-to-bottom không ReferenceError)
node /tmp/loadtest2.js 2>&1 | head -1
# e. TOÀN BỘ test suite
for t in tests/*.test.js; do echo -n "$(basename $t): "; node "$t" 2>&1 | tail -1; done
```
- [ ] Compile OK
- [ ] div = 0
- [ ] backtick = even
- [ ] load-test: không ReferenceError
- [ ] **data-protection-check.test.js PASS** (gate chống mất dữ liệu — FAIL thì DỪNG)
- [ ] **docs-presence.test.js PASS** (đủ tài liệu)
- [ ] Mọi test khác PASS (0 fail)

## 4. KIỂM TÁC ĐỘNG (không chỉ phần vừa sửa)
- [ ] Chủ động tìm: mất dữ liệu, ID trùng, ghi đè State, race condition, dead code.
- [ ] So sánh với bản trước để biết CHÍNH XÁC đã đổi gì:
```bash
diff /home/claude/snapshots/index.html.<BẢN-TRƯỚC>.bak index.html | grep -E "^<|^>" | grep -v APP_VERSION
```
- [ ] Xác nhận KHÔNG có thay đổi ngoài ý muốn (đặc biệt: COMPANY_SCRIPT_URL, FAMILY, logic đăng nhập, công thức nghiệp vụ).

## 5. BUMP VERSION (chỉ khi 1-4 đã PASS)
- [ ] Tăng version ở **CẢ 3 file**:
  - `index.html`: `const APP_VERSION='X.XX.XX'`
  - `service-worker.js`: `const SW_VERSION = 'vX.XX.XX'`
  - `version.json`: `"version"`, `"swVersion"`, `"notes"` (mô tả rõ đã sửa gì)
- [ ] 3 version PHẢI KHỚP nhau.
- [ ] Snapshot bản mới: `cp index.html /home/claude/snapshots/index.html.<VERSION-MỚI>.bak`
- [ ] Copy ra `/mnt/user-data/outputs/` + present_files.

## 6. TỰ RÀ (Self Review) — nếu có "CÓ" thì BÁO Sếp trước khi giao
- [ ] Có làm NV không đăng nhập được không? (kiểm COMPANY_SCRIPT_URL còn nguyên)
- [ ] Có nguy cơ mất dữ liệu không?
- [ ] Có đổi gì ngoài yêu cầu của Sếp không?
- [ ] Có vi phạm RC-1 không?
- [ ] Có regression không?

## 7. GIAO CHO SẾP
- [ ] Nói RÕ: bump lên bản nào, đã sửa ĐÚNG những gì (ngắn gọn), gate đã pass.
- [ ] Nếu chỉ deploy 3 file → nhắc Sếp up đè `index.html` + `service-worker.js` + `version.json`.

---
## GHI NHỚ TỪ LỖI THỰC TẾ (đừng lặp lại)
- v3.09.54: tự ý xóa COMPANY_SCRIPT_URL "để bảo mật public" → NV không vào được app. SAI. Bài học: app nội bộ ưu tiên NV dùng được; bảo mật nằm ở mật khẩu + mã hóa + 2FA, không phải giấu URL.
- Tự ý xóa email/lời chào con cái mà Sếp không yêu cầu. SAI. Bài học: không đụng cái Sếp không bảo đụng.
