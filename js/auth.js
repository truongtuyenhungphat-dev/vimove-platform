/* ================================================
   VIWORK — Auth Module
   Login / Logout / Role management
   ================================================ */

let currentUser = null;

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
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

  // Simulate async
  setTimeout(() => {
    const user = DEMO_USERS[email.toLowerCase()];
    if (!user || user.password !== pass) {
      err.textContent = '❌ Email hoặc mật khẩu không đúng. Thử: ngan@vimove.vn / ngan123';
      btn.innerHTML = '<span>Đăng nhập</span><svg viewBox="0 0 24 24" fill="none"><path d="M5 12H19M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      btn.disabled = false;
      return;
    }

    currentUser = { ...user, email };
    appState.currentUser = currentUser;

    // Save session
    sessionStorage.setItem('vw_user', JSON.stringify(currentUser));

    loginSuccess();
  }, 800);
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

  showToast('Đã đăng xuất thành công!', 'info');
}

function checkSession() {
  try {
    const saved = sessionStorage.getItem('vw_user');
    if (saved) {
      currentUser = JSON.parse(saved);
      appState.currentUser = currentUser;
      loginSuccess();
      return true;
    }
  } catch(e) {}
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

function togglePassword() {
  const inp = document.getElementById('loginPass');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function canEdit() {
  return currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');
}

function isAdmin() {
  return currentUser && currentUser.role === 'admin';
}

function isMyTask(task) {
  return task.assigneeId === currentUser?.id;
}
