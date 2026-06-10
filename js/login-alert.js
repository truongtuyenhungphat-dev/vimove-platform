/* ================================================
   VIWORK — Login Alert Popup
   Hiện popup cảnh báo công việc khi đăng nhập
   ================================================ */

/**
 * Hiển thị popup cảnh báo công việc sau khi đăng nhập
 * Gọi sau khi data đã được load đầy đủ từ Firebase
 */
function showLoginAlert() {
  if (!currentUser) return;

  // Không hiện lại nếu đã xem trong session này
  if (sessionStorage.getItem('vw_login_alert_shown')) return;
  sessionStorage.setItem('vw_login_alert_shown', '1');

  const uid   = currentUser.id;
  const role  = currentUser.role;
  const now   = new Date();
  const today = now.toISOString().split('T')[0];

  // ── Thu thập dữ liệu cảnh báo ──────────────────────────────
  const tasks       = appState.tasks || [];
  const assignments = appState.assignments || [];
  const requests    = appState.requests || [];

  // 1. CVC trễ hạn (assignee là mình)
  const overdueTasks = tasks.filter(t =>
    t.assigneeId === uid && t.stage !== 'done' && isOverdue(t)
  );

  // 2. CVC deadline hôm nay
  const todayTasks = tasks.filter(t => {
    if (t.assigneeId !== uid || t.stage === 'done' || isOverdue(t)) return false;
    return t.deadline === today;
  });

  // 3. CVC deadline trong 3 ngày tới
  const in3Days = new Date(now); in3Days.setDate(in3Days.getDate() + 3);
  const upcomingTasks = tasks.filter(t => {
    if (t.assigneeId !== uid || t.stage === 'done' || isOverdue(t) || t.deadline === today) return false;
    if (!t.deadline) return false;
    const dl = new Date(t.deadline);
    return dl <= in3Days;
  });

  // 4. Giao việc chờ mình nhận (pending)
  const pendingAssignments = assignments.filter(a =>
    a.assignedTo === uid && a.status === 'pending'
  );

  // 5. Đề xuất chờ mình duyệt (Admin/Manager)
  const pendingApprovals = (role === 'admin' || role === 'manager')
    ? requests.filter(r => r.status === 'pending' && canApproveRequest?.(r))
    : [];

  // 6. Đề xuất của mình được duyệt/từ chối (chưa đọc)
  const myDecisions = requests.filter(r =>
    r.requestedBy === uid &&
    (r.status === 'approved' || r.status === 'rejected') &&
    !r._seenByOwner
  );

  // Nếu không có gì → không hiện popup
  const totalAlerts = overdueTasks.length + todayTasks.length + upcomingTasks.length +
                      pendingAssignments.length + pendingApprovals.length + myDecisions.length;
  if (totalAlerts === 0) return;

  // ── Tạo nội dung ────────────────────────────────────────────
  const greeting = getTimeGreeting();
  const avatar   = currentUser.avatar || getInitials(currentUser.name);

  // Helper render 1 item
  const renderAlertItem = (icon, text, sub, cls = '') => `
    <div class="lal-item ${cls}">
      <div class="lal-item-icon">${icon}</div>
      <div class="lal-item-body">
        <div class="lal-item-text">${escHtml(text)}</div>
        ${sub ? `<div class="lal-item-sub">${sub}</div>` : ''}
      </div>
    </div>`;

  // Helper render section
  const renderSection = (title, color, items) => items.length === 0 ? '' : `
    <div class="lal-section">
      <div class="lal-section-title" style="color:${color}">${title} <span class="lal-count">${items.length}</span></div>
      <div class="lal-section-body">${items.join('')}</div>
    </div>`;

  // Build sections
  const overdueHTML = overdueTasks.map(t =>
    renderAlertItem('🔴', t.title,
      `Hết hạn: ${formatDateRelative(t.deadline)} · ${CATEGORIES[t.category]?.name || ''}`,
      'lal-danger')
  );

  const todayHTML = todayTasks.map(t =>
    renderAlertItem('🟡', t.title,
      `Deadline hôm nay · ${CATEGORIES[t.category]?.name || ''}`,
      'lal-warning')
  );

  const upcomingHTML = upcomingTasks.map(t =>
    renderAlertItem('🔵', t.title,
      `Còn ${formatDateRelative(t.deadline)} · ${CATEGORIES[t.category]?.name || ''}`,
      '')
  );

  const asgnHTML = pendingAssignments.map(a =>
    renderAlertItem('📌', a.title,
      `Từ: ${getUserById(a.assignedBy)?.name || '—'} · ${formatDateRelative(a.deadline)}`,
      'lal-warning')
  );

  const approveHTML = pendingApprovals.slice(0, 5).map(r => {
    const sender = getUserById(r.requestedBy);
    return renderAlertItem('📋', r.title,
      `${sender?.name || '—'} · ${getReqTypeLabel(r.type)}`,
      'lal-info');
  });

  const decisionsHTML = myDecisions.map(r =>
    renderAlertItem(
      r.status === 'approved' ? '✅' : '❌',
      r.title,
      r.status === 'approved' ? 'Đề xuất đã được duyệt' : 'Đề xuất bị từ chối',
      r.status === 'approved' ? 'lal-success' : 'lal-danger'
    )
  );

  const sectionsHTML = [
    renderSection('🔴 Trễ hạn — Cần xử lý NGAY', '#EF4444', overdueHTML),
    renderSection('🟡 Đến hạn hôm nay', '#F59E0B', todayHTML),
    renderSection('📋 Chờ bạn phê duyệt', '#3B82F6', approveHTML),
    renderSection('📌 Giao việc đang chờ bạn nhận', '#8B5CF6', asgnHTML),
    renderSection('🔔 Kết quả đề xuất của bạn', '#10B981', decisionsHTML),
    renderSection('🔵 Sắp đến hạn (3 ngày tới)', '#6B7280', upcomingHTML),
  ].join('');

  // ── Render modal ────────────────────────────────────────────
  document.getElementById('loginAlertModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'loginAlertModal';
  modal.className = 'lal-overlay';

  modal.innerHTML = `
    <div class="lal-modal" id="lalBox">

      <!-- Header -->
      <div class="lal-header">
        <div class="lal-header-left">
          <div class="lal-avatar">${avatar}</div>
          <div>
            <div class="lal-greeting">${greeting}</div>
            <div class="lal-username">${escHtml(currentUser.name)}</div>
          </div>
        </div>
        <button class="lal-close" onclick="closeLoginAlert()" title="Đóng">✕</button>
      </div>

      <!-- Alert summary bar -->
      <div class="lal-summary-bar">
        ${overdueTasks.length   ? `<div class="lal-sum-chip danger">🔴 ${overdueTasks.length} Trễ hạn</div>` : ''}
        ${todayTasks.length     ? `<div class="lal-sum-chip warning">🟡 ${todayTasks.length} Hôm nay</div>` : ''}
        ${pendingAssignments.length ? `<div class="lal-sum-chip purple">📌 ${pendingAssignments.length} Chờ nhận</div>` : ''}
        ${pendingApprovals.length   ? `<div class="lal-sum-chip blue">📋 ${pendingApprovals.length} Chờ duyệt</div>` : ''}
        ${upcomingTasks.length  ? `<div class="lal-sum-chip gray">🔵 ${upcomingTasks.length} Sắp đến hạn</div>` : ''}
      </div>

      <!-- Content -->
      <div class="lal-content">
        ${sectionsHTML}
      </div>

      <!-- Footer -->
      <div class="lal-footer">
        <label class="lal-dont-show">
          <input type="checkbox" id="lalDontShow" onchange="handleLalDontShow(this)">
          <span>Không hiện lại hôm nay</span>
        </label>
        <button class="lal-btn-start" onclick="closeLoginAlert()">
          🚀 Bắt đầu làm việc
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById('lalBox')?.classList.add('lal-open');
    });
  });

  // Close on overlay click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeLoginAlert();
  });
}

function closeLoginAlert() {
  const modal = document.getElementById('loginAlertModal');
  if (!modal) return;
  const box = document.getElementById('lalBox');
  if (box) {
    box.classList.remove('lal-open');
    box.classList.add('lal-close-anim');
  }
  setTimeout(() => modal.remove(), 300);
}

function handleLalDontShow(checkbox) {
  if (checkbox.checked) {
    // Lưu vào localStorage với key theo ngày — sẽ reset mỗi ngày mới
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`vw_lal_hidden_${currentUser?.id}_${today}`, '1');
  } else {
    const today = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`vw_lal_hidden_${currentUser?.id}_${today}`);
  }
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return '☀️ Chào buổi sáng!';
  if (h < 18) return '🌤️ Chào buổi chiều!';
  return '🌙 Chào buổi tối!';
}

function getReqTypeLabel(type) {
  const map = {
    budget: '💰 Duyệt ngân sách',
    order:  '📦 Đặt hàng',
    hr:     '👤 Nhân sự',
    kpi:    '🎯 KPI',
    leave:  '🏖️ Nghỉ phép',
    remote: '🌐 Làm Online',
  };
  return map[type] || type;
}

/**
 * Kiểm tra xem có nên hiện popup không (tính đến "Không hiện lại hôm nay")
 */
function shouldShowLoginAlert() {
  if (!currentUser) return false;
  const today = new Date().toISOString().split('T')[0];
  const hiddenKey = `vw_lal_hidden_${currentUser.id}_${today}`;
  return !localStorage.getItem(hiddenKey);
}
