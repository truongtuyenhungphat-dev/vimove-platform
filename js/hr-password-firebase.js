/* ================================================
   VIWORK — Ghi đè saveChangePassword() cho Firebase Authentication
   Nạp file này SAU js/hr.js (và sau khi đã kích hoạt js/auth-firebase.js).
   hr.js định nghĩa saveChangePassword() thao tác trực tiếp trên DEMO_USERS
   (mô hình cũ). Với Firebase Auth, đổi mật khẩu của CHÍNH MÌNH phải qua
   firebase.auth().currentUser.updatePassword(), và đặt lại mật khẩu cho
   NGƯỜI KHÁC (Admin reset hộ) bắt buộc phải qua Cloud Function dùng Admin
   SDK — client SDK không có quyền đổi mật khẩu của người khác.
   Vì đây là function-declaration nạp sau, nó ghi đè bản trong hr.js.
   ================================================ */

async function saveChangePassword(userId, requireOld) {
  const errEl   = document.getElementById('cpError');
  const saveBtn = document.getElementById('cpwSaveBtn');
  const newPass = document.getElementById('cpNewPass')?.value?.trim() || '';
  const confirmVal = document.getElementById('cpConfirmPass')?.value?.trim() || '';

  if (newPass.length < 6) {
    if (errEl) errEl.textContent = '❌ Mật khẩu mới phải có ít nhất 6 ký tự!';
    document.getElementById('cpNewPass')?.focus();
    return;
  }
  if (newPass !== confirmVal) {
    if (errEl) errEl.textContent = '❌ Xác nhận mật khẩu không khớp!';
    document.getElementById('cpConfirmPass')?.focus();
    return;
  }

  const isSelf = userId === currentUser?.id;
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '⏳ Đang lưu...'; }

  try {
    if (isSelf) {
      if (requireOld === 'true' || requireOld === true) {
        const currentPass = document.getElementById('cpCurrentPass')?.value || '';
        const cred = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPass);
        await firebase.auth().currentUser.reauthenticateWithCredential(cred);
      }
      await firebase.auth().currentUser.updatePassword(newPass);
    } else {
      // Admin đặt lại mật khẩu cho người khác — cần Cloud Function Admin SDK
      // (xem functions/index.js: fbAdminResetPassword). Client SDK không thể
      // đổi mật khẩu của một tài khoản khác với chính mình.
      if (!window.fbAdminResetPassword) {
        throw new Error('Chưa triển khai Cloud Function fbAdminResetPassword — xem functions/index.js và SECURITY_DEPLOY_GUIDE.md');
      }
      await window.fbAdminResetPassword(userId, newPass);
    }

    document.getElementById('changePassModal')?.remove();
    showToast('✅ Đổi mật khẩu thành công!', 'success');
  } catch (e) {
    console.error('[saveChangePassword]', e);
    let msg = 'Không thể đổi mật khẩu.';
    if (e.code === 'auth/wrong-password') msg = 'Mật khẩu hiện tại không đúng!';
    else if (e.code === 'auth/requires-recent-login') msg = 'Phiên đăng nhập đã cũ — vui lòng đăng xuất và đăng nhập lại rồi thử tiếp.';
    else if (e.message) msg = e.message;
    if (errEl) errEl.textContent = '❌ ' + msg;
    if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<span class="cpw-save-icon">💾</span> Đổi mật khẩu'; }
  }
}
