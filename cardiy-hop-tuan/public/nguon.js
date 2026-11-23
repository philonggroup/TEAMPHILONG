'use strict';
/* ===================================================================
   CARDIY | Họp nhanh — CẤU HÌNH NGUỒN DỮ LIỆU
   Sửa đúng 1 chỗ này khi đổi bản triển khai Apps Script.

   API   : URL .../exec của Web App (file CARDIY_HOP_NHANH.gs)
   KHOA  : phải khớp biến KHOA trong CARDIY_HOP_NHANH.gs

   Nguồn VÀO  : 3 workbook hệ thống chuẩn CN1 / CN2 / CN3 (đọc live)
   Nguồn RA   : Sheet "CARDIY Họp nhanh — Nguồn dữ liệu chuẩn"
   =================================================================== */
window.CARDIY_NGUON = {
  API: '',                     /* ← DÁN URL .../exec VÀO ĐÂY */
  KHOA: 'PHILONG2026',
  SHEET_RA: 'https://docs.google.com/spreadsheets/d/1Y5G05cBs7kWehsLzqJf5xttSv3hw3kICDoaLc4kFxcU/edit',
  THU_MUC_VAO: 'https://drive.google.com/drive/folders/19CRAx_HjWjlqr7espXFZT1-_VbwJIf2E'
};
