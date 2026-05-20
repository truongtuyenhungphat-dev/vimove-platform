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
  loadUsersFromFirebase(() => {
    showModule('dashboard');
    initRequests();
    renderMyTasks();
    updateBadges();
    updateRequestBadge();
    updateAsgnBadge();
    renderSettingsPanel();
    startNotificationWatcher();
    initAttendance();
    // Realtime listeners
    startUserListener();
    // Lắng nghe xóa user từ máy khác (cross-device delete sync)
    if (window.fbListenDeletedUsers) window.fbListenDeletedUsers();

    // Global Escape key handler for modals
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal-overlay:not(.hidden)');
        if (modals.length > 0) {
          const topModal = modals[modals.length - 1];
          if (topModal.id) closeModal(topModal.id);
          else topModal.remove();
        }
      }
    });
  });
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
    training:    'Đào tạo & Phát triển',
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
    case 'training':    renderTraining();    break;
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
        <button class="stage-item-del" onclick="removeCategory('${k}')" title="Xóa">✕</button>
      </div>
    `).join('');
  }
  // User manager (Admin only)
  renderUserManager();
  // Danger zone
  const dangerCard = document.getElementById('dangerZoneCard');
  if (dangerCard) dangerCard.style.display = currentUser?.role === 'admin' ? '' : 'none';
}

// ---- ADD STAGE ----
function addStage() {
  if (!isAdmin()) { showToast('⚠️ Chỉ Admin mới được thêm giai đoạn!', 'error'); return; }
  const dlg = _createDialog('stage');
  dlg.innerHTML = `
    <div class="modal" style="max-width:380px;padding:0">
      <div class="modal-header"><h2>➕ Thêm giai đoạn CVC</h2></div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label>Tên giai đoạn</label>
          <input id="_sName" placeholder="VD: Đang xem xét" class="form-control" /></div>
        <div class="form-group"><label>Icon (emoji)</label>
          <input id="_sIcon" placeholder="💡" class="form-control" maxlength="4" value="🔵" /></div>
        <div class="form-group"><label>Màu sắc</label>
          <input id="_sColor" type="color" value="#3B82F6" style="width:60px;height:36px;border:none;cursor:pointer;border-radius:8px" /></div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" onclick="document.getElementById('_dlg_stage').remove()">Hủy</button>
        <button class="btn-primary" onclick="_doAddStage()">✅ Thêm</button>
      </div>
    </div>`;
  document.body.appendChild(dlg);
}
function _doAddStage() {
  const name  = document.getElementById('_sName')?.value.trim();
  const icon  = document.getElementById('_sIcon')?.value.trim() || '🔵';
  const color = document.getElementById('_sColor')?.value || '#3B82F6';
  if (!name) { showToast('⚠️ Nhập tên giai đoạn!', 'error'); return; }
  const id = 'stage_' + name.toLowerCase().replace(/[^a-z0-9]/g,'_').substring(0,16) + '_' + Date.now().toString(36);
  STAGES.push({ id, name, icon, color, order: STAGES.length });
  document.getElementById('_dlg_stage')?.remove();
  renderSettingsPanel();
  showToast(`✅ Đã thêm giai đoạn "${icon} ${name}"`, 'success');
}

// ---- REMOVE STAGE ----
function removeStage(id) {
  if (!isAdmin()) { showToast('⚠️ Chỉ Admin mới có thể xóa giai đoạn!', 'error'); return; }
  const inUse = appState.tasks.filter(t => t.stage === id);
  if (inUse.length > 0) { showToast(`⚠️ Không thể xóa — có ${inUse.length} CVC đang ở giai đoạn này!`, 'error'); return; }
  const stage = STAGES.find(s => s.id === id);
  if (!stage) return;
  hrConfirm(`Xóa giai đoạn "${stage.icon} ${stage.name}"?`, 'Hành động không thể hoàn tác.', () => {
    const idx = STAGES.findIndex(s => s.id === id);
    if (idx > -1) STAGES.splice(idx, 1);
    renderSettingsPanel();
    showToast(`🗑️ Đã xóa giai đoạn "${stage.name}"`, 'info');
  });
}

// ---- ADD CATEGORY ----
function addCategory() {
  if (!isAdmin()) { showToast('⚠️ Chỉ Admin mới được thêm danh mục!', 'error'); return; }
  const dlg = _createDialog('cat');
  dlg.innerHTML = `
    <div class="modal" style="max-width:360px;padding:0">
      <div class="modal-header"><h2>➕ Thêm danh mục công việc</h2></div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:14px">
        <div class="form-group"><label>Tên danh mục</label>
          <input id="_cName" placeholder="VD: Kỹ thuật" class="form-control" /></div>
        <div class="form-group"><label>Icon (emoji)</label>
          <input id="_cIcon" placeholder="⚙️" class="form-control" maxlength="4" value="📁" /></div>
      </div>
      <div class="modal-footer">
        <button class="btn-outline" onclick="document.getElementById('_dlg_cat').remove()">Hủy</button>
        <button class="btn-primary" onclick="_doAddCategory()">✅ Thêm</button>
      </div>
    </div>`;
  document.body.appendChild(dlg);
}
function _doAddCategory() {
  const name = document.getElementById('_cName')?.value.trim();
  const icon = document.getElementById('_cIcon')?.value.trim() || '📁';
  if (!name) { showToast('⚠️ Nhập tên danh mục!', 'error'); return; }
  const key = name.toLowerCase().replace(/[\s\W]+/g,'_').replace(/[^a-z0-9_]/g,'').substring(0,20);
  if (CATEGORIES[key]) { showToast('⚠️ Danh mục đã tồn tại!', 'error'); return; }
  CATEGORIES[key] = { name, icon, cssClass: 'cat-custom' };
  document.getElementById('_dlg_cat')?.remove();
  renderSettingsPanel();
  showToast(`✅ Đã thêm danh mục "${icon} ${name}"`, 'success');
}

// ---- REMOVE CATEGORY ----
function removeCategory(key) {
  if (!isAdmin()) { showToast('⚠️ Chỉ Admin mới có thể xóa danh mục!', 'error'); return; }
  const inUse = appState.tasks.filter(t => t.category === key);
  if (inUse.length > 0) { showToast(`⚠️ Có ${inUse.length} CVC đang dùng danh mục này!`, 'error'); return; }
  const cat = CATEGORIES[key];
  if (!cat) return;
  hrConfirm(`Xóa danh mục "${cat.icon} ${cat.name}"?`, 'Hành động không thể hoàn tác.', () => {
    delete CATEGORIES[key];
    renderSettingsPanel();
    showToast(`🗑️ Đã xóa danh mục "${cat.name}"`, 'info');
  });
}

// ---- Helper tạo dialog overlay ----
function _createDialog(suffix) {
  const existing = document.getElementById(`_dlg_${suffix}`);
  if (existing) existing.remove();
  const dlg = document.createElement('div');
  dlg.id = `_dlg_${suffix}`;
  dlg.className = 'modal-overlay';
  dlg.style.cssText = 'z-index:10000;display:flex;align-items:center;justify-content:center;';
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.remove(); });
  return dlg;
}

// ============ USER MANAGEMENT (Gap 5) ============

/**
 * Tải danh sách user từ localStorage (merge với DEMO_USERS)
 */
function getAppUsers() {
  return Object.entries(DEMO_USERS).map(([email, u]) => ({ ...u, email }));
}

function saveAppUsers(users) {
  // Luu danh sach user tuong them (tu DEMO_USERS, ko phai hardcoded)
  const hardcodedIds = new Set(Object.values(DEMO_USERS).map(u => u.id));
  const added = users.filter(u => !hardcodedIds.has(u.id));
  localStorage.setItem('viwork_users', JSON.stringify(added));
}

function renderUserManager() {
  const allUsers = getAppUsers();
  const el = document.getElementById('userManager');
  if (!el) return;

  // Manager chỉ thấy user trong mảng của mình + admin thấy tất cả
  const userIsAdmin = currentUser?.role === 'admin';
  const myDept  = currentUser?.department || '';

  // Loại bỏ duplicate (cùng id giữ 1 bản mới nhất)
  const seen = new Set();
  const users = allUsers.filter(u => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    if (userIsAdmin) return true;
    // Manager: thấy mình + các user cùng department hoặc chưa có department
    return u.id === currentUser?.id ||
           u.role === 'staff' && (u.department?.includes(myDept.split(' ')[0]) || !u.department);
  });

  const addBtnLabel = userIsAdmin ? '+ Thêm người dùng' : '+ Thêm nhân viên';

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
  // Prevent self-deletion
  if (u.id === currentUser?.id) return false;
  // Admin can delete any other account
  if (currentUser?.role === 'admin') return true;
  // Manager can delete only staff accounts
  if (currentUser?.role === 'manager') return u.role === 'staff';
  return false;
}

// Wrapper called by UI button to initiate deletion
function deleteUser(userId) {
  // Find user object to get role info (required for permission check)
  const user = TEAM_MEMBERS.find(m => m.id === userId) || Object.values(DEMO_USERS).find(u => u.id === userId);
  if (!user) {
    console.warn('User not found for deletion:', userId);
    return;
  }
  // Permission check already done in canDeleteUser, but double‑check before proceeding
  if (!canDeleteUser(user)) {
    showToast('⚠️ Bạn không có quyền xóa tài khoản này!', 'error');
    return;
  }
  // Show confirm dialog defined in team.js
  if (typeof confirmDeleteMember === 'function') {
    confirmDeleteMember(userId);
  } else {
    console.warn('confirmDeleteMember not available');
  }
}

function openAddUserModal() {
  const modal = document.getElementById('newUserModal');
  if (!modal) return;

  // Populate position dropdown tu POSITIONS
  const sel = document.getElementById('newUserPosition');
  if (sel && typeof POSITIONS !== 'undefined') {
    sel.innerHTML = '<option value="">— Chọn vị trí —</option>';
    POSITIONS.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.icon} ${p.name}`;
      sel.appendChild(opt);
    });
  }

  // Reset form
  ['newUserName','newUserEmail','newUserPass','newUserDept','newUserJobTitle'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const roleEl = document.getElementById('newUserRole');
  if (roleEl) roleEl.value = 'staff';
  const descEl = document.getElementById('newUserPositionDesc');
  if (descEl) descEl.textContent = '';

  modal.classList.remove('hidden');
}

