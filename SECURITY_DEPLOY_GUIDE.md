# Hướng dẫn triển khai nâng cấp bảo mật — Vimove Operations Platform

Tài liệu này hướng dẫn kích hoạt phần bảo mật đã được chuẩn bị sẵn trong repo
(firestore.rules, Firebase Authentication, Cloud Functions, token QR ký số).
**Tất cả các bước dưới đây đều do bạn tự thực hiện** — máy trợ lý AI không có
quyền đăng nhập Firebase CLI/Console để tự deploy thay bạn.

**An toàn khi dừng giữa chừng**: cho tới khi bạn hoàn thành **Bước 6**, app vẫn
dùng `js/auth.js` cũ (mật khẩu plaintext, không có Firestore rules) — nghĩa là
đăng nhập/vận hành hàng ngày **không bị ảnh hưởng** trong lúc bạn làm các bước
1-5. Bạn có thể dừng và tiếp tục vào lúc khác.

**Khuyến nghị**: thực hiện lần đầu ngoài giờ hành chính, và nếu có thể, thử
trước bằng [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
(`firebase emulators:start`) trước khi làm trên project thật — bộ rule/Cloud
Function trong repo này được viết dựa trên đọc lại logic client, **chưa được
kiểm thử trực tiếp** trên project Firebase thật của bạn.

---

## Bước 1 — Bật Email/Password provider

Firebase Console → chọn project → **Authentication** → tab **Sign-in method**
→ bật **Email/Password**.

## Bước 2 — Cài Firebase CLI và đăng nhập

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>       # project-id: xem trong firebase-config.js (projectId: "vimove-platform")
```

## Bước 3 — Chạy script di trú tài khoản

Tải file service-account key: Firebase Console → **Project settings** →
**Service accounts** → **Generate new private key**. Lưu file này ở nơi an
toàn, **không commit vào git**.

```bash
cd scripts
npm install
GOOGLE_APPLICATION_CREDENTIALS=/duong/dan/service-account.json \
  node migrate-users-to-firebase-auth.js
```

Script sẽ tạo 16 tài khoản Firebase Authentication (giữ nguyên mật khẩu hiện
tại của từng người) và ghi hồ sơ vào Firestore `viwork_users/{uid}` (không có
trường mật khẩu). An toàn chạy lại nhiều lần — bỏ qua tài khoản đã tồn tại.

## Bước 4 — Cập nhật toạ độ văn phòng thật

Mở `functions/index.js`, sửa hai hằng số ở đầu file (đang là toạ độ mẫu tại
Hà Nội):

```js
const OFFICE_LAT = 21.028511;
const OFFICE_LNG = 105.804817;
```

Thay bằng toạ độ GPS thật của văn phòng Vimove (dùng Google Maps → chuột phải
tại vị trí văn phòng → copy toạ độ).

## Bước 5 — Deploy Firestore Rules và Cloud Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only firestore:rules,functions
```

Kiểm tra trên Firebase Console → **Functions** thấy 5 hàm:
`fbAdminCreateUser`, `fbAdminDeleteUser`, `fbAdminResetPassword`,
`generateAttendanceQrToken`, `verifyAndCheckInWithQr`.

## Bước 6 — Kích hoạt phía client (index.html)

Mở `index.html`, tìm khối script Firebase gần cuối file (dòng ~1033-1067).

**6a. Thêm 2 SDK còn thiếu**, ngay dưới dòng SDK Firestore hiện có:
```html
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-functions-compat.js"></script>
```

**6b. Đổi dòng auth.js** — tìm:
```html
<script src="js/auth.js?v=1781686299"></script>
```
đổi thành:
```html
<script src="js/auth-firebase.js?v=1"></script>
```

**6c. Thêm `firebase-functions-client.js` ngay sau `firebase-config.js`:**
```html
<script src="js/firebase-config.js?v=1781686299"></script>
<script src="js/firebase-functions-client.js?v=1"></script>
```

**6d. Thêm `hr-password-firebase.js` ngay sau `hr.js`:**
```html
<script src="js/hr.js?v=1781686299"></script>
<script src="js/hr-password-firebase.js?v=1"></script>
```

**6e. Thêm `team-firebase-auth.js` ngay sau `app.js`** (dòng cuối cùng của khối script):
```html
<script src="js/app.js?v=1781686299"></script>
<script src="js/team-firebase-auth.js?v=1"></script>
```

Deploy lại lên Netlify (push code — CI/CD tự deploy theo `netlify.toml` hiện có).

## Bước 7 — Kiểm thử

Thử ngay các luồng chính với một tài khoản không quan trọng trước:
- Đăng nhập / đăng xuất
- Đổi mật khẩu (cả tự đổi và Admin đổi hộ người khác)
- Admin: thêm nhân viên mới, xoá nhân viên
- Chấm công QR (Admin mở mã QR mới, nhân viên quét)
- Mọi thao tác CVC/CRM/Giao việc/Đề xuất vẫn hoạt động bình thường (rules mới
  không chặn nhầm)

Nếu một luồng nào đó báo lỗi "permission-denied", đối chiếu `firestore.rules`
với thao tác đó — rules có thể cần điều chỉnh cho khớp một trường hợp nghiệp
vụ chưa lường hết (xem ghi chú trong chính file `firestore.rules`).

## Bước 8 — Dọn dẹp mật khẩu cũ (sau khi ổn định vài ngày)

Sau khi xác nhận mọi người đăng nhập được bình thường qua Firebase Auth, mở
`js/data.js`, xoá trường `password` khỏi từng entry trong `DEMO_USERS` (không
xoá ngay ở bước 6 để có đường lùi nếu cần rollback nhanh về `js/auth.js`
trong vài ngày đầu).

## Rollback

Nếu có sự cố sau Bước 6: đổi lại dòng script `js/auth-firebase.js` về
`js/auth.js`, gỡ 3 dòng script thêm ở 6c-6e, deploy lại. `DEMO_USERS` trong
`js/data.js` vẫn còn nguyên (chưa bị xoá cho tới Bước 8) nên đăng nhập kiểu cũ
hoạt động lại ngay.
