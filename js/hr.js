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

/**
 * Tính thuế TNCN theo biểu lũy tiến 7 bậc (Luật Thuế TNCN VN hiện hành)
 * Thu nhập tính thuế = Gross - Giảm trừ bản thân (11tr) - BH cá nhân
 * @param {number} grossIncome - Thu nhập gộp (VND)
 * @param {number} dependents - Số người phụ thuộc (mặc định 0)
 * @param {number} socialInsurance - BHXH + BHYT + BHTN cá nhân đóng
 * @returns {number} Số thuế phải nộp
 */
function calcPIT(grossIncome, dependents = 0, socialInsurance = 0) {
  const PERSONAL_DEDUCTION    = 11_000_000; // 11 triệu/tháng
  const DEPENDENT_DEDUCTION   = 4_400_000;  // 4.4 triệu/người phụ thuộc/tháng

  // Thu nhập tính thuế
  const taxableIncome = Math.max(
    0,
    grossIncome - PERSONAL_DEDUCTION - (dependents * DEPENDENT_DEDUCTION) - socialInsurance
  );

  if (taxableIncome <= 0) return 0;

  // Biểu lũy tiến 7 bậc (theo Nghị quyết 954/2020/UBTVQH14)
  const TAX_BRACKETS = [
    { max: 5_000_000,   rate: 0.05, prev: 0 },           // Bậc 1: ≤5tr → 5%
    { max: 10_000_000,  rate: 0.10, prev: 250_000 },      // Bậc 2: 5-10tr → 10%
    { max: 18_000_000,  rate: 0.15, prev: 750_000 },      // Bậc 3: 10-18tr → 15%
    { max: 32_000_000,  rate: 0.20, prev: 1_950_000 },    // Bậc 4: 18-32tr → 20%
    { max: 52_000_000,  rate: 0.25, prev: 4_750_000 },    // Bậc 5: 32-52tr → 25%
    { max: 80_000_000,  rate: 0.30, prev: 9_750_000 },    // Bậc 6: 52-80tr → 30%
    { max: Infinity,    rate: 0.35, prev: 18_150_000 },   // Bậc 7: >80tr → 35%
  ];

  // Tìm bậc thuế
  const bracket = TAX_BRACKETS.find(b => taxableIncome <= b.max);
  if (!bracket) return 0;

  // Tính thuế lũy tiến: thuế bậc trước + phần vượt × thuế suất bậc hiện tại
  const bracketIndex = TAX_BRACKETS.indexOf(bracket);
  const prevMax = bracketIndex > 0 ? TAX_BRACKETS[bracketIndex - 1].max : 0;
  const tax = bracket.prev + (taxableIncome - prevMax) * bracket.rate;

  return Math.round(tax);
}

/**
 * Tính BHXH, BHYT, BHTN phần nhân viên đóng (theo tỷ lệ hiện hành)
 * @param {number} baseSalary - Lương cơ bản (tối đa 36tr để tính BH)
 * @returns {{ bhxh, bhyt, bhtn, total }}
 */
