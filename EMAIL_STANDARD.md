# CODING_STANDARD.md — Tiêu chuẩn lập trình
> Bắt buộc tuân thủ cho mọi dòng code.

## 1. DOM chỉ để hiển thị — không sở hữu dữ liệu (v3.09.49)
- DOM/UI **không** lưu trạng thái nghiệp vụ. Dữ liệu nằm trong `S` + Service.
- Khi lưu: đọc input từ DOM → đưa vào State → xử lý dựa trên State. KHÔNG đọc DOM làm nguồn quyết định nghiệp vụ.
- Mọi phần tử HTML phải có **ID duy nhất**, hoặc dùng selector theo phạm vi container (`container.querySelector(...)`) thay vì `getElementById` toàn cục khi id có thể trùng giữa nhiều form.
- Modal dùng `openModal()` (tự dọn DOM cũ) — không tự chèn markup vào `#modal-body` ngoài luồng.

## 2. RBAC không làm mất dữ liệu (v3.09.51)
- RBAC chỉ quyết định XEM/THAO TÁC. KHÔNG cắt field, không `S = filterXxx(...)`.
- Hàm lọc quyền chỉ trả bản copy để render, không mutate `S`, không save.
- Field mới → khai báo trong `TAB_TO_FIELDS` hoặc đánh dấu admin-only; nếu sót, test `rbac-data-integrity` FAIL.

## 3. Save pipeline (v3.09.52)
Mọi save: **Validate → Snapshot → Save → Verify (đọc lại) → Commit**. Không toast "thành công" trước khi Verify xong. Lỗi bước nào báo rõ bước đó.

## 4. Xóa dữ liệu
- Ưu tiên soft-delete (recycle bin) cho dữ liệu tài chính.
- Auto-snapshot toàn cục bảo vệ mọi xóa khác.
- Giữ tombstone (`deletedIds`) để chống sync hồi sinh.

## 5. Quy ước viết code
- Script top-level, hàm global. Không thêm IIFE bao toàn bộ.
- Chuỗi có `\n`/`${}`/template literal → sửa bằng script (python `.replace`), không thay tay dễ lệch.
- Chuẩn hóa tiếng Việt: `normalize('NFD')` + `.replace(/đ/g,'d').replace(/Đ/g,'D')`.
- Số: dùng helper format hiện có (`fmt`, `fmtCcy`), không tự định dạng.
- Không tạo file/biến toàn cục thừa; tránh dead code.

## 6. Cổng chất lượng (mỗi commit)
- `node --check` trên script trích ra → OK.
- div balance = 0; backtick parity chẵn.
- Load-test sạch.
- Suite test liên quan + `data-protection-check` PASS.
- Version sync 3 file; snapshot trước khi sửa.

## 7. Checklist review trước khi bàn giao
- [ ] Không thêm ID tĩnh trùng (chạy DOM ID Audit).
- [ ] Form đọc input qua ID duy nhất / selector scoped.
- [ ] Save có Verify; không success giả.
- [ ] Không filter/RBAC cắt field rồi lưu.
- [ ] Có snapshot trước thao tác phá hủy (xóa/reset/import ghi đè).
- [ ] Không tăng technical debt; không regression.
