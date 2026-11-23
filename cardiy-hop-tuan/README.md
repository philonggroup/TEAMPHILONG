# CARDIY | Họp nhanh (họp L10)

Mã nguồn app điều hành họp tuần / tháng / quý / năm của Phi Long Group.

**Chạy thật tại:** https://philonggroup.github.io/TEAMPHILONG/cardiy-hop-tuan/public/index.html

## Cấu trúc

| Thư mục / file | Nội dung |
|---|---|
| `public/` | Phần chạy trên máy khách: `index.html`, `style.css`, 16 file JS, PWA (`manifest.webmanifest`, `sw.js`), 4 ảnh, `vendor/jszip.min.js` |
| `public/nguon.js` | **Cấu hình nguồn dữ liệu** — dán URL Apps Script vào đây |
| `public/sheet-sync.js` | Lớp dữ liệu 2 chiều (đọc live / ghi kết quả họp) |
| `CARDIY_HOP_NHANH.gs` | **Cầu nối Apps Script** — dán vào Sheet nguồn chuẩn |
| `worker/` | Bản cũ chạy trên hạ tầng ChatGPT — **đã ngưng dùng**, giữ để tham chiếu |

## Nguồn dữ liệu 2 chiều

### NHẬP VÀO — đọc live, không gõ tay

Thư mục Drive `19CRAx_HjWjlqr7espXFZT1-_VbwJIf2E` chứa 3 workbook hệ thống chuẩn:

| Chi nhánh | File |
|---|---|
| PHI LONG 1 (CN1) | `1b2wcIrwdzgt1Sd67BbUMQTiOe4PFj1ShoSSzqS4x8sc` |
| PHI LONG 2 (CN2) | `1O8f-5602r5YB23MFHsLN8QZt9BZQOnV3abm8k8Kgn0k` |
| PHI LONG 3 (CN3) | `1B2eNY8T4iSf0E-UjGOmM30dcxqBOb6VZk1R4A4pXrVc` |

| Phần của app | Tab nguồn | Ghi chú |
|---|---|---|
| Chỉ số tuần | ` BÁO CÁO KPI NGÀY T{tháng}` | cột `KPI TUẦN n` / `THỰC ĐẠT Tn` |
| Chỉ số tháng | ` BÁO CÁO KPI NGÀY T{tháng}` | cột `KPI THÁNG` / `THỰC ĐẠT THÁNG` |
| Chỉ số quý · 6 tháng | `CHỈ TIÊU 6T` + `TỔNG HỢP 6T` | chỉ tiêu ← CHỈ TIÊU, thực đạt ← TỔNG HỢP |
| Mục tiêu 90 ngày | `Kế hoạch 90 ngày quý 4 ` | |
| Mục tiêu quý (6 Ways) | `Kế hoạch 6 Ways` | |
| Danh sách hành động | `CONG_VIEC` của file PHI LONG_GROUP | chưa xong = `trang_thai <> "3.Hoàn thành"` |

Tên tab **lệch khoảng trắng giữa 3 file** (`Kế hoạch 6 Ways` ở CN1/CN2 nhưng ` Kế hoạch 6 Ways` ở CN3)
và cột cũng lệch (CN1 dùng `% ĐẠT NGÀY`, CN2/CN3 dùng `ĐÈN NGÀY`), nên cầu nối **dò theo tên đã chuẩn hoá**
chứ không theo số thứ tự cột. Tháng 12 chưa có tab ` BÁO CÁO KPI NGÀY T12` nên có đường lui `KPI NGÀY T12`.

### XUẤT RA — ghi kết quả họp

Sheet **CARDIY Họp nhanh — Nguồn dữ liệu chuẩn**
(`1Y5G05cBs7kWehsLzqJf5xttSv3hw3kICDoaLc4kFxcU`), cầu nối tự tạo 5 tab:

| Tab | Nội dung |
|---|---|
| `CARDIY_DATA` | Trạng thái máy (JSON), để app tải lại đúng phiên. Ghi thêm dòng mỗi lần lưu → giữ lịch sử |
| `HOP_BIEN_BAN` | Biên bản: tin tốt, phản hồi, nội dung truyền đạt, điểm họp |
| `HOP_CAM_KET` | Việc chốt tại họp: ai · làm gì · hạn · trạng thái |
| `HOP_VAN_DE` | Vấn đề IDS: nguyên nhân · thảo luận · hành động đã chốt |
| `HOP_CHAM_DIEM` | Điểm họp từng kỳ, từng chi nhánh |

Sửa chỉ tiêu hoặc số thực đạt thì **sửa ở workbook chi nhánh**, không sửa trong app —
mỗi lần app đọc lại, số live sẽ đè lên. Chỉ số do người dùng tự thêm trong app thì được giữ nguyên.

## Cài cầu nối (1 lần)

1. Mở Sheet *CARDIY Họp nhanh — Nguồn dữ liệu chuẩn* → **Tiện ích mở rộng → Apps Script**
2. Dán toàn bộ `CARDIY_HOP_NHANH.gs`, Lưu
3. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**
   · Thực thi với tư cách: **Tôi**
   · Ai có quyền truy cập: **Bất kỳ ai**
4. Copy URL `.../exec` → dán vào `API` trong `public/nguon.js`, commit
5. Soát nguồn: mở `<URL>?khoa=PHILONG2026&viec=kiem_tra`

Bước 5 trả về, cho từng chi nhánh: tên tab KPI đọc được, số chỉ số tuần / quý, số mục tiêu
90 ngày và 6 Ways, số công việc, và `lechTuKiem` — chính là dòng `✔ KIỂM TRA` mà Sheet tự soát,
**phải bằng 0**.

## Vì sao phải có Apps Script

GitHub Pages chỉ phục vụ file tĩnh, không chạy `worker/`. Bản `worker/index.mjs` ghi Google Sheet
qua connector của nền tảng ChatGPT nên không chuyển sang hạ tầng khác được. Cầu nối Apps Script
thay hẳn vai trò đó, và giống cách `giaoban.html` + `Code.gs` trong repo này đang chạy.

POST gửi với `Content-Type: text/plain;charset=utf-8` để trình duyệt không bật preflight CORS —
Apps Script không trả lời `OPTIONS`. Nội dung gửi đi vẫn là JSON.

## Việc còn nợ

- `worker/` chưa xoá, nhưng không còn đường gọi nào trỏ tới.
- Hai hộp **Họp CN1** và **Đồng bộ công việc** vẫn gọi worker cũ; nay báo rõ đã chuyển sang nguồn chuẩn
  thay vì lỗi mạng khó hiểu. Cần nối lại vào cầu nối khi có thời gian.
- Tab `Nhân sự` của Sheet nguồn chuẩn **có cột `password` dạng chữ thường**. Cầu nối không đọc tab này,
  nhưng Web App chạy chế độ "Bất kỳ ai" nên vẫn nên xoá cột đó khỏi Sheet.
