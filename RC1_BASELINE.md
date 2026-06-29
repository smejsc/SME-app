# SECURITY_STANDARD.md — Tiêu chuẩn bảo mật
> Mã hóa, xác thực, phân quyền truy cập.

## 1. Mã hóa dữ liệu (client-side)
- **AES-GCM** mã hóa toàn bộ dữ liệu phía client trước khi lưu localStorage / đẩy cloud.
- 1 **master key** AES-GCM mã hóa/giải mã mọi dữ liệu.
- Master key được **wrap** (bọc) bằng key dẫn xuất từ mật khẩu mỗi vai trò (AES key-wrap).
- Dẫn xuất key: **PBKDF2** (nhiều vòng lặp). Không lưu mật khẩu thô.

## 2. Xác thực
- Đăng nhập theo vai trò (admin + các vai trò NV) + Google SSO.
- **2FA TOTP** (RFC 6238). Cảnh báo khi truy cập từ domain không chính thức (chống phishing) — không nhập mật khẩu/2FA ở trang lạ.
- Session có thời hạn (`seahorse_session_start`).

## 3. Phân quyền (RBAC)
- Chi tiết: RBAC_STANDARD.md.
- **Nguyên tắc cốt lõi:** RBAC giới hạn XEM/THAO TÁC, **không bao giờ** thay đổi/xóa/làm mất dữ liệu. Che dữ liệu ở tầng UI (ẩn tab), không cắt State.

## 4. Dữ liệu nhạy cảm
- Không log mật khẩu/secret/token vào audit hoặc console.
- Attachments lưu Google Drive (có permissionTag), không nhúng dữ liệu nhạy cảm vào State thô không cần thiết.
- Chặn ghi state rỗng đè dữ liệu thật (`_stateLooksEmpty` guard).

## 5. Nội dung không xử lý
- Không tạo/giải thích mã độc, khai thác lỗ hổng, web giả mạo.
- Không nhúng bí mật (API key) vào client.

## 6. Kiểm thử bảo mật bắt buộc
- Kiểm tra phân quyền không rò rỉ dữ liệu chéo vai trò.
- Kiểm tra không có đường nào RBAC làm mất dữ liệu (rbac-data-integrity, rbac-no-dataloss).
- Kiểm tra verify-after-write hoạt động (không báo lưu thành công giả).
