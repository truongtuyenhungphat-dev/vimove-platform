/* ================================================
   VIWORK — Assignments Module (Quản lý Giao việc)
   Giao việc ngắn hạn giữa Manager/Admin và Staff
   ================================================ */

// ============ STATE ============
const assignmentState = {
  currentTab: 'all',      // all | sent | received | pending
  currentFilter: {
    assignee: 'all',
    priority: 'all',
    status:   'all',
  },
  currentId: null,
};

// ============ STATUS CONFIG ============
const ASGN_STATUS = {
  pending:     { name: 'Chờ xác nhận', icon: '⏳', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
  accepted:    { name: 'Đã nhận',      icon: '👍', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)'   },
  in_progress: { name: 'Đang làm',     icon: '⚡', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)'  },
  done:        { name: 'Hoàn thành',   icon: '✅', color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
  rejected:    { name: 'Từ chối',      icon: '❌', color: '#EF4444', bg: 'rgba(239,68,68,0.15)'    },
};

// ============ INIT ============
function initAssignments() {
  // Đã được gọi từ initData() thông qua Firebase listener
}

// ============ RENDER MAIN PAGE ============
function renderAssignments() {
  const page = document.getElementById('page-assignments');
  if (!page) return;

  const all = appState.assignments || [];
  const uid = currentUser?.id;
  const role = currentUser?.role;

  // Phân loại assignments theo role
  let visible = [];
  if (role === 'admin') {
    visible = all;
  } else if (role === 'manager') {
    // Manager thấy: do mình giao + giao cho nhóm mình
    visible = all.filter(a =>
      a.assignedBy === uid ||
      a.assignedTo === uid ||
      isInMyTeam(a.assignedTo)
    );
  } else {
    // Staff chỉ thấy việc của mình
    visible = all.filter(a => a.assignedTo === uid || a.assignedBy === uid);
  }

  // Tab filter
  let filtered = [...visible];
  const tab = assignmentState.currentTab;
  if (tab === 'sent')     filtered = visible.filter(a => a.assignedBy === uid);
  if (tab === 'received') filtered = visible.filter(a => a.assignedTo === uid);
  if (tab === 'pending')  filtered = visible.filter(a => a.status === 'pending');

  // Additional filters
  const { assignee, priority, status } = assignmentState.currentFilter;
  if (assignee !== 'all') filtered = filtered.filter(a => a.assignedTo === assignee);
  if (priority !== 'all') filtered = filtered.filter(a => a.priority === priority);
  if (status !== 'all')   filtered = filtered.filter(a => a.status === status);

  // Stats
  const myCount = {
    pending:    all.filter(a => a.assignedTo === uid && a.status === 'pending').length,
    inProgress: all.filter(a => a.assignedTo === uid && a.status === 'in_progress').length,
    done:       all.filter(a => a.assignedTo === uid && a.status === 'done').length,
    sent:       all.filter(a => a.assignedBy === uid && a.status !== 'done').length,
  };

  const canCreate = role === 'admin' || role === 'manager';

  page.innerHTML = `
    <!-- HEADER -->
    <div class="page-header">
      <div>
        <h1 class="page-h1">📌 Quản lý Giao việc</h1>
        <p class="page-sub">Giao việc cụ thể và theo dõi tiến độ thực hiện theo thời gian thực</p>
      </div>
      <div class="page-actions">
        ${canCreate ? `<button class="btn-primary" id="btnNewAssignment" onclick="openNewAssignmentModal()">
          <svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Giao việc mới
        </button>` : ''}
      </div>
    </div>

    <!-- STATS STRIP -->
    <div class="asgn-stats-strip">
      <div class="asgn-stat-item">
        <div class="asgn-stat-val" style="color:#F59E0B">${myCount.pending}</div>
        <div class="asgn-stat-lbl">⏳ Chờ xác nhận</div>
      </div>
      <div class="asgn-stat-item">
        <div class="asgn-stat-val" style="color:#8B5CF6">${myCount.inProgress}</div>
        <div class="asgn-stat-lbl">⚡ Đang thực hiện</div>
      </div>
      <div class="asgn-stat-item">
        <div class="asgn-stat-val" style="color:#10B981">${myCount.done}</div>
        <div class="asgn-stat-lbl">✅ Hoàn thành</div>
      </div>
      ${canCreate ? `<div class="asgn-stat-item">
        <div class="asgn-stat-val" style="color:#3B82F6">${myCount.sent}</div>
        <div class="asgn-stat-lbl">📤 Đã giao (đang chờ)</div>
      </div>` : ''}
    </div>

    <!-- TABS + FILTERS -->
    <div class="asgn-toolbar">
      <div class="asgn-tabs">
        ${renderTabBtn('all',      '📋 Tất cả',       visible.length)}
        ${renderTabBtn('sent',     '📤 Đã giao',      visible.filter(a=>a.assignedBy===uid).length)}
        ${renderTabBtn('received', '📥 Nhận được',    visible.filter(a=>a.assignedTo===uid).length)}
        ${renderTabBtn('pending',  '⏳ Chờ xác nhận', visible.filter(a=>a.status==='pending').length)}
      </div>
      <div class="asgn-filters">
        ${canCreate ? `<select class="select-input" onchange="setAsgnFilter('assignee',this.value)" id="asgnFilterAssignee">
          <option value="all">👤 Tất cả người nhận</option>
          ${TEAM_MEMBERS.map(m=>`<option value="${m.id}" ${assignee===m.id?'selected':''}>${m.name.split(' ').slice(-2).join(' ')}</option>`).join('')}
        </select>` : ''}
        <select class="select-input" onchange="setAsgnFilter('priority',this.value)" id="asgnFilterPriority">
          <option value="all">⚡ Mọi ưu tiên</option>
          ${Object.entries(PRIORITIES).map(([k,v])=>`<option value="${k}" ${priority===k?'selected':''}>${v.icon} ${v.name}</option>`).join('')}
        </select>
        <select class="select-input" onchange="setAsgnFilter('status',this.value)" id="asgnFilterStatus">
          <option value="all">📊 Mọi trạng thái</option>
          ${Object.entries(ASGN_STATUS).map(([k,v])=>`<option value="${k}" ${status===k?'selected':''}>${v.icon} ${v.name}</option>`).join('')}
        </select>
      </div>
    </div>

    <!-- ASSIGNMENTS LIST -->
    <div class="asgn-list" id="asgnList">
      ${filtered.length === 0
        ? `<div class="asgn-empty">
            <div class="empty-icon">📭</div>
            <p>Không có giao việc nào.</p>
            ${canCreate ? `<button class="btn-primary" onclick="openNewAssignmentModal()">Giao việc đầu tiên →</button>` : ''}
          </div>`
        : filtered
            .sort((a,b) => sortAsgnScore(b) - sortAsgnScore(a))
            .map(a => renderAsgnCard(a, uid))
            .join('')
      }
    </div>
  `;
}

function renderTabBtn(id, label, count) {
  const active = assignmentState.currentTab === id ? 'active' : '';
  return `<button class="asgn-tab ${active}" onclick="setAsgnTab('${id}')">
    ${label}${count > 0 ? ` <span class="asgn-tab-badge">${count}</span>` : ''}
  </button>`;
}

// Score for sorting: urgent + overdue first
function sortAsgnScore(a) {
  let s = 0;
  if (a.status === 'done' || a.status === 'rejected') return -100;
  const prioScore = { urgent: 40, high: 30, medium: 20, low: 10 };
  s += prioScore[a.priority] || 10;
  if (a.deadline) {
    const diff = Math.ceil((new Date(a.deadline) - new Date()) / 86400000);
    if (diff < 0) s += 50;       // Trễ hạn
    else if (diff === 0) s += 35; // Hôm nay
    else if (diff <= 2) s += 20;
  }
  return s;
}

// ============ RENDER CARD ============
function renderAsgnCard(asgn, currentUid) {
  const assignee = getUserById(asgn.assignedTo);
  const assigner = getUserById(asgn.assignedBy);
  const st       = ASGN_STATUS[asgn.status]  || ASGN_STATUS.pending;
  const pr       = PRIORITIES[asgn.priority] || PRIORITIES.medium;
  const cat      = CATEGORIES[asgn.category] || {};

  const isMyTask    = asgn.assignedTo === currentUid;
  const isMyAssign  = asgn.assignedBy === currentUid;
  const isOverdueAsgn = asgn.deadline && new Date(asgn.deadline) < new Date() && asgn.status !== 'done';

  const dlText = asgn.deadline
    ? `${formatDateRelative(asgn.deadline)}${asgn.dueTime ? ' ' + asgn.dueTime : ''}`
    : '—';

  // Quick action buttons
  let quickActions = '';
  if (isMyTask && asgn.status === 'pending') {
    quickActions = `
      <button class="asgn-act-btn accept" onclick="event.stopPropagation();updateAsgnStatus('${asgn.id}','accepted')" title="Chấp nhận">👍 Nhận việc</button>
      <button class="asgn-act-btn reject" onclick="event.stopPropagation();promptReject('${asgn.id}')" title="Từ chối">✋ Từ chối</button>
    `;
  } else if (isMyTask && asgn.status === 'accepted') {
    quickActions = `<button class="asgn-act-btn start" onclick="event.stopPropagation();updateAsgnStatus('${asgn.id}','in_progress')">⚡ Bắt đầu</button>`;
  } else if (isMyTask && asgn.status === 'in_progress') {
    quickActions = `<button class="asgn-act-btn done" onclick="event.stopPropagation();updateAsgnStatus('${asgn.id}','done')">✅ Hoàn thành</button>`;
  }

  return `
    <div class="asgn-card ${isOverdueAsgn ? 'overdue' : ''} priority-${asgn.priority}" onclick="openAsgnDetail('${asgn.id}')">
      <div class="asgn-card-left">
        <div class="asgn-avatars">
          <div class="avatar-sm" title="Người giao: ${escHtml(assigner.name)}">${assigner.avatar || '??'}</div>
          <div class="asgn-arrow">→</div>
          <div class="avatar-sm asgn-receiver" title="Nhận: ${escHtml(assignee.name)}">${assignee.avatar || '??'}</div>
        </div>
      </div>
      <div class="asgn-card-body">
        <div class="asgn-title">${escHtml(asgn.title)}</div>
        <div class="asgn-meta-row">
          <span class="tag ${cat.cssClass || ''}">${cat.icon || ''} ${cat.name || ''}</span>
          <span class="tag priority-${asgn.priority}">${pr.icon} ${pr.name}</span>
          ${isMyTask ? `<span class="asgn-from-lbl">← <strong>${assigner.name.split(' ').pop()}</strong></span>` : ''}
          ${isMyAssign && !isMyTask ? `<span class="asgn-to-lbl">→ <strong>${assignee.name.split(' ').pop()}</strong></span>` : ''}
        </div>
        ${asgn.desc ? `<div class="asgn-desc">${escHtml(asgn.desc.substring(0,100))}${asgn.desc.length>100?'…':''}</div>` : ''}
        <div class="asgn-footer-row">
          <span class="asgn-deadline ${isOverdueAsgn ? 'deadline-overdue' : ''}">📅 ${dlText}</span>
          <div class="asgn-quick-actions">${quickActions}</div>
        </div>
      </div>
      <div class="asgn-card-right">
        <span class="asgn-status-badge" style="background:${st.bg};color:${st.color};border-color:${st.color}44">
          ${st.icon} ${st.name}
        </span>
      </div>
    </div>
  `;
}

// ============ OPEN DETAIL ============
function openAsgnDetail(id) {
  assignmentState.currentId = id;
  const asgn     = (appState.assignments || []).find(a => a.id === id);
  if (!asgn) return;

  const assignee  = getUserById(asgn.assignedTo);
  const assigner  = getUserById(asgn.assignedBy);
  const st        = ASGN_STATUS[asgn.status] || ASGN_STATUS.pending;
  const pr        = PRIORITIES[asgn.priority] || PRIORITIES.medium;
  const cat       = CATEGORIES[asgn.category] || {};
  const uid       = currentUser?.id;
  const isMyTask  = asgn.assignedTo === uid;
  const isOwner   = asgn.assignedBy === uid || currentUser?.role === 'admin';
  const isOverdueAsgn = asgn.deadline && new Date(asgn.deadline) < new Date() && asgn.status !== 'done';

  // Action buttons
  let actionBtns = '';
  if (isMyTask) {
    if (asgn.status === 'pending')     actionBtns = `
      <button class="btn-primary" onclick="updateAsgnStatus('${id}','accepted')">👍 Nhận việc</button>
      <button class="btn-outline" onclick="promptReject('${id}')">✋ Từ chối</button>`;
    if (asgn.status === 'accepted')    actionBtns = `<button class="btn-primary" onclick="updateAsgnStatus('${id}','in_progress')">⚡ Bắt đầu thực hiện</button>`;
    if (asgn.status === 'in_progress') actionBtns = `<button class="btn-primary" onclick="updateAsgnStatus('${id}','done')">✅ Đánh dấu Hoàn thành</button>`;
  }
  if (isOwner && asgn.status !== 'done') {
    actionBtns += `<button class="btn-outline sm" onclick="editAssignment('${id}')">✏️ Sửa</button>`;
  }
  if (isOwner) {
    actionBtns += `<button class="btn-danger sm" onclick="deleteAssignment('${id}')">🗑️ Xóa</button>`;
  }

  document.getElementById('asgnDetailContent').innerHTML = `
    <div class="asgn-detail-layout">
      <div class="asgn-detail-main">
        <div class="asgn-detail-title">${escHtml(asgn.title)}</div>
        <div class="asgn-detail-tags">
          <span class="tag ${cat.cssClass}">${cat.icon} ${cat.name}</span>
          <span class="tag priority-${asgn.priority}">${pr.icon} ${pr.name}</span>
          <span class="asgn-status-badge" style="background:${st.bg};color:${st.color};">${st.icon} ${st.name}</span>
          ${isOverdueAsgn ? `<span class="tag" style="background:rgba(239,68,68,0.15);color:#FCA5A5;border:1px solid rgba(239,68,68,0.3)">⚠️ Trễ hạn</span>` : ''}
        </div>

        ${asgn.desc ? `<div class="asgn-detail-desc">${escHtml(asgn.desc)}</div>` : '<p style="color:var(--c-text-3);font-style:italic;font-size:13px">Chưa có mô tả.</p>'}

        ${asgn.note ? `<div class="asgn-note-box">📝 <strong>Ghi chú:</strong> ${escHtml(asgn.note)}</div>` : ''}

        <!-- Timeline Actions -->
        <div class="asgn-timeline">
          <h4>📋 Lịch sử trạng thái</h4>
          <div id="asgnTimeline">${renderAsgnTimeline(asgn)}</div>
        </div>

        <!-- Comments -->
        <div class="asgn-comments">
          <h4>💬 Trao đổi</h4>
          <div id="asgnComments">${renderAsgnComments(asgn)}</div>
          <div class="comment-input" style="margin-top:12px">
            <textarea id="asgnNewComment" rows="2" placeholder="Ghi chú tiến độ, hỏi thêm thông tin..."></textarea>
            <button class="btn-primary sm" onclick="addAsgnComment('${id}')">Gửi</button>
          </div>
        </div>
      </div>

      <div class="asgn-detail-sidebar">
        <div class="detail-info-card">
          <div class="info-row">
            <span>Người giao:</span>
            <span><div class="assignee-badge"><div class="avatar-sm">${assigner.avatar}</div><span>${assigner.name}</span></div></span>
          </div>
          <div class="info-row">
            <span>Người nhận:</span>
            <span><div class="assignee-badge"><div class="avatar-sm">${assignee.avatar}</div><span>${assignee.name}</span></div></span>
          </div>
          <div class="info-row">
            <span>Deadline:</span>
            <span class="${isOverdueAsgn ? 'deadline-overdue' : ''}">${asgn.deadline ? formatDate(asgn.deadline) + (asgn.dueTime ? ' ' + asgn.dueTime : '') : '—'}</span>
          </div>
          <div class="info-row">
            <span>Tạo lúc:</span>
            <span>${formatDate(asgn.createdAt)}</span>
          </div>
          ${asgn.completedAt ? `<div class="info-row"><span>Xong lúc:</span><span style="color:#10B981">${formatDate(asgn.completedAt)}</span></div>` : ''}
        </div>

        <!-- Action buttons -->
        <div class="asgn-action-panel">
          ${actionBtns}
        </div>
      </div>
    </div>
  `;

  document.getElementById('asgnDetailModal').classList.remove('hidden');
}

function renderAsgnTimeline(asgn) {
  const steps = [
    { status: 'pending',     label: 'Đã giao việc' },
    { status: 'accepted',    label: 'Đã nhận việc' },
    { status: 'in_progress', label: 'Đang thực hiện' },
    { status: 'done',        label: 'Hoàn thành' },
  ];
  const currentIdx = ['pending','accepted','in_progress','done'].indexOf(asgn.status);
  if (asgn.status === 'rejected') {
    return `<div class="tl-item rejected">❌ Việc bị từ chối ${asgn.note ? '— ' + escHtml(asgn.note) : ''}</div>`;
  }
  return steps.map((s, i) => `
    <div class="tl-item ${i < currentIdx ? 'done' : i === currentIdx ? 'current' : ''}">
      <div class="tl-dot"></div>
      <div class="tl-content">
        <span>${ASGN_STATUS[s.status]?.icon} ${s.label}</span>
      </div>
    </div>
  `).join('');
}

function renderAsgnComments(asgn) {
  const comments = asgn.comments || [];
  if (comments.length === 0) return '<div style="font-size:12px;color:var(--c-text-3);padding:8px 0">Chưa có trao đổi nào.</div>';
  return comments.slice().reverse().map(c => {
    const u = getUserById(c.author);
    return `<div class="comment-item">
      <div class="comment-meta">📝 <strong>${escHtml(u.name)}</strong> · ${formatDate(c.date)}</div>
      <div>${escHtml(c.text)}</div>
    </div>`;
  }).join('');
}

function addAsgnComment(id) {
  const text = document.getElementById('asgnNewComment')?.value.trim();
  if (!text) return;
  const asgn = (appState.assignments || []).find(a => a.id === id);
  if (!asgn) return;
  asgn.comments = asgn.comments || [];
  asgn.comments.push({ author: currentUser.id, text, date: new Date().toISOString().split('T')[0] });
  asgn.updatedAt = new Date().toISOString();
  document.getElementById('asgnNewComment').value = '';
  if (window.fbSaveAssignment) window.fbSaveAssignment(asgn);
  document.getElementById('asgnComments').innerHTML = renderAsgnComments(asgn);
}

// ============ CREATE / EDIT MODAL ============
function openNewAssignmentModal(editId = null) {
  const asgn = editId ? (appState.assignments || []).find(a => a.id === editId) : null;

  // Build assignee options — filter by role
  const myRole = currentUser?.role;
  let targets = TEAM_MEMBERS.filter(m => m.id !== currentUser?.id);
  if (myRole === 'manager') targets = targets.filter(m => m.role === 'staff' || isInMyTeam(m.id));

  document.getElementById('asgnFormTitle').textContent      = asgn ? '✏️ Chỉnh sửa giao việc' : '📌 Giao việc mới';
  document.getElementById('asgnTitle').value                = asgn?.title    || '';
  document.getElementById('asgnDesc').value                 = asgn?.desc     || '';
  document.getElementById('asgnNote').value                 = asgn?.note     || '';
  document.getElementById('asgnDeadline').value             = asgn?.deadline || getFutureDate(1);
  document.getElementById('asgnDueTime').value              = asgn?.dueTime  || '17:00';
  document.getElementById('asgnPriority').value             = asgn?.priority || 'medium';
  document.getElementById('asgnCategory').value             = asgn?.category || 'ops';

  const sel = document.getElementById('asgnAssignee');
  sel.innerHTML = targets.map(m => `<option value="${m.id}" ${asgn?.assignedTo === m.id ? 'selected' : ''}>${m.name}</option>`).join('');

  const modal = document.getElementById('asgnModal');
  modal.dataset.editId = editId || '';
  modal.classList.remove('hidden');
}

function editAssignment(id) {
  closeModal('asgnDetailModal');
  openNewAssignmentModal(id);
}

function saveAssignment() {
  const title = document.getElementById('asgnTitle').value.trim();
  if (!title) { showToast('⚠️ Vui lòng nhập tiêu đề!', 'error'); return; }

  const assigneeId = document.getElementById('asgnAssignee').value;
  if (!assigneeId) { showToast('⚠️ Vui lòng chọn người nhận!', 'error'); return; }

  const modal  = document.getElementById('asgnModal');
  const editId = modal.dataset.editId;

  if (editId) {
    // Update
    const asgn = (appState.assignments || []).find(a => a.id === editId);
    if (!asgn) return;
    asgn.title    = title;
    asgn.desc     = document.getElementById('asgnDesc').value.trim();
    asgn.note     = document.getElementById('asgnNote').value.trim();
    asgn.deadline = document.getElementById('asgnDeadline').value;
    asgn.dueTime  = document.getElementById('asgnDueTime').value;
    asgn.priority = document.getElementById('asgnPriority').value;
    asgn.category = document.getElementById('asgnCategory').value;
    asgn.assignedTo = assigneeId;
    asgn.updatedAt  = new Date().toISOString();
    if (window.fbSaveAssignment) window.fbSaveAssignment(asgn);
    showToast(`✅ Đã cập nhật giao việc!`, 'success');
  } else {
    // Create
    const newAsgn = {
      id:         generateId('asgn'),
      title,
      desc:       document.getElementById('asgnDesc').value.trim(),
      note:       document.getElementById('asgnNote').value.trim(),
      assignedTo: assigneeId,
      assignedBy: currentUser.id,
      priority:   document.getElementById('asgnPriority').value,
      category:   document.getElementById('asgnCategory').value,
      deadline:   document.getElementById('asgnDeadline').value,
      dueTime:    document.getElementById('asgnDueTime').value,
      status:     'pending',
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
      completedAt: null,
      comments:   [{ author: currentUser.id, text: 'Việc được giao mới.', date: new Date().toISOString().split('T')[0] }],
    };
    appState.assignments = appState.assignments || [];
    appState.assignments.push(newAsgn);
    if (window.fbSaveAssignment) window.fbSaveAssignment(newAsgn);
    showToast(`🎉 Đã giao việc "${title}" thành công!`, 'success');
  }

  closeModal('asgnModal');
  renderAssignments();
  updateAsgnBadge();
}

// ============ STATUS ACTIONS ============
function updateAsgnStatus(id, newStatus) {
  const asgn = (appState.assignments || []).find(a => a.id === id);
  if (!asgn) return;

  const old = asgn.status;
  asgn.status    = newStatus;
  asgn.updatedAt = new Date().toISOString();
  if (newStatus === 'done') asgn.completedAt = new Date().toISOString();

  const st = ASGN_STATUS[newStatus];
  asgn.comments = asgn.comments || [];
  asgn.comments.push({
    author: currentUser.id,
    text: `Cập nhật trạng thái: "${ASGN_STATUS[old]?.name}" → "${st?.name}"`,
    date: new Date().toISOString().split('T')[0],
  });

  if (window.fbSaveAssignment) window.fbSaveAssignment(asgn);
  showToast(`${st?.icon} ${st?.name}`, 'success');
  closeModal('asgnDetailModal');
  renderAssignments();
  updateAsgnBadge();
}

function promptReject(id) {
  const reason = prompt('📝 Lý do từ chối (có thể bỏ qua):');
  if (reason === null) return; // ESC / Cancel
  const asgn = (appState.assignments || []).find(a => a.id === id);
  if (!asgn) return;
  asgn.status    = 'rejected';
  asgn.note      = reason.trim() || 'Không có lý do';
  asgn.updatedAt = new Date().toISOString();
  asgn.comments  = asgn.comments || [];
  asgn.comments.push({ author: currentUser.id, text: `❌ Từ chối: ${asgn.note}`, date: new Date().toISOString().split('T')[0] });
  if (window.fbSaveAssignment) window.fbSaveAssignment(asgn);
  showToast('❌ Đã từ chối giao việc', 'info');
  closeModal('asgnDetailModal');
  renderAssignments();
  updateAsgnBadge();
}

function deleteAssignment(id) {
  if (!confirm('Xóa giao việc này?')) return;
  appState.assignments = (appState.assignments || []).filter(a => a.id !== id);
  if (window.fbDeleteAssignment) window.fbDeleteAssignment(id);
  closeModal('asgnDetailModal');
  renderAssignments();
  updateAsgnBadge();
  showToast('🗑️ Đã xóa giao việc', 'info');
}

// ============ FILTERS / TABS ============
function setAsgnTab(tab) {
  assignmentState.currentTab = tab;
  renderAssignments();
}

function setAsgnFilter(key, val) {
  assignmentState.currentFilter[key] = val;
  renderAssignments();
}

// ============ BADGE ============
function updateAsgnBadge() {
  const el = document.getElementById('badge-assignments');
  if (!el) return;
  const uid = currentUser?.id;
  const pending = (appState.assignments || []).filter(a => a.assignedTo === uid && a.status === 'pending').length;
  el.textContent = pending || '';
  el.className   = 'nav-badge' + (pending > 0 ? ' urgent' : '');
}

// ============ HELPERS ============
function isInMyTeam(userId) {
  if (!currentUser) return false;
  const myDept = currentUser.department || '';
  const m = TEAM_MEMBERS.find(m => m.id === userId);
  if (!m) return false;
  return m.department?.includes(myDept.split(' ')[0]);
}
