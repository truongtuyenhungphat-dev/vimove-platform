/* ================================================
   VIWORK — Workflow Module
   Kanban Board, List View, Timeline View
   Task CRUD operations
   ================================================ */

let currentView = 'kanban';
let currentTaskId = null;
let draggedTaskId = null;

// ============ RENDER WORKFLOW ============
function renderWorkflow() {
  const tasks = getFilteredTasks();
  if (currentView === 'kanban') renderKanban(tasks);
  else if (currentView === 'list') renderList(tasks);
  else if (currentView === 'timeline') renderTimeline(tasks);
  updateBadges();
}

/* ---- KANBAN VIEW ---- */
function renderKanban(tasks) {
  const board = document.getElementById('kanbanView');
  board.innerHTML = '';

  STAGES.forEach(stage => {
    const stageTasks = tasks.filter(t => t.stage === stage.id);
    const col = document.createElement('div');
    col.className = 'kanban-column';
    col.dataset.stage = stage.id;

    col.innerHTML = `
      <div class="kanban-col-header">
        <div class="col-stage-dot" style="background:${stage.color}"></div>
        <span class="col-title">${stage.icon} ${stage.name}</span>
        <span class="col-count">${stageTasks.length}</span>
        ${canEdit() ? `<button class="col-add-btn" onclick="openNewTaskInStage('${stage.id}')" title="Thêm CVC vào giai đoạn này">+</button>` : ''}
      </div>
      <div class="kanban-cards" id="col-${stage.id}" 
           ondragover="onDragOver(event,'${stage.id}')" 
           ondrop="onDrop(event,'${stage.id}')"
           ondragleave="onDragLeave(event)">
        ${stageTasks.length === 0
          ? `<div class="col-empty">Không có CVC nào</div>`
          : stageTasks.map(t => renderTaskCard(t)).join('')
        }
      </div>
    `;
    board.appendChild(col);
  });
}

function renderTaskCard(task) {
  const user     = getUserById(task.assigneeId);
  const cat      = CATEGORIES[task.category] || {};
  const isOD     = isOverdue(task);
  const dlClass  = getDeadlineClass(task.deadline, task.stage);
  const channels = (task.channels || []).map(ch => `<div class="tc-channel-dot ${CHANNELS[ch]?.cssClass || ''}" title="${CHANNELS[ch]?.name}"></div>`).join('');

  return `
    <div class="task-card priority-${task.priority} ${isOD ? 'overdue' : ''}"
         draggable="true"
         data-id="${task.id}"
         ondragstart="onDragStart(event,'${task.id}')"
         ondragend="onDragEnd(event)"
         onclick="openTaskDetail('${task.id}')"
    >
      <div class="tc-header">
        <div class="tc-title">${escHtml(task.title)}</div>
        <div class="tc-priority">${PRIORITIES[task.priority]?.icon}</div>
      </div>
      ${task.desc ? `<div class="tc-desc">${escHtml(task.desc)}</div>` : ''}
      <div class="tc-tags">
        <span class="tc-tag tag ${cat.cssClass || ''}">${cat.icon || ''} ${cat.name || ''}</span>
        ${task.value ? `<span class="tc-value">💰 ${formatCurrency(task.value)}</span>` : ''}
      </div>
      <!-- Sprint 1: Checklist mini progress -->
      ${renderChecklistMini(task)}
      <!-- Sprint 1: SLA bar -->
      ${renderSLABar(task)}
      <div class="tc-footer">
        <div class="tc-assignee">
          <div class="avatar-sm">${user.avatar || '??'}</div>
          <span>${user.name.split(' ').pop()}</span>
        </div>
        ${task.deadline ? `<div class="tc-deadline ${dlClass}">📅 ${formatDateRelative(task.deadline)}</div>` : ''}
        <div class="tc-channels">${channels}</div>
      </div>
    </div>
  `;
}