function calcSocialInsurance(baseSalary) {
  // Mức lương tối đa đóng BH = 20 × lương cơ sở (2.34tr) = 46.8tr
  // Nhưng thực tế thường giới hạn ở mức lương hợp đồng, tối đa 36tr để đơn giản
  const base = Math.min(baseSalary, 36_000_000);
  const bhxh = Math.round(base * 0.08);   // 8% BHXH
  const bhyt = Math.round(base * 0.015);  // 1.5% BHYT
  const bhtn = Math.round(base * 0.01);   // 1% BHTN
  return { bhxh, bhyt, bhtn, total: bhxh + bhyt + bhtn };
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

  // Tính BHXH/BHYT/BHTN phần nhân viên (tính trên lương cứng cơ bản)
  const si = calcSocialInsurance(sal.base);

  // Tính thuế TNCN lũy tiến 7 bậc đúng luật VN
  // Phụ cấp ăn trưa được miễn thuế tối đa 730k/tháng theo quy định
  const lunchExempt = Math.min(allowance.lunch || 0, 730_000);
  const taxableGross = gross - lunchExempt; // Phụ cấp miễn thuế được trừ ra
  const dependents = member.dependents || 0; // Số người phụ thuộc (mặc định 0)
  const tax = calcPIT(taxableGross, dependents, si.total);

  const totalDeduction = tax + si.total;
  const net = gross - totalDeduction;

  return { userId, member, pos, yearMonth: `${y}-${String(m).padStart(2,'0')}`,
           basePaid, kpiBonus, excelBonus, cvcBonus, totalAllowance, allowance,
           gross, si, tax, totalDeduction, net, kpiPct, tier, kpi,
           doneTasks: doneTasks.length, cvcOver, dependents };
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

          ${(ps.tax > 0 || (ps.si && ps.si.total > 0)) ? `
          <div class="ps-group-title" style="color:#EF4444">💸 Khấu trừ</div>
          ${ps.si && ps.si.bhxh > 0 ? `<div class="ps-line"><span>BHXH (8%)</span><span class="ps-amount ps-red">−${fmtVND(ps.si.bhxh)}</span></div>` : ''}
          ${ps.si && ps.si.bhyt > 0 ? `<div class="ps-line"><span>BHYT (1.5%)</span><span class="ps-amount ps-red">−${fmtVND(ps.si.bhyt)}</span></div>` : ''}
          ${ps.si && ps.si.bhtn > 0 ? `<div class="ps-line"><span>BHTN (1%)</span><span class="ps-amount ps-red">−${fmtVND(ps.si.bhtn)}</span></div>` : ''}
          ${ps.tax > 0 ? `<div class="ps-line"><span>Thuế TNCN (lũy tiến 7 bậc)</span><span class="ps-amount ps-red">−${fmtVND(ps.tax)}</span></div>` : ''}
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
          <li>Thuế TNCN tính theo biểu lũy tiến 7 bậc (5%→35%) theo Luật Thuế TNCN VN</li>
          <li>BHXH 8% + BHYT 1.5% + BHTN 1% = 10.5% lương cứng (tối đa 36 triệu)</li>
          <li>Giảm trừ gia cảnh: 11 triệu/tháng bản thân + 4.4 triệu/người phụ thuộc</li>
        </ul>
      </div>
    </div>
  `;
}

// ============ ĐỔI MẬT KHẨU ============

// ============ CHANGE PASSWORD MODAL (REDESIGNED) ============
function openChangePasswordModal(targetUserId) {
  const isAdmin = currentUser?.role === 'admin';
  const isSelf  = !targetUserId || targetUserId === currentUser?.id;

  // Staff chỉ đổi được mật khẩu của chính mình
  if (!isSelf && !isAdmin) {
    showToast('⚠️ Bạn chỉ có thể đổi mật khẩu của chính mình!', 'error');
    return;
  }

  const uid    = targetUserId || currentUser?.id;
  const target = Object.values(DEMO_USERS).find(u => u.id === uid);
  const name   = target?.name || TEAM_MEMBERS.find(m => m.id === uid)?.name || 'Tài khoản';
  const needOld = isSelf; // Luôn yêu cầu mk cũ khi đổi cho chính mình

  document.getElementById('changePassModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'changePassModal';
  modal.className = 'modal-overlay';
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  modal.innerHTML = `
    <div class="cpw-modal-box" id="cpwBox">
      <!-- Header -->
      <div class="cpw-header">
        <div class="cpw-header-icon">🔑</div>
        <div class="cpw-header-info">
          <div class="cpw-title">Đổi mật khẩu</div>
          <div class="cpw-subtitle">${escHtml(name)}</div>
        </div>
        <button class="cpw-close-btn" onclick="document.getElementById('changePassModal').remove()" title="Đóng">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Body -->
      <div class="cpw-body">
        ${isAdmin && !isSelf ? `
        <div class="cpw-admin-banner">
          <span class="cpw-admin-icon">🛡️</span>
          <span>Bạn đang đặt lại mật khẩu với quyền Admin — không cần xác nhận mật khẩu cũ</span>
        </div>` : ''}

        ${needOld ? `
        <div class="cpw-field-group" id="cpwGroupOld">
          <label class="cpw-label">
            <span class="cpw-label-dot"></span>Mật khẩu hiện tại
          </label>
          <div class="cpw-input-wrap">
            <span class="cpw-input-icon">🔒</span>
            <input type="password" id="cpCurrentPass" class="cpw-input" placeholder="Nhập mật khẩu hiện tại" autocomplete="current-password" oninput="cpwClearError()">
            <button type="button" class="cpw-eye-btn" onclick="cpwToggle('cpCurrentPass',this)" tabindex="-1">
              <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>` : ''}

        <div class="cpw-field-group">
          <label class="cpw-label">
            <span class="cpw-label-dot"></span>Mật khẩu mới
          </label>
          <div class="cpw-input-wrap">
            <span class="cpw-input-icon">✨</span>
            <input type="password" id="cpNewPass" class="cpw-input" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password" oninput="cpwCheckStrength(this.value); cpwCheckMatch()">
            <button type="button" class="cpw-eye-btn" onclick="cpwToggle('cpNewPass',this)" tabindex="-1">
              <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <!-- Strength bar -->
          <div class="cpw-strength-wrap" id="cpwStrengthWrap" style="display:none">
            <div class="cpw-strength-bar">
              <div class="cpw-strength-fill" id="cpwStrengthFill"></div>
            </div>
            <span class="cpw-strength-label" id="cpwStrengthLabel"></span>
          </div>
        </div>

        <div class="cpw-field-group">
          <label class="cpw-label">
            <span class="cpw-label-dot"></span>Xác nhận mật khẩu mới
          </label>
          <div class="cpw-input-wrap" id="cpwConfirmWrap">
            <span class="cpw-input-icon">✅</span>
            <input type="password" id="cpConfirmPass" class="cpw-input" placeholder="Nhập lại mật khẩu mới" autocomplete="new-password" oninput="cpwCheckMatch()">
            <button type="button" class="cpw-eye-btn" onclick="cpwToggle('cpConfirmPass',this)" tabindex="-1">
              <svg class="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="cpw-match-hint" id="cpwMatchHint"></div>
        </div>

        <div class="cpw-error" id="cpError"></div>
      </div>

      <!-- Footer -->
      <div class="cpw-footer">
        <button class="cpw-btn-cancel" onclick="document.getElementById('changePassModal').remove()">Hủy</button>
        <button class="cpw-btn-save" id="cpwSaveBtn" onclick="saveChangePassword('${uid}','${needOld}')">
          <span class="cpw-save-icon">💾</span> Đổi mật khẩu
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
  requestAnimationFrame(() => {
    modal.querySelector('#cpwBox').classList.add('cpw-open');
    const firstInput = needOld
      ? modal.querySelector('#cpCurrentPass')
      : modal.querySelector('#cpNewPass');
    firstInput?.focus();
  });
}

// ---- Helpers for the redesigned modal ----
function cpwToggle(inputId, btn) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  // Swap eye icon
  btn.querySelector('.eye-icon').innerHTML = show
    ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22"/><circle cx="12" cy="12" r="3" style="opacity:0"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
}

function cpwCheckStrength(val) {
  const wrap = document.getElementById('cpwStrengthWrap');
  const fill = document.getElementById('cpwStrengthFill');
  const label = document.getElementById('cpwStrengthLabel');
  if (!wrap || !val) { if(wrap) wrap.style.display='none'; return; }
  wrap.style.display = 'flex';

  let score = 0;
  if (val.length >= 6)  score++;
  if (val.length >= 10) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;

  const levels = [
    { pct:'20%', color:'#EF4444', text:'Rất yếu' },
    { pct:'40%', color:'#F97316', text:'Yếu' },
    { pct:'60%', color:'#EAB308', text:'Trung bình' },
    { pct:'80%', color:'#22C55E', text:'Mạnh' },
    { pct:'100%',color:'#10B981', text:'Rất mạnh 💪' },
  ];
  const lv = levels[Math.min(score - 1, 4)] || levels[0];
  fill.style.width = lv.pct;
  fill.style.background = lv.color;
  label.textContent = lv.text;
  label.style.color = lv.color;
}

function cpwCheckMatch() {
  const np = document.getElementById('cpNewPass')?.value || '';
  const cp = document.getElementById('cpConfirmPass')?.value || '';
  const hint = document.getElementById('cpwMatchHint');
  const wrap = document.getElementById('cpwConfirmWrap');
  if (!hint || !cp) { if(hint) hint.textContent=''; return; }
  if (np === cp) {
    hint.innerHTML = '<span style="color:#22C55E">✅ Mật khẩu khớp</span>';
    wrap?.classList.remove('cpw-no-match');
    wrap?.classList.add('cpw-match');
  } else {
    hint.innerHTML = '<span style="color:#EF4444">❌ Mật khẩu chưa khớp</span>';
    wrap?.classList.add('cpw-no-match');
    wrap?.classList.remove('cpw-match');
  }
}

function cpwClearError() {
  const el = document.getElementById('cpError');
  if (el) el.textContent = '';
}

async function saveChangePassword(userId, requireOld) {
  const errEl   = document.getElementById('cpError');
  const saveBtn = document.getElementById('cpwSaveBtn');
  const newPass = document.getElementById('cpNewPass')?.value?.trim() || '';
  const confirm = document.getElementById('cpConfirmPass')?.value?.trim() || '';

  if (requireOld === 'true' || requireOld === true) {
    const currentPass = document.getElementById('cpCurrentPass')?.value || '';
    const entry = Object.values(DEMO_USERS).find(u => u.id === userId);
    if (!entry || entry.password !== currentPass) {
      if (errEl) errEl.textContent = '❌ Mật khẩu hiện tại không đúng!';
      document.getElementById('cpCurrentPass')?.focus();
      return;
    }
  }

  if (newPass.length < 6) {
    if (errEl) errEl.textContent = '❌ Mật khẩu mới phải có ít nhất 6 ký tự!';
    document.getElementById('cpNewPass')?.focus();
    return;
  }
  if (newPass !== confirm) {
    if (errEl) errEl.textContent = '❌ Xác nhận mật khẩu không khớp!';
    document.getElementById('cpConfirmPass')?.focus();
    return;
  }

  // Loading state
  if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '⏳ Đang lưu...'; }

  // Cập nhật DEMO_USERS
  const entry = Object.entries(DEMO_USERS).find(([, u]) => u.id === userId);
  if (entry) {
    DEMO_USERS[entry[0]].password = newPass;
    if (window.fbSaveUser) {
      try { await window.fbSaveUser({ ...DEMO_USERS[entry[0]], email: entry[0] }); } catch(e) {}
    }
  }

  // Cập nhật localStorage (viwork_users)
  try {
    const saved = JSON.parse(localStorage.getItem('viwork_users') || '[]');
    const idx = saved.findIndex(u => u.id === userId);
    if (idx > -1) { saved[idx].password = newPass; localStorage.setItem('viwork_users', JSON.stringify(saved)); }
  } catch(e) {}

  // Nếu đổi pass chính mình → cập nhật session
  if (userId === currentUser?.id && currentUser) {
    currentUser.password = newPass;
    const { password, ...safeUser } = currentUser;
    sessionStorage.setItem('vw_user', JSON.stringify(safeUser));
  }

  document.getElementById('changePassModal')?.remove();
  showToast('✅ Đổi mật khẩu thành công!', 'success');
}

// ========================================================
// QUẢN LÝ LƯƠNG & PHỤ CẤP (SETTINGS)
// ========================================================

// 1. Cấu hình Vị trí & Lương
window.openPositionSalaryModal = function() {
  document.getElementById('posSalModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'posSalModal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:900px;width:95vw;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>⚙️ Cấu hình Lương Cơ Bản & KPI (Theo vị trí)</h3>
        <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1;padding:0">
        <table class="report-table">
          <thead>
            <tr>
              <th style="width:25%">Vị trí</th>
              <th style="text-align:right">Lương cứng (VND)</th>
              <th style="text-align:right">Thưởng KPI tối đa (VND)</th>
              <th style="text-align:right">Thưởng CVC vượt (VND)</th>
            </tr>
          </thead>
          <tbody id="posSalTbody">
            ${POSITIONS.map(p => `
              <tr>
                <td style="font-weight:600">${p.name}</td>
                <td><input type="number" class="settings-input" style="text-align:right;width:100%" id="base_${p.id}" value="${p.salary?.base || 0}" /></td>
                <td><input type="number" class="settings-input" style="text-align:right;width:100%" id="kpiBonus_${p.id}" value="${p.salary?.kpiBonus || 0}" /></td>
                <td><input type="number" class="settings-input" style="text-align:right;width:100%" id="cvcBonus_${p.id}" value="${p.salary?.cvcBonus || 0}" /></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="modal-footer" style="padding:16px;border-top:1px solid var(--c-border);display:flex;justify-content:flex-end;gap:12px">
        <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
        <button class="btn-primary" onclick="savePositionSalarySettings()">💾 Lưu Cấu hình</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

window.savePositionSalarySettings = function() {
  const newPositions = [...POSITIONS];
  for (let p of newPositions) {
    const baseInput = document.getElementById(`base_${p.id}`);
    const kpiBonusInput = document.getElementById(`kpiBonus_${p.id}`);
    const cvcBonusInput = document.getElementById(`cvcBonus_${p.id}`);
    if (baseInput && kpiBonusInput && cvcBonusInput) {
      if (!p.salary) p.salary = {};
      p.salary.base = parseInt(baseInput.value) || 0;
      p.salary.kpiBonus = parseInt(kpiBonusInput.value) || 0;
      p.salary.cvcBonus = parseInt(cvcBonusInput.value) || 0;
    }
  }
  
  POSITIONS = newPositions;
  localStorage.setItem('viwork_hr_positions', JSON.stringify(POSITIONS));
  showToast('✅ Đã lưu cấu hình Lương vị trí', 'success');
  document.getElementById('posSalModal')?.remove();
}

// 2. Cấu hình Phụ cấp theo cá nhân
window.openAllowanceSettingsModal = function() {
  document.getElementById('allowanceModal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'allowanceModal';
  modal.className = 'modal-overlay';
  
  // Render danh sách user
  const trs = TEAM_MEMBERS.map(u => {
    const allow = USER_ALLOWANCES[u.id] || { lunch:0, transport:0, phone:0, housing:0, other:0, note:'' };
    return `
      <tr>
        <td>
          <div style="font-weight:600">${u.name}</div>
          <div style="font-size:12px;color:var(--c-text-3)">${u.role}</div>
        </td>
        <td><input type="number" class="settings-input" style="text-align:right" id="lunch_${u.id}" value="${allow.lunch||0}" /></td>
        <td><input type="number" class="settings-input" style="text-align:right" id="trans_${u.id}" value="${allow.transport||0}" /></td>
        <td><input type="number" class="settings-input" style="text-align:right" id="phone_${u.id}" value="${allow.phone||0}" /></td>
        <td><input type="number" class="settings-input" style="text-align:right" id="house_${u.id}" value="${allow.housing||0}" /></td>
        <td><input type="text" class="settings-input" id="note_${u.id}" value="${allow.note||''}" placeholder="Ghi chú..." /></td>
      </tr>
    `;
  }).join('');

  modal.innerHTML = `
    <div class="modal-box" style="max-width:1100px;width:95vw;max-height:90vh;display:flex;flex-direction:column">
      <div class="modal-header">
        <h3>🧧 Cấu hình Phụ cấp (Theo nhân viên)</h3>
        <button class="btn-icon" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="overflow-y:auto;flex:1;padding:0">
        <table class="report-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th style="text-align:right">Ăn trưa (VND)</th>
              <th style="text-align:right">Đi lại (VND)</th>
              <th style="text-align:right">Điện thoại (VND)</th>
              <th style="text-align:right">Nhà ở (VND)</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${trs}
          </tbody>
        </table>
      </div>
      <div class="modal-footer" style="padding:16px;border-top:1px solid var(--c-border);display:flex;justify-content:flex-end;gap:12px">
        <button class="btn-outline" onclick="this.closest('.modal-overlay').remove()">Hủy</button>
        <button class="btn-primary" onclick="saveAllowanceSettings()">💾 Lưu Phụ cấp</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

window.saveAllowanceSettings = function() {
  for (let u of TEAM_MEMBERS) {
    const lunchInput = document.getElementById(`lunch_${u.id}`);
    if (lunchInput) {
      USER_ALLOWANCES[u.id] = {
        lunch: parseInt(lunchInput.value) || 0,
        transport: parseInt(document.getElementById(`trans_${u.id}`).value) || 0,
        phone: parseInt(document.getElementById(`phone_${u.id}`).value) || 0,
        housing: parseInt(document.getElementById(`house_${u.id}`).value) || 0,
        other: 0,
        note: document.getElementById(`note_${u.id}`).value || ''
      };
    }
  }
  
  localStorage.setItem('viwork_hr_allowances', JSON.stringify(USER_ALLOWANCES));
  showToast('✅ Đã lưu cấu hình Phụ cấp', 'success');
  document.getElementById('allowanceModal')?.remove();
}

