# Trang giao ban tuần — Phi Long Auto

`giaoban.html` · 1 file duy nhất, chạy thẳng trên GitHub Pages, không cần build, không phụ thuộc thư viện ngoài (chỉ gọi font Google).

Dựng đúng 100% theo canvas demo **"Phi Long – Dashboard giao ban (demo)"**: giữ nguyên 18 màn, nguyên cấu trúc, nguyên màu, nguyên chữ. Phần thêm vào chỉ là *vỏ web*: thanh điều hướng mảnh trên cùng (ẩn được), router, đồng hồ chạy thật và lớp đọc số live.

---

## 1. Up lên GitHub (2 phút)

```
repo  : philonggroup/TEAMPHILONG
file  : giaoban.html   (để ở thư mục gốc, cạnh sale.html / ktv.html / kpi.html)
chạy ở: https://philonggroup.github.io/TEAMPHILONG/giaoban.html
```

Kéo thả `giaoban.html` vào repo trên github.com → Commit. Xong là chạy.
Đường dẫn này **đã khớp** với cột `link_bang_diem` trong tab `HOP_PHIEN` của file PHI LONG_GROUP và dòng id 27 "Họp giao ban" của bảng `MENU` trên app chấm công.

Mở thẳng từng bước bằng đường dẫn:
`...giaoban.html#GB1CheckIn` · `#GB2ViecCu` · `#Main` (toàn cảnh) · `#GB3BinhDuong` · `#GB3BinhPhuoc` · `#GB3ChiNhanh3` · `#GB4VinhDanh` · `#GB5HoTro` · `#GB6ChotViec` · `#GB7ThongDiep` · `#GB8ChamDiem` · `#GB9Wifle` · `#TabChiNhanh` · `#TabKhachHang` · `#TabTongKet` · `#DTQuanLy` · `#DTTuVan` · `#DTKyThuat`

Phím tắt khi họp: `←` `→` đổi bước · `Space` tạm dừng / chạy tiếp đồng hồ.

---

## 2. Nối số live (10 phút, làm 1 lần)

**Nguồn vào** — 3 workbook trong thư mục Drive `1VM-VoIrl6lxatLaMnusb1UuC9xsgIcoR`:

| Chi nhánh | File | Tab đọc |
|---|---|---|
| CN1 | PHILONG_CN1_HE_THONG_CHUAN_6_THANG_CUOI_NAM_2026 | ` BÁO CÁO KPI NGÀY T11` |
| CN2 | PHILONG_CN2_HE_THONG_CHUAN_6_THANG_CUOI_NAM_2026 | ` BÁO CÁO KPI NGÀY T11` |
| CN3 | PHILONG_CN3_HE_THONG_CHUAN_6_THANG_CUOI_NAM_2026 | ` BÁO CÁO KPI NGÀY T11` |

**Nguồn ra** — file `PHI LONG_GROUP` (`1zYikNTqsKFnqOBPxarg2RJk4yaTEZjp3mez74pfRJsI`), các tab `HOP_PHIEN`, `HOP_CAM_KET`, `HOP_CHUAN_BI`, `CONG_VIEC`.

### Các bước

1. Mở file **PHI LONG_GROUP** → `Tiện ích mở rộng` → `Apps Script`.
2. Dán toàn bộ `Code.gs` vào, bấm **Lưu**.
3. Chạy thử hàm `chayKiemTra` một lần (để Google xin quyền) → xem Nhật ký: phải thấy `doc_duoc: true` cho cả 3 chi nhánh.
4. `Triển khai` → `Tùy chọn triển khai mới` → **Ứng dụng web**
   * Thực thi với tư cách: **Tôi**
   * Ai có quyền truy cập: **Bất kỳ ai**
5. Copy URL kết thúc bằng `/exec`.
6. Mở `giaoban.html`, tìm dòng đầu file (khoảng dòng 20 của phần script):

```js
var CAU_HINH = {
  API: '',                      // ←  dán URL /exec vào đây
  KHOA: 'PHILONG2026',          // phải khớp biến KHOA trong Code.gs
  TEN_CN: { CN1: 'CN1 Phi Long', CN2: 'CN2 Phi Long', CN3: 'CN3 Phi Long' },
```

7. Sửa `TEN_CN` thành tên chị muốn hiện trên màn Toàn cảnh (ví dụ `CN1: 'PHI LONG 2'`).
8. Commit lại file. Xong — mỗi lần mở trang, số tự lấy từ 3 workbook, tự làm mới mỗi 3 phút.

