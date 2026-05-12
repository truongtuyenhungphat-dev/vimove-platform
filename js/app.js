/* ================================================
   VIWORK — App Main Entry Point
   Module routing, navigation, initialization
   ================================================ */

// ============ INIT ============
document.addEventListener('DOMContentLoaded', () => {
  initData();
  // Check if already logged in
  if (!checkSession()) {
    // Show login — already visible by default
  }
  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  // Close notifications on outside click
  document.addEventListener('click', e => {
    const panel = document.getElementById('notifPanel');
    const btn   = document.getElementById('notifBtn');
    if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
      panel.classList.add('hidden');
    }
  });
});

// ============ APP INIT (after login) ============
function initApp() {
  // Load saved users into DEMO_USERS (Gap 5)
  loadSavedUsers();
  // Default to dashboard
  showModule('dashboard');
  // Init Sprint 1 modules
  initRequests();
  // Render my tasks badge
  renderMyTasks();
  updateBadges();
  updateRequestBadge();
  // Sprint 2: Assignments badge
  updateAsgnBadge();
  // Settings panel
  renderSettingsPanel();
  // Gap 6: start notification interval
  startNotificationWatcher();
  // Sprint 3: Attendance
  initAttendance();
}

// ============ MODULE NAVIGATION ============
function showModule(module) {
  // Update nav
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
  });
  const navEl = document.getElementById('nav-'+module);
  if (navEl) navEl.classList.add('active');

  // Update page title
  const titles = {
    dashboard:   'Command Center',
    workflow:    'Workflow Board',
    mytasks:     'Việc của tôi',
    crm:         'CRM Khách hàng',
    performance: 'KPI & Hiệu suất',
    team:        'Đội ngũ Vimove',
    requests:    'Đề xuất & Phê duyệt',
    assignments: 'Quản lý Giao việc',
    attendance:  'Chấm công',
    settings:    'Cài đặt hệ thống',
  };
  document.getElementById('pageTitle').textContent = titles[module] || module;

  // Show/hide pages
  document.querySelectorAll('.page').forEach(p => {
    p.classList.add('hidden');
    p.classList.remove('active');
  });
  const page = document.getElementById('page-'+module);
  if (page) {
    page.classList.remove('hidden');
    page.classList.add('active');
  }

  // Render module
  switch(module) {
    case 'dashboard':   renderDashboard();   break;
    case 'workflow':    renderWorkflow();    break;
    case 'mytasks':     renderMyTasks();     break;
    case 'crm':         renderCRM();         break;
    case 'performance': renderPerformance(); break;
    case 'team':        renderTeamPage();    break;
    case 'requests':    renderRequests();    break;
    case 'assignments': renderAssignments(); break;
    case 'attendance':  renderAttendance();  break;
    case 'settings':    renderSettingsPanel(); break;
  }

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
}

// ============ SIDEBAR TOGGLE ============
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('open');
}

// ============ MODAL HELPERS ============
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
  // Clear task detail stage actions to avoid duplicates on reopen
  if (id === 'taskDetailModal') {
    const sa = document.getElementById('stageActions');
    if (sa) sa.innerHTML = '<h4>Chuyển giai đoạn</h4>';
  }
}

// ============ TOAST ============
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
  container.appendChild(toast);
  // Set animation duration
  toast.style.animationDuration = '0.3s, 0.3s';
  toast.style.animationDelay = '0s, 3s';
  setTimeout(() => toast.remove(), 3500);
}

// ============ SETTINGS PANEL ============
function renderSettingsPanel() {
  // Stages manager
  const sm = document.getElementById('stagesManager');
  if (sm) {
    sm.innerHTML = STAGES.map(s => `
      <div class="stage-item">
        <div class="stage-item-color" style="background:${s.color}"></div>
        <span class="stage-item-name">${s.icon} ${s.name}</span>
        <button class="stage-item-del" onclick="removeStage('${s.id}')" title="Xóa">✕</button>
      </div>
    `).join('');
  }
  // Categories manager
  const cm = document.getElementById('categoriesManager');
  if (cm) {
    cm.innerHTML = Object.entries(CATEGORIES).map(([k,v]) => `
      <div class="stage-item">
        <div class="stage-item-color" style="background:var(--c-primary)"></div>
        <span class="stage-item-name">${v.icon} ${v.name}</span>
        <button class="stage-item-del" title="Xóa">✕</button>
      </div>
    `).join('');
  }
  // User manager (Admin only)
  renderUserManager();

  // ⚠️ Vùng nguy hiểm — CHỈ hiển thị với Tech Admin u001 (tuyen@vimove.vn)
  const dangerCard = document.getElementById('dangerZoneCard');
  if (dangerCard) {
    dangerCard.style.display = currentUser?.id === 'u001' ? '' : 'none';
  }
}

function addStage() { showToast('🔧 Tính năng thêm giai đoạn sẽ có trong bản tiếp theo!', 'info'); }

