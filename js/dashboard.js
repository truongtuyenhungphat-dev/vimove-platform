/* ================================================
   VIWORK — Dashboard Module
   Command Center, metrics, charts
   ================================================ */

let teamChartInst = null;
let dashSelectedMember = 'all';   // 'all' | userId

function renderDashboard() {
  updateMetrics();
  renderRevenueProgress();
  renderMemberSelector();
  renderWorkflowStatus();
  renderHotTasks();
  renderTeamChart();
  updateGreeting();
  generateNotifications();
  renderNotifications();
}

function updateGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'buổi sáng' : hour < 17 ? 'buổi chiều' : 'buổi tối';
  const hotCount = appState.tasks.filter(t => isOverdue(t) || t.priority === 'urgent').length;
  const el = document.getElementById('dashGreeting');
  if (el) el.innerHTML = `Chào ${greeting}, <strong>${currentUser?.name?.split(' ').pop() || ''}</strong>! Hôm nay có <strong style="color:var(--c-danger)">${hotCount}</strong> CVC cần xử lý.`;
}

function updateMetrics() {
  const tasks   = appState.tasks;
  const active  = tasks.filter(t => t.stage !== 'done');
  const overdue = tasks.filter(t => isOverdue(t));
  const done    = tasks.filter(t => t.stage === 'done');

  animateNumber('m-totalCVC', active.length);
  animateNumber('m-overdue',  overdue.length);
  animateNumber('m-done',     done.length);

  const rev = getTotalActualRevenue().toFixed(1);
  TOTAL_ACTUAL_REVENUE = getTotalActualRevenue(); // sync global
  document.getElementById('m-revenue').textContent = rev + ' tỷ';
}