/** Khi chọn vị trí: tự điền phòng ban + gợi ý vai trò */
function onNewUserPositionChange() {
  const posId = document.getElementById('newUserPosition')?.value;
  if (!posId || typeof POSITIONS === 'undefined') return;

  const pos = POSITIONS.find(p => p.id === posId);
  if (!pos) return;

  // Auto-fill department
  const deptEl = document.getElementById('newUserDept');
  if (deptEl && !deptEl.value) deptEl.value = pos.name;

  // Auto-fill job title gợi ý
  const jdEl = document.getElementById('newUserJobTitle');
  if (jdEl && !jdEl.value) jdEl.placeholder = `VD: ${pos.name}`;

  // Gợi ý role dựa vào level vị trí
  const roleEl = document.getElementById('newUserRole');
  if (roleEl) {
    if (pos.level === 0) roleEl.value = 'admin';
    else if (pos.level === 1) roleEl.value = 'manager';
    else roleEl.value = 'staff';
  }

  // Hiển thị mô tả vị trí
  const descEl = document.getElementById('newUserPositionDesc');
  if (descEl) {
    const memberCount = pos.members?.length || 0;
    descEl.innerHTML = `📄 ${pos.description?.slice(0, 80)}... &nbsp;·&nbsp; 👥 Hiện có ${memberCount} người`;
  }
}

