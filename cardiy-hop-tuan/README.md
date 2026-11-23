# CARDIY | Họp nhanh (họp L10)

Mã nguồn app điều hành họp tuần / tháng / quý / năm. Đưa về đây ngày 23/11/2026 từ bản
đang chạy thử trên hạ tầng tạm của ChatGPT (`*.chatgpt.site`), để Phi Long giữ bản gốc.

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `public/` | Toàn bộ phần chạy trên máy khách: `index.html`, `style.css`, 14 file JS, PWA (`manifest.webmanifest`, `sw.js`), 4 ảnh, `vendor/jszip.min.js` (JSZip 3.10.1) |
| `worker/` | Phần chạy trên máy chủ: `index.mjs` (lưu / đọc biên bản họp), `build.mjs` |

## Lưu ý quan trọng: app CẦN máy chủ, không chỉ là trang tĩnh

Phần `public/` gọi 2 đầu mối API do `worker/index.mjs` phục vụ:

- `/api/cardiy-sheet` — đọc / ghi dữ liệu họp (`public/sheet-sync.js`)
- `/api/cardiy-task-preview` — xem trước danh sách việc (`public/task-preview.js`)

GitHub Pages chỉ phục vụ file tĩnh, **không chạy `worker/`**. Nên khi mở qua GitHub Pages,
giao diện vẫn lên nhưng **không lưu và không đọc được dữ liệu họp**. Muốn chạy thật phải
thay lớp dữ liệu bằng một trong hai hướng:

1. **Apps Script** — giống cách `giaoban.html` và `wig.html` trong repo này đang dùng.
2. **Supabase** — giống hồ sơ xe chuẩn của Phi Long.

Bản `worker/index.mjs` hiện tại ghi vào một Google Sheet thông qua connector của nền tảng
ChatGPT, nên không chuyển trực tiếp sang hạ tầng khác được; phải viết lại lớp dữ liệu.

## Hai file chưa đưa lên

Repo này **công khai**, nên hai file cấu hình chứa ID nội bộ đang được giữ ngoài:

- `.openai/hosting.json` — mã dự án và mã connector trên nền tảng ChatGPT
- `worker/sheet.json` — ID Google Sheet lưu dữ liệu họp

Hai file này chưa bao giờ được gửi xuống trình duyệt, nên đưa lên repo công khai là một
lần phơi mới. Cần thì bổ sung sau, hoặc chuyển repo sang private trước.

## Kiểm chứng

28/28 file đã đối chiếu SHA-256 khớp 100% với bản Tracy gửi.