function animateNumber(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const dur = 600;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / dur, 1);
    el.textContent = Math.round(start + (target - start) * easeOut(t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function renderRevenueProgress() {
  const target = APP_CONFIG.revenueTarget;
  const actual = getTotalActualRevenue();
  TOTAL_ACTUAL_REVENUE = actual; // sync global
  const pct    = Math.min(Math.round((actual / target) * 100), 100);

  const startMs = APP_CONFIG.startDate.getTime();
  const nowMs   = Date.now();
  const totalMs = APP_CONFIG.opMonths * 30.44 * 86400000;
  const elapsedMonths = Math.round((nowMs - startMs) / (30.44 * 86400000));
  const monthsLeft    = Math.max(APP_CONFIG.opMonths - elapsedMonths, 0);

  document.getElementById('revenuePct').textContent = pct + '%';
  document.getElementById('revActual').textContent  = actual.toFixed(1) + ' tỷ';
  document.getElementById('monthsLeft').textContent = monthsLeft;

  const forecastEl = document.getElementById('revForecast');
  if (elapsedMonths > 0) {
    const monthlyRate = actual / elapsedMonths;
    forecastEl.textContent = monthlyRate.toFixed(1) + ' tỷ';
  }

  setTimeout(() => {
    const bar = document.getElementById('revenueBar');
    if (bar) bar.style.width = pct + '%';
  }, 300);
}

// ============ MEMBER SELECTOR ============
function renderMemberSelector() {
  const container = document.getElementById('dashMemberSelector');
  if (!container) return;

  const allUsers = getAppUsers();
  const options  = allUsers.map(u =>
    `<option value="${u.id}" ${dashSelectedMember === u.id ? 'selected' : ''}>${u.name}</option>`
  ).join('');

  container.innerHTML = `
    <div class="dash-member-filter">
      <label class="dmf-label">👤 Xem theo nhân sự:</label>
      <select id="memberFilterSelect" class="select-input" onchange="onMemberFilterChange(this.value)">
        <option value="all" ${dashSelectedMember === 'all' ? 'selected' : ''}>👥 Tất cả thành viên</option>
        ${options}
      </select>
    </div>
    ${dashSelectedMember !== 'all' ? renderMemberSummaryBar(dashSelectedMember) : ''}
  `;
}

function onMemberFilterChange(memberId) {
  dashSelectedMember = memberId;
  renderMemberSelector();
  renderWorkflowStatus();
  renderHotTasks();
  renderTeamChart();
  // Cập nhật tiêu đề card hiệu suất
  const chartTitle = document.getElementById('teamChartTitle');
  if (chartTitle) {
    if (memberId !== 'all') {
      const u = getUserById(memberId);
      chartTitle.textContent = `👤 Hồ sơ: ${u.name.split(' ').pop()}`;
    } else {
      chartTitle.textContent = '📈 Hiệu suất đội ngũ';
    }
  }
}

function renderMemberSummaryBar(userId) {
  const user     = getUserById(userId);
  const tasks    = appState.tasks.filter(t => t.assigneeId === userId);
  const active   = tasks.filter(t => t.stage !== 'done').length;
  const overdue  = tasks.filter(t => isOverdue(t)).length;
  const done     = tasks.filter(t => t.stage === 'done').length;
  const urgent   = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  return `
    <div class="dash-member-summary">
      <div class="dms-avatar">${user.avatar}</div>
      <div class="dms-name">${escHtml(user.name)} <span class="dms-dept">${escHtml(user.department||'')}</span></div>
      <div class="dms-stats">
        <div class="dms-stat"><span class="dms-val">${active}</span><span class="dms-lbl">Đang chạy</span></div>
        <div class="dms-stat overdue"><span class="dms-val" style="color:#EF4444">${overdue}</span><span class="dms-lbl">Trễ hạn</span></div>
        <div class="dms-stat"><span class="dms-val" style="color:#10B981">${done}</span><span class="dms-lbl">Hoàn thành</span></div>
        <div class="dms-stat"><span class="dms-val" style="color:#F59E0B">${urgent}</span><span class="dms-lbl">Ũu tiên cao</span></div>
      </div>
      <button class="dms-clear" onclick="onMemberFilterChange('all')" title="Xóa bộ lọc">× Tất cả</button>
    </div>
  `;
}

function renderWorkflowStatus() {
  const el = document.getElementById('workflowStatusList');
  if (!el) return;

  const tasks = dashSelectedMember === 'all'
    ? appState.tasks
    : appState.tasks.filter(t => t.assigneeId === dashSelectedMember);

  const total = tasks.length || 1;
  el.innerHTML = STAGES.map(s => {
    const count = tasks.filter(t => t.stage === s.id).length;
    const pct   = Math.round((count / total) * 100);
    return `
      <div class="wf-status-row" style="cursor:default">
        <div style="width:100px;font-size:12px;font-weight:500">${s.icon} ${s.name}</div>
        <div class="wf-status-bar">
          <div class="wf-status-fill" style="width:${pct}%;background:${s.color}"></div>
        </div>
        <div class="wf-status-count">${count}</div>
      </div>
    `;
  }).join('');

  // Cập nhật tiêu đề card
  const cardTitle = document.querySelector('#workflowStatusCard .dash-card-header h3');
  if (cardTitle) {
    const user = dashSelectedMember !== 'all' ? getUserById(dashSelectedMember) : null;
    cardTitle.textContent = user
      ? `🔄 Workflow của ${user.name.split(' ').pop()}`
      : '🔄 Trạng thái Luồng CVC';
  }
}

function renderHotTasks() {
  const el = document.getElementById('hotTasksList');
  if (!el) return;

  let sourceTasks = appState.tasks;
  if (dashSelectedMember !== 'all') {
    sourceTasks = sourceTasks.filter(t => t.assigneeId === dashSelectedMember);
  }

  const hot = sourceTasks.filter(t =>
    (isOverdue(t) || t.priority === 'urgent' || t.priority === 'high') && t.stage !== 'done'
  ).slice(0, 6);

  document.getElementById('hotCount').textContent = hot.length;

  // Tiêu đề của card
  const hotHeader = document.querySelector('.hot-tasks-card-title');
  if (hotHeader) {
    const user = dashSelectedMember !== 'all' ? getUserById(dashSelectedMember) : null;
    hotHeader.textContent = user
      ? `🔥 CVC cần chú ý — ${user.name.split(' ').pop()}`
      : '🔥 CVC cần chú ý ngay';
  }

  if (hot.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><p>${
      dashSelectedMember !== 'all'
        ? 'Nhân sự này không có CVC nào cần chú ý!'
        : 'Tuyệt vời! Không có CVC nào cần chú ý ngay.'
    }</p></div>`;
    return;
  }

  el.innerHTML = hot.map(t => {
    const user  = getUserById(t.assigneeId);
    const stage = getStageById(t.stage);
    const isOD  = isOverdue(t);
    return `
      <div class="hot-task-item" onclick="openTaskDetail('${t.id}')">
        <div style="font-size:20px">${PRIORITIES[t.priority]?.icon}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:500;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escHtml(t.title)}</div>
          <div style="font-size:11px;color:var(--c-text-3);display:flex;gap:8px;margin-top:3px">
            <span>${stage.icon} ${stage.name}</span>
            <span>·</span>
            <span class="${isOD?'deadline-overdue':getDeadlineClass(t.deadline,t.stage)}">📅 ${formatDateRelative(t.deadline)}</span>
          </div>
        </div>
        <div class="assignee-badge">
          <div class="avatar-sm" title="${escHtml(user.name)}">${user.avatar}</div>
        </div>
        <span class="tag priority-${t.priority}">${PRIORITIES[t.priority]?.name}</span>
      </div>
    `;
  }).join('');
}

function renderTeamChart() {
  const container = document.getElementById('teamChartContainer');
  if (!container) return;

  // Nếu đang lọc 1 nhân sự → hiện card chi tiết
  if (dashSelectedMember !== 'all') {
    renderMemberDetailCard(dashSelectedMember);
    return;
  }

  // Toàn đội → bar chart KPI thực tế
  container.innerHTML = `<canvas id="teamChart" height="220"></canvas>`;
  const ctx = document.getElementById('teamChart');
  if (!ctx) return;
  if (teamChartInst) { teamChartInst.destroy(); teamChartInst = null; }

  const members  = [...TEAM_MEMBERS].sort((a, b) => b.kpi - a.kpi).slice(0, 7);
  const names    = members.map(m => m.name.split(' ').pop());
  const kpis     = members.map(m => m.kpi);
  const revenues = members.map(m => m.revenue);

  teamChartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: names,
      datasets: [
        {
          label: 'KPI (%)',
          data: kpis,
          backgroundColor: kpis.map(k =>
            k >= 90 ? 'rgba(16,185,129,0.75)'
            : k >= 70 ? 'rgba(90,184,0,0.75)'
            : 'rgba(245,158,11,0.75)'
          ),
          borderRadius: 6,
          yAxisID: 'yKpi',
        },
        {
          label: 'Doanh thu (tỷ)',
          data: revenues,
          backgroundColor: 'rgba(99,102,241,0.55)',
          borderRadius: 6,
          yAxisID: 'yRev',
          type: 'bar',
        },
      ],
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            color: '#64748B',
            font: { size: 11 },
            padding: 12,
            boxWidth: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.label === 'KPI (%)') return ` KPI: ${ctx.raw}%`;
              return ` Doanh thu: ${ctx.raw} tỷ`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#64748B', font: { size: 11 } },
          grid:  { display: false },
        },
        yKpi: {
          type: 'linear',
          position: 'left',
          min: 0, max: 130,
          ticks: { color: '#10B981', font: { size: 10 }, callback: v => v + '%' },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
        yRev: {
          type: 'linear',
          position: 'right',
          min: 0,
          ticks: { color: '#6366F1', font: { size: 10 }, callback: v => v + 'B' },
          grid: { display: false },
        },
      },
    },
  });
}

function renderMemberDetailCard(userId) {
  const container = document.getElementById('teamChartContainer');
  if (!container) return;
  if (teamChartInst) { teamChartInst.destroy(); teamChartInst = null; }

  const m = TEAM_MEMBERS.find(x => x.id === userId);
  if (!m) { container.innerHTML = '<div class="att-empty">Không tìm thấy dữ liệu.</div>'; return; }

  const tasks    = appState.tasks.filter(t => t.assigneeId === userId);
  const done     = tasks.filter(t => t.stage === 'done').length;
  const active   = tasks.filter(t => t.stage !== 'done').length;
  const overdue  = tasks.filter(t => isOverdue(t)).length;

  const kpiColor = m.kpi >= 90 ? '#10B981' : m.kpi >= 70 ? '#5AB800' : '#F59E0B';
  const kpiPct   = Math.min(m.kpi, 130);

  // Attendance tháng này (nếu có module)
  let attHTML = '';
  if (typeof ATTENDANCE_RECORDS !== 'undefined') {
    const now  = new Date();
    const recs = ATTENDANCE_RECORDS.filter(r => {
      return r.userId === userId && r.date && r.date.startsWith(
        `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
      );
    });
    const ontime = recs.filter(r => !r.isLate && r.checkIn && !r.isLeave).length;
    const late   = recs.filter(r => r.isLate).length;
    const leaves = recs.filter(r => r.isLeave).length;
    attHTML = `
      <div class="mdc-row">
        <span class="mdc-label">⏱ Chấm công</span>
        <span class="mdc-val">✅ ${ontime} đúng giờ · 🟡 ${late} muộn · 🏖️ ${leaves} nghỉ</span>
      </div>`;
  }

  container.innerHTML = `
    <div class="member-detail-card">
      <div class="mdc-header">
        <div class="mdc-avatar">${m.avatar}</div>
        <div>
          <div class="mdc-name">${escHtml(m.name)}</div>
          <div class="mdc-dept">${escHtml(m.department || '—')} · ${getRoleLabel(m.role)}</div>
        </div>
      </div>

      <div class="mdc-kpi-row">
        <div style="display:flex;justify-content:space-between;margin-bottom:5px">
          <span style="font-size:12px;font-weight:500;color:var(--c-text-2)">KPI tháng này</span>
          <span style="font-size:13px;font-weight:700;color:${kpiColor}">${m.kpi}%</span>
        </div>
        <div class="kpi-bar-wrap"><div class="kpi-bar" style="width:${kpiPct}%;background:${kpiColor}"></div></div>
      </div>

      <div class="mdc-stats-grid">
        <div class="mdc-stat-box">
          <div class="mdc-stat-val" style="color:#10B981">${m.revenue} tỷ</div>
          <div class="mdc-stat-lbl">Doanh thu</div>
        </div>
        <div class="mdc-stat-box">
          <div class="mdc-stat-val">${active}</div>
          <div class="mdc-stat-lbl">CVC đang chạy</div>
        </div>
        <div class="mdc-stat-box">
          <div class="mdc-stat-val" style="color:#10B981">${done}</div>
          <div class="mdc-stat-lbl">Hoàn thành</div>
        </div>
        <div class="mdc-stat-box">
          <div class="mdc-stat-val" style="color:${overdue > 0 ? '#EF4444' : 'var(--c-text)'}">${overdue}</div>
          <div class="mdc-stat-lbl">Trễ hạn</div>
        </div>
      </div>

      <div class="mdc-info-rows">
        <div class="mdc-row">
          <span class="mdc-label">📋 Tổng CVC</span>
          <span class="mdc-val">${tasks.length} CVC (${m.tasks} theo KPI)</span>
        </div>
        ${attHTML}
      </div>
    </div>
  `;
}


