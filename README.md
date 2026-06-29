# Seahorse Manager ERP

Hệ thống ERP nội bộ quản lý vận hành tàu, kế toán, nhân sự, kho và tài chính — đóng gói dưới dạng ứng dụng web single-file (PWA, hoạt động offline).

## ⚠️ Lưu ý triển khai
Mã nguồn công khai này **KHÔNG chứa** cấu hình kết nối thật (endpoint đồng bộ, email nội bộ). Trước khi dùng nội bộ, cần cấu hình:
- `COMPANY_SCRIPT_URL` — URL Google Apps Script của tổ chức (để trống → app hỏi khi setup).
- Các tài khoản/phân quyền tạo qua giao diện admin.

Bảo mật dựa trên: mật khẩu + mã hóa AES-GCM client-side + 2FA TOTP. Không nhúng bí mật trong mã nguồn.

## Cấu trúc
- `index.html` — toàn bộ ứng dụng (UI + logic + 6 Service).
- `service-worker.js` — PWA/offline.
- `version.json` — kênh cập nhật.
- `docs/` — tài liệu chuẩn (kiến trúc, RC-1, coding/security/RBAC/data-protection standard, business rules, workflow).
- `tests/` — bộ kiểm thử tự động (chạy bằng Node).
- `adr/` — Architecture Decision Records.

## Tài liệu
Đọc `docs/README.md` trước khi phát triển. Quy trình bắt buộc trong `docs/DEVELOPMENT_WORKFLOW.md`.

## Nguyên tắc cao nhất
**Data First** — không lỗi phần mềm nào được làm mất dữ liệu nghiệp vụ. Xem `docs/DATA_PROTECTION_STANDARD.md`.

## Kiểm thử
```bash
for t in tests/*.test.js; do node "$t"; done
```
Gate trước release: `node tests/data-protection-check.test.js` phải PASS.

## Giấy phép
Phần mềm nội bộ. Bản quyền thuộc Seahorse Marine & Energy JSC. Không có giấy phép sử dụng lại trừ khi được cấp phép.