**Sang tháng mới không phải sửa gì**: script tự dò tên tab theo tháng hiện tại (`T11` → `T12`), thử lần lượt 4 cách đặt tên đang dùng, không thấy thì dò gần đúng.

---

## 3. Số nào là số thật, số nào còn là số mẫu

Đây là phần quan trọng nhất — trang **không bao giờ để số mẫu đội lốt số thật**.

| Màn | Trạng thái | Nguồn |
|---|---|---|
| Bước 3 · Toàn cảnh (`#Main`) | **Live** | Dòng 4, 6, 15, 16, 17, 18 của tab KPI ngày, 3 chi nhánh |
| Bước 3 · 3 màn chi tiết | **Live** | 13 chỉ số, dòng 4–23 của tab KPI ngày chi nhánh đó |
| Bước 2 · Việc tuần trước | **Live** | Bảng `CONG_VIEC`, lọc deadline trong 14 ngày gần nhất |
| Bước 6 · Chốt việc tuần | **Live** | Bảng `HOP_CAM_KET` |
| Khối "Việc xử lý sau họp" (sidebar mọi màn) | **Live** | Bảng `HOP_CHUAN_BI`, bỏ việc đã xong |
| Bước 5 · Cần hỗ trợ (`#GB5HoTro`) | **Live** | Tab `Kế hoạch 90 ngày quý 4` của 3 chi nhánh — dòng 5–13, cột E mục tiêu · H P-I-C · I:U việc theo tuần · V chỉ số dẫn dắt · W KẾT QUẢ Q4 |
| Bước 1, 4, 7, 9 · 3 tab · 3 màn điện thoại | Số mẫu | nội dung điều phối, nhập tay tại chỗ |

Màn nào chưa nối, nhãn góc phải ghi rõ **"SỐ MINH HỌA · màn này chưa nối live"**. Màn đã nối ghi **"SỐ LIỆU LIVE · giờ cập nhật"**.

Ba ô **chưa có nguồn** trong tab KPI ngày nên hiện thẳng chữ *chưa nối nguồn*, không lấy số demo lấp vào:
* **Lãi gộp** — nằm ở tab `KQKD T11`, chưa nối.
* **Điểm Google, lời khen / khiếu nại** — chưa có bảng nguồn.
* **Ắc quy & phụ kiện** (tách riêng theo nhóm hàng) — tab KPI ngày chỉ có tổng DT dịch vụ.

Khi chạy live, **nhãn của mỗi dòng cũng đổi theo đúng tên chỉ số trong tab nguồn** — không để tên "Chốt báo giá" ngồi trên số của "Báo giá lên trong ngày".

---

## 3b. Bước 5 · Cần hỗ trợ — chốt từ kết quả KH 90 ngày

Màn này không còn số mẫu. Mỗi lần mở trang, script đọc tab `Kế hoạch 90 ngày quý 4 ` của
từng chi nhánh và dựng 3 thẻ + dải 4 nhóm mục tiêu.

**Chuẩn so sánh**: % thời gian quý 4 đã đi qua (01/10 → 31/12 = 92 ngày).
Ngày 20/11 là ngày thứ 51 → chuẩn 55%. Chi nhánh nào % KPI doanh thu thấp hơn mức này là đang hụt.

**Thứ tự 3 thẻ** không cố định: chi nhánh xa chuẩn tiến độ nhất đứng đầu, 2 thẻ đầu ghi
`ĐƯỢC CHỌN` (đem ra bàn trong 14 phút), thẻ thứ 3 ghi `Xử lý sau họp`.

**Việc cần hỗ trợ trên thẻ** tự chọn theo thứ tự: (1) doanh thu Q4 dưới chuẩn tiến độ →
(2) mục tiêu có chỉ số vẫn bằng 0 cả quý → (3) mục tiêu chưa có số đo.

**Dải 4 nhóm** lấy 1 dòng cầm cờ cho mỗi nhóm — đổi ở `KH90_CO_NHOM` trong `Code.gs`:

| Nhóm | Dòng tab KH 90 ngày | Hiển thị | Màu |
|---|---|---|---|
| I · TIỀN | 6 Doanh thu | `% KPI` | theo `% KPI ÷ chuẩn tiến độ` |
| II · HỆ THỐNG | 8 Số liệu | số dòng cảnh báo | xanh khi = 0, đỏ khi > 0 |
| III · ĐỘI NGŨ | 10 KPI tuần | số, hoặc `chưa đo` | xám khi chưa đo |
| IV · CÁ NHÂN | 12 Điều hành bằng số | số, hoặc `chưa đo` | xám khi chưa đo |

