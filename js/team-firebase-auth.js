/* ================================================
   VIWORK — Ghi đè saveNewUser() / doDeleteMember() cho Firebase Authentication
   Nạp file này SAU js/app.js và js/team.js (và sau khi đã kích hoạt
   js/auth-firebase.js + js/firebase-functions-client.js).

   Trong mô hình cũ, tạo/xoá nhân viên chỉ là ghi tay vào DEMO_USERS (kèm
   mật khẩu plaintext) — không tạo tài khoản Firebase Auth thật. Vì client SDK
   không đủ quyền tạo/xoá tài khoản Auth của NGƯỜI KHÁC (createUser sẽ đăng
   nhập luôn vào tài khoản mới, đá Admin ra khỏi phiên), hai thao tác này bắt
   buộc phải đi qua Cloud Function dùng Admin SDK (xem functions/index.js).
   Vì đây là function-declaration nạp sau, chúng ghi đè bản trong app.js/team.js.
   ================================================ */

async function saveNewUser() {
  const name        = document.getElementById('newUserName')?.value.trim();
  const email       = document.getElementById('newUserEmail')?.value.trim().toLowerCase();
  const pass        = document.getElementById('newUserPass')?.value;
  const dept        = document.getElementById('newUserDept')?.value.trim();
  const positionId  = document.getElementById('newUserPosition')?.value || '';
  const jobTitle    = document.getElementById('newUserJobTitle')?.value.trim() || '';
  const role        = document.getElementById('newUserRole')?.value || 'staff';

  if (!name || !email || !pass) { showToast('⚠️ Vui lòng điền đủ họ tên, email, mật khẩu!', 'error'); return; }
  if (pass.length < 6) { showToast('⚠️ Mật khẩu phải có ít nhất 6 ký tự!', 'error'); return; }
  if (!positionId) { showToast('⚠️ Vui lòng chọn vị trí cho nhân viên!', 'error'); return; }
  if (currentUser?.role === 'manager' && role === 'admin') {
    showToast('⚠️ Bạn không có quyền tạo tài khoản Admin!', 'error'); return;
  }
  if (TEAM_MEMBERS.some(m => m.email === email)) { showToast('⚠️ Email đã tồn tại!', 'error'); return; }
  if (!window.fbAdminCreateUser) {
    showToast('⚠️ Chưa triển khai Cloud Function fbAdminCreateUser — xem functions/index.js', 'error');
    return;
  }

  const pos = (typeof POSITIONS !== 'undefined') ? POSITIONS.find(p => p.id === positionId) : null;
  const department = dept || pos?.name ||
    (currentUser?.role === 'manager' ? currentUser.department : null) ||
    (role === 'admin' ? 'Quản trị' : role === 'manager' ? 'Quản lý' : 'Nhân viên');

  try {
    const { uid, profile } = await window.fbAdminCreateUser({
      email, password: pass, name, role, department, positionId, jobTitle,
    });

    // Cập nhật local state ngay (fbListenUsers từ Firestore sẽ đồng bộ lại sau)
    TEAM_MEMBERS.push({
      id: uid, name, role, email, avatar: profile.avatar,
      department, positionId, jobTitle, kpi: 0, revenue: 0, tasks: 0,
    });
    setMemberPosition(uid, positionId);
    if (typeof USER_ALLOWANCES !== 'undefined' && !USER_ALLOWANCES[uid]) {
      USER_ALLOWANCES[uid] = { lunch: 700000, transport: 300000, phone: 200000, housing: 0, other: 0, note: '' };
    }

    ['newUserName','newUserEmail','newUserPass','newUserDept','newUserJobTitle'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    const posEl = document.getElementById('newUserPosition');
    if (posEl) posEl.value = '';
    closeModal('newUserModal');

    syncAllViews();
    showToast(`✅ Đã thêm "${name}" · ${pos ? pos.icon + ' ' + pos.name : role}`, 'success');
  } catch (e) {
    console.error('[saveNewUser]', e);
    showToast('⚠️ Tạo tài khoản thất bại: ' + (e.message || e.code || 'Lỗi không xác định'), 'error');
  }
}

async function doDeleteMember(memberId, member) {
  if (!window.fbAdminDeleteUser) {
    showToast('⚠️ Chưa triển khai Cloud Function fbAdminDeleteUser — xem functions/index.js', 'error');
    return;
  }

  // memberId là ID nội bộ app (u001..u017 cho nhân viên gốc di trú, khác Firebase
  // Auth UID). Dùng nhầm memberId khiến fbAdminDeleteUser xoá một document/tài khoản
  // không tồn tại — UI báo "đã xoá" nhưng tài khoản Auth thật của người đó vẫn còn,
  // vẫn đăng nhập được. Với user tạo mới qua fbAdminCreateUser, id === authUid nên
  // findAuthUidById() sẽ trả về đúng memberId (fallback an toàn).
  const authUid = findAuthUidById(memberId);

  try {
    await window.fbAdminDeleteUser(authUid);
  } catch (e) {
    console.error('[doDeleteMember]', e);
    showToast('⚠️ Xoá tài khoản thất bại: ' + (e.message || e.code || 'Lỗi không xác định'), 'error');
    return;
  }

  // Dọn dẹp state cục bộ (TEAM_MEMBERS, POSITIONS.members, USER_ALLOWANCES)
  removeMemberEverywhere(memberId);

  if (typeof appState !== 'undefined') {
    appState.tasks?.forEach(t => { if (t.assigneeId === memberId) t.assigneeId = null; });
  }

  try { if (typeof renderTeamPage === 'function') renderTeamPage(); } catch(e) {}
  try { if (typeof renderTeam === 'function') renderTeam(); } catch(e) {}
  try { if (typeof renderUserManager === 'function') renderUserManager(); } catch(e) {}
  try { if (typeof updateBadges === 'function') updateBadges(); } catch(e) {}

  showToast(`🗑️ Đã xóa "${member.name}" khỏi hệ thống!`, 'info');
}
