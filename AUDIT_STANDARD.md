# DATA_PROTECTION_STANDARD.md — Tiêu chuẩn bảo vệ dữ liệu (DATA FIRST)
> Nguyên tắc cao nhất: KHÔNG lỗi phần mềm nào được phép làm mất/sai dữ liệu nghiệp vụ. Thiết kế theo giả định bug LUÔN tồn tại — mọi lớp phải phát hiện, ngăn chặn, ghi nhận, khôi phục.

## 1. Ưu tiên thiết kế
Bảo toàn dữ liệu > Nhất quán > Khôi phục > Hiệu năng/UI. Phải chọn → chọn an toàn dữ liệu.

## 2. Save pipeline bắt buộc
**Validate → Snapshot → Save → Verify (đọc lại + so khớp) → Commit.** Verify thất bại → Rollback. Không báo "thành công" trước khi Verify xong.
- Cài đặt: `saveStateEncrypted()` đọc lại localStorage sau ghi; lệch → throw + cảnh báo NV. `saveState()` tự `pushLocalSnapshot('')` trước khi ghi.

## 3. Snapshot & Versioning
- Ring-buffer cục bộ `seahorse_local_snapshots`, giữ **8 bản** gần nhất, nén gzip.
- `pushLocalSnapshot(label)` / `listLocalSnapshots()` / `restoreLocalSnapshot(id)` (restore tự chụp hiện trạng trước → undo được).
- UI: menu admin "Khôi phục nhanh (máy này)".
- Snapshot độc lập cloud; cũng chụp trước thao tác xóa/reset toàn bộ.

## 4. Soft delete
- `_recycleRecords(field, recs)` lưu bản sao vào `S._recycleBin` (max 200) trước khi xóa vật lý.
- Đã áp: `deleteAr` (Phải thu/trả), `deleteCashTxn` (giao dịch quỹ).
- `restoreFromRecycle(binId)` (admin) khôi phục + gỡ tombstone. UI: "Thùng rác".
- `_recycleBin` thuộc ALL_DATA_FIELDS (đồng bộ/lưu), admin-only về quyền.
- Các xóa khác (HR/Vessel/Inventory): auto-snapshot toàn cục bảo vệ; mở rộng recycle dần theo module.

## 5. Single Source of Truth
- `S` đầy đủ, lưu nguyên vẹn (không whitelist). RBAC/Filter/DOM không sở hữu/đổi dữ liệu.
- Guard `_stateLooksEmpty` chặn ghi state rỗng đè dữ liệu thật.

## 6. Data Protection Check (gate trước release)
`tests/data-protection-check.test.js` — 7 kiểm tra tĩnh, **FAIL = chặn phát hành**:
1. filterStateForUser no-op (không cắt field).
2. Không `S = <filter cắt>(...)`.
3. saveStateEncrypted có verify readback.
4. saveState có auto-snapshot.
5. Guard chặn ghi state rỗng.
6. Có lớp snapshot rollback.
7. closeModal dọn DOM.

## 7. Regression bắt buộc (mô phỏng)
Refresh/đóng tab khi đang lưu, bộ nhớ đầy, đồng bộ nhiều thiết bị, user quyền hạn chế, import lỗi, mất mạng, double-click, save nhiều lần. Dữ liệu phải vẫn đúng.

## 8. Bằng chứng kiểm thử (không suy đoán)
snapshot-rollback (mô phỏng mất rồi khôi phục), recycle-bin (xóa rồi khôi phục), runtime-audit (verify chặn lưu hỏng), rbac-* (không mất field), data-protection-check (gate). Tất cả PASS mới được release.
