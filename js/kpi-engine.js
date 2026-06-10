/* ================================================
   VIWORK — KPI Engine: Tính KPI thực tế theo tháng
   Thay thế dữ liệu cứng bằng tính toán động từ
   appState.tasks, appState.assignments, CRM leads
   ================================================ */

/**
 * Trả về chuỗi year-month hiện tại hoặc của tháng được chỉ định
 * @param {Date|null} date
 */
function getCurrentYearMonth(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

/**
 * Tính số CVC hoàn thành của 1 user trong 1 tháng cụ thể
 * Nguồn: appState.tasks, dựa vào stageEnteredAt khi vào stage 'done'
 */
function getTasksDoneInMonth(userId, yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return (appState?.tasks || []).filter(t => {
    if (t.assigneeId !== userId || t.stage !== 'done') return false;
    if (!t.stageEnteredAt) return false;
    const d = new Date(t.stageEnteredAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

/**
 * Tính số assignments hoàn thành của 1 user trong 1 tháng
 */
function getAssignmentsDoneInMonth(userId, yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return (appState?.assignments || []).filter(a => {
    if (a.assignedTo !== userId || a.status !== 'done') return false;
    const d = a.completedAt ? new Date(a.completedAt) : (a.updatedAt ? new Date(a.updatedAt) : null);
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
}

/**
 * Tính tổng value CVC (doanh thu thực tế) của 1 user trong 1 tháng
 */
function getRevenueInMonth(userId, yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return (appState?.tasks || [])
    .filter(t => {
      if (t.assigneeId !== userId || t.stage !== 'done') return false;
      if (!t.value || !t.stageEnteredAt) return false;
      const d = new Date(t.stageEnteredAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .reduce((sum, t) => sum + (t.value || 0), 0);
}

/**
 * Tổng hợp dữ liệu thực tế của 1 user trong 1 tháng
 * Dùng làm nguồn dữ liệu duy nhất cho KPI/lương
 */
function getMemberActuals(userId, yearMonth) {
  const ym = yearMonth || getCurrentYearMonth();
  const tasksDone      = getTasksDoneInMonth(userId, ym);
  const assignDone     = getAssignmentsDoneInMonth(userId, ym);
  const totalTasksDone = tasksDone.length;
  const totalAssignDone= assignDone.length;
  const revenue        = getRevenueInMonth(userId, ym);

  // Đếm tổng CVC trong tháng (bất kể stage)
  const [year, month] = ym.split('-').map(Number);
  const totalTasksActive = (appState?.tasks || []).filter(t => {
    if (t.assigneeId !== userId) return false;
    const d = t.createDate ? new Date(t.createDate) : null;
    if (!d) return false;
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }).length;

  return {
    yearMonth: ym,
    tasksDone: totalTasksDone,
    assignDone: totalAssignDone,
    totalDone: totalTasksDone + totalAssignDone,
    revenue,
    totalTasksActive,
    tasks: tasksDone,      // mảng chi tiết
    assignments: assignDone,
  };
}

/**
 * Tính % KPI tự động từ data thực tế theo từng metric của position
 * THAY THẾ member.kpi cứng bằng tính toán live
 * @param {string} userId
 * @param {string} yearMonth - 'YYYY-MM'
 * @returns {number} kpiPct 0-130
 */
function calcLiveKpiPct(userId, yearMonth) {
  const ym     = yearMonth || getCurrentYearMonth();
  const pos    = getUserPosition(userId);
  const member = TEAM_MEMBERS.find(m => m.id === userId);
  if (!member || !pos) return 0;

  // Nếu KPI tháng này đã được Admin phê duyệt → dùng giá trị đó
  const key     = `${userId}_${ym}`;
  const actuals = KPI_ACTUALS[key] || {};
  if (actuals.approved) {
    // Tính lại điểm từ actuals đã approve
    const score = calcKpiScore(userId, ym);
    return score?.kpiTotal ?? member.kpi;
  }

  // Chưa phê duyệt → tính live từ data thực tế
  const liveActuals = getMemberActuals(userId, ym);
  const kpiTargets  = pos.kpiTargets || [];

  if (kpiTargets.length === 0) {
    // Không có kpiTargets → dùng tasks_done vs target 10
    const target = 10;
    return Math.min(Math.round((liveActuals.tasksDone / target) * 100), 130);
  }

  let totalWeight = 0, totalScore = 0;
  kpiTargets.forEach(k => {
    const w = k.weight || Math.round(100 / kpiTargets.length);
    let pct = 0;

    if (k.metric === 'tasks_done') {
      const target = k.target || 10;
      pct = Math.min(Math.round((liveActuals.tasksDone / target) * 100), 130);
    } else if (k.metric === 'assignments_done') {
      const target = k.target || 5;
      pct = Math.min(Math.round((liveActuals.assignDone / target) * 100), 130);
    } else if (k.metric === 'revenue') {
      const target = k.target || 1;
      pct = Math.min(Math.round((liveActuals.revenue / target) * 100), 130);
    } else {
      // Metric thủ công: lấy từ KPI_ACTUALS nếu có, không thì 0
      const actual = actuals[k.metric] ?? null;
      pct = actual !== null ? Math.min(Math.round((actual / k.target) * 100), 130) : 0;
    }

    const score = Math.round(pct * w / 100 * 10) / 10;
    totalWeight += w;
    totalScore  += score;
  });

  return Math.min(Math.round(totalScore), 130);
}

/**
 * Cập nhật member.kpi, member.tasks, member.revenue trong TEAM_MEMBERS
 * dựa trên data thực tế tháng hiện tại — gọi mỗi khi tasks/assignments thay đổi
 */
function refreshAllMemberKpi(yearMonth) {
  const ym = yearMonth || getCurrentYearMonth();
  TEAM_MEMBERS.forEach(m => {
    const actuals   = getMemberActuals(m.id, ym);
    const liveKpi   = calcLiveKpiPct(m.id, ym);
    m.kpi      = liveKpi;
    m.tasks    = actuals.tasksDone + actuals.assignDone;
    m.revenue  = actuals.revenue;
  });
}

/**
 * Lấy KPI summary cho 1 user gồm cả lịch sử nhiều tháng
 */
function getMemberKpiHistory(userId, monthsBack = 6) {
  const history = [];
  const now = new Date();
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = getCurrentYearMonth(d);
    const kpiPct  = calcLiveKpiPct(userId, ym);
    const actuals = getMemberActuals(userId, ym);
    history.push({
      yearMonth:  ym,
      label:      `T${d.getMonth()+1}/${d.getFullYear()}`,
      kpiPct,
      tasksDone:  actuals.tasksDone,
      revenue:    actuals.revenue,
      approved:   !!(KPI_ACTUALS[`${userId}_${ym}`]?.approved),
    });
  }
  return history.reverse(); // cũ nhất trước
}

/**
 * Gọi sau khi tasks/assignments data thay đổi (Firebase sync)
 * để cập nhật KPI cho tất cả UI hiển thị
 */
function onKpiDataChanged() {
  refreshAllMemberKpi();
  // Re-render các module đang active
  try {
    if (activeTeamTab === 'leaderboard' || activeTeamTab === 'income') {
      renderTeamTabContent();
    }
    if (document.getElementById('page-dashboard')?.classList.contains('active')) {
      renderDashboard?.();
    }
  } catch(e) {}
}

console.log('[⚡ VIWORK] KPI Engine loaded — live dynamic KPI calculation enabled');
