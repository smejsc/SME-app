# HƯỚNG DẪN SỬ DỤNG SEAHORSE MANAGER

**Dành cho:** Nhân viên mới được cấp tài khoản  
**Phiên bản:** 1.14.0 · 2026  
**Công ty:** CTCP Hàng hải và Năng lượng Hải Mã

---

## 1. ĐĂNG NHẬP LẦN ĐẦU

### Thông tin bạn cần
Bạn sẽ nhận được từ admin (qua email + tin nhắn riêng):
- **URL truy cập app**: https://hanguyen70.github.io/SME-app/
- **Tên đăng nhập** (vd: `lan_kt`, `binh_aries`)
- **Mật khẩu tạm thời**

### Cách đăng nhập
1. Mở trình duyệt (khuyến nghị **Chrome**, **Edge**, hoặc **Safari**)
2. Truy cập URL app
3. Nhập **Tên đăng nhập** + **Mật khẩu** → bấm "Đăng nhập"

**⚠ Quan trọng:** App **KHÔNG có chức năng quên mật khẩu**. Nếu quên, phải liên hệ admin để reset.

---

## 2. GIAO DIỆN CHÍNH

Sau khi đăng nhập, bạn sẽ thấy:

```
[Logo công ty] [Tên công ty]              [Sync] [FX] [Đăng xuất]
─────────────────────────────────────────────────────────────────
[01 Kế hoạch] [02 Dự án] [03 Tàu] [04 Công nợ ▾] [05 Chi phí ▾] ...
─────────────────────────────────────────────────────────────────
| Nội dung tab đang xem                                            |
```

- **Header trên cùng**: tên công ty + đồng bộ + tỷ giá + đăng xuất
- **Nav (thanh điều hướng)**: các tab bạn có quyền truy cập (ẩn tab không có quyền)
- **Vùng nội dung**: form nhập + bảng dữ liệu

---

## 3. QUYỀN HẠN CỦA BẠN

Bạn chỉ thấy các tab + bản ghi nằm trong **phạm vi được phân công**:

- **Nhân viên nhập liệu**: chỉ thấy bút toán do mình nhập
- **Người duyệt L1/L2**: thấy tất cả bút toán để duyệt
- **Admin**: thấy hết, sửa/xóa mọi nơi

Khi vào tab → nếu thấy banner "⚠ Phạm vi của bạn" có nghĩa đang ở chế độ NV thường.

---

## 4. CÁC TAB CƠ BẢN

### Tab 04 Công nợ — Phải thu / Phải trả
- **Phải thu** (Doanh thu): hóa đơn bán hàng, công nợ KH chưa thu
- **Phải trả** (Chi phí): hóa đơn mua hàng, công nợ NCC chưa trả

**Quy trình nhập:**
1. Bấm "+ Thêm phải thu/trả" → modal mở
2. Điền: Đối tác, diễn giải, ngày, Net, %VAT (app tự tính Gross)
3. Save → bút toán ở trạng thái **Nháp**
4. Bấm icon **→** để **Gửi duyệt L1**
5. Sau khi L1+L2 duyệt → APPROVED → vào báo cáo

### Tab 05 Chi phí — 3 loại
- **Tàu / Dự án O&M**: chi phí phát sinh tại tàu (Bunker, Port, Sửa chữa...)
- **Nhân sự**: lương, BHXH, thưởng, đào tạo (bảo mật cao)
- **Quản lý chung**: VPP, điện nước, dịch vụ ngoài, phí NH...

### Tab 06 Vận hành tàu (nếu có quyền)
- Quản lý thu hộ/chi hộ cho tàu QL hộ chủ tàu khác
- Mỗi giao dịch có cảnh báo dưới ngưỡng số dư

### Tab 07 Phê duyệt (chỉ người có L1/L2)
- Tổng hợp tất cả bút toán chờ duyệt
- Tick chọn → bấm "Duyệt cả lô" → xong nhanh
- Có thể từ chối với lý do chung

### Tab 09 Tài sản
- **TSCĐ**: tàu, nhà, xưởng, máy móc lớn
- **CCDC & MMTB**: dụng cụ, máy nhỏ — phân theo bộ phận

---

## 5. QUY TẮC NHẬP DỮ LIỆU

### Số tiền
- Nhập số thuần (vd: `50000000`), KHÔNG dùng dấu phân cách (`50,000,000`)
- Nhập **Net (chưa VAT)** → app tự tính VAT + Gross

### Ngày
- Định dạng YYYY-MM-DD (vd: 2026-05-01)
- Cell calendar picker hỗ trợ

### Tỷ giá VND/USD
- Mỗi NV xem được tỷ giá nhưng admin set
- Khi nhập USD → app tự quy đổi VND cho báo cáo (và ngược lại)

### Workflow phê duyệt
```
Nháp → [→ Gửi] → Chờ L1 → [✓ Duyệt L1] → Chờ L2 → [✓ Duyệt L2] → ĐÃ DUYỆT
                                                                          ↓
                                                              Vào báo cáo BI
```

**Bị từ chối** → bản ghi trả về Nháp với lý do → sửa lại → gửi lại.

---

## 6. NHẬP HÀNG LOẠT TỪ EXCEL

Nếu bạn cần nhập nhiều bản ghi cùng lúc:

1. Tải template Excel từ admin (file `SM-Template-*.xlsx`)
2. Mở template, xóa 2-3 dòng ví dụ
3. Điền data thật vào (có thể copy/paste từ FAST)
4. Save file
5. Trong app: **≡ Menu → Import Excel hàng loạt**
6. Chọn loại → upload file → preview validation → confirm

**Lưu ý:** Chỉ admin và người duyệt mới có quyền Import hàng loạt.

---

## 7. TIPS & TRICKS

### Bảo mật
- KHÔNG chia sẻ tài khoản cho người khác
- Đăng xuất khi rời máy
- Tránh đăng nhập trên máy công cộng

### Sync dữ liệu
- App tự sync với cloud khi đăng nhập + sau mỗi thao tác
- Icon "Sync" trên header → click để force sync
- Status: **Synced** (xanh) | **Syncing** (vàng) | **Error** (đỏ)

### Khi gặp lỗi
1. Hard refresh: `Ctrl+Shift+R` (Windows) hoặc `Cmd+Shift+R` (Mac)
2. Kiểm tra mạng
3. Báo admin nếu vẫn lỗi

---

## 8. LIÊN HỆ HỖ TRỢ

- **Admin chính**: Cường (Cường liên hệ)
- **Email công ty**: (Cường điền)
- **Tel**: (Cường điền)
- **Giờ làm việc**: Thứ 2 - Thứ 6, 8:00 - 17:30

---

*Tài liệu này được tự động tạo từ Seahorse Manager v1.14.0.  
Cường có thể chỉnh sửa thêm thông tin liên hệ + công ty trước khi gửi cho NV.*
