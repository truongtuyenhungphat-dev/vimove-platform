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
  if (currentUser?.role !== 'admin') {
    showToast('⚠️ Chỉ Admin mới có quyền xóa thành viên!', 'error'); return;
  }
  if (memberId === currentUser?.id) {
    showToast('⚠️ Không thể xóa tài khoản đang đăng nhập!', 'error'); return;
  }
  const member = TEAM_MEMBERS.find(m => m.id === memberId);
  if (!member) return;
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
  // Dùng _performDelete() chung để đảm bảo đồng bộ đầy đủ
  const userEntry = Object.entries(DEMO_USERS).find(([,u]) => u.id === memberId);
  const email = userEntry ? userEntry[0] : null;
  await _performDelete(memberId, member.name, email);

  // Luu localStorage viwork_users
  try {
    const saved = JSON.parse(localStorage.getItem('viwork_users') || '[]');
    localStorage.setItem('viwork_users', JSON.stringify(saved.filter(u => u.id !== memberId)));
  } catch(e) {}
}

// Custom confirm dialog (thay thế confirm() bị block trên một số browser)
function hrConfirm(title, message, onConfirm) {
  document.getElementById('hrConfirmDialog')?.remove();
  const el = document.createElement('div');
  el.id = 'hrConfirmDialog';
  el.className = 'modal-overlay';
  el.style.zIndex = '9999';
  el.innerHTML = `
    <div class="modal-box" style="max-width:380px;text-align:center">
      <div class="modal-body" style="padding:28px 24px">
        <div style="font-size:36px;margin-bottom:12px">⚠️</div>
        <div style="font-weight:700;font-size:16px;margin-bottom:8px">${title}</div>
        <div style="font-size:13px;color:var(--c-text-3);margin-bottom:20px">${message}</div>
        <div style="display:flex;gap:10px;justify-content:center">
          <button class="btn btn-cancel" onclick="document.getElementById('hrConfirmDialog').remove()">✕ Hủy</button>
          <button class="btn btn-danger" id="hrConfirmOk">🗑️ Xác nhận xóa</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.getElementById('hrConfirmOk').onclick = () => {
    el.remove();
    onConfirm();
  };
}

function openAddMemberModal() {
  if (!currentUser || currentUser.role === 'staff') {
    showToast('⚠️ Bạn không có quyền thêm thành viên!', 'error'); return;
  }
  openAddUserModal();
}