/* ---- LIST VIEW ---- */
function renderList(tasks) {
  const tbody = document.getElementById('listViewBody');
  if (tasks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">📭</div><p>Không có CVC nào.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = tasks.map(t => {
    const user  = getUserById(t.assigneeId);
    const stage = getStageById(t.stage);
    const cat   = CATEGORIES[t.category] || {};
    const isOD  = isOverdue(t);
    return `
      <tr onclick="openTaskDetail('${t.id}')">
        <td class="task-title">
          <span class="task-title-text" title="${escHtml(t.title)}">${escHtml(t.title)}</span>
        </td>
        <td><span class="tag ${cat.cssClass}">${cat.icon} ${cat.name}</span></td>
        <td>
          <div class="assignee-badge">
            <div class="avatar-sm">${user.avatar}</div>
            <span>${user.name}</span>
          </div>
        </td>
        <td><span class="stage-badge" style="background:${stage.color}22;color:${stage.color};border-color:${stage.color}44">${stage.icon} ${stage.name}</span></td>
        <td class="${isOD ? 'deadline-overdue' : getDeadlineClass(t.deadline, t.stage)}">${formatDateRelative(t.deadline)}</td>
        <td><span class="tag priority-${t.priority}">${PRIORITIES[t.priority]?.icon} ${PRIORITIES[t.priority]?.name}</span></td>
        <td>
          <button class="btn-outline sm" onclick="event.stopPropagation();openTaskDetail('${t.id}')">Xem</button>
          ${canEdit() ? `<button class="btn-danger sm" onclick="event.stopPropagation();deleteTask('${t.id}')">Xóa</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

/* ---- TIMELINE VIEW ---- */
function renderTimeline(tasks) {
  const header = document.getElementById('timelineHeader');
  const rows   = document.getElementById('timelineRows');

  // Generate 30 days starting from 7 days ago
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const days = Array.from({length: 30}, (_,i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date(); today.setHours(0,0,0,0);
  const todayIdx = days.findIndex(d => { const dd = new Date(d); dd.setHours(0,0,0,0); return dd.getTime()===today.getTime(); });

  // Header
  header.innerHTML = `
    <div class="tl-task-col">CVC</div>
    ${days.map((d,i) => `
      <div class="tl-day ${i===todayIdx?'today-col':''}"
           style="${i===todayIdx?'background:rgba(90,184,0,0.08);border-bottom:2px solid #5AB800;':''}">
        <div style="${i===todayIdx?'color:#5AB800;font-weight:700;':''}">${
          i===todayIdx ? '📍' : d.getDate()
        }</div>
        <div>${['CN','T2','T3','T4','T5','T6','T7'][d.getDay()]}</div>
      </div>
    `).join('')}
  `;

  // Rows
  rows.innerHTML = tasks.map(t => {
    if (!t.deadline && !t.createDate) return '';
    const start = new Date(t.createDate || t.deadline);
    const end   = new Date(t.deadline || t.createDate);

    const startIdx = Math.max(0, Math.ceil((start - startDate) / 86400000));
    const endIdx   = Math.min(29, Math.ceil((end - startDate) / 86400000));
    const width    = Math.max(endIdx - startIdx + 1, 1);
    const left     = (startIdx / 30) * 100;
    const pctWidth = (width / 30) * 100;

    const cat = CATEGORIES[t.category] || {};

    return `
      <div class="tl-row">
        <div class="tl-task-label" title="${escHtml(t.title)}">${escHtml(t.title)}</div>
        <div class="tl-grid">
          ${days.map((_,i) => `<div class="tl-cell ${i===todayIdx?'today-col':''}"></div>`).join('')}
          <div class="tl-bar cat-${t.category}" 
               style="left:${left}%;width:${pctWidth}%"
               onclick="openTaskDetail('${t.id}')"
               title="${escHtml(t.title)}">
            <span class="tl-bar-text">${escHtml(t.title)}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ============ FILTER / VIEW ============
function getFilteredTasks() {
  let tasks = [...appState.tasks];
  const filter = document.getElementById('wfFilter')?.value || 'all';
  const category = document.getElementById('wfCategory')?.value || 'all';
  const search = (document.getElementById('globalSearch')?.value || '').toLowerCase();

  if (filter === 'mine') tasks = tasks.filter(t => t.assigneeId === currentUser?.id);
  else if (filter === 'overdue') tasks = tasks.filter(t => isOverdue(t));
  else if (filter === 'urgent') tasks = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');

  if (category !== 'all') tasks = tasks.filter(t => t.category === category);

  if (search) tasks = tasks.filter(t =>
    t.title.toLowerCase().includes(search) ||
    (t.desc||'').toLowerCase().includes(search)
  );

  return tasks;
}

function filterWorkflow() { renderWorkflow(); }

function setView(view) {
  currentView = view;
  ['kanban','list','timeline'].forEach(v => {
    document.getElementById(v+'View')?.classList.add('hidden');
    document.getElementById('vBtn-'+v)?.classList.remove('active');
  });
  document.getElementById(view+'View')?.classList.remove('hidden');
  document.getElementById('vBtn-'+view)?.classList.add('active');
  renderWorkflow();
}

// ============ DRAG & DROP ============
function onDragStart(e, taskId) {
  if (!canEdit()) { e.preventDefault(); return; }
  draggedTaskId = taskId;
  e.dataTransfer.effectAllowed = 'move';
  setTimeout(() => { e.target.classList.add('dragging'); }, 0);
}

function onDragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.kanban-column').forEach(c => c.classList.remove('drag-over'));
  draggedTaskId = null;
}

function onDragOver(e, stageId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = document.querySelector(`[data-stage="${stageId}"]`);
  if (col) col.classList.add('drag-over');
}

function onDragLeave(e) {
  const col = e.currentTarget.closest('.kanban-column');
  if (col) col.classList.remove('drag-over');
}

function onDrop(e, stageId) {
  e.preventDefault();
  if (!draggedTaskId) return;
  const task = appState.tasks.find(t => t.id === draggedTaskId);
  if (!task) return;
  const oldStage = task.stage;
  task.stage = stageId;
  task.comments = task.comments || [];
  task.comments.push({
    author: currentUser.id,
    text: `Chuyển từ giai đoạn "${getStageById(oldStage).name}" → "${getStageById(stageId).name}"`,
    date: new Date().toISOString().split('T')[0]
  });
  if (window.fbSaveTask) window.fbSaveTask(task);
  saveData();
  renderWorkflow();
  renderDashboard();
  showToast(`✅ Đã chuyển sang "${getStageById(stageId).name}"`, 'success');
}

// ============ TASK DETAIL ============
function openTaskDetail(taskId) {
  currentTaskId = taskId;
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  const user  = getUserById(task.assigneeId);
  const stage = getStageById(task.stage);
  const cat   = CATEGORIES[task.category] || {};
  const isOD  = isOverdue(task);

  document.getElementById('detailTaskTitle').textContent = task.title;
  document.getElementById('detailDesc').innerHTML = task.desc || '<em style="color:var(--c-text-3)">Chưa có mô tả</em>';

  // Meta tags
  document.getElementById('detailMeta').innerHTML = `
    <span class="tag ${cat.cssClass}">${cat.icon} ${cat.name}</span>
    <span class="tag priority-${task.priority}">${PRIORITIES[task.priority]?.icon} ${PRIORITIES[task.priority]?.name}</span>
    ${isOD ? '<span class="tag" style="background:rgba(239,68,68,0.15);color:#FCA5A5;border:1px solid rgba(239,68,68,0.3)">⚠️ Trễ hạn</span>' : ''}
  `;

  // Sidebar info
  document.getElementById('detailStage').textContent     = `${stage.icon} ${stage.name}`;
  document.getElementById('detailPriority').innerHTML    = `${PRIORITIES[task.priority]?.icon} ${PRIORITIES[task.priority]?.name}`;
  document.getElementById('detailAssignee').innerHTML    = `<div class="assignee-badge"><div class="avatar-sm">${user.avatar}</div><span>${user.name}</span></div>`;
  document.getElementById('detailDeadline').innerHTML    = task.deadline ? `<span class="${getDeadlineClass(task.deadline, task.stage)}">${formatDate(task.deadline)} (${formatDateRelative(task.deadline)})</span>` : '—';
  document.getElementById('detailValue').textContent     = formatCurrency(task.value) || '—';
  document.getElementById('detailChannels').innerHTML    = task.channels?.length ? task.channels.map(ch => `<span class="tc-channel-dot ${CHANNELS[ch]?.cssClass}"></span> ${CHANNELS[ch]?.name}`).join(', ') : '—';

  // Stage progress
  const stageEl = document.getElementById('stageProgress');
  stageEl.innerHTML = '';
  STAGES.forEach((s, i) => {
    const isDone    = STAGES.findIndex(ss => ss.id === task.stage) > i;
    const isCurrent = s.id === task.stage;
    const dot = document.createElement('div');
    dot.className = 'stage-step';
    dot.innerHTML = `
      ${i > 0 ? `<div class="stage-line ${isDone||isCurrent?'done':''}"></div>` : ''}
      <div class="stage-dot ${isDone?'done':''} ${isCurrent?'current':''}">
        ${isDone ? '✓' : i + 1}
        <span class="stage-name">${s.name}</span>
      </div>
    `;
    stageEl.appendChild(dot);
  });

  // Stage actions
  const actionsEl = document.getElementById('stageActions');
  if (canEdit()) {
    const stageIdx = STAGES.findIndex(s => s.id === task.stage);
    let html = '';
    if (stageIdx < STAGES.length - 1) {
      const next = STAGES[stageIdx + 1];
      html += `<button class="stage-action-btn" onclick="moveStage('${task.id}','${next.id}')">→ Chuyển sang: ${next.icon} ${next.name}</button>`;
    }
    if (stageIdx > 0) {
      const prev = STAGES[stageIdx - 1];
      html += `<button class="stage-action-btn danger" onclick="moveStage('${task.id}','${prev.id}')">← Quay lại: ${prev.icon} ${prev.name}</button>`;
    }
    if (task.stage !== 'blocked') {
      html += `<button class="stage-action-btn danger" onclick="moveStage('${task.id}','blocked')">🔴 Đánh dấu bị chặn</button>`;
    }
    actionsEl.querySelector('h4').insertAdjacentHTML('afterend', html.replace(/(<button)/g, '<br/>$1').replace('<br/>',''));
    actionsEl.innerHTML = `<h4>Chuyển giai đoạn</h4>${html}`;
  } else {
    actionsEl.innerHTML = '<h4>Chuyển giai đoạn</h4><p style="font-size:12px;color:var(--c-text-3)">Bạn không có quyền thay đổi.</p>';
  }

  // SPRINT 1: Render Checklist & Sub-tasks in detail modal
  const clEl = document.getElementById('detailChecklist');
  if (clEl) clEl.innerHTML = renderChecklist(task);
  const stEl = document.getElementById('detailSubtasks');
  if (stEl) stEl.innerHTML = renderSubtasks(task);

  // SPRINT 1: Render SLA detail
  const slaEl = document.getElementById('detailSLA');
  if (slaEl) slaEl.innerHTML = renderSLADetail(task);

  // Comments
  renderComments(task);

  document.getElementById('taskDetailModal').classList.remove('hidden');
}

function moveStage(taskId, stageId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;
  const old = getStageById(task.stage).name;
  // SPRINT 1: Record stage entry time for SLA
  recordStageEntry(task, stageId);
  task.stage = stageId;
  task.comments = task.comments || [];
  task.comments.push({
    author: currentUser.id,
    text: `Chuyển giai đoạn: "${old}" → "${getStageById(stageId).name}"`,
    date: new Date().toISOString().split('T')[0]
  });
  if (window.fbSaveTask) window.fbSaveTask(task);
  saveData();
  openTaskDetail(taskId); // refresh
  renderWorkflow();
  renderDashboard();
  showToast(`✅ Chuyển sang "${getStageById(stageId).name}"`, 'success');
}

function renderComments(task) {
  const list = document.getElementById('commentsList');
  const comments = task.comments || [];
  if (comments.length === 0) {
    list.innerHTML = '<div style="font-size:12px;color:var(--c-text-3);text-align:center;padding:12px;">Chưa có hoạt động nào.</div>';
    return;
  }
  list.innerHTML = comments.map(c => {
    const u = getUserById(c.author);
    return `
      <div class="comment-item">
        <div class="comment-meta">📝 <strong>${u.name}</strong> · ${formatDate(c.date)}</div>
        <div>${escHtml(c.text)}</div>
      </div>
    `;
  }).reverse().join('');
}

function addComment() {
  const text = document.getElementById('newComment').value.trim();
  if (!text || !currentTaskId) return;
  const task = appState.tasks.find(t => t.id === currentTaskId);
  if (!task) return;
  task.comments = task.comments || [];
  task.comments.push({
    author: currentUser.id,
    text,
    date: new Date().toISOString().split('T')[0]
  });
  document.getElementById('newComment').value = '';
  if (window.fbSaveTask) window.fbSaveTask(task);
  saveData();
  renderComments(task);
}

// ============ CREATE TASK ============
function openNewTaskModal() {
  // Populate assignee dropdown
  const sel = document.getElementById('taskAssignee');
  sel.innerHTML = TEAM_MEMBERS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
  // Set default deadline to 7 days from now
  document.getElementById('taskDeadline').value = getFutureDate(7);
  document.getElementById('newTaskModal').classList.remove('hidden');
}

function openNewTaskInStage(stageId) {
  openNewTaskModal();
  // Store target stage
  document.getElementById('newTaskModal').dataset.targetStage = stageId;
}

function saveNewTask() {
  const title   = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('⚠️ Vui lòng nhập tên CVC!', 'error'); return; }

  const channels = [...document.querySelectorAll('.channel-tags input:checked')].map(i => i.value);
  const targetStage = document.getElementById('newTaskModal').dataset.targetStage || 'idea';

  const task = {
    id:             generateId('t'),
    title,
    desc:           document.getElementById('taskDesc').value.trim(),
    category:       document.getElementById('taskCategory').value,
    priority:       document.getElementById('taskPriority').value,
    assigneeId:     document.getElementById('taskAssignee').value,
    deadline:       document.getElementById('taskDeadline').value,
    value:          parseFloat(document.getElementById('taskValue').value) || 0,
    channels,
    stage:          targetStage,
    createDate:     new Date().toISOString().split('T')[0],
    stageEnteredAt: new Date().toISOString(),
    checklist:      [],
    subtasks:       [],
    comments:       [{ author: currentUser.id, text: 'CVC được tạo mới.', date: new Date().toISOString().split('T')[0] }]
  };

  appState.tasks.push(task);
  if (window.fbSaveTask) window.fbSaveTask(task);
  saveData();

  // Reset form
  ['taskTitle','taskDesc','taskValue'].forEach(id => document.getElementById(id).value = '');
  document.querySelectorAll('.channel-tags input').forEach(i => i.checked = false);
  delete document.getElementById('newTaskModal').dataset.targetStage;

  closeModal('newTaskModal');
  renderWorkflow();
  renderDashboard();
  renderMyTasks();
  showToast(`🎉 CVC "${title}" đã được tạo!`, 'success');
}

function deleteTask(taskId) {
  if (!isAdmin()) { showToast('❌ Chỉ Admin mới có thể xóa!', 'error'); return; }
  if (!confirm('Xóa CVC này?')) return;
  appState.tasks = appState.tasks.filter(t => t.id !== taskId);
  if (window.fbDeleteTask) window.fbDeleteTask(taskId);
  saveData();
  closeModal('taskDetailModal');
  renderWorkflow();
  renderDashboard();
  showToast('🗑️ Đã xóa CVC', 'info');
}

function editTask(taskId) {
  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  // Populate assignee dropdown first
  const sel = document.getElementById('taskAssignee');
  sel.innerHTML = TEAM_MEMBERS.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  // Pre-fill all fields with current task data
  document.getElementById('taskTitle').value    = task.title;
  document.getElementById('taskDesc').value     = task.desc || '';
  document.getElementById('taskCategory').value = task.category;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskAssignee').value = task.assigneeId;
  document.getElementById('taskDeadline').value = task.deadline || '';
  document.getElementById('taskValue').value    = task.value || '';

  // Set channel checkboxes
  document.querySelectorAll('.channel-tags input').forEach(cb => {
    cb.checked = (task.channels || []).includes(cb.value);
  });

  // Switch modal into edit mode
  const modal = document.getElementById('newTaskModal');
  modal.dataset.editId = taskId;
  modal.querySelector('h2').textContent = '✏️ Chỉnh sửa CVC';
  const saveBtn = modal.querySelector('.modal-footer .btn-primary');
  saveBtn.textContent = 'Lưu thay đổi';
  saveBtn.setAttribute('onclick', `saveEditTask('${taskId}')`);

  closeModal('taskDetailModal');
  modal.classList.remove('hidden');
}

function saveEditTask(taskId) {
  const title = document.getElementById('taskTitle').value.trim();
  if (!title) { showToast('⚠️ Vui lòng nhập tên CVC!', 'error'); return; }

  const task = appState.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.title      = title;
  task.desc       = document.getElementById('taskDesc').value.trim();
  task.category   = document.getElementById('taskCategory').value;
  task.priority   = document.getElementById('taskPriority').value;
  task.assigneeId = document.getElementById('taskAssignee').value;
  task.deadline   = document.getElementById('taskDeadline').value;
  task.value      = parseFloat(document.getElementById('taskValue').value) || 0;
  task.channels   = [...document.querySelectorAll('.channel-tags input:checked')].map(i => i.value);
  task.updatedAt  = new Date().toISOString();
  task.comments   = task.comments || [];
  task.comments.push({
    author: currentUser.id,
    text: `✏️ CVC được cập nhật bởi ${currentUser.name}.`,
    date: new Date().toISOString().split('T')[0]
  });

  if (window.fbSaveTask) window.fbSaveTask(task);
  saveData();

  // Reset modal back to create mode
  const modal = document.getElementById('newTaskModal');
  delete modal.dataset.editId;
  modal.querySelector('h2').textContent = '➕ Tạo Luồng Công Việc Chính (CVC) Mới';
  const saveBtn = modal.querySelector('.modal-footer .btn-primary');
  saveBtn.textContent = 'Tạo CVC';
  saveBtn.setAttribute('onclick', 'saveNewTask()');

  closeModal('newTaskModal');
  renderWorkflow();
  renderDashboard();
  showToast(`✅ Đã cập nhật CVC "${task.title}"!`, 'success');
}

// ============ MY TASKS ============
function renderMyTasks() {
  if (!currentUser) return;
  const myTasks = appState.tasks.filter(t => t.assigneeId === currentUser.id && t.stage !== 'done');
  const today = new Date(); today.setHours(0,0,0,0);

  const urgent   = myTasks.filter(t => t.priority === 'urgent' || isOverdue(t));
  const todayArr = myTasks.filter(t => {
    if (!t.deadline) return false;
    const dl = new Date(t.deadline); dl.setHours(0,0,0,0);
    return dl.getTime() === today.getTime() && !isOverdue(t);
  });
  const upcoming = myTasks.filter(t => !urgent.includes(t) && !todayArr.includes(t));

  document.getElementById('cnt-urgent').textContent   = urgent.length;
  document.getElementById('cnt-today').textContent    = todayArr.length;
  document.getElementById('cnt-upcoming').textContent = upcoming.length;

  const renderCard = t => `
    <div class="my-task-card" onclick="openTaskDetail('${t.id}')">
      <div class="task-name">${escHtml(t.title)}</div>
      <div class="task-meta">
        <span class="tag ${CATEGORIES[t.category]?.cssClass}">${CATEGORIES[t.category]?.icon} ${CATEGORIES[t.category]?.name}</span>
        <span class="${getDeadlineClass(t.deadline, t.stage)}">📅 ${formatDateRelative(t.deadline)}</span>
      </div>
    </div>
  `;

  document.getElementById('my-urgent').innerHTML   = urgent.length   ? urgent.map(renderCard).join('')   : '<div class="col-empty">Không có việc khẩn cấp</div>';
  document.getElementById('my-today').innerHTML    = todayArr.length  ? todayArr.map(renderCard).join('')  : '<div class="col-empty">Không có việc hôm nay</div>';
  document.getElementById('my-upcoming').innerHTML = upcoming.length ? upcoming.map(renderCard).join('') : '<div class="col-empty">Không có việc sắp tới</div>';

  // Update badge
  document.getElementById('badge-mine').textContent = urgent.length || '';
}

// ============ BADGES ============
function updateBadges() {
  const total = appState.tasks.filter(t => t.stage !== 'done').length;
  const urgent = appState.tasks.filter(t => isOverdue(t) || t.priority === 'urgent').length;
  const mine = appState.tasks.filter(t => t.assigneeId === currentUser?.id && t.stage !== 'done' && (isOverdue(t) || t.priority === 'urgent')).length;

  document.getElementById('badge-tasks').textContent = total || '';
  document.getElementById('badge-alert').textContent = urgent || '';
  document.getElementById('badge-mine').textContent  = mine || '';
}

// ============ SEARCH ============
function handleSearch(val) {
  if (document.getElementById('page-workflow')?.classList.contains('active')) {
    renderWorkflow();
  }
}

// ============ HELPER ============
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
