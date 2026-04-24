/* ================================================
   VIWORK — CRM Module (v2.0 — Gap 3+4 Fixed)
   Customer pipeline: full profile, follow-up, contact history
   ================================================ */

function renderCRM() {
  const pipeline = document.getElementById('crmPipeline');
  if (!pipeline) return;
  pipeline.innerHTML = '';

  // Summary bar
  const totalLeads = appState.leads.length;
  const wonLeads   = appState.leads.filter(l => l.stage === 'won').length;
  const hotLeads   = appState.leads.filter(l => l.stage === 'closing').length;
  const overdueFollowup = appState.leads.filter(l => {
    if (!l.followUpDate || l.stage === 'won') return false;
    return new Date(l.followUpDate) < new Date();
  }).length;

  const summaryBar = document.createElement('div');
  summaryBar.className = 'crm-summary-bar';
  summaryBar.innerHTML = `
    <div class="crm-summary-item">
      <span class="crm-sum-val">${totalLeads}</span>
      <span class="crm-sum-lbl">Tổng KH</span>
    </div>
    <div class="crm-summary-item">
      <span class="crm-sum-val" style="color:#10B981">${wonLeads}</span>
      <span class="crm-sum-lbl">Đã chốt</span>
    </div>
    <div class="crm-summary-item">
      <span class="crm-sum-val" style="color:#8B5CF6">${hotLeads}</span>
      <span class="crm-sum-lbl">Sắp chốt</span>
    </div>
    <div class="crm-summary-item">
      <span class="crm-sum-val" style="color:${overdueFollowup > 0 ? '#EF4444' : '#94A3B8'}">${overdueFollowup}</span>
      <span class="crm-sum-lbl">Trễ follow-up</span>
    </div>
    ${wonLeads > 0 ? `
    <div class="crm-summary-item">
      <span class="crm-sum-val" style="color:#F59E0B">${Math.round((wonLeads/totalLeads)*100)}%</span>
      <span class="crm-sum-lbl">Tỉ lệ chốt</span>
    </div>` : ''}
  `;
  pipeline.appendChild(summaryBar);

  // Pipeline columns
  const pipelineWrap = document.createElement('div');
  pipelineWrap.className = 'crm-pipeline-cols';
  pipeline.appendChild(pipelineWrap);

  CRM_STAGES.forEach(stage => {
    const leads = appState.leads.filter(l => l.stage === stage.id);
    const totalValue = leads.reduce((s,l) => s + (l.dealValue || 0), 0);
    const col = document.createElement('div');
    col.className = 'crm-stage-col';
    col.innerHTML = `
      <div class="crm-stage-header">
        <div style="display:flex;align-items:center;gap:6px;">
          <div style="width:10px;height:10px;border-radius:50%;background:${stage.color};flex-shrink:0"></div>
          <span>${stage.name}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          ${totalValue > 0 ? `<span style="font-size:10px;color:var(--c-text-3)">${totalValue}tr</span>` : ''}
          <span class="crm-stage-cnt">${leads.length}</span>
        </div>
      </div>
      <div class="crm-lead-cards">
        ${leads.length === 0 ? '<div class="col-empty">Trống</div>' : leads.map(l => renderLeadCard(l)).join('')}
      </div>
    `;
    pipelineWrap.appendChild(col);
  });
}

