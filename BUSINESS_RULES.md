# EMAIL_STANDARD.md — Tiêu chuẩn Email Service
> Email Framework thuộc RC-1 (không sửa trực tiếp, chỉ thêm).

## 1. Thành phần
- `emailQueue` — hàng đợi email chờ gửi.
- `emailLog` — lịch sử đã gửi.
- `emailSettings` — cấu hình (người gửi, SMTP/Apps Script).
- `emailTemplates` — mẫu email, subject/body có biến `{{...}}`.
- `emailDrafts` — nháp.
- Tất cả thuộc nhóm **admin-only** (không map tab NV).

## 2. Xử lý hàng đợi
- `emailQueueProcess()` (async) xử lý hàng đợi, gửi qua Google Apps Script.
- Gửi thất bại → giữ trong queue + ghi log lỗi, không mất email.

## 3. Quy tắc
- Không nhúng bí mật vào template/client.
- Không gửi dữ liệu nhạy cảm ngoài phạm vi người nhận hợp lệ.
- Mọi gửi/queue ghi vào emailLog (audit).

## 4. Quyền
- Chỉ admin quản lý settings/templates/queue.
- Email Service là framework RC-1: thay đổi cơ chế → ADR + phê duyệt.

## 5. Kiểm thử
- Queue không mất email khi gửi lỗi/mất mạng.
- Template render biến đúng; không lộ biến chưa thay.
