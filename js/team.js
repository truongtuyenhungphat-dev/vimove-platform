/* ================================================
   VIWORK — Team Module
   Leaderboard, member management
   ================================================ */

function renderTeam() {
  const board = document.getElementById('teamLeaderboard');
  if (!board) return;

  const sorted = [...TEAM_MEMBERS].sort((a,b) => b.revenue - a.revenue);
  const rankEmoji = ['🥇','🥈','🥉'];

  board.innerHTML = sorted.map((m, i) => {
    const medal  = rankEmoji[i] || `#${i+1}`;
    const kpiColor = m.kpi >= 90 ? '#10B981' : m.kpi >= 70 ? '#F59E0B' : '#EF4444';
    const isMe   = m.id === currentUser?.id;

    return `
      <div class="member-card ${isMe ? 'style="border-color:var(--c-primary);background:rgba(124,58,237,0.08)"' : ''}">
        <div class="member-rank">${medal}</div>
        <div class="member-avatar">${m.avatar}</div>
        <div class="member-name">${m.name} ${isMe ? '<span style="font-size:10px;background:rgba(124,58,237,0.2);color:var(--c-primary-light);padding:1px 6px;border-radius:4px;font-weight:600">Bạn</span>' : ''}</div>
        <div class="member-role">${m.department}</div>
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

function openAddMemberModal() {
  if (!currentUser || currentUser.role === 'staff') {
    showToast('⚠️ Bạn không có quyền thêm thành viên!', 'error');
    return;
  }
  // Mở Popup thêm thành viên ngay tại trang Đội ngũ
  openAddUserModal();
}
