/* ================================================
   VIWORK Sprint 1 — Request Module
   Số hóa đề xuất & phê duyệt nội bộ Vimove
   ================================================ */

// ============ REQUEST TYPES ============
// Ngân (admin) phê duyệt MỌI loại đề xuất
const REQUEST_TYPES = {
  budget:  { id:'budget',  name:'Duyệt ngân sách',   icon:'💰', iconClass:'req-icon-budget',  slaH:4,  approvers:['admin'] },
  order:   { id:'order',   name:'Đặt hàng/Nhập kho', icon:'📦', iconClass:'req-icon-order',   slaH:24, approvers:['admin'] },
  hr:      { id:'hr',      name:'Nhân sự',            icon:'👤', iconClass:'req-icon-hr',      slaH:48, approvers:['admin'] },
  kpi:     { id:'kpi',     name:'Đăng ký KPI',        icon:'🎯', iconClass:'req-icon-kpi',     slaH:24, approvers:['admin'] },
  leave:   { id:'leave',   name:'Xin nghỉ phép',      icon:'🏖️', iconClass:'req-icon-leave',   slaH:4,  approvers:['admin'] },
};

// ============ INITIAL REQUESTS (Demo data — v2.2) ============
const INITIAL_REQUESTS = [
  {
    id: 'req001',
    type: 'budget',
    title: 'Ngân sách Facebook Ads tháng 5 — 50 triệu',
    desc: 'Xin phê duyệt ngân sách 50 triệu cho chiến dịch Facebook Ads ra mắt sản phẩm Vimove tháng 5/2026.',
    amount: 50,
    requesterId: 'u003',   // Trang gửi
    status: 'pending',
    createdAt: getPastDate(1),
    slaDeadline: getFutureDate(0),
    approvalSteps: [
      { role:'admin', approverId:'u002', status:'pending', note:'', at: null },  // Ngân duyệt
    ],
    comments: [],
  },
  {
    id: 'req002',
    type: 'leave',
    title: 'Nghỉ phép 2 ngày 15-16/5/2026',
    desc: 'Xin nghỉ phép 2 ngày để giải quyết việc gia đình.',
    requesterId: 'u005',   // Phương gửi
    status: 'approved',
    createdAt: getPastDate(3),
    slaDeadline: getPastDate(2),
    approvalSteps: [
      { role:'admin', approverId:'u002', status:'approved', note:'Đồng ý, nhớ bàn giao công việc.', at: getPastDate(2) },
    ],
    comments: [],
  },
  {
    id: 'req003',
    type: 'order',
    title: 'Đặt hàng vật tư setup phòng live — 15 triệu',
    desc: 'Cần mua thêm ring light, mic, màn hình phụ cho phòng livestream.',
    amount: 15,
    requesterId: 'u001',   // Tuyền gửi
    status: 'pending',
    createdAt: getPastDate(2),
    slaDeadline: getFutureDate(1),
    approvalSteps: [
      { role:'admin', approverId:'u002', status:'pending', note:'', at: null },  // Ngân duyệt
    ],
    comments: [],
  },
  {
    id: 'req004',
    type: 'hr',
    title: 'Tuyển thêm 1 nhân viên Livestream',
    desc: 'Cần tuyển thêm 1 MC/Host Livestream để đảm bảo lịch phát sóng hàng ngày trong tháng 5.',
    requesterId: 'u003',   // Trang gửi
    status: 'pending',
    createdAt: getPastDate(1),
    slaDeadline: getFutureDate(2),
    approvalSteps: [
      { role:'admin', approverId:'u002', status:'pending', note:'', at: null },  // Ngân duyệt
    ],
    comments: [],
  },
  {
    id: 'req005',
    type: 'budget',
    title: 'Ngân sách Shopee Ads tháng 5 — 100 triệu',
    desc: 'Xin phê duyệt ngân sách Shopee Ads (search + discovery) theo kế hoạch TNA.',
    amount: 100,
    requesterId: 'u001',   // Tuyền gửi
    status: 'approved',
    createdAt: getPastDate(5),
    slaDeadline: getPastDate(4),
    approvalSteps: [
      { role:'admin', approverId:'u002', status:'approved', note:'Duyệt theo kế hoạch TNA GĐ1.', at: getPastDate(4) },
    ],
    comments: [],
  },
];