function removeStage(id) {
  // Chỉ Admin mới được xóa giai đoạn
  if (!isAdmin()) {
    showToast('⚠️ Chỉ Admin mới có thể xóa giai đoạn!', 'error');
    return;
  }

  // Kiểm tra có CVC nào đang dùng giai đoạn này không
  const inUse = appState.tasks.filter(t => t.stage === id);
  if (inUse.length > 0) {
    showToast(`⚠️ Không thể xóa — có ${inUse.length} CVC đang ở giai đoạn này!`, 'error');
    return;
  }

  // Tìm giai đoạn cần xóa
  const stage = STAGES.find(s => s.id === id);
  if (!stage) { showToast('⚠️ Không tìm thấy giai đoạn!', 'error'); return; }

  if (!confirm(`Xóa giai đoạn "${stage.icon} ${stage.name}"?`)) return;

  // Xóa khỏi mảng STAGES
  const idx = STAGES.findIndex(s => s.id === id);
  if (idx > -1) STAGES.splice(idx, 1);

  renderSettingsPanel();
  showToast(`🗑️ Đã xóa giai đoạn "${stage.name}"`, 'info');
}

function addCategory() { showToast('🔧 Tính năng thêm danh mục sẽ có trong bản tiếp theo!', 'info'); }

// ============ USER MANAGEMENT (Gap 5) ============

/**
 * Tải danh sách user từ localStorage (merge với DEMO_USERS)
 */
function getAppUsers() {
  return Object.entries(DEMO_USERS).map(([email, u]) => ({ ...u, email }));
}

function saveAppUsers(users) {
  // Luu danh sach user tuong them (tu DEMO_USERS, ko phai hardcoded)
  const hardcodedIds = new Set([
    'u001','u002','u003','u004','u005','u006',
    'u007','u008','u009','u010','u011','u012'
  ]);
  const added = users.filter(u => !hardcodedIds.has(u.id));
  localStorage.setItem('viwork_users', JSON.stringify(added));
}

function renderUserManager() {
  const allUsers = getAppUsers();
  const el = document.getElementById('userManager');
  if (!el) return;

  // Manager chỉ thấy user trong mảng của mình + admin thấy tất cả
  const isAdmin = currentUser?.role === 'admin';
  const myDept  = currentUser?.department || '';

  // Loại bỏ duplicate (cùng id giữ 1 bản mới nhất)
  const seen = new Set();
  const users = allUsers.filter(u => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    if (isAdmin) return true;
    // Manager: thấy mình + các user cùng department hoặc chưa có department
    return u.id === currentUser?.id ||
           u.role === 'staff' && (u.department?.includes(myDept.split(' ')[0]) || !u.department);
  });

  const addBtnLabel = isAdmin ? '+ Thêm người dùng' : '+ Thêm nhân viên';

  el.innerHTML = users.map(u => `
    <div class="stage-item" style="padding:10px 12px;height:auto">
      <div class="user-avatar" style="width:32px;height:32px;font-size:11px;flex-shrink:0">${u.avatar || getInitials(u.name)}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${escHtml(u.name)}</div>
        <div style="font-size:11px;color:var(--c-text-3)">${u.email} · ${getAdminLabel(u)}</div>
        <div style="font-size:11px;color:var(--c-text-3);margin-top:2px">🏢 ${escHtml(u.department || '—')}</div>
     </div>
      ${canDeleteUser(u) ? `
        <button class="btn-danger sm" onclick="deleteUser('${u.id}')" style="padding:3px 8px;font-size:11px">❎ Xóa</button>
      ` : u.id === currentUser?.id
          ? '<span style="font-size:10px;color:var(--c-primary-light)">• Bạn</span>'
          : ''}
    </div>
  `).join('');

  const btnMain = document.getElementById('btnAddUserMain');
  if (btnMain) btnMain.textContent = addBtnLabel;
}

// Kiểm tra có thể xóa user không:
// - Không xóa chính mình
// - Admin xóa được tất cả (trừ admin khác)
// - Manager chỉ xóa được staff trong mảng của mình
function canDeleteUser(u) {
  if (u.id === currentUser?.id) return false;
  if (currentUser?.role === 'admin') return u.role !== 'admin';
  if (currentUser?.role === 'manager') return u.role === 'staff';
  return false;
}

function openAddUserModal() {
  const modal = document.getElementById('newUserModal');
  if (modal) modal.classList.remove('hidden');
}

