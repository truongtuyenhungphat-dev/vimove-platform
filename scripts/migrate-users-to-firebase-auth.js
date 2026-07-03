#!/usr/bin/env node
/* ================================================================
 * Di trú 16 tài khoản nhân viên (hiện lưu plaintext trong js/data.js
 * DEMO_USERS) sang Firebase Authentication thật + hồ sơ Firestore
 * viwork_users/{uid} (KHÔNG chứa mật khẩu).
 *
 * Chạy MỘT LẦN, trước khi kích hoạt js/auth-firebase.js. An toàn chạy lại
 * nhiều lần (bỏ qua user đã tồn tại trong Firebase Auth).
 *
 * Cài đặt:
 *   cd scripts && npm install firebase-admin
 *
 * Chạy:
 *   GOOGLE_APPLICATION_CREDENTIALS=/duong/dan/service-account.json \
 *     node scripts/migrate-users-to-firebase-auth.js
 *
 * Lấy service-account.json: Firebase Console > Project settings >
 * Service accounts > Generate new private key. KHÔNG commit file này vào git.
 *
 * Giữ nguyên mật khẩu hiện tại của từng người để không gây gián đoạn đăng
 * nhập ngay lập tức — khuyến khích từng người đổi mật khẩu sau khi chuyển
 * sang hệ thống mới (qua js/hr-password-firebase.js).
 * ================================================================ */

const admin = require('firebase-admin');
admin.initializeApp();
const auth = admin.auth();
const db   = admin.firestore();

// Copy đúng nguyên trạng từ js/data.js — DEMO_USERS. Nếu file data.js đã
// thay đổi kể từ khi viết script này, cập nhật lại danh sách bên dưới cho khớp.
const DEMO_USERS = {
  'ngan@vimove.net':    { id: 'u002', name: 'Nguyễn Thị Thanh Ngân',   role: 'admin',   password: 'ngan123',   avatar: 'NTN',  department: 'Quản trị & Phê duyệt' },
  'tuyen@vimove.net':   { id: 'u001', name: 'Trương Ngọc Tuyền',       role: 'admin',   password: 'tuyen123',  avatar: 'TNT',  department: 'Digital & Hỗ trợ kỹ thuật' },
  'chi@vimove.net':     { id: 'u013', name: 'Trịnh Linh Chi',          role: 'admin',   password: 'chi123',    avatar: 'TL',   department: 'HR' },
  'trang@vimove.net':   { id: 'u003', name: 'Nguyễn Thị Quỳnh Trang',  role: 'manager', password: 'trang123',  avatar: 'NQT',  department: 'HR & MKT & Sale' },
  'phuong@vimove.net':  { id: 'u005', name: 'Hoàng Quỳnh Phương',      role: 'manager', password: 'phuong123', avatar: 'HQP',  department: 'Content Lead' },
  'dung.tx@vimove.net': { id: 'u006', name: 'Trương Xuân Dũng',        role: 'manager', password: 'dung123',   avatar: 'TXD',  department: 'Lead Sản phẩm' },
  'hanh@vimove.net':    { id: 'u007', name: 'Vũ Phương Hạnh',          role: 'manager', password: 'hanh123',   avatar: 'VPH',  department: 'Lead Sản phẩm' },
  'loi@vimove.net':     { id: 'u008', name: 'Nguyễn Văn Lợi',          role: 'manager', password: 'loi123',    avatar: 'NV',   department: 'Kênh cá nhân' },
  'thai@vimove.net':    { id: 'u010', name: 'Lê Thị Anh Thái',         role: 'staff',   password: 'thai123',   avatar: 'LTAT', department: 'Content' },
  'mai@vimove.net':     { id: 'u011', name: 'Phạm Thanh Mai',          role: 'staff',   password: 'mai123',    avatar: 'PTM',  department: 'Thiết kế' },
  'dung.kt@vimove.net': { id: 'u012', name: 'Khuất Thị Dung',          role: 'staff',   password: 'dung456',   avatar: 'KT',   department: 'Design' },
  'duyen@vimove.net':   { id: 'u014', name: 'Phạm Mỹ Duyên',           role: 'staff',   password: 'duyen123',  avatar: 'PM',   department: 'Media' },
  'ngan.le@vimove.net': { id: 'u009', name: 'Lê Ngân',                 role: 'staff',   password: 'nganle123', avatar: 'LN',   department: 'Content Marketing' },
  'sang@vimove.net':    { id: 'u015', name: 'Bùi Thị Ngọc Sang',       role: 'staff',   password: 'sang123',   avatar: 'BT',   department: 'Content Marketing' },
  'phong@vimove.net':   { id: 'u016', name: 'Lương Văn Phong',         role: 'staff',   password: 'phong123',  avatar: 'LV',   department: 'Media' },
  'bac@vimove.net':     { id: 'u017', name: 'Lý Việt Bắc',             role: 'staff',   password: 'bac123',    avatar: 'LV',   department: 'Content Marketing' },
};

async function migrateOne(email, u) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`[SKIP] ${email} đã có tài khoản Auth (uid=${userRecord.uid})`);
  } catch (e) {
    if (e.code !== 'auth/user-not-found') throw e;
    userRecord = await auth.createUser({
      email, password: u.password, displayName: u.name,
    });
    console.log(`[CREATED] ${email} → uid=${userRecord.uid}`);
  }

  const profile = {
    id: userRecord.uid, name: u.name, email, role: u.role,
    department: u.department || '', avatar: u.avatar || '',
    positionId: u.positionId || '', jobTitle: u.jobTitle || '',
    kpi: 0, revenue: 0, tasks: 0,
    migratedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection('viwork_users').doc(userRecord.uid).set(profile, { merge: true });
  console.log(`[PROFILE] Đã ghi viwork_users/${userRecord.uid}`);
  return userRecord.uid;
}

async function main() {
  console.log(`Bắt đầu di trú ${Object.keys(DEMO_USERS).length} tài khoản sang Firebase Authentication...\n`);
  let ok = 0, fail = 0;
  for (const [email, u] of Object.entries(DEMO_USERS)) {
    try {
      await migrateOne(email, u);
      ok++;
    } catch (e) {
      fail++;
      console.error(`[LỖI] ${email}:`, e.message || e);
    }
  }
  console.log(`\nHoàn tất: ${ok} thành công, ${fail} lỗi.`);
  if (fail > 0) process.exitCode = 1;
}

main().catch(e => { console.error('Lỗi không mong muốn:', e); process.exitCode = 1; });