function renderLeadCard(lead) {
  const chObj = CHANNELS[lead.channel] || {};
  const assignee = lead.assigneeId ? getUserById(lead.assigneeId) : null;
  const isFollowOverdue = lead.followUpDate && lead.stage !== 'won' && new Date(lead.followUpDate) < new Date();
  const followupClass = isFollowOverdue ? 'style="color:#EF4444;font-weight:600"' : 'style="color:var(--c-text-3)"';

  return `
    <div class="crm-card" onclick="showLeadDetail('${lead.id}')">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px">
        <div class="crm-card-name">${escHtml(lead.name)}</div>
        ${lead.tags && lead.tags.length ? `<span style="font-size:10px;background:rgba(90,184,0,0.1);color:#5AB800;padding:1px 5px;border-radius:4px;white-space:nowrap">${lead.tags[0]}</span>` : ''}
      </div>
      ${lead.product ? `<div style="font-size:12px;color:var(--c-text-2);margin-bottom:4px">📦 ${escHtml(lead.product)}</div>` : ''}
      <div class="crm-card-meta">
        <span class="crm-channel-dot ${chObj.cssClass}"></span>
        <span>${chObj.name || lead.channel}</span>
        ${lead.phone ? `<span>· ${lead.phone}</span>` : ''}
      </div>
      ${lead.dealValue ? `<div style="font-size:11px;color:#10B981;margin-top:4px">💰 ${lead.dealValue.toLocaleString('vi-VN')} triệu</div>` : ''}
      ${lead.followUpDate && lead.stage !== 'won' ? `<div style="font-size:11px;margin-top:4px" ${followupClass}>📅 Follow-up: ${formatDateRelative(lead.followUpDate)}${isFollowOverdue?' ⚠️':''}</div>` : ''}
      ${assignee ? `<div style="font-size:11px;color:var(--c-text-3);margin-top:4px">👤 ${assignee.name.split(' ').pop()}</div>` : ''}
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn-outline sm" onclick="event.stopPropagation();showLeadDetail('${lead.id}')">Chi tiết</button>
        ${canEdit() ? `
          <button class="btn-outline sm" onclick="event.stopPropagation();moveLeadStage('${lead.id}')">Tiến stage</button>
          <button class="btn-danger sm" onclick="event.stopPropagation();deleteLead('${lead.id}')">Xóa</button>
        ` : ''}
      </div>
    </div>
  `;
}

