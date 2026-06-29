# BUSINESS_RULES.md — Quy tắc nghiệp vụ
> Trích từ mã nguồn thực tế. Cập nhật khi quy tắc nghiệp vụ thay đổi.

## 1. Doanh thu & P&L
- **Hai chỉ tiêu doanh thu khác nhau** (không phải lỗi):
  - *Giá trị HĐ dự án* = tổng `p.value` (giá trị hợp đồng đã ký) — chỉ tiêu kế hoạch.
  - *DT thực dự án* = `projectRev(pid)` = tổng opTransactions type='REV' gắn projectId.
  - *Tổng doanh thu năm* (KPI) = HĐ đã xuất theo năm hóa đơn (`issueDate`) + DT dự kiến chưa xuất HĐ. Tính từ TOÀN BỘ receivables, không giới hạn dự án.
- P&L đọc payables (qua `apCountsInPL`) + opTransactions, KHÔNG đọc cashTxns trực tiếp.

## 2. apCountsInPL(r) — AP nào vào P&L
- Ứng quỹ (isExpenseAdvance / ADVANCE) → **false** (Ứng = chưa vào P&L).
- Hoàn ứng (`_cashClear`) → **true** (Hoàn ứng = vào P&L).
- `_fundPending`/pending_fund → false.
- Tàu QL hộ (opVessels) / VESSEL_MGMT → false.
- PO / CapEx → false.
- Nguyên tắc: **Ứng = không P&L; Hoàn ứng = P&L.**

## 3. Thuế & Lương (2026)
- **Giảm trừ gia cảnh (GTGC)**: bản thân **15.500.000đ**, người phụ thuộc **6.200.000đ**/người.
- **Bảo hiểm**: NV **10.5%** + công ty **21.5%** (tổng 32%).
- **TNCN (PIT)**: bậc lũy tiến 5/10/20/30/35%. Tự tính từ AP loại SALARY (field `pitAmount`), auto sinh record khi AP Lương được duyệt.

## 4. Phân loại nhân sự (HR)
- `_hrmGuessType(dept, title)`:
  - expert nếu chứa: chuyên gia/expert/expat/consultant/specialist/co van.
  - crew nếu: đội tàu/sĩ quan/thuyền viên...
  - else office.
- Import set dept qua `_hrmCanonDept(raw)` → map về HRM_DEPTS chuẩn (Ban Giám đốc/Kế toán/Nhân sự/Khai thác/Kỹ thuật/Mua hàng/Điều động tàu/Khác).
- Gom nhóm phòng ban theo `_deptCanonNorm` (bỏ dấu/hoa-thường/đuôi gạch).

## 5. Quỹ tiền mặt
- Loại quỹ gồm Quỹ Dự án (O&M): payable gắn projectId → vào P&L dự án.
- Số dư quỹ tính từ `cashTxns` (nguồn sự thật), không tin `f.balance` lưu sẵn.

## 6. Hạn mức tín dụng (Credit Facility)
- 1 ngân hàng cấp 1 hạn mức/năm; nhiều loans liên kết qua `facilityId`.
- Còn lại = limit − tổng dư nợ gốc các loan liên kết.

## 7. Đồng bộ & Merge
- Pull merge theo ID, giữ bản mới hơn (`_recordTimestamp`); tombstone `deletedIds` chống hồi sinh bản đã xóa.