function refreshDashboard() { renderDashboard(); }

// ============ NOTIFICATIONS (Gap 6 — Real-time) ============

let _notifWatcherInterval = null;
let _lastNotifCount = 0;

/**
 * Gap 6: Bắt đầu theo dõi thông báo real-time
 */
function startNotificationWatcher() {
  // Chạy ngay lập tức khi login
  checkAndUpdateNotifications();
  // Sau đó cứ 30 giây chạy 1 lần
  if (_notifWatcherInterval) clearInterval(_notifWatcherInterval);
  _notifWatcherInterval = setInterval(checkAndUpdateNotifications, 30000);
}

function checkAndUpdateNotifications() {
  if (!currentUser) return;
  generateNotifications(); // rebuild from current appState
  renderNotifications();
  updateBadges();

  const newCount = appState.notifications.length;
  // Toast khi có alert mới xuất hiện
  if (newCount > _lastNotifCount && _lastNotifCount > 0) {
    const diff = newCount - _lastNotifCount;
    showToast(`🔔 ${diff} thông báo mới cần chú ý!`, 'info');
  }
  _lastNotifCount = newCount;

  // SLA breach alert: check tasks gần vi phạm SLA
  if (typeof getSLASummary === 'function') {
    const sla = getSLASummary();
    const badge = document.getElementById('badge-alert');
    if (badge) {
      const alertCount = (sla.danger || 0) + (sla.overdue || 0);
      badge.textContent = alertCount || '';
      badge.style.background = alertCount > 0 ? '#EF4444' : '';
    }
  }
}

