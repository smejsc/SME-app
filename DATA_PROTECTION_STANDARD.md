# ARCHITECTURE.md — Seahorse Manager ERP
> Nguồn sự thật về kiến trúc. Tài liệu này phải được đọc trước mỗi phiên làm việc và cập nhật sau mỗi thay đổi kiến trúc.
> Phiên bản app khi cập nhật tài liệu: **3.09.52**

## 1. Tổng quan
Seahorse Manager là ERP nội bộ của Seahorse Marine & Energy JSC, đóng gói dưới dạng **single-file `index.html`** (~61.700 dòng) + `service-worker.js` (PWA/offline) + `version.json` (kênh cập nhật). Không có backend riêng cho nghiệp vụ; đồng bộ qua Google Apps Script + Google Drive.

## 2. Mô hình 3 lớp (bắt buộc)
```
UI handler (onclick/onchange inline)
        ↓ đọc input, gọi
Pure logic (wh*/ac*…) — trả {ok, reason}, không đụng DOM
        ↓ gọi
6 Service IIFE — Inventory / Accounting / Vessel / HR / Payroll / SalaryFund
        ↓ đọc/ghi
Master State `S`  ←AES→  localStorage (mã hóa)  ←sync→  Cloud (Drive)
```

### Single Source of Truth
- `S` là **nguồn dữ liệu duy nhất**. UI và DOM **không sở hữu** dữ liệu.
- `saveStateEncrypted()` lưu **toàn bộ** `S` (`encryptJSON(S)`), KHÔNG whitelist field.
- Mọi render đọc từ `S`; sau mỗi thay đổi gọi `renderAll()`.

## 3. Sáu Service (RC-1, KHÔNG sửa trực tiếp)
| Service | Dòng (≈) | Trách nhiệm |
|---|---|---|
| PayrollService | 15190 | Lương, kỳ lương, yêu cầu đổi lương |
| VesselService | 17297 | Tàu, tàu QL hộ (opVessels), giao dịch vận hành |
| AccountingService | 17329 | Phải thu/trả, quỹ tiền mặt, giao dịch, tạm ứng |
| SalaryFundService | 28677 | Quỹ tiền lương |
| InventoryService | 47128 | Kho, vật tư, phiếu, kiểm kê |
| HRService | 59782 | Nhân sự, lịch sử, chấm công |

Các Service là IIFE, expose hàm đọc/ghi `S`. **Foundation (Core/Service/RBAC/SSO/Audit/Email) chỉ được THÊM, không sửa trực tiếp** — xem RC1_BASELINE.md.

## 4. Modal đơn (single modal)
- Một modal DOM duy nhất: `openModal(title, body, foot)` ghi `#modal-body/#modal-title/#modal-foot`; `closeModal()` ẩn + **dọn sạch** nội dung (chống id "ma").
- Script ở top-level (không IIFE) → các hàm là global.

## 5. Lưu trữ & Đồng bộ
- localStorage key theo user: `_storeKeyForUser()` (admin = STORE_KEY; NV = STORE_KEY+'__nv_'+tên).
- Sync: `cloudSync('push'|'pull')`. Pull = merge theo ID (`mergeStateByFields`/`mergeByID`), giữ bản mới hơn theo `_recordTimestamp`, không hồi sinh bản đã xóa (tombstone `deletedIds`).
- Attachments: Google Drive qua Apps Script (browser không truy cập NAS/file://).

## 6. Lớp bảo vệ dữ liệu (Data First — xem DATA_PROTECTION_STANDARD.md)
- Snapshot ring-buffer cục bộ (8 bản, trước mỗi `saveState`).
- Verify-after-write trong `saveStateEncrypted`.
- Soft-delete (thùng rác `_recycleBin`) cho dữ liệu tài chính.
- Guard chặn ghi state rỗng đè dữ liệu thật.

## 7. Quy ước kỹ thuật
- `normalize('NFD')` KHÔNG tách đ/Đ → thêm `.replace(/đ/g,'d').replace(/Đ/g,'D')`.
- Chuỗi có `\n`/`${}`/template literal → sửa bằng script thay vì thay chuỗi tay.
- XLSX = SheetJS 0.20.1 full.

## 8. Tài liệu liên quan
RC1_BASELINE · CODING_STANDARD · SECURITY_STANDARD · BUSINESS_RULES · DEVELOPMENT_WORKFLOW · RBAC_STANDARD · DATA_PROTECTION_STANDARD · EMAIL_STANDARD · AUDIT_STANDARD.
