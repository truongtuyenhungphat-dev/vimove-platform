/* ================================================
   VIWORK — Positions Module
   Sơ đồ tổ chức, Mô tả vị trí, KPI & Thu nhập
   ================================================ */

let activeTeamTab = 'leaderboard'; // 'leaderboard' | 'orgchart' | 'positions'
let activePositionId = null;

// ============ HELPER: Lấy vị trí của user ============
function getUserPosition(userId) {
  return POSITIONS.find(p => p.members && p.members.includes(userId)) || null;
}

// ============ HELPER: Format tiền VNĐ ============
function fmtVND(n) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' tỷ';
  if (n >= 1000000)    return (n / 1000000).toFixed(1) + ' triệu';
  return n.toLocaleString('vi-VN') + ' ₫';
}

// ============ TÍNH THU NHẬP ============
function calcIncome(userId) {
  const member = TEAM_MEMBERS.find(m => m.id === userId);
  const pos    = getUserPosition(userId);
  if (!member || !pos) return null;

  const kpiPct  = member.kpi || 0;
  const sal     = pos.salary;

  // Số CVC đã làm của user trong tháng này
  const now = new Date();
  const myTasks = (appState?.tasks || []).filter(t => t.assigneeId === userId);
  const done    = myTasks.filter(t => t.stage === 'done').length;
  const total   = myTasks.length;
  const kpiTaskTarget = 10; // mặc định target CVC/tháng nếu không có vị trí target

  // Bậc KPI
  let tier, multiplier, kpiBonus;
  if (kpiPct < 70) {
    tier = 'warn'; multiplier = 0.9; kpiBonus = 0;
  } else if (kpiPct < 90) {
    tier = 'partial'; multiplier = 1; kpiBonus = Math.round(sal.kpiBonus * kpiPct / 100);
  } else if (kpiPct < 100) {
    tier = 'good'; multiplier = 1; kpiBonus = sal.kpiBonus;
  } else {
    tier = 'excellent'; multiplier = 1; kpiBonus = sal.kpiBonus;
  }

  const basePaid   = Math.round(sal.base * multiplier);
  const cvcOver    = Math.max(done - kpiTaskTarget, 0);
  const cvcBonus   = cvcOver * sal.cvcBonus;
  const excelBonus = kpiPct >= 100 ? Math.round(sal.kpiBonus * 0.2) : 0;
  const total_income = basePaid + kpiBonus + cvcBonus + excelBonus;

  return { tier, kpiPct, basePaid, kpiBonus, cvcBonus, excelBonus, total_income,
           base: sal.base, maxKpiBonus: sal.kpiBonus, done, myTasksTotal: total, cvcOver };
}

