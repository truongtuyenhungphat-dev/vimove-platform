/* ================================================
   VIWORK — Dashboard Module
   Command Center, metrics, charts
   ================================================ */

let teamChartInst = null;

function renderDashboard() {
  updateMetrics();
  renderRevenueProgress();
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

function renderWorkflowStatus() {
  const el = document.getElementById('workflowStatusList');
  if (!el) return;

  const total = appState.tasks.length || 1;
  el.innerHTML = STAGES.map(s => {
    const count = appState.tasks.filter(t => t.stage === s.id).length;
    const pct   = Math.round((count / total) * 100);
    return `
      <div class="wf-status-row">
        <div style="width:100px;font-size:12px;font-weight:500">${s.icon} ${s.name}</div>
        <div class="wf-status-bar">
          <div class="wf-status-fill" style="width:${pct}%;background:${s.color}"></div>
        </div>
        <div class="wf-status-count">${count}</div>
      </div>
    `;
  }).join('');
}

function renderHotTasks() {
  const el = document.getElementById('hotTasksList');
  if (!el) return;

  const hot = appState.tasks.filter(t =>
    (isOverdue(t) || t.priority === 'urgent' || t.priority === 'high') && t.stage !== 'done'
  ).slice(0, 6);

  document.getElementById('hotCount').textContent = hot.length;

  if (hot.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">🎉</div><p>Tuyệt vời! Không có CVC nào cần chú ý ngay.</p></div>`;
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
          <div class="avatar-sm">${user.avatar}</div>
        </div>
        <span class="tag priority-${t.priority}">${PRIORITIES[t.priority]?.name}</span>
      </div>
    `;
  }).join('');
}

function renderTeamChart() {
  const ctx = document.getElementById('teamChart');
  if (!ctx) return;
  if (teamChartInst) teamChartInst.destroy();

  const members = TEAM_MEMBERS.slice(0, 6);
  teamChartInst = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Doanh thu', 'KPI', 'CVC xử lý', 'Khách hàng', 'Đúng hạn', 'Chất lượng'],
      datasets: members.slice(0, 4).map((m, i) => {
        const colors = ['rgba(124,58,237,', 'rgba(16,185,129,', 'rgba(245,158,11,', 'rgba(239,68,68,'];
        return {
          label: m.name.split(' ').pop(),
          data: [
            Math.round((m.revenue / 30) * 100),
            m.kpi,
            Math.round((m.tasks / 35) * 100),
            Math.round(Math.random() * 30 + 60),
            Math.round(Math.random() * 25 + 70),
            Math.round(Math.random() * 20 + 75),
          ],
          backgroundColor: colors[i] + '0.08)',
          borderColor:     colors[i] + '0.8)',
          pointBackgroundColor: colors[i] + '1)',
          borderWidth: 2,
          pointRadius: 3,
        };
      })
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { size: 11 }, padding: 8, boxWidth: 12 } }
      },
      scales: {
        r: {
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { display: false },
          pointLabels: { color: '#94A3B8', font: { size: 11 } },
          min: 0, max: 100,
          angleLines: { color: 'rgba(255,255,255,0.05)' }
        }
      }
    }
  });
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
