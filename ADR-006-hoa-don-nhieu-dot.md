# ADR-007: DocumentService — thống nhất liên kết tài liệu + phân quyền (GỌN)

- **Trạng thái:** ĐỀ XUẤT — chờ Chủ hệ thống chốt 1 điểm hạ tầng (mục A)
- **Liên quan:** ADR-003 (RC-1: 6 Service), attachments[]/docs[] hiện hành (Drive)

## Mục tiêu (Sếp chốt — PHẠM VI GỌN)
Đây là ERP nội bộ, KHÔNG phải DMS chuyên dụng. DocumentService chỉ để:
1. **Thống nhất** cách quản lý LIÊN KẾT tài liệu (1 nơi, mọi module gọi — hết tình trạng mỗi module tự xử lý).
2. **Metadata cơ bản** (không lưu file trong ERP).
3. **Phân quyền** mở/xem theo RBAC.
4. **Audit Log** thao tác.

KHÔNG làm ở giai đoạn này: Versioning, Full-text Search, OCR, e-Sign, auto-scan NAS, preview nâng cao.
Ưu tiên: ĐƠN GIẢN · ỔN ĐỊNH · DỄ BẢO TRÌ.

## Hiện trạng (tái dùng, không làm lại)
App đã lưu `attachments[]`/`docs[]` = metadata nhẹ `{id,fileName,mimeType,url,size,uploadedAt,uploadedBy}`,
file thật ở Drive (qua Apps Script), KHÔNG vào State. Vấn đề: 5 chỗ upload tự xử lý riêng
(`arAttachUpload`, op-tx docs, multi-row, hr docs, daily report) → trùng lặp, audit/quyền rời rạc.
DocumentService = GOM 5 chỗ này về 1 API + chuẩn hóa quyền + audit. Đó là toàn bộ giá trị.

## Metadata tối thiểu (đúng list của Sếp)
```
doc = {
  id, module, recordId, employeeId?,     // liên kết nghiệp vụ
  path, fileName, fileType,              // đường dẫn + tên + loại (NAS path hoặc Drive url)
  storage: 'drive'|'nas',               // nguồn lưu (để sau đổi không sửa module)
  createdAt, updatedAt, updatedBy,
  permissionTag                          // nhãn RBAC: HR|ACC|VESSEL|PROJECT|WAREHOUSE
}
```
Lưu `S.documents[]` (index nhẹ). KHÔNG version, KHÔNG bản sao file.

## API DocumentService (gọn — 6 hàm)
- `link({module,recordId,employeeId,path,fileName,fileType,storage,permissionTag})` → tạo metadata liên kết.
- `list({module,recordId,employeeId})` → danh sách tài liệu của 1 record.
- `open(docId)` → mở (Drive: mở url; NAS: copy/mở path) — kiểm quyền + ghi audit.
- `unlink(docId)` → gỡ liên kết (KHÔNG xóa file gốc).
- `can(action,docId)` → kiểm quyền RBAC.
- (upload file lên Drive vẫn dùng cơ chế Apps Script hiện có; DocumentService chỉ chuẩn hóa phần METADATA + quyền + audit quanh nó.)

## Phân quyền (RBAC — tái dùng quyền sẵn có)
permissionTag → ai mở được:
- HR → `canViewPayroll`/`canSignHr`/admin; Employee → chỉ hồ sơ mình (`hrmMyEmpIds`).
- ACC → `canCheckAcc`/admin. VESSEL → assignedVessel/admin. PROJECT/WAREHOUSE → theo quyền module.
- IT → thấy CẤU TRÚC (tên/đường dẫn), KHÔNG mở nội dung nhạy cảm. Admin → all.

## Audit (tái dùng `logAuditEvent`)
Ghi: link / open / unlink + actor + thời điểm + docId + module.

## Storage (giữ tối giản — KHÔNG over-engineer)
2 nguồn: `drive` (đã chạy) · `nas` (lưu PATH text). Trường `storage` cho phép sau đổi mà không sửa
module gọi. KHÔNG xây adapter framework phức tạp ở GĐ này — chỉ 1 nhánh if theo `storage` khi mở.

## ⚠ ĐIỂM DUY NHẤT CẦN SẾP CHỐT
**A. Với tài liệu trên NAS, ERP mở thế nào?**
   Browser KHÔNG mở được `\\nas\...` hay `file://` trực tiếp. 2 lựa chọn:
   - (1) ERP lưu PATH + nút "📋 Copy đường dẫn" → người dùng dán vào File Explorer (đơn giản, chạy ngay, KHÔNG cần hạ tầng).
   - (2) NAS có sẵn link HTTP (Synology/QNAP web share) → lưu URL đó, bấm là mở (cần NAS bật web access).
   → Đề xuất: làm (1) trước (đơn giản nhất, đúng tinh thần Sếp), (2) thêm sau nếu NAS có web link.

