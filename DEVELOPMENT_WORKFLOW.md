# AUDIT_STANDARD.md — Tiêu chuẩn nhật ký kiểm toán
> Mọi thay đổi dữ liệu phải ghi nhận. Audit log không được sửa/xóa.

## 1. Ghi nhật ký
- `logAuditEvent(action, detail)` — ~226 điểm gọi trong toàn hệ thống.
- Mỗi sự kiện ghi: user, vai trò, thời gian, module, action, và detail (gồm old/new value khi áp dụng), thiết bị nếu có.

## 2. Hai tầng log
- `auditLog` — nhật ký cục bộ (giữ ~100 bản gần nhất khi save để giảm payload).
- `auditLogShared` — nhật ký toàn hệ thống, merge theo `_id` khi sync (union, giữ ~300-500 bản). Không mất, không sửa sự kiện cũ.

## 3. Bất biến
- Audit log **không được chỉnh sửa hay xóa** thủ công.
- Các sự kiện khôi phục cũng được log: `snapshot_restore`, `recycle_restore`.

## 4. Sự kiện bắt buộc log
- Tạo/sửa/xóa bản ghi tài chính (AP/AR/cashTxn).
- Khôi phục dữ liệu (snapshot/recycle).
- Thay đổi cấu hình quan trọng (tỷ giá, phân quyền).
- Duyệt/từ chối (workflow).

## 5. Kiểm thử
- Xác nhận thao tác xóa/sửa/khôi phục đều sinh audit event.
- Xác nhận auditLogShared merge không mất sự kiện khi sync nhiều thiết bị.
