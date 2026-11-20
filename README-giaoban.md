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

7. Sửa `TEN_CN` thành tên chị muốn hiện trên màn Toàn cảnh (ví dụ `CN1: 'Bình Phước'`).
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
| Bước 1, 4, 5, 7, 9 · 3 tab · 3 màn điện thoại | Số mẫu | nội dung điều phối, nhập tay tại chỗ |

Màn nào chưa nối, nhãn góc phải ghi rõ **"SỐ MINH HỌA · màn này chưa nối live"**. Màn đã nối ghi **"SỐ LIỆU LIVE · giờ cập nhật"**.

Ba ô **chưa có nguồn** trong tab KPI ngày nên hiện thẳng chữ *chưa nối nguồn*, không lấy số demo lấp vào:
* **Lãi gộp** — nằm ở tab `KQKD T11`, chưa nối.
* **Điểm Google, lời khen / khiếu nại** — chưa có bảng nguồn.
* **Ắc quy & phụ kiện** (tách riêng theo nhóm hàng) — tab KPI ngày chỉ có tổng DT dịch vụ.

Khi chạy live, **nhãn của mỗi dòng cũng đổi theo đúng tên chỉ số trong tab nguồn** — không để tên "Chốt báo giá" ngồi trên số của "Báo giá lên trong ngày".

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
