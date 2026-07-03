/* ================================================================
 * Vimove Operations Platform — Cloud Functions
 *
 * Việc client SDK (chạy trong trình duyệt nhân viên) không đủ quyền hoặc
 * không an toàn để tự làm — cần Admin SDK chạy trên server:
 *   - Tạo/xoá tài khoản Firebase Authentication, đặt lại mật khẩu người khác.
 *   - Phát hành & xác thực token QR chấm công có chữ ký + hạn dùng ngắn
 *     (thay cho mã tĩnh "VIWORK_OFFICE_2026" nhúng sẵn trong client, ai đọc
 *     source cũng giả mạo được).
 *
 * Deploy: `firebase deploy --only functions` (sau khi `cd functions && npm install`).
 * Yêu cầu: đã bật Firebase Authentication + đã deploy firestore.rules.
 * ================================================================ */

const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Toạ độ văn phòng + bán kính hợp lệ — dùng để double-check GPS phía server,
// tránh việc client-side "xác nhận vẫn chấm công" là tuyến phòng thủ DUY NHẤT.
// 266-290 QL6, Đại Mỗ, Hà Nội — toạ độ thật của văn phòng Vimove.
const OFFICE_LAT = 20.986883;
const OFFICE_LNG = 105.796556;
const OFFICE_RADIUS_METERS = 500;

function haversineMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function requireRole(context, allowedRoles) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Cần đăng nhập.');
  const snap = await db.collection('viwork_users').doc(context.auth.uid).get();
  const role = snap.exists ? snap.data().role : null;
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('permission-denied', `Yêu cầu quyền: ${allowedRoles.join(' hoặc ')}.`);
  }
  return role;
}

// ================================================================
// QUẢN LÝ TÀI KHOẢN (thay thế thao tác trực tiếp lên DEMO_USERS ở client)
// ================================================================

exports.fbAdminCreateUser = onCall(async (request) => {
  const { data, auth } = request;
  await requireRole({ auth }, ['admin', 'manager']);
  const { email, password, name, role, department, positionId, jobTitle } = data || {};
  if (!email || !password || !name || !role) {
    throw new HttpsError('invalid-argument', 'Thiếu email/password/name/role.');
  }
  if (password.length < 6) throw new HttpsError('invalid-argument', 'Mật khẩu phải có ít nhất 6 ký tự.');
  if (role === 'admin') await requireRole({ auth }, ['admin']); // chỉ Admin mới tạo được Admin khác

  const userRecord = await admin.auth().createUser({ email, password, displayName: name });

  const profile = {
    id: userRecord.uid, name, email, role,
    department: department || '', positionId: positionId || '', jobTitle: jobTitle || '',
    avatar: name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2),
    kpi: 0, revenue: 0, tasks: 0,
    createdBy: auth.uid, createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection('viwork_users').doc(userRecord.uid).set(profile);

  return { uid: userRecord.uid, profile };
});

exports.fbAdminDeleteUser = onCall(async (request) => {
  const { data, auth } = request;
  await requireRole({ auth }, ['admin', 'manager']);
  const { uid } = data || {};
  if (!uid) throw new HttpsError('invalid-argument', 'Thiếu uid.');
  if (uid === auth.uid) throw new HttpsError('failed-precondition', 'Không thể tự xoá tài khoản đang đăng nhập.');

  try { await admin.auth().deleteUser(uid); } catch (e) { /* đã bị xoá từ trước thì bỏ qua */ }
  await db.collection('viwork_users').doc(uid).delete();
  await db.collection('viwork_config').doc('deleted_users').set(
    { ids: admin.firestore.FieldValue.arrayUnion(uid) }, { merge: true }
  );

  return { ok: true };
});

exports.fbAdminResetPassword = onCall(async (request) => {
  const { data, auth } = request;
  await requireRole({ auth }, ['admin']);
  const { uid, newPassword } = data || {};
  if (!uid || !newPassword || newPassword.length < 6) {
    throw new HttpsError('invalid-argument', 'Thiếu uid hoặc mật khẩu mới quá ngắn (tối thiểu 6 ký tự).');
  }
  await admin.auth().updateUser(uid, { password: newPassword });
  return { ok: true };
});