Ô `KẾT QUẢ Q4` nào đang là `Nhập tay: …`, trống, hay `#REF` thì màn ghi thẳng **chưa đo** —
không lấy số nào lấp vào. Chân mỗi thẻ đếm `n/9 mục tiêu chưa đo`.

### Phải cập nhật Apps Script 1 lần
Số mới nằm trong `Code.gs`, nên sau khi kéo file này lên repo vẫn phải đẩy code sang Apps Script:

1. Mở file **PHI LONG_GROUP** → `Tiện ích mở rộng` → `Apps Script`.
2. Dán lại **toàn bộ** `Code.gs` mới (ghi đè bản cũ) → **Lưu**.
3. Chạy `chayKiemTra` 1 lần nếu Google xin thêm quyền.
4. `Triển khai` → `Quản lý các triển khai` → bút chì ✏️ ở bản đang chạy →
   `Phiên bản`: **Phiên bản mới** → `Triển khai`.
   Giữ nguyên URL `/exec`, **không** tạo triển khai mới để khỏi phải sửa `giaoban.html`.
5. Mở `giaoban.html#GB5HoTro`, nhãn góc phải phải đọc **SỐ LIỆU LIVE · giờ cập nhật**.
   Còn ghi SỐ MINH HOẠ nghĩa là bước 4 chưa xong.

Thử riêng gói số của bước 5: mở `…/exec?khoa=PHILONG2026&viec=kh90`.

---

## 4. Thang màu

Theo đúng thang chị đã chốt cho Dashboard chi nhánh:

| Mức | Khoảng | Màu |
|---|---|---|
| ĐỈNH | > 107% | tím `#4B2E83` |
| ĐẠT | 100 – 107% | xanh `#DCEAF7` |
| ĐƯỢC | > 90 – 100% | vàng `#FFE08A` |
| ĐUỐI | ≤ 90% | đỏ `#B42318` |

Muốn đổi: sửa mảng `CAU_HINH.THANG` ở đầu phần script.

---

## 5. Ghi kết quả họp về PHI LONG_GROUP

Đã chạy sẵn:

* **Bước 8** — nút **"Lưu điểm"** có sẵn trên màn: dán dãy điểm trong chat, bấm → ghi điểm trung bình vào `HOP_PHIEN.diem_hop`, đổi `trang_thai` thành "Đã họp".

Gọi được từ Console trình duyệt hoặc gắn vào nút khác sau này:

```js
PL.luuDiemHop('CN1', 'T3/11', '8 9 7 10 8');      // điểm họp
PL.luuThongDiep('CN1', 'T3/11', 'Giữ lời với khách.');
PL.themCamKet({ chi_nhanh:'CN3', tuan:'T3/11', ma_nv:'NV011',
                ho_va_ten:'Ngọc Trâm', noi_dung:'Gọi 15 khách đến hạn mỗi ngày',
                chi_so:'Lượt xe đặt lịch', muc_tieu:'15', han:'28/11/2026' });
PL.napLai();        // tải lại số
PL.duLieu();        // xem gói dữ liệu đang hiển thị
```

---

## 6. Kiểm thử đã chạy

* 18/18 màn mở được, không lỗi JavaScript, không tràn ngang.
* Đồng hồ đếm ngược đúng thời lượng từng bước (5' · 5' · 18' · 4' · 14' · 6' · 3' · 1' · 4'), nút Tạm dừng / Đặt lại chạy.
* Thu nhỏ vừa khít màn hình: thử ở 1440px và 390px (điện thoại), không vỡ layout.
* Lớp live thử với dữ liệu giả đúng cấu trúc API: toàn cảnh, 3 màn chi tiết, việc tuần trước, sidebar đều nhận số.
* Dữ liệu đổ từ Sheet vào trang đều được lọc ký tự HTML trước khi hiển thị.

## 7. Dựng lại khi demo đổi

Bộ nguồn trong thư mục `nguon/`: `build.py` (chuyển artboard → màn), `build_html.py` (ghép file), `app.js` (lớp ứng dụng).

```bash
python3 build.py <thư mục chứa các file .dc.html> screens.json
python3 build_html.py        # sinh lại giaoban.html
```
