# DEVELOPMENT_WORKFLOW.md — Quy trình phát triển
> Bắt buộc cho mọi phiên làm việc và mọi module.

## A. CHECKLIST ĐẦU PHIÊN (bắt buộc TRƯỚC khi code)
Trước khi phân tích/thiết kế/viết bất kỳ dòng code nào, phải đọc và tuân thủ:
- [ ] `/docs/ARCHITECTURE.md`
- [ ] `/docs/RC1_BASELINE.md`
- [ ] `/docs/CODING_STANDARD.md`
- [ ] `/docs/SECURITY_STANDARD.md`
- [ ] `/docs/BUSINESS_RULES.md`
- [ ] `/docs/DEVELOPMENT_WORKFLOW.md`
- [ ] `/docs/RBAC_STANDARD.md`
- [ ] `/docs/DATA_PROTECTION_STANDARD.md`
- [ ] `/docs/EMAIL_STANDARD.md`
- [ ] `/docs/AUDIT_STANDARD.md`
- [ ] `/docs/RELEASE_CHECKLIST.md` ← **BẮT BUỘC đọc & làm theo TRƯỚC mỗi lần bump version**

Nguyên tắc nguồn thông tin:
1. **Mã nguồn hiện tại** (ưu tiên cao nhất).
2. Tài liệu chính thức `/docs/`.
3. ADR `/docs/adr/`.
4. Sau cùng mới đến nội dung chat.
- KHÔNG dựa vào trí nhớ hội thoại làm nguồn chính.
- Nếu tài liệu/chat/mã nguồn **mâu thuẫn** → DỪNG, báo cáo, chờ làm rõ. Không tự suy đoán.

## B. TRÌNH TỰ MỖI MODULE (không bỏ bước)
Business Analysis → Workflow → UI/UX → Technical Design → Development → Testing → Documentation → Self Review → Production Ready.

## C. VAI TRÒ (đồng thời)
Chief Software Architect · Senior ERP Consultant · QA Lead · Security Architect · Database Architect · Code Reviewer. Mỗi quyết định cân nhắc: kiến trúc, nghiệp vụ, hiệu năng, bảo mật, mở rộng, bảo trì.

## D. KIỂM THỬ SAU MỖI THAY ĐỔI
Unit · Integration · End-to-End · Regression · Security · Performance · Runtime. Chủ động tìm: Data Loss · Memory Leak · Race Condition · Duplicate Event · Duplicate ID · Global State · Dead Code · Technical Debt. Đánh giá tác động TOÀN hệ thống, không chỉ phần vừa sửa.

Cổng bắt buộc PASS trước release:
- `node --check` OK · div=0 · backtick chẵn · load-test sạch.
- Suite test liên quan PASS.
- **`tests/data-protection-check.test.js` PASS** (FAIL = chặn release).
- Version sync 3 file; snapshot `.bak` trước sửa.

## E. CHECKLIST CẬP NHẬT TÀI LIỆU (bắt buộc SAU thay đổi kiến trúc/quy tắc)
Sau mỗi thay đổi, nếu chạm tới các mục dưới → **cập nhật tài liệu tương ứng NGAY trong cùng phiên**:
- [ ] Đổi kiến trúc/luồng dữ liệu → cập nhật `ARCHITECTURE.md` + ghi `RC1_BASELINE.md` (lịch sử quyết định) + ADR nếu chạm nền.
- [ ] Đổi quy tắc lập trình/DOM/State → `CODING_STANDARD.md`.
- [ ] Đổi phân quyền/tab/field → `RBAC_STANDARD.md` (+ kiểm `_auditUnmappedFields`).
- [ ] Đổi cơ chế bảo vệ dữ liệu/save/snapshot/delete → `DATA_PROTECTION_STANDARD.md`.
- [ ] Đổi mã hóa/xác thực/2FA → `SECURITY_STANDARD.md`.
- [ ] Đổi quy tắc nghiệp vụ/thuế/lương/P&L → `BUSINESS_RULES.md`.
- [ ] Đổi audit → `AUDIT_STANDARD.md`. Đổi email → `EMAIL_STANDARD.md`.
- [ ] Cập nhật số phiên bản app ghi trong tài liệu nếu liên quan.
Tài liệu phải LUÔN khớp mã nguồn. Tài liệu lỗi thời = nợ kỹ thuật phải sửa ngay.

## F. SELF REVIEW (trước bàn giao)
Tự hỏi — nếu bất kỳ câu nào "Có" thì BÁO CÁO trước khi bàn giao:
- [ ] Vi phạm ARCHITECTURE/RC-1/CODING/SECURITY?
- [ ] Tăng technical debt?
- [ ] Nguy cơ mất dữ liệu?
- [ ] Có regression?
- [ ] Tài liệu đã cập nhật khớp thay đổi?

## G. NGUYÊN TẮC CUỐI CÙNG
Mục tiêu: ERP ổn định, an toàn, dùng lâu dài — KHÔNG phải viết nhiều code. Giải pháp chưa tối ưu → DỪNG, phân tích, đề xuất phương án tốt hơn trước khi tiếp tục.
Ưu tiên: **An toàn dữ liệu → Đúng nghiệp vụ → Kiến trúc → Bảo mật → Mở rộng → Bảo trì → Hiệu năng → Tốc độ phát triển.**