function saveNewUser() {
  const name   = document.getElementById('newUserName')?.value.trim();
  const email  = document.getElementById('newUserEmail')?.value.trim().toLowerCase();
  const pass   = document.getElementById('newUserPass')?.value;
  const dept   = document.getElementById('newUserDept')?.value.trim();
  let   role   = document.getElementById('newUserRole')?.value || 'staff';

  if (!name || !email || !pass) { showToast('⚠️ Vui lòng điền đủ thông tin!', 'error'); return; }

  // Phân quyền tạo: Manager không được tạo admin
  if (currentUser?.role === 'manager' && role === 'admin') {
    showToast('⚠️ Bạn không có quyền tạo tài khoản Admin!', 'error');
    return;
  }

  const users = getAppUsers();
  if (users.find(u => u.email === email)) { showToast('⚠️ Email đã tồn tại!', 'error'); return; }

  // Nếu là manager tạo nhân viên và không điền department, tự động dùng department của manager
  const department = dept ||
    (currentUser?.role === 'manager' ? currentUser.department : null) ||
    (role === 'admin' ? 'Quản trị' : role === 'manager' ? 'Quản lý' : 'Nhân viên');

  const newUser = {
    id:         generateId('u'),
    name,
    email,
    password:   pass,
    role,
    avatar:     getInitials(name),
    department,
    createdBy:  currentUser?.id,   // ghi lại người tạo
  };

  users.push(newUser);
  // Also add to DEMO_USERS so login works immediately
  DEMO_USERS[email] = { ...newUser };
  // Add to TEAM_MEMBERS
  TEAM_MEMBERS.push({ id: newUser.id, name, role, avatar: newUser.avatar, department, kpi: 0, revenue: 0, tasks: 0 });
  // Init phu cap mac dinh cho thanh vien moi
  if (typeof USER_ALLOWANCES !== 'undefined' && !USER_ALLOWANCES[newUser.id]) {
    USER_ALLOWANCES[newUser.id] = { lunch: 700000, transport: 300000, phone: 200000, housing: 0, other: 0, note: '' };
  }

  if (window.fbSaveUser) window.fbSaveUser(newUser);
  saveAppUsers(users);

  // Clear form
  ['newUserName','newUserEmail','newUserPass','newUserDept'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
  closeModal('newUserModal');

  // Refresh dung view dang active
  if (document.getElementById('teamPageContainer')) renderTeamPage();
  if (typeof renderUserManager === 'function') renderUserManager();
  showToast(`\u2705 \u0110\u00e3 th\u00eam "${name}" (${role === 'manager' ? 'Team Lead' : 'Nh\u00e2n vi\u00ean'}) v\u00e0o h\u1ec7 th\u1ed1ng!`, 'success');
}

function deleteUser(userId) {
  const users = getAppUsers();
  const target = users.find(u => u.id === userId);
  if (!target) return;

  // Kiểm tra quyền xóa
  if (!canDeleteUser(target)) {
    showToast('⚠️ Bạn không có quyền xóa tài khoản này!', 'error');
    return;
  }

  if (!confirm(`Xóa tài khoản "${target.name}"?`)) return;

  const updated = users.filter(u => u.id !== userId);
  if (window.fbDeleteUser && target.email) window.fbDeleteUser(target.email);
  saveAppUsers(updated);
  // Remove from DEMO_USERS
  const entry = Object.entries(DEMO_USERS).find(([,u]) => u.id === userId);
  if (entry) delete DEMO_USERS[entry[0]];
  // Luu ID da xoa de khoi phuc sau refresh
  try {
    const deleted = JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]');
    if (!deleted.includes(userId)) deleted.push(userId);
    localStorage.setItem('viwork_deleted_ids', JSON.stringify(deleted));
  } catch(e) {}
  // Xoa khoi TEAM_MEMBERS
  const tmIdx = TEAM_MEMBERS.findIndex(m => m.id === userId);
  if (tmIdx > -1) TEAM_MEMBERS.splice(tmIdx, 1);
  renderUserManager();
  showToast(`🗑️ Đã xóa tài khoản "${target.name}"!`, 'info');
}

// Khoi dong: load users vao DEMO_USERS khi start app
function loadSavedUsers() {
  try {
    // Lay danh sach ID da xoa
    const deletedIds = new Set(JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]'));

    // Xoa nhung user hardcoded bi xoa khoi TEAM_MEMBERS va DEMO_USERS
    if (deletedIds.size > 0) {
      deletedIds.forEach(id => {
        const tmIdx = TEAM_MEMBERS.findIndex(m => m.id === id);
        if (tmIdx > -1) TEAM_MEMBERS.splice(tmIdx, 1);
        const duEntry = Object.entries(DEMO_USERS).find(([,u]) => u.id === id);
        if (duEntry) delete DEMO_USERS[duEntry[0]];
      });
    }

    // Them user moi tu localStorage (nguoi dung tu tao)
    const saved = localStorage.getItem('viwork_users');
    if (saved) {
      const users = JSON.parse(saved);
      users.forEach(u => {
        if (!u.email) return;
        if (deletedIds.has(u.id)) return; // Da bi xoa
        DEMO_USERS[u.email] = { ...u };
        if (!TEAM_MEMBERS.find(m => m.id === u.id)) {
          TEAM_MEMBERS.push({
            id: u.id, name: u.name, role: u.role,
            avatar: u.avatar || getInitials(u.name),
            department: u.department || 'Nhan vien',
            kpi: 0, revenue: 0, tasks: 0
          });
        }
      });
    }
  } catch(e) { console.warn('loadSavedUsers:', e); }
}
