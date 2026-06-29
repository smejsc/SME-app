# Hướng dẫn đẩy lên GitHub (repo PUBLIC)

## ✅ Đã dọn (an toàn public)
- Endpoint Apps Script thật → đã xóa (`COMPANY_SCRIPT_URL=''`).
- Email + biệt danh cá nhân (FAMILY) → đã xóa.
- Email NV thật dùng làm ví dụ → đổi sang `@example.com`.
- `.gitignore` loại `snapshots/`, `*.bak`, file dữ liệu/backup thật.

## ⚠️ KHÔNG bao giờ đưa lên repo public
- Thư mục `snapshots/` và mọi file `.bak` (chứa bản cũ CÓ endpoint/dữ liệu thật).
- File export dữ liệu thật (.json/.xlsx danh sách NV, thuyền viên, lương).
- URL Apps Script, mật khẩu, token.

## Các bước push (chạy tại thư mục repo, KHÔNG chứa snapshots/)
```bash
# 1. Khởi tạo (nếu repo mới)
git init
git branch -M main

# 2. Kiểm tra .gitignore đã loại file nhạy cảm
cat .gitignore

# 3. Add + kiểm tra KHÔNG có file nhạy cảm trong danh sách
git add .
git status            # ← xem kỹ, KHÔNG được có *.bak, snapshots/, file dữ liệu thật

# 4. Quét secret lần cuối TRƯỚC khi commit
node tests/no-secrets.test.js    # phải PASS

# 5. Commit + push
git commit -m "Seahorse Manager ERP v3.09.54"
git remote add origin https://github.com/<tài-khoản>/<repo>.git
git push -u origin main
```

## Quan trọng về LỊCH SỬ Git
Nếu đã LỠ commit file có secret trước đó: xóa file ở commit mới **KHÔNG đủ** — secret vẫn nằm trong lịch sử. Phải:
- Tạo repo MỚI và chỉ commit bản đã dọn (khuyến nghị — đơn giản nhất), HOẶC
- Dùng `git filter-repo`/BFG để xóa khỏi lịch sử, rồi **đổi endpoint Apps Script** (coi như đã lộ).

## Sau khi public
- Endpoint Apps Script cũ (đã từng nhúng) nên coi là đã lộ → tạo deployment Apps Script mới, cập nhật URL khi triển khai nội bộ.
- Mã nguồn public an toàn vì bảo mật nằm ở mật khẩu + mã hóa AES + 2FA (Kerckhoffs).