// ============ LEAD DETAIL MODAL ============
function showLeadDetail(leadId) {
  const lead = appState.leads.find(l => l.id === leadId);
  if (!lead) return;

  const stage   = CRM_STAGES.find(s => s.id === lead.stage) || {};
  const chObj   = CHANNELS[lead.channel] || {};
  const assignee = lead.assigneeId ? getUserById(lead.assigneeId) : null;
  const isFollowOverdue = lead.followUpDate && lead.stage !== 'won' && new Date(lead.followUpDate) < new Date();

  // Reuse requestDetailModal for CRM detail
  const modal = document.getElementById('requestDetailModal');
  if (!modal) return;
  modal.querySelector('.modal-header h2').textContent = `👤 ${lead.name}`;
  modal.querySelector('.modal-body').innerHTML = `
    <div class="req-detail-body">
      <div class="req-detail-main">

        <!-- Thông tin cơ bản -->
        <div class="detail-info-card">
          <div class="info-row"><span>Giai đoạn:</span><span style="color:${stage.color};font-weight:600">${stage.name || '—'}</span></div>
          <div class="info-row"><span>Kênh:</span><span><span class="crm-channel-dot ${chObj.cssClass}"></span> ${chObj.name || lead.channel}</span></div>
          ${lead.phone    ? `<div class="info-row"><span>SĐT:</span><span><a href="tel:${lead.phone}" style="color:var(--c-primary-light)">${lead.phone}</a></span></div>` : ''}
          ${lead.email    ? `<div class="info-row"><span>Email:</span><span><a href="mailto:${lead.email}" style="color:var(--c-primary-light)">${lead.email}</a></span></div>` : ''}
          ${lead.product  ? `<div class="info-row"><span>Sản phẩm:</span><span>${escHtml(lead.product)}</span></div>` : ''}
          ${lead.dealValue? `<div class="info-row"><span>Giá trị deal:</span><span style="color:#10B981;font-weight:700">${(lead.dealValue||0).toLocaleString('vi-VN')} triệu</span></div>` : ''}
          ${assignee      ? `<div class="info-row"><span>Phụ trách:</span><span><div class="assignee-badge" style="display:inline-flex"><div class="avatar-sm">${assignee.avatar}</div>${assignee.name}</div></span></div>` : ''}
          <div class="info-row">
            <span>Follow-up:</span>
            <span class="${isFollowOverdue ? 'deadline-overdue' : ''}">
              ${lead.followUpDate ? formatDate(lead.followUpDate) + (isFollowOverdue ? ' ⚠️ Trễ!' : '') : '—'}
            </span>
          </div>
          ${lead.tags && lead.tags.length ? `<div class="info-row"><span>Tags:</span><span>${lead.tags.map(t=>`<span style="background:rgba(90,184,0,0.1);color:#5AB800;padding:1px 6px;border-radius:4px;font-size:11px;margin-right:4px">${t}</span>`).join('')}</span></div>` : ''}
          ${lead.note     ? `<div class="info-row" style="flex-direction:column;align-items:flex-start;gap:4px"><span>Ghi chú:</span><span style="color:var(--c-text-2)">${escHtml(lead.note)}</span></div>` : ''}
        </div>

        <!-- Lịch sử liên hệ -->
        <div class="detail-comments">
          <h4>📞 Lịch sử liên hệ</h4>
          <div id="crm-history-${leadId}">
            ${(lead.contactHistory || []).length === 0
              ? '<div style="font-size:12px;color:var(--c-text-3);text-align:center;padding:10px">Chưa có lịch sử liên hệ.</div>'
              : (lead.contactHistory || []).slice().reverse().map(h => `
                <div class="comment-item">
                  <div class="comment-meta">📝 <strong>${getUserById(h.by).name}</strong> · ${formatDate(h.date)}</div>
                  <div>${escHtml(h.note)}</div>
                </div>`).join('')
            }
          </div>
          <div class="comment-input" style="margin-top:10px">
            <textarea id="crm-note-input-${leadId}" rows="2" placeholder="Ghi chú lần liên hệ này..."></textarea>
            <button class="btn-primary sm" onclick="addContactHistory('${leadId}')">Ghi nhận</button>
          </div>
        </div>

      </div>

      <!-- Sidebar actions -->
      <div class="detail-sidebar">
        ${canEdit() ? `
          <div class="req-action-block">
            <h4>Chuyển giai đoạn</h4>
            ${CRM_STAGES.filter(s => s.id !== lead.stage).map(s => `
              <button class="stage-action-btn" style="margin-bottom:6px" onclick="setLeadStage('${leadId}','${s.id}')">
                → ${s.name}
              </button>
            `).join('')}
          </div>
          <div class="req-action-block" style="margin-top:12px">
            <h4>Cập nhật follow-up</h4>
            <input type="date" id="followup-input-${leadId}" value="${lead.followUpDate || getFutureDate(3)}"
                   style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--c-border-subtle);background:var(--c-surface-2);color:var(--c-text-1);font-size:13px;margin-bottom:8px"/>
            <input type="number" id="dealvalue-input-${leadId}" value="${lead.dealValue || ''}" placeholder="Giá trị deal (triệu)"
                   style="width:100%;padding:8px;border-radius:6px;border:1px solid var(--c-border-subtle);background:var(--c-surface-2);color:var(--c-text-1);font-size:13px;margin-bottom:8px"/>
            <button class="btn-primary" style="width:100%;justify-content:center" onclick="updateLeadInfo('${leadId}')">
              💾 Lưu cập nhật
            </button>
          </div>
          <div class="req-action-block" style="margin-top:12px">
            <button class="btn-danger" style="width:100%;justify-content:center" onclick="deleteLead('${leadId}');closeModal('requestDetailModal')">
              🗑️ Xóa khách hàng
            </button>
          </div>
        ` : `<div class="req-action-block"><div style="font-size:13px;color:var(--c-text-2)">Bạn không có quyền chỉnh sửa.</div></div>`}
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
}

function addContactHistory(leadId) {
  const note = document.getElementById(`crm-note-input-${leadId}`)?.value.trim();
  if (!note) return;
  const lead = appState.leads.find(l => l.id === leadId);
  if (!lead) return;
  lead.contactHistory = lead.contactHistory || [];
  lead.contactHistory.push({ note, date: new Date().toISOString().split('T')[0], by: currentUser?.id });
  document.getElementById(`crm-note-input-${leadId}`).value = '';
  saveData();

  const histEl = document.getElementById(`crm-history-${leadId}`);
  if (histEl) {
    histEl.innerHTML = lead.contactHistory.slice().reverse().map(h => `
      <div class="comment-item">
        <div class="comment-meta">📝 <strong>${getUserById(h.by).name}</strong> · ${formatDate(h.date)}</div>
        <div>${escHtml(h.note)}</div>
      </div>`).join('');
  }
  showToast('✅ Đã ghi nhận lịch sử liên hệ!', 'success');
}

function updateLeadInfo(leadId) {
  const lead = appState.leads.find(l => l.id === leadId);
  if (!lead) return;
  const newFollowUp = document.getElementById(`followup-input-${leadId}`)?.value;
  const newDealVal  = parseFloat(document.getElementById(`dealvalue-input-${leadId}`)?.value) || 0;
  if (newFollowUp) lead.followUpDate = newFollowUp;
  lead.dealValue = newDealVal;
  saveData();
  closeModal('requestDetailModal');
  renderCRM();
  showToast(`✅ Đã cập nhật thông tin ${lead.name}`, 'success');
}

function setLeadStage(leadId, stageId) {
  const lead = appState.leads.find(l => l.id === leadId);
  if (!lead) return;
  const oldStage = CRM_STAGES.find(s => s.id === lead.stage)?.name || lead.stage;
  lead.stage = stageId;
  lead.contactHistory = lead.contactHistory || [];
  lead.contactHistory.push({
    note: `Chuyển giai đoạn: "${oldStage}" → "${CRM_STAGES.find(s=>s.id===stageId)?.name}"`,
    date: new Date().toISOString().split('T')[0],
    by: currentUser?.id
  });
  saveData();
  closeModal('requestDetailModal');
  renderCRM();
  showToast(`✅ Đã chuyển ${lead.name} sang ${CRM_STAGES.find(s=>s.id===stageId)?.name}`, 'success');
}

function openNewLeadModal() {
  document.getElementById('newLeadModal').classList.remove('hidden');
}

function saveNewLead() {
  const name = document.getElementById('leadName').value.trim();
  if (!name) { showToast('⚠️ Vui lòng nhập họ tên khách hàng!', 'error'); return; }

  const lead = {
    id:             generateId('l'),
    name,
    phone:          document.getElementById('leadPhone').value.trim(),
    email:          '',
    channel:        document.getElementById('leadChannel').value,
    product:        document.getElementById('leadProduct').value.trim(),
    note:           document.getElementById('leadNote').value.trim(),
    stage:          'new',
    date:           new Date().toISOString().split('T')[0],
    followUpDate:   getFutureDate(3),
    dealValue:      0,
    assigneeId:     currentUser?.id || null,
    contactHistory: [],
    tags:           [],
  };

  appState.leads.push(lead);
  saveData();

  ['leadName','leadPhone','leadProduct','leadNote'].forEach(id => document.getElementById(id).value = '');
  closeModal('newLeadModal');
  renderCRM();
  showToast(`✅ Đã thêm khách hàng "${name}"`, 'success');
}

function moveLeadStage(leadId) {
  const lead = appState.leads.find(l => l.id === leadId);
  if (!lead) return;
  const idx = CRM_STAGES.findIndex(s => s.id === lead.stage);
  if (idx < CRM_STAGES.length - 1) {
    setLeadStage(leadId, CRM_STAGES[idx + 1].id);
  } else {
    showToast('Khách hàng đã ở giai đoạn cuối!', 'info');
  }
}

function deleteLead(leadId) {
  if (!confirm('Xóa khách hàng này?')) return;
  appState.leads = appState.leads.filter(l => l.id !== leadId);
  saveData();
  renderCRM();
  showToast('🗑️ Đã xóa khách hàng', 'info');
}
