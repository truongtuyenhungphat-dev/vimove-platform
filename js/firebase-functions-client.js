/* ================================================
   VIWORK — Client wrappers cho Cloud Functions (functions/index.js)
   Nạp file này SAU firebase-config.js, và thêm script tag Firebase Functions
   compat SDK trong index.html (xem SECURITY_DEPLOY_GUIDE.md):
     <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-functions-compat.js"></script>
   Cho tới khi được nạp, các hàm window.fbAdminCreateUser / fbGenerateAttendanceQrToken /
   fbVerifyAndCheckInWithQr không tồn tại — các nơi gọi (hr-password-firebase.js,
   team-firebase-auth.js, qr-checkin.js) đều tự kiểm tra typeof trước khi dùng
   nên không phá vỡ app hiện tại nếu chưa deploy Cloud Functions.
   ================================================ */

function _fbCallable(name) {
  return firebase.functions().httpsCallable(name);
}

window.fbAdminCreateUser = async (payload) => {
  const res = await _fbCallable('fbAdminCreateUser')(payload);
  return res.data;
};

window.fbAdminDeleteUser = async (uid) => {
  const res = await _fbCallable('fbAdminDeleteUser')({ uid });
  return res.data;
};

window.fbAdminResetPassword = async (uid, newPassword) => {
  const res = await _fbCallable('fbAdminResetPassword')({ uid, newPassword });
  return res.data;
};

window.fbGenerateAttendanceQrToken = async () => {
  const res = await _fbCallable('generateAttendanceQrToken')({});
  return res.data; // { token, expiresAt }
};

window.fbVerifyAndCheckInWithQr = async (token, coords) => {
  const res = await _fbCallable('verifyAndCheckInWithQr')({
    token,
    lat: coords?.lat,
    lng: coords?.lng,
  });
  return res.data; // { ok, checkIn, withinOffice }
};
