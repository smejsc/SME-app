# RC1_BASELINE.md — Baseline chính thức
> RC-1 là baseline đông cứng. Tài liệu này định nghĩa cái gì KHÔNG được sửa trực tiếp.

## 1. Phạm vi RC-1 (Frozen Foundation)
Các thành phần sau là **nền tảng đông cứng**, chỉ được THÊM tính năng mới (module mới), KHÔNG sửa trực tiếp:
1. **Core** — vòng đời app, load/save State, mã hóa.
2. **6 Service chung** — Inventory/Accounting/Vessel/HR/Payroll/SalaryFund.
3. **RBAC Framework** — phân quyền, `allowedFieldsForUser`, `TAB_TO_FIELDS`, gating UI.
4. **Google SSO** — đăng nhập, 2FA, session.
5. **Audit Framework** — `logAuditEvent`, auditLogShared.
6. **Email Framework** — hàng đợi email, template, gửi qua Apps Script.

## 2. Quy tắc thay đổi nền
Nếu BẮT BUỘC phải đổi nền:
1. Phân tích tác động (impact analysis).
2. Lập **ADR** (Architecture Decision Record) trong `/docs/adr/`.
3. Báo cáo cho chủ dự án.
4. **Chờ phê duyệt.**
5. Sau đó mới triển khai.

Không tự ý sửa nền dù "chỉ một dòng".

## 3. Module mới
Module mới chỉ được **ADD**: thêm Service/hàm/tab mới, không can thiệp logic Service cũ. Nếu cần Service thứ 7 (vd DocumentService/DMS) → ADR + phê duyệt (RC-1 6→7 Services).

## 4. Nguyên tắc bất biến của RC-1
- **Data First**: không lỗi nào được làm mất dữ liệu nghiệp vụ (xem DATA_PROTECTION_STANDARD.md).
- **RBAC không đổi dữ liệu**: phân quyền chỉ giới hạn xem/thao tác (xem RBAC_STANDARD.md).
- **Single Source of Truth**: `S` đầy đủ, lưu nguyên vẹn.
- **DOM chỉ hiển thị**: không lưu trạng thái nghiệp vụ trong DOM (xem CODING_STANDARD.md).

## 5. Cổng chất lượng bắt buộc (mỗi thay đổi)
- JS compile (`node --check`), div balance = 0, backtick parity chẵn.
- Load-test (script chạy top-to-bottom không ReferenceError).
- `tests/data-protection-check.test.js` PASS (gate chống mất dữ liệu).
- Version đồng bộ 3 file (index.html / service-worker.js / version.json).
- Snapshot `/home/claude/snapshots/index.html.<VERSION>.bak` trước mỗi sửa.

## 6. Lịch sử quyết định nền quan trọng
- v3.09.49 — Runtime Audit: openModal/closeModal dọn DOM; verify-after-write.
- v3.09.51 — `filterStateForUser` no-op: RBAC ngừng cắt field (chấm dứt data-loss kiến trúc).
- v3.09.52 — Data First: snapshot ring-buffer, soft-delete, data-protection gate.
