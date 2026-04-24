/* ================================================
   VIWORK Sprint 1 — SLA Timer Engine
   Quản lý thời gian trong từng giai đoạn CVC
   ================================================ */

// ============ SLA CONFIG (giới hạn thời gian mỗi giai đoạn) ============
const SLA_CONFIG = {
  idea:       { hours: 72,  label: '3 ngày',   warnAt: 0.25 },  // Lên kế hoạch: 3 ngày
  inprogress: { hours: 168, label: '7 ngày',   warnAt: 0.25 },  // Đang triển khai: 7 ngày
  review:     { hours: 24,  label: '1 ngày',   warnAt: 0.25 },  // Chờ duyệt: 1 ngày
  blocked:    { hours: 48,  label: '2 ngày',   warnAt: 0.25 },  // Bị chặn: 2 ngày
  done:       { hours: null, label: null,      warnAt: null  },  // Hoàn thành: không có SLA
};

// ============ SLA CALCULATIONS ============

/**
 * Tính thời gian task đã ở trong giai đoạn hiện tại
 * @param {Object} task - Task object
 * @returns {Object} { elapsedHours, remainingHours, pct, status, label }
 */
function getSLAInfo(task) {
  if (task.stage === 'done') return null;

  const config = SLA_CONFIG[task.stage];
  if (!config || !config.hours) return null;

  // Lấy thời điểm task vào giai đoạn hiện tại (stageEnteredAt)
  // Nếu không có, dùng createDate
  const enteredAt = task.stageEnteredAt
    ? new Date(task.stageEnteredAt)
    : new Date(task.createDate || Date.now());

  const nowMs      = Date.now();
  const elapsedMs  = nowMs - enteredAt.getTime();
  const elapsedH   = elapsedMs / 3600000;
  const totalH     = config.hours;
  const remainingH = Math.max(totalH - elapsedH, 0);
  const usedPct    = Math.min(elapsedH / totalH, 1); // 0→1 (0% dùng → 100% dùng)
  const remainPct  = 1 - usedPct;                    // phần còn lại

  let status;
  if (remainPct <= 0)          status = 'danger';   // Quá SLA
  else if (remainPct <= config.warnAt) status = 'danger';   // <25% còn lại
  else if (remainPct <= 0.5)   status = 'warning';  // 25-50% còn lại
  else                         status = 'ok';        // >50% còn lại

  return {
    elapsedHours:   Math.round(elapsedH),
    remainingHours: Math.round(remainingH),
    usedPct,        // % đã dùng (để fill bar)
    remainPct,
    status,
    isOverdue: remainPct <= 0,
    label: formatSLATime(remainingH, remainPct <= 0),
    config,
  };
}

function formatSLATime(hours, isOverdue) {
  const prefix = isOverdue ? 'Quá ' : 'Còn ';
  if (hours < 1) return prefix + Math.round(hours * 60) + 'p';
  if (hours < 24) return prefix + Math.round(hours) + 'h';
  return prefix + Math.round(hours / 24) + 'ng';
}

/**
 * Render SLA bar HTML cho kanban card
 */
function renderSLABar(task) {
  const sla = getSLAInfo(task);
  if (!sla) return '';

  const fillPct = Math.round(sla.usedPct * 100);

  return `
    <div class="tc-sla-bar" title="SLA: ${SLA_CONFIG[task.stage]?.label || ''}">
      <div class="sla-track">
        <div class="sla-fill sla-${sla.status}" style="width:${fillPct}%"></div>
      </div>
      <span class="sla-label sla-${sla.status}">${sla.label}</span>
    </div>
  `;
}

/**
 * Render SLA detail box cho task detail modal
 */
function renderSLADetail(task) {
  const sla = getSLAInfo(task);
  if (!sla) return '<div style="font-size:12px;color:var(--c-text-3)">Giai đoạn này không có SLA.</div>';

  const config = SLA_CONFIG[task.stage];
  const enteredAt = task.stageEnteredAt
    ? new Date(task.stageEnteredAt).toLocaleDateString('vi-VN')
    : 'Không rõ';

  return `
    <div class="sla-detail-box">
      <div class="sla-detail-header">⏱ SLA Giai đoạn</div>
      <div class="sla-track" style="margin-bottom:8px">
        <div class="sla-fill sla-${sla.status}" style="width:${Math.round(sla.usedPct*100)}%"></div>
      </div>
      <div class="sla-detail-row">
        <span class="lbl">Giới hạn:</span>
        <span class="val">${config.label}</span>
      </div>
      <div class="sla-detail-row">
        <span class="lbl">Vào giai đoạn:</span>
        <span class="val">${enteredAt}</span>
      </div>
      <div class="sla-detail-row">
        <span class="lbl">Đã dùng:</span>
        <span class="val">${sla.elapsedHours}h / ${config.hours}h</span>
      </div>
      <div class="sla-detail-row">
        <span class="lbl">Trạng thái:</span>
        <span class="val sla-label sla-${sla.status}">${sla.isOverdue ? '⚠️ Quá SLA!' : sla.label}</span>
      </div>
    </div>
  `;
}

/**
 * Đếm số task vi phạm SLA theo từng status
 */
function getSLASummary() {
  let ok = 0, warning = 0, danger = 0, overdue = 0;
  appState.tasks.forEach(t => {
    const sla = getSLAInfo(t);
    if (!sla) return;
    if (sla.isOverdue) overdue++;
    else if (sla.status === 'danger')  danger++;
    else if (sla.status === 'warning') warning++;
    else ok++;
  });
  return { ok, warning, danger, overdue };
}

/**
 * Khi task chuyển giai đoạn → ghi lại thời điểm vào giai đoạn mới
 */
function recordStageEntry(task, newStageId) {
  task.stageEnteredAt = new Date().toISOString();
  task.stageHistory = task.stageHistory || [];
  task.stageHistory.push({
    stage: newStageId,
    enteredAt: task.stageEnteredAt,
    by: currentUser?.id,
  });
}