## 3 câu hỏi kiểm định
1. Hợp RC-1? ❓ Thêm Service thứ 7 — cần Sếp duyệt nâng "6→7 Service". Chỉ THÊM, không sửa 6 Service cũ.
2. Tái dùng? ✅ Gom 5 chỗ upload rời về 1 API — chính là khử trùng lặp.
3. Bền 5-10 năm? ✅ Trường `storage` + 1 API chung cho phép đổi nguồn lưu không sửa module. Gọn, không over-build.

## Lộ trình (one-commit-one-change)
- GĐ1: DocumentService IIFE (link/list/open/unlink/can) + audit. Gắn vào 1 module thí điểm (HR docs).
- GĐ2: chuyển 4 chỗ upload còn lại sang gọi DocumentService (từng cái một, có kiểm thử).
- GĐ3 (tùy chọn): nút Copy path NAS + nhãn permission chi tiết.

---

# ADR-007 · BỔ SUNG: Migration Google Drive → NAS (Sếp yêu cầu)

## Yêu cầu Sếp (5 ràng buộc + 1 điều kiện)
1. **Migration Tool idempotent** — chạy nhiều lần không sao.
2. **Không mất dữ liệu.**
3. **Không tạo bản ghi trùng.**
4. **Có báo cáo đối chiếu** sau mỗi lần chạy.
5. **Người dùng KHÔNG upload lại** — tự động.
6. **Dual-storage** trong lúc chuyển (Drive + NAS song song, không gián đoạn).
7. Hoàn tất + xác nhận → **NAS = Primary Storage.**
ĐIỀU KIỆN SẾP: "nếu không phức tạp" → chọn thiết kế ĐƠN GIẢN NHẤT đạt đủ 7 điều trên.

## ⚠ ĐỘ PHỨC TẠP THẬT — nói thẳng
Phần ERP (metadata) ĐƠN GIẢN. Phần KHÓ nằm ở **chuyển file thật Drive→NAS**:
- Browser KHÔNG đọc Drive file rồi ghi vào NAS được (sandbox). Việc copy byte file
  PHẢI chạy ở 1 backend (Apps Script đọc Drive + ghi NAS, HOẶC script chạy 1 lần trên máy có quyền cả 2).
- → Migration "tự động, không thao tác tay" CHỈ khả thi nếu có backend cầu nối Drive↔NAS.
  KHÔNG có backend này thì không có cách nào browser tự chuyển file — đây là giới hạn vật lý, không phải lựa chọn thiết kế.

## Thiết kế ĐƠN GIẢN (tách 2 phần — phần ERP làm được ngay, phần file cần backend)

### A. Mô hình metadata hỗ trợ dual-storage (làm ở ERP — đơn giản)
Mỗi doc thêm:
```
doc = { ...,
  storage: 'drive'|'nas',          // nơi ĐANG đọc (primary cho doc này)
  driveId, driveUrl,               // toạ độ Drive (giữ NGUYÊN, không xoá khi migrate)
  nasPath,                         // toạ độ NAS (điền khi đã copy xong)
  migrated: false|true,            // đã copy sang NAS chưa
  migratedAt, migratedBy,
  checksum?                        // (tuỳ chọn) để đối chiếu toàn vẹn
}
```
- **Dual-storage = đọc theo cờ:** `open(doc)` → nếu `migrated && nasPath` và hệ đang ở chế độ NAS-primary → mở NAS; ngược lại mở Drive. KHÔNG xoá Drive cho tới khi cutover xác nhận. Đây là toàn bộ "song song" — 1 cờ, không cần đồng bộ 2 chiều phức tạp.

### B. Migration Tool (idempotent) — vòng lặp 3 bước, chạy lại được
Mỗi lần chạy, với MỖI doc chưa `migrated`:
1. **Kiểm tra đã có ở NAS chưa** (theo nasPath dự kiến + checksum/size). Có rồi → chỉ cập nhật metadata, KHÔNG copy lại (idempotent + không trùng).
2. **Chưa có** → backend copy Drive→NAS → set `nasPath, migrated:true, migratedAt`.
3. Doc đã `migrated` → BỎ QUA.
→ Idempotent: chạy 100 lần kết quả như 1 lần. Không trùng: khoá theo `doc.id` + kiểm tồn tại trước khi copy. Không mất: Drive GIỮ NGUYÊN tới khi cutover.

### C. Báo cáo đối chiếu (sau mỗi lần chạy)
Xuất bảng: Tổng doc · Đã migrate · Còn lại · Lỗi (kèm lý do) · Đối chiếu size/checksum Drive vs NAS (khớp/lệch). Lưu `S.migrationRuns[]` (lịch sử mỗi lần chạy) + xuất Excel.

### D. Cutover (NAS = Primary) — 1 công tắc, có điều kiện
Chỉ cho bật `STORAGE_PRIMARY='nas'` khi: 100% doc `migrated` + báo cáo đối chiếu 0 lệch.
Sau cutover: `open()` đọc NAS; Drive thành backup (giữ N ngày rồi mới cân nhắc dọn — KHÔNG xoá tự động).

