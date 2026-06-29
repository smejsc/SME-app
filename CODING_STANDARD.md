# /docs — Tài liệu chuẩn Seahorse Manager ERP
> Nguồn sự thật chính thức. Đọc TRƯỚC mỗi phiên (xem DEVELOPMENT_WORKFLOW.md mục A). Cập nhật SAU mỗi thay đổi kiến trúc/quy tắc (mục E).

## Danh sách tài liệu bắt buộc
| File | Nội dung |
|---|---|
| ARCHITECTURE.md | Kiến trúc 3 lớp, 6 Service, modal đơn, lưu trữ/sync |
| RC1_BASELINE.md | Baseline đông cứng — cái gì KHÔNG được sửa trực tiếp |
| CODING_STANDARD.md | DOM-State, save pipeline, quy ước code, cổng chất lượng |
| SECURITY_STANDARD.md | Mã hóa AES, PBKDF2, 2FA TOTP, dữ liệu nhạy cảm |
| BUSINESS_RULES.md | P&L, apCountsInPL, thuế/lương 2026, HR, quỹ, hạn mức |
| DEVELOPMENT_WORKFLOW.md | Checklist đầu phiên + cập nhật docs + self review |
| RBAC_STANDARD.md | RBAC không làm mất dữ liệu; filterStateForUser no-op |
| DATA_PROTECTION_STANDARD.md | Data First: snapshot, verify, soft-delete, gate |
| EMAIL_STANDARD.md | Email Service (queue/log/template) |
| AUDIT_STANDARD.md | Nhật ký kiểm toán bất biến |
| **RELEASE_CHECKLIST.md** | **BẮT BUỘC đọc trước mỗi lần bump version — checklist từng bước** |

## Thứ tự ưu tiên khi mâu thuẫn
1. Mã nguồn hiện tại → 2. Tài liệu /docs → 3. ADR /docs/adr → 4. Chat.
Mâu thuẫn → DỪNG và báo cáo.

## Phiên bản app gần nhất cập nhật tài liệu: 3.09.52