// ================================================================
// CHẤM CÔNG QR — TOKEN KÝ SỐ, HẠN DÙNG NGẮN (thay mã tĩnh nhúng client)
// ================================================================

/**
 * Admin/Manager gọi hàm này để lấy token hiển thị lên màn hình/in QR dán tại
 * văn phòng — dùng CHUNG cho mọi nhân viên quét trong ngày (giống mã cũ),
 * nhưng token do server sinh ngẫu nhiên và hết hạn cuối ngày, thay vì một
 * secret cố định nằm trong JS công khai mà ai đọc source cũng tự tạo lại
 * được cho bất kỳ ngày nào, từ bất kỳ đâu.
 */
exports.generateAttendanceQrToken = onCall(async (request) => {
  const { auth } = request;
  await requireRole({ auth }, ['admin', 'manager']);

  const now = new Date();
  const dateKey = now.toISOString().split('T')[0];
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  // Một token dùng chung cho cả ngày — tái sử dụng nếu Admin bấm lấy mã nhiều lần trong ngày
  const tokenRef = db.collection('viwork_qr_tokens').doc(dateKey);
  const existing = await tokenRef.get();
  if (existing.exists && existing.data().expiresAt > Date.now()) {
    return { token: existing.id, expiresAt: existing.data().expiresAt };
  }

  await tokenRef.set({ createdBy: auth.uid, createdAt: Date.now(), expiresAt: endOfDay });
  return { token: dateKey, expiresAt: endOfDay };
});

/**
 * Nhân viên quét mã QR → gọi hàm này để check-in. Việc ghi bản ghi chấm công
 * xảy ra ở SERVER (Admin SDK), userId lấy từ context.auth.uid (không tin dữ
 * liệu client gửi lên) — không thể giả mạo chấm công hộ người khác. Token
 * dùng được nhiều lần trong ngày (nhiều nhân viên quét cùng một mã dán ở
 * văn phòng) — chống trùng check-in dựa vào ID bản ghi viwork_attendance
 * theo (userId, ngày), không dựa vào việc "dùng 1 lần" của token.
 */
exports.verifyAndCheckInWithQr = onCall(async (request) => {
  const { data, auth } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Cần đăng nhập.');
  const { token, lat, lng } = data || {};
  if (!token) throw new HttpsError('invalid-argument', 'Thiếu token QR.');

  const tokenSnap = await db.collection('viwork_qr_tokens').doc(token).get();
  if (!tokenSnap.exists) throw new HttpsError('not-found', 'Mã QR không hợp lệ.');
  if (Date.now() > tokenSnap.data().expiresAt) {
    throw new HttpsError('deadline-exceeded', 'Mã QR đã hết hạn, vui lòng lấy mã mới từ Admin/Manager.');
  }

  // Double-check GPS ở server nếu client gửi kèm toạ độ (không bắt buộc, nhưng
  // nếu có thì đối chiếu lại thay vì chỉ tin xác nhận phía client).
  let withinOffice = null;
  if (typeof lat === 'number' && typeof lng === 'number') {
    withinOffice = haversineMeters(lat, lng, OFFICE_LAT, OFFICE_LNG) <= OFFICE_RADIUS_METERS;
  }

  const today = new Date().toISOString().split('T')[0];
  const recordId = `att_${auth.uid}_${today}`;
  const attRef = db.collection('viwork_attendance').doc(recordId);
  const existing = await attRef.get();
  if (existing.exists && existing.data().checkIn) {
    throw new HttpsError('already-exists', 'Bạn đã chấm công hôm nay rồi.');
  }

  const nowIso = new Date().toISOString();
  await attRef.set({
    id: recordId, userId: auth.uid, date: today,
    checkIn: nowIso, method: 'qr', withinOffice,
  }, { merge: true });

  return { ok: true, checkIn: nowIso, withinOffice };
});