// ============ STATE ============
let requestState = {
  requests: [],
  activeTab: 'inbox',
  selectedType: null,
  currentRequestId: null,
};

// ============ INIT ============
function initRequests() {
  const saved = localStorage.getItem('viwork_requests');
  if (saved) {
    try { requestState.requests = JSON.parse(saved); }
    catch(e) { requestState.requests = [...INITIAL_REQUESTS]; }
  } else {
    requestState.requests = [...INITIAL_REQUESTS];
  }
}

function saveRequests() {
  // Lược bỏ localStorage vì đã đẩy bằng API riêng rẻ lên Firebase
}

// ============ RENDER REQUEST PAGE ============
function renderRequests() {
  const page = document.getElementById('page-requests');
  if (!page) return;

  const inbox  = getPendingForMe();
  const sent   = requestState.requests.filter(r => r.requesterId === currentUser?.id);
  const all    = requestState.requests;

  page.innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-h1">📋 Đề xuất & Phê duyệt</h1>
        <p class="page-sub">Số hóa quy trình phê duyệt nội bộ — không cần qua Zalo</p>
      </div>
      <div class="page-actions">
        <button class="btn-primary" onclick="openNewRequestModal()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Tạo đề xuất
        </button>
      </div>
    </div>

    <div class="request-page-grid">
      <!-- Sidebar tabs -->
      <div class="request-sidebar">
        <div class="req-sidebar-title">Loại đề xuất</div>
        <button class="req-tab ${requestState.activeTab==='inbox'?'active':''}" onclick="setReqTab('inbox')">
          <span class="req-tab-icon">📥</span>
          <span class="req-tab-label">Cần tôi duyệt</span>
          <span class="req-tab-cnt">${inbox.length||''}</span>
        </button>
        <button class="req-tab ${requestState.activeTab==='sent'?'active':''}" onclick="setReqTab('sent')">
          <span class="req-tab-icon">📤</span>
          <span class="req-tab-label">Tôi đã gửi</span>
          <span class="req-tab-cnt">${sent.length||''}</span>
        </button>
        ${isAdmin() ? `
          <button class="req-tab ${requestState.activeTab==='all'?'active':''}" onclick="setReqTab('all')">
            <span class="req-tab-icon">📊</span>
            <span class="req-tab-label">Tất cả</span>
            <span class="req-tab-cnt">${all.length||''}</span>
          </button>
        ` : ''}
        <div style="height:1px;background:var(--c-border-subtle);margin:8px 0"></div>
        <div class="req-sidebar-title" style="margin-top:4px">Theo loại</div>
        ${Object.values(REQUEST_TYPES).map(t => {
          const cnt = requestState.requests.filter(r => r.type === t.id && r.status === 'pending').length;
          return `
            <button class="req-tab ${requestState.activeTab==='type_'+t.id?'active':''}" onclick="setReqTab('type_${t.id}')">
              <span class="req-tab-icon">${t.icon}</span>
              <span class="req-tab-label">${t.name}</span>
              <span class="req-tab-cnt">${cnt||''}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- Main content -->
      <div class="request-main">
        <div class="request-list" id="requestList">
          <!-- Rendered by JS -->
        </div>
      </div>
    </div>
  `;

  renderRequestList();
}

function setReqTab(tab) {
  requestState.activeTab = tab;
  // Re-render just the tabs and list for performance
  renderRequests();
}

function getPendingForMe() {
  return requestState.requests.filter(r => {
    if (r.status !== 'pending') return false;
    const nextStep = r.approvalSteps?.find(s => s.status === 'pending');
    if (!nextStep) return false;
    return nextStep.role === currentUser?.role;
  });
}

function renderRequestList() {
  const list = document.getElementById('requestList');
  if (!list) return;

  let items = [];
  const tab = requestState.activeTab;

  if (tab === 'inbox')  items = getPendingForMe();
  else if (tab === 'sent') items = requestState.requests.filter(r => r.requesterId === currentUser?.id);
  else if (tab === 'all') items = requestState.requests;
  else if (tab.startsWith('type_')) {
    const typeId = tab.replace('type_', '');
    items = requestState.requests.filter(r => r.type === typeId);
  }

  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state" style="padding:60px 20px">
        <div class="empty-icon">📭</div>
        <p>Không có đề xuất nào trong mục này.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(r => renderRequestCard(r)).join('');
}

function renderRequestCard(req) {
  const type      = REQUEST_TYPES[req.type] || {};
  const requester = getUserById(req.requesterId);
  const isOverSLA = req.slaDeadline && req.status === 'pending' && new Date(req.slaDeadline) < new Date();
  const statusMap = {
    pending:  '<span class="req-status req-status-pending">⏳ Chờ duyệt</span>',
    approved: '<span class="req-status req-status-approved">✅ Đã duyệt</span>',
    rejected: '<span class="req-status req-status-rejected">❌ Từ chối</span>',
    draft:    '<span class="req-status req-status-draft">📝 Nháp</span>',
  };

  return `
    <div class="request-card" onclick="openRequestDetail('${req.id}')">
      <div class="req-type-icon ${type.iconClass}">${type.icon}</div>
      <div class="req-card-content">
        <div class="req-card-title">${escHtml(req.title)}</div>
        <div class="req-card-meta">
          <span>👤 ${requester.name}</span>
          <span>·</span>
          <span>📅 ${formatDate(req.createdAt)}</span>
          ${req.amount ? `<span>·</span><span>💰 ${req.amount} triệu</span>` : ''}
        </div>
      </div>
      <div class="req-card-right">
        ${statusMap[req.status] || ''}
        ${isOverSLA
          ? '<span class="req-sla-badge overdue">⚠️ Quá hạn SLA</span>'
          : req.slaDeadline && req.status === 'pending'
            ? `<span class="req-sla-badge">⏱ Cần duyệt ${formatDateRelative(req.slaDeadline)}</span>`
            : ''
        }
      </div>
    </div>
  `;
}

// ============ REQUEST DETAIL ============
function openRequestDetail(reqId) {
  requestState.currentRequestId = reqId;
  const req = requestState.requests.find(r => r.id === reqId);
  if (!req) return;

  const type      = REQUEST_TYPES[req.type] || {};
  const requester = getUserById(req.requesterId);
  const canApprove = canApproveRequest(req);

  const modal = document.getElementById('requestDetailModal');
  if (!modal) return;

  modal.querySelector('.modal-header h2').textContent = `${type.icon} ${req.title}`;

  const body = modal.querySelector('.modal-body');
  body.innerHTML = `
    <div class="req-detail-body">
      <div class="req-detail-main">
        <!-- Info -->
        <div class="detail-info-card">
          <div class="info-row"><span>Loại đề xuất:</span><span>${type.icon} ${type.name}</span></div>
          <div class="info-row"><span>Người gửi:</span><span><div class="assignee-badge" style="display:inline-flex"><div class="avatar-sm">${requester.avatar}</div>${requester.name}</div></span></div>
          <div class="info-row"><span>Ngày gửi:</span><span>${formatDate(req.createdAt)}</span></div>
          ${req.amount ? `<div class="info-row"><span>Số tiền:</span><span style="color:#10B981;font-weight:700">${req.amount.toLocaleString('vi-VN')} triệu đồng</span></div>` : ''}
          <div class="info-row"><span>SLA deadline:</span><span class="${new Date(req.slaDeadline)<new Date()&&req.status==='pending'?'deadline-overdue':''}">${req.slaDeadline?formatDate(req.slaDeadline):'—'}</span></div>
        </div>

        <!-- Description -->
        <div class="detail-desc">${escHtml(req.desc || 'Không có mô tả thêm.')}</div>

        <!-- Approval Chain -->
        <div>
          <h4 style="font-size:13px;font-weight:600;color:var(--c-text-2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">🔗 Luồng phê duyệt</h4>
          <div class="req-approval-chain">
            ${renderApprovalChain(req)}
          </div>
        </div>

        <!-- Comments -->
        <div class="detail-comments">
          <h4>💬 Ghi chú</h4>
          <div id="req-comments-${req.id}">
            ${(req.comments||[]).length === 0
              ? '<div style="font-size:12px;color:var(--c-text-3);text-align:center;padding:10px">Chưa có ghi chú.</div>'
              : (req.comments||[]).map(c => {
                  const u = getUserById(c.author);
                  return `<div class="comment-item"><div class="comment-meta">📝 <strong>${u.name}</strong> · ${formatDate(c.date)}</div><div>${escHtml(c.text)}</div></div>`;
                }).join('')
            }
          </div>
          <div class="comment-input" style="margin-top:10px">
            <textarea id="req-comment-input" rows="2" placeholder="Thêm ghi chú..."></textarea>
            <button class="btn-primary sm" onclick="addRequestComment('${req.id}')">Gửi</button>
          </div>
        </div>
      </div>

      <!-- Sidebar actions -->
      <div class="detail-sidebar">
        ${canApprove ? `
          <div class="req-action-block">
            <h4>Hành động</h4>
            <button class="btn-primary" style="width:100%;margin-bottom:8px;justify-content:center" onclick="approveRequest('${req.id}')">
              ✅ Phê duyệt
            </button>
            <textarea class="req-reject-note" id="reject-note-${req.id}" rows="2" placeholder="Lý do từ chối (tùy chọn)..."></textarea>
            <button class="btn-danger" style="width:100%;justify-content:center" onclick="rejectRequest('${req.id}')">
              ❌ Từ chối
            </button>
          </div>
        ` : `
          <div class="req-action-block">
            <h4>Trạng thái</h4>
            <div style="font-size:13px;color:var(--c-text-2)">
              ${req.status === 'pending' ? '⏳ Đang chờ phê duyệt...' :
                req.status === 'approved' ? '✅ Đã được phê duyệt' :
                '❌ Đã bị từ chối'}
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function renderApprovalChain(req) {
  return req.approvalSteps.map((step, i) => {
    const approver = step.approverId ? getUserById(step.approverId) : null;
    const roleLabel = step.role === 'admin' ? '👑 Quản trị viên' : step.role === 'manager' ? '🎯 Quản lý' : '👤 Nhân viên';
    const statusIcon = { approved:'✅', rejected:'❌', pending:'⏳' }[step.status] || '⏳';
    const statusClass = step.status === 'pending' && i === req.approvalSteps.findIndex(s=>s.status==='pending') ? 'active' : step.status;

    return `
      <div class="approval-step ${statusClass}">
        <span class="approval-step-icon">${statusIcon}</span>
        <div class="approval-step-info">
          <div class="approval-step-name">Bước ${i+1}: ${roleLabel}</div>
          <div class="approval-step-status">
            ${approver ? `${approver.name}` : 'Chờ người duyệt'}
            ${step.note ? ` · "${escHtml(step.note)}"` : ''}
          </div>
        </div>
        ${step.at ? `<span class="approval-step-time">${formatDate(step.at)}</span>` : ''}
      </div>
    `;
  }).join('');
}

function canApproveRequest(req) {
  if (req.status !== 'pending') return false;
  const nextStep = req.approvalSteps?.find(s => s.status === 'pending');
  if (!nextStep) return false;
  return nextStep.role === currentUser?.role;
}

function approveRequest(reqId) {
  const req = requestState.requests.find(r => r.id === reqId);
  if (!req) return;
  const stepIdx = req.approvalSteps.findIndex(s => s.status === 'pending');
  if (stepIdx < 0) return;

  req.approvalSteps[stepIdx].status     = 'approved';
  req.approvalSteps[stepIdx].approverId = currentUser?.id;
  req.approvalSteps[stepIdx].at         = new Date().toISOString().split('T')[0];

  // Check if all steps approved
  const allDone = req.approvalSteps.every(s => s.status === 'approved');
  if (allDone) req.status = 'approved';

  if (window.fbSaveRequest) window.fbSaveRequest(req);
  saveRequests();
  closeModal('requestDetailModal');
  renderRequests();
  updateRequestBadge();
  showToast(`✅ Đã phê duyệt: "${req.title}"`, 'success');
}

function rejectRequest(reqId) {
  const req  = requestState.requests.find(r => r.id === reqId);
  if (!req) return;
  const note = document.getElementById('reject-note-' + reqId)?.value.trim() || '';
  const step = req.approvalSteps.find(s => s.status === 'pending');
  if (!step) return;

  step.status     = 'rejected';
  step.approverId = currentUser?.id;
  step.note       = note;
  step.at         = new Date().toISOString().split('T')[0];
  req.status      = 'rejected';

  if (window.fbSaveRequest) window.fbSaveRequest(req);
  saveRequests();
  closeModal('requestDetailModal');
  renderRequests();
  updateRequestBadge();
  showToast(`❌ Đã từ chối: "${req.title}"`, 'info');
}

function addRequestComment(reqId) {
  const text = document.getElementById('req-comment-input')?.value.trim();
  if (!text) return;
  const req = requestState.requests.find(r => r.id === reqId);
  if (!req) return;
  req.comments = req.comments || [];
  req.comments.push({ author: currentUser?.id, text, date: new Date().toISOString().split('T')[0] });
  document.getElementById('req-comment-input').value = '';
  if (window.fbSaveRequest) window.fbSaveRequest(req);
  saveRequests();
  const commEl = document.getElementById('req-comments-' + reqId);
  if (commEl) {
    commEl.innerHTML = req.comments.map(c => {
      const u = getUserById(c.author);
      return `<div class="comment-item"><div class="comment-meta">📝 <strong>${u.name}</strong> · ${formatDate(c.date)}</div><div>${escHtml(c.text)}</div></div>`;
    }).join('');
  }
}

// ============ NEW REQUEST MODAL ============
function openNewRequestModal() {
  requestState.selectedType = null;
  const modal = document.getElementById('newRequestModal');
  if (!modal) return;
  // Reset form
  const title = modal.querySelector('#reqTitle');
  const desc = modal.querySelector('#reqDesc');
  const amt = modal.querySelector('#reqAmount');
  if (title) title.value = '';
  if (desc) desc.value = '';
  if (amt) amt.value = '';
  document.querySelectorAll('.req-type-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('reqDynamicFields').innerHTML = '';
  modal.classList.remove('hidden');
}

function selectReqType(typeId) {
  requestState.selectedType = typeId;
  document.querySelectorAll('.req-type-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.type === typeId);
  });
  const fieldsEl = document.getElementById('reqDynamicFields');
  const type = REQUEST_TYPES[typeId];
  if (!fieldsEl || !type) return;

  let extra = '';
  if (typeId === 'budget' || typeId === 'order') {
    extra = `
      <div class="form-group">
        <label>Số tiền (triệu đồng) <span class="req">*</span></label>
        <input type="number" id="reqAmount" placeholder="VD: 50" min="0" class="settings-input" />
      </div>
    `;
  }
  if (typeId === 'leave') {
    extra = `
      <div class="form-grid-2">
        <div class="form-group"><label>Ngày bắt đầu</label><input type="date" id="reqDateFrom" class="settings-input"/></div>
        <div class="form-group"><label>Ngày kết thúc</label><input type="date" id="reqDateTo" class="settings-input"/></div>
      </div>
    `;
  }
  fieldsEl.innerHTML = extra;
}

function saveNewRequest() {
  const title = document.getElementById('reqTitle')?.value.trim();
  const desc  = document.getElementById('reqDesc')?.value.trim();
  const type  = requestState.selectedType;

  if (!title) { showToast('⚠️ Vui lòng nhập tiêu đề đề xuất!', 'error'); return; }
  if (!type)  { showToast('⚠️ Vui lòng chọn loại đề xuất!', 'error'); return; }

  const typeConfig = REQUEST_TYPES[type];
  const slaH      = typeConfig.slaH;
  const slaDate   = new Date(Date.now() + slaH * 3600000);

  const req = {
    id:          generateId('req'),
    type,
    title,
    desc,
    amount:      parseFloat(document.getElementById('reqAmount')?.value) || null,
    requesterId: currentUser?.id,
    status:      'pending',
    createdAt:   new Date().toISOString().split('T')[0],
    slaDeadline: slaDate.toISOString().split('T')[0],
    approvalSteps: typeConfig.approvers.map(role => ({
      role, approverId: null, status: 'pending', note: '', at: null
    })),
    comments: [],
  };

  requestState.requests.push(req);
  if (window.fbSaveRequest) window.fbSaveRequest(req);
  saveRequests();
  closeModal('newRequestModal');
  renderRequests();
  updateRequestBadge();
  showToast(`🎉 Đề xuất "${title}" đã được gửi!`, 'success');
}

// ============ BADGE UPDATE ============
function updateRequestBadge() {
  const pending = getPendingForMe().length;
  const badge = document.getElementById('badge-requests');
  if (badge) badge.textContent = pending || '';
}
