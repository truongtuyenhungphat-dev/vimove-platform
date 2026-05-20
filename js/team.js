/* ================================================
   VIWORK — Team Module
   Leaderboard, member management
   ================================================ */

function renderTeam() {
  const board = document.getElementById('teamLeaderboard');
  if (!board) return;

  const canManage = currentUser?.role === 'admin' || currentUser?.role === 'manager';
  const sorted = [...TEAM_MEMBERS].sort((a,b) => b.revenue - a.revenue);
  const rankEmoji = ['🥇','🥈','🥉'];

  board.innerHTML = sorted.map((m, i) => {
    const medal    = rankEmoji[i] || `#${i+1}`;
    const kpiColor = m.kpi >= 90 ? '#10B981' : m.kpi >= 70 ? '#F59E0B' : '#EF4444';
    const isMe     = m.id === currentUser?.id;

    // Nút chỉnh sửa: Admin thấy tất cả, Manager thấy staff của mình
    const canEdit = canManage && !( m.role === 'admin' && currentUser?.role !== 'admin' );
    const editBtn = canEdit ? `
      <button class="member-edit-btn" onclick="openEditMemberModal('${m.id}')" title="Chỉnh sửa thành viên">
        ✏️
      </button>` : '';

    // Nút xóa: chỉ Admin mới xóa được (không xóa chính mình, không xóa admin khác nếu không phải admin)
    const canDelete = currentUser?.role === 'admin' && m.id !== currentUser?.id;
    const deleteBtn = canDelete ? `
      <button class="member-delete-btn" onclick="confirmDeleteMember('${m.id}')" title="Xóa thành viên">
        🗑️
      </button>` : '';

    return `
      <div class="member-card${isMe ? ' member-card-me' : ''}">
        ${editBtn}
        ${deleteBtn}
        <div class="member-rank">${medal}</div>
        <div class="member-avatar">${m.avatar}</div>
        <div class="member-name">${escHtml(m.name)} ${isMe ? '<span class="member-me-tag">Bạn</span>' : ''}</div>
        <div class="member-role">${escHtml(m.department || '—')}</div>
        <div class="member-badge-role">${getRoleLabel(m.role)}</div>
        <div class="member-stats">
          <div class="m-stat">
            <div class="m-stat-val" style="color:#10B981">${m.revenue}B</div>
            <div class="m-stat-lbl">Doanh thu</div>
          </div>
          <div class="m-stat">
            <div class="m-stat-val" style="color:${kpiColor}">${m.kpi}%</div>
            <div class="m-stat-lbl">KPI</div>
          </div>
          <div class="m-stat">
            <div class="m-stat-val">${m.tasks}</div>
            <div class="m-stat-lbl">CVC</div>
          </div>
        </div>
        <div style="margin-top:12px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--c-text-3);margin-bottom:4px">
            <span>KPI tháng này</span><span style="color:${kpiColor}">${m.kpi}%</span>
          </div>
          <div class="kpi-bar-wrap">
            <div class="kpi-bar" style="width:${m.kpi}%;background:${kpiColor}"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============ OPEN EDIT MODAL ============
function openEditMemberModal(memberId) {
  const member = TEAM_MEMBERS.find(m => m.id === memberId);
  if (!member) { showToast('⚠️ Không tìm thấy thành viên!', 'error'); return; }

  if (currentUser?.role === 'manager' && member.role === 'admin') {
    showToast('⚠️ Bạn không có quyền chỉnh sửa Admin!', 'error');
    return;
  }

  const userEntry = Object.entries(DEMO_USERS).find(([,u]) => u.id === memberId);
  const email     = userEntry ? userEntry[0] : '';
  const userData  = userEntry ? userEntry[1] : {};

  // Điền dữ liệu cơ bản
  document.getElementById('editMemberId').value       = memberId;
  document.getElementById('editMemberName').value     = member.name;
  document.getElementById('editMemberEmail').value    = email;
  document.getElementById('editMemberDept').value     = member.department || '';
  document.getElementById('editMemberKpi').value      = member.kpi || 0;
  document.getElementById('editMemberRevenue').value  = member.revenue || 0;
  document.getElementById('editMemberPass').value     = '';
  document.getElementById('editMemberJobTitle').value = userData.jobTitle || member.jobTitle || '';

  // Role select
  const roleSelect = document.getElementById('editMemberRole');
  roleSelect.value    = member.role;
  roleSelect.disabled = currentUser?.role !== 'admin';

  // Populate + pre-select position dropdown
  const posSel = document.getElementById('editMemberPosition');
  if (posSel && typeof POSITIONS !== 'undefined') {
    posSel.innerHTML = '<option value="">— Chưa phân công vị trí —</option>';
    POSITIONS.forEach(p => {
      const opt = document.createElement('option');
      opt.value       = p.id;
      opt.textContent = `${p.icon} ${p.name}`;
      // Pre-select: tìm vị trí đang chứa memberId HOẶC khớp positionId đã lưu
      if (p.members?.includes(memberId) || p.id === (userData.positionId || member.positionId)) {
        opt.selected = true;
      }
      posSel.appendChild(opt);
    });
    // Hiện mô tả vị trí hiện tại
    const curPos = POSITIONS.find(p => p.members?.includes(memberId) || p.id === (userData.positionId || member.positionId));
    const descEl = document.getElementById('editMemberPositionDesc');
    if (descEl && curPos) {
      descEl.innerHTML = `📄 ${curPos.description?.slice(0, 80)}... &nbsp;·&nbsp; 👥 ${curPos.members?.length || 0} người`;
    } else if (descEl) {
      descEl.textContent = '';
    }
  }

  document.getElementById('editMemberModalTitle').textContent = `✏️ Chỉnh sửa: ${member.name}`;
  document.getElementById('editMemberModal').classList.remove('hidden');
}

/** Khi thay đổi vị trí trong modal edit: auto-fill dept */
function onEditMemberPositionChange() {
  const posId = document.getElementById('editMemberPosition')?.value;
  const descEl = document.getElementById('editMemberPositionDesc');
  if (!posId || typeof POSITIONS === 'undefined') {
    if (descEl) descEl.textContent = '';
    return;
  }
  const pos = POSITIONS.find(p => p.id === posId);
  if (!pos) return;

  // Gợi ý auto-fill phòng ban nếu đang trống
  const deptEl = document.getElementById('editMemberDept');
  if (deptEl && !deptEl.value) deptEl.value = pos.name;

  // Cập nhật mô tả
  if (descEl) {
    descEl.innerHTML = `📄 ${pos.description?.slice(0, 80)}... &nbsp;·&nbsp; 👥 ${pos.members?.length || 0} người`;
  }

  // Gợi ý role theo level
  const roleEl = document.getElementById('editMemberRole');
  if (roleEl && !roleEl.disabled) {
    if (pos.level === 0)      roleEl.value = 'admin';
    else if (pos.level === 1) roleEl.value = 'manager';
    else                      roleEl.value = 'staff';
  }
}

// ============ SAVE EDIT MEMBER ============
async function saveEditMember() {
  const memberId   = document.getElementById('editMemberId').value;
  const name       = document.getElementById('editMemberName').value.trim();
  const dept       = document.getElementById('editMemberDept').value.trim();
  const kpi        = parseInt(document.getElementById('editMemberKpi').value) || 0;
  const revenue    = parseFloat(document.getElementById('editMemberRevenue').value) || 0;
  const newPass    = document.getElementById('editMemberPass').value;
  const role       = document.getElementById('editMemberRole').value;
  const positionId = document.getElementById('editMemberPosition')?.value || '';
  const jobTitle   = document.getElementById('editMemberJobTitle')?.value.trim() || '';

  if (!name) { showToast('⚠️ Tên không được để trống!', 'error'); return; }
  if (kpi < 0 || kpi > 200) { showToast('⚠️ KPI phải từ 0–200%!', 'error'); return; }

  // Cập nhật POSITIONS.members: xóa khỏi vị trí cũ, thêm vào vị trí mới
  if (typeof POSITIONS !== 'undefined') {
    // Tìm vị trí cũ
    const oldPos = POSITIONS.find(p => p.members?.includes(memberId));
    if (oldPos && oldPos.id !== positionId) {
      oldPos.members = oldPos.members.filter(id => id !== memberId);
    }
    // Thêm vào vị trí mới
    if (positionId) {
      const newPos = POSITIONS.find(p => p.id === positionId);
      if (newPos && !newPos.members.includes(memberId)) {
        newPos.members.push(memberId);
      }
    }
  }

  // Cập nhật TEAM_MEMBERS
  const idx = TEAM_MEMBERS.findIndex(m => m.id === memberId);
  if (idx > -1) {
    TEAM_MEMBERS[idx] = {
      ...TEAM_MEMBERS[idx],
      name, department: dept, kpi, revenue, role,
      avatar: getInitials(name),
      positionId, jobTitle,
    };
  }

  // Cập nhật DEMO_USERS
  const userEntry = Object.entries(DEMO_USERS).find(([,u]) => u.id === memberId);
  if (userEntry) {
    const [email, user] = userEntry;
    DEMO_USERS[email] = {
      ...user,
      name, department: dept, role,
      avatar: getInitials(name),
      positionId, jobTitle,
      ...(newPass ? { password: newPass } : {}),
    };
    if (window.fbSaveUser) {
      await window.fbSaveUser({ ...DEMO_USERS[email], email });
    }
  }

  // Nếu edit chính mình
  if (currentUser?.id === memberId) {
    currentUser.name       = name;
    currentUser.department = dept;
    currentUser.role       = role;
    currentUser.avatar     = getInitials(name);
    currentUser.positionId = positionId;
    currentUser.jobTitle   = jobTitle;
    appState.currentUser   = currentUser;
    sessionStorage.setItem('vw_user', JSON.stringify(currentUser));
    document.getElementById('sidebarName').textContent   = name;
    document.getElementById('sidebarAvatar').textContent = currentUser.avatar;
  }

  closeModal('editMemberModal');
  syncAllViews();
  showToast(`✅ Đã cập nhật thông tin "${name}" thành công!`, 'success');
}

// ============ DELETE MEMBER ============
function confirmDeleteMember(memberId) {
  // Debug: in ra role hiện tại
  console.log('[DELETE] currentUser role:', currentUser?.role, '| memberId:', memberId);

  const role = currentUser?.role;
  if (role !== 'admin' && role !== 'manager') {
    showToast('⚠️ Chỉ Admin hoặc Manager mới có quyền xóa thành viên!', 'error'); return;
  }
  if (memberId === currentUser?.id) {
    showToast('⚠️ Không thể xóa tài khoản đang đăng nhập!', 'error'); return;
  }

  // Lấy member từ TEAM_MEMBERS hoặc DEMO_USERS
  let member = TEAM_MEMBERS.find(m => m.id === memberId);
  if (!member) {
    const entry = Object.values(DEMO_USERS).find(u => u.id === memberId);
    if (entry) member = entry;
  }
  if (!member) { showToast('⚠️ Không tìm thấy thành viên!', 'error'); return; }

  // Manager chỉ xóa được staff
  if (role === 'manager' && member.role !== 'staff') {
    showToast('⚠️ Manager chỉ có thể xóa nhân viên (staff)!', 'error'); return;
  }

  // Bảo vệ admin cuối cùng
  if (member.role === 'admin') {
    const adminCount = TEAM_MEMBERS.filter(m => m.role === 'admin').length;
    if (adminCount <= 1) { showToast('⚠️ Hệ thống cần ít nhất 1 Admin!', 'error'); return; }
  }

  // Custom confirm dialog thay thế confirm() bị block trên Netlify
  hrConfirm(
    `Xóa thành viên "${member.name}"?`,
    'Hành động này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống.',
    () => doDeleteMember(memberId, member)
  );
}

async function doDeleteMember(memberId, member) {
  const userEntry = Object.entries(DEMO_USERS).find(([,u]) => u.id === memberId);
  const email = userEntry ? userEntry[0] : null;

  // 1. Xóa trên Firebase + đánh dấu deleted để đồng bộ máy khác
  if (email && window.fbDeleteUser) {
    try { await window.fbDeleteUser(email); }
    catch(e) { console.warn('[delete] Firebase error:', e); }
  }
  // Ghi deleted_id lên Firestore → tất cả máy đang online sẽ nhận và xóa ngay
  if (window.fbMarkUserDeleted) {
    window.fbMarkUserDeleted(memberId).catch(e => console.warn('[fbMarkUserDeleted]', e));
  }

  // 2. Xóa tất cả DEMO_USERS entries có cùng ID (kể cả alias)
  Object.keys(DEMO_USERS).forEach(em => {
    if (DEMO_USERS[em]?.id === memberId) delete DEMO_USERS[em];
  });

  // 3. Xóa TEAM_MEMBERS
  const idx = TEAM_MEMBERS.findIndex(m => m.id === memberId);
  if (idx > -1) TEAM_MEMBERS.splice(idx, 1);

  // 4. Xóa khỏi POSITIONS.members
  if (typeof POSITIONS !== 'undefined') {
    POSITIONS.forEach(p => {
      if (p.members?.includes(memberId))
        p.members = p.members.filter(id => id !== memberId);
    });
  }

  // 5. Un-assign tasks
  if (typeof appState !== 'undefined') {
    appState.tasks?.forEach(t => { if (t.assigneeId === memberId) t.assigneeId = null; });
  }

  // 6. Lưu deleted_ids + viwork_users vào localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('viwork_users') || '[]');
    localStorage.setItem('viwork_users', JSON.stringify(saved.filter(u => u.id !== memberId)));

    const deleted = JSON.parse(localStorage.getItem('viwork_deleted_ids') || '[]');
    if (!deleted.includes(memberId)) deleted.push(memberId);
    localStorage.setItem('viwork_deleted_ids', JSON.stringify(deleted));
  } catch(e) {}

  // 7. Xóa phụ cấp
  if (typeof USER_ALLOWANCES !== 'undefined') delete USER_ALLOWANCES[memberId];

  // 8. Refresh toàn bộ views
  try { if (typeof renderTeamPage === 'function') renderTeamPage(); } catch(e) {}
  try { if (typeof renderTeam === 'function') renderTeam(); } catch(e) {}
  try { if (typeof renderUserManager === 'function') renderUserManager(); } catch(e) {}
  try { if (typeof updateBadges === 'function') updateBadges(); } catch(e) {}

  showToast(`🗑️ Đã xóa "${member.name}" khỏi hệ thống!`, 'info');
}

// Custom confirm dialog (thay thế confirm() bị block trên Netlify)
function hrConfirm(title, message, onConfirm) {
  // Xóa dialog cũ nếu có
  document.getElementById('hrConfirmDialog')?.remove();

  const el = document.createElement('div');
  el.id = 'hrConfirmDialog';
  el.className = 'modal-overlay';
  el.style.cssText = 'z-index:9999;display:flex;align-items:center;justify-content:center;';
  el.innerHTML = `
    <div class="modal" style="max-width:400px;width:90%;text-align:center;padding:0;">
      <div class="modal-body" style="padding:32px 28px 24px;">
        <div style="font-size:40px;margin-bottom:12px">⚠️</div>
        <div style="font-weight:700;font-size:17px;margin-bottom:10px;color:var(--c-text-1)">${title}</div>
        <div style="font-size:13px;color:var(--c-text-3);margin-bottom:24px;line-height:1.5">${message}</div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button
            style="padding:10px 24px;border-radius:8px;border:1.5px solid var(--c-border);background:var(--c-surface);color:var(--c-text-1);font-weight:600;cursor:pointer;font-size:14px"
            onclick="document.getElementById('hrConfirmDialog').remove()">
            ✕ Hủy
          </button>
          <button
            id="hrConfirmOk"
            style="padding:10px 24px;border-radius:8px;border:none;background:#EF4444;color:#fff;font-weight:600;cursor:pointer;font-size:14px">
            🗑️ Xác nhận xóa
          </button>
        </div>
      </div>
    </div>`;

  document.body.appendChild(el);

  // Gắn sự kiện sau khi DOM đã render
  const okBtn = document.getElementById('hrConfirmOk');
  if (okBtn) {
    okBtn.onclick = async () => {
      el.remove();
      try { await onConfirm(); } catch(e) { console.error('[hrConfirm]', e); }
    };
  }

  // Click nền để hủy
  el.addEventListener('click', e => {
    if (e.target === el) el.remove();
  });
}

function openAddMemberModal() {
  if (!currentUser || currentUser.role === 'staff') {
    showToast('⚠️ Bạn không có quyền thêm thành viên!', 'error'); return;
  }
  openAddUserModal();
}