function renderNotifications() {
  const notifList = document.getElementById('notifList');
  const notifDot  = document.getElementById('notifDot');
  if (!notifList) return;

  const notifs = appState.notifications;
  // Update notification bell badge
  if (notifDot) {
    notifDot.textContent = notifs.length > 0 ? notifs.length : '';
    notifDot.style.background = notifs.length > 0 ? '#EF4444' : '';
  }

  if (notifs.length === 0) {
    notifList.innerHTML = `
      <div style="padding:24px 16px;text-align:center">
        <div style="font-size:32px;margin-bottom:8px">🎉</div>
        <div style="font-size:13px;color:var(--c-text-3)">Không có thông báo mới.</div>
        <div style="font-size:11px;color:var(--c-text-3);margin-top:4px">Tự động kiểm tra mỗi 30 giây</div>
      </div>`;
    return;
  }

  // Group by type
  const overdue  = notifs.filter(n => n.type === 'overdue');
  const dueSoon  = notifs.filter(n => n.type === 'due_soon');

  const renderGroup = (title, icon, items) => items.length ? `
    <div style="padding:8px 16px 4px;font-size:11px;font-weight:600;color:var(--c-text-3);text-transform:uppercase;letter-spacing:0.05em">
      ${icon} ${title} (${items.length})
    </div>
    ${items.map(n => `
      <div style="padding:10px 16px;border-bottom:1px solid var(--c-border-subtle);cursor:pointer;transition:background 0.15s"
           onmouseover="this.style.background='rgba(255,255,255,0.03)'" 
           onmouseout="this.style.background=''"
           onclick="openTaskDetail('${n.task.id}');document.getElementById('notifPanel').classList.add('hidden')">
        <div style="font-size:12px;font-weight:500;margin-bottom:2px;line-height:1.4">
          ${n.text}
        </div>
        <div style="font-size:11px;color:var(--c-text-3);display:flex;gap:8px">
          <span>Nhấn để xem chi tiết →</span>
        </div>
      </div>
    `).join('')}
  ` : '';

  notifList.innerHTML = [
    renderGroup('TRỄ DEADLINE', '🔴', overdue),
    renderGroup('SỬ́P ĐẾN HẠN', '🟡', dueSoon),
  ].join('');
}

function toggleNotifications() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('hidden');
  // Mark as seen khi mở panel
  if (!panel.classList.contains('hidden')) {
    const dot = document.getElementById('notifDot');
    if (dot) { dot.textContent = ''; dot.style.background = ''; }
  }
}

function markAllRead() {
  appState.notifications = [];
  _lastNotifCount = 0;
  renderNotifications();
  updateBadges();
  document.getElementById('notifPanel').classList.add('hidden');
  showToast('✅ Đã đánh dấu tất cả đã đọc', 'info');
}

// Settings
function saveSettings() {
  APP_CONFIG.companyName   = document.getElementById('companyName')?.value || 'Vimove';
  APP_CONFIG.revenueTarget = parseFloat(document.getElementById('revenueTarget')?.value) || 150;
  APP_CONFIG.opMonths      = parseInt(document.getElementById('opMonths')?.value) || 17;
  renderRevenueProgress();
  showToast('✅ Đã lưu cài đặt!', 'success');
}
