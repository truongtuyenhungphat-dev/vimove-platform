/* ================================================
   VIWORK — Auth Module (Firebase Authentication)
   Thay thế js/auth.js: không còn so sánh mật khẩu plaintext trong JS,
   đăng nhập qua Firebase Auth, hồ sơ nhân viên (role/department/...) đọc
   từ Firestore viwork_users/{uid} — không còn chứa mật khẩu.

   CÁCH KÍCH HOẠT (xem SECURITY_DEPLOY_GUIDE.md để biết chi tiết đầy đủ):
   1. Bật Email/Password provider trong Firebase Console > Authentication.
   2. Chạy scripts/migrate-users-to-firebase-auth.js để tạo tài khoản Auth
      thật cho 16 nhân viên hiện có + ghi hồ sơ vào viwork_users/{uid}.
   3. Deploy firestore.rules (`firebase deploy --only firestore:rules`).
   4. Trong index.html, đổi:
        <script src="js/auth.js"></script>
      thành:
        <script src="js/auth-firebase.js"></script>
      (và thêm js/hr-password-firebase.js, js/team-firebase-auth.js sau
      hr.js/app.js — xem hướng dẫn).
   Cho tới khi thực hiện bước 4, file này không được nạp và KHÔNG ảnh hưởng
   gì tới hệ thống đăng nhập hiện tại.
   ================================================ */

let currentUser = null;

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPass').value;
  const err   = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');

  err.textContent = '';

  if (!email || !pass) {
    err.textContent = '⚠️ Vui lòng nhập email và mật khẩu.';
    return;
  }

  btn.innerHTML = '<span>Đang đăng nhập...</span>';
  btn.disabled = true;

  firebase.auth().signInWithEmailAndPassword(email, pass)
    .then(async (cred) => {
      const uid = cred.user.uid;
      const snap = await firebase.firestore().collection('viwork_users').doc(uid).get();
      if (!snap.exists) {
        await firebase.auth().signOut();
        throw new Error('no-profile');
      }
      currentUser = { id: uid, email, ...snap.data() };
      appState.currentUser = currentUser;
      sessionStorage.setItem('vw_user', JSON.stringify(currentUser));
      loginSuccess();
    })
    .catch((e) => {
      console.error('[AUTH] Login error:', e);
      err.textContent = e?.message === 'no-profile'
        ? '❌ Tài khoản chưa có hồ sơ nhân viên. Liên hệ Admin.'
        : '❌ Email hoặc mật khẩu không đúng. Vui lòng thử lại.';
      btn.innerHTML = '<span>Đăng nhập</span><svg viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btn.disabled = false;
    });
}

function loginSuccess() {
  // Apply role class
  document.body.classList.remove('role-admin','role-manager','role-staff');
  document.body.classList.add('role-' + currentUser.role);

  // Update sidebar user info
  const user = currentUser;
  document.getElementById('sidebarName').textContent   = user.name;
  document.getElementById('sidebarRole').textContent   = getAdminLabel(user);
  document.getElementById('sidebarAvatar').textContent = user.avatar;

  // Show admin-only nav items
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = user.role === 'admin' ? '' : 'none';
  });

  // Transition
  const loginScreen = document.getElementById('loginScreen');
  const mainApp     = document.getElementById('mainApp');

  loginScreen.style.opacity = '1';
  loginScreen.style.transition = 'opacity 0.4s ease';
  setTimeout(() => {
    loginScreen.style.opacity = '0';
    setTimeout(() => {
      loginScreen.classList.add('hidden');
      mainApp.classList.remove('hidden');
      // Init app
      initApp();
    }, 400);
  }, 100);
}

function handleLogout() {
  firebase.auth().signOut().catch(e => console.warn('[AUTH] signOut error:', e));
  sessionStorage.removeItem('vw_user');
  currentUser = null;
  appState.currentUser = null;

  document.body.classList.remove('role-admin','role-manager','role-staff');

  const loginScreen = document.getElementById('loginScreen');
  const mainApp     = document.getElementById('mainApp');

  loginScreen.style.opacity = '0';
  loginScreen.style.transition = 'none';
  mainApp.classList.add('hidden');
  loginScreen.classList.remove('hidden');

  // Reset form
  document.getElementById('loginEmail').value = '';
  document.getElementById('loginPass').value  = '';
  document.getElementById('loginError').textContent = '';

  setTimeout(() => {
    loginScreen.style.transition = 'opacity 0.4s ease';
    loginScreen.style.opacity = '1';
  }, 50);

  // Cleanup intervals
  if (typeof _notifWatcherInterval !== 'undefined') clearInterval(_notifWatcherInterval);
  if (typeof attCheckInterval !== 'undefined') clearInterval(attCheckInterval);
  if (typeof elapsedTimer !== 'undefined') clearInterval(elapsedTimer);

  showToast('Đã đăng xuất thành công!', 'info');
}

// Firebase Auth tự khôi phục phiên đăng nhập qua onAuthStateChanged (bất đồng bộ).
// Hàm này trả về false ngay lập tức (khớp chữ ký hàm cũ, gọi đồng bộ trong
// DOMContentLoaded) — nếu có phiên đăng nhập, loginSuccess() sẽ tự chạy khi
// Firebase xác thực xong, thường trong vài trăm mili-giây.
function checkSession() {
  firebase.auth().onAuthStateChanged(async (user) => {
    if (!user) return; // Không có phiên — màn hình đăng nhập đã hiển thị sẵn
    try {
      const snap = await firebase.firestore().collection('viwork_users').doc(user.uid).get();
      if (!snap.exists) {
        console.error('[AUTH] Không tìm thấy hồ sơ nhân viên cho uid:', user.uid);
        await firebase.auth().signOut();
        return;
      }
      currentUser = { id: user.uid, email: user.email, ...snap.data() };
      appState.currentUser = currentUser;
      sessionStorage.setItem('vw_user', JSON.stringify(currentUser));
      loginSuccess();
    } catch (e) {
      console.error('[AUTH] Lỗi khôi phục phiên đăng nhập:', e);
    }
  });
  return false;
}

function getRoleLabel(role) {
  const map = {
    admin:   '👑 Quản trị viên',
    manager: '🎯 Quản lý',
    staff:   '👤 Nhân viên'
  };
  return map[role] || role;
}

// Nhãn phân biệt 2 loại admin dựa vào department
function getAdminLabel(user) {
  if (user.role !== 'admin') return getRoleLabel(user.role);
  if (user.id === 'u002' || (user.department && user.department.includes('Phê duyệt'))) {
    return '👑 Quản trị chính';
  }
  return '🔧 Admin kỹ thuật';
}

function togglePassword() { togglePassField('loginPass'); }

// Generic: toggle visibility for any password input by ID
function togglePassField(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const isHidden = inp.type === 'password';
  inp.type = isHidden ? 'text' : 'password';
  const btn = inp.parentElement?.querySelector('.toggle-pass');
  if (btn) btn.textContent = isHidden ? '🙈' : '👁';
}

function canEdit() {
  return currentUser != null;
}

function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

function isMyTask(task) {
  return task.assigneeId === currentUser?.id;
}