## Phương án theo hạ tầng (quyết định độ phức tạp)
- **Nếu NAS có WebDAV/HTTP API + Apps Script nối được:** làm full A→D, tự động thật. (Phức tạp vừa, nằm ở backend Apps Script — không đụng kiến trúc ERP.)
- **Nếu NAS KHÔNG có API:** KHÔNG thể "tự động không thao tác tay". Lúc đó migration = công cụ bán tự động:
  ERP xuất danh sách file cần chuyển (Drive link + đường dẫn NAS đích) → 1 lần chạy script desktop
  (hoặc IT copy thủ công theo bảng) → ERP nạp lại nasPath. Vẫn idempotent + đối chiếu, nhưng có 1 bước IT.

## CÂU HỎI CHỐT (để biết có "không phức tạp" được không)
Q1. NAS công ty có **API ghi file qua HTTP** (WebDAV/REST) không? (quyết định tự động hay bán tự động)
Q2. Apps Script hiện tại có **đọc được Drive file content** để đẩy sang NAS không? (thường có, vì app đã upload Drive qua Apps Script)
Q3. Đồng ý lộ trình: GĐ1 metadata dual-storage (ERP, đơn giản) → GĐ2 Migration Tool + đối chiếu → GĐ3 cutover? Mỗi GĐ 1 commit, có kiểm thử.

## Cập nhật 3 câu hỏi kiến trúc
1. RC-1? ❓ Vẫn cần duyệt Service thứ 7 (DocumentService) — migration là 1 phần của nó.
2. Tái dùng? ✅ Migration Tool dùng chung cho mọi module (HR/ACC/Vessel…) — 1 lần, mọi tài liệu.
3. Bền? ✅ Cờ `storage` per-doc + adapter cho phép sống chung 2 kho rồi cutover sạch, sau đổi S3 cũng cùng cơ chế.

---

# ADR-007 · RÀNG BUỘC KIẾN TRÚC (Sếp chốt — BẮT BUỘC)

## Nguyên tắc: DocumentService là HẠ TẦNG THUẦN, KHÔNG chứa Business Logic
DocumentService CHỈ làm 3 việc: (1) lưu liên kết tài liệu (metadata) · (2) phân quyền truy cập · (3) Audit.
TUYỆT ĐỐI KHÔNG chứa quy tắc nghiệp vụ của bất kỳ module nào.

### Ranh giới rõ (cái gì THUỘC ai)
| Quy tắc | THUỘC module | DocumentService có biết? |
|---|---|---|
| Hóa đơn phải có đủ chứng từ mới được duyệt | Accounting | KHÔNG |
| Phiếu nhập kho cần Packing List + CO/CQ | Warehouse | KHÔNG |
| Hồ sơ NV bắt buộc có HĐLĐ + CCCD | HR | KHÔNG |
| Tàu cần Certificate còn hạn | Vessel | KHÔNG |
| Loại tài liệu nào hợp lệ cho nghiệp vụ nào | Module gọi | KHÔNG |
| File này gắn record nào, ai được xem | — | CÓ (đây là việc của DMS) |

### DocumentService CHỈ phơi ra API trung tính (không mùi nghiệp vụ)
`link / list / open / unlink / can / audit` — nhận tham số `{module, recordId, permissionTag}` như
DỮ LIỆU THUẦN. Nó KHÔNG được:
- biết "hóa đơn", "phiếu kho", "HĐLĐ" nghĩa là gì;
- quyết định tài liệu đủ/thiếu cho 1 nghiệp vụ;
- chặn/cho phép theo trạng thái nghiệp vụ (draft/approved…);
- tính toán hay suy luận gì thuộc về module.

### Ai giữ Business Logic (KHÔNG đổi)
- Accounting kiểm "đủ chứng từ để duyệt" → Accounting tự gọi `DocumentService.list()` rồi TỰ đánh giá.
- HR kiểm "hồ sơ đủ giấy tờ" → HR tự `list()` rồi tự kiểm. v.v.
→ Module HỎI DocumentService "có những file nào", rồi TỰ áp luật của mình. DocumentService chỉ trả dữ liệu.

### Hệ quả thiết kế
- permissionTag là NHÃN do module truyền vào (HR/ACC/VESSEL…), DocumentService chỉ so khớp nhãn với
  quyền RBAC sẵn có — KHÔNG tự định nghĩa luật quyền theo nghiệp vụ.
- Migration Tool cũng KHÔNG có business logic: chỉ copy file + cập nhật metadata + đối chiếu. Không
  đụng quy tắc nghiệp vụ nào của module.
- Test: DocumentService phải test được ĐỘC LẬP, không cần seed dữ liệu nghiệp vụ của module nào.

→ Đây chính là điều kiện để DocumentService BỀN: module đổi luật nghiệp vụ bao nhiêu lần,
   DocumentService KHÔNG phải sửa. Và đổi kho lưu (Drive↔NAS↔S3) thì module KHÔNG phải sửa.