// ============ RENDER TEAM TABS ============
function renderTeamPage() {
  // Inject tab bar nếu chưa có
  const container = document.getElementById('teamPageContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="team-tab-bar">
      <button class="team-tab-btn ${activeTeamTab==='leaderboard'?'active':''}"
        onclick="switchTeamTab('leaderboard')">🏆 Leaderboard</button>
      <button class="team-tab-btn ${activeTeamTab==='orgchart'?'active':''}"
        onclick="switchTeamTab('orgchart')">🗂️ Sơ đồ Tổ chức</button>
      <button class="team-tab-btn ${activeTeamTab==='positions'?'active':''}"
        onclick="switchTeamTab('positions')">📋 Vị trí & KPI</button>
      <button class="team-tab-btn ${activeTeamTab==='income'?'active':''}"
        onclick="switchTeamTab('income')">💰 Thu nhập</button>
    </div>
    <div id="teamTabContent"></div>
  `;

  renderTeamTabContent();
}

function switchTeamTab(tab) {
  activeTeamTab = tab;
  // Cập nhật active tab
  document.querySelectorAll('.team-tab-btn').forEach(btn => btn.classList.remove('active'));
  event?.target?.classList.add('active');
  renderTeamTabContent();
}

function renderTeamTabContent() {
  const el = document.getElementById('teamTabContent');
  if (!el) return;
  if (activeTeamTab === 'leaderboard') { renderLeaderboardTab(el); }
  else if (activeTeamTab === 'orgchart') { renderOrgChartTab(el); }
  else if (activeTeamTab === 'positions') { renderPositionsTab(el); }
  else if (activeTeamTab === 'income') { renderIncomeTab(el); }
}

// ============ TAB 1: LEADERBOARD ============
function renderLeaderboardTab(el) {
  el.innerHTML = `<div class="team-leaderboard" id="teamLeaderboard"></div>`;
  renderTeam(); // hàm cũ trong team.js
}

// ============ TAB 2: SƠ ĐỒ TỔ CHỨC ============
function renderOrgChartTab(el) {
  // Group theo level
  const level0 = POSITIONS.filter(p => p.level === 0);
  const level1 = POSITIONS.filter(p => p.level === 1);
  const level2 = POSITIONS.filter(p => p.level === 2);

  const renderNode = (pos, showChildren = false) => {
    const members  = pos.members?.map(id => TEAM_MEMBERS.find(m => m.id === id)).filter(Boolean) || [];
    const avgKpi   = members.length ? Math.round(members.reduce((s, m) => s + m.kpi, 0) / members.length) : 0;
    const kpiColor = avgKpi >= 90 ? '#10B981' : avgKpi >= 70 ? '#F59E0B' : '#EF4444';

    return `
      <div class="org-node" style="border-color:${pos.color}20;--node-color:${pos.color}"
           onclick="showPositionPopup('${pos.id}')">
        <div class="org-node-icon" style="background:${pos.color}20;color:${pos.color}">${pos.icon}</div>
        <div class="org-node-name">${pos.name}</div>
        <div class="org-node-members">
          ${members.map(m => `<span class="org-avatar" title="${m.name}">${m.avatar}</span>`).join('')}
        </div>
        <div class="org-node-kpi" style="color:${kpiColor}">KPI: ${avgKpi}%</div>
      </div>
    `;
  };

  el.innerHTML = `
    <div class="org-chart">
      <!-- Cấp 0 -->
      <div class="org-level org-level-0">
        ${level0.map(p => renderNode(p)).join('')}
      </div>
      <div class="org-connector-row"></div>
      <!-- Cấp 1 -->
      <div class="org-level org-level-1">
        ${level1.map(p => renderNode(p)).join('')}
      </div>
      <div class="org-connector-row"></div>
      <!-- Cấp 2 -->
      <div class="org-level org-level-2">
        ${level2.map(p => renderNode(p)).join('')}
      </div>
    </div>

    <!-- Popup chi tiết vị trí -->
    <div id="orgPopup" class="org-popup hidden" onclick="if(event.target===this)closeOrgPopup()">
      <div class="org-popup-inner" id="orgPopupInner"></div>
    </div>
  `;
}

function showPositionPopup(posId) {
  const pos     = POSITIONS.find(p => p.id === posId);
  if (!pos) return;
  const members  = pos.members?.map(id => TEAM_MEMBERS.find(m => m.id === id)).filter(Boolean) || [];
  const parent   = pos.reportsTo ? POSITIONS.find(p => p.id === pos.reportsTo) : null;

  const popup = document.getElementById('orgPopup');
  const inner = document.getElementById('orgPopupInner');
  if (!popup || !inner) return;

  inner.innerHTML = `
    <div class="org-popup-header" style="border-color:${pos.color}">
      <div class="org-popup-icon" style="background:${pos.color}20;color:${pos.color}">${pos.icon}</div>
      <div>
        <div class="org-popup-title">${pos.name}</div>
        <div class="org-popup-sub">${parent ? `Báo cáo cho: ${parent.icon} ${parent.name}` : 'Ban lãnh đạo'}</div>
      </div>
      <button class="org-popup-close" onclick="closeOrgPopup()">✕</button>
    </div>
    <p class="org-popup-desc">${pos.description}</p>
    <div class="org-popup-members">
      ${members.map(m => {
        const inc = calcIncome(m.id);
        const kpiColor = m.kpi >= 90 ? '#10B981' : m.kpi >= 70 ? '#F59E0B' : '#EF4444';
        return `
          <div class="org-popup-member">
            <div class="org-popup-avatar">${m.avatar}</div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${escHtml(m.name)}</div>
              <div style="font-size:11px;color:var(--c-text-3)">${escHtml(m.department||'')}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:13px;font-weight:700;color:${kpiColor}">${m.kpi}% KPI</div>
              ${inc ? `<div style="font-size:11px;color:#10B981">~${fmtVND(inc.total_income)}</div>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="org-popup-kpi">
      <div style="font-size:12px;font-weight:600;color:var(--c-text-2);margin-bottom:8px">📊 KPI Chỉ tiêu vị trí</div>
      ${pos.kpiTargets.map(k => `
        <div class="org-kpi-row">
          <span>${k.label}</span>
          <span style="font-weight:600;color:var(--c-primary)">${k.target} ${k.unit}</span>
        </div>
      `).join('')}
    </div>
    <div style="margin-top:12px;font-size:12px;color:var(--c-text-3)">
      💰 Lương cứng: ${fmtVND(pos.salary.base)} · Thưởng KPI tối đa: ${fmtVND(pos.salary.kpiBonus)}
    </div>
  `;
  popup.classList.remove('hidden');
}

function closeOrgPopup() {
  document.getElementById('orgPopup')?.classList.add('hidden');
}

// ============ TAB 3: VỊ TRÍ & KPI ============
function renderPositionsTab(el) {
  if (!activePositionId) activePositionId = POSITIONS[0]?.id;
  const pos = POSITIONS.find(p => p.id === activePositionId);

  el.innerHTML = `
    <div class="positions-layout">
      <!-- Sidebar danh sách vị trí -->
      <div class="pos-sidebar">
        ${POSITIONS.map(p => {
          const members = p.members?.map(id => TEAM_MEMBERS.find(m => m.id === id)).filter(Boolean) || [];
          return `
            <div class="pos-sidebar-item ${p.id === activePositionId ? 'active' : ''}"
                 style="--pos-color:${p.color}"
                 onclick="selectPosition('${p.id}')">
              <span class="pos-icon" style="color:${p.color}">${p.icon}</span>
              <span class="pos-name">${p.name}</span>
              <span class="pos-count">${members.length}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Chi tiết vị trí -->
      <div class="pos-detail" id="posDetail">
        ${pos ? renderPositionDetail(pos) : '<div class="att-empty">Chọn vị trí để xem chi tiết</div>'}
      </div>
    </div>
  `;
}

function selectPosition(posId) {
  activePositionId = posId;
  const pos = POSITIONS.find(p => p.id === posId);
  document.getElementById('posDetail')?.replaceWith(
    Object.assign(document.createElement('div'), { id: 'posDetail', innerHTML: renderPositionDetail(pos), className: 'pos-detail' })
  );
  document.querySelectorAll('.pos-sidebar-item').forEach(el => {
    el.classList.toggle('active', el.dataset.posid === posId || el.querySelector('.pos-name')?.textContent === pos?.name);
  });
}

function renderPositionDetail(pos) {
  const members = pos.members?.map(id => TEAM_MEMBERS.find(m => m.id === id)).filter(Boolean) || [];
  const parent  = pos.reportsTo ? POSITIONS.find(p => p.id === pos.reportsTo) : null;

  const memberRows = members.map(m => {
    const kpiColor = m.kpi >= 90 ? '#10B981' : m.kpi >= 70 ? '#F59E0B' : '#EF4444';
    const inc = calcIncome(m.id);
    return `
      <div class="pos-member-row">
        <div class="pos-member-ava">${m.avatar}</div>
        <div style="flex:1">
          <div style="font-weight:600;font-size:13px">${escHtml(m.name)}</div>
          <div style="font-size:11px;color:var(--c-text-3)">${escHtml(m.department||'')}</div>
        </div>
        <div style="display:flex;gap:12px;align-items:center">
          <div>
            <div class="kpi-bar-wrap" style="width:80px;margin-bottom:2px">
              <div class="kpi-bar" style="width:${m.kpi}%;background:${kpiColor}"></div>
            </div>
            <div style="font-size:10px;color:${kpiColor};font-weight:600">${m.kpi}% KPI</div>
          </div>
          ${inc ? `<div style="font-size:12px;font-weight:700;color:#10B981">~${fmtVND(inc.total_income)}/tháng</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="pos-detail-header" style="border-color:${pos.color}30">
      <div class="pos-detail-icon" style="background:${pos.color}15;color:${pos.color}">${pos.icon}</div>
      <div>
        <div class="pos-detail-title">${pos.name}</div>
        <div class="pos-detail-sub">
          ${parent ? `Báo cáo cho: ${parent.icon} ${parent.name}` : '🏢 Ban lãnh đạo'}
          · ${members.length} thành viên
        </div>
      </div>
    </div>
    <p class="pos-desc">${pos.description}</p>

    <!-- Thành viên -->
    <div class="pos-section">
      <div class="pos-section-title">👥 Thành viên (${members.length})</div>
      ${members.length ? memberRows : '<div style="color:var(--c-text-3);font-size:13px">Chưa có thành viên</div>'}
    </div>

    <!-- CVC Mẫu -->
    <div class="pos-section">
      <div class="pos-section-title">📌 CVC mẫu hàng tháng</div>
      <div class="pos-template-list">
        ${pos.taskTemplates.map(t => `
          <div class="pos-template-item">
            <span class="tag priority-${t.priority}">${PRIORITIES[t.priority]?.icon}</span>
            <span style="flex:1;font-size:13px">${escHtml(t.title)}</span>
            <span style="font-size:11px;color:var(--c-text-3)">${CATEGORIES[t.category]?.name||''}</span>
            <button class="pos-use-btn" onclick="createFromTemplate(${JSON.stringify(t).replace(/"/g,'&quot;')})">+ Tạo CVC</button>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- KPI Chỉ tiêu -->
    <div class="pos-section">
      <div class="pos-section-title">📊 KPI Chỉ tiêu vị trí</div>
      ${pos.kpiTargets.map(k => `
        <div class="pos-kpi-row">
          <span>${k.label}</span>
          <span class="pos-kpi-target">${k.target} ${k.unit}</span>
        </div>
      `).join('')}
    </div>

    <!-- Thu nhập cấu trúc -->
    <div class="pos-section">
      <div class="pos-section-title">💰 Cấu trúc thu nhập</div>
      <div class="pos-salary-grid">
        <div class="pos-sal-box">
          <div class="pos-sal-val">${fmtVND(pos.salary.base)}</div>
          <div class="pos-sal-lbl">Lương cứng</div>
        </div>
        <div class="pos-sal-box">
          <div class="pos-sal-val" style="color:#10B981">+${fmtVND(pos.salary.kpiBonus)}</div>
          <div class="pos-sal-lbl">Thưởng KPI tối đa</div>
        </div>
        <div class="pos-sal-box">
          <div class="pos-sal-val" style="color:#F59E0B">+${fmtVND(pos.salary.cvcBonus)}</div>
          <div class="pos-sal-lbl">Thưởng/CVC vượt</div>
        </div>
        <div class="pos-sal-box" style="border-color:rgba(90,184,0,0.3);background:rgba(90,184,0,0.06)">
          <div class="pos-sal-val" style="color:#5AB800">${fmtVND(pos.salary.base + pos.salary.kpiBonus)}</div>
          <div class="pos-sal-lbl">Tối đa/tháng (KPI 100%)</div>
        </div>
      </div>
    </div>
  `;
}

function createFromTemplate(tpl) {
  // Mở modal tạo CVC với data được điền sẵn
  if (typeof openNewTaskModal === 'function') openNewTaskModal();
  setTimeout(() => {
    const titleEl = document.getElementById('newTaskTitle');
    const catEl   = document.getElementById('newTaskCategory');
    const priEl   = document.getElementById('newTaskPriority');
    if (titleEl) titleEl.value  = tpl.title;
    if (catEl)   catEl.value   = tpl.category;
    if (priEl)   priEl.value   = tpl.priority;
  }, 200);
}

// ============ TAB 4: THU NHẬP ============
function renderIncomeTab(el) {
  const isAdmin = currentUser?.role === 'admin';

  // Admin thấy toàn đội, staff/manager chỉ thấy mình
  const viewUsers = isAdmin
    ? TEAM_MEMBERS
    : TEAM_MEMBERS.filter(m => m.id === currentUser?.id);

  const myInc = calcIncome(currentUser?.id);

  el.innerHTML = `
    <div class="income-page">
      ${myInc ? renderMyIncomeCard(myInc) : ''}

      ${isAdmin ? `
        <div class="income-section-title">📊 Thu nhập ước tính toàn đội tháng này</div>
        <div class="income-table-wrap">
          <table class="income-table">
            <thead>
              <tr>
                <th>Thành viên</th>
                <th>Vị trí</th>
                <th>KPI</th>
                <th>Lương cứng</th>
                <th>Thưởng KPI</th>
                <th>Thưởng CVC</th>
                <th style="color:#5AB800">Ước tính nhận</th>
              </tr>
            </thead>
            <tbody>
              ${TEAM_MEMBERS.map(m => {
                const inc = calcIncome(m.id);
                const pos = getUserPosition(m.id);
                if (!inc) return `<tr><td colspan="7" style="color:var(--c-text-3);font-size:12px">${m.name} — Chưa có vị trí</td></tr>`;
                const tierIcon = { warn:'🔴', partial:'🟡', good:'🟢', excellent:'🌟' }[inc.tier];
                return `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <span class="org-avatar">${m.avatar}</span>
                        <div>
                          <div style="font-weight:600;font-size:13px">${escHtml(m.name)}</div>
                          <div style="font-size:11px;color:var(--c-text-3)">${m.department||''}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size:12px">${pos ? pos.icon + ' ' + pos.name : '—'}</td>
                    <td><span style="font-weight:700;color:${inc.kpiPct>=90?'#10B981':inc.kpiPct>=70?'#F59E0B':'#EF4444'}">${tierIcon} ${inc.kpiPct}%</span></td>
                    <td style="font-family:monospace">${fmtVND(inc.basePaid)}</td>
                    <td style="font-family:monospace;color:#10B981">+${fmtVND(inc.kpiBonus)}</td>
                    <td style="font-family:monospace;color:#F59E0B">+${fmtVND(inc.cvcBonus)}</td>
                    <td style="font-family:monospace;font-weight:700;color:#5AB800">${fmtVND(inc.total_income)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" style="font-weight:700;text-align:right;padding:10px 14px">Tổng ước tính chi lương tháng:</td>
                <td style="font-weight:800;font-size:15px;color:#5AB800;padding:10px 14px">
                  ${fmtVND(TEAM_MEMBERS.reduce((s, m) => { const i = calcIncome(m.id); return s + (i?.total_income||0); }, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ''}
    </div>
  `;
}

function renderMyIncomeCard(inc) {
  const tierData = {
    warn:      { icon:'🔴', label:'Cảnh báo KPI', color:'#EF4444', bg:'rgba(239,68,68,0.08)' },
    partial:   { icon:'🟡', label:'Đạt một phần', color:'#F59E0B', bg:'rgba(245,158,11,0.08)' },
    good:      { icon:'🟢', label:'Đạt KPI',      color:'#10B981', bg:'rgba(16,185,129,0.08)' },
    excellent: { icon:'🌟', label:'Xuất sắc',     color:'#5AB800', bg:'rgba(90,184,0,0.10)'   },
  }[inc.tier];

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate() - now.getDate();
  const needed   = inc.maxKpiBonus - inc.kpiBonus;
  const hint     = inc.kpiPct < 90
    ? `⚠️ Hoàn thành thêm CVC để đạt KPI 90% — sẽ nhận thêm ${fmtVND(needed)} thưởng KPI`
    : (inc.kpiPct >= 100 ? '🌟 Xuất sắc! Bạn đang ở mức thưởng cao nhất' : '✅ Đang đạt KPI đầy đủ');

  return `
    <div class="my-income-card" style="background:${tierData.bg};border-color:${tierData.color}30">
      <div class="income-card-header">
        <div>
          <div class="income-month">💰 Thu nhập tháng ${now.getMonth()+1}/${now.getFullYear()}</div>
          <div class="income-tier" style="color:${tierData.color}">${tierData.icon} ${tierData.label}</div>
        </div>
        <div class="income-total" style="color:${tierData.color}">${fmtVND(inc.total_income)}</div>
      </div>

      <div class="income-breakdown">
        <div class="inc-row">
          <span class="inc-label">Lương cứng</span>
          <span class="inc-val">${fmtVND(inc.basePaid)}</span>
        </div>
        <div class="inc-row">
          <span class="inc-label">+ Thưởng KPI (${inc.kpiPct}% × ${fmtVND(inc.maxKpiBonus)})</span>
          <span class="inc-val" style="color:#10B981">+${fmtVND(inc.kpiBonus)}</span>
        </div>
        ${inc.cvcBonus > 0 ? `
        <div class="inc-row">
          <span class="inc-label">+ Thưởng CVC vượt (${inc.cvcOver} CVC)</span>
          <span class="inc-val" style="color:#F59E0B">+${fmtVND(inc.cvcBonus)}</span>
        </div>` : ''}
        ${inc.excelBonus > 0 ? `
        <div class="inc-row">
          <span class="inc-label">+ Thưởng xuất sắc (KPI ≥ 100%)</span>
          <span class="inc-val" style="color:#5AB800">+${fmtVND(inc.excelBonus)}</span>
        </div>` : ''}
        <div class="inc-divider"></div>
        <div class="inc-row inc-total-row">
          <span class="inc-label">💵 Ước tính nhận</span>
          <span class="inc-val inc-total-val">${fmtVND(inc.total_income)}</span>
        </div>
      </div>

      <div class="income-hint">${hint}</div>

      <div class="income-meta">
        <span>📋 CVC tháng này: ${inc.done} hoàn thành / ${inc.myTasksTotal} tổng</span>
        <span>📅 Còn ${daysLeft} ngày trong tháng</span>
      </div>
    </div>
  `;
}
