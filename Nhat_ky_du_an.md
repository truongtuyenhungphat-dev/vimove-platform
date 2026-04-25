# 📓 Nhật Ký Phát Triển Dự Án: Vimove Operations Platform
*Tiền thân: Dự án Viwork App*

## Lịch sử Các Giai Đoạn (Sprints)

### 🚀 Giai đoạn 1-2: Khởi tạo Trục Hệ Thống Lõi
- Xây dựng giao diện Dashboard, Kanban Workflow (Kéo thả thẻ CVC).
- Thiết lập Quản trị mảng Khách hàng (CRM) và Tính năng tính lương (Hiệu suất/KPI).
- Phân chia kiến trúc mã nguồn modular (`data.js`, `workflow.js`, `crm.js`, `app.js`).
- Thiết lập logic quản trị thời gian (SLA) bằng kỹ thuật đếm ngược.
- Xử lý triệt để các lỗi hiển thị font chữ tiếng Việt (Encoding UTF-8) trên môi trường Windows.

### 🎨 Giai đoạn 3: Re-branding & Chuyển đổi định vị
- Đổi tên toàn bộ dự án từ **Viwork** sang **Vimove Platform**.
- Tái cấu trúc nhận diện thương hiệu: Cập nhật Logo Chong chóng và mã màu (Xanh lá `#5AB800`, Xám chì `#3D3D3D`).
- Khởi tạo hệ thống Phân quyền (Role-based): **Admin** (Toàn quyền), **Manager** (Thêm/Xóa nhân sự trực thuộc), và **Staff** (Nhân viên).

### 🛠️ Giai đoạn 4: Chuẩn hóa Trải nghiệm Người dùng (UI/UX)
- Gỡ bỏ các module thêm người dùng dạng "inline form" để chuyển sang giao diện Cửa sổ nổi dạng Modals chuyên nghiệp.
- Cải tiến chức năng Duyệt/Từ chối Đề xuất ở khung Request.

### ☁️ Giai đoạn 5: Điện toán Đám Mây & Triển khai Production (HIỆN TẠI)
*Được thực hiện tự động bằng AI Subagent:*
- **Backend (Firebase Firestore):** Loại bỏ hoàn toàn cơ chế `LocalStorage`. Thiết lập và cấu hình `firebase-config.js` và `firebase-db.js` để kết nối Real-time Cloud. Mọi thao tác kéo thả CVC/Duyệt đề xuất đều nảy số ngay lập tức trên các thiết bị khác nhau.
- **Auto Data-seeding:** Xây dựng module nhận diện mây rỗng tự động đẩy Data-mẫu lên Firestore.
- **Triển khai CI/CD (GitHub + Netlify):** Tạo kho chứa từ xa, liên kết Netlify. Hệ thống website giờ đây tự động Deploy lên mạng toàn cầu thông qua Domain: `https://vimove-platform-v24.netlify.app`.
- **Security & UI:** Dọn dẹp giao diện Đăng nhập trang nhà, ẩn đi các nút tự động Auto-fill ("Demo nhanh") nhằm ra mắt phiên bản Production tĩnh tế, chuyên nghiệp và bảo mật.

---
*Cập nhật lần cuối: Ngày 24/04/2026 bởi AntiGravity Agent.*
