/* ================================================
   VIWORK — HR Module: KPI, Payslip, Policy, Password
   ================================================ */

// ============ HELPERS ============
function getKpiKey(userId, date) {
  const d = date || new Date();
  return `${userId}_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

function getKpiTier(kpiPct) {
  return SALARY_POLICY.tiers.find(t => kpiPct >= t.min && kpiPct <= t.max) || SALARY_POLICY.tiers[0];
}

// Tính KPI tự động từ CVC + actuals
function calcKpiScore(userId, yearMonth) {
  const pos = getUserPosition(userId);
  if (!pos) return null;

  const now = new Date();
  const [year, month] = yearMonth
    ? yearMonth.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  const key     = `${userId}_${year}-${String(month).padStart(2,'0')}`;
  const actuals = KPI_ACTUALS[key] || {};

  // Tính CVC done tháng này
  const tasks = (appState?.tasks || []).filter(t => {
    if (t.assigneeId !== userId || t.stage !== 'done') return false;
    if (!t.stageEnteredAt) return false;
    const d = new Date(t.stageEnteredAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  const tasksDonePct = pos.kpiTargets.find(k => k.metric === 'tasks_done')
    ? Math.min(Math.round((tasks.length / 10) * 100), 130)
    : null;

  let totalWeight = 0, totalScore = 0;
  const breakdown = pos.kpiTargets.map(k => {
    let actual, pct;
    if (k.metric === 'tasks_done') {
      actual = tasks.length;
      pct    = Math.min(Math.round((actual / 10) * 100), 130);
    } else {
      actual = actuals[k.metric] ?? null;
      pct    = actual !== null ? Math.min(Math.round((actual / k.target) * 100), 130) : 0;
    }
    const w     = k.weight || Math.round(100 / pos.kpiTargets.length);
    const score = Math.round(pct * w / 100 * 10) / 10;
    totalWeight += w;
    totalScore  += score;
    return { ...k, actual, pct, weight: w, score };
  });

  const kpiTotal = Math.round(totalScore);
  const tier     = getKpiTier(kpiTotal);
  return { kpiTotal, tier, breakdown, approved: actuals.approved || false,
           approvedBy: actuals.approvedBy, approvedAt: actuals.approvedAt, yearMonth: `${year}-${String(month).padStart(2,'0')}` };
}

// Tính phiếu lương đầy đủ
function calcPayslip(userId, yearMonth) {
  const member = TEAM_MEMBERS.find(m => m.id === userId);
  const pos    = getUserPosition(userId);
  if (!member || !pos) return null;

  const kpi  = calcKpiScore(userId, yearMonth);
  const kpiPct = kpi?.kpiTotal ?? member.kpi;
  const tier   = getKpiTier(kpiPct);

  const sal       = pos.salary;
  const allowance = USER_ALLOWANCES[userId] || {};
  const totalAllowance = (allowance.lunch||0) + (allowance.transport||0) +
                         (allowance.phone||0) + (allowance.housing||0) + (allowance.other||0);

  const basePaid  = Math.round(sal.base * tier.baseMult);
  const kpiBonus  = Math.round(sal.kpiBonus * tier.bonusMult);
  const excelBonus = kpiPct >= 100 ? Math.round(sal.kpiBonus * 0.2) : 0;

  // CVC vượt target
  const now = new Date();
  const [y, m] = yearMonth ? yearMonth.split('-').map(Number) : [now.getFullYear(), now.getMonth()+1];
  const doneTasks = (appState?.tasks||[]).filter(t => {
    if (t.assigneeId !== userId || t.stage !== 'done') return false;
    const d = t.stageEnteredAt ? new Date(t.stageEnteredAt) : null;
    return d && d.getFullYear() === y && d.getMonth()+1 === m;
  });
  const cvcOver  = Math.max(doneTasks.length - 10, 0);
  const cvcBonus = cvcOver * sal.cvcBonus;

  const gross = basePaid + kpiBonus + excelBonus + cvcBonus + totalAllowance;
  const tax   = gross > 11000000 ? Math.round((gross - 11000000) * 0.05) : 0; // PIT 5% tạm tính

  return { userId, member, pos, yearMonth: `${y}-${String(m).padStart(2,'0')}`,
           basePaid, kpiBonus, excelBonus, cvcBonus, totalAllowance, allowance,
           gross, tax, net: gross - tax, kpiPct, tier, kpi, doneTasks: doneTasks.length, cvcOver };
}

// ============ KPI ENTRY MODAL (Admin only) ============
function openKpiEntryModal(userId, yearMonth) {
  if (currentUser?.role !== 'admin') { showToast('⚠️ Chỉ Admin mới có quyền nhập KPI!', 'error'); return; }
  const member = TEAM_MEMBERS.find(m => m.id === userId);
  const pos    = getUserPosition(userId);
  if (!member || !pos) return;

  const ym  = yearMonth || (() => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; })();
  const key = `${userId}_${ym}`;
  const existing = KPI_ACTUALS[key] || {};

  const nonAutoKpis = pos.kpiTargets.filter(k => k.metric !== 'tasks_done');

  document.getElementById('kpiEntryModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'kpiEntryModal';
  modal.className = 'modal-overlay';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-box" style="max-width:520px">
      <div class="modal-header">
        <h3>📊 Nhập KPI — ${escHtml(member.name)}</h3>
        <span style="font-size:12px;color:var(--c-text-3)">${ym}</span>
        <button class="modal-close" onclick="document.getElementById('kpiEntryModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--c-surface-2);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:var(--c-text-2)">
          📌 CVC hoàn thành tháng này: <strong>${
            (appState?.tasks||[]).filter(t => {
              if (t.assigneeId !== userId || t.stage !== 'done') return false;
              const d = t.stageEnteredAt ? new Date(t.stageEnteredAt) : null;
              const [y,m2] = ym.split('-').map(Number);
              return d && d.getFullYear()===y && d.getMonth()+1===m2;
            }).length
          } CVC</strong> (tự động từ hệ thống)
        </div>
        ${nonAutoKpis.map(k => `
          <div class="form-group">
            <label>${k.icon||'📌'} ${k.label} <span style="color:var(--c-text-3)">(Target: ${k.target} ${k.unit})</span></label>
            <input type="number" class="form-input" id="kpi_${k.metric}"
              value="${existing[k.metric] ?? ''}" placeholder="Nhập số thực tế..." min="0" step="0.1">
          </div>
        `).join('')}
        <div class="form-group">
          <label>📝 Ghi chú đánh giá</label>
          <textarea class="form-input" id="kpi_note" rows="2" placeholder="Nhận xét tháng này...">${existing.note||''}</textarea>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
          <input type="checkbox" id="kpi_approve" ${existing.approved?'checked':''}>
          <label for="kpi_approve" style="font-size:13px;font-weight:500">✅ Phê duyệt KPI tháng này</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-cancel" onclick="document.getElementById('kpiEntryModal').remove()">Hủy</button>
        <button class="btn btn-save" onclick="saveKpiEntry('${userId}','${ym}')">💾 Lưu KPI</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function saveKpiEntry(userId, ym) {
  if (currentUser?.role !== 'admin') return;
  const pos = getUserPosition(userId);
  if (!pos) return;

  const key  = `${userId}_${ym}`;
  const nonAutoKpis = pos.kpiTargets.filter(k => k.metric !== 'tasks_done');
  const data = { note: document.getElementById('kpi_note')?.value || '' };

  nonAutoKpis.forEach(k => {
    const v = parseFloat(document.getElementById(`kpi_${k.metric}`)?.value);
    if (!isNaN(v)) data[k.metric] = v;
  });

  const approve = document.getElementById('kpi_approve')?.checked;
  if (approve) {
    data.approved   = true;
    data.approvedBy = currentUser.id;
    data.approvedAt = new Date().toISOString();
    // Cập nhật member.kpi thực tế
    const score = calcKpiScore(userId, ym);
    if (score) {
      const idx = TEAM_MEMBERS.findIndex(m => m.id === userId);
      if (idx > -1) TEAM_MEMBERS[idx].kpi = score.kpiTotal;
    }
  }

  KPI_ACTUALS[key] = { ...(KPI_ACTUALS[key] || {}), ...data };
  document.getElementById('kpiEntryModal')?.remove();
  showToast(`✅ Đã lưu KPI ${ym} cho ${TEAM_MEMBERS.find(m=>m.id===userId)?.name}`, 'success');
  if (activeTeamTab === 'income') renderTeamTabContent();
}

// ============ PAYSLIP VIEW ============
function openPayslip(userId, yearMonth) {
  // Kiểm tra quyền
  const isOwner = currentUser?.id === userId;
  const isAdmin = currentUser?.role === 'admin';
  if (!isOwner && !isAdmin) { showToast('⚠️ Bạn không có quyền xem phiếu lương này!', 'error'); return; }

  const ps  = calcPayslip(userId, yearMonth);
  if (!ps) return;

  const now = new Date();
  const [y,m] = (yearMonth||`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`).split('-');
  const monthLabel = `Tháng ${parseInt(m)}/${y}`;

  document.getElementById('payslipModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'payslipModal';
  modal.className = 'modal-overlay';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-box payslip-box" style="max-width:520px;width:95vw">
      <div class="modal-header" style="padding:18px 20px">
        <div>
          <div style="font-size:11px;color:var(--c-text-3);text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">PHIẾU LƯƠNG</div>
          <h3 style="margin:0;font-size:17px">${monthLabel}</h3>
        </div>
        <button class="modal-close" onclick="document.getElementById('payslipModal').remove()">✕</button>
      </div>

      <div class="modal-body" style="padding:0 20px 20px;max-height:72vh;overflow-y:auto">

        <!-- Employee header -->
        <div class="ps-emp-header">
          <div class="ps-avatar">${ps.member.avatar}</div>
          <div style="flex:1;min-width:0">
            <div class="ps-emp-name">${escHtml(ps.member.name)}</div>
            <div class="ps-emp-pos">${ps.pos.icon} ${ps.pos.name} · ${escHtml(ps.member.department||'')}</div>
          </div>
          <div class="ps-kpi-badge" style="background:${ps.kpiPct>=90?'rgba(16,185,129,0.12)':ps.kpiPct>=70?'rgba(245,158,11,0.12)':'rgba(239,68,68,0.12)'}">
            <div style="font-size:18px">${ps.tier.emoji}</div>
            <div style="font-weight:800;font-size:18px;line-height:1">${ps.kpiPct}%</div>
            <div style="font-size:10px;color:var(--c-text-3);margin-top:2px">${ps.tier.label}</div>
          </div>
        </div>

        <!-- Income breakdown -->
        <div class="ps-breakdown-list">
          <div class="ps-group-title">💼 Lương cơ bản</div>
          <div class="ps-line">
            <span>Lương cứng <span class="ps-tag">×${ps.tier.baseMult}</span></span>
            <span class="ps-amount">${fmtVND(ps.basePaid)}</span>
          </div>

          <div class="ps-group-title">🏆 Thưởng KPI</div>
          <div class="ps-line">
            <span>Thưởng KPI — bậc "${ps.tier.label}"</span>
            <span class="ps-amount ps-green">+${fmtVND(ps.kpiBonus)}</span>
          </div>
          ${ps.excelBonus>0 ? `<div class="ps-line"><span>Bonus xuất sắc (KPI ≥ 100%)</span><span class="ps-amount ps-green">+${fmtVND(ps.excelBonus)}</span></div>` : ''}
          ${ps.cvcBonus>0  ? `<div class="ps-line"><span>Thưởng CVC vượt (${ps.cvcOver} CVC × ${fmtVND(ps.pos.salary.cvcBonus)})</span><span class="ps-amount ps-green">+${fmtVND(ps.cvcBonus)}</span></div>` : ''}

          <div class="ps-group-title">🎁 Phụ cấp cá nhân</div>
          ${ps.allowance.lunch     ? `<div class="ps-line"><span>Ăn trưa</span><span class="ps-amount">+${fmtVND(ps.allowance.lunch)}</span></div>` : ''}
          ${ps.allowance.transport ? `<div class="ps-line"><span>Đi lại</span><span class="ps-amount">+${fmtVND(ps.allowance.transport)}</span></div>` : ''}
          ${ps.allowance.phone     ? `<div class="ps-line"><span>Điện thoại</span><span class="ps-amount">+${fmtVND(ps.allowance.phone)}</span></div>` : ''}
          ${ps.allowance.housing   ? `<div class="ps-line"><span>Nhà ở</span><span class="ps-amount">+${fmtVND(ps.allowance.housing)}</span></div>` : ''}
          ${ps.allowance.other     ? `<div class="ps-line"><span>Khác</span><span class="ps-amount">+${fmtVND(ps.allowance.other)}</span></div>` : ''}
          ${!ps.allowance.lunch && !ps.allowance.transport && !ps.allowance.phone && !ps.allowance.housing && !ps.allowance.other ? `<div class="ps-line" style="color:var(--c-text-3);font-style:italic"><span>Chưa có phụ cấp</span><span>—</span></div>` : ''}

          ${ps.tax>0 ? `
          <div class="ps-group-title" style="color:#EF4444">💸 Khấu trừ</div>
          <div class="ps-line"><span>Thuế TNCN tạm tính (5%)</span><span class="ps-amount ps-red">−${fmtVND(ps.tax)}</span></div>
          ` : ''}
        </div>

        <!-- Total bar -->
        <div class="ps-total-bar">
          <div>
            <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-bottom:4px">💵 THỰC NHẬN THÁNG ${parseInt(m)}/${y}</div>
            <div style="font-size:26px;font-weight:800;letter-spacing:-0.5px">${fmtVND(ps.net)}</div>
          </div>
          <div style="text-align:right;font-size:11px;color:rgba(255,255,255,0.7)">
            <div>Thu nhập gộp</div>
            <div style="font-size:14px;font-weight:600;color:white">${fmtVND(ps.gross)}</div>
          </div>
        </div>

        <div style="text-align:center;font-size:11px;color:var(--c-text-3);margin-top:12px">
          ${ps.kpi?.approved
            ? `✅ KPI đã phê duyệt · ${ps.kpi.approvedAt?.slice(0,10)||''}`
            : '⏳ KPI chưa phê duyệt — số liệu có thể thay đổi'}
          &nbsp;·&nbsp; Trả lương mùng ${SALARY_POLICY.policy.payDay}
        </div>
      </div>

      <div class="modal-footer" style="padding:14px 20px;display:flex;justify-content:flex-end;gap:8px">
        <button class="btn btn-cancel" onclick="document.getElementById('payslipModal').remove()">✕ Đóng</button>
        <button class="btn btn-save" onclick="printPayslip()">🖨️ In / PDF</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function printPayslip() {
  window.print();
}

// ============ CHÍNH SÁCH LƯƠNG ============
function renderPolicyTab(el) {
  el.innerHTML = `
    <div class="policy-page">
      <div class="policy-card">
        <div class="policy-section-title">📋 Thông tin chính sách</div>
        <div class="policy-info-row"><span>Hiệu lực từ:</span><strong>${SALARY_POLICY.effectiveDate}</strong></div>
        <div class="policy-info-row"><span>Ngày trả lương:</span><strong>Mùng ${SALARY_POLICY.policy.payDay} hàng tháng</strong></div>
        <div class="policy-info-row"><span>Ngày nhập KPI:</span><strong>Mùng ${SALARY_POLICY.policy.kpiReviewDay} tháng sau</strong></div>
        <div class="policy-info-row"><span>Thử việc:</span><strong>${SALARY_POLICY.policy.probation} tháng (lương × 85%)</strong></div>
        <p style="font-size:12px;color:var(--c-text-3);margin-top:10px;border-top:1px solid var(--c-border-subtle);padding-top:10px">${SALARY_POLICY.policy.note}</p>
      </div>

      <div class="policy-card">
        <div class="policy-section-title">📊 Bậc KPI & Hệ số lương</div>
        <table class="ps-table">
          <thead><tr><th>Bậc KPI</th><th>Khoảng</th><th>Lương cứng</th><th>Thưởng KPI</th><th>Ghi chú</th></tr></thead>
          <tbody>
            ${SALARY_POLICY.tiers.map(t => `
              <tr>
                <td><strong>${t.emoji} ${t.label}</strong></td>
                <td>${t.min}% – ${t.max === 200 ? '≥100%' : t.max + '%'}</td>
                <td>${t.baseMult < 1 ? `×${t.baseMult} (${Math.round(t.baseMult*100)}%)` : '100%'}</td>
                <td>${t.bonusMult === 0 ? '—' : t.bonusMult === 1 ? '100%' : (Math.round(t.bonusMult*100) + '%')}</td>
                <td style="font-size:11px;color:var(--c-text-3)">${t.note}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="policy-card">
        <div class="policy-section-title">🎁 Thưởng đặc biệt</div>
        ${SALARY_POLICY.specialBonuses.map(b => `
          <div class="policy-info-row">
            <span>${b.label}</span>
            <strong style="color:#10B981">+${fmtVND(b.amount)}</strong>
          </div>
        `).join('')}
      </div>

      <div class="policy-card">
        <div class="policy-section-title">📌 Quy định chung</div>
        <ul style="font-size:13px;color:var(--c-text-2);line-height:2;padding-left:18px">
          <li>KPI được Admin/Quản trị nhập và phê duyệt vào đầu tháng tiếp theo</li>
          <li>Thưởng CVC: mỗi CVC hoàn thành vượt target (>10 CVC) được thưởng thêm</li>
          <li>Phụ cấp theo từng cá nhân, do Admin cấu hình riêng</li>
          <li>Chấm công không tự động khấu trừ lương — Admin xem xét và điều chỉnh thủ công nếu cần</li>
          <li>Nhân viên chỉ xem được phiếu lương của chính mình</li>
          <li>Thuế TNCN tạm tính 5% cho thu nhập trên 11 triệu/tháng</li>
        </ul>
      </div>
    </div>
  `;
}

// ============ ĐỔI MẬT KHẨU ============
function openChangePasswordModal(targetUserId) {
  const isAdmin  = currentUser?.role === 'admin';
  const isSelf   = !targetUserId || targetUserId === currentUser?.id;
  if (!isAdmin && !isSelf) { showToast('⚠️ Không có quyền!', 'error'); return; }

  const uid  = targetUserId || currentUser?.id;
  const name = TEAM_MEMBERS.find(m => m.id === uid)?.name || 'Tài khoản';

  document.getElementById('changePassModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'changePassModal';
  modal.className = 'modal-overlay';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
  modal.innerHTML = `
    <div class="modal-box" style="max-width:420px">
      <div class="modal-header">
        <h3>🔑 Đổi mật khẩu — ${escHtml(name)}</h3>
        <button class="modal-close" onclick="document.getElementById('changePassModal').remove()">✕</button>
      </div>
      <div class="modal-body">
        ${isSelf && !isAdmin ? `
        <div class="form-group">
          <label>Mật khẩu hiện tại</label>
          <div class="input-with-icon">
            <input type="password" class="form-input" id="cpCurrentPass" placeholder="Nhập mật khẩu cũ">
            <button type="button" class="toggle-pass" onclick="togglePassField('cpCurrentPass')" title="Hiện/ẩn">👁</button>
          </div>
        </div>` : `<div class="info-banner">🔐 Admin có thể đặt lại mật khẩu trực tiếp không cần xác nhận</div>`}
        <div class="form-group">
          <label>Mật khẩu mới</label>
          <div class="input-with-icon">
            <input type="password" class="form-input" id="cpNewPass" placeholder="Tối thiểu 6 ký tự">
            <button type="button" class="toggle-pass" onclick="togglePassField('cpNewPass')" title="Hiện/ẩn">👁</button>
          </div>
        </div>
        <div class="form-group">
          <label>Xác nhận mật khẩu mới</label>
          <div class="input-with-icon">
            <input type="password" class="form-input" id="cpConfirmPass" placeholder="Nhập lại mật khẩu mới">
            <button type="button" class="toggle-pass" onclick="togglePassField('cpConfirmPass')" title="Hiện/ẩn">👁</button>
          </div>
        </div>
        <div id="cpError" style="color:#EF4444;font-size:12px;margin-top:6px"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-cancel" onclick="document.getElementById('changePassModal').remove()">✕ Hủy</button>
        <button class="btn btn-save" onclick="saveChangePassword('${uid}','${isSelf && !isAdmin}')">💾 Đổi mật khẩu</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function saveChangePassword(userId, requireOld) {
  const errEl    = document.getElementById('cpError');
  const newPass  = document.getElementById('cpNewPass')?.value || '';
  const confirm  = document.getElementById('cpConfirmPass')?.value || '';

  if (requireOld === 'true' || requireOld === true) {
    const currentPass = document.getElementById('cpCurrentPass')?.value || '';
    const entry = Object.values(DEMO_USERS).find(u => u.id === userId);
    if (!entry || entry.password !== currentPass) {
      errEl.textContent = '❌ Mật khẩu hiện tại không đúng!'; return;
    }
  }
  if (newPass.length < 6) { errEl.textContent = '❌ Mật khẩu mới phải từ 6 ký tự!'; return; }
  if (newPass !== confirm) { errEl.textContent = '❌ Xác nhận mật khẩu không khớp!'; return; }

  // Cập nhật DEMO_USERS
  const entry = Object.entries(DEMO_USERS).find(([,u]) => u.id === userId);
  if (entry) {
    DEMO_USERS[entry[0]].password = newPass;
    // Sync Firebase
    if (window.fbSaveUser) {
      try { await window.fbSaveUser({ ...DEMO_USERS[entry[0]], email: entry[0] }); } catch(e) {}
    }
  }

  // Nếu đổi pass chính mình → cập nhật session
  if (userId === currentUser?.id && currentUser) {
    currentUser.password = newPass;
    sessionStorage.setItem('vw_user', JSON.stringify(currentUser));
  }

  document.getElementById('changePassModal')?.remove();
  showToast('✅ Đổi mật khẩu thành công!', 'success');
}