async function saveNewUser() {
  const name      = document.getElementById('newUserName')?.value.trim();
  const email     = document.getElementById('newUserEmail')?.value.trim().toLowerCase();
  const pass      = document.getElementById('newUserPass')?.value;
  const dept      = document.getElementById('newUserDept')?.value.trim();
  const positionId = document.getElementById('newUserPosition')?.value || '';
  const jobTitle  = document.getElementById('newUserJobTitle')?.value.trim() || '';
  let   role      = document.getElementById('newUserRole')?.value || 'staff';

  if (!name || !email || !pass) { showToast('⚠️ Vui lòng điền đủ họ tên, email, mật khẩu!', 'error'); return; }
  if (!positionId) { showToast('⚠️ Vui lòng chọn vị trí cho nhân viên!', 'error'); return; }
  if (currentUser?.role === 'manager' && role === 'admin') {
    showToast('⚠️ Bạn không có quyền tạo tài khoản Admin!', 'error'); return;
  }

  const users = getAppUsers();
  if (users.find(u => u.email === email)) { showToast('⚠️ Email đã tồn tại!', 'error'); return; }

  const pos = (typeof POSITIONS !== 'undefined') ? POSITIONS.find(p => p.id === positionId) : null;
  const department = dept || pos?.name ||
    (currentUser?.role === 'manager' ? currentUser.department : null) ||
    (role === 'admin' ? 'Quản trị' : role === 'manager' ? 'Quản lý' : 'Nhân viên');

  const newUser = {
    id: generateId('u'), name, email, password: pass, role,
    avatar: getInitials(name), department, positionId,
    jobTitle: jobTitle || pos?.name || '',
    createdBy: currentUser?.id,
    createdAt: Date.now(),
  };

  // Cập nhật local state ngay
  users.push(newUser);
  DEMO_USERS[email] = { ...newUser };
  TEAM_MEMBERS.push({
    id: newUser.id, name, role, avatar: newUser.avatar,
    department, positionId, jobTitle: newUser.jobTitle,
    kpi: 0, revenue: 0, tasks: 0
  });
  if (pos && !pos.members.includes(newUser.id)) pos.members.push(newUser.id);
  if (typeof USER_ALLOWANCES !== 'undefined' && !USER_ALLOWANCES[newUser.id]) {
    USER_ALLOWANCES[newUser.id] = { lunch: 700000, transport: 300000, phone: 200000, housing: 0, other: 0, note: '' };
  }

  // Lưu Firebase (await — đợi xác nhận cloud)
  try {
    if (window.fbSaveUser) await window.fbSaveUser({ ...newUser, email });
    saveAppUsers(users);
  } catch(e) {
    console.warn('saveNewUser Firebase error:', e);
    saveAppUsers(users);
    showToast('⚠️ Lưu cloud thất bại, đã lưu offline!', 'info');
  }

  // Clear form và đóng modal
  ['newUserName','newUserEmail','newUserPass','newUserDept','newUserJobTitle'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value='';
  });
  const posEl = document.getElementById('newUserPosition');
  if (posEl) posEl.value = '';
  closeModal('newUserModal');

  syncAllViews();
  showToast(`✅ Đã thêm "${name}" · ${pos ? pos.icon + ' ' + pos.name : role}`, 'success');
}
function syncAllViews() {
  if (typeof renderTeamPage === 'function') renderTeamPage();
  if (typeof renderTeam === 'function') renderTeam();
  if (typeof renderUserManager === 'function') renderUserManager();
  if (typeof renderTeamPage === 'function') renderTeamPage();
  updateBadges?.();
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

    // Them user moi tu localStorage (nguoi dung tu tao) - offline fallback only
    const saved = localStorage.getItem('viwork_users');
    if (saved) {
      const users = JSON.parse(saved);
      users.forEach(u => {
        if (!u.email) return;
        if (deletedIds.has(u.id)) return;
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

// ============ FIREBASE CROSS-DEVICE SYNC ============

/**
 * Tap trung danh sach ID user da bi xoa (tu ca localStorage lan Firestore).
 * Day la "source of truth" duy nhat cho viec loc user bi xoa.
 */
let _deletedUserIds = new Set();

/** Ap dung _deletedUserIds vao TEAM_MEMBERS va DEMO_USERS */
function _applyDeletedIds() {
  for (let i = TEAM_MEMBERS.length - 1; i >= 0; i--) {
    if (_deletedUserIds.has(TEAM_MEMBERS[i].id)) TEAM_MEMBERS.splice(i, 1);
  }
  Object.keys(DEMO_USERS).forEach(em => {
    if (_deletedUserIds.has(DEMO_USERS[em]?.id)) delete DEMO_USERS[em];
  });
}

/**
 * Tai deleted_ids tu BOTH localStorage va Firestore.
 * Merge lai, luu vao _deletedUserIds global va sync localStorage.
 */
async function loadDeletedIds() {
  // 1. Tu localStorage
  try {
    const local = JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]');
    local.forEach(id => _deletedUserIds.add(id));
  } catch(e) {}

  // 2. Tu Firestore (source of truth cross-device)
  const db = window.firebaseDB;
  if (db) {
    try {
      const snap = await db.collection('viwork_config').doc('deleted_users').get();
      if (snap.exists) {
        const ids = snap.data()?.ids || [];
        ids.forEach(id => _deletedUserIds.add(id));
      }
    } catch(e) { console.warn('[loadDeletedIds]', e); }
  }

  // 3. Sync lai vao localStorage de hoat dong offline
  try {
    localStorage.setItem('viwork_deleted_ids', JSON.stringify([..._deletedUserIds]));
  } catch(e) {}

  return _deletedUserIds;
}

/**
 * Load tat ca users tu Firestore khi dang nhap.
 * PHAI load deletedIds TRUOC, sau do moi load users.
 */
async function loadUsersFromFirebase(callback) {
  // Buoc 0: load deleted IDs tu cloud truoc het
  await loadDeletedIds();
  // Ap dung ngay vao hardcoded data
  _applyDeletedIds();

  const db = window.firebaseDB;
  if (!db) {
    loadSavedUsers();
    if (callback) callback();
    return;
  }

  try {
    const snapshot = await db.collection('viwork_users').get();
    if (!snapshot.empty) {
      applyFirebaseUsers(snapshot);
    } else {
      loadSavedUsers();
      window.fbCheckAndSeed?.();
    }
  } catch(err) {
    console.warn('[VIWORK] Firebase load users failed, using local:', err);
    loadSavedUsers();
  }

  if (callback) callback();
}

/**
 * Apply danh sach user tu Firebase snapshot vao DEMO_USERS + TEAM_MEMBERS.
 * Su dung _deletedUserIds da duoc load tu truoc.
 */
function applyFirebaseUsers(snapshot) {
  const hardcodedIds = new Set([
    'u001','u002','u003','u004','u005','u006',
    'u007','u008','u009','u010','u011','u012'
  ]);

  // BUOC 1: Doc snapshot, dedup theo ID
  const fbAllDocs = {};
  snapshot.forEach(doc => {
    const u = doc.data();
    if (u && u.email) fbAllDocs[u.email] = { ...u, _docId: doc.id };
  });

  const demoEmailForId = {};
  Object.entries(DEMO_USERS).forEach(([email, u]) => {
    if (u.id && !demoEmailForId[u.id]) demoEmailForId[u.id] = email;
  });

  const fbUsers     = {};
  const seenIds     = {};
  const aliasEmails = [];

  Object.entries(fbAllDocs).forEach(([email, u]) => {
    if (!u.id) return;
    if (!seenIds[u.id]) {
      seenIds[u.id] = email;
      fbUsers[email] = u;
    } else {
      const primary = demoEmailForId[u.id];
      if (primary && primary === email && primary !== seenIds[u.id]) {
        aliasEmails.push(seenIds[u.id]);
        delete fbUsers[seenIds[u.id]];
        seenIds[u.id] = email;
        fbUsers[email] = u;
      } else {
        aliasEmails.push(email);
      }
    }
  });

  // Xoa alias doc (1 lan/session)
  if (aliasEmails.length > 0 && window.firebaseDB && !sessionStorage.getItem('_vw_alias_cleaned')) {
    sessionStorage.setItem('_vw_alias_cleaned', '1');
    aliasEmails.forEach(email => {
      window.firebaseDB.collection('viwork_users')
        .doc(email.replace(/[@.]/g,'_')).delete().catch(() => {});
    });
  }

  // BUOC 2: Ap dung deleted_ids (da load tu cloud)
  _applyDeletedIds();

  // BUOC 3: Seed hardcoded users con thieu — KHONG seed user da bi xoa
  Object.entries(DEMO_USERS).forEach(([email, u]) => {
    if (hardcodedIds.has(u.id) && !fbUsers[email] && !_deletedUserIds.has(u.id) && window.fbSaveUser) {
      window.fbSaveUser({ ...u, email }).catch(() => {});
    }
  });

  // BUOC 4: Merge Firebase users vao DEMO_USERS + TEAM_MEMBERS
  const mergedIds = new Set();
  Object.entries(fbUsers).forEach(([email, u]) => {
    if (!u.id || _deletedUserIds.has(u.id) || mergedIds.has(u.id)) return;
    mergedIds.add(u.id);

    const existingPass = DEMO_USERS[email]?.password;
    DEMO_USERS[email] = { ...u, password: u.password || existingPass || '' };

    const idx = TEAM_MEMBERS.findIndex(m => m.id === u.id);
    if (idx === -1) {
      TEAM_MEMBERS.push({
        id: u.id, name: u.name, role: u.role,
        avatar: u.avatar || getInitials(u.name),
        department: u.department || '',
        positionId: u.positionId || '', jobTitle: u.jobTitle || '',
        kpi: u.kpi || 0, revenue: u.revenue || 0, tasks: u.tasks || 0,
      });
    } else {
      TEAM_MEMBERS[idx] = {
        ...TEAM_MEMBERS[idx],
        name: u.name, role: u.role,
        avatar: u.avatar || getInitials(u.name),
        department: u.department || TEAM_MEMBERS[idx].department,
        positionId: u.positionId || TEAM_MEMBERS[idx].positionId || '',
        jobTitle: u.jobTitle || TEAM_MEMBERS[idx].jobTitle || '',
      };
    }
  });

  // BUOC 5: Loai bo duplicate trong TEAM_MEMBERS
  const seen = new Set();
  for (let i = TEAM_MEMBERS.length - 1; i >= 0; i--) {
    if (seen.has(TEAM_MEMBERS[i].id) || _deletedUserIds.has(TEAM_MEMBERS[i].id)) {
      TEAM_MEMBERS.splice(i, 1);
    } else {
      seen.add(TEAM_MEMBERS[i].id);
    }
  }

  console.log(`[VIWORK] Synced ${Object.keys(fbUsers).length} users | Deleted: ${_deletedUserIds.size} | Aliases cleaned: ${aliasEmails.length}`);
}
// Bien luu unsubscribe listener de tranh leak
let _userListenerUnsub = null;
let _userListenerTimer = null;  // Debounce timer

/**
 * Bat realtime listener de tu dong cap nhat khi co thay doi tu may khac.
 * Co debounce 1.5s de tranh re-render lien tuc gay dong UI.
 */
function startUserListener() {
  if (_userListenerUnsub) return;
  const db = window.firebaseDB;
  if (!db) return;

  _userListenerUnsub = db.collection('viwork_users').onSnapshot(snapshot => {
    applyFirebaseUsers(snapshot);

    // Debounce UI refresh: chi render sau khi events on dinh 1.5s
    clearTimeout(_userListenerTimer);
    _userListenerTimer = setTimeout(() => {
      const teamContainer = document.getElementById('teamPageContainer');
      if (teamContainer && typeof renderTeamPage === 'function') {
        renderTeamPage();
      }
      if (typeof renderUserManager === 'function') renderUserManager();
      console.log('[VIWORK] User list refreshed after sync');
    }, 1500);
  }, err => {
    console.warn('[VIWORK] User listener error:', err);
  });
}

// ============ ĐỔI MẬT KHẨU (All Users) ============
// Delegate to hr.js version which has eye toggles + admin support
// This wrapper ensures backward compatibility with positions.js calls
// (positions.js calls openChangePasswordModal() with no args → means "self")
